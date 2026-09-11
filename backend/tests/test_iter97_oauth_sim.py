"""Iteration 97: Google OAuth sanitizer + providers + sim/chat regression."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://command-center-229.preview.emergentagent.com"
EXPECTED_GOOGLE_CID = "482961656741-v4s56r8fe4figdjfukhhpbv53rn2f3ff.apps.googleusercontent.com"
TEST_EMAIL = os.environ.get("E2E_TEST_EMAIL", "test@test.com")
TEST_PASSWORD = os.environ.get("E2E_TEST_PASSWORD", "test123")  # noqa: S105 — preview fixture, overridable via env


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def token(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


# ─── OAuth ─────────────────────────────────────────────
def test_providers_endpoint(s):
    r = s.get(f"{BASE_URL}/api/auth/providers")
    assert r.status_code == 200
    data = r.json()
    assert data["providers"]["google"] is True
    assert data["google_client_id"] == EXPECTED_GOOGLE_CID, f"Got: {data['google_client_id']!r}"


def test_google_callback_invalid_returns_401(s):
    r = s.post(f"{BASE_URL}/api/auth/google/callback", json={"credential": "invalid.jwt.token"})
    assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"
    body = r.json()
    assert "detail" in body


def test_google_callback_missing_credential(s):
    r = s.post(f"{BASE_URL}/api/auth/google/callback", json={})
    assert r.status_code in (400, 422)


# ─── Auth regression ─────────────────────────────────────
def test_login_regression(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    assert r.status_code == 200
    assert "token" in r.json()


def test_auth_me(s, token):
    r = s.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json().get("email") == TEST_EMAIL


def test_magic_link_request(s):
    r = s.post(f"{BASE_URL}/api/auth/magic-link/request", json={"email": TEST_EMAIL})
    assert r.status_code == 200


# ─── Chat regression ─────────────────────────────────────
def test_chat_endpoint(s, token):
    r = s.post(
        f"{BASE_URL}/api/chat",
        json={"message": "Kurzer Test."},
        headers={"Authorization": f"Bearer {token}"},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    resp = data.get("response") or data
    assert "text" in resp
    assert "follow_up_questions" in resp
    assert isinstance(resp["follow_up_questions"], list)


# ─── Simulations ─────────────────────────────────────────
def test_simulations_scenarios(s, token):
    r = s.get(f"{BASE_URL}/api/simulations/scenarios", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    # Could be list or dict with 'scenarios'
    scenarios = data if isinstance(data, list) else data.get("scenarios", [])
    assert len(scenarios) > 0
    return scenarios


def test_simulation_start_and_message(s, token):
    hdr = {"Authorization": f"Bearer {token}"}
    r = s.get(f"{BASE_URL}/api/simulations/scenarios", headers=hdr)
    assert r.status_code == 200
    data = r.json()
    scenarios = data if isinstance(data, list) else data.get("scenarios", [])
    scenario_id = scenarios[0].get("id") or scenarios[0].get("scenario_id")
    assert scenario_id

    r = s.post(f"{BASE_URL}/api/simulations", json={"scenario": scenario_id}, headers=hdr, timeout=60)
    assert r.status_code in (200, 201), r.text
    sim = r.json()
    sim_id = sim.get("id") or sim.get("simulation_id") or sim.get("_id")
    assert sim_id, f"No sim id: {sim}"

    r = s.post(
        f"{BASE_URL}/api/simulations/{sim_id}/message",
        json={"message": "Ich verstehe. Kannst du mir mehr Details geben?"},
        headers=hdr,
        timeout=90,
    )
    assert r.status_code == 200, r.text
