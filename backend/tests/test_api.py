"""Backend API tests for WLADHUB Leadership Diagnose - Major Update
Tests: Health, User creation, Report generation with 5 Leadership Roles, Coach chat
"""
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
        "role": "senior_manager"
    })
    assert resp.status_code == 200
    return resp.json()["session_id"]


class TestHealthAndRoot:
    """Health check tests"""
    
    def test_health(self, client):
        """Test /api/health returns healthy status"""
        resp = client.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "service" in data
        print(f"Health check passed: {data['service']}")
        
    def test_root(self, client):
        """Test root endpoint"""
        resp = client.get(f"{BASE_URL}/api/")
        assert resp.status_code == 200
        assert "message" in resp.json()


class TestUserCreate:
    """User creation tests"""
    
    def test_create_user_success(self, client):
        """Test user creation with valid data"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        resp = client.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_Anna_Müller",
            "email": test_email,
            "role": "senior_manager"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "session_id" in data
        assert data["name"] == "TEST_Anna_Müller"
        assert data["role"] == "senior_manager"
        assert isinstance(data["session_id"], str)
        assert len(data["session_id"]) > 0
        print(f"User created: {data['name']}, session: {data['session_id'][:20]}...")

    def test_create_user_with_custom_role(self, client):
        """Test user creation with custom role"""
        resp = client.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_CustomRole",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "role": "custom",
            "custom_role": "Tech Lead at a Startup"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "custom"
        print("Custom role user created successfully")

    def test_create_user_invalid_email(self, client):
        """Test user creation with invalid email returns 422"""
        resp = client.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_BadEmail",
            "email": "not-an-email",
            "role": "senior_manager"
        })
        assert resp.status_code == 422


class TestGenerateReport:
    """Report generation tests - with new 5 Leadership Roles"""
    
    def _make_answers(self):
        """Create 30 test answers (matching quiz design)"""
        answers = []
        categories = ["rhetorik", "kritisches_denken", "entscheidung", "fuehrung", "eq", "strategie"]
        layers = ["ai_literacy", "rhetoric", "strategic_eq"]
        for i in range(30):
            answers.append({
                "question_id": i + 1,
                "category": categories[i % len(categories)],
                "layer": layers[i % len(layers)],
                "score": 2 + (i % 3)  # Varied scores for realistic data
            })
        return answers

    def test_generate_report_success(self, client, session_id):
        """Test report generation returns all expected fields"""
        resp = client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": session_id,
            "answers": self._make_answers()
        }, timeout=60)
        assert resp.status_code == 200
        data = resp.json()
        
        # Basic report fields
        assert "narrative" in data
        assert "layer_scores" in data
        assert "roi" in data
        assert "cat_scores" in data
        assert "avg_total" in data
        assert "user" in data
        
        print(f"Report generated: {data['narrative'].get('profile_title', 'N/A')}")

    def test_generate_report_has_leadership_roles(self, client, session_id):
        """Test report contains 5+1 Leadership Roles (Communicator, Manager, Team Leader, Psychologist, Problem Solver, Innovator)"""
        resp = client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": session_id,
            "answers": self._make_answers()
        }, timeout=60)
        assert resp.status_code == 200
        data = resp.json()
        
        # Leadership roles must be present
        assert "leadership_roles" in data, "leadership_roles missing from report"
        leadership_roles = data["leadership_roles"]
        
        # Check all 6 roles exist (5+1 with innovator)
        expected_roles = ["communicator", "manager", "team_leader", "psychologist", "problem_solver", "innovator"]
        for role in expected_roles:
            assert role in leadership_roles, f"Role '{role}' missing from leadership_roles"
            assert isinstance(leadership_roles[role], (int, float)), f"Role '{role}' score is not numeric"
            assert 0 <= leadership_roles[role] <= 100, f"Role '{role}' score out of bounds"
        
        # Verify total of 6 roles
        assert len(leadership_roles) == 6, f"Expected 6 leadership roles, got {len(leadership_roles)}"
        print(f"Leadership roles (5+1): {leadership_roles}")

    def test_generate_report_has_strongest_and_weakest_role(self, client, session_id):
        """Test report contains strongest_role and weakest_role"""
        resp = client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": session_id,
            "answers": self._make_answers()
        }, timeout=60)
        assert resp.status_code == 200
        data = resp.json()
        
        # Strongest role
        assert "strongest_role" in data, "strongest_role missing from report"
        strongest = data["strongest_role"]
        assert "key" in strongest, "strongest_role missing 'key'"
        assert "label" in strongest, "strongest_role missing 'label'"
        assert "score" in strongest, "strongest_role missing 'score'"
        
        # Weakest role
        assert "weakest_role" in data, "weakest_role missing from report"
        weakest = data["weakest_role"]
        assert "key" in weakest, "weakest_role missing 'key'"
        assert "label" in weakest, "weakest_role missing 'label'"
        assert "score" in weakest, "weakest_role missing 'score'"
        
        print(f"Strongest: {strongest['label']} ({strongest['score']}%)")
        print(f"Weakest (FOCUS): {weakest['label']} ({weakest['score']}%)")

    def test_generate_report_invalid_session(self, client):
        """Test report generation with invalid session returns 404"""
        resp = client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": "invalid-session-id",
            "answers": self._make_answers()
        }, timeout=60)
        assert resp.status_code == 404

    def test_get_report(self, client, session_id):
        """Test GET report retrieves previously generated report"""
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
        assert "leadership_roles" in data


class TestCoachChat:
    """WladBot coach chat tests"""
    
    def test_coach_chat(self, client, session_id):
        """Test coach chat returns response"""
        resp = client.post(f"{BASE_URL}/api/coach/chat", json={
            "session_id": session_id,
            "message": "Was ist meine größte Leadership-Herausforderung?"
        }, timeout=30)
        assert resp.status_code == 200
        data = resp.json()
        assert "response" in data
        assert len(data["response"]) > 0
        print(f"WladBot response: {data['response'][:100]}...")


class TestEmailSend:
    """Email sending tests"""
    
    def test_email_send_no_key(self, client, session_id):
        """Email should be skipped gracefully without Resend key"""
        # First create a report
        categories = ["rhetorik", "kritisches_denken", "entscheidung", "fuehrung", "eq", "strategie"]
        layers = ["ai_literacy", "rhetoric", "strategic_eq"]
        answers = [{"question_id": i+1, "category": categories[i % 6], "layer": layers[i % 3], "score": 2} for i in range(30)]
        
        client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": session_id, 
            "answers": answers
        }, timeout=60)
        
        resp = client.post(f"{BASE_URL}/api/email/send-report", json={"session_id": session_id})
        assert resp.status_code == 200
        data = resp.json()
        assert "success" in data
        assert data["success"] is False  # No Resend key configured
        assert "message" in data


class TestPrivacyPolicy:
    """Privacy policy endpoint tests"""
    
    def test_privacy_policy(self, client):
        """Test privacy policy returns content"""
        resp = client.get(f"{BASE_URL}/api/privacy-policy")
        assert resp.status_code == 200
        data = resp.json()
        assert "title" in data
        assert "content" in data
        assert "data_collection" in data["content"]
        print(f"Privacy policy: {data['title']}")
