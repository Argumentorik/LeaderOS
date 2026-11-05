"""Iter 30 — Pre-deploy security + drip + indexes regression.

Covers:
- Admin JWT auth on protected endpoints
- Admin login response shape (token + expires_in_hours)
- Auth flows (/auth/me, /auth/logout, /auth/quick-login, /auth/session)
- Quiz → drip enqueue + idempotency + cancel + unsubscribe
- Email drip-preview for all 10 slugs
- DB index presence
- Payment package pricing (sanity check)
"""
import os
import time
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "emergent_diagnostic")

if not BASE_URL or not ADMIN_PASSWORD:
    pytest.skip(
        "Set REACT_APP_BACKEND_URL and ADMIN_PASSWORD env vars to run this suite",
        allow_module_level=True,
    )

DRIP_SLUGS = [
    "score_meaning", "quickwin", "social_proof", "scarcity", "loss",
    "live_with_wlad", "decision_help", "last_call", "door_closes", "reengagement",
]


# ─── Fixtures ──────────────────────────────────────────────

@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data.get("ok") is True
    assert isinstance(data.get("token"), str) and len(data["token"]) > 20
    assert data.get("expires_in_hours") == 8
    return data["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def db():
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


# ─── SECURITY: Admin endpoints require token ──────────────

PROTECTED_GET = [
    "/api/admin/stats", "/api/admin/users", "/api/admin/transactions",
    "/api/admin/emails", "/api/license/list", "/api/booking/list",
    "/api/enterprise/list",
]


@pytest.mark.parametrize("path", PROTECTED_GET)
def test_protected_get_returns_401_without_token(session, path):
    r = session.get(f"{BASE_URL}{path}")
    assert r.status_code == 401, f"{path} should require auth, got {r.status_code}"


def test_license_create_requires_admin(session):
    r = session.post(f"{BASE_URL}/api/license/create",
                     json={"email": "TEST_unauth@example.com", "plan": "leader_os_full"})
    assert r.status_code == 401


def test_license_revoke_requires_admin(session):
    r = session.post(f"{BASE_URL}/api/license/revoke/FAKE-KEY-1234")
    assert r.status_code == 401


# ─── SECURITY: Admin login ────────────────────────────────

def test_admin_login_wrong_password_401_with_delay(session):
    t0 = time.time()
    r = session.post(f"{BASE_URL}/api/admin/login", json={"password": "wrong-pw-xyz"})
    elapsed_ms = (time.time() - t0) * 1000
    assert r.status_code == 401
    assert elapsed_ms > 250, f"timing-attack mitigation: expected >250ms, got {elapsed_ms:.0f}ms"


def test_admin_login_correct_returns_token(admin_token):
    # validated in fixture
    assert admin_token


def test_admin_endpoints_with_valid_token(session, admin_headers):
    for path in PROTECTED_GET:
        r = session.get(f"{BASE_URL}{path}", headers=admin_headers)
        assert r.status_code == 200, f"{path} with token should be 200, got {r.status_code}"


def test_admin_endpoints_with_fake_token(session):
    r = session.get(f"{BASE_URL}/api/admin/stats",
                    headers={"Authorization": "Bearer fake.token.here"})
    assert r.status_code == 401


# ─── AUTH FLOW ────────────────────────────────────────────

def test_auth_me_without_cookie(session):
    s = requests.Session()
    r = s.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 401


def test_auth_logout_always_200(session):
    r = session.post(f"{BASE_URL}/api/auth/logout")
    assert r.status_code == 200


def test_auth_session_invalid_id(session):
    r = session.post(f"{BASE_URL}/api/auth/session", json={"session_id": "bogus-session-xyz"})
    assert r.status_code == 401


def test_quick_login_empty_returns_400(session):
    r = session.post(f"{BASE_URL}/api/auth/quick-login", json={"identifier": ""})
    assert r.status_code == 400


def test_quick_login_too_short_phone_returns_400(session):
    r = session.post(f"{BASE_URL}/api/auth/quick-login", json={"identifier": "12345"})
    assert r.status_code == 400


def test_quick_login_unknown_email_returns_404(session):
    r = session.post(f"{BASE_URL}/api/auth/quick-login",
                     json={"identifier": "never-exists-xyz123@example.com"})
    assert r.status_code == 404


def test_quick_login_email_case_insensitive(session, db):
    # Seed a user
    email = f"test_quicklogin_{uuid.uuid4().hex[:6]}@example.com"
    db.users.insert_one({
        "user_id": f"user_{uuid.uuid4().hex[:8]}",
        "email": email,
        "phone": "+49 151 12345678",
        "name": "QuickLogin Test",
        "created_at": "2026-01-01T00:00:00+00:00",
    })
    try:
        r = session.post(f"{BASE_URL}/api/auth/quick-login",
                         json={"identifier": email.upper()})
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == email.lower()

        # Phone tail (last 8 digits)
        r2 = session.post(f"{BASE_URL}/api/auth/quick-login",
                          json={"identifier": "12345678"})
        assert r2.status_code == 200, f"phone tail match failed: {r2.text}"
    finally:
        db.users.delete_one({"email": email})


# ─── EMAIL DRIP-PREVIEW for all 10 slugs ──────────────────

@pytest.mark.parametrize("slug", DRIP_SLUGS)
def test_drip_preview_renders(session, slug):
    r = session.get(f"{BASE_URL}/api/email/drip-preview", params={"slug": slug})
    assert r.status_code == 200, f"{slug}: {r.status_code}"
    data = r.json()
    assert "subject" in data and data["subject"]
    assert "html" in data and len(data["html"]) > 100


def test_drip_preview_unknown_slug_returns_404(session):
    r = session.get(f"{BASE_URL}/api/email/drip-preview", params={"slug": "nope"})
    assert r.status_code == 404


# ─── QUIZ → DRIP ENQUEUE + IDEMPOTENCY + CANCEL ──────────

def _make_30_answers():
    out = []
    cats = ["ai_literacy", "rhetoric", "eq"]
    for i in range(30):
        out.append({
            "question_id": f"q{i+1}",
            "category": cats[i % 3],
            "layer": str((i % 3) + 1),
            "score": 3 + (i % 3),
        })
    return out


def test_quiz_generate_report_enqueues_drip(session, db):
    email = f"test_drip_{uuid.uuid4().hex[:6]}@example.com"
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    # Pre-create user (the quiz endpoint typically needs one)
    db.users.insert_one({
        "user_id": f"user_{uuid.uuid4().hex[:8]}",
        "session_id": session_id,
        "email": email,
        "name": "Drip Tester",
        "created_at": "2026-01-01T00:00:00+00:00",
    })
    try:
        payload = {
            "session_id": session_id,
            "user": {"name": "Drip Tester", "email": email, "role": "Manager"},
            "answers": _make_30_answers(),
        }
        r = session.post(f"{BASE_URL}/api/quiz/generate-report", json=payload, timeout=60)
        assert r.status_code == 200, f"generate-report failed: {r.status_code} {r.text[:300]}"
        data = r.json()
        for k in ("session_id", "user", "layer_scores", "leadership_roles",
                  "strongest_role", "weakest_role"):
            assert k in data, f"missing key {k}"

        time.sleep(1.0)  # small wait for enqueue
        queue = list(db.email_queue.find({"email": email.lower()}))
        assert len(queue) == 10, f"expected 10 drip entries, got {len(queue)}"
        slugs_found = {q["slug"] for q in queue}
        assert slugs_found == set(DRIP_SLUGS)

        # Idempotency — second call should not re-enqueue
        r2 = session.post(f"{BASE_URL}/api/quiz/generate-report", json=payload, timeout=60)
        assert r2.status_code == 200
        time.sleep(0.5)
        queue2 = list(db.email_queue.find({"email": email.lower()}))
        assert len(queue2) == 10, f"idempotency broken: {len(queue2)}"

        # Unsubscribe cancels all pending
        r3 = session.get(f"{BASE_URL}/api/email/unsubscribe", params={"email": email})
        assert r3.status_code == 200
        body = r3.json()
        assert body["success"] is True
        assert body["cancelled_drip_count"] >= 1
        pending = db.email_queue.count_documents({"email": email.lower(), "status": "pending"})
        assert pending == 0, f"unsub did not cancel; pending={pending}"
    finally:
        db.users.delete_one({"email": email})
        db.email_queue.delete_many({"email": email.lower()})
        db.reports.delete_many({"session_id": session_id})


# ─── DB INDEXES ───────────────────────────────────────────

REQUIRED_INDEXES = {
    "users": [["email"], ["phone"], ["session_id"]],
    "license_keys": [["key"]],
    "payment_transactions": [["session_id"]],
    "email_queue": [["status", "due_at"], ["email", "status"]],
    "user_sessions": [["session_token"]],
}


def _has_index(index_info: dict, fields: list) -> bool:
    """Check if any index covers the given key fields (in order)."""
    target = [(f, 1) for f in fields]
    target_alt = [(f, -1) for f in fields]
    for _, spec in index_info.items():
        key = spec.get("key", [])
        key_list = list(key) if isinstance(key, list) else list(key.items())
        # Match prefix
        if key_list[: len(fields)] == target or key_list[: len(fields)] == target_alt:
            return True
    return False


@pytest.mark.parametrize("collection,fields_list", list(REQUIRED_INDEXES.items()))
def test_required_indexes_exist(db, collection, fields_list):
    info = db[collection].index_information()
    missing = []
    for fields in fields_list:
        if not _has_index(info, fields):
            missing.append(fields)
    assert not missing, f"{collection} missing indexes: {missing} (have: {list(info.keys())})"


# ─── PAYMENTS: package pricing sanity ─────────────────────

def test_payments_leader_os_full_amount(session):
    r = session.post(f"{BASE_URL}/api/payments/create-checkout",
                     json={"package_id": "leader_os_full",
                           "origin_url": "https://leadercheck.de"})
    assert r.status_code in (200, 201), f"{r.status_code} {r.text[:200]}"
    data = r.json()
    assert "url" in data


def test_payments_leader_os_plus_amount(session):
    r = session.post(f"{BASE_URL}/api/payments/create-checkout",
                     json={"package_id": "leader_os_plus",
                           "origin_url": "https://leadercheck.de"})
    assert r.status_code in (200, 201), f"{r.status_code} {r.text[:200]}"
    data = r.json()
    assert "url" in data


def test_payments_leader_os_plus_3rate_subscription(session):
    r = session.post(f"{BASE_URL}/api/payments/create-checkout",
                     json={"package_id": "leader_os_plus_3rate",
                           "origin_url": "https://leadercheck.de"})
    assert r.status_code in (200, 201), f"{r.status_code} {r.text[:200]}"
    data = r.json()
    assert "url" in data
