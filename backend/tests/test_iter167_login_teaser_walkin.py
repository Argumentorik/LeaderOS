"""Iter 167: Login-Teaser GODMODE — Walk-in mit Ton + Single-Take, Crossfade je Schnitt, Ton behalten."""

import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from guide_content import (  # noqa: E402
    SHOT_PRESETS, WALK_IN_PRESETS, TALK_LEAD_AFTER_WALK_SECONDS, plan_shots, seed_clips, walk_in_plan, word_count,
    word_limits,
)
from guide_scripts_godmode import AI_SLOP, SCRIPTS  # noqa: E402
from services_video_compose import _ffmpeg, concat_segments, normalize_segment, probe  # noqa: E402


def test_walk_in_plan_studio():
    plan = walk_in_plan("studio")
    assert [s["type"] for s in plan] == ["walk", "talk"]
    assert plan[0]["preset"] == WALK_IN_PRESETS["studio"] == "studio_walk_in"
    assert plan[1]["preset"] == "studio_medium"


def test_plan_shots_walk_in_single_take():
    shots = plan_shots("Erster Satz. Zweiter Satz.", None, True, "studio", single_take=True, walk_in=True)
    assert [(s["id"], s["type"]) for s in shots] == [("s1", "walk"), ("s2", "talk")]
    assert shots[0]["text"] == ""
    assert shots[1]["text"] == "Erster Satz. Zweiter Satz."


def test_plan_shots_single_take_without_walk_unchanged():
    shots = plan_shots("Ein Satz.", None, True, "loft", single_take=True)
    assert len(shots) == 1 and shots[0]["type"] == "talk"


def test_walk_in_preset_has_audio_and_ambience():
    preset = SHOT_PRESETS["studio_walk_in"]
    assert preset["kind"] == "walk" and preset["audio"] is True
    assert "footsteps" in preset["ambience_prompt"]
    assert "Audio:" not in preset["motion_prompt"]
    assert preset["aspect_ratio"] == "9:16" and preset["duration"] == "5"
    assert 0.5 <= TALK_LEAD_AFTER_WALK_SECONDS <= 1.5


def test_teaser_script_godmode():
    script = SCRIPTS["teaser-login"]
    n = word_count(script)
    lo, hi = word_limits("teaser")
    assert lo <= n <= hi and n >= 110
    assert "Kein Onlinekurs" in script and "Kein Chatbot" in script and "Führe besser. Jeden Tag." in script
    assert not [a for a in AI_SLOP if a in script.lower()]


def test_seed_marks_login_teaser_walk_in():
    # Iter 171: Login-Teaser ist jetzt der 16:9-Film (Loft -> Studio); Walk-in-Plan bleibt als Option erhalten
    clip = next(c for c in seed_clips() if c["slug"] == "teaser-login")
    assert clip["film"] == "login_film" and clip["aspect"] == "16:9"
    assert [s["type"] for s in plan_shots("Ein Satz.", None, True, "studio", single_take=True, walk_in=True)] == ["walk", "talk"]


def _synthetic(path: str, seconds: float, with_audio: bool) -> bytes:
    args = [_ffmpeg(), "-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", f"color=c=gray:s=180x320:d={seconds}"]
    if with_audio:
        args += ["-f", "lavfi", "-i", f"sine=f=440:d={seconds}", "-c:a", "aac"]
    args += ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-shortest", path]
    subprocess.run(args, check=True)
    return open(path, "rb").read()


def _mean_volume(path: str) -> float:
    out = subprocess.run([_ffmpeg(), "-hide_banner", "-i", path, "-af", "volumedetect", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    line = next(l_ for l_ in out.splitlines() if "mean_volume" in l_)
    return float(line.split("mean_volume:")[1].split("dB")[0])


def test_normalize_keeps_native_audio_and_concat_accepts_fade_list():
    with tempfile.TemporaryDirectory() as tmp:
        walk = _synthetic(os.path.join(tmp, "walk.mp4"), 2.0, True)
        talk = _synthetic(os.path.join(tmp, "talk.mp4"), 2.0, False)
        kept = normalize_segment(walk, None, 360, 640, keep_audio=True)
        silent = normalize_segment(walk, None, 360, 640)
        k, s = os.path.join(tmp, "k.mp4"), os.path.join(tmp, "s.mp4")
        open(k, "wb").write(kept)
        open(s, "wb").write(silent)
        assert _mean_volume(k) > -40  # Sinus hörbar
        assert _mean_volume(s) < -80  # Stille
        joined = concat_segments([kept, normalize_segment(talk, None, 360, 640)], [0.8])
        j = os.path.join(tmp, "j.mp4")
        open(j, "wb").write(joined)
        assert abs(probe(j)["duration"] - 3.2) < 0.3
