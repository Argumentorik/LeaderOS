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
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import json
import httpx
import asyncio
import resend
from email_templates import welcome_email, report_email, plan_reminder_email, payment_confirmation_email

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# Configure Resend
if RESEND_API_KEY and RESEND_API_KEY != "your_resend_api_key_here":
    resend.api_key = RESEND_API_KEY

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

class LicenseKeyActivate(BaseModel):
    license_key: str
    email: Optional[str] = None

class LicenseKeyCreate(BaseModel):
    plan: str  # "standard" or "fasttrack"
    email: Optional[str] = None
    name: Optional[str] = None
    notes: Optional[str] = None

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

async def fetch_auth_data(session_id: str):
    """Fetch user data from Emergent OAuth."""
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        return resp.json()


async def upsert_user(auth_data: dict) -> str:
    """Create or update user from auth data, returns user_id."""
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture", "")

    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user.get("user_id") or existing_user.get("session_id")
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture, "user_id": user_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name, "picture": picture,
            "role": None, "consent_privacy": True, "consent_marketing": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return user_id


async def create_session(user_id: str, response: Response) -> str:
    """Create a new session and set cookie."""
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at.isoformat(), "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60
    )
    return session_token


@api_router.post("/auth/session")
async def exchange_session(data: AuthSession, response: Response):
    """Exchange Emergent OAuth session_id for session_token"""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try:
        auth_data = await fetch_auth_data(data.session_id)
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

    user_id = await upsert_user(auth_data)
    await create_session(user_id, response)

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
    # Send welcome email in background
    asyncio.create_task(send_welcome_email_background(data.name, data.email, data.role))
    return {"session_id": session_id, "name": data.name, "email": data.email, "role": data.role}


def calculate_category_scores(answers):
    """Calculate average scores per category and layer."""
    cat_scores = {}
    layer_scores = {"ai_literacy": [], "rhetoric": [], "strategic_eq": []}

    for ans in answers:
        cat = ans.category
        if cat not in cat_scores:
            cat_scores[cat] = []
        cat_scores[cat].append(ans.score)
        layer = ans.layer
        if layer in layer_scores:
            layer_scores[layer].append(ans.score)

    cat_avg = {k: int(sum(v) / len(v) * 25) for k, v in cat_scores.items() if v}
    layer_avg = {k: int(sum(v) / len(v) * 25) for k, v in layer_scores.items() if v}
    total_avg = int(sum(cat_avg.values()) / len(cat_avg)) if cat_avg else 50
    return cat_avg, layer_avg, total_avg


ROLE_WEIGHTS = {
    "communicator": {"rhetorik": 0.50, "fuehrung": 0.15, "eq": 0.15, "kritisches_denken": 0.10, "entscheidung": 0.05, "strategie": 0.05},
    "manager": {"entscheidung": 0.40, "kritisches_denken": 0.20, "fuehrung": 0.15, "strategie": 0.15, "rhetorik": 0.05, "eq": 0.05},
    "team_leader": {"fuehrung": 0.40, "eq": 0.25, "rhetorik": 0.15, "entscheidung": 0.10, "kritisches_denken": 0.05, "strategie": 0.05},
    "psychologist": {"eq": 0.45, "fuehrung": 0.20, "rhetorik": 0.15, "kritisches_denken": 0.10, "entscheidung": 0.05, "strategie": 0.05},
    "problem_solver": {"kritisches_denken": 0.35, "entscheidung": 0.25, "strategie": 0.15, "fuehrung": 0.10, "rhetorik": 0.10, "eq": 0.05},
    "innovator": {"strategie": 0.45, "kritisches_denken": 0.20, "entscheidung": 0.15, "rhetorik": 0.10, "fuehrung": 0.05, "eq": 0.05},
}

ROLE_LABELS = {
    "communicator": "Kommunikator",
    "manager": "Manager",
    "team_leader": "Team Leader",
    "psychologist": "Psychologe",
    "problem_solver": "Problemlöser",
    "innovator": "Innovator"
}


