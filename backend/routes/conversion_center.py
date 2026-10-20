"""Conversion Center — Wlad's approval-gated 400-client rollout (Iter 133).

Admin reviews/edits/approves each of the 8 sequence emails BEFORE anything
goes out. The cron endpoint sends ONLY approved emails to their computed
segments (max one email per user per run, email_log-deduplicated).
Segments are computed live from existing user/transaction data — no new CRM.
"""
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from config import db, logger
from services import require_cron_auth
from services_conversion_emails import SEQUENCE, SEQUENCE_BY_ID, render_conversion_email
from routes.credits import PAID_TIERS

router = APIRouter(prefix="/api", tags=["conversion-center"])

SEGMENT_LABELS = {
    "mc_not_activated": "A · Masterclass — nie eingeloggt",
    "mc_activated": "B · Masterclass — aktiviert (eingeloggt)",
    "mc_engaged": "C · Interessiert / engaged (≥2 Logins)",
    "purchased": "D · Leader-OS gekauft",
    "purchased_not_onboarded": "E · Gekauft, Onboarding offen",
    "onboarded_active": "F · Onboarded / aktiv",
    "checkout_abandoned": "G · Checkout gestartet, nicht gekauft",
    "unresponsive": "H · Unresponsive (3+ Mails, nie eingeloggt)",
}

_USER_PROJ = {"_id": 0, "user_id": 1, "email": 1, "name": 1, "tier": 1,
              "masterclass": 1, "masterclass_started_at": 1, "masterclass_expires_at": 1,
              "onboarding_completed": 1, "login_history": 1,
              "unsubscribed_all": 1, "unsubscribed_conversion": 1}


def _is_paid(u: dict) -> bool:
    return (u.get("tier") or "free") in PAID_TIERS


def _logins(u: dict) -> int:
    return len(u.get("login_history") or [])


async def _mc_users() -> list[dict]:
    return await db.users.find({"masterclass_expires_at": {"$exists": True}}, _USER_PROJ).to_list(3000)


async def _conv_mail_count(user_id: str) -> int:
    return await db.email_log.count_documents({"user_id": user_id, "type": {"$regex": "^mc_conv_"}})


async def compute_segments() -> dict:
    """Live segment membership. A user can appear in multiple segments."""
    mc = await _mc_users()
    segments = {k: [] for k in SEGMENT_LABELS}

    for u in mc:
        entry = {"email": u.get("email"), "name": u.get("name") or "", "tier": u.get("tier") or "free"}
        paid = _is_paid(u)
        logins = _logins(u)
        if not paid:
            if logins == 0:
                segments["mc_not_activated"].append(entry)
                if await _conv_mail_count(u["user_id"]) >= 3:
                    segments["unresponsive"].append(entry)
            else:
                segments["mc_activated"].append(entry)
            if logins >= 2:
                segments["mc_engaged"].append(entry)
        else:
            segments["purchased"].append(entry)

    # E/F cover ALL paid users (incl. non-masterclass buyers)
    paid_users = await db.users.find({"tier": {"$in": list(PAID_TIERS)}}, _USER_PROJ).to_list(5000)
    for u in paid_users:
        entry = {"email": u.get("email"), "name": u.get("name") or "", "tier": u.get("tier")}
        if u.get("onboarding_completed"):
            segments["onboarded_active"].append(entry)
        else:
            segments["purchased_not_onboarded"].append(entry)

    # G: pending checkout >2h old, user still unpaid
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    pending = await db.payment_transactions.find(
        {"payment_status": "pending", "created_at": {"$lt": cutoff}},
        {"_id": 0, "user_id": 1, "user_email": 1, "package_id": 1},
    ).sort("created_at", -1).to_list(1000)
    seen = set()
    for tx in pending:
        if tx["user_id"] in seen:
            continue
        seen.add(tx["user_id"])
        u = await db.users.find_one({"user_id": tx["user_id"]}, {"_id": 0, "tier": 1, "name": 1, "email": 1})
        if u and not _is_paid(u):
            segments["checkout_abandoned"].append({"email": u.get("email"), "name": u.get("name") or "", "tier": u.get("tier") or "free"})

    return segments


