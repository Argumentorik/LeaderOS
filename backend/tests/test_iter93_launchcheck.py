"""Iter 93 GODMODE launch check — session persistence, magic link, providers,
voice graceful TTS degradation, video sanity, chat multi-turn, security headers.
"""
import io
import os
import wave
import struct
import math
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
CREDS = {"identifier": "test@test.com", "password": "test123"}


def _login(session: requests.Session):
    r = session.post(f"{BASE_URL}/api/auth/login", json=CREDS, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return r


# ---------- (1) AUTH PERSISTENCE ----------

class TestAuthPersistence:
    def test_login_sets_30d_cookie_and_me_works(self):
        s = requests.Session()
        r = _login(s)
        # Cookie present with 30d Max-Age
        set_cookie = r.headers.get("set-cookie", "")
        assert "session_token=" in set_cookie
        assert "Max-Age=2592000" in set_cookie, f"expected 30d Max-Age, got: {set_cookie[:300]}"
        assert "HttpOnly" in set_cookie
        # /me works
        me = s.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert me.status_code == 200
        assert me.json().get("email") == "test@test.com"

    def test_refresh_extends_existing_session_no_duplicate(self):
        s = requests.Session()
        _login(s)
        orig_token = s.cookies.get("session_token")
        assert orig_token
        # Refresh
        r = s.post(f"{BASE_URL}/api/auth/refresh", timeout=10)
        assert r.status_code == 200, r.text[:300]
        # Cookie should be the SAME token (extended, not new)
        new_token = s.cookies.get("session_token")
        assert new_token == orig_token, f"refresh created new session {new_token} vs {orig_token}"
        # /me still works
        me = s.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert me.status_code == 200

    def test_three_devices_all_stay_valid(self):
        sessions = [requests.Session() for _ in range(3)]
        for s in sessions:
            _login(s)
        # After three logins from separate jars, all three /me must return 200
        for i, s in enumerate(sessions):
            me = s.get(f"{BASE_URL}/api/auth/me", timeout=10)
            assert me.status_code == 200, f"device {i} /me failed: {me.status_code}"


# ---------- (2) MAGIC LINK ----------

class TestMagicLink:
    def test_magic_link_request_generic_200(self):
        r = requests.post(
            f"{BASE_URL}/api/auth/magic-link/request",
            json={"email": "test@test.com"},
            timeout=10,
        )
        assert r.status_code == 200, r.text[:200]
        body = r.json()
        # generic message — no enumeration
        assert "Falls" in body.get("message", "") or "existiert" in body.get("message", "")


# ---------- (3) PROVIDERS ----------

class TestProviders:
    def test_google_provider_config(self):
        r = requests.get(f"{BASE_URL}/api/auth/providers", timeout=10)
        assert r.status_code == 200
        body = r.json()
        providers = body.get("providers", body)
        assert providers.get("google") is True, f"providers: {body}"
        cid = body.get("google_client_id", "")
        assert cid.startswith("482961656741"), f"unexpected google_client_id: {cid}"


# ---------- (4) VOICE — graceful TTS degradation ----------

def _generate_wav_bytes(duration_s: float = 2.0, freq: int = 440, rate: int = 16000) -> bytes:
    """Build a small mono 16-bit PCM WAV in-memory (no ffmpeg needed)."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        n = int(rate * duration_s)
        frames = bytearray()
        for i in range(n):
            v = int(32000 * math.sin(2 * math.pi * freq * i / rate))
            frames += struct.pack("<h", v)
        w.writeframes(bytes(frames))
    return buf.getvalue()


class TestVoiceGracefulDegrade:
    def test_voice_conversation_never_502(self):
        s = requests.Session()
        _login(s)
        wav_bytes = _generate_wav_bytes()
        files = {"file": ("test.wav", wav_bytes, "audio/wav")}
        data = {"persona": "wlad"}
        r = s.post(
            f"{BASE_URL}/api/voice/conversation",
            files=files,
            data=data,
            timeout=90,
        )
        # KEY CHECK: never 502 "Voice synthesis failed"
        assert r.status_code != 502, f"got 502 (TTS not gracefully degraded): {r.text[:300]}"
        # 200 with transcript+response_text, or 400 empty_transcript (sine wave has no speech)
        assert r.status_code in (200, 400), f"unexpected status {r.status_code}: {r.text[:300]}"
        if r.status_code == 200:
            body = r.json()
            # Voice endpoint returns response_text on TTS-quota-exhausted, audio_url may be empty
            assert "response_text" in body or "text" in body, f"no text field in response: {body}"
        else:
            # 400 acceptable if transcript empty from sine wave
            assert "empty_transcript" in r.text.lower() or "empty" in r.text.lower() or "transcript" in r.text.lower()


# ---------- (5) VIDEO ----------

class TestVideo:
    def test_video_challenges_list(self):
        s = requests.Session()
        _login(s)
        r = s.get(f"{BASE_URL}/api/video-challenges", timeout=15)
        # Endpoint must exist and be authorized
        assert r.status_code == 200, f"video-challenges list failed: {r.status_code} {r.text[:200]}"


# ---------- (6) CHAT multi-turn ----------

class TestChat:
    def test_chat_reply_and_session_persistence(self):
        s = requests.Session()
        _login(s)
        r1 = s.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Kurzer Test: Nenne mir eine Führungs-Regel in einem Satz."},
            timeout=90,
        )
        assert r1.status_code == 200, f"chat msg1 failed: {r1.status_code} {r1.text[:200]}"
        body1 = r1.json()
        sid = body1.get("session_id") or body1.get("chat_session_id")
        assert sid, f"no session_id in response: {list(body1.keys())}"
        # Second message with same session_id
        r2 = s.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Gib mir noch eine.", "session_id": sid},
            timeout=90,
        )
        assert r2.status_code == 200, f"chat msg2 failed: {r2.status_code} {r2.text[:200]}"
        body2 = r2.json()
        sid2 = body2.get("session_id") or body2.get("chat_session_id")
        assert sid2 == sid, f"session_id mismatch: {sid} -> {sid2}"


# ---------- (7) SECURITY HEADERS ----------

class TestSecurityHeaders:
    def test_security_headers_present(self):
        r = requests.get(f"{BASE_URL}/api/auth/providers", timeout=10)
        h = {k.lower(): v for k, v in r.headers.items()}
        assert "content-security-policy" in h, f"missing CSP; headers: {list(h.keys())}"
        hsts = h.get("strict-transport-security", "")
        assert "max-age=63072000" in hsts and "preload" in hsts, f"HSTS: {hsts}"
        coop = h.get("cross-origin-opener-policy", "")
        assert "same-origin-allow-popups" in coop, f"COOP: {coop}"
        assert "x-frame-options" in h, "missing X-Frame-Options"
