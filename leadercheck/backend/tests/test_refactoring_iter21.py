"""
Test suite for WLADHUB Backend Refactoring - Iteration 21
Tests all endpoints after server.py split into modular routes.

Routes tested:
- server.py: /health, /user/create, /
- routes/auth.py: /auth/*, /privacy-policy, /user/delete-data
- routes/quiz.py: /quiz/generate-report, /report/{session_id}, /coach/chat
- routes/payments.py: /payments/*, /license/*, /webhook/stripe
- routes/email.py: /email/send-report, /email/send-plan-reminder
- routes/admin.py: /admin/*, /booking/*
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefix for cleanup
TEST_PREFIX = "TEST_ITER21_"


class TestHealthAndRoot:
    """Test core endpoints in server.py"""
    
    def test_health_check(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        print(f"✓ Health check passed: {data}")
    
    def test_root_endpoint(self):
        """GET /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Root endpoint passed: {data}")


class TestUserCreate:
    """Test user creation in server.py"""
    
    def test_create_user_success(self):
        """POST /api/user/create creates user with session_id"""
        unique_email = f"{TEST_PREFIX}user_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": f"{TEST_PREFIX}Test User",
            "email": unique_email,
            "role": "CEO",
            "consent_privacy": True,
            "consent_marketing": False
        }
        response = requests.post(f"{BASE_URL}/api/user/create", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["name"] == payload["name"]
        assert data["email"] == unique_email
        assert data["role"] == "CEO"
        print(f"✓ User created with session_id: {data['session_id']}")
        return data["session_id"]
    
    def test_create_user_with_custom_role(self):
        """POST /api/user/create with custom_role"""
        unique_email = f"{TEST_PREFIX}custom_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": f"{TEST_PREFIX}Custom Role User",
            "email": unique_email,
            "role": "Other",
            "custom_role": "Chief Innovation Officer",
            "consent_privacy": True
        }
        response = requests.post(f"{BASE_URL}/api/user/create", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        print(f"✓ User with custom role created: {data}")


class TestQuizAndReport:
    """Test quiz endpoints in routes/quiz.py"""
    
    @pytest.fixture
    def test_session_id(self):
        """Create a test user and return session_id"""
        unique_email = f"{TEST_PREFIX}quiz_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": f"{TEST_PREFIX}Quiz User",
            "email": unique_email,
            "role": "Manager",
            "consent_privacy": True
        }
        response = requests.post(f"{BASE_URL}/api/user/create", json=payload)
        return response.json()["session_id"]
    
    def test_generate_report_with_all_roles(self, test_session_id):
        """POST /api/quiz/generate-report generates report with all 6 leadership roles"""
        # Create quiz answers covering all categories
        answers = []
        categories = ["rhetorik", "fuehrung", "eq", "kritisches_denken", "entscheidung", "strategie"]
        layers = ["ai_literacy", "rhetoric", "strategic_eq"]
        
        for i, cat in enumerate(categories):
            for j, layer in enumerate(layers):
                answers.append({
                    "question_id": f"q_{cat}_{layer}_{i}_{j}",
                    "category": cat,
                    "layer": layer,
                    "score": 3  # Mid-range score
                })
        
        payload = {
            "session_id": test_session_id,
            "answers": answers
        }
        response = requests.post(f"{BASE_URL}/api/quiz/generate-report", json=payload, timeout=60)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all 6 leadership roles are present
        assert "leadership_roles" in data
        expected_roles = ["communicator", "manager", "team_leader", "psychologist", "problem_solver", "innovator"]
        for role in expected_roles:
            assert role in data["leadership_roles"], f"Missing role: {role}"
        
        # Verify strongest and weakest roles
        assert "strongest_role" in data
        assert "weakest_role" in data
        assert data["strongest_role"]["key"] in expected_roles
        assert data["weakest_role"]["key"] in expected_roles
        
        # Verify other report fields
        assert "cat_scores" in data
        assert "layer_scores" in data
        assert "avg_total" in data
        assert "roi" in data
        assert "narrative" in data
        
        print(f"✓ Report generated with all 6 roles: {list(data['leadership_roles'].keys())}")
        print(f"  Strongest: {data['strongest_role']['label']}, Weakest: {data['weakest_role']['label']}")
        return test_session_id
    
    def test_get_report(self, test_session_id):
        """GET /api/report/{session_id} returns report"""
        # First generate a report
        answers = [{"question_id": "q1", "category": "rhetorik", "layer": "ai_literacy", "score": 4}]
        requests.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": test_session_id,
            "answers": answers
        }, timeout=60)
        
        # Then fetch it
        response = requests.get(f"{BASE_URL}/api/report/{test_session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == test_session_id
        print(f"✓ Report retrieved for session: {test_session_id}")
    
    def test_get_report_not_found(self):
        """GET /api/report/{session_id} returns 404 for non-existent report"""
        fake_session = f"nonexistent_{uuid.uuid4().hex}"
        response = requests.get(f"{BASE_URL}/api/report/{fake_session}")
        assert response.status_code == 404
        print("✓ Report not found returns 404")


class TestCoachChat:
    """Test coach chat in routes/quiz.py"""
    
    @pytest.fixture
    def test_session_id(self):
        """Create a test user and return session_id"""
        unique_email = f"{TEST_PREFIX}coach_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": f"{TEST_PREFIX}Coach User",
            "email": unique_email,
            "role": "Team Lead",
            "consent_privacy": True
        }
        response = requests.post(f"{BASE_URL}/api/user/create", json=payload)
        return response.json()["session_id"]
    
    def test_coach_chat_response(self, test_session_id):
        """POST /api/coach/chat returns response"""
        payload = {
            "session_id": test_session_id,
            "message": "Wie kann ich meine Führungsqualitäten verbessern?"
        }
        response = requests.post(f"{BASE_URL}/api/coach/chat", json=payload, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0
        print(f"✓ Coach chat response received: {data['response'][:100]}...")


class TestPayments:
    """Test payment endpoints in routes/payments.py"""
    
    def test_create_checkout_starter(self):
        """POST /api/payments/create-checkout works for starter package"""
        payload = {
            "package_id": "starter",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            "email": f"{TEST_PREFIX}starter@test.com"
        }
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        print(f"✓ Starter checkout created: {data['session_id']}")
        return data["session_id"]
    
    def test_create_checkout_standard_yearly(self):
        """POST /api/payments/create-checkout works for standard_yearly package"""
        payload = {
            "package_id": "standard_yearly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            "email": f"{TEST_PREFIX}standard@test.com"
        }
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        print(f"✓ Standard yearly checkout created: {data['session_id']}")
    
    def test_create_checkout_fasttrack_yearly(self):
        """POST /api/payments/create-checkout works for fasttrack_yearly package"""
        payload = {
            "package_id": "fasttrack_yearly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            "email": f"{TEST_PREFIX}fasttrack@test.com"
        }
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        print(f"✓ Fast Track yearly checkout created: {data['session_id']}")
    
    def test_create_checkout_invalid_package(self):
        """POST /api/payments/create-checkout returns 400 for invalid package"""
        payload = {
            "package_id": "invalid_package",
            "origin_url": "https://example.com"
        }
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json=payload)
        assert response.status_code == 400
        print("✓ Invalid package returns 400")
    
    def test_payment_status(self):
        """GET /api/payments/status/{session_id} works"""
        # First create a checkout
        payload = {
            "package_id": "starter",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com"
        }
        create_resp = requests.post(f"{BASE_URL}/api/payments/create-checkout", json=payload)
        session_id = create_resp.json()["session_id"]
        
        # Then check status
        response = requests.get(f"{BASE_URL}/api/payments/status/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data or "payment_status" in data
        print(f"✓ Payment status retrieved: {data}")


class TestLicenseKeys:
    """Test license key endpoints in routes/payments.py"""
    
    def test_create_license_key(self):
        """POST /api/license/create creates WLAD-XXXX key"""
        payload = {
            "plan": "standard",
            "email": f"{TEST_PREFIX}license@test.com",
            "name": f"{TEST_PREFIX}License User",
            "notes": "Test license key"
        }
        response = requests.post(f"{BASE_URL}/api/license/create", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "key" in data
        assert data["key"].startswith("WLAD-")
        assert data["plan"] == "standard"
        assert data["status"] == "active"
        print(f"✓ License key created: {data['key']}")
        return data["key"]
    
    def test_validate_license_key(self):
        """GET /api/license/validate/{key} validates key"""
        # First create a key
        create_resp = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "starter",
            "notes": f"{TEST_PREFIX}validate test"
        })
        key = create_resp.json()["key"]
        
        # Then validate it
        response = requests.get(f"{BASE_URL}/api/license/validate/{key}")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"]
        assert data["status"] == "active"
        print(f"✓ License key validated: {key}")
    
    def test_validate_invalid_key(self):
        """GET /api/license/validate/{key} returns invalid for non-existent key"""
        response = requests.get(f"{BASE_URL}/api/license/validate/WLAD-FAKE-KEY1-TEST")
        assert response.status_code == 200
        data = response.json()
        assert not (data["valid"])
        print("✓ Invalid key validation works")
    
    def test_activate_license_key(self):
        """POST /api/license/activate activates key"""
        # First create a key
        create_resp = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "fasttrack",
            "notes": f"{TEST_PREFIX}activate test"
        })
        key = create_resp.json()["key"]
        
        # Then activate it
        response = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": key,
            "email": f"{TEST_PREFIX}activate@test.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert data["plan"] == "fasttrack"
        assert "expires_at" in data
        print(f"✓ License key activated: {key}")
    
    def test_activate_already_used_key(self):
        """POST /api/license/activate returns 400 for already used key"""
        # Create and activate a key
        create_resp = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "standard",
            "notes": f"{TEST_PREFIX}double activate test"
        })
        key = create_resp.json()["key"]
        requests.post(f"{BASE_URL}/api/license/activate", json={"license_key": key})
        
        # Try to activate again
        response = requests.post(f"{BASE_URL}/api/license/activate", json={"license_key": key})
        assert response.status_code == 400
        print("✓ Double activation prevented")
    
    def test_list_license_keys(self):
        """GET /api/license/list lists keys"""
        response = requests.get(f"{BASE_URL}/api/license/list")
        assert response.status_code == 200
        data = response.json()
        assert "keys" in data
        assert "total" in data
        assert isinstance(data["keys"], list)
        print(f"✓ License keys listed: {data['total']} keys")


