"""Challenger routes."""
from fastapi import APIRouter, HTTPException, Request
import uuid
import json
import re
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

from config import db, EMERGENT_LLM_KEY, logger
from services import get_current_user, clean_ai_text
from services_actions import record_user_action
from data import LEADERSHIP_CHALLENGERS
from services_ai_errors import ai_http_error

router = APIRouter(prefix="/api", tags=["challengers"])


@router.get("/challengers")
async def get_challengers():
    return LEADERSHIP_CHALLENGERS


@router.post("/challengers/{challenger_id}/start")
async def start_challenge(challenger_id: str, request: Request):
    user = await get_current_user(request)
    challenger = next((c for c in LEADERSHIP_CHALLENGERS if c["challenger_id"] == challenger_id), None)
    if not challenger:
        raise HTTPException(status_code=404, detail="Challenger not found")
    challenge_id = f"chal_{uuid.uuid4().hex[:12]}"
    doc = {
        "challenge_id": challenge_id, "user_id": user["user_id"], "challenger_id": challenger_id,
        "messages": [], "status": "active", "result": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.challenges.insert_one(doc)

    # Iter 92.48 (Mert · GODMODE): Use STATIC canonical intro instead of firing
    # a GPT-5.2 call. Saves 3-5s of latency + is voice-cache-hittable so the
    # ElevenLabs TTS plays in <200ms on the first click. Mert: "vorab catchen
    # ist ja sowieso immer der selbe start". If a challenger has no static
    # intro (safety net), fall back to LLM-generated intro.
    static_intro = challenger.get("initial_message")
    if static_intro:
        clean_intro = clean_ai_text(static_intro)
        await db.challenges.update_one(
            {"challenge_id": challenge_id},
            {"$push": {"messages": {"role": "assistant", "content": clean_intro, "timestamp": datetime.now(timezone.utc).isoformat()}}},
        )
        return {"challenge_id": challenge_id, "challenger": challenger, "initial_message": clean_intro}

    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"chal_{challenge_id}", system_message=challenger["test_prompt"])
        chat.with_model("openai", "gpt-5.2")
        ai_response = await chat.send_message(UserMessage(text="Start the interview. Introduce yourself briefly and ask the first question."))
        await db.challenges.update_one(
            {"challenge_id": challenge_id},
            {"$push": {"messages": {"role": "assistant", "content": ai_response, "timestamp": datetime.now(timezone.utc).isoformat()}}},
        )
        return {"challenge_id": challenge_id, "challenger": challenger, "initial_message": clean_ai_text(ai_response)}
    except Exception as e:
        logger.error(f"Challenge start error: {e}")
        raise await ai_http_error(e, "challengers")


@router.get("/challengers/intros")
async def get_challenger_intros(request: Request):
    """Iter 92.48 (Mert · GODMODE): Return each challenger's canonical intro
    message + persona key so the frontend can pre-warm the ElevenLabs TTS
    cache BEFORE the user clicks a card. Result: voice plays instantly.

    Auth-required so we don't leak the app's coaching corpus to scrapers.
    """
    await get_current_user(request)
    return [
        {
            "challenger_id": c["challenger_id"],
            "name": c["name"],
            "avatar": c.get("avatar"),
            "initial_message": c.get("initial_message") or "",
        }
        for c in LEADERSHIP_CHALLENGERS
        if c.get("initial_message")
    ]


def _parse_challenge_result(ai_response: str) -> dict | None:
    """Extract challenge result JSON from AI response."""
    if '"hired"' not in ai_response:
        return None
    try:
        from services_ai_parse import parse_ai_json
        # Try strict parse first (covers fenced/prose-wrapped)
        parsed = parse_ai_json(ai_response)
        if isinstance(parsed, dict) and "hired" in parsed:
            return parsed
        # Legacy fallback: regex extract single-line JSON containing "hired"
        json_match = re.search(r'\{[^{}]*"hired"[^{}]*\}', ai_response)
        if json_match:
            from services_text_clean import deep_unescape
            return deep_unescape(json.loads(json_match.group()))
    except (json.JSONDecodeError, Exception):
        pass
    return None


NO_SELF_END_INSTRUCTION = (
    "\n\nWICHTIG -- GESPRÄCHSMODUS: Dies ist ein fortlaufendes Live-Interview. Beende das Interview NIEMALS von selbst "
    "und gib NIEMALS ein Ergebnis-JSON, eine Bewertung oder ein 'hired'-Urteil aus. Bleib in deiner Rolle, reagiere auf "
    "die Antwort des Kandidaten, stelle kritische Nachfragen und fordere ihn heraus. NUR der Kandidat entscheidet, "
    "wann das Interview endet."
)

