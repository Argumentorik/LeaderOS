"""Iteration 29 — Sprint/Plus-Plus rebrand + 4447→4797 price update.

Covers:
  - PACKAGES & PLAN_AMOUNT_MAP have leader_os_plus=4797.0 (regression)
  - POST /api/payments/create-checkout for leader_os_full (997)
  - POST /api/payments/create-checkout for leader_os_plus (4797, NOT 4447)
  - POST /api/payments/create-checkout for leader_os_plus_3rate (subscription, total 4797, 3 cycles)
  - License key activation produces LEADEROS- format + redirect_url=https://leaderos.de
"""
import os
import re
import sys
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

# Load backend .env so MONGO_URL/DB_NAME are present
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.pricing import PACKAGES, PLAN_AMOUNT_MAP  # noqa: E402

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    fe_env = Path("/app/frontend/.env").read_text()
    for line in fe_env.splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Unit-style: pricing constants regression ---

class TestPricingConstants:
    def test_plus_amount_is_4797(self):
        assert PACKAGES["leader_os_plus"]["amount"] == 4797.0, (
            f"leader_os_plus amount regressed: {PACKAGES['leader_os_plus']['amount']}"
        )

    def test_plus_3rate_subscription_total_4797_cycles_3(self):
        p = PACKAGES["leader_os_plus_3rate"]
        assert p["amount"] == 1599.0
        assert p["total_amount"] == 4797.0
        assert p["cycles"] == 3
        assert p["mode"] == "subscription"
        assert p["plan"] == "leader_os_plus"

    def test_plan_amount_map_leader_os_plus_is_4797(self):
        assert PLAN_AMOUNT_MAP["leader_os_plus"] == 4797.0

    def test_no_4447_anywhere_in_packages(self):
        # Defensive: 4447 was the OLD price, must be wiped
        for pkg_id, pkg in PACKAGES.items():
            for k in ("amount", "total_amount"):
                v = pkg.get(k)
                if v is not None:
                    assert v != 4447.0, f"{pkg_id}.{k} still 4447!"

    def test_sprint_amount_is_997(self):
        assert PACKAGES["leader_os_full"]["amount"] == 997.0
        assert PLAN_AMOUNT_MAP["leader_os"] == 997.0


# --- Integration: /api/payments/create-checkout ---

class TestCheckout:
    def _create(self, session, package_id):
        payload = {
            "package_id": package_id,
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            "email": f"TEST_iter29_{package_id}@example.com",
            "user_name": "TEST Iter29",
        }
        r = session.post(f"{BASE_URL}/api/payments/create-checkout", json=payload, timeout=30)
        return r

    def test_leader_os_full_returns_stripe_url(self, session):
        r = self._create(session, "leader_os_full")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["url"].startswith("https://checkout.stripe.com"), data["url"]
        # Verify amount persisted = 997
        sid = data["session_id"]
        tx = session.get(f"{BASE_URL}/api/payments/status/{sid}", timeout=20).json()
        assert float(tx.get("amount") or tx.get("total_amount")) == pytest.approx(997.0, abs=0.01), tx

    def test_leader_os_plus_returns_stripe_url_with_4797(self, session):
        r = self._create(session, "leader_os_plus")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["url"].startswith("https://checkout.stripe.com"), data["url"]
        sid = data["session_id"]
        tx = session.get(f"{BASE_URL}/api/payments/status/{sid}", timeout=20).json()
        actual = float(tx.get("amount") or tx.get("total_amount"))
        assert actual == pytest.approx(4797.0, abs=0.01), (
            f"Expected 4797.0 EUR for leader_os_plus; got {actual}. "
            f"If 4447 — old price regressed. If 479700 — *100 cents bug."
        )

    def test_leader_os_plus_3rate_subscription_or_fallback(self, session):
        """In dev (sk_test_emergent placeholder) this falls back to one-time payment
        with charge_amount=total_amount=4797. In prod with real Stripe key, it
        becomes a real subscription with 3 cycles × 1599.
        """
        r = self._create(session, "leader_os_plus_3rate")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["url"].startswith("https://checkout.stripe.com"), data["url"]
        assert data["mode"] in ("subscription", "payment")
        sid = data["session_id"]
        tx = session.get(f"{BASE_URL}/api/payments/status/{sid}", timeout=20).json()
        if tx.get("mode") == "subscription":
            assert float(tx["total_amount"]) == pytest.approx(4797.0, abs=0.01)
            assert int(tx["cycles"]) == 3
            assert float(tx["amount"]) == pytest.approx(1599.0, abs=0.01)
        else:
            # Fallback: one-time of full 4797
            actual = float(tx.get("amount") or tx.get("total_amount"))
            assert actual == pytest.approx(4797.0, abs=0.01), tx

    def test_unknown_package_400(self, session):
        r = session.post(
            f"{BASE_URL}/api/payments/create-checkout",
            json={"package_id": "TEST_unknown", "origin_url": "https://x.com"},
            timeout=15,
        )
        assert r.status_code == 400


# --- License key activation: LEADEROS- format + redirect ---

class TestLicenseKeyActivation:
    def test_create_then_activate_returns_leaderos_format_and_redirect(self, session):
        # Create a fresh key
        r = session.post(
            f"{BASE_URL}/api/license/create",
            json={"plan": "leader_os", "email": "TEST_iter29_lic@example.com", "name": "TEST Iter29"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        key = r.json()["key"]
        assert re.match(r"^LEADEROS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$", key), key

        # Activate
        r2 = session.post(
            f"{BASE_URL}/api/license/activate",
            json={"license_key": key, "email": "TEST_iter29_lic@example.com"},
            timeout=15,
        )
        assert r2.status_code == 200, r2.text
        data = r2.json()
        assert data["success"] is True
        assert data["plan"] == "leader_os"
        assert data["redirect_url"] == "https://leaderos.de"

        # Revoke (cleanup)
        session.post(f"{BASE_URL}/api/license/revoke/{key}", timeout=15)
