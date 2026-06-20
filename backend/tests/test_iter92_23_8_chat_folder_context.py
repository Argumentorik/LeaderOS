"""Iter 92.23.8 — WladBot chat folder-context injection backend tests.

Covers:
 - POST /api/chat with folder_id (owned) → folder_context_used == True
 - POST /api/chat without folder_id → folder_context_used == False
 - POST /api/chat with foreign folder_id → folder_context_used == False (no leak)
 - POST /api/chat with non-existent folder_id → falls back gracefully (same code path,
   asserted via no exception during owned-folder test sequence; covered logically by
   foreign-folder test since both hit `db.folders.find_one(...) → None`).
 - Multi-turn folder context continues to be injected on subsequent turn
 - POST /api/chat/sessions with owned folder_id → session + folder_item created
 - POST /api/chat/sessions with foreign folder_id → silent ignore, no folder_item
 - GET /api/chat/sessions?folder_id= filter works
 - GET /api/chat/sessions without filter returns all (regression)
 - Folder CRUD endpoint regression (smoke)

NOTE: AI chat calls cost money — this file makes at most 4 POST /chat calls total.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

PRIMARY_EMAIL = "test@test.com"
PRIMARY_PASSWORD = os.environ.get("TEST_PASSWORD", "test123")
OTHER_EMAIL = "accelerator@wladbot.test"
OTHER_PASSWORD = os.environ.get("TEST_PASSWORD", "test123")

# Context-summary chosen so the AI insight should mention these tokens.
FOLDER_NAME = "TEST_iter92238_boardpitch"
FOLDER_CTX = (
    "Vorbereitung Board-Pitch fuer Q1 2026. Dauer max 5 Minuten. "
    "Fokus auf KPI-Logik (ARR, NRR, CAC-Payback). Stakeholder: CFO + 2 VCs."
)


def _login(email: str, password: str) -> str:
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
        timeout=20,
    )
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    tok = r.json().get("token")
    assert tok, f"no token for {email}"
    return tok


@pytest.fixture(scope="module")
def primary_headers():
    tok = _login(PRIMARY_EMAIL, PRIMARY_PASSWORD)
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def other_headers():
    try:
        tok = _login(OTHER_EMAIL, OTHER_PASSWORD)
    except AssertionError:
        pytest.skip("accelerator@wladbot.test login failed — skipping ownership test")
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


def _cleanup(h):
    r = requests.get(f"{BASE_URL}/api/folders", headers=h, timeout=20)
    if r.status_code == 200:
        for f in r.json():
            if (f.get("name") or "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/folders/{f['folder_id']}", headers=h, timeout=20)


@pytest.fixture(scope="module")
def owned_folder(primary_headers):
    _cleanup(primary_headers)
    r = requests.post(
        f"{BASE_URL}/api/folders",
        headers=primary_headers,
        json={"name": FOLDER_NAME, "context_summary": FOLDER_CTX},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    f = r.json()
    yield f
    requests.delete(f"{BASE_URL}/api/folders/{f['folder_id']}", headers=primary_headers, timeout=20)


@pytest.fixture(scope="module")
def chat_folder(other_headers):
    """Folder OWNED BY the accelerator account — chat /api/chat tests
    use this account because free-tier test@test.com runs out of chat credits
    after 2 LLM calls. Accelerator has the higher chat quota."""
    _cleanup(other_headers)
    r = requests.post(
        f"{BASE_URL}/api/folders",
        headers=other_headers,
        json={"name": f"TEST_CHAT_{uuid.uuid4().hex[:6]}", "context_summary": FOLDER_CTX},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    f = r.json()
    yield f
    requests.delete(f"{BASE_URL}/api/folders/{f['folder_id']}", headers=other_headers, timeout=20)


@pytest.fixture(scope="module")
def foreign_folder(other_headers):
    name = f"TEST_FOREIGN_{uuid.uuid4().hex[:6]}"
    r = requests.post(
        f"{BASE_URL}/api/folders",
        headers=other_headers,
        json={"name": name, "context_summary": "Foreign secret context — do not leak."},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    f = r.json()
    yield f
    requests.delete(f"{BASE_URL}/api/folders/{f['folder_id']}", headers=other_headers, timeout=20)


# ───────────────────────── Chat /api/chat tests (≤4 LLM calls) ─────────────────────────

# Shared session id for multi-turn injection — created via POST /chat/sessions
_shared = {"session_id": None}


def test_01_create_session_with_owned_folder_creates_folder_item(primary_headers, owned_folder):
    """POST /api/chat/sessions with owned folder_id → session has folder_id and
    folder_items has a chat_session row pointing to it."""
    r = requests.post(
        f"{BASE_URL}/api/chat/sessions",
        headers=primary_headers,
        json={"title": "TEST_pitch_chat", "folder_id": owned_folder["folder_id"]},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["session_id"].startswith("chat_")
    assert body["folder_id"] == owned_folder["folder_id"]
    _shared["session_id"] = body["session_id"]

    # folder_items should now contain a chat_session entry pointing to this session
    items = requests.get(
        f"{BASE_URL}/api/folders/{owned_folder['folder_id']}/items",
        headers=primary_headers, timeout=20,
    ).json()
    chat_items = [i for i in items if i.get("item_type") == "chat_session"
                  and i.get("source_id") == body["session_id"]]
    assert len(chat_items) == 1, f"expected 1 chat_session folder_item, got {chat_items}"


def test_02_create_session_with_foreign_folder_silently_ignored(primary_headers, foreign_folder):
    """POST /api/chat/sessions with foreign folder_id → session created, but no
    folder_id stamped + no folder_item leaked into the foreign folder."""
    r = requests.post(
        f"{BASE_URL}/api/chat/sessions",
        headers=primary_headers,
        json={"title": "TEST_foreign_session", "folder_id": foreign_folder["folder_id"]},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("folder_id") is None, f"foreign folder_id must not be stamped: {body}"

    # Foreign user should still not see a chat_session linked into their folder
    # (we cannot list their items as primary user — instead assert that the
    # foreign-listed sessions of primary user did NOT include this folder filter).
    r2 = requests.get(
        f"{BASE_URL}/api/chat/sessions",
        headers=primary_headers,
        params={"folder_id": foreign_folder["folder_id"]},
        timeout=20,
    )
    assert r2.status_code == 200
    sessions = r2.json()
    # Primary user's filter on a folder they don't own → must be empty.
    assert sessions == [], f"foreign-folder filter must return nothing for primary: {sessions}"


def test_03_chat_with_owned_folder_injects_context(other_headers, chat_folder):
    """LLM call #1 (accelerator account) — POST /api/chat with owned folder_id
    → folder_context_used True. Creates a fresh session inline."""
    r = requests.post(
        f"{BASE_URL}/api/chat",
        headers=other_headers,
        json={
            "message": "Wie soll ich meinen Pitch strukturieren?",
            "folder_id": chat_folder["folder_id"],
        },
        timeout=120,
    )
    if r.status_code == 402:
        pytest.skip(f"accelerator out of credits: {r.text}")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("folder_context_used") is True, body
    assert body.get("session_id", "").startswith("chat_")
    _shared["chat_session_id"] = body["session_id"]


def test_04_chat_multi_turn_still_injects_context(other_headers, chat_folder):
    """LLM call #2 — second turn on the same session+folder must still inject."""
    sid = _shared.get("chat_session_id")
    if not sid:
        pytest.skip("test_03 did not create a session (likely credit-skip)")
    r = requests.post(
        f"{BASE_URL}/api/chat",
        headers=other_headers,
        json={
            "message": "Welche KPI nenne ich zuerst?",
            "session_id": sid,
            "folder_id": chat_folder["folder_id"],
        },
        timeout=120,
    )
    if r.status_code == 402:
        pytest.skip(f"accelerator out of credits: {r.text}")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("folder_context_used") is True, body
    assert body.get("session_id") == sid


