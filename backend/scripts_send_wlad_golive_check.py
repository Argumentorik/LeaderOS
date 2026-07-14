"""One-off: Go-Live-Check email to Wlad (wj@argumentorik.com) — Iter 108.

Run: cd /app/backend && python3 scripts_send_wlad_golive_check.py
"""
import asyncio
from dotenv import load_dotenv

load_dotenv()

from services_email import send_email, _base_layout, BRAND_COLOR, BRAND_DARK  # noqa: E402

APP_URL = "https://leaderos.de"


def build_email() -> tuple[str, str]:
    subject = "Wlad, dein komplettes Wissen ist live — finaler Go-Live-Check 🚀"

    def card(label, title, desc, color=BRAND_COLOR):
        return f"""
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px 20px;margin-bottom:12px;">
  <div style="font-size:9px;letter-spacing:0.18em;color:{color};font-weight:900;text-transform:uppercase;margin-bottom:5px;">{label}</div>
  <div style="font-size:14px;font-weight:800;color:#fff;margin-bottom:4px;">{title}</div>
  <p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0;line-height:1.6;">{desc}</p>
</div>"""

    cards = "".join([
        card("Wissens-Fix · Erledigt", "Blitzschneller Zugriff auf dein Wissen — auf eigener Infrastruktur",
             "Der externe Wissens-Speicher hatte Ausfälle (bis zu 90 Sekunden Wartezeit). Wir haben alles auf unsere eigene Datenbank migriert: Zugriff jetzt in <b>0,2 Sekunden</b>, komplette Antworten in 4–10 Sekunden. Live verifiziert in Chat, Video-Feedback (SEXIER), Voice, Simulationen und Playbooks."),
        card("Neu", "Godmode-Onboarding für neue User",
             "Neue Kunden sehen beim ersten Login sofort, was sie bekommen: \u201eWlad — immer an deiner Seite\u201c — dein Wissen, Video-Feedback wie im 1:1, tägliches Wachstum, mobil überall. Danach kalibriert sich der Coach in 60 Sekunden auf jeden User."),
        card("Neu", "E-Mail-Serie: EP 01/07 – EP 07/07 mit deinen Frameworks",
             "Statt Marketing-Storys lernen die User in 7 Episoden je EIN Framework von dir — SEXIER, Feedback-Formel (SBI+WWW), Delegations-Matrix, DESC, Storytelling für Entscheider, dein 30-Tage-System — inkl. direkter Übung in der App. Neues Design mit deinem WladBot 3.0 Avatar in jeder Mail."),
        card("Bereit", "Lizenz-Key-System für die 400 Masterclass-Kunden",
             "Keys werden im Admin-Panel generiert, Einlösung dauert unter 60 Sekunden: Key eingeben → Konto aktiv → Onboarding → ab Tag 1 die Framework-Serie. Zahlungen (Stripe live), DSGVO, Trust-Center — alles steht."),
    ])

    body = f"""
<h1 style="font-size:27px;line-height:1.15;font-weight:900;margin:0 0 8px;letter-spacing:-0.025em;color:#fff;">Dein komplettes Wissen ist jetzt in der Plattform.</h1>
<p style="font-size:13px;color:rgba(255,255,255,0.55);margin:0 0 22px;">Alles live-getestet — wir sind bereit für die 400 Masterclass-Kunden.</p>

<p style="font-size:14.5px;color:rgba(255,255,255,0.9);line-height:1.65;margin:0 0 20px;">
Hallo Wlad,<br><br>
das Warten hat sich gelohnt: Wir haben dein gesamtes Material — <b>25 Kurse + 28 Live-Call-Transkripte</b> — in
<b style="color:{BRAND_COLOR};">7.439 Wissens-Bausteine</b> verwandelt und direkt in Leader-OS integriert.
Der WladBot antwortet jetzt zu 100% auf Basis deiner Original-Inhalte.
</p>

{cards}

<div style="background:rgba(191,255,0,0.06);border:1px solid rgba(191,255,0,0.2);border-radius:14px;padding:18px 22px;margin:22px 0 6px;">
  <div style="font-size:9px;letter-spacing:0.18em;color:{BRAND_COLOR};font-weight:900;text-transform:uppercase;margin-bottom:6px;">Deine 5 Minuten — der finale Check</div>
  <p style="font-size:14px;color:#fff;margin:0 0 6px;line-height:1.7;">
    <b>1.</b> Auf leaderos.de mit Google einloggen<br>
    <b>2.</b> WladBot 2–3 Fachfragen stellen (z.B. „Erkläre die Weiße Rhetorik", „Wie setze ich einen Anker in der Verhandlung?")<br>
    <b>3.</b> Prüfen: Entsprechen die Antworten deinem Standard?<br>
    <b>4.</b> Kurz antworten — ein Satz Feedback reicht.
  </p>
  <div style="text-align:center;padding-top:12px;">
    <a href="{APP_URL}" style="display:inline-block;background:{BRAND_COLOR};color:{BRAND_DARK};padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:800;font-size:13.5px;">Jetzt final checken →</a>
  </div>
</div>

<p style="font-size:12px;color:rgba(255,255,255,0.45);margin:20px 0 0;line-height:1.6;text-align:center;">
Bei Fragen einfach auf diese E-Mail antworten — Mert &amp; Team
</p>
"""
    return subject, _base_layout(body, preheader="7.439 Wissens-Bausteine live · Onboarding neu · E-Mail-Serie mit deinen Frameworks — dein finaler Check.", badge="GO-LIVE&nbsp;CHECK")


async def main():
    subject, html = build_email()
    result = await send_email("wj@argumentorik.com", subject, html)
    print("sent:", result)


if __name__ == "__main__":
    asyncio.run(main())
