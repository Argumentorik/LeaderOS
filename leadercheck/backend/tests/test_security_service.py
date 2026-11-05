"""Unit tests for the central security service:
- Report/sync JWT issuance + verification
- OTP create / verify (single-use, expiry, attempts-lockout)
- Client IP resolution (spoof-resistance)
- HTML escape helper
"""
import asyncio
import os
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock

# Env vars MUST be set before importing the module — REPORT_JWT_SECRET
os.environ.setdefault("REPORT_JWT_SECRET", "test-secret-report-abcdefghijklmno")
os.environ.setdefault("ADMIN_JWT_SECRET", "test-secret-admin")

from services import security  # noqa: E402


# ─── Fake DB for OTP ───────────────────────────────────────

class FakeCollection:
    def __init__(self):
        self.docs = {}
    async def update_one(self, query, update, upsert=False):
        email = query.get("email")
        set_ = update.get("$set", {})
        if email in self.docs:
            self.docs[email].update(set_)
        elif upsert:
            self.docs[email] = {**query, **set_}
    async def find_one(self, query, _proj=None):
        return self.docs.get(query.get("email"))
    async def delete_one(self, query):
        self.docs.pop(query.get("email"), None)


class FakeDB:
    def __init__(self):
        self.auth_otp = FakeCollection()


# ─── Tests ────────────────────────────────────────────────

def test_issue_and_verify_report_token_ok():
    tok = security.issue_report_token("sid-123", "a@b.com")
    payload = security.verify_report_token(tok, expected_sid="sid-123")
    assert payload["sid"] == "sid-123"
    assert payload["email"] == "a@b.com"
    assert payload["aud"] == "report"


def test_verify_report_token_rejects_wrong_sid():
    tok = security.issue_report_token("sid-A", "a@b.com")
    try:
        security.verify_report_token(tok, expected_sid="sid-B")
    except Exception as e:
        assert "mismatch" in str(e).lower() or "403" in str(e)
        return
    raise AssertionError("Expected token/session-mismatch to raise")


def test_verify_sync_token_rejects_report_token():
    """Cross-aud replay — a report_token must NOT pass sync verify."""
    tok = security.issue_report_token("sid-x", "u@x.io")
    try:
        security.verify_sync_token(tok)
    except Exception as e:
        assert "invalid" in str(e).lower() or "401" in str(e)
        return
    raise AssertionError("Expected cross-aud replay to fail")


def test_verify_sync_token_ok_for_its_own_token():
    tok = security.issue_sync_token("sid-x", "u@x.io")
    p = security.verify_sync_token(tok)
    assert p["aud"] == "leader_os_sync"
    assert p["sid"] == "sid-x"


def test_otp_create_and_verify_success():
    db = FakeDB()
    code = asyncio.run(security.create_otp(db, "u@t.com"))
    assert len(code) == 6 and code.isdigit()
    assert asyncio.run(security.verify_otp(db, "u@t.com", code)) is True
    # Second attempt with same (now consumed) code fails
    assert asyncio.run(security.verify_otp(db, "u@t.com", code)) is False


def test_otp_wrong_code_increments_attempts_and_locks_after_max():
    db = FakeDB()
    _ = asyncio.run(security.create_otp(db, "u@t.com"))
    # 5 wrong attempts consume the record
    for _ in range(security.OTP_MAX_ATTEMPTS):
        assert asyncio.run(security.verify_otp(db, "u@t.com", "000000")) is False
    # Record deleted → even a fresh guess returns False
    assert db.auth_otp.docs.get("u@t.com") is None


def test_secure_client_ip_uses_rightmost_hop():
    """Attacker-supplied leftmost XFF must be ignored."""
    req = MagicMock()
    req.headers = {"x-forwarded-for": "6.6.6.6, 10.0.0.5, 172.16.0.1"}
    req.client.host = "127.0.0.1"
    assert security.secure_client_ip(req) == "172.16.0.1"


def test_secure_client_ip_fallback_to_client_host():
    req = MagicMock()
    req.headers = {}
    req.client.host = "9.9.9.9"
    assert security.secure_client_ip(req) == "9.9.9.9"


def test_escape_for_email_neutralizes_html():
    out = security.escape_for_email('<script>alert(1)</script>bob@x.com')
    assert "<script" not in out
    assert "&lt;script" in out


def test_escape_for_email_length_cap():
    out = security.escape_for_email("A" * 500, max_len=100)
    assert len(out) == 100
