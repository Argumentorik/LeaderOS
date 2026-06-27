from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import uuid
import logging

from models import QuizSubmit, CoachMessage

logger = logging.getLogger(__name__)

ROLE_WEIGHTS = {
    "communicator": {"rhetorik": 0.50, "fuehrung": 0.15, "eq": 0.15, "kritisches_denken": 0.10, "entscheidung": 0.05, "strategie": 0.05},
    "manager": {"entscheidung": 0.40, "kritisches_denken": 0.20, "fuehrung": 0.15, "strategie": 0.15, "rhetorik": 0.05, "eq": 0.05},
    "team_leader": {"fuehrung": 0.40, "eq": 0.25, "rhetorik": 0.15, "entscheidung": 0.10, "kritisches_denken": 0.05, "strategie": 0.05},
    "psychologist": {"eq": 0.45, "fuehrung": 0.20, "rhetorik": 0.15, "kritisches_denken": 0.10, "entscheidung": 0.05, "strategie": 0.05},
    "problem_solver": {"kritisches_denken": 0.35, "entscheidung": 0.25, "strategie": 0.15, "fuehrung": 0.10, "rhetorik": 0.10, "eq": 0.05},
    "innovator": {"strategie": 0.45, "kritisches_denken": 0.20, "entscheidung": 0.15, "rhetorik": 0.10, "fuehrung": 0.05, "eq": 0.05},
}

ROLE_LABELS = {
    "communicator": "Kommunikator", "manager": "Manager", "team_leader": "Team Leader",
    "psychologist": "Psychologe", "problem_solver": "Problemlöser", "innovator": "Innovator"
}


def calculate_category_scores(answers):
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
    # Score-Cap @ 85: kein LeaderCheck-Tester soll > 85 % bekommen.
    # (Lower scores bleiben identisch · nur Topscore wird gedeckelt.)
    cat_avg = {k: min(85, int(sum(v) / len(v) * 25)) for k, v in cat_scores.items() if v}
    layer_avg = {k: min(85, int(sum(v) / len(v) * 25)) for k, v in layer_scores.items() if v}
    total_avg = min(85, int(sum(cat_avg.values()) / len(cat_avg))) if cat_avg else 50
    return cat_avg, layer_avg, total_avg


def calculate_leadership_roles(cat_avg):
    roles = {}
    for role, weights in ROLE_WEIGHTS.items():
        score = sum(cat_avg.get(cat, 50) * weight for cat, weight in weights.items())
        roles[role] = int(round(score))
    sorted_roles = sorted(roles.items(), key=lambda x: x[1], reverse=True)
    return roles, sorted_roles[0][0], sorted_roles[-1][0]


def calculate_roi(layer_avg, total_avg):
    return {
        "hours_saved": min(12, max(3, int(layer_avg.get('ai_literacy', 50) / 10))),
        "decision_speed": round(1 + (total_avg / 50), 1),
        "performance_boost": min(35, max(10, int(total_avg / 3)))
    }


_NARRATIVE_FALLBACK = {
    "profile_title": "Leadership-Profil",
    "executive_summary": "Dein individuelles Führungsprofil wurde analysiert.",
}


def _extract_user_voice(chat_context) -> list:
    """Pull only the user's own messages from the WladBot chat transcript."""
    if not chat_context:
        return []
    turns = []
    for t in chat_context:
        role = getattr(t, "role", None) or (t.get("role") if isinstance(t, dict) else None)
        text = getattr(t, "text", None) or (t.get("text") if isinstance(t, dict) else None)
        if role == "user" and text:
            turns.append(text.strip())
    return turns[:6]


def _build_voice_block(turns: list) -> str:
    if not turns:
        return ""
    return (
        "\n\nZUSATZLICH - EIGENE WORTE DES NUTZERS (aus dem Pre-Report-Gespräch mit WladBot):\n"
        + "\n".join(f'- "{t}"' for t in turns)
        + "\n\nWICHTIG: Beziehe dich DIREKT und KONKRET auf diese selbst geschilderten Herausforderungen. "
        "Verwende den Namen der Herausforderung oder das Thema wörtlich in mindestens einem Satz des executive_summary "
        "und in einer der Empfehlungen. Der Nutzer muss SPÜREN, dass wir zugehört haben."
    )


