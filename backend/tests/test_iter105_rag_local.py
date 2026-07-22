"""Iter 105 — Local RAG (fastembed) regression tests.
Tests migration from Voyage AI to local sentence-transformers MiniLM-L12-v2.
"""
import os
import sys
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://command-center-229.preview.emergentagent.com").rstrip("/")

# Iter 121.3 (Code Review): env-driven creds from conftest — no hardcoded pw
sys.path.insert(0, os.path.dirname(__file__))
from conftest import TEST_EMAIL as ADMIN_EMAIL, TEST_PASSWORD as ADMIN_PASSWORD  # noqa: E402

EXPECTED_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text[:200]}"
    tok = r.json().get("token") or r.json().get("access_token")
    assert tok, f"No token in response: {r.json()}"
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- Regression / Health ----------
def test_health():
    r = requests.get(f"{BASE_URL}/api/health", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "ok" or body.get("ok") is True or "ok" in str(body).lower()


def test_admin_login_works(admin_token):
    assert isinstance(admin_token, str) and len(admin_token) > 10


# ---------- Public RAG status ----------
def test_rag_status_local_provider():
    r = requests.get(f"{BASE_URL}/api/rag-status", timeout=15)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    assert data.get("provider") == "local", f"Expected provider=local, got {data}"
    assert data.get("model") == EXPECTED_MODEL, f"Expected model={EXPECTED_MODEL}, got {data.get('model')}"
    assert data.get("dim") == 384, f"Expected dim=384, got {data.get('dim')}"
    assert data.get("model_loaded") is True, f"model_loaded not true: {data}"
    # threshold may be float; accept 0.4
    threshold = data.get("match_threshold")
    assert threshold is not None and float(threshold) == pytest.approx(0.4, abs=1e-3), f"match_threshold={threshold}"


# ---------- Admin RAG endpoints ----------
def test_admin_rag_local_status(admin_headers):
    r = requests.get(f"{BASE_URL}/api/admin/rag/local-status", headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    assert data.get("chunks") >= 7439, f"Expected chunks>=7439 (baseline corpus), got {data.get('chunks')}: {data}"


def test_admin_rag_golden_check(admin_headers):
    r = requests.get(f"{BASE_URL}/api/admin/rag/golden-check", headers=admin_headers, timeout=120)
    assert r.status_code == 200, r.text[:400]
    data = r.json()
    assert data.get("status") == "PASS", f"golden-check status not PASS: {data}"
    # Expect 7/7 passing
    passed = data.get("passed") or data.get("pass_count") or data.get("summary", {}).get("passed")
    total = data.get("total") or data.get("summary", {}).get("total")
    if passed is not None and total is not None:
        assert passed == total == 7, f"Expected 7/7 pass, got {passed}/{total}: {data}"


def test_admin_rag_debug_sexier(admin_headers):
    payload = {"query": "Was ist das SEXIER Modell?", "match_count": 5}
    r = requests.post(f"{BASE_URL}/api/admin/rag-debug", headers=admin_headers, json=payload, timeout=60)
    assert r.status_code == 200, r.text[:400]
    data = r.json()
    # model field
    model = data.get("model") or data.get("embedding_model")
    assert model == EXPECTED_MODEL, f"Expected model={EXPECTED_MODEL} in debug, got {model}: keys={list(data.keys())}"
    chunks = data.get("chunks") or data.get("results") or data.get("matches") or []
    assert len(chunks) == 5, f"Expected 5 chunks, got {len(chunks)}: {data}"
    # similarity scores
    scores = []
    for c in chunks:
        s = c.get("similarity") if isinstance(c, dict) else None
        if s is None and isinstance(c, dict):
            s = c.get("score") or c.get("similarity_score")
        if s is not None:
            scores.append(float(s))
    assert scores, f"No similarity scores found in chunks: {chunks[0] if chunks else {}}"
    assert all(s > 0.5 for s in scores), f"Not all similarities > 0.5: {scores}"


def test_admin_rag_corpus_stats(admin_headers):
    r = requests.get(f"{BASE_URL}/api/admin/rag-corpus-stats", headers=admin_headers, timeout=60)
    assert r.status_code == 200, r.text[:400]
    data = r.json()
    total = data.get("total_chunks") or data.get("total") or data.get("chunks")
    assert total >= 7439, f"Expected total_chunks>=7439 (baseline corpus), got {total}: keys={list(data.keys())}"
    # course breakdown
    breakdown = data.get("courses") or data.get("by_course") or data.get("course_breakdown") or data.get("breakdown")
    assert breakdown, f"No course breakdown in stats: {data}"


# ---------- Chat E2E (RAG grounded) ----------
@pytest.fixture(scope="module")
def chat_session(admin_headers):
    payload = {"message": "Was sind die 30 Schlagfertigkeitstechniken von Wlad?"}
    r = requests.post(f"{BASE_URL}/api/chat", headers=admin_headers, json=payload, timeout=120)
    assert r.status_code == 200, f"Chat failed: {r.status_code} {r.text[:400]}"
    data = r.json()
    return data


def test_chat_grounded_schlagfertigkeit(chat_session):
    data = chat_session
    resp = data.get("response") or {}
    text = resp.get("text") if isinstance(resp, dict) else None
    assert isinstance(text, str) and len(text) > 50, f"Response text missing/short: {text!r} full={data}"
    # Grounded content mentions Schlagfertigkeit
    assert "schlagfertigkeit" in text.lower() or "schlagfertig" in text.lower(), f"Not grounded in Schlagfertigkeit: {text[:300]}"


def test_chat_multi_turn(chat_session, admin_headers):
    session_id = chat_session.get("session_id")
    assert session_id, f"No session_id in first response: {chat_session}"
    payload = {"message": "Nenne mir die ersten drei davon konkret.", "session_id": session_id}
    r = requests.post(f"{BASE_URL}/api/chat", headers=admin_headers, json=payload, timeout=120)
    assert r.status_code == 200, r.text[:400]
    data = r.json()
    assert data.get("session_id") == session_id, f"session_id mismatch: {data.get('session_id')} vs {session_id}"
    resp = data.get("response") or {}
    text = resp.get("text") if isinstance(resp, dict) else None
    assert isinstance(text, str) and len(text) > 30, f"Second turn short/missing: {text!r}"


# ---------- Reingest endpoint existence (do NOT trigger) ----------
def test_reingest_endpoint_exists_via_options(admin_headers):
    """Do NOT trigger reingest (20+ min). Only verify local-status already covered corpus size.
    We just probe that the route responds to POST (either 409 if running or 200 started).
    Given the risk of restarting a running job, we skip actually POSTing per test spec.
    """
    # Verify by inspecting API schema via HEAD/GET on /api/openapi.json if available
    r = requests.get(f"{BASE_URL}/api/openapi.json", timeout=15)
    if r.status_code == 200:
        paths = r.json().get("paths", {})
        assert "/api/admin/rag/reingest" in paths, f"reingest path not in openapi: {list(paths.keys())[:20]}"
    else:
        pytest.skip(f"openapi not available ({r.status_code}); reingest not actively probed per instructions")
