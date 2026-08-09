"""Resend email service for transactional emails (event reminders, confirmations)."""
import os
import asyncio
import logging
from datetime import datetime
from typing import Optional

import resend
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
BRAND_NAME = "WladBot"
BRAND_COLOR = "#BFFF00"
BRAND_DARK = "#0A0A0A"


def _frontend_url() -> str:
    """Iter 92.27 (Mert deploy): single source of truth for the app URL used in
    transactional emails. Read at call-time (not import-time) so each Vercel
    deployment (`leaderos` project → leaderos.de, `leadercheck` project →
    leadercheck.de) sends emails that link back to its OWN domain — even though
    both projects share this same backend service code.

    Fallback `https://leaderos.de` matches Mert's primary production domain
    (Jun 2026 launch). Old hardcoded `leaderos.de` (with dash) is deprecated.
    """
    return (os.environ.get("FRONTEND_BASE_URL") or "https://leaderos.de").rstrip("/")


def _init_resend():
    if not RESEND_API_KEY:
        return False
    resend.api_key = RESEND_API_KEY
    return True


def is_enabled() -> bool:
    """Check whether Resend is configured and ready."""
    return bool(RESEND_API_KEY)


async def send_email(
    to: str,
    subject: str,
    html: str,
    from_email: Optional[str] = None,
    reply_to: Optional[str] = None,
    max_retries: int = 3,
) -> dict:
    """Send an email via Resend (async, non-blocking) with exponential-backoff retry.

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

    params = {
        "from": from_email or f"{BRAND_NAME} <{SENDER_EMAIL}>",
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
    avatar_url = f"{_frontend_url()}/wladbot-avatar.png"
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
      Du erhältst diese E-Mail, weil du ein Leader-OS Konto hast.<br>
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
• <b>6× 1:1 Calls mit Wlad Jachtchenko</b><br>
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
    return subject, _base_layout(body, preheader=cfg["headline"])


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
    plus_url = "https://leader-check.de/plus"
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


# ── Day-10 Consultation Reminder (Iter 131.4 · Wlad-Direktive) ────────────
# Warm personal invitation to book a free 30-min 1:1 call with Wlad's team.
# Sent ~10 days after signup — after the user has had time to try the
# platform but hasn't yet decided on a plan. Highest-conversion moment.

def consultation_reminder_email(
    name: str,
    booking_url: str = "https://leader-check.de/beratung",
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
LEADEROS · leader-check.de
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

