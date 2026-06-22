"""Stripe payments + license key routes — split into 3 focused registrars:
- register_checkout_routes (create checkout, status, webhook)
- register_license_routes  (create/activate/validate/list/revoke)

Heavy logic (key generation, plan→amount mapping, subscription params) lives in
/backend/services/license_keys.py to keep route handlers small and testable.
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutStatusResponse
)
import asyncio
import logging
import resend
import stripe as stripe_sdk

from typing import Optional

from models import CreateCheckoutRequest, LicenseKeyActivate, LicenseKeyCreate
from services.license_keys import build_license_doc
from services.pricing import PACKAGES, PLAN_AMOUNT_MAP

logger = logging.getLogger(__name__)


# Re-export for any external test that imports PACKAGES from this module
__all__ = ["PACKAGES", "register_payment_routes", "register_checkout_routes", "register_license_routes", "create_license_key_internal"]


# --------- License Key Service ---------

async def create_license_key_internal(db, plan: str, email: Optional[str] = None, name: Optional[str] = None, source: str = "stripe", notes: Optional[str] = None) -> str:
    """Insert a new license key, retrying on the (extremely rare) collision."""
    doc = build_license_doc(plan, email or "", name or "", source, notes or "")
    while await db.license_keys.find_one({"key": doc["key"]}):
        doc = build_license_doc(plan, email or "", name or "", source, notes or "")
    # Reset activation fields (build_license_doc sets expires_at — we want it null until activation)
    doc.update({"activated_by": None, "activated_at": None, "expires_at": None})
    await db.license_keys.insert_one(doc)
    return doc["key"]


# --------- Stripe Helpers ---------

def _is_real_stripe_key(key: str) -> bool:
    """Detect real Stripe keys vs the Emergent placeholder 'sk_test_emergent'."""
    if not key or key == "sk_test_emergent":
        return False
    return key.startswith("sk_live_") or (key.startswith("sk_test_") and len(key) > 20)


def _build_subscription_metadata(req: CreateCheckoutRequest, package: dict) -> dict[str, str]:
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


async def _create_subscription_session(req: CreateCheckoutRequest, package: dict):
    """Real Stripe Subscription Checkout (12 monthly or 2 bi-annual installments)."""
    success_url = f"{req.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/close"
    cancel_at = int((datetime.now(timezone.utc) + timedelta(days=370)).timestamp())
    metadata = _build_subscription_metadata(req, package)

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
        subscription_data={"cancel_at": cancel_at, "metadata": metadata},
        customer_email=req.email or None,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )


async def _create_one_time_session(stripe_key: str, req: CreateCheckoutRequest, package: dict, charge_amount: float, was_subscription: bool):
    """One-time Stripe Checkout via emergentintegrations.

    IMPORTANT: emergentintegrations.CheckoutSessionRequest expects the amount in
    MAJOR currency units (EUR), NOT cents. Do NOT multiply by 100 here — the
    library handles the cent conversion internally. (The direct Stripe SDK call
    in _create_subscription_session uses raw cents, which is a different API.)
    """
    # Defense-in-depth: sanity-check the amount to prevent future config typos
    # from silently producing 99,700 EUR or 0.01 EUR Stripe sessions.
    if not (1 <= charge_amount <= 100000):
        raise HTTPException(
            status_code=500,
            detail=f"Invalid charge amount {charge_amount} EUR (must be 1–100000)"
        )

    stripe_client = StripeCheckout(api_key=stripe_key)
    success_url = f"{req.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/close"
    checkout_req = CheckoutSessionRequest(
        amount=round(float(charge_amount), 2),
        currency=package["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "package_id": req.package_id,
            "plan": package["plan"],
            "billing": package["billing"],
            "fallback_from_subscription": "true" if was_subscription else "false",
        },
    )
    return await stripe_client.create_checkout_session(checkout_req)


def _build_subscription_tx(session, req: CreateCheckoutRequest, package: dict) -> dict:
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
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def _build_one_time_tx(session, req: CreateCheckoutRequest, package: dict, charge_amount: float, was_subscription: bool) -> dict:
    return {
        "session_id": session.session_id, "package_id": req.package_id,
        "package_name": package["name"],
        "amount": charge_amount, "total_amount": charge_amount,
        "currency": package["currency"], "plan": package["plan"],
        "billing": package["billing"], "mode": "payment",
        "fallback_from_subscription": was_subscription,
        "email": req.email or "", "name": req.user_name or "",
        "user_session_id": req.user_session_id or "",
        "payment_status": "initiated", "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


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
        use_real_subscription = mode == "subscription" and _is_real_stripe_key(app_config.get("stripe_key", ""))

        if use_real_subscription:
            try:
                session = await _create_subscription_session(req, package)
            except Exception as e:
                logger.error(f"Subscription checkout error: {e}")
                raise HTTPException(status_code=500, detail=f"Checkout error: {str(e)}")
            await db.payment_transactions.insert_one(_build_subscription_tx(session, req, package))
            return {"url": session.url, "session_id": session.id, "mode": "subscription"}

        # Fallback / one-time payment path
        charge_amount = package.get("total_amount") if mode == "subscription" else package["amount"]
        session = await _create_one_time_session(app_config["stripe_key"], req, package, charge_amount, mode == "subscription")
        await db.payment_transactions.insert_one(_build_one_time_tx(session, req, package, charge_amount, mode == "subscription"))
        return {"url": session.url, "session_id": session.session_id, "mode": "payment"}

    @router.get("/payments/status/{session_id}")
    async def get_payment_status(session_id: str):
        tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if tx and tx.get("mode") == "subscription":
            try:
                session = await asyncio.to_thread(stripe_sdk.checkout.Session.retrieve, session_id)
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
        try:
            body = await request.json()
            webhook_response = CheckoutStatusResponse(**body)
            if webhook_response.payment_status == "paid":
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {
                        "payment_status": "paid", "status": "complete",
                        "event_type": webhook_response.event_type,
                        "event_id": webhook_response.event_id,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }},
                )
                await _handle_paid_webhook(db, app_config, webhook_response.session_id)
            else:
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {
                        "payment_status": webhook_response.payment_status,
                        "status": "failed",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }},
                )
            return {"status": "ok"}
        except Exception as e:
            logger.error(f"Webhook error: {e}")
            return {"status": "error", "message": str(e)}


def register_license_routes(router: APIRouter, db, app_config: dict) -> None:
    """License key lifecycle: create / activate / validate / list / revoke."""

    @router.post("/license/create")
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

    @router.get("/license/list")
    async def list_license_keys() -> dict:
        keys = await db.license_keys.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"keys": keys, "total": len(keys)}

    @router.post("/license/revoke/{key}")
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
