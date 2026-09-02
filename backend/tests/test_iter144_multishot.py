"""Iter 144 — Multi-Shot Onboarding-Videos, öffentlicher Login-Teaser, Wlad-Minimax-TTS.

WICHTIG: Es werden KEINE kostenpflichtigen Fal-Jobs ausgelöst.
Nur Negativfälle, die vor dem Job abbrechen (400/404/401/403) + ein TTS-Aufruf (Cent-Bereich).
"""
import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

ADMIN = {"email": "test@test.com", "password": "test123"}
FREE = {"email": "free@wladbot.test", "password": "test123"}
CLIP = "start-1-willkommen"
CLIP2 = "start-2-so-sprichst-du"


# ── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _token(client, creds):
    r = client.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"Login failed for {creds['email']}: {r.status_code} {r.text[:300]}")
    tok = r.json().get("token")
    if not tok:
        pytest.fail("No token in login response")
    return tok


@pytest.fixture(scope="session")
def admin_token(client):
    return _token(client, ADMIN)


@pytest.fixture(scope="session")
def free_token(client):
    return _token(client, FREE)


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def free_headers(free_token):
    return {"Authorization": f"Bearer {free_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def clip_doc(admin_headers):
    r = requests.get(f"{BASE_URL}/api/guide/admin/clips/{CLIP}", headers=admin_headers, timeout=60)
    assert r.status_code == 200, f"{r.status_code}: {r.text[:400]}"
    return r.json()


# ── Public teaser (kein Login) ──────────────────────────────────────────────

class TestPublicTeaser:
    def test_public_teaser_no_auth(self):
        r = requests.get(f"{BASE_URL}/api/guide/public/teaser", timeout=60)
        assert r.status_code == 200, r.text[:300]
        clip = r.json().get("clip")
        assert clip is not None, "Kein freigegebener Teaser vorhanden"
        assert clip["slug"] == "teaser-spotlight"
        assert isinstance(clip["title"], str) and clip["title"]
        assert isinstance(clip["script"], str) and clip["script"]
        assert clip["video_url"].startswith("/api/guide/media/")
        assert clip["video_url"].endswith("/video")
        assert clip["poster_url"], "poster_url fehlt"

    def test_teaser_video_full(self):
        url = requests.get(f"{BASE_URL}/api/guide/public/teaser", timeout=60).json()["clip"]["video_url"]
        r = requests.get(f"{BASE_URL}{url}", timeout=120)
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("video/mp4")
        assert len(r.content) > 10000
        assert r.headers.get("accept-ranges") == "bytes"

    def test_teaser_video_range(self):
        url = requests.get(f"{BASE_URL}/api/guide/public/teaser", timeout=60).json()["clip"]["video_url"]
        r = requests.get(f"{BASE_URL}{url}", headers={"Range": "bytes=0-1023"}, timeout=120)
        assert r.status_code == 206, f"expected 206, got {r.status_code}"
        assert "Content-Range" in r.headers
        assert r.headers["Content-Range"].startswith("bytes 0-1023/")
        assert len(r.content) == 1024, f"expected 1024 bytes, got {len(r.content)}"

    def test_teaser_poster_public(self):
        url = requests.get(f"{BASE_URL}/api/guide/public/teaser", timeout=60).json()["clip"]["poster_url"]
        r = requests.get(f"{BASE_URL}{url}", timeout=60)
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("image/png")


# ── Multi-Shot Clip start-1-willkommen ──────────────────────────────────────

class TestMultiShotClip:
    def test_clip_meta(self, clip_doc):
        assert clip_doc["multi_shot"] is True
        assert clip_doc["status"] == "video_ready", f"status={clip_doc['status']}"
        assert clip_doc.get("pipeline") == "multishot"
        assert clip_doc.get("video_url"), "video_url nicht gesetzt"

    def test_four_shots(self, clip_doc):
        shots = clip_doc.get("shots") or []
        assert len(shots) == 4, f"expected 4 shots, got {len(shots)}"
        assert [s["id"] for s in shots] == ["s1", "s2", "s3", "s4"]
        assert [s["type"] for s in shots] == ["walk", "talk", "broll", "talk"]

    def test_shot_s1_walk(self, clip_doc):
        s1 = clip_doc["shots"][0]
        assert s1["preset"] == "loft_walk_in"
        assert str(s1.get("duration")) == "5", f"duration={s1.get('duration')}"
        assert s1["keyframe_url"], "s1 keyframe_url fehlt"
        assert s1["raw_url"], "s1 raw_url fehlt"
        assert not s1.get("text"), f"walk shot darf keinen Text haben: {s1.get('text')!r}"

    def test_shot_s2_talk(self, clip_doc):
        s2 = clip_doc["shots"][1]
        for k in ("keyframe_url", "raw_url", "audio_url", "padded_url", "synced_url"):
            assert s2[k], f"s2 {k} fehlt"
        assert isinstance(s2.get("audio_seconds"), (int, float)), f"audio_seconds={s2.get('audio_seconds')}"

    def test_shot_s3_broll(self, clip_doc):
        s3 = clip_doc["shots"][2]
        assert s3["screens"] == ["dashboard", "chat", "video", "challenge"], s3["screens"]
        assert s3["audio_url"], "s3 audio_url fehlt"
        assert not s3.get("keyframe_url"), "b-roll darf keinen Keyframe haben"

    def test_shot_s4_talk(self, clip_doc):
        s4 = clip_doc["shots"][3]
        for k in ("keyframe_url", "raw_url", "audio_url", "padded_url", "synced_url"):
            assert s4[k], f"s4 {k} fehlt"

    @pytest.mark.parametrize("kind,ctype", [
        ("keyframe", "image/png"), ("raw", "video/mp4"), ("synced", "video/mp4"),
        ("audio", "audio/mpeg"), ("padded", "audio/mpeg"),
    ])
    def test_shot_media_public(self, clip_doc, kind, ctype):
        """Jede vorhandene Shot-URL ist ohne Login abrufbar mit passendem Content-Type."""
        checked = 0
        for shot in clip_doc["shots"]:
            url = shot.get(f"{kind}_url")
            if not url:
                continue
            assert url.startswith("/api/guide/media/") and f"/shot/{shot['id']}/{kind}" in url
            r = requests.get(f"{BASE_URL}{url}", timeout=120)
            assert r.status_code == 200, f"{shot['id']}/{kind} -> {r.status_code}"
            assert r.headers["content-type"].startswith(ctype), \
                f"{shot['id']}/{kind} content-type={r.headers['content-type']}"
            assert len(r.content) > 500
            checked += 1
        assert checked > 0, f"keine {kind}-URL vorhanden"

    def test_shot_media_invalid_kind(self, clip_doc):
        token = clip_doc["shots"][0]["keyframe_url"].split("/")[4]
        r = requests.get(f"{BASE_URL}/api/guide/media/{token}/shot/s1/bogus", timeout=30)
        assert r.status_code == 404, r.status_code

    def test_shot_media_unknown_shot(self, clip_doc):
        token = clip_doc["shots"][0]["keyframe_url"].split("/")[4]
        r = requests.get(f"{BASE_URL}/api/guide/media/{token}/shot/s99/keyframe", timeout=30)
        assert r.status_code == 404, r.status_code


# ── B-Roll Screens ──────────────────────────────────────────────────────────

class TestBroll:
    @pytest.mark.parametrize("screen", ["dashboard", "chat", "video", "challenge", "simulations"])
    def test_broll_png_public(self, screen):
        r = requests.get(f"{BASE_URL}/api/guide/broll/{screen}", timeout=60)
        assert r.status_code == 200, f"{screen} -> {r.status_code}"
        assert r.headers["content-type"].startswith("image/png")
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n"

    def test_broll_unknown_404(self):
        r = requests.get(f"{BASE_URL}/api/guide/broll/foo", timeout=30)
        assert r.status_code == 404


# ── Admin overview ──────────────────────────────────────────────────────────

class TestAdminOverview:
    def test_overview_has_broll_and_costs(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/guide/admin/overview", headers=admin_headers, timeout=60)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        screens = data.get("broll_screens")
        assert isinstance(screens, dict), f"broll_screens type={type(screens)}"
        assert len(screens) == 5, f"expected 5 keys, got {list(screens)}"
        assert set(screens) == {"dashboard", "chat", "video", "challenge", "simulations"}
        costs = data.get("costs")
        assert isinstance(costs, dict) and costs.get("keyframe") is not None


# ── save_shots Validierung (ohne Nebenwirkungen) ────────────────────────────

def _shots_url(slug=CLIP):
    return f"{BASE_URL}/api/guide/admin/clips/{slug}/shots"


class TestSaveShotsValidation:
    def test_walk_shot_mute(self, admin_headers):
        r = requests.put(_shots_url(), headers=admin_headers,
                         json={"shots": [{"id": "s1", "text": "Hallo"}]}, timeout=60)
        assert r.status_code == 400, f"{r.status_code}: {r.text[:300]}"
        assert "stumm" in r.json()["detail"], r.json()

    def test_talk_word_limit(self, admin_headers):
        long_text = " ".join(f"Wort{i}" for i in range(30))
        r = requests.put(_shots_url(), headers=admin_headers,
                         json={"shots": [{"id": "s2", "text": long_text}]}, timeout=60)
        assert r.status_code == 400, f"{r.status_code}: {r.text[:300]}"
        assert "26 W" in r.json()["detail"], r.json()

    def test_broll_empty_screens(self, admin_headers):
        r = requests.put(_shots_url(), headers=admin_headers,
                         json={"shots": [{"id": "s3", "screens": []}]}, timeout=60)
        assert r.status_code == 400, f"{r.status_code}: {r.text[:300]}"

    def test_unknown_shot_404(self, admin_headers):
        r = requests.put(_shots_url(), headers=admin_headers,
                         json={"shots": [{"id": "s9", "text": "x"}]}, timeout=60)
        assert r.status_code == 404, f"{r.status_code}: {r.text[:300]}"

    def test_no_side_effects_after_failed_validation(self, admin_headers):
        """Nach den 400/404-Fällen müssen alle Renderergebnisse noch da sein."""
        r = requests.get(f"{BASE_URL}/api/guide/admin/clips/{CLIP}", headers=admin_headers, timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "video_ready"
        shots = {s["id"]: s for s in d["shots"]}
        assert shots["s2"]["audio_url"] and shots["s2"]["synced_url"]
        assert shots["s3"]["audio_url"]
        assert shots["s4"]["synced_url"]

    def test_identical_screens_keeps_audio(self, admin_headers):
        payload = {"shots": [{"id": "s3", "screens": ["dashboard", "chat", "video", "challenge"]}]}
        r = requests.put(_shots_url(), headers=admin_headers, json=payload, timeout=60)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
        assert r.json().get("ok") is True
        after = requests.get(f"{BASE_URL}/api/guide/admin/clips/{CLIP}",
                             headers=admin_headers, timeout=60).json()
        s3 = next(s for s in after["shots"] if s["id"] == "s3")
        assert s3["audio_url"], "unveränderter Text/Screens hat audio_url gelöscht!"
        assert s3["screens"] == ["dashboard", "chat", "video", "challenge"]
        assert after["status"] == "video_ready"
        assert after.get("video_url")

    def test_shots_unauthorized(self):
        r = requests.put(_shots_url(), json={"shots": [{"id": "s1"}]},
                         headers={"Content-Type": "application/json"}, timeout=60)
        assert r.status_code == 401, f"{r.status_code}: {r.text[:200]}"

    def test_shots_forbidden_for_free_user(self, free_headers):
        r = requests.put(_shots_url(), headers=free_headers,
                         json={"shots": [{"id": "s1"}]}, timeout=60)
        assert r.status_code == 403, f"{r.status_code}: {r.text[:200]}"


# ── Kostenlose Abbrüche vor dem Job ─────────────────────────────────────────

class TestUnplannedClipGuards:
    def test_render_requires_plan(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/guide/admin/clips/{CLIP2}/render",
                          headers=admin_headers, timeout=60)
        assert r.status_code == 400, f"{r.status_code}: {r.text[:300]}"
        assert "planen" in r.json()["detail"], r.json()

    def test_shot_keyframes_requires_plan(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/guide/admin/clips/{CLIP2}/shot-keyframes",
                          headers=admin_headers, timeout=60)
        assert r.status_code == 400, f"{r.status_code}: {r.text[:300]}"
        assert "planen" in r.json()["detail"], r.json()

    def test_clip2_not_running_after_guards(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/guide/admin/clips/{CLIP2}", headers=admin_headers, timeout=60)
        assert r.status_code == 200
        assert not r.json()["status"].endswith("_running"), r.json()["status"]


# ── Voice / TTS Wlad-Persona (Minimax-Klon) ─────────────────────────────────

WLAD_VOICE_ID = "Voice6717536d1788310928"


class TestVoiceWladPersona:
    def test_personas_contains_wlad(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/voice/personas", headers=admin_headers, timeout=60)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
        data = r.json()
        blob = str(data)
        assert "wlad" in blob.lower(), f"wlad persona fehlt: {blob[:400]}"

    def test_tts_wlad_minimax(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/voice/tts", headers=admin_headers,
                          json={"text": "Kurzer Test.", "persona": "wlad"}, timeout=180)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:500]}"
        data = r.json()
        assert data.get("voice_id") == WLAD_VOICE_ID, f"voice_id={data.get('voice_id')}"
        assert str(data.get("audio_url", "")).startswith("data:audio/mpeg;base64,"), \
            str(data.get("audio_url"))[:120]
        assert data.get("bytes", 0) > 5000, f"bytes={data.get('bytes')}"

    def test_tts_wlad_cached_on_repeat(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/voice/tts", headers=admin_headers,
                          json={"text": "Kurzer Test.", "persona": "wlad"}, timeout=180)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:500]}"
        data = r.json()
        assert data.get("cached") is True, f"cached={data.get('cached')}"
        assert data.get("voice_id") == WLAD_VOICE_ID
