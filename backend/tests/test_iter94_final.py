"""Iter 94 FINAL GODMODE pre-deploy regression.

Scope (quick regression only — iter 93 already deep-verified session persistence):
- Auth: /api/auth/me, /api/auth/refresh, /api/auth/providers, magic-link
- Credits: test admin returns is_premium True balance -1 (PAID_TIERS bypass)
- Voice TTS: wlad, bezos, musk, jobs personas all return real audio (key renewed)
- Chat E2E: send message → get structured reply → multi-turn
- Payments: POST /api/payments/checkout for leadership_os returns Stripe URL
- Security headers: CSP, HSTS preload, COOP
- Branding: /wladbot-avatar-clean.png returns 200
"""
import os
import re
import base64
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback for local test invocation — read from frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

TEST_EMAIL = "test@test.com"
TEST_PASS = "test123"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASS}, timeout=15)
    assert r.status_code == 200, f"login failed {r.status_code}: {r.text[:200]}"
    return s


# ---------- AUTH ----------
class TestAuth:
    def test_me(self, session):
        r = session.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d.get("email") == TEST_EMAIL

    def test_refresh(self, session):
        # capture current session cookie
        orig = session.cookies.get("session_token")
        assert orig, "no session_token cookie set on login"
        r = session.post(f"{BASE_URL}/api/auth/refresh", timeout=10)
        assert r.status_code == 200
        # refresh must EXTEND same token — not rotate
        new = session.cookies.get("session_token")
        assert new == orig, f"refresh rotated token: {orig[:8]} -> {new[:8]}"

    def test_providers(self):
        r = requests.get(f"{BASE_URL}/api/auth/providers", timeout=10)
        assert r.status_code == 200
        d = r.json()
        # google client_id must start with 482961656741
        cid = d.get("google_client_id", "")
        assert cid.startswith("482961656741"), f"unexpected client_id: {cid[:20]}"
        assert d.get("providers", {}).get("google") is True

    def test_magic_link_generic_200(self):
        # generic 200 — must not leak account existence
        r = requests.post(f"{BASE_URL}/api/auth/magic-link/request", json={"email": "nonexistent-xyz@wladbot.test"}, timeout=10)
        assert r.status_code == 200


# ---------- CREDITS (PAID_TIERS bypass) ----------
class TestCredits:
    def test_admin_unlimited(self, session):
        r = session.get(f"{BASE_URL}/api/credits", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d.get("is_premium") is True, f"admin not premium: {d}"
        assert d.get("balance") == -1, f"admin balance not -1: {d}"


# ---------- VOICE TTS (new key) ----------
class TestVoiceTTS:
    @pytest.mark.parametrize("persona", ["wlad", "bezos", "musk", "jobs"])
    def test_tts_returns_real_audio(self, session, persona):
        r = session.post(
            f"{BASE_URL}/api/voice/tts",
            json={"text": "Test", "persona": persona},
            timeout=30,
        )
        assert r.status_code == 200, f"[{persona}] status {r.status_code}: {r.text[:200]}"
        d = r.json()
        audio_url = d.get("audio_url", "")
        assert audio_url.startswith("data:audio/mpeg;base64,"), f"[{persona}] not mpeg base64 data URL: {audio_url[:60]}"
        b64 = audio_url.split(",", 1)[1]
        assert len(b64) > 500, f"[{persona}] audio suspiciously small: {len(b64)} chars"
        # Verify valid base64 that decodes to >1KB
        raw = base64.b64decode(b64[: len(b64) - (len(b64) % 4)])
        assert len(raw) > 1000, f"[{persona}] decoded audio <1KB"

    def test_personas_list(self):
        r = requests.get(f"{BASE_URL}/api/voice/personas", timeout=10)
        assert r.status_code == 200
        d = r.json()
        keys = {p["persona"] for p in d.get("personas", [])}
        # all 9 personas in registry
        expected = {"wlad", "bezos", "musk", "oprah", "jobs", "branson", "sandberg", "page", "hastings"}
        assert expected.issubset(keys), f"missing personas: {expected - keys}"


# ---------- CHAT E2E (multi-turn) ----------
class TestChat:
    def test_multi_turn(self, session):
        r1 = session.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Wie kann ich mein Team besser motivieren?"},
            timeout=60,
        )
        assert r1.status_code == 200, f"chat turn 1: {r1.status_code} {r1.text[:200]}"
        d1 = r1.json()
        sid = d1.get("session_id")
        assert sid, "no session_id"
        assert d1.get("response") or d1.get("insight") or d1.get("message"), f"empty reply: {d1}"

        # turn 2
        r2 = session.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Was ist mein erster konkreter Schritt?", "session_id": sid},
            timeout=60,
        )
        assert r2.status_code == 200, f"chat turn 2: {r2.status_code} {r2.text[:200]}"
        d2 = r2.json()
        assert d2.get("session_id") == sid, f"session_id lost: {d2.get('session_id')} vs {sid}"


# ---------- PAYMENTS (Stripe LIVE — verify URL only, DO NOT PAY) ----------
class TestPayments:
    def test_checkout_leadership_os(self, session):
        r = session.post(
            f"{BASE_URL}/api/payments/checkout",
            json={"package_id": "leadership_os", "origin_url": "https://leaderos.de"},
            timeout=30,
        )
        assert r.status_code == 200, f"checkout: {r.status_code} {r.text[:300]}"
        d = r.json()
        url = d.get("url") or d.get("checkout_url") or ""
        assert "checkout.stripe.com" in url, f"not stripe checkout URL: {url[:120]}"


# ---------- SECURITY HEADERS ----------
class TestSecurityHeaders:
    def test_headers(self):
        r = requests.get(f"{BASE_URL}/api/auth/providers", timeout=10)
        h = {k.lower(): v for k, v in r.headers.items()}
        assert "content-security-policy" in h, "CSP missing"
        hsts = h.get("strict-transport-security", "")
        assert "preload" in hsts and "max-age" in hsts, f"HSTS weak: {hsts}"
        coop = h.get("cross-origin-opener-policy", "")
        assert "same-origin" in coop, f"COOP missing/weak: {coop}"


# ---------- BRANDING ASSETS ----------
class TestBranding:
    def test_avatar_asset_available(self):
        # served by frontend static — hit through preview URL
        r = requests.get(f"{BASE_URL}/wladbot-avatar-clean.png", timeout=10, allow_redirects=True)
        assert r.status_code == 200, f"avatar png missing: {r.status_code}"
        assert r.headers.get("content-type", "").startswith("image/"), f"not image: {r.headers.get('content-type')}"
        assert len(r.content) > 5000, f"avatar suspiciously small: {len(r.content)}"
