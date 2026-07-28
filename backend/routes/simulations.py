"""Simulation routes."""
from fastapi import APIRouter, HTTPException, Request
import uuid
import json
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

from config import db, EMERGENT_LLM_KEY, logger
from models import SimulationStart, SimulationMessage, ArgumentationPrep
from services import get_current_user, clean_ai_text, update_user_scores, SIMULATION_SYSTEM_PROMPT
from services_actions import record_user_action
from data import SIMULATION_SCENARIOS

router = APIRouter(prefix="/api", tags=["simulations"])


@router.get("/simulations/scenarios")
async def get_scenarios():
    return SIMULATION_SCENARIOS


@router.post("/simulations")
async def start_simulation(data: SimulationStart, request: Request):
    user = await get_current_user(request)
    sim_id = f"sim_{uuid.uuid4().hex[:12]}"
    scenario = next((s for s in SIMULATION_SCENARIOS if s["scenario_id"] == data.scenario), None)
    if not scenario:
        scenario = {"title": data.scenario, "character": "An employee", "description": data.scenario}

    # Iter 92.58 (Mert): pre-simulation briefing — user clicks counterpart
    # style + training goal BEFORE start, so the AI persona is prepared and
    # gives targeted practice instead of a generic roleplay.
    setup_block = ""
    if data.counterpart_style:
        setup_block += f"\nCounterpart behavior: {data.counterpart_style}. Stay consistently in this behavioral style."
    if data.training_goal:
        setup_block += f"\nThe manager wants to train: {data.training_goal}. Create realistic moments that give them exactly this practice opportunity."

    doc = {
        "simulation_id": sim_id, "user_id": user["user_id"], "scenario": scenario,
        "difficulty": data.difficulty, "status": "active", "messages": [], "scores": None,
        "setup_block": setup_block,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.simulations.insert_one(doc)

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"sim_{sim_id}",
            system_message=SIMULATION_SYSTEM_PROMPT + f"\n\nScenario: {scenario.get('description', '')}\nYou are playing: {scenario.get('character', 'an employee')}\nDifficulty: {data.difficulty}" + setup_block,
        )
        chat.with_model("openai", "gpt-5.2")
        ai_response = await chat.send_message(UserMessage(text="Start the simulation. Introduce yourself as the employee and set the scene."))

        await db.simulations.update_one(
            {"simulation_id": sim_id},
            {"$push": {"messages": {"role": "assistant", "content": ai_response, "timestamp": datetime.now(timezone.utc).isoformat()}}},
        )
        return {"simulation_id": sim_id, "scenario": scenario, "initial_message": clean_ai_text(ai_response)}
    except Exception as e:
        logger.error(f"Simulation start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _process_simulation_completion(sim_id: str, user_id: str, scenario: dict, ai_response: str):
    """Parse AI response for completion scores and update user stats."""
    try:
        from services_ai_parse import parse_ai_json
        scores = parse_ai_json(ai_response)
        if not scores or not scores.get("completed"):
            return None
        await db.simulations.update_one({"simulation_id": sim_id}, {"$set": {"status": "completed", "scores": scores}})
        overall = scores.get("overall_score", 0)
        await record_user_action(
            user_id,
            "simulation_completed",
            leadership_bonus=max(1, overall // 20),
            eq_bonus=max(1, scores.get("empathy_score", 0) // 25),
            comm_bonus=max(1, scores.get("clarity_score", 0) // 25),
            metadata={"simulation_id": sim_id, "scenario": scenario.get("title", ""), "overall_score": overall},
        )
        return scores
    except Exception:
        return None


@router.post("/simulations/{sim_id}/message")
async def simulation_message(sim_id: str, data: SimulationMessage, request: Request):
    from routes.credits import check_and_deduct_credit
    user = await get_current_user(request)

    credit_result = await check_and_deduct_credit(user, "simulation")
    if not credit_result["allowed"]:
        raise HTTPException(status_code=402, detail="no_credits")

    sim = await db.simulations.find_one({"simulation_id": sim_id, "user_id": user["user_id"]}, {"_id": 0})
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")

    await db.simulations.update_one(
        {"simulation_id": sim_id},
        {"$push": {"messages": {"role": "user", "content": data.message, "timestamp": datetime.now(timezone.utc).isoformat()}}},
    )

    scenario = sim["scenario"]
    try:
        end_sim = data.message.lower().strip() in ["end simulation", "end", "finish"]

        # RAG: pull Wlad-corpus chunks ONLY on simulation-end (where scoring/feedback
        # happens). During the role-play turns we want the AI to stay in-character,
        # so we don't pollute the prompt with framework citations. End-state needs
        # Wlad-grounding for the final assessment + scoring rubric.
        rag_block = ""
        if end_sim:
            try:
                from services_rag import retrieve_context
                msgs_so_far = sim.get("messages", [])
                user_lines = " ".join(
                    m["content"][:200] for m in msgs_so_far if m["role"] == "user"
                )[:600]
                rag_query = f"{scenario.get('description', '')} Feedback Leadership Bewertung {user_lines}"
                rag_ctx = await retrieve_context(rag_query)
                if rag_ctx.get("rag_active"):
                    rag_block = "\n\n" + rag_ctx["context_block"]
            except Exception:
                pass

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"sim_{sim_id}",
            system_message=(
                SIMULATION_SYSTEM_PROMPT
                + f"\n\nScenario: {scenario.get('description', '')}\nYou are playing: {scenario.get('character', 'an employee')}"
                + sim.get("setup_block", "")
                + rag_block
            ),
        )
        chat.with_model("openai", "gpt-5.2")

        msgs = sim.get("messages", [])
        context = "\n".join([f"{'Manager' if m['role'] == 'user' else 'Employee'}: {m['content']}" for m in msgs[-8:]])

        prompt = f"{context}\nManager: {data.message}"
        if end_sim:
            prompt += "\n\nThe simulation is now ending. Provide the JSON analysis with scores."

        ai_response = await chat.send_message(UserMessage(text=prompt))

        await db.simulations.update_one(
            {"simulation_id": sim_id},
            {"$push": {"messages": {"role": "assistant", "content": ai_response, "timestamp": datetime.now(timezone.utc).isoformat()}}},
        )

        scores = None
        if end_sim or '"completed"' in ai_response:
            scores = await _process_simulation_completion(sim_id, user["user_id"], scenario, ai_response)

        return {"response": clean_ai_text(ai_response), "scores": scores, "ended": scores is not None and scores.get("completed")}
    except Exception as e:
        logger.error(f"Simulation message error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/simulations")
async def list_simulations(request: Request):
    user = await get_current_user(request)
    return await db.simulations.find({"user_id": user["user_id"]}, {"_id": 0, "messages": 0}).sort("created_at", -1).to_list(50)


@router.get("/simulations/{sim_id}")
async def get_simulation(sim_id: str, request: Request):
    user = await get_current_user(request)
    sim = await db.simulations.find_one({"simulation_id": sim_id, "user_id": user["user_id"]}, {"_id": 0})
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return sim


# ─── Iter 121.6: Argumentation-Preparation (SEXIER-Framework Coaching) ───
ARGUMENTATION_PREP_PROMPT = """Du bist WLAD JACHTCHENKO als Argumentations-Coach.
Der User bereitet eine wichtige, echte Argumentation/Gespräch vor. Deine Aufgabe:
strukturiere, prüfe und STÄRKE seine Argumentation mit dem SEXIER-Framework.

SEXIER-FRAMEWORK (Wlads Signatur-Modell):
S – Statement    (Die glasklare These)
E – Explanation  (Warum ist das wahr? Die Begründung.)
X – eXample      (Ein konkretes, greifbares Beispiel)
I – Impact       (Warum ist das für den Gegenüber relevant?)
E – Explanation of Impact (Warum genau diese Wirkung? Emotional/logisch verankern.)
R – Rebuttal     (Der stärkste Gegen-Einwand + deine überzeugende Antwort)

ANTWORT-STRUKTUR (verbindlich, immer diese Reihenfolge):

## 1. Situationsanalyse
- Kontext in einem Satz zusammengefasst.
- Machtverhältnis / Beziehungsdynamik in einem Satz.
- Der eine ENTSCHEIDENDE Hebel für dieses Gespräch.

## 2. Deine 3 stärksten Argumente — als vollständige SEXIER-Blöcke
Für JEDES Argument (max 3, priorisiert):
**Argument 1: <Kurz-Titel>**
- S: <Statement>
- E: <Explanation>
- X: <Example>
- I: <Impact>
- E²: <Explanation of Impact>
- R: <Rebuttal — der wahrscheinlichste Einwand + Antwort>

## 3. Erwartete Einwände & Rebuttals
Liste die 3 wahrscheinlichsten Einwände des Gegenübers auf UND für jeden:
- **Einwand:** <Zitat-artig>
- **Verborgenes Interesse dahinter:** <emotional/politisch/finanziell?>
- **Deine Antwort:** <konkrete Formulierung, die entkräftet + eigenes Argument stärkt>

## 4. Framing & Wording
- Öffnungssatz (wörtlich, den du sagen kannst).
- 3 Formulierungen, die du vermeiden solltest (typische Schwächen des Users identifizieren).
- 3 Power-Formulierungen, die du stattdessen nutzt.

## 5. Schwachstellen deiner Argumentation
Ehrliche 2–3 Punkte, wo dein Argument angreifbar ist. KEIN Sugar-Coating.

## 6. Ready-to-Use-Strategie (der Endzustand)
- Der 3-Satz-Elevator-Pitch, den du bei Meeting-Start sagen kannst.
- Der Fallback-Satz, wenn das Gespräch entgleist.
- Der Zielsatz für den Deal-Close.

Nutze Wlads klare, direkte Sprache. Nie generisch, immer spezifisch auf DIESEN Fall.
Antworte auf Deutsch."""


@router.post("/simulations/argumentation-prep")
async def argumentation_prep(data: ArgumentationPrep, request: Request):
    """Guided argumentation preparation via SEXIER framework.

    Consumes the wizard-collected context/arguments/objections and returns a
    complete, ready-to-use argumentation strategy. Deliberately NOT started
    as a simulation — the strategy is meant to feed INTO the next simulation.

    Response: {strategy_id, strategy_markdown, sexier_ready: True}
    """
    user = await get_current_user(request)
    strategy_id = f"argprep_{uuid.uuid4().hex[:12]}"

    # Build a compact context brief for the LLM.
    def _row(label: str, value: str | None) -> str:
        return f"- **{label}:** {value.strip()}" if value and value.strip() else ""

    brief_lines = [
        "## Kontext",
        _row("Hintergrund", data.background),
        _row("Ziel des Gesprächs", data.goal),
        _row("Beziehung zum Gegenüber", data.relationship),
        "",
        "## Meine Argumente",
        _row("Kernpunkte", data.main_points),
        _row("Belege / Evidenz", data.evidence),
        _row("Priorisierung", data.prioritised),
        "",
        "## Erwartete Gegenseite",
        _row("Wahrscheinliche Einwände", data.expected_objections),
        _row("Meine Gegenargumente (Rohentwurf)", data.counterarguments),
        _row("Verborgene Interessen der Gegenseite", data.hidden_interests),
        "",
    ]
    if data.coaching_focus:
        brief_lines.append(f"## Coaching-Fokus\n- {data.coaching_focus.strip()}\n")
    brief = "\n".join(line for line in brief_lines if line is not None)

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=strategy_id,
            system_message=ARGUMENTATION_PREP_PROMPT,
        )
        chat.with_model("openai", "gpt-5.2")
        strategy = await chat.send_message(UserMessage(text=(
            "Der User hat folgenden Vorbereitungs-Brief eingereicht. "
            "Baue daraus die vollständige SEXIER-Argumentations-Strategie nach "
            "der oben definierten 6-Sektionen-Struktur.\n\n" + brief
        )))
        strategy_clean = clean_ai_text(strategy)

        await db.argumentation_strategies.insert_one({
            "strategy_id": strategy_id,
            "user_id": user["user_id"],
            "input": data.model_dump(),
            "strategy_markdown": strategy_clean,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        # Grant leadership XP for going through the prep flow
        try:
            await record_user_action(
                user["user_id"],
                "argumentation_prep_completed",
                leadership_bonus=3,
                comm_bonus=2,
                metadata={"strategy_id": strategy_id},
            )
        except Exception:
            pass

        return {
            "strategy_id": strategy_id,
            "strategy_markdown": strategy_clean,
            "sexier_ready": True,
        }
    except Exception as e:
        logger.error(f"Argumentation-prep error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
