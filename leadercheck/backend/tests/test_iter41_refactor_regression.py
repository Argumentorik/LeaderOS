"""Iteration 41 — regression suite for the mechanical refactoring of
routes/auth.py, routes/payments.py, routes/email.py, routes/admin.py.

Behaviour must be IDENTICAL to before the refactor.
Rate limits respected: quick-login/request 5/min, user/create 10/min,
quiz/generate-report 6/min, admin/login 5 tries / 15 min lockout.
"""
import os
import time
import uuid

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_PASSWORD = "wladhub2026"
TEST_EMAIL = "start@aiporate.com"

CATS = ["kommunikation", "entscheidung", "empathie", "vision", "resilienz"]
LAYERS = ["ich", "team", "system"]


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(client):
    r = client.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"admin login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("token")
    assert isinstance(tok, str) and len(tok) > 20
    return tok


# ---------------- health ----------------
class TestHealth:
    def test_health(self, client):
        r = client.get(f"{API}/health", timeout=30)
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"


# ---------------- auth.py refactor ----------------
class TestAuthRefactor:
    def test_otp_request_valid_email(self, client):
        r = client.post(f"{API}/auth/quick-login/request", json={"email": TEST_EMAIL}, timeout=45)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d.get("status") == "otp_sent_if_registered"
        assert d.get("masked_email") == "st***@aiporate.com"
        # no PII / session leak
        for leak in ("session_id", "user_id", "name", "phone"):
            assert leak not in d

    def test_otp_request_invalid_email(self, client):
        r = client.post(f"{API}/auth/quick-login/request", json={"email": "notanemail"}, timeout=30)
        assert r.status_code == 400, r.text[:300]

    def test_otp_request_non_string(self, client):
        r = client.post(f"{API}/auth/quick-login/request", json={"email": 12345}, timeout=30)
        assert r.status_code == 400, r.text[:300]

    def test_otp_verify_wrong_code(self, client):
        r = client.post(f"{API}/auth/quick-login/verify", json={"email": TEST_EMAIL, "code": "000000"}, timeout=30)
        assert r.status_code == 401, r.text[:300]
        assert "Falscher Code" in r.json().get("detail", "")

    def test_otp_verify_missing_fields(self, client):
        r = client.post(f"{API}/auth/quick-login/verify", json={"email": TEST_EMAIL}, timeout=30)
        assert r.status_code == 400, r.text[:300]

    def test_legacy_quick_login_no_session_leak(self, client):
        r = client.post(f"{API}/auth/quick-login", json={"identifier": TEST_EMAIL}, timeout=45)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "masked_email" in d
        assert "session_id" not in d
        assert "user_id" not in d

    def test_auth_me_unauthenticated(self, client):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_leader_os_sync_unauthenticated(self, client):
        r = requests.post(f"{API}/auth/leader-os-sync", json={}, timeout=30)
        assert r.status_code == 401

    def test_privacy_policy(self, client):
        r = client.get(f"{API}/privacy-policy", timeout=30)
        assert r.status_code == 200
        body = r.text
        assert len(body) > 200
        assert any(k in body for k in ("Datenschutz", "personenbezogen", "DSGVO"))


