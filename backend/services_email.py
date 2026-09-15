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
) -> dict:
    """Send an email via Resend (async, non-blocking).

    Returns {"sent": bool, "email_id": str|None, "error": str|None}.
    Silent if API key missing — logs warning and returns sent=False.
    """
    if not _init_resend():
        logger.warning("RESEND_API_KEY not set — skipping email to %s", to)
        return {"sent": False, "email_id": None, "error": "RESEND_API_KEY not configured"}

    params = {
        "from": from_email or f"{BRAND_NAME} <{SENDER_EMAIL}>",
        "to": [to],
        "subject": subject,
        "html": html,
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {"sent": True, "email_id": result.get("id"), "error": None}
    except Exception as e:
        logger.error("Resend send failed to %s: %s", to, e)
        return {"sent": False, "email_id": None, "error": str(e)}


# ── Email Templates ─────────────────────────────────────────────

def _base_layout(body_html: str, preheader: str = "", bib_code: str = "0001") -> str:
    """Wrap content in LeaderOS Nike-DNA email shell.

    Sharp corners (no border-radius), 2px borders, Outfit-Italic-Black
    headlines, BIB-code monospace metadata bar, lime accent on black
    canvas. Matches the landing-page DNA so transactional emails feel
    like the same brand.
    """
    return f"""<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark only">
<title>LeaderOS</title></head>
<body style="margin:0;padding:0;background:#EDEDED;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDEDED;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:{BRAND_DARK};border:2px solid #000000;">
  <!-- BIB-code metadata bar -->
  <tr><td style="padding:18px 28px 16px;border-bottom:1px solid rgba(255,255,255,0.10);">
    <table role="presentation" width="100%"><tr>
      <td style="vertical-align:middle;">
        <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;">▸ BIB · {bib_code}</span>
      </td>
      <td style="text-align:right;vertical-align:middle;">
        <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.22em;color:rgba(255,255,255,0.45);font-weight:700;text-transform:uppercase;">LEADER · OS</span>
      </td>
    </tr></table>
  </td></tr>
  <!-- W mark + label -->
  <tr><td style="padding:24px 28px 8px;">
    <table role="presentation"><tr>
      <td style="vertical-align:middle;">
        <div style="display:inline-block;width:36px;height:36px;background:{BRAND_COLOR};text-align:center;line-height:36px;font-weight:900;font-style:italic;font-size:20px;color:{BRAND_DARK};">W</div>
      </td>
      <td style="vertical-align:middle;padding-left:12px;">
        <div style="font-weight:900;color:#ffffff;font-size:14px;letter-spacing:-0.02em;">Leader<span style="color:{BRAND_COLOR};">·</span>OS</div>
        <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:700;text-transform:uppercase;margin-top:2px;">▸ Powered by WladBot</div>
      </td>
    </tr></table>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:8px 28px 32px;color:#ffffff;">{body_html}</td></tr>
  <!-- Footer -->
  <tr><td style="padding:20px 28px 24px;border-top:1px solid rgba(255,255,255,0.10);">
    <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:9px;letter-spacing:0.22em;color:rgba(255,255,255,0.45);font-weight:700;text-transform:uppercase;margin-bottom:8px;">▸ CLASS · 0001</div>
    <p style="font-size:10px;color:rgba(255,255,255,0.40);margin:0;line-height:1.65;">
      Du erhältst diese Email weil du Teil von LeaderOS bist.<br>
      Wlad Jachtchenko · 2 500+ Führungskräfte · Startups bis DAX.
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
• Die komplette 30-Tage-Challenge<br>
• Alle Playbooks, Frameworks & Simulationen<br>
• Die AI Leadership Community<br><br>
<b>Dein heute-Ritual:</b> 5 Min Daily Check-in starten — dein XP-Konto wartet.""",
        "cta_label": "Zum Dashboard",
        "cta_path": "/dashboard",
    },
    "accelerator": {
        "subject": "Welcome, Accelerator. Deine 2 Jahre starten jetzt, {name}.",
        "headline": "VIP-Zugang aktiv. Dein 1:1 mit Wlads Team steht bereit.",
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
    """Sent after successful tier purchase. Nike-DNA editorial."""
    cfg = TIER_WELCOME.get(tier, TIER_WELCOME["standard"])
    subject = cfg["subject"].format(name=name)
    cta_url = f"{app_url.rstrip('/')}{cfg['cta_path']}"
    body = f"""
<div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin:12px 0 14px;">▸ TIER · {tier.upper()} · AKTIV</div>

<div style="font-weight:900;font-style:italic;font-size:36px;line-height:0.98;letter-spacing:-0.03em;color:#ffffff;margin:0 0 26px;">{cfg['headline']}<span style="color:{BRAND_COLOR};">.</span></div>

<div style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.65;margin:0 0 28px;">{cfg['body']}</div>

<!-- CTA — sharp pill -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;"><tr>
  <td style="background:{BRAND_COLOR};padding:0;">
    <a href="{cta_url}" style="display:inline-block;padding:16px 28px;color:{BRAND_DARK};text-decoration:none;font-weight:900;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">+  {cfg['cta_label']}</a>
  </td>
</tr></table>
"""
    return subject, _base_layout(body, preheader=cfg["headline"], bib_code=f"T-{tier[:3].upper()}")


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
    """Sent right after a user creates their account (free tier). Nike-DNA."""
    subject = f"Willkommen bei LeaderOS, {name}."
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

def drip_day1_email(name: str, app_url: str = "https://leaderos.de") -> tuple[str, str]:
    """Day 1 drip: Education — explain the system."""
    subject = "Tag 1 · Die Wlad-Formel kurz erklärt"
    chat_url = f"{app_url.rstrip('/')}/chat"
    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.10),rgba(154,204,0,0.02));border:1px solid rgba(191,255,0,0.18);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">Tag 1 · Foundation</div>
  <div style="font-size:22px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">{name}, das ist das System hinter LeaderOS.</div>
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
    return subject, _base_layout(body, preheader="3 Säulen, 1 System: Wie LeaderOS funktioniert.")


