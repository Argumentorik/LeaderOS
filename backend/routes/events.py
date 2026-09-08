"""Events & Focus Time routes — Premium Event Hub for LeaderOS."""
import os
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import uuid
import logging
from datetime import datetime, timezone, timedelta
from urllib.parse import quote

from config import db
from services import get_current_user, require_cron_auth
from services_email import (
    send_email, is_enabled as email_enabled,
    event_registration_email, event_reminder_email,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["events"])


# ========== MODELS ==========

class FocusTimeSlot(BaseModel):
    day: str  # "monday", "tuesday", etc.
    start_time: str  # "09:00"
    end_time: str  # "10:30"
    session_type: str = "deep_work"  # deep_work, review, planning


# ========== HELPERS ==========

def _build_google_calendar_url(event: dict) -> str:
    """Generate a Google Calendar 'Add Event' URL."""
    title = event.get("title", "LeaderOS Event")
    desc = event.get("description", "")
    date_str = event.get("date", "")
    duration = event.get("duration_minutes", 60)

    try:
        start = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        start = datetime.now(timezone.utc) + timedelta(days=7)

    end = start + timedelta(minutes=duration)
    fmt = "%Y%m%dT%H%M%SZ"
    dates = f"{start.strftime(fmt)}/{end.strftime(fmt)}"
    # Iter 92.27: env-driven prod URL (FRONTEND_BASE_URL set per Vercel project).
    _events_url = (os.environ.get("FRONTEND_BASE_URL") or "https://leaderos.de").rstrip("/")
    details = f"{desc}\n\nJoin via LeaderOS: {_events_url}/events"

    return (
        f"https://www.google.com/calendar/render?action=TEMPLATE"
        f"&text={quote(title)}"
        f"&dates={dates}"
        f"&details={quote(details)}"
        f"&location={quote('Online — LeaderOS')}"
    )


def _build_ics_content(event: dict) -> str:
    """Generate .ics file content for Outlook/Apple Calendar."""
    title = event.get("title", "LeaderOS Event")
    desc = event.get("description", "").replace("\n", "\\n")
    date_str = event.get("date", "")
    duration = event.get("duration_minutes", 60)

    try:
        start = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        start = datetime.now(timezone.utc) + timedelta(days=7)

    end = start + timedelta(minutes=duration)
    fmt = "%Y%m%dT%H%M%SZ"
    uid = f"{event.get('event_id', uuid.uuid4().hex)}@leaderos.de"

    return (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//LeaderOS//Events//DE\r\n"
        "BEGIN:VEVENT\r\n"
        f"UID:{uid}\r\n"
        f"DTSTART:{start.strftime(fmt)}\r\n"
        f"DTEND:{end.strftime(fmt)}\r\n"
        f"SUMMARY:{title}\r\n"
        f"DESCRIPTION:{desc}\r\n"
        "LOCATION:Online — LeaderOS\r\n"
        "END:VEVENT\r\n"
        "END:VCALENDAR\r\n"
    )


def _enrich_event(event: dict) -> dict:
    """Add computed calendar URLs to an event."""
    event["google_calendar_url"] = _build_google_calendar_url(event)
    event["ics_content"] = _build_ics_content(event)
    return event


def _categorize_event(event: dict) -> str:
    """Determine event tab category."""
    date_str = event.get("date", "")
    try:
        event_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        if event_date < datetime.now(timezone.utc):
            return "replay"
    except Exception:
        pass
    if event.get("access_level") == "accelerator":
        return "private"
    if event.get("event_type") == "focus_session":
        return "focus"
    return "live"


# ========== SEED DATA ==========

