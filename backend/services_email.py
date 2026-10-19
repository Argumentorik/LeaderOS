"""Resend email service for transactional emails (event reminders, confirmations)."""
import os
import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import Optional

import resend
from dotenv import load_dotenv

from config import db

load_dotenv()

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
BRAND_NAME = "WladBot"
# Absender-Name im Postfach (Wunsch Stefan): "Wlad von Leader OS"
SENDER_NAME = os.environ.get("SENDER_NAME", "Wlad von Leader OS")
BRAND_COLOR = "#BFFF00"
BRAND_DARK = "#0A0A0A"


_TRUSTED_ORIGIN_SUFFIXES = (".emergentagent.com", "leaderos.de", "leadercheck.de", "leader-os.de", "leader-check.de")


def _trusted_origin(origin: str) -> bool:
    origin = (origin or "").strip().lower()
    if not origin.startswith("https://") and not origin.startswith("http://localhost"):
        return False
    host = origin.split("://", 1)[1].split("/", 1)[0].split(":", 1)[0]
    whitelist = [o.strip().lower() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip() and o.strip() != "*"]
    if origin in whitelist:
        return True
    return host == "localhost" or any(host == s.lstrip(".") or host.endswith(s) for s in _TRUSTED_ORIGIN_SUFFIXES)


def _frontend_url(request=None) -> str:
    """App URL for links in transactional emails (magic link, welcome, reset).

    Order: `FRONTEND_BASE_URL` (explicit per deploy) → trusted `Origin` of the
    request (preview vs. prod get their own link) → `PUBLIC_BASE_URL` → leaderos.de.
    """
    explicit = (os.environ.get("FRONTEND_BASE_URL") or "").strip()
    if explicit:
        return explicit.rstrip("/")
    if request is not None:
        origin = request.headers.get("origin") or ""
        if not origin:
            ref = request.headers.get("referer") or ""
            if "://" in ref:
                scheme, rest = ref.split("://", 1)
                origin = f"{scheme}://{rest.split('/', 1)[0]}"
        if _trusted_origin(origin):
            return origin.rstrip("/")
    public = (os.environ.get("PUBLIC_BASE_URL") or "").strip()
    if public:
        return public.rstrip("/")
    return "https://leaderos.de"


def _init_resend():
    if not RESEND_API_KEY:
        return False
    resend.api_key = RESEND_API_KEY
    return True


def is_enabled() -> bool:
    """Check whether Resend is configured and ready."""
    return bool(RESEND_API_KEY)


RESERVED_EMAIL_DOMAINS = (
    ".test", ".local", ".localhost", ".invalid", ".example",
    "example.com", "example.org", "example.net", "wladbot.test",
)
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$")


async def _sendability(to: str) -> tuple[bool, str]:
    """Decide whether we are allowed to send to `to`. Returns (ok, reason)."""
    addr = (to or "").strip().lower()
    if not _EMAIL_RE.match(addr):
        return False, "invalid_address"
    if any(addr.endswith(d) or addr.split("@")[-1] == d for d in RESERVED_EMAIL_DOMAINS):
        return False, "reserved_test_domain"
    try:
        hit = await db.email_suppression.find_one({"email": addr}, {"_id": 0, "reason": 1})
    except Exception:
        hit = None
    if hit:
        return False, f"suppressed:{hit.get('reason', 'unknown')}"
    return True, ""


