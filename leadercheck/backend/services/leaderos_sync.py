"""Grant LeaderOS access after a paid Leader-Check checkout.

A purchase here used to stop at a Leader-Check license key, which LeaderOS
cannot redeem; the old Stripe -> Supabase -> LeaderOS route never granted a
plan (pricing_plans is empty). Now the paid webhook calls LeaderOS's internal
sync endpoints directly (same Railway project, private network):

  1. POST /api/internal/sync/user-created         -> account by email (no password;
     the buyer signs in with magic link or Google)
  2. POST /api/internal/sync/subscription-updated -> tier from the Leader-Check plan

Both are idempotent via event_id, so a retry (webhook redelivery, self-heal loop)
never double-grants. Config:
  LEADEROS_SYNC_URL     e.g. http://leaderos.railway.internal:8001
  LEADEROS_SYNC_SECRET  = LeaderOS INBOUND_SYNC_SECRET
Unset -> skipped (logged), so local dev and tests never call out.
"""
import logging
import os
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

TIMEOUT_S = 15


def _config() -> tuple[str, str]:
    return (
        (os.environ.get("LEADEROS_SYNC_URL") or "").strip().rstrip("/"),
        (os.environ.get("LEADEROS_SYNC_SECRET") or "").strip(),
    )


def is_configured() -> bool:
    url, secret = _config()
    return bool(url and secret)


async def grant_leaderos_access(email: str, name: str, plan: str, session_id: str) -> dict:
    """Create/link the LeaderOS account for `email` and apply `plan`.

    Returns {"status": "granted", "tier": …, "user_id": …} or raises on failure.
    The plan name is Leader-Check's (leader_os, leader_os_plus, …); LeaderOS maps it.
    """
    url, secret = _config()
    if not (url and secret):
        return {"status": "skipped", "reason": "LEADEROS_SYNC_URL/SECRET not set"}
    email = (email or "").strip().lower()
    if not email:
        return {"status": "skipped", "reason": "no email on transaction"}

    headers = {"X-Sync-Secret": secret}
    async with httpx.AsyncClient(timeout=TIMEOUT_S) as client:
        r = await client.post(f"{url}/api/internal/sync/user-created", headers=headers, json={
            "event_id": f"lc-user-{session_id}",
            "email": email,
            "full_name": name or None,
        })
        r.raise_for_status()
        r = await client.post(f"{url}/api/internal/sync/subscription-updated", headers=headers, json={
            "event_id": f"lc-sub-{session_id}",
            "email": email,
            "plan": plan,
            "active": True,
        })
        r.raise_for_status()
        body = r.json()
    logger.info(f"[leaderos-sync] {email} -> tier {body.get('tier')} (session {session_id})")
    return {"status": "granted", "tier": body.get("tier"), "user_id": body.get("user_id")}


async def grant_for_transaction(db, tx: dict) -> dict:
    """grant_leaderos_access for a payment_transactions doc; records the outcome on it."""
    session_id = tx["session_id"]
    now = datetime.now(timezone.utc).isoformat()
    try:
        result = await grant_leaderos_access(
            tx.get("email") or "", tx.get("name") or "", tx.get("plan") or "leader_os", session_id,
        )
    except Exception as e:  # noqa: BLE001 — never break the webhook; self-heal retries
        logger.error(f"[leaderos-sync] grant failed for {session_id}: {e}")
        await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {
            "leaderos_access": {"status": "error", "error": str(e)[:300], "at": now},
        }})
        return {"status": "error"}
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {
        "leaderos_access": {**result, "at": now},
    }})
    return result


async def retry_pending_grants(db, limit: int = 50) -> int:
    """Paid transactions whose grant failed (e.g. LeaderOS was down).

    Only `leaderos_access.status == "error"`: purchases from before this sync
    (no leaderos_access field) are never touched, because re-activating a
    tier would reset that buyer's expiry date.
    """
    if not is_configured():
        return 0
    cursor = db.payment_transactions.find(
        {"payment_status": "paid", "leaderos_access.status": "error"},
        {"_id": 0, "session_id": 1, "email": 1, "name": 1, "plan": 1},
    ).limit(limit)
    granted = 0
    for tx in await cursor.to_list(limit):
        if (await grant_for_transaction(db, tx)).get("status") == "granted":
            granted += 1
    return granted


async def login_link(email: str) -> str | None:
    """Staging only (LEADEROS_LOGIN_HANDOFF=1): one-time LeaderOS login URL for
    `email`, minted by LeaderOS /api/internal/sync/login-link. None if disabled
    or unavailable — the caller falls back to the plain LeaderOS URL."""
    url, secret = _config()
    if os.environ.get("LEADEROS_LOGIN_HANDOFF") != "1" or not (url and secret and email):
        return None
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_S) as client:
            r = await client.post(f"{url}/api/internal/sync/login-link",
                                  headers={"X-Sync-Secret": secret}, json={"email": email})
        return r.json().get("url") if r.status_code == 200 else None
    except Exception as e:  # noqa: BLE001
        logger.warning(f"[leaderos-sync] login link failed: {e}")
        return None
