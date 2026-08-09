"""Stripe Payment routes - Premium coaching checkout."""
import os
import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
import uuid
from datetime import datetime, timezone

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse, CheckoutStatusResponse
)

from config import db, STRIPE_API_KEY, logger
from services import get_current_user, require_cron_auth
from services_tier import TIER_CONFIG, activate_tier, resolve_user_tier, calc_enterprise_quote
from services_email import (
    send_email, tier_welcome_email, installment_due_email, monthly_scorecard_email,
    stripe_receipt_email, is_enabled as email_enabled,
)

router = APIRouter(prefix="/api", tags=["payments"])


# Iter 92.12 (Mert "sehe immer noch sandbox"):
# Health/mode-detection endpoint so Mert can see at a glance whether the
# pod is configured for LIVE Stripe charges or still on a test/sandbox key.
# Public — returns NO secrets, just the mode + the first 7 chars of the key
# so the Mert can verify the prefix without exposing the full secret.
@router.get("/payments/stripe-mode")
async def stripe_mode():
    key = STRIPE_API_KEY or ""
    if not key:
        return {
            "configured": False,
            "mode": "missing",
            "live": False,
            "warning": "STRIPE_API_KEY not set — checkout will fail.",
            "key_prefix": None,
        }
    if key == "sk_test_emergent":
        return {
            "configured": True,
            "mode": "platform_default",
            "live": False,
            "warning": "Using Emergent's shared sandbox key (sk_test_emergent). Replace with your own sk_live_… key in backend/.env before going live.",
            "key_prefix": "sk_test_e…",
        }
    if key.startswith("sk_live_"):
        return {
            "configured": True,
            "mode": "live",
            "live": True,
            "warning": None,
            "key_prefix": key[:8] + "…",
        }
    if key.startswith("sk_test_"):
        return {
            "configured": True,
            "mode": "test",
            "live": False,
            "warning": "Stripe is in TEST mode — real cards will fail. Switch to sk_live_… for production.",
            "key_prefix": key[:8] + "…",
        }
    return {
        "configured": True,
        "mode": "unknown",
        "live": False,
        "warning": "Unrecognized Stripe key prefix. Expected sk_live_ or sk_test_.",
        "key_prefix": key[:7] + "…",
    }


# Fixed packages — amounts defined server-side only (security).
# 3-Tier Structure: Free | Leadership OS €997 | Leadership OS PLUS €4.797 | Enterprise (quote)
PACKAGES = {
    # Leadership OS (€997/Jahr) — one-time
    "leadership_os": {
        "name": "Leadership OS (1 Jahr)",
        "tier": "standard",
        "amount": 997.00,
        "currency": "eur",
        "description": "1 Jahr Vollzugang · 12 Videokurse (1/Monat freigeschaltet, Wert 2.388€) · WladBot AI Coach 24/7 · 30-Tage-Programm · alle Frameworks · 30-Tage Geld-zurück",
        "billing": "one_time",
    },
    # Leadership OS — 2 Raten à 550€ (1.100€ gesamt, 103€ Aufschlag)
    "leadership_os_2x": {
        "name": "Leadership OS · 2× Rate (1. Rate)",
        "tier": "standard",
        "amount": 550.00,
        "currency": "eur",
        "description": "Rate 1 von 2 · insgesamt 1.100€ · sofortiger Vollzugang · zweite Rate in 30 Tagen",
        "billing": "installment",
        "installment_plan_id": "leadership_os_2x",
        "installments_total": 2,
    },
    # Leadership OS — 12 Raten à 99€ (1.188€ gesamt, 191€ Aufschlag)
    "leadership_os_12x": {
        "name": "Leadership OS · 12× Rate (1. Rate)",
        "tier": "standard",
        "amount": 99.00,
        "currency": "eur",
        "description": "Rate 1 von 12 · insgesamt 1.188€ · sofortiger Vollzugang · 11× monatlich 99€ Folge-Raten",
        "billing": "installment",
        "installment_plan_id": "leadership_os_12x",
        "installments_total": 12,
    },
    # Leadership OS PLUS (€4.797/Jahr) — alles aus OS + 12 Einzelcoachings
    "leadership_os_plus": {
        "name": "Leadership OS PLUS (1 Jahr)",
        "tier": "accelerator",
        "amount": 4797.00,
        "currency": "eur",
        "description": "Alles aus Leadership OS + 12 Einzelcoachings (je 299€, Wert 3.588€) mit Argumentorik-Leadership-Coaches · Video-Analyse · Mastermind · Priority Support",
        "billing": "one_time",
    },
}


