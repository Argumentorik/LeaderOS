from conftest import TEST_EMAIL, TEST_PASSWORD
"""
Iteration 47 - My Path German Personality-Based Levels Testing
Tests the renamed levels after famous leadership personalities (German):
- Die Mandela-Klasse (Nelson Mandela)
- Die Drucker-Klasse (Peter Drucker)
- Die Jobs-Klasse (Steve Jobs)
- Die Bezos-Klasse (Jeff Bezos)
- Die Musk-Klasse (Elon Musk)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Expected German level names and their associated persons
EXPECTED_LEVELS = [
    {"level": "Die Mandela-Klasse", "person": "Nelson Mandela", "index": 0, "min_xp": 0},
    {"level": "Die Drucker-Klasse", "person": "Peter Drucker", "index": 1, "min_xp": 200},
    {"level": "Die Jobs-Klasse", "person": "Steve Jobs", "index": 2, "min_xp": 500},
    {"level": "Die Bezos-Klasse", "person": "Jeff Bezos", "index": 3, "min_xp": 1000},
    {"level": "Die Musk-Klasse", "person": "Elon Musk", "index": 4, "min_xp": 2000},
]


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def authenticated_session(auth_token):
    """Session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestMyPathGermanLevels:
    """Test the German personality-based level names"""

    def test_my_path_returns_200(self, authenticated_session):
        """GET /api/my-path returns 200 OK"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ GET /api/my-path returns 200 OK")

    def test_my_path_returns_5_levels(self, authenticated_session):
        """Response contains exactly 5 levels"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        assert "levels" in data, "Response missing 'levels' field"
        assert len(data["levels"]) == 5, f"Expected 5 levels, got {len(data['levels'])}"
        print("✓ Response contains exactly 5 levels")

    def test_level_names_are_german(self, authenticated_session):
        """All level names are German personality-based"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        for i, level in enumerate(data["levels"]):
            expected = EXPECTED_LEVELS[i]
            assert level["level"] == expected["level"], \
                f"Level {i}: Expected '{expected['level']}', got '{level['level']}'"
        print("✓ All level names are German personality-based")

    def test_each_level_has_person_field(self, authenticated_session):
        """Each level has correct person field"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        for i, level in enumerate(data["levels"]):
            expected = EXPECTED_LEVELS[i]
            assert "person" in level, f"Level {i} missing 'person' field"
            assert level["person"] == expected["person"], \
                f"Level {i}: Expected person '{expected['person']}', got '{level['person']}'"
        print("✓ Each level has correct person field (Mandela, Drucker, Jobs, Bezos, Musk)")

    def test_each_level_has_motto(self, authenticated_session):
        """Each level has motto field"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        for i, level in enumerate(data["levels"]):
            assert "motto" in level, f"Level {i} missing 'motto' field"
            assert isinstance(level["motto"], str) and len(level["motto"]) > 0, \
                f"Level {i} motto should be non-empty string"
        print("✓ Each level has motto field")

    def test_each_level_has_description(self, authenticated_session):
        """Each level has description field"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        for i, level in enumerate(data["levels"]):
            assert "description" in level, f"Level {i} missing 'description' field"
            assert isinstance(level["description"], str) and len(level["description"]) > 0, \
                f"Level {i} description should be non-empty string"
        print("✓ Each level has description field")

    def test_each_level_has_certificate(self, authenticated_session):
        """Each level has certificate field"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        for i, level in enumerate(data["levels"]):
            assert "certificate" in level, f"Level {i} missing 'certificate' field"
            assert isinstance(level["certificate"], str) and len(level["certificate"]) > 0, \
                f"Level {i} certificate should be non-empty string"
        print("✓ Each level has certificate field")


class TestTestUserState:
    """Test the test user's current state after migration"""

    def test_user_at_bezos_klasse(self, authenticated_session):
        """Test user should be at 'Die Bezos-Klasse' (index 3)"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        assert data["current_level"] == "Die Bezos-Klasse", \
            f"Expected 'Die Bezos-Klasse', got '{data['current_level']}'"
        assert data["current_index"] == 3, \
            f"Expected current_index 3, got {data['current_index']}"
        print("✓ Test user at 'Die Bezos-Klasse' (index 3)")

    def test_user_has_1280_xp(self, authenticated_session):
        """Test user should have 1280 XP"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        assert data["xp"] == 1280, f"Expected 1280 XP, got {data['xp']}"
        print("✓ Test user has 1280 XP")


