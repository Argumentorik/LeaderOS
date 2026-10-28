"""Prompt- und Modellwahl der Rollenspiel-Simulation (services_simulation), ohne DB und LLM."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import services_simulation as sim  # noqa: E402

BASE = "BASE PROMPT"
SCEN_BLOCK = "\n\nScenario: X"
SALARY = {"scenario_id": "salary-negotiation", "description": "Gehalt verhandeln"}
FEEDBACK = {"scenario_id": "feedback-session", "description": "Feedback geben"}


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    monkeypatch.delenv("SIM_TURN_MODEL", raising=False)


def test_turn_model_default_is_the_fast_model():
    assert sim.turn_model() == ("openai", "gpt-4o")


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("anthropic/claude-haiku-4-5-20251001", ("anthropic", "claude-haiku-4-5-20251001")),
        ("openai:gpt-5.2", ("openai", "gpt-5.2")),
        ("gpt-4o-mini", ("openai", "gpt-4o-mini")),
        ("  openai/gpt-4o  ", ("openai", "gpt-4o")),
        ("", ("openai", "gpt-4o")),
        ("   ", ("openai", "gpt-4o")),
    ],
)
def test_turn_model_env_override(monkeypatch, raw, expected):
    monkeypatch.setenv("SIM_TURN_MODEL", raw)
    assert sim.turn_model() == expected


def test_scoring_turn_boundaries():
    assert sim.is_scoring_turn(True, 0) is True            # "end simulation" immer
    assert sim.is_scoring_turn(False, 0) is False          # erste Manager-Nachricht
    assert sim.is_scoring_turn(False, 6) is False          # siebte
    assert sim.is_scoring_turn(False, 7) is True           # achte: Figur darf auswerten
    assert sim.is_scoring_turn(False, 12) is True


def test_model_for_turn_splits_roleplay_and_scoring(monkeypatch):
    assert sim.model_for_turn(True) == ("openai", "gpt-5.2")
    assert sim.model_for_turn(False) == ("openai", "gpt-4o")
    monkeypatch.setenv("SIM_TURN_MODEL", "openai/gpt-5.2")
    assert sim.model_for_turn(False) == ("openai", "gpt-5.2")
    assert sim.model_for_turn(True) == ("openai", "gpt-5.2")


def test_roleplay_turn_gets_style_and_for_argumentation_the_sexier_focus():
    text = sim.build_system_message(BASE, SCEN_BLOCK, SALARY, setup_block="\nSETUP", scoring=False)
    assert text.startswith(BASE)
    assert "STYLE:" in text and "2-4 sentences" in text
    assert "SEXIER" in text and "Never name the framework" in text
    assert text.index("STYLE:") < text.index(SCEN_BLOCK) < text.index("SETUP")


def test_other_scenarios_stay_without_sexier():
    text = sim.build_system_message(BASE, SCEN_BLOCK, FEEDBACK, scoring=False)
    assert "STYLE:" in text
    assert "SEXIER" not in text


def test_scoring_turn_gets_no_brevity_rule_but_keeps_rag_and_setup():
    text = sim.build_system_message(BASE, SCEN_BLOCK, SALARY, setup_block="\nSETUP", rag_block="\n\nRAG", scoring=True)
    assert "STYLE:" not in text and "SEXIER" not in text
    assert text == BASE + SCEN_BLOCK + "\nSETUP" + "\n\nRAG"


def test_end_prompt_suffix_only_for_argumentation_and_keeps_schema_rule():
    suffix = sim.end_prompt_suffix(SALARY)
    for word in ("SEXIER", "Statement", "eXample", "Impact", "Rebuttal", "JSON schema"):
        assert word in suffix
    assert sim.end_prompt_suffix(FEEDBACK) == ""
    assert sim.end_prompt_suffix(None) == ""
    assert sim.end_prompt_suffix({"title": "ohne Kennung"}) == ""


def test_end_rag_query_adds_sexier_terms_only_for_argumentation():
    legacy = "Feedback geben Feedback Leadership Bewertung user lines"
    assert sim.end_rag_query(FEEDBACK, "user lines") == legacy
    query = sim.end_rag_query(SALARY, "user lines")
    assert query.startswith("Gehalt verhandeln Feedback Leadership Bewertung user lines")
    assert "SEXIER" in query and "Einwand" in query


def test_argumentation_scenario_ids_exist_in_the_scenario_catalogue():
    from data import SIMULATION_SCENARIOS

    known = {s["scenario_id"] for s in SIMULATION_SCENARIOS}
    assert sim.ARGUMENTATION_SCENARIOS <= known, sim.ARGUMENTATION_SCENARIOS - known
