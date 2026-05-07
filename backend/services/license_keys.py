"""License-key utilities — generation only.
DB writes & email dispatch live in route handlers (which have DB & config).
"""
import secrets
import string
from datetime import datetime, timezone, timedelta


PLAN_CONFIG = {
    "leader_os": {"name": "Leadership OS — 1 Jahr Vollzugang + 12 Videokurse", "duration_days": 365, "includes_calls": False},
    "leader_os_plus": {"name": "Leadership OS PLUS — 1 Jahr inkl. 12 Einzelcoachings", "duration_days": 365, "includes_calls": True},
    "leader_os_enterprise": {"name": "Leadership OS ENTERPRISE — B2B-Lizenz", "duration_days": 365, "includes_calls": False},
    # Legacy support — DO NOT introduce new plans here. Use `leader_os_*` for any new tier.
    "starter": {"name": "Starter – Video Lessons + Credits", "duration_days": 365, "includes_calls": False},
    "standard": {"name": "Leadership OS — 1 Jahr Vollzugang", "duration_days": 365, "includes_calls": False},
    "fasttrack": {"name": "Fast Track – Leadership Accelerator", "duration_days": 365, "includes_calls": True},
}


PLAN_AMOUNT_MAP = {
    "leader_os": 997.0,
    "leader_os_plus": 4447.0,
    "leader_os_enterprise": 997.0,
    "fasttrack": 6970.0,
    "standard": 997.0,
    "starter": 199.0,
}


def generate_key() -> str:
    """Generate a license key in WLADHUB-XXXX-XXXX-XXXX format."""
    chunks = ["".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4)) for _ in range(3)]
    return f"WLADHUB-{'-'.join(chunks)}"


def build_license_doc(plan: str, email: str = "", name: str = "", source: str = "manual", notes: str = "") -> dict:
    """Build a license_key DB doc (does not insert)."""
    config = PLAN_CONFIG.get(plan) or PLAN_CONFIG["leader_os"]
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