class TestCertificates:
    """Test the certificates array"""

    def test_certificates_array_exists(self, authenticated_session):
        """Response contains certificates array"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        assert "certificates" in data, "Response missing 'certificates' field"
        assert isinstance(data["certificates"], list), "certificates should be a list"
        print("✓ Response contains certificates array")

    def test_certificates_count(self, authenticated_session):
        """Test user should have 4 certificates (3 earned + 1 in progress)"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        # User at index 3 (Bezos) should have:
        # - 3 earned (Mandela, Drucker, Jobs)
        # - 1 in progress (Bezos)
        assert len(data["certificates"]) == 4, \
            f"Expected 4 certificates, got {len(data['certificates'])}"
        print("✓ Test user has 4 certificates (3 earned + 1 in progress)")

    def test_earned_certificates(self, authenticated_session):
        """3 certificates should be earned (Mandela, Drucker, Jobs)"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        earned = [c for c in data["certificates"] if c.get("earned")]
        assert len(earned) == 3, f"Expected 3 earned certificates, got {len(earned)}"
        
        earned_persons = [c["person"] for c in earned]
        assert "Nelson Mandela" in earned_persons, "Missing Mandela certificate"
        assert "Peter Drucker" in earned_persons, "Missing Drucker certificate"
        assert "Steve Jobs" in earned_persons, "Missing Jobs certificate"
        print("✓ 3 certificates earned (Mandela, Drucker, Jobs)")

    def test_current_certificate_in_progress(self, authenticated_session):
        """Current level certificate (Bezos) should be in progress (earned=False)"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        in_progress = [c for c in data["certificates"] if not c.get("earned")]
        assert len(in_progress) == 1, f"Expected 1 in-progress certificate, got {len(in_progress)}"
        assert in_progress[0]["person"] == "Jeff Bezos", \
            f"Expected Bezos in progress, got {in_progress[0]['person']}"
        print("✓ Current certificate (Bezos) in progress")

    def test_certificate_structure(self, authenticated_session):
        """Each certificate has required fields"""
        response = authenticated_session.get(f"{BASE_URL}/api/my-path")
        data = response.json()
        
        for cert in data["certificates"]:
            assert "level" in cert, "Certificate missing 'level' field"
            assert "person" in cert, "Certificate missing 'person' field"
            assert "title" in cert, "Certificate missing 'title' field"
            assert "earned" in cert, "Certificate missing 'earned' field"
        print("✓ Each certificate has required fields (level, person, title, earned)")


class TestOtherAPIs:
    """Verify other APIs still working"""

    def test_credits_api(self, authenticated_session):
        """GET /api/credits returns 200"""
        response = authenticated_session.get(f"{BASE_URL}/api/credits")
        assert response.status_code == 200, f"Credits API failed: {response.status_code}"
        print("✓ GET /api/credits returns 200")

    def test_ki_news_api(self, authenticated_session):
        """GET /api/ki-news returns 200"""
        response = authenticated_session.get(f"{BASE_URL}/api/ki-news")
        assert response.status_code == 200, f"KI-News API failed: {response.status_code}"
        print("✓ GET /api/ki-news returns 200")

    def test_challenge30_api(self, authenticated_session):
        """GET /api/challenge30 returns 200"""
        response = authenticated_session.get(f"{BASE_URL}/api/challenge30")
        assert response.status_code == 200, f"Challenge30 API failed: {response.status_code}"
        print("✓ GET /api/challenge30 returns 200")


class TestUnauthorized:
    """Test unauthorized access"""

    def test_my_path_requires_auth(self):
        """GET /api/my-path returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/my-path")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/my-path returns 401 without auth")
