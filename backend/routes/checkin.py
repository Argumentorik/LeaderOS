"""Daily check-in routes."""
from fastapi import APIRouter, HTTPException, Request
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

from config import db, EMERGENT_LLM_KEY, logger
from models import DailyCheckinIn
from services import get_current_user
from services_actions import record_user_action

router = APIRouter(prefix="/api", tags=["checkin"])

CHECKIN_SYSTEM_PROMPT = """Du bist WladBot, der taegliche Leadership-Coach basierend auf den Methoden von Wlad Jachtchenko.

DEINE FRAMEWORKS (aus Wlads Buechern & Trainings):
- Feedbackformel: Beobachtung + Wirkung + Wunsch
- 3 Säulen der Überzeugung: Logos (Logik), Ethos (Glaubwürdigkeit), Pathos (Emotion)
- 5 Ebenen des Aktiven Zuhörens: Aufnehmen, Verstehen, Paraphrasieren, Emotionen benennen, Nachfragen
- Delegation als Befähigung: Kontext geben, Ergebnis definieren, Vertrauen schenken
- Entscheidungsmatrix: Impact vs. Reversibilitaet
- Kommunikationsquadrant: Klar + Empathisch + Strukturiert + Mutig

Analysiere den taeglichen Check-in des Leaders. Gib Feedback auf DEUTSCH.
Antworte NUR mit validem JSON:
{
  "feedback": "2-3 Sätze personalisiertes Feedback. Referenziere ein spezifisches Framework von Wlad, das zur Situation passt.",
  "score_delta": 1-5,
  "category": "decision/communication/conflict/delegation/growth/eq",
  "micro_tip": "Ein konkreter, umsetzbarer Tipp aus Wlads Methodik für morgen",
  "encouragement": "Ein motivierender Satz auf Deutsch"
}"""


@router.post("/daily-checkin")
async def submit_daily_checkin(data: DailyCheckinIn, request: Request):
    user = await get_current_user(request)
    checkin_id = f"checkin_{uuid.uuid4().hex[:12]}"
    today = datetime.now(timezone.utc).date().isoformat()

    existing = await db.daily_checkins.find_one({"user_id": user["user_id"], "date": today}, {"_id": 0})

    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"checkin_{checkin_id}", system_message=CHECKIN_SYSTEM_PROMPT)
        chat.with_model("openai", "gpt-5.2")
        ai_response = await chat.send_message(UserMessage(text=f"Daily check-in from leader: {data.content}"))

        try:
            from services_ai_parse import parse_ai_json
            parsed = parse_ai_json(ai_response) or {"feedback": ai_response, "score_delta": 2, "category": "growth", "micro_tip": "Keep reflecting daily.", "encouragement": "Great job checking in!"}
        except Exception:
            parsed = {"feedback": ai_response, "score_delta": 2, "category": "growth", "micro_tip": "Keep reflecting daily.", "encouragement": "Great job checking in!"}

        doc = {
            "checkin_id": checkin_id, "user_id": user["user_id"], "content": data.content,
            "checkin_type": data.checkin_type, "ai_feedback": parsed, "date": today,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if existing:
            await db.daily_checkins.update_one({"user_id": user["user_id"], "date": today}, {"$set": doc})
        else:
            await db.daily_checkins.insert_one(doc)

        score_delta = min(parsed.get("score_delta", 2), 5)
        category = parsed.get("category", "growth")
        score_field_map = {"communication": "comm", "eq": "eq"}
        field = score_field_map.get(category, "leadership")

        bonus_kwargs = {"metadata": {"date": today, "category": category}}
        bonus_kwargs[f"{field}_bonus"] = score_delta
        await record_user_action(user["user_id"], "daily_checkin", **bonus_kwargs)

        return {"checkin_id": checkin_id, "feedback": parsed, "is_update": existing is not None}
    except Exception as e:
        logger.error(f"Daily checkin error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/daily-checkin")
async def get_daily_checkins(request: Request):
    user = await get_current_user(request)
    return await db.daily_checkins.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(30)


@router.get("/daily-checkin/today")
async def get_today_checkin(request: Request):
    user = await get_current_user(request)
    today = datetime.now(timezone.utc).date().isoformat()
    checkin = await db.daily_checkins.find_one({"user_id": user["user_id"], "date": today}, {"_id": 0})
    return checkin or {"checked_in": False}
