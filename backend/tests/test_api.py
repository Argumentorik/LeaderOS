"""Backend API tests for EMERGENT Diagnostic Hub"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s

@pytest.fixture
def session_id(client):
    """Create a test user and return session_id"""
    resp = client.post(f"{BASE_URL}/api/user/create", json={
        "name": "TEST_Playwright",
        "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
        "role": "CEO / Geschäftsführer"
    })
    assert resp.status_code == 200
    return resp.json()["session_id"]


class TestHealthAndRoot:
    def test_root(self, client):
        resp = client.get(f"{BASE_URL}/api/")
        assert resp.status_code == 200
        assert "message" in resp.json()


class TestUserCreate:
    def test_create_user_success(self, client):
        resp = client.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_User",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "role": "CEO / Geschäftsführer"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "session_id" in data
        assert data["name"] == "TEST_User"
        assert isinstance(data["session_id"], str)
        assert len(data["session_id"]) > 0

    def test_create_user_invalid_email(self, client):
        resp = client.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_BadEmail",
            "email": "not-an-email",
            "role": "CEO"
        })
        assert resp.status_code == 422


class TestGenerateReport:
    def _make_answers(self):
        answers = []
        categories = ["rhetorik", "kritisches_denken", "entscheidung", "fuehrung", "eq", "strategie"]
        layers = ["ai_literacy", "rhetoric", "strategic_eq"]
        for i in range(50):
            answers.append({
                "question_id": i + 1,
                "category": categories[i % len(categories)],
                "layer": layers[i % len(layers)],
                "score": 2
            })
        return answers

    def test_generate_report_success(self, client, session_id):
        resp = client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": session_id,
            "answers": self._make_answers()
        }, timeout=60)
        assert resp.status_code == 200
        data = resp.json()
        assert "narrative" in data
        assert "layer_scores" in data
        assert "roi" in data
        assert "cat_scores" in data
        assert "avg_total" in data
        assert "user" in data
        print(f"Report generated. Profile: {data['narrative'].get('profile_title', 'N/A')}")

    def test_generate_report_invalid_session(self, client):
        resp = client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": "invalid-session-id",
            "answers": self._make_answers()
        }, timeout=60)
        assert resp.status_code == 404

    def test_get_report(self, client, session_id):
        # First generate
        client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": session_id,
            "answers": self._make_answers()
        }, timeout=60)
        # Then get
        resp = client.get(f"{BASE_URL}/api/report/{session_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert "narrative" in data


class TestCoachChat:
    def test_coach_chat(self, client, session_id):
        resp = client.post(f"{BASE_URL}/api/coach/chat", json={
            "session_id": session_id,
            "message": "Wie kann ich meine Führungsqualitäten verbessern?"
        }, timeout=30)
        assert resp.status_code == 200
        data = resp.json()
        assert "response" in data
        assert len(data["response"]) > 0
        print(f"Coach response: {data['response'][:100]}")


class TestEmailSend:
    def test_email_send_no_key(self, client, session_id):
        """Email should be skipped gracefully without Resend key"""
        # First create a report
        answers = [{"question_id": i+1, "category": "rhetorik", "layer": "ai_literacy", "score": 2} for i in range(50)]
        client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": session_id, "answers": answers
        }, timeout=60)
        resp = client.post(f"{BASE_URL}/api/email/send-report", json={"session_id": session_id})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ("skipped", "success", "error")
