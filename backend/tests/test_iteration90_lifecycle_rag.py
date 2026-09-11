"""Iteration 90 — P0 Resend Email Sprint + P1 RAG Cleanup tests.

Covers:
  - GET  /api/lifecycle/status          (public health)
  - POST /api/cron/trial-reminders      (no auth — CRON_SHARED_SECRET unset)
  - POST /api/cron/drip-sequence        (idempotent via email_log)
  - POST /api/auth/register             (welcome email fired → email_log row)
  - POST /api/admin/rag-enrich-metadata (admin)
  - GET  /api/admin/rag-corpus-stats    (admin; no 'unknown' courses)
  - GET  /api/admin/learning-videos     (admin; 10 videos)
  - PUT  /api/admin/learning-videos/v1  (admin; vimeo_id update + reset)
  - GET  /api/my-path/videos            (has_video + ready_count)
  - POST /api/admin/rag-debug           (no 'unknown' in coverage.courses)
"""
import os
import secrets
import string
import time
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not set"

ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "test@test.com")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "test123")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


# --------- Fixtures ---------
@pytest.fixture(scope="session")
def mongo_db():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    tok = r.json().get("token")
    assert tok, "No token in login response"
    return tok


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


def _rand(n=8):
    return "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(n))


# --------- Lifecycle status ---------
class TestLifecycleStatus:
    def test_lifecycle_status(self):
        r = requests.get(f"{BASE_URL}/api/lifecycle/status", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("email_enabled") is True
        assert data.get("trial_reminder_days_before") == [3]
        assert data.get("drip_stages_days") == [1, 3, 7]


# --------- Cron endpoints (no auth) ---------
class TestCronEndpoints:
    def test_trial_reminders_no_auth(self):
        r = requests.post(f"{BASE_URL}/api/cron/trial-reminders", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data.get("sent"), int)
        assert isinstance(data.get("scanned"), int)
        assert data["sent"] >= 0
        assert data["scanned"] >= 0

    def test_drip_sequence_returns_by_stage(self):
        r = requests.post(f"{BASE_URL}/api/cron/drip-sequence", timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data.get("sent"), int)
        assert isinstance(data.get("scanned"), int)
        assert isinstance(data.get("by_stage"), dict)

    def test_drip_sequence_idempotent(self):
        """Second call must NOT re-send (email_log dedup)."""
        r1 = requests.post(f"{BASE_URL}/api/cron/drip-sequence", timeout=60)
        assert r1.status_code == 200
        first_sent = r1.json()["sent"]
        # tiny pause to ensure first writes flushed
        time.sleep(2)
        r2 = requests.post(f"{BASE_URL}/api/cron/drip-sequence", timeout=60)
        assert r2.status_code == 200
        second_sent = r2.json()["sent"]
        # Second pass must send 0 (everything already in email_log)
        assert second_sent == 0, (
            f"Drip not idempotent — first={first_sent}, second={second_sent}"
        )


# --------- Register fires welcome email ---------
class TestRegisterWelcomeEmail:
    def test_register_fires_signup_welcome(self, mongo_db):
        email = f"e2e_lifecycle_{_rand(10)}@test.com"
        password = f"TestPass{_rand(8)}!"
        payload = {"email": email, "password": password, "name": "E2E Lifecycle"}
        r = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=30)
        if r.status_code == 429:
            pytest.skip("Rate limited on register — skipping welcome email check")
        assert r.status_code in (200, 201), r.text
        user = r.json().get("user") or {}
        user_id = user.get("user_id") or user.get("id")
        assert user_id, f"No user_id in register response: {r.text[:300]}"

        # Welcome email is fired async — poll up to ~10s
        # NOTE: routes/auth.py:_send_signup_welcome logs by 'user_email' field
        log_row = None
        for _ in range(20):
            log_row = mongo_db.email_log.find_one(
                {"user_email": email, "type": "signup_welcome"}
            )
            if log_row:
                break
            time.sleep(0.5)
        assert log_row is not None, (
            f"No signup_welcome row in email_log for email={email}"
        )
        # Sanity: ensure send succeeded (no resend error)
        assert log_row.get("sent") is True or log_row.get("email_id"), (
            f"signup_welcome row exists but send failed: {log_row}"
        )