# ── Admin: sequence overview, preview, approve ──────────────────────────────

async def _approval_map() -> dict:
    rows = await db.conversion_email_approvals.find({}, {"_id": 0}).to_list(50)
    return {r["email_id"]: r for r in rows}


@router.get("/admin/conversion/sequence")
async def get_sequence(request: Request):
    from routes.admin import require_admin
    await require_admin(request)
    approvals = await _approval_map()
    segments = await compute_segments()
    seg_counts = {k: len(v) for k, v in segments.items()}
    emails = []
    for e in SEQUENCE:
        appr = approvals.get(e["id"], {})
        sent_count = await db.email_log.count_documents({"type": f"mc_conv_{e['id']}", "sent": True})
        emails.append({
            "id": e["id"], "n": e["n"],
            "purpose": e["purpose"], "trigger": e["trigger"],
            "timing_days": e["timing_days"],
            "segment": e["segment"], "segment_label": e["segment_label"],
            "expected_next": e["expected_next"],
            "subject": e["subject"], "cta_label": e["cta_label"], "cta_url": e["cta_url"],
            "status": appr.get("status", "draft"),
            "updated_by": appr.get("updated_by"), "updated_at": appr.get("updated_at"),
            "sent_count": sent_count,
        })
    approved = sum(1 for e in emails if e["status"] == "approved")
    return {
        "emails": emails,
        "segment_counts": seg_counts,
        "segment_labels": SEGMENT_LABELS,
        "approved_count": approved,
        "total": len(emails),
        "sending_live": approved > 0,
    }


@router.get("/admin/conversion/preview/{email_id}")
async def preview_email(email_id: str, request: Request):
    from routes.admin import require_admin
    admin = await require_admin(request)
    email = SEQUENCE_BY_ID.get(email_id)
    if not email:
        raise HTTPException(status_code=404, detail="E-Mail nicht gefunden.")
    name = (admin.get("name") or "Wlad").split(" ")[0]
    subject, html = render_conversion_email(email, name, unsubscribe_link="#abmelden-vorschau")
    return {"id": email_id, "subject": subject, "html": html}


class ApprovalUpdate(BaseModel):
    status: str  # approved | rejected | draft


