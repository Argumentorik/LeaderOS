"""Iter 32 pre-LIVE-DEPLOY backend regression.

Focus:
- Resend LIVE-key: SENDER_EMAIL=wlad@leaderos.de must work, no 'API key is invalid'
- Stripe checkout sessions for leader_os_full, leader_os_plus, leader_os_plus_3rate
- Admin login + JWT + /api/admin/stats + /api/admin/users
"""
import os
import time
import requests
import subprocess

def _read_frontend_env():
    with open("/app/frontend/.env") as f:
        for ln in f:
            if ln.startswith("REACT_APP_BACKEND_URL="):
                return ln.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not found")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", _read_frontend_env()).rstrip("/")
ADMIN_PASSWORD = "wladhub2026"
TEST_EMAIL = "start@aiporate.com"


# ---------- Admin auth ----------
class TestAdminAuth:
    def test_admin_login_success(self):
        r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert isinstance(data.get("token"), str) and len(data["token"]) > 20
        assert data.get("expires_in_hours") == 8

    def test_admin_login_wrong_pwd(self):
        r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "WRONG"}, timeout=15)
        assert r.status_code == 401

    def _token(self):
        r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
        return r.json()["token"]

    def test_admin_stats_with_token(self):
        tok = self._token()
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        # Stats should have user counts etc - at least be a dict with content
        assert isinstance(data, dict) and len(data) > 0

    def test_admin_stats_no_token(self):
        r = requests.get(f"{BASE_URL}/api/admin/stats", timeout=15)
        assert r.status_code == 401

    def test_admin_users_with_token(self):
        tok = self._token()
        r = requests.get(f"{BASE_URL}/api/admin/users", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        # Should be a list or dict containing users
        assert data is not None


# ---------- Stripe payments ----------
class TestStripePayments:
    PRICE_IDS = ["leader_os_full", "leader_os_plus", "leader_os_plus_3rate"]

    def test_create_checkout_for_each_tier(self):
        for pid in self.PRICE_IDS:
            r = requests.post(
                f"{BASE_URL}/api/payments/create-checkout",
                json={
                    "package_id": pid,
                    "origin_url": "https://example.com",
                    "metadata": {"test": "iter32"},
                },
                timeout=20,
            )
            assert r.status_code == 200, f"{pid} -> {r.status_code} {r.text}"
            data = r.json()
            assert "url" in data and data["url"].startswith("https://"), f"{pid} missing url"


# ---------- Resend LIVE / quiz->drip enqueue ----------
class TestResendLiveAndDrip:
    def test_quiz_generate_report_triggers_email_no_invalid_key(self):
        """Submit user/create (welcome email) + quiz/generate-report (auto report email + drip enqueue)
        and verify no 'API key is invalid' shows in backend logs."""
        # Snapshot pre-request log size so we look at NEW lines only
        log_paths = ["/var/log/supervisor/backend.err.log", "/var/log/supervisor/backend.out.log"]
        pre_sizes = {}
        for p in log_paths:
            try:
                pre_sizes[p] = os.path.getsize(p)
            except OSError:
                pre_sizes[p] = 0

        # 1) Create user → triggers welcome email (Resend live)
        u_resp = requests.post(
            f"{BASE_URL}/api/user/create",
            json={
                "name": "TEST Iter32",
                "email": TEST_EMAIL,
                "phone": "+49 151 00000032",
                "role": "founder",
                "consent_privacy": True,
                "consent_marketing": True,
            },
            timeout=20,
        )
        assert u_resp.status_code == 200, u_resp.text
        session_id = u_resp.json()["session_id"]
        assert session_id

        # Give async welcome email task time to fire & log
        time.sleep(4)

        # 2) Submit quiz → generates report + auto-report email + 10-email drip
        answers = []
        for i in range(20):
            answers.append({
                "question_id": f"q{i+1}",
                "category": "Vision",
                "layer": "1",
                "score": 3,
            })
        payload = {"session_id": session_id, "answers": answers}
        r = requests.post(f"{BASE_URL}/api/quiz/generate-report", json=payload, timeout=90)
        assert r.status_code in (200, 201), f"{r.status_code} -> {r.text[:500]}"

        time.sleep(5)  # let report+drip emails fire

        # Read NEW backend log content since pre_sizes
        new_content = ""
        for p in log_paths:
            try:
                with open(p, "rb") as f:
                    f.seek(pre_sizes.get(p, 0))
                    new_content += f.read().decode("utf-8", errors="ignore")
            except OSError:
                pass

        # Persist for debugging
        with open("/tmp/iter32_backend_log_slice.txt", "w") as f:
            f.write(new_content)

        # CRITICAL assertion: Resend LIVE key is NOT invalid
        assert "API key is invalid" not in new_content, (
            "Resend reports invalid API key! Last 2KB:\n" + new_content[-2000:]
        )
        # Also assert no "Welcome email error" (was the iter30 symptom under old key)
        assert "Welcome email error" not in new_content, (
            "Welcome email error present:\n" + new_content[-2000:]
        )

        # Cleanup test data
        try:
            requests.post(f"{BASE_URL}/api/auth/logout", timeout=5)
        except Exception:
            pass

    def test_sender_email_env_is_leaderos_de(self):
        # Reflect by importing backend .env directly (safe-read)
        env_path = "/app/backend/.env"
        with open(env_path) as f:
            content = f.read()
        assert "SENDER_EMAIL=wlad@leaderos.de" in content, "SENDER_EMAIL not set to wlad@leaderos.de"
        # Key must be present and start with 're_'
        assert "RESEND_API_KEY=re_" in content
