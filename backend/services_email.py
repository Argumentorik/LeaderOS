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

def _base_layout(body_html: str, preheader: str = "", badge: str = "",
                 bib_code: str = "") -> str:
    """Wrap content in the WladBot 3.0 branded email shell.

    Iter 107 (Mert · GODMODE): round WladBot 3.0 avatar with lime ring, "3.0"
    pill, optional episode badge (e.g. "EP 07 / 07") top-right with guaranteed
    spacing to the logo, divider line, and mobile media-queries for small
    screens. `alt="WladBot"` keeps the tile branded if images are blocked.
    """
    # Merge mvpcode ⇄ emergent-update: die Funnel-Mails aus mvpcode (Free-
    # Video-Drip, Lead-Nurture, License-Activation, Webinar-Follow-up, …)
    # rufen _base_layout(..., bib_code=…) auf. Wir mappen den BIB-Code auf das
    # Badge oben rechts; ein explizites badge gewinnt. Empfänger dieser Mails
    # haben oft (noch) kein Konto → neutraler Footer.
    is_funnel = bool(bib_code) and not badge
    if bib_code and not badge:
        badge = f"BIB&nbsp;·&nbsp;{bib_code}"
    footer_reason = (
        "Du erhältst diese E-Mail, weil du dich bei LeaderOS eingetragen hast."
        if is_funnel else
        "Du erhältst diese E-Mail, weil du ein Leader-OS Konto hast."
    )
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
  <tr><td class="wb-body" style="padding:26px 32px 34px;color:#fff;">{body_html}</td></tr>
  <tr><td class="wb-footer" style="padding:20px 32px 28px;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="font-size:10px;color:rgba(255,255,255,0.35);margin:0;line-height:1.7;">
      {footer_reason}<br>
      WladBot · Leadership Operating System · basiert auf den Frameworks von Wlad Jachtchenko.
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
• Das komplette 30-Tage-Programm<br>
• Alle Playbooks, Frameworks & Simulationen<br>
• Die AI Leadership Community<br><br>
<b>Dein heute-Ritual:</b> 5 Min Daily Check-in starten — dein XP-Konto wartet.""",
        "cta_label": "Zum Dashboard",
        "cta_path": "/dashboard",
    },
    "accelerator": {
        "subject": "Welcome, Accelerator. Deine 2 Jahre starten jetzt, {name}.",
        "headline": "VIP-Zugang aktiv. Dein 1:1 mit Wlads Expertenteam steht bereit.",
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


def tier_welcome_email(tier: str, name: str, app_url: str = "https://leaderos.de") -> tuple[str, str]:
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
{start_note}
<div style="text-align:center;padding:8px 0 4px;">
  <a href="{cta_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;">{cfg['cta_label']}</a>
</div>
"""
    return subject, _base_layout(body, preheader=cfg["headline"])


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

def signup_welcome_email(name: str, app_url: str = "https://leaderos.de") -> tuple[str, str]:
    """Sent right after a user creates their account (free tier)."""
    subject = f"Willkommen bei Leader-OS, {name} ⚡"
    dashboard_url = f"{app_url.rstrip('/')}/dashboard"
    coaching_url = f"{app_url.rstrip('/')}/coaching"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.14),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.22);border-radius:14px;padding:18px 22px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">Account aktiv · Free Zugang</div>
  <div style="font-size:24px;font-weight:900;line-height:1.2;letter-spacing:-0.02em;">Willkommen an Bord, {name}.</div>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.65;margin:0 0 20px;">
Du hast gerade dein <b>Leadership Operating System</b> aktiviert — die KI-Plattform, die auf Wlad Jachtchenkos Frameworks basiert. Ab jetzt führst du nicht mehr aus dem Bauch, sondern mit System.
</p>

<h3 style="font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin:24px 0 12px;">Dein erster Schritt heute (5 Minuten)</h3>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 22px;margin-bottom:20px;">
  <p style="font-size:13px;color:rgba(255,255,255,0.85);line-height:1.6;margin:0 0 14px;">
    <b>1.</b> Mache deinen Leader-Diagnose-Check (3 Minuten)<br>
    <b>2.</b> Stelle WladBot deine erste Führungsfrage<br>
    <b>3.</b> Starte den Daily Check-in für deine XP-Streak
  </p>
  <div style="text-align:center;padding-top:6px;">
    <a href="{dashboard_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:-0.01em;">Jetzt Dashboard öffnen</a>
  </div>
</div>

<h3 style="font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin:28px 0 12px;">Was du als Free-User schon bekommst</h3>
<table role="presentation" width="100%" style="margin-bottom:20px;"><tr>
<td valign="top" style="padding:6px 12px 6px 0;width:50%;"><div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px 16px;height:100%;"><div style="font-size:10px;letter-spacing:0.15em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:4px;">WladBot</div><div style="font-size:13px;color:#fff;line-height:1.45;">Dein KI-Coach. 24/7 erreichbar. Trainiert auf 600+ Wlad-Lektionen.</div></div></td>
<td valign="top" style="padding:6px 0 6px 12px;width:50%;"><div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px 16px;height:100%;"><div style="font-size:10px;letter-spacing:0.15em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:4px;">3 Gratis Analysen</div><div style="font-size:13px;color:#fff;line-height:1.45;">14 Tage lang: 3 kostenlose Video-Analysen für dein Selbst-Feedback.</div></div></td>
</tr></table>

