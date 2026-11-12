"""Seed test users covering all tiers (free, standard, accelerator, enterprise)
plus one admin for QA. The admin's password is SEED_ADMIN_PASSWORD, or random
and printed once.

Run: cd /app/backend && python3 seed_test_users.py
"""
import asyncio
import os
import secrets
import sys
from datetime import datetime, timezone, timedelta
import uuid

sys.path.insert(0, "/app/backend")

from config import db
from services import hash_password
from services_tier import activate_tier, TIER_CONFIG


TEST_USERS = [
    {
        "label": "Free Tier (Default)",
        "email": "free@wladbot.test",
        "password": "test123",
        "name": "Felix Free",
        "position": "Team Lead",
        "company": "Acme GmbH",
        "industry": "SaaS",
        "tier": "free",
        "xp": 120,
        "level": "Emerging Leader",
        "leadership_score": 45,
        "eq_score": 42,
        "communication_score": 48,
    },
    {
        "label": "Enterprise",
        "email": "enterprise@wladbot.test",
        "password": "test123",
        "name": "Erik Enterprise",
        "position": "Head of People",
        "company": "BitBolt AG",
        "industry": "Industrial",
        "tier": "enterprise",
        "xp": 340,
        "level": "Emerging Leader",
        "leadership_score": 52,
        "eq_score": 49,
        "communication_score": 55,
    },
    {
        "label": "Standard (Leadership System €997/Jahr)",
        "email": "standard@wladbot.test",
        "password": "test123",
        "name": "Stefan Standard",
        "position": "Department Director",
        "company": "Helios Health",
        "industry": "Healthcare",
        "tier": "standard",
        "xp": 1420,
        "level": "Strategischer Denker",
        "leadership_score": 68,
        "eq_score": 64,
        "communication_score": 72,
    },
    {
        "label": "Accelerator (Einmal €6.970 · 2 Jahre)",
        "email": "accelerator@wladbot.test",
        "password": "test123",
        "name": "Alex Accelerator",
        "position": "VP of Engineering",
        "company": "Novatech",
        "industry": "Tech",
        "tier": "accelerator",
        "via_installment": False,
        "xp": 2450,
        "level": "Vision Leader",
        "leadership_score": 84,
        "eq_score": 80,
        "communication_score": 88,
    },
    {
        "label": "Accelerator (12× Rate — Rate 3/12)",
        "email": "accelerator-raten@wladbot.test",
        "password": "test123",
        "name": "Rita Rate",
        "position": "Chief of Staff",
        "company": "Scaleup Inc.",
        "industry": "B2B SaaS",
        "tier": "accelerator",
        "via_installment": True,
        "installments_paid": 3,
        "xp": 1890,
        "level": "Strategischer Denker",
        "leadership_score": 76,
        "eq_score": 72,
        "communication_score": 80,
    },
    {
        # Not test123: an admin can reach the whole admin panel (incl. the DB
        # download), and staging is on a public URL.
        "label": "Admin",
        "email": "admin@wladbot.test",
        "password": os.environ.get("SEED_ADMIN_PASSWORD") or secrets.token_urlsafe(16),
        "name": "Ada Admin",
        "position": "Operations",
        "company": "Leader OS",
        "industry": "Coaching",
        "tier": "accelerator",
        "is_admin": True,
        "xp": 0,
    },
]


async def seed() -> list[dict]:
    now: datetime = datetime.now(timezone.utc)
    print("=" * 72)
    print("  WLAD AI Test User Seeding")
    print("=" * 72)

    created: list[dict] = []
    for spec in TEST_USERS:
        # Remove if exists for clean re-run
        existing = await db.users.find_one({"email": spec["email"]}, {"_id": 0, "user_id": 1})
        if existing:
            uid = existing["user_id"]
            await db.users.delete_one({"user_id": uid})
            await db.credits.delete_one({"user_id": uid})
            await db.installment_plans.delete_many({"user_id": uid})
            print(f"  ↻ Reset: {spec['email']} (was {uid})")

        user_id: str = f"user_{uuid.uuid4().hex[:12]}"
        user_doc: dict = {
            "user_id": user_id,
            "email": spec["email"],
            "name": spec["name"],
            "password_hash": hash_password(spec["password"]),
            "picture": None,
            "position": spec.get("position", ""),
            "company": spec.get("company", ""),
            "industry": spec.get("industry", ""),
            "leadership_score": spec.get("leadership_score", 0),
            "eq_score": spec.get("eq_score", 0),
            "communication_score": spec.get("communication_score", 0),
            "level": spec.get("level", "Emerging Leader"),
            "xp": spec.get("xp", 0),
            "premium": spec["tier"] in ("standard", "accelerator"),
            "created_at": now.isoformat(),
            "signup_ip": "127.0.0.1",
            "last_login_ip": "127.0.0.1",
            "login_history": [],
            "test_account": True,
            "is_admin": spec.get("is_admin", False),
        }
        await db.users.insert_one(user_doc)

        # Activate tier via canonical service
        if spec["tier"] != "free":
            await activate_tier(
                user_id, spec["tier"],
                via_installment=spec.get("via_installment", False),
            )

            # Override installment progress if specified (for Rita: paid 3/12)
            if spec.get("installments_paid") and spec.get("installments_paid", 0) > 1:
                paid = spec["installments_paid"]
                await db.installment_plans.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "installments_paid": paid,
                        "next_due_date": (now + timedelta(days=30)).isoformat(),
                        "last_paid_at": (now - timedelta(days=2)).isoformat(),
                    }},
                )

        # Confirmation
        created.append({
            "user_id": user_id,
            "email": spec["email"],
            "password": spec["password"],
            "tier": spec["tier"],
            "label": spec["label"],
            "installment": f"{spec.get('installments_paid', 1)}/12" if spec.get("via_installment") else None,
        })
        tier_info = TIER_CONFIG[spec["tier"]]
        duration = f"{tier_info['duration_days']}d" if tier_info.get("duration_days") else "lifetime"
        print(f"  ✓ {spec['label']}")
        print(f"     user_id: {user_id}")
        print(f"     email:   {spec['email']}  · pw: {spec['password']}")
        print(f"     tier:    {spec['tier']}  ({duration})")
        if spec.get("via_installment"):
            print(f"     plan:    Rate {spec.get('installments_paid', 1)}/12 bezahlt")
        print()

    print("=" * 72)
    print(f"  {len(created)} Test-User erstellt/aktualisiert.")
    print("=" * 72)
    return created


if __name__ == "__main__":
    result = asyncio.run(seed())
    print("\nJSON (für /app/memory/test_credentials.md):")
    import json
    print(json.dumps(result, indent=2, ensure_ascii=False))
