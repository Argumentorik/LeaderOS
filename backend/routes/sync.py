"""Inbound sync from Supabase — receives subscription + user events and updates Mongo.

Security: every request must include `X-Sync-Secret: <INBOUND_SYNC_SECRET>`.
Comparison is timing-safe via `secrets.compare_digest`.

Endpoints:
- POST /api/internal/sync/subscription-updated  → update user's plan/tier in Mongo
- POST /api/internal/sync/user-created          → create/upsert user (e.g. from Supabase Auth)
"""
import os
import secrets as pysecrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field

from config import db, logger
from services_tier import activate_tier, TIER_CONFIG

router = APIRouter(prefix="/api/internal/sync", tags=["internal-sync"])

INBOUND_SECRET = os.environ.get("INBOUND_SYNC_SECRET", "").strip()

# Map Supabase plan names → internal tier IDs (passthrough fallback)
PLAN_TO_TIER = {
    "leadership_os": "standard",
    "leadership_os_plus": "accelerator",
    "leadership_os_enterprise": "enterprise",
    "free": "free",
    # Aliases for flexibility
    "standard": "standard",
    "accelerator": "accelerator",
    "enterprise": "enterprise",
}


def _verify_secret(header_value: Optional[str]) -> None:
    """Timing-safe shared-secret check. Raises 401 on mismatch."""
    if not INBOUND_SECRET:
        logger.error("INBOUND_SYNC_SECRET not configured — refusing inbound sync")
        raise HTTPException(status_code=503, detail="Sync not configured")
    if not header_value or not pysecrets.compare_digest(header_value, INBOUND_SECRET):
        raise HTTPException(status_code=401, detail="Invalid sync secret")


async def _is_duplicate_event(event_id: Optional[str]) -> bool:
    """Idempotency check via db.sync_events. Returns True if already processed."""
    if not event_id:
        return False
    existing = await db.sync_events.find_one(
        {"event_id": event_id, "direction": "inbound"},
        {"_id": 0, "event_id": 1},
    )
    return bool(existing)


async def _log_inbound(event_id: Optional[str], event: str, mongo_user_id: Optional[str], success: bool, error: Optional[str] = None) -> None:
    """Persist inbound sync receipt for replay protection + audit trail."""
    record = {
        "event_id": event_id or f"inbound_unkn_{datetime.now(timezone.utc).timestamp()}",
        "direction": "inbound",
        "event": event,
        "mongo_user_id": mongo_user_id,
        "success": success,
        "error": error,
        "received_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await db.sync_events.update_one(
            {"event_id": record["event_id"]},
            {"$set": record},
            upsert=True,
        )
    except Exception as e:
        logger.warning(f"inbound sync log failed: {e}")


# ── Schemas ──────────────────────────────────────────────────────────────


class SubscriptionUpdatePayload(BaseModel):
    event_id: Optional[str] = None
    mongo_user_id: Optional[str] = None
    email: Optional[str] = None
    plan: str = Field(..., description="Plan name, e.g. 'leadership_os' or 'leadership_os_plus'")
    active: bool = True
    via_installment: bool = False
    installment_plan_id: Optional[str] = None
    expires_at: Optional[str] = None


class UserCreatedPayload(BaseModel):
    event_id: Optional[str] = None
    supabase_user_id: Optional[str] = None
    email: str
    full_name: Optional[str] = None
    plan: Optional[str] = "free"


# ── Endpoints ────────────────────────────────────────────────────────────


