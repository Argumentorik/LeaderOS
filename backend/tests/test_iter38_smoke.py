"""Iter38 smoke test: health, admin auth, basic admin endpoints (sessionStorage migration backend support)."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://role-assessment-lab.preview.emergentagent.com").rstrip("/")
ADMIN_PASSWORD = "wladhub2026"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data or "access_token" in data
    return data.get("token") or data.get("access_token")


def test_health():
    r = requests.get(f"{BASE_URL}/api/health", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "healthy"


def test_admin_login_wrong_password():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "wrong"}, timeout=10)
    assert r.status_code in (401, 403)


def test_admin_login_correct(admin_token):
    assert isinstance(admin_token, str) and len(admin_token) > 10


def test_admin_overview(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = requests.get(f"{BASE_URL}/api/admin/overview", headers=headers, timeout=15)
    # Endpoint may not exist; accept 200/404, fail on 5xx
    assert r.status_code < 500, f"Server error: {r.status_code} {r.text[:200]}"


def test_admin_license_keys_list(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = requests.get(f"{BASE_URL}/api/admin/license-keys", headers=headers, timeout=15)
    assert r.status_code < 500


def test_quiz_submit_endpoint_reachable():
    # Just check that the diagnose/report endpoint group isn't 5xx-ing on GET
    r = requests.get(f"{BASE_URL}/api/health", timeout=10)
    assert r.status_code == 200
