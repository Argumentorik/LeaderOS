"""Iter 134 — Go-Live gate: real Stripe invoice, 1€ live test, RAG coverage.

Run: REACT_APP_BACKEND_URL=<preview-url> pytest tests/test_iter134_golive.py -q
"""
import os
import pytest
import requests
import stripe

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"

ADMIN = {"email": "test@test.com", "password": "test123"}
CODE = "WLAD-1EURO-2026"
TEST_PKG = "leadership_os_1eur_test"


def _stripe_key():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    for line in open(env_path):
        if line.startswith("STRIPE_API_KEY="):
            return line.split("=", 1)[1].strip()
    return ""


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


class TestCheckoutInvoice:
    def test_test_package_needs_activation_code(self, auth):
        r = requests.post(f"{API}/payments/checkout", headers=auth, timeout=30,
                          json={"package_id": TEST_PKG, "origin_url": BASE_URL})
        assert r.status_code == 403

    def test_session_has_invoice_and_real_product_name(self, auth):
        r = requests.post(f"{API}/payments/checkout", headers=auth, timeout=60,
                          json={"package_id": TEST_PKG, "origin_url": BASE_URL, "discount_code": CODE})
        assert r.status_code == 200, r.text
        sid = r.json()["session_id"]
        assert r.json()["discounted_amount"] == 1.0

        stripe.api_key = _stripe_key()
        s = stripe.checkout.Session.retrieve(sid, expand=["line_items"])
        assert s.invoice_creation.enabled is True, "buyer would get no Stripe invoice"
        assert s.billing_address_collection == "required", "invoice needs a billing address"
        assert "Leadership OS" in s.line_items.data[0].description
        assert s.amount_total == 100 and s.currency == "eur"
        assert s.customer, "no Stripe customer → no invoice recipient"
        first_customer = s.customer

        # A second checkout must reuse the same Stripe customer (no duplicates).
        r2 = requests.post(f"{API}/payments/checkout", headers=auth, timeout=60,
                           json={"package_id": TEST_PKG, "origin_url": BASE_URL, "discount_code": CODE})
        s2 = stripe.checkout.Session.retrieve(r2.json()["session_id"])
        assert s2.customer == first_customer

        for x in (s.id, s2.id):
            try:
                stripe.checkout.Session.expire(x)
            except Exception:
                pass

    def test_status_exposes_package_and_invoice_fields(self, auth):
        r = requests.post(f"{API}/payments/checkout", headers=auth, timeout=60,
                          json={"package_id": TEST_PKG, "origin_url": BASE_URL, "discount_code": CODE})
        sid = r.json()["session_id"]
        st = requests.get(f"{API}/payments/checkout/status/{sid}", headers=auth, timeout=30)
        assert st.status_code == 200, st.text
        body = st.json()
        assert body["payment_status"] == "unpaid"
        assert body["package_name"] and body["tier"] == "standard"
        assert "invoice_url" in body and "invoice_number" in body
        stripe.api_key = _stripe_key()
        stripe.checkout.Session.expire(sid)
        # Cancelled/expired checkout must be reported as expired, never as paid.
        st2 = requests.get(f"{API}/payments/checkout/status/{sid}", headers=auth, timeout=30).json()
        assert st2["status"] == "expired" and st2["payment_status"] != "paid"


class TestLiveTestAdmin:
    def test_requires_admin(self):
        r = requests.get(f"{API}/admin/livetest/buyers", timeout=30)
        assert r.status_code in (401, 403)

    def test_unknown_email_is_rejected(self, auth):
        r = requests.post(f"{API}/admin/livetest/buyers", headers=auth, timeout=30,
                          json={"email": "does-not-exist-9df3@nowhere.test"})
        assert r.status_code == 404

    def test_add_list_remove(self, auth):
        mail = ADMIN["email"]
        assert requests.post(f"{API}/admin/livetest/buyers", headers=auth,
                             json={"email": mail}, timeout=30).status_code == 200
        listed = requests.get(f"{API}/admin/livetest/buyers", headers=auth, timeout=30).json()
        assert listed["activation_code"] == CODE
        assert mail in [b["email"] for b in listed["buyers"]]
        assert requests.delete(f"{API}/admin/livetest/buyers/{mail}", headers=auth,
                               timeout=30).status_code == 200


class TestRagCoverage:
    def test_whole_library_is_ingested(self, auth):
        r = requests.get(f"{API}/admin/rag/coverage", headers=auth, timeout=180)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["expected_files"] > 40
        assert d["missing"] == [], f"missing knowledge files: {d['missing']}"
        assert d["complete"] is True
        assert d["total_chunks"] > 5000