async def suppress_email(addr: str, reason: str) -> None:
    """Add an address to the suppression list after a permanent delivery failure."""
    addr = (addr or "").strip().lower()
    if not addr:
        return
    try:
        await db.email_suppression.update_one(
            {"email": addr},
            {"$set": {"email": addr, "reason": reason[:200],
                      "created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        await db.users.update_one({"email": addr}, {"$set": {"email_status": "invalid"}})
        logger.error("Email suppressed for %s — %s", addr, reason[:160])
    except Exception as e:
        logger.warning("Suppression write failed for %s: %s", addr, e)


async def send_email(
    to: str,
    subject: str,
    html: str,
    from_email: Optional[str] = None,
    reply_to: Optional[str] = None,
    max_retries: int = 3,
) -> dict:
    """Send an email via Resend (async, non-blocking) with exponential-backoff retry.

    Iter 136: THIS IS THE ONLY CHOKE POINT for outbound mail. Every flow
    (onboarding, sequences, cron, magic link, receipts) goes through here, so
    the sendability check below cannot be bypassed:
      - syntactically invalid addresses
      - reserved/test domains (.test, .local, .invalid, example.com …)
      - addresses on the suppression list (previous hard failure)
    Suppressed addresses are logged and counted, never silently swallowed.

    Returns {"sent": bool, "email_id": str|None, "error": str|None, "attempts": int}.
    Silent if API key missing — logs warning and returns sent=False.

    Iter 92.42 (Mert · Vibe-Security): retry transient Resend failures up to
    `max_retries` times with exponential backoff (0.5s · 1s · 2s). Permanent
    errors (domain-not-verified, invalid-recipient) are NOT retried — we look
    for keywords in the error message and short-circuit. Final failures emit a
    structured logger.error which Sentry/Cloud-logging will pick up for alerting.
    """
    if not _init_resend():
        logger.warning("RESEND_API_KEY not set — skipping email to %s", to)
        return {"sent": False, "email_id": None, "error": "RESEND_API_KEY not configured", "attempts": 0}

    ok, reason = await _sendability(to)
    if not ok:
        logger.warning("Email BLOCKED to %s (%s) — subject=%r", to, reason, subject[:60])
        return {"sent": False, "email_id": None, "error": f"blocked:{reason}", "attempts": 0}

    params = {
        "from": from_email or f"{SENDER_NAME} <{SENDER_EMAIL}>",
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if reply_to:
        params["reply_to"] = [reply_to]
    # Permanent-fail markers — Resend will keep returning these forever; no point retrying.
    PERMANENT_ERROR_HINTS = (
        "domain is not verified",
        "domain_not_verified",
        "invalid_to_address",
        "invalid recipient",
        "validation_error",
    )
    last_err: Optional[str] = None
    for attempt in range(1, max_retries + 1):
        try:
            result = await asyncio.to_thread(resend.Emails.send, params)
            email_id = result.get("id")
            if attempt > 1:
                logger.info("Resend send SUCCEEDED for %s on attempt %d (id=%s)", to, attempt, email_id)
            else:
                # Iter 92.42: log every successful send so Mert can grep delivery in prod.
                logger.info("Resend send OK → %s (id=%s, subject=%r)", to, email_id, subject[:60])
            return {"sent": True, "email_id": email_id, "error": None, "attempts": attempt}
        except Exception as e:
            err_text = str(e)
            last_err = err_text
            err_lower = err_text.lower()
            is_permanent = any(hint in err_lower for hint in PERMANENT_ERROR_HINTS)
            if is_permanent:
                logger.error(
                    "Resend PERMANENT failure to %s on attempt %d (no retry): %s",
                    to, attempt, err_text,
                )
                # Iter 136: never try this address again — protects sender reputation.
                await suppress_email(to, err_text)
                return {"sent": False, "email_id": None, "error": err_text, "attempts": attempt}
            if attempt < max_retries:
                # Exponential backoff: 0.5s, 1s, 2s
                wait_s = 0.5 * (2 ** (attempt - 1))
                logger.warning(
                    "Resend send to %s failed (attempt %d/%d): %s — retrying in %.1fs",
                    to, attempt, max_retries, err_text, wait_s,
                )
                await asyncio.sleep(wait_s)
            else:
                # Final failure — emit a high-priority log for alerting/Sentry.
                logger.error(
                    "Resend send to %s FAILED after %d attempts: %s",
                    to, max_retries, err_text,
                )
    return {"sent": False, "email_id": None, "error": last_err, "attempts": max_retries}


# ── Email Templates ─────────────────────────────────────────────

def _base_layout(body_html: str, preheader: str = "", badge: str = "") -> str:
    """Wrap content in the WladBot 3.0 branded email shell.

    Iter 107 (Mert · GODMODE): round WladBot 3.0 avatar with lime ring, "3.0"
    pill, optional episode badge (e.g. "EP 07 / 07") top-right with guaranteed
    spacing to the logo, divider line, and mobile media-queries for small
    screens. `alt="WladBot"` keeps the tile branded if images are blocked.
    """
    avatar_url = f"{_frontend_url()}/wladbot-avatar-clean.png"
    badge_html = (
        f'<span style="display:inline-block;border:1px solid rgba(191,255,0,0.4);background:rgba(191,255,0,0.08);color:{BRAND_COLOR};font-size:10px;font-weight:900;letter-spacing:0.16em;padding:7px 14px;border-radius:999px;white-space:nowrap;">{badge}</span>'
        if badge else
        '<span style="font-size:10px;color:rgba(255,255,255,0.35);font-weight:700;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;">Leadership&nbsp;OS</span>'
    )
    return f"""<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>WladBot</title>
<style>
  @media only screen and (max-width:480px) {{
    .wb-outer {{ padding: 16px 8px !important; }}
    .wb-card {{ border-radius: 16px !important; }}
    .wb-header {{ padding: 22px 20px 0 !important; }}
    .wb-body {{ padding: 22px 20px 28px !important; }}
    .wb-footer {{ padding: 16px 20px 22px !important; }}
    .wb-badge-cell {{ padding-left: 12px !important; }}
    h1 {{ font-size: 24px !important; }}
  }}
</style>
</head>
<body style="margin:0;padding:0;background:#F4F4F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">{preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wb-outer" style="background:#F4F4F4;padding:40px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wb-card" style="width:100%;max-width:600px;background:{BRAND_DARK};border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
  <tr><td class="wb-header" style="padding:30px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;">
            <img src="{avatar_url}" alt="WladBot" width="46" height="46" style="display:block;width:46px;height:46px;border-radius:50%;border:2px solid {BRAND_COLOR};background:{BRAND_COLOR};" />
          </td>
          <td style="vertical-align:middle;padding-left:12px;">
            <div style="font-weight:900;color:#fff;font-size:16px;letter-spacing:-0.02em;line-height:1.1;">WladBot&nbsp;<span style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};font-size:9px;font-weight:900;padding:2px 6px;border-radius:6px;vertical-align:middle;letter-spacing:0.04em;">3.0</span></div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:600;margin-top:3px;">Dein Leadership-Coach · immer an deiner Seite</div>
          </td>
        </tr></table>
      </td>
      <td class="wb-badge-cell" style="text-align:right;vertical-align:middle;padding-left:24px;">{badge_html}</td>
    </tr></table>
    <div style="height:1px;background:rgba(255,255,255,0.07);margin-top:22px;"></div>
  </td></tr>
  <tr><td style="padding:24px 32px 32px;color:#fff;">{body_html}</td></tr>
  <tr><td style="padding:20px 32px 28px;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="font-size:10px;color:rgba(255,255,255,0.35);margin:0;line-height:1.6;">
      Du erhältst diese Email, weil du dich für ein WladBot-Event registriert hast.<br>
      WladBot · Leadership Operating System · Powered by Wlad Jachtchenko's methods.
    </p>
  </td></tr>
</table></td></tr></table></body></html>"""


def _format_de_datetime(iso_str: str) -> tuple[str, str]:
    """Return (human_date, human_time) in German format."""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
        months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli",
                  "August", "September", "Oktober", "November", "Dezember"]
        return (
            f"{days[dt.weekday()]}, {dt.day}. {months[dt.month - 1]} {dt.year}",
            dt.strftime("%H:%M") + " Uhr",
        )
    except Exception:
        return iso_str, ""


def event_registration_email(user_name: str, event: dict, calendar_url: str = "") -> tuple[str, str]:
    """Return (subject, html) for event registration confirmation."""
    date_str, time_str = _format_de_datetime(event.get("date", ""))
    subject = f"✓ Angemeldet: {event.get('title', 'Event')}"
    cal_btn = ""
    if calendar_url:
        cal_btn = f"""<a href="{calendar_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:-0.01em;">Zu Google Calendar hinzufügen</a>"""

    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.12),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.2);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.15em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">Anmeldung bestätigt</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">Du bist dabei, {user_name}.</div>
</div>
<h1 style="font-size:26px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;margin:0 0 8px;">{event.get('title', 'Event')}</h1>
<p style="font-size:13px;color:rgba(255,255,255,0.55);margin:0 0 24px;line-height:1.55;">{event.get('description', '')[:220]}</p>

<table role="presentation" width="100%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 20px;margin-bottom:24px;"><tr>
<td style="padding:6px 0;"><div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);font-weight:800;text-transform:uppercase;margin-bottom:4px;">Datum</div><div style="font-size:13px;font-weight:700;">{date_str}</div></td>
<td style="padding:6px 0;text-align:right;"><div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);font-weight:800;text-transform:uppercase;margin-bottom:4px;">Uhrzeit</div><div style="font-size:13px;font-weight:700;color:{BRAND_COLOR};">{time_str}</div></td>
</tr></table>

<div style="text-align:center;padding:8px 0 4px;">{cal_btn}</div>
<p style="font-size:11px;color:rgba(255,255,255,0.3);margin:20px 0 0;text-align:center;">Wir erinnern dich 24h und 1h vor dem Event automatisch.</p>
"""
    return subject, _base_layout(body, preheader=f"Deine Anmeldung für {event.get('title', 'Event')} ist bestätigt.")


def event_reminder_email(user_name: str, event: dict, hours_until: float, calendar_url: str = "") -> tuple[str, str]:
    """Return (subject, html) for event reminder (1h or 24h before)."""
    date_str, time_str = _format_de_datetime(event.get("date", ""))
    is_soon = hours_until <= 2
    urgency = "Startet gleich" if is_soon else "Morgen"
    color_accent = "#FF4444" if is_soon else BRAND_COLOR
    subject = (
        f"⚡ Jetzt gleich: {event.get('title', 'Event')}"
        if is_soon
        else f"📅 Morgen: {event.get('title', 'Event')}"
    )
    cta_text = "Jetzt beitreten" if is_soon else "Details ansehen"
    cta_url = event.get("join_url") or calendar_url or "#"

    body = f"""
<div style="background:linear-gradient(135deg,{color_accent}22,{color_accent}08);border:1px solid {color_accent}40;border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:{color_accent};font-weight:800;text-transform:uppercase;margin-bottom:6px;">⚡ {urgency} · in {round(hours_until, 1)}h</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">Bereit, {user_name}?</div>
</div>

<h1 style="font-size:26px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;margin:0 0 8px;">{event.get('title', 'Event')}</h1>
<p style="font-size:13px;color:rgba(255,255,255,0.55);margin:0 0 24px;line-height:1.55;">{event.get('description', '')[:220]}</p>

<table role="presentation" width="100%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 20px;margin-bottom:24px;"><tr>
<td style="padding:6px 0;"><div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);font-weight:800;text-transform:uppercase;margin-bottom:4px;">Wann</div><div style="font-size:13px;font-weight:700;">{date_str}</div><div style="font-size:13px;font-weight:700;color:{color_accent};margin-top:2px;">{time_str}</div></td>
<td style="padding:6px 0;text-align:right;"><div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);font-weight:800;text-transform:uppercase;margin-bottom:4px;">Host</div><div style="font-size:13px;font-weight:700;">{event.get('host', 'Wlad Jachtchenko')}</div></td>
</tr></table>

<div style="text-align:center;padding:8px 0 4px;">
  <a href="{cta_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:-0.01em;">{cta_text}</a>
