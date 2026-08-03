"""Enterprise Funnel — 12-question diagnosis for team training leads."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta

from config import db
from services import get_current_user
from services_actions import record_user_action

router = APIRouter(prefix="/api/enterprise", tags=["enterprise"])


class EnterpriseDiagnosis(BaseModel):
    answers: dict  # q1 through q12
    company_name: Optional[str] = None
    team_size: Optional[str] = None
    contact_email: Optional[str] = None


# Simple lead form (for new Enterprise funnel)
class EnterpriseLeadForm(BaseModel):
    company: str
    name: Optional[str] = None
    email: str
    teamSize: Optional[str] = None
    message: Optional[str] = None
    lang: Optional[str] = "de"


QUESTIONS_DE = [
    {"id": "q1", "q": "Wie viele Führungskräfte hat Ihr Unternehmen?", "options": ["1-5", "6-20", "21-50", "51-200", "200+"]},
    {"id": "q2", "q": "Wie bewerten Sie die aktuelle Führungskultur?", "options": ["Exzellent", "Gut", "Ausbaufähig", "Kritisch"]},
    {"id": "q3", "q": "Nutzt Ihr Team bereits KI im Führungsalltag?", "options": ["Ja, strategisch", "Teilweise", "Kaum", "Gar nicht"]},
    {"id": "q4", "q": "Was ist die größte Herausforderung in Ihrem Team?", "options": ["Kommunikation", "Motivation", "Konflikte", "Delegation", "Entscheidungsfindung", "KI-Integration"]},
    {"id": "q5", "q": "Wie oft bilden Sie Ihre Führungskräfte weiter?", "options": ["Monatlich", "Quartalsweise", "Jährlich", "Selten/Nie"]},
    {"id": "q6", "q": "Budget für Führungskräfteentwicklung pro Jahr?", "options": ["Unter 10.000 EUR", "10.000-50.000 EUR", "50.000-200.000 EUR", "Über 200.000 EUR"]},
    {"id": "q7", "q": "Interesse an Team-Retreats mit Coaching?", "options": ["Sehr interessiert", "Interessiert", "Vielleicht", "Eher nicht"]},
    {"id": "q8", "q": "Bevorzugtes Format für Teamtraining?", "options": ["Präsenz-Workshop", "Online-Training", "Hybrid", "Individuelles Coaching", "Retreat/Offsite"]},
    {"id": "q9", "q": "Wie messen Sie aktuell Führungserfolg?", "options": ["KPIs & Metriken", "Mitarbeiterbefragungen", "360-Grad-Feedback", "Gar nicht systematisch"]},
    {"id": "q10", "q": "Würden Sie ein KI-Leadership-Tool für Ihr Team einsetzen?", "options": ["Sofort", "Nach einer Testphase", "Wenn ROI bewiesen", "Unwahrscheinlich"]},
    {"id": "q11", "q": "Wie wichtig ist eine Leadership-Community für Ihr Team?", "options": ["Sehr wichtig", "Wichtig", "Nice-to-have", "Unwichtig"]},
    {"id": "q12", "q": "Wann planen Sie die nächste Investition in Führungsentwicklung?", "options": ["Diesen Monat", "Dieses Quartal", "Dieses Jahr", "Noch unklar"]},
]

QUESTIONS_EN = [
    {"id": "q1", "q": "How many leaders does your company have?", "options": ["1-5", "6-20", "21-50", "51-200", "200+"]},
    {"id": "q2", "q": "How do you rate the current leadership culture?", "options": ["Excellent", "Good", "Needs improvement", "Critical"]},
    {"id": "q3", "q": "Does your team already use AI in leadership?", "options": ["Yes, strategically", "Partially", "Barely", "Not at all"]},
    {"id": "q4", "q": "What is your team's biggest challenge?", "options": ["Communication", "Motivation", "Conflicts", "Delegation", "Decision-making", "AI Integration"]},
    {"id": "q5", "q": "How often do you train your leaders?", "options": ["Monthly", "Quarterly", "Yearly", "Rarely/Never"]},
    {"id": "q6", "q": "Annual budget for leadership development?", "options": ["Under 10,000 EUR", "10,000-50,000 EUR", "50,000-200,000 EUR", "Over 200,000 EUR"]},
    {"id": "q7", "q": "Interest in team retreats with coaching?", "options": ["Very interested", "Interested", "Maybe", "Probably not"]},
    {"id": "q8", "q": "Preferred format for team training?", "options": ["In-person workshop", "Online training", "Hybrid", "Individual coaching", "Retreat/Offsite"]},
    {"id": "q9", "q": "How do you currently measure leadership success?", "options": ["KPIs & metrics", "Employee surveys", "360-degree feedback", "Not systematically"]},
    {"id": "q10", "q": "Would you deploy an AI leadership tool for your team?", "options": ["Immediately", "After a trial", "If ROI proven", "Unlikely"]},
    {"id": "q11", "q": "How important is a leadership community for your team?", "options": ["Very important", "Important", "Nice-to-have", "Unimportant"]},
    {"id": "q12", "q": "When do you plan your next investment in leadership development?", "options": ["This month", "This quarter", "This year", "Still unclear"]},
]


# Public lead form — used by the marketing landing page (no auth required)
class EnterprisePublicLeadForm(BaseModel):
    company: str
    name: Optional[str] = None
    email: EmailStr
    teamSize: Optional[str] = None
    role: Optional[str] = None
    goals: Optional[str] = None
    wantsOwnRAG: Optional[bool] = False
    lang: Optional[str] = "de"


@router.post("/public-lead")
async def submit_public_enterprise_lead(data: EnterprisePublicLeadForm, request: Request):
    """Submit an enterprise lead from the public marketing landing page.

    This endpoint is intentionally public (no auth) so the /for-teams landing
    page can capture leads before a CEO or team-lead has created an account.
    Rate-limited: max 5 submissions per IP per hour to prevent spam.
    """
    ip = (request.client.host if request.client else None) or "unknown"

    # Rate limit: 5 submissions/hour per IP
    one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    recent = await db.enterprise_leads.count_documents({
        "signup_ip": ip,
        "created_at": {"$gte": one_hour_ago},
    })
    if recent >= 5:
        raise HTTPException(status_code=429, detail="Zu viele Anfragen. Bitte in einer Stunde erneut versuchen.")

    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    lead_doc = {
        "lead_id": lead_id,
        "user_id": None,
        "user_name": data.name or "",
        "user_email": str(data.email),
        "company_name": data.company,
        "team_size": data.teamSize,
        "role": data.role,
        "goals": data.goals,
        "wants_own_rag": bool(data.wantsOwnRAG),
        "contact_email": str(data.email),
        "lang": data.lang,
        "source": "enterprise_landing_public",
        "score": 60 if data.wantsOwnRAG else 50,
        "priority": "hot" if data.wantsOwnRAG else "warm",
        "status": "new",
        "signup_ip": ip,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.enterprise_leads.insert_one(lead_doc)

    # Best-effort auto-acknowledgment email to the lead
    try:
        import asyncio as _asyncio
        from services_email import send_email, _base_layout, BRAND_COLOR, BRAND_DARK
        de = (data.lang or "de") == "de"
        display = (data.name or "").strip() or (data.company or "there")
        subject = "Danke für dein Interesse — LeaderOS Enterprise" if de else "Thanks for your interest — LeaderOS Enterprise"
        body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.14),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.22);border-radius:14px;padding:18px 22px;margin-bottom:24px;">
  <div style="font-size:10px;letter-spacing:0.2em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:6px;">
    {"Anfrage eingegangen" if de else "Request received"}
  </div>
  <div style="font-size:22px;font-weight:900;line-height:1.2;">
    {"Danke, "+display+"." if de else "Thanks, "+display+"."}
  </div>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.65;margin:0 0 20px;">
  {"Wir haben deine Anfrage für <b>"+ (data.company or "") +"</b> erhalten und melden uns innerhalb von 24 Stunden mit einem Terminvorschlag." if de
   else "We received your request for <b>"+ (data.company or "") +"</b> and will get back to you within 24 hours with a time slot."}
</p>
<p style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6;margin:0;">
  {"Falls du inzwischen etwas nachreichen möchtest — antworte einfach auf diese Mail." if de
   else "If you want to add anything in the meantime — just reply to this email."}
</p>
"""
        html = _base_layout(body, preheader="LeaderOS Enterprise — wir melden uns innerhalb von 24h.")
        _asyncio.create_task(send_email(str(data.email), subject, html))
    except Exception:  # pragma: no cover — never block lead capture on email failure
        pass

    return {
        "lead_id": lead_id,
        "message": "Danke! Das Team meldet sich innerhalb von 24 Stunden bei dir."
                    if data.lang == "de"
                    else "Thanks! The team will reach out within 24 hours.",
    }