<p style="font-size:12px;color:rgba(255,255,255,0.45);margin:24px 0 0;line-height:1.6;text-align:center;">
Bereit für den nächsten Schritt? <a href="{coaching_url}" style="color:{BRAND_COLOR};font-weight:700;text-decoration:none;">Leadership OS freischalten →</a>
</p>
"""
    return subject, _base_layout(body, preheader=f"Dein Leadership-OS Account ist live. Starte hier, {name}.")


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
    subject = f"Zahlung bestätigt · {currency_symbol}{amount:.2f} · Leader-OS"
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


# ── Framework-Serie: EP 01/07 – EP 07/07 (Onboarding, framework-first) ────────
# Iter 107 (Mert): replaces the old Day-1/3/7 drip. NO invented stories (no
# "CFO-Test") — every episode teaches ONE real Wlad framework and shows the
# user exactly where to practice it inside Leader-OS. Perfect for onboarding
# the 400 masterclass clients.

FRAMEWORK_EPISODES = [
    {
        "ep": 1, "day": 1,
        "framework": "Die 3 Säulen",
        "subject": "EP 01/07 · Die 3 Säulen: So funktioniert Wlads System",
        "tagline": "Das Fundament, auf dem alles andere aufbaut.",
        "what": "Wlads gesamtes Leadership-System ruht auf 3 Säulen: <b>Rhetorik</b> (wie du in 30 Sekunden Vertrauen gewinnst), <b>EQ</b> (wie du erkennst, was dein Gegenüber wirklich denkt) und <b>KI-Kompetenz</b> (wie du KI als Co-Pilot statt als Krücke nutzt). Jede Lektion, jedes Feedback und jede Übung in Leader-OS zahlt auf eine dieser Säulen ein.",
        "steps": [
            "Ordne deine größte aktuelle Baustelle einer Säule zu — Kommunikation, Menschen lesen oder KI nutzen?",
            "Formuliere sie als konkrete Frage (nicht „Wie werde ich besser?“, sondern „Wie eröffne ich das Gehaltsgespräch mit Lisa?“).",
            "Hol dir Wlads Antwort — präzise, aus seiner Methodik, in Sekunden.",
        ],
        "practice": "Stell WladBot jetzt deine echte Führungsfrage. Er kennt Wlads komplette Methodik — und ab heute auch dich.",
        "cta_label": "Erste Frage an WladBot stellen",
        "cta_path": "/chat",
    },
    {
        "ep": 2, "day": 2,
        "framework": "Das SEXIER-Modell",
        "subject": "EP 02/07 · SEXIER: Wlads Formel für unwiderlegbare Argumente",
        "tagline": "6 Bausteine, mit denen jedes Argument sitzt.",
        "what": "SEXIER ist Wlads Argumentationsstruktur: <b>S</b>tatement (klare These), <b>E</b>xplanation (Begründung), e<b>X</b>ample (konkretes Beispiel), <b>I</b>mpact (Relevanz für den Zuhörer), <b>E</b>xplanation of Impact (warum dieser Impact zählt), <b>R</b>ebuttal (den größten Einwand vorwegnehmen und entkräften).",
        "steps": [
            "Starte jede wichtige Aussage mit einem klaren Statement — ein Satz, keine Einleitung.",
            "Begründe und belege mit EINEM konkreten Beispiel statt drei vagen.",
            "Nimm den stärksten Einwand deines Gegenübers vorweg — bevor er ihn ausspricht.",
        ],
        "practice": "Nimm eine 60-Sekunden Video-Mission auf. Die KI bewertet jedes SEXIER-Feld einzeln (1–10) und gibt dir zu jedem eine konkrete Wlad-Übung.",
        "cta_label": "Video-Mission starten",
        "cta_path": "/missions",
    },
    {
        "ep": 3, "day": 4,
        "framework": "Die Feedback-Formel",
        "subject": "EP 03/07 · Feedback, das ankommt: SBI + WWW",
        "tagline": "Kritik so platzieren, dass sie etwas verändert.",
        "what": "Zwei Formate, ein Prinzip: <b>SBI</b> (Situation → Behavior → Impact) beschreibt sachlich, was wann welche Wirkung hatte. <b>WWW</b> (Wahrnehmung → Wirkung → Wunsch) ergänzt den konstruktiven Ausblick. Beide trennen Beobachtung von Bewertung — der Grund, warum dein Gegenüber zuhört statt sich zu verteidigen.",
        "steps": [
            "Benenne die konkrete Situation („Im Standup am Dienstag…“) — nie „immer“ oder „nie“.",
            "Beschreibe das beobachtbare Verhalten und seine Wirkung auf dich/das Team.",
            "Schließe mit einem konkreten Wunsch — eine Verhaltensänderung, nicht drei.",
        ],
        "practice": "Simuliere dein nächstes Feedback-Gespräch in einer Simulation — mit einem KI-Gegenüber, das realistisch reagiert. Risikofrei üben, bevor es zählt.",
        "cta_label": "Feedback-Gespräch simulieren",
        "cta_path": "/simulations",
    },
    {
        "ep": 4, "day": 6,
        "framework": "Die Delegations-Matrix",
        "subject": "EP 04/07 · Die Delegations-Matrix: Was du abgibst — und was nie",
        "tagline": "Delegation ist Befähigung, keine Arbeitsverteilung.",
        "what": "Wlads Delegations-Matrix sortiert jede Aufgabe nach zwei Fragen: <b>Kann es jemand anderes zu 80% so gut?</b> und <b>Entwickelt es die Person weiter?</b> Was beides erfüllt, gibst du ab — mit Kontext (warum es wichtig ist), klarem Ergebnisbild und vereinbartem Check-in. Was nur du kannst und strategisch ist, bleibt bei dir.",
        "steps": [
            "Liste deine Top-10-Aufgaben dieser Woche und markiere, was die 80%-Regel erfüllt.",
            "Delegiere mit Kontext: Warum ist es wichtig? Wie sieht „fertig“ aus? Wann sprechen wir?",
            "Kontrolliere Ergebnisse, nicht Methoden — sonst delegierst du nur zum Schein.",
        ],
        "practice": "Beschreib WladBot deine aktuelle Aufgabenliste — er wendet die Matrix mit dir an und erstellt daraus direkt deine Aufgaben in Leader-OS.",
        "cta_label": "Delegations-Check mit WladBot",
        "cta_path": "/chat",
    },
    {
        "ep": 5, "day": 8,
        "framework": "Die DESC-Methode",
        "subject": "EP 05/07 · DESC: Schwierige Gespräche ohne Drama",
        "tagline": "Der Vier-Schritt für Konflikt, Kritik und klare Kante.",
        "what": "<b>D</b>escribe (die Situation sachlich beschreiben), <b>E</b>xpress (die Wirkung auf dich ausdrücken), <b>S</b>pecify (eine konkrete Bitte formulieren), <b>C</b>onsequences (die positive Konsequenz bei Veränderung benennen). DESC hält dich im schwierigsten Gespräch auf Kurs — auch wenn dein Gegenüber emotional wird.",
        "steps": [
            "Schreibe die 4 DESC-Sätze VOR dem Gespräch auf — je ein Satz pro Buchstabe.",
            "Bleib bei D strikt bei Fakten — jede Bewertung im ersten Satz zerstört das Gespräch.",
            "Ende mit der positiven Konsequenz, nicht mit einer Drohung.",
        ],
        "practice": "Übe das unbequemste Gespräch, das du gerade vor dir herschiebst, in einer Simulation — so oft du willst, bis DESC sitzt.",
        "cta_label": "Schwieriges Gespräch üben",
        "cta_path": "/simulations",
    },
    {
        "ep": 6, "day": 11,
        "framework": "Storytelling für Entscheider",
        "subject": "EP 06/07 · Storytelling + 20-Sekunden-Regel: Meetings gewinnen",
        "tagline": "Komplexe Ideen in 2 Minuten verkaufen.",
        "what": "Wlads Präsentations-Dramaturgie: <b>3 Akte</b> (Status quo → Konflikt/Chance → Lösung mit klarem Call-to-Action) in maximal 2 Minuten. Dazu die <b>20-Sekunden-Regel</b>: Deine ersten 20 Sekunden im Meeting entscheiden, ob du den Raum führst oder ihm folgst — deshalb eröffnest du mit dem Ergebnis, nie mit dem Weg dorthin.",
        "steps": [
            "Baue deine nächste Präsentation rückwärts: Erst der eine Satz, den alle erinnern sollen.",
            "Eröffne mit dem Ergebnis („Wir sparen 200k, wenn…“) — Details kommen danach.",
            "Ein Konflikt, eine Lösung, ein Call-to-Action. Alles andere streichst du.",
        ],
        "practice": "Nutze ein Playbook als Schritt-für-Schritt-Vorlage für deine nächste wichtige Präsentation oder dein nächstes Stakeholder-Meeting.",
        "cta_label": "Playbook öffnen",
        "cta_path": "/playbooks",
    },
    {
        "ep": 7, "day": 14,
        "framework": "Dein persönliches Operating System",
        "subject": "EP 07/07 · Dein persönliches Operating System als Leader",
        "tagline": "Aus 7 Frameworks wird ein System für jede Arbeitswoche.",
        "what": "Frameworks wirken erst, wenn sie Teil deiner Woche werden. Wlads Ansatz: ein persönliches Operating System aus drei Bausteinen — <b>Weekly Review</b> (15 Minuten pro Woche: Was lief gut? Was wiederholst du? Was änderst du?), <b>Decision Loops</b> (wiederkehrende Entscheidungen einmal sauber durchdenken und als feste Regel festhalten) und <b>wiederverwendbare Systeme</b> (Gesprächsleitfäden, Delegations-Checklisten, Meeting-Formate — einmal bauen, immer nutzen). So wird aus Lernen kontinuierliche Verbesserung.",
        "steps": [
            "Blocke 15 Minuten pro Woche für dein Weekly Review — gleicher Tag, gleiche Zeit.",
            "Halte eine wiederkehrende Entscheidung als feste Regel fest — dein erster Decision Loop.",
            "Baue ein wiederverwendbares System (z. B. deinen Feedback-Leitfaden) und nutze es im nächsten Gespräch.",
        ],
        "practice": "In Leader-OS findest du dafür alles an einem Ort: die Kurse, Live-Events mit Wlad, deinen täglichen Check-in und deinen Fortschritt. Mach Leader-OS zum Teil deiner Arbeitswoche — es wächst mit jeder Session mit.",
        "cta_label": "Mein Operating System aufbauen",
        "cta_path": "/dashboard",
    },
]


def framework_episode_email(name: str, episode: dict, app_url: str = "https://leaderos.de",
                            unsubscribe_link: str | None = None) -> tuple[str, str]:
    """Render one episode of the EP 01/07 – EP 07/07 framework series."""
    ep = episode["ep"]
    cta_url = f"{app_url.rstrip('/')}{episode['cta_path']}"
    steps_html = "".join(
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>'
        f'<td style="width:28px;vertical-align:top;"><div style="width:22px;height:22px;border-radius:50%;background:rgba(191,255,0,0.12);border:1px solid rgba(191,255,0,0.3);color:{BRAND_COLOR};font-size:11px;font-weight:900;text-align:center;line-height:22px;">{i}</div></td>'
        f'<td style="vertical-align:top;padding-left:10px;font-size:13.5px;color:rgba(255,255,255,0.85);line-height:1.55;">{step}</td>'
        f'</tr></table>'
        for i, step in enumerate(episode["steps"], start=1)
    )
    unsub = (
        f'<p style="font-size:10px;color:rgba(255,255,255,0.3);margin:22px 0 0;text-align:center;">'
        f'<a href="{unsubscribe_link}" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Framework-Serie abbestellen</a>'
        f'</p>' if unsubscribe_link else ''
    )
    body = f"""
<div style="font-size:9px;color:{BRAND_COLOR};letter-spacing:0.18em;font-weight:900;text-transform:uppercase;margin-bottom:10px;">Wlads Framework-Serie · Episode {ep} von 7</div>
<h1 style="font-size:28px;line-height:1.12;font-weight:900;margin:0 0 6px;letter-spacing:-0.025em;color:#fff;">{episode['framework']}</h1>
<p style="font-size:13px;color:rgba(255,255,255,0.55);margin:0 0 22px;">{episode['tagline']}</p>

<p style="font-size:14.5px;color:rgba(255,255,255,0.9);line-height:1.6;margin:0 0 18px;">Hallo {name},</p>

