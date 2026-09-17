"""Dashboard & Progress routes with full scoring infrastructure."""
import asyncio
import logging
import time

from fastapi import APIRouter, Request, Response
from datetime import datetime, timezone, timedelta

from config import db
from services import get_current_user, get_streak, calculate_level, get_user_memory, get_xp_info
from data import AGENT_SCENARIOS

logger = logging.getLogger("leaderos.dashboard")
router = APIRouter(prefix="/api", tags=["dashboard"])


async def _get_weekly_activity(user_id: str) -> list:
    """Batch-query weekly activity data (checkins + messages)."""
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    week_msgs = await db.chat_messages.find(
        {"user_id": user_id, "role": "user", "created_at": {"$gte": week_ago}},
        {"_id": 0, "created_at": 1}
    ).to_list(1000)
    week_checkins = await db.daily_checkins.find({"user_id": user_id}, {"_id": 0, "date": 1}).to_list(30)
    checkin_dates = {c["date"] for c in week_checkins}

    activity = []
    for i in range(6, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).date()
        day_str = day.isoformat()
        day_msgs = sum(1 for m in week_msgs if m.get("created_at", "").startswith(day_str))
        activity.append({"date": day_str, "day": day.strftime("%a"), "checked_in": day_str in checkin_dates, "interactions": day_msgs})
    return activity


def _get_suggestions(ls: int, eq: int, comm: int, has_checkin: bool) -> list:
    """Generate personalized suggestions based on scores."""
    suggestions = []
    scores = {"Leadership": ls, "EQ": eq, "Communication": comm}
    weakest = min(scores, key=scores.get)
    if weakest == "Communication":
        suggestions.append({"type": "simulation", "title": "Practice Feedback Conversation", "path": "/simulations", "desc": "Your communication score needs a boost"})
    elif weakest == "EQ":
        suggestions.append({"type": "simulation", "title": "Motivation Conversation", "path": "/simulations", "desc": "Strengthen your emotional intelligence"})
    else:
        suggestions.append({"type": "challenger", "title": "Face Jeff Bezos", "path": "/challengers", "desc": "Test your strategic thinking"})
    if not has_checkin:
        suggestions.insert(0, {"type": "checkin", "title": "Daily Check-in", "path": "/daily-checkin", "desc": "Log your first leadership moment today"})
    return suggestions


async def _get_challenge30_summary(user_id: str) -> dict:
    """Get 30-day challenge progress summary."""
    c30 = await db.challenge30_progress.find_one({"user_id": user_id}, {"_id": 0})
    if not c30:
        return {"completed": 0, "current_day": 1, "total_xp": 0, "progress_pct": 0, "started": False}
    c30_completed = c30.get("completed_days", [])
    c30_start = c30.get("started_at", "")
    try:
        start_dt = datetime.fromisoformat(c30_start.replace("Z", "+00:00")) if isinstance(c30_start, str) and c30_start else datetime.now(timezone.utc)
        current_day = min((datetime.now(timezone.utc) - start_dt).days + 1, 30)
    except Exception:
        current_day = 1
    return {"completed": len(c30_completed), "current_day": current_day, "total_xp": c30.get("total_xp_earned", 0), "progress_pct": round((len(c30_completed) / 30) * 100), "started": True}


@router.get("/dashboard")
async def get_dashboard(request: Request):
    user = await get_current_user(request)
    user_data = {k: v for k, v in user.items() if k != "password_hash"}
    recent_tasks = await db.tasks.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(5)
    recent_sims = await db.simulations.find({"user_id": user["user_id"]}, {"_id": 0, "messages": 0}).sort("created_at", -1).to_list(3)
    tasks_pending = await db.tasks.count_documents({"user_id": user["user_id"], "status": "pending"})
    tasks_completed = await db.tasks.count_documents({"user_id": user["user_id"], "status": "completed"})
    upcoming_events = await db.events.find({}, {"_id": 0}).to_list(3)
    return {
        "user": user_data, "recent_tasks": recent_tasks, "recent_simulations": recent_sims,
        "task_stats": {"pending": tasks_pending, "completed": tasks_completed},
        "daily_tip": "Give positive feedback to one team member today.",
        "streak": await get_streak(user["user_id"]), "upcoming_events": upcoming_events,
    }


