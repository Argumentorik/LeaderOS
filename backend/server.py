from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os
import logging
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Models ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: str

class QuizAnswer(BaseModel):
    question_id: int
    category: str
    layer: str
    score: int

class QuizSubmit(BaseModel):
    session_id: str
    answers: List[QuizAnswer]

class CoachMessage(BaseModel):
    session_id: str
    message: str

class EmailSend(BaseModel):
    session_id: str


# --- Endpoints ---

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "EMERGENT Diagnostic Hub"}

@api_router.post("/user/create")
async def create_user(data: UserCreate):
    session_id = str(uuid.uuid4())
    doc = {
        "session_id": session_id,
        "name": data.name,
        "email": data.email,
        "role": data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(doc)
    return {"session_id": session_id, "name": data.name, "email": data.email, "role": data.role}


@api_router.post("/quiz/generate-report")
async def generate_report(data: QuizSubmit):
    user = await db.users.find_one({"session_id": data.session_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "Session nicht gefunden")

    cats = {c: {"total": 0, "max": 0} for c in ["rhetorik", "kritisches_denken", "entscheidung", "fuehrung", "eq", "strategie"]}
    layers = {l: {"total": 0, "count": 0} for l in ["ai_literacy", "rhetoric", "strategic_eq"]}

    for a in data.answers:
        if a.category in cats:
            cats[a.category]["total"] += a.score
            cats[a.category]["max"] += 3
        if a.layer in layers:
            layers[a.layer]["total"] += a.score
            layers[a.layer]["count"] += 1

    cat_scores = {c: round(v["total"] / v["max"] * 100) if v["max"] else 0 for c, v in cats.items()}
    layer_scores = {l: round(v["total"] / (v["count"] * 3) * 100) if v["count"] else 0 for l, v in layers.items()}
    avg = round(sum(cat_scores.values()) / len(cat_scores))

    roi = {
        "hours_saved": max(2, round(avg / 100 * 10 + 2)),
        "decision_speed": round((avg / 100 * 2.5 + 1.5) * 10) / 10,
        "performance_boost": min(85, round(avg * 0.6 + 15))
    }

    narrative = await build_narrative(user, cat_scores, layer_scores, avg)

    report = {
        "session_id": data.session_id,
        "cat_scores": cat_scores,
        "layer_scores": layer_scores,
        "avg_total": avg,
        "roi": roi,
        "narrative": narrative,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.replace_one({"session_id": data.session_id}, report, upsert=True)
    return {**report, "user": {"name": user["name"], "role": user["role"], "email": user["email"]}}


async def build_narrative(user, cat_scores, layer_scores, avg):
    if not EMERGENT_LLM_KEY:
        return default_narrative(user["name"], user["role"])

    prompt = f"""Analysiere dieses Leadership-Diagnose-Profil und erstelle einen personalisierten Report auf Deutsch.

Name: {user['name']}, Rolle: {user['role']}, Gesamtscore: {avg}%

Kategorie-Scores:
- Rhetorik & Kommunikation: {cat_scores.get('rhetorik', 0)}%
- Kritisches Denken: {cat_scores.get('kritisches_denken', 0)}%
- Entscheidungsfindung: {cat_scores.get('entscheidung', 0)}%
- Führungskompetenz: {cat_scores.get('fuehrung', 0)}%
- Emotionale Intelligenz: {cat_scores.get('eq', 0)}%
- Business-Strategie: {cat_scores.get('strategie', 0)}%

Layer-Scores:
- KI-Kompetenz: {layer_scores.get('ai_literacy', 0)}%
- Boardroom-Rhetorik: {layer_scores.get('rhetoric', 0)}%
- Strategisches EQ: {layer_scores.get('strategic_eq', 0)}%

Antworte NUR mit valid JSON (kein anderer Text, kein Markdown):
{{
  "profile_title": "Prägnanter Leadership-Profil-Titel (3-5 Wörter)",
  "executive_summary": "3 kraftvolle Sätze über das Leadership-Profil von {user['name']} basierend auf den Scores. Sehr direkt und spezifisch.",
  "ai_literacy_analysis": "2 prägnante Sätze zur KI-Kompetenz und was zu verbessern ist.",
  "rhetoric_analysis": "2 prägnante Sätze zur Boardroom-Rhetorik-Kompetenz.",
  "eq_analysis": "2 prägnante Sätze zum Strategischen EQ.",
  "top_strength": "Die stärkste Führungskompetenz in einem prägnanten Satz.",
  "growth_priority": "Die wichtigste Wachstumszone in einem Satz.",
  "recommendation_1": {{"title": "Empfehlungstitel", "description": "2 konkrete, handlungsorientierte Sätze."}},
  "recommendation_2": {{"title": "Empfehlungstitel", "description": "2 konkrete, handlungsorientierte Sätze."}},
  "recommendation_3": {{"title": "Empfehlungstitel", "description": "2 konkrete, handlungsorientierte Sätze."}},
  "closing_statement": "1-2 kraftvolle, motivierende Abschlusssätze.",
  "urgency_message": "Eine Dringlichkeitsbotschaft basierend auf dem niedrigsten Score-Bereich."
}}"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"rpt-{uuid.uuid4()}",
            system_message="Du bist ein Elite-Leadership-Coach. Antworte immer auf Deutsch. Nur valid JSON, kein anderer Text."
        ).with_model("anthropic", "claude-4-sonnet-20250514")
        response = await chat.send_message(UserMessage(text=prompt))

        text = response.strip()
        if "```" in text:
            parts = text.split("```")
            for part in parts:
                part = part.replace("json", "").strip()
                if part.startswith("{"):
                    text = part
                    break
        return json.loads(text)
    except Exception as e:
        logger.error(f"Claude error: {e}")
        return default_narrative(user["name"], user["role"])


def default_narrative(name, role="Leader"):
    return {
        "profile_title": "Der strategische Führungspionier",
        "executive_summary": f"{name} zeigt ein ausgeprägtes Führungsprofil mit klarem Potenzial für strategische Dominanz im KI-Zeitalter. Die Diagnose zeigt solide Grundlagen in mehreren Dimensionen, die mit gezielter Entwicklung zu außergewöhnlichen Ergebnissen führen werden. Besonders die Kombination aus analytischem Denken und menschlicher Führungskompetenz ist die Basis für nachhaltige Irreplaceability.",
        "ai_literacy_analysis": "Die KI-Kompetenz bietet erhebliches Ausbaupotenzial. Der strategische Einsatz von KI als Führungshebel ist der nächste entscheidende Schritt zur strategischen Dominanz.",
        "rhetoric_analysis": "Die Boardroom-Rhetorik zeigt solide Grundlagen. Mit gezieltem Kommunikationstraining wird die Leadership-Präsenz in High-Stakes-Situationen deutlich wachsen.",
        "eq_analysis": "Das Strategische EQ ist ein bedeutender Differenziator. Die Vertiefung in emotionaler Kalibrierung und Autoritätssicherung wird die Führungseffektivität signifikant steigern.",
        "top_strength": "Strukturiertes analytisches Denken unter Druck und die Fähigkeit, komplexe Entscheidungen strukturiert zu treffen.",
        "growth_priority": "Integration von KI-Tools als strategischer Hebel in die tägliche Führungspraxis.",
        "recommendation_1": {
            "title": "Boardroom-Rhetorik schärfen",
            "description": "Trainiere gezielt die Kommunikation komplexer Ideen in 90-Sekunden-Formaten für Boardroom-Situationen. Nutze High-Stakes-Gespräche bewusst als Trainingsfeld für strategische Überzeugungskraft."
        },
        "recommendation_2": {
            "title": "KI als strategischen Hebel nutzen",
            "description": "Identifiziere 3 konkrete Use Cases, in denen KI deine Entscheidungsgeschwindigkeit verdreifachen kann. Baue ein persönliches KI-Toolkit für Investor-Gespräche und strategische Analysen."
        },
        "recommendation_3": {
            "title": "Strategisches EQ vertiefen",
            "description": "Entwickle ein persönliches Energie-Management-System für High-Pressure-Situationen. Emotionale Kalibrierung ist dein stärkster Hebel gegen Replaceability im KI-Zeitalter."
        },
        "closing_statement": "Du stehst am Beginn einer transformativen Leadership-Journey. Der Unterschied zwischen einem guten und einem unverzichtbaren Leader liegt in den nächsten 30 Tagen gezielter Entwicklung.",
        "urgency_message": "Unternehmen ohne aktive Führungsentwicklung verzeichnen 3.7x mehr Resignationen. Jeder Tag ohne gezieltes Leadership-Upgrade ist ein strategischer Rückschritt."
    }


@api_router.get("/report/{session_id}")
async def get_report(session_id: str):
    report = await db.reports.find_one({"session_id": session_id}, {"_id": 0})
    if not report:
        raise HTTPException(404, "Report nicht gefunden")
    user = await db.users.find_one({"session_id": session_id}, {"_id": 0})
    if user:
        return {**report, "user": {"name": user["name"], "role": user["role"], "email": user["email"]}}
    return report


@api_router.post("/coach/chat")
async def coach_chat(data: CoachMessage):
    user = await db.users.find_one({"session_id": data.session_id}, {"_id": 0})
    report = await db.reports.find_one({"session_id": data.session_id}, {"_id": 0})

    context = ""
    if user:
        context = f"Nutzer: {user['name']}, Rolle: {user['role']}"
    if report:
        context += f", Gesamtscore: {report.get('avg_total', '?')}%"
        n = report.get("narrative", {})
        if n.get("profile_title"):
            context += f", Profil: {n['profile_title']}"

    if not EMERGENT_LLM_KEY:
        return {"response": "Der AI-Coach ist nicht konfiguriert. Bitte kontaktiere uns für persönliches Coaching."}

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"coach-{data.session_id}",
            system_message=f"""Du bist ein Elite KI-Leadership-Coach bei EMERGENT. Du gibst präzises, direktes und transformatives Coaching auf Deutsch.

Kontext: {context}

Regeln:
- Antworte immer auf Deutsch
- Sei direkt, klar und handlungsorientiert  
- Max 150 Wörter pro Antwort
- Fokus auf sofort anwendbare Ratschläge
- Referenziere den Nutzerkontext wenn relevant
- Nie allgemein - immer spezifisch für Leadership im KI-Zeitalter"""
        ).with_model("anthropic", "claude-4-sonnet-20250514")
        response = await chat.send_message(UserMessage(text=data.message))
        return {"response": response}
    except Exception as e:
        logger.error(f"Coach error: {e}")
        return {"response": "Der AI-Coach ist momentan überlastet. Bitte versuche es in einem Moment erneut."}


@api_router.post("/email/send-report")
async def send_email(data: EmailSend):
    report = await db.reports.find_one({"session_id": data.session_id}, {"_id": 0})
    user = await db.users.find_one({"session_id": data.session_id}, {"_id": 0})

    if not report or not user:
        raise HTTPException(404, "Daten nicht gefunden")

    if not RESEND_API_KEY or RESEND_API_KEY in ("your_resend_api_key_here", "", "placeholder"):
        logger.info("Resend not configured - skipping email")
        return {"status": "skipped", "message": "Email-Service nicht konfiguriert"}

    try:
        import resend
        resend.api_key = RESEND_API_KEY

        html = build_email_html(user, report)
        narrative = report.get("narrative", {})
        params = {
            "from": SENDER_EMAIL,
            "to": [user["email"]],
            "subject": f"Dein EMERGENT Leadership-Report | {narrative.get('profile_title', 'Persönlicher Report')}",
            "html": html
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {"status": "success", "id": result.get("id")}
    except Exception as e:
        logger.error(f"Email error: {e}")
        return {"status": "error", "message": str(e)}


def build_email_html(user, report):
    n = report.get("narrative", {})
    ls = report.get("layer_scores", {})
    roi = report.get("roi", {})
    r1 = n.get("recommendation_1", {})
    r2 = n.get("recommendation_2", {})
    r3 = n.get("recommendation_3", {})

    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050505;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#050505">
<tr><td align="center" style="padding:40px 20px;">
<table width="580" cellpadding="0" cellspacing="0" style="background:#0A0A0B;border:1px solid #27272A;max-width:580px;">
<tr><td style="padding:32px 40px;border-bottom:1px solid #27272A;">
  <span style="color:#3B82F6;font-size:18px;font-weight:900;letter-spacing:3px;">EMERGENT</span>
  <span style="color:#D97706;font-size:10px;font-weight:700;letter-spacing:4px;margin-left:10px;">DIAGNOSTIC HUB</span>
  <p style="color:#94A3B8;font-size:11px;margin:8px 0 0;letter-spacing:1px;">AI CHANGES SPEED. LEADERSHIP DECIDES DIRECTION.</p>
</td></tr>
<tr><td style="padding:40px;">
  <h1 style="color:#FFFFFF;font-size:22px;margin:0 0 8px;">Liebe/r {user['name']},</h1>
  <p style="color:#94A3B8;font-size:13px;margin:0 0 28px;">dein persönlicher Leadership-Diagnose Report ist bereit.</p>

  <div style="background:#0D1829;border:1px solid #1E3A5F;border-left:4px solid #D97706;padding:20px;margin:0 0 28px;">
    <p style="color:#D97706;font-size:9px;letter-spacing:4px;margin:0 0 6px;text-transform:uppercase;">DEIN FÜHRUNGSPROFIL</p>
    <h2 style="color:#FFFFFF;font-size:20px;font-weight:900;margin:0;">{n.get('profile_title', 'Leadership Profil')}</h2>
  </div>

  <p style="color:#CBD5E1;font-size:14px;line-height:1.8;margin:0 0 32px;">{n.get('executive_summary', '')}</p>

  <table width="100%" cellpadding="0" cellspacing="6" style="margin:0 0 28px;">
    <tr>
      <td align="center" style="background:#0D1829;border:1px solid #1E3A5F;padding:14px;width:33%;">
        <p style="color:#3B82F6;font-size:8px;letter-spacing:3px;margin:0 0 4px;text-transform:uppercase;">KI-KOMPETENZ</p>
        <p style="color:#FFFFFF;font-size:24px;font-weight:900;margin:0;">{ls.get('ai_literacy', 0)}%</p>
      </td>
      <td align="center" style="background:#0D1829;border:1px solid #1E3A5F;padding:14px;width:33%;">
        <p style="color:#3B82F6;font-size:8px;letter-spacing:3px;margin:0 0 4px;text-transform:uppercase;">BOARDROOM-RHETORIK</p>
        <p style="color:#FFFFFF;font-size:24px;font-weight:900;margin:0;">{ls.get('rhetoric', 0)}%</p>
      </td>
      <td align="center" style="background:#0D1829;border:1px solid #7C4A00;padding:14px;width:33%;">
        <p style="color:#D97706;font-size:8px;letter-spacing:3px;margin:0 0 4px;text-transform:uppercase;">STRATEGISCHES EQ</p>
        <p style="color:#FFFFFF;font-size:24px;font-weight:900;margin:0;">{ls.get('strategic_eq', 0)}%</p>
      </td>
    </tr>
  </table>

  <div style="background:#0D1829;border:1px solid #1E3A5F;padding:20px;margin:0 0 28px;">
    <p style="color:#FFFFFF;font-size:14px;font-weight:700;margin:0 0 12px;">Dein ROI-Potential:</p>
    <p style="color:#10B981;font-size:13px;margin:0 0 6px;">+ {roi.get('hours_saved', 5)} Stunden gesparte Arbeitszeit pro Woche</p>
    <p style="color:#10B981;font-size:13px;margin:0 0 6px;">{roi.get('decision_speed', 2.0)}x schnellere Entscheidungsgeschwindigkeit</p>
    <p style="color:#10B981;font-size:13px;margin:0;">+ {roi.get('performance_boost', 35)}% Team-Performance-Steigerung</p>
  </div>

  <p style="color:#FFFFFF;font-size:14px;font-weight:700;margin:0 0 16px;">Top 3 Empfehlungen:</p>
  <div style="border-left:3px solid #3B82F6;padding-left:16px;margin:0 0 14px;">
    <p style="color:#FFFFFF;font-size:13px;font-weight:700;margin:0 0 4px;">{r1.get('title','')}</p>
    <p style="color:#94A3B8;font-size:12px;margin:0;">{r1.get('description','')}</p>
  </div>
  <div style="border-left:3px solid #3B82F6;padding-left:16px;margin:0 0 14px;">
    <p style="color:#FFFFFF;font-size:13px;font-weight:700;margin:0 0 4px;">{r2.get('title','')}</p>
    <p style="color:#94A3B8;font-size:12px;margin:0;">{r2.get('description','')}</p>
  </div>
  <div style="border-left:3px solid #D97706;padding-left:16px;margin:0 0 32px;">
    <p style="color:#FFFFFF;font-size:13px;font-weight:700;margin:0 0 4px;">{r3.get('title','')}</p>
    <p style="color:#94A3B8;font-size:12px;margin:0;">{r3.get('description','')}</p>
  </div>

  <div style="text-align:center;margin:0 0 32px;">
    <a href="https://decision-speed.preview.emergentagent.com/roadmap"
       style="display:inline-block;background:#FFFFFF;color:#000000;padding:14px 36px;font-size:12px;font-weight:700;text-decoration:none;letter-spacing:2px;">
      JETZT 30-TAGE-PLAN STARTEN
    </a>
  </div>

  <div style="background:#0D1829;border:1px solid #7C4A00;padding:24px;text-align:center;">
    <p style="color:#D97706;font-size:9px;letter-spacing:4px;margin:0 0 8px;text-transform:uppercase;">EXKLUSIV FUR DICH</p>
    <p style="color:#FFFFFF;font-size:18px;font-weight:700;margin:0 0 6px;">Kostenloser Zugang zum AI Learn Space</p>
    <p style="color:#94A3B8;font-size:12px;margin:0 0 16px;">7 Kurse. KI-Coach 24/7. Strategische Dominanz.</p>
    <a href="https://decision-speed.preview.emergentagent.com/close"
       style="display:inline-block;background:#D97706;color:#000000;padding:12px 28px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:2px;">
      KOSTENLOS STARTEN
    </a>
  </div>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid #27272A;">
  <p style="color:#374151;font-size:11px;margin:0;text-align:center;">
    EMERGENT Diagnostic Hub &nbsp;|&nbsp; Leadership in the Age of AI
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>"""


@api_router.get("/")
async def root():
    return {"message": "EMERGENT Diagnostic Hub API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
