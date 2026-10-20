"""Credit system — core business logic.

Free users get 50 credits. After 10 uses, a soft pause prompts upgrade.
Premium users (€997+ paid) have unlimited credits.
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime, timezone
from pymongo import ReturnDocument

from config import db
from services import get_current_user

router = APIRouter(prefix="/api/credits", tags=["credits"])

FREE_CREDITS = 50
MASTERCLASS_CREDITS = 250
# Entscheidung Iter 185 (2b): Freier Zugang bekommt monatlich Credits
# nachgefüllt, statt einmalig 50 und dann nie wieder.
# Iter 192 (Wunsch Stefan): von 20 auf 50 pro Monat erhöht.
MONTHLY_FREE_REFILL = 50
SOFT_PAUSE_AT = 10  # Show upsell after 10 uses
CREDIT_COSTS = {
    "chat": 1,
    "quiz": 1,
    "roleplay": 1,
    "video_mission": 1,
    "simulation": 1,
    "workflow": 1,
}


PAID_TIERS = {"standard", "accelerator", "enterprise", "plus", "starter"}


def masterclass_active(user: dict) -> bool:
    """Masterclass flag + term check — memberships expire after 6/12/18 months."""
    if not user.get("masterclass"):
        return False
    exp = user.get("masterclass_expires_at")
    if not exp:
        return True
    try:
        return datetime.fromisoformat(str(exp).replace("Z", "+00:00")) > datetime.now(timezone.utc)
    except (ValueError, TypeError):
        return True


def _month_key(dt: datetime | None = None) -> str:
    return (dt or datetime.now(timezone.utc)).strftime("%Y-%m")


def next_refill_label() -> str:
    """Erster Tag des nächsten Monats in Klartext (für die Kundenmeldung)."""
    now = datetime.now(timezone.utc)
    month = 1 if now.month == 12 else now.month + 1
    year = now.year + 1 if now.month == 12 else now.year
    names = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli",
             "August", "September", "Oktober", "November", "Dezember"]
    return f"1. {names[month - 1]} {year}"


# Wert vor Iter 192 — nur für die einmalige Nachzahlung an Konten, die in
# diesem Monat schon mit der alten Menge aufgefüllt wurden.
PREVIOUS_MONTHLY_REFILL = 20


async def _apply_monthly_refill(user: dict, credit_doc: dict) -> dict:
    """Monatliches Nachfüllen für den freien Zugang (nie nach unten korrigieren).

    Iter 192: Wird die monatliche Menge erhöht, bekommen Konten, die in diesem
    Monat schon aufgefüllt wurden, die Differenz sofort nachgezahlt — sonst
    müssten sie bis zum Ersten warten. Die Monatsgrenze bleibt gewahrt, weil
    nur die Differenz zur bereits gewährten Menge gutgeschrieben wird.
    """
    if masterclass_active(user):
        return credit_doc
    month = _month_key()
    balance = int(credit_doc.get("balance", 0) or 0)

    if credit_doc.get("refill_month") == month:
        granted = int(credit_doc.get("refill_amount") or PREVIOUS_MONTHLY_REFILL)
        if granted >= MONTHLY_FREE_REFILL:
            return credit_doc
        new_balance = balance + (MONTHLY_FREE_REFILL - granted)
    else:
        new_balance = max(balance, MONTHLY_FREE_REFILL)

    await db.credits.update_one(
        {"user_id": credit_doc["user_id"]},
        {"$set": {"balance": new_balance, "refill_month": month,
                  "refill_amount": MONTHLY_FREE_REFILL}},
    )
    credit_doc["balance"] = new_balance
    credit_doc["refill_amount"] = MONTHLY_FREE_REFILL
    credit_doc["refill_month"] = month
    return credit_doc


def no_credits_detail(action: str, status: dict | None = None) -> dict:
    """Iter 185: EINE Meldung in Klartext statt Absage + ungefragtem Kauffenster.

    Kundenmeldung: „Kauffenster plus keine Credits". Der Kauf ist künftig ein
    Klick INNERHALB dieser Meldung — nicht ein zweites Fenster obendrauf.
    """
    cost = CREDIT_COSTS.get(action, 1)
    return {
        "error": "no_credits",
        "action": action,
        "cost": cost,
        "remaining": int((status or {}).get("remaining", 0) or 0),
        "monthly_refill": MONTHLY_FREE_REFILL,
        "next_refill": next_refill_label(),
        "message": (
            "Dein KI-Guthaben ist aufgebraucht. "
            f"Am {next_refill_label()} kommen {MONTHLY_FREE_REFILL} neue Credits dazu. "
            "Wenn du nicht warten willst, schaltest du unbegrenzte Nutzung frei."
        ),
    }


async def check_and_deduct_credit(user: dict, action: str) -> dict:
    """Check if user has credits. Deduct 1 if free user. Returns status dict."""
    user_id = user["user_id"]

    # Premium flag, paid tier, or admin = unlimited
    if user.get("premium") or user.get("is_admin") or user.get("tier") in PAID_TIERS:
        return {"allowed": True, "remaining": -1, "is_premium": True}

    # Get or initialize credit balance
    credit_doc = await db.credits.find_one({"user_id": user_id}, {"_id": 0})
    if not credit_doc:
        initial = MASTERCLASS_CREDITS if masterclass_active(user) else FREE_CREDITS
        credit_doc = {
            "user_id": user_id,
            "balance": initial,
            "total_used": 0,
            "history": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        credit_doc["refill_month"] = _month_key()
        await db.credits.insert_one(credit_doc)
    else:
        credit_doc = await _apply_monthly_refill(user, credit_doc)

    cost = CREDIT_COSTS.get(action, 1)

    # Atomar: Abzug nur, wenn das Guthaben im selben Schritt noch reicht (keine Race ins Minus).
    updated = await db.credits.find_one_and_update(
        {"user_id": user_id, "balance": {"$gte": cost}},
        {
            "$inc": {"balance": -cost, "total_used": cost},
            "$push": {"history": {
                "$each": [{"action": action, "cost": cost, "at": datetime.now(timezone.utc).isoformat()}],
                "$slice": -100,
            }},
        },
        projection={"_id": 0, "balance": 1},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        current = await db.credits.find_one({"user_id": user_id}, {"_id": 0, "balance": 1}) or {}
        return {"allowed": False, "remaining": max(0, current.get("balance", 0)), "is_premium": False}
    return {"allowed": True, "remaining": updated["balance"], "is_premium": False}


async def check_credit_balance(user: dict) -> dict:
    """Nur nachsehen, nichts abbuchen — für Kostenhinweise VOR einer Aktion."""
    if user.get("premium") or user.get("is_admin") or user.get("tier") in PAID_TIERS:
        return {"unlimited": True, "balance": -1}
    doc = await db.credits.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not doc:
        return {"unlimited": False,
                "balance": MASTERCLASS_CREDITS if masterclass_active(user) else FREE_CREDITS}
    doc = await _apply_monthly_refill(user, doc)
    return {"unlimited": False, "balance": int(doc.get("balance", 0) or 0)}


async def refund_credit(user_id: str) -> None:
    """Refund one deducted credit (compensation when the AI call fails)."""
    await db.credits.update_one(
        {"user_id": user_id},
        {"$inc": {"balance": 1, "total_used": -1}},
    )


@router.get("")
async def get_credits(request: Request):
    """Get user's credit balance and usage info."""
    user = await get_current_user(request)

    if user.get("premium") or user.get("is_admin") or user.get("tier") in PAID_TIERS:
        return {"balance": -1, "is_premium": True, "total_used": 0, "limit": -1, "soft_pause": False}

    is_mc = masterclass_active(user)
    limit = MASTERCLASS_CREDITS if is_mc else FREE_CREDITS
    credit_doc = await db.credits.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not credit_doc:
        return {"balance": limit, "is_premium": False, "total_used": 0, "limit": limit, "soft_pause": False,
                "masterclass": is_mc, "costs": CREDIT_COSTS, "used_by_action": {}, "recent": [],
                "monthly_refill": MONTHLY_FREE_REFILL, "next_refill": next_refill_label()}
    credit_doc = await _apply_monthly_refill(user, credit_doc)

    total_used = credit_doc.get("total_used", 0)
    history = credit_doc.get("history") or []
    by_action: dict[str, int] = {}
    for h in history:
        by_action[h.get("action", "chat")] = by_action.get(h.get("action", "chat"), 0) + int(h.get("cost", 1))
    return {
        "balance": credit_doc.get("balance", 0),
        "is_premium": False,
        "total_used": total_used,
        "limit": limit,
        "masterclass": is_mc,
        # Transparenz: was kostet was, wofür ging es bisher drauf, letzte Aktionen
        "costs": CREDIT_COSTS,
        "used_by_action": by_action,
        "recent": list(reversed(history[-8:])),
        "monthly_refill": MONTHLY_FREE_REFILL,
        "next_refill": next_refill_label(),
        "soft_pause": total_used >= SOFT_PAUSE_AT and not credit_doc.get("soft_pause_dismissed", False) and not is_mc,
    }