<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:18px 22px;margin-bottom:22px;">
  <div style="font-size:9px;letter-spacing:0.18em;color:rgba(255,255,255,0.45);font-weight:900;text-transform:uppercase;margin-bottom:8px;">Das Framework</div>
  <p style="font-size:14px;color:rgba(255,255,255,0.88);margin:0;line-height:1.65;">{episode['what']}</p>
</div>

<div style="margin-bottom:22px;">
  <div style="font-size:9px;letter-spacing:0.18em;color:rgba(255,255,255,0.45);font-weight:900;text-transform:uppercase;margin-bottom:12px;">So wendest du es an</div>
  {steps_html}
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
    badge = f"EP&nbsp;0{ep}&nbsp;/&nbsp;07"
    return episode["subject"], _base_layout(body, preheader=f"{episode['framework']} — {episode['tagline']}", badge=badge)

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



# ── 30-Tage-Programm: eine Mail pro Programmtag (Iter 186) ──────────────────

def challenge_day_email(
    name: str,
    day: int,
    title: str,
    desc: str,
    duration: str,
    done_text: str,
    why: str,
    cta_path: str = "/challenge",
    app_url: str = "https://leaderos.de",
    unsubscribe_link: str | None = None,
    last_call: bool = False,
) -> tuple[str, str]:
    """Die Aufgabe des Tages — konkret, mit „Erledigt ist, wenn …", ohne Werbeblock.

    Kundenmeldung: Tag 1 hatte eine Mail, Tag 2 keine. Jetzt kommt genau eine
    Mail pro Programmtag, nur wenn die Aufgabe noch offen ist.
    """
    cta_url = f"{app_url.rstrip('/')}{cta_path}"
    unsub = (
        f'<p style="font-size:10px;color:rgba(255,255,255,0.3);margin:22px 0 0;text-align:center;">'
        f'<a href="{unsubscribe_link}" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Tages-Mails abbestellen</a>'
        f'</p>' if unsubscribe_link else ''
    )
    nudge = (
        '<p style="font-size:13px;color:rgba(255,255,255,0.55);margin:0 0 18px;">'
        'Das ist meine letzte Erinnerung — danach ist hier Ruhe. Deine Aufgabe bleibt in der App offen '
        'und du kannst sie jederzeit nachholen.</p>' if last_call else ''
    )
    body = f"""
<div style="font-size:9px;color:{BRAND_COLOR};letter-spacing:0.18em;font-weight:900;text-transform:uppercase;margin-bottom:10px;">30-Tage-Programm · Tag {day} von 30</div>
<h1 style="font-size:26px;line-height:1.15;font-weight:900;margin:0 0 6px;letter-spacing:-0.025em;color:#fff;">{title}</h1>
<p style="font-size:13px;color:rgba(255,255,255,0.55);margin:0 0 22px;">{duration} · heute dran</p>

<p style="font-size:14.5px;color:rgba(255,255,255,0.9);line-height:1.6;margin:0 0 18px;">Hallo {name},</p>
{nudge}
<p style="font-size:14.5px;color:rgba(255,255,255,0.88);line-height:1.65;margin:0 0 18px;">{desc}</p>

<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:18px 22px;margin-bottom:18px;">
  <div style="font-size:9px;letter-spacing:0.18em;color:rgba(255,255,255,0.45);font-weight:900;text-transform:uppercase;margin-bottom:8px;">Warum das heute dran ist</div>
  <p style="font-size:14px;color:rgba(255,255,255,0.88);margin:0 0 14px;line-height:1.65;">{why}</p>
  <div style="font-size:9px;letter-spacing:0.18em;color:rgba(255,255,255,0.45);font-weight:900;text-transform:uppercase;margin-bottom:8px;">Erledigt ist, wenn</div>
  <p style="font-size:14px;color:rgba(255,255,255,0.88);margin:0;line-height:1.65;">{done_text}</p>
</div>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 6px;"><tr>
  <td style="background:{BRAND_COLOR};border-radius:12px;">
    <a href="{cta_url}" style="display:inline-block;padding:14px 26px;font-size:14px;font-weight:900;color:#0A0A0A;text-decoration:none;">Aufgabe öffnen &rarr;</a>
  </td>
</tr></table>
{unsub}
"""
    subject = f"Tag {day}: {title}"
    return subject, _base_layout(body, preheader=f"{duration} · {done_text}", badge=f"TAG&nbsp;{day}&nbsp;/&nbsp;30")


# ════════════════════════════════════════════════════════════════════════════
# Marketing-/Funnel-Mails aus mvpcode (Merge emergent-update ⇄ mvpcode).
# Nutzen _base_layout(..., bib_code=…) — siehe Mapping oben.
# ════════════════════════════════════════════════════════════════════════════

# ── Free-Video Funnel: Day 1-4 Daily Drip (Lead-Magnet) ──────────────────────
# One video per day for 4 days after signup. Pulls the new user back into the
# app (/free-videos) where all 4 are unlocked. Source of truth for the video
# metadata is backend/services_free_videos.py — the drip only formats it.

def free_video_drip_email(
    name: str,
    video: dict,
    total: int = 4,
    app_url: str = "https://leaderos.de",
    unsubscribe_link: str | None = None,
    deeplink: str | None = None,
) -> tuple[str, str]:
    """Daily drip email for the 4 free videos (Day 1..4).

    Default deeplink is the in-app player /free-videos (registered users).
    For email-only leads pass the PUBLIC funnel URL instead
    (services_free_videos.PUBLIC_FUNNEL_URL) — they have no account yet and
    must not hit a login wall. Subject lines are curiosity-first, not
    "watch this video". Open-rate optimized.
    """
    day = video["day"]
    title = video["title"]
    subtitle = video["subtitle"]
    hook = video["hook"]
    takeaway = video["takeaway"]
    tag = video.get("duration", f"Video {day}")
    deeplink = deeplink or f"{app_url.rstrip('/')}/free-videos?v={video['id']}"
    is_final = day >= total

    unsub = (
        f'<p style="font-size:10px;color:rgba(255,255,255,0.3);margin:20px 0 0;text-align:center;">'
        f'<a href="{unsubscribe_link}" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Diese Video-Serie abbestellen</a>'
        f'</p>' if unsubscribe_link else ''
    )

    # Curiosity-driven subject per day.
    subjects = {
        1: f"{name}, dein Video 1 ist freigeschaltet 🎬",
        2: f"Tag 2: der Teil, den fast keiner kennt",
        3: f"Tag 3: hier wird aus Wissen ein System",
        4: f"Tag 4 — das Finale (und dein nächster Schritt)",
    }
    subject = subjects.get(day, f"Tag {day}: {title}")

    cta_label = "▶︎ Zum Finale" if is_final else f"▶︎ Video {day} ansehen"
    final_note = (
        '<p style="font-size:12.5px;color:rgba(255,255,255,0.6);line-height:1.6;margin:18px 0 0;text-align:center;">'
        'Alle 4 Videos bleiben in deinem Zugang gespeichert. Wenn du bereit bist, '
        'startest du deine <strong style="color:#fff;">14 Tage kostenlos</strong>.'
        '</p>' if is_final else
        '<p style="font-size:11px;color:rgba(255,255,255,0.4);margin:24px 0 0;text-align:center;line-height:1.6;">'
        f'Morgen kommt Video {day + 1} von {total}. Alle bereits freigeschalteten Videos findest du jederzeit in deinem Zugang.'
        '</p>'
    )

    body = f"""
<div style="font-size:9px;color:{BRAND_COLOR};letter-spacing:0.18em;font-weight:900;text-transform:uppercase;margin-bottom:8px;">Gratis-Serie · Tag {day} / {total}</div>
<h1 style="font-size:30px;line-height:1.1;font-weight:900;margin:0 0 8px;letter-spacing:-0.025em;">{title}</h1>
<p style="font-size:13px;color:rgba(255,255,255,0.55);margin:0 0 24px;">{subtitle} · {tag}</p>

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
  <a href="{deeplink}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:15px 36px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:-0.01em;">{cta_label}</a>
</div>

{final_note}
{unsub}
"""
    return subject, _base_layout(body, preheader=f"Tag {day}/{total}: {subtitle}")


# ── Webinar Funnel: confirmation is `event_registration_email` /
#    `event_reminder_email` above (a synthetic event dict works for both).
#    This is the day-after follow-up for registrants who haven't started
#    the trial yet — the explicit bridge from "attended/registered" to
#    leaderos.de signup. ──────────────────────────────────────────────