async def _get_dashboard_activities(user_id: str) -> dict:
    """Fetch all activity data for dashboard in parallel-safe manner."""
    pending_tasks = await db.tasks.find({"user_id": user_id, "status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(3)
    active_sims = await db.simulations.find({"user_id": user_id, "status": "active"}, {"_id": 0, "messages": 0}).to_list(2)
    active_playbooks = await db.playbook_sessions.find({"user_id": user_id, "status": "active"}, {"_id": 0}).to_list(2)
    recent_sims = await db.simulations.find({"user_id": user_id}, {"_id": 0, "messages": 0}).sort("created_at", -1).to_list(3)
    recent_challenges = await db.challenges.find({"user_id": user_id}, {"_id": 0, "messages": 0}).sort("created_at", -1).to_list(3)
    return {
        "pending_tasks": pending_tasks, "active_sims": active_sims,
        "active_playbooks": active_playbooks, "recent_sims": recent_sims,
        "recent_challenges": recent_challenges,
    }


async def _get_dashboard_stats(user_id: str) -> dict:
    """Fetch aggregated stats for dashboard."""
    return {
        "tasks_pending": await db.tasks.count_documents({"user_id": user_id, "status": "pending"}),
        "tasks_completed": await db.tasks.count_documents({"user_id": user_id, "status": "completed"}),
        "total_sims": await db.simulations.count_documents({"user_id": user_id}),
    }


@router.get("/dashboard-v4")
async def get_dashboard_v4(request: Request):
    user = await get_current_user(request)
    user_data = {k: v for k, v in user.items() if k != "password_hash"}

    ls, eq, comm = user_data.get("leadership_score", 0), user_data.get("eq_score", 0), user_data.get("communication_score", 0)
    composite = min(100, int(ls * 0.4 + eq * 0.3 + comm * 0.3))

    today = datetime.now(timezone.utc).date().isoformat()
    today_checkin = await db.daily_checkins.find_one({"user_id": user["user_id"], "date": today}, {"_id": 0})
    streak = await get_streak(user["user_id"])
    activities = await _get_dashboard_activities(user["user_id"])
    stats = await _get_dashboard_stats(user["user_id"])
    suggestions = _get_suggestions(ls, eq, comm, today_checkin is not None)

    return {
        "user": user_data,
        "leader_score": {"composite": composite, "leadership": ls, "eq": eq, "communication": comm},
        "xp_info": get_xp_info(user_data.get("xp", 0)),
        "streak": streak, "today_checkin": today_checkin,
        "what_matters_today": {"pending_tasks": activities["pending_tasks"], "active_sims": activities["active_sims"], "active_playbooks": activities["active_playbooks"], "suggestions": suggestions},
        "weekly_activity": await _get_weekly_activity(user["user_id"]),
        "recent_activity": {"simulations": activities["recent_sims"], "challenges": activities["recent_challenges"]},
        "stats": {**stats, "xp": user_data.get("xp", 0)},
        "upcoming_events": await db.events.find({}, {"_id": 0}).to_list(3),
        "challenge30": await _get_challenge30_summary(user["user_id"]),
    }


_BOOTSTRAP_TTL = 8.0  # Sekunden: deckt Doppel-Mounts/schnelles Hin- und Hernavigieren ab, ohne Aktionen zu verschlucken
_bootstrap_cache: dict[str, tuple[float, dict]] = {}


async def _safe(coro, fallback):
    try:
        return await coro
    except Exception as exc:  # ein kaputter Teil darf das Dashboard nicht blockieren
        logger.warning(f"dashboard bootstrap slice failed: {exc}")
        return fallback


@router.get("/dashboard/bootstrap")
async def dashboard_bootstrap(request: Request, response: Response, fresh: int = 0):
    """Dashboard in einem Zug: alle Startdaten parallel in EINER Antwort (Iter 168).
    Ersetzt 7 Einzelrequests beim Seitenaufbau; kurzer Cache je Nutzer (8 s), `?fresh=1` umgeht ihn."""
    from routes.challenge30 import CHALLENGES, get_challenge_status
    from routes.checkin import get_today_checkin
    from routes.courses import list_courses
    from routes.events import get_event_reminders, get_events
    from routes.folders import list_folders
    from routes.guide import list_clips
    from routes.journey import get_journey
    from routes.my_path import get_learning_videos
    from routes.referral import get_referral_code

    user = await get_current_user(request)
    key = user["user_id"]
    now = time.monotonic()
    hit = _bootstrap_cache.get(key)
    if hit and not fresh and now - hit[0] < _BOOTSTRAP_TTL:
        response.headers["X-Bootstrap-Cache"] = "hit"
        return hit[1]

    dashboard, referral, reminders, events_live, videos, clips, folders, journey, c30_status, checkin_today, courses = await asyncio.gather(
        get_dashboard_v4(request),
        _safe(get_referral_code(request), {}),
        _safe(get_event_reminders(request), {"reminders": [], "next_event": None}),
        _safe(get_events(request, "live"), []),
        _safe(get_learning_videos(request), None),
        _safe(list_clips(request, "onboarding", False), {"clips": []}),
        _safe(list_folders(request), []),
        _safe(get_journey(request), None),
        _safe(get_challenge_status(request), None),
        _safe(get_today_checkin(request), None),
        _safe(list_courses(request), None),
    )
    # Iter 185: Startseite beantwortet „was soll ich hier tun?" — Tagesaufgabe,
    # Check-in und Kurs-Stand kommen im selben Zug mit.
    today_task = None
    if c30_status:
        # Iter 186 (Entscheidung 8a): die nächste OFFENE Aufgabe in der Reihenfolge.
        day = int(c30_status.get("next_open_day") or c30_status.get("current_day") or 1)
        from challenge30_criteria import done_criteria
    entry = next((c for c in CHALLENGES if c.get("day") == day), None)
    if entry:
        entry = {**entry, **done_criteria(entry)}
        if entry:
            today_task = {
                "day": day, "total": 30,
                "title_de": entry.get("title_de"), "title_en": entry.get("title_en"),
                "desc_de": entry.get("desc_de"), "desc_en": entry.get("desc_en"),
                "duration": entry.get("duration"), "path": entry.get("path"),
                "type": entry.get("type"), "xp": entry.get("xp"),
                "done_de": entry.get("done_de"), "done_en": entry.get("done_en"),
                "started": day in (c30_status.get("started_days") or []),
                "open_count": len(c30_status.get("open_days") or []),
                "done": day in (c30_status.get("completed_days") or []),
                "completed_count": len(c30_status.get("completed_days") or []),
            }
    payload = {
        "dashboard": dashboard, "referral": referral, "events_reminders": reminders, "events_live": events_live,
        "my_path_videos": videos, "guide_clips": clips, "folders": folders, "journey": journey,
        "challenge_today": today_task,
        "lab_enrolled": bool(await db.lab_enrollments.find_one({"user_id": user["user_id"]}, {"_id": 1})),
        "checkin_today": checkin_today,
        "courses_status": ({
            "tier": courses.get("tier"),
            "total_episodes": courses.get("total_episodes"),
            "seen_total": courses.get("seen_total"),
            "unlocked_episodes": sum(1 for c in courses.get("courses", []) for e in c.get("episodes", []) if e.get("unlocked")),
            "next_episode": next(({"course": c.get("title"), "slug": c.get("slug"), "id": e.get("id"),
                                   "number": e.get("number"), "title": e.get("title"), "minutes": e.get("minutes")}
                                  for c in courses.get("courses", []) for e in c.get("episodes", [])
                                  if e.get("unlocked") and not e.get("seen")), None),
        } if courses else None),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    if len(_bootstrap_cache) > 2000:
        _bootstrap_cache.clear()
    _bootstrap_cache[key] = (now, payload)
    response.headers["X-Bootstrap-Cache"] = "miss"
    response.headers["Cache-Control"] = "private, no-store"
    return payload


@router.get("/xp-info")
async def get_xp_info_endpoint(request: Request):
    """Get detailed XP info with human-readable level labels and progress."""
    user = await get_current_user(request)
    return get_xp_info(user.get("xp", 0))


@router.get("/progress")
async def get_progress(request: Request):
    user = await get_current_user(request)
    user_data = {k: v for k, v in user.items() if k != "password_hash"}

    xp = user_data.get("xp", 0)
    level = calculate_level(xp)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"level": level}})
    user_data["level"] = level

    tasks_completed = await db.tasks.count_documents({"user_id": user["user_id"], "status": "completed"})
    sims_completed = await db.simulations.count_documents({"user_id": user["user_id"], "status": "completed"})
    total_chats = await db.chat_messages.count_documents({"user_id": user["user_id"], "role": "user"})

    return {
        "user": user_data,
        "stats": {
            "tasks_completed": tasks_completed, "simulations_completed": sims_completed,
            "total_conversations": total_chats, "xp": xp, "level": level,
            "next_level_xp": 200 if level == "Emerging Leader" else 500 if level == "Leader" else 1000 if level == "Senior Leader" else 2000,
        },
    }


