"""User Profile — picture upload target, editable profile fields, activity feed."""
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional

from config import db, logger
from services import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=150)
    company: Optional[str] = Field(None, max_length=150)
    industry: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    linkedin_url: Optional[str] = Field(None, max_length=300)


# ── Mapping action-key → human-readable label + icon (rendered by frontend) ──
ACTION_META: dict = {
    "daily_checkin": {"label_de": "Daily Check-in abgeschlossen", "label_en": "Daily check-in completed", "icon": "check", "xp_color": "#30D158"},
    "challenge_day": {"label_de": "30-Tage Challenge Tag erledigt", "label_en": "30-Day Challenge day done", "icon": "flame", "xp_color": "#FF8A00"},
    "mission_completed": {"label_de": "Mission erfolgreich", "label_en": "Mission completed", "icon": "target", "xp_color": "#BFFF00"},
    "video_challenge": {"label_de": "Video-Mission eingereicht", "label_en": "Video mission submitted", "icon": "video", "xp_color": "#0AAEFF"},
    "challenger_interview": {"label_de": "Challenger-Interview", "label_en": "Challenger interview", "icon": "mic", "xp_color": "#D946EF"},
    "simulation": {"label_de": "Simulation durchgespielt", "label_en": "Simulation played", "icon": "brain", "xp_color": "#9333EA"},
    "tool_used": {"label_de": "Tool benutzt", "label_en": "Tool used", "icon": "wrench", "xp_color": "#6366F1"},
    "playbook_step": {"label_de": "Playbook-Step erledigt", "label_en": "Playbook step done", "icon": "book", "xp_color": "#EC4899"},
    "playbook_completed": {"label_de": "Playbook abgeschlossen", "label_en": "Playbook completed", "icon": "book", "xp_color": "#EC4899"},
    "report_generated": {"label_de": "Report erstellt", "label_en": "Report generated", "icon": "book", "xp_color": "#6366F1"},
    "referral_success": {"label_de": "Empfehlung erfolgreich", "label_en": "Referral successful", "icon": "gift", "xp_color": "#F59E0B"},
    "referral_used": {"label_de": "Referral-Code eingelöst", "label_en": "Referral code redeemed", "icon": "gift", "xp_color": "#F59E0B"},
    "social_share": {"label_de": "Auf Social geteilt", "label_en": "Shared on social", "icon": "share", "xp_color": "#0A66C2"},
    "enterprise_lead": {"label_de": "Enterprise-Anfrage gesendet", "label_en": "Enterprise request sent", "icon": "building", "xp_color": "#6B7280"},
    "enterprise_diagnosis": {"label_de": "Enterprise-Diagnose", "label_en": "Enterprise diagnosis", "icon": "building", "xp_color": "#6B7280"},
    "level_up": {"label_de": "Level-Up!", "label_en": "Level Up!", "icon": "crown", "xp_color": "#FFD700"},
    "community_post": {"label_de": "Community-Post erstellt", "label_en": "Community post created", "icon": "message", "xp_color": "#14B8A6"},
    "community_comment": {"label_de": "Community-Kommentar", "label_en": "Community comment", "icon": "message", "xp_color": "#14B8A6"},
    "community_like": {"label_de": "Post geliked", "label_en": "Post liked", "icon": "sparkle", "xp_color": "#14B8A6"},
    "chat_message": {"label_de": "Nachricht an WladBot", "label_en": "Message to WladBot", "icon": "chat", "xp_color": "#BFFF00"},
    "chat_session": {"label_de": "WladBot-Session gestartet", "label_en": "WladBot session started", "icon": "chat", "xp_color": "#BFFF00"},
    "deep_assist": {"label_de": "Deep-Assist Analyse", "label_en": "Deep-Assist analysis", "icon": "brain", "xp_color": "#BFFF00"},
    "onboarding_completed": {"label_de": "Onboarding abgeschlossen", "label_en": "Onboarding completed", "icon": "check", "xp_color": "#30D158"},
    "task_completed": {"label_de": "Aufgabe erledigt", "label_en": "Task completed", "icon": "check", "xp_color": "#30D158"},
    "wladhub_diagnosis_imported": {"label_de": "WladHub-Diagnose importiert", "label_en": "WladHub diagnosis imported", "icon": "brain", "xp_color": "#BFFF00"},
    "wladhub_supabase_synced": {"label_de": "WladHub synchronisiert", "label_en": "WladHub synced", "icon": "sparkle", "xp_color": "#BFFF00"},
    "challenge30_day": {"label_de": "30-Tage Challenge Tag erledigt", "label_en": "30-Day Challenge day done", "icon": "flame", "xp_color": "#FF8A00"},
    "challenge30_quiz": {"label_de": "30-Tage Quiz bestanden", "label_en": "30-Day quiz passed", "icon": "target", "xp_color": "#FF8A00"},
    "video_challenge_completed": {"label_de": "Video-Mission abgeschlossen", "label_en": "Video mission completed", "icon": "video", "xp_color": "#0AAEFF"},
    "simulation_completed": {"label_de": "Simulation gemeistert", "label_en": "Simulation mastered", "icon": "brain", "xp_color": "#9333EA"},
    "challenge_completed": {"label_de": "Challenger-Interview bestanden", "label_en": "Challenger interview passed", "icon": "mic", "xp_color": "#D946EF"},
}


