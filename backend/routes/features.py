"""Premium-first feature rollout — deliberately minimal (Iter 135).

One collection, three stages, one helper. No flag monster.

    stage = "off"          → nobody sees it (kill switch)
    stage = "premium"      → paid tiers only (standard/accelerator/enterprise + admins)
    stage = "all"          → everybody, including free

Principle: a new improvement ships as "premium", and is promoted to "all"
when it has survived real usage. Promotion is one click in the Admin Dashboard,
no deployment needed.

Frontend: GET /api/features → {"feature_key": true|false, ...} for the caller.
Admin:    GET/PUT /api/admin/features
"""
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from config import db
from routes.auth import get_current_user

router = APIRouter(prefix="/api", tags=["features"])

PAID_TIERS = ("standard", "accelerator", "enterprise")

# Registry: every gated improvement must be listed here so Admin can see it.
FEATURE_REGISTRY: dict[str, dict] = {
    "rag_source_labels": {
        "label": "Quellen-Labels in KI-Antworten",
        "description": "Der Coach nennt Buch/Kurs, aus dem eine Antwort stammt.",
        "default_stage": "premium",
    },
    "meeting_mode": {
        "label": "Meeting-Mode (Swipe-Karten)",
        "description": "Strategie als Karten-Stack direkt vor dem Meeting.",
        "default_stage": "off",
    },
    "audio_briefing": {
        "label": "90-Sekunden-Audio-Briefing",
        "description": "Kurzes Audio-Briefing zur Strategie.",
        "default_stage": "off",
    },
}

Stage = Literal["off", "premium", "all"]


async def _stages() -> dict[str, str]:
    rows = await db.feature_rollout.find({}, {"_id": 0}).to_list(200)
    stored = {r["feature_key"]: r.get("stage", "off") for r in rows}
    return {k: stored.get(k, v["default_stage"]) for k, v in FEATURE_REGISTRY.items()}


def _is_paid(user: dict) -> bool:
    return bool(user.get("is_admin")) or (user.get("tier") in PAID_TIERS) or bool(user.get("premium"))


async def is_feature_enabled(feature_key: str, user: dict) -> bool:
    """Single source of truth for gating. Unknown keys are disabled."""
    stage = (await _stages()).get(feature_key)
    if stage == "all":
        return True
    if stage == "premium":
        return _is_paid(user)
    return False


@router.get("/features")
async def my_features(request: Request):
    """Flags for the logged-in user — what the frontend should render."""
    user = await get_current_user(request)
    stages = await _stages()
    paid = _is_paid(user)
    return {
        "premium": paid,
        "features": {
            k: (s == "all" or (s == "premium" and paid))
            for k, s in stages.items()
        },
    }


@router.get("/admin/features")
async def admin_list_features(request: Request):
    from routes.admin import require_admin
    await require_admin(request)
    stages = await _stages()
    return {
        "stages": ["off", "premium", "all"],
        "features": [
            {"feature_key": k, "stage": stages[k], **FEATURE_REGISTRY[k]}
            for k in FEATURE_REGISTRY
        ],
    }


class StageUpdate(BaseModel):
    stage: Stage


@router.put("/admin/features/{feature_key}")
async def admin_set_stage(feature_key: str, body: StageUpdate, request: Request):
    from routes.admin import require_admin
    admin = await require_admin(request)
    if feature_key not in FEATURE_REGISTRY:
        raise HTTPException(status_code=404, detail="Unbekanntes Feature")
    await db.feature_rollout.update_one(
        {"feature_key": feature_key},
        {"$set": {
            "feature_key": feature_key,
            "stage": body.stage,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": admin.get("email"),
        }},
        upsert=True,
    )
    return {"feature_key": feature_key, "stage": body.stage}
