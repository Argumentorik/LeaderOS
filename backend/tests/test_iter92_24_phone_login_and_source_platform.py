"""Iter 92.24 — Phone-OR-Email Login + source_platform attribution.

Covers (Mert):
  - Register on /api/auth/register tags `source_platform` correctly based on
    Origin header (leadercheck.de → 'leader-check', leader-os.de → 'leader-os')
  - User can register WITH phone and login via EITHER email OR phone (+
    full spaces/dashes/parens form, and digit-only form, all normalize)
  - User can register WITHOUT phone (legacy path)
  - Duplicate phone is rejected at registration (400)
  - Login is enumeration-safe: wrong password ALWAYS returns 401 with the
    generic "Invalid credentials" — same shape for email and phone path
  - Backwards-compat: legacy {email, password} payload still works on /login

Each test creates fresh users with timestamped emails to avoid collisions.
"""
import os
import time
import random
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")


def _uniq() -> str:
    """Unique numeric+lowercase suffix for emails (digits-only for phone tests)."""
    return f"{int(time.time())}{random.randint(1000, 9999)}"


def _register(email, password, name, phone=None, origin=None):
    headers = {"Content-Type": "application/json"}
    if origin:
        headers["Origin"] = origin
    payload = {"email": email, "password": password, "name": name}
    if phone is not None:
        payload["phone"] = phone
    return requests.post(f"{BASE_URL}/api/auth/register", json=payload, headers=headers, timeout=20)


def _login(identifier=None, password="test123", legacy_email=None):
    """Send login. If `legacy_email` is set, posts {email,password} for backwards-compat."""
    if legacy_email is not None:
        payload = {"email": legacy_email, "password": password}
    else:
        payload = {"identifier": identifier, "password": password}
    return requests.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=20)


# ──────────────────────────────────────────────────────────────────────────────
# source_platform attribution
# ──────────────────────────────────────────────────────────────────────────────

def test_register_from_leadercheck_origin_tags_leader_check():
    u = _uniq()
    r = _register(f"sp_lc_{u}@test.com", "test123", "LC User",
                  origin="https://leadercheck.de")
    assert r.status_code == 200, r.text
    user = r.json()["user"]
    assert user["source_platform"] == "leader-check"


def test_register_from_leader_os_origin_tags_leader_os():
    u = _uniq()
    r = _register(f"sp_lo_{u}@test.com", "test123", "LO User",
                  origin="https://leader-os.de")
    assert r.status_code == 200, r.text
    user = r.json()["user"]
    assert user["source_platform"] == "leader-os"


def test_register_without_origin_defaults_to_leader_os():
    u = _uniq()
    r = _register(f"sp_default_{u}@test.com", "test123", "Default User")
    assert r.status_code == 200, r.text
    assert r.json()["user"]["source_platform"] == "leader-os"


# ──────────────────────────────────────────────────────────────────────────────
# Phone-OR-Email login
# ──────────────────────────────────────────────────────────────────────────────

def test_register_and_login_via_email_and_phone():
    u = _uniq()
    email = f"phlogin_{u}@test.com"
    phone = f"+49 170 88{u[-4:]}"  # 4 unique digits in phone

    # Register with phone
    r = _register(email, "test123", "Phone Tester", phone=phone)
    assert r.status_code == 200, r.text

    # Login via email (identifier field)
    r1 = _login(identifier=email, password="test123")
    assert r1.status_code == 200, r1.text
    assert r1.json()["user"]["email"] == email

    # Login via phone — original spaced format
    r2 = _login(identifier=phone, password="test123")
    assert r2.status_code == 200, r2.text
    assert r2.json()["user"]["email"] == email

    # Login via phone — digits-only normalized form should also match
    digits_only = "".join(c for c in phone if c.isdigit() or c == "+")
    r3 = _login(identifier=digits_only, password="test123")
    assert r3.status_code == 200, r3.text
    assert r3.json()["user"]["email"] == email


def test_register_without_phone_still_works():
    u = _uniq()
    email = f"nophone_{u}@test.com"
    r = _register(email, "test123", "No Phone User")
    assert r.status_code == 200, r.text
    user = r.json()["user"]
    assert user["phone"] in (None, "")  # absent or null
    # Login still works via email
    r2 = _login(identifier=email, password="test123")
    assert r2.status_code == 200


def test_login_legacy_email_payload_still_works():
    """Old frontend builds POST {email, password} — must not break."""
    u = _uniq()
    email = f"legacy_{u}@test.com"
    r = _register(email, "test123", "Legacy User")
    assert r.status_code == 200, r.text
    # Use the LEGACY shape — {email, password}, no `identifier`
    r2 = _login(legacy_email=email, password="test123")
    assert r2.status_code == 200, r2.text
    assert r2.json()["user"]["email"] == email


def test_duplicate_phone_rejected_at_registration():
    u = _uniq()
    phone = f"+49 171 9{u[-5:]}"
    email_a = f"duplicate_a_{u}@test.com"
    email_b = f"duplicate_b_{u}@test.com"

    r1 = _register(email_a, "test123", "User A", phone=phone)
    assert r1.status_code == 200, r1.text

    r2 = _register(email_b, "test123", "User B", phone=phone)
    assert r2.status_code == 400, r2.text
    assert "Telefonnummer" in r2.json().get("detail", "")


def test_wrong_password_returns_generic_401_for_both_paths():
    """Enumeration-safe: same response shape for email-not-found vs phone-not-found
    vs wrong-password."""
    u = _uniq()
    email = f"enum_{u}@test.com"
    phone = f"+49 172 7{u[-5:]}"
    _register(email, "test123", "Enum User", phone=phone)

    # Wrong password on EXISTING email
    r1 = _login(identifier=email, password="wrong-password")
    assert r1.status_code == 401
    assert r1.json().get("detail") == "Invalid credentials"

    # Wrong password on EXISTING phone
    r2 = _login(identifier=phone, password="wrong-password")
    assert r2.status_code == 401
    assert r2.json().get("detail") == "Invalid credentials"

    # NON-EXISTING email → same shape
    r3 = _login(identifier=f"never_existed_{u}@nowhere.test", password="x")
    assert r3.status_code == 401
    assert r3.json().get("detail") == "Invalid credentials"

    # NON-EXISTING phone → same shape
    r4 = _login(identifier=f"+49 999 0{u[-5:]}", password="x")
    assert r4.status_code == 401
    assert r4.json().get("detail") == "Invalid credentials"


def test_login_without_identifier_is_422():
    """Empty payload should fail Pydantic validation, not crash."""
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"password": "test123"}, timeout=20)
    assert r.status_code == 422, r.text