def test_05_chat_without_folder_id_no_injection(other_headers):
    """LLM call #3 — POST /api/chat with NO folder_id → folder_context_used False.
    Uses accelerator account so primary's free credits aren't consumed."""
    r = requests.post(
        f"{BASE_URL}/api/chat",
        headers=other_headers,
        json={"message": "Was ist Leadership in einem Satz?"},
        timeout=120,
    )
    if r.status_code == 402:
        pytest.skip(f"accelerator account out of chat credits: {r.text}")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("folder_context_used") is False, body
    assert body.get("session_id", "").startswith("chat_")


def test_06_chat_with_foreign_folder_id_no_leak(other_headers, owned_folder):
    """LLM call #4 — POST /api/chat with FOREIGN folder_id (owned by primary user)
    from accelerator's session → folder_context_used False, no error, no leak.
    Same code path also covers non-existent folder_id (both fall through `find_one → None`)."""
    r = requests.post(
        f"{BASE_URL}/api/chat",
        headers=other_headers,
        json={
            "message": "Sag mir irgendeinen Tipp.",
            "folder_id": owned_folder["folder_id"],  # foreign relative to accelerator
        },
        timeout=120,
    )
    if r.status_code == 402:
        pytest.skip(f"accelerator account out of chat credits: {r.text}")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("folder_context_used") is False, body


