"""Iter 183 — Sprach-Modus so schlau wie der Text-Modus · Name „Wlad" · Thumbnails · Magic Link.

Der Fall aus den Fotos: Im Sprechen wurden E und X vertauscht und ein „Explore" erfunden.
Hier wird JEDE Wissensfrage in BEIDEN Modi gegen die verbindliche Definition geprüft.

Kosten: ein paar Cent für die LLM-Antworten (keine Videos, keine Stimmen).
"""
from __future__ import annotations

import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE}/api"


@pytest.fixture(scope="module")
def admin() -> httpx.Client:
    c = httpx.Client(timeout=240.0)
    r = c.post(f"{API}/auth/login", json={"identifier": "test@test.com", "password": "test123"})
    assert r.status_code == 200, r.text
    yield c
    c.close()


# ── 1. Verbindliches Kernwissen ─────────────────────────────────────────────

def test_canon_matches_and_block() -> None:
    from wlad_canon import canon_block, canon_matches

    assert [m["key"] for m in canon_matches("Bei Wlad gibt es ja das SEXIer Modell")] == ["sexier"]
    assert [m["key"] for m in canon_matches("Was ist das 3-B-Schema?")] == ["3b"]
    assert canon_matches("Wie motiviere ich mein Team heute?") == []

    block = canon_block("erklär mir sexier")
    assert "eXample" in block and "Explanation of Impact" in block
    assert "Explore" in block  # nur als ausdrückliches Verbot
    assert "VERBOTEN" in block
    assert canon_block("", always=("sexier",)).count("Rebuttal") >= 1


def test_brand_name_fix() -> None:
    from services_speech_text import fix_brand_names, to_plain_speech

    assert fix_brand_names("Bei VLAD gibt es das Modell") == "Bei Wlad gibt es das Modell"
    assert fix_brand_names("Vlad Bot und Wladimir") == "WladBot und Wlad"
    assert fix_brand_names("Frag Flat mal") == "Frag Wlad mal"
    assert fix_brand_names("leader os und leadercheck") == "Leader-OS und LeaderCheck"
    assert fix_brand_names("Wlad bleibt Wlad") == "Wlad bleibt Wlad"
    assert to_plain_speech("**S – Statement**\n- Punkt\n1. Eins") == "S – Statement Punkt Eins"


SEXIER_PAIRS = (
    ("Statement", "Behauptung"),
    ("Explanation", "Begründung"),
    ("eXample", "Beispiel"),
    ("Impact", "Relevanz"),
    ("Rebuttal", "Widerlegung"),
)


def _assert_sexier_is_canonical(answer: str, where: str) -> None:
    low = answer.lower()
    # Reihenfolge: Explanation MUSS vor Example stehen (der Fehler aus dem Foto)
    i_expl, i_example = low.find("explanation"), low.find("example")
    assert i_expl >= 0 and i_example >= 0, f"{where}: Elemente fehlen — {answer[:300]}"
    assert i_expl < i_example, f"{where}: E und X vertauscht — {answer[:400]}"
    assert "explanation of impact" in low, f"{where}: zweites E fehlt — {answer[:400]}"
    assert "rebuttal" in low, f"{where}: R fehlt — {answer[:400]}"
    for word in ("explore", "repeat", "implications"):
        assert word not in low, f"{where}: erfundenes Element „{word}\" — {answer[:400]}"
    assert "vlad" not in low, f"{where}: falscher Name — {answer[:200]}"


def test_voice_mode_sexier_is_canonical(admin: httpx.Client) -> None:
    """Sprach-Pfad (`_voice_llm_reply`) — getippter Text nutzt exakt dieselbe Kette."""
    r = admin.post(f"{API}/guide/interactive/turn",
                   data={"text": "Bei Vlad gibt es ja das SEXIer Modell. Erklär mir bitte jeden Buchstaben."})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "vlad" not in body["transcript"].lower(), body["transcript"]
    answer = body["response_text"]
    _assert_sexier_is_canonical(answer, "Sprach-Modus")
    assert "*" not in answer and "#" not in answer, f"Sprach-Antwort mit Markdown: {answer[:200]}"


def test_text_mode_sexier_is_canonical(admin: httpx.Client) -> None:
    r = admin.post(f"{API}/chat", json={
        "message": "Bei Vlad gibt es ja das SEXIer Modell. Erklär mir bitte jeden Buchstaben.",
    })
    assert r.status_code == 200, r.text
    answer = str(r.json()["response"])
    _assert_sexier_is_canonical(answer, "Text-Modus")


def test_voice_mode_3b_schema(admin: httpx.Client) -> None:
    r = admin.post(f"{API}/guide/interactive/turn",
                   data={"text": "Was ist das 3-B-Schema und wie hängt es mit SEXIER zusammen?"})
    assert r.status_code == 200, r.text
    low = r.json()["response_text"].lower()
    for word in ("behauptung", "begründung", "beispiel"):
        assert word in low, f"3-B unvollständig: {low[:300]}"


