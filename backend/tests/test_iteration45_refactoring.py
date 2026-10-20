from conftest import TEST_EMAIL, TEST_PASSWORD
"""
Iteration 45 - Code Refactoring Tests
Tests to verify all existing functionality still works after:
1. Sidebar.js split - SVG icons extracted to SidebarIcons.js
2. video.py refactored - helper functions extracted
3. challenge30.py refactored - helper functions extracted
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthentication:
    """Test authentication still works after refactoring"""
    
    def test_login_success(self):
        """Login with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == TEST_EMAIL
        return data["token"]


class TestCreditsEndpoint:
    """Test /api/credits endpoint - verifies credits.py still works"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_credits_returns_balance_and_limit(self, auth_token):
        """GET /api/credits returns correct balance and limit=50"""
        response = requests.get(
            f"{BASE_URL}/api/credits",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Credits failed: {response.text}"
        data = response.json()
        assert "balance" in data, "No balance in response"
        assert "limit" in data, "No limit in response"
        assert data["limit"] == 50, f"Expected limit=50, got {data['limit']}"
        assert "is_premium" in data, "No is_premium in response"


class TestChallenge30Endpoints:
    """Test challenge30.py endpoints after refactoring with _score_quiz and _get_or_create_progress helpers"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_quiz_day_1_returns_10_questions(self, auth_token):
        """GET /api/challenge30/quiz/1 returns 10 questions"""
        response = requests.get(
            f"{BASE_URL}/api/challenge30/quiz/1",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Quiz day 1 failed: {response.text}"
        data = response.json()
        assert "questions" in data, "No questions in response"
        assert len(data["questions"]) == 10, f"Expected 10 questions, got {len(data['questions'])}"
        assert data["day"] == 1
        assert "challenge" in data
    
    def test_quiz_day_30_returns_10_questions(self, auth_token):
        """GET /api/challenge30/quiz/30 returns 10 questions"""
        response = requests.get(
            f"{BASE_URL}/api/challenge30/quiz/30",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Quiz day 30 failed: {response.text}"
        data = response.json()
        assert "questions" in data, "No questions in response"
        assert len(data["questions"]) == 10, f"Expected 10 questions, got {len(data['questions'])}"
        assert data["day"] == 30
    
    def test_quiz_submission_works(self, auth_token):
        """POST /api/challenge30/quiz/1 with answers returns score"""
        # Submit answers for day 1 quiz (10 questions, all answer 0)
        answers = {str(i): 0 for i in range(10)}
        response = requests.post(
            f"{BASE_URL}/api/challenge30/quiz/1",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"answers": answers}
        )
        assert response.status_code == 200, f"Quiz submission failed: {response.text}"
        data = response.json()
        assert "score" in data, "No score in response"
        assert "correct" in data, "No correct count in response"
        assert "total" in data, "No total in response"
        assert "passed" in data, "No passed flag in response"
        assert "xp_earned" in data, "No xp_earned in response"
        assert "results" in data, "No results in response"
        # Verify _score_quiz helper is working - results should have details
        assert len(data["results"]) == 10, f"Expected 10 results, got {len(data['results'])}"
    
    def test_challenge_status_endpoint(self, auth_token):
        """GET /api/challenge30/status returns challenge data"""
        response = requests.get(
            f"{BASE_URL}/api/challenge30/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Status failed: {response.text}"
        data = response.json()
        assert "challenges" in data, "No challenges in response"
        assert "completed_days" in data, "No completed_days in response"
        assert "current_day" in data, "No current_day in response"
        assert len(data["challenges"]) == 30, f"Expected 30 challenges, got {len(data['challenges'])}"


class TestVideoEndpoints:
    """Test video.py endpoints after refactoring with _transcribe_audio, _build_analysis_prompt, _get_rating_params helpers"""
    
    def test_video_challenges_list(self):
        """GET /api/video-challenges returns challenges list (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/video-challenges")
        assert response.status_code == 200, f"Video challenges failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of challenges"
        assert len(data) > 0, "Expected at least one challenge"
        # Verify challenge structure
        challenge = data[0]
        assert "challenge_id" in challenge, "No challenge_id"
        assert "title" in challenge, "No title"
        assert "description" in challenge, "No description"
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_rating_preferences_endpoint(self, auth_token):
        """GET /api/rating-preferences returns user preferences"""
        response = requests.get(
            f"{BASE_URL}/api/rating-preferences",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Rating preferences failed: {response.text}"
        data = response.json()
        # Verify default structure from _build_rating_context helper
        assert "mode" in data, "No mode in preferences"
        assert "level" in data, "No level in preferences"
        assert data["mode"] in ["soft", "hard"], f"Invalid mode: {data['mode']}"


class TestKINewsEndpoint:
    """Test /api/ki-news/daily endpoint still works"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_ki_news_daily(self, auth_token):
        """GET /api/ki-news/daily returns news data"""
        response = requests.get(
            f"{BASE_URL}/api/ki-news/daily",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"KI News failed: {response.text}"
        data = response.json()
        # Should return news structure
        assert isinstance(data, dict), "Expected dict response"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
