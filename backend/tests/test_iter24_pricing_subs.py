"""Iteration 24 — Stripe subscription wiring + legacy cleanup tests.

Covers:
- PACKAGES dict integrity (5 keys, no starter/fasttrack)
- create-checkout for all 4 active packages (fallback path in Emergent test env)
- /payments/status persistence
- /license/create for new plans
- /booking/create default plan = leader_os_plus
- Enterprise calc + inquiry
"""
import os
import time
import pytest
import requests

def _read_frontend_env_url():
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip()
    except Exception:
        return None
    return None

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _read_frontend_env_url() or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"
ORIGIN = BASE_URL


@pytest.fixture
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# --- PACKAGES integrity (via create-checkout responses) ---

class TestPackagesIntegrity:
    def test_starter_rejected(self, s):
        r = s.post(f"{API}/payments/create-checkout", json={"package_id": "starter", "origin_url": ORIGIN})
        assert r.status_code == 400, r.text

    def test_fasttrack_rejected(self, s):
        r = s.post(f"{API}/payments/create-checkout", json={"package_id": "fasttrack", "origin_url": ORIGIN})
        assert r.status_code == 400, r.text

    def test_unknown_package_400(self, s):
        r = s.post(f"{API}/payments/create-checkout", json={"package_id": "bogus_xyz", "origin_url": ORIGIN})
        assert r.status_code == 400


# --- Checkout creation ---

class TestCheckoutEndpoints:
    def _checkout(self, s, pkg):
        return s.post(f"{API}/payments/create-checkout", json={
            "package_id": pkg,
            "origin_url": ORIGIN,
            "email": "TEST_iter24@example.com",
            "user_name": "TEST_Iter24",
        })

    def _status(self, s, sid):
        # backend may return tx doc directly
        return s.get(f"{API}/payments/status/{sid}")

    def test_leader_os_full(self, s):
        r = self._checkout(s, "leader_os_full")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["mode"] == "payment"
        sid = data["session_id"]
        time.sleep(0.5)
        st = self._status(s, sid).json()
        assert st.get("amount") == 997.0
        assert st.get("plan") == "leader_os"
        assert st.get("billing") == "one_time"
        assert st.get("fallback_from_subscription") in (False, None)

    def test_leader_os_2rate_fallback(self, s):
        r = self._checkout(s, "leader_os_2rate")
        assert r.status_code == 200, r.text
        data = r.json()
        # In Emergent test env (sk_test_emergent placeholder) we expect fallback to one-time payment
        assert data["mode"] == "payment"
        sid = data["session_id"]
        time.sleep(0.5)
        st = self._status(s, sid).json()
        assert st.get("amount") == 1100.0  # charge_amount = total_amount
        assert st.get("plan") == "leader_os"
        assert st.get("billing") == "2_rates"
        assert st.get("fallback_from_subscription")

    def test_leader_os_12rate_fallback(self, s):
        r = self._checkout(s, "leader_os_12rate")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["mode"] == "payment"
        sid = data["session_id"]
        time.sleep(0.5)
        st = self._status(s, sid).json()
        assert st.get("amount") == 1188.0
        assert st.get("plan") == "leader_os"
        assert st.get("billing") == "12_rates"
        assert st.get("fallback_from_subscription")

    def test_leader_os_plus(self, s):
        r = self._checkout(s, "leader_os_plus")
        assert r.status_code == 200
        data = r.json()
        assert data["mode"] == "payment"
        sid = data["session_id"]
        time.sleep(0.5)
        st = self._status(s, sid).json()
        assert st.get("amount") == 4797.0
        assert st.get("plan") == "leader_os_plus"

    def test_standard_yearly_legacy_alias(self, s):
        r = self._checkout(s, "standard_yearly")
        assert r.status_code == 200
        data = r.json()
        assert data["mode"] == "payment"


# --- License key plans ---

class TestLicenseKeyPlans:
    def test_create_leader_os(self, s):
        r = s.post(f"{API}/license/create", json={"plan": "leader_os", "name": "TEST_K1", "notes": "iter24"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["plan"] == "leader_os"
        assert data["status"] == "active"
        assert data["key"].startswith("WLAD-")

    def test_create_leader_os_plus(self, s):
        r = s.post(f"{API}/license/create", json={"plan": "leader_os_plus", "name": "TEST_K2"})
        assert r.status_code == 200
        assert r.json()["plan"] == "leader_os_plus"

    def test_create_leader_os_enterprise(self, s):
        r = s.post(f"{API}/license/create", json={"plan": "leader_os_enterprise", "name": "TEST_K3"})
        assert r.status_code == 200
        assert r.json()["plan"] == "leader_os_enterprise"


# --- Booking default plan ---

class TestBookingDefault:
    def test_booking_create_default_plan(self, s):
        # No plan in payload — backend default should be leader_os_plus
        unique_email = f"TEST_iter24_booking_{int(time.time())}@example.com"
        r = s.post(f"{API}/booking/create", json={
            "name": "TEST_iter24_booking",
            "email": unique_email,
            "date": "2026-02-01",
            "time": "10:00",
        })
        assert r.status_code == 200, r.text
        # Verify plan persisted via /booking/list
        lr = s.get(f"{API}/booking/list")
        assert lr.status_code == 200
        bookings = lr.json().get("bookings", [])
        match = next((b for b in bookings if b.get("email") == unique_email), None)
        assert match is not None, f"Booking with email {unique_email} not found"
        assert match.get("plan") == "leader_os_plus", f"Default plan should be leader_os_plus, got {match.get('plan')}"


# --- Enterprise ---

class TestEnterprise:
    def test_calculate_5_employees(self, s):
        r = s.get(f"{API}/enterprise/calculate", params={"employees": 5})
        assert r.status_code == 200
        data = r.json()
        assert data["discount_pct"] == 10
        assert data["seats"] == 5

    def test_calculate_50_employees(self, s):
        r = s.get(f"{API}/enterprise/calculate", params={"employees": 50})
        assert r.status_code == 200
        data = r.json()
        assert data["discount_pct"] == 30
        assert abs(data["per_seat"] - 697.90) < 0.01
        assert abs(data["total"] - 34895.00) < 0.5

    def test_inquiry_create(self, s):
        r = s.post(f"{API}/enterprise/inquire", json={
            "company": "TEST_Iter24 GmbH",
            "contact_name": "TEST_iter24",
            "email": "TEST_iter24_ent@example.com",
            "phone": "+49000",
            "employee_count": 25,
            "include_coaching": False,
            "message": "iter24 regression",
        })
        assert r.status_code in (200, 201), r.text
