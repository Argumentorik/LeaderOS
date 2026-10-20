"""Iter 146 — Video-Guide page + Mission-Briefing backend contract.

Covers: GET /api/guide/clips?kind=all, GET /api/guide/clips/mission/{day},
POST /api/guide/prefs, auth gating. NO Fal generation endpoints are touched.
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
PASSWORD = os.environ.get("TEST_ACCOUNT_PASSWORD", "test123")  # Seed-Testkonto, kein Produktionsgeheimnis


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def anon():
    """Fresh session without cookies — login sets an httpOnly cookie that would
    otherwise authenticate the 'no auth' requests."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def token(client):
    r = client.post(f"{BASE_URL}/api/auth/login", json={"email": FREE_EMAIL, "password": PASSWORD}, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"Login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("token")
    if not tok:
        pytest.fail("no token in login response")
    return tok


@pytest.fixture(scope="module")
def auth(token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def all_clips(auth):
    r = auth.get(f"{BASE_URL}/api/guide/clips", params={"kind": "all"}, timeout=60)
    assert r.status_code == 200, r.text[:300]
    return r.json()


# ── GET /api/guide/clips?kind=all ──────────────────────────────────────────
class TestListAllClips:
    def test_kinds_and_counts(self, all_clips):
        clips = all_clips["clips"]
        assert isinstance(clips, list) and clips
        onboarding = [c for c in clips if c["kind"] == "onboarding"]
        mission = [c for c in clips if c["kind"] == "mission"]
        teaser = [c for c in clips if c["kind"] == "teaser"]
        assert len(onboarding) == 5, f"onboarding={len(onboarding)}"
        assert len(mission) == 7, f"mission={len(mission)}"
        assert len(teaser) >= 1, "teaser clip missing from kind=all"
        assert all_clips["total"] == len(clips)
        assert isinstance(all_clips["seen_count"], int)
        assert isinstance(all_clips["mission_autoplay"], bool)

    def test_onboarding_and_mission_have_media(self, all_clips):
        missing = [
            c["slug"] for c in all_clips["clips"]
            if c["kind"] in ("onboarding", "mission") and not (c.get("video_url") and c.get("poster_url"))
        ]
        assert not missing, f"clips without video_url/poster_url: {missing}"

    def test_mission_refs_1_to_7(self, all_clips):
        refs = sorted(c["ref"] for c in all_clips["clips"] if c["kind"] == "mission")
        assert refs == [str(i) for i in range(1, 8)], refs

    def test_no_mongo_id_leak(self, all_clips):
        assert all("_id" not in c for c in all_clips["clips"])

    def test_media_urls_reachable(self, all_clips):
        clip = next(c for c in all_clips["clips"] if c["kind"] == "mission")
        v = requests.get(f"{BASE_URL}{clip['video_url']}", timeout=120)
        assert v.status_code == 200 and v.headers["content-type"] == "video/mp4"
        p = requests.get(f"{BASE_URL}{clip['poster_url']}", timeout=60)
        assert p.status_code == 200 and p.headers["content-type"].startswith("image/")

    def test_invalid_kind(self, auth):
        r = auth.get(f"{BASE_URL}/api/guide/clips", params={"kind": "bogus"}, timeout=30)
        assert r.status_code == 400

    def test_requires_auth(self, anon):
        r = anon.get(f"{BASE_URL}/api/guide/clips", params={"kind": "all"}, timeout=30)
        assert r.status_code == 401


# ── GET /api/guide/clips/mission/{day} ─────────────────────────────────────
class TestMissionClip:
    def test_mission_day_1(self, auth):
        r = auth.get(f"{BASE_URL}/api/guide/clips/mission/1", timeout=60)
        assert r.status_code == 200
        data = r.json()
        clip = data["clip"]
        assert clip is not None
        assert clip["ref"] == "1"
        assert clip["kind"] == "mission"
        assert clip["video_url"]
        assert isinstance(clip["seen"], bool)
        assert isinstance(data["mission_autoplay"], bool)

    def test_unknown_day(self, auth):
        r = auth.get(f"{BASE_URL}/api/guide/clips/mission/99", timeout=30)
        assert r.status_code == 200
        assert r.json()["clip"] is None

    def test_requires_auth(self, anon):
        r = anon.get(f"{BASE_URL}/api/guide/clips/mission/1", timeout=30)
        assert r.status_code == 401


# ── POST /api/guide/prefs ─────────────────────────────────────────────────
class TestPrefs:
    def test_toggle_off_then_on(self, auth):
        r = auth.post(f"{BASE_URL}/api/guide/prefs", json={"mission_autoplay": False}, timeout=30)
        assert r.status_code == 200
        assert r.json()["mission_autoplay"] is False

        g = auth.get(f"{BASE_URL}/api/guide/clips/mission/1", timeout=30)
        assert g.json()["mission_autoplay"] is False
        lst = auth.get(f"{BASE_URL}/api/guide/clips", params={"kind": "all"}, timeout=60)
        assert lst.json()["mission_autoplay"] is False

        r2 = auth.post(f"{BASE_URL}/api/guide/prefs", json={"mission_autoplay": True}, timeout=30)
        assert r2.status_code == 200 and r2.json()["mission_autoplay"] is True
        g2 = auth.get(f"{BASE_URL}/api/guide/clips/mission/1", timeout=30)
        assert g2.json()["mission_autoplay"] is True

    def test_validation(self, auth):
        r = auth.post(f"{BASE_URL}/api/guide/prefs", json={}, timeout=30)
        assert r.status_code == 422

    def test_requires_auth(self, anon):
        r = anon.post(f"{BASE_URL}/api/guide/prefs", json={"mission_autoplay": False}, timeout=30)
        assert r.status_code == 401
