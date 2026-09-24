"""Webinar funnel — durable anonymous lead capture + reminder automation.

Mirrors the free-video funnel pattern (routes/free_videos.py): every opt-in
is persisted in Mongo (`db.webinar_leads`, keyed by email_lower) so the lead
list survives regardless of Supabase/PostHog reachability, plus an instant
confirmation email and cron-driven 24h/1h reminders.

Unlike routes/events.py (which requires a logged-in `user_id`), webinar
registrants are anonymous visitors on the public /webinar squeeze page — so
this is its own lead collection, not `db.event_registrations`. Registration
confirmation and reminder emails reuse the same `event_registration_email` /
`event_reminder_email` templates from services_email.py by building a
synthetic "event" dict for the one live webinar.

Endpoints:
  POST /api/webinar/register          — capture + instant confirmation (public)
  GET  /api/webinar/stats             — real registrant count for social proof (public)
  GET  /api/webinar/unsubscribe       — one-click opt-out (public)
  GET  /api/webinar/leads             — list/summary (admin only)
  POST /api/cron/webinar-reminders    — 24h + 1h reminder sweep (cron)
  POST /api/cron/webinar-followup     — day-after "start your trial" nudge (cron)
"""
import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from config import db, logger
from routes.admin import require_admin
from services import require_cron_auth
from services_email import (
    send_email, is_enabled as email_enabled,
    event_registration_email, event_reminder_email, webinar_followup_email,
)

router = APIRouter(prefix="/api", tags=["webinar"])

WEBINAR_CAMPAIGN = "webinar-2026-10-29"
WEBINAR_DATE_ISO = "2026-10-29T09:00:00Z"  # 10:00 CET (nach der Zeitumstellung)
WEBINAR_DURATION_MIN = 90
WEBINAR_MAX_CAPACITY = 500
WEBINAR_JOIN_URL = os.environ.get("WEBINAR_JOIN_URL", "https://leader-os.de/webinar")

WEBINAR_EVENT = {
    "event_id": "webinar_2026_08_20",
    "title": "Führe besser. Jeden Tag. · Live-Webinar",
    "description": (
        "Wie du mit einem Leadership Operating System jeden Tag besser führst — "
        "KI-Coach, tägliche Übungen und Wlads Methodik. Live, mit Q&A."
    ),
    "date": WEBINAR_DATE_ISO,
    "duration_minutes": WEBINAR_DURATION_MIN,
    "host": "Wlad Jachtchenko",
    "join_url": WEBINAR_JOIN_URL,
}


def _is_valid_email(email: str) -> bool:
    """Regex-free email check (see routes/free_videos.py for rationale)."""
    if not email or len(email) > 320 or any(c.isspace() for c in email):
        return False
    local, sep, domain = email.partition("@")
    if not sep or not local or "@" in domain:
        return False
    head, dot, tld = domain.rpartition(".")
    return bool(dot and head and tld)


SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

_SIGNING_KEY = (os.environ.get("JWT_SECRET") or "dev-only-fallback").encode()


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _make_unsub_token(email_lower: str, ttl_days: int = 60) -> str:
    exp = int(datetime.now(timezone.utc).timestamp()) + ttl_days * 86400
    payload = json.dumps({"le": email_lower, "e": exp}, separators=(",", ":")).encode()
    sig = hmac.new(_SIGNING_KEY, payload, hashlib.sha256).digest()
    return f"{_b64(payload)}.{_b64(sig)}"


def _verify_unsub_token(token: str) -> str | None:
    try:
        payload_b64, sig_b64 = token.split(".", 1)
        payload = _b64d(payload_b64)
        if not hmac.compare_digest(
            hmac.new(_SIGNING_KEY, payload, hashlib.sha256).digest(), _b64d(sig_b64)
        ):
            return None
        data = json.loads(payload)
        if data.get("e", 0) < int(datetime.now(timezone.utc).timestamp()):
            return None
        return data.get("le")
    except Exception:
        return None


def _unsub_url(email_lower: str, app_url: str = "https://leaderos.de") -> str:
    return f"{app_url.rstrip('/')}/api/webinar/unsubscribe?token={_make_unsub_token(email_lower)}"