</div>
<p style="font-size:11px;color:rgba(255,255,255,0.3);margin:20px 0 0;text-align:center;">Kann nicht? <a href="#" style="color:rgba(255,255,255,0.5);">Abmelden</a></p>
"""
    return subject, _base_layout(body, preheader=f"{urgency} · {event.get('title', '')} · {time_str}")


# ── Tier Welcome Sequences & Installment Emails ─────────────────────────────

TIER_WELCOME = {
    "starter": {
        "subject": "Willkommen im Starter-Kreis, {name} ⚡",
        "headline": "Dein Leadership-Start ist live.",
        "body": """Du hast Zugang zu den <b>6 Video-Kursen</b>, deinem <b>Leadership-Report</b>,
dem <b>30-Tage-Aktionsplan</b> und dem kostenlosen Buch von Wlad.<br><br>
<b>Dein nächster Schritt:</b> Starte mit Video 1 "Die Wlad-Formel" und markiere dir heute
den ersten Meilenstein. Wir melden uns in 3 Tagen wieder.""",
        "cta_label": "Jetzt Video 1 starten",
        "cta_path": "/coaching",
    },
    "standard": {
        "subject": "Willkommen im Leadership System, {name} 🔑",
        "headline": "Dein Lizenzschlüssel ist aktiv. 1 Jahr Vollzugang.",
        "body": """Ab sofort nutzt du:<br>
• WladBot AI Coach 24/7<br>
• Den kompletten 30-Tage Sprint<br>
• Alle Playbooks, Frameworks & Simulationen<br>
• Die AI Leadership Community<br><br>
<b>Dein heute-Ritual:</b> 5 Min Daily Check-in starten — dein XP-Konto wartet.""",
        "cta_label": "Zum Dashboard",
        "cta_path": "/dashboard",
    },
    "accelerator": {
        "subject": "Welcome, Accelerator. Deine 2 Jahre starten jetzt, {name}.",
        "headline": "VIP-Zugang aktiv. Dein 1:1 mit Wlad steht bereit.",
        "body": """Du bekommst als einziger Tier:<br>
• <b>Video-Analyse & Missionen exklusiv</b><br>
• <b>6× 1:1 Calls mit Wlads Team</b><br>
• AI Learning Path (personalisiert)<br>
• Mastermind-Gruppe & Priority Support<br>
• Quartals-Reviews + Abschluss-Call<br><br>
<b>Dein erster Schritt:</b> Buche jetzt dein persönliches Onboarding-Gespräch.""",
        "cta_label": "Onboarding-Call buchen",
        "cta_path": "/coaching",
    },
}


def tier_welcome_email(tier: str, name: str, app_url: str = "https://leader-os.de") -> tuple[str, str]:
    cfg = TIER_WELCOME.get(tier, TIER_WELCOME["standard"])
    subject = cfg["subject"].format(name=name)
    cta_url = f"{app_url.rstrip('/')}{cfg['cta_path']}"
    # Plan Iter 187: Der Kauf ist ein Platz in der Universität — das Startdatum
    # steht in der Bestätigung, damit niemand auf ein Schloss starrt.
    from course_launch import launch_info
    li = launch_info()
    start_note = "" if li["launched"] else f"""
<div style="border:1px solid rgba(191,255,0,0.2);border-radius:12px;padding:14px 18px;margin:0 0 22px;">
  <div style="font-size:13px;font-weight:800;color:{BRAND_COLOR};margin-bottom:4px;">Dein Platz ist gesichert</div>
  <div style="font-size:13.5px;color:rgba(255,255,255,0.75);line-height:1.6;">
    Alle 10 Kurse (72 Folgen) und die Live-Calls schalten am <b>{li['label']}</b> frei.
    Bis dahin kannst du die erste Folge jedes Kurses schon ansehen.
  </div>
</div>"""
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.12),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.2);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">Tier: {tier.upper()}</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">{cfg['headline']}</div>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.75);line-height:1.65;margin:0 0 24px;">{cfg['body']}</p>
<div style="text-align:center;padding:8px 0 4px;">
  <a href="{cta_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;">{cfg['cta_label']}</a>
</div>
"""
    return subject, _base_layout(body, preheader=cfg["headline"], bib_code=f"T-{tier[:3].upper()}")


def course_launch_reminder_email(name: str, days_left: int, app_url: str = "https://leaderos.de") -> tuple[str, str]:
    """Erinnerung kurz vor dem Start der Kurs-Universität (Plan Iter 187)."""
    from course_launch import launch_info
    li = launch_info()
    when = "morgen" if days_left <= 1 else f"in {days_left} Tagen"
    subject = f"{name}, {when} geht es los — 10 Kurse, 72 Folgen"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.12),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.2);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">Start {li['label']}</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">Es geht {when} los</div>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.75);line-height:1.65;margin:0 0 24px;">
  Hallo {name}, am <b>{li['label']}</b> schalten alle 10 Kurse mit 72 Folgen und die Live-Calls
  für dich frei. Nimm dir für die erste Woche zwei feste Termine im Kalender — eine Folge dauert
  unter 12 Minuten.
</p>
<div style="text-align:center;padding:8px 0 4px;">
  <a href="{app_url.rstrip('/')}/kurse" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;">Studienplan ansehen</a>
</div>
"""
    return subject, _base_layout(body, preheader=f"Start am {li['label']}")


def installment_due_email(name: str, installment_num: int, total: int, amount: float,
                           checkout_url: str, due_date_str: str) -> tuple[str, str]:
    """Email prompting user to pay next installment."""
    remaining = total - installment_num + 1
    subject = f"Rate {installment_num}/{total} fällig — {amount:.2f} € · Accelerator bleibt aktiv"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.12),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.2);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">Leadership Accelerator · Ratenzahlung</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">Hallo {name}, deine Rate {installment_num}/{total} steht an.</div>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.75);line-height:1.65;margin:0 0 16px;">
Danke, dass du den Accelerator-Weg gehst. Deine heutige Rate ist fällig:
</p>
<table role="presentation" width="100%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 20px;margin-bottom:24px;"><tr>
<td style="padding:6px 0;"><div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);font-weight:800;text-transform:uppercase;margin-bottom:4px;">Betrag</div><div style="font-size:22px;font-weight:900;color:{BRAND_COLOR};">{amount:.2f} €</div></td>
<td style="padding:6px 0;text-align:right;"><div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);font-weight:800;text-transform:uppercase;margin-bottom:4px;">Fällig</div><div style="font-size:13px;font-weight:700;">{due_date_str}</div><div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">{remaining} Raten verbleibend</div></td>
</tr></table>
<div style="text-align:center;padding:8px 0 4px;">
  <a href="{checkout_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;">Jetzt Rate bezahlen</a>
</div>
<p style="font-size:11px;color:rgba(255,255,255,0.3);margin:20px 0 0;text-align:center;">Fragen zur Rate? Einfach auf diese Email antworten.</p>
"""
    return subject, _base_layout(body, preheader=f"Rate {installment_num}/{total} · {amount:.2f} € fällig")


# ── Signup Welcome (every new user, BEFORE any purchase) ─────────────────────

