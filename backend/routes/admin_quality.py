"""RAG answer-quality audit.

Proves that WladBot's output is genuinely *grounded in Wlad's corpus* and
*applies his frameworks* — rather than producing generic coaching language.

Design principle: this runs the **real production path** — the same
``services_rag.retrieve_context`` retrieval, the same ``WLADBOT_SYSTEM_PROMPT +
WLAD_HARD_RULES`` system prompt, and the same GPT-5.2 model that end users hit.
It deliberately does NOT re-implement the pipeline, so the audit can never drift
from what users actually receive. A second, strict LLM call acts as judge and
scores grounding, framework usage and coaching quality.

Two endpoints (both admin-guarded):
  POST /api/admin/rag-quality-audit   run the audit (optionally persist)
  GET  /api/admin/rag-quality-runs    recent persisted runs (trend view)
"""
from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
# Migration → lib.llm_provider (bit-identische API, Provider per ENV).
from lib.llm_provider import LlmChat, UserMessage

from config import db, EMERGENT_LLM_KEY, logger
from services import WLADBOT_SYSTEM_PROMPT
from services_rag import retrieve_context
from routes.admin import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin-quality"])

# Bound concurrency so an audit never floods the LLM gateway. Each query is two
# sequential model calls (generate + judge); 4 in flight keeps a full run fast
# without risking rate limits.
_MAX_CONCURRENCY = 4
_MODEL_PROVIDER = "openai"
_MODEL_NAME = "gpt-5.2"

# Pass thresholds — a query passes only if the answer actually applies a
# framework, is grounded in the injected corpus, and reads as real coaching.
_MIN_GROUNDING = 50
_MIN_COACHING = 60


# Canonical signature set — one probe per major Wlad framework/theme. This is
# the single source of truth for "does the whole curriculum come through?".
# `expect` documents the framework we'd expect a grounded answer to apply; the
# judge is told the expectation but scores the answer on its own merits.
SIGNATURE_QUERIES: list[dict[str, str]] = [
    {"q": "Mein Mitarbeiter kommt seit Wochen ständig zu spät. Wie spreche ich das an, ohne dass er dichtmacht?", "expect": "Feedbackformel (Beobachtung + Wirkung + Wunsch)"},
    {"q": "Wie überzeuge ich mein skeptisches Board von einem riskanten, aber wichtigen Investment?", "expect": "3 Säulen der Überzeugung (Logos/Ethos/Pathos)"},
    {"q": "Ich wirke in Meetings oft blass. Wie werde ich als Führungskraft charismatischer?", "expect": "Charisma-Code"},
    {"q": "Ich ertrinke in Aufgaben und weiß nicht, was zuerst. Wie priorisiere ich richtig?", "expect": "Eisenhower-Matrix"},
    {"q": "Wie strukturiere ich meinen Arbeitstag, damit ich endlich an den wichtigen Dingen arbeite?", "expect": "ALPEN-Methode"},
    {"q": "Was sind die zentralen Rollen, die ich als frische Führungskraft beherrschen muss?", "expect": "Die 5 Rollen einer Führungskraft"},
    {"q": "Mein Teammitglied fühlt sich nicht gehört. Wie führe ich ein Gespräch, in dem es sich wirklich verstanden fühlt?", "expect": "10 Stufen des Zuhörens (nicht \"5 Ebenen\")"},
    {"q": "Ich mache zu viel selbst und mein Team wächst nicht. Wie delegiere ich richtig?", "expect": "Delegation als Befähigung"},
    {"q": "In einer Diskussion hat mich ein Kollege mit einem Strohmann-Argument blamiert. Wie kontere ich sowas?", "expect": "Dunkle Rhetorik Defense"},
    {"q": "Ein Feedback von mir ist völlig falsch angekommen. Wie sorge ich dafür, dass meine Botschaft ankommt wie gemeint?", "expect": "Kommunikationsquadrant"},
    {"q": "Wie verhandle ich mein Gehalt, ohne die Beziehung zum Chef zu beschädigen?", "expect": "Harvard-Prinzip / Wlads Verhandlungs-Framework"},
    {"q": "Mir fällt nie rechtzeitig eine gute Antwort ein, wenn mich jemand angreift. Wie werde ich schlagfertiger?", "expect": "Schlagfertigkeitstechniken"},
    {"q": "Mein Team ist sehr unterschiedlich — wie gehe ich auf die verschiedenen Persönlichkeitstypen ein?", "expect": "4-Farben-Modell"},
    {"q": "Wie mache ich eine trockene Quartalspräsentation so, dass sie wirklich hängen bleibt?", "expect": "Business Storytelling"},
    {"q": "Zwei meiner besten Leute sind im offenen Konflikt. Wie moderiere ich das?", "expect": "Wlads Konfliktgespräch / 4 Gesprächstypen"},
    {"q": "Ein guter Mitarbeiter hat innerlich gekündigt. Wie motiviere ich ihn nachhaltig wieder?", "expect": "Mitarbeiter-Motivation 4.0"},
    {"q": "Wie überzeuge ich ehrlich und ohne Manipulation, auch wenn die Fakten gegen mich stehen?", "expect": "Weiße Rhetorik"},
    # Explicit SEXIER probe: this framework had a documented corpus-chunk bug
    # (layer202_drills used Repeat/Implications/Evidence instead of the real
    # Rebuttal/Impact/Explanation of Impact — see docs/gtm/WLAD_CANON.md). WLAD_HARD_RULES
    # now hard-codes the correct definition, but nothing in this signature set
    # actually probed SEXIER directly until now — this closes that regression gap.
    {"q": "Ich muss nächste Woche eine wichtige Firmenrede halten und will sie strukturiert und überzeugend aufbauen. Wie gehe ich vor?", "expect": "SEXIER-Modell (Statement/Explanation/eXample/Impact/Explanation of Impact/Rebuttal)"},
]


