"""Iter 92.5 — Backend tests for GDPR Email Unsubscribe + A/B + lifecycle/cron."""
import os
import sys
import pytest
import requests

# Ensure backend module on path so we can import the token signer for valid tokens
sys.path.insert(0, "/app/backend")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

TEST_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "test@test.com")
TEST_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "test123")
TEST_USER_ID = os.environ.get("TEST_ADMIN_USER_ID", "user_f111693f1b00")


# ---------- Helpers / fixtures ----------

@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    return s


@pytest.fixture(scope="session")
def auth_session(api_client):
    """Login via email/password — sets cookie session + returns token."""
    r = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=20,
    )
    if r.status_code != 200:
        pytest.skip(f"login failed: {r.status_code} {r.text[:200]}")
    data = r.json()
    token = data.get("token") or data.get("access_token")
    if token:
        api_client.headers.update({"Authorization": f"Bearer {token}"})
    return api_client


# ---------- (1) Unsubscribe — invalid token ----------

class TestUnsubscribeInvalidToken:
    def test_info_bad_token_returns_400(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/unsubscribe/info", params={"token": "garbage"})
        assert r.status_code == 400
        data = r.json()
        detail = data.get("detail") or data.get("error") or ""
        assert "Ung" in detail or "ungültig" in detail.lower() or "abgelaufen" in detail.lower(), f"unexpected detail: {detail}"

    def test_info_dotted_garbage_returns_400(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/unsubscribe/info", params={"token": "garbage.token"})
        assert r.status_code == 400


# ---------- (2) Unsubscribe — full lifecycle with HMAC-signed token ----------

class TestUnsubscribeLifecycle:
    @pytest.fixture(scope="class")
    def valid_token(self):
        # Generate token using the same signing key as the backend (shared env)
        from routes.unsubscribe import make_unsubscribe_token
        return make_unsubscribe_token(TEST_USER_ID, "video_drip")

    def test_info_valid_token_returns_metadata(self, api_client, valid_token):
        r = api_client.get(f"{BASE_URL}/api/unsubscribe/info", params={"token": valid_token})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "email" in data
        assert data["category"] == "video_drip"
        assert "category_label" in data
        assert "already_unsubscribed" in data
        assert isinstance(data["already_unsubscribed"], bool)
        # Should be the test user
        assert data["email"] == TEST_EMAIL or "@" in data["email"]

    def test_confirm_then_resubscribe_flow(self, api_client, valid_token):
        # Reset state via resubscribe first (idempotent)
        api_client.post(f"{BASE_URL}/api/unsubscribe/resubscribe", json={"token": valid_token})

        # Confirm unsubscribe
        r1 = api_client.post(f"{BASE_URL}/api/unsubscribe/confirm", json={"token": valid_token})
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        assert d1.get("ok") is True
        assert d1.get("category") == "video_drip"

        # Info should now show already_unsubscribed True
        r2 = api_client.get(f"{BASE_URL}/api/unsubscribe/info", params={"token": valid_token})
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2.get("already_unsubscribed") is True

        # Resubscribe
        r3 = api_client.post(f"{BASE_URL}/api/unsubscribe/resubscribe", json={"token": valid_token})
        assert r3.status_code == 200
        d3 = r3.json()
        assert d3.get("ok") is True
        assert d3.get("resubscribed") is True

        # Info should now show already_unsubscribed False
        r4 = api_client.get(f"{BASE_URL}/api/unsubscribe/info", params={"token": valid_token})
        assert r4.status_code == 200
        assert r4.json().get("already_unsubscribed") is False


# ---------- (3) Lifecycle status: video_drip_weeks ----------

class TestLifecycleStatus:
    def test_status_contains_video_drip_weeks(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/lifecycle/status")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "video_drip_weeks" in data
        assert data["video_drip_weeks"] == [1, 2, 3, 4, 5, 6]


# ---------- (4) Video-drip cron — idempotent / 0 sent if no vimeo_id ----------

class TestVideoDripCron:
    def test_cron_video_drip_runs(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/cron/video-drip")
        # Accept 200 or 401 if it requires auth header (cron token); spec says it should run
        assert r.status_code in (200, 201, 204), f"status={r.status_code} body={r.text[:300]}"
        if r.status_code == 200:
            data = r.json()
            # response shape may include sent / candidates / ready_video_ids info
            assert "sent" in data or "ok" in data or "candidates" in data


# ---------- (5) A/B testing fake_wlad_call_bribe ----------

class TestABFakeWladCallBribe:
    def test_assign_enrolls_authed_user(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/ab/assign/fake_wlad_call_bribe")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("enrolled") is True
        assert data.get("variant") in ("control", "bribe")

    def test_event_impression(self, auth_session):
        r = auth_session.post(
            f"{BASE_URL}/api/ab/event/fake_wlad_call_bribe",
            json={"event": "impression"},
        )
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True


# ---------- (6) Payments checkout WLAD10 discount ----------

class TestPaymentsDiscount:
    ORIGIN = "https://command-center-229.preview.emergentagent.com"

    def _amount(self, data):
        # Try common shapes for amount/discounted amount
        for k in ("discounted_amount", "amount", "amount_total", "total"):
            if k in data:
                return data[k]
        return None

    def test_checkout_with_wlad10(self, auth_session):
        r = auth_session.post(
            f"{BASE_URL}/api/payments/checkout",
            json={"package_id": "leadership_os", "discount_code": "WLAD10", "origin_url": self.ORIGIN},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        amt = self._amount(data)
        assert amt in (897.30, 89730, "897.30"), f"unexpected amount={amt} full={data}"

    def test_checkout_without_code(self, auth_session):
        r = auth_session.post(
            f"{BASE_URL}/api/payments/checkout",
            json={"package_id": "leadership_os", "origin_url": self.ORIGIN},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        amt = self._amount(data)
        assert amt in (997.00, 99700, "997.00"), f"unexpected amount={amt} full={data}"

    def test_checkout_with_invalid_code_graceful(self, auth_session):
        r = auth_session.post(
            f"{BASE_URL}/api/payments/checkout",
            json={"package_id": "leadership_os", "discount_code": "DOESNOTEXIST", "origin_url": self.ORIGIN},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        amt = self._amount(data)
        assert amt in (997.00, 99700, "997.00"), f"invalid code should be graceful — got {amt}"


# ---------- (7) Frontend public asset checks ----------

FRONTEND_URL = BASE_URL  # ingress routes both api and root via same hostname


class TestFrontendAssets:
    def test_favicon_svg(self):
        r = requests.get(f"{FRONTEND_URL}/favicon.svg", timeout=15)
        assert r.status_code == 200, r.status_code
        assert "svg" in r.headers.get("content-type", "").lower()

    def test_icon_192(self):
        r = requests.get(f"{FRONTEND_URL}/icon-192.png", timeout=15)
        assert r.status_code == 200

    def test_apple_touch_icon(self):
        r = requests.get(f"{FRONTEND_URL}/apple-touch-icon.png", timeout=15)
        assert r.status_code == 200