def signup_welcome_email(name: str, app_url: str = "https://leader-os.de") -> tuple[str, str]:
    """Sent right after a user creates their account (free tier)."""
    subject = f"Willkommen bei Leader-OS, {name} ⚡"
    dashboard_url = f"{app_url.rstrip('/')}/dashboard"
    coaching_url = f"{app_url.rstrip('/')}/coaching"
    body = f"""
<div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin:12px 0 14px;">▸ ACCOUNT AKTIV · FREE</div>

<div style="font-weight:900;font-style:italic;font-size:40px;line-height:0.96;letter-spacing:-0.03em;color:#ffffff;margin:0 0 4px;">Willkommen,</div>
<div style="font-weight:900;font-style:italic;font-size:40px;line-height:0.96;letter-spacing:-0.03em;color:#ffffff;margin:0 0 28px;">{name}<span style="color:{BRAND_COLOR};">.</span></div>

<p style="font-size:15px;color:rgba(255,255,255,0.78);line-height:1.6;margin:0 0 28px;">
Du hast gerade dein Leadership-Operating-System aktiviert — die KI-Plattform, die auf Wlad Jachtchenkos Frameworks basiert. Ab jetzt führst du nicht mehr aus dem Bauch, sondern mit System.
</p>

<!-- Step list — typographic spec table -->
<div style="border-top:2px solid rgba(255,255,255,0.15);border-bottom:2px solid rgba(255,255,255,0.15);padding:20px 0;margin-bottom:28px;">
  <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.22em;color:rgba(255,255,255,0.45);font-weight:700;text-transform:uppercase;margin-bottom:14px;">▸ DEIN START · 5 MIN</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:6px 0;vertical-align:top;width:32px;">
      <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§01</span>
    </td><td style="padding:6px 0;font-size:14px;color:#ffffff;font-weight:700;line-height:1.4;">
      Leader-Diagnose-Check  <span style="color:rgba(255,255,255,0.45);font-weight:400;font-size:13px;"> · 3 Min</span>
    </td></tr>
    <tr><td style="padding:6px 0;vertical-align:top;">
      <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§02</span>
    </td><td style="padding:6px 0;font-size:14px;color:#ffffff;font-weight:700;line-height:1.4;">
      Erste Führungsfrage an WladBot  <span style="color:rgba(255,255,255,0.45);font-weight:400;font-size:13px;"> · 60 Sek</span>
    </td></tr>
    <tr><td style="padding:6px 0;vertical-align:top;">
      <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§03</span>
    </td><td style="padding:6px 0;font-size:14px;color:#ffffff;font-weight:700;line-height:1.4;">
      Daily Check-in für XP-Streak
    </td></tr>
  </table>
</div>

<!-- Primary CTA — square pill, Nike-style -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;"><tr>
  <td style="background:{BRAND_COLOR};padding:0;">
    <a href="{dashboard_url}" style="display:inline-block;padding:16px 28px;color:{BRAND_DARK};text-decoration:none;font-weight:900;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">+  Dashboard öffnen</a>
  </td>
</tr></table>

<!-- Free-tier spec -->
<div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.22em;color:rgba(255,255,255,0.45);font-weight:700;text-transform:uppercase;margin:0 0 14px;">▸ SPEC · FREE-TIER</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.12);margin-bottom:28px;">
  <tr>
    <td style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.10);border-right:1px solid rgba(255,255,255,0.10);width:50%;vertical-align:top;">
      <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.18em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">BOT</div>
      <div style="font-size:13px;color:#ffffff;font-weight:700;line-height:1.3;margin-bottom:4px;">WladBot</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.65);line-height:1.45;">24/7 KI-Coach. Trainiert auf 600+ Wlad-Lektionen.</div>
    </td>
    <td style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.10);width:50%;vertical-align:top;">
      <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.18em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">3× ANALYSE</div>
      <div style="font-size:13px;color:#ffffff;font-weight:700;line-height:1.3;margin-bottom:4px;">14 Tage gratis</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.65);line-height:1.45;">Drei Video-Analysen für echtes Selbst-Feedback.</div>
    </td>
  </tr>
</table>

<p style="font-size:12px;color:rgba(255,255,255,0.55);margin:0;line-height:1.6;text-align:center;">
Bereit für mehr? <a href="{coaching_url}" style="color:{BRAND_COLOR};font-weight:700;text-decoration:none;">Class 0001 freischalten ▸</a>
</p>
"""
    return subject, _base_layout(body, preheader=f"Dein LeaderOS-Account ist live, {name}. Erster Schritt: 5 Minuten.")


# ── Masterclass Welcome (from Wlad, on license activation) ────────────────
# Iter 128 (Godmode · Wlad-Direktive): Warm, personal welcome from Wlad for
# the ~400 Masterclass clients redeeming their 6/12/18-month license.
# NOT generic — reads like a note from Wlad himself, funnels toward Plus.

def masterclass_welcome_email(name: str, app_url: str = "https://leaderos.de") -> tuple[str, str]:
    subject = f"Willkommen im Kreis, {name}."
    dashboard_url = f"{app_url.rstrip('/')}/dashboard"
    plus_url = "https://leadercheck.de/plus"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.18),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.28);border-radius:14px;padding:20px 24px;margin-bottom:26px;">
  <div style="font-size:10px;letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:8px;">Masterclass · Zugang aktiv</div>
  <div style="font-size:26px;font-weight:900;line-height:1.15;letter-spacing:-0.02em;">Willkommen im Kreis, {name}.</div>
</div>

<p style="font-size:14.5px;color:rgba(255,255,255,0.82);line-height:1.7;margin:0 0 18px;">
Wenn du das hier liest, dann bist du bei uns nicht neu — du bist Teil der Masterclass. Ich freue mich sehr, dass du LeaderOS jetzt persönlich nutzen kannst.
</p>

<p style="font-size:14px;color:rgba(255,255,255,0.72);line-height:1.7;margin:0 0 18px;">
Du hast <b>250 Credits</b> auf deinem Account. Das reicht für richtig viel: Argumentations-Vorbereitungen, WladBot-Coaching, Video-Feedback, PDF-Strategien. Nutze sie — jedes Gespräch, das du hier vorbereitest, macht dich in der echten Welt schärfer.
</p>

<h3 style="font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin:26px 0 12px;">Womit ich anfangen würde</h3>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 22px;margin-bottom:22px;">
  <p style="font-size:13.5px;color:rgba(255,255,255,0.88);line-height:1.7;margin:0 0 14px;">
    <b>1.</b> Öffne die <b>SEXIER-Prep</b> und bereite dein nächstes wichtiges Gespräch vor.<br>
    <b>2.</b> Frag den WladBot deine ehrlichste Führungsfrage. Er kennt meine Frameworks besser als ich sie zu 4 Uhr morgens erklären könnte.<br>
    <b>3.</b> Mach den <b>Leader-Diagnose-Check</b> — 3 Minuten, Standortbestimmung.
  </p>
  <div style="text-align:center;padding-top:6px;">
    <a href="{dashboard_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:800;font-size:13px;">Jetzt einloggen</a>
  </div>
</div>

<h3 style="font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin:26px 0 12px;">Ein Angebot nur für dich</h3>
<div style="background:{BRAND_DARK};border:1px solid rgba(191,255,0,0.28);border-radius:14px;padding:18px 22px;margin-bottom:20px;">
  <p style="font-size:13.5px;color:rgba(255,255,255,0.88);line-height:1.65;margin:0 0 12px;">
    Wenn LeaderOS für dich klickt, hol dir <b style="color:{BRAND_COLOR};">LeaderOS Plus</b> — Live-Calls mit mir, exklusive Kurse, Community, Events. Als Masterclass-Kunde bekommst du bevorzugten Zugang und Sonderkonditionen.
  </p>
  <a href="{plus_url}" style="color:{BRAND_COLOR};font-size:12.5px;font-weight:800;text-decoration:none;">
    → LeaderOS Plus ansehen
  </a>
</div>

