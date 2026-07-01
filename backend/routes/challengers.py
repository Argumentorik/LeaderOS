"""Challenger routes."""
from fastapi import APIRouter, HTTPException, Request
import uuid
import json
import re
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

from config import db, EMERGENT_LLM_KEY, logger
from services import get_current_user, clean_ai_text, update_user_scores
from services_actions import record_user_action
from data import LEADERSHIP_CHALLENGERS

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
        raise HTTPException(status_code=500, detail=str(e))


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
            return json.loads(json_match.group())
    except (json.JSONDecodeError, Exception):
        pass
    return None


@router.post("/challengers/{challenger_id}/message")
async def challenge_message(challenger_id: str, request: Request):
    from routes.credits import check_and_deduct_credit
    body = await request.json()
    message = body.get("message", "")
    challenge_id = body.get("challenge_id", "")
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

    await db.challenges.update_one(
        {"challenge_id": challenge_id},
        {"$push": {"messages": {"role": "user", "content": message, "timestamp": datetime.now(timezone.utc).isoformat()}}},
    )
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"chal_{challenge_id}", system_message=challenger["test_prompt"])
        chat.with_model("openai", "gpt-5.2")
        msgs = chal.get("messages", [])
        context = "\n".join(f"{'Interviewer' if m['role'] == 'assistant' else 'Candidate'}: {m['content']}" for m in msgs[-10:])
        ai_response = await chat.send_message(UserMessage(text=f"{context}\nCandidate: {message}"))

        await db.challenges.update_one(
            {"challenge_id": challenge_id},
            {"$push": {"messages": {"role": "assistant", "content": ai_response, "timestamp": datetime.now(timezone.utc).isoformat()}}},
        )

        result = _parse_challenge_result(ai_response)
        if result:
            await db.challenges.update_one({"challenge_id": challenge_id}, {"$set": {"status": "completed", "result": result}})
            score = result.get("score", 0)
            await record_user_action(
                user["user_id"],
                "challenge_completed",
                leadership_bonus=max(1, score // 20),
                metadata={"challenge_id": challenge_id, "challenger": challenger_id, "score": score},
            )

        return {"response": clean_ai_text(ai_response), "result": result}
    except Exception as e:
        logger.error(f"Challenge message error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/challengers/history")
async def get_challenge_history(request: Request):
    user = await get_current_user(request)
    return await db.challenges.find({"user_id": user["user_id"]}, {"_id": 0, "messages": 0}).sort("created_at", -1).to_list(50)