EVENTS_SEED_V2 = [
    # ===== Wiederkehrende LIVE KI Call: JEDEN Donnerstag 18:00 ab Juli 2026 (8 instances) =====
    *[
        {
            "event_id": f"live_ki_call_{i}",
            "title": f"LIVE KI Call mit Wlad #{i+1}",
            "description": "Live-Q&A: Bring deine konkreten Leadership-Herausforderungen mit. Wlad antwortet live, gibt KI-Frameworks an die Hand und bespricht Praxisfälle aus der Community.",
            "outcomes": [
                "Persönliche Antworten auf deine Fragen",
                "Konkrete KI-Workflows zum direkten Einsatz",
                "Live-Cases aus dem Wlad-Network",
            ],
            "event_type": "live", "duration": "60 min", "duration_minutes": 60,
            "max_participants": 500, "registered": 0, "host": "Wlad Jachtchenko",
            "tags": ["LIVE", "KI", "Q&A", "alle 2 Wochen"], "access_level": "free", "featured": i == 0,
            "category": "leadership", "status": "upcoming",
            "recurring": "weekly_thursday",
            # Date set dynamically below — Thursday 18:00 UTC, every week from first Thursday in July 2026
        }
        for i in range(8)
    ],

    # LIVE EVENTS (Season ab Mitte August 2026 — Wlad's Cohort Launch)
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "KI-gestützte Führung: Die Zukunft des Managements",
        "description": "Erfahre, wie du KI als strategisches Werkzeug in deinem Führungsalltag einsetzt.",
        "outcomes": ["KI-Tools für den Führungsalltag kennen", "Eigene KI-Strategie entwickeln", "Konkrete Workflows mitnehmen"],
        "event_type": "live", "date": "2026-08-18T18:00:00Z", "duration": "60 min", "duration_minutes": 60,
        "max_participants": 200, "registered": 127, "host": "Wlad Jachtchenko",
        "tags": ["KI", "Strategie", "Innovation"], "access_level": "free", "featured": True,
        "category": "leadership", "status": "upcoming",
    },
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Executive Communication Masterclass",
        "description": "Überzeuge auf C-Level: Strukturierte Kommunikation, Storytelling und Präsenz.",
        "outcomes": ["Board-Ready Präsentationen bauen", "Storytelling-Framework anwenden", "Executive Presence steigern"],
        "event_type": "workshop", "date": "2026-08-25T19:00:00Z", "duration": "90 min", "duration_minutes": 90,
        "max_participants": 50, "registered": 34, "host": "Wlad Jachtchenko",
        "tags": ["Kommunikation", "C-Level", "Präsentation"], "access_level": "standard", "featured": True,
        "category": "communication",
    },
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Schwierige Gespräche meistern",
        "description": "Feedback geben, Konflikte ansprechen, Kündigungen aussprechen — mit Struktur und Empathie.",
        "outcomes": ["Die Feedbackformel anwenden", "Schwierige Botschaften klar formulieren", "Emotionale Reaktionen managen"],
        "event_type": "live", "date": "2026-09-01T18:30:00Z", "duration": "75 min", "duration_minutes": 75,
        "max_participants": 120, "registered": 64, "host": "Wlad Jachtchenko",
        "tags": ["Konflikt", "EQ", "Gespräche"], "access_level": "free",
        "category": "eq",
    },
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Leadership Scorecard: Deine Zahlen als Führungskraft",
        "description": "Lerne, wie du deinen Leadership-Score interpretierst und gezielt an Schwächen arbeitest.",
        "outcomes": ["Score-System verstehen", "Persönliche Wachstumsbereiche identifizieren", "90-Tage-Entwicklungsplan erstellen"],
        "event_type": "live", "date": "2026-09-08T19:00:00Z", "duration": "60 min", "duration_minutes": 60,
        "max_participants": 100, "registered": 41, "host": "Wlad Jachtchenko",
        "tags": ["Daten", "Score", "Wachstum"], "access_level": "standard",
        "category": "leadership",
    },
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Delegation Deep Dive Workshop",
        "description": "Aufgaben richtig abgeben, Verantwortung übertragen und Mikromanagement überwinden.",
        "outcomes": ["Delegations-Matrix anwenden", "Mikromanagement erkennen und stoppen", "Team-Autonomie aufbauen"],
        "event_type": "workshop", "date": "2026-09-15T14:00:00Z", "duration": "120 min", "duration_minutes": 120,
        "max_participants": 25, "registered": 14, "host": "Wlad Jachtchenko",
        "tags": ["Delegation", "Management", "Praxis"], "access_level": "standard",
        "category": "management",
    },
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Vision & Strategie Workshop",
        "description": "Entwickle deine 90-Tage-Vision mit dem WladBot Vision Framework.",
        "outcomes": ["Eigene Vision formulieren", "Strategische Prioritäten setzen", "Action-Plan für 90 Tage mitnehmen"],
        "event_type": "workshop", "date": "2026-09-22T10:00:00Z", "duration": "150 min", "duration_minutes": 150,
        "max_participants": 20, "registered": 11, "host": "Wlad Jachtchenko",
        "tags": ["Vision", "Strategie"], "access_level": "standard",
        "category": "strategy",
    },
    # PRIVATE / ACCELERATOR EVENTS
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Accelerator Mastermind: Q3 Strategy Call",
        "description": "Exklusiver Strategy Call für Accelerator-Mitglieder. Peer-Coaching, Hot Seats, direktes Feedback von Wlad.",
        "outcomes": ["Direktes Feedback auf deine Strategie", "Peer-Insights von Top-Leadern", "Accountability-Partner finden"],
        "event_type": "mastermind", "date": "2026-08-21T17:00:00Z", "duration": "90 min", "duration_minutes": 90,
        "max_participants": 12, "registered": 8, "host": "Wlad Jachtchenko",
        "tags": ["Mastermind", "Strategie", "Exklusiv"], "access_level": "accelerator", "featured": True,
        "category": "exclusive",
    },
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "1:1 Coaching-Slot: Executive Sparring",
        "description": "30 Minuten 1:1 mit Wlads Expertenteam. Bringe dein wichtigstes Thema mit — Karriere, Konflikt, Strategie.",
        "outcomes": ["Persönliches Executive Coaching", "Konkreter Aktionsplan", "Follow-up Roadmap"],
        "event_type": "coaching", "date": "2026-08-26T10:00:00Z", "duration": "30 min", "duration_minutes": 30,
        "max_participants": 1, "registered": 0, "host": "Wlad Jachtchenko",
        "tags": ["1:1", "Coaching", "Executive"], "access_level": "accelerator",
        "category": "exclusive",
    },
    # REPLAYS
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Schwarze Rhetorik: Manipulationen erkennen & kontern",
        "description": "Aufzeichnung des Live-Workshops. Lerne, wie du Manipulationstechniken in Verhandlungen erkennst.",
        "outcomes": ["12 Manipulationstechniken erkennen", "Konter-Strategien anwenden", "Eigene Kommunikation schärfen"],
        "event_type": "replay", "date": "2026-03-15T18:00:00Z", "duration": "75 min", "duration_minutes": 75,
        "max_participants": None, "registered": 289, "host": "Wlad Jachtchenko",
        "tags": ["Rhetorik", "Verhandlung", "Psychologie"], "access_level": "standard",
        "category": "communication", "replay_url": "#",
    },
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "From Manager to Executive: Karrieresprung meistern",
        "description": "Aufzeichnung des 3-Tage-Intensivkurses. Executive Presence, strategisches Denken, Board-Kommunikation.",
        "outcomes": ["Executive Presence entwickeln", "Strategisch statt operativ denken", "Board-Level kommunizieren"],
        "event_type": "replay", "date": "2026-02-20T09:00:00Z", "duration": "180 min", "duration_minutes": 180,
        "max_participants": None, "registered": 412, "host": "Wlad Jachtchenko",
        "tags": ["Karriere", "Executive", "Aufstieg"], "access_level": "standard",
        "category": "leadership", "replay_url": "#",
    },
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "High-Performance Teams: Netflix, Google, Amazon",
        "description": "Was macht die besten Teams der Welt aus? Culture Canvas, OKRs und psychologische Sicherheit.",
        "outcomes": ["Culture Canvas Template nutzen", "OKR-Framework verstehen", "Psychologische Sicherheit aufbauen"],
        "event_type": "replay", "date": "2026-01-28T09:00:00Z", "duration": "120 min", "duration_minutes": 120,
        "max_participants": None, "registered": 523, "host": "Wlad Jachtchenko",
        "tags": ["Team", "Kultur", "Performance"], "access_level": "free",
        "category": "management", "replay_url": "#",
    },
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Emotionale Intelligenz für Manager",
        "description": "Empathie entwickeln, Emotionen regulieren und authentisch führen. Mit Persönlichkeitsanalyse.",
        "outcomes": ["Empathie-Framework anwenden", "Eigene emotionale Trigger kennen", "Authentische Führung leben"],
        "event_type": "replay", "date": "2026-02-10T09:00:00Z", "duration": "150 min", "duration_minutes": 150,
        "max_participants": None, "registered": 367, "host": "Wlad Jachtchenko",
        "tags": ["EQ", "Empathie", "Authentizität"], "access_level": "free",
        "category": "eq", "replay_url": "#",
    },
    # FOCUS SESSIONS (Season ab Mitte August 2026)
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Focus Session: Deep Work Leadership",
        "description": "90 Minuten geführte Deep-Work-Session. Gemeinsam fokussiert an deinen Leadership-Aufgaben arbeiten.",
        "outcomes": ["Fokussierte Arbeitszeit", "Accountability durch Gruppe", "Konkrete Ergebnisse in 90 min"],
        "event_type": "focus_session", "date": "2026-08-14T09:00:00Z", "duration": "90 min", "duration_minutes": 90,
        "max_participants": 30, "registered": 18, "host": "LeaderOS System",
        "tags": ["Deep Work", "Fokus", "Produktivität"], "access_level": "standard", "recurring": True,
        "category": "execution",
    },
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Focus Session: Wochenplanung & Reflexion",
        "description": "Strukturierte Session: Woche reflektieren, nächste Woche planen, Prioritäten setzen.",
        "outcomes": ["Woche reflektiert", "Prioritäten für nächste Woche gesetzt", "Klarheit über nächste Schritte"],
        "event_type": "focus_session", "date": "2026-08-17T08:00:00Z", "duration": "60 min", "duration_minutes": 60,
        "max_participants": 50, "registered": 24, "host": "LeaderOS System",
        "tags": ["Planung", "Reflexion", "Woche"], "access_level": "free", "recurring": True,
        "category": "execution",
    },
    {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}", "title": "Focus Session: KI-Workflows",
        "description": "60 Minuten: Gemeinsam KI-Workflows durcharbeiten und in den Führungsalltag integrieren.",
        "outcomes": ["1 neuen KI-Workflow implementiert", "Praxis-Erfahrung gesammelt", "Peer-Austausch"],
        "event_type": "focus_session", "date": "2026-08-19T14:00:00Z", "duration": "60 min", "duration_minutes": 60,
        "max_participants": 30, "registered": 12, "host": "LeaderOS System",
        "tags": ["KI", "Workflow", "Praxis"], "access_level": "standard", "recurring": True,
        "category": "execution",
    },
]


