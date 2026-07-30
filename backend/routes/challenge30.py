"""30-Day Leader Challenge — Daily missions with quizzes and AI learning."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime, timezone

from config import db
from services import get_current_user
from services_actions import record_user_action
from quiz_bank import QUIZ_BANK

router = APIRouter(prefix="/api/challenge30", tags=["challenge30"])


def get_quiz_for_day(day):
    return QUIZ_BANK.get(day, [])


CHALLENGES = [
    {"day": 1, "week": 1, "title_de": "Baseline deiner 6 Führungsdimensionen", "title_en": "Baseline of your 6 leadership dimensions", "type": "quiz", "path": "/challenge", "xp": 10, "category": "awareness", "agent": "Diagnose-Agent", "duration": "10 Min",
     "desc_de": "Dein Standort. Dein Startpunkt. 10 Fragen zu den Grundlagen der Führung.", "desc_en": "Your starting point. 10 questions on leadership fundamentals."},
    {"day": 2, "week": 1, "title_de": "KI-Grundlagen: KI richtig verstehen & einordnen", "title_en": "AI Basics: Understanding AI correctly", "type": "quiz", "path": "/challenge", "xp": 15, "category": "awareness", "agent": "Strategie-Agent", "duration": "10 Min",
     "desc_de": "Was KI für deine Führung bedeutet — 10 Fragen zum KI-Mindset.", "desc_en": "What AI means for your leadership — 10 questions."},
    {"day": 3, "week": 1, "title_de": "Kommunikation: Die 3 Säulen der Überzeugung", "title_en": "Communication: 3 Pillars of Persuasion", "type": "quiz", "path": "/challenge", "xp": 15, "category": "awareness", "agent": "Coach-Agent", "duration": "10 Min",
     "desc_de": "Logos, Ethos, Pathos — 10 Fragen zur Kommunikation.", "desc_en": "Logos, Ethos, Pathos — 10 communication questions."},
    {"day": 4, "week": 1, "title_de": "EQ-Selbstreflexion: Stärken & Trigger", "title_en": "EQ Self-Reflection", "type": "quiz", "path": "/challenge", "xp": 20, "category": "awareness", "agent": "Simulations-Agent", "duration": "10 Min",
     "desc_de": "Emotionale Intelligenz verstehen und nutzen — 10 Fragen.", "desc_en": "Understand emotional intelligence — 10 questions."},
    {"day": 5, "week": 1, "title_de": "WladHub 3-Layer Diagnose", "title_en": "WladHub 3-Layer Diagnosis", "type": "quiz", "path": "/challenge", "xp": 25, "category": "awareness", "agent": "Diagnose-Agent", "duration": "10 Min",
     "desc_de": "Dein 3-Layer-Profil verstehen — 10 Fragen + WladHub verbinden.", "desc_en": "Understand your 3-Layer profile — 10 questions."},
    {"day": 6, "week": 1, "title_de": "Delegation: Kontrolle abgeben lernen", "title_en": "Delegation: Learning to let go", "type": "quiz", "path": "/challenge", "xp": 20, "category": "awareness", "agent": "Task-Agent", "duration": "10 Min",
     "desc_de": "Wann delegieren, wann selbst machen? 10 Entscheidungsfragen.", "desc_en": "When to delegate, when to do it yourself?"},
    {"day": 7, "week": 1, "title_de": "Woche 1: Awareness-Check", "title_en": "Week 1: Awareness Check", "type": "quiz", "path": "/challenge", "xp": 25, "category": "awareness", "agent": "Coach-Agent", "duration": "10 Min",
     "desc_de": "Meilenstein: 10 Wiederholungsfragen + Reflexion.", "desc_en": "Milestone: 10 review questions."},
    {"day": 8, "week": 2, "title_de": "KI-Entscheidungsframework", "title_en": "AI Decision Framework", "type": "quiz", "path": "/challenge", "xp": 20, "category": "methoden", "agent": "Strategie-Agent", "duration": "10 Min",
     "desc_de": "KI für bessere Entscheidungen — 10 Methoden-Fragen.", "desc_en": "Use AI for better decisions."},
    {"day": 9, "week": 2, "title_de": "Boardroom-Rhetorik aufbauen", "title_en": "Build boardroom rhetoric", "type": "quiz", "path": "/challenge", "xp": 20, "category": "methoden", "agent": "Coach-Agent", "duration": "10 Min",
     "desc_de": "Überzeuge auf C-Level — 10 Rhetorik-Fragen.", "desc_en": "Persuade at C-Level."},
    {"day": 10, "week": 2, "title_de": "Eisenhower + ALPEN + SMART", "title_en": "Eisenhower + ALPEN + SMART", "type": "quiz", "path": "/challenge", "xp": 20, "category": "methoden", "agent": "Task-Agent", "duration": "10 Min",
     "desc_de": "Priorisierung meistern — 10 Framework-Fragen.", "desc_en": "Master prioritization."},
    {"day": 11, "week": 2, "title_de": "Aktives Zuhören meistern", "title_en": "Master active listening", "type": "quiz", "path": "/challenge", "xp": 25, "category": "methoden", "agent": "Simulations-Agent", "duration": "10 Min",
     "desc_de": "Die 5 Ebenen des Zuhörens — 10 Praxis-Fragen.", "desc_en": "The 5 levels of listening."},
    {"day": 12, "week": 2, "title_de": "Challenger: Jeff Bezos", "title_en": "Challenger: Jeff Bezos", "type": "action", "path": "/challengers", "xp": 30, "category": "methoden", "agent": "Coach-Agent", "duration": "10 Min",
     "desc_de": "Stell dich den Fragen von Jeff Bezos.", "desc_en": "Face Jeff Bezos."},
    {"day": 13, "week": 2, "title_de": "Feedbackformel in der Praxis", "title_en": "Feedback formula in practice", "type": "quiz", "path": "/challenge", "xp": 25, "category": "methoden", "agent": "Coach-Agent", "duration": "10 Min",
     "desc_de": "Beobachtung + Wirkung + Wunsch — 10 Situationsfragen.", "desc_en": "Observation + Impact + Wish."},
    {"day": 14, "week": 2, "title_de": "Halbzeit: Methoden-Check", "title_en": "Midpoint: Methods Check", "type": "quiz", "path": "/challenge", "xp": 25, "category": "methoden", "agent": "Diagnose-Agent", "duration": "10 Min",
     "desc_de": "Du hast dein Toolkit — 10 Wiederholungsfragen.", "desc_en": "You have your toolkit."},
    {"day": 15, "week": 3, "title_de": "KI + Rhetorik kombinieren", "title_en": "Combine AI + Rhetoric", "type": "quiz", "path": "/challenge", "xp": 20, "category": "praxis", "agent": "Coach-Agent", "duration": "10 Min",
     "desc_de": "Theorie trifft Realität — 10 Anwendungsfragen.", "desc_en": "Theory meets reality."},
    {"day": 16, "week": 3, "title_de": "SMART-Ziele setzen", "title_en": "Set SMART goals", "type": "action", "path": "/tools", "xp": 20, "category": "praxis", "agent": "Task-Agent", "duration": "10 Min",
     "desc_de": "Setze echte Quartalsziele mit dem SMART-Framework.", "desc_en": "Set real quarterly goals."},
    {"day": 17, "week": 3, "title_de": "Schwierige Gespräche führen", "title_en": "Difficult conversations", "type": "quiz", "path": "/challenge", "xp": 25, "category": "praxis", "agent": "Simulations-Agent", "duration": "10 Min",
     "desc_de": "Konflikte ansprechen mit Struktur — 10 Szenario-Fragen.", "desc_en": "Address conflicts."},
    {"day": 18, "week": 3, "title_de": "Video-Mission: Führungspitch", "title_en": "Video Mission: Leadership Pitch", "type": "action", "path": "/missions", "xp": 30, "category": "praxis", "agent": "Coach-Agent", "duration": "10 Min",
     "desc_de": "Nimm dein Führungspitch auf. KI gibt Wlad-Feedback.", "desc_en": "Record your leadership pitch."},
    {"day": 19, "week": 3, "title_de": "Feedback-Kultur aufbauen", "title_en": "Build feedback culture", "type": "quiz", "path": "/challenge", "xp": 20, "category": "praxis", "agent": "Community-Agent", "duration": "10 Min",
     "desc_de": "Wie du Feedback-Kultur etablierst — 10 Fragen.", "desc_en": "How to establish feedback culture."},
    {"day": 20, "week": 3, "title_de": "Challenger: Oprah — EQ-Test", "title_en": "Challenger: Oprah — EQ Test", "type": "action", "path": "/challengers", "xp": 30, "category": "praxis", "agent": "Simulations-Agent", "duration": "10 Min",
     "desc_de": "Oprah testet deine emotionale Intelligenz.", "desc_en": "Oprah tests your EQ."},
    {"day": 21, "week": 3, "title_de": "Woche 3: Praxis-Check", "title_en": "Week 3: Practice Check", "type": "quiz", "path": "/challenge", "xp": 25, "category": "praxis", "agent": "Diagnose-Agent", "duration": "10 Min",
     "desc_de": "Du wendest alles an — 10 Integrationsfragen.", "desc_en": "You apply everything."},
    {"day": 22, "week": 4, "title_de": "30-Tage-Review: Fortschritt", "title_en": "30-Day Review: Progress", "type": "quiz", "path": "/challenge", "xp": 20, "category": "dominance", "agent": "Diagnose-Agent", "duration": "10 Min",
     "desc_de": "Miss deinen Fortschritt — 10 Reflexionsfragen.", "desc_en": "Measure your progress."},
    {"day": 23, "week": 4, "title_de": "Leadership-Signatur definieren", "title_en": "Define leadership signature", "type": "quiz", "path": "/challenge", "xp": 20, "category": "dominance", "agent": "Coach-Agent", "duration": "10 Min",
     "desc_de": "Dein einzigartiger Führungsstil — 10 Identitätsfragen.", "desc_en": "Your unique leadership style."},
    {"day": 24, "week": 4, "title_de": "90-Tage-Plan erstellen", "title_en": "Create 90-day plan", "type": "action", "path": "/tools", "xp": 25, "category": "dominance", "agent": "Strategie-Agent", "duration": "10 Min",
     "desc_de": "Dein persönlicher 90-Tage-Wachstumsplan.", "desc_en": "Your 90-day growth plan."},
    {"day": 25, "week": 4, "title_de": "Challenger: Steve Jobs", "title_en": "Challenger: Steve Jobs", "type": "action", "path": "/challengers", "xp": 30, "category": "dominance", "agent": "Coach-Agent", "duration": "10 Min",
     "desc_de": "Jobs testet dein Produktdenken.", "desc_en": "Jobs tests your product thinking."},
    {"day": 26, "week": 4, "title_de": "Personal Brand als Leader", "title_en": "Personal Brand as Leader", "type": "quiz", "path": "/challenge", "xp": 20, "category": "dominance", "agent": "Community-Agent", "duration": "10 Min",
     "desc_de": "Deine Marke aufbauen — 10 Strategie-Fragen.", "desc_en": "Build your brand."},
    {"day": 27, "week": 4, "title_de": "Enterprise: Team bewerten", "title_en": "Enterprise: Evaluate team", "type": "action", "path": "/enterprise", "xp": 25, "category": "dominance", "agent": "Strategie-Agent", "duration": "10 Min",
     "desc_de": "Enterprise-Diagnose für dein Team.", "desc_en": "Enterprise diagnosis."},
    {"day": 28, "week": 4, "title_de": "Video: Transformations-Pitch", "title_en": "Video: Transformation Pitch", "type": "action", "path": "/missions", "xp": 30, "category": "dominance", "agent": "Coach-Agent", "duration": "10 Min",
     "desc_de": "Dein finaler Pitch. Dein neues Level.", "desc_en": "Your final pitch."},
    {"day": 29, "week": 4, "title_de": "3 Leader einladen", "title_en": "Invite 3 leaders", "type": "action", "path": "/referral", "xp": 25, "category": "dominance", "agent": "Community-Agent", "duration": "10 Min",
     "desc_de": "Lade 3 Führungskräfte ein. Werde Connector.", "desc_en": "Invite 3 leaders."},
    {"day": 30, "week": 4, "title_de": "Zertifikat & Leadership-Signatur", "title_en": "Certificate & Leadership Signature", "type": "action", "path": "/referral", "xp": 50, "category": "dominance", "agent": "Diagnose-Agent", "duration": "10 Min",
     "desc_de": "Du bist nicht mehr derselbe Leader.", "desc_en": "You are no longer the same leader."},
]


class QuizSubmission(BaseModel):
    answers: dict


@router.get("/status")
async def get_challenge_status(request: Request):
    user = await get_current_user(request)
    progress = await db.challenge30_progress.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not progress:
        progress = {"user_id": user["user_id"], "started_at": datetime.now(timezone.utc).isoformat(), "completed_days": [], "current_day": 1, "total_xp_earned": 0, "quiz_scores": {}}
        await db.challenge30_progress.insert_one(progress)
    start = datetime.fromisoformat(progress["started_at"].replace("Z", "+00:00")) if isinstance(progress["started_at"], str) else progress["started_at"]
    current_day = min((datetime.now(timezone.utc) - start).days + 1, 30)
    return {
        "challenges": CHALLENGES,
        "completed_days": progress.get("completed_days", []),
        "current_day": current_day,
        "total_xp_earned": progress.get("total_xp_earned", 0),
        "quiz_scores": progress.get("quiz_scores", {}),
        "started_at": progress.get("started_at"),
        "is_complete": len(progress.get("completed_days", [])) >= 30,
    }


@router.get("/quiz/{day}")
async def get_quiz(day: int, request: Request):
    await get_current_user(request)
    if day < 1 or day > 30:
        raise HTTPException(status_code=400, detail="Tag muss zwischen 1 und 30 sein")
    challenge = next((c for c in CHALLENGES if c["day"] == day), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge nicht gefunden")
    questions = get_quiz_for_day(day)
    safe_questions = []
    for q in questions:
        item = {"q": q["q"], "type": q.get("type", "mc")}
        if q.get("type") == "coach":
            item["path"] = q.get("path", "/chat")
        elif q.get("type") == "action":
            item["path"] = q.get("path", "/tools")
        else:
            item["options"] = q.get("options", [])
        safe_questions.append(item)
    return {"day": day, "challenge": challenge, "questions": safe_questions, "total": len(safe_questions)}


def _score_quiz(questions: list, answers: dict) -> tuple:
    """Score quiz answers against questions. Returns (correct, total, results)."""
    correct = 0
    total_mc = 0
    results = []
    for i, q in enumerate(questions):
        qtype = q.get("type", "mc")
        user_answer = answers.get(str(i))
        if qtype in ("coach", "action"):
            is_correct = user_answer is not None and user_answer != -1
            if is_correct:
                correct += 1
            total_mc += 1
            results.append({"question": q["q"], "type": qtype, "correct": is_correct, "explanation": q.get("explanation", ""), "path": q.get("path", "")})
        else:
            total_mc += 1
            is_correct = user_answer == q.get("correct", -1) if q.get("correct", -1) != -1 else True
            if is_correct:
                correct += 1
            results.append({"question": q["q"], "type": "mc", "correct": is_correct, "correct_answer": q.get("correct"), "user_answer": user_answer, "explanation": q.get("explanation", "")})
    return correct, total_mc, results


async def _get_or_create_progress(user_id: str) -> dict:
    """Get existing progress or create initial record."""
    progress = await db.challenge30_progress.find_one({"user_id": user_id}, {"_id": 0})
    if not progress:
        progress = {"user_id": user_id, "started_at": datetime.now(timezone.utc).isoformat(), "completed_days": [], "total_xp_earned": 0, "quiz_scores": {}}
        await db.challenge30_progress.insert_one(progress)
    return progress


@router.post("/quiz/{day}")
async def submit_quiz(day: int, data: QuizSubmission, request: Request):
    from routes.credits import check_and_deduct_credit
    user = await get_current_user(request)

    credit_result = await check_and_deduct_credit(user, "quiz")
    if not credit_result["allowed"]:
        raise HTTPException(status_code=402, detail="no_credits")

    questions = get_quiz_for_day(day)
    if not questions:
        raise HTTPException(status_code=404, detail="Keine Fragen für diesen Tag")
    challenge = next((c for c in CHALLENGES if c["day"] == day), None)

    correct, total_mc, results = _score_quiz(questions, data.answers)
    score = round((correct / max(total_mc, 1)) * 100)
    passed = score >= 60
    xp = challenge["xp"] if passed else challenge["xp"] // 2

    progress = await _get_or_create_progress(user["user_id"])
    completed = progress.get("completed_days", [])
    quiz_scores = progress.get("quiz_scores", {})
    quiz_scores[str(day)] = score

    if day not in completed and passed:
        completed.append(day)

    await db.challenge30_progress.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"completed_days": completed, "quiz_scores": quiz_scores, "total_xp_earned": progress.get("total_xp_earned", 0) + xp}}
    )
    await record_user_action(user["user_id"], "challenge30_quiz", xp_bonus=max(0, xp - 15), metadata={"day": day, "score": score})

    return {"score": score, "correct": correct, "total": total_mc, "passed": passed, "xp_earned": xp, "results": results}


@router.post("/complete/{day}")
async def complete_challenge_day(day: int, request: Request):
    user = await get_current_user(request)
    challenge = next((c for c in CHALLENGES if c["day"] == day), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge nicht gefunden")
    progress = await db.challenge30_progress.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not progress:
        progress = {"user_id": user["user_id"], "started_at": datetime.now(timezone.utc).isoformat(), "completed_days": [], "total_xp_earned": 0, "quiz_scores": {}}
        await db.challenge30_progress.insert_one(progress)
    completed = progress.get("completed_days", [])
    if day in completed:
        return {"message": "Bereits abgeschlossen", "xp_earned": 0}
    completed.append(day)
    xp = challenge["xp"]
    await db.challenge30_progress.update_one({"user_id": user["user_id"]}, {"$set": {"completed_days": completed, "total_xp_earned": progress.get("total_xp_earned", 0) + xp}})
    await record_user_action(user["user_id"], "challenge30_day", xp_bonus=max(0, xp - 20), metadata={"day": day})
    return {"message": f"Tag {day} abgeschlossen!", "xp_earned": xp, "total_completed": len(completed)}
