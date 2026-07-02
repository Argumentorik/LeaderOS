"""Iter 92.43 — Backend regression + magic-link FRONTEND_BASE_URL dynamic check.

Covers:
  - services_magic_link._frontend_base() reads FRONTEND_BASE_URL env (with default)
  - _format_email_html embeds the CTA href with the configured base URL
  - POST /api/auth/magic-link/request returns 200 (no enumeration)
  - REGRESSION: login (email+password), register w/ phone, /auth/me
  - REGRESSION: /api/chat modality=speech / invalid → text
"""
import os
import sys
import time
import uuid
import pytest
import requests

sys.path.insert(0, "/app/backend")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0].strip()
BASE_URL = BASE_URL.rstrip("/")


# ---------- services_magic_link unit checks ----------
class TestMagicLinkServiceUnit:
    def test_frontend_base_default_or_env(self):
        from services_magic_link import _frontend_base
        url = _frontend_base()
        assert url.startswith("http"), f"Expected URL, got {url!r}"
        # If FRONTEND_BASE_URL set, must match; else default leaderos.de
        env = os.environ.get("FRONTEND_BASE_URL")
        if env:
            assert url == env.rstrip("/")
        else:
            assert url == "https://leaderos.de"

    def test_format_email_html_uses_link(self):
        from services_magic_link import _format_email_html, _frontend_base
        base = _frontend_base()
        raw_token = "fake_raw_token"  # noqa: S105 — deliberately fake sentinel, never valid
        link = f"{base}/auth/magic?token={raw_token}"
        html = _format_email_html("Tester", link)
        assert f'href="{link}"' in html, f"CTA href not found in HTML. Looking for href=\"{link}\""
        assert raw_token in html
        assert "/auth/magic?token=" in html

    def test_format_email_html_with_explicit_leaderos(self):
        from services_magic_link import _format_email_html
        link = "https://leaderos.de/auth/magic?token=fake_raw_token"
        html = _format_email_html("test", link)
        assert 'href="https://leaderos.de/auth/magic?token=fake_raw_token"' in html


# ---------- API regression ----------
class TestAuthRegression:
    def test_login_existing_user(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "test@test.com", "password": "test123"}, timeout=15)
        assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
        data = r.json()
        assert "token" in data and len(data["token"]) > 0
        assert "user" in data
        assert data["user"]["email"] == "test@test.com"

    def test_login_accelerator(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "accelerator@wladbot.test", "password": "test123"}, timeout=15)
        assert r.status_code == 200, r.text[:200]
        return r.json()["token"]

    def test_me_endpoint(self):
        login = requests.post(f"{BASE_URL}/api/auth/login",
                              json={"email": "test@test.com", "password": "test123"}, timeout=15)
        assert login.status_code == 200
        token = login.json()["token"]
        r = requests.get(f"{BASE_URL}/api/auth/me",
                         headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r.status_code == 200, r.text[:200]
        assert r.json().get("email") == "test@test.com"

    def test_register_with_phone(self):
        uniq = uuid.uuid4().hex[:8]
        email = f"TEST_iter92_43_{uniq}@example.com"
        phone = f"+49170{(int(time.time()) % 10000000):07d}"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "Str0ng!Pass", "name": "Test U", "phone": phone
        }, timeout=20)
        # Accept 200 or 201
        assert r.status_code in (200, 201), f"register: {r.status_code} {r.text[:200]}"
        data = r.json()
        assert "token" in data or "user" in data


class TestMagicLinkEndpoint:
    def test_request_magic_link_200(self):
        r = requests.post(f"{BASE_URL}/api/auth/magic-link/request",
                          json={"email": "test@test.com"}, timeout=15)
        # 200 = success; 429 = rate-limited (expected on repeated runs).
        assert r.status_code in (200, 429), f"{r.status_code} {r.text[:200]}"

    def test_request_magic_link_unknown_user_200(self):
        # Use a valid-format email; endpoint should still return 200 (no enumeration).
        r = requests.post(f"{BASE_URL}/api/auth/magic-link/request",
                          json={"email": "nobody-iter9243@example.com"}, timeout=15)
        assert r.status_code in (200, 429), f"{r.status_code} {r.text[:200]}"


class TestChatModality:
    @pytest.fixture(scope="class")
    def token(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "accelerator@wladbot.test", "password": "test123"}, timeout=15)
        if r.status_code != 200:
            pytest.skip(f"login failed: {r.text[:200]}")
        return r.json()["token"]

    def test_chat_speech_modality(self, token):
        r = requests.post(f"{BASE_URL}/api/chat",
                          headers={"Authorization": f"Bearer {token}"},
                          json={"message": "Wie verbessere ich meine Bühnenrede?", "modality": "speech"},
                          timeout=60)
        assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
        data = r.json()
        assert data.get("modality") == "speech", f"got modality={data.get('modality')}"

    def test_chat_invalid_modality_normalized(self, token):
        r = requests.post(f"{BASE_URL}/api/chat",
                          headers={"Authorization": f"Bearer {token}"},
                          json={"message": "Hi", "modality": "bogus_invalid"},
                          timeout=60)
        assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
        assert r.json().get("modality") == "text"
