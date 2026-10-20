from conftest import TEST_EMAIL, TEST_PASSWORD
"""
WladBot Leadership OS - MVP Final Testing
Tests all critical endpoints for the MVP-ready final release.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from environment
TEST_EMAIL = os.environ.get("TEST_EMAIL", TEST_EMAIL)
TEST_PASSWORD = os.environ.get("TEST_PASSWORD", TEST_PASSWORD)


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")


class TestDashboard:
    """Dashboard and Leader Score tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_dashboard_v4(self):
        """Test dashboard-v4 endpoint returns all required data"""
        response = requests.get(f"{BASE_URL}/api/dashboard-v4", headers=self.headers)
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        data = response.json()
        # Check required fields
        assert "user" in data, "User data missing"
        assert "leader_score" in data, "Leader score missing"
        assert "streak" in data, "Streak missing"
        assert "weekly_activity" in data, "Weekly activity missing"
        assert "what_matters_today" in data, "What matters today missing"
        assert "stats" in data, "Stats missing"
        print("✓ Dashboard-v4 returns all required data")
        print(f"  - Leader Score: {data['leader_score']}")
        print(f"  - Streak: {data['streak']}")
    
    def test_leader_score(self):
        """Test leader-score endpoint returns composite score and weekly activity"""
        response = requests.get(f"{BASE_URL}/api/leader-score", headers=self.headers)
        assert response.status_code == 200, f"Leader score failed: {response.text}"
        data = response.json()
        # API returns composite_score, leadership_score, eq_score, communication_score
        assert "composite_score" in data, "Composite score missing"
        assert "leadership_score" in data, "Leadership score missing"
        assert "eq_score" in data, "EQ score missing"
        assert "communication_score" in data, "Communication score missing"
        assert "weekly_activity" in data, "Weekly activity missing"
        print("✓ Leader score endpoint working")
        print(f"  - Composite: {data['composite_score']}, Leadership: {data['leadership_score']}, EQ: {data['eq_score']}, Communication: {data['communication_score']}")


class TestDailyCheckin:
    """Daily Check-in tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_daily_checkin_post(self):
        """Test submitting a daily check-in"""
        response = requests.post(f"{BASE_URL}/api/daily-checkin", 
            headers=self.headers,
            json={"content": "Today I delegated a critical task to my team lead and provided clear expectations.", "checkin_type": "text"}
        )
        assert response.status_code == 200, f"Check-in failed: {response.text}"
        data = response.json()
        assert "checkin_id" in data, "Checkin ID missing"
        assert "feedback" in data, "Feedback missing"
        # Verify AI feedback structure
        feedback = data["feedback"]
        assert "score_delta" in feedback, "Score delta missing from feedback"
        assert "micro_tip" in feedback, "Micro tip missing from feedback"
        assert "encouragement" in feedback, "Encouragement missing from feedback"
        print("✓ Daily check-in POST working")
        print(f"  - Score delta: +{feedback.get('score_delta', 0)}")
        print(f"  - Category: {feedback.get('category', 'N/A')}")
    
    def test_daily_checkin_get_history(self):
        """Test getting check-in history"""
        response = requests.get(f"{BASE_URL}/api/daily-checkin", headers=self.headers)
        assert response.status_code == 200, f"Get history failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "History should be a list"
        print(f"✓ Daily check-in GET history working - {len(data)} entries")
    
    def test_daily_checkin_today(self):
        """Test getting today's check-in"""
        response = requests.get(f"{BASE_URL}/api/daily-checkin/today", headers=self.headers)
        assert response.status_code == 200, f"Get today failed: {response.text}"
        print("✓ Daily check-in today endpoint working")


class TestVideoChallenge:
    """Video Challenge (Missions) tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_video_challenges(self):
        """Test getting video challenges - should return 4 challenges"""
        response = requests.get(f"{BASE_URL}/api/video-challenges", headers=self.headers)
        assert response.status_code == 200, f"Get challenges failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Challenges should be a list"
        assert len(data) >= 4, f"Expected at least 4 challenges, got {len(data)}"
        
        # Verify challenge structure
        expected_ids = ["change-speech", "vision-pitch", "crisis-response", "new-hire-welcome"]
        actual_ids = [c["challenge_id"] for c in data]
        for expected_id in expected_ids:
            assert expected_id in actual_ids, f"Missing challenge: {expected_id}"
        
        # Verify each challenge has required fields
        for challenge in data:
            assert "challenge_id" in challenge
            assert "title" in challenge
            assert "description" in challenge
            assert "difficulty" in challenge
            assert "time_limit" in challenge
        
        print("✓ Video challenges endpoint returns 4 challenges:")
        for c in data:
            print(f"  - {c['title']} ({c['difficulty']}, {c['time_limit']}s)")


class TestSimulations:
    """Simulations tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_scenarios(self):
        """Test getting simulation scenarios"""
        response = requests.get(f"{BASE_URL}/api/simulations/scenarios", headers=self.headers)
        assert response.status_code == 200, f"Get scenarios failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Scenarios should be a list"
        assert len(data) >= 5, f"Expected at least 5 scenarios, got {len(data)}"
        
        # Verify scenario structure
        for scenario in data:
            assert "scenario_id" in scenario
            assert "title" in scenario
            assert "description" in scenario
            assert "difficulty" in scenario
        
        print(f"✓ Simulations scenarios endpoint returns {len(data)} scenarios")
        for s in data[:3]:
            print(f"  - {s['title']} ({s['difficulty']})")