def _biweekly_thursdays(count: int, start: Optional[datetime] = None) -> list:
    """Return `count` datetimes on consecutive biweekly Thursdays (every 2 weeks),
    starting on the first Thursday on/after October 1, 2026 (Wlad cohort season).
    Rolls forward in 2-week steps so the sequence never starts in the past."""
    start = start or datetime(2026, 10, 1, tzinfo=timezone.utc)
    days_until_thu = (3 - start.weekday()) % 7  # weekday(): Mon=0, Thu=3
    first_thu = start + timedelta(days=days_until_thu)
    now = datetime.now(timezone.utc)
    while first_thu.date() < now.date():
        first_thu += timedelta(weeks=2)
    return [first_thu + timedelta(weeks=2 * i) for i in range(count)]


def _preferred_hour_utc(event: dict) -> int:
    """Time-of-day (UTC) per event type. LIVE calls 18:00 UTC (= 20:00 DE)."""
    et = event.get("event_type")
    if et in ("workshop", "coaching", "mastermind"):
        return 14
    if et == "focus_session":
        return 10
    return 18


def _event_sort_key(event: dict):
    """Stable ordering: recurring LIVE KI Calls first (by index), then others by id."""
    if event.get("recurring") in ("weekly_thursday", "biweekly_thursday"):
        try:
            idx = int(str(event.get("event_id", "")).split("_")[-1])
        except Exception:
            idx = 0
        return (0, idx, str(event.get("event_id", "")))
    return (1, 0, str(event.get("event_id", "")))


