"""CRM Webhook Out — generic event push to external CRMs (Wingman et al).

Iter 92.18 (Mert: "CRM-Integration mit Wingman"):
This is intentionally vendor-neutral. Mert is building a custom CRM with
Wingman; once it has a public webhook endpoint, he sets:

    CRM_WEBHOOK_URL=https://api.wingman.com/leaderos/events
    CRM_WEBHOOK_SECRET=<shared secret>

…and every lifecycle event in Leader-OS auto-pushes here. We send a
HMAC-SHA256 signature in the `X-Leaderos-Signature` header so the CRM can
verify it's really us (defense against random POSTs).

Design choices:
  • Fire-and-forget (asyncio.create_task) — never blocks API responses
  • Best-effort, no DB-side queue: if Wingman is down we lose events. If
    that becomes a problem we add a `crm_outbox` collection with cron-drain
  • Schema-stable: `{type, occurred_at, user_id, email, tier, data}`.
    Mert's CRM contract should be: subscribe to types you care about, ignore
    the rest. Never breaks if we add new event types later.

Supported event types so far:
  user.signup               — every fresh account
  user.tier_upgraded        — tier promotion (free→standard, standard→plus)
  user.tier_downgraded      — refund/cancel processed
  checkout.completed        — Stripe successful payment
  support.question_asked    — WladHelp interaction (sales-intent signal)
  mission.completed         — engagement signal
  video.analyzed            — engagement signal
  consultation.booked       — Cal.com booking event
"""
from __future__ import annotations

import asyncio
import hmac
import hashlib
import json
import os
from datetime import datetime, timezone

import httpx

from config import logger

CRM_WEBHOOK_URL = os.environ.get("CRM_WEBHOOK_URL", "").strip()
CRM_WEBHOOK_SECRET = os.environ.get("CRM_WEBHOOK_SECRET", "").strip()
CRM_TIMEOUT_SECONDS = 6.0


def _sign(payload_bytes: bytes) -> str:
    """HMAC-SHA256 hex digest. Empty secret → empty string (callers can detect)."""
    if not CRM_WEBHOOK_SECRET:
        return ""
    return hmac.new(
        CRM_WEBHOOK_SECRET.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()


async def _send_once(url: str, body_bytes: bytes, signature: str) -> bool:
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Leader-OS-CRM-Webhook/1.0",
    }
    if signature:
        headers["X-Leaderos-Signature"] = signature
    try:
        async with httpx.AsyncClient(timeout=CRM_TIMEOUT_SECONDS) as client:
            r = await client.post(url, content=body_bytes, headers=headers)
            if 200 <= r.status_code < 300:
                return True
            logger.warning("CRM webhook %s returned HTTP %s: %s", url, r.status_code, r.text[:200])
            return False
    except Exception as e:
        logger.warning("CRM webhook POST failed: %s", e)
        return False


async def _emit_async(event_type: str, user: dict | None, data: dict | None) -> None:
    """Best-effort fire-and-forget. Caller MUST wrap this in asyncio.create_task."""
    if not CRM_WEBHOOK_URL:
        return  # silent no-op when CRM not configured
    payload = {
        "type": event_type,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "user_id": (user or {}).get("user_id"),
        "email": (user or {}).get("email"),
        "tier": (user or {}).get("tier", "free"),
        "name": (user or {}).get("name"),
        # Iter 92.24 (Mert): include funnel-of-origin so Wingman can route
        # leader-check vs leader-os leads into different campaigns.
        "platform": (user or {}).get("source_platform") or "leader-os",
        "data": data or {},
    }
    body_bytes = json.dumps(payload, default=str).encode("utf-8")
    signature = _sign(body_bytes)
    # 1 retry on failure — covers transient 5xx / TLS hiccups
    ok = await _send_once(CRM_WEBHOOK_URL, body_bytes, signature)
    if not ok:
        await asyncio.sleep(1.0)
        await _send_once(CRM_WEBHOOK_URL, body_bytes, signature)


def emit(event_type: str, user: dict | None = None, data: dict | None = None) -> None:
    """Fire CRM event without blocking the caller.

    Safe to call from any async route handler. If the event loop is missing
    (sync context — shouldn't happen in FastAPI but defensive), we just no-op.
    """
    if not CRM_WEBHOOK_URL:
        return
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(_emit_async(event_type, user, data))
    except RuntimeError:
        # No running loop — fail silently rather than corrupt the request lifecycle
        logger.debug("CRM emit %s: no running event loop, dropped", event_type)


# Convenience wrappers (so callers don't need to remember event-type strings)

def signup(user: dict, source: str | None = None) -> None:
    emit("user.signup", user, {"source": source} if source else None)


def tier_changed(user: dict, *, from_tier: str, to_tier: str, reason: str | None = None) -> None:
    direction = "upgraded" if _tier_rank(to_tier) > _tier_rank(from_tier) else "downgraded"
    emit(f"user.tier_{direction}", user, {
        "from_tier": from_tier,
        "to_tier": to_tier,
        "reason": reason,
    })


def checkout_completed(user: dict, *, amount_eur: float, package_id: str, session_id: str | None = None) -> None:
    emit("checkout.completed", user, {
        "amount_eur": amount_eur,
        "package_id": package_id,
        "stripe_session_id": session_id,
    })


def support_question(user: dict, *, question: str, source: str = "wladhelp") -> None:
    emit("support.question_asked", user, {
        "question": question[:500],  # truncate so we don't blow CRM payloads
        "source": source,
    })


def mission_completed(user: dict, *, mission_id: str, score: int | None = None) -> None:
    emit("mission.completed", user, {"mission_id": mission_id, "score": score})


def consultation_booked(user: dict, *, source: str = "cal.com", slot: str | None = None) -> None:
    emit("consultation.booked", user, {"source": source, "slot": slot})


def _tier_rank(tier: str | None) -> int:
    order = {"free": 0, "starter": 1, "standard": 2, "accelerator": 3, "plus": 3, "enterprise": 4}
    return order.get((tier or "free").lower(), 0)