FINISH_INSTRUCTION = (
    "Der Kandidat hat das Interview jetzt beendet. Verlasse deine Rolle und erstelle eine DETAILLIERTE Auswertung des "
    "gesamten Gesprächs als reines JSON ohne Codefences:\n"
    '{"hired": true/false, "score": 0-100, '
    '"feedback": "4-6 Sätze persönliches Gesamtfeedback in deiner Stimme als Interviewer, mit Bezug auf konkrete Aussagen", '
    '"strengths": ["5 konkrete Stärken, jeweils mit Zitat/Bezug aus dem Gespräch"], '
    '"improvements": ["5 konkrete Verbesserungen, jeweils mit 1 sofort umsetzbaren Übung"], '
    '"detailed_analysis": {"kommunikation": "2-3 Sätze Detailanalyse", "fuehrung": "2-3 Sätze", "strategie": "2-3 Sätze", "authentizitaet": "2-3 Sätze"}, '
    '"next_steps": ["3 konkrete nächste Schritte für die nächsten 7 Tage"]}\n'
    "Bewerte streng aber fair. Deutsche Sprache."
)


@router.post("/challengers/{challenger_id}/message")
async def challenge_message(challenger_id: str, request: Request):
    from routes.credits import check_and_deduct_credit
    body = await request.json()
    message = body.get("message", "")
    challenge_id = body.get("challenge_id", "")
    finish = bool(body.get("finish"))
    user = await get_current_user(request)

    credit_result = await check_and_deduct_credit(user, "roleplay")
    if not credit_result["allowed"]:
        raise HTTPException(status_code=402, detail="no_credits")

    challenger = next((c for c in LEADERSHIP_CHALLENGERS if c["challenger_id"] == challenger_id), None)
    if not challenger:
        raise HTTPException(status_code=404, detail="Challenger not found")
    chal = await db.challenges.find_one({"challenge_id": challenge_id, "user_id": user["user_id"]}, {"_id": 0})
    if not chal:
        raise HTTPException(status_code=404, detail="Challenge session not found")

    if message:
        await db.challenges.update_one(
            {"challenge_id": challenge_id},
            {"$push": {"messages": {"role": "user", "content": message, "timestamp": datetime.now(timezone.utc).isoformat()}}},
        )
    try:
        # During turns: hard-block self-termination. On finish: allow the verdict JSON.
        system_message = challenger["test_prompt"] + ("" if finish else NO_SELF_END_INSTRUCTION)
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"chal_{challenge_id}", system_message=system_message)
        chat.with_model("openai", "gpt-5.2")
        msgs = chal.get("messages", [])
        context = "\n".join(f"{'Interviewer' if m['role'] == 'assistant' else 'Candidate'}: {m['content']}" for m in msgs[-14:])
        if finish:
            prompt = f"{context}"
            if message:
                prompt += f"\nCandidate: {message}"
            prompt += f"\n\n{FINISH_INSTRUCTION}"
        else:
            prompt = f"{context}\nCandidate: {message}"
        ai_response = await chat.send_message(UserMessage(text=prompt))

        result = _parse_challenge_result(ai_response) if finish else None
        if finish and result is None:
            # One strict-reformat retry — the verdict must not get lost
            retry = await chat.send_message(UserMessage(text=(
                "Deine letzte Antwort war kein gültiges JSON. Antworte JETZT ausschließlich mit dem oben "
                "spezifizierten JSON-Objekt inklusive \"hired\". Keine Codefences, kein Vorwort."
            )))
            result = _parse_challenge_result(retry)

        if not finish:
            await db.challenges.update_one(
                {"challenge_id": challenge_id},
                {"$push": {"messages": {"role": "assistant", "content": ai_response, "timestamp": datetime.now(timezone.utc).isoformat()}}},
            )

        if result:
            await db.challenges.update_one({"challenge_id": challenge_id}, {"$set": {"status": "completed", "result": result}})
            score = result.get("score", 0)
            await record_user_action(
                user["user_id"],
                "challenge_completed",
                leadership_bonus=max(1, score // 20),
                metadata={"challenge_id": challenge_id, "challenger": challenger_id, "score": score},
            )

        return {"response": clean_ai_text(ai_response) if not finish else "", "result": result}
    except Exception as e:
        logger.error(f"Challenge message error: {e}")
        raise await ai_http_error(e, "challengers")


@router.get("/challengers/history")
async def get_challenge_history(request: Request):
    user = await get_current_user(request)
    return await db.challenges.find({"user_id": user["user_id"]}, {"_id": 0, "messages": 0}).sort("created_at", -1).to_list(50)
