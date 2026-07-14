from conftest import TEST_EMAIL, TEST_PASSWORD
"""
Test suite for quiz_bank.py and /api/challenge30 endpoints
Tests: 300 questions across 30 days, correct structure, valid types, unique content
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = TEST_EMAIL
TEST_PASSWORD = TEST_PASSWORD


class TestQuizBankStructure:
    """Tests for quiz_bank.py structure and content"""
    
    def test_quiz_bank_has_30_days(self):
        """Verify QUIZ_BANK has exactly 30 days"""
        import sys
        sys.path.insert(0, '/app/backend')
        from quiz_bank import QUIZ_BANK
        
        assert len(QUIZ_BANK) == 30, f"Expected 30 days, got {len(QUIZ_BANK)}"
        for day in range(1, 31):
            assert day in QUIZ_BANK, f"Day {day} missing from QUIZ_BANK"
    
    def test_each_day_has_10_questions(self):
        """Verify each day has exactly 10 questions"""
        import sys
        sys.path.insert(0, '/app/backend')
        from quiz_bank import QUIZ_BANK
        
        for day in range(1, 31):
            questions = QUIZ_BANK.get(day, [])
            assert len(questions) == 10, f"Day {day} has {len(questions)} questions, expected 10"
    
    def test_total_300_questions(self):
        """Verify total of 300 questions"""
        import sys
        sys.path.insert(0, '/app/backend')
        from quiz_bank import QUIZ_BANK
        
        total = sum(len(questions) for questions in QUIZ_BANK.values())
        assert total == 300, f"Expected 300 total questions, got {total}"
    
    def test_valid_question_types(self):
        """Verify all question types are 'mc', 'coach', or 'action'"""
        import sys
        sys.path.insert(0, '/app/backend')
        from quiz_bank import QUIZ_BANK
        
        valid_types = {'mc', 'coach', 'action'}
        invalid_questions = []
        
        for day, questions in QUIZ_BANK.items():
            for i, q in enumerate(questions):
                qtype = q.get('type', 'mc')
                if qtype not in valid_types:
                    invalid_questions.append(f"Day {day}, Q{i}: type='{qtype}'")
        
        assert len(invalid_questions) == 0, f"Invalid types found: {invalid_questions}"
    
    def test_mc_questions_have_required_fields(self):
        """Verify MC questions have options and correct answer"""
        import sys
        sys.path.insert(0, '/app/backend')
        from quiz_bank import QUIZ_BANK
        
        issues = []
        for day, questions in QUIZ_BANK.items():
            for i, q in enumerate(questions):
                if q.get('type', 'mc') == 'mc':
                    if 'options' not in q:
                        issues.append(f"Day {day}, Q{i}: missing 'options'")
                    if 'correct' not in q:
                        issues.append(f"Day {day}, Q{i}: missing 'correct'")
        
        assert len(issues) == 0, f"MC structure issues: {issues[:10]}"
    
    def test_coach_action_questions_have_path(self):
        """Verify coach and action questions have path field"""
        import sys
        sys.path.insert(0, '/app/backend')
        from quiz_bank import QUIZ_BANK
        
        issues = []
        for day, questions in QUIZ_BANK.items():
            for i, q in enumerate(questions):
                qtype = q.get('type', 'mc')
                if qtype in ('coach', 'action'):
                    if 'path' not in q:
                        issues.append(f"Day {day}, Q{i}: {qtype} missing 'path'")
        
        assert len(issues) == 0, f"Path issues: {issues[:10]}"
    
    def test_all_questions_have_explanation(self):
        """Verify all questions have explanation field"""
        import sys
        sys.path.insert(0, '/app/backend')
        from quiz_bank import QUIZ_BANK
        
        missing = []
        for day, questions in QUIZ_BANK.items():
            for i, q in enumerate(questions):
                if 'explanation' not in q:
                    missing.append(f"Day {day}, Q{i}")
        
        assert len(missing) == 0, f"Missing explanations: {missing[:10]}"
    
    def test_days_11_to_30_have_unique_content(self):
        """Verify days 11-30 have hand-crafted unique questions (not template patterns)"""
        import sys
        sys.path.insert(0, '/app/backend')
        from quiz_bank import QUIZ_BANK
        
        # Check that questions are unique and not generic templates
        all_questions = []
        for day in range(11, 31):
            questions = QUIZ_BANK.get(day, [])
            for q in questions:
                all_questions.append(q.get('q', ''))
        
        # Check for uniqueness
        unique_questions = set(all_questions)
        assert len(unique_questions) == len(all_questions), "Duplicate questions found in days 11-30"
        
        # Check that questions are not generic templates (should have specific content)
        generic_patterns = ['Tag X', 'Frage X', 'Template', 'Placeholder']
        for q_text in all_questions:
            for pattern in generic_patterns:
                assert pattern not in q_text, f"Generic pattern '{pattern}' found in question: {q_text[:50]}"


class TestChallenge30API:
    """Tests for /api/challenge30 endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_cookies(self):
        """Login and get auth cookies"""
        session = requests.Session()
        time.sleep(0.5)  # Rate limiting delay
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code} - {response.text}")
        return session.cookies
    
    def test_challenge_status_endpoint(self, auth_cookies):
        """Test GET /api/challenge30/status returns challenge data"""
        time.sleep(0.5)  # Rate limiting delay
        response = requests.get(
            f"{BASE_URL}/api/challenge30/status",
            cookies=auth_cookies
        )
        assert response.status_code == 200, f"Status endpoint failed: {response.text}"
        
        data = response.json()
        assert "challenges" in data, "Missing 'challenges' in response"
        assert "completed_days" in data, "Missing 'completed_days' in response"
        assert "current_day" in data, "Missing 'current_day' in response"
        assert len(data["challenges"]) == 30, f"Expected 30 challenges, got {len(data['challenges'])}"
    
    def test_quiz_endpoint_day_1(self, auth_cookies):
        """Test GET /api/challenge30/quiz/1 returns quiz questions"""
        time.sleep(0.5)  # Rate limiting delay
        response = requests.get(
            f"{BASE_URL}/api/challenge30/quiz/1",
            cookies=auth_cookies
        )
        assert response.status_code == 200, f"Quiz endpoint failed: {response.text}"
        
        data = response.json()
        assert data["day"] == 1, "Wrong day returned"
        assert "questions" in data, "Missing 'questions' in response"
        assert data["total"] == 10, f"Expected 10 questions, got {data['total']}"
        
        # Verify question structure (should not include correct answers)
        for q in data["questions"]:
            assert "q" in q, "Question missing 'q' field"
            assert "type" in q, "Question missing 'type' field"
            assert "correct" not in q, "Question should not expose correct answer"
    
    def test_quiz_endpoint_day_15(self, auth_cookies):
        """Test GET /api/challenge30/quiz/15 returns quiz questions for mid-challenge"""
        time.sleep(0.5)  # Rate limiting delay
        response = requests.get(
            f"{BASE_URL}/api/challenge30/quiz/15",
            cookies=auth_cookies
        )
        assert response.status_code == 200, f"Quiz endpoint failed: {response.text}"
        
        data = response.json()
        assert data["day"] == 15, "Wrong day returned"
        assert data["total"] == 10, f"Expected 10 questions, got {data['total']}"
    
    def test_quiz_endpoint_day_30(self, auth_cookies):
        """Test GET /api/challenge30/quiz/30 returns quiz questions for final day"""
        time.sleep(0.5)  # Rate limiting delay
        response = requests.get(
            f"{BASE_URL}/api/challenge30/quiz/30",
            cookies=auth_cookies
        )
        assert response.status_code == 200, f"Quiz endpoint failed: {response.text}"
        
        data = response.json()
        assert data["day"] == 30, "Wrong day returned"
        assert data["total"] == 10, f"Expected 10 questions, got {data['total']}"
    
    def test_quiz_endpoint_invalid_day(self, auth_cookies):
        """Test GET /api/challenge30/quiz/31 returns error"""
        time.sleep(0.5)  # Rate limiting delay
        response = requests.get(
            f"{BASE_URL}/api/challenge30/quiz/31",
            cookies=auth_cookies
        )
        assert response.status_code == 400, f"Expected 400 for invalid day, got {response.status_code}"
    
    def test_quiz_endpoint_day_0(self, auth_cookies):
        """Test GET /api/challenge30/quiz/0 returns error"""
        time.sleep(0.5)  # Rate limiting delay
        response = requests.get(
            f"{BASE_URL}/api/challenge30/quiz/0",
            cookies=auth_cookies
        )
        assert response.status_code == 400, f"Expected 400 for day 0, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
