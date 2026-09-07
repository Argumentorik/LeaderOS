"""Credit system — core business logic.

Free users get 50 credits. After 10 uses, a soft pause prompts upgrade.
Premium users (€997+ paid) have unlimited credits.
"""
from fastapi import APIRouter, Request
from datetime import datetime, timezone
from pymongo import ReturnDocument

from config import db
from services import get_current_user

router = APIRouter(prefix="/api/credits", tags=["credits"])

FREE_CREDITS = 50
MASTERCLASS_CREDITS = 250
SOFT_PAUSE_AT = 10  # Show upsell after 10 uses
CREDIT_COSTS = {
    "chat": 1,
    "quiz": 1,
    "roleplay": 1,
    "video_mission": 1,
    "simulation": 1,
    "workflow": 1,
}


PAID_TIERS = {"standard", "accelerator", "enterprise", "plus", "starter"}


def masterclass_active(user: dict) -> bool:
    """Masterclass flag + term check — memberships expire after 6/12/18 months."""
    if not user.get("masterclass"):
        return False
    exp = user.get("masterclass_expires_at")
    if not exp:
        return True
    try:
        return datetime.fromisoformat(str(exp).replace("Z", "+00:00")) > datetime.now(timezone.utc)
    except (ValueError, TypeError):
        return True


async def check_and_deduct_credit(user: dict, action: str) -> dict:
    """Check if user has credits. Deduct 1 if free user. Returns status dict."""
    user_id = user["user_id"]

    # Premium flag, paid tier, or admin = unlimited
    if user.get("premium") or user.get("is_admin") or user.get("tier") in PAID_TIERS:
        return {"allowed": True, "remaining": -1, "is_premium": True}

    # Get or initialize credit balance
    credit_doc = await db.credits.find_one({"user_id": user_id}, {"_id": 0})
    if not credit_doc:
        initial = MASTERCLASS_CREDITS if masterclass_active(user) else FREE_CREDITS
        credit_doc = {
            "user_id": user_id,
            "balance": initial,
            "total_used": 0,
            "history": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.credits.insert_one(credit_doc)

    cost = CREDIT_COSTS.get(action, 1)

    # Atomar: Abzug nur, wenn das Guthaben im selben Schritt noch reicht (keine Race ins Minus).
    updated = await db.credits.find_one_and_update(
        {"user_id": user_id, "balance": {"$gte": cost}},
        {
            "$inc": {"balance": -cost, "total_used": cost},
            "$push": {"history": {
                "$each": [{"action": action, "cost": cost, "at": datetime.now(timezone.utc).isoformat()}],
                "$slice": -100,
            }},
        },
        projection={"_id": 0, "balance": 1},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        current = await db.credits.find_one({"user_id": user_id}, {"_id": 0, "balance": 1}) or {}
        return {"allowed": False, "remaining": max(0, current.get("balance", 0)), "is_premium": False}
    return {"allowed": True, "remaining": updated["balance"], "is_premium": False}


async def refund_credit(user_id: str) -> None:
    """Refund one deducted credit (compensation when the AI call fails)."""
    await db.credits.update_one(
        {"user_id": user_id},
        {"$inc": {"balance": 1, "total_used": -1}},
    )


@router.get("")
async def get_credits(request: Request):
    """Get user's credit balance and usage info."""
    user = await get_current_user(request)

    if user.get("premium") or user.get("is_admin") or user.get("tier") in PAID_TIERS:
        return {"balance": -1, "is_premium": True, "total_used": 0, "limit": -1, "soft_pause": False}

    is_mc = masterclass_active(user)
    limit = MASTERCLASS_CREDITS if is_mc else FREE_CREDITS
    credit_doc = await db.credits.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not credit_doc:
        return {"balance": limit, "is_premium": False, "total_used": 0, "limit": limit, "soft_pause": False, "masterclass": is_mc}

    total_used = credit_doc.get("total_used", 0)
    history = credit_doc.get("history") or []
    by_action: dict[str, int] = {}
    for h in history:
        by_action[h.get("action", "chat")] = by_action.get(h.get("action", "chat"), 0) + int(h.get("cost", 1))
    return {
        "balance": credit_doc.get("balance", 0),
        "is_premium": False,
        "total_used": total_used,
        "limit": limit,
        "masterclass": is_mc,
        # Transparenz: was kostet was, wofür ging es bisher drauf, letzte Aktionen
        "costs": CREDIT_COSTS,
        "used_by_action": by_action,
        "recent": list(reversed(history[-8:])),
        "soft_pause": total_used >= SOFT_PAUSE_AT and not credit_doc.get("soft_pause_dismissed", False) and not is_mc,
    }


@router.post("/dismiss-pause")
async def dismiss_soft_pause(request: Request):
    """Dismiss the soft pause upsell so user can continue."""
    user = await get_current_user(request)
    await db.credits.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"soft_pause_dismissed": True}},
        upsert=True,
    )
    return {"dismissed": True}


@router.post("/reset")
async def reset_credits(request: Request):
    """Reset caller's credits to FREE_CREDITS. SEC-001: admin only."""
    from routes.admin import require_admin
    user = await require_admin(request)
    await db.credits.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"balance": FREE_CREDITS, "total_used": 0}},
        upsert=True,
    )
    return {"balance": FREE_CREDITS, "message": "Credits reset"}
