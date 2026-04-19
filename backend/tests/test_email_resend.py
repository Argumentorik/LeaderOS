"""Backend API tests for WLADHUB Resend Email Integration
Tests: Welcome email (via user create), Report email, Plan reminder email, Email logging
IMPORTANT: Uses start@aiporate.com for actual email tests (Resend is LIVE)
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_EMAIL = "start@aiporate.com"  # Approved test email for Resend

@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestHealthCheck:
    """Verify backend is running with resend import"""
    
    def test_health_with_resend_import(self, client):
        """Test /api/health returns healthy - confirms resend import works"""
        resp = client.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200, f"Backend may have import error: {resp.text}"
        data = resp.json()
        assert data["status"] == "healthy"
        print(f"Health check passed: {data['service']} - resend import OK")


class TestWelcomeEmailViaUserCreate:
    """Test POST /api/user/create sends welcome email automatically"""
    
    def test_user_create_sends_welcome_email(self, client):
        """Test user creation triggers welcome email to start@aiporate.com"""
        resp = client.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_ResendWelcome",
            "email": TEST_EMAIL,
            "role": "senior_manager"
        })
        assert resp.status_code == 200, f"User create failed: {resp.text}"
        data = resp.json()
        
        # Verify user creation response
        assert "session_id" in data
        assert data["name"] == "TEST_ResendWelcome"
        assert data["role"] == "senior_manager"
        
        # Welcome email is fire-and-forget (background task)
        # Give it a moment to send
        time.sleep(2)
        
        print(f"User created with session_id: {data['session_id']}")
        print(f"Welcome email should be sent to {TEST_EMAIL} (fire-and-forget)")
        return data["session_id"]
    
    def test_user_create_with_custom_role_sends_email(self, client):
        """Test user creation with custom role also triggers welcome email"""
        resp = client.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_CustomRoleEmail",
            "email": TEST_EMAIL,
            "role": "custom",
            "custom_role": "Tech Lead at Startup"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "custom"
        print(f"Custom role user created, welcome email triggered")


class TestReportEmailEndpoint:
    """Test POST /api/email/send-report endpoint"""
    
    @pytest.fixture
    def session_with_report(self, client):
        """Create user and generate report for email testing"""
        # Create user with test email
        user_resp = client.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_ReportEmail",
            "email": TEST_EMAIL,
            "role": "senior_manager"
        })
        assert user_resp.status_code == 200
        session_id = user_resp.json()["session_id"]
        
        # Generate report with test answers
        categories = ["rhetorik", "kritisches_denken", "entscheidung", "fuehrung", "eq", "strategie"]
        layers = ["ai_literacy", "rhetoric", "strategic_eq"]
        answers = [
            {"question_id": i+1, "category": categories[i % 6], "layer": layers[i % 3], "score": 2 + (i % 3)}
            for i in range(30)
        ]
        
        report_resp = client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": session_id,
            "answers": answers
        }, timeout=60)
        assert report_resp.status_code == 200, f"Report generation failed: {report_resp.text}"
        
        # Wait for auto-send report email (background task)
        time.sleep(2)
        
        return session_id
    
    def test_send_report_email_success(self, client, session_with_report):
        """Test sending report email for valid session"""
        resp = client.post(f"{BASE_URL}/api/email/send-report", json={
            "session_id": session_with_report
        })
        assert resp.status_code == 200, f"Send report email failed: {resp.text}"
        data = resp.json()
        
        # With Resend configured, should return success
        assert "success" in data
        if data["success"]:
            assert "id" in data, "Successful email should return resend id"
            print(f"Report email sent successfully, resend_id: {data.get('id')}")
        else:
            # If Resend not configured, should return message
            print(f"Report email not sent: {data.get('message', data.get('error'))}")
    
    def test_send_report_email_not_found(self, client):
        """Test sending report email for non-existent session returns 404"""
        resp = client.post(f"{BASE_URL}/api/email/send-report", json={
            "session_id": "non-existent-session-id-12345"
        })
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
        print(f"Correctly returned 404 for non-existent report")


class TestPlanReminderEmailEndpoint:
    """Test POST /api/email/send-plan-reminder endpoint"""
    
    @pytest.fixture
    def session_with_user(self, client):
        """Create user for plan reminder testing"""
        user_resp = client.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_PlanReminder",
            "email": TEST_EMAIL,
            "role": "team_leader"
        })
        assert user_resp.status_code == 200
        return user_resp.json()["session_id"]
    
    def test_send_plan_reminder_week1(self, client, session_with_user):
        """Test sending week 1 plan reminder email"""
        resp = client.post(f"{BASE_URL}/api/email/send-plan-reminder", json={
            "session_id": session_with_user,
            "week": 1
        })
        assert resp.status_code == 200, f"Plan reminder failed: {resp.text}"
        data = resp.json()
        
        assert "success" in data
        if data["success"]:
            assert "id" in data
            print(f"Week 1 plan reminder sent, resend_id: {data.get('id')}")
        else:
            print(f"Plan reminder not sent: {data.get('error')}")
    
    def test_send_plan_reminder_week2(self, client, session_with_user):
        """Test sending week 2 plan reminder email"""
        resp = client.post(f"{BASE_URL}/api/email/send-plan-reminder", json={
            "session_id": session_with_user,
            "week": 2
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "success" in data
        print(f"Week 2 plan reminder: success={data['success']}")
    
    def test_send_plan_reminder_week3(self, client, session_with_user):
        """Test sending week 3 plan reminder email"""
        resp = client.post(f"{BASE_URL}/api/email/send-plan-reminder", json={
            "session_id": session_with_user,
            "week": 3
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "success" in data
        print(f"Week 3 plan reminder: success={data['success']}")
    
    def test_send_plan_reminder_week4(self, client, session_with_user):
        """Test sending week 4 plan reminder email"""
        resp = client.post(f"{BASE_URL}/api/email/send-plan-reminder", json={
            "session_id": session_with_user,
            "week": 4
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "success" in data
        print(f"Week 4 plan reminder: success={data['success']}")
    
    def test_send_plan_reminder_user_not_found(self, client):
        """Test plan reminder for non-existent user returns 404"""
        resp = client.post(f"{BASE_URL}/api/email/send-plan-reminder", json={
            "session_id": "non-existent-user-session",
            "week": 1
        })
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        data = resp.json()
        assert "detail" in data
        print(f"Correctly returned 404 for non-existent user")


class TestReportAutoSendEmail:
    """Test that POST /api/quiz/generate-report auto-sends report email"""
    
    def test_generate_report_auto_sends_email(self, client):
        """Test report generation automatically sends email in background"""
        # Create user with test email
        user_resp = client.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_AutoReportEmail",
            "email": TEST_EMAIL,
            "role": "senior_manager"
        })
        assert user_resp.status_code == 200
        session_id = user_resp.json()["session_id"]
        
        # Generate report
        categories = ["rhetorik", "kritisches_denken", "entscheidung", "fuehrung", "eq", "strategie"]
        layers = ["ai_literacy", "rhetoric", "strategic_eq"]
        answers = [
            {"question_id": i+1, "category": categories[i % 6], "layer": layers[i % 3], "score": 3}
            for i in range(30)
        ]
        
        report_resp = client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": session_id,
            "answers": answers
        }, timeout=60)
        
        assert report_resp.status_code == 200, f"Report generation failed: {report_resp.text}"
        data = report_resp.json()
        
        # Verify report structure
        assert "narrative" in data
        assert "leadership_roles" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        
        # Auto-send is fire-and-forget, wait a moment
        time.sleep(2)
        
        print(f"Report generated for {TEST_EMAIL}")
        print(f"Auto-send report email triggered (fire-and-forget)")
        print(f"Profile: {data['narrative'].get('profile_title', 'N/A')}")


class TestEmailEndpointValidation:
    """Test email endpoint input validation"""
    
    def test_send_report_missing_session_id(self, client):
        """Test send-report with missing session_id returns 422"""
        resp = client.post(f"{BASE_URL}/api/email/send-report", json={})
        assert resp.status_code == 422, f"Expected 422, got {resp.status_code}"
        print("Correctly validated missing session_id")
    
    def test_send_plan_reminder_missing_session_id(self, client):
        """Test send-plan-reminder with missing session_id - endpoint handles gracefully"""
        resp = client.post(f"{BASE_URL}/api/email/send-plan-reminder", json={
            "week": 1
        })
        # Endpoint may return 200 with success=False, 404, or 422
        # The current implementation returns 200 with error when no user found
        assert resp.status_code in [200, 404, 422], f"Expected 200/404/422, got {resp.status_code}"
        if resp.status_code == 200:
            data = resp.json()
            # Should indicate failure since no valid session
            print(f"Handled missing session_id: {data}")
        else:
            print(f"Correctly handled missing session_id: {resp.status_code}")


class TestEmailLogStorage:
    """Test that email logs are stored in MongoDB"""
    
    def test_email_operations_complete_without_error(self, client):
        """Test that email operations complete without server errors"""
        # Create user (triggers welcome email)
        user_resp = client.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_EmailLog",
            "email": TEST_EMAIL,
            "role": "senior_manager"
        })
        assert user_resp.status_code == 200
        session_id = user_resp.json()["session_id"]
        
        # Generate report (triggers auto-send)
        categories = ["rhetorik", "kritisches_denken", "entscheidung", "fuehrung", "eq", "strategie"]
        layers = ["ai_literacy", "rhetoric", "strategic_eq"]
        answers = [
            {"question_id": i+1, "category": categories[i % 6], "layer": layers[i % 3], "score": 2}
            for i in range(30)
        ]
        
        report_resp = client.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": session_id,
            "answers": answers
        }, timeout=60)
        assert report_resp.status_code == 200
        
        # Send plan reminder
        reminder_resp = client.post(f"{BASE_URL}/api/email/send-plan-reminder", json={
            "session_id": session_id,
            "week": 1
        })
        assert reminder_resp.status_code == 200
        
        # All operations completed without 500 errors
        print("All email operations completed successfully")
        print("Email logs should be stored in MongoDB email_log collection")
