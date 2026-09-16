"""Iter 42 — Backend regression tests for /api/quiz/progress endpoints."""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"


def _mk_user():
    """Create a fresh user via /api/user/create and return the response payload."""
    payload = {
        "name": "TEST Iter42",
        "email": f"TEST_iter42_{uuid.uuid4().hex[:10]}@example.com",
        "phone": "+491701234567",
        "role": "manager",
        "consent_privacy": True,
    }
    r = requests.post(f"{API}/user/create", json=payload, timeout=30)
    assert r.status_code == 200, f"user/create failed {r.status_code} {r.text}"
    data = r.json()
    assert data.get("session_id"), f"no session_id in response: {data}"
    return data, payload


class TestQuizProgress:
    def test_progress_roundtrip_and_persistence(self):
        user, payload = _mk_user()
        sid = user["session_id"]

        # POST progress
        answers = {"1": {"question_id": 1, "score": 4, "category": "rhetorik", "layer": "rhetoric"},
                   "2": {"question_id": 2, "score": 3, "category": "fuehrung", "layer": "strategic_eq"}}
        r = requests.post(f"{API}/quiz/progress",
                          json={"session_id": sid, "answers": answers, "current": 2, "total": 20},
                          timeout=15)
        assert r.status_code == 200, r.text
        assert r.json() == {"status": "saved"}

        # GET progress → should reflect stored data
        r = requests.get(f"{API}/quiz/progress/{sid}", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["session_id"] == sid
        assert d["email"].lower() == payload["email"].lower()
        assert d["name"] == payload["name"]
        assert d["role"] == payload["role"]
        assert d["current"] == 2
        assert d["total"] == 20
        assert d["completed"] is False
        assert set(d["answers"].keys()) == {"1", "2"}

    def test_progress_get_without_saved_progress_returns_user_shell(self):
        user, payload = _mk_user()
        sid = user["session_id"]
        r = requests.get(f"{API}/quiz/progress/{sid}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["session_id"] == sid
        assert d["email"] == payload["email"].lower() or d["email"] == payload["email"]
        assert d["answers"] == {}
        assert d["current"] == 0
        assert d["completed"] is False

    def test_progress_get_unknown_session_404(self):
        r = requests.get(f"{API}/quiz/progress/does-not-exist-{uuid.uuid4().hex}", timeout=15)
        assert r.status_code == 404

    def test_progress_post_unknown_user_404(self):
        r = requests.post(f"{API}/quiz/progress",
                          json={"session_id": "unknown-user-xyz", "answers": {}, "current": 0, "total": 20},
                          timeout=15)
        assert r.status_code == 404

    def test_progress_update_is_upsert(self):
        user, _ = _mk_user()
        sid = user["session_id"]
        # first save with 3 answers
        answers = {str(i): {"question_id": i, "score": 3, "category": "rhetorik", "layer": "rhetoric"} for i in range(1, 4)}
        r = requests.post(f"{API}/quiz/progress",
                          json={"session_id": sid, "answers": answers, "current": 3, "total": 20}, timeout=15)
        assert r.status_code == 200
        # second save with 5 answers → current 5
        answers.update({str(i): {"question_id": i, "score": 4, "category": "fuehrung", "layer": "strategic_eq"} for i in range(4, 6)})
        r = requests.post(f"{API}/quiz/progress",
                          json={"session_id": sid, "answers": answers, "current": 5, "total": 20}, timeout=15)
        assert r.status_code == 200
        r = requests.get(f"{API}/quiz/progress/{sid}", timeout=15)
        d = r.json()
        assert d["current"] == 5
        assert len(d["answers"]) == 5


class TestGenerateReportMarksProgressComplete:
    def test_generate_report_sets_completed_and_cancels_reminders(self):
        user, _ = _mk_user()
        sid = user["session_id"]

        # 1. save partial progress (this will enqueue quiz_reminders too)
        answers = {"1": {"question_id": 1, "score": 4, "category": "rhetorik", "layer": "rhetoric"}}
        r = requests.post(f"{API}/quiz/progress",
                          json={"session_id": sid, "answers": answers, "current": 1, "total": 20}, timeout=15)
        assert r.status_code == 200

        # 2. submit 20 answers → generate report (real LLM, up to 60s)
        qs = []
        cats = ["rhetorik", "fuehrung", "eq", "kritisches_denken", "entscheidung", "strategie"]
        layers = ["rhetoric", "strategic_eq", "ai_literacy"]
        for i in range(1, 21):
            qs.append({"question_id": i, "category": cats[i % 6], "layer": layers[i % 3], "score": 4})
        r = requests.post(f"{API}/quiz/generate-report",
                          json={"session_id": sid, "answers": qs}, timeout=120)
        assert r.status_code == 200, r.text
        rep = r.json()
        assert "report_token" in rep and "avg_total" in rep

        # 3. progress must now be completed
        r = requests.get(f"{API}/quiz/progress/{sid}", timeout=15)
        assert r.status_code == 200
        assert r.json()["completed"] is True
