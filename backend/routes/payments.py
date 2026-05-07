from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest, CheckoutStatusResponse
import asyncio
import logging
import secrets
import string
import stripe as stripe_sdk

from models import CreateCheckoutRequest, LicenseKeyActivate, LicenseKeyCreate

logger = logging.getLogger(__name__)

PACKAGES = {
    # Leadership OS — 3 payment options
    # Einmalzahlung: one-time charge of full amount
    "leader_os_full": {
        "name": "Leadership OS — Einmalzahlung",
        "amount": 997.00, "currency": "eur", "plan": "leader_os",
        "billing": "one_time", "mode": "payment",
    },
    # 2 Raten (every 6 months × 2 cycles = 1 year)
    "leader_os_2rate": {
        "name": "Leadership OS — 2 Raten à 550 EUR",
        "amount": 550.00, "currency": "eur", "plan": "leader_os",
        "billing": "2_rates", "mode": "subscription",
        "interval": "month", "interval_count": 6, "cycles": 2,
        "total_amount": 1100.00,
    },
    # 12 Monatsraten (every month × 12 cycles)
    "leader_os_12rate": {
        "name": "Leadership OS — 12 Monatsraten à 99 EUR",
        "amount": 99.00, "currency": "eur", "plan": "leader_os",
        "billing": "12_rates", "mode": "subscription",
        "interval": "month", "interval_count": 1, "cycles": 12,
        "total_amount": 1188.00,
    },
    # OS PLUS — Einmalzahlung
    "leader_os_plus": {
        "name": "Leadership OS PLUS — inkl. 12 Coachings",
        "amount": 4447.00, "currency": "eur", "plan": "leader_os_plus",
        "billing": "one_time", "mode": "payment",
    },
    # Legacy alias (backward compatibility)
    "standard_yearly": {
        "name": "Leadership OS — Einmalzahlung",
        "amount": 997.00, "currency": "eur", "plan": "leader_os",
        "billing": "one_time", "mode": "payment",
    },
}


def generate_license_key() -> str:
    chars = string.ascii_uppercase + string.digits
    parts = [''.join(secrets.choice(chars) for _ in range(4)) for _ in range(3)]
    return f"WLAD-{parts[0]}-{parts[1]}-{parts[2]}"


