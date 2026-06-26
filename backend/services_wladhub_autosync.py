"""Auto-sync leader-check.de diagnosis on user signup.

When a user registers on leaderos.de, we attempt to find their existing
Leader-Diagnose in the Supabase `leadership_insights` table by email match.
If found → import scores into the new user's MongoDB profile so they see
their existing 3-Layer score immediately on the dashboard.

Runs as a fire-and-forget background task — never blocks the signup response.
"""
import logging
from datetime import datetime, timezone

from config import db
from routes.wladhub import _fetch_supabase_insights, _save_diagnosis_to_mongo

logger = logging.getLogger("leader-os.wladhub_autosync")


async def auto_sync_wladhub_on_signup(user_id: str, email: str) -> None:
    """Background task — best-effort sync, never raises to caller.

    Pulls the latest leadership_insight row for `email` from Supabase. If
    found, persists to `wladhub_diagnoses` and updates the user's
    `wladhub_scores` so the dashboard widget shows the 3-Layer score on
    first login — turning the leader-check.de quiz into a free funnel.
    """
    try:
        insights = await _fetch_supabase_insights(email)
        if not insights:
            logger.info("autosync: no leader-check.de diagnosis for %s", email)
            return

        latest = insights[0]
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
            "diagnosis_date": latest.get("assessed_at"),
        }

        await _save_diagnosis_to_mongo(user_id, scores, source="supabase_autosync_signup")
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "wladhub_autosynced_at": datetime.now(timezone.utc).isoformat(),
                "has_wladhub_diagnosis": True,
            }},
        )
        logger.info(
            "autosync: imported leader-check.de diagnosis for %s (overall=%s)",
            email, scores["overall_score"],
        )
    except Exception as e:
        # Never raise from a fire-and-forget task — just log
        logger.warning("autosync: failed for %s: %s", email, e)
