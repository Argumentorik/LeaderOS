"""scripts_send_wlad_handover.py — Iter 121 Final Go-Live Handover Mail.

Sendet die finale Godmode-Übergabe-Mail an wj@argumentorik.com — Wlad's
persönlicher Account. Nach Empfang kann Wlad direkt einloggen und die
komplette Feature-Checkliste durchlaufen, bevor die 400+ Cohort-Leader
eingeladen werden.

Aufruf:
    python /app/backend/scripts_send_wlad_handover.py
"""
from __future__ import annotations

import asyncio
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, "/app/backend")

from dotenv import load_dotenv  # noqa: E402
load_dotenv("/app/backend/.env")

from services_email import send_email, is_enabled  # noqa: E402

TO = "wj@argumentorik.com"
FROM = f"Leader-OS <{os.environ.get('SENDER_EMAIL', 'wlad@leaderos.de').strip(chr(34))}>"
FRONTEND = (os.environ.get("FRONTEND_BASE_URL") or "https://leaderos.de").rstrip("/")

SUBJECT = "🚀 Leader-OS ist live — Godmode-Handover für Wlad"

# German curly quotes (as unicode escapes so the source stays ASCII-safe).
LOW = "\u201E"   # „
HIGH = "\u201C"  # "

# Features (Wlad-only, no marketing fluff). German curly quotes to keep the
# strings unambiguous even when they nest quoted phrases.
FEATURES = [
    ("🎬  Lern-Videos", "11 Kurse (Rhetorik, Führung, Coaching, Storytelling …). Prelaunch-gesperrt mit " + LOW + "🔓 Upgrade auf Premium" + HIGH + "-CTA. Zentral entsperrbar via env PRELAUNCH_VIDEO_LOCK=0 sobald deine Vimeo-Uploads live sind."),
    ("🎯  Godmode Dashboard", "Aufgeräumtes Cockpit mit ActionInbox, Fortschritts-Rings, Streak-Tracker, Dark-Mode. Alle Sidebar-Bugs gefixt."),
    ("🧠  Wlad-Knowledge (RAG)", "7 400+ Chunks aus deinem Content lokal via paraphrase-multilingual-MiniLM-L12-v2 embedded (384 dim, kein externer Embedding-Anbieter, DSGVO-friendly). Admin-UI unter /admin → Knowledge lässt dich neue Quellen live nachreichen."),
    ("🎙️  Voice-Modus", "Whisper-STT + ElevenLabs-TTS + Framework-Mapping: Phonetische Varianten (" + LOW + "sexier" + HIGH + ", " + LOW + "loguse" + HIGH + ", " + LOW + "pathus" + HIGH + ") werden automatisch auf deine Frameworks gemappt. Kurze/unklare Aufnahmen bekommen den " + LOW + "Bitte deutlicher sprechen" + HIGH + "-Hint."),
    ("🎧  Zero Audio-Overlap", "Globaler AudioBus stoppt JEDE aktive Stimme (TTS, Challenger, Voice-Mode) beim Seitenwechsel — kein Bleed mehr zwischen Routes."),
    ("🥊  Challengers", "8 CEO-Personas (Bezos, Musk, Oprah, Jobs, Branson, Sandberg, Page, Hastings) mit individuellen ElevenLabs-Stimmen, Meeting-Stage-UI."),
    ("🔒  Community (Prelaunch)", "Peer-Feedback, Live-Leaderboard, Wlad-AMAs — mit einheitlichem Premium-Gate zum Launch scharf schaltbar."),
    ("🔗  leadercheck.de Sync", "Transparenter Endpoint /api/wladhub/sync/status zeigt Bridge-Config, Row-Count, letzter Sync. Bei " + LOW + "no_data" + HIGH + " führt der Toast direkt zur Diagnose-Landing auf leadercheck.de — kein stiller Redirect mehr."),
    ("📈  UTM/Attribution", "First-Touch + Last-Touch (utm_*, gclid, fbclid, ttclid, msclkid, li_fat_id, via, ref + referrer + landing) persistieren auf jedem User. Ads-ready."),
    ("💳  Stripe + Tiers", "Free / Starter (€199) / Standard (€997/Jahr) / Accelerator (€6 970 oder 12× €580,83) mit Video-Analyse & 1:1-Calls. Fully integrated."),
    ("🔐  Auth", "Magic-Link + Emergent-Google-OAuth + " + LOW + "Continue-as" + HIGH + "-Quick-Login. Passwort-Reset, JWT, Rate-Limits, alles verifiziert."),
    ("📱  Mobile-first", "Responsive bis iPhone SE, PWA-Manifest, Offline-Fallback für Landing."),
]