def calculate_leadership_roles(cat_avg):
    """Calculate 6 leadership roles from category scores using weighted matrix."""
    roles = {}
    for role, weights in ROLE_WEIGHTS.items():
        score = sum(cat_avg.get(cat, 50) * weight for cat, weight in weights.items())
        roles[role] = int(round(score))

    sorted_roles = sorted(roles.items(), key=lambda x: x[1], reverse=True)
    strongest = sorted_roles[0][0]
    weakest = sorted_roles[-1][0]
    return roles, strongest, weakest


async def generate_ai_narrative(session_id, user, cat_avg, layer_avg, total_avg):
    """Generate AI narrative using Claude."""
    if not EMERGENT_LLM_KEY:
        return {"profile_title": "Leadership-Profil", "executive_summary": "Dein individuelles Führungsprofil wurde analysiert."}

    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"report_{session_id}", system_message="Du bist ein Executive Leadership Coach.")
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
        return json.loads(text)
    except Exception as e:
        logger.error(f"AI narrative error: {e}")
        return {"profile_title": "Leadership-Profil", "executive_summary": "Dein individuelles Führungsprofil wurde analysiert."}


def calculate_roi(layer_avg, total_avg):
    """Calculate ROI estimates."""
    return {
        "hours_saved": min(12, max(3, int(layer_avg.get('ai_literacy', 50) / 10))),
        "decision_speed": round(1 + (total_avg / 50), 1),
        "performance_boost": min(35, max(10, int(total_avg / 3)))
    }


