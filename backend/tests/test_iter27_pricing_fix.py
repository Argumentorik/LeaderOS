"""Iteration 27 — Verify pricing fix in /api/payments/create-checkout.

Bug from iter26: emergentintegrations.CheckoutSessionRequest expects amount in
EUR (major units), but code was multiplying by 100. The fix uses
amount=round(float(charge_amount), 2). This test suite:
  1. Calls create-checkout for all 4 packages.
  2. Asserts DB tx records show amount/total_amount in EUR (not cents).
  3. Verifies UserCreate.phone min_length=6 validation.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    from pathlib import Path
    fe_env = Path('/app/frontend/.env').read_text()
    for line in fe_env.splitlines():
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip().rstrip('/')


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Pricing fix: /api/payments/create-checkout ---

PACKAGE_EXPECTATIONS = [
    # package_id, expected charge amount (EUR major units), mode
    ("leader_os_full",   997.0,  "payment"),
    ("leader_os_plus",   4447.0, "payment"),
    ("leader_os_2rate",  1100.0, "payment"),   # falls back to one-time in dev (no real stripe key)
    ("leader_os_12rate", 1188.0, "payment"),
]


class TestPricingFix:
    @pytest.mark.parametrize("package_id,expected_amount,expected_mode", PACKAGE_EXPECTATIONS)
    def test_create_checkout_returns_url_and_correct_amount(self, session, package_id, expected_amount, expected_mode):
        payload = {
            "package_id": package_id,
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            "email": f"TEST_iter27_{package_id}@example.com",
            "user_name": "TEST Iter27",
        }
        r = session.post(f"{BASE_URL}/api/payments/create-checkout", json=payload, timeout=30)
        assert r.status_code == 200, f"[{package_id}] {r.status_code}: {r.text}"
        data = r.json()
        assert "url" in data and data["url"].startswith("https://checkout.stripe.com"), data
        assert "session_id" in data

        # Fetch transaction status — verifies DB persisted EUR (not cents)
        sid = data["session_id"]
        s_r = session.get(f"{BASE_URL}/api/payments/status/{sid}", timeout=20)
        assert s_r.status_code == 200, s_r.text
        tx = s_r.json()
        # one-time → amount is the charge_amount; subscription → amount per cycle
        if tx.get("mode") == "subscription":
            actual = tx.get("total_amount") or tx.get("amount")
        else:
            actual = tx.get("amount") or tx.get("total_amount")
        assert actual is not None, f"[{package_id}] tx missing amount: {tx}"
        # CRITICAL assertion: stored amount should be in EUR (e.g., 997.0), not cents (99700)
        assert float(actual) == pytest.approx(expected_amount, abs=0.01), (
            f"[{package_id}] DB has {actual}, expected {expected_amount} EUR. "
            f"If you see {expected_amount*100}, the *100 multiplication bug is back!"
        )

    def test_unknown_package_returns_400(self, session):
        payload = {"package_id": "TEST_unknown_pkg", "origin_url": "https://x.com"}
        r = session.post(f"{BASE_URL}/api/payments/create-checkout", json=payload, timeout=15)
        assert r.status_code == 400


# --- Phone validation (min_length=6) ---

class TestPhoneValidation:
    def test_phone_empty_string_rejected(self, session):
        payload = {
            "name": "TEST_iter27_empty",
            "email": "test_iter27_empty@example.com",
            "phone": "",
            "role": "selbststaendige",
            "consent_privacy": True,
        }
        r = session.post(f"{BASE_URL}/api/user/create", json=payload, timeout=15)
        assert r.status_code == 422, f"empty phone should be rejected, got {r.status_code}: {r.text}"
        assert "phone" in r.text.lower()

    def test_phone_too_short_rejected(self, session):
        payload = {
            "name": "TEST_iter27_short",
            "email": "test_iter27_short@example.com",
            "phone": "123",
            "role": "selbststaendige",
            "consent_privacy": True,
        }
        r = session.post(f"{BASE_URL}/api/user/create", json=payload, timeout=15)
        assert r.status_code == 422, f"3-char phone should be rejected, got {r.status_code}: {r.text}"
        assert "phone" in r.text.lower()

    def test_phone_valid_accepted(self, session):
        payload = {
            "name": "TEST_iter27_valid",
            "email": "test_iter27_valid@example.com",
            "phone": "+49 151 1234 5678",
            "role": "senior_manager",
            "consent_privacy": True,
        }
        r = session.post(f"{BASE_URL}/api/user/create", json=payload, timeout=15)
        assert r.status_code == 200, f"valid phone should pass, got {r.status_code}: {r.text}"
        data = r.json()
        assert "session_id" in data
        assert data["email"] == payload["email"]
