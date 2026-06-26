"""Tier/subscription service — handles tier access, expiration, feature gating."""
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException

from config import db

# ── Canonical tier definitions (synced with leaderos.de pricing page) ─────────

TIER_CONFIG = {
    "free": {
        "name": "Free",
        "price_eur": 0,
        "duration_days": None,  # lifetime
        "badge_color": "#64748B",
        "features": {
            "ai_coach": False,
            "challenge_30_week1": True,   # free gets weeks 1-2 (14 days)
            "challenge_30_free_weeks": 2,
            "challenge_30_full": False,
            "video_analysis": False,
            "video_missions": False,
            "workflows": False,
            "playbooks": False,
            "simulations": True,           # limited
            "one_on_one_calls": 0,
            "mastermind": False,
            "priority_support": False,
            "credits_monthly": 10,
            "video_courses_drip": 0,
        },
    },
    # Leadership OS — €997/Jahr, 30-Tage Money-Back, 12 Videokurse drip-released monthly.
    "standard": {
        "name": "Leadership OS",
        "price_eur": 997.00,
        "duration_days": 365,            # 1 year
        "trial_days": 30,                # money-back guarantee
        "badge_color": "#BFFF00",
        "video_courses_total": 12,       # drip 1/month, value 199€/each = 2.388€
        "video_drip_interval_days": 30,
        # Installment plans for Leadership OS
        "installment_plans": [
            {"id": "leadership_os_2x", "count": 2, "amount_per": 550.00, "total": 1100.00},
            {"id": "leadership_os_12x", "count": 12, "amount_per": 99.00, "total": 1188.00},
        ],
        "features": {
            "ai_coach": True,
            "challenge_30_week1": True,
            "challenge_30_full": True,
            "video_analysis": False,       # PLUS only
            "video_missions": False,       # PLUS only
            "workflows": True,
            "playbooks": True,
            "simulations": True,
            "one_on_one_calls": 0,
            "mastermind": False,
            "priority_support": False,
            "credits_monthly": 500,
            "video_lessons": True,
            "video_courses_drip": 12,
            "leadership_report_pdf": True,
            "free_book_pdf": True,
            "ai_leadership_community": True,
            "personalized_journey": True,
            "license_key_email": True,
        },
    },
    # Leadership OS PLUS — €4.797/Jahr, alles aus OS + 12 Einzelcoachings (12 × 299€ = 3.588€).
    "accelerator": {
        "name": "Leadership OS PLUS",
        "price_eur": 4797.00,
        "duration_days": 365,             # 1 year
        "trial_days": 30,
        "badge_color": "#BFFF00",
        "video_courses_total": 12,
        "coaching_calls_total": 12,       # 12 × 299€ Einzelcoachings mit Argumentorik-Coaches
        "coaching_call_value_eur": 299.00,
        "features": {
            "ai_coach": True,
            "challenge_30_week1": True,
            "challenge_30_full": True,
            "video_analysis": True,        # PLUS exclusive
            "video_missions": True,        # PLUS exclusive
            "workflows": True,
            "playbooks": True,
            "simulations": True,
            "one_on_one_calls": 12,        # 12 Einzelcoachings im Jahr
            "mastermind": True,
            "priority_support": True,
            "credits_monthly": -1,         # unlimited
            "video_lessons": True,
            "video_courses_drip": 12,
            "leadership_report_pdf": True,
            "free_book_pdf": True,
            "ai_leadership_community": True,
            "personalized_journey": True,
            "license_key_email": True,
            "ai_learning_path": True,
            "ai_integrity_consultation": True,
            "personal_onboarding_call": True,
            "quarterly_reviews": True,
            "closing_call_strategy": True,
        },
    },
    # Leadership OS Enterprise — B2B, quote-based, volume-discount on €997 base price.
    "enterprise": {
        "name": "Leadership OS Enterprise",
        "price_eur": None,                 # quote-based
        "duration_days": 365,
        "is_quote_based": True,
        "badge_color": "#BFFF00",
        "base_price_eur": 997.00,          # per seat before discount
        # Volume discounts on base price (5% → 50% based on team size)
        "volume_discount_tiers": [
            {"min_seats": 5,   "discount": 0.10},
            {"min_seats": 10,  "discount": 0.15},
            {"min_seats": 20,  "discount": 0.20},
            {"min_seats": 50,  "discount": 0.30},
            {"min_seats": 100, "discount": 0.40},
            {"min_seats": 200, "discount": 0.50},
        ],
        "features": {
            "ai_coach": True,
            "challenge_30_full": True,
            "video_analysis": False,
            "video_missions": False,
            "workflows": True,
            "playbooks": True,
            "simulations": True,
            "one_on_one_calls": 0,
            "mastermind": True,
            "priority_support": True,
            "credits_monthly": 500,
            "video_lessons": True,
            "video_courses_drip": 12,
            "leadership_report_pdf": True,
            "free_book_pdf": True,
            "team_dashboard": True,
            "team_admin": True,
            "sso_optional": True,
        },
    },
}


