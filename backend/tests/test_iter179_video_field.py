"""Iter 179 — Ein Video-Feld: generiert · Vimeo · eigenes Video (Upload/Download/Thumbnail-Sekunde)."""
import os
import subprocess
import tempfile
from pathlib import Path

import httpx
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE}/api"
ADMIN = (os.environ.get("TEST_ADMIN_EMAIL", "test@test.com"), os.environ.get("TEST_ACCOUNT_PASSWORD", "test123"))
VIMEO_PUBLIC = "https://vimeo.com/347119375"
EPISODE = "rhetorik-grundlagen-3"


@pytest.fixture(scope="module")
def admin():
    c = httpx.Client(timeout=180.0)
    r = c.post(f"{API}/auth/login", json={"identifier": ADMIN[0], "password": ADMIN[1]})
    assert r.status_code == 200, r.text
    assert r.json()["user"].get("is_admin"), "Test-Account ist nicht Admin"
    yield c
    c.close()


@pytest.fixture(scope="module")
def clip_slug(admin):
    """Ein Guide-Clip mit generiertem Video — Quelle wird am Ende wieder zurückgestellt."""
    r = admin.get(f"{API}/guide/admin/overview")
    assert r.status_code == 200, r.text
    clips = [c for c in r.json()["clips"] if c.get("has_generated")]
    assert clips, "Kein Clip mit generiertem Video vorhanden"
    slug = clips[0]["slug"]
    yield slug
    admin.put(f"{API}/media/source/guide/{slug}", json={"source": "generated"})


@pytest.fixture(scope="module")
def tiny_mp4():
    import imageio_ffmpeg
    path = Path(tempfile.gettempdir()) / "iter179_sample.mp4"
    if not path.exists():
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-y", "-f", "lavfi",
                        "-i", "color=c=0x111111:s=640x360:d=3", "-pix_fmt", "yuv420p", str(path)],
                       check=True, capture_output=True, timeout=120)
    return path


def _upload(client: httpx.Client, path: Path, target: str, target_id: str) -> dict:
    init = client.post(f"{API}/media/upload/init", json={
        "target": target, "target_id": target_id, "filename": path.name,
        "size": path.stat().st_size, "content_type": "video/mp4"})
    assert init.status_code == 200, init.text
    upload_id = init.json()["upload_id"]
    data = path.read_bytes()
    step = init.json()["chunk_size"]
    for start in range(0, len(data), step):
        chunk = client.post(f"{API}/media/upload/{upload_id}/chunk", content=data[start:start + step],
                            headers={"Content-Type": "application/octet-stream"})
        assert chunk.status_code == 200, chunk.text
    done = client.post(f"{API}/media/upload/{upload_id}/complete")
    assert done.status_code == 200, done.text
    return done.json()


# ── Zugriffsschutz ──────────────────────────────────────────────────────────

def test_all_media_admin_endpoints_require_admin():
    with httpx.Client(timeout=30.0) as c:
        assert c.post(f"{API}/media/vimeo/check", json={"url": VIMEO_PUBLIC}).status_code == 401
        assert c.get(f"{API}/media/course-episodes").status_code == 401
        assert c.get(f"{API}/media/download/guide/teaser-login?variant=live").status_code == 401
        assert c.post(f"{API}/media/upload/init", json={
            "target": "guide_clip", "target_id": "teaser-login", "filename": "a.mp4", "size": 10}).status_code == 401


# ── Vimeo ───────────────────────────────────────────────────────────────────

def test_vimeo_link_is_validated(admin):
    ok = admin.post(f"{API}/media/vimeo/check", json={"url": VIMEO_PUBLIC})
    assert ok.status_code == 200, ok.text
    body = ok.json()
    assert body["vimeo_id"] == "347119375"
    assert body["vimeo_thumbnail"]

    for bad, expect in (("kein link", 400), ("https://vimeo.com/1", 400)):
        r = admin.post(f"{API}/media/vimeo/check", json={"url": bad})
        assert r.status_code == expect, f"{bad}: {r.status_code} {r.text}"
        assert "detail" in r.json()


def test_guide_clip_switch_to_vimeo_and_back(admin, clip_slug):
    r = admin.put(f"{API}/media/source/guide/{clip_slug}", json={"source": "vimeo", "vimeo_url": VIMEO_PUBLIC})
    assert r.status_code == 200, r.text
    detail = admin.get(f"{API}/guide/admin/clips/{clip_slug}").json()
    assert detail["active_source"] == "vimeo"
    assert detail["vimeo_id"] == "347119375"
    assert detail["has_generated"] is True          # generiertes Video bleibt erhalten

    public = admin.get(f"{API}/guide/clips/{clip_slug}").json()
    if public.get("video_kind") == "vimeo":         # nur wenn der Clip freigegeben ist
        assert public["vimeo_id"] == "347119375"
        assert public["video_url"] is None

    back = admin.put(f"{API}/media/source/guide/{clip_slug}", json={"source": "generated"})
    assert back.status_code == 200, back.text
    assert admin.get(f"{API}/guide/admin/clips/{clip_slug}").json()["active_source"] == "generated"


