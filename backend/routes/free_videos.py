"""Free-Video funnel — durable lead capture + delivery (godmode).

This is the data layer for the /gratis-videos squeeze page. Every opt-in is
persisted in Mongo (`db.free_video_leads`, keyed by email_lower) so we OWN the
lead list regardless of whether Supabase/PostHog are reachable. On top of that
each capture:

  1. stores rich attribution (name, UTM, referrer, landing path, sources),
  2. immediately emails the lead Video 1 (instant delivery — the funnel works
     even if they never create an account),
  3. best-effort forwards to the same Supabase `incomplete_attempts` pipeline
     the rest of the product dedups on via email_lower.

The Day 2-4 daily drip for email-only leads is driven by the shared
`/api/cron/free-video-drip` cron (see routes/lifecycle_emails.py), which reads
this collection. Leads that later register are skipped there (the user drip
covers them) to avoid double-sends.

Endpoints:
  POST /api/free-videos/lead         — capture + deliver (public)
  GET  /api/free-videos/config       — ready videos + embed URLs (public)
  GET  /api/free-videos/leads        — list/summary (admin only)
  GET  /api/free-videos/unsubscribe  — one-click opt-out for email-only leads
"""
import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from config import db, logger
from routes.admin import require_admin
from services_email import send_email, free_video_drip_email, is_enabled as email_enabled
from services_free_videos import (
    FREE_VIDEOS, FREE_VIDEOS_BY_ID, PUBLIC_FUNNEL_URL, is_ready, embed_url,
)

router = APIRouter(prefix="/api/free-videos", tags=["free-videos"])


def _is_valid_email(email: str) -> bool:
    """Regex-free email sanity check.

    Same semantics as the old ^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$ pattern (exactly
    one @, no whitespace, domain has a dot with non-empty parts) but with no
    backtracking — CodeQL flagged the regex as polynomial on attacker input.
    """
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


# ── Lead-specific (email-based) unsubscribe · leads have no user_id ──────────

def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def make_lead_unsub_token(email_lower: str, ttl_days: int = 365) -> str:
    exp = int(datetime.now(timezone.utc).timestamp()) + ttl_days * 86400
    payload = json.dumps({"le": email_lower, "e": exp}, separators=(",", ":")).encode()
    sig = hmac.new(_SIGNING_KEY, payload, hashlib.sha256).digest()
    return f"{_b64(payload)}.{_b64(sig)}"


def _verify_lead_unsub_token(token: str) -> str | None:
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


def lead_unsub_url(email_lower: str, app_url: str = "https://leaderos.de") -> str:
    return f"{app_url.rstrip('/')}/api/free-videos/unsubscribe?token={make_lead_unsub_token(email_lower)}"


# ── Payloads ─────────────────────────────────────────────────────────────────

class UTM(BaseModel):
    source: str | None = ""
    medium: str | None = ""
    campaign: str | None = ""
    term: str | None = ""
    content: str | None = ""


class LeadPayload(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)
    name: str | None = Field(default="", max_length=120)
    source: str = Field(default="free-video-lp", max_length=64)
    campaign: str = Field(default="leader-os-4-free-videos", max_length=80)
    utm: UTM | None = None
    referrer: str | None = Field(default="", max_length=500)
    landing_path: str | None = Field(default="", max_length=200)


def _video_public(video: dict) -> dict:
    return {
        "id": video["id"],
        "day": video["day"],
        "title": video["title"],
        "subtitle": video["subtitle"],
        "tag": video.get("duration", ""),
        "blurb": video.get("hook", ""),
        "embed_url": embed_url(video),
        "ready": is_ready(video),
    }


async def bridge_lead_to_user(user_id: str, email_lower: str) -> bool:
    """Bridge funnel attribution from a free-video lead onto the registered user.

    Called from every path where a lead becomes a user (register, Google
    session, leader-check sync, cron detection). Two effects:

      1. Lead: marked registered (+ registered_user_id) — stops the
         email-only drip; the registered-user drip owns them from here.
      2. User: receives `funnel_attribution` (UTM, sources, referrer, landing
         path, opt-in history, drip days received) + a `free-videos` meta_tag —
         so the journey Landing → Lead → User is queryable end-to-end on the
         user document, not buried in a side collection.

    Idempotent and best-effort: returns False (never raises) when there is no
    matching lead or the write fails — registration must never block on this.
    """
    try:
        lead = await db.free_video_leads.find_one({"email_lower": email_lower}, {"_id": 0})
        if not lead:
            return False
        now = datetime.now(timezone.utc).isoformat()
        # First bridge wins for registered_at; re-bridges only refresh the link.
        await db.free_video_leads.update_one(
            {"email_lower": email_lower, "registered_at": {"$exists": False}},
            {"$set": {"registered_at": now}},
        )
        await db.free_video_leads.update_one(
            {"email_lower": email_lower},
            {"$set": {"registered": True, "registered_user_id": user_id}},
        )
        attribution = {
            "funnel": "free-video-series",
            "sources": lead.get("sources") or [],
            "utm": lead.get("utm") or {},
            "referrer": lead.get("referrer") or "",
            "landing_path": lead.get("landing_path") or "",
            "campaign": lead.get("campaign") or "",
            "lead_name": lead.get("name") or "",
            "lead_created_at": lead.get("created_at"),
            "optin_count": int(lead.get("optin_count", 1)),
            "drip_days_received": sorted(lead.get("drip_sent_days") or []),
            "bridged_at": now,
        }
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"funnel_attribution": attribution},
             "$addToSet": {"meta_tags": "free-videos"}},
        )
        return True
    except Exception as exc:  # pragma: no cover - best-effort by contract
        logger.warning("free-video lead bridge failed for user %s: %s", user_id, exc)
        return False


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
        logger.warning("free-video lead: supabase forward failed: %s", exc)


