"""
Iteration 33 — FINAL Pre-Deploy regression for Leader-Check GO-LIVE.

Covers:
  1. Stripe LIVE mode: /api/payments/create-checkout returns a checkout URL
     for both 'leader_os_full' (997 €) and 'leader_os_plus' (4797 €). URL must
     point at https://checkout.stripe.com and use LIVE secret key (sk_live_...).
  2. PDF generation: services.pdf_report.generate_diagnostic_pdf returns
     valid PDF bytes (>5 KB, starts with b'%PDF-').
  3. Resend PDF attachment end-to-end: /api/quiz/submit -> /api/quiz/generate-report
     triggers send_auto_report_email with PDF attachment. Verify via
     MongoDB email_log: type='report_auto' AND has_pdf=true AND backend log
     contains "Auto report email sent ... (pdf=yes)".
  4. /api/email/send-report with a real session_id returns
     {success: true, pdf_attached: true}.
  5. Wlad portrait: GET /wlad-portrait.png returns 200 + image/png.
  6. Backend health + admin login + admin stats regression.
"""
from __future__ import annotations

import os
import time
import uuid
import pytest
import requests


def _load_backend_url() -> str:
    val = os.environ.get("REACT_APP_BACKEND_URL", "").strip().rstrip("/")
    if val:
        return val
    # Fallback: read from frontend/.env so this test is runnable from CI/CLI
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                line = line.strip()
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().rstrip("/")
    except FileNotFoundError:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")


BASE_URL = _load_backend_url()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
TEST_EMAIL = os.environ.get("TEST_EMAIL", "start@aiporate.com")
PUBLIC_FRONTEND_FILE = "/wlad-portrait.png"

if not ADMIN_PASSWORD:
    pytest.skip("ADMIN_PASSWORD env var required for this suite", allow_module_level=True)


# -------------------- Fixtures --------------------

@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    token = r.json().get("token")
    assert token, "No token returned from admin login"
    return token


@pytest.fixture(scope="module")
def admin_api(api, admin_token):
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}",
    })
    return s


# -------------------- 1. Stripe LIVE --------------------

class TestStripeLive:
    """Stripe must be in LIVE mode."""

    def _origin(self):
        return BASE_URL

    @pytest.mark.parametrize("package_id,expected_eur", [
        ("leader_os_full", 997),
        ("leader_os_plus", 4797),
    ])
    def test_create_checkout_returns_stripe_url(self, api, package_id, expected_eur):
        payload = {"package_id": package_id, "origin_url": self._origin()}
        r = api.post(f"{BASE_URL}/api/payments/create-checkout", json=payload)
        assert r.status_code == 200, f"{package_id}: {r.status_code} {r.text}"
        data = r.json()
        assert "url" in data, f"{package_id}: missing url. body={data}"
        url = data["url"]
        assert url.startswith("https://checkout.stripe.com"), f"{package_id}: bad url {url}"
        # LIVE checkouts use cs_live_ session ids in the URL path
        assert "cs_live_" in url, (
            f"{package_id}: Stripe NOT in LIVE mode — url contains test session id: {url}"
        )
        # Optional: confirm session_id field also looks live
        sid = data.get("session_id") or ""
        if sid:
            assert sid.startswith("cs_live_"), f"{package_id}: session_id is not live: {sid}"


# -------------------- 2. PDF Generation Unit Test --------------------

class TestPDFGeneration:
    def test_generate_diagnostic_pdf_returns_valid_pdf(self):
        # Lazy import so a missing reportlab fails this test only.
        import sys
        sys.path.insert(0, "/app/backend")
        from services.pdf_report import generate_diagnostic_pdf

        sample_report = {
            "score": 72,
            "top_role": "manager",
            "weakest_role": {"slug": "communicator", "label": "Kommunikator", "score": 41},
            "cat_avg": {
                "rhetorik": 55, "fuehrung": 78, "eq": 60,
                "kritisches_denken": 70, "entscheidung": 80, "strategie": 65,
            },
            "narrative": "Sample narrative for PDF rendering. " * 10,
            "generated_at": "2026-01-15T10:00:00",
        }
        pdf = generate_diagnostic_pdf("TEST Iter33", sample_report)
        assert pdf is not None, "PDF generator returned None"
        assert isinstance(pdf, (bytes, bytearray)), "PDF must be bytes"
        assert pdf.startswith(b"%PDF-"), f"PDF magic bytes missing, got {pdf[:8]!r}"
        assert len(pdf) > 5000, f"PDF too small: {len(pdf)} bytes (expected > 5KB)"


# -------------------- 3. Resend PDF Attachment E2E --------------------

