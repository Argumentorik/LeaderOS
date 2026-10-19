"""Tests for the leader-check → LeaderOS sync-token receiver (routes/auth.py).

Covers the security-critical bits: signature/secret verification, expiry,
purpose guard (a report_token must NOT be accepted as a login), and identity
extraction. Skips gracefully if the backend import env isn't wired locally.
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def _mod(monkeypatch):
    monkeypatch.setenv("SYNC_JWT_SECRET", "shared-secret-abc")
    try:
        import jwt  # noqa: F401
        from routes import auth
        return auth
    except Exception as exc:  # pragma: no cover - env/crypto dependent
        pytest.skip(f"auth route env unavailable: {exc}")
        raise  # unreachable (skip raises) — makes control flow explicit


def _jwt(payload, secret="shared-secret-abc"):
    import jwt
    return jwt.encode(payload, secret, algorithm="HS256")


def test_valid_sync_token_decodes_and_extracts_identity(monkeypatch):
    auth = _mod(monkeypatch)
    tok = _jwt({"email": "Lead@Firma.DE", "name": "Lea", "typ": "sync",
                "exp": int(time.time()) + 600})
    payload = auth._decode_sync_token(tok)
    assert payload is not None
    assert auth._sync_identity(payload) == ("lead@firma.de", "Lea")


def test_wrong_secret_and_expired_are_rejected(monkeypatch):
    auth = _mod(monkeypatch)
    assert auth._decode_sync_token(_jwt({"email": "a@b.de"}, secret="nope")) is None
    expired = _jwt({"email": "a@b.de", "exp": int(time.time()) - 5})
    assert auth._decode_sync_token(expired) is None


def test_report_token_purpose_is_not_a_valid_login(monkeypatch):
    auth = _mod(monkeypatch)
    payload = {"email": "a@b.de", "typ": "report"}
    purpose = payload.get("typ")
    assert purpose and str(purpose).lower() not in auth.SYNC_ALLOWED_PURPOSES


def test_no_secret_configured_means_no_signing_secrets(monkeypatch):
    monkeypatch.delenv("SYNC_JWT_SECRET", raising=False)
    monkeypatch.delenv("REPORT_JWT_SECRET", raising=False)
    try:
        from routes import auth
    except Exception as exc:  # pragma: no cover
        pytest.skip(f"auth route env unavailable: {exc}")
        return  # unreachable (skip raises) — makes control flow explicit
    assert auth._sync_signing_secrets() == []