def webinar_followup_email(
    name: str,
    app_url: str = "https://leaderos.de",
    unsubscribe_link: str | None = None,
) -> tuple[str, str]:
    """Day-after nudge: turn a webinar registrant into a trial signup."""
    signup_url = f"{app_url.rstrip('/')}/signup?trial=14&utm_source=webinar&utm_medium=email&utm_campaign=webinar-2026-10-29"
    unsub = (
        f'<p style="font-size:10px;color:rgba(255,255,255,0.3);margin:20px 0 0;text-align:center;">'
        f'<a href="{unsubscribe_link}" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Keine weiteren Mails zu diesem Webinar</a>'
        f'</p>' if unsubscribe_link else ''
    )
    subject = f"{name}, und jetzt? Dein System statt nur Notizen."
    body = f"""
<div style="font-size:9px;color:{BRAND_COLOR};letter-spacing:0.18em;font-weight:900;text-transform:uppercase;margin-bottom:8px;">Nach dem Webinar</div>
<h1 style="font-size:28px;line-height:1.15;font-weight:900;margin:0 0 8px;letter-spacing:-0.025em;">Notizen verblassen. Ein System nicht.</h1>

<p style="font-size:15px;color:rgba(255,255,255,0.92);line-height:1.55;margin:0 0 18px;">
Hallo {name},
</p>
<p style="font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;margin:0 0 18px;">
danke fürs Dabeisein. Das Webinar war der Impuls — die eigentliche Arbeit passiert nicht an einem Vormittag,
sondern in den 30 Tagen danach. Genau dafür ist LeaderOS gebaut: WladBot als 24/7-Coach, tägliche
Mikro-Drills statt Einmal-Event, dieselbe Methodik, die du gerade live gesehen hast.
</p>

<div style="background:rgba(191,255,0,0.05);border:1px solid rgba(191,255,0,0.18);border-radius:14px;padding:18px 22px;margin:22px 0;">
  <div style="font-size:9px;letter-spacing:0.18em;color:{BRAND_COLOR};font-weight:900;text-transform:uppercase;margin-bottom:6px;">14 Tage kostenlos</div>
  <p style="font-size:14px;color:#fff;margin:0;line-height:1.55;">Keine Kreditkarte. Voller Zugang. Jederzeit kündbar.</p>
</div>

<div style="text-align:center;padding:14px 0 4px;">
  <a href="{signup_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:15px 36px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:-0.01em;">Jetzt 14 Tage kostenlos starten</a>
</div>
{unsub}
"""
    return subject, _base_layout(body, preheader="Der Impuls war das Webinar. Das System ist LeaderOS.")


# ── Launch Announcement (one-shot) ───────────────────────────────

def launch_announcement_email(
    name: str,
    quiz_url: str = "https://leadercheck.de",
    app_url: str = "https://leaderos.de",
) -> tuple[str, str]:
    """One-shot announcement to Wlad's existing audience that leader-os.de
    is live and WladBot is open for testing.

    Voice: direct, premium, no fluff — same Nike-DNA template family as the
    rest of the lifecycle emails. Funnel: scan QR (or click) → leadercheck.de
    → 5-min diagnose → leaderos.de app afterward.
    """
    subject = f"Du wolltest nicht warten, {name}."
    body = f"""
<div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin:12px 0 14px;">▸ LIVE · LEADER · OS · ISSUE 0001</div>

<div style="font-weight:900;font-style:italic;font-size:44px;line-height:0.94;letter-spacing:-0.035em;color:#ffffff;margin:0 0 4px;">Werde</div>
<div style="font-weight:900;font-style:italic;font-size:44px;line-height:0.94;letter-spacing:-0.035em;color:#ffffff;margin:0 0 28px;">KI-nativ<span style="color:{BRAND_COLOR};">.</span></div>

<p style="font-size:15px;color:rgba(255,255,255,0.82);line-height:1.6;margin:0 0 18px;">
Servus {name},
</p>

<p style="font-size:14.5px;color:rgba(255,255,255,0.78);line-height:1.6;margin:0 0 18px;">
fünfzehn Jahre Methodik, zweitausendzweihundert Lektionen, drei SPIEGEL-Bestseller. Jetzt erstmals zusammen in einem System — und in deiner Tasche, vierundzwanzig Stunden täglich.
</p>

<p style="font-size:14.5px;color:rgba(255,255,255,0.78);line-height:1.6;margin:0 0 28px;">
<strong style="color:#ffffff;">WladBot ist live.</strong> Trainiert auf meiner Methodik, beantwortet dir um zweiundzwanzig Uhr siebenundvierzig was du sonst mich gefragt hättest. In Wlads Ton. Mit deinem Kontext.
</p>

<!-- Three concrete things -->
<div style="border-top:2px solid rgba(255,255,255,0.15);border-bottom:2px solid rgba(255,255,255,0.15);padding:20px 0;margin-bottom:28px;">
  <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.22em;color:rgba(255,255,255,0.45);font-weight:700;text-transform:uppercase;margin-bottom:16px;">▸ WAS DU SOFORT KANNST</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:7px 0;vertical-align:top;width:32px;">
      <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§01</span>
    </td><td style="padding:7px 0;font-size:14px;color:#ffffff;font-weight:700;line-height:1.4;">
      Fünf-Minuten-Diagnose <span style="color:rgba(255,255,255,0.55);font-weight:400;font-size:13px;">· kostenlos · dein BIB-Score sofort</span>
    </td></tr>
    <tr><td style="padding:7px 0;vertical-align:top;">
      <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§02</span>
    </td><td style="padding:7px 0;font-size:14px;color:#ffffff;font-weight:700;line-height:1.4;">
      WladBot fragen was du sonst mich fragen würdest
    </td></tr>
    <tr><td style="padding:7px 0;vertical-align:top;">
      <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§03</span>
    </td><td style="padding:7px 0;font-size:14px;color:#ffffff;font-weight:700;line-height:1.4;">
      Erste Empfehlung — wo du heute stehst, wo dein nächster Schritt ist
    </td></tr>
  </table>
</div>

<!-- Primary CTA -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>
  <td style="background:{BRAND_COLOR};padding:0;">
    <a href="{quiz_url}" style="display:inline-block;padding:18px 32px;color:{BRAND_DARK};text-decoration:none;font-weight:900;font-size:13.5px;letter-spacing:0.04em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">+&nbsp;&nbsp;Diagnose starten · 5 Min</a>
  </td>
</tr></table>

<p style="font-size:13px;color:rgba(255,255,255,0.62);line-height:1.6;margin:0 0 6px;">
Oder direkt im Browser: <a href="{quiz_url}" style="color:{BRAND_COLOR};font-weight:700;text-decoration:none;">leadercheck.de</a>
</p>

<p style="font-size:12.5px;color:rgba(255,255,255,0.52);line-height:1.55;margin:0 0 28px;">
Keine Email-Pflicht. Kein Abo. Kein versteckter Upsell. Bei der Diagnose siehst du sofort wo du stehst — der Rest ist deine Entscheidung.
</p>

<!-- Wlad signature -->
<div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.15);">
  <p style="font-family:'Outfit',sans-serif;font-weight:900;font-style:italic;font-size:24px;letter-spacing:-0.02em;color:#ffffff;margin:0 0 4px;">Wlad<span style="color:{BRAND_COLOR};">.</span></p>
  <p style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.22em;color:rgba(255,255,255,0.45);font-weight:700;text-transform:uppercase;margin:0;">WLAD JACHTCHENKO · KÖLN · 2026</p>
</div>

<p style="font-size:11.5px;color:rgba(255,255,255,0.42);margin:24px 0 0;line-height:1.55;text-align:center;">
P.S. — Die Diagnose dauert wirklich nur fünf Minuten. Drei Dimensionen: KI, Rhetorik, EQ. Sofort dein Score. <a href="{quiz_url}" style="color:rgba(191,255,0,0.85);font-weight:700;text-decoration:none;">leadercheck.de</a>
</p>
"""
    return subject, _base_layout(
        body,
        preheader=f"WladBot ist live, {name}. Fünf-Minuten-Diagnose. Sofort dein Score.",
        bib_code="LIVE",
    )


# ── Lead-Nurture Journey: 7 Mails über 12 Tage (Landing-Leads / Newsletter) ──
# For NEW LEADS (email captures without an account): education-first sequence
# converting toward webinar → trial → Beratung. Day offsets 0/2/4/6/8/10/12,
# driven by /api/cron/lead-nurture (routes/lifecycle_emails.py). Step 1 is
# also sent instantly at capture time (routes/leader_check.py).
#
# Facts policy (docs/gtm/WLAD_CANON.md): only verified numbers — the Day-6 case
# data is the anonymized 240-participant cohort already published in the
# Journal article "Die KI-Challenge: was 30 Tage strukturierte Anwendung
# verändern" — NO invented people, NO invented testimonials.

LEAD_NURTURE_TOTAL_STEPS = 7


