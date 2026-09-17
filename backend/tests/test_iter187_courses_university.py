"""Iter 187: Universität — 10 Kurse, 72 Folgen, öffentliches Studienplan-API + E-Mail-Tor.
Testet /api/courses (öffentlich), /api/courses/{slug} und POST /api/courses/lead (Cookie).
"""
import os
import uuid

import requests

def _base():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    # Fallback: read frontend/.env
    try:
        for line in open("/app/frontend/.env"):
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL not set")

BASE = _base()


# ---- Öffentliche Kursübersicht ------------------------------------------------
def test_list_courses_public_launch_and_totals():
    r = requests.get(f"{BASE}/api/courses", timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["total_courses"] == 10
    assert data["total_episodes"] == 72
    assert data["authenticated"] is False
    assert data["has_access"] is False
    assert data["lead_registered"] is False
    launch = data["launch"]
    assert launch["date"] == "2026-11-01"
    assert launch["label"] == "01.11.2026"
    assert launch["launched"] is False
    assert launch["days_until"] > 0


def test_list_courses_gate_first_episode_none_others_email():
    r = requests.get(f"{BASE}/api/courses", timeout=30)
    data = r.json()
    for c in data["courses"]:
        assert c["episodes"][0]["gate"] == "none"
        for e in c["episodes"][1:]:
            assert e["gate"] == "email", f"{c['slug']} Folge {e['number']} gate={e['gate']}"


def test_get_single_course_public():
    r = requests.get(f"{BASE}/api/courses/rhetorik-grundlagen", timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["slug"] == "rhetorik-grundlagen"
    assert data["launch"]["date"] == "2026-11-01"
    assert data["lead_registered"] is False
    assert data["episodes"][0]["gate"] == "none"
    assert data["episodes"][1]["gate"] == "email"


# ---- E-Mail-Tor: Cookie einmalig, gilt für alle Folgen ------------------------
def test_lead_registration_sets_cookie_unlocks_all():
    sess = requests.Session()
    payload = {
        "name": "Testkunde",
        "email": f"kurs-tor-{uuid.uuid4().hex[:8]}@wladbot-testing.de",
        "episode_id": "rhetorik-grundlagen-2",
    }
    r = sess.post(f"{BASE}/api/courses/lead", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["unlocked"] is True
    # Cookie muss gesetzt sein
    assert "los_course_lead" in sess.cookies.get_dict(), sess.cookies.get_dict()

    # Erneuter GET mit Cookie: lead_registered=true, Folge 2+ unlocked
    r2 = sess.get(f"{BASE}/api/courses", timeout=30)
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["lead_registered"] is True
    # Über alle Kurse sind Folgen 2+ gate=email aber unlocked
    for c in d2["courses"]:
        for e in c["episodes"][1:]:
            assert e["gate"] == "email"
            # In der Liste kommt "unlocked"-Feld
            assert e.get("unlocked") is True, f"{c['slug']} Folge {e['number']} noch gesperrt"

    # Andere Folge eines anderen Kurses ebenfalls offen
    r3 = sess.get(f"{BASE}/api/courses/delegation", timeout=30)
    d3 = r3.json()
    assert d3["lead_registered"] is True
    assert d3["episodes"][2]["gate"] == "email"
    assert d3["episodes"][2]["unlocked"] is True


# ---- Kaufkonto: has_access=true, gate="starts" für Folgen 2+ ------------------
def _login(email, password):
    r = requests.post(f"{BASE}/api/auth/login", json={"identifier": email, "password": password}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json().get("access_token") or r.json().get("token")


def test_standard_user_sees_access_secured_and_starts_gate():
    tok = _login("standard@wladbot.test", "test123")
    r = requests.get(f"{BASE}/api/courses", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data["authenticated"] is True
    assert data["has_access"] is True
    # Folge 2+ soll gate="starts" haben (gekauft, aber Startdatum in Zukunft)
    c0 = data["courses"][0]
    assert c0["episodes"][0]["gate"] == "none"
    assert c0["episodes"][1]["gate"] == "starts"
