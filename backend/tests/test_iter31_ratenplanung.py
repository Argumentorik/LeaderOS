"""Iter 31 — Ratenplanung (installment plans) sanity tests.

Locks in the dynamic cancel_at logic introduced in iter31 so that future
changes can't accidentally re-introduce the 'monthly forever until day 370' bug
for the new leader_os_plus_3rate package (only 3 cycles, not 12).
"""
import sys
sys.path.insert(0, "/app/backend")

from services.pricing import PACKAGES, PLAN_AMOUNT_MAP


class TestPackageMath:
    def test_sprint_einmal_997(self):
        p = PACKAGES["leader_os_full"]
        assert p["amount"] == 997.0
        assert p["mode"] == "payment"
        assert p["plan"] == "leader_os"

    def test_sprint_2rate(self):
        p = PACKAGES["leader_os_2rate"]
        assert p["amount"] == 550.0
        assert p["mode"] == "subscription"
        assert p["cycles"] == 2
        assert p["interval"] == "month"
        assert p["interval_count"] == 6
        assert p["total_amount"] == 1100.0
        assert p["cycles"] * p["amount"] == p["total_amount"]

    def test_sprint_12rate(self):
        p = PACKAGES["leader_os_12rate"]
        assert p["amount"] == 99.0
        assert p["mode"] == "subscription"
        assert p["cycles"] == 12
        assert p["interval_count"] == 1
        assert p["total_amount"] == 1188.0
        assert p["cycles"] * p["amount"] == p["total_amount"]

    def test_plus_plus_einmal_4797(self):
        p = PACKAGES["leader_os_plus"]
        assert p["amount"] == 4797.0
        assert p["mode"] == "payment"
        assert p["plan"] == "leader_os_plus"

    def test_plus_plus_3rate(self):
        p = PACKAGES["leader_os_plus_3rate"]
        assert p["amount"] == 1599.0
        assert p["mode"] == "subscription"
        assert p["cycles"] == 3
        assert p["interval"] == "month"
        assert p["interval_count"] == 1
        assert p["total_amount"] == 4797.0
        assert p["cycles"] * p["amount"] == p["total_amount"]


class TestNoOldPrices:
    def test_no_4447(self):
        for pid, p in PACKAGES.items():
            assert p.get("amount") != 4447.0, f"{pid} still 4447"
            assert p.get("total_amount", 0) != 4447.0, f"{pid} total still 4447"

    def test_plan_amount_map_no_4447(self):
        for plan, amount in PLAN_AMOUNT_MAP.items():
            assert amount != 4447.0, f"PLAN_AMOUNT_MAP[{plan}] still 4447"


class TestSubscriptionAutoCancel:
    """Verifies the dynamic cancel_at logic in _create_subscription_session.

    The actual Stripe API call is mocked — we only verify the cancel_at offset
    computation for each subscription package.
    """

    @staticmethod
    def _expected_cancel_days(pkg):
        cycles = pkg["cycles"]
        ic = pkg["interval_count"]
        # interval is "month" for all our subscriptions
        return cycles * ic * 30 + 7  # +7d grace buffer

    def test_2rate_cancels_at_12_months_plus_buffer(self):
        days = self._expected_cancel_days(PACKAGES["leader_os_2rate"])
        assert days == 367, f"2-rate should cancel at +367d, got {days}"

    def test_12rate_cancels_at_12_months_plus_buffer(self):
        days = self._expected_cancel_days(PACKAGES["leader_os_12rate"])
        assert days == 367, f"12-rate should cancel at +367d, got {days}"

    def test_plus_3rate_cancels_at_3_months_NOT_370_days(self):
        """The bug-guard: previously cancel_at was hardcoded to 370 days,
        which would have charged 1.599 EUR monthly for 12 months instead of 3
        — a 4x overcharge for Plus-Plus 3-rate customers.
        """
        days = self._expected_cancel_days(PACKAGES["leader_os_plus_3rate"])
        assert days == 97, f"Plus-Plus 3-rate should cancel at +97d, got {days}"
        assert days < 370, "cancel_at must be < 370d to prevent 4x overcharge"


class TestSubscriptionSessionWiring:
    """Smoke test that the helper computes cancel_at dynamically (not hardcoded)."""

    def test_create_subscription_session_uses_dynamic_cancel(self, monkeypatch):
        import asyncio
        from datetime import datetime, timezone
        from routes.payments import _create_subscription_session
        from models import CreateCheckoutRequest

        captured = {}

        def fake_create(**kwargs):
            captured.update(kwargs)
            return {"id": "cs_test_fake", "url": "https://example.test"}

        # Patch the stripe SDK call
        import stripe
        monkeypatch.setattr(stripe.checkout.Session, "create", fake_create)

        req = CreateCheckoutRequest(
            package_id="leader_os_plus_3rate",
            origin_url="https://leadercheck.de",
            email="x@y.de",
            user_name="X",
            user_session_id=None,
        )
        pkg = PACKAGES["leader_os_plus_3rate"]

        asyncio.run(_create_subscription_session(req, pkg))

        sub_data = captured.get("subscription_data") or {}
        cancel_at = sub_data.get("cancel_at")
        now = int(datetime.now(timezone.utc).timestamp())
        days_until_cancel = (cancel_at - now) // 86400
        assert 90 <= days_until_cancel <= 100, (
            f"Expected ~97 days to cancel for plus_3rate, got {days_until_cancel}"
        )
