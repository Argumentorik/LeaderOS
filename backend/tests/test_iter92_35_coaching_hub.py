"""Iter 92.35 — Backend regression for Coaching Hub redesign + RAG Manual Chunk.

Covers:
- /api/health
- /api/auth/login (admin + tier accounts)
- /api/wladhub/3layer (banner preflight)
- /api/wladhub/sync (banner action)
- /api/payments/checkout for Tier 1 (Leadership OS €997)
- Direct RAG manual-chunk match for "10 Stufen des Zuhörens"
- /api/chat injects manual chunk in response
"""
import os
import re
import sys
import asyncio
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

# Ensure /app is importable so we can call services_rag directly
sys.path.insert(0, "/app")


# ─────────────────────────  fixtures  ─────────────────────────
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(session, email, password="test123"):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text[:200]}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_token(session):
    return _login(session, "test@test.com")


@pytest.fixture(scope="module")
def free_token(session):
    return _login(session, "free@wladbot.test")


@pytest.fixture(scope="module")
def accel_token(session):
    return _login(session, "accelerator@wladbot.test")


# ─────────────────────────  health & auth  ─────────────────────────
class TestHealthAndAuth:
    def test_health(self, session):
        r = session.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_admin_login(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 50

    def test_invalid_login(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login",
                         json={"email": "test@test.com", "password": "wrong"}, timeout=10)
        assert r.status_code in (400, 401, 403)


# ─────────────────────────  WladHub banner endpoints  ─────────────────────────
class TestWladHubSync:
    def test_3layer_admin_has_sync(self, session, admin_token):
        r = session.get(f"{BASE_URL}/api/wladhub/3layer",
                        headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        # admin user expected synced — banner should NOT show
        assert "connected" in d and "last_sync" in d

    def test_3layer_free_no_sync(self, session, free_token):
        """free@wladbot.test should have last_sync=null → banner SHOWS."""
        r = session.get(f"{BASE_URL}/api/wladhub/3layer",
                        headers={"Authorization": f"Bearer {free_token}"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("last_sync") in (None, "")  # banner condition

    def test_sync_post(self, session, admin_token):
        r = session.post(f"{BASE_URL}/api/wladhub/sync",
                         json={"sync_scores": True, "sync_action_plan": True},
                         headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "status" in d
        assert d["status"] in ("synced", "no_data", "local_data", "already_synced")


# ─────────────────────────  Stripe Tier 1 still works  ─────────────────────────
class TestStripeCheckoutTier1:
    def test_leadership_os_checkout(self, session, free_token):
        r = session.post(
            f"{BASE_URL}/api/payments/checkout",
            json={"package_id": "leadership_os", "origin_url": "https://example.com"},
            headers={"Authorization": f"Bearer {free_token}"}, timeout=20,
        )
        assert r.status_code == 200, f"checkout failed: {r.status_code} {r.text[:300]}"
        d = r.json()
        assert "url" in d and d["url"].startswith("http")


# ─────────────────────────  RAG Manual Chunk  ─────────────────────────
class TestRAGManualChunk:
    def test_match_manual_chunks_direct(self):
        from backend.services_rag import _match_manual_chunks
        assert len(_match_manual_chunks("zuhören")) == 1
        assert len(_match_manual_chunks("Was sind die 10 Stufen des Zuhörens nach Wlad?")) == 1
        assert len(_match_manual_chunks("listening stages")) == 1
        assert len(_match_manual_chunks("random unrelated question about budget")) == 0

    def test_retrieve_context_includes_manual(self):
        from backend.services_rag import retrieve_context
        result = asyncio.run(retrieve_context("Was sind die 10 Stufen des Zuhörens?"))
        # rag_active true and at least 1 chunk from manual
        assert result.get("rag_active") is True or result.get("chunks_count", 0) >= 1
        assert result.get("chunks_count", 0) >= 1

    def test_chat_includes_10_stufen(self, session, accel_token):
        r = session.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Was sind die 10 Stufen des Zuhörens nach Wlad?",
                  "conversation_id": "rag-test-iter9235"},
            headers={"Authorization": f"Bearer {accel_token}"}, timeout=90,
        )
        assert r.status_code == 200, r.text[:300]
        body = r.json()
        # rag should be active
        rag = body.get("rag", {})
        assert rag.get("active") is True
        # response can be string or dict (structured agent)
        resp = body.get("response", "")
        if isinstance(resp, dict):
            resp = " ".join(str(v) for v in resp.values() if isinstance(v, (str, list)))
        # Count Stufe mentions: should mention multiple stages
        stufe_count = len(re.findall(r"Stufe\s*\d", resp, re.IGNORECASE))
        assert stufe_count >= 5, f"expected >=5 Stufe mentions, got {stufe_count}"
