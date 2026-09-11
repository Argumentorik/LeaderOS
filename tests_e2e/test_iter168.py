"""Iter 168 backend tests: dashboard bootstrap, telemetry, rag handbook."""
import os
import time
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # fallback from /app/frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")


def _login():
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login", json={"identifier": "test@test.com", "password": "test123"})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


# ---------- Dashboard bootstrap ----------
def test_dashboard_bootstrap_unauthenticated():
    r = requests.get(f"{BASE}/api/dashboard/bootstrap")
    assert r.status_code == 401, f"expected 401, got {r.status_code}"


def test_dashboard_bootstrap_authenticated_and_cache():
    s = _login()
    # Fresh=1 first to ensure miss
    r1 = s.get(f"{BASE}/api/dashboard/bootstrap?fresh=1")
    assert r1.status_code == 200, r1.text
    data = r1.json()
    for k in ["dashboard", "referral", "events_reminders", "events_live",
              "my_path_videos", "guide_clips", "folders", "generated_at"]:
        assert k in data, f"missing key {k}"
    assert data["dashboard"]["user"]["email"] == "test@test.com"
    d = data["dashboard"]
    assert "xp_info" in d and "streak" in d and "challenge30" in d
    assert isinstance(data["guide_clips"].get("clips"), list)
    assert isinstance(data["events_live"], list)
    cache1 = r1.headers.get("X-Bootstrap-Cache", "").lower()
    assert cache1 == "miss", f"first fresh=1 should be miss, got {cache1}"

    # Second call without fresh should hit cache
    r2 = s.get(f"{BASE}/api/dashboard/bootstrap")
    assert r2.status_code == 200
    cache2 = r2.headers.get("X-Bootstrap-Cache", "").lower()
    assert cache2 == "hit", f"second call should be hit, got {cache2}"

    # With ?fresh=1 → miss again
    r3 = s.get(f"{BASE}/api/dashboard/bootstrap?fresh=1")
    cache3 = r3.headers.get("X-Bootstrap-Cache", "").lower()
    assert cache3 == "miss", f"fresh=1 should bypass cache, got {cache3}"


# ---------- Telemetry ----------
def test_telemetry_page_load_anonymous_ok():
    payload = {"samples": [
        {"path": "/dashboard", "ms": 812, "nav": "navigate", "ttfb": 120, "requests": 8},
        {"path": "/courses/abc-def-123456", "ms": 950, "nav": "navigate", "requests": 12},
    ]}
    r = requests.post(f"{BASE}/api/telemetry/page-load", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True
    assert body.get("stored") == 2


def test_telemetry_page_load_validation():
    # ms > 120000
    r = requests.post(f"{BASE}/api/telemetry/page-load", json={
        "samples": [{"path": "/dashboard", "ms": 200000, "nav": "navigate", "requests": 1}]
    })
    assert r.status_code == 422, f"expected 422 for ms>120000, got {r.status_code}"

    # path > 120 chars
    long_path = "/" + "a" * 130
    r2 = requests.post(f"{BASE}/api/telemetry/page-load", json={
        "samples": [{"path": long_path, "ms": 500, "nav": "navigate", "requests": 1}]
    })
    assert r2.status_code == 422, f"expected 422 for long path, got {r2.status_code}"


def test_telemetry_overview_admin():
    s = _login()
    # ensure some samples exist
    s.post(f"{BASE}/api/telemetry/page-load", json={"samples": [
        {"path": "/dashboard", "ms": 700, "nav": "navigate", "requests": 5},
        {"path": "/courses/xyz-abc-789012", "ms": 1200, "nav": "navigate", "requests": 8},
    ]})
    time.sleep(0.3)
    r = s.get(f"{BASE}/api/admin/telemetry/page-loads?since_hours=24")
    assert r.status_code == 200, f"{r.status_code} {r.text}"
    body = r.json()
    assert body.get("samples", 0) >= 2, f"samples: {body.get('samples')}"
    routes = body.get("routes", [])
    assert isinstance(routes, list) and len(routes) > 0
    r0 = routes[0]
    for k in ["route", "count", "p50", "p95", "max", "grade"]:
        assert k in r0, f"route missing key {k}: {r0}"
    # normalization
    route_names = [x["route"] for x in routes]
    assert any(rn == "/courses/:id" for rn in route_names), f"courses not normalized: {route_names}"


def test_telemetry_overview_unauth():
    r = requests.get(f"{BASE}/api/admin/telemetry/page-loads?since_hours=24")
    assert r.status_code in (401, 403), r.status_code


# ---------- RAG Handbook ----------
def test_rag_handbook_admin():
    s = _login()
    r = s.get(f"{BASE}/api/admin/rag/handbuch")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "markdown" in body and "updated_at" in body
    assert body["markdown"].lstrip().startswith("# Dev-Handbuch"), body["markdown"][:80]


def test_rag_handbook_unauth():
    r = requests.get(f"{BASE}/api/admin/rag/handbuch")
    assert r.status_code in (401, 403), r.status_code
