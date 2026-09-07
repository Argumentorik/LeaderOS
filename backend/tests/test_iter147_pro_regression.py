"""Iter 147 — Regression of the PRO re-production of all 13 Wlad guide clips.

Read-only delivery checks:
  * GET /api/guide/public/teaser (no auth) + media byte checks
  * GET /api/guide/clips?kind=all (free tier)
  * GET /api/guide/admin/overview (admin)
  * POST /api/guide/admin/clips/bulk-produce WITHOUT reset -> must skip finished clips

NO Fal generation endpoint is triggered (no reset:true, no render/keyframe/voice).
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

FREE_EMAIL = "free@wladbot.test"
ADMIN_EMAIL = "test@test.com"
PASSWORD = os.environ.get("TEST_ACCOUNT_PASSWORD", "test123")  # Seed-Testkonto, kein Produktionsgeheimnis


def _login(email: str) -> str:
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": PASSWORD}, timeout=90)
    if r.status_code != 200:
        pytest.fail(f"Login {email} failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("token")
    if not tok:
        pytest.fail(f"no token for {email}")
    return tok


def _sess(token: str) -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def free_client():
    return _sess(_login(FREE_EMAIL))


@pytest.fixture(scope="module")
def admin_client():
    return _sess(_login(ADMIN_EMAIL))


@pytest.fixture(scope="module")
def teaser(anon):
    r = anon.get(f"{BASE_URL}/api/guide/public/teaser", timeout=60)
    assert r.status_code == 200, r.text[:300]
    return r.json()


@pytest.fixture(scope="module")
def all_clips(free_client):
    r = free_client.get(f"{BASE_URL}/api/guide/clips", params={"kind": "all"}, timeout=90)
    assert r.status_code == 200, r.text[:300]
    return r.json()


@pytest.fixture(scope="module")
def overview(admin_client):
    r = admin_client.get(f"{BASE_URL}/api/guide/admin/overview", timeout=90)
    assert r.status_code == 200, r.text[:300]
    return r.json()


# ── Public teaser (login page) ─────────────────────────────────────────────
class TestPublicTeaser:
    def test_slug_and_urls(self, teaser):
        clip = teaser["clip"]
        assert clip is not None, "teaser clip is null"
        assert clip["slug"] == "teaser-login", clip["slug"]
        assert clip["video_url"].endswith("/video"), clip["video_url"]
        assert clip["poster_url"], "poster_url missing"
        assert "_id" not in clip

    def test_video_bytes(self, anon, teaser):
        url = BASE_URL + teaser["clip"]["video_url"]
        r = anon.get(url, timeout=180)
        assert r.status_code == 200, f"{r.status_code} for {url}"
        assert r.headers.get("content-type") == "video/mp4", r.headers.get("content-type")
        assert len(r.content) > 1024 * 1024, f"only {len(r.content)} bytes"

    def test_poster_bytes(self, anon, teaser):
        r = anon.get(BASE_URL + teaser["clip"]["poster_url"], timeout=120)
        assert r.status_code == 200
        assert r.headers.get("content-type") in ("image/png", "image/jpeg"), r.headers.get("content-type")
        assert len(r.content) > 1024


# ── User clip list ─────────────────────────────────────────────────────────
class TestUserClips:
    def test_counts(self, all_clips):
        clips = all_clips["clips"]
        onboarding = [c for c in clips if c["kind"] == "onboarding"]
        mission = [c for c in clips if c["kind"] == "mission"]
        assert len(onboarding) == 5, [c["slug"] for c in onboarding]
        assert len(mission) == 7, [c["slug"] for c in mission]
        assert all_clips["total"] == len(clips)

    def test_media_and_duration(self, all_clips):
        user_clips = [c for c in all_clips["clips"] if c["kind"] in ("onboarding", "mission")]
        problems = []
        for c in user_clips:
            if not c.get("video_url"):
                problems.append(f"{c['slug']}: no video_url")
            if not c.get("poster_url"):
                problems.append(f"{c['slug']}: no poster_url")
            d = c.get("duration_seconds_video")
            if not isinstance(d, (int, float)) or not (20 <= d <= 75):  # Präsenz-Shots seit Iter 154 bis ~70 s
                problems.append(f"{c['slug']}: duration_seconds_video={d}")
        assert not problems, problems

    def test_all_videos_served(self, free_client, all_clips):
        user_clips = [c for c in all_clips["clips"] if c["kind"] in ("onboarding", "mission")]
        problems = []
        for c in user_clips:
            url = BASE_URL + c["video_url"]
            r = free_client.get(url, headers={"Range": "bytes=0-1023"}, timeout=120)
            if r.status_code != 206:
                problems.append(f"{c['slug']}: range status {r.status_code}")
                continue
            if r.headers.get("content-type") != "video/mp4":
                problems.append(f"{c['slug']}: ct {r.headers.get('content-type')}")
        assert not problems, problems

    def test_posters_served(self, free_client, all_clips):
        user_clips = [c for c in all_clips["clips"] if c["kind"] in ("onboarding", "mission")]
        problems = []
        for c in user_clips:
            r = free_client.get(BASE_URL + c["poster_url"], timeout=120)
            if r.status_code != 200 or r.headers.get("content-type") not in ("image/png", "image/jpeg"):
                problems.append(f"{c['slug']}: {r.status_code}/{r.headers.get('content-type')}")
        assert not problems, problems


# ── Admin overview ─────────────────────────────────────────────────────────
class TestAdminOverview:
    def test_thirteen_multishot_pro(self, overview):
        clips = [c for c in overview["clips"] if c.get("multi_shot")]
        assert len(clips) >= 13, [c["slug"] for c in clips]  # Iter 155/158: + coaching-pakete, bp-*
        problems = []
        for c in clips:
            if c.get("status") != "video_ready":
                problems.append(f"{c['slug']}: status {c.get('status')}")
            if c.get("quality") != "pro":
                problems.append(f"{c['slug']}: quality {c.get('quality')}")
            if c.get("pipeline") != "multishot":
                problems.append(f"{c['slug']}: pipeline {c.get('pipeline')}")
            if c.get("stale") is True:
                problems.append(f"{c['slug']}: stale")
        assert not problems, problems

    def test_shot_engines(self, overview):
        clips = [c for c in overview["clips"] if c.get("multi_shot")]
        problems = []
        talk_seen = walk_seen = 0
        for c in clips:
            for s in c.get("shots", []):
                if s.get("type") == "talk":
                    talk_seen += 1
                    if s.get("engine") != "omnihuman":
                        problems.append(f"{c['slug']}/{s['id']}: engine {s.get('engine')}")
                    if not s.get("synced_url"):
                        problems.append(f"{c['slug']}/{s['id']}: no synced_url")
                elif s.get("type") == "walk":
                    walk_seen += 1
                    if s.get("engine") != "kling-2.5-pro":
                        problems.append(f"{c['slug']}/{s['id']}: engine {s.get('engine')}")
        assert talk_seen > 0, "no talk shots found"
        assert not problems, problems
        print(f"talk shots: {talk_seen}, walk shots: {walk_seen}")

    def test_spent_usd(self, overview):
        spent = overview["settings"]["spent_usd"]
        assert isinstance(spent, (int, float))
        assert spent >= 50, spent  # kumulierte Fal-Kosten wachsen mit jeder Produktion (Iter 147: 50-60 $)

    def test_no_id_leak(self, overview):
        assert all("_id" not in c for c in overview["clips"])

    def test_requires_admin(self, free_client):
        r = free_client.get(f"{BASE_URL}/api/guide/admin/overview", timeout=60)
        assert r.status_code == 403, r.status_code


# ── bulk-produce skips finished clips (no cost) ────────────────────────────
class TestBulkProduceSkips:
    def test_finished_clip_skipped(self, admin_client):
        r = admin_client.post(
            f"{BASE_URL}/api/guide/admin/clips/bulk-produce",
            json={"slugs": ["start-1-willkommen"], "quality": "pro"},
            timeout=90,
        )
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data["skipped"] == ["start-1-willkommen"], data
        assert data["started"] == [], data
