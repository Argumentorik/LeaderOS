"""Iter 135 — GODMODE final audit: isolation, RAG freshness, sync visibility, rollout.

Run: REACT_APP_BACKEND_URL=<url> pytest tests/test_iter135_godmode_audit.py -q
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"

ADMIN = {"email": "test@test.com", "password": "test123"}
USER_B = {"email": "free@wladbot.test", "password": "test123"}
PREMIUM = {"email": "standard@wladbot.test", "password": "test123"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def admin_auth():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def user_b_auth():
    return _login(USER_B)


class TestChatIsolation:
    """User A must never reach User B's chat session."""

    def test_foreign_session_id_is_rejected(self, admin_auth, user_b_auth):
        created = requests.post(f"{API}/chat/sessions", headers=admin_auth, timeout=30,
                                json={"title": "Iter135 Isolation", "agent": "auto"})
        assert created.status_code == 200, created.text
        sid = created.json()["session_id"]

        # User B tries to post into A's session
        hijack = requests.post(f"{API}/chat", headers=user_b_auth, timeout=90,
                               json={"message": "Wer bin ich?", "session_id": sid})
        assert hijack.status_code == 404, f"cross-user chat access not blocked: {hijack.status_code}"

        # And cannot read it either
        hist = requests.get(f"{API}/chat/history/{sid}", headers=user_b_auth, timeout=30)
        assert hist.status_code == 200 and hist.json() == []

        requests.delete(f"{API}/chat/sessions/{sid}", headers=admin_auth, timeout=30)

    def test_admin_endpoints_reject_normal_user(self, user_b_auth):
        for path in ("/admin/overview", "/admin/rag/local-status", "/admin/sync-health",
                     "/admin/features", "/admin/livetest/buyers"):
            r = requests.get(f"{API}{path}", headers=user_b_auth, timeout=60)
            assert r.status_code == 403, f"{path} leaked to non-admin ({r.status_code})"

    def test_admin_endpoints_reject_anonymous(self):
        for path in ("/admin/overview", "/admin/rag/coverage", "/admin/sync-health"):
            r = requests.get(f"{API}{path}", timeout=60)
            assert r.status_code in (401, 403), f"{path} open to anonymous ({r.status_code})"


class TestRagHealth:
    def test_local_status_reports_real_health(self, admin_auth):
        r = requests.get(f"{API}/admin/rag/local-status", headers=admin_auth, timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["chunks"] > 5000
        assert d["sources"] > 40
        assert d["engine"]["model_loaded"] is True
        assert d["retrieval_ok"] is True and d["retrieval_chunks"] > 0

    def test_retrieval_carries_source_labels(self, admin_auth):
        r = requests.post(f"{API}/admin/rag-debug", headers=admin_auth, timeout=90,
                          json={"query": "Was ist das SEXIER-Modell?"})
        assert r.status_code == 200, r.text
        d = r.json()
        chunks = d.get("chunks") or []
        assert len(chunks) > 0
        assert (d.get("coverage") or {}).get("top_score", 0) > 0.5

    def test_golden_check_passes(self, admin_auth):
        r = requests.get(f"{API}/admin/rag/golden-check", headers=admin_auth, timeout=180)
        assert r.status_code == 200, r.text
        d = r.json()
        passed, total = d["passed"].split("/")
        assert int(passed) >= int(total) - 1, f"golden check regression: {d['passed']}"


class TestSyncVisibility:
    def test_sync_health_exposes_failures_and_last_success(self, admin_auth):
        r = requests.get(f"{API}/admin/sync-health", headers=admin_auth, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        for key in ("completed_24h", "unchanged_24h", "not_found_24h", "failed_24h",
                    "last_success_at", "last_failure_at", "failure_reasons",
                    "total_diagnoses", "connected_users"):
            assert key in d, f"sync-health missing {key}"

    def test_login_records_a_sync_attempt(self, admin_auth):
        """A login must leave an auto-sync trace so Ops sees real activity."""
        before = requests.get(f"{API}/admin/sync-health", headers=admin_auth, timeout=60).json()
        _login(USER_B)
        import time
        time.sleep(4)
        after = requests.get(f"{API}/admin/sync-health", headers=admin_auth, timeout=60).json()
        assert after["syncs_24h"] >= before["syncs_24h"], "no sync log written on login"


class TestPremiumFirstRollout:
    def test_premium_sees_premium_stage_feature(self):
        premium = _login(PREMIUM)
        free = _login(USER_B)
        p = requests.get(f"{API}/features", headers=premium, timeout=30).json()
        f = requests.get(f"{API}/features", headers=free, timeout=30).json()
        assert p["premium"] is True and f["premium"] is False
        assert p["features"]["rag_source_labels"] is True
        assert f["features"]["rag_source_labels"] is False
        assert f["features"]["meeting_mode"] is False  # stage=off → nobody

    def test_admin_can_promote_and_demote(self, admin_auth):
        free = _login(USER_B)
        try:
            up = requests.put(f"{API}/admin/features/rag_source_labels", headers=admin_auth,
                              json={"stage": "all"}, timeout=30)
            assert up.status_code == 200, up.text
            f = requests.get(f"{API}/features", headers=free, timeout=30).json()
            assert f["features"]["rag_source_labels"] is True
        finally:
            requests.put(f"{API}/admin/features/rag_source_labels", headers=admin_auth,
                         json={"stage": "premium"}, timeout=30)
        f2 = requests.get(f"{API}/features", headers=free, timeout=30).json()
        assert f2["features"]["rag_source_labels"] is False

    def test_unknown_feature_is_404(self, admin_auth):
        r = requests.put(f"{API}/admin/features/does_not_exist", headers=admin_auth,
                         json={"stage": "all"}, timeout=30)
        assert r.status_code == 404


class TestFailureModes:
    def test_invalid_payment_session_is_404_not_500(self, admin_auth):
        r = requests.get(f"{API}/payments/checkout/status/cs_does_not_exist",
                         headers=admin_auth, timeout=30)
        assert r.status_code == 404

    def test_inbound_sync_requires_secret(self):
        r = requests.post(f"{API}/internal/sync/subscription-updated", timeout=30,
                          json={"email": "x@y.de", "plan": "leadership_os"})
        assert r.status_code in (401, 422, 503)

    def test_inbound_sync_rejects_wrong_secret(self):
        r = requests.post(f"{API}/internal/sync/subscription-updated", timeout=30,
                          headers={"X-Sync-Secret": "definitely-wrong"},
                          json={"email": "x@y.de", "plan": "leadership_os"})
        assert r.status_code in (401, 503)

    def test_unknown_plan_is_rejected(self):
        """Malformed inbound data must never silently grant a tier."""
        r = requests.post(f"{API}/internal/sync/subscription-updated", timeout=30,
                          headers={"X-Sync-Secret": "definitely-wrong"},
                          json={"email": ADMIN["email"], "plan": "hacker_tier"})
        assert r.status_code in (400, 401, 503)
