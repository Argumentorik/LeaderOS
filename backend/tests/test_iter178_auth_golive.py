"""Iter 178 — Go-Live-Check Login/Registrierung (E2E gegen Preview-URL).

Hinweis: `/api/auth/register` hat einen Abuse-Guard (15 Signups pro IP/Stunde).
Alle Tests laufen aus demselben Container → gemeinsame Egress-IP. Die Fixture
`_clear_signup_guard` räumt deshalb vor dem Lauf die Test-Signups derselben IP
aus der letzten Stunde weg und hält die Anzahl der Registrierungen klein.
"""
import os
import re
import secrets
import asyncio
from datetime import datetime, timedelta, timezone

import httpx
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE}/api"
PW = "GoLive2026x!"
TEST_DOMAIN = "@wladbot-testing.de"


def _client():
    return httpx.Client(timeout=45.0, follow_redirects=False)


def _new_email():
    return f"iter178_{secrets.token_hex(4)}{TEST_DOMAIN}"


def _random_phone(prefix: str = "15") -> str:
    return f"+49{prefix}{secrets.randbelow(90000000) + 10000000}"


def _register(client: httpx.Client, email: str, **extra) -> httpx.Response:
    """Registrierung — `phone` ist seit Iter 92.34 PFLICHT (Mert Go-Live-Checkliste §10)."""
    payload = {"name": "Iter178 QA", "email": email, "password": PW, "phone": _random_phone()}
    payload.update(extra)
    return client.post(f"{API}/auth/register", json=payload)


@pytest.fixture(scope="module", autouse=True)
def _clear_signup_guard():
    """Alte Test-Signups derselben IP entfernen, damit der 15/h-Guard nicht greift."""
    async def clean():
        from motor.motor_asyncio import AsyncIOMotorClient
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
        db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
        cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
        await db.users.delete_many({
            "email": {"$regex": r"^(iter178_|obt|onb-)"},
            "created_at_dt": {"$gte": cutoff},
        })
    asyncio.run(clean())
    yield


@pytest.fixture(scope="module")
def account():
    """Ein registriertes Konto mit aktiver Cookie-Session (wird mehrfach genutzt)."""
    email = _new_email()
    c = _client()
    r = _register(c, email)
    assert r.status_code == 200, r.text
    yield {"email": email, "client": c, "payload": r.json()}
    c.close()


# ── Provider-Discovery ────────────────────────────────────────────────────

def test_providers_endpoint_public():
    with _client() as c:
        r = c.get(f"{API}/auth/providers")
    assert r.status_code == 200, r.text
    assert isinstance(r.json()["providers"], dict)


# ── Registrierung ─────────────────────────────────────────────────────────

def test_register_returns_safe_user_and_cookie(account):
    data = account["payload"]
    assert data["token"]
    assert data["user"]["email"] == account["email"]
    assert "password_hash" not in data["user"]
    assert not data["user"].get("onboarding_completed")  # → Frontend leitet auf /onboarding
    assert account["client"].cookies.get("session_token")


def test_register_weak_password_rejected():
    with _client() as c:
        r = c.post(f"{API}/auth/register", json={"name": "A", "email": _new_email(), "password": "test123", "phone": _random_phone()})
    assert r.status_code in (400, 422), r.text


def test_register_invalid_email_rejected():
    with _client() as c:
        r = c.post(f"{API}/auth/register", json={"name": "A", "email": "keine-email", "password": PW, "phone": _random_phone()})
    assert r.status_code == 422


def test_register_without_phone_rejected():
    """Dokumentiert: Telefon ist Pflichtfeld (Frontend rendert es als required)."""
    with _client() as c:
        r = c.post(f"{API}/auth/register", json={"name": "A", "email": _new_email(), "password": PW})
    assert r.status_code == 422
    assert any(e["loc"][-1] == "phone" for e in r.json()["detail"])


def test_register_duplicate_email_rejected(account):
    with _client() as c:
        r = _register(c, account["email"])
    assert r.status_code == 400
    assert "already" in r.json()["detail"].lower() or "registr" in r.json()["detail"].lower()


# ── Session / me / refresh / logout / login ───────────────────────────────

def test_me_requires_auth():
    with _client() as c:
        r = c.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_me_refresh_and_security_overview(account):
    c = account["client"]
    me = c.get(f"{API}/auth/me")
    assert me.status_code == 200, me.text
    assert me.json()["email"] == account["email"]

    rf = c.post(f"{API}/auth/refresh")
    assert rf.status_code == 200, rf.text

    sec = c.get(f"{API}/auth/security/overview")
    assert sec.status_code == 200, sec.text
    body = sec.json()
    assert body["login_history"]
    assert any(s["is_current"] for s in body["sessions"])


def test_dashboard_and_tier_right_after_register(account):
    c = account["client"]
    r = c.get(f"{API}/dashboard/bootstrap")
    assert r.status_code == 200, r.text
    t = c.get(f"{API}/user/tier")
    assert t.status_code == 200, t.text
    assert t.json().get("tier") in ("free", "starter", "standard", "accelerator")


def test_login_after_logout_and_bearer_token(account):
    email = account["email"]
    with _client() as c:
        c.cookies.update(account["client"].cookies)
        assert c.post(f"{API}/auth/logout").status_code == 200
    with _client() as c:
        r = c.post(f"{API}/auth/login", json={"identifier": email, "password": PW})
        assert r.status_code == 200, r.text
        tok = r.json()["token"]
        me = c.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"})
        assert me.status_code == 200


def test_login_legacy_email_field_still_works(account):
    with _client() as c:
        r = c.post(f"{API}/auth/login", json={"email": account["email"], "password": PW})
    assert r.status_code == 200, r.text


