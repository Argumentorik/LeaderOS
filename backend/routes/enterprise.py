"""Enterprise Funnel — 12-question diagnosis for team training leads."""
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone

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