class TestEmail:
    """Test email endpoints in routes/email.py"""
    
    def test_send_report_missing_report(self):
        """POST /api/email/send-report returns error for missing report"""
        payload = {
            "session_id": f"nonexistent_{uuid.uuid4().hex}"
        }
        response = requests.post(f"{BASE_URL}/api/email/send-report", json=payload)
        assert response.status_code == 404
        print("✓ Send report for missing report returns 404")


class TestBookings:
    """Test booking endpoints in routes/admin.py"""
    
    def test_create_booking(self):
        """POST /api/booking/create creates booking"""
        payload = {
            "date": "2026-02-15",
            "time": "14:00",
            "name": f"{TEST_PREFIX}Booking User",
            "email": f"{TEST_PREFIX}booking@test.com",
            "plan": "fasttrack",
            "notes": "Test booking"
        }
        response = requests.post(f"{BASE_URL}/api/booking/create", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert data["booking_date"] == "2026-02-15"
        assert data["booking_time"] == "14:00"
        print(f"✓ Booking created: {data}")
    
    def test_list_bookings(self):
        """GET /api/booking/list lists bookings"""
        response = requests.get(f"{BASE_URL}/api/booking/list")
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        assert "total" in data
        assert isinstance(data["bookings"], list)
        print(f"✓ Bookings listed: {data['total']} bookings")


class TestAdmin:
    """Test admin endpoints in routes/admin.py"""
    
    def test_admin_stats(self):
        """GET /api/admin/stats returns all stats"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all stat categories
        assert "overview" in data
        assert "today" in data
        assert "keys" in data
        assert "conversions" in data
        assert "emails" in data
        assert "transactions" in data
        assert "bookings" in data
        assert "last_7_days" in data
        
        # Verify overview fields
        assert "total_users" in data["overview"]
        assert "total_reports" in data["overview"]
        assert "total_revenue" in data["overview"]
        assert "total_keys" in data["overview"]
        
        print(f"✓ Admin stats retrieved: {data['overview']}")
    
    def test_admin_users(self):
        """GET /api/admin/users returns enriched users"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert isinstance(data["users"], list)
        
        # Check enrichment fields if users exist
        if data["users"]:
            user = data["users"][0]
            assert "has_report" in user
            print(f"✓ Admin users retrieved: {data['total']} users (enriched with has_report)")
        else:
            print("✓ Admin users endpoint works (no users yet)")
    
    def test_admin_transactions(self):
        """GET /api/admin/transactions returns transactions"""
        response = requests.get(f"{BASE_URL}/api/admin/transactions")
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert "total" in data
        assert isinstance(data["transactions"], list)
        print(f"✓ Admin transactions retrieved: {data['total']} transactions")
    
    def test_admin_emails(self):
        """GET /api/admin/emails returns email log"""
        response = requests.get(f"{BASE_URL}/api/admin/emails")
        assert response.status_code == 200
        data = response.json()
        assert "emails" in data
        assert "total" in data
        assert isinstance(data["emails"], list)
        print(f"✓ Admin emails retrieved: {data['total']} emails")


class TestAuth:
    """Test auth endpoints in routes/auth.py"""
    
    def test_privacy_policy(self):
        """GET /api/privacy-policy returns policy"""
        response = requests.get(f"{BASE_URL}/api/privacy-policy")
        assert response.status_code == 200
        data = response.json()
        assert "title" in data
        assert "content" in data
        print(f"✓ Privacy policy retrieved: {data['title']}")
    
    def test_auth_me_unauthenticated(self):
        """GET /api/auth/me returns 401 when not authenticated"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth me returns 401 when unauthenticated")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