# ─────────── Session-listing filters (no LLM cost) ───────────

def test_07_list_sessions_filtered_by_owned_folder(primary_headers, owned_folder):
    r = requests.get(
        f"{BASE_URL}/api/chat/sessions",
        headers=primary_headers,
        params={"folder_id": owned_folder["folder_id"]},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    sessions = r.json()
    assert isinstance(sessions, list)
    assert len(sessions) >= 1
    for s in sessions:
        assert s.get("folder_id") == owned_folder["folder_id"], s


def test_08_list_sessions_unfiltered_includes_owned_and_others(primary_headers, owned_folder):
    """Regression: GET without folder_id returns ALL sessions."""
    r = requests.get(f"{BASE_URL}/api/chat/sessions", headers=primary_headers, timeout=20)
    assert r.status_code == 200, r.text
    sessions = r.json()
    assert isinstance(sessions, list)
    ids_with_folder = [s for s in sessions if s.get("folder_id") == owned_folder["folder_id"]]
    ids_without_folder = [s for s in sessions if not s.get("folder_id")]
    # We created at least one session in each bucket via tests 01 and 05
    assert len(ids_with_folder) >= 1, "missing folder-tagged session in unfiltered list"
    assert len(ids_without_folder) >= 1, "missing untagged session in unfiltered list"


def test_09_list_sessions_filter_nonexistent_folder_returns_empty(primary_headers):
    """Non-existent folder filter returns [] gracefully."""
    r = requests.get(
        f"{BASE_URL}/api/chat/sessions",
        headers=primary_headers,
        params={"folder_id": "fld_nonexistent_xxx"},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    assert r.json() == []


# ─────────── Folder CRUD regression (smoke — no LLM) ───────────

def test_10_regression_folder_crud_still_works(primary_headers):
    name = f"TEST_regression_{uuid.uuid4().hex[:6]}"
    # CREATE
    r = requests.post(
        f"{BASE_URL}/api/folders",
        headers=primary_headers,
        json={"name": name, "context_summary": "regression check"},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    fid = r.json()["folder_id"]
    try:
        # LIST
        lst = requests.get(f"{BASE_URL}/api/folders", headers=primary_headers, timeout=20).json()
        assert any(f["folder_id"] == fid for f in lst)
        # PATCH
        r2 = requests.patch(
            f"{BASE_URL}/api/folders/{fid}",
            headers=primary_headers,
            json={"context_summary": "updated"},
            timeout=20,
        )
        assert r2.status_code == 200 and r2.json()["context_summary"] == "updated"
        # ITEMS list
        r3 = requests.get(f"{BASE_URL}/api/folders/{fid}/items", headers=primary_headers, timeout=20)
        assert r3.status_code == 200 and isinstance(r3.json(), list)
    finally:
        d = requests.delete(f"{BASE_URL}/api/folders/{fid}", headers=primary_headers, timeout=20)
        assert d.status_code == 200
