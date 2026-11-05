"""Iter 22: Test chat_context flow through /api/quiz/generate-report"""
import os
import uuid
import pytest
import requests

def _load_base_url():
    url = os.environ.get('REACT_APP_BACKEND_URL')
    if not url:
        env_path = '/app/frontend/.env'
        if os.path.exists(env_path):
            for line in open(env_path):
                if line.startswith('REACT_APP_BACKEND_URL='):
                    url = line.split('=', 1)[1].strip()
                    break
    assert url, "REACT_APP_BACKEND_URL not set"
    return url.rstrip('/')

BASE_URL = _load_base_url()


def _make_answers():
    cats = ["rhetorik", "kritisches_denken", "entscheidung", "fuehrung", "eq", "strategie"]
    layers = ["ai_literacy", "rhetoric", "strategic_eq"]
    out = []
    for i in range(30):
        out.append({
            "question_id": f"q{i+1}",
            "category": cats[i % 6],
            "layer": layers[i % 3],
            "score": (i % 4) + 1,
        })
    return out


@pytest.fixture(scope="module")
def user_session():
    session_id = f"TEST_{uuid.uuid4().hex[:8]}"
    payload = {
        "name": "Jürgen Müßig",
        "email": f"TEST_{uuid.uuid4().hex[:6]}@example.com",
        "role": "Führungskraft",
        "consent_privacy": True,
    }
    r = requests.post(f"{BASE_URL}/api/user/create", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    sid = data.get("session_id") or data.get("user_id") or data.get("user", {}).get("session_id")
    assert sid
    return {"session_id": sid, "name": payload["name"], "email": payload["email"]}


class TestChatContextReport:
    def test_generate_report_with_chat_context(self, user_session):
        challenge = "Mein Team zögert bei Entscheidungen, weil ich zu oft eingreife."
        payload = {
            "session_id": user_session["session_id"],
            "answers": _make_answers(),
            "chat_context": [
                {"role": "user", "text": challenge},
                {"role": "assistant", "text": "Das klingt nach einer klassischen Delegations-Herausforderung."},
            ],
        }
        r = requests.post(f"{BASE_URL}/api/quiz/generate-report", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        # user_challenge must be the user's first message
        assert data.get("user_challenge") == challenge
        # chat_context must be persisted
        assert isinstance(data.get("chat_context"), list)
        assert len(data["chat_context"]) == 2
        assert data["chat_context"][0]["role"] == "user"
        # narrative.personal_response must exist
        narrative = data.get("narrative", {})
        assert "personal_response" in narrative, f"Missing personal_response in narrative: {list(narrative.keys())}"
        assert isinstance(narrative["personal_response"], str)
        assert len(narrative["personal_response"]) > 20

        # GET to verify persistence
        g = requests.get(f"{BASE_URL}/api/report/{user_session['session_id']}", timeout=30)
        assert g.status_code == 200
        gd = g.json()
        assert gd.get("user_challenge") == challenge
        assert len(gd.get("chat_context", [])) == 2

    def test_generate_report_without_chat_context_backward_compat(self):
        # Create a fresh user
        sid_user = {"name": "Anna Test", "email": f"TEST_{uuid.uuid4().hex[:6]}@example.com", "role": "Manager", "consent_privacy": True}
        ur = requests.post(f"{BASE_URL}/api/user/create", json=sid_user, timeout=30)
        assert ur.status_code == 200
        sid = ur.json().get("session_id") or ur.json().get("user_id") or ur.json().get("user", {}).get("session_id")

        payload = {"session_id": sid, "answers": _make_answers()}
        r = requests.post(f"{BASE_URL}/api/quiz/generate-report", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        # Should still work
        assert "narrative" in data
        assert data.get("user_challenge") is None
        assert data.get("chat_context") == []

    def test_generate_report_with_empty_chat_context(self):
        sid_user = {"name": "Bob Test", "email": f"TEST_{uuid.uuid4().hex[:6]}@example.com", "role": "Leader", "consent_privacy": True}
        ur = requests.post(f"{BASE_URL}/api/user/create", json=sid_user, timeout=30)
        sid = ur.json().get("session_id") or ur.json().get("user_id") or ur.json().get("user", {}).get("session_id")

        payload = {"session_id": sid, "answers": _make_answers(), "chat_context": []}
        r = requests.post(f"{BASE_URL}/api/quiz/generate-report", json=payload, timeout=90)
        assert r.status_code == 200
        data = r.json()
        assert data.get("user_challenge") is None
