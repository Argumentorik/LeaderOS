"""Iter 135 — failure-mode tests (in-process, no network).

Covers: RAG unavailable · embedding failure · cache invalidation ·
leadercheck.de unreachable · malformed payload · duplicate sync · re-take.

Run: cd /app/backend && python3 -m pytest tests/test_iter135_failure_modes.py -q
"""
import asyncio

import services_rag
import services_wladhub_autosync as autosync
from config import db

# One shared event loop: motor's client binds to the loop it first runs on,
# so asyncio.run() per test would break it.
LOOP = asyncio.new_event_loop()
asyncio.set_event_loop(LOOP)
run = LOOP.run_until_complete


def _cleanup(user_id):
    run(db.wladhub_diagnoses.delete_many({"user_id": user_id}))
    run(db.wladhub_sync_log.delete_many({"user_id": user_id}))
    run(db.users.delete_many({"user_id": user_id}))


def test_rag_survives_vector_store_failure(monkeypatch):
    """Vector match blows up → keyword/manual path still grounds the answer."""
    async def boom(*a, **kw):
        raise RuntimeError("vector store down")
    monkeypatch.setattr(services_rag, "_match_local", boom)
    services_rag.invalidate_caches("test")
    ctx = run(services_rag.retrieve_context("Was ist das SEXIER-Modell?"))
    assert ctx["chunks_count"] > 0
    assert ctx["rag_active"] is True


def test_rag_survives_embedding_failure(monkeypatch):
    async def none_embed(*a, **kw):
        return None
    monkeypatch.setattr(services_rag, "_embed_query", none_embed)
    services_rag.invalidate_caches("test")
    ctx = run(services_rag.retrieve_context("Konfliktgespräch mit Mitarbeiter führen"))
    assert isinstance(ctx["context_block"], str)  # never raises


def test_rag_short_query_returns_empty():
    ctx = run(services_rag.retrieve_context("ok"))
    assert ctx == {"context_block": "", "chunks_count": 0, "rag_active": False}


def test_invalidate_caches_clears_state():
    run(services_rag.retrieve_context("Was ist Schlagfertigkeit?"))
    res = services_rag.invalidate_caches("unit-test")
    assert res["queries_dropped"] >= 1
    assert services_rag._LOCAL_CACHE["matrix"] is None
    assert len(services_rag._query_cache) == 0


def test_leadercheck_unavailable_is_logged_not_raised(monkeypatch):
    async def boom(email):
        raise RuntimeError("supabase unreachable")
    monkeypatch.setattr(autosync, "_fetch_supabase_insights", boom)
    run(autosync.auto_sync_wladhub_on_signup("user_failtest_1", "fail1@test.local"))
    row = run(db.wladhub_sync_log.find_one({"user_id": "user_failtest_1"}, {"_id": 0}))
    assert row and row["status"] == "error"
    assert "supabase unreachable" in row["error"]
    _cleanup("user_failtest_1")


def test_leadercheck_no_diagnose_is_marked_not_found(monkeypatch):
    async def empty(email):
        return []
    monkeypatch.setattr(autosync, "_fetch_supabase_insights", empty)
    run(autosync.auto_sync_wladhub_on_signup("user_failtest_5", "fail5@test.local"))
    row = run(db.wladhub_sync_log.find_one({"user_id": "user_failtest_5"}, {"_id": 0}))
    assert row["status"] == "not_found"
    _cleanup("user_failtest_5")


def test_leadercheck_malformed_payload_does_not_corrupt_scores(monkeypatch):
    """Partial/garbage rows must not write None/NaN scores."""
    async def partial(email):
        return [{"assessed_at": "2026-08-13T10:00:00+00:00", "ki_score": None}]
    monkeypatch.setattr(autosync, "_fetch_supabase_insights", partial)
    run(autosync.auto_sync_wladhub_on_signup("user_failtest_2", "fail2@test.local"))
    diag = run(db.wladhub_diagnoses.find_one({"user_id": "user_failtest_2"}, {"_id": 0}))
    assert diag is not None
    for key in ("ki_kompetenz", "boardroom_rhetorik", "strategisches_eq", "overall_score"):
        assert isinstance(diag[key], int) and 0 <= diag[key] <= 100
    log = run(db.wladhub_sync_log.find_one({"user_id": "user_failtest_2"}, {"_id": 0}))
    assert log["status"] == "completed"
    _cleanup("user_failtest_2")


