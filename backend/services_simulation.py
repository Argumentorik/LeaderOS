"""Bausteine für die Rollenspiel-Simulationen (Gesprächstraining), ohne DB und ohne LLM.

Hier liegt, was routes/simulations.py an Prompt und Modellwahl braucht, damit es
getestet werden kann, ohne Mongo oder einen API-Key.

Zwei Dinge, die Wlad am Produkt bemängelt hat (Feedback vom 28.10.2026):

1. **Tempo.** Jede Rollenspiel-Antwort lief über gpt-5.2. Im Voice-Pfad ist
   dokumentiert, was das heißt: gpt-5.2 braucht dort 15-25 s je Antwort, gpt-4o
   3-5 s (routes/voice_tts.py, Iter 92.20 und 115). Eine Mitarbeiter-Antwort von
   zwei bis vier Sätzen braucht kein Reasoning-Modell. Deshalb laufen die
   Rollenspiel-Züge jetzt über ein schnelles Modell (Standard gpt-4o, per Env
   `SIM_TURN_MODEL` änderbar). Die Auswertung am Ende (JSON mit Scores und
   Feedback) bleibt bei gpt-5.2, dort zählt Qualität vor Tempo.
2. **SEXIER im Training.** Das Rollenspiel hielt Frameworks bewusst raus, damit
   die Figur nicht aus der Rolle fällt. Bei Überzeugungs-Szenarien (Gehalt,
   Beförderung, Veränderung, Feedback nach oben) hakt die Figur jetzt so nach,
   wie es fehlende SEXIER-Schritte verlangen (Warum? Beispiel? Was heißt das für
   mich? Und der Einwand?), ohne das Modell beim Namen zu nennen, und die
   Auswertung bewertet die Argumentation nach SEXIER.
"""
from __future__ import annotations

import os

# Rollenspiel-Zug: schnelles Modell. Format "provider/model" oder "provider:model".
DEFAULT_TURN_MODEL = "openai/gpt-4o"
# Auswertung (Scores + Feedback als JSON): Qualität vor Tempo, wie bisher.
SCORING_MODEL: tuple[str, str] = ("openai", "gpt-5.2")

# Nach so vielen Manager-Nachrichten soll die Figur laut Basis-Prompt selbst die
# JSON-Auswertung liefern. Ab da läuft der Zug über das Scoring-Modell.
EXCHANGES_BEFORE_ANALYSIS = 8

ROLEPLAY_STYLE = (
    "\n\nSTYLE: Reply like a real person in a live conversation: 2-4 sentences, "
    "about 60 words at most. No bullet lists, no stage directions, no meta "
    "commentary. Reply in the language the manager writes in."
)

# Szenarien, in denen der Manager überzeugen muss. Dort trainiert SEXIER mit.
ARGUMENTATION_SCENARIOS = frozenset({
    "argumentation-prep",
    "salary-negotiation",
    "promotion-pitch",
    "change-announcement",
    "upward-feedback",
})

SEXIER_STEPS = "Statement, Explanation, eXample, Impact, Explanation of Impact, Rebuttal"

_ROLEPLAY_HINT = (
    "\n\nTRAINING FOCUS (Wlad Jachtchenko's SEXIER model): the manager is practising a "
    "persuasive argument. Stay fully in character, but react like a real person to what "
    "is missing: a bare claim without a reason (ask why), without a concrete example "
    "(ask for a case), without relevance for you (ask what it means for you), or without "
    "an answer to your objection (push back again). Raise one realistic objection early. "
    "Never name the framework during the role-play."
)

_END_INSTRUCTION = (
    " In the \"feedback\" field, assess the manager's argumentation with Wlad's SEXIER model "
    f"({SEXIER_STEPS}): name which steps were present, which were missing, and give one "
    "concrete sentence the manager could have said for each missing step. "
    "Keep the JSON schema exactly as specified."
)

_RAG_SEXIER_TERMS = " SEXIER Argumentation Statement Explanation Example Impact Rebuttal Einwand"


def turn_model() -> tuple[str, str]:
    """(provider, model) für Rollenspiel-Züge. Env `SIM_TURN_MODEL` überschreibt den Standard."""
    raw = (os.environ.get("SIM_TURN_MODEL") or "").strip() or DEFAULT_TURN_MODEL
    for sep in ("/", ":"):
        if sep in raw:
            provider, model = raw.split(sep, 1)
            if provider.strip() and model.strip():
                return provider.strip(), model.strip()
    return "openai", raw


def is_argumentation_scenario(scenario: dict | None) -> bool:
    return bool(scenario) and (scenario or {}).get("scenario_id") in ARGUMENTATION_SCENARIOS


def is_scoring_turn(end_requested: bool, previous_user_messages: int) -> bool:
    """True, wenn dieser Zug die JSON-Auswertung liefern kann oder soll.

    `previous_user_messages` zählt die Manager-Nachrichten vor der aktuellen.
    """
    return bool(end_requested) or (previous_user_messages + 1) >= EXCHANGES_BEFORE_ANALYSIS


def model_for_turn(scoring: bool) -> tuple[str, str]:
    return SCORING_MODEL if scoring else turn_model()


def roleplay_hint(scenario: dict | None) -> str:
    return _ROLEPLAY_HINT if is_argumentation_scenario(scenario) else ""


def build_system_message(base_prompt: str, scenario_block: str, scenario: dict | None,
                         setup_block: str = "", rag_block: str = "", scoring: bool = False) -> str:
    """System-Prompt eines Zuges.

    Rollenspiel-Züge bekommen die Kurzantwort-Regel und bei Überzeugungs-Szenarien den
    SEXIER-Trainingsfokus. Scoring-Züge nicht: dort soll das Modell die JSON-Auswertung
    liefern, eine Zwei-bis-vier-Sätze-Regel würde ihr widersprechen.
    """
    parts = [base_prompt, scenario_block, setup_block, rag_block]
    if not scoring:
        parts.insert(1, ROLEPLAY_STYLE + roleplay_hint(scenario))
    return "".join(p for p in parts if p)


def end_prompt_suffix(scenario: dict | None) -> str:
    """Text, der an den End-Prompt angehängt wird (leer, wenn das Szenario kein SEXIER braucht)."""
    return _END_INSTRUCTION if is_argumentation_scenario(scenario) else ""


def end_rag_query(scenario: dict | None, user_lines: str) -> str:
    base = f"{(scenario or {}).get('description', '')} Feedback Leadership Bewertung {user_lines}"
    return base + (_RAG_SEXIER_TERMS if is_argumentation_scenario(scenario) else "")
