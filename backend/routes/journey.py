from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from config import db
from services import get_current_user
from services_journey import build_journey

router = APIRouter(prefix="/api/journey", tags=["journey"])


@router.get("")
async def get_journey(request: Request):
    user = await get_current_user(request)
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "role": 1, "primary_goal": 1, "wladhub_scores": 1, "created_at": 1, "onboarding_completed_at": 1, "journey_progress": 1})
    return build_journey(fresh or user)


@router.post("/complete/{day}")
async def complete_journey_day(day: int, request: Request):
    if not 1 <= day <= 7:
        raise HTTPException(status_code=400, detail="Tag muss zwischen 1 und 7 liegen.")
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$addToSet": {"journey_progress.done_days": day}, "$set": {"journey_progress.updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return build_journey(fresh)
