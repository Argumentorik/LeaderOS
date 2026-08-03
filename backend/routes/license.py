"""License-Key routes — 16-char activation codes for sales-sold packages.

Flow:
  1. Admin generates keys (POST /api/admin/license-keys/generate) — plaintext
     shown ONCE, only SHA-256 hash + masked display stored.
  2. Customer redeems on the login page (POST /api/auth/license/activate):
     new email → account created; existing email → password verified, tier upgraded.
  3. Redemption is race-safe single-use via atomic find_one_and_update.
"""
import secrets
import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr

from config import db, logger
from services import create_jwt_token, hash_password, verify_password, get_current_user
from services_actions import record_user_action

router = APIRouter(prefix="/api", tags=["license"])

# Unambiguous alphabet — no 0/O/1/I (keys get read out on sales calls)
KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
KEY_LENGTH = 16

# Only one-time packages are sellable via license key
LICENSABLE_PACKAGE_IDS = ("leadership_os", "leadership_os_plus", "masterclass")

# Masterclass keys don't buy a tier — they unlock the free version with a
# 5x credit budget (250 instead of 50) for Wlad's ~400 masterclass clients.
MASTERCLASS_PACKAGE = {"name": "Masterclass · Free-Zugang (250 Credits)", "tier": "free"}


async def _activate_masterclass(user_id: str) -> None:
    from routes.credits import MASTERCLASS_CREDITS
    await db.users.update_one({"user_id": user_id}, {"$set": {"masterclass": True}})
    await db.credits.update_one(
        {"user_id": user_id},
        {
            "$set": {"balance": MASTERCLASS_CREDITS},
            "$setOnInsert": {"total_used": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        },
        upsert=True,
    )
    logger.info(f"Masterclass access activated for {user_id} ({MASTERCLASS_CREDITS} credits)")


def _generate_key() -> str:
    raw = "".join(secrets.choice(KEY_ALPHABET) for _ in range(KEY_LENGTH))
    return "-".join(raw[i:i + 4] for i in range(0, KEY_LENGTH, 4))


def _normalize_key(key: str) -> str:
    return "".join(c for c in (key or "").upper() if c.isalnum())


def _key_hash(normalized: str) -> str:
    return hashlib.sha256(normalized.encode()).hexdigest()


def _mask(normalized: str) -> str:
    return f"{normalized[:4]}-····-····-{normalized[-4:]}"


# ────────────────────────────────────────────────────────────────────────────
# Public: redeem a key on the login page
# ────────────────────────────────────────────────────────────────────────────

class LicenseActivate(BaseModel):
    license_key: str
    email: EmailStr
    password: str
    name: str = ""
    attribution: dict | None = None


async def _rate_limit_license(ip: str) -> None:
    """Max 10 failed key attempts per IP / 15 min (reuses login_attempts store)."""
    from routes.auth import _check_rate_limit
    await _check_rate_limit(f"license:{ip}", ip)


async def _log_license_attempt(ip: str, success: bool) -> None:
    from routes.auth import _log_login_attempt
    await _log_login_attempt(f"license:{ip}", ip, success)


async def _redeem_key_atomic(key_hash: str, user_id: str, email: str) -> dict | None:
    """Single-use, race-safe: flips active → redeemed exactly once."""
    return await db.license_keys.find_one_and_update(
        {"key_hash": key_hash, "status": "active"},
        {"$set": {
            "status": "redeemed",
            "redeemed_by": user_id,
            "redeemed_email": email,
            "redeemed_at": datetime.now(timezone.utc).isoformat(),
        }},
    )


@router.post("/auth/license/activate")
async def activate_license(data: LicenseActivate, request: Request, response: Response):
    from routes.auth import (
        _capture_login_context, _login_history_entry, _safe_user_output,
        _create_session, _send_signup_welcome, detect_source_platform,
    )
    ctx = await _capture_login_context(request)
    ip = ctx["ip"]
    await _rate_limit_license(ip)

    normalized = _normalize_key(data.license_key)
    if len(normalized) != KEY_LENGTH:
        raise HTTPException(status_code=400, detail="Ungültiges Key-Format — der Lizenz-Key hat 16 Zeichen (XXXX-XXXX-XXXX-XXXX).")

    key_doc = await db.license_keys.find_one({"key_hash": _key_hash(normalized)}, {"_id": 0})
    if not key_doc:
        await _log_license_attempt(ip, success=False)
        raise HTTPException(status_code=404, detail="Lizenz-Key nicht gefunden. Bitte prüfe die Eingabe.")
    if key_doc["status"] == "redeemed":
        raise HTTPException(status_code=400, detail="Dieser Lizenz-Key wurde bereits eingelöst.")
    if key_doc["status"] == "revoked":
        raise HTTPException(status_code=400, detail="Dieser Lizenz-Key wurde deaktiviert. Bitte kontaktiere den Support.")

    email = data.email.strip().lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    account_created = False

    if existing:
        # Existing account — password must match (prevents account takeover via key)
        if not existing.get("password_hash"):
            raise HTTPException(
                status_code=409,
                detail="Dieses Konto nutzt Google/Apple-Login. Bitte melde dich damit an — der Key wird dann im Profil eingelöst.",
            )
        if not verify_password(data.password, existing["password_hash"]):
            await _log_license_attempt(ip, success=False)
            raise HTTPException(status_code=401, detail="Falsches Passwort für dieses Konto.")
        user_id = existing["user_id"]
    else:
        # New account — enforce the same password strength as /auth/register
        pw = data.password or ""
        if len(pw) < 8:
            raise HTTPException(status_code=400, detail="Passwort muss mindestens 8 Zeichen lang sein.")
        if pw.isdigit() or pw.isalpha():
            raise HTTPException(status_code=400, detail="Passwort muss Buchstaben und Zahlen enthalten.")
        if not (data.name or "").strip():
            raise HTTPException(status_code=400, detail="Bitte gib deinen Namen an.")

        user_id = f"user_{uuid.uuid4().hex[:12]}"
        history_entry = _login_history_entry(ctx, method="license")
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.name.strip(),
            "password_hash": hash_password(pw),
            "picture": None,
            "position": "", "company": "", "industry": "",
            "leadership_score": 0, "eq_score": 0, "communication_score": 0,
            "level": "Emerging Leader", "xp": 0, "premium": False,
            "source_platform": detect_source_platform(request),
            "signup_ip": ip, "signup_geo": ctx["geo"], "signup_ua": ctx["ua"],
            "last_login_ip": ip, "last_login_geo": ctx["geo"], "last_login_ua": ctx["ua"],
            "login_history": [history_entry],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        account_created = True

    # Atomic single-use redemption (race-safe against parallel submits)
    redeemed = await _redeem_key_atomic(key_doc["key_hash"], user_id, email)
    if not redeemed:
        raise HTTPException(status_code=400, detail="Dieser Lizenz-Key wurde bereits eingelöst.")

    # Activate: masterclass = free version + 250 credits; else tier via payments pipeline
    if key_doc["package_id"] == "masterclass":
        await _activate_masterclass(user_id)
    else:
        from routes.payments import _activate_from_package
        await _activate_from_package(user_id, key_doc["package_id"])
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"license_key_id": key_doc["key_id"], "license_activated_at": datetime.now(timezone.utc).isoformat()}},
    )
    await _log_license_attempt(ip, success=True)
    await record_user_action(user_id, "license_activated")

    # Iter 120: persist ad/campaign attribution (utm_*, gclid …) if provided
    from models import clean_attribution
    cleaned_attr = clean_attribution(data.attribution)
    if cleaned_attr:
        await db.users.update_one({"user_id": user_id}, {"$set": {"attribution": cleaned_attr}})

    if account_created:
        import asyncio as _asyncio
        _asyncio.create_task(_send_signup_welcome(email, data.name.strip() or email.split("@")[0]))
        from services_supabase_sync import mirror_user_event_fire_and_forget
        mirror_user_event_fire_and_forget(
            mongo_user_id=user_id, email=email, full_name=data.name.strip(),
            event="user.created", extra={"auth_method": "license"},
            source_platform=detect_source_platform(request),
        )

    token = create_jwt_token(user_id)
    await _create_session(user_id, ip, response, method="license")
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    logger.info(f"License key {key_doc['key_id']} redeemed by {user_id} ({key_doc['package_id']})")
    return {
        "token": token,
        "user": _safe_user_output(user),
        "account_created": account_created,
        "activated": {"package_name": key_doc.get("package_name"), "tier": key_doc.get("tier")},
    }


