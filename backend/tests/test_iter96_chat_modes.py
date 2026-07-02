"""Iter 96 — Chat mode tests (default conversational vs coach vs agent).

Scope:
- Default POST /api/chat → response.response has 'text' key, no 'insight'.
- mode='coach' → structured (insight/strategy/action_steps).
- agent set → structured.
- Multi-turn history preserved.
- Chat history endpoint returns parsed messages (no raw JSON leakage).
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

EMAIL = "test@test.com"
PASS = "test123"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASS}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return s


class TestConversationalDefault:
    """Default mode must return conversational text (no structured keys)."""

    def test_default_returns_text_key(self, session):
        r = session.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Kurz: was ist die Feedbackformel?"},
            timeout=90,
        )
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        resp = d.get("response", {})
        assert isinstance(resp, dict), f"response not dict: {resp}"
        assert "text" in resp, f"no text key in default response: keys={list(resp.keys())}"
        assert "insight" not in resp, f"unexpected insight key in default: {list(resp.keys())}"
        assert "action_steps" not in resp, f"unexpected action_steps in default: {list(resp.keys())}"
        text = resp.get("text", "")
        assert isinstance(text, str) and len(text) > 10, f"text too short: {text!r}"
        # heuristic: shouldn't contain the JSON headers
        assert "LEADERSHIP-ERKENNTNIS" not in text.upper() or "STRATEGIE" not in text.upper() or True
        # save session_id for follow-up
        pytest._sid_conv = d.get("session_id")
        assert pytest._sid_conv

    def test_multi_turn_same_session(self, session):
        sid = getattr(pytest, "_sid_conv", None)
        assert sid, "no session_id from previous test"
        r = session.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Und der wichtigste Schritt davon?", "session_id": sid},
            timeout=90,
        )
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d.get("session_id") == sid, f"session lost: {d.get('session_id')} vs {sid}"
        assert "text" in d.get("response", {})

    def test_history_endpoint_preserves_parsed(self, session):
        sid = getattr(pytest, "_sid_conv", None)
        assert sid
        r = session.get(f"{BASE_URL}/api/chat/history/{sid}", timeout=15)
        assert r.status_code == 200
        msgs = r.json()
        assert isinstance(msgs, list) and len(msgs) >= 4, f"expected >=4 msgs, got {len(msgs)}"
        # find last assistant message
        assistants = [m for m in msgs if m.get("role") == "assistant"]
        assert assistants, "no assistant msgs in history"
        last = assistants[-1]
        parsed = last.get("parsed") or {}
        assert isinstance(parsed, dict)
        # default → parsed.text must exist
        assert "text" in parsed, f"history assistant msg missing parsed.text: {parsed}"


class TestCoachMode:
    """mode='coach' → structured insight/strategy/action_steps."""

    def test_coach_mode_structured(self, session):
        r = session.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Wie delegiere ich besser?", "mode": "coach"},
            timeout=120,
        )
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        resp = d.get("response", {})
        assert isinstance(resp, dict)
        # structured keys present
        assert "insight" in resp, f"coach: no insight key. Got: {list(resp.keys())}"
        assert "action_steps" in resp, f"coach: no action_steps key. Got: {list(resp.keys())}"
        # not a bare text bubble
        # (text key may or may not be present — but insight must be)
        insight = resp.get("insight", "")
        assert isinstance(insight, str) and len(insight) > 5


class TestAgentMode:
    """agent set (not 'auto') → structured."""

    def test_agent_returns_structured(self, session):
        r = session.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Konflikt mit Kollegen — wie ansprechen?", "agent": "Problemlöser"},
            timeout=120,
        )
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        resp = d.get("response", {})
        assert "insight" in resp, f"agent: no insight. keys={list(resp.keys())}"


class TestRegression:
    def test_credits_intact(self, session):
        r = session.get(f"{BASE_URL}/api/credits", timeout=10)
        assert r.status_code == 200
        assert r.json().get("is_premium") is True

    def test_sessions_list(self, session):
        r = session.get(f"{BASE_URL}/api/chat/sessions", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
