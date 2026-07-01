"""Simulation routes."""
from fastapi import APIRouter, HTTPException, Request
import uuid
import json
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

from config import db, EMERGENT_LLM_KEY, logger
from models import SimulationStart, SimulationMessage
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