def calc_enterprise_quote(seats: int) -> dict:
    """Calculate Enterprise price for a given seat count using volume-discount tiers.

    Returns dict with: seats, base_price_per_seat, discount_pct, price_per_seat,
    total_price, total_savings.
    """
    cfg = TIER_CONFIG["enterprise"]
    base = cfg["base_price_eur"]
    # Find the highest applicable discount
    discount = 0.0
    for t in sorted(cfg["volume_discount_tiers"], key=lambda x: x["min_seats"]):
        if seats >= t["min_seats"]:
            discount = t["discount"]
    price_per_seat = round(base * (1 - discount), 2)
    total = round(price_per_seat * seats, 2)
    savings = round((base - price_per_seat) * seats, 2)
    return {
        "seats": seats,
        "base_price_per_seat": base,
        "discount_pct": int(discount * 100),
        "price_per_seat": price_per_seat,
        "total_price": total,
        "total_savings": savings,
    }


def get_tier_features(tier: str) -> dict:
    return TIER_CONFIG.get(tier, TIER_CONFIG["free"])["features"]


def _normalize_tier_name(user: dict) -> str:
    """Resolve user's tier name with legacy-field fallback."""
    tier = user.get("tier", "free")
    if user.get("premium") and tier == "free":
        tier = user.get("premium_package") or "accelerator"
    # Legacy aliases → canonical
    if tier in ("fast_track", "starter"):
        # Old "starter" tier discontinued — map to free; fast_track legacy → accelerator
        tier = "free" if tier == "starter" else "accelerator"
    return tier if tier in TIER_CONFIG else "free"


