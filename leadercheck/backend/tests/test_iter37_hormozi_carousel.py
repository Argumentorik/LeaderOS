"""Iter 37: Hormozi-Copy refactor (EP03) + 'Live mit Wlad' removal across drip emails."""
import os
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://role-assessment-lab.preview.emergentagent.com").rstrip("/")


def _fetch(slug):
    r = requests.get(f"{BASE}/api/email/drip-preview", params={"slug": slug}, timeout=20)
    assert r.status_code == 200, f"{slug}: {r.status_code}"
    return r.json()


# === EP03 Hormozi Copy ===
def test_ep03_subject_contains_maria_unsichtbar():
    data = _fetch("ep03_maria")
    subj = data["subject"]
    assert "unsichtbar" in subj.lower() or "Maria" in subj, f"Subject: {subj!r}"


def test_ep03_html_contains_vor_30_tagen():
    data = _fetch("ep03_maria")
    html = data["html"]
    assert "Vor 30 Tagen" in html or "30 Tage" in html, "Missing '30 Tage' Hormozi-hook"
    assert "Maria" in html
    assert "+180k" in html or "180k" in html or "180.000" in html


# === EP07 must NOT mention old 'Wlad antwortet persönlich' / 'Live mit Wlad' ===
def test_ep07_html_no_wlad_antwortet_persoenlich():
    data = _fetch("ep07_executive_mode")
    blob = (data["html"] + data["subject"]).lower()
    assert "wlad antwortet persönlich" not in blob, "Old 'Wlad antwortet persönlich' copy still present"
    assert "live mit wlad" not in blob, "Old 'Live mit Wlad' copy still present"
    assert "12x live" not in blob, "Old '12x live' marketing still present"


# === Cross-episode: no 'Live mit Wlad' anywhere ===
EPS = ["ep01_first_win", "ep02_boss_answer", "ep03_maria", "ep04_hardest_sentence",
       "ep05_cfo_test", "ep06_three_min", "ep07_executive_mode"]


@pytest.mark.parametrize("slug", EPS)
def test_no_live_mit_wlad_in_any_episode(slug):
    data = _fetch(slug)
    blob = (data["html"] + " " + data["subject"]).lower()
    assert "live mit wlad" not in blob, f"{slug}: contains 'Live mit Wlad'"
    assert "12x live mit wlad" not in blob, f"{slug}: contains '12x Live mit Wlad'"
