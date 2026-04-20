from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest, CheckoutStatusResponse
import asyncio
import logging
import secrets
import string

from models import CreateCheckoutRequest, LicenseKeyActivate, LicenseKeyCreate

logger = logging.getLogger(__name__)

PACKAGES = {
    "starter": {"name": "Starter – Video Lessons + Credits", "amount": 199.00, "currency": "eur", "plan": "starter", "billing": "one_time"},
    "standard_yearly": {"name": "Standard – Leadership System", "amount": 997.00, "currency": "eur", "plan": "standard", "billing": "yearly"},
    "standard_monthly": {"name": "Standard – Leadership System (Monatsrate)", "amount": 83.08, "currency": "eur", "plan": "standard", "billing": "monthly"},
    "fasttrack_yearly": {"name": "Fast Track – Leadership Accelerator · AI Learning Path", "amount": 6970.00, "currency": "eur", "plan": "fasttrack", "billing": "yearly"},
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
        "starter": {"name": "Starter – Video Lessons + Credits", "duration_days": 365, "includes_calls": False},
        "standard": {"name": "Standard – Leadership System", "duration_days": 365, "includes_calls": False},
        "fasttrack": {"name": "Fast Track – Leadership Accelerator · AI Learning Path", "duration_days": 365, "includes_calls": True},
    }
    config = plan_config.get(plan, plan_config["standard"])
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


def register_payment_routes(router: APIRouter, db, app_config):

    @router.post("/payments/create-checkout")
    async def create_checkout(req: CreateCheckoutRequest, http_request: Request):
        package = PACKAGES.get(req.package_id)
        if not package:
            raise HTTPException(status_code=400, detail=f"Unknown package: {req.package_id}")
        stripe = StripeCheckout(api_key=app_config["stripe_key"])
        amount_cents = int(package["amount"] * 100)
        success_url = f"{req.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{req.origin_url}/close"
        checkout_req = CheckoutSessionRequest(
            amount=amount_cents, currency=package["currency"],
            success_url=success_url, cancel_url=cancel_url,
            metadata={"package_id": req.package_id, "plan": package["plan"], "billing": package["billing"]}
        )
        session = await stripe.create_checkout_session(checkout_req)
        await db.payment_transactions.insert_one({
            "session_id": session.session_id, "package_id": req.package_id,
            "package_name": package["name"], "amount": package["amount"],
            "currency": package["currency"], "plan": package["plan"],
            "billing": package["billing"], "email": req.email or "",
            "name": req.user_name or "", "user_session_id": req.user_session_id or "",
            "payment_status": "initiated", "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"url": session.url, "session_id": session.session_id}

    @router.get("/payments/status/{session_id}")
    async def get_payment_status(session_id: str, http_request: Request):
        tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
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
                amount = 6970.0 if data.plan == "fasttrack" else 997.0 if data.plan == "standard" else 199.0
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
                if exp.tzinfo == None:
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
