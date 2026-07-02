"""Iter 92.63 - RETEST of Iter 92.62 with two main-agent fixes applied:

  Fix 1 (SECURITY): _fetch_supabase_insights returns [] when email has no
                    Supabase account (no unfiltered-fallback query).
  Fix 2 (FK-FIX):   /api/wladhub/push-to-supabase resolves the REAL Supabase
                    auth user id by email and AUTO-CREATES the Supabase user
                    if missing — no more SHA256-derived UUID FK violation.

This suite complements the existing test_iter92_62_wladhub_autosync_login.py
by adding:
  • test_A_push_to_supabase_now_succeeds (was 502 FK-bug, now 200/409)
  • test_B_full_e2e_leaderos_to_supabase_to_login_autosync
  • test_C_security_no_leak_for_user_without_supabase_account
"""
import os
import time
import re
import pytest
import requests
import httpx
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = os.environ.get("DB_NAME", "test_database")
mongo = MongoClient(MONGO_URL)[DB_NAME]

ACCEL_EMAIL = "accelerator@wladbot.test"
ACCEL_PASS = "test123"

BACKEND_LOG = "/var/log/supervisor/backend.err.log"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def _login(email, password):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"identifier": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    token = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {token}"})
    return token, s


def _register(email, password, phone_suffix):
    payload = {
        "email": email, "password": password, "name": "E2E Test",
        "phone": f"+49 170 12345{phone_suffix:02d}",
    }
    r = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text[:200]}"
    return r.json()["user"]["user_id"], r.json()["token"]


def _log_offset():
    try:
        return os.path.getsize(BACKEND_LOG)
    except FileNotFoundError:
        return 0


def _log_contains(pattern, since_offset=0):
    try:
        with open(BACKEND_LOG, "r", errors="ignore") as f:
            f.seek(since_offset)
            return bool(re.search(pattern, f.read()))
    except FileNotFoundError:
        return False


