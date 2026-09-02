"""Iter 143 — Guide Studio cinematic pipeline (Admin) backend tests.

WICHTIG: Keine echten Generierungs-Endpunkte auslösen (Fal.ai kostet Geld).
Nur Negativfälle, die vor dem Hintergrundjob abbrechen (400/404).
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
USER = {"email": "free@wladbot.test", "password": "test123"}
TEASER = "teaser-spotlight"
ORIGINAL_SCRIPT = "Führung ist kein Talent. Führung ist ein System. Willkommen bei Leader-OS."


def _login(creds):
    r = requests.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=40)
    if r.status_code != 200:
        pytest.fail(f"Login failed for {creds['email']}: {r.status_code} {r.text[:300]}")
    token = r.json().get("token")
    assert token
    return token


@pytest.fixture(scope="module")
def admin_token():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def user_token():
    return _login(USER)


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def overview(admin_headers):
    r = requests.get(f"{BASE_URL}/api/guide/admin/overview", headers=admin_headers, timeout=60)
    assert r.status_code == 200, r.text[:400]
    return r.json()


# ── GET /api/guide/admin/overview ───────────────────────────────────────────
class TestAdminOverview:
    def test_teaser_clip_shape(self, overview):
        clips = overview["clips"]
        assert isinstance(clips, list) and clips
        c = clips[0]
        assert c["slug"] == TEASER
        assert c["kind"] == "teaser"
        assert c["status"] == "video_ready", f"status={c['status']}"
        for field in ("video_url", "keyframe_url", "raw_url", "audio_url", "padded_url"):
            assert c.get(field), f"{field} missing: {c.get(field)}"
        assert c["word_limits"] == [6, 30]
        shot = c["shot"]
        assert shot and shot.get("scene_prompt") and shot.get("motion_prompt")
        assert shot["duration"] == "10"
        assert shot["speech_start"] == 4.0
        # no mongo _id leaks
        assert "_id" not in c

    def test_settings(self, overview):
        s = overview["settings"]
        for field in ("portrait_url", "body_url", "voice_sample_url", "custom_voice_id"):
            assert s.get(field), f"settings.{field} missing"
        assert s["voice_id_in_use"] == s["custom_voice_id"]
        assert isinstance(s["spent_usd"], (int, float))

    def test_costs(self, overview):
        costs = overview["costs"]
        assert costs["keyframe"] == 0.04
        assert costs["i2v"] == {"5": 0.25, "10": 0.5}
        assert costs["lipsync_per_s"] == 0.014
        assert costs["voice_clone"] == 1.5

    def test_overview_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/guide/admin/overview", timeout=30)
        assert r.status_code == 401, r.status_code

    def test_overview_forbidden_for_non_admin(self, user_token):
        r = requests.get(f"{BASE_URL}/api/guide/admin/overview",
                         headers={"Authorization": f"Bearer {user_token}"}, timeout=30)
        assert r.status_code == 403, f"{r.status_code} {r.text[:200]}"


# ── GET /api/guide/media/{token}/{kind} (public) ────────────────────────────
class TestPublicMedia:
    def test_video(self, overview):
        r = requests.get(f"{BASE_URL}{overview['clips'][0]['video_url']}", timeout=120)
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("video/mp4")
        assert len(r.content) > 500 * 1024, f"only {len(r.content)} bytes"

    def test_keyframe(self, overview):
        r = requests.get(f"{BASE_URL}{overview['clips'][0]['keyframe_url']}", timeout=60)
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("image/png")
        assert len(r.content) > 10000

    def test_raw(self, overview):
        r = requests.get(f"{BASE_URL}{overview['clips'][0]['raw_url']}", timeout=120)
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("video/mp4")

    @pytest.mark.parametrize("kind", ["audio_url", "padded_url"])
    def test_audio(self, overview, kind):
        r = requests.get(f"{BASE_URL}{overview['clips'][0][kind]}", timeout=60)
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("audio/mpeg")
        assert len(r.content) > 5000

    @pytest.mark.parametrize("kind", ["portrait_url", "body_url"])
    def test_settings_images(self, overview, kind):
        r = requests.get(f"{BASE_URL}{overview['settings'][kind]}", timeout=60)
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("image/")

    def test_invalid_token(self):
        r = requests.get(f"{BASE_URL}/api/guide/media/not-a-real-token/video", timeout=30)
        assert r.status_code == 404

    def test_unknown_kind(self, overview):
        token = overview["clips"][0]["video_url"].rstrip("/").split("/")[-2]
        r = requests.get(f"{BASE_URL}/api/guide/media/{token}/foo", timeout=30)
        assert r.status_code == 404


# ── PUT /api/guide/admin/clips/{slug} — Wortgrenzen ─────────────────────────
class TestScriptSave:
    def _put(self, headers, slug, payload):
        return requests.put(f"{BASE_URL}/api/guide/admin/clips/{slug}", json=payload,
                            headers=headers, timeout=40)

    def test_too_short(self, admin_headers):
        r = self._put(admin_headers, TEASER, {"script": "Viel zu kurz"})
        assert r.status_code == 400
        assert "erlaubt sind 6 bis 30" in r.json()["detail"], r.text[:300]

    def test_too_long(self, admin_headers):
        r = self._put(admin_headers, TEASER, {"script": " ".join(["Wort"] * 40)})
        assert r.status_code == 400
        assert "erlaubt sind 6 bis 30" in r.json()["detail"]

    def test_onboarding_limits(self, admin_headers):
        r = self._put(admin_headers, "start-1-willkommen", {"script": " ".join(["Wort"] * 20)})
        assert r.status_code == 400
        assert "55 bis 115" in r.json()["detail"], r.text[:300]

    def test_valid_save_and_overrides_then_restore(self, admin_headers):
        scene = "TEST scene prompt for iter143 verification"
        motion = "TEST motion prompt for iter143 verification"
        r = self._put(admin_headers, TEASER, {"script": ORIGINAL_SCRIPT,
                                              "scene_prompt": scene, "motion_prompt": motion})
        assert r.status_code == 200, r.text[:300]
        assert r.json()["words"] == 11

        g = requests.get(f"{BASE_URL}/api/guide/admin/clips/{TEASER}", headers=admin_headers, timeout=30)
        assert g.status_code == 200
        data = g.json()
        assert data["shot"]["scene_prompt"] == scene
        assert data["shot"]["motion_prompt"] == motion
        assert data["script"] == ORIGINAL_SCRIPT

        # Restore original state (empty strings reset overrides to preset)
        r = self._put(admin_headers, TEASER, {"script": ORIGINAL_SCRIPT,
                                             "scene_prompt": "", "motion_prompt": ""})
        assert r.status_code == 200
        g = requests.get(f"{BASE_URL}/api/guide/admin/clips/{TEASER}", headers=admin_headers, timeout=30)
        restored = g.json()
        assert restored["script"] == ORIGINAL_SCRIPT
        assert restored["shot"]["scene_prompt"] != scene
        assert "spotlight" in restored["shot"]["scene_prompt"].lower() or restored["shot"]["scene_prompt"]


# ── Publish / öffentliche Sichtbarkeit ──────────────────────────────────────
class TestPublish:
    def test_publish_roundtrip(self, admin_headers, user_token):
        uh = {"Authorization": f"Bearer {user_token}"}
        r = requests.post(f"{BASE_URL}/api/guide/admin/clips/{TEASER}/publish",
                          json={"published": True}, headers=admin_headers, timeout=30)
        assert r.status_code == 200 and r.json()["published"] is True

        lr = requests.get(f"{BASE_URL}/api/guide/clips?kind=teaser", headers=uh, timeout=30)
        assert lr.status_code == 200
        clip = next((c for c in lr.json()["clips"] if c["slug"] == TEASER), None)
        assert clip is not None
        assert clip["video_url"], "published clip must expose video_url"

        r = requests.post(f"{BASE_URL}/api/guide/admin/clips/{TEASER}/publish",
                          json={"published": False}, headers=admin_headers, timeout=30)
        assert r.status_code == 200 and r.json()["published"] is False
        lr = requests.get(f"{BASE_URL}/api/guide/clips?kind=teaser", headers=uh, timeout=30)
        clip = next(c for c in lr.json()["clips"] if c["slug"] == TEASER)
        assert clip["video_url"] is None, clip["video_url"]

    def test_invalid_kind(self, user_token):
        r = requests.get(f"{BASE_URL}/api/guide/clips?kind=foo",
                         headers={"Authorization": f"Bearer {user_token}"}, timeout=30)
        assert r.status_code == 400


# ── Generierungs-Negativfälle (brechen vor dem Job ab → keine Kosten) ───────
class TestGenerationGuards:
    def test_cinematic_without_keyframe(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/guide/admin/clips/start-2-so-sprichst-du/cinematic",
                          headers=admin_headers, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text[:300]}"
        assert "Zuerst den Keyframe erzeugen" in r.json()["detail"]

    def test_keyframe_unknown_slug(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/guide/admin/clips/unknown-slug-xyz/keyframe",
                          headers=admin_headers, timeout=30)
        assert r.status_code == 404
