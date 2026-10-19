"""Leader-Check landing intent capture + lead-nurture enrollment.

The leader-os.de LeadCaptureModal (and any future popup that wants to
capture a lead) POSTs here with email + source + campaign. Two effects:

  1. Durable Mongo record in `db.nurture_leads` (keyed by email_lower) —
     we OWN the lead list. This collection drives the 7-step nurture
     journey (`/api/cron/lead-nurture` in routes/lifecycle_emails.py);
     step 1 (welcome + B-W-W formula) is sent instantly at capture time,
     best-effort, mirroring the free-video funnel's instant delivery.
  2. Best-effort mirror into Supabase `incomplete_attempts` (the same
     table the leader-check.de funnel writes to) so analytics + drips
     stay unified by `email_lower` across both surfaces.

The endpoint is intentionally permissive: an invalid email returns
an error payload, anything else returns 200 even if downstream writes
fail — the user's funnel must continue, the lead is best-effort.

Endpoints:
  POST /api/leader-check/intent       — capture + enroll (public)
  GET  /api/leader-check/unsubscribe  — one-click nurture opt-out (public)
"""
import logging
import os
import re
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from config import db
from services_email import (
    send_email, lead_nurture_email, is_enabled as email_enabled,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/leader-check", tags=["leader-check"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def nurture_unsub_url(email_lower: str, app_url: str = "https://leaderos.de") -> str:
    """HMAC one-click opt-out link for nurture leads (no account, no user_id).

    Reuses the free-video funnel's signed lead token (same JWT_SECRET-keyed
    HMAC) — only the endpoint (and thus the flag it sets) differs.
    """
    from routes.free_videos import make_lead_unsub_token  # local import avoids cycle
    return f"{app_url.rstrip('/')}/api/leader-check/unsubscribe?token={make_lead_unsub_token(email_lower)}"


class IntentPayload(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)
    name: str | None = Field(default="", max_length=120)
    source: str = Field(default="unknown", max_length=64)
    campaign: str = Field(default="", max_length=64)


@router.post("/intent")
async def capture_intent(payload: IntentPayload):
    email = payload.email.strip().lower()
    if not EMAIL_RE.match(email):
        return {"ok": False, "error": "invalid_email"}

    name = (payload.name or "").strip()
    now = datetime.now(timezone.utc).isoformat()

    # ── 1. Durable Mongo lead (nurture journey) — we own this record ─────────
    persisted_mongo = False
    lead = None
    try:
        set_fields = {"email": email, "email_lower": email, "last_seen_at": now}
        if name:
            set_fields["name"] = name
        if payload.campaign:
            set_fields["campaign"] = payload.campaign
        await db.nurture_leads.update_one(
            {"email_lower": email},
            {
                "$set": set_fields,
                "$setOnInsert": {"created_at": now, "unsubscribed": False,
                                 "nurture_steps_sent": []},
                "$inc": {"optin_count": 1},
                "$addToSet": {"sources": payload.source},
            },
            upsert=True,
        )
        persisted_mongo = True
        lead = await db.nurture_leads.find_one({"email_lower": email}, {"_id": 0})
    except Exception as exc:  # never block the funnel
        logger.warning("intent.capture: mongo lead upsert failed: %s", exc)

    # ── 2. Instant nurture step 1 (welcome + B-W-W) — best-effort ────────────
    # Skipped when: email sending disabled, step 1 already sent (idempotent),
    # lead unsubscribed, or the email already belongs to a registered user
    # (they got signup_welcome + the registered-user drip instead).
    welcome_sent = False
    try:
        if (
            email_enabled()
            and lead is not None
            and 1 not in (lead.get("nurture_steps_sent") or [])
            and not lead.get("unsubscribed")
        ):
            existing_user = await db.users.find_one(
                {"email_lower": email}, {"_id": 0, "user_id": 1}
            )
            if not existing_user:
                subject, html = lead_nurture_email(
                    1, name or email.split("@")[0],
                    unsubscribe_link=nurture_unsub_url(email),
                )
                result = await send_email(email, subject, html)
                if result["sent"]:
                    welcome_sent = True
                    await db.nurture_leads.update_one(
                        {"email_lower": email},
                        {"$addToSet": {"nurture_steps_sent": 1},
                         "$set": {"nurture_step1_sent_at": now}},
                    )
                await db.email_log.insert_one({
                    "email": email, "type": "lead_nurture_s1", "step": 1,
                    "sent": result["sent"], "email_id": result.get("email_id"),
                    "error": result.get("error"), "sent_at": now,
                })
    except Exception as exc:  # never block the funnel
        logger.warning("intent.capture: nurture step-1 send failed: %s", exc)

    # ── 3. Best-effort Supabase mirror (unchanged behaviour) ─────────────────
    if not SUPABASE_URL or not (SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY):
        logger.warning("intent.capture: supabase not configured, dropping %s", email)
        return {"ok": True, "persisted": persisted_mongo, "welcome_sent": welcome_sent}

    rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/upsert_incomplete_attempt"
    key = SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    body = {
        "p_email": email,
        "p_source_platform": "leader-os",
        "p_meta": {"source": payload.source, "campaign": payload.campaign},
    }

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.post(rpc_url, json=body, headers=headers)
        if response.status_code >= 400:
            logger.warning("intent.capture: rpc %s failed: %s", rpc_url, response.text[:200])
            return {"ok": True, "persisted": persisted_mongo, "welcome_sent": welcome_sent}
    except Exception as exc:
        logger.warning("intent.capture: rpc error: %s", exc)
        return {"ok": True, "persisted": persisted_mongo, "welcome_sent": welcome_sent}

    return {"ok": True, "persisted": True, "welcome_sent": welcome_sent}


_UNSUB_HTML = """<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Abgemeldet</title></head>
<body style="margin:0;background:#0A0A0A;color:#fff;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:12vh auto;padding:0 24px;text-align:center;">
<div style="font-family:monospace;font-size:11px;letter-spacing:.2em;color:#BFFF00;font-weight:800;text-transform:uppercase;">▸ LEADER · OS</div>
<h1 style="font-size:28px;font-weight:900;margin:16px 0 8px;">{headline}</h1>
<p style="color:rgba(255,255,255,.6);font-size:15px;line-height:1.6;">{body}</p>
</div></body></html>"""


@router.get("/unsubscribe", response_class=HTMLResponse)
async def nurture_unsubscribe(token: str):
    """One-click opt-out for nurture leads (no login, no user_id needed)."""
    from routes.free_videos import _verify_lead_unsub_token  # local import avoids cycle
    email = _verify_lead_unsub_token(token)
    if not email:
        return HTMLResponse(_UNSUB_HTML.format(
            headline="Link ungültig",
            body="Dieser Abmelde-Link ist ungültig oder abgelaufen.",
        ), status_code=400)
    now = datetime.now(timezone.utc).isoformat()
    await db.nurture_leads.update_one(
        {"email_lower": email},
        {"$set": {"unsubscribed": True, "unsubscribed_at": now}},
    )
    # Strip CR/LF before logging — the value originates from a user-supplied
    # token payload (HMAC-verified, but defense-in-depth against log injection).
    logger.info("nurture lead unsubscribed: %s", email.replace("\r", " ").replace("\n", " "))
    return HTMLResponse(_UNSUB_HTML.format(
        headline="Du bist abgemeldet",
        body="Du erhältst keine weiteren Mails dieser Serie. Kein Problem — du kannst jederzeit zurückkommen.",
    ))