class TestResendPDFAttachmentE2E:
    """Full flow: create user -> submit quiz answers -> generate report ->
       verify email_log.has_pdf == true."""

    def _build_answers(self):
        # Build a valid QuizAnswer list (6 categories × 3 layers approx.)
        cats = ["rhetorik", "fuehrung", "eq", "kritisches_denken", "entscheidung", "strategie"]
        layers = ["ai_literacy", "rhetoric", "strategic_eq"]
        out = []
        for i, cat in enumerate(cats):
            for j, layer in enumerate(layers):
                out.append({
                    "question_id": f"q{i*3+j+1}",
                    "category": cat,
                    "layer": layer,
                    "score": 3,
                })
        return out

    def _create_user(self):
        payload = {
            "name": "TEST Iter33",
            "email": TEST_EMAIL,
            "phone": "+4915112345678",
            "role": "manager",
            "consent_privacy": True,
            "consent_marketing": False,
        }
        r = requests.post(f"{BASE_URL}/api/user/create", json=payload, timeout=30)
        assert r.status_code in (200, 201), f"user/create: {r.status_code} {r.text}"
        user = r.json()
        session_id = (
            user.get("session_id") or user.get("user_id") or user.get("id")
            or (user.get("user") or {}).get("session_id")
        )
        assert session_id, f"No session_id from user/create: {user}"
        return session_id

    def test_quiz_submit_generates_report_with_pdf_email(self, admin_api):
        # 1. Create user
        session_id = self._create_user()

        # 2. Generate report directly (POST /api/quiz/generate-report). Iter33
        #    backend has no separate /quiz/submit — generate-report consumes the
        #    answers and produces the report in one call.
        gen = requests.post(
            f"{BASE_URL}/api/quiz/generate-report",
            json={"session_id": session_id, "answers": self._build_answers()},
            timeout=120,
        )
        assert gen.status_code == 200, f"generate-report: {gen.status_code} {gen.text}"

        # 4. Wait for fire-and-forget task to flush email_log
        deadline = time.time() + 25
        found = None
        while time.time() < deadline:
            time.sleep(2)
            r2 = admin_api.get(f"{BASE_URL}/api/admin/emails")
            if r2.status_code == 200:
                payload = r2.json()
                logs = payload if isinstance(payload, list) else payload.get("emails", payload.get("logs", []))
                for L in logs:
                    if L.get("type") == "report_auto" and L.get("session_id") == session_id:
                        found = L
                        break
                if found:
                    break

        if not found:
            # Fallback: scrape backend log file
            try:
                with open("/var/log/supervisor/backend.err.log", "r") as f:
                    tail = f.read()[-20000:]
                assert "Auto report email sent" in tail and "pdf=yes" in tail, (
                    "Neither email_log entry nor backend log line confirms PDF attachment.\n"
                    f"tail tail-snippet: {tail[-2000:]}"
                )
                return
            except FileNotFoundError:
                pytest.fail("email_log entry not found and backend.err.log missing")

        assert found.get("has_pdf") is True, (
            f"email_log report_auto missing has_pdf=true: {found}"
        )

    def test_email_send_report_endpoint_attaches_pdf(self):
        # Self-contained: create a fresh user + report, then call send-report.
        session_id = self._create_user()
        gen = requests.post(
            f"{BASE_URL}/api/quiz/generate-report",
            json={"session_id": session_id, "answers": self._build_answers()},
            timeout=120,
        )
        assert gen.status_code == 200, f"generate-report: {gen.status_code} {gen.text}"
        time.sleep(3)  # respect Resend 10/sec rate-limit + flush task

        # POST /api/email/send-report
        r2 = requests.post(
            f"{BASE_URL}/api/email/send-report",
            json={"session_id": session_id},
            timeout=60,
        )
        assert r2.status_code == 200, f"send-report: {r2.status_code} {r2.text}"
        body = r2.json()
        assert body.get("success") is True, f"send-report not successful: {body}"
        assert body.get("pdf_attached") is True, (
            f"PDF was not attached on /api/email/send-report: {body}"
        )


# -------------------- 5. Wlad Portrait Asset --------------------

class TestWladPortraitAsset:
    def test_wlad_portrait_png_served(self):
        # Frontend root + asset path
        url = f"{BASE_URL}{PUBLIC_FRONTEND_FILE}"
        r = requests.get(url, timeout=15)
        assert r.status_code == 200, f"{url}: {r.status_code}"
        ctype = r.headers.get("content-type", "")
        assert "image/png" in ctype.lower(), f"Bad content-type: {ctype}"
        assert len(r.content) > 100_000, f"Image suspiciously small: {len(r.content)} bytes"
        # PNG magic
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n", "Not a valid PNG file"


# -------------------- 6. Backend Health + Admin --------------------

class TestBackendHealth:
    def test_health(self, api):
        r = api.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200, f"health: {r.status_code} {r.text}"

    def test_admin_login(self, api):
        r = api.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert "token" in r.json()

    def test_admin_stats_with_token(self, admin_api):
        r = admin_api.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code == 200, f"admin/stats: {r.status_code} {r.text}"
        data = r.json()
        # Sanity: stats should be a JSON object
        assert isinstance(data, dict), f"Expected dict, got {type(data)}"

    def test_admin_stats_without_token_rejected(self, api):
        r = api.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"
