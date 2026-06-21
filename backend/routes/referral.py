"""Referral System — Billion-dollar level viral growth engine."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import hashlib
from datetime import datetime, timezone

from config import db, logger
from services import get_current_user
from services_actions import record_user_action

router = APIRouter(prefix="/api/referral", tags=["referral"])

# Tier system
TIERS = [
    {"name": "Starter", "min_refs": 0, "reward": "Badge", "xp_bonus": 0},
    {"name": "Connector", "min_refs": 3, "reward": "Premium 7 Tage kostenlos", "xp_bonus": 50},
    {"name": "Influencer", "min_refs": 10, "reward": "Premium 30 Tage + Zertifikat", "xp_bonus": 200},
    {"name": "Ambassador", "min_refs": 25, "reward": "Premium 90 Tage + 1:1 Call", "xp_bonus": 500},
    {"name": "Legend", "min_refs": 100, "reward": "Lifetime Premium + VIP Community", "xp_bonus": 2000},
]


def generate_referral_code(user_id: str) -> str:
    h = hashlib.sha256(user_id.encode()).hexdigest()[:6].upper()
    return f"WLAD-{h}"


def get_tier(count: int) -> dict:
    tier = TIERS[0]
    for t in TIERS:
        if count >= t["min_refs"]:
            tier = t
    return tier


@router.get("/code")
async def get_referral_code(request: Request):
    """Get or create user's unique referral code."""
    user = await get_current_user(request)
    existing = await db.referral_codes.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if existing:
        code = existing["code"]
    else:
        code = generate_referral_code(user["user_id"])
        await db.referral_codes.insert_one({
            "code": code, "user_id": user["user_id"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    ref_count = await db.referral_uses.count_documents({"referrer_id": user["user_id"]})
    tier = get_tier(ref_count)
    next_tier = None
    for t in TIERS:
        if t["min_refs"] > ref_count:
            next_tier = t
            break

    # Iter 92.27: referrals deliberately route to the FUNNEL domain (leadercheck.de),
    # not the auth app — referred users should hit the quiz first to maximize conversion.
    # Env var `REFERRAL_FUNNEL_URL` lets ops swap funnel domains without code changes.
    _funnel = (os.environ.get("REFERRAL_FUNNEL_URL") or "https://leadercheck.de").rstrip("/")
    return {
        "code": code,
        "share_url": f"{_funnel}?ref={code}",
        "referral_count": ref_count,
        "tier": tier,
        "next_tier": next_tier,
        "tiers": TIERS,
    }


@router.post("/use/{code}")
async def use_referral_code(code: str, request: Request):
    """Track when a new user signs up with a referral code."""
    user = await get_current_user(request)
    ref = await db.referral_codes.find_one({"code": code.upper()}, {"_id": 0})
    if not ref:
        raise HTTPException(status_code=404, detail="Ungültiger Referral-Code")
    if ref["user_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="Du kannst deinen eigenen Code nicht nutzen")

    existing = await db.referral_uses.find_one({"referred_id": user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Du hast bereits einen Referral-Code genutzt")

    await db.referral_uses.insert_one({
        "use_id": f"ref_{uuid.uuid4().hex[:12]}",
        "referrer_id": ref["user_id"],
        "referred_id": user["user_id"],
        "code": code.upper(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Reward referrer
    await record_user_action(ref["user_id"], "referral_success", metadata={"referred": user["user_id"]})
    # Reward referred user
    await record_user_action(user["user_id"], "referral_used", metadata={"referrer": ref["user_id"]})

    ref_count = await db.referral_uses.count_documents({"referrer_id": ref["user_id"]})
    tier = get_tier(ref_count)

    # Check tier upgrade
    await db.users.update_one({"user_id": ref["user_id"]}, {"$set": {"referral_tier": tier["name"]}})

    return {"message": "Referral-Code erfolgreich eingelöst!", "xp_earned": 10}


@router.get("/leaderboard")
async def referral_leaderboard(request: Request):
    """Top referrers leaderboard."""
    await get_current_user(request)
    pipeline = [
        {"$group": {"_id": "$referrer_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20},
    ]
    results = await db.referral_uses.aggregate(pipeline).to_list(20)
    leaderboard = []
    for r in results:
        user = await db.users.find_one({"user_id": r["_id"]}, {"_id": 0, "name": 1, "level": 1})
        if user:
            leaderboard.append({
                "name": user.get("name", "Leader"),
                "level": user.get("level", ""),
                "referrals": r["count"],
                "tier": get_tier(r["count"])["name"],
            })
    return leaderboard


class ShareAction(BaseModel):
    platform: str  # linkedin, instagram, twitter, whatsapp
    content_type: str  # leader_score, certificate, referral


@router.post("/share")
async def track_share(data: ShareAction, request: Request):
    """Track social sharing for gamification."""
    user = await get_current_user(request)
    await db.social_shares.insert_one({
        "share_id": f"share_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "platform": data.platform,
        "content_type": data.content_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await record_user_action(user["user_id"], "social_share", metadata={"platform": data.platform})
    return {"message": "Share erfolgreich!", "xp_earned": 15}


@router.get("/certificate")
async def get_certificate_data(request: Request):
    """Get user's certificate data for sharing."""
    user = await get_current_user(request)
    ref_count = await db.referral_uses.count_documents({"referrer_id": user["user_id"]})
    completed_sims = await db.simulations.count_documents({"user_id": user["user_id"], "status": "completed"})
    completed_challenges = await db.challenges.count_documents({"user_id": user["user_id"], "status": "completed"})

    return {
        "name": user.get("name", "Leader"),
        "position": user.get("position", ""),
        "company": user.get("company", ""),
        "level": user.get("level", "Emerging Leader"),
        "xp": user.get("xp", 0),
        "leadership_score": user.get("leadership_score", 0),
        "eq_score": user.get("eq_score", 0),
        "communication_score": user.get("communication_score", 0),
        "simulations_completed": completed_sims,
        "challenges_completed": completed_challenges,
        "referral_tier": get_tier(ref_count)["name"],
        "member_since": user.get("created_at", ""),
    }