# ────────────────────────────────────────────────────────────────────────────
# Authenticated: redeem for an already-logged-in user (e.g. OAuth accounts)
# ────────────────────────────────────────────────────────────────────────────

class LicenseRedeem(BaseModel):
    license_key: str


@router.post("/license/redeem")
async def redeem_license(data: LicenseRedeem, request: Request):
    user = await get_current_user(request)
    normalized = _normalize_key(data.license_key)
    if len(normalized) != KEY_LENGTH:
        raise HTTPException(status_code=400, detail="Ungültiges Key-Format — der Lizenz-Key hat 16 Zeichen.")

    key_doc = await db.license_keys.find_one({"key_hash": _key_hash(normalized)}, {"_id": 0})
    if not key_doc or key_doc["status"] == "revoked":
        raise HTTPException(status_code=404, detail="Lizenz-Key nicht gefunden oder deaktiviert.")
    if key_doc["status"] == "redeemed":
        raise HTTPException(status_code=400, detail="Dieser Lizenz-Key wurde bereits eingelöst.")

    redeemed = await _redeem_key_atomic(key_doc["key_hash"], user["user_id"], user.get("email", ""))
    if not redeemed:
        raise HTTPException(status_code=400, detail="Dieser Lizenz-Key wurde bereits eingelöst.")

    if key_doc["package_id"] == "masterclass":
        await _activate_masterclass(user["user_id"])
    else:
        from routes.payments import _activate_from_package
        await _activate_from_package(user["user_id"], key_doc["package_id"])
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"license_key_id": key_doc["key_id"], "license_activated_at": datetime.now(timezone.utc).isoformat()}},
    )
    await record_user_action(user["user_id"], "license_activated")
    return {"activated": {"package_name": key_doc.get("package_name"), "tier": key_doc.get("tier")}}


