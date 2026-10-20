"""Playbook routes."""
from fastapi import APIRouter, HTTPException, Request
import uuid
from datetime import datetime, timezone
# Migration → lib.llm_provider (bit-identische API, Provider per ENV).
from lib.llm_provider import LlmChat, UserMessage

from config import db, EMERGENT_LLM_KEY, logger
from services import get_current_user, WLAD_HARD_RULES
from services_actions import record_user_action
from data import PLAYBOOKS
from services_ai_errors import ai_http_error

router = APIRouter(prefix="/api", tags=["playbooks"])


@router.get("/playbooks")
async def get_playbooks():
    return PLAYBOOKS


@router.post("/playbooks/{playbook_id}/start")
async def start_playbook(playbook_id: str, request: Request):
    user = await get_current_user(request)
    playbook = next((p for p in PLAYBOOKS if p["playbook_id"] == playbook_id), None)
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook not found")
    session_id = f"pb_{uuid.uuid4().hex[:12]}"
    doc = {
        "session_id": session_id, "user_id": user["user_id"], "playbook_id": playbook_id,
        "current_step": 0, "responses": [], "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.playbook_sessions.insert_one(doc)
    return {"session_id": session_id, "playbook": playbook, "current_step": 0}


@router.post("/playbooks/{playbook_id}/step")
async def playbook_step(playbook_id: str, data_in: dict, request: Request):
    from models import PlaybookStepIn
    data = PlaybookStepIn(**data_in) if isinstance(data_in, dict) else data_in
    user = await get_current_user(request)
    playbook = next((p for p in PLAYBOOKS if p["playbook_id"] == playbook_id), None)
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook not found")

    session = await db.playbook_sessions.find_one({"user_id": user["user_id"], "playbook_id": playbook_id, "status": "active"}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="No active playbook session")

    step_index = data.step_index if hasattr(data, 'step_index') else data_in.get('step_index', 0)
    user_input = data.user_input if hasattr(data, 'user_input') else data_in.get('user_input', '')

    step = playbook["steps"][step_index] if step_index < len(playbook["steps"]) else None
    if not step:
        raise HTTPException(status_code=400, detail="Invalid step")

    try:
        # RAG: pull Wlad-specific chunks relevant to the playbook step + user input
        rag_block = ""
        try:
            from services_rag import retrieve_context
            rag_query = f"{playbook['title']} {step['title']} {user_input[:300]}"
            rag_ctx = await retrieve_context(rag_query)
            if rag_ctx.get("rag_active"):
                rag_block = "\n\n" + rag_ctx["context_block"]
        except Exception:
            pass

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"pb_{session['session_id']}",
            system_message=(
                f"Du bist WLADBOT und führst den User durch das '{playbook['title']}' Playbook. "
                f"Aktueller Schritt: {step['title']}. Gib umsetzbare, strukturierte Ratschläge "
                f"basierend auf Wlad Jachtchenkos Leadership-Frameworks. Antworte IMMER auf DEUTSCH. "
                f"Antworte als JSON: {{\"advice\": \"...\", \"key_points\": [...], \"next_action\": \"...\"}}"
                + rag_block
                + WLAD_HARD_RULES
            )
        )
        chat.with_model("openai", "gpt-5.2")
        ai_response = await chat.send_message(UserMessage(text=f"Step: {step['title']}\nPrompt: {step['prompt']}\nUser input: {user_input}"))

        try:
            from services_ai_parse import parse_ai_json
            parsed = parse_ai_json(ai_response) or {"advice": ai_response, "key_points": [], "next_action": ""}
        except Exception:
            parsed = {"advice": ai_response, "key_points": [], "next_action": ""}

        await db.playbook_sessions.update_one(
            {"session_id": session["session_id"]},
            {"$push": {"responses": {"step": step_index, "input": user_input, "ai_response": parsed}}, "$set": {"current_step": step_index + 1}},
        )

        completed = step_index >= len(playbook["steps"]) - 1
        if completed:
            await db.playbook_sessions.update_one({"session_id": session["session_id"]}, {"$set": {"status": "completed"}})
            await record_user_action(user["user_id"], "playbook_completed", metadata={"playbook_id": playbook_id})

        return {"response": parsed, "completed": completed, "next_step": step_index + 1 if not completed else None}
    except Exception as e:
        logger.error(f"Playbook step error: {e}")
        raise await ai_http_error(e, "playbooks")


@router.post("/playbooks/{playbook_id}/report")
async def generate_advice_report(playbook_id: str, request: Request):
    user = await get_current_user(request)
    playbook = next((p for p in PLAYBOOKS if p["playbook_id"] == playbook_id), None)
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook not found")
    session = await db.playbook_sessions.find_one({"user_id": user["user_id"], "playbook_id": playbook_id, "status": "completed"}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="No completed session found")
    responses_text = "\n".join([f"Step {r.get('step', i)}: {r.get('input', '')}" for i, r in enumerate(session.get("responses", []))])
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"report_{uuid.uuid4().hex[:8]}", system_message=(
            "Du bist WLADBOT und erstellst einen persönlichen Leadership Advice Report basierend auf Wlad Jachtchenkos Methoden. Antworte NUR mit validem JSON auf DEUTSCH. Sei detailliert und thematisiere das spezifische Playbook-Thema."
            + WLAD_HARD_RULES
        ))
        chat.with_model("openai", "gpt-5.2")
        msg = UserMessage(text=f"""Erstelle einen persönlichen Advice Report für das '{playbook['title']}' Playbook.
User-Antworten: {responses_text}
Aktuelle Scores: Leadership={user.get('leadership_score',0)}, EQ={user.get('eq_score',0)}, Kommunikation={user.get('communication_score',0)}

Antworte als JSON:
{{"top_10_insights": ["..."], "strengths": ["..."], "improvements": ["..."], "next_steps": ["..."], "leadership_recommendations": ["..."], "overall_assessment": "...", "score": 0-100, "playbook_specific_feedback": "..."}}""")
        ai_response = await chat.send_message(msg)
        from services_ai_parse import parse_ai_json
        report = parse_ai_json(ai_response)
        if report is None:
            # Retry once with stricter prompt
            reformat = await chat.send_message(UserMessage(text="Antworte JETZT NUR mit gültigem JSON, keine Markdown-Codefences, kein Vorwort."))
            report = parse_ai_json(reformat) or {"overall_assessment": ai_response, "top_10_insights": [], "strengths": [], "improvements": [], "next_steps": [], "leadership_recommendations": []}
        await db.advice_reports.insert_one({
            "report_id": f"report_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
            "playbook_id": playbook_id, "report": report,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await record_user_action(user["user_id"], "report_generated", metadata={"playbook_id": playbook_id})
        return report
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        raise await ai_http_error(e, "playbooks")