def _google_calendar_url() -> str:
    start = datetime.fromisoformat(WEBINAR_DATE_ISO.replace("Z", "+00:00"))
    end = start + timedelta(minutes=WEBINAR_DURATION_MIN)
    fmt = "%Y%m%dT%H%M%SZ"
    dates = f"{start.strftime(fmt)}/{end.strftime(fmt)}"
    details = f"{WEBINAR_EVENT['description']}\n\nJoin via LeaderOS: {WEBINAR_JOIN_URL}"
    return (
        "https://www.google.com/calendar/render?action=TEMPLATE"
        f"&text={quote(WEBINAR_EVENT['title'])}"
        f"&dates={dates}"
        f"&details={quote(details)}"
        f"&location={quote('Online — LeaderOS')}"
    )


class UTM(BaseModel):
    source: str | None = ""
    medium: str | None = ""
    campaign: str | None = ""
    term: str | None = ""
    content: str | None = ""


class RegisterPayload(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)
    name: str | None = Field(default="", max_length=120)
    source: str = Field(default="webinar-lp", max_length=64)
    utm: UTM | None = None
    referrer: str | None = Field(default="", max_length=500)
    landing_path: str | None = Field(default="", max_length=200)
    # Browser-Pixel-Event-ID (lib/metaPixel.js) → dieselbe ID über die
    # Conversions API, damit Meta Browser- und Server-Event dedupliziert.
    meta_event_id: str | None = Field(default="", max_length=64)
    # Qualifizierungs-Antworten aus dem Typeform-Stepper auf /kommunikation.
    # Kurze, feste Schlüssel → Werte; landet als `quiz` am Lead, damit die
    # Nachfass-Mails und der Sales-Room wissen, wo jemand steht.
    answers: dict[str, str] | None = None


# ── Meta Conversions API ────────────────────────────────────────────────
# Inert, solange META_PIXEL_ID / META_CAPI_TOKEN nicht gesetzt sind.
# Setup + Test-Event-Code: docs/gtm/META_ADS_WEBINAR.md §4.
META_PIXEL_ID = os.environ.get("META_PIXEL_ID", "")
META_CAPI_TOKEN = os.environ.get("META_CAPI_TOKEN", "")
META_TEST_EVENT_CODE = os.environ.get("META_TEST_EVENT_CODE", "")
META_GRAPH_VERSION = os.environ.get("META_GRAPH_VERSION", "v21.0")


def meta_capi_enabled() -> bool:
    return bool(META_PIXEL_ID and META_CAPI_TOKEN)


async def _forward_to_meta_capi(
    email_lower: str, event_id: str | None, ip: str | None, user_agent: str, source_url: str,
) -> None:
    """Server-side `Lead` for Meta Ads. Best-effort, never blocks the funnel.

    The e-mail travels only as SHA-256 (Meta's required normalisation:
    lower-case, trimmed). IP + user agent improve match quality; both are
    already in the request. `event_id` mirrors the browser pixel event so
    Meta counts the lead once, not twice.
    """
    if not meta_capi_enabled():
        return
    payload = {
        "data": [{
            "event_name": "Lead",
            "event_time": int(datetime.now(timezone.utc).timestamp()),
            "event_id": event_id or None,
            "action_source": "website",
            "event_source_url": source_url,
            "user_data": {
                "em": [hashlib.sha256(email_lower.encode()).hexdigest()],
                "client_ip_address": ip,
                "client_user_agent": user_agent or None,
            },
            "custom_data": {"content_name": WEBINAR_CAMPAIGN, "content_category": "webinar"},
        }],
    }
    if META_TEST_EVENT_CODE:
        payload["test_event_code"] = META_TEST_EVENT_CODE
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.post(
                f"https://graph.facebook.com/{META_GRAPH_VERSION}/{META_PIXEL_ID}/events",
                params={"access_token": META_CAPI_TOKEN},
                json=payload,
            )
            if res.status_code >= 400:
                logger.warning("webinar lead: meta capi %s: %s", res.status_code, res.text[:200])
    except Exception as exc:
        logger.warning("webinar lead: meta capi failed: %s", exc)


async def _forward_to_supabase(email_lower: str, meta: dict) -> None:
    """Best-effort mirror into the shared incomplete_attempts pipeline."""
    if not SUPABASE_URL or not (SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY):
        return
    key = SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/upsert_incomplete_attempt",
                json={"p_email": email_lower, "p_source_platform": "leader-os", "p_meta": meta},
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
            )
    except Exception as exc:  # never block the funnel
        logger.warning("webinar lead: supabase forward failed: %s", exc)


