"""Auto-sync leadercheck.de diagnosis into Leader-OS.

Flow (real data path):
    leadercheck.de (Supabase `leadership_insights`)
      → _fetch_supabase_insights(email)          [ordered assessed_at desc]
      → compare `assessed_at` with what we stored
      → _save_diagnosis_to_mongo()               [wladhub_diagnoses + users.wladhub_scores]
      → wladhub_sync_log entry                   [Admin → Sync-Health]

Runs as a fire-and-forget background task on signup AND on login, so a
diagnosis taken (or RE-taken) after signup still reaches the product.

Iter 135 (Audit): before this version the sync was one-shot. Once a user had
any diagnosis, a NEW result on leadercheck.de was never imported, and the
automatic path wrote no log at all — so Admin → Sync-Health showed zero
activity while syncs were actually running.
"""
import logging
from datetime import datetime, timezone

from config import db
from routes.wladhub import _fetch_supabase_insights, _save_diagnosis_to_mongo

logger = logging.getLogger("leader-os.wladhub_autosync")


async def _log_sync(user_id: str, email: str, status: str, *,
                    records: int = 0, error: str | None = None,
                    assessed_at: str | None = None) -> None:
    """One row per automatic sync attempt — this is what Admin/Ops reads."""
    try:
        await db.wladhub_sync_log.insert_one({
            "user_id": user_id,
            "email": email,
            "trigger": "auto",
            # completed = data written; unchanged/not_found are healthy no-ops
            "status": status,
            "records_imported": records,
            "source_assessed_at": assessed_at,
            "error": error,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.warning("wladhub_sync_log write failed: %s", e)


async def auto_sync_wladhub_on_signup(user_id: str, email: str) -> None:
    """Best-effort import of the newest leadercheck.de diagnosis. Never raises."""
    try:
        insights = await _fetch_supabase_insights(email)
        if not insights:
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"wladhub_last_check": datetime.now(timezone.utc).isoformat()}},
            )
            await _log_sync(user_id, email, "not_found")
            logger.info("autosync: no leadercheck.de diagnosis for %s", email)
            return

        latest = insights[0]
        assessed_at = latest.get("assessed_at")

        # Already imported this exact result → no write, no churn.
        existing = await db.wladhub_diagnoses.find_one(
            {"user_id": user_id}, {"_id": 0, "source_assessed_at": 1},
        )
        if existing and assessed_at and existing.get("source_assessed_at") == assessed_at:
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"wladhub_last_check": datetime.now(timezone.utc).isoformat()}},
            )
            await _log_sync(user_id, email, "unchanged", assessed_at=assessed_at)
            return

        scores = {
            "ki_kompetenz": int(latest.get("ki_score") or 0),
            "boardroom_rhetorik": int(latest.get("rhetoric_score") or 0),
            "strategisches_eq": int(latest.get("eq_score") or 0),
            "overall_score": int(latest.get("composite_score") or 0),
            "action_plan": latest.get("action_plan") or [],
            "strengths": latest.get("strengths") or [],
            "improvements": latest.get("improvements") or [],
            "roi_forecast": latest.get("roi_forecast"),
            "leader_typ": latest.get("leader_typ"),
            "fuehrungsdimensionen": latest.get("fuehrungsdimensionen"),
            "layer_scores": latest.get("layer_scores"),
            "aktionsplan_30_tage": latest.get("aktionsplan_30_tage"),
            "diagnosis_date": assessed_at,
            "source_assessed_at": assessed_at,
        }

        await _save_diagnosis_to_mongo(user_id, scores, source="supabase_autosync")
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "wladhub_autosynced_at": datetime.now(timezone.utc).isoformat(),
                "wladhub_last_check": datetime.now(timezone.utc).isoformat(),
                "has_wladhub_diagnosis": True,
            }},
        )
        await _log_sync(
            user_id, email, "completed",
            records=1, assessed_at=assessed_at,
        )
        logger.info(
            "autosync: %s leadercheck.de diagnosis for %s (overall=%s, assessed=%s)",
            "updated" if existing else "imported", email, scores["overall_score"], assessed_at,
        )
    except Exception as e:
        # Never raise from a fire-and-forget task — log + make it visible in Admin
        logger.warning("autosync: failed for %s: %s", email, e)
        await _log_sync(user_id, email, "error", error=str(e)[:300])