CHECKLIST = [
    ("Auf leaderos.de mit deiner E-Mail einloggen", "Magic-Link oder " + LOW + "Continue as Wlad" + HIGH + "-Kachel — beide Wege getestet."),
    ("Onboarding komplett durchlaufen", "5 Schritte inkl. Diagnose-Verknüpfung zu leadercheck.de."),
    ("Voice-Modus testen", "Frag " + LOW + "was ist sexier?" + HIGH + " — die Framework-Erkennung sollte greifen und der Bot deine SEXIER-Argumentation namentlich zitieren."),
    ("Challenger-Session testen", "Mit Bezos ein Meeting starten, dann Sidebar-Route wechseln → Audio muss SOFORT stoppen."),
    ("Godmode-Dashboard prüfen", "ActionInbox, Streak, Progress-Rings — alle Sektionen laden."),
    ("Admin-UI aufrufen", "/admin → Knowledge (RAG Sources), Community-Leaderboard, User-Delete."),
    ("Video-Lock probieren", "Klick auf ein Lern-Video → PricingModal öffnet sich (kein Player). Zum Live-Schalten: env PRELAUNCH_VIDEO_LOCK=0 + Redeploy."),
    ("400 Cohort-Leader einladen", "Nach OK an Mert für die Bulk-Invite-Runde (Resend-Batches, Magic-Link)."),
]


