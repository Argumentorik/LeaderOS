"""WladHub Integration - Real Supabase connection + Import + Sync."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import uuid
import os
import httpx
from datetime import datetime, timezone

from config import db, logger
from services import get_current_user, update_user_scores
from services_actions import record_user_action

router = APIRouter(prefix="/api/wladhub", tags=["wladhub"])


def _get_supabase_config():
    """Lazy-load Supabase config to ensure dotenv is loaded first."""
    return os.environ.get("SUPABASE_URL", ""), os.environ.get("SUPABASE_SERVICE_KEY", "")


# ========== MODELS ==========

class WladHubDiagnosis(BaseModel):
    ki_kompetenz: int = 0
    boardroom_rhetorik: int = 0
    strategisches_eq: int = 0
    overall_score: int = 0
    strengths: list = []
    improvements: list = []
    action_plan: list = []
    roi_forecast: Optional[str] = None
    diagnosis_date: Optional[str] = None
    fuehrungsdimensionen: Optional[dict] = None
    layer_scores: Optional[dict] = None
    aktionsplan_30_tage: Optional[list] = None
    leader_typ: Optional[str] = None


class WladHubSyncRequest(BaseModel):
    wladhub_email: Optional[str] = None
    sync_scores: bool = True
    sync_action_plan: bool = True


class OnboardingData(BaseModel):
    role: Optional[str] = None
    team_size: Optional[str] = None
    primary_goal: Optional[str] = None
    experience_level: Optional[str] = None
    has_wladhub_diagnosis: bool = False
    # Iter 92.45 (Mert · Riverside-style): where did the user hear about
    # Leader-OS? Feeds marketing attribution + `source_platform` refinement.
    heard_from: Optional[str] = None


# ========== SUPABASE HELPERS ==========

async def _resolve_supabase_user_id(client: httpx.AsyncClient, supabase_url: str, service_key: str, email: str) -> str | None:
    """Resolve the Supabase auth user id for an email (paginated, max 1000 users)."""
    email_l = (email or "").lower()
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}
    for page in range(1, 6):
        resp = await client.get(
            f"{supabase_url}/auth/v1/admin/users",
            headers=headers,
            params={"page": page, "per_page": 200},
        )
        if resp.status_code != 200:
            break
        users = resp.json().get("users", [])
        for u in users:
            if (u.get("email") or "").lower() == email_l:
                return u["id"]
        if len(users) < 200:
            break
    return None


async def _fetch_supabase_insights(user_email: str) -> list:
    """Fetch leadership_insights from Supabase for a given user email.

    Iter 92.62 SECURITY FIX: if the email has no Supabase account we return []
    — NEVER fall back to an unfiltered query (that leaked other users' data).
    """
    supabase_url, service_key = _get_supabase_config()
    if not supabase_url or not service_key:
        return []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # leadercheck.de schreibt insights mit der public.users-id → diese
            # per E-Mail auflösen (Iter 92.63d); Auth-id nur als Fallback.
            headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}
            pub = await client.get(
                f"{supabase_url}/rest/v1/users",
                headers=headers,
                params={"select": "id", "email_lower": f"eq.{(user_email or '').lower()}", "limit": "1"},
            )
            rows = pub.json() if pub.status_code == 200 else []
            supabase_user_id = rows[0]["id"] if rows else None
            if not supabase_user_id:
                supabase_user_id = await _resolve_supabase_user_id(client, supabase_url, service_key, user_email)
            if not supabase_user_id:
                logger.info(f"Supabase: no account for {user_email} — skipping insights fetch")
                return []
            query = (
                f"{supabase_url}/rest/v1/leadership_insights"
                f"?select=*&order=assessed_at.desc&limit=5&user_id=eq.{supabase_user_id}"
            )
            resp = await client.get(query, headers=headers)
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        logger.error(f"Supabase fetch error: {e}")
    return []


async def _write_supabase_insight(user_id: str, campaign_id: str, scores: dict):
    """Write leadership insight back to Supabase."""
    supabase_url, service_key = _get_supabase_config()
    if not supabase_url or not service_key:
        logger.error(f"Supabase not configured: url={bool(supabase_url)}, key={bool(service_key)}")
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{supabase_url}/rest/v1/leadership_insights",
                headers={
                    "apikey": service_key, "Authorization": f"Bearer {service_key}",
                    "Content-Type": "application/json", "Prefer": "return=minimal",
                },
                json={
                    "user_id": user_id, "campaign_id": campaign_id,
                    "ki_score": scores.get("ki_kompetenz", 0),
                    "rhetoric_score": scores.get("boardroom_rhetorik", 0),
                    "eq_score": scores.get("strategisches_eq", 0),
                    "action_plan": scores.get("action_plan") or {},
                    "plan_status": "active",
                    "assessed_at": datetime.now(timezone.utc).isoformat(),
                },
            )
            if resp.status_code in (200, 201):
                logger.info(f"Supabase write OK: status={resp.status_code}")
                return True
            logger.error(f"Supabase write FAILED: status={resp.status_code} body={resp.text[:300]}")
            return False
    except Exception as e:
        logger.error(f"Supabase write error: {e}")
    return False


async def _save_diagnosis_to_mongo(user_id: str, scores: dict, source: str = "manual"):
    """Save diagnosis data to MongoDB and update user profile."""
    diagnosis_doc = {
        "diagnosis_id": f"diag_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "ki_kompetenz": min(scores.get("ki_kompetenz", 0), 100),
        "boardroom_rhetorik": min(scores.get("boardroom_rhetorik", 0), 100),
        "strategisches_eq": min(scores.get("strategisches_eq", 0), 100),
        "overall_score": min(scores.get("overall_score", 0), 100),
        "strengths": scores.get("strengths", []),
        "improvements": scores.get("improvements", []),
        "action_plan": scores.get("action_plan", []),
        "roi_forecast": scores.get("roi_forecast"),
        "diagnosis_date": scores.get("diagnosis_date") or datetime.now(timezone.utc).date().isoformat(),
        "imported_at": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "fuehrungsdimensionen": scores.get("fuehrungsdimensionen"),
        "layer_scores": scores.get("layer_scores"),
        "aktionsplan_30_tage": scores.get("aktionsplan_30_tage"),
        "leader_typ": scores.get("leader_typ"),
    }

    existing = await db.wladhub_diagnoses.find_one({"user_id": user_id}, {"_id": 0})
    if existing:
        await db.wladhub_diagnoses.update_one({"user_id": user_id}, {"$set": diagnosis_doc})
    else:
        await db.wladhub_diagnoses.insert_one(diagnosis_doc)
    # motor.insert_one mutates the dict to include ObjectId `_id` — strip it
    # so the endpoint response stays JSON-serializable.
    diagnosis_doc.pop("_id", None)

    await db.users.update_one({"user_id": user_id}, {"$set": {
        "wladhub_connected": True,
        "wladhub_scores": {
            "ki_kompetenz": diagnosis_doc["ki_kompetenz"],
            "boardroom_rhetorik": diagnosis_doc["boardroom_rhetorik"],
            "strategisches_eq": diagnosis_doc["strategisches_eq"],
            "overall_score": diagnosis_doc["overall_score"],
        },
        "wladhub_leader_typ": scores.get("leader_typ"),
        "wladhub_last_sync": datetime.now(timezone.utc).isoformat(),
    }})

    return diagnosis_doc


# ========== ENDPOINTS ==========

@router.post("/import")
async def import_wladhub_diagnosis(data: WladHubDiagnosis, request: Request):
    """Import diagnosis results from WladHub into the user's profile."""
    user = await get_current_user(request)
    diagnosis_doc = await _save_diagnosis_to_mongo(user["user_id"], data.dict(), source="manual_import")

    await record_user_action(
        user["user_id"],
        "wladhub_diagnosis_imported",
        leadership_bonus=max(1, data.overall_score // 20),
        eq_bonus=max(1, data.strategisches_eq // 25),
        comm_bonus=max(1, data.boardroom_rhetorik // 25),
        metadata={"overall_score": data.overall_score},
    )

    return {"message": "WladHub-Diagnose erfolgreich importiert", "diagnosis": diagnosis_doc}


@router.get("/diagnosis")
async def get_wladhub_diagnosis(request: Request):
    """Get user's WladHub diagnosis data."""
    user = await get_current_user(request)
    diagnosis = await db.wladhub_diagnoses.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if diagnosis:
        diagnosis["connected"] = True
        return diagnosis
    return {"connected": False}


def _derive_scores_from_activity(user: dict) -> tuple[int, int, int, int]:
    """Compute 3-Layer scores from LeaderOS activity when WladHub diagnosis is absent."""
    ls = user.get("leadership_score", 0)
    eq = user.get("eq_score", 0)
    comm = user.get("communication_score", 0)
    xp = user.get("xp", 0)
    ki_score = min(100, max(0, int(ls * 0.5 + xp * 0.02)))
    rhetorik_score = min(100, max(0, int(comm * 0.7 + ls * 0.3)))
    eq_score = min(100, max(0, int(eq * 0.8 + comm * 0.2)))
    overall = min(100, int(ki_score * 0.35 + rhetorik_score * 0.35 + eq_score * 0.30))
    return ki_score, rhetorik_score, eq_score, overall


def _build_strengths(ls: int, eq: int, comm: int) -> list[str]:
    strengths: list[str] = []
    if ls >= 40:
        strengths.append("Strategisches Denken" if ls >= 60 else "Wachsendes Leadership-Bewusstsein")
    if eq >= 40:
        strengths.append("Emotionale Intelligenz" if eq >= 60 else "Empathie-Grundlagen vorhanden")
    if comm >= 40:
        strengths.append("Klare Kommunikation" if comm >= 60 else "Kommunikationsbasis solide")
    if not strengths:
        strengths.append("Du bist auf dem Weg — jede Challenge stärkt dein Profil")
    return strengths


def _build_improvements(ls: int, eq: int, comm: int, xp: int) -> list[str]:
    improvements: list[str] = []
    if ls < 40:
        improvements.append("Strategische Vision entwickeln — nutze den KI-Coach für Strategie-Szenarien")
    if eq < 40:
        improvements.append("Emotionale Intelligenz stärken — starte mit dem täglichen Check-in")
    if comm < 40:
        improvements.append("Kommunikationsstärke aufbauen — probiere den Boardroom-Rhetorik Workflow")
    if xp < 200:
        improvements.append("Mehr Aktivität — jede Aktion in LeaderOS stärkt dein Profil")
    return improvements


@router.get("/3layer")
async def get_three_layer_score(request: Request) -> dict:
    """Get the WladHub 3-Layer Score for dashboard display.
    If no WladHub diagnosis exists, compute scores from LeaderOS activity data."""
    user = await get_current_user(request)
    scores = user.get("wladhub_scores", {})
    diagnosis = await db.wladhub_diagnoses.find_one({"user_id": user["user_id"]}, {"_id": 0})

    # If user has WladHub diagnosis, use it directly
    if diagnosis and scores.get("overall_score", 0) > 0:
        return {
            "connected": True,
            "ki_kompetenz": scores.get("ki_kompetenz", 0),
            "boardroom_rhetorik": scores.get("boardroom_rhetorik", 0),
            "strategisches_eq": scores.get("strategisches_eq", 0),
            "overall_score": scores.get("overall_score", 0),
            "leader_typ": user.get("wladhub_leader_typ"),
            "last_sync": user.get("wladhub_last_sync"),
            "strengths": diagnosis.get("strengths", []),
            "improvements": diagnosis.get("improvements", []),
            "action_plan": diagnosis.get("aktionsplan_30_tage") or diagnosis.get("action_plan", []),
            "roi_forecast": diagnosis.get("roi_forecast"),
            "source": "wladhub",
        }

    # No WladHub diagnosis — compute from LeaderOS activity
    ki_score, rhetorik_score, eq_score, overall = _derive_scores_from_activity(user)
    ls = user.get("leadership_score", 0)
    eq = user.get("eq_score", 0)
    comm = user.get("communication_score", 0)
    xp = user.get("xp", 0)

    return {
        "connected": False,
        "ki_kompetenz": ki_score,
        "boardroom_rhetorik": rhetorik_score,
        "strategisches_eq": eq_score,
        "overall_score": overall,
        "leader_typ": user.get("level", "Emerging Leader"),
        "last_sync": None,
        "strengths": _build_strengths(ls, eq, comm),
        "improvements": _build_improvements(ls, eq, comm, xp),
        "action_plan": [],
        "roi_forecast": None,
        "source": "leaderos_computed",
    }


@router.post("/sync")
async def sync_wladhub_data(data: WladHubSyncRequest, request: Request):
    """Sync data from Supabase WladHub database into LeaderOS."""
    user = await get_current_user(request)
    # SEC-002: always sync the caller's own verified account email — a
    # client-supplied email would allow reading other people's diagnoses.
    email = user.get("email", "")

    # Log the sync attempt
    await db.wladhub_sync_log.insert_one({
        "sync_id": f"sync_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "wladhub_email": email,
        "status": "started",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Fetch from Supabase
    insights = await _fetch_supabase_insights(email)

    if not insights:
        # Check if we already have local data
        local = await db.wladhub_diagnoses.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if local:
            return {
                "status": "local_data",
                "message": "Keine neuen Supabase-Daten gefunden, lokale Diagnose vorhanden",
                "has_diagnosis": True,
                "last_sync": user.get("wladhub_last_sync"),
            }
        return {
            "status": "no_data",
            "message": "Noch keine Leader-Diagnose gefunden. Starte die kostenlose Diagnose auf leader-check.de",
            "wladhub_url": "https://leader-check.de",
            "has_diagnosis": False,
        }

    # Import the most recent insight
    latest = insights[0]
    scores = {
        "ki_kompetenz": int(latest.get("ki_score", 0)),
        "boardroom_rhetorik": int(latest.get("rhetoric_score", 0)),
        "strategisches_eq": int(latest.get("eq_score", 0)),
        "overall_score": int(latest.get("composite_score", 0)),
        "action_plan": latest.get("action_plan", []),
    }

    diagnosis_doc = await _save_diagnosis_to_mongo(user["user_id"], scores, source="supabase_sync")
    logger.info(f"Supabase sync: imported {len(insights)} insights for {user['user_id']}, diagnosis={diagnosis_doc.get('diagnosis_id')}")

    await record_user_action(
        user["user_id"],
        "wladhub_supabase_synced",
        metadata={"source": "supabase", "overall": scores["overall_score"]},
    )

    # Update sync log
    await db.wladhub_sync_log.update_one(
        {"user_id": user["user_id"], "status": "started"},
        {"$set": {"status": "completed", "records_imported": len(insights)}},
    )

    return {
        "status": "synced",
        "message": f"WladHub-Daten erfolgreich importiert ({len(insights)} Einträge)",
        "has_diagnosis": True,
        "scores": scores,
        "last_sync": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/push-to-supabase")
async def push_scores_to_supabase(request: Request):
    """Push LeaderOS scores back to Supabase for cross-platform sync.

    Iter 92.62 FK-FIX: use the REAL Supabase auth user id (resolved by email,
    auto-created if missing) instead of a SHA256-derived UUID that violated
    the leadership_insights.user_id foreign key.
    """
    user = await get_current_user(request)
    scores = user.get("wladhub_scores", {})
    if not scores:
        raise HTTPException(status_code=400, detail="No WladHub scores to push")

    supabase_url, service_key = _get_supabase_config()
    if not supabase_url or not service_key:
        raise HTTPException(status_code=502, detail="Supabase not configured")

    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=15) as client:
        # Iter 92.63d: leadership_insights.user_id → public.users.id. Die Zeile
        # kann bereits mit EIGENER id existieren (Auth-Trigger/CRM-Mirror) →
        # IMMER zuerst per E-Mail auflösen, nur bei Fehlen anlegen.
        insight_uid = None
        pub = await client.get(
            f"{supabase_url}/rest/v1/users",
            headers=headers,
            params={"select": "id", "email_lower": f"eq.{user['email'].lower()}", "limit": "1"},
        )
        rows = pub.json() if pub.status_code == 200 else []
        if rows:
            insight_uid = rows[0]["id"]
        else:
            sb_uid = await _resolve_supabase_user_id(client, supabase_url, service_key, user["email"])
            if not sb_uid:
                create = await client.post(
                    f"{supabase_url}/auth/v1/admin/users",
                    headers=headers,
                    json={"email": user["email"], "email_confirm": True},
                )
                if create.status_code in (200, 201):
                    sb_uid = create.json().get("id")
                else:
                    logger.error(f"Supabase user create failed: {create.status_code} {create.text[:200]}")
            if sb_uid:
                mirror = await client.post(
                    f"{supabase_url}/rest/v1/users",
                    headers={**headers, "Prefer": "return=representation"},
                    json={
                        "id": sb_uid,
                        "email": user["email"],
                        "source_platform": "leader-os",
                    },
                )
                if mirror.status_code in (200, 201):
                    insight_uid = sb_uid
                else:
                    logger.error(f"Supabase public.users mirror failed: {mirror.status_code} {mirror.text[:200]}")
                    # Race/Trigger kann die Zeile inzwischen angelegt haben → re-lookup
                    pub2 = await client.get(
                        f"{supabase_url}/rest/v1/users",
                        headers=headers,
                        params={"select": "id", "email_lower": f"eq.{user['email'].lower()}", "limit": "1"},
                    )
                    rows2 = pub2.json() if pub2.status_code == 200 else []
                    if rows2:
                        insight_uid = rows2[0]["id"]
        if not insight_uid:
            raise HTTPException(status_code=409, detail="Kein leadercheck.de-Konto für diese E-Mail — Push nicht möglich")

    success = await _write_supabase_insight(
        user_id=insight_uid,
        campaign_id=f"leaderos_{datetime.now(timezone.utc).strftime('%Y%m%d')}",
        scores=scores,
    )

    if success:
        return {"message": "Scores erfolgreich zu WladHub gepusht", "status": "success"}
    # 409 statt 502: Cloudflare ersetzt 5xx durch eigene HTML-Seite und
    # verschluckt das JSON-Detail. Fehlkonfiguration ist ein Konflikt, kein Gateway-Fehler.
    raise HTTPException(status_code=409, detail="Supabase write failed — siehe Backend-Log (leadership_insights)")


@router.get("/supabase-status")
async def check_supabase_status(request: Request):
    """Check if Supabase connection is configured and working."""
    await get_current_user(request)
    supabase_url, service_key = _get_supabase_config()
    configured = bool(supabase_url and service_key)
    if not configured:
        return {"connected": False, "reason": "Supabase not configured"}

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                f"{supabase_url}/rest/v1/leadership_insights?select=count&limit=0",
                headers={"apikey": service_key, "Authorization": f"Bearer {service_key}", "Prefer": "count=exact"},
            )
            return {"connected": resp.status_code in (200, 206), "table": "leadership_insights", "status": "online" if resp.status_code in (200, 206) else f"error_{resp.status_code}"}
    except Exception as e:
        return {"connected": False, "reason": str(e)}


@router.post("/onboarding")
async def save_onboarding_data(data: OnboardingData, request: Request):
    """Save user's onboarding preferences and goals."""
    user = await get_current_user(request)
    update_fields = {
        "onboarding_completed": True,
        "role": data.role,
        "team_size": data.team_size,
        "primary_goal": data.primary_goal,
        "experience_level": data.experience_level,
        "has_wladhub_diagnosis": data.has_wladhub_diagnosis,
    }
    # Iter 92.45: persist marketing attribution (Riverside pattern)
    if data.heard_from:
        update_fields["heard_from"] = data.heard_from
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_fields})
    await record_user_action(
        user["user_id"], "onboarding_completed",
        metadata={"goal": data.primary_goal, "heard_from": data.heard_from},
    )
    return {"message": "Onboarding abgeschlossen", "xp_earned": 5}