async def _normalize_event_schedule():
    """Assign every non-replay event to a unique biweekly Thursday from Oct 2026.
    Guarantees: (a) only dates >= October 2026, (b) 2-week spacing between events,
    (c) no two events on the same calendar day. Deterministic & idempotent."""
    events = await db.events.find(
        {"event_type": {"$ne": "replay"}},
        {"_id": 0, "event_id": 1, "event_type": 1, "recurring": 1},
    ).to_list(500)
    if not events:
        return
    events.sort(key=_event_sort_key)
    thursdays = _biweekly_thursdays(len(events))
    for evt, thu in zip(events, thursdays):
        dt = thu.replace(hour=_preferred_hour_utc(evt), minute=0, second=0, microsecond=0)
        await db.events.update_one(
            {"event_id": evt["event_id"]},
            {"$set": {"date": dt.isoformat().replace("+00:00", "Z"), "status": "upcoming"}},
        )


async def _seed_events_v2():
    """Seed events if the DB is empty, then normalize the schedule so all upcoming
    events fall on unique biweekly Thursdays starting October 2026."""
    count = await db.events.count_documents({})
    if count == 0:
        for event in EVENTS_SEED_V2:
            await db.events.insert_one({**event})
    await _normalize_event_schedule()


async def _attach_registration_status(events: list, request: Request) -> list:
    """Add is_registered flag to each event based on current user."""
    try:
        user = await get_current_user(request)
        regs = await db.event_registrations.find(
            {"user_id": user["user_id"]}, {"_id": 0, "event_id": 1}
        ).to_list(200)
        reg_ids = {r["event_id"] for r in regs}
        for e in events:
            e["is_registered"] = e.get("event_id") in reg_ids
    except Exception:
        for e in events:
            e["is_registered"] = False
    return events