# --------- Admin RAG endpoints ---------
class TestAdminRag:
    def test_rag_enrich_metadata_dry_run(self, admin_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/rag-enrich-metadata",
            headers=admin_headers,
            json={"dry_run": True, "limit": 2000},
            timeout=120,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("enriched_total", -1) >= 0
        # total_scanned should be 609 per task brief; tolerate ±5 for drift
        ts = data.get("total_scanned")
        assert ts is not None, "missing total_scanned"
        assert ts == 609, f"Expected total_scanned=609, got {ts}"
        assert not data.get("errors"), f"errors present: {data.get('errors')}"

    def test_rag_corpus_stats_no_unknown(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/rag-corpus-stats",
            headers=admin_headers,
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("total_chunks") == 609, f"got {data.get('total_chunks')}"
        courses = data.get("courses") or {}
        assert "unknown" not in courses, (
            f"'unknown' key still present in courses: {list(courses.keys())[:10]}"
        )
        unique_courses = data.get("unique_courses")
        assert unique_courses is not None
        assert unique_courses <= 19, f"unique_courses={unique_courses} >19"

    def test_rag_debug_no_unknown_in_coverage(self, admin_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/rag-debug",
            headers=admin_headers,
            json={
                "query": "Wie führe ich ein schwieriges Konfliktgespräch?",
                "match_count": 5,
            },
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        hits = data.get("hits") or data.get("chunks") or []
        coverage = data.get("coverage") or {}
        cov_courses = coverage.get("courses") or {}
        if len(hits) >= 5:
            assert "unknown" not in cov_courses, (
                f"'unknown' present in coverage.courses: {list(cov_courses.keys())}"
            )


# --------- Admin Learning Videos ---------
class TestLearningVideosAdmin:
    def test_list_learning_videos(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/learning-videos",
            headers=admin_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        videos = data.get("videos") or data.get("items") or data
        if isinstance(data, dict) and "total" in data:
            assert data["total"] == 10, f"total={data['total']}"
        assert isinstance(videos, list), f"videos not list: {type(videos)}"
        assert len(videos) == 10, f"expected 10 videos, got {len(videos)}"
        ids = {v.get("id") for v in videos}
        expected = {f"v{i}" for i in range(1, 11)}
        assert expected.issubset(ids), f"missing ids: {expected - ids}"

    def test_update_and_reset_vimeo_id(self, admin_headers):
        # Set vimeo_id
        r1 = requests.put(
            f"{BASE_URL}/api/admin/learning-videos/v1",
            headers=admin_headers,
            json={"vimeo_id": "987654321"},
            timeout=20,
        )
        assert r1.status_code == 200, r1.text

        # Verify update by listing
        r2 = requests.get(
            f"{BASE_URL}/api/admin/learning-videos",
            headers=admin_headers,
            timeout=20,
        )
        assert r2.status_code == 200
        body = r2.json()
        videos = body.get("videos") if isinstance(body, dict) else body
        v1 = next((v for v in videos if v.get("id") == "v1"), None)
        assert v1 is not None
        assert str(v1.get("vimeo_id")) == "987654321", (
            f"vimeo_id not persisted: {v1}"
        )

        # Reset
        r3 = requests.put(
            f"{BASE_URL}/api/admin/learning-videos/v1",
            headers=admin_headers,
            json={"vimeo_id": ""},
            timeout=20,
        )
        assert r3.status_code == 200, r3.text

        r4 = requests.get(
            f"{BASE_URL}/api/admin/learning-videos",
            headers=admin_headers,
            timeout=20,
        )
        body4 = r4.json()
        videos4 = body4.get("videos") if isinstance(body4, dict) else body4
        v1_after = next((v for v in videos4 if v.get("id") == "v1"), None)
        assert v1_after is not None
        vid_after = v1_after.get("vimeo_id")
        assert vid_after in (None, "", 0), f"vimeo_id not reset: {vid_after!r}"


# --------- My-Path videos ---------
class TestMyPathVideos:
    def test_videos_has_video_and_ready_count(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/my-path/videos",
            headers=admin_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "ready_count" in data, f"missing ready_count: keys={list(data.keys())}"
        assert isinstance(data["ready_count"], int)
        # Response splits by tier
        videos = (data.get("starter_videos") or []) + (data.get("accelerator_videos") or [])
        assert len(videos) > 0, f"no videos returned: {data}"
        for v in videos:
            assert "has_video" in v, f"video missing has_video: {v}"
            assert isinstance(v["has_video"], bool)
        # ready_count must match number of has_video=True
        manual = sum(1 for v in videos if v["has_video"])
        assert manual == data["ready_count"], (
            f"ready_count mismatch — manual={manual}, reported={data['ready_count']}"
        )
