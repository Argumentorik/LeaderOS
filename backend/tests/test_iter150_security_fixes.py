"""Iter 150: SEC-001 Token-Widerruf, atomarer Credit-Abzug, Passwort-Regel, Neues-Gerät-Warnung."""
import asyncio
import os
from datetime import datetime, timezone, timedelta
import sys
import uuid

import time

import pytest
import requests as _requests


class _Retry:
    """Auth-Routen sind auf 20 Anfragen/Minute pro IP limitiert -> bei 429 warten und wiederholen."""

    def __getattr__(self, name):
        fn = getattr(_requests, name)

        def call(*a, **kw):
            for _ in range(6):
                r = fn(*a, **kw)
                if r.status_code != 429:
                    return r
                time.sleep(int(r.headers.get("Retry-After", "20")) + 1)
            return r
        return call


requests = _Retry()

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

API = os.environ.get("API_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]
PW = "Sicher1234x"


_LOOP = asyncio.new_event_loop()
asyncio.set_event_loop(_LOOP)
from dotenv import load_dotenv  # noqa: E402
load_dotenv("/app/backend/.env")
from config import db  # noqa: E402


def _run(coro):
    return _LOOP.run_until_complete(coro)


def _register():
    email = f"sec150_{uuid.uuid4().hex[:8]}@wladbot.test"
    r = requests.post(f"{API}/api/auth/register", json={"email": email, "password": PW, "name": "Sec Test", "phone": "+4917" + uuid.uuid4().hex[:9].translate(str.maketrans("abcdef","123456"))}, timeout=30)
    assert r.status_code == 200, r.text
    return email, r.json()["token"], r.cookies


def _me(token):
    return requests.get(f"{API}/api/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=30).status_code


def _login(email, pw=PW):
    r = requests.post(f"{API}/api/auth/login", json={"email": email, "password": pw}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"], r.cookies


def test_password_change_revokes_old_tokens():
    email, t1, _ = _register()
    t2, cookies = _login(email)
    assert _me(t1) == 200 and _me(t2) == 200
    r = requests.post(f"{API}/api/auth/password/change", cookies=cookies,
                      json={"current_password": PW, "new_password": "NeuesPw2024z"}, timeout=30)
    assert r.status_code == 200, r.text
    assert _me(t1) == 401 and _me(t2) == 401
    t3, _ = _login(email, "NeuesPw2024z")
    assert _me(t3) == 200


def test_logout_revokes_tokens_but_not_other_cookie_session():
    email, t1, _ = _register()
    t2, cookies_other = _login(email)
    assert requests.get(f"{API}/api/auth/me", cookies=cookies_other, timeout=30).status_code == 200
    r = requests.post(f"{API}/api/auth/logout", headers={"Authorization": f"Bearer {t1}"}, timeout=30)
    assert r.status_code == 200
    assert _me(t1) == 401 and _me(t2) == 401
    # Cookie-Session eines anderen Browsers bleibt bestehen
    assert requests.get(f"{API}/api/auth/me", cookies=cookies_other, timeout=30).status_code == 200


def test_revoke_other_sessions_kills_tokens_keeps_current_cookie():
    email, t1, _ = _register()
    _, cookies = _login(email)
    r = requests.post(f"{API}/api/auth/security/revoke-other-sessions", cookies=cookies, timeout=30)
    assert r.status_code == 200
    assert _me(t1) == 401
    assert requests.get(f"{API}/api/auth/me", cookies=cookies, timeout=30).status_code == 200


def test_legacy_token_without_tv_still_valid():
    import jwt
    from services import JWT_SECRET
    email, _, _ = _register()
    uid = requests.post(f"{API}/api/auth/login", json={"email": email, "password": PW}, timeout=30).json()["user"]["user_id"]
    legacy = jwt.encode({"user_id": uid, "exp": datetime.now(timezone.utc) + timedelta(days=1)}, JWT_SECRET, algorithm="HS256")
    assert _me(legacy) == 200


def test_password_policy_on_change():
    email, _, cookies = _register()
    for bad in ("kurz1", "nurbuchstaben", "12345678"):
        r = requests.post(f"{API}/api/auth/password/change", cookies=cookies,
                          json={"current_password": PW, "new_password": bad}, timeout=30)
        assert r.status_code == 400, (bad, r.text)


def test_new_device_alert_ack_and_not_me():

    email, t1, cookies = _register()
    uid = requests.get(f"{API}/api/auth/me", cookies=cookies, timeout=30).json()["user_id"]
    foreign = {"ip": "203.0.113.9", "at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(), "method": "email", "browser": "Firefox",
               "os": "Windows", "device_type": "desktop", "city": "Lagos", "country_code": "NG", "fingerprint": "ff-foreign"}
    _run(db.users.update_one({"user_id": uid}, {"$push": {"login_history": foreign}}))

    ov = requests.get(f"{API}/api/auth/security/overview", cookies=cookies, timeout=30).json()
    assert [d["fingerprint"] for d in ov["new_devices"]] == ["ff-foreign"]
    assert ov["new_devices"][0]["city"] == "Lagos"

    r = requests.post(f"{API}/api/auth/security/not-me", cookies=cookies, timeout=30)
    assert r.status_code == 200 and r.json()["next"] == "change_password" and r.json()["has_password"] is True
    assert _me(t1) == 401
    assert requests.get(f"{API}/api/auth/me", cookies=cookies, timeout=30).status_code == 200
    ov2 = requests.get(f"{API}/api/auth/security/overview", cookies=cookies, timeout=30).json()
    assert ov2["new_devices"] == []

    # acknowledge blendet ebenfalls aus
    foreign2 = {**foreign, "fingerprint": "ff-foreign-2", "at": datetime.now(timezone.utc).isoformat()}
    _run(db.users.update_one({"user_id": uid}, {"$push": {"login_history": foreign2}}))
    assert len(requests.get(f"{API}/api/auth/security/overview", cookies=cookies, timeout=30).json()["new_devices"]) == 1
    assert requests.post(f"{API}/api/auth/security/acknowledge", cookies=cookies, timeout=30).status_code == 200
    assert requests.get(f"{API}/api/auth/security/overview", cookies=cookies, timeout=30).json()["new_devices"] == []
    _run(db.users.delete_one({"user_id": uid}))


def test_credit_deduct_is_atomic():
    from routes.credits import check_and_deduct_credit

    uid = f"__credit_race_{uuid.uuid4().hex[:6]}"

    async def run():
        await db.users.insert_one({"user_id": uid, "email": f"{uid}@x.test", "premium": False})
        await db.credits.insert_one({"user_id": uid, "balance": 5, "total_used": 0, "history": []})
        try:
            results = await asyncio.gather(*[check_and_deduct_credit({"user_id": uid, "premium": False}, "chat") for _ in range(25)])
            doc = await db.credits.find_one({"user_id": uid}, {"_id": 0})
            return results, doc
        finally:
            await db.credits.delete_one({"user_id": uid})
            await db.users.delete_one({"user_id": uid})

    results, doc = _run(run())
    assert sum(1 for r in results if r["allowed"]) == 5
    assert doc["balance"] == 0 and doc["total_used"] == 5
    assert all(r["remaining"] >= 0 for r in results)


def _cleanup_module():
    import re
    _run(db.users.delete_many({"email": re.compile(r"^sec150_.*@wladbot\.test$")}))


@pytest.fixture(scope="module", autouse=True)
def _cleanup():
    yield
    _cleanup_module()
