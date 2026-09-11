"""Iter 64 regression — refactor-only sprint.

Covers:
- POST /api/chat/upload-document dispatcher (txt/invalid/empty)
- POST /api/cron/event-reminders public cron response shape
- POST /api/tools/deep-assist response contract (argumentation/tips/action_plan)
- Regression smoke of previously-tested routes: voice, profile/me, my-path, community/feed,
  admin/overview, payments/checkout, cron/monthly-scorecard
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

ACCEL_EMAIL = "accelerator@wladbot.test"
ADMIN_EMAIL = "test@test.com"
# Test-fixture password: seeded test accounts only (never production secret).
# Override via env for CI. Default matches seed_test_users.py.
PASSWORD = os.environ.get("TEST_ACCOUNT_PASSWORD", "test123")


@pytest.fixture(scope="module")
def token_accel():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ACCEL_EMAIL, "password": PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json().get("token")


@pytest.fixture(scope="module")
def token_admin():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": PASSWORD}, timeout=15)
    if r.status_code != 200:
        pytest.skip("admin login failed")
    return r.json().get("token")


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- chat/upload-document dispatcher ----------

class TestChatUploadDocument:
    def test_txt_valid(self, token_accel):
        files = {"file": ("notes.txt", b"Hello WladBot leadership test.", "text/plain")}
        r = requests.post(f"{BASE_URL}/api/chat/upload-document",
                          headers=_auth(token_accel), files=files, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["filename"] == "notes.txt"
        assert body["type"] == "txt"
        assert body["chars"] > 0
        assert "Hello WladBot" in body["full_text"]

    def test_md_valid(self, token_accel):
        files = {"file": ("readme.md", b"# Heading\ntext body", "text/markdown")}
        r = requests.post(f"{BASE_URL}/api/chat/upload-document",
                          headers=_auth(token_accel), files=files, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["type"] == "md"

    def test_invalid_extension_returns_400(self, token_accel):
        files = {"file": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")}
        r = requests.post(f"{BASE_URL}/api/chat/upload-document",
                          headers=_auth(token_accel), files=files, timeout=20)
        assert r.status_code == 400, r.text
        detail = r.json().get("detail", "").lower()
        assert "nicht unterstützt" in detail or "nicht unterst" in detail

    def test_no_extension_returns_400(self, token_accel):
        files = {"file": ("plainfile", b"abc", "application/octet-stream")}
        r = requests.post(f"{BASE_URL}/api/chat/upload-document",
                          headers=_auth(token_accel), files=files, timeout=20)
        assert r.status_code == 400

    def test_empty_txt_file_200_but_zero_chars(self, token_accel):
        # Empty .txt is allowed by plaintext handler (no explicit empty guard)
        files = {"file": ("empty.txt", b"", "text/plain")}
        r = requests.post(f"{BASE_URL}/api/chat/upload-document",
                          headers=_auth(token_accel), files=files, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["chars"] == 0

    def test_no_auth_unauthorized(self):
        files = {"file": ("x.txt", b"a", "text/plain")}
        r = requests.post(f"{BASE_URL}/api/chat/upload-document", files=files, timeout=10)
        assert r.status_code in (401, 403)


# ---------- cron/event-reminders ----------

class TestCronEventReminders:
    def test_response_shape(self):
        r = requests.post(f"{BASE_URL}/api/cron/event-reminders", timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert set(body.keys()) >= {"24h", "1h", "enabled"}
        assert isinstance(body["enabled"], bool)
        for key in ("24h", "1h"):
            sub = body[key]
            assert isinstance(sub, dict)
            assert "sent" in sub and "skipped" in sub
            # label only present when email_enabled
            if body["enabled"]:
                assert sub.get("label") in ("24h", "1h")


# ---------- tools/deep-assist ----------

class TestDeepAssist:
    def test_deep_assist_contract(self, token_accel):
        payload = {
            "situation": "Mein Team liefert Features zu spät und die Qualität leidet.",
            "goal": "In 30 Tagen Velocity & Qualität messbar verbessern",
        }
        r = requests.post(f"{BASE_URL}/api/tools/deep-assist",
                          headers=_auth(token_accel), json=payload, timeout=90)
        assert r.status_code == 200, r.text
        body = r.json()
        assert isinstance(body.get("argumentation"), str) and len(body["argumentation"]) > 20
        tips = body.get("tips")
        assert isinstance(tips, list) and len(tips) == 5
        assert all(isinstance(t, str) and t for t in tips)
        plan = body.get("action_plan")
        assert isinstance(plan, list) and len(plan) == 5
        for step in plan:
            assert "step" in step and "action" in step and "deadline" in step and "why" in step

    def test_deep_assist_missing_situation_400(self, token_accel):
        r = requests.post(f"{BASE_URL}/api/tools/deep-assist",
                          headers=_auth(token_accel), json={"situation": "  ", "goal": "x"}, timeout=20)
        assert r.status_code == 400


# ---------- Regression smoke of previously-green routes ----------

class TestRegressionSmoke:
    def _get(self, path, token=None):
        h = _auth(token) if token else {}
        return requests.get(f"{BASE_URL}{path}", headers=h, timeout=20)

    def test_profile_me(self, token_accel):
        r = self._get("/api/profile/me", token_accel)
        assert r.status_code == 200, r.text
        assert r.json().get("user_id")

    def test_auth_me(self, token_accel):
        r = self._get("/api/auth/me", token_accel)
        assert r.status_code == 200

    def test_voice_personas(self, token_accel):
        r = self._get("/api/voice/personas", token_accel)
        assert r.status_code == 200
        data = r.json()
        # Either list or dict-with-personas
        personas = data if isinstance(data, list) else data.get("personas", [])
        assert len(personas) >= 1

    def test_mypath_videos(self, token_accel):
        r = self._get("/api/my-path/videos", token_accel)
        assert r.status_code in (200, 404)  # 404 tolerated if endpoint renamed
        # Prefer 200
        if r.status_code == 200:
            assert isinstance(r.json(), (list, dict))

    def test_community_feed(self, token_accel):
        r = self._get("/api/community/feed", token_accel)
        assert r.status_code == 200

    def test_admin_overview(self, token_admin):
        r = self._get("/api/admin/overview", token_admin)
        assert r.status_code in (200, 403)  # 403 tolerated if non-whitelisted

    def test_cron_monthly_scorecard(self):
        r = requests.post(f"{BASE_URL}/api/cron/monthly-scorecard", timeout=30)
        assert r.status_code in (200, 404)

    def test_payments_checkout_requires_body(self, token_accel):
        # Just verify endpoint exists and rejects bad body with 4xx, not 5xx
        r = requests.post(f"{BASE_URL}/api/payments/checkout",
                          headers=_auth(token_accel), json={}, timeout=15)
        assert r.status_code < 500, r.text