def test_leadercheck_duplicate_sync_is_a_noop(monkeypatch):
    """Same assessed_at twice → no second write, no duplicate rows."""
    async def same(email):
        return [{"assessed_at": "2026-08-13T11:00:00+00:00", "ki_score": 70,
                 "rhetoric_score": 60, "eq_score": 80, "composite_score": 70}]
    monkeypatch.setattr(autosync, "_fetch_supabase_insights", same)
    run(autosync.auto_sync_wladhub_on_signup("user_failtest_3", "fail3@test.local"))
    run(autosync.auto_sync_wladhub_on_signup("user_failtest_3", "fail3@test.local"))
    assert run(db.wladhub_diagnoses.count_documents({"user_id": "user_failtest_3"})) == 1
    rows = run(db.wladhub_sync_log.find({"user_id": "user_failtest_3"}, {"_id": 0}).to_list(10))
    statuses = [r["status"] for r in rows]
    assert statuses.count("completed") == 1
    assert "unchanged" in statuses
    _cleanup("user_failtest_3")


def test_leadercheck_newer_result_updates(monkeypatch):
    """A RE-taken diagnose must overwrite the old scores (the Iter 135 fix)."""
    async def first(email):
        return [{"assessed_at": "2026-01-01T10:00:00+00:00", "ki_score": 40,
                 "rhetoric_score": 40, "eq_score": 40, "composite_score": 40}]

    async def second(email):
        return [{"assessed_at": "2026-08-13T10:00:00+00:00", "ki_score": 90,
                 "rhetoric_score": 90, "eq_score": 90, "composite_score": 90}]

    monkeypatch.setattr(autosync, "_fetch_supabase_insights", first)
    run(autosync.auto_sync_wladhub_on_signup("user_failtest_4", "fail4@test.local"))
    monkeypatch.setattr(autosync, "_fetch_supabase_insights", second)
    run(autosync.auto_sync_wladhub_on_signup("user_failtest_4", "fail4@test.local"))
    diag = run(db.wladhub_diagnoses.find_one({"user_id": "user_failtest_4"}, {"_id": 0}))
    assert diag["overall_score"] == 90
    assert run(db.wladhub_diagnoses.count_documents({"user_id": "user_failtest_4"})) == 1
    _cleanup("user_failtest_4")


def test_paid_but_unconfirmed_payment_is_activated_on_login(monkeypatch):
    """Buyer paid, session expired before the success page polled → login fixes it."""
    import routes.payments as payments

    uid = "user_reconcile_test"
    run(db.payment_transactions.delete_many({"user_id": uid}))
    run(db.payment_transactions.insert_one({
        "session_id": "cs_test_reconcile_1",
        "user_id": uid,
        "user_email": "reconcile@test.local",
        "package_id": "leadership_os_1eur_test",
        "package_name": "Leadership OS · Live-Test (1€)",
        "tier": "standard",
        "amount": 1.0,
        "currency": "eur",
        "payment_status": "pending",
        "status": "open",
        "created_at": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc).isoformat(),
    }))

    class FakeSession:
        id = "cs_test_reconcile_1"
        payment_status = "paid"
        status = "complete"
        payment_intent = "pi_fake_1"
        invoice = None

    activated = {}

    async def fake_activate(user_id, package_id):
        activated["user_id"] = user_id
        activated["package_id"] = package_id

    monkeypatch.setattr(payments.stripe.checkout.Session, "retrieve",
                        staticmethod(lambda *a, **kw: FakeSession()))
    monkeypatch.setattr(payments, "_activate_from_package", fake_activate)

    n = run(payments.reconcile_pending_payments(uid))
    assert n == 1
    assert activated == {"user_id": uid, "package_id": "leadership_os_1eur_test"}

    tx = run(db.payment_transactions.find_one({"session_id": "cs_test_reconcile_1"}, {"_id": 0}))
    assert tx["payment_status"] == "paid" and tx["reconciled"] is True

    # Idempotent: a second run must not activate again.
    activated.clear()
    assert run(payments.reconcile_pending_payments(uid)) == 0
    assert activated == {}

    run(db.payment_transactions.delete_many({"user_id": uid}))