def lead_nurture_email(step: int, name: str, unsubscribe_link: str | None = None) -> tuple[str, str]:
    """Return (subject, html) for lead-nurture step 1..7.

    One CTA per mail, education > sales, every mail delivers standalone value.
    Raises ValueError for an unknown step so the cron fails loudly instead of
    silently sending nothing.
    """
    quiz_url = "https://leadercheck.de"
    journal_url = "https://leader-os.de/journal"
    case_article_url = "https://leader-os.de/journal/der-ki-sprint-was-dreissig-tage-strukturierte-anwendung-veraendern"
    webinar_url = "https://leader-os.de/webinar"
    trial_url = "https://leaderos.de/signup?trial=14"
    beratung_url = "https://www.leader-os.de/#beratung"

    unsub = (
        f'<p style="font-size:10px;color:rgba(255,255,255,0.3);margin:24px 0 0;text-align:center;">'
        f'<a href="{unsubscribe_link}" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Keine weiteren Mails dieser Serie</a>'
        f'</p>' if unsubscribe_link else ''
    )

    def _cta(url: str, label: str) -> str:
        return f"""
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 8px;"><tr>
  <td style="background:{BRAND_COLOR};padding:0;">
    <a href="{url}" style="display:inline-block;padding:16px 28px;color:{BRAND_DARK};text-decoration:none;font-weight:900;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">+&nbsp;&nbsp;{label}</a>
  </td>
</tr></table>"""

    def _kicker(text: str) -> str:
        return (
            f'<div style="font-family:\'SF Mono\',Menlo,Consolas,monospace;font-size:10px;'
            f'letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;'
            f'margin:12px 0 14px;">▸ {text} · {step:02d} / {LEAD_NURTURE_TOTAL_STEPS:02d}</div>'
        )

    def _headline(text: str) -> str:
        return (
            f'<div style="font-weight:900;font-style:italic;font-size:32px;line-height:1.02;'
            f'letter-spacing:-0.03em;color:#ffffff;margin:0 0 24px;">{text}'
            f'<span style="color:{BRAND_COLOR};">.</span></div>'
        )

    p = 'style="font-size:14.5px;color:rgba(255,255,255,0.80);line-height:1.65;margin:0 0 18px;"'
    box_open = (
        '<div style="border-top:2px solid rgba(255,255,255,0.15);'
        'border-bottom:2px solid rgba(255,255,255,0.15);padding:18px 0;margin:0 0 24px;">'
    )
    mono_label = (
        f'style="font-family:\'SF Mono\',Menlo,Consolas,monospace;font-size:9px;'
        f'letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:12px;"'
    )

    if step == 1:
        subject = f"Willkommen, {name} — dein erstes Werkzeug ist drin"
        preheader = "Was dich erwartet + die B-W-W-Feedbackformel in 3 Sätzen."
        body = f"""
{_kicker("NURTURE")}
{_headline("Schön, dass du da bist")}
<p {p}>Hallo {name},</p>
<p {p}>in den nächsten zwei Wochen bekommst du von uns eine Handvoll kurzer Mails: Führung, Kommunikation, KI — immer mit einem Werkzeug, das du am selben Tag einsetzen kannst. Kein Spam, kein Dauerfeuer. Abmelden geht jederzeit mit einem Klick.</p>
<p {p}>Das erste Werkzeug bekommst du sofort. Wlads Feedbackformel — <b style="color:#fff;">B-W-W: Beobachtung, Wirkung, Wunsch</b> — in drei Sätzen:</p>
{box_open}
  <div {mono_label}>▸ B-W-W · FEEDBACK IN 3 SÄTZEN</div>
  <p style="font-size:13.5px;color:#ffffff;line-height:1.6;margin:0 0 10px;"><b style="color:{BRAND_COLOR};">1 · Beobachtung:</b> „Mir ist aufgefallen, dass du im Meeting dreimal unterbrochen hast.“</p>
  <p style="font-size:13.5px;color:#ffffff;line-height:1.6;margin:0 0 10px;"><b style="color:{BRAND_COLOR};">2 · Wirkung:</b> „Das wirkt auf das Team, als wäre ihre Sicht nicht relevant.“</p>
  <p style="font-size:13.5px;color:#ffffff;line-height:1.6;margin:0;"><b style="color:{BRAND_COLOR};">3 · Wunsch:</b> „Ich wünsche mir, dass du erst ausreden lässt und dann einordnest.“</p>
</div>
<p {p}>Nie „Du bist …“, immer „Ich habe beobachtet, dass …“. Fakten statt Urteil — deshalb kommt die Botschaft an, statt Abwehr auszulösen. Probier die Formel heute in einem echten Gespräch.</p>
<p {p}>Wenn du wissen willst, wo du als Führungskraft gerade stehst: Die kostenlose 5-Minuten-Diagnose zeigt es dir sofort.</p>
{_cta(quiz_url, "Diagnose starten · 5 Min")}
{unsub}
"""

    elif step == 2:
        subject = "Führung ist Fähigkeit. Fähigkeit ist trainierbar."
        preheader = "Warum Wissen allein dein Verhalten nicht ändert — und was stattdessen wirkt."
        body = f"""
{_kicker("MINDSET")}
{_headline("Wissen ist nicht Verhalten")}
<p {p}>Hallo {name},</p>
<p {p}>die meisten Führungskräfte wissen längst, wie gutes Feedback geht. Sie haben Bücher gelesen, Seminare besucht. Und trotzdem läuft das nächste Kritikgespräch wie immer. Warum?</p>
<p {p}><b style="color:#fff;">Weil Wissen und Verhalten zwei verschiedene Dinge sind.</b> Niemand lernt Klavier, indem er ein Buch über Klavier liest. Verhalten ändert sich durch Wiederholung unter realen Bedingungen — nicht durch Konsum.</p>
{box_open}
  <div {mono_label}>▸ DIE KERN-THESE</div>
  <p style="font-size:16px;color:#ffffff;font-weight:800;line-height:1.5;margin:0;">Führung ist keine Persönlichkeitsfrage. Führung ist Fähigkeit — und Fähigkeit ist trainierbar<span style="color:{BRAND_COLOR};">.</span></p>
</div>
<p {p}>Wlad Jachtchenko trainiert seit 2007 Führungskräfte — über 400.000 Klienten, 3× SPIEGEL-Bestseller-Autor. Sein Fazit aus all den Jahren: Nicht Talent trennt gute von schwachen Führungskräften, sondern Trainingsstruktur.</p>
<p {p}><b style="color:#fff;">Dein Übungsimpuls für diese Woche:</b> Wähl EINE wiederkehrende Situation (z.B. dein nächstes 1:1) und trainiere dort EIN Verhalten bewusst — etwa die B-W-W-Formel aus der letzten Mail. Ein Rep pro Woche schlägt zehn gelesene Bücher.</p>
<p {p}>Mehr davon — kostenlos, im Journal:</p>
{_cta(journal_url, "Zum Leadership-Journal")}
{unsub}
"""

    elif step == 3:
        subject = "Was ein KI-Betriebssystem für Führung wirklich ist"
        preheader = "Kein weiteres Tool. Die 3 Use Cases, mit denen Führungskräfte Stunden pro Woche sparen."
        body = f"""
{_kicker("AI-OS")}
{_headline("KI führt nicht für dich")}
<p {p}>Hallo {name},</p>
<p {p}>ehrlich vorweg: KI wird deine Mitarbeitergespräche nicht für dich führen. Wer dir das verkauft, verkauft dir Unsinn.</p>
<p {p}>Was ein <b style="color:#fff;">KI-Betriebssystem für Führung</b> tatsächlich tut: Es nimmt dir die unstrukturierte Denkarbeit VOR und NACH den Momenten ab, in denen es auf dich ankommt. Drei Use Cases, die sich in der Praxis bewährt haben:</p>
{box_open}
  <div {mono_label}>▸ DIE 3 ECHTEN USE CASES</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:7px 0;vertical-align:top;width:36px;"><span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§01</span></td>
    <td style="padding:7px 0;font-size:14px;color:#ffffff;line-height:1.5;"><b>Gesprächsvorbereitung</b> — das schwierige Gespräch vorher durchspielen: Einwände, Formulierungen, Eskalationspfade. Du gehst rein und bist schon einmal durch.</td></tr>
    <tr><td style="padding:7px 0;vertical-align:top;"><span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§02</span></td>
    <td style="padding:7px 0;font-size:14px;color:#ffffff;line-height:1.5;"><b>Firmenrede-Strukturierung</b> — von der leeren Seite zur klaren Dramaturgie in Minuten statt Abenden. Die Rede bleibt deine; die Struktur kommt vom System.</td></tr>
    <tr><td style="padding:7px 0;vertical-align:top;"><span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§03</span></td>
    <td style="padding:7px 0;font-size:14px;color:#ffffff;line-height:1.5;"><b>Freitag-Reflexion</b> — 15 Minuten strukturierte Wochenauswertung: Was lief, was hakte, was ändere ich Montag. Das Ritual, das aus Wochen Lernschleifen macht.</td></tr>
  </table>
</div>
<p {p}>Der ehrliche Effekt ist nicht „10× Produktivität“, sondern zurückgewonnene Stunden: weniger unvorbereitete Gespräche, weniger Leerlauf-Meetings, mehr Deep Work. Die konkreten Zahlen aus 240 vermessenen Teilnehmern bekommst du übermorgen.</p>
<p {p}>Bis dahin: Wie so ein System im Alltag aussieht, liest du im Journal.</p>
{_cta(journal_url, "Zum Journal")}
{unsub}
"""

    elif step == 4:
        subject = "90 Sekunden → 22 Sekunden: Daten aus 240 Teilnehmern"
        preheader = "Anonymisierte Vorher-Nachher-Daten der 30-Tage-Challenge — inklusive dem, was sich NICHT ändert."
        body = f"""
{_kicker("EVIDENZ")}
{_headline("Was 30 Tage messbar verändern")}
<p {p}>Hallo {name},</p>
<p {p}>keine Erfolgsgeschichte mit Namen und Foto — sondern anonymisierte Kohorten-Daten. Wir haben über <b style="color:#fff;">240 Teilnehmer der 30-Tage-Challenge</b> (2025–2026) vorher und nachher vermessen. Das zeigt sich:</p>
{box_open}
  <div {mono_label}>▸ KOHORTE · N=240 · MEDIAN · TAG 1 VS. TAG 30</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.10);font-size:13px;color:rgba(255,255,255,0.75);line-height:1.5;">Reflex-Zeit für B-W-W-Feedback-Eröffnungen</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.10);text-align:right;font-size:15px;color:{BRAND_COLOR};font-weight:900;white-space:nowrap;">90&nbsp;→&nbsp;22&nbsp;Sek</td>
    </tr>
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.10);font-size:13px;color:rgba(255,255,255,0.75);line-height:1.5;">Zurückgewonnene Deep-Work-Stunden pro Woche</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.10);text-align:right;font-size:15px;color:{BRAND_COLOR};font-weight:900;white-space:nowrap;">+4,2&nbsp;h</td>
    </tr>
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.10);font-size:13px;color:rgba(255,255,255,0.75);line-height:1.5;">1:1-Gespräche ohne konkrete nächste Aktion („Stale-Quote“)</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.10);text-align:right;font-size:15px;color:{BRAND_COLOR};font-weight:900;white-space:nowrap;">38&nbsp;→&nbsp;14&nbsp;%</td>
    </tr>
    <tr>
      <td style="padding:10px 0;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.5;">Wiederverwendete Prompts nach 30 Tagen</td>
      <td style="padding:10px 0;text-align:right;font-size:15px;color:{BRAND_COLOR};font-weight:900;white-space:nowrap;">14</td>
    </tr>
  </table>
</div>
<p {p}><b style="color:#fff;">Und genauso wichtig — was sich in 30 Tagen NICHT messbar verändert:</b> Identität als Führungskraft, Quartalsumsatz, Team-Glück. Wer das Falsche misst, ist enttäuscht. Wer das Richtige misst, sieht den Effekt klar.</p>
<p {p}>Die komplette Auswertung — inklusive der Bandbreiten und drei anonymisierter Beispiel-Profile — steht öffentlich im Journal:</p>
{_cta(case_article_url, "Ganze Auswertung lesen")}
{unsub}
"""

    elif step == 5:
        subject = f"Live mit Wlad: dein Platz im Webinar, {name}"
        preheader = "Live-Webinar mit Wlad Jachtchenko — Fragen live, Methodik live, kein Replay-Konsum."
        body = f"""
{_kicker("WEBINAR")}
{_headline("Live schlägt Replay")}
<p {p}>Hallo {name},</p>
<p {p}>fünf Mails Theorie und Daten — jetzt der Schritt, bei dem du Wlad live erlebst: das <b style="color:#fff;">kostenlose Live-Webinar mit Wlad Jachtchenko</b>.</p>
{box_open}
  <div {mono_label}>▸ WAS DICH ERWARTET</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:6px 0;vertical-align:top;width:36px;"><span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§01</span></td>
    <td style="padding:6px 0;font-size:14px;color:#ffffff;line-height:1.5;">Die Methodik live demonstriert — Rhetorik, EQ und KI-Einsatz an echten Führungssituationen, nicht an Folien.</td></tr>
    <tr><td style="padding:6px 0;vertical-align:top;"><span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§02</span></td>
    <td style="padding:6px 0;font-size:14px;color:#ffffff;line-height:1.5;">Deine Fragen, live beantwortet — bring deine konkrete Führungs-Situation mit.</td></tr>
    <tr><td style="padding:6px 0;vertical-align:top;"><span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;color:{BRAND_COLOR};font-weight:800;letter-spacing:0.08em;">§03</span></td>
    <td style="padding:6px 0;font-size:14px;color:#ffffff;line-height:1.5;">Der Blick ins System — wie aus einem Impuls ein 30-Tage-Trainingsplan wird.</td></tr>
  </table>
</div>
<p {p}><b style="color:#fff;">Warum live?</b> Weil Aufzeichnungen konsumiert und vergessen werden. Live stellst du DEINE Frage, bekommst DEINE Antwort — und ein fester Termin im Kalender ist der Unterschied zwischen „schau ich irgendwann“ und „mach ich“.</p>
{_cta(webinar_url, "Platz im Webinar sichern")}
{unsub}
"""

    elif step == 6:
        subject = "Ein Blick in LeaderOS — 14 Tage, kostenlos"
        preheader = "WladBot 24/7, Simulationen, 30-Tage-Challenge, 11 Frameworks — teste alles 14 Tage."
        body = f"""
{_kicker("LEADER·OS")}
{_headline("Das System von innen")}
<p {p}>Hallo {name},</p>
<p {p}>du kennst jetzt die Methodik und die Daten. Zeit, dir zu zeigen, was drin ist, wenn du LeaderOS öffnest:</p>
{box_open}
  <div {mono_label}>▸ SPEC · WAS DRIN IST</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.12);">
    <tr>
      <td style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.10);border-right:1px solid rgba(255,255,255,0.10);width:50%;vertical-align:top;">
        <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.18em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">24/7</div>
        <div style="font-size:13px;color:#ffffff;font-weight:700;margin-bottom:4px;">WladBot</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.65);line-height:1.45;">Dein KI-Coach auf Wlads Methodik — antwortet auch um 22:47.</div>
      </td>
      <td style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.10);width:50%;vertical-align:top;">
        <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.18em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">TRAINING</div>
        <div style="font-size:13px;color:#ffffff;font-weight:700;margin-bottom:4px;">Simulationen</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.65);line-height:1.45;">Schwierige Gespräche im geschützten Raum üben — vor dem Ernstfall.</div>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 18px;border-right:1px solid rgba(255,255,255,0.10);vertical-align:top;">
        <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.18em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">30 TAGE</div>
        <div style="font-size:13px;color:#ffffff;font-weight:700;margin-bottom:4px;">30-Tage-Challenge</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.65);line-height:1.45;">Tägliche Mikro-Drills statt Einmal-Seminar — die Struktur hinter den Kohorten-Daten.</div>
      </td>
      <td style="padding:14px 18px;vertical-align:top;">
        <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.18em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">11×</div>
        <div style="font-size:13px;color:#ffffff;font-weight:700;margin-bottom:4px;">11 Frameworks</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.65);line-height:1.45;">Von B-W-W bis SEXIER — Wlads Werkzeuge, einsatzbereit strukturiert.</div>
      </td>
    </tr>
  </table>
</div>
<p {p}>Du testest alles <b style="color:#fff;">14 Tage kostenlos</b> — und entscheidest danach. Trustpilot: 4,9/5 aus 388 Bewertungen.</p>
{_cta(trial_url, "14 Tage kostenlos testen")}
{unsub}
"""

    elif step == 7:
        subject = f"Der persönliche Weg, {name}"
        preheader = "Wenn du es nicht allein herausfinden willst: 30 Minuten mit Wlads Team."
        body = f"""
{_kicker("BERATUNG")}
{_headline("Sprich mit einem Menschen")}
<p {p}>Hallo {name},</p>
<p {p}>zwölf Tage, sieben Mails: Feedbackformel, Trainingslogik, KI-Use-Cases, Kohorten-Daten, Webinar, ein Blick ins System. Du hast jetzt mehr Substanz als die meisten nach einem Zwei-Tage-Seminar.</p>
<p {p}>Ein Schritt fehlt noch — und der ist bewusst persönlich: <b style="color:#fff;">ein Gespräch, 1:1 mit Wlads Team.</b> Kein Verkaufs-Skript, sondern eine Standortbestimmung: Wo stehst du, was ist dein größter Hebel, und welcher Weg passt — die 30-Tage-Challenge, LeaderOS oder ein Coaching-Programm.</p>
{box_open}
  <div {mono_label}>▸ WARUM MIT WLADS TEAM</div>
  <p style="font-size:13.5px;color:#ffffff;line-height:1.65;margin:0;">Hinter dem System stehen fünfzehn Jahre Trainingspraxis: über 400.000 Klienten, 13 Bücher, 3× SPIEGEL-Bestseller. Das Team, das täglich mit diesen Methoden arbeitet, hört sich deine Situation an und sagt dir ehrlich, was für dich sinnvoll ist — auch wenn die Antwort „noch nichts kaufen“ lautet.</p>
</div>
<p {p}>Wenn du den nächsten Schritt nicht allein am Bildschirm entscheiden willst: Such dir einen Termin aus.</p>
{_cta(beratung_url, "Beratungsgespräch buchen")}
{unsub}
"""

    else:
        raise ValueError(f"lead_nurture_email: unknown step {step}")

    return subject, _base_layout(body, preheader=preheader, bib_code=f"N-{step:02d}")