TAB_FILTERS = {
    "live": lambda e: e.get("event_type") not in ("replay", "focus_session") and e.get("access_level") != "accelerator",
    "replay": lambda e: e.get("event_type") == "replay",
    "private": lambda e: e.get("access_level") == "accelerator",
    "focus": lambda e: e.get("event_type") == "focus_session",
}


# ========== EVENT ENDPOINTS ==========

@router.get("/events")
async def get_events(request: Request, tab: str = "all"):
    """Get events filtered by tab category."""
    await _seed_events_v2()
    events = await db.events.find({}, {"_id": 0}).to_list(100)
    events = [_enrich_event(e) for e in events]
    events = await _attach_registration_status(events, request)

    tab_filter = TAB_FILTERS.get(tab)
    if tab_filter:
        events = [e for e in events if tab_filter(e)]

    return events


@router.get("/events/{event_id}")
async def get_event_detail(event_id: str, request: Request):
    """Get detailed event info including registration status and calendar links."""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event = _enrich_event(event)
    try:
        user = await get_current_user(request)
        reg = await db.event_registrations.find_one(
            {"event_id": event_id, "user_id": user["user_id"]}, {"_id": 0}
        )
        event["is_registered"] = reg is not None
    except Exception:
        event["is_registered"] = False
    return event


@router.get("/events-calendar")
async def get_events_calendar(request: Request):
    """Get events formatted for calendar view with user's registrations."""
    await _seed_events_v2()
    events = await db.events.find({}, {"_id": 0}).to_list(100)
    events = [_enrich_event(e) for e in events]
    return await _attach_registration_status(events, request)


@router.get("/events-reminders")
async def get_event_reminders(request: Request):
    """Get upcoming registered events that need reminders (within 24h or 1h)."""
    user = await get_current_user(request)
    now = datetime.now(timezone.utc)

    regs = await db.event_registrations.find(
        {"user_id": user["user_id"]}, {"_id": 0, "event_id": 1}
    ).to_list(100)
    reg_ids = {r["event_id"] for r in regs}

    if not reg_ids:
        return {"reminders": [], "next_event": None}

    events = await db.events.find({"event_id": {"$in": list(reg_ids)}}, {"_id": 0}).to_list(50)

    reminders = []
    next_event = None
    for e in events:
        try:
            event_dt = datetime.fromisoformat(e["date"].replace("Z", "+00:00"))
        except Exception:
            continue
        if event_dt <= now:
            continue

        delta = event_dt - now
        hours_until = delta.total_seconds() / 3600

        # Classify urgency
        urgency = None
        if hours_until <= 1:
            urgency = "now"
        elif hours_until <= 24:
            urgency = "today"
        elif hours_until <= 168:
            urgency = "soon"

        entry = {
            "event_id": e["event_id"],
            "title": e.get("title", ""),
            "date": e["date"],
            "duration": e.get("duration", ""),
            "event_type": e.get("event_type", ""),
            "host": e.get("host", ""),
            "hours_until": round(hours_until, 1),
            "urgency": urgency,
            "google_calendar_url": _build_google_calendar_url(e),
        }
        if urgency:
            reminders.append(entry)
        if next_event is None or event_dt < datetime.fromisoformat(next_event["date"].replace("Z", "+00:00")):
            next_event = entry

    reminders.sort(key=lambda r: r["hours_until"])
    return {"reminders": reminders, "next_event": next_event}