@router.post("/dismiss-pause")
async def dismiss_soft_pause(request: Request):
    """Dismiss the soft pause upsell so user can continue."""
    user = await get_current_user(request)
    await db.credits.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"soft_pause_dismissed": True}},
        upsert=True,
    )
    return {"dismissed": True}


@router.post("/reset")
async def reset_credits(request: Request):
    """Reset caller's credits to FREE_CREDITS. SEC-001: admin only."""
    from routes.admin import require_admin
    user = await require_admin(request)
    await db.credits.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"balance": FREE_CREDITS, "total_used": 0}},
        upsert=True,
    )
    return {"balance": FREE_CREDITS, "message": "Credits reset"}


# ── Support-Werkzeug (Iter 185) ─────────────────────────────────────────────
# Pro Kunde: Zugangsstufe, Restguthaben, Verbrauch, letzte Aktionen. Guthaben
# einzeln auffüllbar ohne Vollzugang. Plus Liste „steckt fest".

async def _credit_overview(user: dict) -> dict:
    doc = await db.credits.find_one({"user_id": user["user_id"]}, {"_id": 0}) or {}
    history = doc.get("history") or []
    is_unlimited = bool(user.get("premium") or user.get("is_admin") or user.get("tier") in PAID_TIERS)
    return {
        "user_id": user["user_id"],
        "email": user.get("email"),
        "name": user.get("name"),
        "tier": user.get("tier") or "free",
        "premium": bool(user.get("premium")),
        "masterclass": masterclass_active(user),
        "unlimited": is_unlimited,
        "balance": -1 if is_unlimited else int(doc.get("balance", FREE_CREDITS)),
        "total_used": int(doc.get("total_used", 0)),
        "refill_month": doc.get("refill_month"),
        "next_refill": next_refill_label(),
        "recent": list(reversed(history[-15:])),
        "last_login_at": user.get("last_login_at"),
        "created_at": user.get("created_at"),
    }


