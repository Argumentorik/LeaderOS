"""Iter 166 — Video-Guide Tempo (lean list, Detail-Endpoint, Poster-Fallback), Skript-Entwurf + Render-Guard, Event-Hinweis-Schalter."""
import os

import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
PASSWORD = os.environ.get("TEST_ACCOUNT_PASSWORD", "test123")  # Seed-Testkonto
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "test@test.com")
LEAN = {"slug", "kind", "ref", "order", "title", "poster_url", "video_url", "duration_seconds", "duration_seconds_video", "seen"}


def _h(identifier):
    r = requests.post(f"{BASE}/api/auth/login", json={"identifier": identifier, "password": PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_lean_clip_list_is_small_and_has_posters():
    h = _h("free@wladbot.test")
    lean = requests.get(f"{BASE}/api/guide/clips", params={"kind": "all", "lean": 1}, headers=h, timeout=30)
    full = requests.get(f"{BASE}/api/guide/clips", params={"kind": "all"}, headers=h, timeout=30)
    assert lean.status_code == 200 and full.status_code == 200
    assert len(lean.content) < len(full.content) * 0.6
    clips = [c for c in lean.json()["clips"] if c["video_url"]]
    assert clips and all(set(c) == LEAN for c in clips)
    assert all(c["poster_url"] for c in clips), "jeder freigegebene Clip hat ein Vorschaubild"
    p = requests.get(f"{BASE}{clips[0]['poster_url']}", timeout=60)
    assert p.status_code == 200 and p.headers["content-type"].startswith("image/")
    # Browser-Cache-Header direkt vom Backend (der Preview-Proxy überschreibt Cache-Control mit no-store)
    local = requests.get(f"http://localhost:8001{clips[0]['poster_url']}", timeout=60)
    assert "max-age=604800" in local.headers.get("cache-control", "") and local.headers.get("etag")


def test_clip_detail_endpoint_returns_script_and_subtitles():
    h = _h("free@wladbot.test")
    d = requests.get(f"{BASE}/api/guide/clips/start-1-willkommen", headers=h, timeout=30).json()
    assert d["slug"] == "start-1-willkommen" and len(d["script"]) > 50 and "subtitles" in d and "questions" in d
    assert requests.get(f"{BASE}/api/guide/clips/gibt-es-nicht", headers=h, timeout=30).status_code == 404


def test_event_hints_flag_registered_and_off_by_default():
    f = requests.get(f"{BASE}/api/features", headers=_h("standard@wladbot.test"), timeout=30).json()
    assert f["features"]["event_hints"] is False


def test_script_draft_flow_blocks_render_until_approved():
    h = _h(ADMIN_EMAIL)
    slug = "start-3-kontext"
    before = requests.get(f"{BASE}/api/guide/admin/clips/{slug}", headers=h, timeout=30).json()
    draft = ("Kontext ist das, was aus einer allgemeinen Antwort deine Antwort macht. Wenn ich weiß, dass du ein Team von zwölf Leuten in der Produktion führst, "
             "rede ich anders mit dir, als wenn du gerade dein erstes Team übernommen hast. Deshalb frage ich dich am Anfang nach deiner Rolle, deiner Branche und deinem Ziel. "
             "Nimm dir dafür zwei Minuten, dann passt alles danach zu dir.")
    assert requests.put(f"{BASE}/api/guide/admin/clips/{slug}/script-draft", json={"script": "zu kurz"}, headers=h, timeout=30).status_code == 400
    r = requests.put(f"{BASE}/api/guide/admin/clips/{slug}/script-draft", json={"script": draft}, headers=h, timeout=30)
    assert r.status_code == 200 and r.json()["words"] >= 20
    c = requests.get(f"{BASE}/api/guide/admin/clips/{slug}", headers=h, timeout=30).json()
    assert c["script_draft_status"] == "pending" and c["script"] == before["script"], "altes Skript bleibt, bis freigegeben"
    blocked = requests.post(f"{BASE}/api/guide/admin/clips/{slug}/render", headers=h, timeout=30)
    assert blocked.status_code == 400 and "Freigabe" in blocked.json()["detail"]
    assert requests.delete(f"{BASE}/api/guide/admin/clips/{slug}/script-draft", headers=h, timeout=30).status_code == 200
    c2 = requests.get(f"{BASE}/api/guide/admin/clips/{slug}", headers=h, timeout=30).json()
    assert "script_draft" not in c2 and c2["script"] == before["script"]
    assert requests.put(f"{BASE}/api/guide/admin/clips/{slug}/script-draft", json={"script": draft}, headers=_h("free@wladbot.test"), timeout=30).status_code in (401, 403)


def test_pending_godmode_drafts_exist_for_first_two_clips():
    h = _h(ADMIN_EMAIL)
    for slug in ("start-1-willkommen", "start-2-so-sprichst-du"):
        c = requests.get(f"{BASE}/api/guide/admin/clips/{slug}", headers=h, timeout=30).json()
        assert c.get("script_draft_status") == "pending" and 70 <= len(c["script_draft"].split()) <= 150
        assert c["published"] is True, "alter Clip bleibt online"
