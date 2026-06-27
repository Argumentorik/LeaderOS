"""Iteration 35 — Final Pre-Deploy verification.

Covers:
1. Stripe deprecated subscription_data[cancel_at] FIX:
   - POST /api/payments/create-checkout for ALL 5 packages returns 200 + cs_live_ URL
   - Specifically the 3 subscription packages (leader_os_2rate, leader_os_12rate,
     leader_os_plus_3rate) must NOT 500 anymore.
2. Helper _apply_subscription_cancel_at is importable from routes.payments and
   is idempotent (no exception on missing sub_id / unknown subscription).
3. _create_subscription_session uses sub_metadata.cancel_at_ts (NOT
   subscription_data[cancel_at] kwarg).
4. Score-Cap @ 85: calculate_category_scores with all-4s Likert -> total_avg==85,
   with all-3s -> total_avg==75 unchanged.
5. Static assets: /wlad-portrait.png, /leaderos-logo-dark.png, /leaderos-mark.png
   served with image/png.
6. ADMIN_PASSWORD env enforcement (no hardcoded creds).
"""
from __future__ import annotations

import inspect
import os
import sys
import pytest
import requests


def _load_backend_url() -> str:
    val = os.environ.get("REACT_APP_BACKEND_URL", "").strip().rstrip("/")
    if val:
        return val
    with open("/app/frontend/.env") as f:
        for line in f:
            line = line.strip()
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")


BASE_URL = _load_backend_url()
sys.path.insert(0, "/app/backend")


# -------------------- 1. Stripe 5-package checkout (NO 500) --------------------

class TestStripeAllFivePackages:
    """All 5 packages must return 200 + a Stripe checkout URL."""

    PACKAGES = [
        "leader_os_full",
        "leader_os_2rate",
        "leader_os_12rate",
        "leader_os_plus",
        "leader_os_plus_3rate",
    ]

    @pytest.mark.parametrize("package_id", PACKAGES)
    def test_create_checkout_returns_200(self, package_id):
        payload = {"package_id": package_id, "origin_url": BASE_URL}
        r = requests.post(
            f"{BASE_URL}/api/payments/create-checkout", json=payload, timeout=30
        )
        assert r.status_code == 200, (
            f"{package_id}: HTTP {r.status_code} {r.text}"
        )
        data = r.json()
        assert "url" in data and data["url"].startswith("https://checkout.stripe.com"), (
            f"{package_id}: bad url {data}"
        )
        # LIVE Stripe mode (per .env) - both subscription + one-time sessions return cs_live_
        url = data["url"]
        sid = data.get("session_id", "")
        assert "cs_live_" in url or sid.startswith("cs_live_"), (
            f"{package_id}: NOT in LIVE mode, url={url} sid={sid}"
        )

    def test_subscription_packages_do_not_500(self):
        """Regression: 2026 Stripe deprecated subscription_data[cancel_at].
        These 3 packages were previously returning 500 — must be 200 now."""
        for pid in ("leader_os_2rate", "leader_os_12rate", "leader_os_plus_3rate"):
            r = requests.post(
                f"{BASE_URL}/api/payments/create-checkout",
                json={"package_id": pid, "origin_url": BASE_URL},
                timeout=30,
            )
            assert r.status_code != 500, (
                f"{pid} REGRESSED to 500: {r.text}"
            )
            assert r.status_code == 200, f"{pid}: {r.status_code} {r.text}"


# -------------------- 2. Helper Import + Source Inspection --------------------