_JUDGE_SYSTEM = """Du bist ein strenger QA-Prüfer für Leadership-Coaching-Antworten von "WladBot".
Du bewertest, ob eine Antwort echtes, in Wlad Jachtchenkos Material verankertes Coaching ist
— oder generische KI-Ratgeber-Sprache.

Du erhältst: die User-Frage, das erwartete Framework, die der KI bereitgestellten Korpus-Auszüge
und die zu prüfende Antwort.

Antworte AUSSCHLIESSLICH mit validem JSON (kein Markdown):
{
  "framework_named": "<das konkret in der Antwort genannte Wlad-Framework, sonst ''>",
  "applies_framework": true|false,    // wird das Framework konkret ANGEWENDET (Skript/Beispielsatz), nicht nur erwähnt?
  "grounded_in_corpus": 0-100,        // wie stark stützt sich die Antwort auf die bereitgestellten Auszüge?
  "generic": true|false,              // generische Coaching-Sprache ohne Wlad-Substanz?
  "coaching_quality": 0-100,          // Bogen Diagnose → Framework-Wahl → Anwendung → Wachstum erkennbar?
  "reason": "<eine knappe Begründung>"
}"""


class AuditRequest(BaseModel):
    """Optional overrides; sensible defaults run the full signature set."""
    persist: bool = Field(default=True, description="Store the run in rag_quality_runs for trending.")
    queries: Optional[list[dict[str, str]]] = Field(default=None, description="Override the signature set; each item needs 'q' (and optionally 'expect').")


def _safe_json(raw: str) -> Optional[dict]:
    """Parse model output that may be wrapped in prose or markdown fences."""
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None


async def _generate_answer(query: str, system_msg: str) -> str:
    """Run the exact production generation step (GPT-5.2 with the real prompt)."""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"qaudit_gen_{uuid.uuid4().hex[:8]}",
        system_message=system_msg,
    )
    chat.with_model(_MODEL_PROVIDER, _MODEL_NAME)
    return await chat.send_message(UserMessage(text=query))


async def _judge_answer(query: str, expect: str, context_block: str, answer: str) -> dict[str, Any]:
    """Score one answer with a strict, JSON-only judge call."""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"qaudit_judge_{uuid.uuid4().hex[:8]}",
        system_message=_JUDGE_SYSTEM,
    )
    chat.with_model(_MODEL_PROVIDER, _MODEL_NAME)
    payload = (
        f"USER-FRAGE:\n{query}\n\n"
        f"ERWARTETES FRAMEWORK:\n{expect or '(keines vorgegeben)'}\n\n"
        f"BEREITGESTELLTE KORPUS-AUSZÜGE:\n{context_block or '(keine — Retrieval lieferte nichts)'}\n\n"
        f"ZU PRÜFENDE ANTWORT:\n{answer}"
    )
    raw = await chat.send_message(UserMessage(text=payload))
    parsed = _safe_json(raw)
    if not parsed:
        # A judge that fails to return JSON must not silently pass the query.
        return {
            "framework_named": "", "applies_framework": False, "grounded_in_corpus": 0,
            "generic": True, "coaching_quality": 0, "reason": "judge returned non-JSON",
        }
    return parsed


def _verdict(judge: dict[str, Any], rag_active: bool) -> str:
    """pass | partial | fail — the user-facing grade for one query."""
    grounded = float(judge.get("grounded_in_corpus") or 0)
    coaching = float(judge.get("coaching_quality") or 0)
    applies = bool(judge.get("applies_framework"))
    generic = bool(judge.get("generic"))
    if applies and not generic and grounded >= _MIN_GROUNDING and coaching >= _MIN_COACHING:
        return "pass"
    if not rag_active and grounded < _MIN_GROUNDING:
        # No chunks retrieved at all → this is a retrieval gap, the worst case.
        return "fail"
    if applies or coaching >= _MIN_COACHING:
        return "partial"
    return "fail"


