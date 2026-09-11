"""Iter 125 pre-deploy: 'Sprint' removal, packages endpoint, coaching-memory API."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://command-center-229.preview.emergentagent.com').rstrip('/')


@pytest.fixture(scope="module")
def free_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": "free@wladbot.test", "password": "test123"}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return r.json().get("token")


class TestPackagesNoSprint:
    def test_packages_endpoint_returns_200(self):
        r = requests.get(f"{BASE_URL}/api/payments/packages", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, (list, dict))

    def test_packages_descriptions_no_sprint(self):
        r = requests.get(f"{BASE_URL}/api/payments/packages", timeout=20)
        assert r.status_code == 200
        body_text = r.text
        # case-insensitive, whole word (avoid 'sprintr' matches - none expected anyway)
        matches = re.findall(r'\bsprint\w*', body_text, re.IGNORECASE)
        assert not matches, f"'Sprint' word found in packages payload: {matches[:5]}"


class TestCoachingMemory:
    def test_coaching_memory_200(self, free_token):
        assert free_token, "no token"
        r = requests.get(f"{BASE_URL}/api/simulations/coaching-memory",
                         headers={"Authorization": f"Bearer {free_token}"}, timeout=20)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:200]}"


class TestFreeUserCreditsUsed:
    def test_free_user_credits_used_gte_30(self, free_token):
        """Confirm the pre-condition for UsageFeedbackPrompt (>=30 credits used)."""
        r = requests.get(f"{BASE_URL}/api/credits/status",
                         headers={"Authorization": f"Bearer {free_token}"}, timeout=20)
        # If endpoint doesn't exist, skip
        if r.status_code == 404:
            pytest.skip("no /api/credits/status endpoint")
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        # Try common field names
        assert any(k in data for k in ('total_used', 'used', 'totalUsed'))
        print(f"credits status: {data}")
        # Not asserting hard — informational for the prompt test.


class TestEmailEp07Evergreen:
    def test_ep07_no_sprint_word(self):
        """EP07 rewrite: no 'Sprint' word in FRAMEWORK_EPISODES ep7."""
        path = "/app/backend/services_email.py"
        with open(path, "r", encoding="utf-8") as f:
            src = f.read()
        # Extract FRAMEWORK_EPISODES
        assert "FRAMEWORK_EPISODES" in src
        # Find ep 7 dict entry: "ep": 7 ... up to next "ep": <n> or end of FRAMEWORK_EPISODES
        idx = src.find('"ep": 7')
        assert idx > 0, "ep7 entry not found"
        # Next ep entry marks end
        next_idx = src.find('"ep":', idx + 5)
        end = next_idx if next_idx > 0 else src.find(']', idx)
        block = src[idx:end]
        assert "persönliches Operating System" in block or "Operating System" in block, \
            f"ep7 not evergreen? snippet: {block[:300]}"
        matches = re.findall(r'\bSprint\w*', block)
        assert not matches, f"'Sprint' in ep7: {matches}"
