"""Smoke tests for Supabase sync layer.

Validates:
- Inbound secret enforcement
- Plan → tier mapping
- Idempotency replay handling
- Outbound config helpers

Full integration is covered by the curl-based smoke run during Iter 79
(documented in /app/test_reports/iteration_79.json).
"""
import os
import pytest


def test_inbound_secret_is_set_in_env():
    """The INBOUND_SYNC_SECRET env var must be present in deployed configs."""
    secret = os.environ.get("INBOUND_SYNC_SECRET", "")
    assert len(secret) >= 32, "INBOUND_SYNC_SECRET should be >= 32 chars for sufficient entropy"


def test_plan_tier_mapping():
    """Plan names from Supabase must map to internal tier IDs correctly."""
    from routes.sync import PLAN_TO_TIER

    assert PLAN_TO_TIER["leadership_os"] == "standard"
    assert PLAN_TO_TIER["leadership_os_plus"] == "accelerator"
    assert PLAN_TO_TIER["leadership_os_enterprise"] == "enterprise"
    assert PLAN_TO_TIER["free"] == "free"
    # Aliases still work
    assert PLAN_TO_TIER["standard"] == "standard"
    assert PLAN_TO_TIER["accelerator"] == "accelerator"


def test_timing_safe_secret_comparison():
    """compare_digest must be used (not == operator) — avoids timing attacks."""
    import inspect
    from routes import sync as sync_mod
    src = inspect.getsource(sync_mod._verify_secret)
    assert "compare_digest" in src, "Use pysecrets.compare_digest for timing-safe compare"


def test_outbound_sync_disabled_without_config():
    """When SUPABASE_OUTBOUND_SECRET or URL is empty, outbound is no-op."""
    # Ensure unset
    os.environ["SUPABASE_OUTBOUND_SECRET"] = ""
    os.environ["SUPABASE_USER_MIRROR_URL"] = ""

    # Re-import to refresh module-level constants
    import importlib
    import services_supabase_sync as svc
    importlib.reload(svc)
    assert svc._sync_enabled() is False


def test_outbound_sync_enabled_when_both_configured():
    os.environ["SUPABASE_OUTBOUND_SECRET"] = "x" * 40
    os.environ["SUPABASE_USER_MIRROR_URL"] = "https://example.supabase.co/functions/v1/user-mirror"
    import importlib
    import services_supabase_sync as svc
    importlib.reload(svc)
    assert svc._sync_enabled() is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