def drip_day3_email(name: str, app_url: str = "https://leaderos.de") -> tuple[str, str]:
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


def drip_day7_email(name: str, app_url: str = "https://leaderos.de") -> tuple[str, str]:
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
  <p style="font-size:13px;color:#fff;margin:0 0 10px;line-height:1.55;"><b style="color:{BRAND_COLOR};">30-Tage-Challenge</b> · KI-personalisiert auf deine Diagnose</p>
  <p style="font-size:13px;color:#fff;margin:0 0 10px;line-height:1.55;"><b style="color:{BRAND_COLOR};">Alle Frameworks</b> · Schwierige Gespräche, Verhandlung, Rhetorik, 5 Rollen</p>
  <p style="font-size:13px;color:#fff;margin:0;line-height:1.55;"><b style="color:{BRAND_COLOR};">Video-Analyse Bonus</b> · 5 frische Analysen direkt nach Kauf</p>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.7;margin:0 0 20px;">
<b>1 Jahr Vollzugang für 997€</b> — oder in 2 bzw. 12 Raten. 30 Tage Geld-zurück.
</p>
<div style="text-align:center;padding:6px 0 4px;">
  <a href="{coaching_url}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;">Leadership OS freischalten</a>
</div>
<p style="font-size:11px;color:rgba(255,255,255,0.4);margin:20px 0 0;line-height:1.6;text-align:center;">
Kein Risiko: 30 Tage Geld-zurück, ohne Wenn und Aber.
</p>
"""
    return subject, _base_layout(body, preheader="Was sich nach 30 Tagen LeaderOS ändert.")


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
    return subject, _base_layout(body, preheader=f"Woche {week}: {subtitle} · {duration}")


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
    signup_url = f"{app_url.rstrip('/')}/signup?trial=14&utm_source=webinar&utm_medium=email&utm_campaign=webinar-2026-09-17"
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
