"""Credit system — core business logic.

Free users get 50 credits. After 10 uses, a soft pause prompts upgrade.
Premium users (€997+ paid) have unlimited credits.
"""
from fastapi import APIRouter, Request
from datetime import datetime, timezone

from config import db
from services import get_current_user

router = APIRouter(prefix="/api/credits", tags=["credits"])

FREE_CREDITS = 50
SOFT_PAUSE_AT = 10  # Show upsell after 10 uses
CREDIT_COSTS = {
    "chat": 1,
    "quiz": 1,
    "roleplay": 1,
    "video_mission": 1,
    "simulation": 1,
    "workflow": 1,
}


async def check_and_deduct_credit(user: dict, action: str) -> dict:
    """Check if user has credits. Deduct 1 if free user. Returns status dict."""
    user_id = user["user_id"]

    # Premium users = unlimited
    if user.get("premium"):
        return {"allowed": True, "remaining": -1, "is_premium": True}

    # Get or initialize credit balance
    credit_doc = await db.credits.find_one({"user_id": user_id}, {"_id": 0})
    if not credit_doc:
        credit_doc = {
            "user_id": user_id,
            "balance": FREE_CREDITS,
            "total_used": 0,
            "history": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.credits.insert_one(credit_doc)

    balance = credit_doc.get("balance", 0)
    cost = CREDIT_COSTS.get(action, 1)

    if balance < cost:
        return {"allowed": False, "remaining": balance, "is_premium": False}

    # Deduct
    await db.credits.update_one(
        {"user_id": user_id},
        {
            "$inc": {"balance": -cost, "total_used": cost},
            "$push": {"history": {
                "$each": [{"action": action, "cost": cost, "at": datetime.now(timezone.utc).isoformat()}],
                "$slice": -100,
            }},
        },
    )
    return {"allowed": True, "remaining": balance - cost, "is_premium": False}


async def has_credit(user: dict, action: str) -> bool:
    """Nur prüfen, nichts abziehen — für Aktionen, die erst bei Erfolg kosten
    (Video-Analyse: erst Whisper + KI, dann check_and_deduct_credit)."""
    if user.get("premium"):
        return True
    credit_doc = await db.credits.find_one({"user_id": user["user_id"]}, {"_id": 0, "balance": 1})
    balance = credit_doc.get("balance", 0) if credit_doc else FREE_CREDITS
    return balance >= CREDIT_COSTS.get(action, 1)


@router.get("")
async def get_credits(request: Request):
    """Get user's credit balance and usage info."""
    user = await get_current_user(request)

    if user.get("premium"):
        return {"balance": -1, "is_premium": True, "total_used": 0, "limit": -1, "soft_pause": False}

    credit_doc = await db.credits.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not credit_doc:
        return {"balance": FREE_CREDITS, "is_premium": False, "total_used": 0, "limit": FREE_CREDITS, "soft_pause": False}

    total_used = credit_doc.get("total_used", 0)
    return {
        "balance": credit_doc.get("balance", 0),
        "is_premium": False,
        "total_used": total_used,
        "limit": FREE_CREDITS,
        "soft_pause": total_used >= SOFT_PAUSE_AT and not credit_doc.get("soft_pause_dismissed", False),
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
    """Reset user credits to FREE_CREDITS (admin/debug)."""
    user = await get_current_user(request)
    await db.credits.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"balance": FREE_CREDITS, "total_used": 0}},
        upsert=True,
    )
    return {"balance": FREE_CREDITS, "message": "Credits reset"}