@router.post("/subscription-updated")
async def subscription_updated(
    payload: SubscriptionUpdatePayload,
    request: Request,
    x_sync_secret: Optional[str] = Header(default=None, alias="X-Sync-Secret"),
):
    """Supabase notifies us that a user's subscription/plan changed.

    Looks up the user by mongo_user_id first, then by email. Resolves the plan
    to an internal tier and re-activates with the correct duration + credits.
    """
    _verify_secret(x_sync_secret)

    if await _is_duplicate_event(payload.event_id):
        return {"status": "duplicate", "event_id": payload.event_id}

    # Locate the user
    user = None
    if payload.mongo_user_id:
        user = await db.users.find_one({"user_id": payload.mongo_user_id}, {"_id": 0, "user_id": 1, "email": 1})
    if not user and payload.email:
        user = await db.users.find_one(
            {"email": payload.email.strip().lower()},
            {"_id": 0, "user_id": 1, "email": 1},
            collation={"locale": "en", "strength": 2},
        )
    if not user:
        await _log_inbound(payload.event_id, "subscription_updated", None, False, "user_not_found")
        raise HTTPException(status_code=404, detail="user_not_found")

    tier = PLAN_TO_TIER.get(payload.plan.lower(), payload.plan.lower())
    if tier not in TIER_CONFIG:
        await _log_inbound(payload.event_id, "subscription_updated", user["user_id"], False, f"unknown_tier:{tier}")
        raise HTTPException(status_code=400, detail=f"Unknown plan/tier: {payload.plan}")

    # If subscription cancelled/inactive → downgrade to free
    target_tier = tier if payload.active else "free"

    await activate_tier(
        user["user_id"],
        target_tier,
        via_installment=payload.via_installment,
        installment_plan_id=payload.installment_plan_id,
    )

    # Allow Supabase to override expires_at (e.g. for partial-month upgrades)
    if payload.expires_at:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"tier_expires_at": payload.expires_at, "premium_expires_at": payload.expires_at}},
        )

    await _log_inbound(payload.event_id, "subscription_updated", user["user_id"], True)
    logger.info(f"[supabase-sync] tier={target_tier} applied to user={user['user_id']} via {payload.plan}")
    return {"status": "ok", "user_id": user["user_id"], "tier": target_tier, "event_id": payload.event_id}


@router.post("/user-created")
async def user_created(
    payload: UserCreatedPayload,
    request: Request,
    x_sync_secret: Optional[str] = Header(default=None, alias="X-Sync-Secret"),
):
    """Supabase notifies us that a user was created in their Auth system.

    Upserts a minimal user record in Mongo with `auth_provider='supabase'`.
    Does NOT create a password — Supabase remains the auth source-of-truth.
    """
    _verify_secret(x_sync_secret)

    if await _is_duplicate_event(payload.event_id):
        return {"status": "duplicate", "event_id": payload.event_id}

    email = payload.email.strip().lower()
    existing = await db.users.find_one(
        {"email": email},
        {"_id": 0, "user_id": 1},
        collation={"locale": "en", "strength": 2},
    )

    if existing:
        # Already in Mongo — just link Supabase ID + bump updated_at
        await db.users.update_one(
            {"user_id": existing["user_id"]},
            {"$set": {
                "supabase_user_id": payload.supabase_user_id,
                "auth_provider_linked": "supabase",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        await _log_inbound(payload.event_id, "user_created", existing["user_id"], True)
        return {"status": "linked", "user_id": existing["user_id"], "event_id": payload.event_id}

    # Create fresh shell user (no password — Supabase-auth-only profile)
    import uuid as _uuid
    user_id = f"user_{_uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    new_user = {
        "user_id": user_id,
        "email": email,
        "name": (payload.full_name or "").strip() or email.split("@")[0],
        "auth_provider": "supabase",
        "supabase_user_id": payload.supabase_user_id,
        "tier": "free",
        "premium": False,
        "xp": 0,
        "level": "Emerging Leader",
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    await db.users.insert_one(new_user)

    # Apply initial plan if provided
    initial_tier = PLAN_TO_TIER.get((payload.plan or "free").lower(), "free")
    if initial_tier in TIER_CONFIG and initial_tier != "free":
        await activate_tier(user_id, initial_tier)

    await _log_inbound(payload.event_id, "user_created", user_id, True)
    logger.info(f"[supabase-sync] new user {user_id} via Supabase (plan={initial_tier})")
    return {"status": "created", "user_id": user_id, "tier": initial_tier, "event_id": payload.event_id}


@router.get("/health")
async def sync_health(x_sync_secret: Optional[str] = Header(default=None, alias="X-Sync-Secret")) -> dict:
    """Quick health probe so Supabase team can verify connectivity + secret."""
    _verify_secret(x_sync_secret)
    return {
        "status": "ok",
        "service": "leaderos.de internal sync",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
