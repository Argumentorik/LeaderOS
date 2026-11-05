"""
Iteration 28 — LeaderOS Rebrand Tests
Covers:
  - GET /api/health service rename to 'Leader OS Leadership Diagnose'
  - POST /api/auth/quick-login (validation, email lookup, phone last-8 match)
  - License key generator outputs LEADEROS- prefix
  - Stripe checkout regression after rebrand
  - Resend 'from' fields contain Leader OS branding (no WLADHUB literal)
"""
import os
import re
import uuid
import asyncio
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load backend .env so MONGO_URL/DB_NAME are available for the test process
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from services.license_keys import generate_key
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to internal for sanity; tests must use the public URL though
    BASE_URL = "http://localhost:8001"


# ---------- Module: health endpoint ----------
class TestHealth:
    def test_health_returns_leader_os_service_name(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "healthy"
        assert data.get("service") == "Leader OS Leadership Diagnose"
        assert "WLADHUB" not in str(data)


# ---------- Module: license key generator ----------
class TestLicenseKey:
    def test_license_key_has_leaderos_prefix(self):
        k = generate_key()
        assert re.match(r"^LEADEROS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$", k), f"bad key: {k}"

    def test_license_key_is_unique(self):
        keys = {generate_key() for _ in range(20)}
        assert len(keys) == 20


# ---------- Module: quick-login endpoint ----------
@pytest.fixture(scope="module")
def seeded_user():
    """Insert a TEST_ user with both email and phone for quick-login tests."""
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    user_id = f"user_TEST_{uuid.uuid4().hex[:8]}"
    session_id = f"sess_TEST_{uuid.uuid4().hex[:8]}"
    email = f"test_iter28_{uuid.uuid4().hex[:6]}@example.com"
    # phone with country code + spaces; last 8 digits are 11223344
    phone = "+49 151 11223344"

    doc = {
        "user_id": user_id,
        "session_id": session_id,
        "email": email,
        "name": "TEST Iter28 User",
        "phone": phone,
        "role": "founder",
        "consent_privacy": True,
        "consent_marketing": False,
    }

    async def _setup():
        await db.users.insert_one(doc)

    async def _teardown():
        await db.users.delete_many({"user_id": user_id})
        await db.reports.delete_many({"session_id": {"$in": [user_id, session_id]}})

    asyncio.get_event_loop().run_until_complete(_setup())
    yield {"email": email, "phone": phone, "user_id": user_id, "session_id": session_id}
    asyncio.get_event_loop().run_until_complete(_teardown())
    client.close()


class TestQuickLogin:
    URL = f"{BASE_URL}/api/auth/quick-login"

    def test_missing_identifier_returns_400(self):
        r = requests.post(self.URL, json={"identifier": ""}, timeout=15)
        assert r.status_code == 400

    def test_no_payload_returns_400(self):
        r = requests.post(self.URL, json={}, timeout=15)
        assert r.status_code == 400

    def test_short_non_email_identifier_returns_400(self):
        # No '@' and fewer than 6 digits → must 400
        r = requests.post(self.URL, json={"identifier": "12345"}, timeout=15)
        assert r.status_code == 400

    def test_unknown_email_returns_404(self):
        r = requests.post(
            self.URL,
            json={"identifier": f"TEST_unknown_{uuid.uuid4().hex[:6]}@example.com"},
            timeout=15,
        )
        assert r.status_code == 404

    def test_unknown_phone_returns_404(self):
        r = requests.post(self.URL, json={"identifier": "+49 999 00000000"}, timeout=15)
        assert r.status_code == 404

    def test_known_email_returns_200_and_payload(self, seeded_user):
        r = requests.post(self.URL, json={"identifier": seeded_user["email"]}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == seeded_user["email"]
        assert data["user_id"] == seeded_user["user_id"]
        assert data["name"] == "TEST Iter28 User"
        assert data["phone"] == seeded_user["phone"]
        assert "session_id" in data and data["session_id"]
        assert isinstance(data["has_report"], bool)

    def test_email_lookup_is_case_insensitive(self, seeded_user):
        r = requests.post(
            self.URL, json={"identifier": seeded_user["email"].upper()}, timeout=15
        )
        assert r.status_code == 200, r.text
        assert r.json()["email"] == seeded_user["email"]

    def test_phone_full_match(self, seeded_user):
        r = requests.post(
            self.URL, json={"identifier": seeded_user["phone"]}, timeout=15
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user_id"] == seeded_user["user_id"]

    def test_phone_last_8_digits_match(self, seeded_user):
        # Just the last 8 digits "11223344"
        r = requests.post(self.URL, json={"identifier": "11223344"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user_id"] == seeded_user["user_id"]


# ---------- Module: Stripe regression (one-time checkout still works) ----------
class TestStripeCheckoutRegression:
    def test_create_checkout_session_leader_os(self):
        # Use the canonical endpoint name used by frontend
        r = requests.post(
            f"{BASE_URL}/api/payments/create-checkout",
            json={
                "package_id": "leader_os_full",
                "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            },
            timeout=30,
        )
        # endpoint may be 200 OR could be 404 if it's renamed — accept either and check
        # We'll keep it strict to 200 to flag regressions
        assert r.status_code == 200, f"status={r.status_code} body={r.text[:300]}"
        data = r.json()
        assert "url" in data or "checkout_url" in data
        # Ensure a Stripe URL is returned
        stripe_url = data.get("url") or data.get("checkout_url")
        assert "stripe.com" in stripe_url


# ---------- Module: Resend 'from' fields no longer include WLADHUB literal ----------
class TestResendFromFields:
    def test_email_routes_use_leader_os_from(self):
        with open("/app/backend/routes/email.py", "r") as f:
            content = f.read()
        # Find every `"from": f"...` line
        from_lines = re.findall(r'"from"\s*:\s*f?"([^"]+)"', content)
        assert from_lines, "no 'from' fields found in email.py"
        for line in from_lines:
            assert "WLADHUB" not in line.upper().replace("LEADER OS", ""), (
                f"WLADHUB literal in from-field: {line}"
            )
            # must reference Leader OS branding
            assert "Leader OS" in line, f"missing 'Leader OS' branding in: {line}"
