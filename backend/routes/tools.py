"""Tools/Workflows routes."""
from fastapi import APIRouter, HTTPException, Request
import uuid
import json
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

from config import db, EMERGENT_LLM_KEY, logger
from services import get_current_user
from services_actions import record_user_action
from data import TOOL_PROMPTS
from services_ai_errors import ai_http_error

router = APIRouter(prefix="/api", tags=["tools"])


@router.get("/tools")
async def get_tools():
    return [{"tool_id": k, "title": v["title"]} for k, v in TOOL_PROMPTS.items()]


def _build_deep_assist_prompts(situation: str, goal: str, tool_id: str | None) -> tuple[str, str]:
    """Build (system_prompt, user_message) for deep_assist."""
    context_hint = ""
    if tool_id and tool_id in TOOL_PROMPTS:
        context_hint = f"Dieser Assistent ist eingebettet in den Workflow: '{TOOL_PROMPTS[tool_id]['title']}'."

    system_prompt = f"""Du bist der WladBot — Leadership-Experte trainiert auf Wlad Jachtchenkos Methoden.
Deine Aufgabe: Ein 3-teiliges Deep-Assist für den User.
{context_hint}

Antworte AUSSCHLIESSLICH als JSON mit exakt dieser Struktur:
{{
  "argumentation": "3-5 Sätze starke Argumentation basierend auf Logos/Ethos/Pathos. Konkret, nicht generisch.",
  "tips": [
    "Inhaltlicher Tipp 1 — konkret umsetzbar",
    "Inhaltlicher Tipp 2",
    "Inhaltlicher Tipp 3",
    "Inhaltlicher Tipp 4",
    "Inhaltlicher Tipp 5"
  ],
  "action_plan": [
    {{"step": 1, "action": "Konkrete Handlung", "deadline": "Heute / diese Woche / diesen Monat", "why": "Kurze Begründung"}},
    {{"step": 2, "action": "...", "deadline": "...", "why": "..."}},
    {{"step": 3, "action": "...", "deadline": "...", "why": "..."}},
    {{"step": 4, "action": "...", "deadline": "...", "why": "..."}},
    {{"step": 5, "action": "...", "deadline": "...", "why": "..."}}
  ]
}}

WICHTIG: Deutsche Sprache. Konkret. Messbar. Keine Floskeln."""

    user_message = f"""SITUATION:
{situation}

ZIEL:
{goal or 'Situation erfolgreich meistern'}

Erstelle jetzt Argumentation, Inhaltliche Tipps und einen konkreten Aktionsplan."""
    return system_prompt, user_message


async def _run_deep_assist_ai(system_prompt: str, user_message: str) -> dict:
    """Call the LLM and parse its JSON response (tolerant of markdown fencing).
    Raises HTTPException(422) if the model returned non-JSON after cleanup."""
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"assist_{uuid.uuid4().hex[:8]}", system_message=system_prompt)
    chat.with_model("openai", "gpt-5.2")
    raw = await chat.send_message(UserMessage(text=user_message))
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(clean)
        except json.JSONDecodeError as e:
            logger.warning(f"Deep-assist: model returned non-JSON; raw prefix: {raw[:200]}")
            raise HTTPException(
                status_code=422,
                detail="Die KI-Antwort war nicht im erwarteten Format. Bitte versuche es erneut.",
            ) from e


@router.post("/tools/deep-assist")
async def deep_assist(request: Request):
    """3-Step Workflow Assistant: Argumentation · Inhaltliche Tipps · Aktionsplan.
    Body: { situation: str, goal: str, tool_id?: str (optional) }
    Returns: { argumentation: str, tips: [str,...], action_plan: [{step,action,deadline}] }"""
    from routes.credits import check_and_deduct_credit, no_credits_detail
    user = await get_current_user(request)

    credit_result = await check_and_deduct_credit(user, "workflow")
    if not credit_result["allowed"]:
        raise HTTPException(status_code=402, detail=no_credits_detail("workflow", credit_result))

    body = await request.json()
    situation = (body.get("situation") or "").strip()
    goal = (body.get("goal") or "").strip()
    tool_id = body.get("tool_id")
    if not situation:
        raise HTTPException(status_code=400, detail="situation required")

    system_prompt, user_message = _build_deep_assist_prompts(situation, goal, tool_id)

    try:
        parsed = await _run_deep_assist_ai(system_prompt, user_message)
        await db.deep_assist_log.insert_one({
            "usage_id": f"da_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
            "situation": situation, "goal": goal, "tool_id": tool_id,
            "output": parsed, "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await record_user_action(user["user_id"], "deep_assist", metadata={"tool_id": tool_id})
        return parsed
    except Exception as e:
        logger.error(f"Deep assist error: {e}")
        raise await ai_http_error(e, "tools")


@router.post("/tools/{tool_id}")
async def use_tool(tool_id: str, request: Request):
    from routes.credits import check_and_deduct_credit, no_credits_detail
    from services_ai_parse import parse_ai_json
    user = await get_current_user(request)

    credit_result = await check_and_deduct_credit(user, "workflow")
    if not credit_result["allowed"]:
        raise HTTPException(status_code=402, detail=no_credits_detail("workflow", credit_result))

    body = await request.json()
    user_input = body.get("input", "")
    persona = body.get("persona", "")
    if not user_input:
        raise HTTPException(status_code=400, detail="Input required")
    tool = TOOL_PROMPTS.get(tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    try:
        persona_context = f"\n\nPERSONA-KONTEXT des Users:\n{persona}\nNutze diesen Kontext, um die Antwort maximal zu personalisieren." if persona else ""
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"tool_{uuid.uuid4().hex[:8]}", system_message=tool["system"] + persona_context)
        chat.with_model("openai", "gpt-5.2")
        ai_response = await chat.send_message(UserMessage(text=user_input))

        # Robust JSON parse — strips markdown fences, prose-wrapping, etc.
        parsed = parse_ai_json(ai_response)
        if parsed is None:
            # Retry once asking for strict JSON
            logger.warning(f"Tool {tool_id} returned non-JSON, retrying with reformat hint")
            reformat = await chat.send_message(UserMessage(text=(
                "Deine letzte Antwort war kein gültiges JSON. Antworte JETZT ausschließlich mit "
                "dem oben spezifizierten JSON-Schema. Keine Markdown-Codefences, kein Vorwort, "
                "nur das reine JSON-Objekt."
            )))
            parsed = parse_ai_json(reformat)

        if parsed is None:
            # Final safety net — preserve raw text so user at least sees the content
            parsed = {"raw_text": ai_response, "format_error": True}

        await db.tool_usage.insert_one({
            "usage_id": f"tool_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
            "tool_id": tool_id, "input": user_input, "output": parsed,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await record_user_action(user["user_id"], "tool_used", metadata={"tool_id": tool_id})
        return {"result": parsed, "tool": tool["title"]}
    except Exception as e:
        logger.error(f"Tool error: {e}")
        raise await ai_http_error(e, "tools")

