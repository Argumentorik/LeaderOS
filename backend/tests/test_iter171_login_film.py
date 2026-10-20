"""Iter 171: Login-Film — 3 Kapitel, 2 fließende Übergänge, Musikteppich, Karte mit QR."""
import os
import sys

import requests
from dotenv import load_dotenv

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", ".env"))
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

from guide_content import FILM_PLANS, SHOT_PRESETS, film_shots, normalize_script, plan_shots, seed_clips  # noqa: E402
from guide_scripts_godmode import SCRIPTS  # noqa: E402
from services_guide_quality import godmode_check  # noqa: E402


def test_login_film_plan_and_script():
    script = SCRIPTS["teaser-login"]
    assert script.count("\n\n") == 2 and "leadercheck.de" in script
    shots = plan_shots(script, film="login_film")
    assert [s["type"] for s in shots] == ["talk", "walk", "talk", "walk", "talk"]
    assert all(s["text"] for s in shots if s["type"] == "talk") and all(not s["text"] for s in shots if s["type"] == "walk")
    assert SHOT_PRESETS["loft_walk_out"]["audio"] and SHOT_PRESETS["studio_push_in"]["keyframe_from"] == "prev"
    res = godmode_check({"script": script, "kind": "teaser", "shots": [], "slug": "teaser-login"})
    assert not [i for i in res["items"] if not i["ok"] and i["id"].startswith("script")]


def test_normalize_keeps_paragraphs_and_film_requires_matching_chapters():
    assert normalize_script("a  b\n\n\nc   d\n\n") == "a b\n\nc d"
    try:
        film_shots("nur ein Absatz", "login_film")
        raise AssertionError("erwartet ValueError")
    except ValueError:
        pass
    assert len(FILM_PLANS["login_film"]) == 5


def test_seed_login_teaser_is_film_16_9():
    c = next(c for c in seed_clips() if c["slug"] == "teaser-login")
    assert c["film"] == "login_film" and c["aspect"] == "16:9" and c["music_bed"] is True


def test_public_teaser_is_the_film():
    clip = requests.get(f"{BASE_URL}/api/guide/public/teaser", timeout=30).json()["clip"]
    assert clip["slug"] == "teaser-login" and clip["video_url"]
    head = requests.get(f"{BASE_URL}{clip['video_url']}", timeout=120, stream=True)
    assert head.status_code == 200 and head.headers.get("content-type", "").startswith("video/")
