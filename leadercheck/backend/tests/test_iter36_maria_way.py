"""Iter 36: Maria's Way landing + EP03 redesign + 7-episode drip preview."""
import os
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://role-assessment-lab.preview.emergentagent.com").rstrip("/")

ALL_SLUGS = [
    "ep01_first_win", "ep02_boss_answer", "ep03_maria",
    "ep04_hardest_sentence", "ep05_cfo_test", "ep06_three_min", "ep07_executive_mode",
]


@pytest.mark.parametrize("slug", ALL_SLUGS)
def test_drip_preview_each_slug_returns_200_with_subject_and_html(slug):
    r = requests.get(f"{BASE}/api/email/drip-preview", params={"slug": slug}, timeout=20)
    assert r.status_code == 200, f"{slug}: {r.status_code} {r.text[:200]}"
    data = r.json()
    assert "subject" in data and isinstance(data["subject"], str) and len(data["subject"]) > 0
    assert "html" in data and isinstance(data["html"], str)
    assert "<html" in data["html"].lower()
    assert "leaderos.de" in data["html"] or "leadercheck.de" in data["html"]


def test_drip_preview_ep03_maria_contains_maria_content():
    r = requests.get(f"{BASE}/api/email/drip-preview", params={"slug": "ep03_maria"}, timeout=20)
    assert r.status_code == 200
    data = r.json()
    html = data["html"]
    assert "Maria K." in html, "Missing 'Maria K.' attribution"
    assert "50 Credits" in html, "Missing '50 Credits' label"
    assert "leaderos.de" in html, "Missing leaderos.de link"
    assert "+180k" in html or "180k" in html, "Missing +180k EUR"
    assert "6 Monaten" in data["subject"] or "Maria" in data["subject"]


def test_drip_preview_legacy_score_meaning_maps_to_ep01():
    r_legacy = requests.get(f"{BASE}/api/email/drip-preview", params={"slug": "score_meaning"}, timeout=20)
    assert r_legacy.status_code == 200
    legacy = r_legacy.json()

    r_new = requests.get(f"{BASE}/api/email/drip-preview", params={"slug": "ep01_first_win"}, timeout=20)
    assert r_new.status_code == 200
    new = r_new.json()

    # Subject lines should match (legacy maps to ep01)
    assert legacy["subject"] == new["subject"], (
        f"Legacy mapping broken: {legacy['subject']!r} != {new['subject']!r}"
    )


def test_drip_preview_unknown_slug_returns_404():
    r = requests.get(f"{BASE}/api/email/drip-preview", params={"slug": "totally_unknown_slug_xxx"}, timeout=20)
    assert r.status_code == 404


@pytest.mark.parametrize("path", ["/wladbot.png", "/wladbot-3d.png"])
def test_wladbot_static_assets_load_200(path):
    r = requests.get(f"{BASE}{path}", timeout=15)
    assert r.status_code == 200, f"{path} -> {r.status_code}"
    assert r.headers.get("content-type", "").startswith("image/"), (
        f"{path}: content-type={r.headers.get('content-type')}"
    )
    assert len(r.content) > 1000, f"{path} too small ({len(r.content)} bytes)"