@router.get("/leaderboard")
async def get_leaderboard():
    return await db.users.find({}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "xp": 1, "level": 1, "leadership_score": 1, "eq_score": 1, "communication_score": 1}).sort("xp", -1).to_list(20)


@router.get("/leader-score")
async def get_leader_score(request: Request):
    user = await get_current_user(request)
    user_data = {k: v for k, v in user.items() if k != "password_hash"}

    ls = user_data.get("leadership_score", 0)
    eq = user_data.get("eq_score", 0)
    comm = user_data.get("communication_score", 0)
    composite = min(100, int(ls * 0.4 + eq * 0.3 + comm * 0.3))

    checkins_count = await db.daily_checkins.count_documents({"user_id": user["user_id"]})
    sims_completed = await db.simulations.count_documents({"user_id": user["user_id"], "status": "completed"})
    tasks_completed = await db.tasks.count_documents({"user_id": user["user_id"], "status": "completed"})
    challenges_completed = await db.challenges.count_documents({"user_id": user["user_id"], "status": "completed"})

    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    weekly_checkins = await db.daily_checkins.find({"user_id": user["user_id"], "created_at": {"$gte": week_ago}}, {"_id": 0, "date": 1, "ai_feedback": 1}).to_list(7)

    weekly_activity = []
    for i in range(6, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).date()
        day_str = day.isoformat()
        has_checkin = any(c.get("date") == day_str for c in weekly_checkins)
        weekly_activity.append({"date": day_str, "day": day.strftime("%a"), "active": has_checkin})

    return {
        "composite_score": composite, "leadership_score": ls, "eq_score": eq, "communication_score": comm,
        "xp": user_data.get("xp", 0), "level": user_data.get("level", "Emerging Leader"),
        "total_checkins": checkins_count, "sims_completed": sims_completed,
        "tasks_completed": tasks_completed, "challenges_completed": challenges_completed,
        "weekly_activity": weekly_activity, "streak": await get_streak(user["user_id"]),
    }


@router.get("/agents/scenarios")
async def get_agent_scenarios():
    return AGENT_SCENARIOS


@router.get("/agents/scenarios/{agent_name}")
async def get_agent_scenario(agent_name: str):
    from fastapi import HTTPException
    scenarios = AGENT_SCENARIOS.get(agent_name)
    if not scenarios:
        raise HTTPException(status_code=404, detail="Agent not found")
    return scenarios


# ========== ACTIVITY LOG & SCORE HISTORY API ==========

@router.get("/activity-log")
async def get_activity_log(request: Request):
    user = await get_current_user(request)
    return await db.activity_log.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)


@router.get("/score-history")
async def get_score_history(request: Request):
    user = await get_current_user(request)
    return await db.score_history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("date", -1).to_list(90)


@router.get("/user-memory")
async def get_user_memory_endpoint(request: Request):
    user = await get_current_user(request)
    memory = await get_user_memory(user["user_id"])
    return {"memory": memory, "user_id": user["user_id"]}