@router.get("/questions")
async def get_enterprise_questions(lang: str = "de"):
    return QUESTIONS_DE if lang == "de" else QUESTIONS_EN


@router.post("/submit")
async def submit_enterprise_lead(data: EnterpriseLeadForm, request: Request):
    """Submit enterprise lead from simple form (new funnel)."""
    user = await get_current_user(request)

    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    lead_doc = {
        "lead_id": lead_id,
        "user_id": user["user_id"],
        "user_name": data.name or user.get("name", ""),
        "user_email": data.email or user.get("email", ""),
        "company_name": data.company,
        "team_size": data.teamSize,
        "contact_email": data.email,
        "message": data.message,
        "lang": data.lang,
        "source": "enterprise_funnel",
        "score": 50,  # Default warm score for simple form
        "priority": "warm",
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.enterprise_leads.insert_one(lead_doc)
    await record_user_action(user["user_id"], "enterprise_lead", metadata={"company": data.company})

    return {
        "lead_id": lead_id,
        "score": 50,
        "priority": "warm",
        "message": "Vielen Dank! Unser Enterprise-Team wird sich in Kürze bei Ihnen melden." if data.lang == "de" else "Thank you! Our enterprise team will contact you shortly.",
    }


@router.post("/diagnosis")
async def submit_enterprise_diagnosis(data: EnterpriseDiagnosis, request: Request):
    """Submit enterprise diagnosis (12-question form) — generates a lead."""
    user = await get_current_user(request)

    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    lead_doc = {
        "lead_id": lead_id,
        "user_id": user["user_id"],
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "company_name": data.company_name or user.get("company", ""),
        "team_size": data.team_size,
        "contact_email": data.contact_email or user.get("email", ""),
        "answers": data.answers,
        "source": "enterprise_diagnosis",
        "score": 0,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    # Simple scoring
    score = 0
    hot_signals = ["Sofort", "Immediately", "Diesen Monat", "This month", "Sehr interessiert", "Very interested", "Über 200.000 EUR", "Over 200,000 EUR"]
    warm_signals = ["Dieses Quartal", "This quarter", "Interessiert", "Interested", "50.000-200.000 EUR", "50,000-200,000 EUR"]
    for v in data.answers.values():
        if v in hot_signals:
            score += 10
        elif v in warm_signals:
            score += 5
        else:
            score += 2

    lead_doc["score"] = score
    lead_doc["priority"] = "hot" if score >= 80 else "warm" if score >= 50 else "cold"

    await db.enterprise_leads.insert_one(lead_doc)
    await record_user_action(user["user_id"], "enterprise_diagnosis", metadata={"score": score})

    return {
        "lead_id": lead_id,
        "score": score,
        "priority": lead_doc["priority"],
        "message": "Vielen Dank! Unser Enterprise-Team wird sich in Kürze bei Ihnen melden.",
    }


@router.get("/leads")
async def get_enterprise_leads(request: Request):
    """Get enterprise leads (admin)."""
    await get_current_user(request)
    leads = await db.enterprise_leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return leads
