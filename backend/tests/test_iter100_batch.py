"""Iter 100 batch smoke tests: tasks/generate + my-path videos lock badges."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]
BASE_URL = BASE_URL.rstrip("/")


def _login(identifier, password="test123"):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"identifier": identifier, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed {identifier}: {r.status_code} {r.text[:200]}"
    j = r.json()
    return j.get("token") or j.get("access_token")


def test_free_user_login():
    tok = _login("free@wladbot.test")
    assert isinstance(tok, str) and len(tok) > 20


def test_mypath_videos_lock_badges():
    tok = _login("free@wladbot.test")
    r = requests.get(f"{BASE_URL}/api/my-path/videos", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
    assert r.status_code == 200, r.text[:200]
    data = r.json()
    # Expect list of entries with `unlocked` boolean present
    # Aggregate videos from all buckets
    vids = []
    for key in ("starter_videos", "free_videos", "accelerator_videos", "videos", "entries"):
        v = data.get(key) if isinstance(data, dict) else None
        if isinstance(v, list):
            vids.extend(v)
    assert len(vids) > 0, f"no videos for free user"
    has_unlocked_field = any("unlocked" in v for v in vids if isinstance(v, dict))
    assert has_unlocked_field, f"unlocked flag missing: sample={vids[0] if vids else None}"
    # free tier should have at least one locked
    locked = [v for v in vids if isinstance(v, dict) and v.get("unlocked") is False]
    assert len(locked) >= 1, "expected some locked videos for free user"


def test_tasks_generate_cap_or_success():
    tok = _login("free@wladbot.test")
    r = requests.post(f"{BASE_URL}/api/tasks/generate", headers={"Authorization": f"Bearer {tok}"}, timeout=90)
    # accept either created:5 or 400 (cap reached with German message)
    assert r.status_code in (200, 201, 400), f"unexpected: {r.status_code} {r.text[:200]}"
    body = r.json()
    if r.status_code in (200, 201):
        # created should be present
        assert body.get("created", 0) >= 1 or body.get("tasks")
    else:
        # 400 cap message
        detail = body.get("detail", "")
        assert isinstance(detail, str) and len(detail) > 0