# ── Upload ──────────────────────────────────────────────────────────────────

def test_upload_rejects_wrong_format_and_oversize(admin, clip_slug):
    bad_type = admin.post(f"{API}/media/upload/init", json={
        "target": "guide_clip", "target_id": clip_slug, "filename": "schnitt.avi", "size": 1000})
    assert bad_type.status_code == 400
    assert "MP4" in bad_type.json()["detail"]

    too_big = admin.post(f"{API}/media/upload/init", json={
        "target": "guide_clip", "target_id": clip_slug, "filename": "gross.mp4", "size": 3 * 1024 ** 3})
    assert too_big.status_code == 413
    assert "2 GB" in too_big.json()["detail"]


def test_upload_makes_custom_video_live_then_revert(admin, clip_slug, tiny_mp4):
    res = _upload(admin, tiny_mp4, "guide_clip", clip_slug)
    assert res["video_source"] == "upload"
    assert res["duration_seconds"] and res["duration_seconds"] > 1

    detail = admin.get(f"{API}/guide/admin/clips/{clip_slug}").json()
    assert detail["active_source"] == "upload"
    assert detail["has_upload"] is True
    assert detail["has_generated"] is True          # generiertes Video unangetastet
    assert "/custom" in (detail["active_video_url"] or "")

    # Nutzer-Sicht: Video und Vorschaubild kommen aus dem eigenen Upload
    public = admin.get(f"{API}/guide/clips/{clip_slug}").json()
    if public["video_url"]:
        assert "/custom" in public["video_url"]
        assert admin.get(f"{BASE}{public['video_url']}").status_code == 200
        assert admin.get(f"{BASE}{public['poster_url']}").status_code == 200

    # Vorschaubild-Sekunde wählen → Adresse ändert sich (kein Browser-Cache)
    poster = admin.post(f"{API}/media/poster-at/guide/{clip_slug}", json={"at": 1.5})
    assert poster.status_code == 200, poster.text
    assert "-1.5" in poster.json()["poster_url"]
    assert admin.get(f"{BASE}{poster.json()['poster_url']}").status_code == 200

    # Download des eigenen Videos (Admin) — mit sprechendem Dateinamen
    dl = admin.get(f"{API}/media/download/guide/{clip_slug}?variant=custom")
    assert dl.status_code == 200, dl.text
    assert "attachment" in dl.headers.get("content-disposition", "")
    assert clip_slug in dl.headers["content-disposition"]

    # Zurück zum generierten Video
    back = admin.put(f"{API}/media/source/guide/{clip_slug}", json={"source": "generated"})
    assert back.status_code == 200
    detail = admin.get(f"{API}/guide/admin/clips/{clip_slug}").json()
    assert detail["active_source"] == "generated"
    assert detail["has_upload"] is True             # Upload bleibt wählbar


def test_download_live_and_bad_variant(admin, clip_slug):
    live = admin.get(f"{API}/media/download/guide/{clip_slug}?variant=live")
    assert live.status_code == 200
    assert live.headers.get("content-disposition", "").startswith("attachment")
    bad = admin.get(f"{API}/media/download/guide/{clip_slug}?variant=quatsch")
    assert bad.status_code == 400


# ── Kurs-Folgen ─────────────────────────────────────────────────────────────

def test_course_episode_vimeo_and_upload(admin, tiny_mp4):
    overview = admin.get(f"{API}/media/course-episodes")
    assert overview.status_code == 200, overview.text
    assert overview.json()["total"] >= 70

    vim = admin.put(f"{API}/media/source/course/{EPISODE}", json={"source": "vimeo", "vimeo_url": VIMEO_PUBLIC})
    assert vim.status_code == 200, vim.text

    res = _upload(admin, tiny_mp4, "course_episode", EPISODE)
    assert res["video_source"] == "upload"
    assert "/api/courses/episodes" in res["video_url"]

    poster = admin.post(f"{API}/media/poster-at/course/{EPISODE}", json={"at": 1.0})
    assert poster.status_code == 200, poster.text

    dl = admin.get(f"{API}/media/download/course/{EPISODE}")
    assert dl.status_code == 200
    assert EPISODE in dl.headers.get("content-disposition", "")

    # Zugriffsrechte bleiben: gesperrte Folge bleibt für Free-Nutzer gesperrt
    with httpx.Client(timeout=60.0) as free:
        assert free.post(f"{API}/auth/login", json={"identifier": "free@wladbot.test", "password": "test123"}).status_code == 200
        stream = free.get(f"{API}/courses/episodes/{EPISODE}/video")
        assert stream.status_code in (403, 404), stream.status_code


def test_course_cleanup_removes_test_video():
    """Testdaten wieder entfernen — die Folge soll in der Preview nicht mit Fremdvideo dastehen."""
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    from dotenv import load_dotenv

    async def clean():
        load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
        db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
        await db.course_videos.delete_one({"episode_id": EPISODE})
    asyncio.run(clean())