<p style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;margin:24px 0 6px;">
Falls du direkt Fragen hast — antworte einfach auf diese E-Mail. Ich lese mit.
</p>
<p style="font-size:13.5px;color:#fff;font-weight:700;margin:0;">
Wlad
</p>
<p style="font-size:11px;color:rgba(255,255,255,0.35);margin:4px 0 0;letter-spacing:0.06em;">
WLAD JACHTCHENKO · GRÜNDER LEADEROS
</p>
"""
    return subject, _base_layout(body, preheader=f"Dein Masterclass-Zugang ist live, {name}. 250 Credits warten.")


# ── Masterclass Invite (Iter 132 — admin creates the account directly) ──────
# Sent when Wlad's team adds a masterclass client in the admin panel. The
# account has NO password — the client logs in via Magic Link (1-click).

def masterclass_invite_email(name: str, months: int, expires_label: str,
                             app_url: str = "https://leaderos.de") -> tuple[str, str]:
    import html as _html
    safe = _html.escape(name)
    login_url = f"{app_url.rstrip('/')}/login"
    subject = f"{name}, dein Masterclass-Zugang zu Leader-OS ist freigeschaltet"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.18),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.28);border-radius:14px;padding:20px 24px;margin-bottom:26px;">
  <div style="font-size:10px;letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:8px;">Masterclass · Zugang freigeschaltet</div>
  <div style="font-size:26px;font-weight:900;line-height:1.15;letter-spacing:-0.02em;">Willkommen im Kreis, {safe}.</div>
</div>

<p style="font-size:14.5px;color:rgba(255,255,255,0.82);line-height:1.7;margin:0 0 18px;">
Als Teil der Masterclass hast du ab sofort persönlichen Zugang zu <b>Leader-OS</b> — meiner kompletten Methodik als KI, rund um die Uhr an deiner Seite. Dein Zugang läuft <b>{months} Monate</b> (bis {expires_label}) und beinhaltet <b>250 Credits</b> für Argumentations-Vorbereitungen, WladBot-Coaching, Video-Feedback und PDF-Strategien.
</p>

<h3 style="font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin:26px 0 12px;">So loggst du dich ein — ohne Passwort</h3>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 22px;margin-bottom:22px;">
  <p style="font-size:13.5px;color:rgba(255,255,255,0.88);line-height:1.8;margin:0;">
    <b>1.</b> Öffne <a href="{login_url}" style="color:{BRAND_COLOR};text-decoration:none;font-weight:700;">leaderos.de/login</a><br>
    <b>2.</b> Wähle den Tab <b>„Magic Link"</b> und gib diese E-Mail-Adresse ein<br>
    <b>3.</b> Klicke auf den Link in deinem Postfach — fertig, du bist drin
  </p>
</div>

<p style="margin:0 0 26px;text-align:center;">
  <a href="{login_url}" style="display:inline-block;padding:14px 30px;background:{BRAND_COLOR};color:#0A0A0A;font-weight:800;text-decoration:none;border-radius:10px;font-size:15px;">Jetzt einloggen →</a>
</p>

<p style="font-size:14px;color:rgba(255,255,255,0.72);line-height:1.7;margin:0 0 18px;">
Mein Tipp für den Start: Bereite dein nächstes wichtiges Gespräch mit der <b>SEXIER-Prep</b> vor — 3 Minuten Input, eine komplette Argumentationsstrategie als Ergebnis.
</p>

<p style="font-size:14px;color:rgba(255,255,255,0.82);line-height:1.7;margin:24px 0 0;">
Bis gleich im System,<br>
Wlad
</p>
<p style="font-size:11px;color:rgba(255,255,255,0.35);margin:4px 0 0;letter-spacing:0.06em;">
WLAD JACHTCHENKO · GRÜNDER LEADEROS
</p>
"""
    return subject, _base_layout(body, preheader=f"Dein Zugang läuft {months} Monate — Login per 1-Klick, kein Passwort nötig.")


def masterclass_expiry_reminder_email(name: str, days_left: int, expires_label: str) -> tuple[str, str]:
    import html as _html
    safe = _html.escape(name)
    plus_url = "https://leadercheck.de/plus"
    subject = f"{name}, dein Masterclass-Zugang endet in {days_left} Tagen"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.16),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.24);border-radius:14px;padding:20px 24px;margin-bottom:26px;">
  <div style="font-size:10px;letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:8px;">Masterclass · Noch {days_left} Tage</div>
  <div style="font-size:24px;font-weight:900;line-height:1.15;letter-spacing:-0.02em;">{safe}, dein Zugang endet am {expires_label}.</div>
</div>

<p style="font-size:14.5px;color:rgba(255,255,255,0.82);line-height:1.7;margin:0 0 18px;">
Dein Masterclass-Zugang zu Leader-OS läuft in <b>{days_left} Tagen</b> aus. Danach wird dein Account automatisch auf die Free-Version umgestellt — deine Daten, Strategien und dein Fortschritt bleiben natürlich erhalten.
</p>

<p style="font-size:14px;color:rgba(255,255,255,0.72);line-height:1.7;margin:0 0 22px;">
Wenn du weitermachen willst — mit vollem Zugang, allen Credits und allem, was noch kommt — sichere dir jetzt <b>LeaderOS Plus</b>:
</p>

<p style="margin:0 0 26px;text-align:center;">
  <a href="{plus_url}" style="display:inline-block;padding:14px 30px;background:{BRAND_COLOR};color:#0A0A0A;font-weight:800;text-decoration:none;border-radius:10px;font-size:15px;">Zugang verlängern →</a>
</p>

<p style="font-size:14px;color:rgba(255,255,255,0.82);line-height:1.7;margin:24px 0 0;">
Bis dahin: Nutze die verbleibenden Tage. Jedes vorbereitete Gespräch zählt.<br>
Wlad
</p>
"""
    return subject, _base_layout(body, preheader=f"Noch {days_left} Tage Masterclass-Zugang — verlängere jetzt, bevor er ausläuft.")


# ── Day-10 Consultation Reminder (Iter 131.4 · Wlad-Direktive) ────────────
# Warm personal invitation to book a free 30-min 1:1 call with Wlad's team.
# Sent ~10 days after signup — after the user has had time to try the
# platform but hasn't yet decided on a plan. Highest-conversion moment.

def consultation_reminder_email(
    name: str,
    booking_url: str = "https://leadercheck.de/beratung",
    unsubscribe_link: str | None = None,
) -> tuple[str, str]:
    subject = f"{name}, 30 Minuten mit uns — auf uns."
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.16),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.24);border-radius:14px;padding:20px 24px;margin-bottom:26px;">
  <div style="font-size:10px;letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:8px;">Persönliche Beratung · kostenfrei</div>
  <div style="font-size:24px;font-weight:900;line-height:1.15;letter-spacing:-0.02em;">
    {name}, kurzes Gespräch. Auf uns.
  </div>
</div>

<p style="font-size:14.5px;color:rgba(255,255,255,0.82);line-height:1.7;margin:0 0 18px;">
Du bist jetzt ~10 Tage mit Leader-OS unterwegs. Das ist die Phase, in der die meisten merken: „Ich brauch jemanden, mit dem ich das kurz durchsprechen kann." Genau dafür sind wir da.
</p>

<p style="font-size:14px;color:rgba(255,255,255,0.72);line-height:1.7;margin:0 0 18px;">
Ein:e Argumentorik-Leadership-Berater:in aus Wlad Jachtchenkos Team nimmt sich <b>30 Minuten</b> für dich — kostenfrei, 100% unverbindlich. Wir klären:
</p>

<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px 22px;margin-bottom:22px;">
  <p style="font-size:13.5px;color:rgba(255,255,255,0.88);line-height:1.75;margin:0;">
    &nbsp;•&nbsp; Wo stehst du gerade — und was fehlt noch, damit dein Team dir folgt?<br>
    &nbsp;•&nbsp; Welches Format aus Leader-OS passt zu deiner nächsten Woche?<br>
    &nbsp;•&nbsp; Wann macht LeaderOS Plus für dich Sinn — und wann nicht.
  </p>
</div>

<div style="text-align:center;margin:26px 0 22px;">
  <a href="{booking_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:15px 30px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:-0.01em;box-shadow:0 8px 26px -8px rgba(191,255,0,0.4);">
    Slot wählen &nbsp;→
  </a>
  <p style="font-size:11px;color:rgba(255,255,255,0.5);margin:10px 0 0;">Verfügbare Slots: heute und diese Woche. Dauert 30 Minuten.</p>
</div>

<p style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.65;margin:24px 0 6px;">
Falls du gerade keine Zeit hast oder nicht magst — kein Stress. Ich melde mich nicht nochmal deswegen. Antworte einfach mit einem Satz, was gerade schiefläuft, ich lese mit.
</p>
<p style="font-size:13.5px;color:#fff;font-weight:700;margin:12px 0 0;">
Wlad &amp; Team
</p>
<p style="font-size:11px;color:rgba(255,255,255,0.35);margin:4px 0 0;letter-spacing:0.06em;">
LEADEROS · leadercheck.de
</p>
"""
    # Iter 131.4: append unsubscribe link inline (below CTA) since
    # `_base_layout` doesn't natively template it.
    if unsubscribe_link:
        body += (
            f'<p style="text-align:center;font-size:10px;color:rgba(255,255,255,0.28);'
            f'margin-top:20px;">'
            f'<a href="{unsubscribe_link}" style="color:rgba(255,255,255,0.4);'
            f'text-decoration:underline;">Keine weiteren Beratungs-Einladungen</a>'
            f'</p>'
        )
    return subject, _base_layout(body, preheader=f"{name}, 30 Minuten mit einem Argumentorik-Berater — auf uns.")




