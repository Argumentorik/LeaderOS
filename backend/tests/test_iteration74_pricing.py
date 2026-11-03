"""Iteration 74 — 3-tier pricing restructure + Enterprise quote/lead + downloads page regression."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://command-center-229.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def standard_token(session):
    r = session.post(f"{API}/auth/login", json={"email": "standard@wladbot.test", "password": "test123"})
    if r.status_code != 200:
        pytest.skip(f"login failed: {r.status_code} {r.text[:200]}")
    return r.json().get("token")


# ── Packages ──────────────────────────────────────────────────────────────
class TestPackages:
    def test_packages_contains_4_keys(self, session):
        r = session.get(f"{API}/payments/packages")
        assert r.status_code == 200
        data = r.json()
        ids = {p["id"] for p in data}
        expected = {"leadership_os", "leadership_os_2x", "leadership_os_12x", "leadership_os_plus"}
        assert expected.issubset(ids), f"missing: {expected - ids}, got: {ids}"
        # exactly 4 (no enterprise in PACKAGES — quote-based)
        assert len(data) == 4, f"expected 4 packages got {len(data)}: {ids}"

    def test_leadership_os_amount(self, session):
        r = session.get(f"{API}/payments/packages")
        pkgs = {p["id"]: p for p in r.json()}
        assert pkgs["leadership_os"]["amount"] == 997.00
        assert pkgs["leadership_os"]["currency"] == "eur"
        assert pkgs["leadership_os"]["billing"] == "one_time"
        assert pkgs["leadership_os"]["tier"] == "standard"

    def test_installment_amounts(self, session):
        r = session.get(f"{API}/payments/packages")
        pkgs = {p["id"]: p for p in r.json()}
        assert pkgs["leadership_os_2x"]["amount"] == 550.00
        assert pkgs["leadership_os_2x"]["installments_total"] == 2
        assert pkgs["leadership_os_12x"]["amount"] == 99.00
        assert pkgs["leadership_os_12x"]["installments_total"] == 12

    def test_plus_amount(self, session):
        r = session.get(f"{API}/payments/packages")
        pkgs = {p["id"]: p for p in r.json()}
        assert pkgs["leadership_os_plus"]["amount"] == 4797.00
        assert pkgs["leadership_os_plus"]["tier"] == "accelerator"


# ── Enterprise Quote ──────────────────────────────────────────────────────
class TestEnterpriseQuote:
    def test_quote_20_seats(self, session):
        r = session.post(f"{API}/payments/enterprise/quote", json={"seats": 20})
        assert r.status_code == 200, r.text
        d = r.json()
        # 997 * 0.80 = 797.60 per seat * 20 = 15952
        assert d["seats"] == 20
        assert d["discount_pct"] == 20
        assert d["total_price"] == 15952.0, f"got {d['total_price']}"
        assert d["total_savings"] == 3988.0, f"got {d['total_savings']}"
        assert d["base_price_per_seat"] == 997.00
        assert d["price_per_seat"] == 797.60

    def test_quote_200_seats_50pct(self, session):
        r = session.post(f"{API}/payments/enterprise/quote", json={"seats": 200})
        assert r.status_code == 200
        d = r.json()
        assert d["discount_pct"] == 50
        assert d["price_per_seat"] == 498.50
        assert d["total_price"] == 99700.0

    def test_quote_seats_zero_400(self, session):
        r = session.post(f"{API}/payments/enterprise/quote", json={"seats": 0})
        assert r.status_code == 400

    def test_quote_seats_too_high_400(self, session):
        r = session.post(f"{API}/payments/enterprise/quote", json={"seats": 10001})
        assert r.status_code == 400

    def test_quote_volume_tiers(self, session):
        # Tier boundaries
        cases = [(1, 0), (4, 0), (5, 10), (10, 15), (20, 20), (50, 30), (100, 40), (200, 50)]
        for seats, expected_pct in cases:
            r = session.post(f"{API}/payments/enterprise/quote", json={"seats": seats})
            assert r.status_code == 200
            assert r.json()["discount_pct"] == expected_pct, f"seats={seats}: expected {expected_pct}, got {r.json()['discount_pct']}"


# ── Enterprise Lead ──────────────────────────────────────────────────────
class TestEnterpriseLead:
    def test_lead_create(self, session):
        payload = {
            "company": "TEST_AcmeCorp",
            "contact_name": "TEST Anna Schmidt",
            "contact_email": "test_anna@acme.test",
            "seats": 25,
            "phone": "+49123",
            "message": "Interesse an Demo",
        }
        r = session.post(f"{API}/payments/enterprise/lead", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("lead_id", "").startswith("lead_")
        assert d["status"] == "received"
        assert d["quote"]["seats"] == 25
        assert d["quote"]["discount_pct"] == 20  # 20-50 tier

    def test_lead_missing_required_fields(self, session):
        # missing contact_email
        r = session.post(f"{API}/payments/enterprise/lead", json={"company": "X", "contact_name": "Y", "seats": 5})
        assert r.status_code == 422

    def test_lead_seats_zero(self, session):
        r = session.post(f"{API}/payments/enterprise/lead", json={
            "company": "X", "contact_name": "Y", "contact_email": "z@a.com", "seats": 0
        })
        assert r.status_code == 400


# ── Checkout (new package_id) ────────────────────────────────────────────
class TestCheckout:
    def test_checkout_leadership_os(self, session, standard_token):
        session.headers["Authorization"] = f"Bearer {standard_token}"
        r = session.post(f"{API}/payments/checkout", json={
            "package_id": "leadership_os",
            "origin_url": BASE_URL,
        })
        del session.headers["Authorization"]
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d
        assert d["url"].startswith("https://"), d
        assert "session_id" in d


# ── Tier Regression ──────────────────────────────────────────────────────
class TestTierRegression:
    def test_user_tier_standard(self, session, standard_token):
        session.headers["Authorization"] = f"Bearer {standard_token}"
        r = session.get(f"{API}/user/tier")
        del session.headers["Authorization"]
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["raw_tier"] == "standard"
        assert d["tier_name"] == "Leadership OS"
        assert "features" in d

    def test_tiers_endpoint(self, session):
        r = session.get(f"{API}/payments/tiers")
        assert r.status_code == 200
        ids = {t["id"] for t in r.json()}
        assert {"free", "standard", "accelerator", "enterprise"}.issubset(ids)


# ── Health regression ────────────────────────────────────────────────────
class TestHealth:
    def test_health(self, session):
        r = session.get(f"{API}/")
        # Either the root or /api/ gives 200 on most apps
        assert r.status_code in (200, 404)

    def test_events_list(self, session):
        r = session.get(f"{API}/events")
        assert r.status_code in (200, 401), r.text
