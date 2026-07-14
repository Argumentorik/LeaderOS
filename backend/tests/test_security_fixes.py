from conftest import TEST_EMAIL, TEST_PASSWORD
"""
Test Security Fixes for WladBot Leadership OS
- httpOnly cookies for session_token
- sessionStorage instead of localStorage (frontend)
- Login/Register return JWT token AND set httpOnly cookie
- Logout clears session cookie
- API auth works with cookie-based auth
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthSecurityFixes:
    """Test authentication security improvements"""
    
    def test_login_returns_token_and_sets_cookie(self):
        """Login should return JWT token in body AND set httpOnly session_token cookie"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": os.environ.get("TEST_PASSWORD", TEST_PASSWORD)
        })
        
        # Status assertion
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        # Data assertions - JWT token in response body
        data = response.json()
        assert "token" in data, "Response should contain JWT token"
        assert isinstance(data["token"], str), "Token should be a string"
        assert len(data["token"]) > 20, "Token should be a valid JWT"
        
        # User data in response
        assert "user" in data, "Response should contain user data"
        assert data["user"]["email"] == TEST_EMAIL
        
        # Cookie assertion - httpOnly session_token should be set
        cookies = session.cookies.get_dict()
        assert "session_token" in cookies, "session_token cookie should be set"
        assert cookies["session_token"].startswith("sess_"), "Session token should have sess_ prefix"
        
        print(f"Login successful: token={data['token'][:20]}..., cookie={cookies.get('session_token', 'NOT SET')[:20]}...")
    
    def test_register_returns_token_and_sets_cookie(self):
        """Register should return JWT token in body AND set httpOnly session_token cookie"""
        session = requests.Session()
        unique_email = f"test_security_{uuid.uuid4().hex[:8]}@test.com"
        
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Security Test User",
            "phone": f"+49157{uuid.uuid4().int % 10**8:08d}"
        })
        
        # Status assertion
        assert response.status_code == 200, f"Register failed: {response.text}"
        
        # Data assertions - JWT token in response body
        data = response.json()
        assert "token" in data, "Response should contain JWT token"
        assert isinstance(data["token"], str), "Token should be a string"
        
        # User data in response
        assert "user" in data, "Response should contain user data"
        assert data["user"]["email"] == unique_email
        
        # Cookie assertion - httpOnly session_token should be set
        cookies = session.cookies.get_dict()
        assert "session_token" in cookies, "session_token cookie should be set on register"
        
        print(f"Register successful: email={unique_email}, cookie set={bool(cookies.get('session_token'))}")
    
    def test_auth_me_works_with_cookie(self):
        """API /api/auth/me should work with cookie-based auth"""
        session = requests.Session()
        
        # Login first to get cookie
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": os.environ.get("TEST_PASSWORD", TEST_PASSWORD)
        })
        assert login_resp.status_code == 200
        
        # Now call /auth/me - cookie should be sent automatically
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        
        assert me_resp.status_code == 200, f"Auth me failed: {me_resp.text}"
        data = me_resp.json()
        assert data["email"] == TEST_EMAIL
        assert "password_hash" not in data, "Password hash should not be exposed"
        
        print(f"Auth me with cookie: {data['email']}")
    
    def test_auth_me_works_with_jwt_header(self):
        """API /api/auth/me should also work with JWT in Authorization header"""
        # Login to get JWT token
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": os.environ.get("TEST_PASSWORD", TEST_PASSWORD)
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["token"]
        
        # Call /auth/me with JWT header (no cookies)
        me_resp = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert me_resp.status_code == 200, f"Auth me with JWT failed: {me_resp.text}"
        data = me_resp.json()
        assert data["email"] == TEST_EMAIL
        
        print(f"Auth me with JWT header: {data['email']}")
    
    def test_logout_clears_session_cookie(self):
        """Logout should clear the session_token cookie"""
        session = requests.Session()
        
        # Login first
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": os.environ.get("TEST_PASSWORD", TEST_PASSWORD)
        })
        assert login_resp.status_code == 200
        assert "session_token" in session.cookies.get_dict()
        
        # Logout
        logout_resp = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_resp.status_code == 200
        
        data = logout_resp.json()
        assert data.get("message") == "Logged out"
        
        # After logout, auth/me should fail
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 401, "Auth should fail after logout"
        
        print("Logout successful, session cleared")


class TestDashboardWithCookieAuth:
    """Test dashboard endpoints with cookie-based auth"""
    
    def test_dashboard_v4_with_cookie_auth(self):
        """Dashboard-v4 should work with cookie auth"""
        session = requests.Session()
        
        # Login
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": os.environ.get("TEST_PASSWORD", TEST_PASSWORD)
        })
        assert login_resp.status_code == 200
        
        # Get dashboard
        dash_resp = session.get(f"{BASE_URL}/api/dashboard-v4")
        
        assert dash_resp.status_code == 200, f"Dashboard failed: {dash_resp.text}"
        data = dash_resp.json()
        
        # Verify dashboard structure
        assert "user" in data
        assert "leader_score" in data
        assert "streak" in data
        # quick_actions may not be in v4 response
        
        print(f"Dashboard-v4 loaded: leader_score={data.get('leader_score')}")
    
    def test_dashboard_v4_without_auth_fails(self):
        """Dashboard-v4 should fail without auth"""
        response = requests.get(f"{BASE_URL}/api/dashboard-v4")
        assert response.status_code == 401


