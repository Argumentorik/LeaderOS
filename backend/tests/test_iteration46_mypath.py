from conftest import TEST_EMAIL, TEST_PASSWORD
"""
Iteration 46 - My Path Feature Tests
Tests the new 'My Path' AI Journey 5 Levels progression system.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMyPathEndpoint:
    """Tests for GET /api/my-path endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        data = login_res.json()
        self.token = data.get("token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_my_path_returns_200(self):
        """Test that /api/my-path returns 200 OK"""
        res = self.session.get(f"{BASE_URL}/api/my-path")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    
    def test_my_path_has_required_fields(self):
        """Test response contains current_level, xp, levels array"""
        res = self.session.get(f"{BASE_URL}/api/my-path")
        assert res.status_code == 200
        data = res.json()
        
        # Required top-level fields
        assert "current_level" in data, "Missing current_level"
        assert "current_index" in data, "Missing current_index"
        assert "xp" in data, "Missing xp"
        assert "levels" in data, "Missing levels array"
        assert "challenge_days" in data, "Missing challenge_days"
        assert "video_missions" in data, "Missing video_missions"
        assert "chat_sessions" in data, "Missing chat_sessions"
        assert "scores" in data, "Missing scores"
    
    def test_my_path_has_5_levels(self):
        """Test that levels array contains exactly 5 levels"""
        res = self.session.get(f"{BASE_URL}/api/my-path")
        assert res.status_code == 200
        data = res.json()
        
        levels = data.get("levels", [])
        assert len(levels) == 5, f"Expected 5 levels, got {len(levels)}"
    
    def test_level_structure(self):
        """Test each level has required fields"""
        res = self.session.get(f"{BASE_URL}/api/my-path")
        assert res.status_code == 200
        data = res.json()
        
        required_fields = [
            "level", "index", "subtitle", "color", "skills",
            "is_current", "is_unlocked", "xp_progress"
        ]
        
        for level in data.get("levels", []):
            for field in required_fields:
                assert field in level, f"Level missing field: {field}"
    
    def test_level_names_correct(self):
        """Test level names match expected progression"""
        res = self.session.get(f"{BASE_URL}/api/my-path")
        assert res.status_code == 200
        data = res.json()
        
        expected_levels = [
            "Emerging Leader",  # 0-199 XP
            "Leader",           # 200-499 XP
            "Senior Leader",    # 500-999 XP
            "Executive",        # 1000-1999 XP
            "Visionary"         # 2000+ XP
        ]
        
        levels = data.get("levels", [])
        for i, expected in enumerate(expected_levels):
            assert levels[i]["level"] == expected, f"Level {i} should be '{expected}', got '{levels[i]['level']}'"
            assert levels[i]["index"] == i, f"Level {i} index should be {i}, got {levels[i]['index']}"
    
    def test_level_xp_thresholds(self):
        """Test level min_xp thresholds are correct"""
        res = self.session.get(f"{BASE_URL}/api/my-path")
        assert res.status_code == 200
        data = res.json()
        
        expected_min_xp = [0, 200, 500, 1000, 2000]
        levels = data.get("levels", [])
        
        for i, expected in enumerate(expected_min_xp):
            assert levels[i]["min_xp"] == expected, f"Level {i} min_xp should be {expected}, got {levels[i]['min_xp']}"
    
    def test_scores_structure(self):
        """Test scores object has leadership, eq, communication"""
        res = self.session.get(f"{BASE_URL}/api/my-path")
        assert res.status_code == 200
        data = res.json()
        
        scores = data.get("scores", {})
        assert "leadership" in scores, "Missing leadership score"
        assert "eq" in scores, "Missing eq score"
        assert "communication" in scores, "Missing communication score"
    
    def test_current_level_is_marked(self):
        """Test that exactly one level is marked as current"""
        res = self.session.get(f"{BASE_URL}/api/my-path")
        assert res.status_code == 200
        data = res.json()
        
        current_count = sum(1 for level in data.get("levels", []) if level.get("is_current"))
        assert current_count == 1, f"Expected exactly 1 current level, got {current_count}"
    
    def test_unlocked_levels_consistency(self):
        """Test that unlocked levels are consistent with current level"""
        res = self.session.get(f"{BASE_URL}/api/my-path")
        assert res.status_code == 200
        data = res.json()
        
        current_index = data.get("current_index", 0)
        levels = data.get("levels", [])
        
        for level in levels:
            if level["index"] <= current_index:
                assert level["is_unlocked"], f"Level {level['index']} should be unlocked (current is {current_index})"
            else:
                assert not level["is_unlocked"], f"Level {level['index']} should be locked (current is {current_index})"
    
    def test_xp_matches_current_level(self):
        """Test that XP value matches the current level"""
        res = self.session.get(f"{BASE_URL}/api/my-path")
        assert res.status_code == 200
        data = res.json()
        
        xp = data.get("xp", 0)
        current_level = data.get("current_level", "")
        
        # Verify XP is in correct range for current level
        level_ranges = {
            "Emerging Leader": (0, 199),
            "Leader": (200, 499),
            "Senior Leader": (500, 999),
            "Executive": (1000, 1999),
            "Visionary": (2000, 99999)
        }
        
        if current_level in level_ranges:
            min_xp, max_xp = level_ranges[current_level]
            assert min_xp <= xp <= max_xp, f"XP {xp} not in range for {current_level} ({min_xp}-{max_xp})"


class TestMyPathWithoutAuth:
    """Test My Path endpoint requires authentication"""
    
    def test_my_path_requires_auth(self):
        """Test that /api/my-path returns 401 without auth"""
        res = requests.get(f"{BASE_URL}/api/my-path")
        assert res.status_code == 401, f"Expected 401 without auth, got {res.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