def test_login_wrong_password_generic_401(account):
    with _client() as c:
        r = c.post(f"{API}/auth/login", json={"identifier": account["email"], "password": "Falsch2026x!"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid credentials"


def test_login_unknown_email_same_message():
    with _client() as c:
        r = c.post(f"{API}/auth/login", json={"identifier": _new_email(), "password": PW})
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid credentials"


def test_seeded_accounts_still_login():
    for email in ("free@wladbot.test", "standard@wladbot.test", "accelerator@wladbot.test", "test@test.com"):
        with _client() as c:
            r = c.post(f"{API}/auth/login", json={"identifier": email, "password": "test123"})
        assert r.status_code == 200, f"{email}: {r.status_code} {r.text}"


# ── Telefon-Login ─────────────────────────────────────────────────────────

def test_phone_register_login_and_duplicate():
    email = _new_email()
    phone = _random_phone("16")
    with _client() as c:
        assert _register(c, email, phone=phone).status_code == 200
    with _client() as c:
        r = c.post(f"{API}/auth/login", json={"identifier": phone, "password": PW})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["email"] == email
    with _client() as c:
        dup = _register(c, _new_email(), phone=phone)
    assert dup.status_code == 400
    assert "Telefon" in dup.json()["detail"]


# ── Magic Link ────────────────────────────────────────────────────────────

def test_magic_link_request_is_enumeration_safe(account):
    with _client() as c:
        known = c.post(f"{API}/auth/magic-link/request", json={"email": account["email"]})
        unknown = c.post(f"{API}/auth/magic-link/request", json={"email": _new_email()})
    assert known.status_code == 200, known.text
    assert unknown.status_code == 200, unknown.text
    assert known.json()["message"] == unknown.json()["message"]


def test_magic_link_verify_invalid_token():
    with _client() as c:
        r = c.post(f"{API}/auth/magic-link/verify", json={"token": "nicht-existent-" + secrets.token_hex(8)})
    assert r.status_code == 401


def test_magic_link_end_to_end_token_is_single_use():
    """Token direkt aus der DB ziehen (kein Postfach nötig) und zweimal einlösen."""
    async def issue(email):
        import sys
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
        from services_magic_link import create_token
        return await create_token(email, "127.0.0.1")

    token = asyncio.run(issue("free@wladbot.test"))
    assert token, "create_token lieferte keinen Token"
    with _client() as c:
        r = c.post(f"{API}/auth/magic-link/verify", json={"token": token})
        assert r.status_code == 200, r.text
        assert r.json()["user"]["email"] == "free@wladbot.test"
        assert c.cookies.get("session_token")
    with _client() as c:
        again = c.post(f"{API}/auth/magic-link/verify", json={"token": token})
    assert again.status_code == 401


# ── Google / OAuth ────────────────────────────────────────────────────────

def test_google_session_invalid_id_rejected():
    with _client() as c:
        assert c.post(f"{API}/auth/google-session", json={"session_id": "invalid-" + secrets.token_hex(8)}).status_code == 401
        assert c.post(f"{API}/auth/google-session", json={}).status_code == 400


def test_google_callback_invalid_credential_rejected():
    with _client() as c:
        r = c.post(f"{API}/auth/google/callback", json={"credential": "not-a-jwt"})
    assert r.status_code == 401, r.text


# ── Passwort ändern ───────────────────────────────────────────────────────

def test_password_change_flow():
    email = _new_email()
    new_pw = "GoLive2026y!"
    with _client() as c:
        assert _register(c, email).status_code == 200
        assert c.post(f"{API}/auth/password/change", json={"current_password": "falsch!", "new_password": new_pw}).status_code == 401
        r = c.post(f"{API}/auth/password/change", json={"current_password": PW, "new_password": new_pw})
        assert r.status_code == 200, r.text
    with _client() as c:
        assert c.post(f"{API}/auth/login", json={"identifier": email, "password": PW}).status_code == 401
        assert c.post(f"{API}/auth/login", json={"identifier": email, "password": new_pw}).status_code == 200


# ── Missbrauchsschutz ─────────────────────────────────────────────────────

def test_brute_force_rate_limit_kicks_in():
    email = _new_email()
    with _client() as c:
        assert _register(c, email).status_code == 200
    codes = []
    with _client() as c:
        for _ in range(12):
            codes.append(c.post(f"{API}/auth/login", json={"identifier": email, "password": "Falsch1234!"}).status_code)
    assert 429 in codes, codes
    # Nach dem Lockout darf das RICHTIGE Passwort ebenfalls blockiert sein (bewusst),
    # aber der Fehler muss sprechend sein.
    with _client() as c:
        r = c.post(f"{API}/auth/login", json={"identifier": email, "password": PW})
    assert r.status_code in (200, 429)
    if r.status_code == 429:
        assert "Passwort-Reset" in r.json()["detail"] or "warte" in r.json()["detail"].lower()


# ── Lizenz-Key ────────────────────────────────────────────────────────────

def test_license_activate_invalid_key():
    with _client() as c:
        r = c.post(f"{API}/auth/license/activate", json={
            "license_key": "XXXX-XXXX-XXXX-XXXX", "email": _new_email(), "password": PW, "name": "Lic QA"})
    assert r.status_code in (400, 401, 404), r.text


# ── Seite erreichbar ──────────────────────────────────────────────────────

def test_login_page_html_served():
    with _client() as c:
        r = c.get(f"{BASE}/login")
    assert r.status_code == 200
    assert re.search(r'<div id="root"', r.text)
