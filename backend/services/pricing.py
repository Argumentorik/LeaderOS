"""Single source of truth for ALL pricing & plan metadata.

Both `routes/payments.py` (PACKAGES) and `services/license_keys.py`
(PLAN_AMOUNT_MAP, PLAN_CONFIG) re-export from this module.

Frontend equivalents live in `/app/frontend/src/components/pricing/pricingConstants.js`
— keep both files in sync when adjusting prices.
"""
from typing import TypedDict, Optional


class PlanConfig(TypedDict):
    name: str
    duration_days: int
    includes_calls: bool


class PackageConfig(TypedDict, total=False):
    name: str
    amount: float
    currency: str
    plan: str
    billing: str
    mode: str  # "payment" or "subscription"
    interval: str
    interval_count: int
    cycles: int
    total_amount: float


# === Plan metadata (used by license keys + payment confirmation emails) ===

PLAN_CONFIG: dict[str, PlanConfig] = {
    "leader_os": {
        "name": "Leadership OS — 1 Jahr Vollzugang + 12 Videokurse",
        "duration_days": 365, "includes_calls": False,
    },
    "leader_os_plus": {
        "name": "Leadership OS PLUS — 1 Jahr inkl. 12 Einzelcoachings",
        "duration_days": 365, "includes_calls": True,
    },
    "leader_os_enterprise": {
        "name": "Leadership OS ENTERPRISE — B2B-Lizenz",
        "duration_days": 365, "includes_calls": False,
    },
    # Legacy support — DO NOT introduce new plans here.
    "starter": {"name": "Starter – Video Lessons + Credits", "duration_days": 365, "includes_calls": False},
    "standard": {"name": "Leadership OS — 1 Jahr Vollzugang", "duration_days": 365, "includes_calls": False},
    "fasttrack": {"name": "Fast Track – Leadership Accelerator", "duration_days": 365, "includes_calls": True},
}


# === Stripe Checkout package catalog ===

PACKAGES: dict[str, PackageConfig] = {
    "leader_os_full": {
        "name": "Leadership OS — Einmalzahlung",
        "amount": 997.00, "currency": "eur", "plan": "leader_os",
        "billing": "one_time", "mode": "payment",
    },
    "leader_os_2rate": {
        "name": "Leadership OS — 2 Raten à 550 EUR",
        "amount": 550.00, "currency": "eur", "plan": "leader_os",
        "billing": "2_rates", "mode": "subscription",
        "interval": "month", "interval_count": 6, "cycles": 2,
        "total_amount": 1100.00,
    },
    "leader_os_12rate": {
        "name": "Leadership OS — 12 Monatsraten à 99 EUR",
        "amount": 99.00, "currency": "eur", "plan": "leader_os",
        "billing": "12_rates", "mode": "subscription",
        "interval": "month", "interval_count": 1, "cycles": 12,
        "total_amount": 1188.00,
    },
    "leader_os_plus": {
        "name": "Leadership OS PLUS — inkl. 12 Coachings",
        "amount": 4447.00, "currency": "eur", "plan": "leader_os_plus",
        "billing": "one_time", "mode": "payment",
    },
    # Legacy alias — points to leader_os
    "standard_yearly": {
        "name": "Leadership OS — Einmalzahlung",
        "amount": 997.00, "currency": "eur", "plan": "leader_os",
        "billing": "one_time", "mode": "payment",
    },
}


# === Plan → upfront amount mapping (used by license-key confirmation emails) ===
# Derived from PACKAGES (using total_amount where available) + Enterprise default seat price.

def _build_plan_amount_map() -> dict[str, float]:
    """Map plan → upfront list price (used in confirmation emails).

    Uses the *base* one-time amount per plan, not the highest installment total,
    so customers see the headline sticker price they recognize from the website.
    """
    out: dict[str, float] = {}
    for pkg in PACKAGES.values():
        if pkg.get("mode") == "payment":  # only pure one-time packages set the headline price
            plan = pkg["plan"]
            if plan not in out:
                out[plan] = pkg["amount"]
    out.setdefault("leader_os_enterprise", 997.0)  # Per-seat list price
    # Legacy aliases
    out.setdefault("standard", 997.0)
    out.setdefault("starter", 199.0)
    out.setdefault("fasttrack", 6970.0)
    return out


PLAN_AMOUNT_MAP: dict[str, float] = _build_plan_amount_map()


# === Helpers ===

def get_plan_config(plan: str) -> PlanConfig:
    """Return plan metadata, falling back to leader_os if unknown."""
    return PLAN_CONFIG.get(plan, PLAN_CONFIG["leader_os"])


def get_package(package_id: str) -> Optional[PackageConfig]:
    """Lookup a package by id; returns None if unknown."""
    return PACKAGES.get(package_id)


def get_amount_for_plan(plan: str) -> float:
    """Resolve the upfront amount displayed in confirmation emails."""
    return PLAN_AMOUNT_MAP.get(plan, 997.0)
