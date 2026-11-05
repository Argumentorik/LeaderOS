"""License-key utilities — generation only.
Plan/pricing metadata lives in `services.pricing` (single source of truth).
"""
import secrets
import string
from datetime import datetime, timezone, timedelta

from services.pricing import PLAN_CONFIG, PLAN_AMOUNT_MAP, get_plan_config

# Re-export for backward compatibility (existing imports keep working)
__all__ = ["PLAN_CONFIG", "PLAN_AMOUNT_MAP", "generate_key", "build_license_doc"]


def generate_key() -> str:
    """Generate a license key in LEADEROS-XXXX-XXXX-XXXX format.

    Note: prefix evolved over time (WLAD- → WLADHUB- → LEADEROS-).
    Legacy keys are still accepted at activation time via direct DB lookup.
    """
    chunks = ["".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4)) for _ in range(3)]
    return f"LEADEROS-{'-'.join(chunks)}"


def build_license_doc(plan: str, email: str = "", name: str = "", source: str = "manual", notes: str = "") -> dict:
    """Build a license_key DB doc (does not insert)."""
    config = get_plan_config(plan)
    return {
        "key": generate_key(),
        "plan": plan,
        "plan_name": config["name"],
        "duration_days": config["duration_days"],
        "includes_calls": config["includes_calls"],
        "email": email or "",
        "name": name or "",
        "source": source,
        "notes": notes or "",
        "status": "active",
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=config["duration_days"])).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