def _build_narrative_prompt(user, cat_avg, layer_avg, total_avg, voice_block) -> str:
    has_voice = bool(voice_block)
    extra_summary = " - MUSS die vom Nutzer geschilderte Herausforderung direkt adressieren" if has_voice else ""
    extra_rec = " - MUSS konkret auf die genannte Herausforderung eingehen" if has_voice else ""
    extra_close = " - sollte auf die Herausforderung des Nutzers Bezug nehmen" if has_voice else ""
    extra_personal = "13. personal_response: Ein empathischer 2-Satz-Gruß an den Nutzer, der seine konkrete Herausforderung WÖRTLICH aufgreift und Verständnis zeigt (wie ein Coach, der wirklich zugehört hat)" if has_voice else ""

    return f"""Analysiere dieses Leadership-Profil auf Deutsch.

Benutzer: {user.get('name', 'Leader')}, Rolle: {user.get('role', 'Führungskraft')}

KATEGORIE-SCORES (0-100):
{json.dumps(cat_avg, indent=2)}

LAYER-SCORES (0-100):
- KI-Kompetenz (ai_literacy): {layer_avg.get('ai_literacy', 50)}
- Rhetorik (rhetoric): {layer_avg.get('rhetoric', 50)}
- Strategisches EQ (strategic_eq): {layer_avg.get('strategic_eq', 50)}

GESAMT: {total_avg}%{voice_block}

Erstelle eine professionelle Analyse mit diesen Abschnitten (kurz und prägnant, max 2-3 Sätze pro Abschnitt):

1. profile_title: Ein passender Titel für dieses Führungsprofil (z.B. "Der strategische Visionär")
2. executive_summary: Kernaussage über die Stärken und das Potenzial{extra_summary}
3. ai_literacy_analysis: Bewertung der KI-Kompetenz
4. rhetoric_analysis: Bewertung der Kommunikationsstärke
5. eq_analysis: Bewertung der emotionalen Intelligenz
6. top_strength: Die größte Stärke
7. growth_priority: Die wichtigste Entwicklungspriorität
8. recommendation_1: {{title, description}} - Erste Empfehlung{extra_rec}
9. recommendation_2: {{title, description}} - Zweite Empfehlung
10. recommendation_3: {{title, description}} - Dritte Empfehlung
11. urgency_message: Warum jetzt handeln? (motivierend, nicht bedrohlich)
12. closing_statement: Ein inspirierender Abschlusssatz{extra_close}
{extra_personal}

Antworte NUR mit validem JSON."""


