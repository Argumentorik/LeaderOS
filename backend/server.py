from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import httpx

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
    custom_role: Optional[str] = None
    consent_privacy: bool = True
    consent_marketing: bool = False

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

class AuthSession(BaseModel):
    session_id: str


# --- Auth Helper ---
async def get_current_user(request: Request) -> Optional[dict]:
    """Get current user from session token cookie or Authorization header"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


# --- Auth Endpoints ---

@api_router.post("/auth/session")
async def exchange_session(data: AuthSession, response: Response):
    """Exchange Emergent OAuth session_id for session_token"""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": data.session_id}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = resp.json()
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture", "")
    emergent_session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user.get("user_id") or existing_user.get("session_id")
        # Update name/picture if changed
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture, "user_id": user_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": None,
            "consent_privacy": True,
            "consent_marketing": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user


@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}


@api_router.post("/auth/update-profile")
async def update_profile(request: Request):
    """Update user profile (role, consent, etc.)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = await request.json()
    update_fields = {}
    
    if "role" in data:
        update_fields["role"] = data["role"]
    if "custom_role" in data:
        update_fields["custom_role"] = data["custom_role"]
    if "consent_privacy" in data:
        update_fields["consent_privacy"] = data["consent_privacy"]
    if "consent_marketing" in data:
        update_fields["consent_marketing"] = data["consent_marketing"]
    
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_fields}
        )
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated_user


# --- Health & Basic Endpoints ---

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "WLADHUB Leadership Diagnose"}


