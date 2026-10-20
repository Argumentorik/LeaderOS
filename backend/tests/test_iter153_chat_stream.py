"""Iter 153: /api/chat/stream — Server-Sent-Events Wort für Wort (1 kleiner LLM-Aufruf pro Test)."""
import json
import os
import sys
import time

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

API = os.environ.get("API_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]


def _session():
    s = requests.Session()
    r = s.post(f"{API}/api/auth/login", json={"email": "accelerator@wladbot.test", "password": "test123"}, timeout=30)
    assert r.status_code == 200, r.text
    return s


def _events(resp):
    buf = ""
    for chunk in resp.iter_content(chunk_size=None, decode_unicode=True):
        buf += chunk
        while "\n\n" in buf:
            frame, buf = buf.split("\n\n", 1)
            for line in frame.split("\n"):
                if line.startswith("data:"):
                    yield json.loads(line[5:].strip()), time.time()


def test_stream_delivers_deltas_then_done():
    s = _session()
    t0 = time.time()
    with s.post(f"{API}/api/chat/stream", json={"message": "Nenne mir zwei kurze Tipps fürs Delegieren.", "mode": "chat"},
                stream=True, timeout=120) as r:
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("text/event-stream")
        events = list(_events(r))
    types = [e["type"] for e, _ in events]
    assert types[0] == "start" and types[-1] == "done"
    deltas = [e["text"] for e, _ in events if e["type"] == "delta"]
    assert len(deltas) >= 5, "Antwort kam nicht in mehreren Stücken"
    first_delta_at = next(t for e, t in events if e["type"] == "delta") - t0
    done_at = events[-1][1] - t0
    assert first_delta_at < done_at - 0.3, "erste Wörter müssen deutlich vor dem Ende ankommen"
    done = events[-1][0]
    streamed = "".join(deltas)
    assert "###WEITER###" not in streamed
    assert done["response"]["text"].startswith(streamed.strip()[:40])
    assert done["session_id"] and done["message_id"]
    # persistiert wie beim klassischen /chat
    hist = s.get(f"{API}/api/chat/history/{done['session_id']}", timeout=30).json()
    msgs = hist if isinstance(hist, list) else hist.get("messages", [])
    assert any(m.get("role") == "assistant" for m in msgs)


def test_stream_requires_auth():
    r = requests.post(f"{API}/api/chat/stream", json={"message": "hi"}, timeout=30)
    assert r.status_code == 401


def test_safe_visible_len_holds_back_partial_marker():
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")
    from routes.chat import _safe_visible_len

    assert _safe_visible_len("Hallo Welt") == len("Hallo Welt")
    assert _safe_visible_len("Hallo Welt ##") == len("Hallo Welt ")
    assert _safe_visible_len("Hallo ###WEI") == len("Hallo ")
    assert _safe_visible_len("Hallo ###WEITER###[\"a\"]") == len("Hallo ")
    assert _safe_visible_len("Preis: 5 # Stück") == len("Preis: 5 # Stück")