def _compute_expiry_status(tier: str, cfg: dict, expires_at) -> tuple[int | None, bool, bool]:
    """Return (days_remaining, active, in_grace_period) for a tier's expiry."""
    if tier == "free" or not cfg.get("duration_days") or not expires_at:
        return None, True, False
    try:
        exp_dt = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
        if exp_dt.tzinfo is None:
            exp_dt = exp_dt.replace(tzinfo=timezone.utc)
        days_remaining = int((exp_dt - datetime.now(timezone.utc)).total_seconds() // 86400)
    except Exception:
        return None, True, False

    if days_remaining >= 0:
        return days_remaining, True, False
    # Grace period: 30 days after expiry
    in_grace = days_remaining > -30
    return days_remaining, in_grace, in_grace


async def _fetch_installment_info(user_id: str) -> dict | None:
    """Return active installment plan summary, or None."""
    plan = await db.installment_plans.find_one({"user_id": user_id, "active": True}, {"_id": 0})
    if not plan:
        return None
    return {
        "plan_id": plan.get("plan_id", "leadership_os_12x"),
        "installments_paid": plan.get("installments_paid", 0),
        "installments_total": plan.get("installments_total", 12),
        "next_due_date": plan.get("next_due_date"),
        "amount_per_installment": plan.get("amount_per_installment", 99.00),
    }


async def resolve_user_tier(user: dict) -> dict:
    """Return live tier info for a user with expiration awareness.

    Returns: {tier, tier_name, active, expires_at, days_remaining,
              in_grace_period, installment_info, features}
    """
    tier = _normalize_tier_name(user)
    cfg = TIER_CONFIG[tier]
    expires_at = user.get("tier_expires_at") or user.get("premium_expires_at")
    days_remaining, active, in_grace = _compute_expiry_status(tier, cfg, expires_at)

    # If tier expired hard → treat as free
    effective_tier = tier if active else "free"
    effective_cfg = TIER_CONFIG[effective_tier]

    installment_info = await _fetch_installment_info(user["user_id"]) if tier in ("standard", "accelerator") else None

    return {
        "tier": effective_tier,
        "raw_tier": tier,
        "tier_name": effective_cfg["name"],
        "active": active,
        "in_grace_period": in_grace,
        "expires_at": expires_at,
        "days_remaining": days_remaining,
        "badge_color": effective_cfg["badge_color"],
        "installment_info": installment_info,
        "features": effective_cfg["features"],
    }


async def require_feature(user: dict, feature_key: str):
    """Raise 402 if user's effective tier doesn't have this feature."""
    info = await resolve_user_tier(user)
    features = info["features"]
    val = features.get(feature_key)
    if not val:
        required_tier = "accelerator"
        # Find lowest tier with this feature
        for t in ["standard", "accelerator"]:
            if TIER_CONFIG[t]["features"].get(feature_key):
                required_tier = t
                break
        raise HTTPException(
            status_code=402,
            detail={
                "error": "tier_required",
                "feature": feature_key,
                "current_tier": info["tier"],
                "required_tier": required_tier,
                "upgrade_url": "/coaching",
                "message": f"Dieses Feature ist exklusiv für {TIER_CONFIG[required_tier]['name']}.",
            },
        )


async def activate_tier(user_id: str, tier: str, via_installment: bool = False, installment_plan_id: str | None = None):
    """Activate a tier for a user. Sets expiration based on tier config.

    For installment payments, pass `installment_plan_id` (e.g. 'leadership_os_2x',
    'leadership_os_12x') so the right installment_plans row is created.
    """
    if tier not in TIER_CONFIG:
        raise ValueError(f"Invalid tier: {tier}")

    # Capture the prior tier so we can fire CRM events with from/to detail
    prior = await db.users.find_one({"user_id": user_id}, {"_id": 0, "tier": 1, "email": 1, "name": 1})
    prior_tier = (prior or {}).get("tier", "free")

    cfg = TIER_CONFIG[tier]
    now = datetime.now(timezone.utc)
    expires_at = None
    if cfg.get("duration_days"):
        expires_at = (now + timedelta(days=cfg["duration_days"])).isoformat()

    update = {
        "tier": tier,
        "tier_activated_at": now.isoformat(),
        "premium": tier in ("standard", "accelerator", "enterprise"),
        "premium_package": tier,
    }
    if expires_at:
        update["tier_expires_at"] = expires_at
        update["premium_expires_at"] = expires_at

    await db.users.update_one({"user_id": user_id}, {"$set": update})

    # On Standard tier (€997 leadership_os) purchase → grant Video-Trial bonus
    # (resets used to 0 + 2 extra analyses, idempotent so refund-rebuy doesn't stack).
    if tier == "standard":
        try:
            from services_video_trial import grant_standard_purchase_bonus
            await grant_standard_purchase_bonus(user_id)
        except Exception as e:
            # Non-fatal — log and continue. Tier activation must succeed even if bonus fails.
            import logging
            logging.getLogger("leader-os.tier").warning(
                "video_trial bonus grant failed for %s: %s", user_id, e
            )

    # Credit balance
    monthly = cfg["features"].get("credits_monthly", 0)
    await db.credits.update_one(
        {"user_id": user_id},
        {"$set": {
            "balance": -1 if monthly == -1 else monthly,
            "is_premium": tier in ("standard", "accelerator", "enterprise"),
            "monthly_allocation": monthly,
            "last_refill_at": now.isoformat(),
        }},
        upsert=True,
    )

    # Initialize video-course drip schedule for paid tiers
    drip_total = cfg["features"].get("video_courses_drip", 0)
    if drip_total:
        await db.video_drip_schedule.update_one(
            {"user_id": user_id},
            {"$set": {
                "user_id": user_id,
                "tier": tier,
                "total_courses": drip_total,
                "interval_days": cfg.get("video_drip_interval_days", 30),
                "started_at": now.isoformat(),
            }},
            upsert=True,
        )

    # Installment plan
    if via_installment and tier == "standard":
        plan_def = next(
            (p for p in cfg.get("installment_plans", []) if p["id"] == installment_plan_id),
            None,
        )
        if plan_def is None and cfg.get("installment_plans"):
            # Default to 12× plan if id not specified
            plan_def = cfg["installment_plans"][-1]
        if plan_def:
            await db.installment_plans.update_one(
                {"user_id": user_id},
                {"$set": {
                    "user_id": user_id,
                    "active": True,
                    "plan_id": plan_def["id"],
                    "installments_total": plan_def["count"],
                    "installments_paid": 1,
                    "amount_per_installment": plan_def["amount_per"],
                    "total_amount": plan_def["total"],
                    "next_due_date": (now + timedelta(days=30)).isoformat(),
                    "started_at": now.isoformat(),
                }},
                upsert=True,
            )

    # Iter 92.18: CRM webhook — let Wingman (or any wired CRM) know about the tier change
    try:
        import services_crm
        crm_user = {
            "user_id": user_id,
            "email": (prior or {}).get("email"),
            "name": (prior or {}).get("name"),
            "tier": tier,
        }
        services_crm.tier_changed(
            crm_user,
            from_tier=prior_tier,
            to_tier=tier,
            reason="installment" if via_installment else "checkout",
        )
    except Exception as crm_err:
        import logging
        logging.getLogger("leader-os.tier").debug(
            "CRM tier_changed emit failed (non-blocking): %s", crm_err
        )
