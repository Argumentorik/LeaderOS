"""Task routes."""
from fastapi import APIRouter, HTTPException, Request
import uuid
from datetime import datetime, timezone

from config import db, logger
from models import TaskCreate, TaskUpdate
from services import get_current_user
from services_actions import record_user_action

router = APIRouter(prefix="/api", tags=["tasks"])


@router.get("/tasks")
async def get_tasks(request: Request):
    user = await get_current_user(request)
    return await db.tasks.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.post("/tasks")
async def create_task(data: TaskCreate, request: Request):
    user = await get_current_user(request)
    task_id = f"task_{uuid.uuid4().hex[:12]}"
    doc = {
        "task_id": task_id, "user_id": user["user_id"], "title": data.title,
        "description": data.description, "category": data.category, "priority": data.priority,
        "status": "pending", "source": "manual", "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tasks.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@router.post("/tasks/generate")
async def generate_ai_tasks(request: Request):
    """WladBot generates 5 personalised leadership tasks from the user's profile."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    from config import EMERGENT_LLM_KEY
    from services_ai_parse import parse_ai_json
    user = await get_current_user(request)

    open_ai = await db.tasks.count_documents({"user_id": user["user_id"], "status": "pending", "source": "ai_coach"})
    if open_ai >= 10:
        raise HTTPException(status_code=400, detail="Du hast noch 10+ offene KI-Aufgaben. Erledige erst ein paar davon — dann generiere ich neue.")

    open_titles = [t["title"] for t in await db.tasks.find(
        {"user_id": user["user_id"], "status": "pending"}, {"_id": 0, "title": 1}).to_list(20)]
    profile = (
        f"Rolle: {user.get('position') or 'Führungskraft'} | Branche: {user.get('industry') or 'unbekannt'} | "
        f"Leadership-Score: {user.get('leadership_score', 0)}/100 | Kommunikation: {user.get('communication_score', 0)}/100 | "
        f"EQ: {user.get('eq_score', 0)}/100 | Level: {user.get('level', '')}"
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"taskgen_{uuid.uuid4().hex[:8]}",
            system_message=(
                "Du bist WladBot — Wlad Jachtchenkos Leadership-Coach. Generiere GENAU 5 konkrete, sofort umsetzbare "
                "Leadership-Aufgaben für diese Woche, zugeschnitten auf das Profil des Users. Jede Aufgabe: klarer "
                "Titel (max 10 Wörter, beginnt mit Verb), 1-2 Sätze Beschreibung mit Wlad-Methodik-Bezug. "
                "Keine Duplikate zu den bereits offenen Aufgaben. Deutsch.\n"
                'Antworte NUR mit JSON: {"tasks": [{"title": "...", "description": "...", '
                '"priority": "high"|"medium"|"low", "category": "kommunikation"|"führung"|"team"|"selbstmanagement"}]}'
            ),
        )
        chat.with_model("openai", "gpt-5.2")
        raw = await chat.send_message(UserMessage(text=f"PROFIL: {profile}\nBEREITS OFFEN: {'; '.join(open_titles) or 'keine'}"))
        parsed = parse_ai_json(raw) or {}
        items = parsed.get("tasks") or []
        if not items:
            raise ValueError("no tasks returned")
    except Exception as e:
        logger.error(f"AI task generation failed: {e}")
        raise HTTPException(status_code=500, detail="KI-Aufgaben konnten nicht generiert werden. Bitte erneut versuchen.")

    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for it in items[:5]:
        if not (it.get("title") or "").strip():
            continue
        docs.append({
            "task_id": f"task_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "title": it["title"].strip()[:120],
            "description": (it.get("description") or "").strip()[:400],
            "category": it.get("category") or "general",
            "priority": it.get("priority") if it.get("priority") in ("high", "medium", "low") else "medium",
            "status": "pending", "source": "ai_coach", "created_at": now,
        })
    if docs:
        await db.tasks.insert_many(docs)
        await record_user_action(user["user_id"], "ai_tasks_generated", metadata={"count": len(docs)})
    return {"created": len(docs), "tasks": [{k: v for k, v in d.items() if k != "_id"} for d in docs]}


@router.put("/tasks/{task_id}")
async def update_task(task_id: str, data: TaskUpdate, request: Request):
    user = await get_current_user(request)
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.tasks.update_one({"task_id": task_id, "user_id": user["user_id"]}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    if update_data.get("status") == "completed":
        await record_user_action(user["user_id"], "task_completed", metadata={"task_id": task_id})
    task = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    return task


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.tasks.delete_one({"task_id": task_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}
