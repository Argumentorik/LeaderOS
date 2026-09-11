"""Iter 169: Verabschiedungs-Karte, Blick halten, Onboarding-Schlusssätze, Mission-Skripte als Single-Take."""

import os
import subprocess
import sys
import tempfile

import requests
from dotenv import load_dotenv

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", ".env"))
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

from guide_content import FAREWELLS, TALK_TAIL_SECONDS, farewell_for, seed_clips  # noqa: E402
from guide_scripts_godmode import SCRIPTS  # noqa: E402
from services_guide_quality import godmode_check  # noqa: E402
from services_video_compose import _ffmpeg, probe, render_farewell_card  # noqa: E402

ONBOARDING = ["start-1-willkommen", "start-2-so-sprichst-du", "start-3-kontext", "start-4-werkzeuge", "start-5-erste-7-tage"]
MISSIONS = [f"mission-day-{d}" for d in range(1, 8)]


def test_tail_holds_gaze():
    assert 1.5 <= TALK_TAIL_SECONDS <= 2.0


def test_farewells_cover_all_produced_clips():
    for slug in ONBOARDING + MISSIONS + ["teaser-login", "coaching-pakete", "bp-playbooks", "bp-missionen", "bp-video-analyse"]:
        farewell, next_step = farewell_for(slug)
        assert farewell.endswith(".") and next_step and "→" in next_step, slug
    assert farewell_for("unbekannt") == ("Bis bald.", None)
    assert FAREWELLS["start-5-erste-7-tage"][1].startswith("Morgen")


def test_scripts_pass_godmode_script_rules():
    for slug in ONBOARDING + MISSIONS:
        kind = "onboarding" if slug.startswith("start") else "mission"
        res = godmode_check({"script": SCRIPTS[slug], "kind": kind, "shots": [], "slug": slug})
        fails = [i["id"] for i in res["items"] if not i["ok"] and i["id"].startswith("script")]
        assert not fails, f"{slug}: {fails}"


def test_onboarding_closers_appended():
    assert SCRIPTS["start-1-willkommen"].endswith("wie du mit mir sprichst.")
    assert SCRIPTS["start-2-so-sprichst-du"].endswith("Ich lese mit.")
    assert SCRIPTS["start-2-so-sprichst-du"].count("am meisten im Kopf herumgeht") == 1
    assert SCRIPTS["start-5-erste-7-tage"].endswith("ich freue mich auf dich.")


def test_seed_missions_single_take_studio():
    clips = {c["slug"]: c for c in seed_clips()}
    for slug in MISSIONS:
        assert clips[slug]["single_take"] and clips[slug]["setting"] == "studio"
        assert clips[slug]["script"] == SCRIPTS[slug]
    for slug in ONBOARDING:
        assert clips[slug]["single_take"]


def test_farewell_card_renders_silent_35s():
    with tempfile.TemporaryDirectory() as tmp:
        for w, h in ((1280, 720), (720, 1280)):
            data = render_farewell_card(w, h, "Bis morgen.", "Morgen → Tag 1: Deine Baseline")
            p = os.path.join(tmp, f"card_{w}.mp4")
            open(p, "wb").write(data)
            info = probe(p)
            assert abs(info["duration"] - 3.5) < 0.15 and info["width"] == w and info["height"] == h
            out = subprocess.run([_ffmpeg(), "-hide_banner", "-i", p, "-af", "volumedetect", "-f", "null", "-"],
                                 capture_output=True, text=True).stderr
            assert "Audio:" in out  # Tonspur vorhanden (Stille), damit der Schnitt funktioniert


def test_signature_upload_requires_png_and_admin():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"identifier": "test@test.com", "password": "test123"}, timeout=30)
    assert r.status_code == 200
    bad = s.post(f"{BASE_URL}/api/guide/admin/signature", files={"file": ("sig.jpg", b"xx", "image/jpeg")}, timeout=30)
    assert bad.status_code == 422
    anon = requests.post(f"{BASE_URL}/api/guide/admin/signature", files={"file": ("sig.png", b"xx", "image/png")}, timeout=30)
    assert anon.status_code in (401, 403)


def test_all_guide_clips_are_video_ready_with_card_pipeline():
    s = requests.Session()
    s.post(f"{BASE_URL}/api/auth/login", json={"identifier": "test@test.com", "password": "test123"}, timeout=30)
    clips = s.get(f"{BASE_URL}/api/guide/admin/overview", timeout=60).json()["clips"]
    by = {c["slug"]: c for c in clips}
    for slug in ONBOARDING + MISSIONS:
        c = by[slug]
        assert c["status"] == "video_ready" and not c.get("stale"), slug
        assert c["godmode"]["passed"] == c["godmode"]["total"], slug
        assert [sh["type"] for sh in c["shots"]] == ["talk"], slug  # ein Take, keine B-Roll
    for slug in MISSIONS:
        assert 25 <= by[slug]["duration_seconds_video"] <= 36, slug
