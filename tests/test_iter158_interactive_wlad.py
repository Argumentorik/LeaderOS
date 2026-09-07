"""Iter 158 backend tests: Interactive Wlad Beta open for paid tiers + 3 free trial turns.

Executes only max 2 paid /turn calls (~$0.02) as per instructions.
No files under /app/backend to avoid hot-reload killing Fal jobs.
"""
import os
import time
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://command-center-229.preview.emergentagent.com").rstrip("/")

USERS = {
    "admin": ("test@test.com", "test123"),
    "free": ("free@wladbot.test", "test123"),
    "standard": ("standard@wladbot.test", "test123"),
    "accelerator": ("accelerator@wladbot.test", "test123"),
}


def _login(email, password):
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"identifier": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login {email} failed: {r.status_code} {r.text[:200]}"
    j = r.json()
    return j.get("access_token") or j["token"]


@pytest.fixture(scope="module")
def tokens():
    return {k: _login(*v) for k, v in USERS.items()}


def _hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


# --- Status tests ---
def test_status_free(tokens):
    r = requests.get(f"{BASE}/api/guide/interactive/status", headers=_hdr(tokens["free"]), timeout=15)
    assert r.status_code == 200
    d = r.json()
    print("FREE status:", d)
    assert d["tier"] == "free"
    assert d["trial"] is True
    assert d["trial_total"] == 3
    assert isinstance(d["trial_left"], int)
    # trial_left could be 0..3 depending on prior test runs
    if d["trial_left"] > 0:
        assert d["locked"] is False


def test_status_standard(tokens):
    r = requests.get(f"{BASE}/api/guide/interactive/status", headers=_hdr(tokens["standard"]), timeout=15)
    d = r.json()
    print("STANDARD status:", d)
    assert r.status_code == 200
    assert d["tier"] == "standard"
    assert d["locked"] is False
    assert d["trial"] is False


def test_status_accelerator(tokens):
    r = requests.get(f"{BASE}/api/guide/interactive/status", headers=_hdr(tokens["accelerator"]), timeout=15)
    d = r.json()
    print("ACCEL status:", d)
    assert r.status_code == 200
    assert d["locked"] is False
    assert d["trial"] is False


def test_status_admin(tokens):
    r = requests.get(f"{BASE}/api/guide/interactive/status", headers=_hdr(tokens["admin"]), timeout=15)
    d = r.json()
    print("ADMIN status:", d)
    assert r.status_code == 200
    assert d["locked"] is False


# --- Clips tests ---
def test_clips_feature_free(tokens):
    r = requests.get(f"{BASE}/api/guide/clips?kind=feature", headers=_hdr(tokens["free"]), timeout=15)
    assert r.status_code == 200
    data = r.json()
    clips = data.get("clips") or data.get("items") or data
    if isinstance(clips, dict):
        clips = clips.get("clips") or clips.get("items") or []
    slugs = {c["slug"] for c in clips}
    print("Feature slugs:", slugs)
    assert {"bp-playbooks", "bp-missionen", "bp-video-analyse"}.issubset(slugs)
    for c in clips:
        if c["slug"] in ("bp-playbooks", "bp-missionen", "bp-video-analyse"):
            assert "questions" in c and len(c["questions"]) == 3
            assert c.get("video_url") in (None, "")


def test_clips_onboarding_has_questions(tokens):
    r = requests.get(f"{BASE}/api/guide/clips?kind=onboarding", headers=_hdr(tokens["free"]), timeout=15)
    assert r.status_code == 200
    data = r.json()
    clips = data.get("clips") or data.get("items") or []
    if not clips and isinstance(data, list):
        clips = data
    assert clips, "no onboarding clips"
    for c in clips[:1]:
        assert "questions" in c
        assert len(c["questions"]) == 3


