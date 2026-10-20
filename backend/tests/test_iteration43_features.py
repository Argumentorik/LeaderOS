from conftest import TEST_EMAIL, TEST_PASSWORD
"""
Iteration 43 Tests - Phase 2 & 3 Update Testing
Tests for:
1. KI-News API: fact_of_the_day with fact, source, category fields
2. KI-News API: quote_of_the_day has coach_prompt field
3. KI-News API: trends have coach_prompt field
4. Quiz bank: 300 questions, 30 days x 10
5. Quiz Day 5: Gartner, McKinsey, HBR references
6. Quiz Day 15: Harari, Jobs, Stanford references
7. Quiz Day 25: Thiel, Jensen Huang, Altman references
"""
import pytest
import requests
import os
import time
import sys

# Add backend to path for quiz_bank import
sys.path.insert(0, '/app/backend')
from quiz_bank import QUIZ_BANK

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestKiNewsAPI:
    """Tests for /api/ki-news/daily endpoint - Phase 2 updates"""
    
    @classmethod
    def setup_class(cls):
        """Setup: Login and get auth token once for all tests"""
        time.sleep(1)  # Rate limiter delay
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        cls.token = login_response.json().get("token")  # API returns 'token' not 'access_token'
        cls.headers = {"Authorization": f"Bearer {cls.token}"}
    
    def test_ki_news_returns_200(self):
        """Test that /api/ki-news/daily returns 200"""
        time.sleep(0.5)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_ki_news_has_fact_of_the_day(self):
        """Test that response has fact_of_the_day field"""
        time.sleep(0.5)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=self.headers)
        data = response.json()
        assert "fact_of_the_day" in data, "Response missing fact_of_the_day field"
    
    def test_fact_of_the_day_has_required_fields(self):
        """Test that fact_of_the_day has fact, source, category fields"""
        time.sleep(0.5)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=self.headers)
        data = response.json()
        fact = data.get("fact_of_the_day", {})
        
        assert "fact" in fact, "fact_of_the_day missing 'fact' field"
        assert "source" in fact, "fact_of_the_day missing 'source' field"
        assert "category" in fact, "fact_of_the_day missing 'category' field"
        
        # Verify they are non-empty strings
        assert isinstance(fact["fact"], str) and len(fact["fact"]) > 0, "fact should be non-empty string"
        assert isinstance(fact["source"], str) and len(fact["source"]) > 0, "source should be non-empty string"
        assert isinstance(fact["category"], str) and len(fact["category"]) > 0, "category should be non-empty string"
    
    def test_quote_of_the_day_has_coach_prompt(self):
        """Test that quote_of_the_day has coach_prompt field"""
        time.sleep(0.5)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=self.headers)
        data = response.json()
        quote = data.get("quote_of_the_day", {})
        
        assert "coach_prompt" in quote, "quote_of_the_day missing 'coach_prompt' field"
        assert isinstance(quote["coach_prompt"], str) and len(quote["coach_prompt"]) > 0, "coach_prompt should be non-empty string"
    
    def test_trends_have_coach_prompt(self):
        """Test that all trends have coach_prompt field"""
        time.sleep(0.5)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=self.headers)
        data = response.json()
        trends = data.get("trends", [])
        
        assert len(trends) > 0, "No trends returned"
        
        for i, trend in enumerate(trends):
            assert "coach_prompt" in trend, f"Trend {i} missing 'coach_prompt' field"
            assert isinstance(trend["coach_prompt"], str) and len(trend["coach_prompt"]) > 0, f"Trend {i} coach_prompt should be non-empty string"
    
    def test_trends_have_impact_field(self):
        """Test that all trends have impact field (Kritisch/Hoch/Mittel)"""
        time.sleep(0.5)
        response = requests.get(f"{BASE_URL}/api/ki-news/daily", headers=self.headers)
        data = response.json()
        trends = data.get("trends", [])
        
        valid_impacts = ["Kritisch", "Hoch", "Mittel"]
        for i, trend in enumerate(trends):
            assert "impact" in trend, f"Trend {i} missing 'impact' field"
            assert trend["impact"] in valid_impacts, f"Trend {i} has invalid impact: {trend['impact']}"


