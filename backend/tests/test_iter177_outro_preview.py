"""Iter 177: sauberer Ausklang, Vorschau-Render, Poster-Quelle, Cache-Buster."""
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import imageio_ffmpeg  # noqa: E402

from guide_content import OUTRO_FADE_SECONDS, TALK_TAIL_SECONDS  # noqa: E402
from routes.guide import _poster_url, _render_version, poster_source  # noqa: E402
from services_video_compose import outro, probe  # noqa: E402


def _clip(seconds: float) -> bytes:
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, "c.mp4")
        subprocess.run([ff, "-hide_banner", "-y", "-f", "lavfi", "-i", f"color=c=gray:s=320x180:r=30:d={seconds}",
                        "-f", "lavfi", "-i", f"sine=frequency=440:duration={seconds}", "-c:v", "libx264", "-c:a", "aac", "-shortest", out],
                       check=True, capture_output=True, timeout=120)
        return open(out, "rb").read()


def test_outro_trims_and_keeps_length_without_loop() -> None:
    assert TALK_TAIL_SECONDS == 0.5 and OUTRO_FADE_SECONDS == 0.8
    src = _clip(4.0)
    trimmed = outro(src, OUTRO_FADE_SECONDS, trim_tail=1.3)
    with tempfile.NamedTemporaryFile(suffix=".mp4") as f:
        f.write(trimmed)
        f.flush()
        dur = probe(f.name)["duration"]
    assert 2.5 <= dur <= 2.9, dur  # 4,0 − 1,3 = 2,7 — nichts verlängert, nichts geloopt


def test_poster_source_prefers_clean_talk_take() -> None:
    clip = {"shots": [{"type": "walk", "raw_path": "g/raw.mp4"}, {"type": "talk", "synced_path": "g/sync_s3.mp4", "speech_lead": 0.7}],
            "video_path": "g/video_x_abc123.mp4", "media_token": "tok"}
    assert poster_source(clip) == ("g/sync_s3.mp4", 1.6)
    assert poster_source({"video_path": "g/v.mp4"}) == ("g/v.mp4", 1.5)
    assert _poster_url(clip) == "/api/guide/media/tok/poster?v=abc123"
    assert _render_version("guide/video_teaser-login_6ddf76eb.mp4") == "6ddf76eb"
