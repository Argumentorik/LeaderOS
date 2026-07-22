"""Iter 121 — Go-Live Lockdown backend regression."""
import os
import sys
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to reading frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break

TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    tok = r.json().get("token")
    assert tok
    return tok


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ── PRELAUNCH LOCK ─────────────────────────────────────────────────────
class TestPrelaunchLock:
    def test_my_path_videos_all_locked(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/my-path/videos", headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("prelaunch_lock") is True
        assert data.get("unlocked_count") == 0
        starters = data.get("starter_videos", [])
        accels = data.get("accelerator_videos", [])
        assert len(starters) + len(accels) > 0, "no videos returned"
        for v in starters + accels:
            assert v.get("unlocked") is False, f"{v.get('id')} unlocked"
            assert v.get("locked_reason") == "prelaunch", f"{v.get('id')} bad reason={v.get('locked_reason')}"


# ── VOICE FRAMEWORK MAP (unit) ─────────────────────────────────────────
class TestVoiceFrameworkMap:
    def test_sexier_maps_to_framework(self):
        sys.path.insert(0, "/app/backend")
        from voice_framework_map import enrich_transcript
        out = enrich_transcript("sexier ist toll")
        names = [m["framework"] for m in out["matched_frameworks"]]
        assert "SEXIER-Argumentation" in names
        assert out["low_confidence"] is False

    def test_short_input_low_confidence(self):
        sys.path.insert(0, "/app/backend")
        from voice_framework_map import enrich_transcript
        out = enrich_transcript("ok")
        assert out["low_confidence"] is True
        assert out["hint"] and "deutlich" in out["hint"].lower()

    def test_multi_framework(self):
        sys.path.insert(0, "/app/backend")
        from voice_framework_map import enrich_transcript
        out = enrich_transcript("Wie funktioniert logos pathos und batna?")
        names = {m["framework"] for m in out["matched_frameworks"]}
        assert "3 Säulen der Überzeugung" in names
        assert "Verhandeln nach Wlad" in names
        assert out["is_question"] is True


# ── VOICE TRANSCRIBE ROUTE HAS FRAMEWORK-BOOST WIRING ──────────────────
class TestVoiceTtsFrameworkBlock:
    def test_framework_block_in_source(self):
        with open("/app/backend/routes/voice_tts.py") as f:
            src = f.read()
        assert "framework_block" in src
        assert "match_frameworks" in src
        assert "framework_block" in src.split("system_msg", 1)[1][:200]


# ── LEADERCHECK.DE SYNC ────────────────────────────────────────────────
class TestLeadercheckSync:
    def test_sync_status_schema(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/wladhub/sync/status", headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("bridge_configured", "email_used", "leader_check_has_data",
                  "leader_check_row_count", "has_local_diagnosis",
                  "last_local_sync", "leadercheck_url"):
            assert k in d, f"missing key {k}"
        assert d["leadercheck_url"] == "https://leader-check.de"
        assert d["email_used"] == TEST_EMAIL
        assert d["bridge_configured"] is True
        # test@test.com is expected to have no supabase insight
        assert d["leader_check_has_data"] is False

    def test_sync_post_empty(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/wladhub/sync", headers=auth_headers, json={}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("status") in {"synced", "no_data", "local_data"}
        if d["status"] == "synced":
            assert isinstance(d.get("records_imported"), int)
        elif d["status"] == "no_data":
            assert "leader-check.de" in (d.get("message", "") + d.get("wladhub_url", ""))


# ── DELETE TEST ACCOUNTS SCRIPT ────────────────────────────────────────
class TestDeleteScript:
    def test_purge_no_matches(self):
        import subprocess
        res = subprocess.run(
            ["python", "/app/backend/scripts_delete_test_accounts.py"],
            capture_output=True, text=True, timeout=30,
        )
        assert res.returncode == 0, f"stderr={res.stderr}\nstdout={res.stdout}"
        assert "No matching accounts found" in res.stdout or "nothing to delete" in res.stdout


# ── SMOKE: dashboard still loads (basic auth regression) ───────────────
class TestBasicAuthRegression:
    def test_me_endpoint(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        assert r.json().get("email") == TEST_EMAIL