# Legacy package keys kept ONLY for backwards-compatibility with any historical
# checkout sessions that may still resolve via webhook. They map to the same
# canonical tier IDs but should not be exposed in the new pricing UI.
LEGACY_PACKAGES = {
    "starter": {"name": "Video Lessons (Legacy)", "tier": "free", "amount": 199.0, "currency": "eur", "billing": "one_time"},
    "standard": {"name": "Standard (Legacy)", "tier": "standard", "amount": 997.0, "currency": "eur", "billing": "one_time"},
    "accelerator": {"name": "Accelerator (Legacy)", "tier": "accelerator", "amount": 6970.0, "currency": "eur", "billing": "one_time"},
    "accelerator_installment": {"name": "Accelerator Rate (Legacy)", "tier": "accelerator", "amount": 580.83, "currency": "eur", "billing": "installment", "installments_total": 12},
    "enterprise": {"name": "Enterprise Legacy", "tier": "enterprise", "amount": 2497.0, "currency": "eur", "billing": "one_time"},
}


def _resolve_package(package_id: str) -> dict | None:
    return PACKAGES.get(package_id) or LEGACY_PACKAGES.get(package_id) or TEST_PACKAGES.get(package_id)


# Iter 92.59 (Mert): internal 1€ end-to-end LIVE test of the full purchase
# flow (Stripe live key → webhook/polling → tier activation → welcome mails).
# NEVER listed in /payments/packages. Checkout is double-gated: activation
# code (sent per email) AND allow-listed buyer email.
TEST_PACKAGES = {
    "leadership_os_1eur_test": {
        "name": "Leadership OS · Live-Test (1€)",
        "tier": "standard",
        "amount": 1.00,
        "currency": "eur",
        "description": "Interner 1€-Livetest — aktiviert den vollen Leadership-OS-Plan.",
        "billing": "one_time",
    },
}
TEST_ACTIVATION_CODE = "WLAD-1EURO-2026"


async def _activate_from_package(user_id: str, package_id: str):
    """Activate tier + credits based on package, send welcome email."""
    pkg = _resolve_package(package_id)
    if not pkg:
        logger.warning(f"Unknown package on activation: {package_id}")
        return
    # Add-ons (legacy) — flag entitlement only, no tier change
    if pkg.get("is_addon"):
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                f"addons.{package_id}": {
                    "active": True,
                    "activated_at": datetime.now(timezone.utc).isoformat(),
                    "billing": pkg.get("billing"),
                    "amount": pkg.get("amount"),
                },
            }},
        )
        logger.info(f"Addon {package_id} activated for user {user_id}")
        return
    tier = pkg.get("tier", "standard")
    via_inst = pkg.get("billing") == "installment"
    plan_id = pkg.get("installment_plan_id")
    await activate_tier(user_id, tier, via_installment=via_inst, installment_plan_id=plan_id)
    logger.info(f"Tier {tier} activated for user {user_id} via {package_id} (installment={via_inst}, plan={plan_id})")

    # Iter 92.18: CRM webhook — checkout completed signal (highest-value event)
    try:
        import services_crm
        user_for_crm = await db.users.find_one({"user_id": user_id}, {"_id": 0, "email": 1, "name": 1, "tier": 1})
        amount_eur = float(pkg.get("amount", 0))
        services_crm.checkout_completed(
            user_for_crm or {"user_id": user_id},
            amount_eur=amount_eur,
            package_id=package_id,
        )
    except Exception as crm_err:
        logger.debug(f"CRM checkout emit failed (non-blocking): {crm_err}")

    # Fire welcome email (best-effort) + Stripe receipt
    if email_enabled() and tier in ("standard", "accelerator", "enterprise"):
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if user and user.get("email"):
            name = user.get("name") or user["email"].split("@")[0]
            # Find the most recent paid transaction for this user → receipt details
            tx = await db.payment_transactions.find_one(
                {"user_id": user_id, "payment_status": "paid"},
                {"_id": 0}, sort=[("paid_at", -1)],
            )
            try:
                # 1. Receipt email — always send if we have transaction data
                if tx:
                    receipt_sub, receipt_html = stripe_receipt_email(
                        name=name,
                        package_name=tx.get("package_name") or pkg.get("name", "Leader-OS"),
                        amount=float(tx.get("amount") or pkg.get("amount", 0)),
                        currency=tx.get("currency") or pkg.get("currency", "eur"),
                        tier=tier,
                        transaction_id=tx.get("transaction_id") or "—",
                    )
                    await send_email(user["email"], receipt_sub, receipt_html)
                    await db.email_log.insert_one({
                        "user_id": user_id, "type": f"stripe_receipt_{tx.get('transaction_id', 'unknown')}",
                        "sent_at": datetime.now(timezone.utc).isoformat(),
                    })

                # 2. Tier welcome email (the celebratory one)
                # Iter 92.27: env-driven app_url so emails from each Vercel project
                # (leaderos vs leadercheck) link back to their own domain.
                from services_email import _frontend_url
                subject, html = tier_welcome_email(tier, name, app_url=_frontend_url())
                await send_email(user["email"], subject, html)
                await db.email_log.insert_one({
                    "user_id": user_id, "type": f"welcome_{tier}", "sent_at": datetime.now(timezone.utc).isoformat(),
                })
            except Exception as e:
                logger.error(f"Post-purchase emails failed for {user_id}: {e}")


