"""
Iteration 51 - Backend API Tests
Testing:
1. /api/video-challenges returns 16 missions
2. /api/dashboard-v4 returns correct data
3. /api/my-path returns 5 levels
4. /api/credits returns balance
5. /api/ki-news/daily returns quote + trends + fact
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_EMAIL = os.environ.get("TEST_EMAIL", "test@test.com")
TEST_PASSWORD = os.environ.get("TEST_PASSWORD", "test123")


class TestHealthAndRoot:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "WLAD AI" in data["message"]
        print(f"✓ API root returns: {data['message']}")


class TestVideoMissions:
    """Test video challenges endpoint - should return 16 missions"""
    
    def test_video_challenges_returns_16_missions(self):
        """Verify /api/video-challenges returns exactly 16 missions"""
        response = requests.get(f"{BASE_URL}/api/video-challenges")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 16, f"Expected 16 missions, got {len(data)}"
        print(f"✓ /api/video-challenges returns {len(data)} missions")
    
    def test_video_challenges_structure(self):
        """Verify each mission has required fields"""
        response = requests.get(f"{BASE_URL}/api/video-challenges")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["challenge_id", "title", "description", "difficulty", "time_limit"]
        for mission in data:
            for field in required_fields:
                assert field in mission, f"Mission missing field: {field}"
        
        # Check difficulty values
        difficulties = [m["difficulty"] for m in data]
        assert "easy" in difficulties
        assert "medium" in difficulties
        assert "hard" in difficulties
        print(f"✓ All 16 missions have correct structure with difficulties: {set(difficulties)}")


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print("✓ Login successful for test@test.com")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected with 401")


class TestAuthenticatedEndpoints:
    """Test endpoints that require authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_dashboard_v4_returns_data(self):
        """Test /api/dashboard-v4 returns correct data structure"""
        response = requests.get(f"{BASE_URL}/api/dashboard-v4", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check for expected fields
        assert "leader_score" in data
        assert "weekly_activity" in data
        
        # Verify leader_score structure
        leader_score = data["leader_score"]
        assert "composite" in leader_score
        assert "leadership" in leader_score
        assert "eq" in leader_score
        assert "communication" in leader_score
        
        # Verify weekly_activity has 7 days
        assert len(data["weekly_activity"]) == 7
        
        print(f"✓ /api/dashboard-v4 returns correct data with leader_score: {leader_score['composite']}")
    
    def test_dashboard_v4_requires_auth(self):
        """Test /api/dashboard-v4 requires authentication"""
        response = requests.get(f"{BASE_URL}/api/dashboard-v4")
        assert response.status_code == 401
        print("✓ /api/dashboard-v4 correctly requires authentication")
    
    def test_my_path_returns_5_levels(self):
        """Test /api/my-path returns exactly 5 levels"""
        response = requests.get(f"{BASE_URL}/api/my-path", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "levels" in data
        assert len(data["levels"]) == 5, f"Expected 5 levels, got {len(data['levels'])}"
        
        # Verify German level names (field is 'level' not 'name')
        level_names = [lvl["level"] for lvl in data["levels"]]
        expected_names = ["Teamplayer", "Mentor", "Kommunikator", "Strategischer Denker", "Visionär"]
        assert level_names == expected_names, f"Level names mismatch: {level_names}"
        
        # Verify certificates array exists
        assert "certificates" in data
        
        # Verify level structure
        for level in data["levels"]:
            assert "min_xp" in level
            assert "is_unlocked" in level
            assert "is_current" in level
        
        print(f"✓ /api/my-path returns 5 levels: {level_names}")
    
    def test_my_path_requires_auth(self):
        """Test /api/my-path requires authentication"""
        response = requests.get(f"{BASE_URL}/api/my-path")
        assert response.status_code == 401
        print("✓ /api/my-path correctly requires authentication")
    
    def test_credits_returns_balance(self):
        """Test /api/credits returns balance and related fields"""
        response = requests.get(f"{BASE_URL}/api/credits", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "balance" in data
        assert "limit" in data
        assert "is_premium" in data
        
        # Free user should have limit of 50
        assert data["limit"] == 50
        
        print(f"✓ /api/credits returns balance: {data['balance']}, limit: {data['limit']}, premium: {data['is_premium']}")
    
    def test_credits_requires_auth(self):
        """Test /api/credits requires authentication"""
        response = requests.get(f"{BASE_URL}/api/credits")
        assert response.status_code == 401
        print("✓ /api/credits correctly requires authentication")
    
    def test_ki_news_daily_returns_data(self):
        """Test /api/ki-news/daily returns quote, trends, and fact"""
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check for expected fields (actual field names from API)
        assert "quote_of_the_day" in data
        assert "trends" in data
        assert "fact_of_the_day" in data
        
        # Verify quote structure
        quote = data["quote_of_the_day"]
        assert "quote" in quote
        assert "author" in quote
        
        # Verify trends is a list
        assert isinstance(data["trends"], list)
        
        # Verify fact structure
        fact = data["fact_of_the_day"]
        assert "fact" in fact
        
        print(f"✓ /api/ki-news/daily returns quote by {quote['author']}, {len(data['trends'])} trends, and fact")
    
    def test_ki_news_daily_requires_auth(self):
        """Test /api/ki-news/daily requires authentication"""
        response = requests.get(f"{BASE_URL}/api/ki-news/daily")
        assert response.status_code == 401
        print("✓ /api/ki-news/daily correctly requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
