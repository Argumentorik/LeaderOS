"""Iter 174: Echtzeit-Klonstimme im Audio-Mode (ElevenLabs Flash statt Fal/Minimax-Queue)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_wlad_realtime_voice_is_elevenlabs_flash_by_default(monkeypatch):
    monkeypatch.delenv("WLAD_REALTIME_VOICE", raising=False)
    monkeypatch.setenv("MINIMAX_WLAD_VOICE_ID", "Voice123")
    monkeypatch.setenv("ELEVENLABS_WLAD_VOICE_ID", "ELwlad")
    import importlib
    import routes.voice_tts as vt
    importlib.reload(vt)
    wlad = vt.VOICE_REGISTRY["wlad"]
    assert wlad["provider"] == "elevenlabs" and wlad["voice_id"] == "ELwlad" and wlad["realtime"] is True
    assert vt.REALTIME_MODEL_ID.startswith("eleven_flash") or vt.REALTIME_MODEL_ID.startswith("eleven_turbo")


def test_minimax_only_when_explicitly_requested(monkeypatch):
    monkeypatch.setenv("WLAD_REALTIME_VOICE", "minimax")
    monkeypatch.setenv("MINIMAX_WLAD_VOICE_ID", "Voice123")
    import importlib
    import routes.voice_tts as vt
    importlib.reload(vt)
    assert vt.VOICE_REGISTRY["wlad"]["provider"] == "minimax"
    assert vt.VOICE_REGISTRY["wlad"]["voice_id"] == "Voice123"
    monkeypatch.delenv("WLAD_REALTIME_VOICE", raising=False)
    importlib.reload(vt)


def test_response_model_carries_timings():
    import routes.voice_tts as vt
    r = vt.VoiceConvoResponse(session_id="s", transcript="t", response_text="r", audio_url="", persona="wlad", timings={"stt_ms": 1, "llm_ms": 2, "tts_ms": 3, "total_ms": 6})
    assert r.timings["total_ms"] == 6
