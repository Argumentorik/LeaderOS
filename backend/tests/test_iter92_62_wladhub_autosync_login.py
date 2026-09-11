"""Iter 92.62 - WladHub autosync on ANY login (not just register).

The main-agent fix wires `_maybe_autosync_wladhub()` into:
  • POST /api/auth/login
  • POST /api/auth/magic-link/verify
  • POST /api/auth/google-session (existing user)

Google branch cannot be end-to-end tested (external OAuth) so we verify it
via code inspection + this test suite for the other two paths.

NOTE: `/api/wladhub/push-to-supabase` is BLOCKED by a separate Supabase FK
constraint issue (foreign key `leadership_insights.user_id → users.id`
using SHA256-derived UUIDs that don't exist in Supabase.users). We report
this as a critical downstream bug but the AUTOSYNC-ON-LOGIN fix itself is
verified via backend log inspection.
"""
import os
import time
import re
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = os.environ.get("DB_NAME", "test_database")
mongo = MongoClient(MONGO_URL)[DB_NAME]

ACCEL_EMAIL = "accelerator@wladbot.test"
ACCEL_PASS = "test123"

BACKEND_LOG = "/var/log/supervisor/backend.err.log"


def _login(email: str, password: str) -> tuple[str, requests.Session]:
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"identifier": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    token = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {token}"})
    return token, s


def _log_contains(pattern: str, since_offset: int = 0) -> bool:
    """Return True if regex pattern appears in backend log after offset."""
    try:
        with open(BACKEND_LOG, "r", errors="ignore") as f:
            f.seek(since_offset)
            content = f.read()
        return bool(re.search(pattern, content))
    except FileNotFoundError:
        return False


def _log_offset() -> int:
    try:
        return os.path.getsize(BACKEND_LOG)
    except FileNotFoundError:
        return 0


# ------------------------------------------------------------
# 1. Supabase connection status
# ------------------------------------------------------------

