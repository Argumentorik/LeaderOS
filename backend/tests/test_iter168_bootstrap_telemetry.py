"""Iter 168: Dashboard-Bootstrap (ein Request), Ladezeit-Telemetrie, Dev-Handbuch im Admin."""

import os

import pytest
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", ".env"))
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"identifier": "test@test.com", "password": "test123"}, timeout=30)
    assert r.status_code == 200, r.text
    return s


def test_bootstrap_bundle_and_cache(admin):
    r = admin.get(f"{BASE_URL}/api/dashboard/bootstrap", params={"fresh": 1}, timeout=60)
    assert r.status_code == 200
    d = r.json()
    for k in ("dashboard", "referral", "events_reminders", "events_live", "my_path_videos", "guide_clips", "folders", "generated_at"):
        assert k in d, k
    assert d["dashboard"]["user"]["email"] == "test@test.com"
    assert isinstance(d["events_live"], list) and isinstance(d["guide_clips"]["clips"], list)
    assert r.headers.get("X-Bootstrap-Cache") == "miss"
    assert admin.get(f"{BASE_URL}/api/dashboard/bootstrap", timeout=60).headers.get("X-Bootstrap-Cache") == "hit"


def test_bootstrap_requires_login():
    assert requests.get(f"{BASE_URL}/api/dashboard/bootstrap", timeout=30).status_code == 401


def test_page_load_ingest_and_overview(admin):
    r = requests.post(f"{BASE_URL}/api/telemetry/page-load", json={"samples": [
        {"path": "/courses/leadership-grundlagen-01", "ms": 2900, "nav": "spa", "requests": 2},
        {"path": "/dashboard", "ms": 610, "nav": "initial", "ttfb": 95, "requests": 1},
    ]}, timeout=30)
    assert r.status_code == 200 and r.json()["stored"] == 2
    bad = requests.post(f"{BASE_URL}/api/telemetry/page-load", json={"samples": [{"path": "/x", "ms": 999999}]}, timeout=30)
    assert bad.status_code == 422
    ov = admin.get(f"{BASE_URL}/api/admin/telemetry/page-loads", params={"since_hours": 24}, timeout=30)
    assert ov.status_code == 200
    data = ov.json()
    routes = {x["route"]: x for x in data["routes"]}
    assert "/courses/:id" in routes and routes["/courses/:id"]["grade"] == "slow"
    assert "/dashboard" in routes and {"count", "p50", "p95", "max"} <= set(routes["/dashboard"])
    assert any(o["route"] == "/courses/:id" for o in data["outliers"])


def test_page_loads_admin_only():
    assert requests.get(f"{BASE_URL}/api/admin/telemetry/page-loads", timeout=30).status_code in (401, 403)


def test_handbook(admin):
    r = admin.get(f"{BASE_URL}/api/admin/rag/handbuch", timeout=30)
    assert r.status_code == 200 and r.json()["markdown"].startswith("# Dev-Handbuch")
    assert requests.get(f"{BASE_URL}/api/admin/rag/handbuch", timeout=30).status_code in (401, 403)
