"""
WladBot V4 Backend API Tests
Tests for: Daily Check-in, Leader Score, Dashboard V4 endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from environment
TEST_EMAIL = os.environ.get('TEST_EMAIL', 'test@test.com')
TEST_PASSWORD = os.environ.get('TEST_PASSWORD', 'test123')


class TestAuthentication:
    """Test login flow with provided credentials"""
    
    def test_login_success(self):
        """Test login with test@test.com / test123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data["token"]


class TestDailyCheckin:
    """Tests for /api/daily-checkin endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["token"]
    
    def test_get_today_checkin(self, auth_token):
        """GET /api/daily-checkin/today - Get today's check-in status"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/daily-checkin/today", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Should return either a checkin object or {"checked_in": False}
        assert isinstance(data, dict), "Response should be a dict"
        print(f"✓ GET /api/daily-checkin/today - Status: {response.status_code}")
        print(f"  Response: {data}")
    
    def test_get_checkin_history(self, auth_token):
        """GET /api/daily-checkin - Get check-in history"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/daily-checkin", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/daily-checkin - Status: {response.status_code}")
        print(f"  Found {len(data)} check-ins in history")
    
    def test_post_daily_checkin(self, auth_token):
        """POST /api/daily-checkin - Submit a daily check-in"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "content": "TEST_CHECKIN: Today I made a decision to delegate a critical task to my team member, trusting their capabilities.",
            "checkin_type": "text"
        }
        response = requests.post(f"{BASE_URL}/api/daily-checkin", json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "checkin_id" in data, "Missing checkin_id"
        assert "feedback" in data, "Missing feedback"
        
        feedback = data["feedback"]
        # Check AI feedback fields
        assert "feedback" in feedback or isinstance(feedback, str), "Missing feedback text"
        print(f"✓ POST /api/daily-checkin - Status: {response.status_code}")
        print(f"  Checkin ID: {data.get('checkin_id')}")
        print(f"  AI Feedback: {feedback}")


class TestLeaderScore:
    """Tests for /api/leader-score endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["token"]
    
    def test_get_leader_score(self, auth_token):
        """GET /api/leader-score - Get composite leader score"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/leader-score", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "composite_score" in data, "Missing composite_score"
        assert "weekly_activity" in data, "Missing weekly_activity"
        assert "leadership_score" in data, "Missing leadership_score"
        assert "eq_score" in data, "Missing eq_score"
        assert "communication_score" in data, "Missing communication_score"
        assert "streak" in data, "Missing streak"
        
        # Validate weekly_activity is a list
        assert isinstance(data["weekly_activity"], list), "weekly_activity should be a list"
        
        print(f"✓ GET /api/leader-score - Status: {response.status_code}")
        print(f"  Composite Score: {data['composite_score']}")
        print(f"  Leadership: {data['leadership_score']}, EQ: {data['eq_score']}, Comm: {data['communication_score']}")
        print(f"  Streak: {data['streak']}")
        print(f"  Weekly Activity: {len(data['weekly_activity'])} days")


class TestDashboardV4:
    """Tests for /api/dashboard-v4 endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["token"]
    
    def test_get_dashboard_v4(self, auth_token):
        """GET /api/dashboard-v4 - Get V4 dashboard data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard-v4", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "leader_score" in data, "Missing leader_score"
        assert "streak" in data, "Missing streak"
        assert "what_matters_today" in data, "Missing what_matters_today"
        assert "weekly_activity" in data, "Missing weekly_activity"
        assert "user" in data, "Missing user"
        assert "stats" in data, "Missing stats"
        
        # Validate leader_score structure
        leader_score = data["leader_score"]
        assert "composite" in leader_score, "Missing composite in leader_score"
        assert "leadership" in leader_score, "Missing leadership in leader_score"
        assert "eq" in leader_score, "Missing eq in leader_score"
        assert "communication" in leader_score, "Missing communication in leader_score"
        
        # Validate what_matters_today structure
        wmt = data["what_matters_today"]
        assert "suggestions" in wmt, "Missing suggestions in what_matters_today"
        
        print(f"✓ GET /api/dashboard-v4 - Status: {response.status_code}")
        print(f"  Leader Score: {leader_score}")
        print(f"  Streak: {data['streak']}")
        print(f"  Suggestions: {len(wmt.get('suggestions', []))} items")
        print(f"  Weekly Activity: {len(data['weekly_activity'])} days")


class TestExistingEndpoints:
    """Verify existing endpoints still work (regression tests)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["token"]
    
    def test_get_simulations_scenarios(self, auth_token):
        """GET /api/simulations/scenarios - Verify simulations still work"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/simulations/scenarios", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/simulations/scenarios - {len(data)} scenarios")
    
    def test_get_tools(self, auth_token):
        """GET /api/tools - Verify tools still work"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/tools", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/tools - {len(data)} tools")
    
    def test_get_video_challenges(self, auth_token):
        """GET /api/video-challenges - Verify video challenges still work"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/video-challenges", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/video-challenges - {len(data)} challenges")
    
    def test_get_tasks(self, auth_token):
        """GET /api/tasks - Verify tasks still work"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/tasks", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/tasks - {len(data)} tasks")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