# --- Admin PUT tests ---
def test_admin_put_and_reset(tokens):
    # Non-admin forbidden
    r = requests.put(f"{BASE}/api/guide/interactive/admin",
                     headers=_hdr(tokens["free"]), json={"free_trial_turns": 5}, timeout=15)
    assert r.status_code == 403

    # Admin sets trial to 5
    r = requests.put(f"{BASE}/api/guide/interactive/admin",
                     headers=_hdr(tokens["admin"]), json={"free_trial_turns": 5}, timeout=15)
    assert r.status_code == 200
    assert r.json()["free_trial_turns"] == 5

    # Verify free sees trial_total=5
    r2 = requests.get(f"{BASE}/api/guide/interactive/status", headers=_hdr(tokens["free"]), timeout=15)
    assert r2.json()["trial_total"] == 5

    # Reset to 3
    r = requests.put(f"{BASE}/api/guide/interactive/admin",
                     headers=_hdr(tokens["admin"]), json={"free_trial_turns": 3}, timeout=15)
    assert r.status_code == 200
    assert r.json()["free_trial_turns"] == 3

    # Close paid_open: standard user should become locked (trial=True but not paid)
    r = requests.put(f"{BASE}/api/guide/interactive/admin",
                     headers=_hdr(tokens["admin"]), json={"paid_open": False}, timeout=15)
    assert r.status_code == 200
    rs = requests.get(f"{BASE}/api/guide/interactive/status", headers=_hdr(tokens["standard"]), timeout=15)
    ds = rs.json()
    print("STANDARD status when paid_open=false:", ds)
    assert ds["locked"] is True
    assert ds["trial"] is True

    # Restore final state: enabled=false, paid_open=true, free_trial_turns=3
    r = requests.put(f"{BASE}/api/guide/interactive/admin",
                     headers=_hdr(tokens["admin"]),
                     json={"enabled": False, "paid_open": True, "free_trial_turns": 3}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["enabled"] is False
    assert d["paid_open"] is True
    assert d["free_trial_turns"] == 3


# --- Turn tests (COSTS money, max 2 total) ---
@pytest.mark.order(after="test_admin_put_and_reset")
def test_free_turn_and_lock(tokens):
    """Runs max 2 paid /turn calls: enough to drain trial_left to 0 and verify 403."""
    tok = tokens["free"]
    r = requests.get(f"{BASE}/api/guide/interactive/status", headers=_hdr(tok), timeout=15)
    st = r.json()
    trial_left_before = st["trial_left"]
    print(f"Free trial_left before turn: {trial_left_before}")

    if trial_left_before == 0:
        # Already 0 - just verify locked and /turn returns 403
        assert st["locked"] is True
        rt = requests.post(f"{BASE}/api/guide/interactive/turn",
                           headers=_hdr(tok),
                           data={"text": "Was ist der häufigste Fehler dabei?", "context_title": "Test"},
                           timeout=90)
        assert rt.status_code == 403
        return

    # Do turn 1
    rt = requests.post(f"{BASE}/api/guide/interactive/turn",
                       headers=_hdr(tok),
                       data={"text": "Was ist der häufigste Fehler dabei?", "context_title": "Test"},
                       timeout=90)
    print("Turn1 status:", rt.status_code, "body preview:", rt.text[:300])
    assert rt.status_code == 200, rt.text[:400]
    j = rt.json()
    assert j.get("response_text")
    assert j["trial"] is True
    assert j["trial_left"] == trial_left_before - 1
    session_id = j["session_id"]

    remaining = trial_left_before - 1

    # If we can drain to 0 in one more turn (i.e. remaining == 1), do it
    if remaining == 1:
        rt2 = requests.post(f"{BASE}/api/guide/interactive/turn",
                            headers=_hdr(tok),
                            data={"text": "Und was hilft am meisten dagegen?", "context_title": "Test"},
                            timeout=90)
        print("Turn2 status:", rt2.status_code)
        assert rt2.status_code == 200
        j2 = rt2.json()
        assert j2["trial_left"] == 0
        session_id = j2["session_id"]

        # Now expect locked
        rs = requests.get(f"{BASE}/api/guide/interactive/status", headers=_hdr(tok), timeout=15)
        assert rs.json()["locked"] is True

        # Next /turn -> 403
        rt3 = requests.post(f"{BASE}/api/guide/interactive/turn",
                            headers=_hdr(tok),
                            data={"text": "test", "context_title": "Test"},
                            timeout=30)
        assert rt3.status_code == 403
        assert "interactive_locked" in rt3.text

        # /speak must still work with session_id from last turn
        rsp = requests.post(f"{BASE}/api/guide/interactive/speak",
                            headers=_hdr(tok),
                            json={"text": j2["response_text"][:200], "session_id": session_id},
                            timeout=90)
        print("Speak (locked user, last-answer): status", rsp.status_code)
        assert rsp.status_code == 200, rsp.text[:300]
        assert rsp.json().get("audio_url", "").startswith("data:audio/mpeg;base64,")
    else:
        # remaining > 1: don't drain further per instructions - just log
        print(f"After 1 turn, remaining={remaining} (>1). Not draining further to save cost.")