def _parse_narrative_response(raw: str) -> dict:
    """Strip optional ```json fences and parse the JSON body."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)


async def generate_ai_narrative(llm_key, session_id, user, cat_avg, layer_avg, total_avg, chat_context=None):
    if not llm_key:
        return dict(_NARRATIVE_FALLBACK)
    try:
        turns = _extract_user_voice(chat_context)
        voice_block = _build_voice_block(turns)
        prompt = _build_narrative_prompt(user, cat_avg, layer_avg, total_avg, voice_block)

        chat = LlmChat(
            api_key=llm_key,
            session_id=f"report_{session_id}",
            system_message="Du bist ein Executive Leadership Coach.",
        )
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        response = await chat.send_message(UserMessage(text=prompt))
        return _parse_narrative_response(response)
    except Exception as e:
        logger.error(f"AI narrative error: {e}")
        return dict(_NARRATIVE_FALLBACK)


def register_quiz_routes(router: APIRouter, db, config: dict) -> None:

    @router.post("/quiz/generate-report")
    async def generate_report(data: QuizSubmit) -> dict:
        user = await db.users.find_one({"session_id": data.session_id}, {"_id": 0})
        if not user:
            user = await db.users.find_one({"user_id": data.session_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        cat_avg, layer_avg, total_avg = calculate_category_scores(data.answers)
        narrative = await generate_ai_narrative(config["llm_key"], data.session_id, user, cat_avg, layer_avg, total_avg, data.chat_context)
        leadership_roles, strongest_role, weakest_role = calculate_leadership_roles(cat_avg)
        roi = calculate_roi(layer_avg, total_avg)

        # Serialize chat_context for storage + downstream use
        chat_serialized = []
        if data.chat_context:
            chat_serialized = [{"role": t.role, "text": t.text} for t in data.chat_context]

        report = {
            "session_id": data.session_id,
            "user": {"name": user.get("name"), "role": user.get("role"), "email": user.get("email")},
            "answers_raw": [{"question_id": a.question_id, "category": a.category, "layer": a.layer, "score": a.score} for a in data.answers],
            "cat_scores": cat_avg, "layer_scores": layer_avg,
            "leadership_roles": leadership_roles,
            "strongest_role": {"key": strongest_role, "label": ROLE_LABELS[strongest_role], "score": leadership_roles[strongest_role]},
            "weakest_role": {"key": weakest_role, "label": ROLE_LABELS[weakest_role], "score": leadership_roles[weakest_role]},
            "avg_total": total_avg, "roi": roi, "narrative": narrative,
            "chat_context": chat_serialized,
            "user_challenge": next((t["text"] for t in chat_serialized if t["role"] == "user"), None),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.reports.insert_one({**report, "report_id": str(uuid.uuid4())})

        # Auto-send report email (imported lazily to avoid circular)
        from routes.email import send_auto_report_email
        await send_auto_report_email(db, config, user, report, data.session_id)

        # Enqueue 10-email nurture sequence for non-buyers
        try:
            from services.email_scheduler import enqueue_drip_sequence
            await enqueue_drip_sequence(
                db,
                email=user.get("email", ""),
                name=user.get("name", "Hey"),
                weakest_label=ROLE_LABELS.get(weakest_role, "Rhetorik"),
                weakest_score=leadership_roles.get(weakest_role, 50),
            )
        except Exception:  # noqa: BLE001
            pass  # nurture is non-critical

        return report

    @router.get("/report/{session_id}")
    async def get_report(session_id: str) -> dict:
        report = await db.reports.find_one({"session_id": session_id}, {"_id": 0})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report

    @router.post("/coach/chat")
    async def coach_chat(data: CoachMessage) -> dict:
        if not config["llm_key"]:
            return {"response": "Der WLADBOT ist derzeit nicht verfügbar."}
        user = await db.users.find_one({"session_id": data.session_id}, {"_id": 0})
        if not user:
            user = await db.users.find_one({"user_id": data.session_id}, {"_id": 0})
        report = await db.reports.find_one({"session_id": data.session_id}, {"_id": 0})

        context = f"""Du bist der WladBot – ein motivierender AI Leadership-Coach. 
Du sprichst auf Deutsch. Du bist nahbar, direkt und ehrlich. Du duzt den Benutzer. Halte deine Antworten kurz (2-4 Sätze).

Benutzer: {user.get('name', 'Leader') if user else 'Leader'}
Rolle: {user.get('role', 'Führungskraft') if user else 'Führungskraft'}
"""
        if report:
            context += f"\nProfil-Score: {report.get('avg_total', 50)}%\nStärke: {report.get('narrative', {}).get('top_strength', 'unbekannt')}\nWachstumspriorität: {report.get('narrative', {}).get('growth_priority', 'unbekannt')}\n"
        try:
            chat = LlmChat(api_key=config["llm_key"], session_id=f"coach_{data.session_id}", system_message=context)
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
            response = await chat.send_message(UserMessage(text=data.message))
            return {"response": response}
        except Exception as e:
            logger.error(f"Coach error: {e}")
            return {"response": "Ein Fehler ist aufgetreten. Bitte versuche es erneut."}
