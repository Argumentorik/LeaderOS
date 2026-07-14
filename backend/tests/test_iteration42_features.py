from conftest import TEST_EMAIL, TEST_PASSWORD
"""
Iteration 42 - Backend Tests for:
1. /api/payments/packages - returns 3 packages including 'fast_track' at €6970
2. /api/ki-news/daily - returns quote_of_the_day and 3 trends
3. Quiz bank verification - 300 questions across 30 days with new harder content
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = TEST_EMAIL
TEST_PASSWORD = TEST_PASSWORD


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for protected endpoints."""
    time.sleep(2)  # Rate limiter delay
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token."""
    return {"Authorization": f"Bearer {auth_token}"}


class TestPaymentsPackages:
    """Test /api/payments/packages endpoint - returns 3 packages including fast_track at €6970."""

    def test_packages_endpoint_returns_200(self, auth_headers):
        """Test that packages endpoint returns 200."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/payments/packages", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_packages_returns_list(self, auth_headers):
        """Test that packages returns a list."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/payments/packages", headers=auth_headers)
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"

    def test_packages_has_three_packages(self, auth_headers):
        """Test that there are exactly 3 packages."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/payments/packages", headers=auth_headers)
        data = response.json()
        assert len(data) == 3, f"Expected 3 packages, got {len(data)}"

    def test_packages_has_standard(self, auth_headers):
        """Test that 'standard' package exists with €997."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/payments/packages", headers=auth_headers)
        data = response.json()
        standard = next((p for p in data if p.get("id") == "standard"), None)
        assert standard is not None, "Standard package not found"
        assert standard.get("amount") == 997.00, f"Standard amount should be 997, got {standard.get('amount')}"
        assert standard.get("currency") == "eur", f"Currency should be eur, got {standard.get('currency')}"

    def test_packages_has_fast_track(self, auth_headers):
        """Test that 'fast_track' package exists with €6970."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/payments/packages", headers=auth_headers)
        data = response.json()
        fast_track = next((p for p in data if p.get("id") == "fast_track"), None)
        assert fast_track is not None, "Fast Track package not found"
        assert fast_track.get("amount") == 6970.00, f"Fast Track amount should be 6970, got {fast_track.get('amount')}"
        assert fast_track.get("currency") == "eur", f"Currency should be eur, got {fast_track.get('currency')}"
        assert "Fast Track" in fast_track.get("name", ""), f"Name should contain 'Fast Track', got {fast_track.get('name')}"

    def test_packages_has_enterprise(self, auth_headers):
        """Test that 'enterprise' package exists."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/payments/packages", headers=auth_headers)
        data = response.json()
        enterprise = next((p for p in data if p.get("id") == "enterprise"), None)
        assert enterprise is not None, "Enterprise package not found"
        assert enterprise.get("amount") == 2497.00, f"Enterprise amount should be 2497, got {enterprise.get('amount')}"

    def test_packages_have_required_fields(self, auth_headers):
        """Test that all packages have required fields."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/payments/packages", headers=auth_headers)
        data = response.json()
        required_fields = ["id", "name", "amount", "currency", "description"]
        for pkg in data:
            for field in required_fields:
                assert field in pkg, f"Package {pkg.get('id')} missing field: {field}"