class TestQuizBankStructure:
    """Tests for Quiz Bank - 300 questions, 30 days x 10"""
    
    def test_quiz_bank_has_30_days(self):
        """Test that quiz bank has 30 days"""
        assert len(QUIZ_BANK) == 30, f"Expected 30 days, got {len(QUIZ_BANK)}"
    
    def test_each_day_has_10_questions(self):
        """Test that each day has exactly 10 questions"""
        for day in range(1, 31):
            assert day in QUIZ_BANK, f"Day {day} missing from quiz bank"
            assert len(QUIZ_BANK[day]) == 10, f"Day {day} has {len(QUIZ_BANK[day])} questions, expected 10"
    
    def test_total_300_questions(self):
        """Test that total questions = 300"""
        total = sum(len(QUIZ_BANK[day]) for day in QUIZ_BANK)
        assert total == 300, f"Expected 300 total questions, got {total}"


class TestQuizDay5HarderContent:
    """Tests for Day 5 - Gartner, McKinsey, HBR references"""
    
    def test_day5_has_gartner_reference(self):
        """Test that Day 5 has Gartner reference"""
        day5_text = str(QUIZ_BANK[5])
        assert "Gartner" in day5_text, "Day 5 missing Gartner reference"
    
    def test_day5_has_mckinsey_reference(self):
        """Test that Day 5 has McKinsey reference"""
        day5_text = str(QUIZ_BANK[5])
        assert "McKinsey" in day5_text, "Day 5 missing McKinsey reference"
    
    def test_day5_has_hbr_reference(self):
        """Test that Day 5 has Harvard Business Review reference"""
        day5_text = str(QUIZ_BANK[5])
        assert "Harvard Business Review" in day5_text or "HBR" in day5_text, "Day 5 missing HBR reference"
    
    def test_day5_has_wef_reference(self):
        """Test that Day 5 has World Economic Forum reference"""
        day5_text = str(QUIZ_BANK[5])
        assert "World Economic Forum" in day5_text or "WEF" in day5_text, "Day 5 missing WEF reference"


class TestQuizDay15HarderContent:
    """Tests for Day 15 - Harari, Jobs, Stanford references"""
    
    def test_day15_has_harari_reference(self):
        """Test that Day 15 has Yuval Noah Harari reference"""
        day15_text = str(QUIZ_BANK[15])
        assert "Harari" in day15_text, "Day 15 missing Harari reference"
    
    def test_day15_has_stanford_reference(self):
        """Test that Day 15 has Stanford reference"""
        day15_text = str(QUIZ_BANK[15])
        assert "Stanford" in day15_text, "Day 15 missing Stanford reference"
    
    def test_day15_has_bezos_or_jobs_reference(self):
        """Test that Day 15 has Bezos or Jobs reference"""
        day15_text = str(QUIZ_BANK[15])
        # Day 15 has Bezos reference (Jeff Bezos verbietet PowerPoint)
        assert "Bezos" in day15_text or "Jobs" in day15_text, "Day 15 missing Bezos/Jobs reference"


class TestQuizDay25HarderContent:
    """Tests for Day 25 - Thiel, Jensen Huang, Altman references"""
    
    def test_day25_has_thiel_reference(self):
        """Test that Day 25 has Peter Thiel reference"""
        day25_text = str(QUIZ_BANK[25])
        assert "Thiel" in day25_text, "Day 25 missing Thiel reference"
    
    def test_day25_has_jensen_huang_reference(self):
        """Test that Day 25 has Jensen Huang reference"""
        day25_text = str(QUIZ_BANK[25])
        assert "Jensen Huang" in day25_text, "Day 25 missing Jensen Huang reference"
    
    def test_day25_has_altman_reference(self):
        """Test that Day 25 has Sam Altman reference"""
        day25_text = str(QUIZ_BANK[25])
        assert "Altman" in day25_text, "Day 25 missing Altman reference"
    
    def test_day25_has_jobs_reference(self):
        """Test that Day 25 has Steve Jobs reference"""
        day25_text = str(QUIZ_BANK[25])
        assert "Jobs" in day25_text, "Day 25 missing Jobs reference"


class TestQuizDay22HarderContent:
    """Tests for Day 22 - Additional harder AI content"""
    
    def test_day22_has_ai_content(self):
        """Test that Day 22 has AI-related content"""
        day22_text = str(QUIZ_BANK[22])
        ai_keywords = ["AI", "KI", "McKinsey", "Gartner", "AI Readiness"]
        has_ai_content = any(keyword in day22_text for keyword in ai_keywords)
        assert has_ai_content, "Day 22 missing AI-related content"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
