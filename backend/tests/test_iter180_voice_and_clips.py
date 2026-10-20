"""Iter 180 — Stimme so klug wie die Schrift · Aussprache · drei neue Clips · Seed-Reimport."""
import os

import httpx
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE}/api"
NEW_CLIPS = ("bp-workflows", "bp-challengers", "bp-simulationen")


@pytest.fixture(scope="module")
def admin():
    c = httpx.Client(timeout=120.0)
    r = c.post(f"{API}/auth/login", json={"identifier": "test@test.com", "password": "test123"})
    assert r.status_code == 200, r.text
    yield c
    c.close()


# ── Aussprache-Schicht ──────────────────────────────────────────────────────

def test_pronunciation_layer():
    from services_speech_text import to_speakable

    assert to_speakable("Im Meeting") == "Imm Meeting"
    assert to_speakable("im Raum") == "imm Raum"
    assert to_speakable("IM ernst") == "IMM ernst"
    assert to_speakable("lade dir das Playbook") == "lahde dir das Playbook"
    assert to_speakable("Lade die Datei") == "Lahde die Datei"
    # Wortgrenzen: nichts kaputt machen
    assert to_speakable("Ladenschluss und Imker") == "Ladenschluss und Imker"
    # Abkürzungen werden buchstabiert, Marke bleibt Wlad
    assert to_speakable("KI und ROI") == "K-I und R-O-I"
    assert to_speakable("Vlad sagt") == "Wlad sagt"
    # Markdown würde mitgelesen
    assert to_speakable("das ist *wichtig*") == "das ist wichtig"


def test_tts_pipelines_use_pronunciation_layer():
    """Beide Wege in die Stimme (Fal/Minimax für Videos, ElevenLabs live) gehen durch to_speakable."""
    import inspect
    import services_fal
    from routes import voice_tts

    assert "to_speakable" in inspect.getsource(services_fal.synthesize_speech)
    assert "to_speakable" in inspect.getsource(voice_tts._synthesize)


# ── Stimme = Schrift ────────────────────────────────────────────────────────

def test_voice_prompt_has_full_written_knowledge():
    from routes.voice_tts import VOICE_CONVO_SYSTEM_PROMPT
    from services import WLADBOT_SYSTEM_PROMPT

    assert VOICE_CONVO_SYSTEM_PROMPT.startswith(WLADBOT_SYSTEM_PROMPT)
    for needle in ("FEEDBACKFORMEL", "3 SÄULEN DER ÜBERZEUGUNG", "Weiße Rhetorik", "5 ROLLEN"):
        assert needle in VOICE_CONVO_SYSTEM_PROMPT, needle
    # Voice-Form bleibt: kurz, gesprochen, kein Markdown, Namensregel
    for needle in ("LIVE-VOICE-MODUS", "niemals länger", "Markdown", "niemals „Vlad"):
        assert needle in VOICE_CONVO_SYSTEM_PROMPT, needle


def test_voice_reply_uses_rag_and_frameworks():
    import inspect
    from routes import voice_tts

    src = inspect.getsource(voice_tts._voice_llm_reply)
    assert "retrieve_context" in src
    assert "match_frameworks" in src
    assert "VOICE_CONVO_SYSTEM_PROMPT" in src


# ── Drei neue Ein-Take-Clips ────────────────────────────────────────────────

def test_new_feature_clips_are_single_take_with_script():
    from guide_content import seed_clips, clip_questions

    clips = {c["slug"]: c for c in seed_clips()}
    for slug in NEW_CLIPS:
        c = clips[slug]
        assert c["kind"] == "feature"
        assert c["single_take"] is True, f"{slug} muss ein Take sein"
        assert not c.get("multi_shot")
        assert c["setting"] == "studio"
        words = len(c["script"].split())
        assert 55 <= words <= 115, f"{slug}: {words} Wörter"
        assert len(clip_questions(slug)) == 3


def test_new_clips_are_live_with_poster(admin):
    res = admin.get(f"{API}/guide/clips", params={"kind": "feature"})
    assert res.status_code == 200, res.text
    clips = {c["slug"]: c for c in res.json()["clips"]}
    for slug in NEW_CLIPS:
        c = clips.get(slug)
        assert c, f"{slug} fehlt in der Feature-Liste"
        assert c["video_url"], f"{slug} hat kein Video"
        assert c["poster_url"], f"{slug} hat kein Vorschaubild"
        assert admin.get(f"{BASE}{c['video_url']}").status_code == 200
        assert admin.get(f"{BASE}{c['poster_url']}").status_code == 200


def test_new_clips_are_in_production_seed():
    import json
    from pathlib import Path

    seed = json.loads((Path(__file__).resolve().parent.parent / "guide_seed_data.json").read_text())
    slugs = {c["slug"]: c for c in seed["clips"]}
    for slug in NEW_CLIPS:
        assert slug in slugs, f"{slug} fehlt im Seed — Prod bekäme das Video nicht"
        assert slugs[slug]["video_path"]
        assert slugs[slug]["published"] is True
    assert "coaching-pakete" in slugs and slugs["coaching-pakete"]["video_path"]


# ── Seed-Reimport (Prod-Knopf) ──────────────────────────────────────────────

def test_seed_reimport_is_admin_only_and_idempotent(admin):
    with httpx.Client(timeout=60.0) as anon:
        assert anon.post(f"{API}/guide/admin/seed/reimport", json={}).status_code == 401

    r = admin.post(f"{API}/guide/admin/seed/reimport", json={})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["clips_total"] >= 21
    assert body["clips_published"] >= 15
    # Zweiter Klick darf nichts kaputt machen
    again = admin.post(f"{API}/guide/admin/seed/reimport", json={})
    assert again.status_code == 200
    assert again.json()["clips_total"] == body["clips_total"]


def test_coaching_clip_still_live(admin):
    res = admin.get(f"{API}/guide/clips", params={"kind": "coaching"})
    assert res.status_code == 200
    clips = res.json()["clips"]
    assert clips, "Coaching-Video fehlt"
    assert any(c.get("video_url") or c.get("vimeo_id") for c in clips)
