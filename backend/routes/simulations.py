"""Simulation routes."""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
import uuid
import re
from datetime import datetime, timezone
# Migration → lib.llm_provider (bit-identische API, Provider per ENV).
from lib.llm_provider import LlmChat, UserMessage

from config import db, EMERGENT_LLM_KEY, logger
from models import SimulationStart, SimulationMessage, ArgumentationPrep, ArgumentationTemplateIn
from services import get_current_user, clean_ai_text, SIMULATION_SYSTEM_PROMPT
from services_actions import record_user_action
from data import SIMULATION_SCENARIOS
from routes.argumentation_prep_pdf import render_strategy_pdf
from services_ai_errors import ai_http_error

router = APIRouter(prefix="/api", tags=["simulations"])


# ── Auto-Tags (Iter 124.6): heuristic keyword mapping — kein extra LLM-Call ─
TAG_KEYWORDS: list[tuple[str, list[str]]] = [
    ("Gehalt",         ["gehalt", "lohn", "salary", "vergütung", "bonus", "erhöhung", "raise"]),
    ("CFO",            ["cfo", "finanzchef", "finanzchefin", "finanzvorstand"]),
    ("Board",          ["board", "vorstand", "aufsichtsrat", "beirat"]),
    ("Team",           ["team-mitglied", "mitarbeiter", "kollege", "kollegin", "einstellung", "onboarding"]),
    ("Kündigung",      ["kündigung", "trennung", "entlassung", "layoff", "pip"]),
    ("Kunde",          ["kunde", "kundin", "sla", "key-account", "customer", "eskalation"]),
    ("Chef",           ["chef", "vorgesetzt", "manager", "boss"]),
    ("Delegation",     ["delegation", "übergabe", "verantwortung abgeben"]),
    ("Board-Präs",     ["präsentation", "pitch", "vorstellen", "vorlage"]),
    ("Feedback",       ["feedback", "review", "kritik"]),
    ("Priorisierung",  ["priorität", "backlog", "roadmap"]),
    ("Retention",      ["retention", "verbleib", "bindung", "fluktuation"]),
    ("Budget",         ["budget", "kosten", "invest", "roi", "risiko"]),
    ("Konflikt",       ["konflikt", "streit", "reibung"]),
]


def _auto_tags(prep_input: dict, strategy_text: str = "") -> list[str]:
    """Extract 3-5 short tags for later search / grouping in Prep-History."""
    haystack = " ".join([
        (prep_input or {}).get("background") or "",
        (prep_input or {}).get("goal") or "",
        (prep_input or {}).get("relationship") or "",
        (prep_input or {}).get("main_points") or "",
        strategy_text or "",
    ]).lower()
    if not haystack.strip():
        return []
    tags: list[str] = []
    for tag, needles in TAG_KEYWORDS:
        if any(n in haystack for n in needles):
            tags.append(tag)
        if len(tags) >= 5:
            break
    return tags


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
        raise await ai_http_error(e, "simulations")


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
    from routes.credits import check_and_deduct_credit, no_credits_detail
    user = await get_current_user(request)

    credit_result = await check_and_deduct_credit(user, "simulation")
    if not credit_result["allowed"]:
        raise HTTPException(status_code=402, detail=no_credits_detail("simulation", credit_result))

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
        raise await ai_http_error(e, "simulations")


@router.get("/simulations")
async def list_simulations(request: Request):
    user = await get_current_user(request)
    return await db.simulations.find({"user_id": user["user_id"]}, {"_id": 0, "messages": 0}).sort("created_at", -1).to_list(50)


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


