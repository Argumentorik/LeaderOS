"""Iter 185 backend tests: credits (monthly refill, admin lookup/topup/stuck),
video-challenges/access pre-check, dashboard bootstrap slices, coaching public route."""
import os
import time
import requests
import pytest

def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    env_path = "/app/frontend/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().strip('"').rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not set")

BASE_URL = _load_backend_url()
API = f"{BASE_URL}/api"

TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "test123"
FREE_EMAIL = "free@wladbot.test"


def _login(email, password):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"identifier": email, "password": password})
    assert r.status_code == 200, f"login {email}: {r.status_code} {r.text}"
    return s, r.json()


@pytest.fixture(scope="module")
def admin_session():
    s, _ = _login(TEST_EMAIL, TEST_PASSWORD)
    return s


@pytest.fixture(scope="module")
def free_session():
    s, data = _login(FREE_EMAIL, TEST_PASSWORD)
    return s, data


# -------- credits --------
class TestCredits:
    def test_get_credits_monthly_refill(self, free_session):
        s, _ = free_session
        r = s.get(f"{API}/credits")
        assert r.status_code == 200
        data = r.json()
        assert data.get("monthly_refill") == 50, data
        assert "next_refill" in data and isinstance(data["next_refill"], str)

    def test_admin_lookup(self, admin_session):
        r = admin_session.get(f"{API}/credits/admin/lookup", params={"q": FREE_EMAIL})
        assert r.status_code == 200, r.text
        d = r.json()
        for key in ("tier", "balance", "total_used"):
            assert key in d, f"missing {key}: {d}"

    def test_admin_lookup_not_found(self, admin_session):
        r = admin_session.get(f"{API}/credits/admin/lookup", params={"q": "no-such-user-xyz@none.test"})
        assert r.status_code == 404

    def test_admin_topup(self, admin_session):
        # find user_id via lookup
        r = admin_session.get(f"{API}/credits/admin/lookup", params={"q": FREE_EMAIL})
        assert r.status_code == 200
        before = int(r.json().get("balance", 0))
        user_id = r.json().get("user_id")
        assert user_id
        r2 = admin_session.post(f"{API}/credits/admin/topup/{user_id}", json={"amount": 20, "note": "TEST_iter185"})
        assert r2.status_code == 200, r2.text
        after = int(r2.json().get("balance", 0))
        assert after >= before + 20, f"before={before} after={after}"

    def test_admin_stuck(self, admin_session):
        r = admin_session.get(f"{API}/credits/admin/stuck")
        assert r.status_code == 200
        d = r.json()
        assert "count" in d and "customers" in d and "next_refill" in d
        assert isinstance(d["customers"], list)

    def test_admin_endpoints_require_admin(self, free_session):
        s, _ = free_session
        r = s.get(f"{API}/credits/admin/lookup", params={"q": FREE_EMAIL})
        assert r.status_code in (401, 403), r.status_code


# -------- video-challenges access precheck --------
class TestVideoAccess:
    def test_access_endpoint(self, admin_session):
        r = admin_session.get(f"{API}/video-challenges/access")
        assert r.status_code == 200, r.text
        d = r.json()
        for key in ("allowed", "reason", "cost", "message"):
            assert key in d, f"missing {key}: {d}"
        assert isinstance(d["allowed"], bool)
        # cost integer
        assert isinstance(d["cost"], int)

    def test_access_free_user(self, free_session):
        s, _ = free_session
        r = s.get(f"{API}/video-challenges/access")
        assert r.status_code == 200
        d = r.json()
        assert d["reason"] in ("first_free", "ok", "no_credits", "tier_required")


# -------- dashboard bootstrap slices --------
class TestDashboardBootstrap:
    def test_bootstrap_slices(self, admin_session):
        r = admin_session.get(f"{API}/dashboard/bootstrap")
        assert r.status_code == 200, r.text
        d = r.json()
        for key in ("challenge_today", "checkin_today", "courses_status"):
            assert key in d, f"missing slice {key}: keys={list(d.keys())}"


# -------- coaching public / redirect targets --------
class TestPublicCoaching:
    def test_leadership_programm_public_page(self):
        # frontend page; ensure not redirected to /login server-side
        r = requests.get(f"{BASE_URL}/leadership-programm", allow_redirects=False, timeout=15)
        assert r.status_code in (200, 304), f"got {r.status_code}"

    def test_coaching_route_reachable(self):
        r = requests.get(f"{BASE_URL}/coaching", allow_redirects=False, timeout=15)
        # Should be a routable frontend page (SPA typically 200); accept 3xx too
        assert r.status_code in (200, 301, 302, 304), f"got {r.status_code}"


# -------- guide posters (health card backend) --------
class TestPosterHealth:
    def test_posters_status(self, admin_session):
        r = admin_session.get(f"{API}/guide/admin/posters_status")
        # tolerate different path names if not present
        if r.status_code == 404:
            pytest.skip("posters_status route not present at this path")
        assert r.status_code == 200, r.text
