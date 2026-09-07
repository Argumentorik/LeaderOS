"""Iter 149 — Godmode regression for Guide video serving/streaming + core flows.
READ-ONLY w.r.t. money: never calls Fal generation endpoints, never PUTs scripts.
"""
import concurrent.futures
import hashlib
import os
import subprocess

import pytest
import requests

API = os.environ.get("API_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]
API = API.rstrip("/")

USERS = {
    "free": ("free@wladbot.test", "test123"),
    "accel": ("accelerator@wladbot.test", "test123"),
    "admin": ("test@test.com", "test123"),
}


def _login(email, password):
    r = requests.post(f"{API}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login {email} -> {r.status_code} {r.text[:200]}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    assert token, f"no token in login response: {list(data)}"
    return token


@pytest.fixture(scope="module")
def tokens():
    return {k: _login(*v) for k, v in USERS.items()}


def _h(token):
    return {"Authorization": f"Bearer {token}"}


# ── Public teaser ───────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def teaser():
    r = requests.get(f"{API}/api/guide/public/teaser", timeout=30)
    assert r.status_code == 200
    clip = r.json()["clip"]
    assert clip, "no published teaser clip"
    assert clip["video_url"].startswith("/api/guide/media/")
    assert clip["poster_url"], "teaser has no poster_url"
    return clip


def test_public_teaser_no_auth(teaser):
    assert teaser["slug"] and teaser["title"]


@pytest.fixture(scope="module")
def video_url(teaser):
    return f"{API}{teaser['video_url']}"


@pytest.fixture(scope="module")
def full_bytes(video_url):
    r = requests.get(video_url, timeout=120)
    assert r.status_code == 200
    assert r.headers.get("Accept-Ranges") == "bytes"
    assert int(r.headers["Content-Length"]) == len(r.content)
    assert len(r.content) > 100_000
    return r.content


# ── Range semantics ─────────────────────────────────────────────────────────
def test_head_matches_get(video_url, full_bytes):
    r = requests.head(video_url, timeout=30)
    assert r.status_code == 200
    assert int(r.headers["Content-Length"]) == len(full_bytes)
    assert r.headers.get("Accept-Ranges") == "bytes"


def test_range_prefix_100(video_url, full_bytes):
    r = requests.get(video_url, headers={"Range": "bytes=0-99"}, timeout=30)
    assert r.status_code == 206
    assert r.headers["Content-Range"] == f"bytes 0-99/{len(full_bytes)}"
    assert len(r.content) == 100
    assert r.content == full_bytes[:100]


def test_range_suffix(video_url, full_bytes):
    r = requests.get(video_url, headers={"Range": "bytes=-50"}, timeout=30)
    assert r.status_code == 206
    assert r.content == full_bytes[-50:]


def test_range_open_end(video_url, full_bytes):
    r = requests.get(video_url, headers={"Range": "bytes=1000-"}, timeout=120)
    assert r.status_code == 206
    assert r.headers["Content-Range"] == f"bytes 1000-{len(full_bytes) - 1}/{len(full_bytes)}"
    assert r.content == full_bytes[1000:]


def test_range_unsatisfiable_416(video_url, full_bytes):
    r = requests.get(video_url, headers={"Range": f"bytes={len(full_bytes)}-"}, timeout=30)
    assert r.status_code == 416
    assert r.headers.get("Content-Range") == f"bytes */{len(full_bytes)}"


def test_garbage_range_returns_full(video_url, full_bytes):
    r = requests.get(video_url, headers={"Range": "bytes=abc"}, timeout=120)
    assert r.status_code == 200
    assert len(r.content) == len(full_bytes)


def test_unknown_token_404():
    r = requests.get(f"{API}/api/guide/media/deadbeefdeadbeef/video", timeout=30)
    assert r.status_code == 404


def test_unknown_kind_404(teaser):
    token = teaser["video_url"].split("/")[-2]
    r = requests.get(f"{API}/api/guide/media/{token}/bogus", timeout=30)
    assert r.status_code == 404


def test_poster_returns_image(teaser):
    r = requests.get(f"{API}{teaser['poster_url']}", timeout=60)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/")
    assert len(r.content) > 1000


# ── Parallel identical + memory footprint ───────────────────────────────────
def _worker_rss_kb() -> int:
    """RSS of the uvicorn worker process (reload spawns a child of the supervisor process)."""
    pids = subprocess.run(["pgrep", "-f", "uvicorn server:app"], capture_output=True, text=True).stdout.split()
    if not pids:
        return 0
    out = subprocess.run(["ps", "-o", "rss=", "--ppid", pids[0], "--sort=-rss"], capture_output=True, text=True).stdout.split()
    return int(out[0]) if out else 0


def test_parallel_downloads_identical_and_streaming_does_not_buffer(video_url, full_bytes):
    expected = hashlib.md5(full_bytes).hexdigest()
    before = _worker_rss_kb()

    def fetch(_):
        r = requests.get(video_url, timeout=180)
        return r.status_code, hashlib.md5(r.content).hexdigest()

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        results = list(ex.map(fetch, range(10)))
    assert all(s == 200 and m == expected for s, m in results), results

    after = _worker_rss_kb()
    # 10 parallel full videos must not be buffered in RAM: growth well below 10x file size.
    assert after - before < 10 * len(full_bytes) // 1024, (
        f"RSS grew {after - before} KB for 10 parallel streams of {len(full_bytes)} bytes")


# ── User clip endpoints ─────────────────────────────────────────────────────
@pytest.mark.parametrize("kind,minimum", [("onboarding", 5), ("mission", 7), ("teaser", 1), ("all", 13)])
def test_list_clips_kinds(tokens, kind, minimum):
    r = requests.get(f"{API}/api/guide/clips", params={"kind": kind}, headers=_h(tokens["free"]), timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["total"] == len(d["clips"]) >= minimum, (kind, d["total"])
    assert isinstance(d["seen_count"], int)
    assert isinstance(d["mission_autoplay"], bool)
    for c in d["clips"]:
        assert "seen" in c and "slug" in c
        if c.get("published"):
            assert c.get("video_url"), c["slug"]


def test_list_clips_invalid_kind_400(tokens):
    r = requests.get(f"{API}/api/guide/clips", params={"kind": "nope"}, headers=_h(tokens["free"]), timeout=30)
    assert r.status_code == 400


def test_list_clips_requires_auth():
    r = requests.get(f"{API}/api/guide/clips", timeout=30)
    assert r.status_code in (401, 403)


def test_mission_clip_day1(tokens):
    r = requests.get(f"{API}/api/guide/clips/mission/1", headers=_h(tokens["free"]), timeout=30)
    assert r.status_code == 200
    clip = r.json()["clip"]
    assert clip and clip["kind"] == "mission"
    assert clip["video_url"]


def test_mark_seen_and_prefs_roundtrip(tokens):
    t = tokens["accel"]
    lst = requests.get(f"{API}/api/guide/clips", params={"kind": "onboarding"},
                       headers=_h(t), timeout=30).json()
    slug = lst["clips"][0]["slug"]
    r = requests.post(f"{API}/api/guide/clips/{slug}/seen", headers=_h(t), timeout=30)
    assert r.status_code == 200 and r.json()["ok"] is True
    after = requests.get(f"{API}/api/guide/clips", params={"kind": "onboarding"},
                         headers=_h(t), timeout=30).json()
    assert next(c for c in after["clips"] if c["slug"] == slug)["seen"] is True
    assert after["seen_count"] >= 1

    for value in (False, True):
        r = requests.post(f"{API}/api/guide/prefs", json={"mission_autoplay": value},
                          headers=_h(t), timeout=30)
        assert r.status_code == 200 and r.json()["mission_autoplay"] is value
        chk = requests.get(f"{API}/api/guide/clips", params={"kind": "mission"},
                           headers=_h(t), timeout=30).json()
        assert chk["mission_autoplay"] is value


# ── Admin (read-only) ───────────────────────────────────────────────────────
def test_admin_overview(tokens):
    r = requests.get(f"{API}/api/guide/admin/overview", headers=_h(tokens["admin"]), timeout=60)
    assert r.status_code == 200
    d = r.json()
    clips = d["clips"]
    assert len(clips) >= 13, len(clips)
    assert all(c.get("video_url") for c in clips if c.get("video_path")), "produced clip missing video_url"
    assert "spent_usd" in d["settings"]


def test_admin_overview_forbidden_for_non_admin(tokens):
    r = requests.get(f"{API}/api/guide/admin/overview", headers=_h(tokens["free"]), timeout=30)
    assert r.status_code == 403


def test_admin_single_clip(tokens, teaser):
    r = requests.get(f"{API}/api/guide/admin/clips/{teaser['slug']}", headers=_h(tokens["admin"]), timeout=30)
    assert r.status_code == 200
    assert r.json()["slug"] == teaser["slug"]
    r404 = requests.get(f"{API}/api/guide/admin/clips/does-not-exist", headers=_h(tokens["admin"]), timeout=30)
    assert r404.status_code == 404


def test_idempotent_concurrent_publish_true(tokens, teaser):
    url = f"{API}/api/guide/admin/clips/{teaser['slug']}/publish"

    def pub(_):
        return requests.post(url, json={"published": True}, headers=_h(tokens["admin"]), timeout=60).status_code

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
        codes = list(ex.map(pub, range(5)))
    assert all(c == 200 for c in codes), codes
    clip = requests.get(f"{API}/api/guide/admin/clips/{teaser['slug']}",
                        headers=_h(tokens["admin"]), timeout=30).json()
    assert clip["published"] is True


# ── Core regression ─────────────────────────────────────────────────────────
@pytest.mark.parametrize("key", list(USERS))
def test_login_and_me(tokens, key):
    r = requests.get(f"{API}/api/auth/me", headers=_h(tokens[key]), timeout=30)
    assert r.status_code == 200
    assert r.json().get("email", "").lower() == USERS[key][0].lower()


@pytest.mark.parametrize("path", ["/api/dashboard-v4", "/api/user/tier", "/api/features", "/api/challenge30/status"])
def test_core_dashboard_endpoints(tokens, path):
    r = requests.get(f"{API}{path}", headers=_h(tokens["free"]), timeout=60)
    assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"
    assert isinstance(r.json(), dict)