# ── Stripe Receipt (after successful payment, in addition to tier_welcome) ───

def stripe_receipt_email(name: str, package_name: str, amount: float, currency: str,
                         tier: str, transaction_id: str,
                         app_url: str = "https://leaderos.de") -> tuple[str, str]:
    """Receipt email after a successful Stripe payment. Includes tier benefits + receipt info."""
    currency_symbol = "€" if currency.lower() == "eur" else currency.upper() + " "
    subject = f"Zahlung bestätigt · {currency_symbol}{amount:.2f} · LeaderOS"
    dashboard_url = f"{app_url.rstrip('/')}/dashboard"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.12),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.22);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">✓ Zahlung erfolgreich</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">Danke, {name}.</div>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.75);line-height:1.65;margin:0 0 20px;">
Dein {package_name} ist sofort aktiv. Hier deine Belegdetails — bitte für deine Unterlagen aufbewahren.
</p>

<table role="presentation" width="100%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 22px;margin-bottom:20px;">
  <tr><td style="padding:6px 0;font-size:11px;color:rgba(255,255,255,0.45);">Produkt</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#fff;font-weight:700;">{package_name}</td></tr>
  <tr><td style="padding:6px 0;font-size:11px;color:rgba(255,255,255,0.45);">Tier</td><td style="padding:6px 0;text-align:right;font-size:13px;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">{tier}</td></tr>
  <tr><td style="padding:6px 0;font-size:11px;color:rgba(255,255,255,0.45);">Transaktion</td><td style="padding:6px 0;text-align:right;font-size:11px;color:rgba(255,255,255,0.65);font-family:monospace;">{transaction_id}</td></tr>
  <tr><td style="padding:6px 0;font-size:11px;color:rgba(255,255,255,0.45);">Datum</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#fff;">{datetime.now().strftime('%d.%m.%Y')}</td></tr>
  <tr><td style="padding:10px 0 6px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:#fff;font-weight:700;">Gesamt</td><td style="padding:10px 0 6px;text-align:right;border-top:1px solid rgba(255,255,255,0.06);font-size:18px;color:{BRAND_COLOR};font-weight:900;">{currency_symbol}{amount:.2f}</td></tr>
</table>

<div style="text-align:center;padding:8px 0 4px;">
  <a href="{dashboard_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;">Zum Dashboard</a>
</div>

<p style="font-size:11px;color:rgba(255,255,255,0.4);margin:24px 0 0;line-height:1.6;text-align:center;">
Diese Email ist deine offizielle Zahlungsbestätigung. Bei Fragen zur Rechnung: einfach auf diese Email antworten.<br>
30-Tage Geld-zurück-Garantie. Inkl. Mehrwertsteuer wo gesetzlich vorgeschrieben.
</p>
"""
    return subject, _base_layout(body, preheader=f"Beleg · {currency_symbol}{amount:.2f} · {package_name}")


# ── Video-Trial Reminder (3 days before trial deadline) ──────────────────────

def trial_reminder_email(name: str, days_left: int, used: int, total: int,
                         app_url: str = "https://leaderos.de") -> tuple[str, str]:
    """Reminder when the user's 14-day video-analysis trial is approaching its end."""
    remaining = max(0, total - used)
    subject = f"Noch {days_left} Tage Gratis-Video-Analyse, {name} · {remaining} frei"
    coaching_url = f"{app_url.rstrip('/')}/coaching"
    video_url = f"{app_url.rstrip('/')}/missions"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(255,184,0,0.18),rgba(255,184,0,0.04));border:1px solid rgba(255,184,0,0.32);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:#FFB800;font-weight:800;text-transform:uppercase;margin-bottom:6px;">⏰ Trial endet in {days_left} Tagen</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">{name}, deine Video-Analyse läuft aus.</div>
</div>

<p style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.65;margin:0 0 20px;">
Du hast noch <b style="color:{BRAND_COLOR};">{remaining} von {total} kostenlosen Video-Analysen</b> übrig. Nutze sie, bevor das 14-Tage-Fenster schließt — danach nur noch via Leadership OS PLUS verfügbar.
</p>

<table role="presentation" width="100%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 22px;margin-bottom:20px;">
  <tr>
    <td style="text-align:center;padding:6px 0;"><div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.4);font-weight:800;text-transform:uppercase;margin-bottom:4px;">Tage übrig</div><div style="font-size:28px;font-weight:900;color:#FFB800;">{days_left}</div></td>
    <td style="text-align:center;padding:6px 0;"><div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.4);font-weight:800;text-transform:uppercase;margin-bottom:4px;">Analysen frei</div><div style="font-size:28px;font-weight:900;color:{BRAND_COLOR};">{remaining}</div></td>
    <td style="text-align:center;padding:6px 0;"><div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.4);font-weight:800;text-transform:uppercase;margin-bottom:4px;">Verbraucht</div><div style="font-size:28px;font-weight:900;color:#fff;">{used}</div></td>
  </tr>
</table>

<div style="text-align:center;padding:8px 0 4px;">
  <a href="{video_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;margin-right:8px;">Jetzt Analyse starten</a>
</div>
<div style="text-align:center;padding:12px 0 0;">
  <a href="{coaching_url}" style="display:inline-block;color:rgba(255,255,255,0.5);padding:8px 18px;text-decoration:underline;font-size:12px;">Auf Leadership OS PLUS upgraden →</a>
</div>
"""
    return subject, _base_layout(body, preheader=f"⏰ {days_left} Tage · {remaining} Analysen verfügbar")


# ── 7-Tage Drip Sequence (Day 1, Day 3, Day 7) ───────────────────────────────

def drip_day1_email(name: str, app_url: str = "https://leader-os.de") -> tuple[str, str]:
    """Day 1 drip: Education — explain the system."""
    subject = "Tag 1 · Die Wlad-Formel kurz erklärt"
    chat_url = f"{app_url.rstrip('/')}/chat"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.10),rgba(154,204,0,0.02));border:1px solid rgba(191,255,0,0.18);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">Tag 1 · Foundation</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">{name}, das ist das System hinter Leader-OS.</div>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.7;margin:0 0 18px;">
Wlad Jachtchenko hat über 15 Jahre 5.000+ Führungskräfte trainiert. Sein System ruht auf <b>3 Säulen</b>:
</p>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 22px;margin-bottom:20px;">
  <p style="font-size:13px;color:#fff;margin:0 0 10px;line-height:1.55;"><b style="color:{BRAND_COLOR};">1. Rhetorik</b> — Wie du das Vertrauen in 30 Sekunden gewinnst.</p>
  <p style="font-size:13px;color:#fff;margin:0 0 10px;line-height:1.55;"><b style="color:{BRAND_COLOR};">2. EQ</b> — Wie du erkennst, was dein Gegenüber wirklich denkt.</p>
  <p style="font-size:13px;color:#fff;margin:0;line-height:1.55;"><b style="color:{BRAND_COLOR};">3. KI-Kompetenz</b> — Wie du KI als Co-Pilot, nicht als Krücke nutzt.</p>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.7;margin:0 0 20px;">
<b>Heute machst du nur eine Sache:</b> Frag WladBot eine echte Frage, die dich aktuell als Führungskraft beschäftigt. Probier es:
</p>
<div style="text-align:center;padding:6px 0 4px;">
  <a href="{chat_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;">Zu WladBot</a>
</div>
"""
    return subject, _base_layout(body, preheader="3 Säulen, 1 System: Wie Leader-OS funktioniert.")


