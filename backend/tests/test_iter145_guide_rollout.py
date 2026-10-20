"""Iter 145 — Wlad-Guide-Rollout (13 produzierte Clips, Login-Teaser, bulk-produce, Multishot-Skriptlimit).

WICHTIG: keine kostenpflichtigen Fal.ai-Generierungen. bulk-produce wird nur mit
bereits fertigen Multishot-Clips bzw. unbekannten Slugs aufgerufen (-> skipped).
"""
import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL fehlt")
BASE_URL = base_url.rstrip("/")

ADMIN = ("test@test.com", "test123")
FREE = ("free@wladbot.test", "test123")


def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"Login {email} fehlgeschlagen: {r.status_code} {r.text[:300]}")
    token = r.json().get("token")
    assert token
    return token


@pytest.fixture(scope="session")
def admin_token():
    return _login(*ADMIN)


@pytest.fixture(scope="session")
def free_token():
    return _login(*FREE)


@pytest.fixture(scope="session")
def admin_client(admin_token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def free_client(free_token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {free_token}", "Content-Type": "application/json"})
    return s


# ── 1. Öffentlicher Login-Teaser ────────────────────────────────────────────
class TestPublicTeaser:
    def test_public_teaser_is_login_teaser(self):
        r = requests.get(f"{BASE_URL}/api/guide/public/teaser", timeout=60)
        assert r.status_code == 200, r.text[:300]
        clip = r.json().get("clip")
        assert clip is not None, "kein Teaser freigegeben"
        assert clip["slug"] == "teaser-login", f"erwartet teaser-login, bekam {clip['slug']}"
        assert clip["video_url"] and "/video" in clip["video_url"]  # Iter 176: ?v=<render> Cache-Buster
        assert clip["poster_url"]
        assert isinstance(clip["script"], str) and len(clip["script"]) > 50

    def test_poster_url_is_shot_keyframe_png(self):
        # Iter 149: Poster ist ein JPEG (Kind `poster`), davor rohes Keyframe-PNG — beides zulässig
        clip = requests.get(f"{BASE_URL}/api/guide/public/teaser", timeout=60).json()["clip"]
        poster = clip["poster_url"]
        assert poster.split("?")[0].endswith(("/poster", "/keyframe")), f"unerwartete Poster-Form: {poster}"
        r = requests.get(f"{BASE_URL}{poster}", timeout=120)
        assert r.status_code == 200, r.status_code
        assert r.headers.get("content-type") in ("image/png", "image/jpeg"), r.headers.get("content-type")
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n" or r.content[:2] == b"\xff\xd8"

    def test_video_url_serves_mp4_over_1mb(self):
        clip = requests.get(f"{BASE_URL}/api/guide/public/teaser", timeout=60).json()["clip"]
        r = requests.get(f"{BASE_URL}{clip['video_url']}", timeout=180)
        assert r.status_code == 200
        assert r.headers.get("content-type") == "video/mp4"
        assert len(r.content) > 1_000_000, f"nur {len(r.content)} Bytes"
        assert b"ftyp" in r.content[:32]


# ── 2. Nutzer-Endpunkte: Onboarding / Mission / seen ────────────────────────
class TestUserClips:
    def test_onboarding_clips_ready(self, free_client):
        r = free_client.get(f"{BASE_URL}/api/guide/clips?kind=onboarding", timeout=60)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        clips = data["clips"]
        assert len(clips) == 5, f"{len(clips)} Onboarding-Clips"
        for c in clips:
            assert c["video_url"], f"{c['slug']} ohne video_url"
            assert c["poster_url"], f"{c['slug']} ohne poster_url"
            d = c["duration_seconds_video"]
            assert isinstance(d, (int, float)) and d > 30, f"{c['slug']} duration_seconds_video={d}"
        assert data["total"] == 5

    def test_mission_clips_days_1_to_7(self, free_client):
        r = free_client.get(f"{BASE_URL}/api/guide/clips?kind=mission", timeout=60)
        assert r.status_code == 200
        clips = r.json()["clips"]
        assert len(clips) == 7, f"{len(clips)} Mission-Clips"
        assert sorted(c["ref"] for c in clips) == [str(i) for i in range(1, 8)]
        for c in clips:
            assert c["video_url"], f"{c['slug']} ohne video_url"
            assert c["poster_url"], f"{c['slug']} ohne poster_url"

    def test_mark_seen_persists_and_counts(self, free_client):
        slug = "start-2-so-sprichst-du"
        before = free_client.get(f"{BASE_URL}/api/guide/clips?kind=onboarding", timeout=60).json()
        before_count = before["seen_count"]
        was_seen = next(c["seen"] for c in before["clips"] if c["slug"] == slug)
        r = free_client.post(f"{BASE_URL}/api/guide/clips/{slug}/seen", json={}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("ok") is True
        after = free_client.get(f"{BASE_URL}/api/guide/clips?kind=onboarding", timeout=60).json()
        assert next(c["seen"] for c in after["clips"] if c["slug"] == slug) is True
        if not was_seen:
            assert after["seen_count"] == before_count + 1
        else:
            assert after["seen_count"] == before_count

    def test_mission_clip_by_day_endpoint(self, free_client):
        r = free_client.get(f"{BASE_URL}/api/guide/clips/mission/3", timeout=60)
        assert r.status_code == 200
        clip = r.json()["clip"]
        assert clip and clip["ref"] == "3" and clip["video_url"]

    def test_clips_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/guide/clips?kind=onboarding", timeout=60)
        assert r.status_code in (401, 403), r.status_code


# ── 3. Admin-Overview: 13 Clips video_ready, Kosten, Multishot-Aspect ───────
class TestAdminOverview:
    @pytest.fixture(scope="class")
    def overview(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/guide/admin/overview", timeout=90)
        assert r.status_code == 200, r.text[:300]
        return r.json()

    def test_all_clips_video_ready(self, overview):
        clips = overview["clips"]
        # 13 neue Multishot-Clips + 1 Legacy-Cinematic-Teaser (teaser-spotlight) = 14
        multishot = [c for c in clips if c.get("multi_shot")]
        assert len(multishot) >= 13, f"{len(multishot)} Multishot-Clips: {[c['slug'] for c in multishot]}"
        assert len(clips) >= 14, f"{len(clips)} Clips insgesamt"
        bad = [(c["slug"], c["status"]) for c in clips if c["status"] != "video_ready"]
        assert not bad, f"nicht video_ready: {bad}"
        assert all(c.get("published") for c in clips), "nicht alle Clips freigegeben"

    def test_spent_usd_in_expected_range(self, overview):
        spent = overview["settings"]["spent_usd"]
        assert isinstance(spent, (int, float))
        assert spent >= 20, f"spent_usd={spent}"  # kumuliert über alle Produktionen

    def test_multishot_clips_pipeline_and_aspect(self, overview):
        multishot = [c for c in overview["clips"] if c.get("multi_shot")]
        assert len(multishot) >= 13
        for c in multishot:
            assert c.get("pipeline") == "multishot", f"{c['slug']} pipeline={c.get('pipeline')}"
            expected = "9:16" if c["slug"] == "teaser-login" else "16:9"
            assert c.get("aspect") == expected, f"{c['slug']} aspect={c.get('aspect')} (erwartet {expected})"

    def test_no_mongo_object_id_leak(self, overview):
        def walk(node):
            if isinstance(node, dict):
                assert "_id" not in node, f"_id in {list(node)[:6]}"
                for v in node.values():
                    walk(v)
            elif isinstance(node, list):
                for v in node:
                    walk(v)
        walk(overview)


# ── 4. bulk-produce (darf KEINE Kosten auslösen) ────────────────────────────
class TestBulkProduce:
    def test_finished_multishot_clips_are_skipped(self, admin_client):
        slugs = ["start-1-willkommen", "mission-day-7"]
        r = admin_client.post(f"{BASE_URL}/api/guide/admin/clips/bulk-produce", json={"slugs": slugs}, timeout=90)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data["started"] == [], f"Job gestartet (Kosten!): {data['started']}"
        assert sorted(data["skipped"]) == sorted(slugs)

    def test_unknown_slug_is_skipped(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/guide/admin/clips/bulk-produce",
                              json={"slugs": ["unknown"]}, timeout=90)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["skipped"] == ["unknown"]
        assert r.json()["started"] == []

    def test_bulk_produce_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/guide/admin/clips/bulk-produce",
                          json={"slugs": ["start-1-willkommen"]}, timeout=60)
        assert r.status_code == 401, r.status_code

    def test_bulk_produce_forbidden_for_non_admin(self, free_client):
        r = free_client.post(f"{BASE_URL}/api/guide/admin/clips/bulk-produce",
                             json={"slugs": ["start-1-willkommen"]}, timeout=60)
        assert r.status_code == 403, r.status_code

    def test_clips_still_video_ready_after_bulk_calls(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/guide/admin/overview", timeout=90)
        statuses = {c["slug"]: c["status"] for c in r.json()["clips"]}
        assert statuses["start-1-willkommen"] == "video_ready"
        assert statuses["mission-day-7"] == "video_ready"


# ── 5. Skript-Wortlimit für Multi-Shot-Clips (30–115) ───────────────────────
class TestMultishotScriptLimit:
    """Achtung: PUT setzt status auf script_ready — die Fixture stellt den
    Originalzustand (status/script) danach direkt in Mongo wieder her."""

    SLUG = "teaser-login"

    @pytest.fixture(scope="class")
    def original(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/guide/admin/clips/{self.SLUG}", timeout=60)
        assert r.status_code == 200, r.text[:300]
        clip = r.json()
        assert clip.get("multi_shot") is True and clip["kind"] == "teaser"
        yield clip
        # Restore status + script direkt in der DB (kein Endpunkt dafür)
        from pymongo import MongoClient
        env = dotenv_values("/app/backend/.env")
        mongo_url = env.get("MONGO_URL")
        db_name = env.get("DB_NAME")
        assert mongo_url and db_name, "MONGO_URL/DB_NAME fehlen in /app/backend/.env"
        mc = MongoClient(mongo_url)
        mc[db_name].guide_clips.update_one(
            {"slug": self.SLUG},
            {"$set": {"status": clip["status"], "script": clip["script"]}},
        )
        mc.close()

    def test_current_script_word_count_within_multishot_limit(self, original):
        words = len(original["script"].split())
        assert 30 <= words <= 150, f"aktuelles Skript hat {words} Wörter"  # Iter 167: Teaser bis 150 Wörter

    def test_save_current_script_accepted(self, admin_client, original):
        r = admin_client.put(f"{BASE_URL}/api/guide/admin/clips/{self.SLUG}",
                             json={"script": original["script"]}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data["ok"] is True
        assert data["words"] == len(original["script"].split())

    def test_word_limits_in_admin_view_match_accepted_limits(self, admin_client, original):
        """BUG (Iter 145): _admin_clip_view liefert word_limits(kind) statt des
        Multi-Shot-Limits (30–115). Für teaser-login (44 Wörter) zeigt das Admin-UI
        deshalb 'erlaubt 6-30' rot an und der Speichern-Button bleibt disabled,
        obwohl der PUT das Skript akzeptiert."""
        words = len(original["script"].split())
        lo, hi = original["word_limits"]
        assert lo <= words <= hi, (
            f"word_limits={lo}-{hi} passt nicht zum akzeptierten Skript ({words} Wörter); "
            "erwartet 30-115 für multi_shot-Clips"
        )

    def test_too_short_script_rejected(self, admin_client, original):
        short = " ".join(["Wort"] * 10)
        r = admin_client.put(f"{BASE_URL}/api/guide/admin/clips/{self.SLUG}",
                             json={"script": short}, timeout=60)
        assert r.status_code == 400, r.status_code
        detail = r.json().get("detail", "")
        assert "10" in detail and "30" in detail and "150" in detail, detail
        # Skript unverändert
        cur = admin_client.get(f"{BASE_URL}/api/guide/admin/clips/{self.SLUG}", timeout=60).json()
        assert cur["script"] == original["script"]


# ── 6. Regression: Wlad-TTS ─────────────────────────────────────────────────
class TestVoiceRegression:
    def test_tts_wlad_returns_audio(self, free_client):
        r = free_client.post(f"{BASE_URL}/api/voice/tts",
                             json={"text": "Kurzer Test.", "persona": "wlad"}, timeout=150)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data.get("audio_url", "").startswith("data:audio/"), str(data)[:200]
        assert data.get("voice_id") == "Voice6717536d1788310928", data.get("voice_id")
