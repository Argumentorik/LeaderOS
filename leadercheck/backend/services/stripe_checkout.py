"""Stripe Checkout service — all Stripe session creation, status, and
cancel_at lifecycle helpers live here. Route handlers stay thin orchestrators.

Includes the `cancel_stale_pending_checkouts` job used by the background
self-healing task in server.py — marks pending checkouts as 'expired' when
their Stripe session has timed out (24h since creation).
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Any
import asyncio
import logging

import stripe as stripe_sdk

logger = logging.getLogger(__name__)


# ─── helpers ───────────────────────────────────────────────────────────────

def is_real_stripe_key(key: str) -> bool:
    """True for sk_live_/sk_test_ account keys; False for empty or placeholder values
    (e.g. the old Emergent 'sk_test_emergent')."""
    if not key or key == "sk_test_emergent":
        return False
    return key.startswith("sk_live_") or (key.startswith("sk_test_") and len(key) > 20)


def build_subscription_metadata(req: Any, package: dict) -> dict[str, str]:
    return {
        "package_id": req.package_id,
        "plan": package["plan"],
        "billing": package["billing"],
        "cycles": str(package["cycles"]),
        "total_amount": str(package["total_amount"]),
        "user_email": req.email or "",
        "user_name": req.user_name or "",
        "user_session_id": req.user_session_id or "",
    }


# ─── checkout session creators ─────────────────────────────────────────────

async def create_subscription_session(req: Any, package: dict):
    """Real Stripe Subscription Checkout — auto-cancels after exactly N cycles.

    Stripe deprecated subscription_data[cancel_at] inside Checkout Session
    creation in 2026, so we stash the target cancel_at timestamp in subscription
    metadata and apply it post-creation via apply_subscription_cancel_at.
    """
    success_url = f"{req.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/close"

    cycles = int(package.get("cycles", 1))
    interval_count = int(package.get("interval_count", 1))
    interval = package.get("interval", "month")
    days_per_unit = {"day": 1, "week": 7, "month": 30, "year": 365}.get(interval, 30)
    total_days = cycles * interval_count * days_per_unit + 7  # 7d grace buffer
    cancel_at = int((datetime.now(timezone.utc) + timedelta(days=total_days)).timestamp())

    metadata = build_subscription_metadata(req, package)
    sub_metadata = {**metadata, "cancel_at_ts": str(cancel_at)}

    return await asyncio.to_thread(
        stripe_sdk.checkout.Session.create,
        mode="subscription",
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": package["currency"],
                "product_data": {"name": package["name"]},
                "unit_amount": int(package["amount"] * 100),
                "recurring": {"interval": package["interval"], "interval_count": package["interval_count"]},
            },
            "quantity": 1,
        }],
        subscription_data={"metadata": sub_metadata},
        customer_email=req.email or None,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )


async def apply_subscription_cancel_at(sub_id: str) -> None:
    """Apply the deferred cancel_at to a Stripe subscription if not already set.

    Idempotent · safe to call repeatedly from the /payments/status polling
    endpoint or the background self-healing job.
    """
    if not sub_id:
        return
    try:
        sub = await asyncio.to_thread(stripe_sdk.Subscription.retrieve, sub_id)
        if sub.get("cancel_at"):
            return
        target_ts_str = (sub.get("metadata") or {}).get("cancel_at_ts")
        if not target_ts_str:
            return
        target_ts = int(target_ts_str)
        await asyncio.to_thread(stripe_sdk.Subscription.modify, sub_id, cancel_at=target_ts)
        logger.info(f"Subscription {sub_id} cancel_at applied → {target_ts}")
    except Exception as e:  # noqa: BLE001
        logger.error(f"apply cancel_at failed for {sub_id}: {e}")


async def create_one_time_session(req: Any, package: dict, charge_amount: float, was_subscription: bool):
    """One-time Stripe Checkout (mode=payment) via the stripe SDK.

    `charge_amount` is in MAJOR currency units (EUR); converted to cents here.
    Uses the module-level stripe_sdk.api_key set in register_checkout_routes.
    """
    if not (1 <= charge_amount <= 100000):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=500,
            detail=f"Invalid charge amount {charge_amount} EUR (must be 1–100000)"
        )

    success_url = f"{req.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/close"
    return await asyncio.to_thread(
        stripe_sdk.checkout.Session.create,
        mode="payment",
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": package["currency"],
                "product_data": {"name": package["name"]},
                "unit_amount": int(round(float(charge_amount) * 100)),
            },
            "quantity": 1,
        }],
        customer_email=req.email or None,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "package_id": req.package_id,
            "plan": package["plan"],
            "billing": package["billing"],
            "fallback_from_subscription": "true" if was_subscription else "false",
        },
    )


# ─── transaction builders ─────────────────────────────────────────────────

def build_subscription_tx(session, req: Any, package: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "session_id": session.id, "package_id": req.package_id,
        "package_name": package["name"],
        "amount": package["amount"],
        "total_amount": package.get("total_amount", package["amount"]),
        "currency": package["currency"], "plan": package["plan"],
        "billing": package["billing"], "mode": "subscription",
        "cycles": package.get("cycles", 1),
        "stripe_subscription_id": getattr(session, "subscription", None),
        "email": req.email or "", "name": req.user_name or "",
        "user_session_id": req.user_session_id or "",
        "payment_status": "initiated", "status": "pending",
        "created_at": now, "updated_at": now,
    }


def build_one_time_tx(session, req: Any, package: dict, charge_amount: float, was_subscription: bool) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "session_id": session.id, "package_id": req.package_id,
        "package_name": package["name"],
        "amount": charge_amount, "total_amount": charge_amount,
        "currency": package["currency"], "plan": package["plan"],
        "billing": package["billing"], "mode": "payment",
        "fallback_from_subscription": was_subscription,
        "email": req.email or "", "name": req.user_name or "",
        "user_session_id": req.user_session_id or "",
        "payment_status": "initiated", "status": "pending",
        "created_at": now, "updated_at": now,
    }


# ─── self-healing background job ──────────────────────────────────────────

# Stripe Checkout Sessions auto-expire 24h after creation. We mark any
# `payment_transactions` doc still in `status=pending` after STALE_HOURS as
# `status=expired` so the admin dashboard, conversion-funnel math and any
# follow-up nurture (drip) treat them as lost.
STALE_HOURS = 26  # 24h Stripe TTL + 2h safety buffer
SCAN_LIMIT = 500   # safety cap per run


async def cancel_stale_pending_checkouts(db) -> dict:
    """Find pending checkouts older than STALE_HOURS and mark them expired.

    Also reconciles against Stripe: if Stripe shows the session as 'expired' or
    'complete' we honour that. If Stripe is unreachable, we still expire after
    STALE_HOURS based on age alone.

    Returns counts for observability and tests.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=STALE_HOURS)).isoformat()
    cursor = db.payment_transactions.find(
        {"status": "pending", "created_at": {"$lt": cutoff}},
        {"_id": 0, "session_id": 1, "mode": 1, "stripe_subscription_id": 1},
    ).limit(SCAN_LIMIT)

    stale = await cursor.to_list(SCAN_LIMIT)
    if not stale:
        return {"scanned": 0, "expired": 0, "reconciled_paid": 0}

    expired = 0
    reconciled_paid = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for tx in stale:
        sid = tx.get("session_id")
        if not sid:
            continue
        new_status = "expired"
        new_payment_status = "expired"
        # Best-effort reconcile with Stripe
        try:
            session = await asyncio.to_thread(stripe_sdk.checkout.Session.retrieve, sid)
            stripe_status = session.get("status") or "expired"
            stripe_payment = session.get("payment_status") or "unpaid"
            if stripe_payment == "paid":
                new_status = "complete"
                new_payment_status = "paid"
                reconciled_paid += 1
            elif stripe_status == "expired":
                new_status = "expired"
                new_payment_status = "expired"
            else:
                # session not yet final — leave it alone for the next run
                continue
        except Exception:  # noqa: BLE001
            # Stripe unreachable — expire based on age alone (best-effort)
            pass

        await db.payment_transactions.update_one(
            {"session_id": sid},
            {"$set": {
                "status": new_status,
                "payment_status": new_payment_status,
                "expired_at": now_iso if new_status == "expired" else None,
                "updated_at": now_iso,
                "expired_by": "stripe_self_healer",
            }},
        )
        if new_status == "expired":
            expired += 1

    logger.info(
        f"[stripe-self-heal] scanned={len(stale)} expired={expired} reconciled_paid={reconciled_paid}"
    )
    return {"scanned": len(stale), "expired": expired, "reconciled_paid": reconciled_paid}


async def start_self_healing_loop(db, interval_seconds: int = 3600) -> None:
    """Background loop: run `cancel_stale_pending_checkouts` every hour.

    Started on FastAPI startup via asyncio.create_task. Survives transient
    failures (one bad run shouldn't kill the loop).
    """
    logger.info(f"[stripe-self-heal] loop started · interval={interval_seconds}s")
    while True:
        try:
            await cancel_stale_pending_checkouts(db)
        except Exception as e:  # noqa: BLE001
            logger.error(f"[stripe-self-heal] loop iteration failed: {e}")
        await asyncio.sleep(interval_seconds)
