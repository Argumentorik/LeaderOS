"""scripts_send_rag_handover.py — Iter 121.4 RAG Deep-Dive Handover Mail.

Sendet die zweite Handover-Mail nach dem erfolgreichen Prod-Deploy — diesmal
mit Fokus auf das RAG-System (7.463 Chunks, lokales Embedding, 5 Wlad-
Frameworks, Voice-Framework-Map). Empfänger:
  · wj@argumentorik.com     (Wlad)
  · stefan@argumentorik.com (Stefan)

Aufruf:
    python /app/backend/scripts_send_rag_handover.py
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

TO = ["wj@argumentorik.com", "stefan@argumentorik.com"]
FROM = f"Leader-OS <{os.environ.get('SENDER_EMAIL', 'wlad@leaderos.de').strip(chr(34))}>"
FRONTEND = (os.environ.get("FRONTEND_BASE_URL") or "https://leaderos.de").rstrip("/")

SUBJECT = "🧠 Leader-OS ist live — So funktioniert das Wlad-Wissen (RAG-Deep-Dive)"

LOW = "\u201E"   # „
HIGH = "\u201C"  # "

# ── Pipeline-Steps (visualisiert als nummerierte Cards) ──────────────────
PIPELINE = [
    ("🎤", "Voice-Framework-Map",
     "Phonetische Fehler-Aussprachen werden gemappt: " + LOW + "sexier" + HIGH + " → SEXIER-Argumentation, " + LOW + "loguse" + HIGH + " → Logos, " + LOW + "sechs P" + HIGH + " → 6P-Modell. Wlad kann jetzt fragen wie er will — der Bot versteht."),
    ("⚡", "Lokales Embedding (384-dim)",
     "Jede Query wird binnen ~10 ms in einen 384-dimensionalen Vektor umgewandelt — komplett auf unserem Server, ohne externen Embedding-Anbieter. Kein Datentransfer USA, kein API-Cost. DSGVO-safe."),
    ("🔍", "Hybrid-Search",
     "Zwei Suchen parallel: (1) Semantische Ähnlichkeit über Cosine-Distance, (2) Keyword-Scan für Eigennamen wie " + LOW + "SEXIER" + HIGH + ". Reciprocal Rank Fusion kombiniert beide → robuster als jeder Einzelweg."),
    ("📌", "High-Priority-Chunks",
     "5 Signature-Frameworks (10 Stufen Zuhören, 6P-Storytelling, Charisma-Code, SEXIER, 30 Schlagfertigkeitstechniken) sind fest verdrahtet — sie werden IMMER zitiert wenn erwähnt, egal wie unscharf die Frage war."),
    ("🧩", "Context-Injection",
     "Die Top 6 Chunks werden formatiert und als expliziter " + LOW + "=== WLAD-WISSEN ===" + HIGH + "-Block dem LLM-System-Prompt beigelegt. Wlads Originalworten schlagen GPT-Halbwissen."),
    ("💬", "LLM-Antwort",
     "GPT-5.2 / Claude Sonnet 4.5 antwortet — aber jetzt mit Wlads Wortwahl, Wlads Beispielen, Wlads Frameworks. Der Nutzer hört den echten Wlad, nicht den generischen KI-Assistent."),
]

FRAMEWORKS_LOCKED = [
    ("SEXIER-Modell", "S/E/X/I/E/R — komplette Argumentations-Struktur mit Statement, Explanation, Example, Impact, Explanation of Impact, Rebuttal."),
    ("6P-Modell (Storytelling)", "Plot · Polarität · Protagonist · Peripetie · Pointe · Präsentation — die 6 Elemente jeder guten Story."),
    ("Charisma-Code (8 Elemente)", "Credo · Habitus · Außeralltäglichkeit · Rhetorik · Inszenierung · Superskills · Motivation · Arbeit."),
    ("10 Stufen des Zuhörens", "Antwortenorientiert (1-6): Vortäuschend, Kürzend, Selektiv, Übertrumpfend, Egoistisch, Beratend. Verstehend (7-10): Aufmerksam, Aktiv, Empathisch, Helfend."),
    ("30 Schlagfertigkeitstechniken", "Komplette nummerierte Liste (1. Rückfrage-Technik … 30. Klartext-Technik) — der Bot listet sie exakt so wie im Original-WladBot."),
]

KEY_FACTS = [
    ("7.463", "Chunks aus Wlads Content (Rhetorik, Manipulation, Verhandeln, Storytelling, Feedback, Führung)"),
    ("384", "Dimensionen pro Vector (MiniLM-Multilingual, 50+ Sprachen)"),
    ("< 50 ms", "p95-Latenz für Vector-Match (In-Memory numpy, kein Netzwerk-Hop)"),
    ("€ 0", "Kosten pro Query — kein externer Embedding-Provider"),
    ("5", "Signature-Frameworks 1:1 identisch zum Original-WladBot auf Telegram"),
]


def render_html() -> str:
    today = datetime.now(timezone.utc).strftime("%d.%m.%Y")

    pipeline_html = "".join(
        f'''
        <tr>
          <td style="padding:16px 18px;border-bottom:1px solid rgba(0,0,0,0.05);vertical-align:top;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="52" style="vertical-align:top;">
                  <div style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;background:#BFFF00;font-size:18px;">{icon}</div>
                </td>
                <td style="vertical-align:top;">
                  <div style="font-weight:900;font-size:11px;color:#6B8A00;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:3px;">Schritt {i+1}</div>
                  <div style="font-weight:900;font-size:15px;color:#0A0A0A;letter-spacing:-0.01em;">{title}</div>
                  <div style="font-weight:500;font-size:13px;color:#64748B;margin-top:5px;line-height:1.55;">{desc}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>'''
        for i, (icon, title, desc) in enumerate(PIPELINE)
    )

    frameworks_html = "".join(
        f'''
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.05);vertical-align:top;">
            <div style="font-weight:900;font-size:13px;color:#0A0A0A;">✅ {name}</div>
            <div style="font-weight:500;font-size:12px;color:#64748B;margin-top:3px;line-height:1.5;">{desc}</div>
          </td>
        </tr>'''
        for name, desc in FRAMEWORKS_LOCKED
    )

    stats_html = "".join(
        f'''
        <td style="padding:14px 12px;text-align:center;vertical-align:top;border-right:1px solid rgba(191,255,0,0.15);">
          <div style="font-weight:900;font-size:24px;color:#BFFF00;letter-spacing:-0.02em;line-height:1;">{value}</div>
          <div style="font-weight:600;font-size:10px;color:rgba(255,255,255,0.55);margin-top:6px;line-height:1.4;">{label}</div>
        </td>'''
        for value, label in KEY_FACTS
    )
    # remove last border-right
    stats_html = stats_html.replace(
        'border-right:1px solid rgba(191,255,0,0.15);"',
        'border-right:1px solid rgba(191,255,0,0.15);"',
        len(KEY_FACTS) - 1
    )
    # Simpler: no border on last cell
    stats_row = ''
    for i, (value, label) in enumerate(KEY_FACTS):
        border = 'border-right:1px solid rgba(191,255,0,0.15);' if i < len(KEY_FACTS) - 1 else ''
        stats_row += (
            f'<td style="padding:14px 8px;text-align:center;vertical-align:top;{border}">'
            f'<div style="font-weight:900;font-size:22px;color:#BFFF00;letter-spacing:-0.02em;line-height:1;">{value}</div>'
            f'<div style="font-weight:600;font-size:9.5px;color:rgba(255,255,255,0.55);margin-top:6px;line-height:1.35;">{label}</div>'
            f'</td>'
        )

    return f'''<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Leader-OS · RAG-Deep-Dive</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:32px 0;">
    <tr><td align="center">

      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 24px 80px rgba(191,255,0,0.12);">

        <!-- Hero -->
        <tr>
          <td style="background:linear-gradient(135deg,#BFFF00 0%,#9ACC00 100%);padding:36px 40px 30px 40px;">
            <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(10,10,10,0.85);color:#BFFF00;font-size:10px;font-weight:900;letter-spacing:0.18em;text-transform:uppercase;">Prod-Deploy · RAG-Deep-Dive</div>
            <h1 style="margin:14px 0 8px 0;font-size:30px;line-height:1.15;font-weight:900;color:#0A0A0A;letter-spacing:-0.02em;">
              Leader-OS ist live — der Bot spricht Wlad.
            </h1>
            <p style="margin:0;font-size:15px;line-height:1.55;color:rgba(10,10,10,0.72);font-weight:500;">
              Das Wlad-Wissen fließt jetzt in jede Antwort. Wie das technisch funktioniert — in 6 Schritten erklärt.
            </p>
          </td>
        </tr>

        <!-- Stats-Strip auf schwarzem Grund -->
        <tr>
          <td style="padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;">
              <tr>{stats_row}</tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:28px 40px 8px 40px;text-align:center;">
            <a href="{FRONTEND}/login" style="display:inline-block;padding:16px 34px;background:#0A0A0A;color:#BFFF00;border-radius:14px;font-weight:900;font-size:14px;letter-spacing:0.02em;text-decoration:none;box-shadow:0 8px 24px rgba(10,10,10,0.16);">
              🚀 &nbsp; Direkt einloggen auf leaderos.de
            </a>
          </td>
        </tr>

        <!-- Was ist RAG? -->
        <tr>
          <td style="padding:36px 40px 8px 40px;">
            <div style="font-size:10px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:#0A0A0A;background:#BFFF00;display:inline-block;padding:4px 10px;border-radius:6px;margin-bottom:8px;">
              🧠 &nbsp; Was ist RAG?
            </div>
            <h2 style="margin:0 0 12px 0;font-size:22px;color:#0A0A0A;font-weight:900;letter-spacing:-0.01em;">
              Retrieval-Augmented Generation
            </h2>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#64748B;font-weight:500;">
              Statt dass der Bot aus dem Trainings-Halbwissen von GPT-5.2 antwortet, holt er sich VOR jeder Antwort die 6 relevantesten Wlad-Original-Passagen aus einer Datenbank mit 7.463 Content-Chunks — Rhetorik-Bücher, Kurs-Transkripte, Playbooks, alles. Diese Passagen bekommt das LLM als heiligen Kontext, und antwortet dann in Wlads Sprache.
              <br /><br />
              <strong style="color:#0A0A0A;">Das Ergebnis:</strong> Der Bot zitiert Wlads Frameworks korrekt, in Wlads Reihenfolge, mit Wlads Formulierungen — auch bei Fragen, die im GPT-Training niemals vorkamen.
            </p>
          </td>
        </tr>

        <!-- Pipeline -->
        <tr>
          <td style="padding:36px 40px 8px 40px;">
            <div style="font-size:10px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:#0A0A0A;background:#BFFF00;display:inline-block;padding:4px 10px;border-radius:6px;margin-bottom:8px;">
              ⚙️ &nbsp; Die Pipeline
            </div>
            <h2 style="margin:0 0 18px 0;font-size:22px;color:#0A0A0A;font-weight:900;letter-spacing:-0.01em;">
              Von der Frage zur Wlad-Antwort — in 6 Schritten
            </h2>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;border-radius:14px;border:1px solid rgba(0,0,0,0.05);">
              {pipeline_html}
            </table>
          </td>
        </tr>

        <!-- Frameworks -->
        <tr>
          <td style="padding:36px 40px 8px 40px;">
            <div style="font-size:10px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:#0A0A0A;background:#BFFF00;display:inline-block;padding:4px 10px;border-radius:6px;margin-bottom:8px;">
              🎯 &nbsp; Locked-In Frameworks
            </div>
            <h2 style="margin:0 0 8px 0;font-size:22px;color:#0A0A0A;font-weight:900;letter-spacing:-0.01em;">
              5 Signature-Frameworks — 1:1 wie im Original-WladBot
            </h2>
            <p style="margin:0 0 18px 0;font-size:13px;line-height:1.55;color:#64748B;font-weight:500;">
              Diese Frameworks sind fest verdrahtet. Egal wie ein Nutzer sie erwähnt (auch phonetisch verballhornt) — der Bot listet sie IMMER mit exakter Wortwahl und Reihenfolge auf. Verifiziert gegen deine Screenshots.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;border-radius:14px;border:1px solid rgba(0,0,0,0.05);">
              {frameworks_html}
            </table>
          </td>
        </tr>

        <!-- Live-Erweiterbarkeit -->
        <tr>
          <td style="padding:36px 40px 8px 40px;">
            <div style="font-size:10px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:#0A0A0A;background:#BFFF00;display:inline-block;padding:4px 10px;border-radius:6px;margin-bottom:8px;">
              🚀 &nbsp; Live erweiterbar
            </div>
            <h2 style="margin:0 0 12px 0;font-size:22px;color:#0A0A0A;font-weight:900;letter-spacing:-0.01em;">
              Neues Wissen ohne Redeploy
            </h2>
            <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#64748B;font-weight:500;">
              Unter <a href="{FRONTEND}/admin" style="color:#6B8A00;text-decoration:none;font-weight:700;">leaderos.de/admin → Knowledge</a> könnt ihr jederzeit neuen Content hochladen:
            </p>
            <ul style="margin:0;padding:0 0 0 22px;color:#0A0A0A;">
              <li style="margin-bottom:8px;font-size:13.5px;line-height:1.55;font-weight:500;color:#0A0A0A;">
                <strong>Text-Upload</strong> — kurze Notizen, Definitionen, neue Framework-Erklärungen (sofort live).
              </li>
              <li style="margin-bottom:8px;font-size:13.5px;line-height:1.55;font-weight:500;color:#0A0A0A;">
                <strong>Datei-Upload</strong> — PDF, DOCX, TXT, MD (z. B. neue Buch-Kapitel, Kurs-Transkripte).
              </li>
              <li style="margin-bottom:0;font-size:13.5px;line-height:1.55;font-weight:500;color:#0A0A0A;">
                <strong>Source-Management</strong> — jede Quelle löschbar / re-ingestbar per Klick.
              </li>
            </ul>
          </td>
        </tr>

        <!-- Support strip -->
        <tr>
          <td style="padding:28px 40px 32px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border-radius:16px;">
              <tr>
                <td style="padding:22px 24px;color:#FFFFFF;">
                  <div style="font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#BFFF00;">Health-Check</div>
                  <div style="margin-top:6px;font-size:13.5px;line-height:1.55;color:rgba(255,255,255,0.85);font-weight:500;">
                    Live-Status jederzeit einsehbar:<br />
                    <code style="display:inline-block;margin-top:6px;background:rgba(191,255,0,0.15);padding:6px 10px;border-radius:6px;color:#BFFF00;font-size:12px;">curl {FRONTEND}/api/rag-status</code>
                    <br /><br />
                    Rescue-Switch (RAG deaktivieren wenn nötig): env <code style="background:rgba(191,255,0,0.15);padding:2px 6px;border-radius:4px;color:#BFFF00;">RAG_EMBEDDINGS_DISABLED=1</code>.<br />
                    Volle Doku im Repo unter <code style="background:rgba(191,255,0,0.15);padding:2px 6px;border-radius:4px;color:#BFFF00;">/app/memory/RAG_SYSTEM.md</code>.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:0 40px 32px 40px;text-align:center;">
            <div style="font-size:11px;color:#94A3B8;font-weight:600;letter-spacing:0.02em;line-height:1.6;">
              Leader-OS &nbsp;·&nbsp; Powered by WladBot &nbsp;·&nbsp; {today}<br />
              <a href="{FRONTEND}" style="color:#94A3B8;text-decoration:underline;">leaderos.de</a>
              &nbsp;·&nbsp;
              <a href="{FRONTEND}/admin" style="color:#94A3B8;text-decoration:underline;">Admin · Knowledge</a>
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
        print("[rag-handover] Resend nicht konfiguriert — RESEND_API_KEY fehlt.")
        sys.exit(1)

    html = render_html()
    for recipient in TO:
        print(f"[rag-handover] Sende RAG-Deep-Dive -> {recipient}")
        result = await send_email(to=recipient, subject=SUBJECT, html=html, from_email=FROM)
        print(f"[rag-handover]   Resend-Response: {result}")
        if not result.get("sent"):
            print(f"[rag-handover]   ⚠️  Send failed for {recipient}")


if __name__ == "__main__":
    asyncio.run(main())