# ── License-Activation Journey: 5 Mails über 7 Tage (/frameworks-Leads) ─────
# For leads who "reserved" a personal access code on /frameworks (Google-Ads
# landing for framework-searches, see data/googleAdsAssets.js). Distinct from
# LEAD_NURTURE above: this track opens with the reserved code, not a quiz
# result, and — if the lead also opted into the webinar — reinforces that
# bonus (instant 4-video unlock) instead of pushing a generic Beratung call.
#
# Day offsets 0/1/3/5/7, driven by /api/cron/license-nurture
# (routes/lifecycle_emails.py). Step 1 also fires instantly at capture time
# (routes/license_activation.py). Stops the moment the email shows up in
# db.users — see cron_license_nurture — same "converted" gate as the lead
# nurture journey.
#
# Facts policy (docs/gtm/WLAD_CANON.md): 400.000+ Klienten seit 2007,
# 3× SPIEGEL-Bestseller, Trustpilot 4,9/5 (388) — nothing else. No fake
# scarcity: the code has no invented expiry, only the webinar date (if still
# upcoming) is a real deadline.

LICENSE_NURTURE_TOTAL_STEPS = 5

# Framework-Zitate aus FrameworksPage.js (SLIDES) — wortgleich, damit die Mail
# hält, was die Landingpage über sich selbst behauptet.
_LICENSE_FRAMEWORKS = {
    2: ("SEXIER-Modell", "Aus „Weiße Rhetorik“",
        "Statement · Explanation · eXample · Impact · Explanation of Impact · Rebuttal. Sechs Schritte, jeder Pflicht für ein vollständiges Argument — inklusive der Widerlegung der Gegenargumente, bevor jemand sie ausspricht."),
    3: ("Feedbackformel", "Wlads Kern-Framework",
        "Beobachtung + Wirkung + Wunsch. Nie „Du bist…“, immer „Ich habe beobachtet, dass…“. Das Skript für jedes schwierige Gespräch — drei Sätze, mehr braucht es nicht."),
    4: ("10 Stufen des Zuhörens", "Aus „Weiße Rhetorik“",
        "Von Stufe 1, nicht zuhören, bis Stufe 10, Stille als Zuhören. 80 % aller Führungskräfte bleiben auf Stufe 2 stehen: auf die eigene Antwort warten."),
}


