"""Supabase outbound sync — mirrors user lifecycle events to Supabase Edge Function.

Design:
- Fire-and-forget: signup/update never blocks waiting for Supabase
- Retries with exponential backoff for transient errors (5xx, network)
- Idempotency: each event has a unique event_id, stored in db.sync_events
- Safe fallback: missing config → log warning, do nothing (no crash)
"""
import os
import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx

from config import db, logger

SUPABASE_USER_MIRROR_URL = os.environ.get("SUPABASE_USER_MIRROR_URL", "").strip()
OUTBOUND_SECRET = os.environ.get("SUPABASE_OUTBOUND_SECRET", "").strip()

_RETRY_DELAYS = (0.5, 1.5, 4.0)  # seconds between retries (3 attempts total)
_REQUEST_TIMEOUT = 8.0           # seconds per attempt


def _sync_enabled() -> bool:
    """Outbound sync requires both URL and secret to be configured."""
    return bool(SUPABASE_USER_MIRROR_URL and OUTBOUND_SECRET)


async def _post_with_retries(payload: dict) -> tuple[bool, Optional[str]]:
    """Best-effort POST to Supabase Edge Function. Returns (success, error_msg)."""
    headers = {
        "Content-Type": "application/json",
        "X-Sync-Secret": OUTBOUND_SECRET,
    }
    last_err: Optional[str] = None
    async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
        for attempt, delay in enumerate(_RETRY_DELAYS):
            try:
                resp = await client.post(SUPABASE_USER_MIRROR_URL, headers=headers, json=payload)
                if 200 <= resp.status_code < 300:
                    return True, None
                # Non-2xx: retry on 5xx, abort on 4xx
                last_err = f"HTTP {resp.status_code}: {resp.text[:200]}"
                if resp.status_code < 500:
                    return False, last_err
            except (httpx.TimeoutException, httpx.NetworkError) as e:
                last_err = f"{type(e).__name__}: {e}"
            if attempt < len(_RETRY_DELAYS) - 1:
                await asyncio.sleep(delay)
    return False, last_err


async def _log_event(event_id: str, event: str, mongo_user_id: str, success: bool, error: Optional[str]) -> None:
    """Persist outbound sync attempt for observability + idempotency."""
    try:
        await db.sync_events.update_one(
            {"event_id": event_id},
            {"$set": {
                "event_id": event_id,
                "direction": "outbound",
                "event": event,
                "mongo_user_id": mongo_user_id,
                "success": success,
                "error": error,
                "synced_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )
    except Exception as e:
        logger.warning(f"sync_events log failed: {e}")


async def mirror_user_event(
    mongo_user_id: str,
    email: str,
    full_name: str,
    event: str,
    extra: Optional[dict] = None,
    source_platform: Optional[str] = None,
) -> None:
    """Send user lifecycle event to Supabase. Safe to await OR fire-and-forget.

    `event` is a string like 'user.created', 'user.updated', 'subscription.changed'.
    `source_platform` (Iter 92.24, Mert): funnel-of-origin — 'leader-check' for
    users coming through leadercheck.de funnel, 'leader-os' for direct signups.
    Maps to Supabase `users.source_platform` enum (first-touch attribution).

    Returns None — failures are logged but never raised so the caller flow continues.
    """
    if not _sync_enabled():
        logger.debug(f"Supabase sync disabled (event={event}, user={mongo_user_id})")
        return

    event_id = f"evt_{uuid.uuid4().hex}"
    payload = {
        "event_id": event_id,
        "event": event,
        "mongo_user_id": mongo_user_id,
        "email": (email or "").lower().strip(),
        "full_name": (full_name or "").strip(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if source_platform:
        payload["source_platform"] = source_platform
    if extra:
        payload["extra"] = extra

    success, error = await _post_with_retries(payload)
    if not success:
        logger.error(f"Supabase mirror failed (event={event}, user={mongo_user_id}): {error}")
    await _log_event(event_id, event, mongo_user_id, success, error)


def mirror_user_event_fire_and_forget(
    mongo_user_id: str,
    email: str,
    full_name: str,
    event: str,
    extra: Optional[dict] = None,
    source_platform: Optional[str] = None,
) -> None:
    """Schedule mirror call without awaiting — for use in hot paths (signup, login).

    Uses asyncio.create_task so the API response returns immediately.
    Errors are swallowed and logged inside the task.
    """
    if not _sync_enabled():
        return
    try:
        asyncio.create_task(mirror_user_event(
            mongo_user_id, email, full_name, event, extra, source_platform,
        ))
    except RuntimeError:
        # No running event loop (e.g. called from sync context) — log and skip
        logger.warning(f"No event loop for mirror_user_event_fire_and_forget event={event}")