async def _record_pending_transaction(session_id: str, user: dict, package_id: str, package: dict) -> str:
    """Record a pending payment transaction in DB."""
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    await db.payment_transactions.insert_one({
        "transaction_id": tx_id,
        "session_id": session_id,
        "user_id": user["user_id"],
        "user_email": user.get("email", ""),
        "package_id": package_id,
        "package_name": package["name"],
        "tier": package.get("tier"),
        "billing": package.get("billing", "one_time"),
        "amount": package["amount"],
        "currency": package["currency"],
        "payment_status": "pending",
        "status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return tx_id


class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str
    discount_code: str | None = None


@router.get("/payments/packages")
async def get_packages():
    """Return available payment packages with tier features (public)."""
    result = []
    for k, v in PACKAGES.items():
        tier_cfg = TIER_CONFIG.get(v.get("tier", "free"), TIER_CONFIG["free"])
        result.append({
            "id": k,
            "name": v["name"],
            "tier": v.get("tier"),
            "amount": v["amount"],
            "currency": v["currency"],
            "description": v["description"],
            "billing": v.get("billing", "one_time"),
            "installments_total": v.get("installments_total"),
            "duration_days": tier_cfg.get("duration_days"),
            "features": tier_cfg.get("features", {}),
        })
    return result


@router.get("/payments/tiers")
async def get_tier_matrix():
    """Public: full tier/feature matrix for pricing page."""
    return [
        {"id": k, **{kk: vv for kk, vv in v.items() if kk != "features"}, "features": v["features"]}
        for k, v in TIER_CONFIG.items()
    ]


@router.get("/user/tier")
async def get_user_tier(request: Request):
    """Return current user's resolved tier info."""
    user = await get_current_user(request)
    return await resolve_user_tier(user)


@router.post("/payments/checkout")
async def create_checkout(data: CheckoutRequest, request: Request):
    """Create a Stripe checkout session for a package."""
    user = await get_current_user(request)

    package = _resolve_package(data.package_id)
    if not package:
        raise HTTPException(status_code=400, detail="Ungültiges Paket")

    # 1€-Livetest gate: correct code AND trusted is_admin DB flag required
    # (SEC re-audit: email allowlists are claimable — same root cause as SEC-003).
    if data.package_id in TEST_PACKAGES:
        if (data.discount_code or "").strip().upper() != TEST_ACTIVATION_CODE:
            raise HTTPException(status_code=403, detail="Ungültiger Aktivierungscode")
        if not user.get("is_admin"):
            raise HTTPException(status_code=403, detail="Nicht freigeschaltet für den Livetest")

    # Discount codes — currently single hardcoded "WLAD10" earned via the
    # Fake-Wlad-Call A/B bribe variant. Applied server-side so users can't
    # fake it client-side.
    DISCOUNT_CODES = {"WLAD10": 0.10}  # 10% off
    discount_pct = 0.0
    if data.discount_code and data.discount_code.upper() in DISCOUNT_CODES:
        discount_pct = DISCOUNT_CODES[data.discount_code.upper()]

    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe nicht konfiguriert")

    final_amount = round(package["amount"] * (1 - discount_pct), 2)

    origin = data.origin_url.rstrip("/")
    success_url = f"{origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/coaching"

    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"

    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

        checkout_request = CheckoutSessionRequest(
            amount=final_amount,
            currency=package["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user["user_id"],
                "user_email": user.get("email", ""),
                "package_id": data.package_id,
                "package_name": package["name"],
                "discount_code": data.discount_code or "",
                "discount_pct": str(discount_pct),
                "original_amount": str(package["amount"]),
            }
        )

        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)

        await _record_pending_transaction(session.session_id, user, data.package_id, package)
        if discount_pct:
            # Mark this user as having redeemed the bribe — A/B analytics
            await db.ab_events.insert_one({
                "user_id": user["user_id"],
                "experiment": "fake_wlad_call_bribe",
                "variant": "bribe",
                "event": "bribe_redeemed",
                "meta": {"package_id": data.package_id, "discount_pct": discount_pct,
                         "final_amount": final_amount},
                "ts": datetime.now(timezone.utc).isoformat(),
            })
        logger.info(f"Checkout session created: {session.session_id} for user {user['user_id']} ({package['name']}, discount={discount_pct*100:.0f}%)")
        return {"url": session.url, "session_id": session.session_id, "discounted_amount": final_amount}

    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=f"Checkout fehlgeschlagen: {str(e)}")