def _annotate_activity(activity: dict, lang: str) -> dict:
    """Enrich activity row with label + icon from ACTION_META."""
    action = activity.get("action", "unknown")
    meta = ACTION_META.get(action, {
        "label_de": action.replace("_", " ").title(),
        "label_en": action.replace("_", " ").title(),
        "icon": "sparkle",
        "xp_color": "#BFFF00",
    })
    return {
        "activity_id": activity.get("activity_id", ""),
        "action": action,
        "label": meta["label_de"] if lang == "de" else meta["label_en"],
        "icon": meta["icon"],
        "xp_color": meta["xp_color"],
        "xp_delta": activity.get("xp_earned", activity.get("xp_delta", 0)),
        "created_at": activity.get("created_at", ""),
        "metadata": activity.get("metadata", {}),
    }


@router.get("/me")
async def get_my_profile(request: Request) -> dict:
    """Get the current user's extended profile (for ProfilePage)."""
    user = await get_current_user(request)
    user_id = user["user_id"]

    # Counts — keep it light
    sim_count = await db.simulations.count_documents({"user_id": user_id, "status": "completed"})
    chat_count = await db.chat_sessions.count_documents({"user_id": user_id})
    challenge_progress = await db.challenge30_progress.find_one({"user_id": user_id}, {"_id": 0})
    done_days = len(challenge_progress.get("completed_days", [])) if challenge_progress else 0
    ref_count = await db.referral_uses.count_documents({"referrer_id": user_id})
    posts_count = await db.community_posts.count_documents({"user_id": user_id})

    # Streak from daily_checkins
    last_checkin = await db.daily_checkins.find_one({"user_id": user_id}, sort=[("date", -1)])
    streak = user.get("streak", 0)
    last_checkin_date = last_checkin.get("date") if last_checkin else None

    # Join date
    member_since = user.get("created_at", "")

    return {
        "user_id": user_id,
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "picture": user.get("picture"),
        "position": user.get("position", ""),
        "company": user.get("company", ""),
        "industry": user.get("industry", ""),
        "bio": user.get("bio", ""),
        "linkedin_url": user.get("linkedin_url", ""),
        "tier": user.get("tier", "free"),
        "level": user.get("level", "Emerging Leader"),
        "xp": user.get("xp", 0),
        "leadership_score": user.get("leadership_score", 0),
        "eq_score": user.get("eq_score", 0),
        "communication_score": user.get("communication_score", 0),
        "streak": streak,
        "last_checkin": last_checkin_date,
        "member_since": member_since,
        "stats": {
            "simulations": sim_count,
            "chat_sessions": chat_count,
            "challenge_days_completed": done_days,
            "referrals": ref_count,
            "community_posts": posts_count,
        },
    }


@router.patch("/me")
async def update_my_profile(data: ProfileUpdate, request: Request) -> dict:
    """Update editable profile fields."""
    user = await get_current_user(request)
    update: dict = {k: v for k, v in data.dict(exclude_none=True).items()}
    if not update:
        return {"updated": 0, "fields": []}
    user_fields = list(update.keys())   # only user-provided fields
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    logger.info(f"Profile updated for {user['user_id']}: {user_fields}")
    return {"updated": len(user_fields), "fields": user_fields}


@router.get("/activity")
async def get_my_activity(request: Request, limit: int = 30, lang: str = "de") -> dict:
    """Get the last N activities of the current user for the activity feed."""
    user = await get_current_user(request)
    limit = max(1, min(limit, 100))

    raw = await db.activity_log.find(
        {"user_id": user["user_id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(limit)

    activities: list[dict] = [_annotate_activity(a, lang) for a in raw]
    total_xp_30d = sum(a["xp_delta"] for a in activities if _within_last_days(a["created_at"], 30))

    return {
        "activities": activities,
        "total": len(activities),
        "xp_last_30d": total_xp_30d,
    }


def _within_last_days(iso_date: str, days: int) -> bool:
    if not iso_date:
        return False
    try:
        dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - dt
        return delta.days <= days
    except Exception:
        return False