def drip_day3_email(name: str, app_url: str = "https://leader-os.de") -> tuple[str, str]:
    """Day 3 drip: Quick win — drive an action."""
    subject = f"Tag 3 · Dein erstes Mini-Win, {name}"
    diag_url = f"{app_url.rstrip('/')}/leader-diagnose"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(0,170,255,0.12),rgba(0,170,255,0.02));border:1px solid rgba(0,170,255,0.22);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:#00AAFF;font-weight:800;text-transform:uppercase;margin-bottom:6px;">Tag 3 · Quick Win</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">3 Minuten. 1 Diagnose. 0 Ausreden.</div>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.7;margin:0 0 18px;">
Du hast deinen Account. Du hast WladBot. Jetzt fehlt nur noch eins: deine <b>Leader-Diagnose</b>.<br><br>
Sie zeigt dir auf einer Skala von 0–100, wo deine drei Führungsdimensionen heute stehen:
</p>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 22px;margin-bottom:20px;">
  <p style="font-size:13px;color:#fff;margin:0 0 8px;line-height:1.55;">📊 <b>Leadership-Score</b> — wie souverän führst du?</p>
  <p style="font-size:13px;color:#fff;margin:0 0 8px;line-height:1.55;">💬 <b>Kommunikations-Score</b> — wie klar wirkst du?</p>
  <p style="font-size:13px;color:#fff;margin:0;line-height:1.55;">❤️ <b>EQ-Score</b> — wie gut liest du Menschen?</p>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.7;margin:0 0 20px;">
Danach generiert die KI deinen <b>personalisierten 30-Tage-Aktionsplan</b>. Kein Bullshit, kein Newsletter — direkt umsetzbar.
</p>
<div style="text-align:center;padding:6px 0 4px;">
  <a href="{diag_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;">Jetzt Leader-Diagnose machen</a>
</div>
"""
    return subject, _base_layout(body, preheader="3 Minuten Diagnose · 30 Tage Aktionsplan")


def drip_day7_email(name: str, app_url: str = "https://leader-os.de") -> tuple[str, str]:
    """Day 7 drip: Conversion — pitch Leadership OS Standard."""
    subject = f"Tag 7 · Was sich nach 30 Tagen ändert, {name}"
    coaching_url = f"{app_url.rstrip('/')}/coaching"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.14),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.24);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">Tag 7 · Decision Point</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">Bereit, das Spiel hochzuziehen?</div>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.7;margin:0 0 18px;">
Eine Woche im System. Wenn du WladBot ernsthaft genutzt hast, hast du schon <b>3–5 konkrete Erkenntnisse</b> gewonnen, die du in deinem nächsten Mitarbeitergespräch direkt einsetzen kannst.<br><br>
Aber das ist erst die Spitze. <b>Leadership OS Standard</b> öffnet das volle System:
</p>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 22px;margin-bottom:20px;">
  <p style="font-size:13px;color:#fff;margin:0 0 10px;line-height:1.55;"><b style="color:{BRAND_COLOR};">12 Videokurse</b> · 1/Monat freigeschaltet · Wert 2.388€</p>
  <p style="font-size:13px;color:#fff;margin:0 0 10px;line-height:1.55;"><b style="color:{BRAND_COLOR};">30-Tage Sprint</b> · KI-personalisiert auf deine Diagnose</p>
  <p style="font-size:13px;color:#fff;margin:0 0 10px;line-height:1.55;"><b style="color:{BRAND_COLOR};">Alle Frameworks</b> · Schwierige Gespräche, Verhandlung, Rhetorik, 5 Rollen</p>
  <p style="font-size:13px;color:#fff;margin:0;line-height:1.55;"><b style="color:{BRAND_COLOR};">Video-Analyse Bonus</b> · 5 frische Analysen direkt nach Kauf</p>
</div>

<div style="background:rgba(191,255,0,0.06);border:1px solid rgba(191,255,0,0.2);border-radius:14px;padding:18px 22px;margin-bottom:6px;">
  <div style="font-size:9px;letter-spacing:0.18em;color:{BRAND_COLOR};font-weight:900;text-transform:uppercase;margin-bottom:6px;">Übe es jetzt in Leader-OS</div>
  <p style="font-size:14px;color:#fff;margin:0 0 16px;line-height:1.6;">{episode['practice']}</p>
  <div style="text-align:center;">
    <a href="{cta_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 30px;border-radius:12px;text-decoration:none;font-weight:800;font-size:13.5px;letter-spacing:-0.01em;">{episode['cta_label']} →</a>
  </div>
</div>
{unsub}
"""
    return subject, _base_layout(body, preheader="Was sich nach 30 Tagen Leader-OS ändert.")


# ── Monthly Leadership Scorecard (Accelerator-only) ─────────────────────────

def monthly_scorecard_email(
    name: str,
    xp_delta: int,
    challenge_days_delta: int,
    ls: int,
    eq: int,
    comm: int,
    overall: int,
    top_insight: str,
    next_focus: str,
    app_url: str = "https://leaderos.de",
) -> tuple[str, str]:
    """Generate the monthly Accelerator scorecard email."""
    month_label = datetime.now().strftime("%B %Y")
    subject = f"Dein Leadership-Monat {month_label} · Score {overall}/100"
    dashboard_url = f"{app_url.rstrip('/')}/my-path"

    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.15),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.25);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">Scorecard · {month_label}</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">Hallo {name}, so lief dein Monat.</div>
</div>

<table role="presentation" width="100%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 20px;margin-bottom:16px;">
  <tr>
    <td style="padding:6px 0;text-align:center;">
      <div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);font-weight:800;text-transform:uppercase;margin-bottom:4px;">XP</div>
      <div style="font-size:24px;font-weight:900;color:{BRAND_COLOR};">+{xp_delta}</div>
    </td>
    <td style="padding:6px 0;text-align:center;">
      <div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);font-weight:800;text-transform:uppercase;margin-bottom:4px;">Challenge-Tage</div>
      <div style="font-size:24px;font-weight:900;color:#fff;">+{challenge_days_delta}</div>
    </td>
    <td style="padding:6px 0;text-align:center;">
      <div style="font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);font-weight:800;text-transform:uppercase;margin-bottom:4px;">Overall</div>
      <div style="font-size:24px;font-weight:900;color:{BRAND_COLOR};">{overall}<span style="font-size:13px;color:rgba(255,255,255,0.45);">/100</span></div>
    </td>
  </tr>
</table>

<h3 style="font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin:24px 0 12px;">3-Layer Analyse</h3>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 20px;margin-bottom:24px;">
  <div style="margin-bottom:12px;"><div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px;">KI-Kompetenz</div><div style="height:6px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden;"><div style="height:100%;width:{ls}%;background:{BRAND_COLOR};"></div></div></div>
  <div style="margin-bottom:12px;"><div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px;">Boardroom-Rhetorik</div><div style="height:6px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden;"><div style="height:100%;width:{comm}%;background:#00AAFF;"></div></div></div>
  <div><div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px;">Strategisches EQ</div><div style="height:6px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden;"><div style="height:100%;width:{eq}%;background:#FFB800;"></div></div></div>