@router.get("/payments/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    """Check the status of a checkout session and update DB."""
    user = await get_current_user(request)

    tx = await db.payment_transactions.find_one(
        {"session_id": session_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Transaktion nicht gefunden")

    # If already processed, return cached status
    if tx.get("payment_status") in ("paid", "completed"):
        return {
            "status": tx.get("status", "complete"),
            "payment_status": tx["payment_status"],
            "amount": tx["amount"],
            "currency": tx["currency"],
            "package_id": tx.get("package_id"),
        }

    try:
        webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)

        # Update transaction
        update = {
            "payment_status": status.payment_status,
            "status": status.status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        if status.payment_status == "paid" and tx.get("payment_status") != "paid":
            update["paid_at"] = datetime.now(timezone.utc).isoformat()
            if tx.get("billing") == "installment_followup":
                await _handle_installment_payment(user["user_id"], tx.get("installment_num", 1))
            else:
                await _activate_from_package(user["user_id"], tx.get("package_id"))

        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update}
        )

        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount": status.amount_total / 100,  # cents to euros
            "currency": status.currency,
            "package_id": tx.get("package_id"),
        }

    except Exception as e:
        logger.error(f"Checkout status error: {e}")
        raise HTTPException(status_code=500, detail=f"Status-Abfrage fehlgeschlagen: {str(e)}")


async def _finalize_paid_transaction(event, tx: dict) -> None:
    """Mark a pending tx as paid and trigger tier activation or installment booking."""
    await db.payment_transactions.update_one(
        {"session_id": event.session_id},
        {"$set": {
            "payment_status": "paid",
            "status": "complete",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    user_id = tx.get("user_id")
    if not user_id:
        return
    if tx.get("billing") == "installment_followup":
        await _handle_installment_payment(user_id, tx.get("installment_num", 1))
    else:
        await _activate_from_package(user_id, tx.get("package_id"))


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """DEPRECATED — Stripe webhooks are now handled by the Supabase Edge Function
    at `https://srujvjjncrszhaaxepxf.supabase.co/functions/v1/stripe-webhook`.

    This endpoint is intentionally kept active to return 410 Gone if Stripe is
    ever misconfigured to point here — that way the error is loud (visible in
    Stripe Dashboard) instead of silent. To re-enable, restore the prior body
    from git history (commit before iter 88).
    """
    logger.warning(
        "DEPRECATED /api/webhook/stripe was called. "
        "Stripe should be configured to point at the Supabase Edge Function instead. "
        f"Headers: stripe-sig={'present' if request.headers.get('Stripe-Signature') else 'MISSING'}"
    )
    return JSONResponse(
        status_code=410,
        content={
            "detail": "endpoint_deprecated",
            "message": "Stripe webhooks moved to Supabase Edge Function. Update Stripe Dashboard endpoint URL.",
            "canonical_endpoint": "https://srujvjjncrszhaaxepxf.supabase.co/functions/v1/stripe-webhook",
        },
    )


@router.get("/payments/history")
async def get_payment_history(request: Request):
    """Get user's payment history."""
    user = await get_current_user(request)
    txs = await db.payment_transactions.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return txs



# ── Installment flow ─────────────────────────────────────────────────────────

async def _create_installment_checkout(user: dict, origin: str, base_url: str, plan: dict) -> dict:
    """Create Stripe checkout for the NEXT installment of an existing plan."""
    amount = plan.get("amount_per_installment", 99.00)
    installment_num = plan.get("installments_paid", 0) + 1
    success_url = f"{origin.rstrip('/')}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&installment={installment_num}"
    cancel_url = f"{origin.rstrip('/')}/coaching"
    webhook_url = f"{base_url.rstrip('/')}/api/webhook/stripe"

    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    plan_id = plan.get("plan_id", "leadership_os_12x")
    checkout_request = CheckoutSessionRequest(
        amount=amount, currency="eur",
        success_url=success_url, cancel_url=cancel_url,
        metadata={
            "user_id": user["user_id"], "user_email": user.get("email", ""),
            "package_id": f"{plan_id}_followup",
            "installment_num": str(installment_num),
            "installments_total": str(plan.get("installments_total", 12)),
        },
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)

    await db.payment_transactions.insert_one({
        "transaction_id": f"tx_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user["user_id"],
        "user_email": user.get("email", ""),
        "package_id": f"{plan_id}_followup",
        "package_name": f"Leadership OS Rate {installment_num}/{plan.get('installments_total', 12)}",
        "tier": "standard",
        "billing": "installment_followup",
        "installment_num": installment_num,
        "amount": amount,
        "currency": "eur",
        "payment_status": "pending",
        "status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id, "installment_num": installment_num, "amount": amount}


@router.post("/payments/installment/next")
async def create_next_installment_checkout(data: CheckoutRequest, request: Request):
    """Create Stripe checkout for user's next installment payment."""
    user = await get_current_user(request)
    plan = await db.installment_plans.find_one({"user_id": user["user_id"], "active": True}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Kein aktiver Ratenzahlungs-Plan")
    if plan.get("installments_paid", 0) >= plan.get("installments_total", 12):
        raise HTTPException(status_code=400, detail="Alle Raten bereits bezahlt")
    return await _create_installment_checkout(user, data.origin_url, str(request.base_url), plan)


async def _handle_installment_payment(user_id: str, installment_num: int):
    """Record a paid installment. If last → close plan."""
    plan = await db.installment_plans.find_one({"user_id": user_id, "active": True}, {"_id": 0})
    if not plan:
        return
    new_paid = max(plan.get("installments_paid", 0), installment_num)
    total = plan.get("installments_total", 12)
    now = datetime.now(timezone.utc)
    update = {"installments_paid": new_paid, "last_paid_at": now.isoformat()}
    if new_paid >= total:
        update["active"] = False
        update["completed_at"] = now.isoformat()
        logger.info(f"Installment plan COMPLETED for user {user_id}")
    else:
        from datetime import timedelta as _td
        update["next_due_date"] = (now + _td(days=30)).isoformat()
    await db.installment_plans.update_one({"user_id": user_id}, {"$set": update})


@router.post("/cron/installments-due")
async def cron_installments_due(request: Request):
    """Scan all active installment plans. For each plan where next_due_date <= today,
    email the user a link to pay the next installment. Run daily."""
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "error": "email service not configured"}

    now = datetime.now(timezone.utc)
    plans = await db.installment_plans.find({"active": True}, {"_id": 0}).to_list(1000)
    sent = 0
    for plan in plans:
        try:
            due = datetime.fromisoformat(plan["next_due_date"].replace("Z", "+00:00"))
            if due.tzinfo is None:
                due = due.replace(tzinfo=timezone.utc)
        except Exception:
            continue
        if due > now:
            continue
        # Dedup: once per installment number
        installment_num = plan.get("installments_paid", 0) + 1
        already = await db.email_log.find_one({
            "user_id": plan["user_id"],
            "type": f"installment_due_{installment_num}",
        }, {"_id": 0})
        if already:
            continue
        user = await db.users.find_one({"user_id": plan["user_id"]}, {"_id": 0})
        if not user or not user.get("email"):
            continue
        name = user.get("name") or user["email"].split("@")[0]
        # Link: frontend /coaching will show a button that hits /payments/installment/next
        checkout_link = f"{str(request.base_url).rstrip('/').replace('/api','')}/coaching?installment=next"
        subject, html = installment_due_email(
            name, installment_num, plan.get("installments_total", 12),
            plan.get("amount_per_installment", 580.83),
            checkout_link, due.strftime("%d.%m.%Y"),
        )
        r = await send_email(user["email"], subject, html)
        await db.email_log.insert_one({
            "user_id": plan["user_id"], "type": f"installment_due_{installment_num}",
            "sent": r["sent"], "email_id": r.get("email_id"),
            "sent_at": datetime.now(timezone.utc).isoformat(),
        })
        if r["sent"]:
            sent += 1
    return {"sent": sent, "scanned": len(plans)}



# ── Monthly Leadership Scorecard (Accelerator-only) ────────────────────────

def _pick_insight_and_focus(ls: int, eq: int, comm: int, overall: int) -> tuple[str, str]:
    """Rule-based monthly insight + next-focus text."""
    # Top insight — pick highest dimension
    dims = {"KI-Kompetenz": ls, "Rhetorik": comm, "EQ": eq}
    top_dim = max(dims, key=dims.get)
    top_val = dims[top_dim]
    if top_val >= 70:
        top_insight = f"Deine {top_dim} ist mit {top_val}/100 dein Power-Hebel. Nutze sie aktiv in Team-Meetings diesen Monat."
    elif top_val >= 50:
        top_insight = f"Deine {top_dim} ({top_val}/100) entwickelt sich solide. Zwei gezielte Sessions pushen dich über 70."
    else:
        top_insight = f"Deine stärkste Dimension ({top_dim}) liegt bei {top_val}/100 — noch viel Luft nach oben. Konsistenz schlägt Intensität."

    # Next focus — pick lowest dimension
    weakest_dim = min(dims, key=dims.get)
    weakest_val = dims[weakest_dim]
    focus_map = {
        "KI-Kompetenz": "Starte 3 Simulationen mit dem Strategie-Agenten. Jede zählt als 20 XP.",
        "Rhetorik": "Absolviere 2 Video-Missionen — Wlads Feedback bringt den größten Sprung.",
        "EQ": "Täglicher 5-Min Check-in für 30 Tage. EQ wird über Konsistenz gebaut.",
    }
    next_focus = f"Fokus {weakest_dim} ({weakest_val}/100): {focus_map[weakest_dim]}"
    return top_insight, next_focus


async def _compute_scorecard_metrics(user: dict) -> dict:
    """Gather month-over-month deltas + 3-layer scores for a user."""
    last = await db.scorecard_history.find_one(
        {"user_id": user["user_id"]}, {"_id": 0}, sort=[("created_at", -1)]
    )
    xp_now = user.get("xp", 0)
    xp_delta = xp_now - (last["xp"] if last else 0)
    cprog = await db.challenge30_progress.find_one({"user_id": user["user_id"]}, {"_id": 0})
    days_now = len(cprog.get("completed_days", [])) if cprog else 0
    days_delta = days_now - (last["challenge_days"] if last else 0)

    ls = user.get("leadership_score", 0)
    eq = user.get("eq_score", 0)
    comm = user.get("communication_score", 0)
    overall = min(100, int(ls * 0.35 + comm * 0.35 + eq * 0.30))
    top_insight, next_focus = _pick_insight_and_focus(ls, eq, comm, overall)

    return {
        "xp_now": xp_now, "xp_delta": xp_delta,
        "days_now": days_now, "days_delta": days_delta,
        "ls": ls, "eq": eq, "comm": comm, "overall": overall,
        "top_insight": top_insight, "next_focus": next_focus,
    }


async def _send_scorecard_and_log(user: dict, metrics: dict, month_key: str, app_url: str, now: datetime) -> bool:
    """Send monthly scorecard email and persist snapshot. Returns True on success."""
    name = user.get("name") or user["email"].split("@")[0]
    subject, html = monthly_scorecard_email(
        name=name, xp_delta=max(0, metrics["xp_delta"]),
        challenge_days_delta=max(0, metrics["days_delta"]),
        ls=metrics["ls"], eq=metrics["eq"], comm=metrics["comm"], overall=metrics["overall"],
        top_insight=metrics["top_insight"], next_focus=metrics["next_focus"], app_url=app_url,
    )
    r = await send_email(user["email"], subject, html)
    if not r["sent"]:
        logger.warning(f"Scorecard send failed for {user['email']}: {r.get('error')}")
        return False

    await db.scorecard_history.insert_one({
        "user_id": user["user_id"], "month": month_key, "xp": metrics["xp_now"],
        "challenge_days": metrics["days_now"], "overall": metrics["overall"],
        "ls": metrics["ls"], "eq": metrics["eq"], "comm": metrics["comm"],
        "created_at": now.isoformat(),
    })
    await db.email_log.insert_one({
        "user_id": user["user_id"], "type": f"monthly_scorecard_{month_key}",
        "sent": True, "email_id": r.get("email_id"), "sent_at": now.isoformat(),
    })
    return True


@router.post("/cron/monthly-scorecard")
async def cron_monthly_scorecard(request: Request) -> dict:
    """Send monthly Leadership Scorecard email to all Accelerator users.
    Run once per month (typically 1st of month)."""
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "error": "email service not configured"}

    now = datetime.now(timezone.utc)
    month_key = now.strftime("%Y-%m")
    app_url = str(request.base_url).rstrip('/').replace('/api', '')

    accelerator_users = await db.users.find(
        {"tier": "accelerator"},
        {"_id": 0, "user_id": 1, "email": 1, "name": 1, "xp": 1,
         "leadership_score": 1, "eq_score": 1, "communication_score": 1},
    ).to_list(5000)

    sent = 0
    for user in accelerator_users:
        if not user.get("email"):
            continue
        already = await db.email_log.find_one(
            {"user_id": user["user_id"], "type": f"monthly_scorecard_{month_key}"}, {"_id": 0}
        )
        if already:
            continue

        metrics = await _compute_scorecard_metrics(user)
        if await _send_scorecard_and_log(user, metrics, month_key, app_url, now):
            sent += 1

    return {"sent": sent, "scanned": len(accelerator_users), "month": month_key}


# ── Stripe Customer Portal — Iter 92.33 (Mert pre-first-customer audit) ──
# Enterprise buyers (€4.797) DEMAND self-service: cancel, update card, view
# invoices, change billing email. Without this we look like a hobby project.
# Returns a short-lived URL that the frontend redirects to.

@router.post("/billing/portal")
async def create_billing_portal_session(request: Request):
    """Create a Stripe Billing Portal session for the logged-in user.
    The portal handles: subscription cancel/reactivate, card update, invoice
    download, billing-address edit. We never touch this UI ourselves — Stripe
    hosts + handles all PCI/VAT concerns.
    """
    user = await get_current_user(request)
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Billing system not configured")

    stripe_customer_id = (user or {}).get("stripe_customer_id")
    if not stripe_customer_id:
        # Fallback: try to find the customer by email (lazy-link if Stripe Checkout
        # was completed before we stored the customer_id back to Mongo).
        email = (user or {}).get("email", "").strip().lower()
        if not email:
            raise HTTPException(status_code=400, detail="No Stripe customer linked to this account.")
        try:
            import stripe
            stripe.api_key = STRIPE_API_KEY
            search = stripe.Customer.list(email=email, limit=1)
            if search.data:
                stripe_customer_id = search.data[0].id
                await db.users.update_one(
                    {"user_id": user["user_id"]},
                    {"$set": {"stripe_customer_id": stripe_customer_id}},
                )
            else:
                raise HTTPException(status_code=400, detail="No active subscription found.")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Stripe customer lookup failed: {e}")
            raise HTTPException(status_code=502, detail="Could not reach Stripe.")

    # Return-URL = same domain the request came from (per FRONTEND_BASE_URL env).
    return_url = (os.environ.get("FRONTEND_BASE_URL") or "https://leaderos.de").rstrip("/") + "/profile?tab=billing"

    try:
        import stripe
        stripe.api_key = STRIPE_API_KEY
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url=return_url,
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Stripe Portal session failed for {user.get('user_id')}: {e}")
        raise HTTPException(status_code=502, detail="Could not create billing portal session.")





# ── Enterprise Quote + Lead Form ──────────────────────────────────────────

class EnterpriseQuoteRequest(BaseModel):
    seats: int


class EnterpriseLead(BaseModel):
    company: str
    contact_name: str
    contact_email: str
    seats: int
    phone: Optional[str] = None
    message: Optional[str] = None

    @field_validator("contact_email")
    @classmethod
    def _validate_email(cls, v: str) -> str:
        v = (v or "").strip().lower()
        if not re.match(r"^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$", v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("company", "contact_name")
    @classmethod
    def _strip_required(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Required field is empty")
        return v


@router.post("/payments/enterprise/quote")
async def post_enterprise_quote(data: EnterpriseQuoteRequest) -> dict:
    """Public: instantly calculate Enterprise pricing for N seats."""
    if data.seats < 1 or data.seats > 10000:
        raise HTTPException(status_code=400, detail="seats must be between 1 and 10000")
    return calc_enterprise_quote(data.seats)


@router.post("/payments/enterprise/lead")
async def post_enterprise_lead(data: EnterpriseLead, request: Request) -> dict:
    """Public: capture an Enterprise lead, persist, and notify admin via email."""
    if data.seats < 1:
        raise HTTPException(status_code=400, detail="seats must be >= 1")

    quote = calc_enterprise_quote(data.seats)
    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "lead_id": lead_id,
        "company": data.company.strip(),
        "contact_name": data.contact_name.strip(),
        "contact_email": data.contact_email.strip().lower(),
        "phone": (data.phone or "").strip(),
        "message": (data.message or "").strip(),
        "seats": data.seats,
        "quote": quote,
        "status": "new",
        "created_at": now,
    }
    await db.enterprise_leads.insert_one(record)

    # Best-effort admin notification
    if email_enabled():
        try:
            admin_to = os.environ.get("ENTERPRISE_LEAD_EMAIL") or os.environ.get("SENDER_EMAIL")
            if admin_to:
                # Iter 131.1 (Security Audit SEC-002): escape ALL user-supplied
                # strings before templating them into the admin email HTML.
                import html as _html_mod
                _c = _html_mod.escape(data.company)
                _n = _html_mod.escape(data.contact_name)
                _e = _html_mod.escape(data.contact_email)
                _p = _html_mod.escape(data.phone or "-")
                _m = _html_mod.escape(data.message or "-").replace("\n", "<br>")
                subject = f"[Enterprise Lead] {data.company} - {data.seats} Seats - {quote['total_price']:.0f}EUR"
                html = (
                    f"<h2>Neuer Enterprise Lead</h2>"
                    f"<p><b>Firma:</b> {_c}<br>"
                    f"<b>Kontakt:</b> {_n} &lt;{_e}&gt;<br>"
                    f"<b>Telefon:</b> {_p}<br>"
                    f"<b>Mitarbeiter:</b> {data.seats}<br>"
                    f"<b>Quote:</b> {quote['total_price']:.2f}EUR ({quote['discount_pct']}%% Rabatt, {quote['price_per_seat']:.2f}EUR/Seat)<br>"
                    f"<b>Ersparnis:</b> {quote['total_savings']:.2f}EUR</p>"
                    f"<p><b>Nachricht:</b><br>{_m}</p>"
                )
                await send_email(admin_to, subject, html)
        except Exception as e:
            logger.warning(f"Enterprise lead notification email failed: {e}")

    return {"lead_id": lead_id, "quote": quote, "status": "received"}