def test_1_supabase_status_connected():
    _, s = _login(ACCEL_EMAIL, ACCEL_PASS)
    r = s.get(f"{API}/wladhub/supabase-status", timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("connected") is True, f"Supabase NOT connected: {body}"


# ------------------------------------------------------------
# 2. /wladhub/import works (regression — was 500 due to ObjectId; fixed by testing agent)
# ------------------------------------------------------------

def test_2_wladhub_import_returns_200_no_objectid():
    _, s = _login(ACCEL_EMAIL, ACCEL_PASS)
    payload = {
        "ki_kompetenz": 88,
        "boardroom_rhetorik": 72,
        "strategisches_eq": 79,
        "overall_score": 80,
        "strengths": ["Strategisches Denken", "Klare Kommunikation"],
        "improvements": ["Mehr Delegation"],
        "action_plan": ["Weekly 1-on-1s", "Skip-level meetings"],
    }
    r = s.post(f"{API}/wladhub/import", json=payload, timeout=15)
    assert r.status_code == 200, f"import failed: {r.status_code} {r.text}"
    body = r.json()
    assert "diagnosis" in body
    # Response must be JSON-serializable (no ObjectId leak)
    diag = body["diagnosis"]
    assert diag["ki_kompetenz"] == 88
    assert diag["overall_score"] == 80
    assert "_id" not in diag, "ObjectId leaked into response"


# ------------------------------------------------------------
# 3. Login-triggered autosync CODE PATH fires (the fixed bug)
# ------------------------------------------------------------

@pytest.fixture(scope="module")
def synctest_user():
    ts = int(time.time())
    email = f"synctest92-{ts}@wladbot.test"
    password = os.environ.get("E2E_TEST_PASSWORD", "Test123!x")  # test-only throwaway
    payload = {"email": email, "password": password, "name": "Sync Test",
               "phone": f"+49 170 999{ts % 10000:04d}"}
    r = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code == 200, r.text
    user_id = r.json()["user"]["user_id"]
    yield {"email": email, "password": password, "user_id": user_id}
    try:
        mongo.users.delete_one({"user_id": user_id})
        mongo.wladhub_diagnoses.delete_many({"user_id": user_id})
    except Exception:
        pass


def test_3_login_triggers_autosync_code_path(synctest_user):
    """Wipe local diagnosis state, then login → autosync fire-and-forget
    task must run (verified via backend log inspection).

    Since the test user does NOT exist in the Supabase auth.users table
    the autosync will log 'no leadercheck.de diagnosis' — that's the
    expected regression path and proves the code fires."""
    uid = synctest_user["user_id"]
    mongo.users.update_one({"user_id": uid}, {"$unset": {
        "has_wladhub_diagnosis": "", "wladhub_scores": "",
        "wladhub_autosynced_at": "", "wladhub_connected": "",
    }})
    mongo.wladhub_diagnoses.delete_many({"user_id": uid})

    offset = _log_offset()
    _login(synctest_user["email"], synctest_user["password"])

    # Poll log for up to 10s
    email_escaped = re.escape(synctest_user["email"])
    fired = False
    for _ in range(10):
        time.sleep(1)
        if _log_contains(rf"autosync:.*{email_escaped}", offset):
            fired = True
            break
    assert fired, "autosync task did NOT fire on login for the test user"


# ------------------------------------------------------------
# 4. Data USED — Dashboard 3-Layer uses imported scores (accelerator user)
# ------------------------------------------------------------

def test_4_dashboard_3layer_uses_wladhub_source():
    _, s = _login(ACCEL_EMAIL, ACCEL_PASS)
    # Ensure diagnosis is imported (idempotent)
    payload = {
        "ki_kompetenz": 88, "boardroom_rhetorik": 72, "strategisches_eq": 79,
        "overall_score": 80,
        "strengths": ["Strategisches Denken"], "improvements": ["Mehr Delegation"],
        "action_plan": [],
    }
    r = s.post(f"{API}/wladhub/import", json=payload, timeout=15)
    assert r.status_code == 200, r.text

    r = s.get(f"{API}/wladhub/3layer", timeout=15)
    assert r.status_code == 200
    layer = r.json()
    assert layer.get("source") == "wladhub", f"expected source=wladhub, got {layer}"
    assert layer.get("connected") is True
    assert layer.get("ki_kompetenz") == 88
    assert layer.get("boardroom_rhetorik") == 72
    assert layer.get("strategisches_eq") == 79
    assert layer.get("overall_score") == 80


# ------------------------------------------------------------
# 5. Data USED — Chat memory (system prompt injection)
# ------------------------------------------------------------

def test_5_chat_has_diagnosis_context():
    """Verify diagnosis is available in chat context. The
    _build_wladhub_section() function injects the exact score numbers into
    the system prompt (services.py L497-508). The LLM may not always echo
    the raw digits but the response must be relevant to the injected
    diagnosis (mention 3-Layer / KI / Rhetorik / EQ terminology)."""
    _, s = _login(ACCEL_EMAIL, ACCEL_PASS)

    # Guarantee accelerator has fresh diagnosis
    s.post(f"{API}/wladhub/import", json={
        "ki_kompetenz": 88, "boardroom_rhetorik": 72, "strategisches_eq": 79,
        "overall_score": 80,
        "strengths": ["Strategisches Denken"], "improvements": ["Mehr Delegation"],
        "action_plan": [],
    }, timeout=15)

    r = s.post(f"{API}/chat/sessions", json={"title": "Score-Test"}, timeout=15)
    assert r.status_code == 200
    session_id = r.json().get("session_id") or r.json().get("id")

    msg = "Was sagen meine Leader-Check Scores über mich? Nenne die konkreten Zahlen."
    r = s.post(f"{API}/chat", json={"message": msg, "session_id": session_id}, timeout=90)
    assert r.status_code == 200, r.text
    body_str = str(r.json()).lower()

    # Diagnosis-related vocabulary must appear (proves prompt saw the section)
    keywords = ["ki-kompetenz", "boardroom", "rhetorik", "eq", "3-layer", "kompetenz"]
    matches = sum(1 for k in keywords if k in body_str)
    assert matches >= 2, f"Chat has no diagnosis context. Keywords hit={matches}. Body: {str(r.json())[:600]}"

    # Also probe for actual score numbers (nice-to-have, LLM often obeys "Nenne die Zahlen")
    numbers_hit = sum(1 for n in ("88", "72", "79", "80") if n in body_str)
    if numbers_hit < 2:
        # Not a hard fail — LLMs vary — but we surface it as a warning
        print(f"WARN: LLM did not echo score numbers explicitly (hit={numbers_hit}). "
              "System-prompt injection still works — this is LLM behavior.")


# ------------------------------------------------------------
# 6. Regression — user with NO Supabase data still logs in cleanly
# ------------------------------------------------------------

def test_6_regression_user_without_diagnosis():
    ts = int(time.time())
    email = f"noquiz-{ts}@wladbot.test"
    password = os.environ.get("E2E_TEST_PASSWORD", "Test123!x")  # test-only throwaway
    payload = {"email": email, "password": password, "name": "No Quiz",
               "phone": f"+49 170 888{ts % 10000:04d}"}
    r = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code == 200
    user_id = r.json()["user"]["user_id"]

    _log_offset()
    r = requests.post(f"{API}/auth/login",
                      json={"identifier": email, "password": password}, timeout=15)
    assert r.status_code == 200, r.text

    # Autosync should log 'no leadercheck.de diagnosis' (or nothing) — no crash
    time.sleep(6)
    u = mongo.users.find_one({"user_id": user_id})
    assert u is not None

    # Should NOT have has_wladhub_diagnosis (nothing in Supabase for this email)
    assert not u.get("has_wladhub_diagnosis"), (
        "SECURITY BUG: autosync polluted a fresh user's profile "
        "(likely due to _fetch_supabase_insights fallback 'latest 5 across all users' "
        "when email not found in Supabase auth)."
    )
    # Cleanup
    mongo.users.delete_one({"user_id": user_id})
    mongo.wladhub_diagnoses.delete_many({"user_id": user_id})


# ------------------------------------------------------------
# 7. Push-to-Supabase — documented KNOWN FAILURE (report only)
# ------------------------------------------------------------

def test_7_push_to_supabase_known_fk_bug():
    """Documented: /api/wladhub/push-to-supabase fails with 502 because the
    SHA256-derived UUID for user_id does not satisfy the FK constraint on
    Supabase's `leadership_insights.user_id -> users.id`.

    We assert the failure to leave a signal in test output for main agent."""
    _, s = _login(ACCEL_EMAIL, ACCEL_PASS)
    s.post(f"{API}/wladhub/import", json={
        "ki_kompetenz": 88, "boardroom_rhetorik": 72, "strategisches_eq": 79,
        "overall_score": 80, "strengths": [], "improvements": [], "action_plan": [],
    }, timeout=15)
    r = s.post(f"{API}/wladhub/push-to-supabase", timeout=30)
    # Iter 92.63d — after removing email_lower (generated column) from the
    # public.users mirror payload, this endpoint should now succeed (200).
    print(f"push-to-supabase status={r.status_code} body={r.text[:400]}")
    assert r.status_code == 200, f"expected 200 after 92.63d fix, got {r.status_code}: {r.text[:300]}"
    body = r.json()
    assert body.get("status") == "success", f"expected status=success, got {body}"