# ── 2. Vorschaubilder ───────────────────────────────────────────────────────

def test_posters_are_persisted(admin: httpx.Client) -> None:
    """Jedes Video mit Material hat ein dauerhaft gespeichertes Vorschaubild."""
    built = admin.post(f"{API}/media/posters/backfill")
    assert built.status_code == 200, built.text
    status = admin.get(f"{API}/media/posters")
    assert status.status_code == 200, status.text
    data = status.json()
    assert data["missing_count"] == 0, [c["slug"] for c in data["missing"]]
    assert data["ready_count"] >= 15


def test_poster_delivery_is_small_and_jpeg(admin: httpx.Client) -> None:
    clips = admin.get(f"{API}/guide/clips", params={"kind": "all", "lean": 1}).json()["clips"]
    posters = [c["poster_url"] for c in clips if c.get("poster_url")][:5]
    assert posters, "keine Vorschaubilder in der Liste"
    for url in posters:
        r = admin.get(f"{BASE}{url}")
        assert r.status_code == 200, f"{url} → {r.status_code}"
        assert r.headers["content-type"] == "image/jpeg", r.headers["content-type"]
        assert r.content[:2] == b"\xff\xd8", "kein gültiges JPEG"
        assert len(r.content) < 400_000, len(r.content)


def test_poster_survives_empty_disk_cache(admin: httpx.Client, loop) -> None:
    """Nach Neustart ist der Zwischenspeicher leer — das Bild muss trotzdem sofort kommen."""
    async def run() -> None:
        from routes.guide import _MEDIA_DIR
        import shutil
        shutil.rmtree(_MEDIA_DIR, ignore_errors=True)

    loop.run_until_complete(run())
    clips = admin.get(f"{API}/guide/clips", params={"kind": "all", "lean": 1}).json()["clips"]
    url = next(c["poster_url"] for c in clips if c.get("poster_url"))
    r = admin.get(f"{BASE}{url}", timeout=25.0)
    assert r.status_code == 200 and r.content[:2] == b"\xff\xd8"


# ── 3. Magic Link ───────────────────────────────────────────────────────────

def test_magic_link_request_is_always_generic() -> None:
    """Bekannte und unbekannte Adresse bekommen dieselbe Antwort (keine Konto-Auskunft)."""
    c = httpx.Client(timeout=60.0)
    try:
        first = c.post(f"{API}/auth/magic-link/request", json={"email": "gibtesnicht-183a@wladbot-testing.de"})
        second = c.post(f"{API}/auth/magic-link/request", json={"email": "gibtesnicht-183b@wladbot-testing.de"})
        if 429 in (first.status_code, second.status_code):
            pytest.skip("Magic-Link-Limit dieser IP erreicht (erwartetes Verhalten)")
        assert first.status_code == 200 and second.status_code == 200
        assert first.json()["message"] == second.json()["message"]
        assert "Falls die E-Mail" in first.json()["message"]
    finally:
        c.close()


def test_magic_link_full_flow(loop) -> None:
    """Anfordern → Klick → eingeloggt; zweiter Klick und abgelaufener Link enden mit 401."""
    async def make_token(email: str) -> str:
        from services_magic_link import create_token
        token = await create_token(email, "127.0.0.1")
        assert token
        return token

    async def expire(token: str) -> None:
        from config import db
        from services_magic_link import _hash_token
        await db.magic_links.update_one(
            {"_id": _hash_token(token)},
            {"$set": {"expires_at": datetime.now(timezone.utc) - timedelta(minutes=1)}},
        )

    token = loop.run_until_complete(make_token("standard@wladbot.test"))
    c = httpx.Client(timeout=60.0)
    try:
        first = c.post(f"{API}/auth/magic-link/verify", json={"token": token})
        assert first.status_code == 200, first.text
        assert first.json()["user"]["email"] == "standard@wladbot.test"
        assert first.json()["token"]
        me = c.get(f"{API}/auth/me")
        assert me.status_code == 200, "Cookie-Session nach Magic-Link fehlt"

        second = c.post(f"{API}/auth/magic-link/verify", json={"token": token})
        assert second.status_code == 401, second.text
        assert "bereits verwendet" in second.json()["detail"]

        bad = c.post(f"{API}/auth/magic-link/verify", json={"token": "nicht-existent-xyz"})
        assert bad.status_code == 401

        old = loop.run_until_complete(make_token("standard@wladbot.test"))
        loop.run_until_complete(expire(old))
        stale = c.post(f"{API}/auth/magic-link/verify", json={"token": old})
        assert stale.status_code == 401, stale.text
    finally:
        c.close()


def test_magic_link_email_contains_verify_link(loop) -> None:
    async def run() -> None:
        from services_magic_link import _format_email_html
        html = _format_email_html("Stefan", "https://leaderos.de/auth/magic?token=abc", None, "https://leaderos.de")
        assert "/auth/magic?token=abc" in html
        assert "WladBot" in html and "Vlad" not in html
        assert "Minuten" in html  # Gültigkeitshinweis

    loop.run_until_complete(run())
