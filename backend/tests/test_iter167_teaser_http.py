"""Iter 167 — HTTP-level regression: public teaser, admin clip, PUT script validation.
IMPORTANT: does NOT call render/produce/keyframes/plan/script-draft (kostenpflichtig)."""
import os
import requests

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
# fallback for pytest running with backend/.env only
if not BASE.startswith("http"):
    BASE = "https://command-center-229.preview.emergentagent.com"

ADMIN = {"identifier": "test@test.com", "password": "test123"}


def _login_session():
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login", json=ADMIN, timeout=15)
    assert r.status_code == 200, r.text
    return s


def test_public_teaser_endpoint():
    r = requests.get(f"{BASE}/api/guide/public/teaser", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    clip = data.get("clip") or {}
    assert clip.get("slug") == "teaser-login", clip
    assert clip.get("video_url"), clip
    assert clip.get("poster_url"), clip
    # HEAD/GET video
    v = requests.get(f"{BASE}{clip['video_url']}", timeout=30, stream=True)
    assert v.status_code == 200
    assert v.headers.get("content-type", "").startswith("video/")
    total = int(v.headers.get("content-length") or 0)
    assert total > 5 * 1024 * 1024, f"video too small: {total} bytes"
    v.close()
    p = requests.get(f"{BASE}{clip['poster_url']}", timeout=15)
    assert p.status_code == 200
    assert p.headers.get("content-type", "").startswith("image/")


def test_admin_clip_teaser_login_metadata():
    s = _login_session()
    r = s.get(f"{BASE}/api/guide/admin/clips/teaser-login", timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("status") == "video_ready"
    dur = d.get("duration_seconds_video") or 0
    assert 50 <= dur <= 62, f"duration {dur}"
    shots = d.get("shots") or []
    assert len(shots) == 2
    s1, s2 = shots[0], shots[1]
    assert s1.get("type") == "walk"
    assert s1.get("preset") == "studio_walk_in"
    assert s1.get("engine") == "kling-2.6-audio"
    assert s1.get("raw_url")
    assert s2.get("type") == "talk"
    assert s2.get("preset") == "studio_medium"
    assert s2.get("engine") == "omnihuman"
    gm = d.get("godmode") or {}
    assert gm.get("passed") == 11
    assert d.get("single_take") is True
    assert d.get("walk_in") is True
    assert d.get("published") is True
    assert d.get("stale") is False


def test_put_script_teaser_limits():
    s = _login_session()
    r = s.get(f"{BASE}/api/guide/admin/clips/teaser-login", timeout=15)
    original = r.json().get("script")
    assert original and len(original.split()) == 123, len(original.split()) if original else "no script"
    # Save unchanged → 200
    r1 = s.put(f"{BASE}/api/guide/admin/clips/teaser-login",
               json={"script": original}, timeout=15)
    assert r1.status_code == 200, r1.text
    # 10-word script → 400 with 'erlaubt sind 30 bis 150'
    short = "Nur zehn Wörter reichen für ein echtes Teaser bei weitem nicht."  # ~11
    r2 = s.put(f"{BASE}/api/guide/admin/clips/teaser-login",
               json={"script": short}, timeout=15)
    assert r2.status_code == 400, r2.text
    detail = (r2.json().get("detail") or "").lower()
    assert "30 bis 150" in detail or "30..150" in detail or "30-150" in detail, detail
    # Restore original (idempotent — no re-render trigger since same text)
    r3 = s.put(f"{BASE}/api/guide/admin/clips/teaser-login",
               json={"script": original}, timeout=15)
    assert r3.status_code == 200
