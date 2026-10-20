"""Iter 150 verification (Testing-Agent): Auth-/Security-/Credits-Regression.

Auth-Routen: 20 req/min/IP -> _Retry wartet bei 429.
"""
import base64
import json
import os
import re
import time
import uuid

import pytest
import requests as _requests


class _Retry:
    def __getattr__(self, name):
        fn = getattr(_requests, name)

        def call(*a, **kw):
            r = None
            for _ in range(6):
                r = fn(*a, **kw)
                if r.status_code != 429:
                    return r
                time.sleep(int(r.headers.get("Retry-After", "20")) + 1)
            return r
        return call


requests = _Retry()

API = (os.environ.get("REACT_APP_BACKEND_URL")
       or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]).rstrip("/")
PW = "Sicher1234x"
SHARED = [("free@wladbot.test", "test123"), ("test@test.com", "test123")]


def _jwt_payload(token):
    part = token.split(".")[1]
    part += "=" * (-len(part) % 4)
    return json.loads(base64.urlsafe_b64decode(part))


# ---------- Login / me regression for shared accounts ----------
@pytest.mark.parametrize("email,pw", SHARED)
def test_login_returns_token_cookie_and_tv(email, pw):
    r = requests.post(f"{API}/api/auth/login", json={"email": email, "password": pw}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data.get("token"), str) and len(data["token"]) > 20
    assert data["user"]["email"] == email
    # httpOnly session cookie set
    assert any(c.name for c in r.cookies), f"no cookie set: {r.cookies.get_dict()}"
    payload = _jwt_payload(data["token"])
    assert "tv" in payload, f"JWT payload missing token_version: {payload}"
    assert isinstance(payload["tv"], int)
    assert "user_id" in payload and "exp" in payload

    # Bearer works
    b = requests.get(f"{API}/api/auth/me", headers={"Authorization": f"Bearer {data['token']}"}, timeout=30)
    assert b.status_code == 200, b.text
    assert b.json()["email"] == email
    # Cookie works
    c = requests.get(f"{API}/api/auth/me", cookies=r.cookies, timeout=30)
    assert c.status_code == 200, c.text
    assert c.json()["email"] == email


def test_jwt_lifetime_is_7_days():
    r = requests.post(f"{API}/api/auth/login", json={"email": SHARED[0][0], "password": SHARED[0][1]}, timeout=30)
    assert r.status_code == 200
    p = _jwt_payload(r.json()["token"])
    days = (p["exp"] - time.time()) / 86400
    assert 6.5 < days < 7.5, f"unexpected JWT lifetime: {days:.2f} days"


def test_login_wrong_password_401():
    r = requests.post(f"{API}/api/auth/login", json={"email": SHARED[0][0], "password": "definitelywrong"}, timeout=30)
    assert r.status_code in (401, 403, 429), r.text


# ---------- Security endpoints require auth ----------
@pytest.mark.parametrize("path", ["security/overview", "security/acknowledge", "security/not-me",
                                  "security/revoke-other-sessions"])
def test_security_endpoints_unauthenticated_401(path):
    method = requests.get if path.endswith("overview") else requests.post
    r = method(f"{API}/api/auth/{path}", timeout=30)
    assert r.status_code == 401, (path, r.status_code, r.text[:200])


# ---------- Fresh user: register policy, overview schema, credits ----------
@pytest.fixture(scope="module")
def fresh_user():
    email = f"sec150v_{uuid.uuid4().hex[:8]}@wladbot.test"
    phone = "+4917" + "".join(str((ord(c) % 10)) for c in uuid.uuid4().hex[:9])
    r = requests.post(f"{API}/api/auth/register",
                      json={"email": email, "password": PW, "name": "Verify Test", "phone": phone}, timeout=40)
    if r.status_code != 200:
        pytest.fail(f"register failed {r.status_code}: {r.text[:300]}")
    yield {"email": email, "token": r.json()["token"], "cookies": r.cookies}
    # cleanup (sync client -> no event-loop conflicts)
    from dotenv import dotenv_values
    from pymongo import MongoClient
    env = dotenv_values("/app/backend/.env")
    client = MongoClient(env["MONGO_URL"])
    client[env["DB_NAME"]].users.delete_many({"email": re.compile(r"^sec150v_.*@wladbot\.test$")})
    client.close()


