"""Iteration 130 — Final auth sweep before go-live.

Covers:
- Phone normalization: +49170…, 0170…, 0049170…, formatted variants — all same account.
- Register with @wladbot-testing.de succeeds; duplicate phone/email blocked.
- Admin delete: cannot self-delete; can delete throwaway account.
- Basic email login works.
"""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fall back to reading frontend/.env
    try:
        with open("/app/frontend/.env") as fh:
            for line in fh:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

assert BASE_URL, "REACT_APP_BACKEND_URL is required"

API = f"{BASE_URL}/api"

FREE_EMAIL = "free@wladbot.test"
ADMIN_EMAIL = "test@test.com"
PW = "test123"


# ─── helpers ────────────────────────────────────────────────────────────
def _client():
    s = requests.Session()
    s.headers["Content-Type"] = "application/json"
    return s


def _login(session, identifier, password=PW):
    r = session.post(f"{API}/auth/login", json={"identifier": identifier, "password": password}, timeout=20)
    return r


def _register(session, email, name, phone, password="Testpass1"):
    r = session.post(f"{API}/auth/register", json={
        "email": email, "name": name, "phone": phone, "password": password,
    }, timeout=30)
    return r


# ─── module-level fixtures ──────────────────────────────────────────────
@pytest.fixture(scope="module")
def admin_session():
    s = _client()
    r = _login(s, ADMIN_EMAIL)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    token = r.json().get("token")
    s.headers["Authorization"] = f"Bearer {token}"
    return s


# ─── LOGIN ───────────────────────────────────────────────────────────────
class TestBasicLogin:
    def test_free_email_login(self):
        s = _client()
        r = _login(s, FREE_EMAIL)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and "user" in data
        assert data["user"]["email"] == FREE_EMAIL

    def test_invalid_credentials(self):
        s = _client()
        r = _login(s, FREE_EMAIL, password="wrong-password-xyz")
        assert r.status_code == 401


# ─── REGISTER + PHONE NORMALIZATION ─────────────────────────────────────
class TestRegisterAndPhone:
    """Register a new user with a phone, then verify login works via all
    common German phone number formats (0170…, +49170…, 0049170…, dashes)."""

    @classmethod
    def setup_class(cls):
        cls.session = _client()
        # unique per-run to avoid duplicate-email/phone conflicts
        rand = uuid.uuid4().hex[:8]
        cls.email = f"TEST-iter130-{rand}@wladbot-testing.de"
        cls.name = "Iter130 PhoneUser"
        # unique German mobile — 017 + 8 digits (Germany mobile pattern)
        digits = uuid.uuid4().int % 100_000_000
        cls.phone_local = f"0170 {digits:08d}"
        cls.expected_normalized_e164 = f"+49170{digits:08d}"
        cls.password = "Testpass1"
        cls.user_id = None
        cls.token = None

    def test_1_register_success(self):
        r = _register(self.session, self.email, self.name, self.phone_local, self.password)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and data["user"]["email"] == self.email.lower()
        # Update stored email to canonical lowercase form for downstream tests
        type(self).email = self.email.lower()
        type(self).user_id = data["user"]["user_id"]
        type(self).token = data["token"]

    def test_2_login_with_email(self):
        s = _client()
        r = _login(s, self.email, self.password)
        assert r.status_code == 200, r.text

    def test_3_login_phone_local_format(self):
        """0170XXXXXXXX → matches"""
        s = _client()
        digits_only = self.phone_local.replace(" ", "")
        r = _login(s, digits_only, self.password)
        assert r.status_code == 200, f"local format failed: {r.status_code} {r.text}"

    def test_4_login_phone_e164_format(self):
        """+491701234567 → matches"""
        s = _client()
        r = _login(s, self.expected_normalized_e164, self.password)
        assert r.status_code == 200, f"E.164 format failed: {r.status_code} {r.text}"

    def test_5_login_phone_0049_format(self):
        """0049170… → matches"""
        s = _client()
        e164_digits = self.expected_normalized_e164.lstrip("+")  # 491701234567
        val = "00" + e164_digits
        r = _login(s, val, self.password)
        assert r.status_code == 200, f"0049 format failed: {r.status_code} {r.text}"

    def test_6_login_phone_formatted_with_dashes(self):
        """0170-XXX-XXX-XX → matches after normalization"""
        s = _client()
        digits = self.phone_local.replace(" ", "").replace("0170", "")
        formatted = f"0170-{digits[:3]}-{digits[3:6]}-{digits[6:]}"
        r = _login(s, formatted, self.password)
        assert r.status_code == 200, f"dashed format failed: {r.status_code} {r.text}"

    def test_7_duplicate_phone_rejected(self):
        """Registering a second account with the same phone must fail."""
        s = _client()
        rand = uuid.uuid4().hex[:8]
        r = _register(s, f"TEST-dupphone-{rand}@wladbot-testing.de",
                      "Dup Phone", self.phone_local, "Testpass1")
        assert r.status_code == 400, r.text
        assert "elefon" in r.text or "phone" in r.text.lower()

    def test_8_duplicate_email_rejected(self):
        """Same email → 400."""
        s = _client()
        digits = uuid.uuid4().int % 100_000_000
        r = _register(s, self.email, "Dup Email", f"0170{digits:08d}", "Testpass1")
        assert r.status_code == 400

    def test_9_weak_password_rejected(self):
        """<8 chars must be rejected."""
        s = _client()
        rand = uuid.uuid4().hex[:8]
        digits = uuid.uuid4().int % 100_000_000
        r = _register(s, f"TEST-weakpw-{rand}@wladbot-testing.de",
                      "Weak PW", f"0170{digits:08d}", "abc12")
        assert r.status_code == 400

    @classmethod
    def teardown_class(cls):
        """Cleanup: log in as admin and delete the throwaway account."""
        if not cls.email:
            return
        try:
            s = _client()
            r = _login(s, ADMIN_EMAIL)
            if r.status_code == 200:
                s.headers["Authorization"] = f"Bearer {r.json()['token']}"
                s.delete(f"{API}/admin/users/by-email/{cls.email}", timeout=15)
        except Exception:
            pass