# ────────────────────────────────────────────────────────────────────────────
# Admin: generate / list / revoke
# ────────────────────────────────────────────────────────────────────────────

class LicenseGenerate(BaseModel):
    package_id: str
    count: int = 1
    note: str = ""


@router.post("/admin/license-keys/generate")
async def generate_license_keys(data: LicenseGenerate, request: Request):
    from routes.admin import require_admin
    from routes.payments import PACKAGES
    admin = await require_admin(request)

    if data.package_id not in LICENSABLE_PACKAGE_IDS:
        raise HTTPException(status_code=400, detail=f"Nur diese Pakete sind lizenzierbar: {', '.join(LICENSABLE_PACKAGE_IDS)}")
    if not 1 <= data.count <= 100:
        raise HTTPException(status_code=400, detail="Anzahl muss zwischen 1 und 100 liegen.")

    pkg = MASTERCLASS_PACKAGE if data.package_id == "masterclass" else PACKAGES[data.package_id]
    await db.license_keys.create_index("key_hash", unique=True)
    now_iso = datetime.now(timezone.utc).isoformat()

    plaintext_keys, docs = [], []
    for _ in range(data.count):
        key = _generate_key()
        normalized = _normalize_key(key)
        plaintext_keys.append(key)
        docs.append({
            "key_id": f"lk_{uuid.uuid4().hex[:12]}",
            "key_hash": _key_hash(normalized),
            "key_masked": _mask(normalized),
            "package_id": data.package_id,
            "package_name": pkg["name"],
            "tier": pkg["tier"],
            "status": "active",
            "note": (data.note or "").strip()[:200],
            "created_at": now_iso,
            "created_by": admin.get("email", ""),
        })
    await db.license_keys.insert_many(docs)
    logger.info(f"Admin {admin.get('email')} generated {data.count} license keys for {data.package_id}")
    # Plaintext keys are returned EXACTLY ONCE — only hashes are stored.
    return {"keys": plaintext_keys, "package_name": pkg["name"], "count": data.count}


@router.get("/admin/license-keys")
async def list_license_keys(request: Request, status: str | None = None, limit: int = 100):
    from routes.admin import require_admin
    await require_admin(request)
    query = {"status": status} if status in ("active", "redeemed", "revoked") else {}
    keys = await db.license_keys.find(query, {"_id": 0, "key_hash": 0}).sort("created_at", -1).to_list(min(limit, 500))
    counts = {s: await db.license_keys.count_documents({"status": s}) for s in ("active", "redeemed", "revoked")}
    return {"keys": keys, "counts": counts}


@router.post("/admin/license-keys/{key_id}/revoke")
async def revoke_license_key(key_id: str, request: Request):
    from routes.admin import require_admin
    admin = await require_admin(request)
    res = await db.license_keys.update_one(
        {"key_id": key_id, "status": "active"},
        {"$set": {"status": "revoked", "revoked_at": datetime.now(timezone.utc).isoformat(), "revoked_by": admin.get("email", "")}},
    )
    if not res.modified_count:
        raise HTTPException(status_code=404, detail="Key nicht gefunden oder nicht mehr aktiv.")
    return {"ok": True}
