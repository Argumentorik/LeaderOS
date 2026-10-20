"""Iter 92.36 — Regression tests for auth flows (email, phone, magic-link, providers).
Focus: ensure existing login paths still work after diagnostic-log + origin-mismatch
fallback changes in OAuthButtons.js.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
    open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0].strip()


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ── Providers endpoint (used by LoginPage to render Google button) ──────────
def test_providers_endpoint(s):
    r = s.get(f"{BASE_URL}/api/auth/providers", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "providers" in data, data
    assert data["providers"].get("google") is True, data
    assert data.get("google_client_id"), "google_client_id must be present so frontend can init GSI"
    assert ".apps.googleusercontent.com" in data["google_client_id"]


# ── Email + Password login (legacy canonical) ───────────────────────────────
def test_email_password_login(s):
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": "test@test.com", "password": "test123"}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("token"), data
    assert data.get("user", {}).get("email") == "test@test.com"


# ── Identifier (email) login — new dual-identifier shape Iter 92.24 ─────────
def test_identifier_email_login(s):
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"identifier": "test@test.com", "password": "test123"}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("token")


# ── Identifier (phone) login — seeded user (if any phone-seeded user exists) ─
def test_identifier_phone_login_shape(s):
    """Confirm endpoint accepts phone identifier shape without 500.
    The seeded test admin has no phone, so 401 is expected; we just ensure
    backend handles phone-shaped identifier gracefully (no 500)."""
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"identifier": "+491234567890", "password": "test123"}, timeout=15)
    assert r.status_code in (200, 401, 404), r.text
    assert r.status_code != 500, "Phone-shaped identifier must not 500"


# ── Magic-link request ──────────────────────────────────────────────────────
def test_magic_link_request(s):
    r = s.post(f"{BASE_URL}/api/auth/magic-link/request",
               json={"email": "test@test.com"}, timeout=20)
    assert r.status_code == 200, r.text


# ── Bad creds → 401, not 500 ────────────────────────────────────────────────
def test_bad_creds_returns_401(s):
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": "test@test.com", "password": "wrong-pw-xyz"}, timeout=15)
    assert r.status_code in (401, 403), r.text
