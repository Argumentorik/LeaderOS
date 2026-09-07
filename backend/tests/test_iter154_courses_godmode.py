"""Iter 154: Kurs-Bibliothek (Tier-Freischaltung), GODMODE-Check, branded Poster, Präsenz-Plan."""
import os
import sys

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv  # noqa: E402

load_dotenv("/app/backend/.env")

API = os.environ.get("API_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]


def _login(email):
    s = requests.Session()
    r = s.post(f"{API}/api/auth/login", json={"email": email, "password": "test123"}, timeout=30)
    assert r.status_code == 200, r.text
    return s


def test_course_catalog_shape():
    from course_content import COURSES
    assert len(COURSES) == 10 and sum(len(c["episodes"]) for c in COURSES) == 72
    assert all(c["episodes"][0]["bullets"] for c in COURSES), "Folge 1 braucht Bullets (Free Preview)"
    assert [c["tier"] for c in COURSES[:6]] == ["standard"] * 6 and [c["tier"] for c in COURSES[6:]] == ["accelerator"] * 4


def test_free_user_sees_only_previews():
    s = _login("free@wladbot.test")
    d = s.get(f"{API}/api/courses", timeout=30).json()
    assert d["tier"] == "free" and d["total_episodes"] == 72
    for c in d["courses"]:
        assert not c["unlocked"]
        assert [e["unlocked"] for e in c["episodes"]] == [True] + [False] * (c["episode_count"] - 1)
    r = s.get(f"{API}/api/courses/rhetorik-grundlagen", timeout=30).json()
    assert r["episodes"][0]["free_preview"] and r["episodes"][0]["bullets"]
    assert s.get(f"{API}/api/courses/gibt-es-nicht", timeout=30).status_code == 404


def test_plus_user_unlocks_everything_and_progress():
    s = _login("accelerator@wladbot.test")
    d = s.get(f"{API}/api/courses", timeout=30).json()
    assert d["tier"] == "accelerator" and all(c["unlocked"] for c in d["courses"])
    assert s.post(f"{API}/api/courses/episodes/delegation-2/seen", timeout=30).status_code == 200
    c = next(c for c in s.get(f"{API}/api/courses", timeout=30).json()["courses"] if c["slug"] == "delegation")
    assert c["seen_count"] >= 1 and next(e for e in c["episodes"] if e["number"] == 2)["seen"]


def test_admin_video_url_and_stream_guard():
    adm = _login("test@test.com")
    r = adm.put(f"{API}/api/courses/admin/episodes/rhetorik-grundlagen-2/video", json={"video_url": "https://vimeo.com/123"}, timeout=30)
    assert r.status_code == 200
    free = _login("free@wladbot.test")
    c = free.get(f"{API}/api/courses/rhetorik-grundlagen", timeout=30).json()
    ep2 = c["episodes"][1]
    assert ep2["video_ready"] and ep2["video_url"] is None, "gesperrte Folge darf keine URL preisgeben"
    assert free.get(f"{API}/api/courses/episodes/rhetorik-grundlagen-2/video", timeout=30).status_code in (403, 404)
    assert requests.put(f"{API}/api/courses/admin/episodes/x-1/video", json={"video_url": "x"}, timeout=30).status_code in (401, 403)


def test_courses_require_auth():
    assert requests.get(f"{API}/api/courses", timeout=30).status_code == 401


def test_guide_godmode_and_posters():
    adm = _login("test@test.com")
    d = adm.get(f"{API}/api/guide/admin/overview", timeout=30).json()
    by = {c["slug"]: c for c in d["clips"]}
    for slug in ("start-1-willkommen", "start-2-so-sprichst-du", "start-3-kontext", "start-4-werkzeuge", "start-5-erste-7-tage", "teaser-login"):
        c = by[slug]
        assert c["godmode"]["godmode"] and c["godmode"]["passed"] == c["godmode"]["total"], (slug, c["godmode"])
        assert all(s["preset"] in ("loft_seated_medium", "loft_seated_closeup", "studio_medium", "studio_closeup") for s in c["shots"] if s["type"] == "talk")
    assert by["start-4-werkzeuge"]["godmode"]["setting"] == "studio"
    teaser = requests.get(f"{API}/api/guide/public/teaser", timeout=30).json()["clip"]
    r = requests.get(f"{API}{teaser['poster_url']}", timeout=60)
    assert r.status_code == 200 and r.headers["content-type"] == "image/jpeg" and len(r.content) < 400_000


def test_presence_plan_and_scripts():
    from guide_content import CLIP_SETTING, plan_shots, word_count
    from guide_scripts_godmode import SCRIPTS
    from services_guide_quality import godmode_check
    for slug, script in SCRIPTS.items():
        shots = plan_shots(script, None, True, CLIP_SETTING.get(slug, "loft"))
        assert [s["type"] for s in shots] == ["talk", "broll", "talk"]
        assert word_count(shots[0]["text"]) <= 64
        kind = "teaser" if slug.startswith("teaser") else "coaching" if slug.startswith("coaching") else "onboarding"
        q = godmode_check({"slug": slug, "kind": kind, "script": script, "shots": shots})
        assert all(i["ok"] for i in q["items"] if i["id"].startswith("script")), (slug, q)
