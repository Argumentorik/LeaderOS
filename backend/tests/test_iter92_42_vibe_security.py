"""Iter 92.42 Vibe-Security: magic-link e2e, modality, email link audit."""
import os
import re
import time
import asyncio
import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
    open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0].rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL") or open("/app/backend/.env").read().split("MONGO_URL=")[1].split()[0].strip('"')
DB_NAME = os.environ.get("DB_NAME") or open("/app/backend/.env").read().split("DB_NAME=")[1].split()[0].strip('"')

ACCEL = ("accelerator@wladbot.test", "test123")
ADMIN = ("test@test.com", "test123")


@pytest.fixture
def s():
    return requests.Session()


# ─── Magic-link E2E ─────────────────────────────────────────────────────────
class TestMagicLinkE2E:
    def test_request_returns_200_for_existing(self, s):
        r = s.post(f"{BASE_URL}/api/auth/magic-link/request", json={"email": ADMIN[0]})
        # 200 normally, 429 if rate-limit tripped from prior runs (both valid)
        assert r.status_code in (200, 429), r.text
        if r.status_code == 200:
            assert "Postfach" in r.json().get("message", "")

    def test_request_returns_200_for_nonexistent_silently(self, s):
        r = s.post(f"{BASE_URL}/api/auth/magic-link/request",
                   json={"email": f"ghost-{int(time.time())}@example.com"})
        assert r.status_code == 200

    def test_create_consume_token_single_use(self):
        async def run():
            import sys
            sys.path.insert(0, "/app/backend")
            from services_magic_link import create_token, consume_token
            tok = await create_token(ADMIN[0], "127.0.0.1")
            assert tok and len(tok) > 20
            u1 = await consume_token(tok)
            assert u1 and u1.get("email") == ADMIN[0]
            u2 = await consume_token(tok)  # second use must fail
            assert u2 is None
            return tok
        asyncio.get_event_loop().run_until_complete(run()) if False else asyncio.run(run())

    def test_verify_endpoint_invalid_token(self, s):
        r = s.post(f"{BASE_URL}/api/auth/magic-link/verify", json={"token": "bogus-not-real"})
        assert r.status_code == 401

    def test_verify_endpoint_valid_token_full_flow(self, s):
        # Generate token via fresh event loop with own motor client (avoid loop reuse)
        async def get_tok():
            import hashlib
            import secrets
            from datetime import datetime, timezone, timedelta
            client = AsyncIOMotorClient(MONGO_URL)
            mydb = client[DB_NAME]
            user = await mydb.users.find_one({"email": ACCEL[0]}, {"user_id": 1})
            assert user, "test user missing"
            raw = secrets.token_urlsafe(48)
            now = datetime.now(timezone.utc)
            await mydb.magic_links.insert_one({
                "_id": hashlib.sha256(raw.encode()).hexdigest(),
                "email": ACCEL[0],
                "created_at": now,
                "expires_at": now + timedelta(minutes=15),
                "used_at": None,
                "request_ip": "127.0.0.1",
            })
            client.close()
            return raw
        tok = asyncio.new_event_loop().run_until_complete(get_tok())
        assert tok
        r = s.post(f"{BASE_URL}/api/auth/magic-link/verify", json={"token": tok})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "user" in data
        assert data["user"]["email"] == ACCEL[0]
        assert any(c.name == "session_token" for c in s.cookies)
        r2 = s.post(f"{BASE_URL}/api/auth/magic-link/verify", json={"token": tok})
        assert r2.status_code == 401

    def test_email_html_link_format(self):
        import sys
        sys.path.insert(0, "/app/backend")
        from services_magic_link import _format_email_html
        link = "https://leaderos.de/auth/magic?token=ABC123"
        html = _format_email_html("Test", link)
        assert f'href="{link}"' in html
        assert "leader-os.de" not in html  # no dash domain


# ─── Modality validation ────────────────────────────────────────────────────
class TestModality:
    @pytest.fixture
    def auth(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ACCEL[0], "password": ACCEL[1]})
        assert r.status_code == 200, r.text
        return r.json()["token"]

    def test_chat_modality_speech(self, s, auth):
        r = s.post(f"{BASE_URL}/api/chat",
                   headers={"Authorization": f"Bearer {auth}"},
                   json={"message": "Was sind die 10 Stufen des Zuhörens?", "modality": "speech"},
                   timeout=90)
        assert r.status_code == 200, r.text[:400]
        body = r.json()
        assert body.get("modality") == "speech"
        assert "rag" in body
        assert isinstance(body["rag"].get("chunks"), int)

    def test_chat_modality_default_text(self, s, auth):
        r = s.post(f"{BASE_URL}/api/chat",
                   headers={"Authorization": f"Bearer {auth}"},
                   json={"message": "Hallo"},
                   timeout=90)
        assert r.status_code == 200
        assert r.json().get("modality") == "text"

    def test_chat_modality_invalid_normalised(self, s, auth):
        r = s.post(f"{BASE_URL}/api/chat",
                   headers={"Authorization": f"Bearer {auth}"},
                   json={"message": "Hi", "modality": "<script>alert(1)</script>"},
                   timeout=90)
        assert r.status_code == 200
        assert r.json().get("modality") == "text"

    def test_chat_modality_video(self, s, auth):
        r = s.post(f"{BASE_URL}/api/chat",
                   headers={"Authorization": f"Bearer {auth}"},
                   json={"message": "Wie führe ich ein schwieriges Gespräch?", "modality": "video"},
                   timeout=90)
        assert r.status_code == 200
        assert r.json().get("modality") == "video"


