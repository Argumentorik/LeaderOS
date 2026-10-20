"""Iter 184 — Kundenmeldung: „komische Abkürzungen" (\\n, \\u201e) in WladBot-Antworten.

Der Weg der Kundin: Frage stellen → im Gespräch nachfragen („vertiefe das") →
in der Antwort standen Rohzeichen mitten in den nummerierten Schritten.

Geprüft wird: das zentrale Entpacken, der Chat-Parser, der Sprach-Modus und
der echte Gesprächsverlauf über die API (Nachfrage inklusive).
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE}/api"

RAW_MARKERS = ("\\n", "\\u201e", "\\u201c", '\\"', "\\t")


def _assert_clean(text: str, where: str) -> None:
    for marker in RAW_MARKERS:
        assert marker not in text, f"Rohzeichen {marker!r} in {where}: {text[:400]!r}"


# ── 1. Zentrales Entpacken ──────────────────────────────────────────────────

def test_unescape_text_basics() -> None:
    from services_text_clean import unescape_text

    assert unescape_text("Zeile1\\nZeile2") == "Zeile1\nZeile2"
    assert unescape_text("\\u201eZitat\\u201c") == "„Zitat“"
    assert unescape_text('Er sagte \\"Hallo\\"') == 'Er sagte "Hallo"'
    assert unescape_text("C:\\\\Pfad") == "C:\\Pfad"
    assert unescape_text("ohne Escapes") == "ohne Escapes"
    assert unescape_text(None) is None


def test_deep_unescape_nested() -> None:
    from services_text_clean import deep_unescape

    out = deep_unescape({
        "insight": "A\\nB",
        "action_steps": ["1. Erst\\nDann", "2. \\u201eKlar\\u201c"],
        "tasks": [{"title": "T\\nX", "priority": "high"}],
        "count": 3,
    })
    assert out["insight"] == "A\nB"
    assert out["action_steps"][1] == "2. „Klar“"
    assert out["tasks"][0]["title"] == "T\nX"
    assert out["count"] == 3


def test_parse_ai_json_handles_double_encoded() -> None:
    from services_ai_parse import parse_ai_json

    payload = {"insight": "Schritt 1\nSchritt 2 „Zitat“", "action_steps": ["Erstens\nnoch was"]}
    double = json.dumps(json.dumps(payload, ensure_ascii=False), ensure_ascii=False)
    parsed = parse_ai_json(double)
    assert parsed == payload

    # Variante: escaped Klammern ohne gültigen JSON-String
    parsed2 = parse_ai_json('{\\"insight\\": \\"A\\\\nB \\u201eX\\u201c\\"}')
    assert parsed2 == {"insight": "A\nB „X“"}


def test_chat_reply_parser_is_clean() -> None:
    from routes.chat import _parse_chat_reply

    double = json.dumps(json.dumps({"insight": "A\nB", "strategy": ""}, ensure_ascii=False), ensure_ascii=False)
    structured = _parse_chat_reply(double, True, None)
    _assert_clean(structured["insight"], "structured insight")

    plain = _parse_chat_reply(json.dumps("Punkt 1\nPunkt 2 „Zitat“", ensure_ascii=False), False, None)
    _assert_clean(plain["text"], "plain text")
    assert "\n" in plain["text"]


def test_voice_reply_never_speaks_raw_escapes() -> None:
    from routes.voice_tts import _cap_reply_length

    out = _cap_reply_length("Erstens\\nZweitens \\u201eKlar\\u201c")
    _assert_clean(out, "voice reply")
    assert "„Klar“" in out


# ── 2. Echter Kundenweg über die API ────────────────────────────────────────

@pytest.fixture(scope="module")
def client() -> httpx.Client:
    if not BASE:
        pytest.skip("REACT_APP_BACKEND_URL fehlt")
    c = httpx.Client(timeout=240.0)
    r = c.post(f"{API}/auth/login", json={"identifier": "test@test.com", "password": "test123"})
    assert r.status_code == 200, r.text
    yield c
    c.close()


def _collect_text(parsed: dict) -> str:
    parts = [parsed.get("text") or "", parsed.get("insight") or "", parsed.get("strategy") or "",
             parsed.get("reflection") or ""]
    parts += [str(s) for s in (parsed.get("action_steps") or [])]
    parts += [f"{t.get('title', '')} {t.get('description', '')}" for t in (parsed.get("tasks") or []) if isinstance(t, dict)]
    parts += [str(q) for q in (parsed.get("follow_up_questions") or [])]
    return "\n".join(parts)


def test_followup_conversation_has_no_raw_escapes(client: httpx.Client) -> None:
    """Genau der Weg der Kundin: Frage → Nachfrage mit Details → Schritte."""
    first = client.post(f"{API}/chat", json={
        "message": "Gib mir einen Plan in 3 nummerierten Schritten für ein schwieriges "
                   "Gespräch mit meinem Teamlead. Nutze Anführungszeichen für Beispielsätze.",
        "agent": "auto",
    })
    assert first.status_code == 200, first.text
    data = first.json()
    session_id = data["session_id"]
    _assert_clean(_collect_text(data["response"]), "erste Antwort")

    second = client.post(f"{API}/chat", json={
        "message": "Vertiefe das bitte. Details: Er unterbricht mich in Meetings, "
                   "es geht um Budget, und ich habe nur 15 Minuten. Nummerierte Schritte bitte.",
        "session_id": session_id,
        "agent": "auto",
    })
    assert second.status_code == 200, second.text
    _assert_clean(_collect_text(second.json()["response"]), "Nachfrage-Antwort")

    history = client.get(f"{API}/chat/history/{session_id}")
    assert history.status_code == 200
    for msg in history.json():
        if msg.get("role") != "assistant":
            continue
        # `content` ist bewusst JSON-kodiert — geprüft wird der entpackte Text.
        parsed = msg.get("parsed") or json.loads(msg.get("content") or "{}")
        _assert_clean(_collect_text(parsed), f"Verlauf {msg.get('message_id')}")