def render_html() -> str:
    today = datetime.now(timezone.utc).strftime("%d.%m.%Y")

    features_html = "".join(
        f'''
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid rgba(0,0,0,0.05);vertical-align:top;">
            <div style="font-weight:800;font-size:14px;color:#0A0A0A;letter-spacing:-0.01em;">{title}</div>
            <div style="font-weight:500;font-size:13px;color:#64748B;margin-top:4px;line-height:1.55;">{desc}</div>
          </td>
        </tr>'''
        for title, desc in FEATURES
    )

    checklist_html = "".join(
        f'''
        <li style="margin:0 0 14px 0;padding-left:6px;">
          <div style="font-weight:800;font-size:14px;color:#0A0A0A;">{title}</div>
          <div style="font-weight:500;font-size:13px;color:#64748B;margin-top:3px;line-height:1.5;">{desc}</div>
        </li>'''
        for title, desc in CHECKLIST
    )

    return f'''<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Leader-OS · Godmode-Handover</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:32px 0;">
    <tr><td align="center">

      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 24px 80px rgba(191,255,0,0.12);">

        <tr>
          <td style="background:linear-gradient(135deg,#BFFF00 0%,#9ACC00 100%);padding:36px 40px 30px 40px;">
            <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(10,10,10,0.85);color:#BFFF00;font-size:10px;font-weight:900;letter-spacing:0.18em;text-transform:uppercase;">Godmode · Final Handover</div>
            <h1 style="margin:14px 0 8px 0;font-size:32px;line-height:1.15;font-weight:900;color:#0A0A0A;letter-spacing:-0.02em;">
              Leader-OS ist ready für deine Cohort, Wlad.
            </h1>
            <p style="margin:0;font-size:15px;line-height:1.55;color:rgba(10,10,10,0.72);font-weight:500;">
              120+ Iterationen, 400+ Leader auf der Warteliste, ein einziger Ort für Führung.<br />
              Alles was du für den Go-Live brauchst, in dieser Mail.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 40px 8px 40px;text-align:center;">
            <a href="{FRONTEND}/login" style="display:inline-block;padding:16px 34px;background:#0A0A0A;color:#BFFF00;border-radius:14px;font-weight:900;font-size:14px;letter-spacing:0.02em;text-decoration:none;box-shadow:0 8px 24px rgba(10,10,10,0.16);">
              🚀 &nbsp; Jetzt einloggen auf leaderos.de
            </a>
            <div style="margin-top:14px;font-size:11px;color:#94A3B8;font-weight:600;letter-spacing:0.06em;">
              Login-Mail: <span style="color:#0A0A0A;">wj@argumentorik.com</span> &nbsp;·&nbsp; Magic-Link oder Google
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 40px 12px 40px;">
            <div style="font-size:10px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:#0A0A0A;background:#BFFF00;display:inline-block;padding:4px 10px;border-radius:6px;margin-bottom:8px;">
              🟢 &nbsp; Was live ist
            </div>
            <h2 style="margin:0 0 18px 0;font-size:22px;color:#0A0A0A;font-weight:900;letter-spacing:-0.01em;">
              Godmode Feature-Stack
            </h2>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;border-radius:14px;border:1px solid rgba(0,0,0,0.05);">
              {features_html}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px 8px 40px;">
            <div style="font-size:10px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:#0A0A0A;background:#BFFF00;display:inline-block;padding:4px 10px;border-radius:6px;margin-bottom:8px;">
              ✅ &nbsp; Dein finaler Check
            </div>
            <h2 style="margin:0 0 18px 0;font-size:22px;color:#0A0A0A;font-weight:900;letter-spacing:-0.01em;">
              8 Schritte vor der Cohort-Einladung
            </h2>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 16px 40px;">
            <ol style="margin:0;padding:0 0 0 22px;color:#0A0A0A;">
              {checklist_html}
            </ol>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px 32px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border-radius:16px;">
              <tr>
                <td style="padding:22px 24px;color:#FFFFFF;">
                  <div style="font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#BFFF00;">Bug oder Frage?</div>
                  <div style="margin-top:6px;font-size:14px;line-height:1.55;color:rgba(255,255,255,0.85);font-weight:500;">
                    Mert antworten oder direkt im Admin unter <a href="{FRONTEND}/admin" style="color:#BFFF00;text-decoration:none;font-weight:700;">/admin</a> reagieren.<br />
                    Rescue-Switch für den Video-Lock: env <code style="background:rgba(191,255,0,0.15);padding:2px 6px;border-radius:4px;color:#BFFF00;">PRELAUNCH_VIDEO_LOCK=0</code> + Redeploy.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 32px 40px;text-align:center;">
            <div style="font-size:11px;color:#94A3B8;font-weight:600;letter-spacing:0.02em;line-height:1.6;">
              Leader-OS &nbsp;·&nbsp; Powered by WladBot &nbsp;·&nbsp; {today}<br />
              <a href="{FRONTEND}" style="color:#94A3B8;text-decoration:underline;">leaderos.de</a>
              &nbsp;·&nbsp;
              <a href="{FRONTEND}/leader-diagnose" style="color:#94A3B8;text-decoration:underline;">Leader-Diagnose</a>
              &nbsp;·&nbsp;
              <a href="https://leadercheck.de" style="color:#94A3B8;text-decoration:underline;">leadercheck.de</a>
            </div>
          </td>
        </tr>

      </table>

    </td></tr>
  </table>
</body>
</html>'''


async def main():
    if not is_enabled():
        print("[handover] Resend nicht konfiguriert — RESEND_API_KEY fehlt.")
        sys.exit(1)

    html = render_html()
    print(f"[handover] Sende Godmode-Uebergabe -> {TO}")
    result = await send_email(to=TO, subject=SUBJECT, html=html, from_email=FROM)
    print(f"[handover] Resend-Response: {result}")
    if not result.get("sent"):
        sys.exit(2)


if __name__ == "__main__":
    asyncio.run(main())