def license_activation_email(
    step: int,
    name: str,
    reserved_code: str,
    unsubscribe_link: str | None = None,
    webinar_registered: bool = False,
    webinar_upcoming: bool = True,
    app_url: str = "https://leaderos.de",
) -> tuple[str, str]:
    """Return (subject, html) for license-activation step 1..5.

    `webinar_upcoming` lets the cron turn off webinar-specific paragraphs
    once the 29.10. date has passed, so a months-later send never references
    a dead event — the account-activation CTA carries the mail on its own.
    """
    activate_url = f"{app_url.rstrip('/')}/signup?trial=14&utm_source=frameworks&utm_medium=email&utm_campaign=license-activation&code={reserved_code}"
    webinar_url = "https://leader-os.de/webinar"

    unsub = (
        f'<p style="font-size:10px;color:rgba(255,255,255,0.3);margin:24px 0 0;text-align:center;">'
        f'<a href="{unsubscribe_link}" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Keine weiteren Mails dieser Serie</a>'
        f'</p>' if unsubscribe_link else ''
    )

    def _cta(url: str, label: str) -> str:
        return f"""
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 8px;"><tr>
  <td style="background:{BRAND_COLOR};padding:0;">
    <a href="{url}" style="display:inline-block;padding:16px 28px;color:{BRAND_DARK};text-decoration:none;font-weight:900;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">+&nbsp;&nbsp;{label}</a>
  </td>
</tr></table>"""

    def _kicker(text: str) -> str:
        return (
            f'<div style="font-family:\'SF Mono\',Menlo,Consolas,monospace;font-size:10px;'
            f'letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;'
            f'margin:12px 0 14px;">▸ {text} · {step:02d} / {LICENSE_NURTURE_TOTAL_STEPS:02d}</div>'
        )

    def _headline(text: str) -> str:
        return (
            f'<div style="font-weight:900;font-style:italic;font-size:32px;line-height:1.02;'
            f'letter-spacing:-0.03em;color:#ffffff;margin:0 0 24px;">{text}'
            f'<span style="color:{BRAND_COLOR};">.</span></div>'
        )

    def _code_plate() -> str:
        # Dieselbe Chrome-Plate-Sprache wie components/landing/LicenseKeySection.js
        # auf der Website — die Mail zeigt denselben Code, nicht einen anderen.
        return f"""
<table role="presentation" width="100%" style="margin:0 0 24px;"><tr><td align="center">
<table role="presentation" style="border:2px solid rgba(255,255,255,0.14);background:#0C0C0C;padding:20px 28px;"><tr><td align="center">
  <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.26em;color:rgba(255,255,255,0.45);font-weight:800;text-transform:uppercase;margin-bottom:10px;">▸ LEADEROS · DEIN ZUGANGSCODE</div>
  <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:28px;font-weight:900;letter-spacing:0.08em;color:{BRAND_COLOR};">{reserved_code}</div>
</td></tr></table>
</td></tr></table>"""

    p = 'style="font-size:14.5px;color:rgba(255,255,255,0.80);line-height:1.65;margin:0 0 18px;"'
    box_open = (
        '<div style="border-top:2px solid rgba(255,255,255,0.15);'
        'border-bottom:2px solid rgba(255,255,255,0.15);padding:18px 0;margin:0 0 24px;">'
    )
    mono_label = (
        f'style="font-family:\'SF Mono\',Menlo,Consolas,monospace;font-size:9px;'
        f'letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:12px;"'
    )
    webinar_line = (
        f'<p {p}>Dein Platz im Live-Webinar am <b style="color:#fff;">Do, 29. Oktober, 10 Uhr</b> steht — die '
        f'4-teilige Videoserie „Führung beginnt hier" ist ab sofort für dich freigeschaltet.</p>'
        if webinar_registered and webinar_upcoming else
        '<p ' + p + '>Willst du dazu auch live dabei sein? Das nächste Webinar mit Wlad zeigt das System in Aktion.</p>'
        if webinar_upcoming else ''
    )

    if step == 1:
        subject = f"Dein Zugangscode ist reserviert, {name}"
        preheader = f"{reserved_code} — so aktivierst du ihn."
        body = f"""
{_kicker("RESERVIERT")}
{_headline(f"Willkommen, {name}")}
<p {p}>dein persönlicher LeaderOS-Zugangscode ist reserviert:</p>
{_code_plate()}
<p {p}>Aktiviert wird er in unter zwei Minuten: Account anlegen, direkt loslegen. <b style="color:#fff;">14 Tage kostenlos, keine Kreditkarte</b> — mit WladBot, Simulationen und den acht Frameworks, die du gerade gesehen hast.</p>
{webinar_line}
{_cta(activate_url, "Code jetzt aktivieren")}
{unsub}
"""

    elif step == 2:
        fw_name, fw_role, fw_text = _LICENSE_FRAMEWORKS[2]
        subject = "Ein Framework, das du sofort nutzen kannst"
        preheader = f"{fw_name} — {fw_role}."
        body = f"""
{_kicker("FRAMEWORK")}
{_headline(fw_name)}
<p {p}>Hallo {name},</p>
<p {p}>dein Code <b style="color:{BRAND_COLOR};">{reserved_code}</b> wartet noch auf dich. Bis du aktivierst, hier eines der acht Frameworks aus LeaderOS — heute schon einsetzbar:</p>
{box_open}
  <div {mono_label}>▸ {fw_role}</div>
  <p style="font-size:14px;color:#ffffff;line-height:1.6;margin:0;">{fw_text}</p>
</div>
<p {p}>In LeaderOS trainierst du genau das jeden Tag mit WladBot — an deinen echten Fällen, nicht an Theorie.</p>
{_cta(activate_url, "Code aktivieren · 14 Tage kostenlos")}
{unsub}
"""

    elif step == 3:
        fw_name, fw_role, fw_text = _LICENSE_FRAMEWORKS[3]
        subject = f"{name}, drei Sätze für jedes schwierige Gespräch"
        preheader = f"{fw_name} — und dein Code wartet noch."
        body = f"""
{_kicker("FRAMEWORK")}
{_headline(fw_name)}
<p {p}>{fw_text}</p>
{box_open}
  <div {mono_label}>▸ DEIN CODE</div>
  <p style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:20px;font-weight:900;color:{BRAND_COLOR};margin:0;">{reserved_code}</p>
</div>
{webinar_line}
<p {p}>Kein künstlicher Countdown auf den Code — aber je früher du startest, desto mehr Tage deiner 14 kostenlosen nutzt du auch wirklich.</p>
{_cta(activate_url, "Jetzt aktivieren")}
{unsub}
"""

    elif step == 4:
        fw_name, fw_role, fw_text = _LICENSE_FRAMEWORKS[4]
        subject = "Warum 400.000+ Klienten mit dieser Methodik arbeiten"
        preheader = f"{fw_name} + Zahlen, die für sich stehen."
        body = f"""
{_kicker("BEWEIS")}
{_headline("Substanz statt Buzzwords")}
<p {p}>Hallo {name},</p>
<p {p}>seit 2007 hat Wlad Jachtchenko <b style="color:#fff;">400.000+ Klienten</b> trainiert, 3× SPIEGEL-Bestseller geschrieben und steht bei <b style="color:#fff;">4,9 von 5</b> auf Trustpilot (388 Bewertungen). LeaderOS ist diese Methodik als tägliches System — nicht als Wochenend-Seminar.</p>
{box_open}
  <div {mono_label}>▸ {fw_role}</div>
  <p style="font-size:13.5px;color:#ffffff;line-height:1.6;margin:0;">{fw_text}</p>
</div>
<p {p}>Dein Code <b style="color:{BRAND_COLOR};">{reserved_code}</b> gibt dir vollen Zugriff auf alle acht Frameworks, WladBot und die 30-Tage-Challenge.</p>
{_cta(activate_url, "Zugang aktivieren")}
{unsub}
"""

    elif step == 5:
        subject = f"Letzte Mail dieser Serie, {name} — dein Code wartet"
        preheader = "Danach hörst du nur noch von uns, wenn du aktivierst."
        body = f"""
{_kicker("LETZTE MAIL")}
{_headline("Das war's von dieser Serie")}
<p {p}>Hallo {name},</p>
<p {p}>das ist die letzte Mail dieser Reihe. Dein Zugangscode bleibt reserviert, es läuft nichts ab — aber wir schreiben dich zu diesem Thema nicht wieder an.</p>
{_code_plate()}
{webinar_line}
<p {p}>Falls du magst: zwei Minuten, ein Account, 14 Tage kostenlos.</p>
{_cta(activate_url, "Code jetzt aktivieren")}
{unsub}
"""

    else:
        raise ValueError(f"license_activation_email: unknown step {step}")

    return subject, _base_layout(body, preheader=preheader, bib_code=f"LIC-{step:02d}")