# Iter 128 (Godmode Context-Layer): build a compact "who is this user" block
# so every argumentation-prep strategy is personalised — profile info, latest
# leader-diagnose scores, and recurring coaching patterns from prior preps.
async def _build_user_context_block(user: dict) -> str:
    lines: list[str] = []
    name = (user.get("name") or "").strip()
    role_pos = (user.get("position") or "").strip()
    company = (user.get("company") or "").strip()
    industry = (user.get("industry") or "").strip()
    if name or role_pos or company:
        header_bits = [b for b in [role_pos, f"@ {company}" if company else ""] if b]
        who = f"{name}" if name else "Der User"
        role_line = " · ".join(header_bits)
        lines.append(f"- **Wer:** {who}" + (f" — {role_line}" if role_line else ""))
    if industry:
        lines.append(f"- **Branche:** {industry}")

    # Iter 131.2 (Wlad-Direktive): use onboarding answers as real context —
    # role/team_size/primary_goal/experience_level are set during Onboarding
    # (routes.wladhub.save_onboarding_data) and must flow into every prep.
    onboard_role = (user.get("role") or "").strip()
    if onboard_role and onboard_role != role_pos:
        lines.append(f"- **Selbsteinschätzung Rolle:** {onboard_role}")
    if user.get("team_size"):
        lines.append(f"- **Teamgröße:** {user['team_size']}")
    if user.get("primary_goal"):
        lines.append(f"- **Primäres Wachstumsziel:** {user['primary_goal']}")
    if user.get("experience_level"):
        lines.append(f"- **Erfahrungslevel:** {user['experience_level']}")

    # Latest diagnose / self-assessed scores (0-100) — supports both the
    # legacy top-level score fields and the new wladhub_scores dict.
    scores = []
    for key, label in (("leadership_score", "Leadership"), ("communication_score", "Kommunikation"), ("eq_score", "EQ")):
        v = user.get(key)
        if isinstance(v, (int, float)) and v > 0:
            scores.append(f"{label} {int(v)}")
    wh = user.get("wladhub_scores") or {}
    for key, label in (("ki_kompetenz", "KI-Kompetenz"), ("boardroom_rhetorik", "Boardroom-Rhetorik"), ("strategisches_eq", "Strategisches EQ")):
        v = wh.get(key)
        if isinstance(v, (int, float)) and v > 0:
            scores.append(f"{label} {int(v)}")
    if scores:
        lines.append("- **Aktuelle Scores:** " + " · ".join(scores))

    # Recurring coaching signals — reuse the coaching-memory helpers so a
    # user's "growth edge" is baked into every new strategy.
    try:
        docs = await db.argumentation_strategies.find(
            {"user_id": user["user_id"]},
            {"_id": 0, "input": 1, "strategy_markdown": 1, "tags": 1, "created_at": 1},
        ).sort("created_at", -1).limit(20).to_list(20)
        if docs:
            weak_dims = _weak_sexier_dimensions(docs)
            objections = _recurring_objections(docs)
            if weak_dims:
                lines.append("- **Wachstumskante (SEXIER):** "
                             + ", ".join(d.get("dimension", "") for d in weak_dims[:2] if d.get("dimension")))
            if objections:
                labels = [o.get("label", "") for o in objections[:3] if o.get("label")]
                if labels:
                    lines.append("- **Wiederkehrende Einwände in bisherigen Preps:** " + " · ".join(labels))
            lines.append(f"- **Vorbereitungs-Erfahrung:** {len(docs)} SEXIER-Strategien bisher")
    except Exception as e:  # pragma: no cover — context is enrichment, never blocks
        logger.warning(f"user-context enrichment failed: {e}")

    if not lines:
        return ""
    return "## Über den User (nutze das für Ton, Framing und Personalisierung)\n" + "\n".join(lines) + "\n"


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

    # Iter 128 (Wlad-Direktive · Godmode Context-Layer): every strategy is
    # personalised. We inject a compact "who is this user" block so gpt-5.2
    # doesn't produce generic advice — it grounds tone, hooks, and framing in
    # the leader's real profile, scores, and prior coaching patterns.
    user_ctx = await _build_user_context_block(user)

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
    if user_ctx:
        brief = user_ctx + "\n" + brief

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
        tags = _auto_tags(data.model_dump(), strategy_clean)

        await db.argumentation_strategies.insert_one({
            "strategy_id": strategy_id,
            "user_id": user["user_id"],
            "input": data.model_dump(),
            "strategy_markdown": strategy_clean,
            "tags": tags,
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
            "tags": tags,
            "sexier_ready": True,
        }
    except Exception as e:
        logger.error(f"Argumentation-prep error: {e}")
        raise await ai_http_error(e, "simulations")


# ── Prep-History & Custom Templates (Iter 124 — Wlad Godmode) ────────────────

def _prep_history_label(input_data: dict) -> str:
    """Auto-generate a short label from the user's goal or background."""
    for key in ("goal", "background", "main_points"):
        v = (input_data or {}).get(key) or ""
        v = v.strip()
        if v:
            return v[:70] + ("…" if len(v) > 70 else "")
    return "Argumentations-Prep"


@router.get("/simulations/argumentation-prep/history")
async def argumentation_prep_history(request: Request, limit: int = 25):
    """Return the recent SEXIER-strategies for the current user (newest first).

    Iter 124.7: raised default limit to 25 so History-Sheet + tag-filters get
    a useful working set. Frontend renders the first ~10 by default.
    """
    user = await get_current_user(request)
    limit = max(5, min(100, int(limit or 25)))
    cursor = db.argumentation_strategies.find(
        {"user_id": user["user_id"]},
        {"_id": 0, "strategy_id": 1, "input": 1, "strategy_markdown": 1, "tags": 1, "created_at": 1},
    ).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    out = []
    for d in docs:
        # Backfill tags on the fly for older docs that didn't get them at write time.
        tags = d.get("tags")
        if not tags:
            tags = _auto_tags(d.get("input") or {}, d.get("strategy_markdown") or "")
        out.append({
            "strategy_id": d.get("strategy_id"),
            "label": _prep_history_label(d.get("input") or {}),
            "tags": tags[:5],
            "created_at": d.get("created_at"),
            "has_strategy": bool(d.get("strategy_markdown")),
        })
    return out


# ── Coaching Memory (Iter 124.7 · flywheel foundation) ──────────────────────
# Turns raw history into insight: „Du preparest zu 72% CFO-Themen · schwächster
# SEXIER-Block: Emotion · zuletzt häufig auf 'zu emotional'-Coaching gefragt".
# This is the moat: each session makes the next session smarter.

_SEXIER_KEYWORDS = {
    "Statement":   ["statement", "position", "these", "einstieg", "opening"],
    "Evidence":    ["evidence", "belege", "zahlen", "daten", "beleg", "roi"],
    "eXample":     ["example", "beispiel", "case", "fall"],
    "Impact":      ["impact", "nutzen", "wert", "consequence", "auswirkung"],
    "Emotion":     ["emotion", "gefühl", "framing", "story", "narrative"],
    "Rebuttal":    ["rebuttal", "einwand", "gegen", "objection", "widerlegung"],
}


def _weak_sexier_dimensions(preps: list[dict]) -> list[dict]:
    """Return SEXIER dimensions the user has explicitly asked coaching help on
    (via `coaching_focus`), sorted by frequency."""
    from collections import Counter
    counter: Counter = Counter()
    for p in preps:
        focus = ((p.get("input") or {}).get("coaching_focus") or "").lower()
        if not focus:
            continue
        for dim, keys in _SEXIER_KEYWORDS.items():
            if any(k in focus for k in keys):
                counter[dim] += 1
    return [{"dimension": d, "count": c} for d, c in counter.most_common(3)]


def _recurring_objections(preps: list[dict]) -> list[dict]:
    """Extract the most common objection-lines the user has anticipated across
    preps. Splits on bullets/newlines/numbers AND sentence endings so we catch
    real patterns even when users write in flowing text."""
    from collections import Counter
    counter: Counter = Counter()
    displays: dict[str, str] = {}
    for p in preps:
        text = ((p.get("input") or {}).get("expected_objections") or "").strip()
        if not text:
            continue
        # Split on bullets, newlines, semi-colons, numbered lists, AND full stops
        # followed by whitespace (so "A. B." → ["A", "B"]).
        for chunk in re.split(r"[·•\-\n\r;]+|\d+\.\s+|(?<=[.!?])\s+(?=[A-ZÄÖÜ])", text):
            display = chunk.strip().strip('.,"\'„"')
            key = re.sub(r"\s+", " ", display).lower()
            if 12 <= len(key) <= 90:
                counter[key] += 1
                # Keep the first prettified display form we see
                displays.setdefault(key, display)
    top = [
        {"text": displays.get(k, k).capitalize(), "count": c}
        for k, c in counter.most_common(4) if c >= 2
    ]
    return top


def _30d_trend(preps: list[dict]) -> dict:
    """Return {last_30_days, prev_30_days, delta_pct}."""
    now = datetime.now(timezone.utc)
    last30 = 0
    prev30 = 0
    for p in preps:
        iso = p.get("created_at") or ""
        try:
            dt = datetime.fromisoformat(iso)
        except Exception:
            continue
        age_days = (now - dt).days
        if age_days < 30:
            last30 += 1
        elif age_days < 60:
            prev30 += 1
    delta_pct = None
    if prev30 > 0:
        delta_pct = round(((last30 - prev30) / prev30) * 100)
    return {"last_30_days": last30, "prev_30_days": prev30, "delta_pct": delta_pct}


def _next_focus(tags_top: list[dict], weak_dims: list[dict]) -> str:
    """Compose Wlad's one-line coaching recommendation for the next prep."""
    if weak_dims and tags_top:
        return (
            f"Du preparest häufig {tags_top[0]['label']}-Situationen. "
            f"Dein schwächster SEXIER-Block ist {weak_dims[0]['dimension']} — "
            f"nutze deine nächste Session gezielt dafür."
        )
    if tags_top and tags_top[0]["count"] >= 3:
        return (
            f"Du hast {tags_top[0]['count']} Preps zum Thema {tags_top[0]['label']}. "
            "Dedizierter Sparring-Track empfohlen."
        )
    if weak_dims:
        return f"Trainier fokussiert dein {weak_dims[0]['dimension']}-Framing."
    return "Noch nicht genug Daten für ein Muster — mach 3-4 weitere Preps."


@router.get("/simulations/coaching-memory")
async def coaching_memory(request: Request):
    """Cross-session coaching insight: patterns, trends, next-focus.

    This is the endpoint that turns Leader-OS from a text-generator into a
    real coach: „your last 5 preps all had low Emotion focus — this is your
    growth edge". Feeds the History-Sheet hero panel.
    """
    from collections import Counter
    user = await get_current_user(request)
    docs = await db.argumentation_strategies.find(
        {"user_id": user["user_id"]},
        {"_id": 0, "input": 1, "strategy_markdown": 1, "tags": 1, "created_at": 1},
    ).sort("created_at", -1).limit(200).to_list(200)

    # Backfill tags in-memory for older docs so patterns include everything.
    for d in docs:
        if not d.get("tags"):
            d["tags"] = _auto_tags(d.get("input") or {}, d.get("strategy_markdown") or "")

    tag_counter: Counter = Counter()
    for d in docs:
        for t in (d.get("tags") or []):
            tag_counter[t] += 1
    total = len(docs)
    tags_top = [
        {"label": t, "count": c, "share_pct": round(c / total * 100) if total else 0}
        for t, c in tag_counter.most_common(6)
    ]

    weak_dims = _weak_sexier_dimensions(docs)
    objections = _recurring_objections(docs)
    trend = _30d_trend(docs)
    next_focus = _next_focus(tags_top, weak_dims)

    return {
        "total_preps": total,
        "tags_top": tags_top,
        "weak_sexier_dimensions": weak_dims,
        "recurring_objections": objections,
        "trend_30d": trend,
        "next_focus": next_focus,
        "has_signal": total >= 3,
    }


@router.get("/simulations/argumentation-prep/history/{strategy_id}")
async def argumentation_prep_get(strategy_id: str, request: Request):
    """Re-open a previously generated strategy (own docs only)."""
    user = await get_current_user(request)
    doc = await db.argumentation_strategies.find_one(
        {"strategy_id": strategy_id, "user_id": user["user_id"]},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Prep not found")
    tags = doc.get("tags") or _auto_tags(doc.get("input") or {}, doc.get("strategy_markdown") or "")
    return {
        "strategy_id": doc.get("strategy_id"),
        "input": doc.get("input") or {},
        "strategy_markdown": doc.get("strategy_markdown") or "",
        "tags": tags[:5],
        "created_at": doc.get("created_at"),
    }


@router.get("/simulations/argumentation-prep/history/{strategy_id}/pdf")
async def argumentation_prep_pdf(strategy_id: str, request: Request):
    """Download the strategy as a branded Wlad Leader-OS PDF (own docs only)."""
    user = await get_current_user(request)
    doc = await db.argumentation_strategies.find_one(
        {"strategy_id": strategy_id, "user_id": user["user_id"]},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Prep not found")
    tags = doc.get("tags") or _auto_tags(doc.get("input") or {}, doc.get("strategy_markdown") or "")
    prep_input = doc.get("input") or {}
    goal = (prep_input.get("goal") or "").strip() or "Meine Argumentations-Strategie"
    user_name = (user.get("name") or user.get("email", "").split("@")[0] or "Leader").strip()
    pdf_bytes = render_strategy_pdf(
        strategy_markdown=doc.get("strategy_markdown") or "",
        user_name=user_name,
        prep_goal=goal,
        tags=tags[:5],
    )
    # Filename-safe slug from goal
    slug = re.sub(r"[^a-z0-9]+", "-", goal.lower()).strip("-")[:40] or "sexier-strategie"
    filename = f"sexier-strategie-{slug}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/simulations/argumentation-prep/history/{strategy_id}")
async def argumentation_prep_delete(strategy_id: str, request: Request):
    """Delete a previously generated strategy (own docs only)."""
    user = await get_current_user(request)
    res = await db.argumentation_strategies.delete_one(
        {"strategy_id": strategy_id, "user_id": user["user_id"]},
    )
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prep not found")
    return {"deleted": True}


# ── Custom Templates ────────────────────────────────────────────────────────

@router.get("/simulations/argumentation-templates")
async def list_templates(request: Request):
    """Return current user's private templates (newest first, max 20)."""
    user = await get_current_user(request)
    cursor = db.argumentation_templates.find(
        {"user_id": user["user_id"]},
        {"_id": 0},
    ).sort("created_at", -1).limit(20)
    docs = await cursor.to_list(length=20)
    return docs


@router.post("/simulations/argumentation-templates")
async def create_template(data: ArgumentationTemplateIn, request: Request):
    """Save a custom Prep-Template (private + shareable via share_token)."""
    user = await get_current_user(request)
    tpl_id = f"argtpl_{uuid.uuid4().hex[:12]}"
    share_token = uuid.uuid4().hex[:16]
    doc = {
        "template_id": tpl_id,
        "user_id": user["user_id"],
        "label": (data.label or "").strip() or "Meine Vorlage",
        "hint": (data.hint or "").strip(),
        "data": data.data.model_dump(),
        "share_token": share_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.argumentation_templates.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.delete("/simulations/argumentation-templates/{template_id}")
async def delete_template(template_id: str, request: Request):
    user = await get_current_user(request)
    res = await db.argumentation_templates.delete_one(
        {"template_id": template_id, "user_id": user["user_id"]},
    )
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"deleted": True}


@router.get("/simulations/argumentation-templates/shared/{share_token}")
async def get_shared_template(share_token: str, request: Request):
    """Public-ish endpoint: anyone with the share_token can import a template.
    Still requires an authenticated session so we can attribute imports."""
    await get_current_user(request)  # auth-gate
    doc = await db.argumentation_templates.find_one(
        {"share_token": share_token},
        {"_id": 0, "user_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Shared template not found")
    return doc


# ── Catch-all simulation GET route — MUST stay last so specific paths win ───
@router.get("/simulations/{sim_id}")
async def get_simulation(sim_id: str, request: Request):
    user = await get_current_user(request)
    sim = await db.simulations.find_one({"simulation_id": sim_id, "user_id": user["user_id"]}, {"_id": 0})
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return sim
