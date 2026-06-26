"""Iter 92.37 — PRE-RELEASE COMPREHENSIVE REGRESSION
Before re-deploying to Vercel (leader-os.de + leader-check.de), verify all critical
user-facing flows still work after Iter 92.35 (Coaching Hub redesign + SyncDiagnoseBanner
+ RAG 10-Stufen MANUAL_CHUNK) and Iter 92.36 (Google OAuth diagnostic + origin fallback).

Known external issues (NOT regressions):
 - STRIPE_API_KEY is expired → /api/payments/checkout returns 500.
 - Google OAuth origin_mismatch on production (Google Cloud Console whitelist issue).
"""
import os
import sys
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
    open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0].strip()

# Make /app/backend importable for services_email / services_rag direct tests
sys.path.insert(0, "/app/backend")


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def admin_token(s):
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": "test@test.com", "password": "test123"}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ────────────────────────── AUTH ──────────────────────────
class TestAuth:
    def test_login_email_password(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"email": "test@test.com", "password": "test123"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("token")
        assert data.get("user", {}).get("email") == "test@test.com"

    def test_login_identifier_email(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"identifier": "test@test.com", "password": "test123"}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("token")

    def test_login_identifier_phone_no_500(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"identifier": "+491234567890", "password": "test123"}, timeout=15)
        # graceful handling — must NOT be 500
        assert r.status_code != 500, r.text
        assert r.status_code in (200, 401, 404)

    def test_login_bad_creds_returns_401(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"email": "test@test.com", "password": "wrong-xyz-pw"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_magic_link_request(self, s):
        r = s.post(f"{BASE_URL}/api/auth/magic-link/request",
                   json={"email": "test@test.com"}, timeout=20)
        assert r.status_code == 200

    def test_providers_endpoint(self, s):
        r = s.get(f"{BASE_URL}/api/auth/providers", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["providers"].get("google") is True
        cid = data.get("google_client_id", "")
        assert cid.startswith("448733563313-"), f"client_id not the expected one: {cid}"
        assert cid.endswith(".apps.googleusercontent.com")

    def test_auth_me_with_token(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/auth/me", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert r.json().get("email") == "test@test.com"

    def test_register_requires_phone(self, s):
        """Iter 92.x — phone is required on register."""
        r = s.post(f"{BASE_URL}/api/auth/register",
                   json={"email": "TEST_noPhone_iter92_37@wladbot.test",
                         "password": "test12345",
                         "name": "No Phone"}, timeout=15)
        # Must reject because phone missing
        assert r.status_code in (400, 422), r.text


# ────────────────────────── ONBOARDING EMAILS ──────────────────────────
class TestOnboardingEmails:
    def test_signup_welcome_email_renders(self):
        from services_email import signup_welcome_email
        subj, html = signup_welcome_email(name="Test", app_url="https://leader-os.de")
        assert isinstance(subj, str) and len(subj) > 0
        assert isinstance(html, str) and "<html" in html.lower() or "<!doctype" in html.lower() or "<div" in html.lower()
        # Iter 92.x — Vimeo embed removed from onboarding emails
        assert "vimeo" not in html.lower(), "Vimeo embed must NOT be present in signup welcome email"

    @pytest.mark.parametrize("tier", ["starter", "standard", "accelerator"])
    def test_tier_welcome_email_renders(self, tier):
        from services_email import tier_welcome_email
        subj, html = tier_welcome_email(tier=tier, name="Test", app_url="https://leader-os.de")
        assert isinstance(subj, str) and isinstance(html, str)
        assert len(html) > 100
        assert "vimeo" not in html.lower(), f"Vimeo embed must NOT be present in tier_welcome_email({tier})"

    @pytest.mark.parametrize("fn_name", ["drip_day1_email", "drip_day3_email", "drip_day7_email"])
    def test_drip_emails_render(self, fn_name):
        import services_email
        fn = getattr(services_email, fn_name)
        subj, html = fn(name="Test", app_url="https://leader-os.de")
        assert isinstance(subj, str) and isinstance(html, str)
        assert "vimeo" not in html.lower(), f"Vimeo embed must NOT be present in {fn_name}"

    def test_sender_email_uses_no_dash_domain(self):
        """Iter 92.38 — SENDER_EMAIL must now be wlad@leaderos.de (NO dash, verified Resend domain)."""
        env_text = open("/app/backend/.env").read()
        assert "wlad@leaderos.de" in env_text, "SENDER_EMAIL must be wlad@leaderos.de (no dash) in .env"
        assert "reminders@leader-os.de" not in env_text, "Old dashed sender must be removed"

    def test_resend_api_key_set(self):
        env_text = open("/app/backend/.env").read()
        assert "RESEND_API_KEY" in env_text
        # Validate prefix only — do not log the key
        key_line = [l for l in env_text.splitlines() if l.startswith("RESEND_API_KEY")]
        assert key_line and "re_" in key_line[0]

    def test_send_email_function_exists(self):
        from services_email import send_email, is_enabled
        assert callable(send_email)
        assert callable(is_enabled)


# ────────────────────────── CLASSIFIER ──────────────────────────
class TestClassifier:
    def test_classify_intent_speech(self):
        from services_classifier import classify_intent
        result = classify_intent("Wie halte ich eine gute Rede?")
        assert result is not None
        # accept dict OR string return — just ensure it returns something
        assert result, f"Expected non-empty classifier result, got {result!r}"

    def test_classify_intent_video(self):
        from services_classifier import classify_intent
        result = classify_intent("Bitte analysiere mein Pitch-Video")
        assert result is not None


# ────────────────────────── RAG MANUAL CHUNKS ──────────────────────────
class TestRagManualChunks:
    def test_match_chunk_for_zuhoeren(self):
        from services_rag import _match_manual_chunks
        chunks = _match_manual_chunks("Wie kann ich besser zuhören?")
        assert len(chunks) >= 1, f"Expected ≥1 manual chunk for zuhören query, got {chunks}"

    def test_no_match_for_garbage(self):
        from services_rag import _match_manual_chunks
        chunks = _match_manual_chunks("zufälliger Quatsch und blubber Wörter ohne Bezug 12345")
        assert len(chunks) == 0, f"Expected 0 chunks for unrelated query, got {chunks}"

    def test_chat_endpoint_10_stufen(self):
        """End-to-end RAG: ask 10-Stufen question via /api/chat → response should reference stages.
        Use accelerator user (has credits). Use a *fresh* session to avoid cookie pollution."""
        sess = requests.Session()
        sess.headers.update({"Content-Type": "application/json"})
        login = sess.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "accelerator@wladbot.test", "password": "test123"}, timeout=15)
        assert login.status_code == 200, login.text
        hdr = {"Authorization": f"Bearer {login.json()['token']}", "Content-Type": "application/json"}
        r = sess.post(f"{BASE_URL}/api/chat",
                      headers=hdr,
                      json={"message": "Was sind die 10 Stufen des Zuhörens?"}, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        # response can be at various keys; normalize to a flat string
        raw = data.get("response") or data.get("message") or data.get("content") or data
        if isinstance(raw, dict):
            raw = " ".join(str(v) for v in raw.values())
        text = str(raw).lower()
        stufe_hits = text.count("stufe")
        assert stufe_hits >= 3, f"Expected ≥3 'Stufe' mentions in 10-Stufen response; got {stufe_hits}. Excerpt: {text[:500]}"
        data = r.json()
        response_text = (data.get("response") or data.get("message") or
                         data.get("content") or str(data)).lower()
        # At least 'stufe' mentioned multiple times OR explicit stage names present
        stufe_hits = response_text.count("stufe")
        assert stufe_hits >= 3, f"Expected ≥3 'Stufe' mentions; got {stufe_hits}. Resp={response_text[:500]}"


# ────────────────────────── DASHBOARD / WLADHUB ──────────────────────────
class TestDashboardWladHub:
    def test_wladhub_3layer(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/wladhub/3layer", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text

    def test_wladhub_sync(self, s, admin_headers):
        # Sync requires a body matching WladHubSyncRequest
        r = s.post(f"{BASE_URL}/api/wladhub/sync", headers=admin_headers,
                   json={"wladhub_email": "test@test.com"}, timeout=60)
        # 200 OK, 200 with no_data, or 503 if Supabase not reachable — must NOT be 500.
        assert r.status_code in (200, 202, 503), r.text


# ────────────────────────── EVENTS ──────────────────────────
class TestEvents:
    def test_events_listing(self, s, admin_headers):
        """EventReminderBanner reads from /api/events-reminders.
        Generic listing endpoint is /api/events?tab=live."""
        r = s.get(f"{BASE_URL}/api/events?tab=live", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text

    def test_events_reminders(self, s, admin_headers):
        """The actual endpoint EventReminderBanner.js calls."""
        r = s.get(f"{BASE_URL}/api/events-reminders", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text


# ────────────────────────── PAYMENTS ──────────────────────────
class TestPayments:
    def test_payments_packages(self, s):
        r = s.get(f"{BASE_URL}/api/payments/packages", timeout=15)
        assert r.status_code == 200
        data = r.json()
        # Should be a dict or list of packages
        assert data

    def test_stripe_checkout_known_expired(self, s, admin_headers):
        """KNOWN ISSUE — Stripe key expired. We tolerate 500 ('Expired API Key')
        but the endpoint must still EXIST and not 404."""
        r = s.post(f"{BASE_URL}/api/payments/checkout",
                   headers=admin_headers,
                   json={"package_id": "leadership_os", "origin_url": "https://leader-os.de"},
                   timeout=30)
        assert r.status_code != 404, "Checkout endpoint must exist"
        # 500 expected for expired key; 200 if key was rotated
        assert r.status_code in (200, 400, 402, 500, 503), r.text

    def test_billing_portal_endpoint_exists(self, s, admin_headers):
        r = s.post(f"{BASE_URL}/api/billing/portal", headers=admin_headers,
                   json={"origin_url": "https://leader-os.de"}, timeout=30)
        assert r.status_code != 404
        # 200 if working; 400/500/502 with expired Stripe key (502 = ingress timeout
        # when Stripe customer lookup also fails). All non-404 is acceptable for now.
        assert r.status_code in (200, 400, 401, 403, 500, 502, 503), r.text


# ────────────────────────── ADMIN ──────────────────────────
class TestAdmin:
    def test_admin_auth_health(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/auth-health", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, dict)


# ────────────────────────── CORS — multi-domain ──────────────────────────
class TestCORSMultiDomain:
    @pytest.mark.parametrize("origin", [
        "https://leader-os.de",
        "https://leader-check.de",
        "https://leaderos.de",
        "https://leadercheck.de",
        "https://www.leader-os.de",
    ])
    def test_cors_preflight_for_origin(self, s, origin):
        r = s.options(
            f"{BASE_URL}/api/auth/providers",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Content-Type, Authorization",
            },
            timeout=15,
        )
        # In preview, CORS_ORIGINS=* → allow_origin_regex=.* so any origin should be accepted.
        # Preflight should succeed (200/204) and reflect the origin.
        assert r.status_code in (200, 204), f"OPTIONS for {origin} → {r.status_code}: {r.text}"
        acao = r.headers.get("access-control-allow-origin", "")
        assert acao in (origin, "*"), f"ACAO for {origin} = {acao!r}"


# ────────────────────────── GDPR DELETE (endpoint exists) ──────────────────────────
class TestGDPR:
    def test_gdpr_delete_endpoint_exists(self, s, admin_headers):
        """Just verify the endpoint exists without actually deleting the admin.
        Send an INTENTIONALLY WRONG confirmation so the endpoint short-circuits."""
        r = s.post(f"{BASE_URL}/api/gdpr/delete",
                   headers=admin_headers,
                   json={"email_confirm": "wrong-email-on-purpose@example.com"},
                   timeout=15)
        # Must not 404 — endpoint exists. Should reject with 400/403.
        assert r.status_code != 404, "GDPR delete endpoint must exist"
        assert r.status_code in (400, 401, 403, 422), r.text
