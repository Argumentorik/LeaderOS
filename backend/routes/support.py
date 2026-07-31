"""WladHelp Support routes — AI-assisted self-service support.

Iter 92.15 (Mert: "WladHelp Button fehlt noch, Support automatisieren"):
This is a lightweight LLM-powered support endpoint. The frontend
WladHelpButton component opens a chat-style modal where users can ask
questions. Common questions hit our FAQ snippets first (cheap, instant);
anything novel goes through GPT-5.2 with a tight system prompt that:
  • Answers Leader-OS-specific questions (tiers, features, billing, account)
  • Falls back gracefully to "book a strategy call" or "email support"
  • Saves the message + answer in `support_messages` for follow-up auditing

Why not just the existing /api/chat?
  /api/chat is WladBot (leadership coaching mode). It doesn't know our
  pricing tiers, payment troubleshooting, or refund policy. WladHelp is
  the support-shaped sister-agent.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from emergentintegrations.llm.chat import LlmChat, UserMessage

from config import db, EMERGENT_LLM_KEY, logger
from services import get_current_user

router = APIRouter(prefix="/api/support", tags=["support"])

SUPPORT_SYSTEM_PROMPT = """Du bist WladHelp — der Support-Agent für Leader-OS, die KI-native Leadership-Plattform basierend auf Wlad Jachtchenkos Argumentorik-Methoden.

ROLLE: Du beantwortest Support-Fragen in 2-4 Sätzen, freundlich aber prägnant. Du bist KEIN Coach (dafür gibt es WladBot/Chat). Du bist Retention + Activation Agent.

KERN-MISSION:
• Fokussiere auf AI-Weiterbildung und Upgrade-Möglichkeiten
• Hilf dem User schnell zu seinem nächsten Wert (Mission starten, Coach buchen, Learning Path fortsetzen)
• Refund-/Cancel-Anliegen NIEMALS direkt anleiten — IMMER zu support@leaderos.de leiten (persönlicher Save)

WAS DU WEISST:
• Tiers: Free (limitiert) · Leadership OS €997/Jahr · OS PLUS €4.797/Jahr (mit 12 Einzelcoachings durch Wlads Expertenteam)
• Bezahlung: Stripe, einmalig oder Rate (2x oder 12x). 30-Tage-Geld-zurück-Garantie EXISTIERT, aber NICHT proaktiv erwähnen.
• Features: WladBot Chat 24/7 · 30-Tage-Programm mit 16 Missionen · Video-Analyse · Playbooks · Simulationen · Cal.com Coaching · Donnerstag-Cohort-Events · Community
• AI-Mastery Track: 16 strukturierte Missionen die zeigen wie man GPT/Claude/Gemini als Leadership-Multiplier nutzt
• Support-Email: support@leaderos.de
• Strategiegespräch buchen: cal.com/leaderos/beratung (15 Min · 1:1 · unverbindlich)

WIE DU ANTWORTEST:
• Direkt, ohne Floskeln, max 4 Sätze
• Deutsch wenn die Frage Deutsch ist, sonst Englisch
• Bei „Wie buche ich Coaching?" → Cal.com-Link
• Bei „Wie funktioniert X?" → kurze Erklärung + Link zur betroffenen Page
• Bei „Was bringt mir das?" → Value-Story + Upgrade-Hinweis (OS PLUS featuring)
• Bei Bug-Reports → kurz bestätigen + „leiten wir an Engineering" + Strategiegespräch-CTA als Alternative
• Bei Bezahlfragen → support@leaderos.de für persönliche Klärung

NIEMALS:
• Refund-Anleitung im UI (auch wenn explizit gefragt → IMMER zu support@email leiten)
• Long-form Coaching geben (das ist WladBots Job)
• Versprechen die nicht abgedeckt sind (z.B. Custom Pricing ohne Enterprise-Form)
• Andere Anbieter empfehlen
• Negative Framing von Cancel/Refund