@pytest.mark.parametrize("weak", ["abcdefgh", "12345678", "kurz1"])
def test_register_rejects_weak_password(weak):
    email = f"sec150v_weak_{uuid.uuid4().hex[:6]}@wladbot.test"
    phone = "+4917" + "".join(str((ord(c) % 10)) for c in uuid.uuid4().hex[:9])
    r = requests.post(f"{API}/api/auth/register",
                      json={"email": email, "password": weak, "name": "Weak", "phone": phone}, timeout=40)
    # 400 = policy check, 422 = Pydantic min-length validator — both reject
    assert r.status_code in (400, 422), (weak, r.status_code, r.text[:200])


def test_security_overview_schema(fresh_user):
    r = requests.get(f"{API}/api/auth/security/overview", cookies=fresh_user["cookies"], timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    for key in ("login_history", "sessions", "new_devices", "signup"):
        assert key in d, f"missing key {key} in {list(d)}"
    assert isinstance(d["new_devices"], list)
    assert isinstance(d["login_history"], list)
    assert isinstance(d["sessions"], list)
    assert "_id" not in json.dumps(d)


def test_acknowledge_returns_timestamp(fresh_user):
    r = requests.post(f"{API}/api/auth/security/acknowledge", cookies=fresh_user["cookies"], timeout=30)
    assert r.status_code == 200, r.text
    assert r.json().get("acknowledged_at")


def test_password_change_wrong_current_rejected(fresh_user):
    r = requests.post(f"{API}/api/auth/password/change", cookies=fresh_user["cookies"],
                      json={"current_password": "falschesPw1", "new_password": "NeuesPw2024z"}, timeout=30)
    assert r.status_code in (400, 401, 403), r.text
    # cookie session must remain valid
    assert requests.get(f"{API}/api/auth/me", cookies=fresh_user["cookies"], timeout=30).status_code == 200


def test_not_me_revokes_tokens_keeps_cookie(fresh_user):
    bearer = fresh_user["token"]
    assert requests.get(f"{API}/api/auth/me", headers={"Authorization": f"Bearer {bearer}"}, timeout=30).status_code == 200
    r = requests.post(f"{API}/api/auth/security/not-me", cookies=fresh_user["cookies"], timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("next") == "change_password"
    assert d.get("has_password") is True
    assert isinstance(d.get("revoked"), int)
    assert requests.get(f"{API}/api/auth/me", headers={"Authorization": f"Bearer {bearer}"}, timeout=30).status_code == 401
    assert requests.get(f"{API}/api/auth/me", cookies=fresh_user["cookies"], timeout=30).status_code == 200


# ---------- Credits ----------
def test_free_user_credits_endpoint():
    lg = requests.post(f"{API}/api/auth/login", json={"email": "free@wladbot.test", "password": "test123"}, timeout=30)
    assert lg.status_code == 200, lg.text
    token = lg.json()["token"]
    r = requests.get(f"{API}/api/credits", headers={"Authorization": f"Bearer {token}"}, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    for key in ("balance", "is_premium", "total_used", "limit"):
        assert key in d, f"missing {key} in {list(d)}"
    assert isinstance(d["balance"], int) and d["balance"] >= 0
    assert d["limit"] in (50, 250, -1)


def test_credits_reset_requires_admin():
    lg = requests.post(f"{API}/api/auth/login", json={"email": "free@wladbot.test", "password": "test123"}, timeout=30)
    token = lg.json()["token"]
    r = requests.post(f"{API}/api/credits/reset", headers={"Authorization": f"Bearer {token}"}, timeout=30)
    assert r.status_code in (401, 403), r.text