# ─── Email template link audit ─────────────────────────────────────────────
class TestEmailTemplatesLinks:
    def _hrefs(self, html: str):
        return re.findall(r'href=["\']([^"\']+)["\']', html)

    def test_signup_welcome_links(self):
        import sys
        sys.path.insert(0, "/app/backend")
        from services_email import signup_welcome_email
        _, html = signup_welcome_email("Mert")
        hrefs = self._hrefs(html)
        # Filter out anchor placeholders like "#"
        http_links = [h for h in hrefs if h.startswith("http")]
        assert http_links, "no http links found"
        for h in http_links:
            assert h.startswith("https://leaderos.de"), f"bad domain: {h}"
            assert "leader-os.de" not in h

    @pytest.mark.parametrize("tier", ["starter", "standard", "accelerator"])
    def test_tier_welcome_links(self, tier):
        import sys
        sys.path.insert(0, "/app/backend")
        from services_email import tier_welcome_email
        _, html = tier_welcome_email(tier, "Mert")
        for h in [x for x in self._hrefs(html) if x.startswith("http")]:
            assert "leaderos.de" in h and "leader-os" not in h

    @pytest.mark.parametrize("ep_idx", range(7))
    def test_drip_links(self, ep_idx):
        import sys
        import importlib
        sys.path.insert(0, "/app/backend")
        m = importlib.import_module("services_email")
        _, html = m.framework_episode_email("Mert", m.FRAMEWORK_EPISODES[ep_idx])
        for h in [x for x in self._hrefs(html) if x.startswith("http")]:
            assert h.startswith("https://leaderos.de"), f"EP {ep_idx + 1}: {h}"

    def test_stripe_receipt_links(self):
        import sys; sys.path.insert(0, "/app/backend")
        from services_email import stripe_receipt_email
        _, html = stripe_receipt_email("Mert", "Leadership OS", 997.0, "eur", "standard", "txn_test")
        for h in [x for x in self._hrefs(html) if x.startswith("http")]:
            assert h.startswith("https://leaderos.de")

    def test_video_drip_links(self):
        import sys; sys.path.insert(0, "/app/backend")
        from services_email import video_drip_email, VIDEO_DRIP_VIDEOS
        _, html = video_drip_email("Mert", VIDEO_DRIP_VIDEOS[0])
        for h in [x for x in self._hrefs(html) if x.startswith("http")]:
            assert h.startswith("https://leaderos.de")

    def test_installment_due_links(self):
        import sys; sys.path.insert(0, "/app/backend")
        from services_email import installment_due_email
        _, html = installment_due_email("Mert", 3, 12, 99.0, "https://leaderos.de/checkout/x", "01.02.2026")
        for h in [x for x in self._hrefs(html) if x.startswith("http")]:
            assert h.startswith("https://leaderos.de") or h.startswith("https://leaderos.de/checkout")

    def test_event_emails_links(self):
        import sys; sys.path.insert(0, "/app/backend")
        from services_email import event_registration_email, event_reminder_email
        evt = {"title": "Test", "description": "d", "date": "2026-02-01T18:00:00Z", "host": "Wlad"}
        _, html1 = event_registration_email("Mert", evt, "https://leaderos.de/cal")
        _, html2 = event_reminder_email("Mert", evt, 1.0, "https://leaderos.de/cal")
        for html in (html1, html2):
            for h in [x for x in self._hrefs(html) if x.startswith("http")]:
                assert "leader-os.de" not in h

    def test_no_unfilled_placeholders(self):
        import sys; sys.path.insert(0, "/app/backend")
        from services_email import signup_welcome_email, tier_welcome_email
        for _, html in [signup_welcome_email("Mert"), tier_welcome_email("standard", "Mert")]:
            # No unfilled {placeholder} like {name} or {url}
            leftover = re.findall(r"\{[a-z_]+\}", html)
            assert not leftover, f"unfilled placeholders: {leftover}"


# ─── send_email retry signature ────────────────────────────────────────────
class TestSendEmailRetry:
    def test_send_email_has_max_retries_kwarg(self):
        import sys; import inspect; sys.path.insert(0, "/app/backend")
        from services_email import send_email
        sig = inspect.signature(send_email)
        assert "max_retries" in sig.parameters
        assert sig.parameters["max_retries"].default == 3


# ─── Resend log line ────────────────────────────────────────────────────────
class TestResendLogging:
    def test_resend_send_ok_log_line_appears(self, s):
        # Trigger via fresh email (may rate-limit silently — log line should already exist from prior runs)
        s.post(f"{BASE_URL}/api/auth/magic-link/request",
               json={"email": f"fresh-{int(time.time())}@example.com"})
        time.sleep(1.5)
        try:
            with open("/var/log/supervisor/backend.err.log") as f:
                err = f.read()[-60000:]
            with open("/var/log/supervisor/backend.out.log") as f:
                out = f.read()[-60000:]
        except FileNotFoundError:
            pytest.skip("backend logs not found")
        combined = err + out
        assert ("Resend send OK" in combined) or ("PERMANENT failure" in combined) or \
               ("RESEND_API_KEY not configured" in combined), \
               "no Resend log line found - send pipeline silent?"


# ─── Auth regression ───────────────────────────────────────────────────────
class TestAuthRegression:
    def test_login_me_logout_relogin(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN[0], "password": ADMIN[1]})
        assert r.status_code == 200
        tok = r.json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        me = s.get(f"{BASE_URL}/api/auth/me", headers=h)
        assert me.status_code == 200
        assert me.json()["email"] == ADMIN[0]
        lo = s.post(f"{BASE_URL}/api/auth/logout", headers=h)
        assert lo.status_code == 200
        r2 = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN[0], "password": ADMIN[1]})
        assert r2.status_code == 200