@api_router.post("/user/create")
async def create_user(data: UserCreate):
    """Create user for non-OAuth flow (legacy support)"""
    session_id = str(uuid.uuid4())
    doc = {
        "session_id": session_id,
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "name": data.name,
        "email": data.email,
        "role": data.role,
        "custom_role": data.custom_role,
        "consent_privacy": data.consent_privacy,
        "consent_marketing": data.consent_marketing,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(doc)
    return {"session_id": session_id, "name": data.name, "email": data.email, "role": data.role}


@api_router.post("/quiz/generate-report")
async def generate_report(data: QuizSubmit):
    user = await db.users.find_one({"session_id": data.session_id}, {"_id": 0})
    if not user:
        # Try finding by user_id
        user = await db.users.find_one({"user_id": data.session_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate scores per category and layer
    cat_scores = {}
    layer_scores = {"ai_literacy": [], "rhetoric": [], "strategic_eq": []}

    for ans in data.answers:
        cat = ans.category
        if cat not in cat_scores:
            cat_scores[cat] = []
        cat_scores[cat].append(ans.score)

        layer = ans.layer
        if layer in layer_scores:
            layer_scores[layer].append(ans.score)

    # Average per category (out of 100)
    cat_avg = {k: int(sum(v) / len(v) * 25) for k, v in cat_scores.items() if v}
    layer_avg = {k: int(sum(v) / len(v) * 25) for k, v in layer_scores.items() if v}
    total_avg = int(sum(cat_avg.values()) / len(cat_avg)) if cat_avg else 50

    # Generate AI narrative
    narrative = {}
    if EMERGENT_LLM_KEY:
        try:
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"report_{data.session_id}", system_message="Du bist ein Executive Leadership Coach.")
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
            prompt = f"""Analysiere dieses Leadership-Profil auf Deutsch.

Benutzer: {user.get('name', 'Leader')}, Rolle: {user.get('role', 'Führungskraft')}

KATEGORIE-SCORES (0-100):
{json.dumps(cat_avg, indent=2)}

LAYER-SCORES (0-100):
- KI-Kompetenz (ai_literacy): {layer_avg.get('ai_literacy', 50)}
- Boardroom-Rhetorik (rhetoric): {layer_avg.get('rhetoric', 50)}
- Strategisches EQ (strategic_eq): {layer_avg.get('strategic_eq', 50)}

GESAMT: {total_avg}%

Erstelle eine professionelle Analyse mit diesen Abschnitten (kurz und prägnant, max 2-3 Sätze pro Abschnitt):

1. profile_title: Ein passender Titel für dieses Führungsprofil (z.B. "Der strategische Visionär")
2. executive_summary: Kernaussage über die Stärken und das Potenzial
3. ai_literacy_analysis: Bewertung der KI-Kompetenz
4. rhetoric_analysis: Bewertung der Kommunikationsstärke
5. eq_analysis: Bewertung der emotionalen Intelligenz
6. top_strength: Die größte Stärke
7. growth_priority: Die wichtigste Entwicklungspriorität
8. recommendation_1: {{title, description}} - Erste Empfehlung
9. recommendation_2: {{title, description}} - Zweite Empfehlung
10. recommendation_3: {{title, description}} - Dritte Empfehlung
11. urgency_message: Warum jetzt handeln? (motivierend, nicht bedrohlich)
12. closing_statement: Ein inspirierender Abschlusssatz

Antworte NUR mit validem JSON."""

            response = await chat.send_message(UserMessage(text=prompt))
            text = response.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            narrative = json.loads(text)
        except Exception as e:
            logger.error(f"AI narrative error: {e}")
            narrative = {
                "profile_title": "Leadership-Profil",
                "executive_summary": "Dein individuelles Führungsprofil wurde analysiert."
            }

    # Improved 5+1 Leadership Roles Scoring Matrix
    # Each category contributes to multiple roles with weighted coefficients
    role_weights = {
        "communicator": {"rhetorik": 0.50, "fuehrung": 0.15, "eq": 0.15, "kritisches_denken": 0.10, "entscheidung": 0.05, "strategie": 0.05},
        "manager": {"entscheidung": 0.40, "kritisches_denken": 0.20, "fuehrung": 0.15, "strategie": 0.15, "rhetorik": 0.05, "eq": 0.05},
        "team_leader": {"fuehrung": 0.40, "eq": 0.25, "rhetorik": 0.15, "entscheidung": 0.10, "kritisches_denken": 0.05, "strategie": 0.05},
        "psychologist": {"eq": 0.45, "fuehrung": 0.20, "rhetorik": 0.15, "kritisches_denken": 0.10, "entscheidung": 0.05, "strategie": 0.05},
        "problem_solver": {"kritisches_denken": 0.35, "entscheidung": 0.25, "strategie": 0.15, "fuehrung": 0.10, "rhetorik": 0.10, "eq": 0.05},
        "innovator": {"strategie": 0.45, "kritisches_denken": 0.20, "entscheidung": 0.15, "rhetorik": 0.10, "fuehrung": 0.05, "eq": 0.05},
    }
    
    leadership_roles = {}
    for role, weights in role_weights.items():
        score = sum(cat_avg.get(cat, 50) * weight for cat, weight in weights.items())
        leadership_roles[role] = int(round(score))
    
    # Determine strongest and weakest roles
    sorted_roles = sorted(leadership_roles.items(), key=lambda x: x[1], reverse=True)
    strongest_role = sorted_roles[0][0]
    weakest_role = sorted_roles[-1][0]
    
    role_labels = {
        "communicator": "Kommunikator",
        "manager": "Manager",
        "team_leader": "Team Leader",
        "psychologist": "Psychologe",
        "problem_solver": "Problemlöser",
        "innovator": "Innovator"
    }

    # ROI estimates
    roi = {
        "hours_saved": min(12, max(3, int(layer_avg.get('ai_literacy', 50) / 10))),
        "decision_speed": round(1 + (total_avg / 50), 1),
        "performance_boost": min(35, max(10, int(total_avg / 3)))
    }

    report = {
        "session_id": data.session_id,
        "user": {"name": user.get("name"), "role": user.get("role"), "email": user.get("email")},
        "cat_scores": cat_avg,
        "layer_scores": layer_avg,
        "leadership_roles": leadership_roles,
        "strongest_role": {"key": strongest_role, "label": role_labels[strongest_role], "score": leadership_roles[strongest_role]},
        "weakest_role": {"key": weakest_role, "label": role_labels[weakest_role], "score": leadership_roles[weakest_role]},
        "avg_total": total_avg,
        "roi": roi,
        "narrative": narrative,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.reports.insert_one({**report, "report_id": str(uuid.uuid4())})
    return report


@api_router.get("/report/{session_id}")
async def get_report(session_id: str):
    report = await db.reports.find_one({"session_id": session_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@api_router.post("/coach/chat")
async def coach_chat(data: CoachMessage):
    if not EMERGENT_LLM_KEY:
        return {"response": "Der WLADBOT ist derzeit nicht verfügbar."}

    # Get user context
    user = await db.users.find_one({"session_id": data.session_id}, {"_id": 0})
    if not user:
        user = await db.users.find_one({"user_id": data.session_id}, {"_id": 0})
    
    report = await db.reports.find_one({"session_id": data.session_id}, {"_id": 0})

    context = f"""Du bist der WladBot – ein motivierender AI Leadership-Coach. 
Du sprichst auf Deutsch. Du bist nahbar, direkt und ehrlich. Du nimmst die Leute auf die Transformation mit und machst sie neugierig.
Du duzt den Benutzer. Halte deine Antworten kurz (2-4 Sätze). Sei konkret, nicht generisch.
Wenn der Benutzer persönliche Herausforderungen teilt, zeige Empathie und gib einen konkreten nächsten Schritt.
Am Ende einer Konversation kannst du beiläufig erwähnen, dass es die Möglichkeit gibt, mit einem AI Experten zu sprechen – aber vermarkte es nicht!

Benutzer: {user.get('name', 'Leader') if user else 'Leader'}
Rolle: {user.get('role', 'Führungskraft') if user else 'Führungskraft'}
"""
    if report:
        context += f"""
Profil-Score: {report.get('avg_total', 50)}%
Stärke: {report.get('narrative', {}).get('top_strength', 'unbekannt')}
Wachstumspriorität: {report.get('narrative', {}).get('growth_priority', 'unbekannt')}
"""

    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"coach_{data.session_id}", system_message=context)
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        response = await chat.send_message(UserMessage(text=data.message))
        return {"response": response}
    except Exception as e:
        logger.error(f"Coach error: {e}")
        return {"response": "Ein Fehler ist aufgetreten. Bitte versuche es erneut."}


@api_router.post("/email/send-report")
async def send_report_email(data: EmailSend):
    report = await db.reports.find_one({"session_id": data.session_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if not RESEND_API_KEY or RESEND_API_KEY == "your_resend_api_key_here":
        return {"success": False, "message": "Email service not configured"}

    user = report.get("user", {})
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email found")

    narrative = report.get("narrative", {})
    html = generate_email_html(report, user, narrative)

    try:
        import resend
        resend.api_key = RESEND_API_KEY
        resp = resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": f"Dein WLADHUB Leadership-Report | {narrative.get('profile_title', 'Leadership-Profil')}",
            "html": html
        })
        return {"success": True, "id": resp.get("id")}
    except Exception as e:
        logger.error(f"Email error: {e}")
        return {"success": False, "error": str(e)}


def generate_email_html(report, user, narrative):
    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #030303; color: #ffffff; padding: 40px;">
<div style="max-width: 600px; margin: 0 auto;">
<h1 style="color: #F59E0B;">WLADHUB Leadership-Report</h1>
<p>Hallo {user.get('name', 'Leader')},</p>
<p>Dein persönlicher Leadership-Report ist fertig.</p>

<div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin: 20px 0;">
<h2 style="color: #F59E0B; margin-top: 0;">{narrative.get('profile_title', 'Dein Profil')}</h2>
<p>{narrative.get('executive_summary', '')}</p>
</div>

<h3>Deine Scores</h3>
<p><strong>Gesamt:</strong> {report.get('avg_total', 50)}%</p>
<p><strong>KI-Kompetenz:</strong> {report.get('layer_scores', {}).get('ai_literacy', 50)}%</p>
<p><strong>Boardroom-Rhetorik:</strong> {report.get('layer_scores', {}).get('rhetoric', 50)}%</p>
<p><strong>Strategisches EQ:</strong> {report.get('layer_scores', {}).get('strategic_eq', 50)}%</p>

<div style="margin-top: 30px;">
<a href="https://wladhub.com" style="background: #F59E0B; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 100px; font-weight: bold;">
Zur WLADBOT Plattform
</a>
</div>

<p style="margin-top: 40px; color: #666; font-size: 12px;">
© 2025 WLADHUB. Alle Rechte vorbehalten.<br>
Du erhältst diese E-Mail, weil du die WLADHUB Leadership-Diagnose durchgeführt hast.
</p>
</div>
</body></html>"""


# --- Privacy & Legal ---

@api_router.get("/privacy-policy")
async def privacy_policy():
    return {
        "title": "Datenschutzerklärung",
        "last_updated": "2025-01-01",
        "content": {
            "data_collection": "Wir erheben Name, E-Mail und Diagnose-Antworten.",
            "data_usage": "Daten werden zur Erstellung deines Leadership-Reports verwendet.",
            "data_storage": "Daten werden sicher auf EU-Servern gespeichert.",
            "data_deletion": "Du kannst jederzeit die Löschung deiner Daten anfordern.",
            "cookies": "Wir verwenden notwendige Session-Cookies für die Authentifizierung.",
            "third_parties": "Wir teilen keine Daten mit Dritten ohne deine Zustimmung.",
            "contact": "Datenschutz-Anfragen: datenschutz@wladhub.com"
        }
    }


@api_router.delete("/user/delete-data")
async def delete_user_data(request: Request):
    """GDPR: Delete all user data"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = user["user_id"]
    
    # Delete all user data
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.reports.delete_many({"session_id": user_id})
    
    return {"message": "All your data has been deleted"}


@api_router.get("/")
async def root():
    return {"message": "WLADHUB Leadership Diagnose API"}

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
