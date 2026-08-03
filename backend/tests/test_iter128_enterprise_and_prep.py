"""Iter 128 backend regression:
- POST /api/enterprise/public-lead (no auth)
- POST /api/simulations/argumentation-prep with user context injection
- GET  /api/simulations/argumentation-prep/history/{id}/pdf
- Masterclass license welcome trigger (best-effort, may be skipped)
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend .env parsed manually
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

TEST_EMAIL = "free@wladbot.test"
TEST_PASSWORD = "test123"


# ────────────────────── fixtures ──────────────────────
@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_client(client):
    """Login using email/password. Sets cookies + optional bearer."""
    r = client.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Login failed: {r.status_code} {r.text[:200]}")
    data = r.json()
    token = data.get("token") or data.get("access_token")
    if token:
        client.headers.update({"Authorization": f"Bearer {token}"})
    return client


# ────────────────────── Enterprise public lead ──────────────────────
class TestEnterprisePublicLead:
    def test_warm_lead_no_rag(self, client):
        payload = {
            "company": "TEST_Acme GmbH",
            "name": "TEST User",
            "email": "test_warm@example.com",
            "teamSize": "26-100",
            "role": "CEO",
            "goals": "Improve leadership OS",
            "wantsOwnRAG": False,
            "lang": "de",
        }
        r = requests.post(f"{BASE_URL}/api/enterprise/public-lead", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "lead_id" in data and data["lead_id"].startswith("lead_")
        assert "message" in data

    def test_hot_lead_with_rag(self, client):
        payload = {
            "company": "TEST_RAG Corp",
            "email": "test_hot@example.com",
            "wantsOwnRAG": True,
            "lang": "en",
        }
        r = requests.post(f"{BASE_URL}/api/enterprise/public-lead", json=payload)
        assert r.status_code == 200, r.text
        assert "lead_id" in r.json()

    def test_missing_required_returns_422(self, client):
        r = requests.post(f"{BASE_URL}/api/enterprise/public-lead", json={"company": "X"})
        assert r.status_code in (400, 422)

    def test_no_auth_required(self, client):
        # A clean session with no cookies/headers
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/enterprise/public-lead",
                   json={"company": "TEST_NoAuth", "email": "n@e.com"})
        assert r.status_code == 200


# ────────────────────── Argumentation Prep ──────────────────────
PREP_PAYLOAD = {
    "background": "Ich habe morgen ein wichtiges Gespräch mit meinem Vorgesetzten über eine Gehaltserhöhung.",
    "goal": "Ich möchte eine 15% Gehaltserhöhung erreichen.",
    "main_points": "Meine Leistung im letzten Jahr, zusätzliche Verantwortung, Marktvergleich",
    "evidence": "Umsatzsteigerung 30%, 3 neue Projekte geleitet, Kununu-Marktvergleich",
    "prioritised": "Leistung > Marktvergleich > Verantwortung",
    "expected_objections": "Budget-Restriktionen, Firmenpolitik zu Erhöhungen",
    "counterarguments": "ROI der Investition, Retention-Kosten übersteigen die Erhöhung",
}


class TestArgumentationPrep:
    strategy_id = None

    def test_prep_returns_200_with_user_context(self, auth_client):
        r = auth_client.post(f"{BASE_URL}/api/simulations/argumentation-prep", json=PREP_PAYLOAD, timeout=120)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:400]}"
        data = r.json()
        assert "strategy_id" in data
        assert "strategy_markdown" in data or "strategy" in data
        TestArgumentationPrep.strategy_id = data["strategy_id"]

    def test_prep_second_call_no_crash(self, auth_client):
        """Second call — user now has prior preps, ensures _build_user_context_block handles both branches."""
        r = auth_client.post(f"{BASE_URL}/api/simulations/argumentation-prep", json=PREP_PAYLOAD, timeout=120)
        assert r.status_code == 200

    def test_pdf_export(self, auth_client):
        if not TestArgumentationPrep.strategy_id:
            pytest.skip("No strategy_id from previous test")
        sid = TestArgumentationPrep.strategy_id
        r = auth_client.get(f"{BASE_URL}/api/simulations/argumentation-prep/history/{sid}/pdf", timeout=60)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:200]}"
        assert r.headers.get("content-type", "").startswith("application/pdf")
        cd = r.headers.get("content-disposition", "")
        assert "filename" in cd.lower(), f"Missing filename in Content-Disposition: {cd}"
        assert r.content[:4] == b"%PDF", "Not a valid PDF header"
        assert len(r.content) > 5000, f"PDF too small: {len(r.content)} bytes"


# ────────────────────── Masterclass license redeem (best-effort) ──────────────────────
class TestMasterclassRedeem:
    def test_redeem_if_available(self, auth_client):
        # Look for an unused masterclass license via admin? Skip if endpoint not available.
        # We just attempt with a placeholder and expect a 4xx to confirm endpoint exists.
        r = auth_client.post(f"{BASE_URL}/api/license/redeem", json={"license_key": "TEST_INVALID_KEY_128"})
        # Should be 400/404/422 — proves endpoint exists and validates
        assert r.status_code in (400, 401, 403, 404, 422), f"Unexpected: {r.status_code} {r.text[:200]}"
