"""Leadership LAB — eigene Anmeldung in zwei Stufen (Iter 186).

Plan Iter 186, Teil 2 (Entscheidungen 1a, 2a, 3a, 4a):
  Stufe 1 · Interesse eintragen — ohne Bezahlung, öffentlich.
  Stufe 2 · Anmeldung zum Start — nach dem Kauf: Startgruppe, Ziel, Einverständnis
            für die Live-Termine. Danach ist der Bereich im Konto freigeschaltet.

Preise und Umfang bleiben unverändert (Entscheidung 1a): Das LAB ist der Name
der bestehenden Weiterbildung (72 Folgen + Live-Calls).
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from config import db, logger
from services import get_current_user
from routes.credits import PAID_TIERS
from services_tier import resolve_user_tier

router = APIRouter(prefix="/api/lab", tags=["lab"])

LAB_NAME = "Leadership LAB"
# Entscheidung 4a: feste Startgruppen mit Datum (passt zu den Live-Calls).
START_GROUPS = [
    {"id": "2026-07-06", "label": "Gruppe Juli · Start Montag, 6. Juli 2026"},
    {"id": "2026-09-07", "label": "Gruppe September · Start Montag, 7. September 2026"},
    {"id": "2026-11-02", "label": "Gruppe November · Start Montag, 2. November 2026"},
]


class InterestIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=200)
    role: str | None = Field(None, max_length=120)
    team_size: str | None = Field(None, max_length=40)
    pain: str | None = Field(None, max_length=1000)
    start_group: str | None = Field(None, max_length=40)


class EnrollIn(BaseModel):
    start_group: str = Field(..., max_length=40)
    goal: str = Field(..., min_length=3, max_length=500)
    consent_live_calls: bool = False


@router.get("/info")
async def lab_info(request: Request) -> dict:
    """Öffentlich: Startgruppen und — wenn eingeloggt — der eigene Stand."""
    out: dict = {"name": LAB_NAME, "start_groups": START_GROUPS,
                 "episodes": 72, "live_calls": True}
    try:
        user = await get_current_user(request)
    except Exception:
        return {**out, "authenticated": False}
    tier_info = await resolve_user_tier(user)
    enrollment = await db.lab_enrollments.find_one({"user_id": user["user_id"]}, {"_id": 0})
    interest = await db.lab_interest.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {
        **out,
        "authenticated": True,
        "has_access": tier_info["tier"] in PAID_TIERS,
        "tier": tier_info["tier"],
        "interest_registered": bool(interest),
        "enrollment": enrollment,
    }


@router.post("/interest")
async def register_interest(data: InterestIn, request: Request) -> dict:
    """Stufe 1: Interesse ohne Bezahlung — Termine und Startinfos folgen."""
    user = None
    try:
        user = await get_current_user(request)
    except Exception:
        user = None
    doc = {
        "name": data.name.strip(),
        "email": data.email.strip().lower(),
        "role": (data.role or "").strip(),
        "team_size": (data.team_size or "").strip(),
        "pain": (data.pain or "").strip(),
        "start_group": data.start_group or "",
        "user_id": user["user_id"] if user else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.lab_interest.update_one({"email": doc["email"]}, {"$set": doc}, upsert=True)
    logger.info("LAB-Interesse eingetragen: %s", doc["email"])
    return {"registered": True,
            "message": "Danke — du bekommst die Termine und alle Startinfos per E-Mail."}


@router.get("/me")
async def my_lab(request: Request) -> dict:
    """Eigener Stand: Zugang, Anmeldung, nächste Live-Termine."""
    user = await get_current_user(request)
    tier_info = await resolve_user_tier(user)
    enrollment = await db.lab_enrollments.find_one({"user_id": user["user_id"]}, {"_id": 0})
    calls: list[dict] = []
    if enrollment:
        now = datetime.now(timezone.utc).isoformat()
        calls = await db.events.find(
            {"starts_at": {"$gte": now}}, {"_id": 0, "title": 1, "starts_at": 1, "join_url": 1},
        ).sort("starts_at", 1).to_list(5)
    return {
        "has_access": tier_info["tier"] in PAID_TIERS,
        "tier": tier_info["tier"],
        "enrollment": enrollment,
        "start_groups": START_GROUPS,
        "live_calls": calls,
    }


@router.post("/enroll")
async def enroll(data: EnrollIn, request: Request) -> dict:
    """Stufe 2: kurze Aufnahme nach dem Kauf — danach ist der Bereich freigeschaltet."""
    user = await get_current_user(request)
    tier_info = await resolve_user_tier(user)
    if tier_info["tier"] not in PAID_TIERS:
        raise HTTPException(
            status_code=402,
            detail={"error": "tier_required", "feature": "lab",
                    "upgrade_url": "/leadership-lab",
                    "message": f"Die Anmeldung zum {LAB_NAME} ist nach dem Kauf möglich."},
        )
    if data.start_group not in {g["id"] for g in START_GROUPS}:
        raise HTTPException(status_code=400, detail="Bitte eine Startgruppe auswählen")
    if not data.consent_live_calls:
        raise HTTPException(status_code=400, detail="Bitte den Live-Terminen zustimmen")
    doc = {
        "user_id": user["user_id"],
        "email": user.get("email"),
        "start_group": data.start_group,
        "goal": data.goal.strip(),
        "consent_live_calls": True,
        "enrolled_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.lab_enrollments.update_one({"user_id": user["user_id"]}, {"$set": doc}, upsert=True)
    return {"enrolled": True, "enrollment": doc,
            "message": f"Du bist im {LAB_NAME} angemeldet. Die Live-Termine stehen in deinem Konto."}


@router.get("/admin/interest")
async def list_interest(request: Request, limit: int = 200) -> dict:
    """Interessenliste für den Vertrieb."""
    from routes.admin import require_admin

    await require_admin(request)
    rows = await db.lab_interest.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    enrolled = await db.lab_enrollments.count_documents({})
    return {"count": len(rows), "interest": rows, "enrolled_count": enrolled}