@router.get("/admin/lookup")
async def admin_lookup_credits(request: Request, q: str):
    """Kunde per E-Mail oder User-ID nachsehen."""
    from routes.admin import require_admin
    await require_admin(request)
    needle = (q or "").strip().lower()
    user = await db.users.find_one({"$or": [{"email": needle}, {"user_id": q.strip()}]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Kein Kunde mit dieser E-Mail oder ID gefunden")
    return await _credit_overview(user)


class TopupIn(BaseModel):
    amount: int = MONTHLY_FREE_REFILL
    note: str | None = None


@router.post("/admin/topup/{user_id}")
async def admin_topup_credits(user_id: str, data: TopupIn, request: Request):
    """Guthaben einzeln auffüllen — ohne Vollzugang zu vergeben."""
    from routes.admin import require_admin
    admin = await require_admin(request)
    amount = max(1, min(500, int(data.amount)))
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Kein Kunde mit dieser ID gefunden")
    await db.credits.update_one(
        {"user_id": user_id},
        {"$inc": {"balance": amount},
         "$set": {"refill_month": _month_key(), "soft_pause_dismissed": True},
         "$setOnInsert": {"total_used": 0, "history": [],
                          "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    await db.credit_topups.insert_one({
        "user_id": user_id, "amount": amount, "note": (data.note or "")[:300],
        "by": admin.get("email"), "at": datetime.now(timezone.utc).isoformat(),
    })
    return await _credit_overview(user)


@router.get("/admin/stuck")
async def admin_stuck_customers(request: Request, limit: int = 50):
    """Wer steckt fest: freier Zugang, Guthaben leer, hat aber schon gearbeitet."""
    from routes.admin import require_admin
    await require_admin(request)
    empty = await db.credits.find(
        {"balance": {"$lte": 0}, "total_used": {"$gt": 0}}, {"_id": 0, "user_id": 1, "balance": 1, "total_used": 1},
    ).to_list(500)
    out = []
    for doc in empty:
        user = await db.users.find_one({"user_id": doc["user_id"]}, {"_id": 0})
        if not user:
            continue
        if user.get("premium") or user.get("is_admin") or user.get("tier") in PAID_TIERS:
            continue
        out.append({
            "user_id": doc["user_id"], "email": user.get("email"), "name": user.get("name"),
            "tier": user.get("tier") or "free", "balance": int(doc.get("balance", 0)),
            "total_used": int(doc.get("total_used", 0)), "last_login_at": user.get("last_login_at"),
        })
    out.sort(key=lambda r: r.get("last_login_at") or "", reverse=True)
    return {"count": len(out), "customers": out[:limit], "next_refill": next_refill_label()}
