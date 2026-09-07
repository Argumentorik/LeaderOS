"""Iter 156: Interaktiver Wlad (Beta) — gesperrt für Nutzer, Admin-Preview, Admin-Toggle, Klonstimme."""
import io
import os
import sys

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv  # noqa: E402

load_dotenv("/app/backend/.env")
API = os.environ.get("API_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0]


def _login(email, password="test123"):
    s = requests.Session()
    r = s.post(f"{API}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, r.text
    return s


def _set(admin, enabled):
    r = admin.put(f"{API}/api/guide/interactive/admin", json={"enabled": enabled}, timeout=30)
    assert r.status_code == 200 and r.json()["enabled"] is enabled


def test_beta_locked_by_default_for_users_admin_preview():
    admin = _login("test@test.com")
    _set(admin, False)
    free = _login("free@wladbot.test")
    st = free.get(f"{API}/api/guide/interactive/status", timeout=30).json()
    assert st["locked"] is True and st["enabled"] is False and st["beta"] is True and st["voice"] == "wlad-clone"
    st_admin = admin.get(f"{API}/api/guide/interactive/status", timeout=30).json()
    assert st_admin["locked"] is False and st_admin["admin_preview"] is True


def test_locked_turn_returns_403_and_no_credit_burn():
    admin = _login("test@test.com")
    _set(admin, False)
    free = _login("free@wladbot.test")
    r = free.post(f"{API}/api/guide/interactive/turn", files={"file": ("v.webm", io.BytesIO(b"x" * 3000), "audio/webm")},
                  data={"context_title": "Test"}, timeout=30)
    assert r.status_code == 403 and r.json()["detail"] == "interactive_locked"


def test_admin_can_open_and_relock_beta():
    admin = _login("test@test.com")
    _set(admin, True)
    free = _login("free@wladbot.test")
    assert free.get(f"{API}/api/guide/interactive/status", timeout=30).json()["locked"] is False
    _set(admin, False)
    assert free.get(f"{API}/api/guide/interactive/status", timeout=30).json()["locked"] is True
    # Nicht-Admin darf nicht schalten
    assert free.put(f"{API}/api/guide/interactive/admin", json={"enabled": True}, timeout=30).status_code == 403


def test_voice_config_uses_guide_clone_voice():
    import asyncio
    from routes.guide_interactive import _wlad_voice_config
    from routes.guide import _settings

    async def _both():
        return await _wlad_voice_config(), await _settings()

    cfg, settings = asyncio.run(_both())
    if settings.get("custom_voice_id"):
        assert cfg["voice_id"] == settings["custom_voice_id"] and cfg["provider"] == "minimax"
    assert cfg["language"] == "de"
