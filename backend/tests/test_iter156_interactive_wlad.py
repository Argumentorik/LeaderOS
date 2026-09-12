"""Iter 156: Interaktiver Wlad (Beta) — gesperrt für Nutzer, Admin-Preview, Admin-Toggle, Klonstimme."""
import io
import os
import sys

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv  # noqa: E402

load_dotenv("/app/backend/.env")
API = os.environ.get("API_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]


def _login(email, password=os.environ.get("TEST_ACCOUNT_PASSWORD", "test123")):
    s = requests.Session()
    r = s.post(f"{API}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, r.text
    return s


def _set(admin, **patch):
    r = admin.put(f"{API}/api/guide/interactive/admin", json=patch, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


DEFAULTS = {"enabled": False, "paid_open": True, "free_trial_turns": 3}


def test_access_model_paid_open_free_trial_admin_always():
    admin = _login("test@test.com")
    _set(admin, **DEFAULTS)
    free = _login("free@wladbot.test").get(f"{API}/api/guide/interactive/status", timeout=30).json()
    assert free["beta"] is True and free["voice"] == "wlad-clone" and free["tier"] == "free"
    assert free["trial"] is True and free["trial_total"] == 3 and free["locked"] is (free["trial_left"] == 0)
    std = _login("standard@wladbot.test").get(f"{API}/api/guide/interactive/status", timeout=30).json()
    assert std["locked"] is False and std["trial"] is False and std["tier"] == "standard"
    adm = admin.get(f"{API}/api/guide/interactive/status", timeout=30).json()
    assert adm["locked"] is False


def test_locked_turn_and_speak_return_403_without_credit_burn():
    admin = _login("test@test.com")
    _set(admin, free_trial_turns=0)  # Free ohne Test-Gespräche -> gesperrt
    try:
        free = _login("free@wladbot.test")
        assert free.get(f"{API}/api/guide/interactive/status", timeout=30).json()["locked"] is True
        r = free.post(f"{API}/api/guide/interactive/turn", files={"file": ("v.webm", io.BytesIO(b"x" * 3000), "audio/webm")},
                      data={"context_title": "Test"}, timeout=30)
        assert r.status_code == 403 and r.json()["detail"] == "interactive_locked"
        assert free.post(f"{API}/api/guide/interactive/speak", json={"text": "Hallo"}, timeout=30).status_code == 403
    finally:
        _set(admin, **DEFAULTS)


def test_admin_toggles_and_non_admin_forbidden():
    admin = _login("test@test.com")
    try:
        assert _set(admin, enabled=True)["enabled"] is True
        assert _login("free@wladbot.test").get(f"{API}/api/guide/interactive/status", timeout=30).json()["trial"] is False
        assert _set(admin, paid_open=False, enabled=False)["paid_open"] is False
        assert _login("standard@wladbot.test").get(f"{API}/api/guide/interactive/status", timeout=30).json()["trial"] is True
        assert _set(admin, free_trial_turns=25)["free_trial_turns"] == 10  # gekappt auf 0-10
    finally:
        _set(admin, **DEFAULTS)
    free = _login("free@wladbot.test")
    assert free.put(f"{API}/api/guide/interactive/admin", json={"enabled": True}, timeout=30).status_code == 403


def test_voice_config_uses_guide_clone_voice(monkeypatch):
    """Iter 174: Echtzeit = ElevenLabs-Klon; der Minimax-Klon aus dem Guide Studio nur mit WLAD_REALTIME_VOICE=minimax."""
    import asyncio
    from routes.guide_interactive import _wlad_voice_config
    from routes.guide import _settings

    async def _both():
        cfg = await _wlad_voice_config()
        settings = await _settings()
        monkeypatch.setenv("WLAD_REALTIME_VOICE", "minimax")
        cfg2 = await _wlad_voice_config()
        return cfg, settings, cfg2

    cfg, settings, cfg2 = asyncio.run(_both())
    assert cfg["provider"] == "elevenlabs" and cfg.get("realtime") is True
    assert cfg["language"] == "de"
    if settings.get("custom_voice_id"):
        assert cfg2["voice_id"] == settings["custom_voice_id"] and cfg2["provider"] == "minimax"
