"""Iter 103 — Godmode onboarding & speed QA."""
import os
import time
import uuid
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://command-center-229.preview.emergentagent.com").rstrip("/")

@pytest.fixture(scope="module")
def s():
    return requests.Session()

@pytest.fixture(scope="module")
def new_user(s):
    email = f"onboarding-test-{int(time.time())}-{uuid.uuid4().hex[:6]}@test.com"
    pw = "Onboard2026x"
    phone = f"+4915{int(time.time())%10000000:07d}"
    r = s.post(f"{BASE}/api/auth/register", json={"email": email, "password": pw, "name": "Onboarding Tester", "phone": phone})
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    user = data.get("user") or {}
    assert token, f"no token: {data}"
    return {"email": email, "pw": pw, "token": token, "user": user}

def test_new_user_onboarding_completed_false(new_user):
    """New user must have onboarding_completed falsy so postLoginRoute → /onboarding."""
    u = new_user["user"]
    assert not u.get("onboarding_completed"), f"expected falsy, got {u.get('onboarding_completed')}"

def test_auth_me_reflects_onboarding_false(s, new_user):
    r = s.get(f"{BASE}/api/auth/me", headers={"Authorization": f"Bearer {new_user['token']}"})
    assert r.status_code == 200
    assert not r.json().get("onboarding_completed")

def test_wladhub_onboarding_sets_flag(s, new_user):
    r = s.post(f"{BASE}/api/wladhub/onboarding",
               headers={"Authorization": f"Bearer {new_user['token']}"},
               json={"role": "team-lead", "primary_goal": "delegation", "heard_from": "youtube"})
    assert r.status_code in (200, 201), f"{r.status_code} {r.text}"
    me = s.get(f"{BASE}/api/auth/me", headers={"Authorization": f"Bearer {new_user['token']}"}).json()
    assert me.get("onboarding_completed") is True, f"flag not set: {me}"

def test_re_login_same_user_has_flag(s, new_user):
    r = s.post(f"{BASE}/api/auth/login", json={"email": new_user["email"], "password": new_user["pw"]})
    assert r.status_code == 200, r.text
    u = r.json().get("user", {})
    assert u.get("onboarding_completed") is True

def test_admin_login_flag(s):
    r = s.post(f"{BASE}/api/auth/login", json={"email": "test@test.com", "password": "test123"})
    if r.status_code == 429:
        pytest.skip("rate limited")
    assert r.status_code == 200, r.text
    u = r.json().get("user", {})
    print(f"admin onboarding_completed={u.get('onboarding_completed')}")

def test_chat_speed(s, new_user):
    """Chat RAG must respond under ~10s."""
    tok = new_user["token"]
    r = s.post(f"{BASE}/api/chat/sessions", headers={"Authorization": f"Bearer {tok}"}, json={"title": "speed"})
    assert r.status_code in (200, 201), r.text
    sess_id = r.json().get("id") or r.json().get("session_id") or r.json().get("_id")
    assert sess_id, r.json()
    start = time.time()
    r = s.post(f"{BASE}/api/chat",
               headers={"Authorization": f"Bearer {tok}"},
               json={"session_id": sess_id, "message": "Wie delegiere ich besser?"},
               timeout=60)
    elapsed = time.time() - start
    print(f"\n[CHAT SPEED] elapsed={elapsed:.2f}s status={r.status_code}")
    assert r.status_code == 200, r.text
    body = r.json()
    ans = (body.get("response") or body.get("message") or body.get("answer") or "")
    if isinstance(ans, dict):
        ans = ans.get("text") or ans.get("content", "")
    assert len(str(ans)) > 60, f"answer too short: {body}"
    assert elapsed < 15, f"too slow: {elapsed:.2f}s"

def test_stripe_mode(s):
    r = s.get(f"{BASE}/api/payments/stripe-mode")
    assert r.status_code == 200, r.text
    body = r.json()
    print(f"stripe-mode: {body}")
    assert body.get("configured") is True

def test_stripe_packages(s):
    r = s.get(f"{BASE}/api/payments/packages")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, (list, dict))
    if isinstance(body, dict):
        pkgs = body.get("packages") or body.get("items") or []
    else:
        pkgs = body
    assert len(pkgs) >= 1, body
