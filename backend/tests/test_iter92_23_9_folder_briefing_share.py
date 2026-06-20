"""Iter 92.23.9 — Folder Briefing + Knowledge-RAG + Sharing backend tests.

Covers:
  P1 Briefing:
    - POST /api/folders/{id}/briefing on owned folder w/ video_mission → LLM briefing
    - POST /api/folders/{id}/briefing on EMPTY owned folder → LLM briefing (empty path)
    - POST /api/folders/{foreign}/briefing → 404
    - POST /api/folders/{nonexistent}/briefing → 404

  P1 Knowledge-RAG (chat injection):
    - POST /api/chat with folder_id containing 1+ items → folder_context_used == true
    - POST /api/chat with empty folder_id → folder_context_used == true (graceful)

  P2 Sharing:
    - POST /api/folders/{id}/share twice → idempotent slug
    - POST /api/folders/{foreign}/share → 404
    - GET  /api/folders/share/{slug} (no auth) → folder + owner + items + view++
    - GET  /api/folders/share/{nonexistent} → 404
    - GET  /api/folders/share/{slug} items hide transcripts/wlad_assessment
    - DELETE /api/folders/{id}/share → public GET → 404

NOTE: LLM calls cost money. Budget ~4 paid calls total
  (2 briefings + 2 chats). Primary account = accelerator (has credits + likely
  has real video archive entries with analysis); foreign account = test@test.com.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

PRIMARY_EMAIL = "accelerator@wladbot.test"
PRIMARY_PASSWORD = os.environ.get("TEST_PASSWORD", "test123")
OTHER_EMAIL = "test@test.com"
OTHER_PASSWORD = os.environ.get("TEST_PASSWORD", "test123")


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
        pytest.skip("test@test.com login failed — skipping ownership tests")
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


def _cleanup(h):
    r = requests.get(f"{BASE_URL}/api/folders", headers=h, timeout=20)
    if r.status_code == 200:
        for f in r.json():
            if (f.get("name") or "").startswith("TEST_iter92239"):
                requests.delete(
                    f"{BASE_URL}/api/folders/{f['folder_id']}",
                    headers=h, timeout=20,
                )


@pytest.fixture(scope="module", autouse=True)
def _cleanup_around(primary_headers, other_headers):
    _cleanup(primary_headers)
    _cleanup(other_headers)
    yield
    _cleanup(primary_headers)
    _cleanup(other_headers)


def _find_real_video_entry(headers) -> tuple[str | None, dict | None]:
    """Find an existing video_challenges entry with `analysis` populated."""
    r = requests.get(f"{BASE_URL}/api/video-archive", headers=headers, timeout=20)
    if r.status_code != 200 or not isinstance(r.json(), list):
        return None, None
    for row in r.json():
        if row.get("analysis"):
            return row.get("entry_id"), row
    if r.json():
        return r.json()[0].get("entry_id"), r.json()[0]
    return None, None


@pytest.fixture(scope="module")
def owned_folder_with_item(primary_headers):
    """Folder owned by primary user with one linked video_mission item."""
    f = requests.post(
        f"{BASE_URL}/api/folders",
        headers=primary_headers,
        json={
            "name": "TEST_iter92239_full",
            "context_summary": (
                "Vorbereitung Board-Pitch fuer Q1 2026. KPI-Logik (ARR, NRR, "
                "CAC-Payback). Stakeholder: CFO + 2 VCs. Max 5 Minuten."
            ),
        },
        timeout=20,
    ).json()
    fid = f["folder_id"]
    entry_id, _row = _find_real_video_entry(primary_headers)
    if not entry_id:
        # Synthetic fallback — link will still create folder_item row but
        # _fetch_video_item will return None (no matching video_challenges).
        entry_id = f"vid_TEST_{uuid.uuid4().hex[:8]}"
    r = requests.post(
        f"{BASE_URL}/api/folders/{fid}/items",
        headers=primary_headers,
        json={"item_type": "video_mission", "source_id": entry_id, "title": "TEST mission"},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    return fid, entry_id


@pytest.fixture(scope="module")
def owned_empty_folder(primary_headers):
    f = requests.post(
        f"{BASE_URL}/api/folders",
        headers=primary_headers,
        json={
            "name": "TEST_iter92239_empty",
            "context_summary": "Leerer Ordner fuer Briefing-Empty-Path-Test.",
        },
        timeout=20,
    ).json()
    return f["folder_id"]


@pytest.fixture(scope="module")
def foreign_folder(other_headers):
    f = requests.post(
        f"{BASE_URL}/api/folders",
        headers=other_headers,
        json={"name": "TEST_iter92239_foreign"},
        timeout=20,
    ).json()
    return f["folder_id"]


# ════════════════════════════════════════════════════════════════════════════
# P1 — Briefing endpoint
# ════════════════════════════════════════════════════════════════════════════

# LLM-paid: briefing on folder with linked video mission
def test_01_briefing_owned_with_items(primary_headers, owned_folder_with_item):
    fid, _eid = owned_folder_with_item
    r = requests.post(
        f"{BASE_URL}/api/folders/{fid}/briefing",
        headers=primary_headers,
        timeout=60,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["folder_id"] == fid
    assert body.get("folder_name", "").startswith("TEST_iter92239")
    assert isinstance(body.get("briefing"), str) and len(body["briefing"].strip()) > 20, body
    assert isinstance(body.get("items_used"), int) and body["items_used"] >= 0
    assert "generated_at" in body


# LLM-paid: briefing on EMPTY folder
def test_02_briefing_owned_empty(primary_headers, owned_empty_folder):
    fid = owned_empty_folder
    r = requests.post(
        f"{BASE_URL}/api/folders/{fid}/briefing",
        headers=primary_headers,
        timeout=60,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["folder_id"] == fid
    assert body["items_used"] == 0
    assert isinstance(body.get("briefing"), str) and len(body["briefing"].strip()) > 5


# Briefing on foreign folder → 404
def test_03_briefing_foreign_404(primary_headers, foreign_folder):
    r = requests.post(
        f"{BASE_URL}/api/folders/{foreign_folder}/briefing",
        headers=primary_headers,
        timeout=20,
    )
    assert r.status_code == 404, r.text


# Briefing on non-existent folder → 404
def test_04_briefing_nonexistent_404(primary_headers):
    r = requests.post(
        f"{BASE_URL}/api/folders/fld_doesnotexist_xx/briefing",
        headers=primary_headers,
        timeout=20,
    )
    assert r.status_code == 404, r.text


# ════════════════════════════════════════════════════════════════════════════
# P2 — Sharing endpoints
# ════════════════════════════════════════════════════════════════════════════

# Share: idempotent slug — same slug on 2nd call
def test_05_share_idempotent(primary_headers, owned_folder_with_item):
    fid, _ = owned_folder_with_item
    r1 = requests.post(f"{BASE_URL}/api/folders/{fid}/share", headers=primary_headers, timeout=20)
    assert r1.status_code == 200, r1.text
    slug1 = r1.json().get("slug")
    assert slug1 and isinstance(slug1, str)
    assert r1.json().get("share_url") == f"/f/{slug1}"

    r2 = requests.post(f"{BASE_URL}/api/folders/{fid}/share", headers=primary_headers, timeout=20)
    assert r2.status_code == 200, r2.text
    assert r2.json()["slug"] == slug1, "share slug must be idempotent"


# Share foreign folder → 404
def test_06_share_foreign_404(primary_headers, foreign_folder):
    r = requests.post(
        f"{BASE_URL}/api/folders/{foreign_folder}/share",
        headers=primary_headers,
        timeout=20,
    )
    assert r.status_code == 404, r.text


# Public GET — no auth, returns scrubbed payload + increments views
def test_07_public_get_shared_no_auth_and_views(primary_headers, owned_folder_with_item):
    fid, _ = owned_folder_with_item
    s = requests.post(
        f"{BASE_URL}/api/folders/{fid}/share",
        headers=primary_headers,
        timeout=20,
    ).json()
    slug = s["slug"]

    # NO auth header — public endpoint
    r1 = requests.get(f"{BASE_URL}/api/folders/share/{slug}", timeout=20)
    assert r1.status_code == 200, r1.text
    body1 = r1.json()
    assert "folder" in body1 and "owner" in body1 and "items" in body1 and "share" in body1
    assert body1["folder"].get("name", "").startswith("TEST_iter92239")
    assert "email" not in (body1.get("owner") or {})
    v1 = body1["share"].get("views")
    assert isinstance(v1, int) and v1 >= 1

    # Hit again — views should increment
    r2 = requests.get(f"{BASE_URL}/api/folders/share/{slug}", timeout=20)
    assert r2.status_code == 200
    v2 = r2.json()["share"]["views"]
    assert v2 > v1, f"views did not increment: {v1} -> {v2}"


# Public GET nonexistent → 404
def test_08_public_get_nonexistent_404():
    r = requests.get(f"{BASE_URL}/api/folders/share/doesnotexist_xx", timeout=20)
    assert r.status_code == 404, r.text


# Item scrubbing — no transcripts, no wlad_assessment leak
def test_09_public_items_pii_light(primary_headers, owned_folder_with_item):
    fid, _ = owned_folder_with_item
    s = requests.post(
        f"{BASE_URL}/api/folders/{fid}/share",
        headers=primary_headers,
        timeout=20,
    ).json()
    slug = s["slug"]
    body = requests.get(f"{BASE_URL}/api/folders/share/{slug}", timeout=20).json()
    for it in body.get("items", []):
        # Only safe fields allowed
        forbidden = {"transcript", "wlad_assessment", "strengths", "improvements",
                     "analysis", "full_text"}
        leaked = set(it.keys()) & forbidden
        assert not leaked, f"PII leak in item: {leaked} (item={it})"
        assert it.get("item_type") in {"video_mission", "chat_session"}
        if it["item_type"] == "video_mission":
            # Only title + score + created_at allowed
            assert set(it.keys()) <= {"item_type", "title", "score", "created_at"}, it
        else:
            assert set(it.keys()) <= {"item_type", "title", "created_at"}, it


# Unshare — DELETE removes share, public GET → 404
def test_10_unshare_then_public_get_404(primary_headers, owned_empty_folder):
    fid = owned_empty_folder
    s = requests.post(f"{BASE_URL}/api/folders/{fid}/share", headers=primary_headers, timeout=20).json()
    slug = s["slug"]
    # Sanity: public visible
    assert requests.get(f"{BASE_URL}/api/folders/share/{slug}", timeout=20).status_code == 200
    # Unshare
    d = requests.delete(f"{BASE_URL}/api/folders/{fid}/share", headers=primary_headers, timeout=20)
    assert d.status_code == 200, d.text
    assert d.json().get("deleted", 0) >= 1
    # Now public GET → 404
    r = requests.get(f"{BASE_URL}/api/folders/share/{slug}", timeout=20)
    assert r.status_code == 404


# ════════════════════════════════════════════════════════════════════════════
# P1 — Knowledge-RAG via /api/chat
# ════════════════════════════════════════════════════════════════════════════

# LLM-paid: chat with folder that has video_mission item → folder_context_used=true
def test_11_chat_folder_context_with_items(primary_headers, owned_folder_with_item):
    fid, _ = owned_folder_with_item
    r = requests.post(
        f"{BASE_URL}/api/chat",
        headers=primary_headers,
        json={
            "message": "Wie bereite ich mich konkret auf das naechste Update im Board-Pitch vor?",
            "agent": "auto",
            "folder_id": fid,
        },
        timeout=120,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("folder_context_used") is True, body
    assert body.get("session_id")
    assert body.get("response") or body.get("raw")


# LLM-paid: chat with empty folder → folder_context_used still true, graceful
def test_12_chat_folder_context_empty_folder(primary_headers, owned_empty_folder):
    fid = owned_empty_folder
    r = requests.post(
        f"{BASE_URL}/api/chat",
        headers=primary_headers,
        json={
            "message": "Was sollte ich als erstes in diesen Ordner ablegen?",
            "agent": "auto",
            "folder_id": fid,
        },
        timeout=120,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("folder_context_used") is True, body


# ════════════════════════════════════════════════════════════════════════════
# Regression — Iter 92.23.8 endpoints still healthy
# ════════════════════════════════════════════════════════════════════════════

def test_13_regression_list_folders(primary_headers):
    r = requests.get(f"{BASE_URL}/api/folders", headers=primary_headers, timeout=20)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_14_regression_chat_sessions_folder_filter(primary_headers, owned_folder_with_item):
    fid, _ = owned_folder_with_item
    r = requests.get(
        f"{BASE_URL}/api/chat/sessions?folder_id={fid}",
        headers=primary_headers, timeout=20,
    )
    assert r.status_code == 200
    sessions = r.json()
    assert isinstance(sessions, list)
    for s in sessions:
        assert s.get("folder_id") == fid