# ---------------- admin.py refactor ----------------
class TestAdminRefactor:
    ENDPOINTS = ["/admin/stats", "/admin/users", "/admin/transactions", "/admin/emails"]

    @pytest.mark.parametrize("path", ENDPOINTS + ["/admin/funnel-chart?days=7"])
    def test_requires_token(self, client, path):
        r = requests.get(f"{API}{path}", timeout=30)
        assert r.status_code in (401, 403), f"{path} -> {r.status_code}"

    @pytest.mark.parametrize("path", ENDPOINTS)
    def test_with_token(self, client, admin_token, path):
        r = requests.get(f"{API}{path}", headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"
        assert isinstance(r.json(), (dict, list))

    def test_funnel_chart_structure(self, admin_token):
        r = requests.get(f"{API}/admin/funnel-chart?days=7",
                         headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for key in ("series", "totals", "rates", "days"):
            assert key in d, f"missing {key} in funnel-chart response: {list(d.keys())}"
        assert d["days"] == 7
        assert isinstance(d["series"], list)
        assert len(d["series"]) == 7
        assert isinstance(d["totals"], dict) and isinstance(d["rates"], dict)

    def test_bad_token_rejected(self):
        r = requests.get(f"{API}/admin/stats", headers={"Authorization": "Bearer not.a.token"}, timeout=30)
        assert r.status_code in (401, 403)


# ---------------- payments.py refactor ----------------
class TestPaymentsRefactor:
    def test_status_unknown_session(self, client):
        r = client.get(f"{API}/payments/status/does-not-exist-{uuid.uuid4().hex[:8]}", timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("payment_status") == "unknown"

    def test_webhook_without_signature_failsafe(self, client):
        r = client.post(f"{API}/webhook/stripe", data="{}", headers={"Content-Type": "application/json"}, timeout=30)
        assert r.status_code in (400, 503), f"expected fail-safe, got {r.status_code}: {r.text[:200]}"

    def test_license_validate_fake(self, client):
        r = client.get(f"{API}/license/validate/FAKE-KEY", timeout=30)
        assert r.status_code == 200, r.text[:200]
        assert r.json().get("valid") is False

    def test_license_create_requires_admin(self, client):
        r = requests.post(f"{API}/license/create", json={"plan": "sprint", "email": "TEST_x@example.com"}, timeout=30)
        assert r.status_code in (401, 403)

    def test_license_list_requires_admin(self):
        r = requests.get(f"{API}/license/list", timeout=30)
        assert r.status_code in (401, 403)


# ---------------- email.py refactor ----------------
class TestEmailRefactor:
    def test_send_report_unknown_session(self, client):
        r = client.post(f"{API}/email/send-report", json={"session_id": f"nope-{uuid.uuid4().hex[:8]}"}, timeout=45)
        assert r.status_code == 404, r.text[:300]
        assert "Report not found" in r.json().get("detail", "")

    def test_send_plan_reminder_unknown_session(self, client):
        r = client.post(f"{API}/email/send-plan-reminder", json={"session_id": f"nope-{uuid.uuid4().hex[:8]}"}, timeout=45)
        assert r.status_code == 404, r.text[:300]
        assert "User not found" in r.json().get("detail", "")

    def test_drip_preview_unknown_slug(self, client):
        r = client.get(f"{API}/email/drip-preview?slug=unknown", timeout=30)
        assert r.status_code == 404, r.text[:300]


# ---------------- Quiz E2E with 20 answers ----------------
def _answers(n=20):
    out = []
    for i in range(n):
        out.append({
            "question_id": f"q{i + 1}",
            "category": CATS[i % len(CATS)],
            "layer": LAYERS[i % len(LAYERS)],
            "score": (i % 5) + 1,
        })
    return out


class TestQuizE2E:
    def test_user_create_and_report_20_answers(self, client):
        email = f"TEST_iter41_{uuid.uuid4().hex[:8]}@example.com"
        r = client.post(f"{API}/user/create", json={
            "name": "TEST Iter41",
            "email": email,
            "phone": "+4915112345678",
            "role": "ceo",
            "consent_privacy": True,
        }, timeout=45)
        if r.status_code == 429:
            pytest.skip("rate limited on /user/create")
        assert r.status_code == 200, r.text[:300]
        sid = r.json().get("session_id")
        assert isinstance(sid, str) and sid

        rep = None
        for attempt in range(2):
            rep = client.post(f"{API}/quiz/generate-report",
                              json={"session_id": sid, "answers": _answers(20)}, timeout=120)
            if rep.status_code == 429:
                time.sleep(20)
                continue
            break
        assert rep.status_code == 200, rep.text[:400]
        d = rep.json()
        for key in ("cat_scores", "layer_scores", "avg_total", "leadership_roles",
                    "narrative", "report_token", "sync_token"):
            assert key in d, f"missing {key}"
        assert len(d["answers_raw"]) == 20
        assert isinstance(d["avg_total"], (int, float)) and 0 < d["avg_total"] <= 100
        assert len(d["leadership_roles"]) == 6
        assert isinstance(d["narrative"], dict) and len(str(d["narrative"])) > 50
        assert "_id" not in d

        # report fetch requires the signed token
        g = client.get(f"{API}/report/{sid}", timeout=30)
        assert g.status_code == 401
        g = client.get(f"{API}/report/{sid}",
                       headers={"Authorization": f"Bearer {d['report_token']}"}, timeout=30)
        assert g.status_code == 200
        assert g.json().get("session_id") == sid

    def test_user_create_missing_phone_rejected(self, client):
        r = client.post(f"{API}/user/create", json={
            "name": "TEST NoPhone", "email": f"TEST_np_{uuid.uuid4().hex[:6]}@example.com", "role": "ceo"
        }, timeout=30)
        if r.status_code == 429:
            pytest.skip("rate limited")
        assert r.status_code == 422, r.text[:200]
