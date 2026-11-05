"""
Iteration 23 — WLADHUB Pricing Overhaul Backend Tests
- Enterprise discount calculator (calc + inquire + list)
- New PACKAGES (leader_os_full, leader_os_2rate, leader_os_12rate, leader_os_plus)
- Stripe checkout session creation for each
"""
import os
import time
import pytest
import requests

_url = os.environ.get("REACT_APP_BACKEND_URL")
if not _url:
    # Fallback: read from frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    _url = line.split("=", 1)[1].strip()
                    break
    except Exception:
        pass
BASE_URL = (_url or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Enterprise calculator ----------
class TestEnterpriseCalculator:
    @pytest.mark.parametrize("emp,expected_pct", [
        (1, 0), (4, 0), (5, 10), (9, 10),
        (10, 15), (19, 15), (20, 20), (49, 20),
        (50, 30), (99, 30), (100, 40), (199, 40),
        (200, 50), (250, 50), (1000, 50),
    ])
    def test_discount_tiers(self, client, emp, expected_pct):
        r = client.get(f"{API}/enterprise/calculate", params={"employees": emp})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["seats"] == emp
        assert data["discount_pct"] == expected_pct
        assert data["seat_price_full"] == 997.0
        assert data["per_seat"] == round(997.0 * (1 - expected_pct / 100), 2)
        assert data["total"] == round(data["per_seat"] * emp, 2)

    def test_invalid_employees_zero(self, client):
        r = client.get(f"{API}/enterprise/calculate", params={"employees": 0})
        assert r.status_code == 400


# ---------- Enterprise Inquiry ----------
class TestEnterpriseInquiry:
    def test_inquire_success_and_persist(self, client):
        payload = {
            "company": "TEST_AcmeCorp",
            "contact_name": "TEST Max Mustermann",
            "email": "test_acme@example.com",
            "employee_count": 50,
            "phone": "+49123",
            "message": "TEST inquiry from iter23",
            "include_coaching": True,
        }
        r = client.post(f"{API}/enterprise/inquire", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"]
        pricing = data["pricing"]
        assert pricing["discount_pct"] == 30
        assert pricing["per_seat"] == 697.9
        assert pricing["total"] == 697.9 * 50

        # Verify persisted via list endpoint
        time.sleep(0.5)
        lst = client.get(f"{API}/enterprise/list")
        assert lst.status_code == 200
        items = lst.json()["inquiries"]
        match = [i for i in items if i.get("company") == "TEST_AcmeCorp" and i.get("contact_name") == "TEST Max Mustermann"]
        assert len(match) >= 1
        m = match[0]
        assert m["employee_count"] == 50
        assert m["pricing"]["discount_pct"] == 30
        assert m["include_coaching"]

    def test_inquire_missing_fields(self, client):
        # Missing company → 422
        r = client.post(f"{API}/enterprise/inquire", json={"contact_name": "x", "email": "x@x.de", "employee_count": 5})
        assert r.status_code == 422

    def test_inquire_invalid_email(self, client):
        r = client.post(f"{API}/enterprise/inquire", json={
            "company": "X", "contact_name": "Y", "email": "not-an-email", "employee_count": 5
        })
        assert r.status_code == 422

    def test_inquire_zero_employees(self, client):
        r = client.post(f"{API}/enterprise/inquire", json={
            "company": "X", "contact_name": "Y", "email": "y@x.de", "employee_count": 0
        })
        assert r.status_code == 400


# ---------- Stripe checkout for new packages ----------
class TestPaymentCheckout:
    @pytest.mark.parametrize("package_id,expected_amount,expected_plan", [
        ("leader_os_full", 997.00, "leader_os"),
        ("leader_os_2rate", 1100.00, "leader_os"),
        ("leader_os_12rate", 1188.00, "leader_os"),
        ("leader_os_plus", 4797.00, "leader_os_plus"),
    ])
    def test_create_checkout(self, client, package_id, expected_amount, expected_plan):
        payload = {
            "package_id": package_id,
            "origin_url": BASE_URL,
            "email": f"test_{package_id}@example.com",
            "user_name": "TEST User",
        }
        r = client.post(f"{API}/payments/create-checkout", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and data["url"].startswith("https://")
        assert "stripe" in data["url"].lower() or "checkout" in data["url"].lower()
        assert "session_id" in data

        # Check transaction stored with right amount + plan
        sid = data["session_id"]
        time.sleep(0.5)
        st = client.get(f"{API}/payments/status/{sid}")
        assert st.status_code == 200
        tx = st.json()
        assert tx["amount"] == expected_amount
        assert tx["plan"] == expected_plan
        assert tx["package_id"] == package_id

    def test_unknown_package(self, client):
        r = client.post(f"{API}/payments/create-checkout", json={
            "package_id": "starter", "origin_url": BASE_URL
        })
        # Old "starter" must be removed → 400
        assert r.status_code == 400

    def test_old_fasttrack_removed(self, client):
        r = client.post(f"{API}/payments/create-checkout", json={
            "package_id": "fasttrack_yearly", "origin_url": BASE_URL
        })
        assert r.status_code == 400