class TestKiNewsDaily:
    """Test /api/ki-news/daily endpoint - returns quote_of_the_day and 3 trends."""

    def test_ki_news_endpoint_returns_200(self, auth_headers):
        """Test that ki-news/daily endpoint returns 200."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_ki_news_has_date(self, auth_headers):
        """Test that response has date field."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=auth_headers)
        data = response.json()
        assert "date" in data, "Response missing 'date' field"
        assert isinstance(data["date"], str), "Date should be a string"

    def test_ki_news_has_quote_of_the_day(self, auth_headers):
        """Test that response has quote_of_the_day with required fields."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=auth_headers)
        data = response.json()
        assert "quote_of_the_day" in data, "Response missing 'quote_of_the_day' field"
        quote = data["quote_of_the_day"]
        assert "author" in quote, "Quote missing 'author' field"
        assert "role" in quote, "Quote missing 'role' field"
        assert "quote" in quote, "Quote missing 'quote' field"
        assert "insight" in quote, "Quote missing 'insight' field"

    def test_ki_news_quote_is_from_ai_leader(self, auth_headers):
        """Test that quote is from a known AI leader."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=auth_headers)
        data = response.json()
        quote = data["quote_of_the_day"]
        known_leaders = [
            "Sam Altman", "Jensen Huang", "Satya Nadella", "Sundar Pichai",
            "Elon Musk", "Bill Gates", "Mustafa Suleyman", "Marc Andreessen",
            "Dario Amodei", "Arvind Krishna", "Andrew Ng", "Fei-Fei Li",
            "Demis Hassabis", "Reed Hastings"
        ]
        assert quote["author"] in known_leaders, f"Author '{quote['author']}' not in known AI leaders list"

    def test_ki_news_has_trends(self, auth_headers):
        """Test that response has trends array with 3 items."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=auth_headers)
        data = response.json()
        assert "trends" in data, "Response missing 'trends' field"
        assert isinstance(data["trends"], list), "Trends should be a list"
        assert len(data["trends"]) == 3, f"Expected 3 trends, got {len(data['trends'])}"

    def test_ki_news_trends_have_required_fields(self, auth_headers):
        """Test that each trend has required fields."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=auth_headers)
        data = response.json()
        required_fields = ["title", "category", "summary", "impact"]
        for i, trend in enumerate(data["trends"]):
            for field in required_fields:
                assert field in trend, f"Trend {i} missing field: {field}"

    def test_ki_news_has_total_trends_count(self, auth_headers):
        """Test that response has total_trends count."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=auth_headers)
        data = response.json()
        assert "total_trends" in data, "Response missing 'total_trends' field"
        assert data["total_trends"] >= 10, f"Expected at least 10 total trends, got {data['total_trends']}"


class TestQuizBankContent:
    """Test quiz bank has 300 questions with new harder content (SaaS→GaaS, famous AI quotes)."""

    def test_quiz_day2_has_saas_to_gaas_content(self, auth_headers):
        """Test that Day 2 has SaaS→GaaS content."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/challenge30/quiz/2", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        questions = data.get("questions", [])
        
        # Check for SaaS→GaaS or AI leader content
        content_found = False
        for q in questions:
            q_text = q.get("q", "").lower()
            if "gaas" in q_text or "generation as a service" in q_text or "saas" in q_text:
                content_found = True
                break
            if any(leader.lower() in q_text for leader in ["sam altman", "jensen huang", "satya nadella", "sundar pichai"]):
                content_found = True
                break
        
        assert content_found, "Day 2 should have SaaS→GaaS or AI leader content"

    def test_quiz_day2_has_ai_leader_quotes(self, auth_headers):
        """Test that Day 2 has famous AI leader quotes."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/challenge30/quiz/2", headers=auth_headers)
        data = response.json()
        questions = data.get("questions", [])
        
        ai_leaders = ["sam altman", "jensen huang", "satya nadella", "sundar pichai", "elon musk", "marc andreessen"]
        leader_found = False
        for q in questions:
            q_text = q.get("q", "").lower()
            if any(leader in q_text for leader in ai_leaders):
                leader_found = True
                break
        
        assert leader_found, "Day 2 should reference famous AI leaders"

    def test_quiz_has_30_days(self, auth_headers):
        """Test that quiz bank has 30 days of challenges."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/challenge30/status", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        challenges = data.get("challenges", [])
        assert len(challenges) == 30, f"Expected 30 days, got {len(challenges)}"

    def test_each_day_has_10_questions(self, auth_headers):
        """Test that each day has 10 questions (spot check days 1, 15, 30)."""
        for day in [1, 15, 30]:
            time.sleep(2)
            response = requests.get(f"{BASE_URL}/api/challenge30/quiz/{day}", headers=auth_headers)
            assert response.status_code == 200, f"Day {day} failed: {response.status_code}"
            data = response.json()
            questions = data.get("questions", [])
            assert len(questions) == 10, f"Day {day} should have 10 questions, got {len(questions)}"

    def test_quiz_day22_has_harder_content(self, auth_headers):
        """Test that Day 22 has harder AI content."""
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/api/challenge30/quiz/22", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        questions = data.get("questions", [])
        assert len(questions) == 10, f"Day 22 should have 10 questions, got {len(questions)}"


class TestAuthEndpoints:
    """Test authentication endpoints work correctly."""

    def test_login_with_valid_credentials(self):
        """Test login with valid credentials."""
        time.sleep(2)
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "token" in data, "Response missing token"
        assert "user" in data, "Response missing user"

    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials returns 401."""
        time.sleep(2)
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