@router.post("/events/{event_id}/register")
async def register_event(event_id: str, request: Request, background_tasks: BackgroundTasks):
    user = await get_current_user(request)
    existing = await db.event_registrations.find_one(
        {"event_id": event_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")
    await db.event_registrations.insert_one({
        "registration_id": f"reg_{uuid.uuid4().hex[:12]}",
        "event_id": event_id,
        "user_id": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.events.update_one({"event_id": event_id}, {"$inc": {"registered": 1}})

    # Return calendar links for immediate "Add to Calendar" flow
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    calendar_data = {}
    if event:
        event = _enrich_event(event)
        calendar_data = {
            "google_calendar_url": event.get("google_calendar_url"),
            "ics_content": event.get("ics_content"),
            "title": event.get("title"),
            "date": event.get("date"),
        }

        # Fire-and-forget confirmation email
        if email_enabled() and user.get("email"):
            background_tasks.add_task(
                _send_confirmation_email,
                user.get("email"),
                user.get("name") or user.get("email", "Leader").split("@")[0],
                event,
                calendar_data.get("google_calendar_url", ""),
            )

    return {"message": "Registered successfully", "calendar": calendar_data}


async def _send_confirmation_email(to: str, name: str, event: dict, cal_url: str):
    """Background helper: send event registration confirmation email."""
    try:
        subject, html = event_registration_email(name, event, cal_url)
        result = await send_email(to, subject, html)
        await db.event_email_log.insert_one({
            "user_email": to, "event_id": event.get("event_id"), "type": "confirmation",
            "sent": result["sent"], "email_id": result.get("email_id"),
            "error": result.get("error"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.error("Confirmation email error: %s", e)


@router.post("/events/{event_id}/unregister")
async def unregister_event(event_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.event_registrations.delete_one(
        {"event_id": event_id, "user_id": user["user_id"]}
    )
    if result.deleted_count:
        await db.events.update_one({"event_id": event_id}, {"$inc": {"registered": -1}})
    return {"message": "Unregistered"}


# ========== FOCUS TIME ENDPOINTS ==========

@router.get("/focus-times")
async def get_focus_times(request: Request):
    """Get user's configured focus time slots."""
    user = await get_current_user(request)
    slots = await db.focus_times.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).to_list(20)
    return slots


@router.post("/focus-times")
async def save_focus_times(request: Request):
    """Save/replace user's focus time configuration."""
    user = await get_current_user(request)
    body = await request.json()
    slots = body.get("slots", [])

    # Delete existing slots
    await db.focus_times.delete_many({"user_id": user["user_id"]})

    # Insert new slots
    for slot in slots:
        await db.focus_times.insert_one({
            "slot_id": f"fts_{uuid.uuid4().hex[:8]}",
            "user_id": user["user_id"],
            "day": slot.get("day", "monday"),
            "start_time": slot.get("start_time", "09:00"),
            "end_time": slot.get("end_time", "10:30"),
            "session_type": slot.get("session_type", "deep_work"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return {"message": "Focus times saved", "count": len(slots)}


@router.delete("/focus-times/{slot_id}")
async def delete_focus_time(slot_id: str, request: Request):
    """Delete a single focus time slot."""
    user = await get_current_user(request)
    result = await db.focus_times.delete_one(
        {"slot_id": slot_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slot not found")
    return {"message": "Deleted"}


# ========== EMAIL REMINDERS ==========

async def _fetch_reminder_context(regs: list) -> tuple[dict, dict]:
    """Load events + users referenced by the registrations into dict lookups."""
    event_ids = list({r["event_id"] for r in regs})
    events_by_id = {
        e["event_id"]: e
        for e in await db.events.find({"event_id": {"$in": event_ids}}, {"_id": 0}).to_list(500)
    }
    user_ids = list({r["user_id"] for r in regs})
    users_by_id = {
        u["user_id"]: u
        for u in await db.users.find(
            {"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1, "email": 1, "name": 1}
        ).to_list(2000)
    }
    return events_by_id, users_by_id


def _event_within_window(event: dict, target_lo, target_hi) -> Optional[datetime]:
    """Parse event date; return it if within (target_lo, target_hi), else None."""
    try:
        event_dt = datetime.fromisoformat(event["date"].replace("Z", "+00:00"))
    except Exception:
        return None
    if target_lo <= event_dt <= target_hi:
        return event_dt
    return None


async def _send_single_reminder(user: dict, event: dict, event_dt, label: str, now) -> bool:
    """Send one reminder email + dedup log. Returns True if email was sent."""
    already = await db.event_email_log.find_one(
        {"user_email": user["email"], "event_id": event["event_id"], "type": label},
        {"_id": 0},
    )
    if already:
        return False

    enriched = _enrich_event(dict(event))
    hours_until = round((event_dt - now).total_seconds() / 3600, 1)
    name = user.get("name") or user["email"].split("@")[0]
    subject, html = event_reminder_email(name, enriched, hours_until, enriched.get("google_calendar_url", ""))
    result = await send_email(user["email"], subject, html)
    await db.event_email_log.insert_one({
        "user_email": user["email"], "event_id": event["event_id"], "type": label,
        "sent": result["sent"], "email_id": result.get("email_id"),
        "error": result.get("error"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return bool(result["sent"])


async def _send_reminders_for_window(window_hours: float, label: str) -> dict:
    """Scan all registrations and send email reminders for events starting within
    window_hours (±15 min tolerance). De-duplicated via event_email_log."""
    if not email_enabled():
        return {"sent": 0, "skipped": 0, "error": "RESEND_API_KEY not configured"}
    if window_hours <= 0:
        # Defensive guard — never scan past events or invalid windows.
        return {"sent": 0, "skipped": 0, "error": "window_hours must be > 0"}

    now = datetime.now(timezone.utc)
    target_lo = now + timedelta(hours=window_hours - 0.25)
    target_hi = now + timedelta(hours=window_hours + 0.25)

    regs = await db.event_registrations.find({}, {"_id": 0}).to_list(2000)
    if not regs:
        return {"sent": 0, "skipped": 0}

    events_by_id, users_by_id = await _fetch_reminder_context(regs)

    sent = 0
    skipped = 0
    for reg in regs:
        event = events_by_id.get(reg["event_id"])
        user = users_by_id.get(reg["user_id"])
        if not event or not user or not user.get("email"):
            skipped += 1
            continue
        event_dt = _event_within_window(event, target_lo, target_hi)
        if event_dt is None:
            # Either unparseable date (skip silently) or out of window (don't count as skipped).
            if "date" in event and event.get("date"):
                continue
            skipped += 1
            continue
        if await _send_single_reminder(user, event, event_dt, label, now):
            sent += 1
        else:
            skipped += 1

    return {"sent": sent, "skipped": skipped, "label": label}


@router.post("/cron/event-reminders")
async def cron_send_reminders(request: Request):
    """Public cron endpoint — call every 15 minutes from an external scheduler.
    Sends 24h and 1h reminders for all registered events (deduplicated)."""
    require_cron_auth(request)
    r24 = await _send_reminders_for_window(24.0, "24h")
    r1 = await _send_reminders_for_window(1.0, "1h")
    return {"24h": r24, "1h": r1, "enabled": email_enabled()}


@router.post("/events/{event_id}/send-test-reminder")
async def send_test_reminder(event_id: str, request: Request):
    """Trigger a test reminder email to the logged-in user for this event."""
    user = await get_current_user(request)
    if not user.get("email"):
        raise HTTPException(status_code=400, detail="User has no email")
    if not email_enabled():
        raise HTTPException(status_code=503, detail="Email service not configured (RESEND_API_KEY missing)")

    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    enriched = _enrich_event(dict(event))
    try:
        event_dt = datetime.fromisoformat(event["date"].replace("Z", "+00:00"))
        hours_until = max(0.1, round((event_dt - datetime.now(timezone.utc)).total_seconds() / 3600, 1))
    except Exception:
        hours_until = 24.0

    name = user.get("name") or user["email"].split("@")[0]
    subject, html = event_reminder_email(name, enriched, hours_until, enriched.get("google_calendar_url", ""))
    result = await send_email(user["email"], f"[TEST] {subject}", html)
    return {"email": user["email"], **result}


@router.get("/email-reminders-status")
async def email_status():
    """Check if email reminder service is configured."""
    return {"enabled": email_enabled()}