@router.post("/webinar/register")
async def register(payload: RegisterPayload, request: Request):
    """Capture a webinar registration, send instant confirmation + calendar link."""
    email = payload.email.strip().lower()
    if not _is_valid_email(email):
        return {"ok": False, "error": "invalid_email"}

    name = (payload.name or "").strip()
    now = datetime.now(timezone.utc).isoformat()
    utm = (payload.utm.model_dump() if payload.utm else {}) or {}
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or None
    cal_url = _google_calendar_url()

    set_fields = {"email": email, "email_lower": email, "last_seen_at": now, "campaign": WEBINAR_CAMPAIGN}
    if name:
        set_fields["name"] = name
    if utm:
        set_fields["utm"] = utm
    if payload.referrer:
        set_fields["referrer"] = payload.referrer
    if payload.landing_path:
        set_fields["landing_path"] = payload.landing_path
    if ip:
        set_fields["last_ip"] = ip
    if payload.answers:
        clean = {str(k)[:40]: str(v)[:120] for k, v in list(payload.answers.items())[:12]}
        set_fields["quiz"] = clean
        set_fields["quiz_at"] = now

    await db.webinar_leads.update_one(
        {"email_lower": email},
        {
            "$set": set_fields,
            "$setOnInsert": {
                "created_at": now, "unsubscribed": False, "confirmation_sent": False,
                "reminder_24h_sent": False, "reminder_1h_sent": False, "followup_sent": False,
            },
            "$inc": {"optin_count": 1},
            "$addToSet": {"sources": payload.source},
        },
        upsert=True,
    )
    lead = await db.webinar_leads.find_one({"email_lower": email}, {"_id": 0})

    confirmation_sent = False
    if email_enabled() and not (lead or {}).get("confirmation_sent") and not (lead or {}).get("unsubscribed"):
        subject, html = event_registration_email(name or email.split("@")[0], WEBINAR_EVENT, cal_url)
        result = await send_email(email, subject, html)
        if result["sent"]:
            confirmation_sent = True
            await db.webinar_leads.update_one(
                {"email_lower": email},
                {"$set": {"confirmation_sent": True, "confirmation_sent_at": now}},
            )
        await db.webinar_email_log.insert_one({
            "email": email, "type": "confirmation", "sent": result["sent"],
            "email_id": result.get("email_id"), "error": result.get("error"), "sent_at": now,
        })

    await _forward_to_supabase(email, {
        "source": payload.source, "campaign": WEBINAR_CAMPAIGN,
        "name": name, "utm": utm, "referrer": payload.referrer, "funnel": "webinar",
    })
    await _forward_to_meta_capi(
        email, (payload.meta_event_id or "").strip() or None, ip,
        request.headers.get("user-agent", ""),
        f"https://leader-os.de{payload.landing_path or '/webinar'}",
    )

    return {
        "ok": True,
        "confirmation_sent": confirmation_sent,
        "calendar": {"google_calendar_url": cal_url, "title": WEBINAR_EVENT["title"], "date": WEBINAR_EVENT["date"]},
    }


@router.get("/webinar/stats")
async def stats():
    """Public: real registrant count for honest social-proof / scarcity copy."""
    registered = await db.webinar_leads.count_documents({"unsubscribed": {"$ne": True}})
    spots_left = max(0, WEBINAR_MAX_CAPACITY - registered)
    return {
        "registered": registered,
        "max_capacity": WEBINAR_MAX_CAPACITY,
        "spots_left": spots_left,
        "date": WEBINAR_EVENT["date"],
    }


@router.get("/webinar/leads")
async def list_leads(request: Request, limit: int = 200):
    await require_admin(request)
    limit = max(1, min(limit, 1000))
    total = await db.webinar_leads.count_documents({})
    unsubscribed = await db.webinar_leads.count_documents({"unsubscribed": True})
    recent = await db.webinar_leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"total": total, "unsubscribed": unsubscribed, "recent": recent}


_UNSUB_HTML = """<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Abgemeldet</title></head>
<body style="margin:0;background:#0A0A0A;color:#fff;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:12vh auto;padding:0 24px;text-align:center;">
<div style="font-family:monospace;font-size:11px;letter-spacing:.2em;color:#BFFF00;font-weight:800;text-transform:uppercase;">▸ LEADER · OS</div>
<h1 style="font-size:28px;font-weight:900;margin:16px 0 8px;">{headline}</h1>
<p style="color:rgba(255,255,255,.6);font-size:15px;line-height:1.6;">{body}</p>
</div></body></html>"""