class TestCancelAtHelperExists:
    def test_helper_importable(self):
        from routes.payments import _apply_subscription_cancel_at  # noqa: F401
        assert callable(_apply_subscription_cancel_at)

    def test_helper_is_async(self):
        import asyncio
        from routes.payments import _apply_subscription_cancel_at
        assert asyncio.iscoroutinefunction(_apply_subscription_cancel_at), (
            "Helper must be async (called via await from /payments/status)"
        )

    def test_helper_idempotent_on_empty_sub_id(self):
        import asyncio
        from routes.payments import _apply_subscription_cancel_at
        # Empty / None sub_id must early-return without exception
        asyncio.get_event_loop().run_until_complete(_apply_subscription_cancel_at(""))
        asyncio.get_event_loop().run_until_complete(_apply_subscription_cancel_at(None))

    def test_create_subscription_session_no_cancel_at_kwarg(self):
        """_create_subscription_session source must NOT pass cancel_at via
        subscription_data{...} kwarg (deprecated). Must use sub_metadata.cancel_at_ts."""
        from routes.payments import _create_subscription_session
        src = inspect.getsource(_create_subscription_session)
        # The deprecated pattern would be: subscription_data={"cancel_at": ...
        # Acceptable: subscription_data={"metadata": sub_metadata}
        assert "subscription_data={\"cancel_at\"" not in src and \
               "'cancel_at':" not in src.replace("cancel_at_ts", ""), (
            "Found deprecated subscription_data[cancel_at] kwarg in source"
        )
        assert "cancel_at_ts" in src, "Missing cancel_at_ts stash in metadata"

    def test_get_payment_status_calls_apply_helper(self):
        """The /payments/status/{session_id} route must call _apply_subscription_cancel_at."""
        from routes import payments as pm
        src = inspect.getsource(pm)
        assert "_apply_subscription_cancel_at(session.subscription)" in src or \
               "_apply_subscription_cancel_at(session.subscription," in src, (
            "get_payment_status does NOT call _apply_subscription_cancel_at"
        )


# -------------------- 3. Score-Cap @ 85 --------------------

class TestScoreCap:
    def _make_answers(self, score: int):
        from models import QuizAnswer
        cats = ["rhetorik", "fuehrung", "eq", "kritisches_denken", "entscheidung", "strategie"]
        layers = ["ai_literacy", "rhetoric", "strategic_eq"]
        out = []
        for i, cat in enumerate(cats):
            for j, layer in enumerate(layers):
                out.append(QuizAnswer(
                    question_id=f"q{i*3+j+1}", category=cat, layer=layer, score=score
                ))
        return out

    def test_all_fours_capped_at_85(self):
        from routes.quiz import calculate_category_scores
        cat_avg, layer_avg, total_avg = calculate_category_scores(self._make_answers(4))
        assert total_avg == 85, f"all-4s should cap at 85, got {total_avg}"
        for k, v in cat_avg.items():
            assert v <= 85, f"cat {k}={v} exceeds 85"

    def test_all_threes_unchanged_at_75(self):
        from routes.quiz import calculate_category_scores
        cat_avg, layer_avg, total_avg = calculate_category_scores(self._make_answers(3))
        assert total_avg == 75, f"all-3s should be 75, got {total_avg}"


# -------------------- 4. Static Assets --------------------

class TestStaticAssets:
    ASSETS = [
        "/wlad-portrait.png",
        "/leaderos-logo-dark.png",
        "/leaderos-mark.png",
    ]

    @pytest.mark.parametrize("path", ASSETS)
    def test_asset_served_as_png(self, path):
        r = requests.get(f"{BASE_URL}{path}", timeout=15)
        assert r.status_code == 200, f"{path}: {r.status_code}"
        ctype = r.headers.get("content-type", "")
        assert "image/png" in ctype.lower(), f"{path}: bad ctype={ctype}"
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n", f"{path}: not a valid PNG"


# -------------------- 5. ADMIN_PASSWORD env enforcement --------------------

class TestNoHardcodedAdminPassword:
    FILES = [
        "/app/backend/tests/test_iter32_resend_live.py",
        "/app/backend/tests/test_iter33_golive_final.py",
    ]

    @pytest.mark.parametrize("path", FILES)
    def test_no_hardcoded_password(self, path):
        with open(path) as f:
            content = f.read()
        assert "wladhub2026" not in content, (
            f"{path} STILL contains hardcoded 'wladhub2026'"
        )
        assert "os.environ.get(\"ADMIN_PASSWORD\"" in content or \
               "os.environ.get('ADMIN_PASSWORD'" in content, (
            f"{path} must read ADMIN_PASSWORD from env"
        )
        assert "pytest.skip" in content, (
            f"{path} must skip when ADMIN_PASSWORD missing"
        )
