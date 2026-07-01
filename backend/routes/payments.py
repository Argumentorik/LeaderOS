"""Stripe payments + license key routes — split into 3 focused registrars:
- register_checkout_routes (create checkout, status, webhook)
- register_license_routes  (create/activate/validate/list/revoke)

Heavy logic (key generation, plan→amount mapping, Stripe session creation,
cancel_at apply, self-healing) lives in /backend/services/* to keep route
handlers small and testable.
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from datetime import datetime, timezone, timedelta
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutStatusResponse,
)
import asyncio
import logging
import resend
import stripe as stripe_sdk

from typing import Optional

from models import CreateCheckoutRequest, LicenseKeyActivate, LicenseKeyCreate
from services.license_keys import build_license_doc
from services.pricing import PACKAGES, PLAN_AMOUNT_MAP
from services.stripe_checkout import (
    is_real_stripe_key,
    create_subscription_session,
    apply_subscription_cancel_at,
    create_one_time_session,
    build_subscription_tx,
    build_one_time_tx,
)

logger = logging.getLogger(__name__)


# Re-export for any external test that imports PACKAGES from this module
__all__ = ["PACKAGES", "register_payment_routes", "register_checkout_routes", "register_license_routes", "create_license_key_internal"]


# --------- License Key helper (kept here because it crosses route concerns) ---------

async def create_license_key_internal(db, plan: str, email: Optional[str] = None, name: Optional[str] = None, source: str = "stripe", notes: Optional[str] = None) -> str:
    """Insert a new license key, retrying on the (extremely rare) collision."""
    doc = build_license_doc(plan, email or "", name or "", source, notes or "")
    while await db.license_keys.find_one({"key": doc["key"]}):
        doc = build_license_doc(plan, email or "", name or "", source, notes or "")
    # Reset activation fields (build_license_doc sets expires_at — we want it null until activation)
    doc.update({"activated_by": None, "activated_at": None, "expires_at": None})
    await db.license_keys.insert_one(doc)
    return doc["key"]


# --------- Webhook helper ---------

async def _handle_paid_webhook(db, app_config, session_id):
    from routes.email import send_payment_email_background
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        return
    plan = tx.get("plan", "leader_os")
    email = tx.get("email")
    name = tx.get("name") or email or "Leader"
    key = await create_license_key_internal(db, plan=plan, email=email, name=name, source="stripe")
    await db.payment_transactions.update_one(
        {"session_id": session_id}, {"$set": {"license_key": key}}
    )
    if email:
        asyncio.create_task(send_payment_email_background(db, app_config, email, name, plan, tx.get("amount", 997)))
        # Stop drip nurture for this buyer
        try:
            from services.email_scheduler import cancel_drip
            await cancel_drip(db, email, reason="purchased")
        except Exception:  # noqa: BLE001
            pass


# --------- License email helper ---------

async def _send_license_key_email(app_config, email: str, name: str, plan: str, key: str):
    if not (email and app_config.get("resend_key")):
        return
    try:
        from email_templates import payment_confirmation_email
        amount = PLAN_AMOUNT_MAP.get(plan, 997.0)
        email_data = payment_confirmation_email(name or "Leader", plan, amount)
        await asyncio.to_thread(resend.Emails.send, {
            "from": f"Wlad von Leader OS <{app_config['sender_email']}>",
            "to": [email],
            "subject": f"Dein License Key: {key} — Leader OS",
            "html": email_data["html"].replace("Sofort aktiv", f"Key: <strong>{key}</strong>"),
        })
    except Exception as e:
        logger.error(f"License key email error: {e}")


# --------- Route registrars ---------

def register_checkout_routes(router: APIRouter, db, app_config):
    """Stripe Checkout creation, status polling, and webhook."""

    stripe_sdk.api_key = app_config.get("stripe_key", "")

    @router.post("/payments/create-checkout")
    async def create_checkout(req: CreateCheckoutRequest):
        package = PACKAGES.get(req.package_id)
        if not package:
            raise HTTPException(status_code=400, detail=f"Unknown package: {req.package_id}")

        mode = package.get("mode", "payment")
        use_real_subscription = mode == "subscription" and is_real_stripe_key(app_config.get("stripe_key", ""))

        if use_real_subscription:
            try:
                session = await create_subscription_session(req, package)
            except Exception as e:
                logger.error(f"Subscription checkout error: {e}")
                raise HTTPException(status_code=500, detail=f"Checkout error: {str(e)}")
            await db.payment_transactions.insert_one(build_subscription_tx(session, req, package))
            return {"url": session.url, "session_id": session.id, "mode": "subscription"}

        # Fallback / one-time payment path
        charge_amount = package.get("total_amount") if mode == "subscription" else package["amount"]
        session = await create_one_time_session(app_config["stripe_key"], req, package, charge_amount, mode == "subscription")
        await db.payment_transactions.insert_one(build_one_time_tx(session, req, package, charge_amount, mode == "subscription"))
        return {"url": session.url, "session_id": session.session_id, "mode": "payment"}

    @router.get("/payments/status/{session_id}")
    async def get_payment_status(session_id: str):
        tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if tx and tx.get("mode") == "subscription":
            try:
                session = await asyncio.to_thread(stripe_sdk.checkout.Session.retrieve, session_id)
                # Defer-apply cancel_at to the subscription if not already set
                if session.subscription:
                    await apply_subscription_cancel_at(session.subscription)
                return {
                    "session_id": session_id,
                    "payment_status": session.payment_status,
                    "status": session.status,
                    "subscription_id": session.subscription,
                    "mode": "subscription",
                    "amount_per_cycle": tx.get("amount"),
                    "total_amount": tx.get("total_amount"),
                    "cycles": tx.get("cycles"),
                }
            except Exception as e:
                logger.error(f"Stripe subscription status error: {e}")
                return tx
        if tx:
            return tx
        try:
            stripe_client = StripeCheckout(api_key=app_config["stripe_key"])
            status = await stripe_client.get_checkout_status(session_id)
            return {"session_id": session_id, "payment_status": status.payment_status, "status": status.status}
        except Exception:
            return {"session_id": session_id, "payment_status": "unknown", "status": "unknown"}

    @router.post("/webhook/stripe")
    async def stripe_webhook(request: Request) -> dict:
        """Stripe webhook with signature verification + event idempotency.

        SEC-001 fix: previous version parsed `request.json()` and trusted
        `payment_status=='paid'` without any authentication, so anyone with a
        valid session_id could mint free license keys. Now:
        1. Verify signature via `stripe.Webhook.construct_event`
        2. De-dupe on `event.id` (Stripe retries webhooks · we may see the
           same event 2-3× within seconds; idempotency prevents duplicate key
           mints and duplicate confirmation emails).
        """
        webhook_secret = app_config.get("stripe_webhook_secret", "")
        if not webhook_secret:
            logger.error("[webhook] STRIPE_WEBHOOK_SECRET not configured — refusing to process")
            raise HTTPException(status_code=503, detail="Webhook not configured")

        payload = await request.body()
        sig_header = request.headers.get("stripe-signature", "")
        if not sig_header:
            logger.warning("[webhook] Missing Stripe-Signature header — request rejected")
            raise HTTPException(status_code=400, detail="Missing signature header")

        try:
            event = stripe_sdk.Webhook.construct_event(payload, sig_header, webhook_secret)
        except stripe_sdk.error.SignatureVerificationError:
            logger.warning("[webhook] Signature verification FAILED — request rejected")
            raise HTTPException(status_code=400, detail="Invalid signature")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")

        event_id = event.get("id")
        event_type = event.get("type", "")
        now_iso = datetime.now(timezone.utc).isoformat()

        # Idempotency guard — record every processed event id, refuse duplicates
        already = await db.stripe_webhook_events.find_one({"event_id": event_id}, {"_id": 0})
        if already:
            logger.info(f"[webhook] Duplicate event {event_id} — skipping")
            return {"status": "duplicate", "event_id": event_id}
        try:
            await db.stripe_webhook_events.insert_one({
                "event_id": event_id, "event_type": event_type,
                "processed_at": now_iso,
            })
        except Exception as e:  # possible unique-index race — treat as duplicate
            logger.info(f"[webhook] Race on event {event_id}: {e} — treating as duplicate")
            return {"status": "duplicate", "event_id": event_id}

        # Extract session_id — for both checkout.session.* and legacy shapes
        data_obj = event.get("data", {}).get("object", {}) or {}
        session_id = data_obj.get("id") or data_obj.get("session_id")
        payment_status = data_obj.get("payment_status", "unknown")

        if not session_id:
            return {"status": "ok", "note": "no session_id in payload"}

        if event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded") and payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": "paid", "status": "complete",
                    "event_type": event_type, "event_id": event_id,
                    "updated_at": now_iso,
                }},
            )
            await _handle_paid_webhook(db, app_config, session_id)
        else:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": payment_status,
                    "status": "failed" if payment_status in ("failed", "canceled") else "pending",
                    "event_type": event_type, "event_id": event_id,
                    "updated_at": now_iso,
                }},
            )

        return {"status": "ok", "event_id": event_id}


def register_license_routes(router: APIRouter, db, app_config: dict) -> None:
    """License key lifecycle: create / activate / validate / list / revoke."""
    from routes.admin import require_admin

    @router.post("/license/create", dependencies=[Depends(require_admin)])
    async def create_license_key_endpoint(data: LicenseKeyCreate) -> dict:
        key = await create_license_key_internal(db, plan=data.plan, email=data.email, name=data.name, source="manual", notes=data.notes)
        await _send_license_key_email(app_config, data.email or "", data.name or "", data.plan, key)
        return {"key": key, "plan": data.plan, "status": "active"}

    @router.post("/license/activate")
    async def activate_license_key(data: LicenseKeyActivate) -> dict:
        key_doc = await db.license_keys.find_one({"key": data.license_key.upper().strip()}, {"_id": 0})
        if not key_doc:
            raise HTTPException(status_code=404, detail="Ungültiger License Key. Bitte prüfe deine Eingabe.")
        status = key_doc["status"]
        if status == "used":
            raise HTTPException(status_code=400, detail="Dieser Key wurde bereits aktiviert.")
        if status == "revoked":
            raise HTTPException(status_code=400, detail="Dieser Key wurde deaktiviert.")
        if status == "expired":
            raise HTTPException(status_code=400, detail="Dieser Key ist abgelaufen.")
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=key_doc.get("duration_days", 365))
        await db.license_keys.update_one(
            {"key": data.license_key.upper().strip()},
            {"$set": {
                "status": "used", "activated_by": data.email or key_doc.get("email"),
                "activated_at": now.isoformat(), "expires_at": expires_at.isoformat(),
            }},
        )
        return {
            "success": True, "plan": key_doc["plan"], "plan_name": key_doc["plan_name"],
            "includes_calls": key_doc.get("includes_calls", False),
            "expires_at": expires_at.isoformat(),
            "redirect_url": "https://leaderos.de",
            "message": "Key erfolgreich aktiviert! Du wirst zu leaderos.de weitergeleitet.",
        }

    @router.get("/license/validate/{key}")
    async def validate_license_key(key: str):
        key_doc = await db.license_keys.find_one({"key": key.upper().strip()}, {"_id": 0})
        if not key_doc:
            return {"valid": False, "message": "Key nicht gefunden"}
        status = key_doc["status"]
        if status == "active":
            return {"valid": True, "status": "active", "plan": key_doc["plan"], "message": "Key ist gültig und bereit zur Aktivierung"}
        if status == "used":
            expires_at = key_doc.get("expires_at")
            if expires_at:
                exp = datetime.fromisoformat(expires_at)
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                if exp < datetime.now(timezone.utc):
                    await db.license_keys.update_one({"key": key.upper().strip()}, {"$set": {"status": "expired"}})
                    return {"valid": False, "status": "expired", "message": "Key ist abgelaufen"}
            return {"valid": True, "status": "used", "plan": key_doc["plan"], "activated_by": key_doc.get("activated_by"), "expires_at": expires_at}
        return {"valid": False, "status": status, "message": f"Key Status: {status}"}

    @router.get("/license/list", dependencies=[Depends(require_admin)])
    async def list_license_keys() -> dict:
        keys = await db.license_keys.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"keys": keys, "total": len(keys)}

    @router.post("/license/revoke/{key}", dependencies=[Depends(require_admin)])
    async def revoke_license_key(key: str) -> dict:
        result = await db.license_keys.update_one(
            {"key": key.upper().strip()},
            {"$set": {"status": "revoked", "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Key nicht gefunden")
        return {"success": True, "message": f"Key {key} wurde deaktiviert"}


def register_payment_routes(router: APIRouter, db, app_config: dict) -> None:
    """Backward-compatible umbrella registrar — keeps server.py untouched."""
    register_checkout_routes(router, db, app_config)
    register_license_routes(router, db, app_config)
