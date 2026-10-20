"""Iter 92.49 (Godmode) — magic link + changelog + login sanity backend tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://command-center-229.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestMagicLink:
    def test_magic_link_request_for_seeded_user(self, api_client):
        # Use test@test.com (legacy admin, real .com TLD).
        # NOTE: seeded *.wladbot.test users are REJECTED by pydantic EmailStr
        # (reserved TLD) → 422. Documented bug in report.
        r = api_client.post(f"{BASE_URL}/api/auth/magic-link/request",
                            json={"email": "test@test.com"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "message" in data

    def test_magic_link_request_unknown_email_no_enumeration(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/magic-link/request",
                            json={"email": "definitely-not-a-user-xyz@example.com"})
        assert r.status_code == 200, r.text

    def test_magic_link_verify_invalid_token(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/magic-link/verify",
                            json={"token": "invalid-nonsense-token"})
        assert r.status_code in (400, 401, 404), r.text


class TestLoginBasics:
    def test_login_free_tier_ok(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/login",
                            json={"email": "free@wladbot.test", "password": "test123"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data
        assert data.get("user", {}).get("email") == "free@wladbot.test"

    def test_login_standard_tier_ok(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/login",
                            json={"email": "standard@wladbot.test", "password": "test123"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data


class TestHealth:
    def test_root_reachable(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/")
        # accept 200 or 404 (routing depends on server) — we just need reachability
        assert r.status_code < 500, r.text
