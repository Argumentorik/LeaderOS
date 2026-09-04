"""Iter 148: Disk-Cache + gestreamte Range-Antworten für Guide-Medien, atomarer Job-Lock.
Ruft KEINE Fal-Endpunkte auf (Kosten)."""
import asyncio
import hashlib
import os
import sys
import uuid

import pytest
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

API = os.environ.get("API_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]


@pytest.fixture(scope="module")
def video_url():
    clip = requests.get(f"{API}/api/guide/public/teaser", timeout=30).json()["clip"]
    assert clip and clip["video_url"]
    return f"{API}{clip['video_url']}"


@pytest.fixture(scope="module")
def full_bytes(video_url):
    r = requests.get(video_url, timeout=60)
    assert r.status_code == 200
    assert r.headers["Accept-Ranges"] == "bytes"
    assert int(r.headers["Content-Length"]) == len(r.content) > 100_000
    return r.content


def test_head_reports_length(video_url, full_bytes):
    r = requests.head(video_url, timeout=30)
    assert r.status_code == 200
    assert int(r.headers["Content-Length"]) == len(full_bytes)


def test_range_prefix(video_url, full_bytes):
    r = requests.get(video_url, headers={"Range": "bytes=0-99"}, timeout=30)
    assert r.status_code == 206
    assert r.headers["Content-Range"] == f"bytes 0-99/{len(full_bytes)}"
    assert r.content == full_bytes[:100]


def test_range_middle_and_open_end(video_url, full_bytes):
    r = requests.get(video_url, headers={"Range": "bytes=1000-1999"}, timeout=30)
    assert r.status_code == 206 and r.content == full_bytes[1000:2000]
    r = requests.get(video_url, headers={"Range": "bytes=5000-"}, timeout=60)
    assert r.status_code == 206 and r.content == full_bytes[5000:]


def test_range_suffix(video_url, full_bytes):
    r = requests.get(video_url, headers={"Range": "bytes=-50"}, timeout=30)
    assert r.status_code == 206 and r.content == full_bytes[-50:]


def test_range_unsatisfiable(video_url, full_bytes):
    r = requests.get(video_url, headers={"Range": f"bytes={len(full_bytes) + 10}-"}, timeout=30)
    assert r.status_code == 416
    assert r.headers["Content-Range"] == f"bytes */{len(full_bytes)}"


def test_range_garbage_falls_back_to_200(video_url, full_bytes):
    r = requests.get(video_url, headers={"Range": "bytes=abc"}, timeout=60)
    assert r.status_code == 200 and r.content == full_bytes


def test_unknown_token_404():
    assert requests.get(f"{API}/api/guide/media/nope/video", timeout=30).status_code == 404
    assert requests.get(f"{API}/api/guide/media/nope/shot/s1/raw", timeout=30).status_code == 404


def test_parallel_requests_identical(video_url, full_bytes):
    from concurrent.futures import ThreadPoolExecutor

    digest = hashlib.md5(full_bytes).hexdigest()
    with ThreadPoolExecutor(8) as ex:
        results = list(ex.map(lambda _: hashlib.md5(requests.get(video_url, timeout=60).content).hexdigest(), range(8)))
    assert results == [digest] * 8


def test_claim_is_atomic():
    """10 parallele Claims auf denselben Clip → genau einer gewinnt (kein Fal-Aufruf)."""
    from dotenv import load_dotenv

    load_dotenv("/app/backend/.env")
    from config import db
    from routes.guide import _claim

    slug = f"__test_claim_{uuid.uuid4().hex[:6]}"

    async def run():
        await db.guide_clips.insert_one({"slug": slug, "status": "script_ready", "kind": "test", "title": "t", "script": "x"})
        try:
            wins = await asyncio.gather(*[_claim(slug, "full_running") for _ in range(10)])
            doc = await db.guide_clips.find_one({"slug": slug})
            return wins, doc
        finally:
            await db.guide_clips.delete_one({"slug": slug})

    wins, doc = asyncio.run(run())
    assert sum(wins) == 1
    assert doc["status"] == "full_running"