class TestDailyCheckinEndpoints:
    """Test daily check-in endpoints"""
    
    def test_daily_checkin_post(self):
        """POST /api/daily-checkin should work"""
        session = requests.Session()
        
        # Login
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": os.environ.get("TEST_PASSWORD", TEST_PASSWORD)
        })
        assert login_resp.status_code == 200
        
        # Post check-in - requires 'content' field
        checkin_resp = session.post(f"{BASE_URL}/api/daily-checkin", json={
            "content": "Testing security fixes. Feeling good with high energy. Focus on completing all tests."
        })
        
        assert checkin_resp.status_code == 200, f"Check-in failed: {checkin_resp.text}"
        data = checkin_resp.json()
        assert "checkin_id" in data or "feedback" in data or "ai_feedback" in data
        
        print("Daily check-in posted successfully")
    
    def test_daily_checkin_get_history(self):
        """GET /api/daily-checkin should return history"""
        session = requests.Session()
        
        # Login
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": os.environ.get("TEST_PASSWORD", TEST_PASSWORD)
        })
        assert login_resp.status_code == 200
        
        # Get history
        history_resp = session.get(f"{BASE_URL}/api/daily-checkin")
        
        assert history_resp.status_code == 200, f"Get history failed: {history_resp.text}"
        data = history_resp.json()
        assert isinstance(data, list)
        
        print(f"Daily check-in history: {len(data)} entries")
    
    def test_daily_checkin_today(self):
        """GET /api/daily-checkin/today should work"""
        session = requests.Session()
        
        # Login
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": os.environ.get("TEST_PASSWORD", TEST_PASSWORD)
        })
        assert login_resp.status_code == 200
        
        # Get today's check-in
        today_resp = session.get(f"{BASE_URL}/api/daily-checkin/today")
        
        assert today_resp.status_code == 200, f"Get today failed: {today_resp.text}"
        
        print("Daily check-in today endpoint works")


class TestLeaderScoreEndpoint:
    """Test leader score endpoint"""
    
    def test_leader_score_endpoint(self):
        """GET /api/leader-score should work"""
        session = requests.Session()
        
        # Login
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": os.environ.get("TEST_PASSWORD", TEST_PASSWORD)
        })
        assert login_resp.status_code == 200
        
        # Get leader score
        score_resp = session.get(f"{BASE_URL}/api/leader-score")
        
        assert score_resp.status_code == 200, f"Leader score failed: {score_resp.text}"
        data = score_resp.json()
        
        # Verify structure - response has composite_score, leadership_score, etc.
        assert "composite_score" in data or "leadership_score" in data
        
        print(f"Leader score endpoint works: {data}")


class TestOtherAuthenticatedEndpoints:
    """Test other endpoints that require auth"""
    
    def test_chat_sessions_endpoint(self):
        """GET /api/chat/sessions should work with auth"""
        session = requests.Session()
        
        # Login
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": os.environ.get("TEST_PASSWORD", TEST_PASSWORD)
        })
        assert login_resp.status_code == 200
        
        # Get chat sessions
        sessions_resp = session.get(f"{BASE_URL}/api/chat/sessions")
        
        assert sessions_resp.status_code == 200, f"Chat sessions failed: {sessions_resp.text}"
        data = sessions_resp.json()
        assert isinstance(data, list)
        
        print(f"Chat sessions: {len(data)} sessions")
    
    def test_simulations_scenarios_endpoint(self):
        """GET /api/simulations/scenarios should work"""
        response = requests.get(f"{BASE_URL}/api/simulations/scenarios")
        
        assert response.status_code == 200, f"Scenarios failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        print(f"Simulations scenarios: {len(data)} scenarios")
    
    def test_playbooks_endpoint(self):
        """GET /api/playbooks should work"""
        response = requests.get(f"{BASE_URL}/api/playbooks")
        
        assert response.status_code == 200, f"Playbooks failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        print(f"Playbooks: {len(data)} playbooks")
    
    def test_challengers_endpoint(self):
        """GET /api/challengers should work"""
        response = requests.get(f"{BASE_URL}/api/challengers")
        
        assert response.status_code == 200, f"Challengers failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        print(f"Challengers: {len(data)} challengers")
    
    def test_tasks_endpoint(self):
        """GET /api/tasks should work with auth"""
        session = requests.Session()
        
        # Login
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": os.environ.get("TEST_PASSWORD", TEST_PASSWORD)
        })
        assert login_resp.status_code == 200
        
        # Get tasks
        tasks_resp = session.get(f"{BASE_URL}/api/tasks")
        
        assert tasks_resp.status_code == 200, f"Tasks failed: {tasks_resp.text}"
        data = tasks_resp.json()
        assert isinstance(data, list)
        
        print(f"Tasks: {len(data)} tasks")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
