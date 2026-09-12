"""Iter 173: personalisierte Reise + dynamische Mail-Basis-URL."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services_email import _frontend_url, _trusted_origin  # noqa: E402
from services_journey import WEEK_PLANS, build_journey, journey_prompt_section, pick_focus  # noqa: E402


class _Req:
    def __init__(self, headers):
        self.headers = headers


def test_focus_prefers_leader_check_weakest_dimension():
    user = {"wladhub_scores": {"ki_kompetenz": 80, "boardroom_rhetorik": 41, "strategisches_eq": 66}, "primary_goal": "strategy"}
    focus, source, reason = pick_focus(user)
    assert focus == "boardroom_rhetorik" and source == "leader-check"
    assert "41/100" in reason


def test_focus_falls_back_to_onboarding_goal_then_default():
    assert pick_focus({"primary_goal": "conflicts"})[0:2] == ("strategisches_eq", "onboarding")
    assert pick_focus({})[1] == "default"


def test_week_has_seven_steps_and_role_context():
    j = build_journey({"role": "team-lead", "primary_goal": "communication", "created_at": "2026-06-01T00:00:00+00:00"})
    assert len(j["week"]) == 7 and all(WEEK_PLANS[j["focus"]][i]["path"].startswith("/") for i in range(7))
    assert j["team_label"] == "3–10 Mitarbeitende"
    assert "3–10 Mitarbeitende" in j["week"][0]["task"]
    assert j["today"]["day"] == 1 and j["week_done"] is False


def test_progress_moves_to_next_open_step():
    j = build_journey({"role": "manager", "journey_progress": {"done_days": [1, 2, 3]}})
    assert j["today"]["day"] == 4 and j["done_count"] == 3
    done_all = build_journey({"journey_progress": {"done_days": list(range(1, 8))}})
    assert done_all["today"] is None and done_all["week_done"] is True


def test_prompt_section_never_mentions_question_count():
    text = journey_prompt_section({"role": "c-level", "wladhub_scores": {"ki_kompetenz": 30, "boardroom_rhetorik": 70, "strategisches_eq": 60}})
    assert "C-Level" in text and "KI-Kompetenz" in text
    assert "NIEMALS, wie viele Fragen" in text
    import re
    assert not re.search(r"\d+\s*Fragen", text)


def test_frontend_url_prefers_env_then_trusted_origin_then_public(monkeypatch):
    monkeypatch.delenv("FRONTEND_BASE_URL", raising=False)
    monkeypatch.setenv("PUBLIC_BASE_URL", "https://preview.example.emergentagent.com/")
    assert _frontend_url(_Req({"origin": "https://leaderos.de"})) == "https://leaderos.de"
    assert _frontend_url(_Req({"origin": "https://evil.example.com"})) == "https://preview.example.emergentagent.com"
    assert _frontend_url(_Req({"referer": "https://x.preview.emergentagent.com/login?a=1"})) == "https://x.preview.emergentagent.com"
    monkeypatch.setenv("FRONTEND_BASE_URL", "https://leaderos.de/")
    assert _frontend_url(_Req({"origin": "https://x.preview.emergentagent.com"})) == "https://leaderos.de"


def test_trusted_origin_rules():
    assert _trusted_origin("https://leadercheck.de")
    assert _trusted_origin("http://localhost:3000")
    assert not _trusted_origin("http://leaderos.de")
    assert not _trusted_origin("https://leaderos.de.evil.com")