def _delete_supabase_user(email):
    """Best-effort cleanup of a Supabase auth user we created during tests."""
    if not (SUPABASE_URL and SUPABASE_SERVICE_KEY):
        return
    try:
        with httpx.Client(timeout=10) as client:
            headers = {"apikey": SUPABASE_SERVICE_KEY,
                       "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}
            email_l = email.lower()
            for page in range(1, 6):
                r = client.get(f"{SUPABASE_URL}/auth/v1/admin/users",
                               headers=headers,
                               params={"page": page, "per_page": 200})
                if r.status_code != 200:
                    return
                users = r.json().get("users", [])
                for u in users:
                    if (u.get("email") or "").lower() == email_l:
                        client.delete(
                            f"{SUPABASE_URL}/auth/v1/admin/users/{u['id']}",
                            headers=headers,
                        )
                        return
                if len(users) < 200:
                    return
    except Exception as e:
        print(f"WARN: supabase cleanup failed for {email}: {e}")


# ============================================================
# A. push-to-supabase now returns 200 (or 409 with clear msg)
# ============================================================

def test_A_push_to_supabase_now_succeeds():
    _, s = _login(ACCEL_EMAIL, ACCEL_PASS)

    s.post(f"{API}/wladhub/import", json={
        "ki_kompetenz": 81, "boardroom_rhetorik": 67, "strategisches_eq": 74,
        "overall_score": 74, "strengths": [], "improvements": [], "action_plan": [],
    }, timeout=15)

    r = s.post(f"{API}/wladhub/push-to-supabase", timeout=30)
    print(f"push-to-supabase status={r.status_code} body={r.text[:400]}")

    # Iter 92.63d — after removing email_lower (generated column) from the
    # public.users mirror payload, this endpoint should now succeed with 200.
    assert r.status_code == 200, f"expected 200 after 92.63d fix, got {r.status_code}: {r.text[:300]}"
    body = r.json()
    assert body.get("status") == "success"

    # Cleanup any Supabase auth user we created for the accelerator test email.
    # Skip cleanup here — accelerator is a stable test account and we may want
    # its Supabase mirror to persist for downstream tests.


# ============================================================
# B. FULL E2E - leaderos → Supabase → login autosync → dashboard
# ============================================================

@pytest.fixture(scope="module")
def e2e_user():
    ts = int(time.time())
    email = f"synctest92r-{ts}@wladbot.test"
    password = os.environ.get("E2E_TEST_PASSWORD", "Test123!x")  # test-only throwaway
    user_id, _ = _register(email, password, ts % 100)
    yield {"email": email, "password": password, "user_id": user_id}
    # Cleanup Mongo + Supabase
    try:
        mongo.users.delete_one({"user_id": user_id})
        mongo.wladhub_diagnoses.delete_many({"user_id": user_id})
    except Exception:
        pass
    _delete_supabase_user(email)


def test_B_full_e2e_leaderos_to_supabase_to_login_autosync(e2e_user):
    email = e2e_user["email"]
    password = e2e_user["password"]
    uid = e2e_user["user_id"]

    # (1) login as the fresh user
    _, s = _login(email, password)

    # (2) import scores locally
    r = s.post(f"{API}/wladhub/import", json={
        "ki_kompetenz": 81, "boardroom_rhetorik": 67, "strategisches_eq": 74,
        "overall_score": 74, "strengths": [], "improvements": [], "action_plan": [],
    }, timeout=15)
    assert r.status_code == 200, r.text

    # (3) push to Supabase (auto-creates the Supabase auth user)
    r = s.post(f"{API}/wladhub/push-to-supabase", timeout=30)
    print(f"E2E push status={r.status_code} body={r.text[:400]}")
    if r.status_code == 409:
        pytest.skip(f"Supabase user create disallowed in this env: {r.text[:200]}")
    assert r.status_code == 200, f"push failed: {r.status_code} {r.text[:300]}"

    # (4) wipe local wladhub state
    mongo.users.update_one({"user_id": uid}, {"$unset": {
        "has_wladhub_diagnosis": "", "wladhub_scores": "",
        "wladhub_autosynced_at": "", "wladhub_connected": "",
        "wladhub_leader_typ": "", "wladhub_last_sync": "",
    }})
    mongo.wladhub_diagnoses.delete_many({"user_id": uid})

    # confirm wipe
    u_before = mongo.users.find_one({"user_id": uid})
    assert not u_before.get("has_wladhub_diagnosis")
    assert not mongo.wladhub_diagnoses.find_one({"user_id": uid})

    # (5) login again → autosync fire-and-forget
    offset = _log_offset()
    _, s2 = _login(email, password)

    # Wait for autosync (up to 12s)
    email_escaped = re.escape(email)
    autosync_fired = False
    for _ in range(12):
        time.sleep(1)
        if _log_contains(rf"autosync:.*{email_escaped}", offset):
            autosync_fired = True
            break
    assert autosync_fired, "autosync did not log for E2E user"

    # (6) GET /wladhub/diagnosis must return the pushed scores
    time.sleep(2)  # small safety buffer
    r = s2.get(f"{API}/wladhub/diagnosis", timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    print(f"E2E diagnosis after autosync: {body}")

    assert body.get("connected") is True, f"diagnosis not connected — autosync failed: {body}"
    assert body.get("ki_kompetenz") == 81, f"ki_kompetenz mismatch: {body}"
    assert body.get("boardroom_rhetorik") == 67, f"boardroom_rhetorik mismatch: {body}"
    assert body.get("strategisches_eq") == 74, f"strategisches_eq mismatch: {body}"

    # (7) Mongo user must be flagged
    u_after = mongo.users.find_one({"user_id": uid})
    assert u_after.get("has_wladhub_diagnosis") is True, \
        f"has_wladhub_diagnosis not set after autosync: {u_after.get('has_wladhub_diagnosis')}"

    # (8) 3layer endpoint uses the synced scores
    r = s2.get(f"{API}/wladhub/3layer", timeout=15)
    assert r.status_code == 200
    layer = r.json()
    assert layer.get("source") == "wladhub"
    assert layer.get("ki_kompetenz") == 81
    assert layer.get("boardroom_rhetorik") == 67
    assert layer.get("strategisches_eq") == 74


# ============================================================
# C. SECURITY - user w/o Supabase account gets NO leak
# ============================================================

@pytest.fixture(scope="module")
def noleak_user():
    ts = int(time.time()) + 1
    email = f"noleak-{ts}@wladbot.test"
    password = os.environ.get("E2E_TEST_PASSWORD", "Test123!x")  # test-only throwaway
    user_id, _ = _register(email, password, (ts + 5) % 100)
    yield {"email": email, "password": password, "user_id": user_id}
    try:
        mongo.users.delete_one({"user_id": user_id})
        mongo.wladhub_diagnoses.delete_many({"user_id": user_id})
    except Exception:
        pass
    # noleak user should NEVER have been created in Supabase, but attempt
    # cleanup as a safety net.
    _delete_supabase_user(email)


def test_C_security_no_leak_for_user_without_supabase_account(noleak_user):
    email = noleak_user["email"]
    password = noleak_user["password"]
    uid = noleak_user["user_id"]

    offset = _log_offset()
    _, s = _login(email, password)

    # Wait for autosync to finish
    time.sleep(6)

    # 1) diagnosis endpoint must NOT return connected=True with someone else's scores
    r = s.get(f"{API}/wladhub/diagnosis", timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    print(f"noleak diagnosis: {body}")
    assert body.get("connected") is not True, \
        f"SECURITY LEAK: noleak user has a diagnosis: {body}"

    # 2) Mongo user must NOT be flagged
    u = mongo.users.find_one({"user_id": uid})
    assert not u.get("has_wladhub_diagnosis"), \
        f"SECURITY LEAK: has_wladhub_diagnosis={u.get('has_wladhub_diagnosis')}"
    assert not u.get("wladhub_scores"), \
        f"SECURITY LEAK: wladhub_scores={u.get('wladhub_scores')}"

    # 3) Backend log should show the security-safe skip message
    log_ok = _log_contains(r"no account for", offset) or \
             _log_contains(r"no leader-check.de diagnosis", offset) or \
             _log_contains(re.escape(email), offset)
    assert log_ok, "expected autosync-skip log message for noleak user"
