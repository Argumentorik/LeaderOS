"""Iter 133 — Conversion Center (approval-gated 400-client sequence).

Covers: admin gating, sequence shape, preview rendering, approval
round-trip, cron auth + zero-send safety when nothing is approved.
"""
import os
import requests
import pytest

API_BASE = os.environ.get("REACT_APP_BACKEND_URL", "")
assert API_BASE, "REACT_APP_BACKEND_URL must be set"
API = f"{API_BASE}/api"

ADMIN_EMAIL = "test@test.com"
FREE_EMAIL = "free@wladbot.test"
PW = os.environ.get("TEST_PASSWORD", "test123")
CRON_SECRET = os.environ.get("CRON_SHARED_SECRET", "")


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": PW}, timeout=20)
    assert r.status_code == 200, r.text
    s.headers["Authorization"] = f"Bearer {r.json()['token']}"
    return s


def test_sequence_requires_admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": FREE_EMAIL, "password": PW}, timeout=20)
    assert r.status_code == 200
    r = s.get(f"{API}/admin/conversion/sequence",
              headers={"Authorization": f"Bearer {r.json()['token']}"}, timeout=20)
    assert r.status_code == 403


def test_sequence_shape(admin):
    r = admin.get(f"{API}/admin/conversion/sequence", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert len(d["emails"]) == 8
    ids = [e["id"] for e in d["emails"]]
    assert ids[0] == "conv_01_intro" and ids[-1] == "conv_08_onboarding"
    for e in d["emails"]:
        assert e["purpose"] and e["trigger"] and e["segment_label"] and e["subject"]
    assert set(d["segment_counts"].keys()) >= {"mc_not_activated", "purchased_not_onboarded", "checkout_abandoned"}


def test_preview_renders_html(admin):
    r = admin.get(f"{API}/admin/conversion/preview/conv_02_value", timeout=20)
    assert r.status_code == 200
    d = r.json()
    assert "<html" in d["html"].lower()
    assert "SEXIER" in d["html"]
    assert "leaderos.de/login" in d["html"]


def test_preview_unknown_404(admin):
    r = admin.get(f"{API}/admin/conversion/preview/does_not_exist", timeout=20)
    assert r.status_code == 404


def test_approval_roundtrip(admin):
    r = admin.post(f"{API}/admin/conversion/conv_05_objections/approval", json={"status": "approved"}, timeout=20)
    assert r.status_code == 200 and r.json()["status"] == "approved"
    r = admin.get(f"{API}/admin/conversion/sequence", timeout=30)
    e5 = next(e for e in r.json()["emails"] if e["id"] == "conv_05_objections")
    assert e5["status"] == "approved"
    r = admin.post(f"{API}/admin/conversion/conv_05_objections/approval", json={"status": "draft"}, timeout=20)
    assert r.status_code == 200 and r.json()["status"] == "draft"


def test_approval_invalid_status(admin):
    r = admin.post(f"{API}/admin/conversion/conv_01_intro/approval", json={"status": "yolo"}, timeout=20)
    assert r.status_code == 400


def test_cron_requires_secret():
    r = requests.post(f"{API}/cron/masterclass-conversion", timeout=20)
    assert r.status_code == 401


def test_cron_zero_send_when_nothing_approved(admin):
    if not CRON_SECRET:
        pytest.skip("CRON_SHARED_SECRET not in env")
    # Ensure all drafts (reset any approved from manual testing)
    seq = admin.get(f"{API}/admin/conversion/sequence", timeout=30).json()
    for e in seq["emails"]:
        if e["status"] == "approved":
            admin.post(f"{API}/admin/conversion/{e['id']}/approval", json={"status": "draft"}, timeout=20)
    r = requests.post(f"{API}/cron/masterclass-conversion",
                      headers={"X-Cron-Secret": CRON_SECRET}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["sent"] == 0 and d.get("approved_emails", 0) == 0


def test_segments_endpoint(admin):
    r = admin.get(f"{API}/admin/conversion/segments", timeout=30)
    assert r.status_code == 200
    segs = r.json()["segments"]
    assert len(segs) == 8
    for v in segs.values():
        assert "label" in v and "count" in v
