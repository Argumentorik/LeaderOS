"""Iter 165 — /kurse Academy-Look: Kategorien, Level, Thumbnails, Fortschritt, Detail-Daten, Admin-Thumbnail-Override."""
import os

import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
PASSWORD = os.environ.get("TEST_ACCOUNT_PASSWORD", "test123")  # Seed-Testkonto
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "test@test.com")


def _token(identifier):
    r = requests.post(f"{BASE}/api/auth/login", json={"identifier": identifier, "password": PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def _h(identifier):
    return {"Authorization": f"Bearer {_token(identifier)}"}


def test_list_has_categories_levels_thumbnails_and_totals():
    d = requests.get(f"{BASE}/api/courses", headers=_h("free@wladbot.test"), timeout=30).json()
    assert set(d["categories"]) == {"rhetorik", "fuehrung", "executive"}
    assert d["total_episodes"] == 72 and "seen_total" in d
    cats = {c["slug"]: c["category"] for c in d["courses"]}
    assert cats["rhetorik-grundlagen"] == "rhetorik" and cats["delegation"] == "fuehrung" and cats["boardroom-strategie"] == "executive"
    levels = [c["level"] for c in d["courses"]]
    assert levels[:3] == ["grundlagen"] * 3 and levels[3:6] == ["aufbau"] * 3 and levels[6:] == ["executive"] * 4
    for c in d["courses"]:
        assert c["thumbnail_url"] == f"/courses/{c['slug']}.jpg"
        assert c["tier_label"] in ("Leadership OS", "Leadership OS PLUS")
        assert "is_new" in c and "next_episode" in c and "preview_url" in c
        assert c["next_episode"] == 1  # free user, nothing seen → Folge 1


def test_thumbnails_are_served_as_static_files():
    for slug in ("rhetorik-grundlagen", "boardroom-strategie"):
        r = requests.get(f"{BASE}/courses/{slug}.jpg", timeout=30)
        assert r.status_code == 200 and r.headers["content-type"].startswith("image/")


def test_detail_marks_seen_and_advances_next_episode():
    h = _h("standard@wladbot.test")
    slug = "delegation"
    d = requests.get(f"{BASE}/api/courses/{slug}", headers=h, timeout=30).json()
    assert d["unlocked"] is True and d["episodes"][0]["purpose"]
    ep = d["episodes"][0]["id"]
    assert requests.post(f"{BASE}/api/courses/episodes/{ep}/seen", headers=h, timeout=30).status_code == 200
    d2 = requests.get(f"{BASE}/api/courses/{slug}", headers=h, timeout=30).json()
    assert d2["episodes"][0]["seen"] is True and d2["seen_count"] >= 1 and d2["next_episode"] == 2


def test_locked_course_for_free_user_hides_video_url_but_keeps_episode_one():
    d = requests.get(f"{BASE}/api/courses/rhetorik-grundlagen", headers=_h("free@wladbot.test"), timeout=30).json()
    assert d["unlocked"] is False
    assert d["episodes"][0]["unlocked"] is True and d["episodes"][1]["unlocked"] is False
    assert d["episodes"][1]["video_url"] is None


def test_admin_thumbnail_override_roundtrip():
    h = _h(ADMIN_EMAIL)
    r = requests.put(f"{BASE}/api/courses/admin/delegation/thumbnail", json={"thumbnail_url": "/courses/feedback-formate.jpg"}, headers=h, timeout=30)
    assert r.status_code == 200
    d = requests.get(f"{BASE}/api/courses/delegation", headers=h, timeout=30).json()
    assert d["thumbnail_url"] == "/courses/feedback-formate.jpg"
    requests.put(f"{BASE}/api/courses/admin/delegation/thumbnail", json={"thumbnail_url": "/courses/delegation.jpg"}, headers=h, timeout=30)
    assert requests.put(f"{BASE}/api/courses/admin/nope/thumbnail", json={"thumbnail_url": "x"}, headers=h, timeout=30).status_code == 404
    assert requests.put(f"{BASE}/api/courses/admin/delegation/thumbnail", json={"thumbnail_url": "x"}, headers=_h("free@wladbot.test"), timeout=30).status_code in (401, 403)
