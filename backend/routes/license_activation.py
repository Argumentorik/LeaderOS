"""License-activation funnel — /frameworks lead capture + 5-mail nurture.

/frameworks (Google-Ads landing for framework-searches, see
data/googleAdsAssets.js: "Framework-Suchen → /frameworks → Webinar/Trial")
used to dead-end on a single "Live-Webinar" text link — no conversion
mechanism of its own. This gives it one: a "reserve your personal access
code" moment, mirroring the chrome-plate visual language of
components/landing/LicenseKeySection.js (the Enterprise version) but for an
individual 14-day trial.

Two independent things happen on submit:
  1. The lead is durably captured in `db.license_leads` (keyed by
     email_lower), gets a deterministic reserved code (LOS-XXXX-XXXX,
     same family as the Enterprise plate), and starts the 5-step
     license-activation email journey (services_email.license_activation_email,
     driven by /api/cron/license-nurture in routes/lifecycle_emails.py).
  2. If they opted in (default: yes), they are ALSO registered as a real
     webinar lead in `db.webinar_leads` — the same collection and
     confirmation email as /webinar's own form — so they show up in
     /api/webinar/stats and get the existing 24h/1h reminders. This is a
     genuine registration, not just a claim in an email.

Nothing here is invented: the "reserved" code never expires, and the
webinar-specific copy in the drip only fires while the 29.10. date is still
upcoming (services_email.license_activation_email `webinar_upcoming`).

The nurture journey stops the moment the lead's email shows up in
`db.users` (real account) — same "converted" gate as the general
lead-nurture journey (routes/leader_check.py / routes/lifecycle_emails.py).

Endpoints:
  POST /api/license/activate       — capture + instant step-1 mail (public)
  GET  /api/license/unsubscribe    — one-click opt-out (public)
"""
import hashlib
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from config import db
from routes.free_videos import make_lead_unsub_token, _verify_lead_unsub_token
from routes.webinar import (
    WEBINAR_CAMPAIGN, WEBINAR_EVENT, WEBINAR_DATE_ISO,
    _is_valid_email, _google_calendar_url,
)
from services_email import (
    send_email, is_enabled as email_enabled,
    event_registration_email, license_activation_email,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/license", tags=["license-activation"])


def make_reserved_code(email_lower: str) -> str:
    """Deterministic "LOS-XXXX-XXXX" code — same email always shows the same
    code (not an auth credential, just the UX the plate promises: reserved,
    not reissued on every resubmit)."""
    digest = hashlib.sha256(email_lower.encode()).hexdigest().upper()
    return f"LOS-{digest[:4]}-{digest[4:8]}"


def license_unsub_url(email_lower: str, app_url: str = "https://leaderos.de") -> str:
    return f"{app_url.rstrip('/')}/api/license/unsubscribe?token={make_lead_unsub_token(email_lower)}"


def _webinar_upcoming() -> bool:
    try:
        deadline = datetime.fromisoformat(WEBINAR_DATE_ISO.replace("Z", "+00:00"))
    except ValueError:
        return True
    return datetime.now(timezone.utc) < deadline


class ActivatePayload(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)
    name: str | None = Field(default="", max_length=120)
    source: str = Field(default="frameworks", max_length=64)
    campaign: str = Field(default="", max_length=80)
    join_webinar: bool = True
    referrer: str | None = Field(default="", max_length=500)
    landing_path: str | None = Field(default="", max_length=200)


@router.post("/activate")
async def activate(payload: ActivatePayload, request: Request):
    """Reserve a license code, optionally also register for the webinar."""
    email = payload.email.strip().lower()
    if not _is_valid_email(email):
        return {"ok": False, "error": "invalid_email"}

    name = (payload.name or "").strip()
    now = datetime.now(timezone.utc).isoformat()
    reserved_code = make_reserved_code(email)
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or None

    set_fields = {
        "email": email, "email_lower": email, "last_seen_at": now,
        "reserved_code": reserved_code, "webinar_bonus": payload.join_webinar,
    }
    if name:
        set_fields["name"] = name
    if payload.campaign:
        set_fields["campaign"] = payload.campaign
    if payload.referrer:
        set_fields["referrer"] = payload.referrer
    if payload.landing_path:
        set_fields["landing_path"] = payload.landing_path
    if ip:
        set_fields["last_ip"] = ip

    await db.license_leads.update_one(
        {"email_lower": email},
        {
            "$set": set_fields,
            "$setOnInsert": {
                "created_at": now, "unsubscribed": False, "converted": False,
                "license_steps_sent": [], "webinar_registered": False,
            },
            "$inc": {"optin_count": 1},
            "$addToSet": {"sources": payload.source},
        },
        upsert=True,
    )
    lead = await db.license_leads.find_one({"email_lower": email}, {"_id": 0})

    # ── Optional: also a real webinar registration, same collection/email
    # every other page's form uses — not a separate "bonus" system. ────────
    webinar_registered = bool((lead or {}).get("webinar_registered"))
    if payload.join_webinar and not webinar_registered and _webinar_upcoming():
        wset = {
            "email": email, "email_lower": email, "last_seen_at": now,
            "campaign": WEBINAR_CAMPAIGN,
        }
        if name:
            wset["name"] = name
        await db.webinar_leads.update_one(
            {"email_lower": email},
            {
                "$set": wset,
                "$setOnInsert": {
                    "created_at": now, "unsubscribed": False, "confirmation_sent": False,
                    "reminder_24h_sent": False, "reminder_1h_sent": False, "followup_sent": False,
                },
                "$inc": {"optin_count": 1},
                "$addToSet": {"sources": "frameworks-license"},
            },
            upsert=True,
        )
        wlead = await db.webinar_leads.find_one({"email_lower": email}, {"_id": 0})
        if email_enabled() and not (wlead or {}).get("confirmation_sent"):
            subject, html = event_registration_email(
                name or email.split("@")[0], WEBINAR_EVENT, _google_calendar_url()
            )
            result = await send_email(email, subject, html)
            if result["sent"]:
                await db.webinar_leads.update_one(
                    {"email_lower": email},
                    {"$set": {"confirmation_sent": True, "confirmation_sent_at": now}},
                )
        await db.license_leads.update_one(
            {"email_lower": email}, {"$set": {"webinar_registered": True}}
        )
        webinar_registered = True

    # ── Instant step-1 mail — best-effort, mirrors leader_check.py ──────────
    step1_sent = False
    try:
        if (
            email_enabled()
            and 1 not in (lead.get("license_steps_sent") or [])
            and not lead.get("unsubscribed")
        ):
            existing_user = await db.users.find_one({"email_lower": email}, {"_id": 0, "user_id": 1})
            if not existing_user:
                subject, html = license_activation_email(
                    1, name or email.split("@")[0], reserved_code,
                    unsubscribe_link=license_unsub_url(email),
                    webinar_registered=webinar_registered,
                    webinar_upcoming=_webinar_upcoming(),
                )
                result = await send_email(email, subject, html)
                if result["sent"]:
                    step1_sent = True
                    await db.license_leads.update_one(
                        {"email_lower": email},
                        {"$addToSet": {"license_steps_sent": 1},
                         "$set": {"license_step1_sent_at": now}},
                    )
                await db.email_log.insert_one({
                    "email": email, "type": "license_nurture_s1", "step": 1,
                    "sent": result["sent"], "email_id": result.get("email_id"),
                    "error": result.get("error"), "sent_at": now,
                })
    except Exception as exc:  # never block the funnel
        logger.warning("license.activate: step-1 send failed: %s", exc)

    return {
        "ok": True,
        "reserved_code": reserved_code,
        "webinar_registered": webinar_registered,
        "step1_sent": step1_sent,
    }


_UNSUB_HTML = """<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Abgemeldet</title></head>
<body style="margin:0;background:#0A0A0A;color:#fff;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:12vh auto;padding:0 24px;text-align:center;">
<div style="font-family:monospace;font-size:11px;letter-spacing:.2em;color:#BFFF00;font-weight:800;text-transform:uppercase;">▸ LEADER · OS</div>
<h1 style="font-size:28px;font-weight:900;margin:16px 0 8px;">{headline}</h1>
<p style="color:rgba(255,255,255,.6);font-size:15px;line-height:1.6;">{body}</p>
</div></body></html>"""


@router.get("/unsubscribe", response_class=HTMLResponse)
async def license_unsubscribe(token: str):
    """One-click opt-out for the license-activation nurture mails."""
    email = _verify_lead_unsub_token(token)
    if not email:
        return HTMLResponse(_UNSUB_HTML.format(
            headline="Link ungültig",
            body="Dieser Abmelde-Link ist ungültig oder abgelaufen.",
        ), status_code=400)
    now = datetime.now(timezone.utc).isoformat()
    await db.license_leads.update_one(
        {"email_lower": email},
        {"$set": {"unsubscribed": True, "unsubscribed_at": now}},
    )
    logger.info("license lead unsubscribed: %s", email.replace("\r", " ").replace("\n", " "))
    return HTMLResponse(_UNSUB_HTML.format(
        headline="Du bist abgemeldet",
        body="Du erhältst keine weiteren Mails dieser Serie. Dein Zugangscode bleibt reserviert.",
    ))