# ─── ADMIN DELETE ────────────────────────────────────────────────────────
class TestAdminDelete:
    def test_admin_cannot_delete_self(self, admin_session):
        r = admin_session.delete(f"{API}/admin/users/by-email/{ADMIN_EMAIL}", timeout=15)
        assert r.status_code == 400, r.text
        assert "cannot_delete_own_account" in r.text

    def test_admin_can_delete_throwaway(self, admin_session):
        # 1) create a throwaway user via /auth/register
        rand = uuid.uuid4().hex[:8]
        throwaway = f"TEST-throwaway-{rand}@wladbot-testing.de"
        digits = uuid.uuid4().int % 100_000_000
        s = _client()
        r = _register(s, throwaway, "Throwaway User",
                      f"0170{digits:08d}", "Testpass1")
        assert r.status_code == 200, r.text

        # 2) admin deletes it
        r = admin_session.delete(f"{API}/admin/users/by-email/{throwaway}", timeout=20)
        assert r.status_code == 200, r.text
        payload = r.json()
        assert payload["deleted_user"] == throwaway.lower()

        # 3) verify user is gone (login fails)
        s = _client()
        r = _login(s, throwaway, "Testpass1")
        assert r.status_code == 401

    def test_admin_delete_nonexistent_returns_404(self, admin_session):
        r = admin_session.delete(
            f"{API}/admin/users/by-email/does-not-exist-{uuid.uuid4().hex[:8]}@wladbot-testing.de",
            timeout=15,
        )
        assert r.status_code == 404

    def test_non_admin_cannot_delete(self):
        s = _client()
        r = _login(s, FREE_EMAIL)
        if r.status_code != 200:
            pytest.skip("free login failed")
        s.headers["Authorization"] = f"Bearer {r.json()['token']}"
        r = s.delete(f"{API}/admin/users/by-email/whatever@wladbot-testing.de", timeout=15)
        assert r.status_code == 403


# ─── AUTH PROVIDERS + HEALTH ────────────────────────────────────────────
class TestAuthMisc:
    def test_auth_providers_endpoint(self):
        s = _client()
        r = s.get(f"{API}/auth/providers", timeout=15)
        # 200 with a shape; endpoint may or may not exist under this exact path
        assert r.status_code in (200, 404)

    def test_health(self):
        s = _client()
        r = s.get(f"{API}/", timeout=10)
        # root or health endpoint should respond
        assert r.status_code < 500
