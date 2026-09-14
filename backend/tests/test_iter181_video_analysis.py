"""Iter 181 — GODMODE-Endcheck: Video-Analyse echt durchspielen (Upload → Transkript → SEXIER)."""
import os
import subprocess
import tempfile
import time
from pathlib import Path

import httpx
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE}/api"
SPEECH_TEXT = (
    "Guten Morgen. Ich habe eine klare Bitte an das Team: Wir verschieben den Launch um eine Woche. "
    "Der Grund ist einfach. Die Qualität entscheidet über die ersten hundert Kunden, nicht das Datum. "
    "Ich übernehme die Verantwortung für diese Entscheidung und erkläre sie dem Vorstand persönlich."
)


@pytest.fixture(scope="module")
def admin():
    c = httpx.Client(timeout=180.0)
    r = c.post(f"{API}/auth/login", json={"identifier": "test@test.com", "password": "test123"})
    assert r.status_code == 200, r.text
    yield c
    c.close()


@pytest.fixture(scope="module")
def pro():
    """Video-Analyse ist ein PLUS-Feature — hier mit Accelerator-Konto testen."""
    c = httpx.Client(timeout=180.0)
    r = c.post(f"{API}/auth/login", json={"identifier": "accelerator@wladbot.test", "password": "test123"})
    assert r.status_code == 200, r.text
    yield c
    c.close()


@pytest.fixture(scope="module")
def speech_video(admin) -> Path:
    """Testvideo mit echter Sprache: Wlads Klonstimme (Admin-Hörprobe) auf einem Standbild."""
    import base64
    import imageio_ffmpeg

    out = Path(tempfile.gettempdir()) / "iter181_speech.mp4"
    if out.exists():
        return out
    r = admin.post(f"{API}/guide/admin/voice-preview", json={"text": SPEECH_TEXT})
    assert r.status_code == 200, r.text
    mp3 = Path(tempfile.gettempdir()) / "iter181_speech.mp3"
    mp3.write_bytes(base64.b64decode(r.json()["audio_data_url"].split(",")[-1]))
    subprocess.run([
        imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-y",
        "-f", "lavfi", "-i", "color=c=0x1a1a1a:s=640x360:r=25",
        "-i", str(mp3), "-shortest", "-pix_fmt", "yuv420p", "-c:a", "aac", str(out),
    ], check=True, capture_output=True, timeout=180)
    assert out.stat().st_size > 10000
    return out


def _as_list(payload, key):
    """Die Video-Endpunkte antworten teils als Liste, teils als Objekt."""
    return payload if isinstance(payload, list) else (payload.get(key) or [])


def _challenge_id(admin) -> str:
    r = admin.get(f"{API}/video-challenges")
    assert r.status_code == 200, r.text
    items = _as_list(r.json(), "challenges")
    assert items, "Keine Video-Challenges vorhanden"
    return items[0]["challenge_id"]


# ── Grundgerüst ─────────────────────────────────────────────────────────────

def test_video_endpoints_require_login():
    with httpx.Client(timeout=30.0) as c:
        assert c.get(f"{API}/video-archive").status_code == 401
        assert c.get(f"{API}/user/video-trial-status").status_code == 401
        assert c.get(f"{API}/video-challenges/jobs/vidjob_egal").status_code == 401


def test_challenges_and_preferences_load(admin):
    ch = admin.get(f"{API}/video-challenges")
    assert ch.status_code == 200, ch.text
    items = _as_list(ch.json(), "challenges")
    assert len(items) >= 3
    for c in items:
        assert c["challenge_id"] and c.get("title")

    prefs = admin.get(f"{API}/rating-preferences")
    assert prefs.status_code == 200, prefs.text

    trial = admin.get(f"{API}/user/video-trial-status")
    assert trial.status_code == 200, trial.text


def test_unknown_job_is_404(admin):
    assert admin.get(f"{API}/video-challenges/jobs/vidjob_gibtsnicht").status_code == 404


# ── Echte Analyse ───────────────────────────────────────────────────────────

def test_video_analysis_end_to_end(pro, speech_video):
    admin = pro
    cid = _challenge_id(pro)
    with speech_video.open("rb") as f:
        start = admin.post(f"{API}/video-challenges/{cid}/analyze-async",
                           files={"file": ("iter181_speech.mp4", f, "video/mp4")})
    assert start.status_code == 202, start.text
    job_id = start.json()["job_id"]

    job = None
    for _ in range(60):                      # bis 5 Minuten
        time.sleep(5)
        res = admin.get(f"{API}/video-challenges/jobs/{job_id}")
        assert res.status_code == 200, res.text
        job = res.json()
        if job["status"] in ("complete", "error", "failed"):
            break
    assert job, "Kein Job-Status erhalten"
    assert job["status"] == "complete", f"Analyse endete mit {job['status']}: {job.get('error')}"

    analysis = job.get("analysis") or {}
    # Schema, auf das die Oberfläche baut
    for key in ("transcript", "strengths", "improvements", "sexier_scores", "overall_score",
                "practice_exercises", "wlad_assessment"):
        assert analysis.get(key), f"Feld fehlt in der Analyse: {key}"

    transcript = analysis["transcript"]
    assert len(transcript) > 60, f"Transkript zu kurz: {transcript!r}"
    assert "launch" in transcript.lower() and "team" in transcript.lower()

    assert len(analysis["strengths"]) >= 3
    assert len(analysis["improvements"]) >= 3
    joined = " ".join(analysis["strengths"] + analysis["improvements"]) + str(analysis["wlad_assessment"])
    assert "SEXIER" in joined.upper(), "Kein SEXIER-Bezug im Feedback"
    assert "Vlad" not in joined, "Namensregel verletzt (Vlad)"

    sexier = analysis["sexier_scores"]
    assert set(sexier) == {"statement", "explanation", "example", "impact", "impact_explanation", "rebuttal"}, sexier
    for key, value in sexier.items():
        assert isinstance(value, (int, float)) and 0 <= value <= 100, f"{key}={value!r}"
    for key in ("overall_score", "clarity_score", "confidence_score", "empathy_score", "structure_score"):
        assert 0 <= analysis[key] <= 100, f"{key}={analysis[key]!r}"


def test_analysis_lands_in_archive(pro):
    res = pro.get(f"{API}/video-archive")
    assert res.status_code == 200, res.text
    entries = _as_list(res.json(), "entries")
    assert entries, "Archiv ist leer — die Analyse wurde nicht gespeichert"
    latest = entries[0]
    assert latest.get("challenge_id")
    assert latest.get("created_at")
    assert latest["analysis"]["transcript"]
    assert latest["analysis"]["sexier_scores"]