async def _audit_one(item: dict[str, str], sem: asyncio.Semaphore) -> dict[str, Any]:
    """Full real-path audit for a single query. Never raises — failures become
    a 'fail' row so one bad query can't abort the whole run."""
    query = (item.get("q") or "").strip()
    expect = item.get("expect") or ""
    async with sem:
        try:
            ctx = await retrieve_context(query)
            system_msg = WLADBOT_SYSTEM_PROMPT + ctx["context_block"]
            answer = await _generate_answer(query, system_msg)
            judge = await _judge_answer(query, expect, ctx["context_block"], answer)
            verdict = _verdict(judge, ctx["rag_active"])
            return {
                "query": query,
                "expected_framework": expect,
                "verdict": verdict,
                "rag_active": ctx["rag_active"],
                "chunks": ctx["chunks_count"],
                "framework_named": judge.get("framework_named", ""),
                "applies_framework": bool(judge.get("applies_framework")),
                "grounded_in_corpus": judge.get("grounded_in_corpus", 0),
                "generic": bool(judge.get("generic")),
                "coaching_quality": judge.get("coaching_quality", 0),
                "reason": judge.get("reason", ""),
                "answer_preview": (answer or "")[:600],
            }
        except Exception as e:  # noqa: BLE001 — defensive: a probe must never 500 the run
            logger.warning("rag-quality-audit: query failed (%s): %s", query[:60], e)
            return {
                "query": query, "expected_framework": expect, "verdict": "fail",
                "rag_active": False, "chunks": 0, "framework_named": "",
                "applies_framework": False, "grounded_in_corpus": 0, "generic": True,
                "coaching_quality": 0, "reason": f"audit error: {e}", "answer_preview": "",
            }


@router.post("/rag-quality-audit")
async def run_rag_quality_audit(request: Request, body: Optional[AuditRequest] = None):
    """Run the answer-quality audit over the signature set (or a custom set).

    Returns a scorecard with per-query verdicts, an aggregate pass-rate, and
    `framework_coverage` — the distinct Wlad frameworks that actually showed up
    across all answers (the "uses ALL of them" check).
    """
    await require_admin(request)
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="LLM key not configured")

    opts = body or AuditRequest()
    queries = opts.queries or SIGNATURE_QUERIES
    started = datetime.now(timezone.utc)

    sem = asyncio.Semaphore(_MAX_CONCURRENCY)
    results = await asyncio.gather(*[_audit_one(item, sem) for item in queries])

    total = len(results)
    passed = sum(1 for r in results if r["verdict"] == "pass")
    partial = sum(1 for r in results if r["verdict"] == "partial")
    failed = sum(1 for r in results if r["verdict"] == "fail")
    coverage = sorted({r["framework_named"] for r in results if r.get("framework_named")})
    avg_grounding = round(sum(float(r["grounded_in_corpus"] or 0) for r in results) / total, 1) if total else 0.0
    avg_coaching = round(sum(float(r["coaching_quality"] or 0) for r in results) / total, 1) if total else 0.0
    worst = sorted(results, key=lambda r: (float(r["grounded_in_corpus"] or 0), float(r["coaching_quality"] or 0)))[:3]

    summary = {
        "run_id": f"qa_{uuid.uuid4().hex[:12]}",
        "run_at": started.isoformat(),
        "duration_ms": int((datetime.now(timezone.utc) - started).total_seconds() * 1000),
        "total": total,
        "pass": passed,
        "partial": partial,
        "fail": failed,
        "pass_rate": round(passed / total * 100) if total else 0,
        "avg_grounding": avg_grounding,
        "avg_coaching_quality": avg_coaching,
        "framework_coverage": coverage,
        "framework_coverage_count": len(coverage),
    }

    if opts.persist:
        try:
            await db.rag_quality_runs.insert_one({**summary, "results": results, "triggered_by": "admin"})
        except Exception as e:  # noqa: BLE001 — persistence is best-effort, never block the response
            logger.warning("rag-quality-audit: persist failed: %s", e)
            summary["persist_error"] = str(e)

    return {**summary, "results": results}


@router.get("/rag-quality-runs")
async def list_rag_quality_runs(request: Request, limit: int = 20):
    """Recent persisted audit runs (summary only) for the admin trend view."""
    await require_admin(request)
    limit = max(1, min(limit, 100))
    return await db.rag_quality_runs.find(
        {}, {"_id": 0, "results": 0}
    ).sort("run_at", -1).to_list(limit)
