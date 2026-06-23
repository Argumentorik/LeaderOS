"""
Leader OS — Email Drip Scheduler
=================================

Background worker that runs on FastAPI startup. Every 5 minutes:
  1. Polls `email_queue` for entries with `due_at <= now` and `status == "pending"`
  2. For each entry, checks skip conditions:
     - User already bought (license_keys.activated_at OR payment_transactions.payment_status == "paid")
     - User unsubscribed (users.unsubscribed_at IS NOT NULL)
  3. Sends via Resend, marks status=sent (or skipped/failed)

Enqueue logic: call `enqueue_drip_sequence(db, user_doc, report_doc)` when
the report is generated. It schedules all 10 emails based on `SEQUENCE`.
"""
from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import resend
from services.email_sequence import SEQUENCE, render_email

logger = logging.getLogger("email_scheduler")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM = os.environ.get("RESEND_FROM", "Wlad von Leader OS <wlad@leadercheck.de>")
SCHEDULER_INTERVAL_SECONDS = int(os.environ.get("EMAIL_SCHEDULER_INTERVAL", "300"))


# ─── Public API ──────────────────────────────────────────

async def enqueue_drip_sequence(db, *, email: str, name: str, weakest_label: str,
                                 weakest_score: int, source: str = "report_generated") -> int:
    """Enqueue all 10 drip emails for a freshly-diagnosed user.

    Idempotent: if there's already an active queue for this email, returns 0.
    """
    if not email:
        return 0
    email_norm = email.lower().strip()

    existing = await db.email_queue.find_one({"email": email_norm, "status": "pending"})
    if existing:
        logger.info("Drip already enqueued for %s — skipping", email_norm)
        return 0

    now = datetime.now(timezone.utc)
    docs = []
    for day_offset, slug, _ in SEQUENCE:
        docs.append({
            "email": email_norm,
            "name": name,
            "slug": slug,
            "context": {
                "name": name,
                "weakest_label": weakest_label,
                "weakest_score": weakest_score,
                "seats_left": 18,  # static at enqueue; dynamic in render
            },
            "due_at": now + timedelta(days=day_offset),
            "status": "pending",
            "source": source,
            "created_at": now,
        })
    if docs:
        await db.email_queue.insert_many(docs)
    logger.info("Enqueued %d drip emails for %s", len(docs), email_norm)
    return len(docs)


async def cancel_drip(db, email: str, reason: str = "purchased") -> int:
    """Cancel all pending drip emails for a user (e.g. after purchase)."""
    if not email:
        return 0
    email_norm = email.lower().strip()
    res = await db.email_queue.update_many(
        {"email": email_norm, "status": "pending"},
        {"$set": {"status": "cancelled", "cancelled_reason": reason,
                  "cancelled_at": datetime.now(timezone.utc)}},
    )
    return res.modified_count


# ─── Worker Loop ─────────────────────────────────────────

async def _user_already_bought(db, email: str) -> bool:
    """Check if user has any successful payment or activated license."""
    tx = await db.payment_transactions.find_one(
        {"email": email, "payment_status": "paid"}, {"_id": 1}
    )
    if tx:
        return True
    lic = await db.license_keys.find_one(
        {"activated_by": email, "status": "used"}, {"_id": 1}
    )
    return bool(lic)


async def _user_unsubscribed(db, email: str) -> bool:
    user = await db.users.find_one({"email": email}, {"unsubscribed_at": 1})
    return bool(user and user.get("unsubscribed_at"))


def _send_via_resend(to: str, subject: str, html: str) -> str:
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY missing — email not sent")
        return "no_api_key"
    resend.api_key = RESEND_API_KEY
    res = resend.Emails.send({
        "from": RESEND_FROM,
        "to": [to],
        "subject": subject,
        "html": html,
    })
    return res.get("id", "no_id") if isinstance(res, dict) else "ok"


async def _process_one(db, doc: dict) -> str:
    email = doc["email"]
    if await _user_already_bought(db, email):
        await db.email_queue.update_one({"_id": doc["_id"]},
            {"$set": {"status": "skipped", "skip_reason": "purchased",
                      "processed_at": datetime.now(timezone.utc)}})
        return "skipped_purchased"
    if await _user_unsubscribed(db, email):
        await db.email_queue.update_one({"_id": doc["_id"]},
            {"$set": {"status": "skipped", "skip_reason": "unsubscribed",
                      "processed_at": datetime.now(timezone.utc)}})
        return "skipped_unsubscribed"

    rendered = render_email(doc["slug"], doc.get("context", {}))
    if not rendered:
        await db.email_queue.update_one({"_id": doc["_id"]},
            {"$set": {"status": "failed", "error": "render_returned_none",
                      "processed_at": datetime.now(timezone.utc)}})
        return "render_failed"
    try:
        msg_id = await asyncio.to_thread(_send_via_resend, email,
                                          rendered["subject"], rendered["html"])
        await db.email_queue.update_one({"_id": doc["_id"]},
            {"$set": {"status": "sent", "resend_id": msg_id,
                      "processed_at": datetime.now(timezone.utc)}})
        return "sent"
    except Exception as e:  # noqa: BLE001
        logger.exception("Failed to send drip mail for %s: %s", email, e)
        await db.email_queue.update_one({"_id": doc["_id"]},
            {"$set": {"status": "failed", "error": str(e)[:300],
                      "processed_at": datetime.now(timezone.utc)}})
        return "send_failed"


async def _tick(db) -> dict:
    """Process one batch of due emails. Returns a stats dict."""
    now = datetime.now(timezone.utc)
    due_cursor = db.email_queue.find(
        {"status": "pending", "due_at": {"$lte": now}}
    ).limit(50)
    stats = {"sent": 0, "skipped_purchased": 0, "skipped_unsubscribed": 0,
             "send_failed": 0, "render_failed": 0}
    async for doc in due_cursor:
        result = await _process_one(db, doc)
        stats[result] = stats.get(result, 0) + 1
    if any(stats.values()):
        logger.info("Drip tick: %s", stats)
    return stats


_scheduler_task: Optional[asyncio.Task] = None


async def _scheduler_loop(db):
    logger.info("Email drip scheduler started (interval=%ss)", SCHEDULER_INTERVAL_SECONDS)
    while True:
        try:
            await _tick(db)
        except Exception as e:  # noqa: BLE001
            logger.exception("Drip scheduler tick error: %s", e)
        await asyncio.sleep(SCHEDULER_INTERVAL_SECONDS)


def start_scheduler(db) -> None:
    global _scheduler_task
    if _scheduler_task is None or _scheduler_task.done():
        _scheduler_task = asyncio.create_task(_scheduler_loop(db))


def stop_scheduler() -> None:
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