@api_router.post("/quiz/generate-report")
async def generate_report(data: QuizSubmit):
    user = await db.users.find_one({"session_id": data.session_id}, {"_id": 0})
    if not user:
        user = await db.users.find_one({"user_id": data.session_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cat_avg, layer_avg, total_avg = calculate_category_scores(data.answers)
    narrative = await generate_ai_narrative(data.session_id, user, cat_avg, layer_avg, total_avg)
    leadership_roles, strongest_role, weakest_role = calculate_leadership_roles(cat_avg)
    roi = calculate_roi(layer_avg, total_avg)

    report = {
        "session_id": data.session_id,
        "user": {"name": user.get("name"), "role": user.get("role"), "email": user.get("email")},
        "cat_scores": cat_avg,
        "layer_scores": layer_avg,
        "leadership_roles": leadership_roles,
        "strongest_role": {"key": strongest_role, "label": ROLE_LABELS[strongest_role], "score": leadership_roles[strongest_role]},
        "weakest_role": {"key": weakest_role, "label": ROLE_LABELS[weakest_role], "score": leadership_roles[weakest_role]},
        "avg_total": total_avg,
        "roi": roi,
        "narrative": narrative,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.reports.insert_one({**report, "report_id": str(uuid.uuid4())})

    # Auto-send report email in background
    user_email = user.get("email")
    if user_email:
        async def _send_report():
            try:
                email_data = report_email(user.get("name", "Leader"), report)
                resp = await asyncio.to_thread(resend.Emails.send, {
                    "from": f"Wlad von WLADHUB <{SENDER_EMAIL}>",
                    "to": [user_email],
                    "subject": email_data["subject"],
                    "html": email_data["html"],
                })
                logger.info(f"Auto report email sent to {user_email}")
                await db.email_log.insert_one({
                    "type": "report_auto", "email": user_email, "session_id": data.session_id,
                    "sent_at": datetime.now(timezone.utc).isoformat(), "resend_id": resp.get("id")
                })
            except Exception as e:
                logger.error(f"Auto report email error: {e}")
        if RESEND_API_KEY and RESEND_API_KEY != "your_resend_api_key_here":
            asyncio.create_task(_send_report())

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
async def send_report_email_endpoint(data: EmailSend):
    """Send report email after quiz completion"""
    report = await db.reports.find_one({"session_id": data.session_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if not RESEND_API_KEY or RESEND_API_KEY == "your_resend_api_key_here":
        return {"success": False, "message": "Email service not configured"}

    user = report.get("user", {})
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email found")

    email_data = report_email(user.get("name", "Leader"), report)

    try:
        resp = await asyncio.to_thread(resend.Emails.send, {
            "from": f"Wlad von WLADHUB <{SENDER_EMAIL}>",
            "to": [email],
            "subject": email_data["subject"],
            "html": email_data["html"],
        })
        logger.info(f"Report email sent to {email}: {resp}")
        await db.email_log.insert_one({
            "type": "report", "email": email, "session_id": data.session_id,
            "sent_at": datetime.now(timezone.utc).isoformat(), "resend_id": resp.get("id")
        })
        return {"success": True, "id": resp.get("id")}
    except Exception as e:
        logger.error(f"Email error: {e}")
        return {"success": False, "error": str(e)}


async def send_welcome_email_background(name: str, email: str, role: str):
    """Fire-and-forget welcome email"""
    if not RESEND_API_KEY or RESEND_API_KEY == "your_resend_api_key_here":
        return
    try:
        email_data = welcome_email(name, role)
        resp = await asyncio.to_thread(resend.Emails.send, {
            "from": f"Wlad von WLADHUB <{SENDER_EMAIL}>",
            "to": [email],
            "subject": email_data["subject"],
            "html": email_data["html"],
        })
        logger.info(f"Welcome email sent to {email}: {resp}")
        await db.email_log.insert_one({
            "type": "welcome", "email": email,
            "sent_at": datetime.now(timezone.utc).isoformat(), "resend_id": resp.get("id")
        })
    except Exception as e:
        logger.error(f"Welcome email error: {e}")


@api_router.post("/email/send-plan-reminder")
async def send_plan_reminder_endpoint(data: dict):
    """Send 30-day plan weekly reminder"""
    session_id = data.get("session_id")
    week = data.get("week", 1)

    user = await db.users.find_one({"session_id": session_id}, {"_id": 0})
    if not user:
        user = await db.users.find_one({"user_id": session_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    report = await db.reports.find_one({"session_id": session_id}, {"_id": 0})
    weakest_label = "Leadership"
    if report:
        weakest_label = report.get("weakest_role", {}).get("label", "Leadership")

    email = user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email found")

    email_data = plan_reminder_email(user.get("name", "Leader"), week, weakest_label)

    try:
        resp = await asyncio.to_thread(resend.Emails.send, {
            "from": f"Wlad von WLADHUB <{SENDER_EMAIL}>",
            "to": [email],
            "subject": email_data["subject"],
            "html": email_data["html"],
        })
        logger.info(f"Plan reminder W{week} sent to {email}")
        await db.email_log.insert_one({
            "type": f"plan_week_{week}", "email": email, "session_id": session_id,
            "sent_at": datetime.now(timezone.utc).isoformat(), "resend_id": resp.get("id")
        })
        return {"success": True, "id": resp.get("id")}
    except Exception as e:
        logger.error(f"Plan reminder error: {e}")
        return {"success": False, "error": str(e)}


async def send_payment_email_background(email: str, name: str, plan: str, amount: float):
    """Fire-and-forget payment confirmation email"""
    if not RESEND_API_KEY or RESEND_API_KEY == "your_resend_api_key_here":
        return
    try:
        email_data = payment_confirmation_email(name, plan, amount)
        resp = await asyncio.to_thread(resend.Emails.send, {
            "from": f"Wlad von WLADHUB <{SENDER_EMAIL}>",
            "to": [email],
            "subject": email_data["subject"],
            "html": email_data["html"],
        })
        logger.info(f"Payment email sent to {email}: {resp}")
        await db.email_log.insert_one({
            "type": "payment_confirmation", "email": email, "plan": plan,
            "sent_at": datetime.now(timezone.utc).isoformat(), "resend_id": resp.get("id")
        })
    except Exception as e:
        logger.error(f"Payment email error: {e}")


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


# --- Stripe Payment Packages (server-side only, never from frontend) ---
PACKAGES = {
    "standard_yearly": {"name": "Standard – Leadership System", "amount": 997.00, "currency": "eur", "plan": "standard", "billing": "yearly"},
    "standard_monthly": {"name": "Standard – Leadership System (Monatsrate)", "amount": 83.08, "currency": "eur", "plan": "standard", "billing": "monthly"},
    "fasttrack_yearly": {"name": "Fast Track – Leadership Accelerator · AI Learning Path", "amount": 4797.00, "currency": "eur", "plan": "fasttrack", "billing": "yearly"},
}

class CreateCheckoutRequest(BaseModel):
    package_id: str
    origin_url: str
    email: Optional[str] = None
    user_name: Optional[str] = None
    user_session_id: Optional[str] = None

@api_router.post("/payments/create-checkout")
async def create_checkout(req: CreateCheckoutRequest, http_request: Request):
    if req.package_id not in PACKAGES:
        raise HTTPException(status_code=400, detail="Ungültiges Paket")
    
    package = PACKAGES[req.package_id]
    
    host_url = str(http_request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{req.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/close"
    
    metadata = {
        "package_id": req.package_id,
        "plan": package["plan"],
        "billing": package["billing"],
        "email": req.email or "",
    }
    
    checkout_request = CheckoutSessionRequest(
        amount=package["amount"],
        currency=package["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Store transaction in DB
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "package_id": req.package_id,
        "package_name": package["name"],
        "amount": package["amount"],
        "currency": package["currency"],
        "plan": package["plan"],
        "billing": package["billing"],
        "email": req.email or "",
        "name": req.user_name or "",
        "user_session_id": req.user_session_id or "",
        "payment_status": "initiated",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, http_request: Request):
    host_url = str(http_request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction in DB (only once)
    existing = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if existing and existing.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": checkout_status.payment_status,
                "status": checkout_status.status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "amount_total": checkout_status.amount_total,
        "currency": checkout_status.currency,
        "metadata": checkout_status.metadata,
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": "paid",
                    "status": "complete",
                    "event_type": webhook_response.event_type,
                    "event_id": webhook_response.event_id,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }}
            )
            # Auto-generate license key + send email
            tx = await db.payment_transactions.find_one({"session_id": webhook_response.session_id}, {"_id": 0})
            if tx:
                plan = tx.get("plan", "standard")
                email = tx.get("email")
                name = tx.get("name") or email or "Leader"
                key = await create_license_key_internal(plan=plan, email=email, name=name, source="stripe")
                # Update transaction with key
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"license_key": key}}
                )
                if email:
                    asyncio.create_task(send_payment_email_background(email, name, plan, tx.get("amount", 997)))
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


import secrets
import string


def generate_license_key() -> str:
    """Generate a WLAD-XXXX-XXXX-XXXX format license key."""
    chars = string.ascii_uppercase + string.digits
    parts = [''.join(secrets.choice(chars) for _ in range(4)) for _ in range(3)]
    return f"WLAD-{parts[0]}-{parts[1]}-{parts[2]}"


async def create_license_key_internal(plan: str, email: str = None, name: str = None, source: str = "stripe", notes: str = None) -> str:
    """Create a license key and store in DB. Returns the key."""
    key = generate_license_key()
    # Ensure uniqueness
    while await db.license_keys.find_one({"key": key}):
        key = generate_license_key()

    plan_config = {
        "standard": {"name": "Standard – Leadership System", "duration_days": 365, "includes_calls": False},
        "fasttrack": {"name": "Fast Track – Leadership Accelerator", "duration_days": 365, "includes_calls": True},
    }
    config = plan_config.get(plan, plan_config["standard"])

    doc = {
        "key": key,
        "plan": plan,
        "plan_name": config["name"],
        "status": "active",  # active, used, revoked, expired
        "email": email,
        "name": name,
        "source": source,
        "notes": notes,
        "includes_calls": config["includes_calls"],
        "duration_days": config["duration_days"],
        "activated_by": None,
        "activated_at": None,
        "expires_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.license_keys.insert_one(doc)
    logger.info(f"License key created: {key} ({plan}) for {email or 'unassigned'}")
    return key


# --- License Key Endpoints ---

@api_router.post("/license/create")
async def create_license_key_endpoint(data: LicenseKeyCreate):
    """Admin: Create a license key manually."""
    key = await create_license_key_internal(
        plan=data.plan, email=data.email, name=data.name,
        source="manual", notes=data.notes
    )

    # Send license key email if email provided
    if data.email and RESEND_API_KEY and RESEND_API_KEY != "your_resend_api_key_here":
        try:
            from email_templates import payment_confirmation_email
            amount = 4797.0 if data.plan == "fasttrack" else 997.0
            email_data = payment_confirmation_email(data.name or "Leader", data.plan, amount)
            # Add the license key to the email subject
            await asyncio.to_thread(resend.Emails.send, {
                "from": f"Wlad von WLADHUB <{SENDER_EMAIL}>",
                "to": [data.email],
                "subject": f"Dein License Key: {key} — WLADHUB",
                "html": email_data["html"].replace("Sofort aktiv", f"Key: <strong>{key}</strong>"),
            })
            logger.info(f"License key email sent to {data.email}")
        except Exception as e:
            logger.error(f"License key email error: {e}")

    return {"key": key, "plan": data.plan, "status": "active"}


@api_router.post("/license/activate")
async def activate_license_key(data: LicenseKeyActivate):
    """User: Activate a license key and get redirected to leader-os.de."""
    key_doc = await db.license_keys.find_one({"key": data.license_key.upper().strip()}, {"_id": 0})

    if not key_doc:
        raise HTTPException(status_code=404, detail="Ungültiger License Key. Bitte prüfe deine Eingabe.")

    if key_doc["status"] == "used":
        raise HTTPException(status_code=400, detail="Dieser Key wurde bereits aktiviert.")

    if key_doc["status"] == "revoked":
        raise HTTPException(status_code=400, detail="Dieser Key wurde deaktiviert.")

    if key_doc["status"] == "expired":
        raise HTTPException(status_code=400, detail="Dieser Key ist abgelaufen.")

    # Activate the key
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=key_doc.get("duration_days", 365))

    await db.license_keys.update_one(
        {"key": data.license_key.upper().strip()},
        {"$set": {
            "status": "used",
            "activated_by": data.email or key_doc.get("email"),
            "activated_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
        }}
    )

    logger.info(f"License key activated: {data.license_key} by {data.email}")

    return {
        "success": True,
        "plan": key_doc["plan"],
        "plan_name": key_doc["plan_name"],
        "includes_calls": key_doc.get("includes_calls", False),
        "expires_at": expires_at.isoformat(),
        "redirect_url": "https://leader-os.de",
        "message": "Key erfolgreich aktiviert! Du wirst zu leader-os.de weitergeleitet.",
    }


@api_router.get("/license/validate/{key}")
async def validate_license_key(key: str):
    """Check if a license key is valid."""
    key_doc = await db.license_keys.find_one({"key": key.upper().strip()}, {"_id": 0})
    if not key_doc:
        return {"valid": False, "message": "Key nicht gefunden"}

    if key_doc["status"] == "active":
        return {"valid": True, "status": "active", "plan": key_doc["plan"], "message": "Key ist gültig und bereit zur Aktivierung"}

    if key_doc["status"] == "used":
        expires_at = key_doc.get("expires_at")
        if expires_at:
            exp = datetime.fromisoformat(expires_at)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < datetime.now(timezone.utc):
                await db.license_keys.update_one({"key": key.upper().strip()}, {"$set": {"status": "expired"}})
                return {"valid": False, "status": "expired", "message": "Key ist abgelaufen"}
        return {"valid": True, "status": "used", "plan": key_doc["plan"], "activated_by": key_doc.get("activated_by"), "expires_at": expires_at}

    return {"valid": False, "status": key_doc["status"], "message": f"Key Status: {key_doc['status']}"}


@api_router.get("/license/list")
async def list_license_keys():
    """Admin: List all license keys."""
    keys = await db.license_keys.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"keys": keys, "total": len(keys)}


@api_router.post("/license/revoke/{key}")
async def revoke_license_key(key: str):
    """Admin: Revoke a license key."""
    result = await db.license_keys.update_one(
        {"key": key.upper().strip()},
        {"$set": {"status": "revoked", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Key nicht gefunden")
    return {"success": True, "message": f"Key {key} wurde deaktiviert"}


@api_router.get("/")
async def root():
    return {"message": "WLADHUB Leadership Diagnose API"}


# --- Admin Dashboard Endpoints ---

@api_router.get("/admin/stats")
async def admin_stats():
    """Dashboard statistics for admin panel."""
    from datetime import timedelta as td

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    total_users = await db.users.count_documents({})
    total_reports = await db.reports.count_documents({})
    total_keys = await db.license_keys.count_documents({})
    active_keys = await db.license_keys.count_documents({"status": "active"})
    used_keys = await db.license_keys.count_documents({"status": "used"})

    # Today's stats
    users_today = await db.users.count_documents({"created_at": {"$gte": today_start}})
    reports_today = await db.reports.count_documents({"created_at": {"$gte": today_start}})

    # Emails sent
    total_emails = await db.email_log.count_documents({})
    emails_today = await db.email_log.count_documents({"sent_at": {"$gte": today_start}})

    # Transactions
    total_transactions = await db.payment_transactions.count_documents({})
    paid_transactions = await db.payment_transactions.count_documents({"payment_status": "paid"})

    # Revenue
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.payment_transactions.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0

    # Conversion rates
    diagnosis_to_report = (total_reports / total_users * 100) if total_users > 0 else 0
    report_to_payment = (paid_transactions / total_reports * 100) if total_reports > 0 else 0

    # Last 7 days data
    seven_days_ago = (now - td(days=7)).isoformat()
    users_7d = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
    reports_7d = await db.reports.count_documents({"created_at": {"$gte": seven_days_ago}})

    return {
        "overview": {
            "total_users": total_users,
            "total_reports": total_reports,
            "total_revenue": total_revenue,
            "total_keys": total_keys,
        },
        "today": {
            "users": users_today,
            "reports": reports_today,
            "emails": emails_today,
        },
        "keys": {
            "total": total_keys,
            "active": active_keys,
            "used": used_keys,
        },
        "conversions": {
            "diagnosis_to_report": round(diagnosis_to_report, 1),
            "report_to_payment": round(report_to_payment, 1),
        },
        "emails": {
            "total": total_emails,
            "today": emails_today,
        },
        "transactions": {
            "total": total_transactions,
            "paid": paid_transactions,
        },
        "last_7_days": {
            "users": users_7d,
            "reports": reports_7d,
        },
    }


@api_router.get("/admin/users")
async def admin_users():
    """List all users with enriched data (report status, keys)."""
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

    # Batch-fetch report session_ids and license key emails for matching
    report_sessions = set()
    async for r in db.reports.find({}, {"session_id": 1, "_id": 0}):
        report_sessions.add(r["session_id"])

    key_map = {}
    async for k in db.license_keys.find({}, {"_id": 0, "key": 1, "email": 1, "status": 1, "plan": 1}):
        if k.get("email"):
            key_map[k["email"]] = {"key": k["key"], "status": k["status"], "plan": k["plan"]}

    enriched = []
    for u in users:
        sid = u.get("session_id") or u.get("user_id")
        email = u.get("email", "")
        u["has_report"] = sid in report_sessions
        u["license_key"] = key_map.get(email)
        enriched.append(u)

    return {"users": enriched, "total": len(enriched)}


@api_router.get("/admin/transactions")
async def admin_transactions():
    """List all transactions for admin panel."""
    txs = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"transactions": txs, "total": len(txs)}


@api_router.get("/admin/emails")
async def admin_emails():
    """List all sent emails for admin panel."""
    emails = await db.email_log.find({}, {"_id": 0}).sort("sent_at", -1).to_list(200)
    return {"emails": emails, "total": len(emails)}

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
