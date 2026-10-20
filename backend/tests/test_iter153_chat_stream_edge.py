"""Iter 153 edge cases for /api/chat/stream — kein LLM-Aufruf (nur Validierung/Auth/Persistenz)."""
import os

import requests

API = os.environ.get("API_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]


def _session(email="accelerator@wladbot.test"):
    s = requests.Session()
    r = s.post(f"{API}/api/auth/login", json={"email": email, "password": "test123"}, timeout=30)
    assert r.status_code == 200, r.text
    return s


# --- Validierung / Auth ---
def test_stream_missing_message_is_422():
    s = _session()
    r = s.post(f"{API}/api/chat/stream", json={"mode": "chat"}, timeout=30)
    assert r.status_code == 422, r.text
    assert "detail" in r.json()


def test_history_requires_auth():
    r = requests.get(f"{API}/api/chat/history/does-not-exist", timeout=30)
    assert r.status_code == 401


# --- Persistenz / Serialisierung ---
def test_history_has_no_mongo_id_and_is_scoped():
    s = _session()
    sessions = s.get(f"{API}/api/chat/sessions", timeout=30)
    assert sessions.status_code == 200
    data = sessions.json()
    assert isinstance(data, list) and data, "keine Chat-Sessions vorhanden"
    sid = data[0]["session_id"]
    hist = s.get(f"{API}/api/chat/history/{sid}", timeout=30)
    assert hist.status_code == 200
    msgs = hist.json()
    assert isinstance(msgs, list) and msgs
    assert all("_id" not in m for m in msgs), "MongoDB _id wird ausgeliefert"
    assert {"role", "content"} <= set(msgs[0].keys())
    # Streaming-Antwort wurde als Assistant-Nachricht persistiert
    assert any(m["role"] == "assistant" and m.get("content") for m in msgs)


def test_history_of_other_users_session_is_empty():
    a = _session("accelerator@wladbot.test")
    sid = a.get(f"{API}/api/chat/sessions", timeout=30).json()[0]["session_id"]
    f = _session("free@wladbot.test")
    r = f.get(f"{API}/api/chat/history/{sid}", timeout=30)
    assert r.status_code == 200
    assert r.json() == [], "Fremde Session darf nicht lesbar sein"