</div>

<div style="background:rgba(191,255,0,0.05);border:1px solid rgba(191,255,0,0.15);border-radius:14px;padding:16px 20px;margin-bottom:16px;">
  <div style="font-size:9px;letter-spacing:0.15em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">Dein Insight des Monats</div>
  <p style="font-size:14px;color:#fff;margin:0;line-height:1.5;">{top_insight}</p>
</div>

<div style="background:rgba(255,184,0,0.05);border:1px solid rgba(255,184,0,0.15);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:9px;letter-spacing:0.15em;color:#FFB800;font-weight:800;text-transform:uppercase;margin-bottom:6px;">Fokus für den nächsten Monat</div>
  <p style="font-size:14px;color:rgba(255,255,255,0.85);margin:0;line-height:1.5;">{next_focus}</p>
</div>

<div style="text-align:center;padding:8px 0 4px;">
  <a href="{dashboard_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;">Detail-Analyse ansehen</a>
</div>
"""
    return subject, _base_layout(body, preheader=f"Score {overall}/100 · +{xp_delta} XP · {top_insight[:80]}")


# ── Video-Drip: Week 1-6 Lernvideo-Sequence (Lead-Magnet) ─────────────────────
# Triggered weekly after signup, once a Vimeo ID is filled for each video.
# Skipped automatically by the cron if the corresponding video has no
# vimeo_id yet — so we never email "watch this" with a broken link.

VIDEO_DRIP_VIDEOS = [
    {
        "id": "v1", "week": 1, "title": "Rhetorik-Grundlagen",
        "subtitle": "Die 3 Säulen wirkungsvoller Führungssprache",
        "duration": "42 Min", "module": "Kommunikation",
        "hook": "Eine Frage, die jeder Leader sich am Mittwoch stellt: warum hört keiner zu, wenn ich rede? Diese Lektion beantwortet sie.",
        "takeaway": "Du erkennst die 3 unsichtbaren Hebel, die zwischen 'klingt wie Hintergrundrauschen' und 'der Raum verstummt' entscheiden.",
    },
    {
        "id": "v2", "week": 2, "title": "Schwierige Gespräche meistern",
        "subtitle": "Konflikt, Kritik & Kündigung — ohne Drama",
        "duration": "38 Min", "module": "Kommunikation",
        "hook": "Das Gespräch, das du seit Wochen vor dir herschiebst — wir machen es heute. Mit der SBI-Methode in 38 Minuten.",
        "takeaway": "Du lernst, wie du auch die unbequemste Botschaft so platzierst, dass dein Gegenüber sie hört statt sich zu verschließen.",
    },
    {
        "id": "v3", "week": 3, "title": "Delegation wie ein Profi",
        "subtitle": "Aufgaben abgeben, Vertrauen aufbauen",
        "duration": "29 Min", "module": "Führung",
        "hook": "Wenn du nach 18 Uhr noch im Büro sitzt, hast du ein Delegations-Problem. Diese Lektion fixt es in einer Woche.",
        "takeaway": "Du bekommst die Wlad-Delegations-Matrix — und weißt nach dieser Folge genau, was du WANN abgibst (und was nie).",
    },
    {
        "id": "v4", "week": 4, "title": "Feedback-Formate (SBI & WWW)",
        "subtitle": "Wöchentlich, faktenbasiert, wirksam",
        "duration": "35 Min", "module": "Coaching",
        "hook": "70% aller Feedback-Gespräche scheitern in den ersten 30 Sekunden. Diese Folge zeigt, wie du in 7 Sekunden gewinnst.",
        "takeaway": "Du beherrschst SBI + WWW. Damit gibst du Feedback, das nicht persönlich ankommt — und trotzdem etwas verändert.",
    },
    {
        "id": "v5", "week": 5, "title": "Storytelling im Boardroom",
        "subtitle": "Komplexe Ideen in 2 Minuten verkaufen",
        "duration": "47 Min", "module": "Kommunikation",
        "hook": "Wer das Storytelling-Framework drauf hat, gewinnt das Meeting. Punkt. Diese Lektion gibt dir genau das.",
        "takeaway": "Du baust nach dieser Folge jede C-Level-Präsentation nach der Hollywood-Dramaturgie. 3 Akte, 2 Minuten, eine Wirkung.",
    },
    {
        "id": "v6", "week": 6, "title": "Meeting-Rhetorik",
        "subtitle": "Die 20-Sekunden-Regel",
        "duration": "33 Min", "module": "Führung",
        "hook": "Wer zuerst spricht, gewinnt. Wer es richtig macht, dominiert. Heute lernst du das Wie.",
        "takeaway": "Du verstehst Agenda-Hacking, die 20-Sekunden-Eröffnung und wie du nach der Hälfte eines Meetings als Gewinner dastehst.",
    },
]


def video_drip_email(name: str, video: dict, app_url: str = "https://leaderos.de", unsubscribe_link: str | None = None) -> tuple[str, str]:
    """Generate a weekly drip email pointing to a single Lernvideo.

    Subject lines are intentionally psychological: a tease + the takeaway,
    NOT 'watch this video'. Open-rate optimized.
    """
    week = video["week"]
    title = video["title"]
    subtitle = video["subtitle"]
    hook = video["hook"]
    takeaway = video["takeaway"]
    duration = video["duration"]
    module = video["module"]
    deeplink = f"{app_url.rstrip('/')}/my-path?video={video['id']}"
    unsub = (
        f'<p style="font-size:10px;color:rgba(255,255,255,0.3);margin:20px 0 0;text-align:center;">'
        f'<a href="{unsubscribe_link}" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Diese Lernvideo-Serie abbestellen</a>'
        f'</p>' if unsubscribe_link else ''
    )

    subject = f"Woche {week}: {title} — freigeschaltet 🎬"

    body = f"""
<div style="font-size:9px;color:{BRAND_COLOR};letter-spacing:0.18em;font-weight:900;text-transform:uppercase;margin-bottom:8px;">Lernvideo · Woche {week} / 6</div>
<h1 style="font-size:30px;line-height:1.1;font-weight:900;margin:0 0 8px;letter-spacing:-0.025em;">{title}</h1>
<p style="font-size:13px;color:rgba(255,255,255,0.55);margin:0 0 24px;">{subtitle} · {duration} · {module}</p>

<p style="font-size:15px;color:rgba(255,255,255,0.92);line-height:1.55;margin:0 0 18px;">
Hallo {name},
</p>

<p style="font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;margin:0 0 18px;">
{hook}
</p>

<div style="background:rgba(191,255,0,0.05);border:1px solid rgba(191,255,0,0.18);border-radius:14px;padding:18px 22px;margin:22px 0;">
  <div style="font-size:9px;letter-spacing:0.18em;color:{BRAND_COLOR};font-weight:900;text-transform:uppercase;margin-bottom:6px;">Dein Takeaway</div>
  <p style="font-size:14px;color:#fff;margin:0;line-height:1.55;">{takeaway}</p>
</div>

<div style="text-align:center;padding:14px 0 4px;">
  <a href="{deeplink}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:15px 36px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:-0.01em;">▶︎ Lektion {week} ansehen</a>
</div>

<p style="font-size:11px;color:rgba(255,255,255,0.4);margin:24px 0 0;text-align:center;line-height:1.6;">
{duration} · 100% kostenfrei · Kein Cliffhanger · Kein Upsell
</p>
{unsub}
"""
    return subject, _base_layout(body, preheader=f"Woche {week}: {subtitle} · {duration}", badge=f"WOCHE&nbsp;{week}&nbsp;/&nbsp;6")