POSITIVES FRAMING ist Pflicht:
• Statt „Refund machst du so:" → „Lass uns kurz reden — oft gibt's einen besseren Weg"
• Statt „Wir können das nicht" → „Hier ist die schnellste Lösung"
"""


class SupportAskIn(BaseModel):
    message: str = Field(min_length=2, max_length=2000)
    session_id: Optional[str] = None


class SupportAskOut(BaseModel):
    answer: str
    session_id: str
    suggested_actions: List[dict] = []


# Quick FAQ — these are matched before hitting the LLM (saves cost + faster).
# Each entry: (substring-trigger lowercase, response, suggested_actions)
#
# Iter 92.17 (Mert: "nie für Refund immer nur upgrade oder Fokus auf AI Weiterbildung"):
#   • Refund-FAQ entfernt — wenn jemand Refund will, leiten wir zu support@
#     Email weiter (kein In-App-Self-Service mehr → reduziert Refund-Quote).
#   • Stärkung der Upgrade- + AI-Weiterbildung-FAQs.
#   • Cancel/Refund-Trigger leiten zu retention-friendlichem "Upgrade-Pause"
#     statt direkter Refund-Anleitung.
FAQ_SHORTCUTS = [
    {
        # User-Retention: bei Cancel/Refund-Intent NICHT direkt Refund-Anleitung,
        # sondern Hinweis auf persönlichen Support → Conversion-Save.
        "triggers": ["refund", "rückerstattung", "geld zurück", "geld-zurück", "money back", "cancel", "kündigen"],
        "answer": "Schreib uns direkt an support@leaderos.de mit deinem Anliegen — wir melden uns innerhalb 24h persönlich. Häufig finden wir eine bessere Lösung als Cancel (z.B. Pause, Tier-Wechsel, oder eine kurze Coaching-Session die dich weiterbringt).",
        "actions": [
            {"label": "Email an Support", "type": "mailto", "value": "support@leaderos.de"},
            {"label": "15-Min Gespräch", "type": "external", "value": "https://cal.com/leaderos/beratung"},
        ],
    },
    {
        "triggers": ["coaching buchen", "strategie", "termin buch", "book a call", "appointment", "beratung"],
        "answer": "Buch dein 15-Min Strategiegespräch auf cal.com/leaderos/beratung. 1:1 mit unserem Argumentorik-Berater, unverbindlich.",
        "actions": [{"label": "Termin buchen", "type": "external", "value": "https://cal.com/leaderos/beratung"}],
    },
    {
        "triggers": ["upgrade", "plus kaufen", "leadership os holen", "tier wechsel", "upgrade auf plus", "wie kaufe ich"],
        "answer": "Upgrade läuft über die /coaching Page — wähle dein Paket → Stripe-Checkout. OS PLUS gibt dir 12× 1:1 Coaching mit Wlads Expertenteam plus alle 35 Kurse + unbegrenzte AI-Sessions.",
        "actions": [
            {"label": "Zu /coaching", "type": "internal", "value": "/coaching"},
            {"label": "15-Min Gespräch", "type": "external", "value": "https://cal.com/leaderos/beratung"},
        ],
    },
    {
        "triggers": ["ki lernen", "ai weiterbildung", "ai skills", "ai training", "wie nutze ich ai", "wie nutze ich ki", "prompt engineering"],
        "answer": "Im MyPath findest du den AI-Mastery Track — 16 strukturierte Missionen die dir Schritt-für-Schritt zeigen wie du GPT/Claude/Gemini als Leadership-Multiplier nutzt. Plus täglich neuer Tip von WladBot direkt im Chat.",
        "actions": [
            {"label": "Zu /my-path", "type": "internal", "value": "/my-path"},
            {"label": "WladBot starten", "type": "internal", "value": "/chat"},
        ],
    },
    {
        "triggers": ["passwort", "password reset", "login fail", "kann mich nicht einloggen", "kann mich nicht anmelden"],
        "answer": "Passwort-Reset via Magic-Link: auf /login → 'Magic Link' Tab → E-Mail eingeben. Falls die Mail nicht kommt: Spam-Folder checken, sonst support@leaderos.de.",
        "actions": [{"label": "Zur Login-Page", "type": "internal", "value": "/login"}],
    },
    {
        "triggers": ["unsubscribe", "abmelden", "keine emails mehr"],
        "answer": "Klick in jeder Email auf den 'Abmelden'-Link am Ende — wir entfernen dich sofort aus dem Verteiler. Oder direkt: support@leaderos.de.",
        "actions": [],
    },
    {
        "triggers": ["wlad jachtchenko wer", "wer ist wlad", "über wlad"],
        "answer": "Wlad Jachtchenko ist Argumentorik-Experte, Bestseller-Autor und Top-Speaker (2.500+ Führungskräfte trainiert, von Startups bis DAX). Leader-OS digitalisiert seine Methodik mit KI — und du arbeitest mit seinem von ihm persönlich ausgebildeten Coach-Team.",
        "actions": [
            {"label": "OS PLUS holen", "type": "internal", "value": "/coaching"},
        ],
    },
    {
        # Iter 92.17: NEW — direct Learning-Path upsell
        "triggers": ["was bringt mir", "warum leader-os", "warum kaufen", "lohnt sich", "value", "vorteil"],
        "answer": "Leader-OS macht aus dir einen AI-fluenten Leader: ein 30-Tage-Programm, 16 Missionen, 24/7 WladBot Chat, Video-Analyse deiner Pitches, monatliche Updates. Mit OS PLUS dazu 12× 1:1 Coaching mit Wlads Expertenteam — €4.447/Jahr, 30-Tage Geld-zurück.",
        "actions": [
            {"label": "Pakete ansehen", "type": "internal", "value": "/coaching"},
            {"label": "15-Min Gespräch", "type": "external", "value": "https://cal.com/leaderos/beratung"},
        ],
    },
]


def _match_faq(message: str):
    """Return matching FAQ entry or None."""
    lower = message.lower()
    for entry in FAQ_SHORTCUTS:
        if any(t in lower for t in entry["triggers"]):
            return entry
    return None


@router.post("/ask", response_model=SupportAskOut)
async def support_ask(data: SupportAskIn, request: Request):
    """Single-turn support Q&A. Persists message + answer for audit."""
    user = await get_current_user(request)
    session_id = data.session_id or f"sup_{uuid.uuid4().hex[:12]}"

    msg = data.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Frage darf nicht leer sein.")

    # 1) FAQ shortcut — instant, no LLM cost
    faq = _match_faq(msg)
    if faq:
        answer = faq["answer"]
        suggested = faq["actions"]
        source = "faq"
    else:
        # 2) LLM fallback for novel questions
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id,
                system_message=SUPPORT_SYSTEM_PROMPT,
            )
            chat.with_model("openai", "gpt-5.2")
            llm_response = await chat.send_message(UserMessage(text=msg))
            answer = (llm_response or "").strip()
            if not answer:
                raise RuntimeError("Empty LLM response")
            # Always offer book-a-call + email as fallback actions
            suggested = [
                {"label": "15 Min Strategiegespräch", "type": "external", "value": "https://cal.com/leaderos/beratung"},
                {"label": "Email an Support", "type": "mailto", "value": "support@leaderos.de"},
            ]
            source = "llm"
        except Exception as e:
            logger.error(f"WladHelp LLM error: {e}")
            answer = ("Ich konnte deine Frage gerade nicht beantworten. "
                      "Schreib uns kurz auf support@leaderos.de oder buch ein 15-Min Strategiegespräch — "
                      "wir melden uns innerhalb von 24h.")
            suggested = [
                {"label": "Email an Support", "type": "mailto", "value": "support@leaderos.de"},
                {"label": "15 Min Strategiegespräch", "type": "external", "value": "https://cal.com/leaderos/beratung"},
            ]
            source = "fallback"

    # Persist for audit / future ML training data
    try:
        await db.support_messages.insert_one({
            "message_id": f"sm_{uuid.uuid4().hex[:12]}",
            "session_id": session_id,
            "user_id": user["user_id"],
            "user_email": user.get("email"),
            "user_tier": user.get("tier", "free"),
            "question": msg,
            "answer": answer,
            "source": source,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.warning(f"WladHelp persist failed (non-blocking): {e}")

    # Iter 92.18: CRM webhook — every support question is a sales-intent signal
    try:
        import services_crm
        services_crm.support_question(user, question=msg, source="wladhelp")
    except Exception as crm_err:
        logger.debug(f"CRM support_question emit failed (non-blocking): {crm_err}")

    return SupportAskOut(answer=answer, session_id=session_id, suggested_actions=suggested)