@router.post("/lead")
async def capture_lead(payload: LeadPayload, request: Request):
    """Capture a free-video lead, deliver Video 1, and mirror to Supabase."""
    email = payload.email.strip().lower()
    if not _is_valid_email(email):
        return {"ok": False, "error": "invalid_email"}

    name = (payload.name or "").strip()
    now = datetime.now(timezone.utc).isoformat()
    utm = (payload.utm.model_dump() if payload.utm else {}) or {}
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or None

    # Upsert the durable lead record (we own this data).
    set_fields = {
        "email": email,
        "email_lower": email,
        "last_seen_at": now,
        "campaign": payload.campaign,
    }
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

    await db.free_video_leads.update_one(
        {"email_lower": email},
        {
            "$set": set_fields,
            "$setOnInsert": {"created_at": now, "unsubscribed": False, "welcome_sent": False,
                             "drip_sent_days": [], "registered": False},
            "$inc": {"optin_count": 1},
            "$addToSet": {"sources": payload.source},
        },
        upsert=True,
    )

    lead = await db.free_video_leads.find_one({"email_lower": email}, {"_id": 0})

    # Instant delivery: email Video 1 on first opt-in (idempotent via welcome_sent).
    welcome_sent = False
    fv1 = FREE_VIDEOS_BY_ID.get("fv1") or FREE_VIDEOS[0]
    if (
        email_enabled()
        and is_ready(fv1)
        and not (lead or {}).get("welcome_sent")
        and not (lead or {}).get("unsubscribed")
    ):
        subject, html = free_video_drip_email(
            name or email.split("@")[0], fv1, total=len(FREE_VIDEOS),
            unsubscribe_link=lead_unsub_url(email),
            deeplink=PUBLIC_FUNNEL_URL,  # lead has no account — no login wall
        )
        result = await send_email(email, subject, html)
        if result["sent"]:
            welcome_sent = True
            await db.free_video_leads.update_one(
                {"email_lower": email},
                {"$set": {"welcome_sent": True, "welcome_sent_at": now},
                 "$addToSet": {"drip_sent_days": 1}},
            )
        await db.email_log.insert_one({
            "email": email, "type": "free_video_lead_welcome", "video_id": fv1["id"], "day": 1,
            "sent": result["sent"], "email_id": result.get("email_id"),
            "error": result.get("error"), "sent_at": now,
        })

    await _forward_to_supabase(email, {
        "source": payload.source, "campaign": payload.campaign,
        "name": name, "utm": utm, "referrer": payload.referrer, "funnel": "free-video-series",
    })

    return {
        "ok": True,
        "welcome_sent": welcome_sent,
        "videos": [_video_public(v) for v in FREE_VIDEOS],
    }


@router.get("/config")
async def free_videos_config():
    """Public: the video list + resolved embed URLs (keeps clients in sync)."""
    return {
        "total": len(FREE_VIDEOS),
        "videos": [_video_public(v) for v in FREE_VIDEOS],
        "ready": [v["id"] for v in FREE_VIDEOS if is_ready(v)],
    }


@router.get("/leads")
async def list_leads(request: Request, limit: int = 200):
    """Admin: lead list + summary so the team can see the data coming in."""
    await require_admin(request)
    limit = max(1, min(limit, 1000))
    total = await db.free_video_leads.count_documents({})
    registered = await db.free_video_leads.count_documents({"registered": True})
    delivered = await db.free_video_leads.count_documents({"welcome_sent": True})
    unsubscribed = await db.free_video_leads.count_documents({"unsubscribed": True})
    recent = await db.free_video_leads.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return {
        "total": total,
        "registered": registered,
        "delivered": delivered,
        "unsubscribed": unsubscribed,
        # Lead → user conversion of the funnel, in percent (one decimal).
        "conversion_rate": round(registered / total * 100, 1) if total else 0.0,
        "recent": recent,
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
async def lead_unsubscribe(token: str):
    """One-click opt-out for email-only leads (no login, no user_id needed)."""
    email = _verify_lead_unsub_token(token)
    if not email:
        return HTMLResponse(_UNSUB_HTML.format(
            headline="Link ungültig",
            body="Dieser Abmelde-Link ist ungültig oder abgelaufen.",
        ), status_code=400)
    now = datetime.now(timezone.utc).isoformat()
    await db.free_video_leads.update_one(
        {"email_lower": email},
        {"$set": {"unsubscribed": True, "unsubscribed_at": now}},
    )
    # Strip CR/LF before logging — the value originates from a user-supplied
    # token payload (HMAC-verified, but defense-in-depth against log injection).
    logger.info("free-video lead unsubscribed: %s", email.replace("\r", " ").replace("\n", " "))
    return HTMLResponse(_UNSUB_HTML.format(
        headline="Du bist abgemeldet",
        body="Du erhältst keine weiteren Videos dieser Serie. Kein Problem — du kannst jederzeit zurückkommen.",
    ))
