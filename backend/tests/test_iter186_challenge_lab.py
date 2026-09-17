"""Iter 186 — 30-Tage-Programm durchziehen + Leadership LAB.

Geprüft wird: „Erledigt ist, wenn …" an jedem Tag, der Zustand „begonnen",
offene/nachholbare Tage, die Tages-Mail (eine pro Tag, nur wenn offen) und die
zweistufige LAB-Anmeldung.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE}/api"


def test_done_criteria_for_every_day() -> None:
    from challenge30_criteria import done_criteria, next_open_day, open_days
    from routes.challenge30 import CHALLENGES

    assert len(CHALLENGES) == 30
    for entry in CHALLENGES:
        crit = done_criteria(entry)
        assert crit["done_de"].startswith("Erledigt ist, wenn")
        assert crit["done_en"]

    # Entscheidung 8a: Tag 2 bleibt Tag 2, auch wenn man hinterherhängt.
    assert next_open_day(CHALLENGES, [1], 5) == 2
    assert open_days(CHALLENGES, [1, 2], 4) == [3, 4]
    assert next_open_day(CHALLENGES, list(range(1, 31)), 30) is None


def test_challenge_day_email_has_task_and_criteria() -> None:
    from services_email import challenge_day_email

    subject, html = challenge_day_email(
        "Alex", 2, "KI-Grundlagen", "Was KI für deine Führung bedeutet.", "10 Min",
        "Erledigt ist, wenn du die 10 Fragen beantwortet hast.", "Woche 1",
        cta_path="/challenge", app_url="https://leaderos.de",
    )
    assert subject == "Tag 2: KI-Grundlagen"
    assert "Erledigt ist, wenn" in html
    assert "Tag 2 von 30" in html
    assert "https://leaderos.de/challenge" in html


@pytest.fixture(scope="module")
def client() -> httpx.Client:
    if not BASE:
        pytest.skip("REACT_APP_BACKEND_URL fehlt")
    c = httpx.Client(timeout=90.0)
    r = c.post(f"{API}/auth/login", json={"identifier": "free@wladbot.test", "password": "test123"})
    assert r.status_code == 200, r.text
    yield c
    c.close()


def test_status_carries_criteria_and_open_days(client: httpx.Client) -> None:
    r = client.get(f"{API}/challenge30/status")
    assert r.status_code == 200
    data = r.json()
    assert "open_days" in data and "next_open_day" in data and "started_days" in data
    first = data["challenges"][0]
    assert first["done_de"].startswith("Erledigt ist, wenn")


def test_start_marks_day_as_started(client: httpx.Client) -> None:
    day = client.get(f"{API}/challenge30/status").json()["next_open_day"] or 1
    r = client.post(f"{API}/challenge30/start/{day}")
    assert r.status_code == 200, r.text
    assert r.json()["started"] is True
    assert day in client.get(f"{API}/challenge30/status").json()["started_days"]


def test_lab_info_is_public_and_interest_works() -> None:
    if not BASE:
        pytest.skip("REACT_APP_BACKEND_URL fehlt")
    with httpx.Client(timeout=60.0) as anon:
        info = anon.get(f"{API}/lab/info")
        assert info.status_code == 200
        body = info.json()
        assert body["name"] == "Leadership LAB"
        assert body["episodes"] == 72
        assert len(body["start_groups"]) >= 1
        assert body["authenticated"] is False

        res = anon.post(f"{API}/lab/interest", json={
            "name": "Pytest Person", "email": "pytest-lab@example.com",
            "role": "Teamleitung", "team_size": "9", "pain": "Konflikte",
        })
        assert res.status_code == 200
        assert res.json()["registered"] is True


def test_lab_enroll_requires_paid_access(client: httpx.Client) -> None:
    r = client.post(f"{API}/lab/enroll", json={
        "start_group": "2026-07-06", "goal": "Klarer führen", "consent_live_calls": True,
    })
    assert r.status_code == 402
    assert r.json()["detail"]["error"] == "tier_required"


def test_daily_mail_endpoint_is_protected() -> None:
    if not BASE:
        pytest.skip("REACT_APP_BACKEND_URL fehlt")
    with httpx.Client(timeout=60.0) as anon:
        assert anon.post(f"{API}/cron/challenge-daily").status_code in (401, 403)
        merged = anon.post(f"{API}/cron/drip-sequence")
        assert merged.status_code in (401, 403)
