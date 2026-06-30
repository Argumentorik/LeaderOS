"""Tests for the Stripe self-healing background job + helpers.

Covers `cancel_stale_pending_checkouts`:
- Fresh pending checkouts (< 26h) are LEFT alone
- Stale pending checkouts (> 26h) where Stripe is unreachable → marked expired
- Stale pending checkouts where Stripe returns paid → reconciled to complete
- Stale pending checkouts where Stripe returns expired → marked expired
- Stale checkouts where Stripe still considers session 'open' → left pending

Uses an in-memory fake DB to avoid touching real Mongo, and `asyncio.run`
to stay consistent with the rest of the test suite (no pytest-asyncio dep).
"""
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

from services.stripe_checkout import (
    cancel_stale_pending_checkouts,
    is_real_stripe_key,
    STALE_HOURS,
)


# ─── Fake DB ──────────────────────────────────────────────────────────────

class FakeCursor:
    def __init__(self, docs):
        self._docs = docs

    def limit(self, _n):
        return self

    async def to_list(self, _n):
        return self._docs


class FakeCollection:
    def __init__(self, docs):
        self.docs = docs
        self.updates = []

    def find(self, query, projection=None):
        cutoff = query["created_at"]["$lt"]
        out = [
            d for d in self.docs
            if d.get("status") == query["status"] and d.get("created_at", "") < cutoff
        ]
        return FakeCursor(out)

    async def update_one(self, query, update):
        sid = query["session_id"]
        for d in self.docs:
            if d.get("session_id") == sid:
                d.update(update["$set"])
        self.updates.append({"sid": sid, "set": update["$set"]})


class FakeDB:
    def __init__(self, docs):
        self.payment_transactions = FakeCollection(docs)


def _make_tx(session_id: str, hours_old: float, **extra):
    created = datetime.now(timezone.utc) - timedelta(hours=hours_old)
    return {
        "session_id": session_id,
        "status": "pending",
        "payment_status": "initiated",
        "created_at": created.isoformat(),
        "mode": extra.pop("mode", "payment"),
        **extra,
    }


# ─── Tests ────────────────────────────────────────────────────────────────

def test_is_real_stripe_key_detects_placeholder():
    assert is_real_stripe_key("sk_test_emergent") is False
    assert is_real_stripe_key("") is False
    assert is_real_stripe_key(None) is False
    assert is_real_stripe_key("sk_live_abc123def456") is True
    assert is_real_stripe_key("sk_test_" + "x" * 30) is True


def test_fresh_pending_checkouts_are_left_alone():
    db = FakeDB([_make_tx("cs_fresh_1", hours_old=1)])
    result = asyncio.run(cancel_stale_pending_checkouts(db))
    assert result == {"scanned": 0, "expired": 0, "reconciled_paid": 0}
    assert db.payment_transactions.docs[0]["status"] == "pending"


def test_stale_checkout_with_stripe_unreachable_is_expired_by_age():
    db = FakeDB([_make_tx("cs_stale_1", hours_old=STALE_HOURS + 2)])

    def boom(*a, **kw):
        raise RuntimeError("Stripe API unreachable")

    with patch("services.stripe_checkout.stripe_sdk.checkout.Session.retrieve", side_effect=boom):
        result = asyncio.run(cancel_stale_pending_checkouts(db))

    assert result["scanned"] == 1
    assert result["expired"] == 1
    assert result["reconciled_paid"] == 0
    doc = db.payment_transactions.docs[0]
    assert doc["status"] == "expired"
    assert doc["payment_status"] == "expired"
    assert doc["expired_by"] == "stripe_self_healer"


def test_stale_checkout_reconciled_paid_when_stripe_says_paid():
    db = FakeDB([_make_tx("cs_paid_1", hours_old=STALE_HOURS + 5)])
    fake_session = {"status": "complete", "payment_status": "paid"}

    with patch("services.stripe_checkout.stripe_sdk.checkout.Session.retrieve", return_value=fake_session):
        result = asyncio.run(cancel_stale_pending_checkouts(db))

    assert result["scanned"] == 1
    assert result["expired"] == 0
    assert result["reconciled_paid"] == 1
    doc = db.payment_transactions.docs[0]
    assert doc["status"] == "complete"
    assert doc["payment_status"] == "paid"


def test_stale_checkout_with_stripe_expired_is_marked_expired():
    db = FakeDB([_make_tx("cs_exp_1", hours_old=STALE_HOURS + 5)])
    fake_session = {"status": "expired", "payment_status": "unpaid"}

    with patch("services.stripe_checkout.stripe_sdk.checkout.Session.retrieve", return_value=fake_session):
        result = asyncio.run(cancel_stale_pending_checkouts(db))

    assert result["expired"] == 1
    assert db.payment_transactions.docs[0]["status"] == "expired"


def test_stale_with_open_stripe_session_is_left_pending():
    """If Stripe still considers the session 'open' we don't override · we'll
    re-check next run.
    """
    db = FakeDB([_make_tx("cs_open_1", hours_old=STALE_HOURS + 5)])
    fake_session = {"status": "open", "payment_status": "unpaid"}

    with patch("services.stripe_checkout.stripe_sdk.checkout.Session.retrieve", return_value=fake_session):
        result = asyncio.run(cancel_stale_pending_checkouts(db))

    assert result["scanned"] == 1
    assert result["expired"] == 0
    assert result["reconciled_paid"] == 0
    assert db.payment_transactions.docs[0]["status"] == "pending"


def test_mixed_batch_processes_independently():
    db = FakeDB([
        _make_tx("cs_fresh_a", hours_old=1),
        _make_tx("cs_stale_a", hours_old=STALE_HOURS + 3),
        _make_tx("cs_stale_b", hours_old=STALE_HOURS + 10),
    ])

    def boom(*a, **kw):
        raise RuntimeError("nope")

    with patch("services.stripe_checkout.stripe_sdk.checkout.Session.retrieve", side_effect=boom):
        result = asyncio.run(cancel_stale_pending_checkouts(db))

    assert result["scanned"] == 2
    assert result["expired"] == 2
    fresh = next(d for d in db.payment_transactions.docs if d["session_id"] == "cs_fresh_a")
    assert fresh["status"] == "pending"