@router.post("/admin/conversion/{email_id}/approval")
async def set_approval(email_id: str, data: ApprovalUpdate, request: Request):
    from routes.admin import require_admin
    admin = await require_admin(request)
    if email_id not in SEQUENCE_BY_ID:
        raise HTTPException(status_code=404, detail="E-Mail nicht gefunden.")
    if data.status not in ("approved", "rejected", "draft"):
        raise HTTPException(status_code=400, detail="Status muss approved, rejected oder draft sein.")
    await db.conversion_email_approvals.update_one(
        {"email_id": email_id},
        {"$set": {
            "email_id": email_id, "status": data.status,
            "updated_by": admin.get("email", ""),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    logger.info(f"Conversion email {email_id} → {data.status} by {admin.get('email')}")
    return {"id": email_id, "status": data.status}


@router.get("/admin/conversion/segments")
async def get_segments(request: Request):
    from routes.admin import require_admin
    await require_admin(request)
    segments = await compute_segments()
    return {
        "segments": {k: {"label": SEGMENT_LABELS[k], "count": len(v), "users": v[:50]} for k, v in segments.items()},
    }


class TestSend(BaseModel):
    email_id: str
    to: str


@router.post("/admin/conversion/test-send")
async def test_send(data: TestSend, request: Request):
    """Send ONE email to ONE address (Wlad's review inbox). Never a segment."""
    from routes.admin import require_admin
    admin = await require_admin(request)
    email = SEQUENCE_BY_ID.get(data.email_id)
    if not email:
        raise HTTPException(status_code=404, detail="E-Mail nicht gefunden.")
    from services_email import send_email, is_enabled
    if not is_enabled():
        raise HTTPException(status_code=503, detail="Resend nicht konfiguriert.")
    subject, html = render_conversion_email(email, "Wlad", unsubscribe_link="#test")
    result = await send_email(data.to.strip(), f"[TEST] {subject}", html)
    logger.info(f"Conversion test-send {data.email_id} → {data.to} by {admin.get('email')}: {result.get('sent')}")
    return {"sent": bool(result.get("sent")), "error": result.get("error")}


# ── Cron: send approved emails only ─────────────────────────────────────────

def _days_since(iso_str) -> float | None:
    try:
        dt = datetime.fromisoformat(str(iso_str).replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dt).total_seconds() / 86400
    except (ValueError, TypeError):
        return None


def _email_matches_user(email: dict, u: dict, days: float | None) -> bool:
    seg = email["segment"]
    paid = _is_paid(u)
    if seg == "mc_all_not_purchased":
        if paid or not u.get("masterclass"):
            return False
        return days is not None and days >= (email["timing_days"] - 0.25)
    if seg == "mc_engaged_not_purchased":
        if paid or _logins(u) == 0:
            return False
        return days is not None and days >= (email["timing_days"] - 0.25)
    if seg == "purchased_not_onboarded":
        return paid and not u.get("onboarding_completed")
    return False


@router.post("/cron/masterclass-conversion")
async def cron_masterclass_conversion(request: Request):
    """Daily: send APPROVED sequence emails to matching users.

    Safety: draft/rejected emails are NEVER sent; max ONE conversion email
    per user per run; email_log dedup makes re-runs idempotent; respects
    unsubscribed_all / unsubscribed_conversion.
    """
    require_cron_auth(request)
    from services_email import send_email, is_enabled
    from routes.unsubscribe import unsubscribe_url
    if not is_enabled():
        return {"sent": 0, "scanned": 0, "error": "RESEND_API_KEY not configured"}

    approvals = await _approval_map()
    approved = [e for e in SEQUENCE if approvals.get(e["id"], {}).get("status") == "approved"]
    if not approved:
        return {"sent": 0, "scanned": 0, "approved_emails": 0, "note": "Keine E-Mail freigegeben — nichts versendet."}

    now = datetime.now(timezone.utc)
    candidates = await _mc_users()
    # E8 also targets paid non-MC buyers
    if any(e["segment"] == "purchased_not_onboarded" for e in approved):
        extra = await db.users.find(
            {"tier": {"$in": list(PAID_TIERS)}, "onboarding_completed": {"$ne": True}}, _USER_PROJ
        ).to_list(3000)
        known = {u["user_id"] for u in candidates}
        candidates += [u for u in extra if u["user_id"] not in known]

    sent_total, sent_by_email, scanned = 0, {}, 0
    for u in candidates:
        scanned += 1
        if not u.get("email") or u.get("unsubscribed_all") or u.get("unsubscribed_conversion"):
            continue
        days = _days_since(u.get("masterclass_started_at"))
        for email in approved:
            if not _email_matches_user(email, u, days):
                continue
            log_type = f"mc_conv_{email['id']}"
            if await db.email_log.find_one({"user_id": u["user_id"], "type": log_type}, {"_id": 1}):
                continue
            name = (u.get("name") or u["email"].split("@")[0]).strip() or "Leader"
            subject, html = render_conversion_email(
                email, name, unsubscribe_link=unsubscribe_url(u["user_id"], "conversion")
            )
            result = await send_email(u["email"], subject, html)
            await db.email_log.insert_one({
                "user_id": u["user_id"], "type": log_type,
                "sent": result["sent"], "email_id": result.get("email_id"),
                "error": result.get("error"), "sent_at": now.isoformat(),
            })
            if result["sent"]:
                sent_total += 1
                sent_by_email[email["id"]] = sent_by_email.get(email["id"], 0) + 1
            break  # max one conversion email per user per run

    return {"sent": sent_total, "scanned": scanned, "approved_emails": len(approved), "by_email": sent_by_email}