def beratung_checklist_email(name: str, unsubscribe_link: str | None = None) -> tuple[str, str]:
    """Return (subject, html) for the standalone "Beratungsgespräch"
    broadcast — a win-back/evergreen send, not a cron step.

    Structure (checklist → trust-block → CTA → content-teaser) is a
    deliberate departure from the prose-paragraph nurture mails: it's
    modeled on the classic B2C-coaching broadcast pattern (benefit
    checklist you can scan in 5 seconds, proof block, one low-friction
    CTA, one piece of free value as a soft second CTA). Every claim is
    canon-verified (docs/gtm/WLAD_CANON.md) — no invented testimonials,
    no fake urgency, same honesty rules as docs/gtm/WEBINAR_FUNNEL.md.

    Not wired to a cron — call this from an admin/broadcast route when
    you actually want to send it, same as launch_announcement_email.
    """
    beratung_url = "https://www.leader-os.de/#beratung"
    article_url = "https://leader-os.de/journal/warum-inhouse-trainings-nach-sechs-wochen-verpuffen"

    subject = f"{name}, ein 30-Minuten-Gespräch kann mehr klären als drei Wochen Grübeln"
    preheader = "5 Dinge, die ein Beratungsgespräch klärt — und wieso am Telefon niemand aus dem Callcenter sitzt."

    unsub = (
        f'<p style="font-size:10px;color:rgba(255,255,255,0.3);margin:24px 0 0;text-align:center;">'
        f'<a href="{unsubscribe_link}" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Keine weiteren Mails dieser Art</a>'
        f'</p>' if unsubscribe_link else ''
    )

    def _cta(url: str, label: str) -> str:
        return f"""
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 8px;"><tr>
  <td style="background:{BRAND_COLOR};padding:0;">
    <a href="{url}" style="display:inline-block;padding:16px 28px;color:{BRAND_DARK};text-decoration:none;font-weight:900;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">+&nbsp;&nbsp;{label}</a>
  </td>
</tr></table>"""

    def _kicker(text: str) -> str:
        return (
            f'<div style="font-family:\'SF Mono\',Menlo,Consolas,monospace;font-size:10px;'
            f'letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;'
            f'margin:12px 0 14px;">▸ {text}</div>'
        )

    def _headline(text: str) -> str:
        return (
            f'<div style="font-weight:900;font-style:italic;font-size:30px;line-height:1.05;'
            f'letter-spacing:-0.03em;color:#ffffff;margin:0 0 22px;">{text}'
            f'<span style="color:{BRAND_COLOR};">.</span></div>'
        )

    p = 'style="font-size:14.5px;color:rgba(255,255,255,0.80);line-height:1.65;margin:0 0 18px;"'
    mono_label = (
        f'style="font-family:\'SF Mono\',Menlo,Consolas,monospace;font-size:9px;'
        f'letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:12px;"'
    )

    def _checklist(label: str, items: list[str]) -> str:
        rows = "".join(
            f'<tr><td style="padding:6px 10px 6px 0;vertical-align:top;width:22px;">'
            f'<span style="color:{BRAND_COLOR};font-weight:900;font-size:14px;">✓</span></td>'
            f'<td style="padding:6px 0;font-size:13.5px;color:#ffffff;line-height:1.55;">{item}</td></tr>'
            for item in items
        )
        return (
            '<div style="border-top:2px solid rgba(255,255,255,0.15);'
            'border-bottom:2px solid rgba(255,255,255,0.15);padding:18px 0;margin:0 0 24px;">'
            f'<div {mono_label}>▸ {label}</div>'
            f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">{rows}</table>'
            '</div>'
        )

    checklist = _checklist("EIN GESPRÄCH HILFT DIR DABEI …", [
        "deine aktuelle Führungssituation von außen einzuordnen",
        "herauszufinden, welches der 11 Frameworks für deinen Fall greift",
        "zu klären, ob 30-Tage-Challenge oder Leadership Plus besser passt",
        "offene Fragen zu WladBot &amp; KI im Führungsalltag zu klären",
        "einen konkreten nächsten Schritt mitzunehmen — ohne Kaufzwang",
    ])

    trust = _checklist("DAS UNTERSCHEIDET DAS GESPRÄCH", [
        "<b style=\"color:#fff;\">400.000+ trainierte Klienten seit 2007</b>, 13 Bücher, 3× SPIEGEL-Bestseller — nicht neu im Geschäft",
        "<b style=\"color:#fff;\">Dieselbe Methodik läuft 24/7 in WladBot</b> — Chat, Sprache, Video-Analyse, ein Kanon, keine Version verwässert",
        "<b style=\"color:#fff;\">Am Telefon sitzt das Team, das das System baut</b> — kein Callcenter-Skript, keine Verkaufsvorgabe",
    ])

    body = f"""
{_kicker("BERATUNGSGESPRÄCH")}
{_headline(f"Hallo {name}")}
<p {p}>drei Wochen allein nachdenken bringt selten mehr Klarheit als ein einziges gutes Gespräch. Deshalb gibt es die Option, mit Wlads Team direkt zu sprechen — bevor du irgendetwas entscheidest.</p>
{checklist}
{trust}
<p {p}>Kein Pitch, keine Deadline, kein „nur noch heute“. Du beschreibst deine Situation, wir sagen dir ehrlich, was Sinn ergibt — auch wenn die Antwort „noch nichts kaufen“ lautet.</p>
{_cta(beratung_url, "Beratungsgespräch buchen · 30 Min")}
<p {p} style="margin-top:28px;">Noch nicht bereit für ein Gespräch? Dieser Artikel zeigt, warum die meisten Inhouse-Trainings nach sechs Wochen wirkungslos verpuffen — und was stattdessen trägt.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.15);margin:0 0 8px;"><tr>
  <td style="padding:18px 20px;">
    <div {mono_label}>▸ AUS DEM JOURNAL</div>
    <div style="font-size:15px;font-weight:800;color:#ffffff;line-height:1.35;margin-bottom:6px;">Warum Inhouse-Trainings nach sechs Wochen verpuffen<span style="color:{BRAND_COLOR};">.</span></div>
    <a href="{article_url}" style="font-size:12.5px;color:{BRAND_COLOR};text-decoration:underline;">Artikel lesen →</a>
  </td>
</tr></table>
{unsub}
"""

    return subject, _base_layout(body, preheader=preheader, bib_code="B-01")