class TestTools:
    """Workflows/Tools tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_tools(self):
        """Test getting tools - should return 7 tools"""
        response = requests.get(f"{BASE_URL}/api/tools", headers=self.headers)
        assert response.status_code == 200, f"Get tools failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Tools should be a list"
        assert len(data) == 7, f"Expected 7 tools, got {len(data)}"
        
        # Verify tool structure - API returns tool_id, not id
        for tool in data:
            assert "tool_id" in tool, f"tool_id missing in {tool}"
            assert "title" in tool, f"title missing in {tool}"
        
        print("✓ Tools endpoint returns 7 tools:")
        for t in data:
            print(f"  - {t['title']}")


class TestChallengers:
    """Leadership Challengers tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_challengers(self):
        """Test getting leadership challengers"""
        response = requests.get(f"{BASE_URL}/api/challengers", headers=self.headers)
        assert response.status_code == 200, f"Get challengers failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Challengers should be a list"
        assert len(data) >= 5, f"Expected at least 5 challengers, got {len(data)}"
        
        # Verify challenger structure
        for challenger in data:
            assert "challenger_id" in challenger
            assert "name" in challenger
            assert "title" in challenger
            assert "difficulty" in challenger
        
        print(f"✓ Challengers endpoint returns {len(data)} challengers")


class TestPlaybooks:
    """Playbooks tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_playbooks(self):
        """Test getting playbooks"""
        response = requests.get(f"{BASE_URL}/api/playbooks", headers=self.headers)
        assert response.status_code == 200, f"Get playbooks failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Playbooks should be a list"
        assert len(data) >= 3, f"Expected at least 3 playbooks, got {len(data)}"
        
        # Verify playbook structure
        for playbook in data:
            assert "playbook_id" in playbook
            assert "title" in playbook
            assert "steps" in playbook
        
        print(f"✓ Playbooks endpoint returns {len(data)} playbooks")


class TestEvents:
    """Events tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_events(self):
        """Test getting events"""
        response = requests.get(f"{BASE_URL}/api/events", headers=self.headers)
        assert response.status_code == 200, f"Get events failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Events should be a list"
        print(f"✓ Events endpoint returns {len(data)} events")


class TestProgress:
    """Progress tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_progress(self):
        """Test getting progress"""
        response = requests.get(f"{BASE_URL}/api/progress", headers=self.headers)
        assert response.status_code == 200, f"Get progress failed: {response.text}"
        data = response.json()
        assert "user" in data, "User data missing"
        assert "stats" in data, "Stats missing"
        print("✓ Progress endpoint working")


class TestAgentScenarios:
    """Agent scenarios tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_agent_scenarios(self):
        """Test getting agent scenarios"""
        response = requests.get(f"{BASE_URL}/api/agents/scenarios", headers=self.headers)
        assert response.status_code == 200, f"Get agent scenarios failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Agent scenarios should be a dict"
        # Check for expected agents
        expected_agents = ["Vision Agent", "Communication Agent", "EQ Agent", "Conflict Agent", 
                          "Delegation Agent", "Meeting Agent", "Decision Agent", "Growth Agent"]
        for agent in expected_agents:
            assert agent in data, f"Missing agent: {agent}"
        print(f"✓ Agent scenarios endpoint returns {len(data)} agents")


class TestChatSessions:
    """Chat session tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_chat_sessions(self):
        """Test getting chat sessions"""
        response = requests.get(f"{BASE_URL}/api/chat/sessions", headers=self.headers)
        assert response.status_code == 200, f"Get chat sessions failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Chat sessions should be a list"
        print(f"✓ Chat sessions endpoint returns {len(data)} sessions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
