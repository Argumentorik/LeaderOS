"""Iter 173: E2E API tests for journey + bootstrap + magic-link."""
import os
import time
import uuid

import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # fallback to frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")
                break

ORIGIN = BASE


@pytest.fixture(scope="module")
def std_session():
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login", json={"identifier": "standard@wladbot.test", "password": "test123"}, timeout=15)
    assert r.status_code == 200, r.text
    token = r.json().get("token") or r.json().get("access_token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def test_journey_unauth_401():
    r = requests.get(f"{BASE}/api/journey", timeout=15)
    assert r.status_code in (401, 403), r.status_code


def test_journey_shape(std_session):
    r = std_session.get(f"{BASE}/api/journey", timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["focus"] in {"boardroom_rhetorik", "strategisches_eq", "ki_kompetenz"}
    assert j["source"] in {"leader-check", "onboarding", "default"}
    assert len(j["week"]) == 7
    for step in j["week"]:
        for k in ("day", "title", "task", "path", "cta", "minutes", "done", "today"):
            assert k in step, f"missing {k}"
    todays = [s for s in j["week"] if s["today"]]
    if not j.get("week_done"):
        assert len(todays) == 1


def test_bootstrap_has_journey(std_session):
    r = std_session.get(f"{BASE}/api/dashboard/bootstrap?fresh=1", timeout=20)
    assert r.status_code == 200, r.text
    b = r.json()
    for k in ("journey", "dashboard", "referral", "guide_clips", "folders"):
        assert k in b, f"missing key {k} in bootstrap"
    assert "focus" in b["journey"]


def test_journey_complete_flow():
    # Use throwaway account
    email = f"iter173_{uuid.uuid4().hex[:8]}@wladbot-testing.de"
    pw = "Test1234x"
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/register", json={"email": email, "password": pw, "name": "Tester", "phone": f"+4915{uuid.uuid4().int % 100000000:08d}"}, timeout=20)
    if r.status_code not in (200, 201):
        pytest.skip(f"register failed: {r.status_code} {r.text[:200]}")
    token = r.json().get("token") or r.json().get("access_token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})

    # Invalid day
    r_bad = s.post(f"{BASE}/api/journey/complete/9", timeout=15)
    assert r_bad.status_code == 400, r_bad.status_code

    j0 = s.get(f"{BASE}/api/journey", timeout=15).json()
    today_day = j0["today"]["day"]
    r_c = s.post(f"{BASE}/api/journey/complete/{today_day}", timeout=15)
    assert r_c.status_code in (200, 204), r_c.text
    j1 = s.get(f"{BASE}/api/journey", timeout=15).json()
    done_days = [s2["day"] for s2 in j1["week"] if s2["done"]]
    assert today_day in done_days
    if not j1.get("week_done"):
        assert j1["today"]["day"] != today_day


def test_magic_link_generic_ok():
    r = requests.post(
        f"{BASE}/api/auth/magic-link/request",
        json={"email": "standard@wladbot.test"},
        headers={"Origin": ORIGIN},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    # Generic message; do not leak existence
    assert isinstance(body, dict)
