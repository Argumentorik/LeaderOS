"""Iter 136 — verified-only email sending, license re-login, "Über mich" AI context.

Run: cd /app/backend && REACT_APP_BACKEND_URL=<url> pytest tests/test_iter136_fixes.py -q
"""
import asyncio
import os
import uuid

import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"

ADMIN = {"email": "test@test.com", "password": "test123"}

from tests._loop import run  # shared loop (motor binds to the first one)


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


# ── 1. E-Mails only to real, non-suppressed addresses ────────────────────────

def test_email_guard_blocks_reserved_and_invalid():
    from services_email import send_email
    for bad in ("someone@wladbot.test", "nobody@localhost", "user@example.com", "kaputt"):
        res = run(send_email(bad, "Test", "<p>x</p>"))
        assert res["sent"] is False
        assert res["error"].startswith("blocked:"), f"{bad} was not blocked: {res}"


def test_email_guard_respects_suppression_list():
    from services_email import send_email, suppress_email
    from config import db
    addr = f"bounce-{uuid.uuid4().hex[:8]}@leaderos.de"
    run(suppress_email(addr, "hard bounce (test)"))
    res = run(send_email(addr, "Test", "<p>x</p>"))
    assert res["sent"] is False and "suppressed" in res["error"]
    run(db.email_suppression.delete_many({"email": addr}))


def test_real_address_passes_the_guard():
    """The guard must not block legitimate customer domains."""
    from services_email import _sendability
    ok, reason = run(_sendability("kunde@argumentorik.com"))
    assert ok is True and reason == ""


def test_magic_link_marks_email_verified():
    """Clicking a magic link proves inbox ownership."""
    from services_magic_link import create_token, consume_token
    from config import db
    email = ADMIN["email"]
    run(db.users.update_one({"email": email}, {"$unset": {"email_verified": ""}}))
    token = run(create_token(email, "127.0.0.1"))
    assert token, "magic link creation failed for an EXISTING account"
    user = run(consume_token(token))
    assert user and user["email"] == email
    fresh = run(db.users.find_one({"email": email}, {"_id": 0, "email_verified": 1,
                                                    "email_verified_via": 1}))
    assert fresh["email_verified"] is True
    assert fresh["email_verified_via"] == "magic_link"


def test_magic_link_unknown_account_returns_none():
    from services_magic_link import create_token
    assert run(create_token("does-not-exist-8f2a@leaderos.de", "127.0.0.1")) is None


# ── 2. License re-login (the green arrow) ────────────────────────────────────

class TestLicenseRelogin:
    def _make_key(self, admin_auth, package="leadership_os"):
        r = requests.post(f"{API}/admin/license-keys/generate", headers=admin_auth, timeout=30,
                          json={"package_id": package, "count": 1, "note": "iter136 test"})
        assert r.status_code == 200, r.text
        return r.json()["keys"][0]

    def test_activate_then_relogin_with_same_key(self):
        admin_auth = _login(ADMIN)
        key = self._make_key(admin_auth)
        email = f"lic136-{uuid.uuid4().hex[:8]}@leaderos.de"
        pw = "TestLic2026!"

        first = requests.post(f"{API}/auth/license/activate", timeout=60,
                              json={"license_key": key, "email": email, "password": pw,
                                    "name": "Iter136 Tester"})
        assert first.status_code == 200, first.text
        assert first.json()["account_created"] is True

        # The green arrow again — same key, same account: must log the user back in.
        again = requests.post(f"{API}/auth/license/activate", timeout=60,
                              json={"license_key": key, "email": email, "password": pw})
        assert again.status_code == 200, f"re-login with a redeemed key failed: {again.text}"
        body = again.json()
        assert body["relogin"] is True and body["account_created"] is False
        assert body["user"]["email"] == email
        assert body["user"]["tier"] in ("standard", "accelerator", "enterprise")

    def test_relogin_wrong_password_is_401(self):
        admin_auth = _login(ADMIN)
        key = self._make_key(admin_auth)
        email = f"lic136-{uuid.uuid4().hex[:8]}@leaderos.de"
        requests.post(f"{API}/auth/license/activate", timeout=60,
                      json={"license_key": key, "email": email, "password": "TestLic2026!",
                            "name": "Iter136 Tester"})
        bad = requests.post(f"{API}/auth/license/activate", timeout=60,
                            json={"license_key": key, "email": email, "password": "falsch-falsch"})
        assert bad.status_code == 401, bad.text

    def test_key_cannot_be_claimed_by_another_email(self):
        admin_auth = _login(ADMIN)
        key = self._make_key(admin_auth)
        first_email = f"lic136-{uuid.uuid4().hex[:8]}@leaderos.de"
        requests.post(f"{API}/auth/license/activate", timeout=60,
                      json={"license_key": key, "email": first_email,
                            "password": "TestLic2026!", "name": "Owner"})
        thief = requests.post(f"{API}/auth/license/activate", timeout=60,
                              json={"license_key": key, "email": f"thief-{uuid.uuid4().hex[:6]}@leaderos.de",
                                    "password": "TestLic2026!", "name": "Thief"})
        assert thief.status_code == 400, thief.text


# ── 3. "Über mich" reaches the AI ───────────────────────────────────────────

def test_about_me_saves_and_enters_ai_context():
    auth = _login(ADMIN)
    text = ("Ich leite ein 12-koepfiges Vertriebsteam im Maschinenbau. "
            "Stark in Analyse, schwach darin, Unangenehmes direkt anzusprechen. "
            "Ziel: bis Q4 als Bereichsleiter wahrgenommen werden.")
    r = requests.patch(f"{API}/profile/me", headers=auth, json={"about_me": text}, timeout=30)
    assert r.status_code == 200, r.text

    me = requests.get(f"{API}/profile/me", headers=auth, timeout=30).json()
    assert me["about_me"] == text
    assert me["about_me_updated_at"]

    # The context must actually be in the AI memory block, not just in the UI.
    from services import get_user_memory
    from config import db
    user = run(db.users.find_one({"email": ADMIN["email"]}, {"_id": 0, "user_id": 1}))
    memory = run(get_user_memory(user["user_id"]))
    assert "ÜBER MICH" in memory
    assert "Vertriebsteam im Maschinenbau" in memory

    # Editable: a new version replaces the old one everywhere.
    requests.patch(f"{API}/profile/me", headers=auth,
                   json={"about_me": "Neue Rolle: Bereichsleiter seit Oktober."}, timeout=30)
    memory2 = run(get_user_memory(user["user_id"]))
    assert "Bereichsleiter seit Oktober" in memory2
    assert "Vertriebsteam im Maschinenbau" not in memory2


def test_about_me_length_is_capped():
    auth = _login(ADMIN)
    r = requests.patch(f"{API}/profile/me", headers=auth,
                       json={"about_me": "x" * 6001}, timeout=30)
    assert r.status_code == 422


# ── 4. Stripe invoice carries the real seller ───────────────────────────────

def test_invoice_shows_argumentorik_as_seller():
    from routes.payments import INVOICE_FOOTER, INVOICE_SELLER
    assert INVOICE_SELLER == "Argumentorik-Akademie GmbH"
    for part in ("Argumentorik-Akademie GmbH", "Tölzer Str. 1", "82031 Grünwald",
                 "info@argumentorik.com"):
        assert part in INVOICE_FOOTER
    assert "Leadership OS" not in INVOICE_FOOTER