async def create_license_key_internal(db, plan, email=None, name=None, source="stripe", notes=None):
    key = generate_license_key()
    while await db.license_keys.find_one({"key": key}):
        key = generate_license_key()
    plan_config = {
        "leader_os": {"name": "Leadership OS — 1 Jahr Vollzugang + 12 Videokurse", "duration_days": 365, "includes_calls": False},
        "leader_os_plus": {"name": "Leadership OS PLUS — 1 Jahr inkl. 12 Einzelcoachings", "duration_days": 365, "includes_calls": True},
        "leader_os_enterprise": {"name": "Leadership OS ENTERPRISE — B2B-Lizenz", "duration_days": 365, "includes_calls": False},
        # Legacy support
        "starter": {"name": "Starter – Video Lessons + Credits", "duration_days": 365, "includes_calls": False},
        "standard": {"name": "Leadership OS — 1 Jahr Vollzugang", "duration_days": 365, "includes_calls": False},
        "fasttrack": {"name": "Fast Track – Leadership Accelerator", "duration_days": 365, "includes_calls": True},
    }
    config = plan_config.get(plan, plan_config["leader_os"])
    doc = {
        "key": key, "plan": plan, "plan_name": config["name"], "status": "active",
        "email": email, "name": name, "source": source, "notes": notes,
        "includes_calls": config["includes_calls"], "duration_days": config["duration_days"],
        "activated_by": None, "activated_at": None, "expires_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.license_keys.insert_one(doc)
    logger.info(f"License key created: {key} ({plan}) for {email or 'unassigned'}")
    return key


def _is_real_stripe_key(key: str) -> bool:
    """Detect real Stripe keys (sk_live_... or sk_test_<long-hash>) vs the
    Emergent platform placeholder 'sk_test_emergent'. Subscription mode
    requires direct Stripe SDK access which only works with real keys.
    """
    if not key:
        return False
    if key == "sk_test_emergent":
        return False
    return key.startswith("sk_live_") or (key.startswith("sk_test_") and len(key) > 20)


def register_payment_routes(router: APIRouter, db, app_config):

    # Set Stripe SDK key once (subscriptions only work with real Stripe keys)
    stripe_sdk.api_key = app_config.get("stripe_key", "")

    async def _create_subscription_checkout(package, req, http_request):
        """Create a Stripe Checkout in subscription mode for installment plans.

        Uses Stripe SDK directly (emergentintegrations only supports one-time).
        Sets cancel_at to 1 year from now so the subscription auto-cancels after
        all installments are collected (12 months total for both 2-rate and 12-rate plans).
        """
        success_url = f"{req.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{req.origin_url}/close"
        cancel_at = int((datetime.now(timezone.utc) + timedelta(days=370)).timestamp())  # +5 days buffer

        metadata = {
            "package_id": req.package_id,
            "plan": package["plan"],
            "billing": package["billing"],
            "cycles": str(package["cycles"]),
            "total_amount": str(package["total_amount"]),
            "user_email": req.email or "",
            "user_name": req.user_name or "",
            "user_session_id": req.user_session_id or "",
        }

        # Inline price_data — no need to pre-create Stripe Products
        session = await asyncio.to_thread(
            stripe_sdk.checkout.Session.create,
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": package["currency"],
                    "product_data": {"name": package["name"]},
                    "unit_amount": int(package["amount"] * 100),
                    "recurring": {
                        "interval": package["interval"],
                        "interval_count": package["interval_count"],
                    },
                },
                "quantity": 1,
            }],
            subscription_data={
                "cancel_at": cancel_at,
                "metadata": metadata,
            },
            customer_email=req.email or None,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
        )
        return session

    @router.post("/payments/create-checkout")
    async def create_checkout(req: CreateCheckoutRequest, http_request: Request):
        package = PACKAGES.get(req.package_id)
        if not package:
            raise HTTPException(status_code=400, detail=f"Unknown package: {req.package_id}")

        mode = package.get("mode", "payment")
        use_real_subscription = mode == "subscription" and _is_real_stripe_key(app_config.get("stripe_key", ""))

        if use_real_subscription:
            try:
                session = await _create_subscription_checkout(package, req, http_request)
            except Exception as e:
                logger.error(f"Subscription checkout error: {e}")
                raise HTTPException(status_code=500, detail=f"Checkout error: {str(e)}")

            await db.payment_transactions.insert_one({
                "session_id": session.id, "package_id": req.package_id,
                "package_name": package["name"],
                "amount": package["amount"],  # per-installment amount
                "total_amount": package.get("total_amount", package["amount"]),
                "currency": package["currency"], "plan": package["plan"],
                "billing": package["billing"], "mode": "subscription",
                "cycles": package.get("cycles", 1),
                "stripe_subscription_id": getattr(session, "subscription", None),
                "email": req.email or "",
                "name": req.user_name or "", "user_session_id": req.user_session_id or "",
                "payment_status": "initiated", "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
            return {"url": session.url, "session_id": session.id, "mode": "subscription"}

        # One-time payment via emergentintegrations.
        # For installment plans WITHOUT real Stripe key: charge total_amount upfront as fallback
        # so the platform stays usable in test/preview environments.
        stripe = StripeCheckout(api_key=app_config["stripe_key"])
        charge_amount = package.get("total_amount") if mode == "subscription" else package["amount"]
        amount_cents = int(charge_amount * 100)
        success_url = f"{req.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{req.origin_url}/close"
        checkout_req = CheckoutSessionRequest(
            amount=amount_cents, currency=package["currency"],
            success_url=success_url, cancel_url=cancel_url,
            metadata={
                "package_id": req.package_id,
                "plan": package["plan"],
                "billing": package["billing"],
                "fallback_from_subscription": "true" if mode == "subscription" else "false",
            }
        )
        session = await stripe.create_checkout_session(checkout_req)
        await db.payment_transactions.insert_one({
            "session_id": session.session_id, "package_id": req.package_id,
            "package_name": package["name"],
            "amount": charge_amount,
            "total_amount": charge_amount,
            "currency": package["currency"], "plan": package["plan"],
            "billing": package["billing"], "mode": "payment",
            "fallback_from_subscription": mode == "subscription",
            "email": req.email or "",
            "name": req.user_name or "", "user_session_id": req.user_session_id or "",
            "payment_status": "initiated", "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"url": session.url, "session_id": session.session_id, "mode": "payment"}

    @router.get("/payments/status/{session_id}")
    async def get_payment_status(session_id: str, http_request: Request):
        tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if tx and tx.get("mode") == "subscription":
            # For subscriptions: check Stripe directly (emergentintegrations doesn't handle subs)
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
            stripe = StripeCheckout(api_key=app_config["stripe_key"])
            status = await stripe.get_checkout_status(session_id)
            return {"session_id": session_id, "payment_status": status.payment_status, "status": status.status}
        except Exception:
            return {"session_id": session_id, "payment_status": "unknown", "status": "unknown"}

    @router.post("/webhook/stripe")
    async def stripe_webhook(request: Request):
        from routes.email import send_payment_email_background
        try:
            body = await request.json()
            webhook_response = CheckoutStatusResponse(**body)
            if webhook_response.payment_status == "paid":
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "paid", "status": "complete",
                              "event_type": webhook_response.event_type,
                              "event_id": webhook_response.event_id,
                              "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                tx = await db.payment_transactions.find_one({"session_id": webhook_response.session_id}, {"_id": 0})
                if tx:
                    plan = tx.get("plan", "standard")
                    email = tx.get("email")
                    name = tx.get("name") or email or "Leader"
                    key = await create_license_key_internal(db, plan=plan, email=email, name=name, source="stripe")
                    await db.payment_transactions.update_one(
                        {"session_id": webhook_response.session_id}, {"$set": {"license_key": key}}
                    )
                    if email:
                        asyncio.create_task(send_payment_email_background(db, app_config, email, name, plan, tx.get("amount", 997)))
            else:
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": webhook_response.payment_status, "status": "failed",
                              "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
            return {"status": "ok"}
        except Exception as e:
            logger.error(f"Webhook error: {e}")
            return {"status": "error", "message": str(e)}

    # --- License Key Endpoints ---

    @router.post("/license/create")
    async def create_license_key_endpoint(data: LicenseKeyCreate):
        key = await create_license_key_internal(db, plan=data.plan, email=data.email, name=data.name, source="manual", notes=data.notes)
        if data.email and app_config.get("resend_key"):
            try:
                import resend
                from email_templates import payment_confirmation_email
                amount_map = {"leader_os": 997.0, "leader_os_plus": 4447.0, "leader_os_enterprise": 997.0, "fasttrack": 6970.0, "standard": 997.0, "starter": 199.0}
                amount = amount_map.get(data.plan, 997.0)
                email_data = payment_confirmation_email(data.name or "Leader", data.plan, amount)
                await asyncio.to_thread(resend.Emails.send, {
                    "from": f"Wlad von WLADHUB <{app_config['sender_email']}>",
                    "to": [data.email],
                    "subject": f"Dein License Key: {key} — WLADHUB",
                    "html": email_data["html"].replace("Sofort aktiv", f"Key: <strong>{key}</strong>"),
                })
            except Exception as e:
                logger.error(f"License key email error: {e}")
        return {"key": key, "plan": data.plan, "status": "active"}

    @router.post("/license/activate")
    async def activate_license_key(data: LicenseKeyActivate):
        from datetime import timedelta
        key_doc = await db.license_keys.find_one({"key": data.license_key.upper().strip()}, {"_id": 0})
        if not key_doc:
            raise HTTPException(status_code=404, detail="Ungültiger License Key. Bitte prüfe deine Eingabe.")
        if key_doc["status"] == "used":
            raise HTTPException(status_code=400, detail="Dieser Key wurde bereits aktiviert.")
        if key_doc["status"] == "revoked":
            raise HTTPException(status_code=400, detail="Dieser Key wurde deaktiviert.")
        if key_doc["status"] == "expired":
            raise HTTPException(status_code=400, detail="Dieser Key ist abgelaufen.")
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=key_doc.get("duration_days", 365))
        await db.license_keys.update_one(
            {"key": data.license_key.upper().strip()},
            {"$set": {"status": "used", "activated_by": data.email or key_doc.get("email"),
                      "activated_at": now.isoformat(), "expires_at": expires_at.isoformat()}}
        )
        return {"success": True, "plan": key_doc["plan"], "plan_name": key_doc["plan_name"],
                "includes_calls": key_doc.get("includes_calls", False),
                "expires_at": expires_at.isoformat(), "redirect_url": "https://leader-os.de",
                "message": "Key erfolgreich aktiviert! Du wirst zu leader-os.de weitergeleitet."}

    @router.get("/license/validate/{key}")
    async def validate_license_key(key: str):
        key_doc = await db.license_keys.find_one({"key": key.upper().strip()}, {"_id": 0})
        if not key_doc:
            return {"valid": False, "message": "Key nicht gefunden"}
        if key_doc["status"] == "active":
            return {"valid": True, "status": "active", "plan": key_doc["plan"], "message": "Key ist gültig und bereit zur Aktivierung"}
        if key_doc["status"] == "used":
            expires_at = key_doc.get("expires_at")
            if expires_at:
                exp = datetime.fromisoformat(expires_at)
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                if exp < datetime.now(timezone.utc):
                    await db.license_keys.update_one({"key": key.upper().strip()}, {"$set": {"status": "expired"}})
                    return {"valid": False, "status": "expired", "message": "Key ist abgelaufen"}
            return {"valid": True, "status": "used", "plan": key_doc["plan"], "activated_by": key_doc.get("activated_by"), "expires_at": expires_at}
        return {"valid": False, "status": key_doc["status"], "message": f"Key Status: {key_doc['status']}"}

    @router.get("/license/list")
    async def list_license_keys():
        keys = await db.license_keys.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"keys": keys, "total": len(keys)}

    @router.post("/license/revoke/{key}")
    async def revoke_license_key(key: str):
        result = await db.license_keys.update_one(
            {"key": key.upper().strip()},
            {"$set": {"status": "revoked", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Key nicht gefunden")
        return {"success": True, "message": f"Key {key} wurde deaktiviert"}