@router.get("/webinar/unsubscribe", response_class=HTMLResponse)
async def unsubscribe(token: str):
    email = _verify_unsub_token(token)
    if not email:
        return HTMLResponse(_UNSUB_HTML.format(
            headline="Link ungültig", body="Dieser Abmelde-Link ist ungültig oder abgelaufen.",
        ), status_code=400)
    now = datetime.now(timezone.utc).isoformat()
    await db.webinar_leads.update_one(
        {"email_lower": email}, {"$set": {"unsubscribed": True, "unsubscribed_at": now}},
    )
    logger.info("webinar lead unsubscribed: %s", email.replace("\r", " ").replace("\n", " "))
    return HTMLResponse(_UNSUB_HTML.format(
        headline="Du bist abgemeldet",
        body="Du erhältst keine weiteren E-Mails zu diesem Webinar.",
    ))


async def _send_reminder_window(window_hours: float, label: str) -> dict:
    """Send 24h/1h reminders to all non-unsubscribed leads, deduped per flag."""
    if not email_enabled():
        return {"sent": 0, "skipped": 0, "error": "RESEND_API_KEY not configured"}

    event_dt = datetime.fromisoformat(WEBINAR_DATE_ISO.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    hours_until = (event_dt - now).total_seconds() / 3600
    if not (window_hours - 0.5 <= hours_until <= window_hours + 0.5):
        return {"sent": 0, "skipped": 0, "reason": "outside window", "hours_until": round(hours_until, 2)}

    flag_field = "reminder_24h_sent" if label == "24h" else "reminder_1h_sent"
    cal_url = _google_calendar_url()
    sent, skipped = 0, 0
    async for lead in db.webinar_leads.find(
        {"unsubscribed": {"$ne": True}, flag_field: {"$ne": True}}, {"_id": 0},
    ):
        email = lead.get("email_lower") or lead.get("email")
        if not email:
            skipped += 1
            continue
        name = lead.get("name") or email.split("@")[0]
        subject, html = event_reminder_email(name, WEBINAR_EVENT, hours_until, cal_url)
        result = await send_email(email, subject, html)
        await db.webinar_email_log.insert_one({
            "email": email, "type": f"reminder_{label}", "sent": result["sent"],
            "email_id": result.get("email_id"), "error": result.get("error"),
            "sent_at": now.isoformat(),
        })
        if result["sent"]:
            sent += 1
            await db.webinar_leads.update_one({"email_lower": email}, {"$set": {flag_field: True}})
        else:
            skipped += 1
    return {"sent": sent, "skipped": skipped, "hours_until": round(hours_until, 2)}


@router.post("/cron/webinar-reminders")
async def cron_reminders(request: Request):
    """Call every ~15 min from an external scheduler. Sends 24h + 1h reminders."""
    require_cron_auth(request)
    r24 = await _send_reminder_window(24.0, "24h")
    r1 = await _send_reminder_window(1.0, "1h")
    return {"24h": r24, "1h": r1, "enabled": email_enabled()}


@router.post("/cron/webinar-followup")
async def cron_followup(request: Request):
    """Day-after nudge toward the LeaderOS trial (call once daily).

    Only fires once the event is at least 20h in the past (so it always
    lands ~1 day after, tolerant of cron jitter) and skips leads that
    already converted (`meta_tags` bridge sets this on the user doc, but
    the lead record itself has no reliable "became a user" signal here —
    so this simply nudges every non-unsubscribed lead once, same as the
    free-video funnel's day-N drip).
    """
    require_cron_auth(request)
    if not email_enabled():
        return {"sent": 0, "skipped": 0, "error": "RESEND_API_KEY not configured"}

    event_dt = datetime.fromisoformat(WEBINAR_DATE_ISO.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    if now < event_dt + timedelta(hours=20):
        return {"sent": 0, "skipped": 0, "reason": "too early"}

    sent, skipped = 0, 0
    async for lead in db.webinar_leads.find(
        {"unsubscribed": {"$ne": True}, "followup_sent": {"$ne": True}}, {"_id": 0},
    ):
        email = lead.get("email_lower") or lead.get("email")
        if not email:
            skipped += 1
            continue
        name = lead.get("name") or email.split("@")[0]
        subject, html = webinar_followup_email(name, unsubscribe_link=_unsub_url(email))
        result = await send_email(email, subject, html)
        await db.webinar_email_log.insert_one({
            "email": email, "type": "followup", "sent": result["sent"],
            "email_id": result.get("email_id"), "error": result.get("error"),
            "sent_at": now.isoformat(),
        })
        if result["sent"]:
            sent += 1
            await db.webinar_leads.update_one({"email_lower": email}, {"$set": {"followup_sent": True}})
        else:
            skipped += 1
    return {"sent": sent, "skipped": skipped}
