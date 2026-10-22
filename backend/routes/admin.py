"""Admin Panel — Enterprise leads, referral analytics, coaching conversions, community metrics."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta

from config import db, logger
from services import get_current_user
from services_tier import TIER_CONFIG

router = APIRouter(prefix="/api/admin", tags=["admin"])

# SEC-003: Bootstrap seed list — used ONLY at startup to set the is_admin DB
# flag for EXISTING users. Runtime authorization is the DB flag alone; a
# generic/claimable email must never grant admin at request time.
ADMIN_SEED_EMAILS = {
    "start@aiporate.com",
    "mert@aiporate.com",
    "mert@wladbot.com",
    "mertzafermutlu@gmail.com",
    "stefan@argumentorik.com",
    "stefan.bachmann123@gmail.com",
    "wj@argumentorik.com",
    "ek@argumentorik.com",
    "anja@argumentorik.com",
    "carolin@argumentorik.com"
}


async def seed_admin_flags() -> None:
    """Idempotent startup seed: promote existing allowlisted users to is_admin.

    Iter 191: `admin_revoked` beats the allowlist. Ohne diesen Vorbehalt würde
    ein im Panel entzogenes Recht beim nächsten Start wieder auftauchen.
    """
    # SEC-001: only promote allowlisted users whose mailbox is proven
    # (email_verified). admin_revoked always wins.
    emails = [e.lower() for e in ADMIN_SEED_EMAILS]
    res = await db.users.update_many(
        {"$or": [{"email_lower": {"$in": emails}}, {"email": {"$in": emails}}],
         "is_admin": {"$ne": True}, "admin_revoked": {"$ne": True},
         "email_verified": True},
        {"$set": {"is_admin": True}},
    )
    if res.modified_count:
        logger.info(f"Admin seed: promoted {res.modified_count} user(s) to is_admin")


async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# Collections that hold per-user data (keyed by user_id or email).
_USER_DATA_COLLECTIONS = [
    "user_sessions", "magic_links", "chat_sessions", "chat_messages",
    "daily_checkins", "activity_log", "video_attempts", "email_log",
    "wladhub_profiles", "tasks", "community_posts", "community_comments",
    "login_attempts", "folders", "referrals",
]


@router.get("/sync-health")
async def sync_health(request: Request) -> dict:
    """leadercheck.de ↔ Leader-OS sync activity for the admin panel.

    Iter 135 (Audit): the automatic login/signup sync now writes a log row per
    attempt, so these numbers reflect reality instead of only manual syncs.
    Statuses: completed (data written) · unchanged (already current) ·
    not_found (no diagnose on leadercheck.de) · error (needs attention).
    """
    await require_admin(request)
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(hours=24)).isoformat()

    logs = await db.wladhub_sync_log.find(
        {"created_at": {"$gte": cutoff}}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)

    def _count(*statuses):
        return sum(1 for e in logs if e.get("status") in statuses)

    failed = [e for e in logs if e.get("status") == "error"]
    last_success = await db.wladhub_sync_log.find_one(
        {"status": "completed"}, {"_id": 0}, sort=[("created_at", -1)]
    )
    last_failure = await db.wladhub_sync_log.find_one(
        {"status": "error"}, {"_id": 0}, sort=[("created_at", -1)]
    )

    return {
        "window_hours": 24,
        "syncs_24h": len(logs),
        "completed_24h": _count("completed"),
        "unchanged_24h": _count("unchanged"),
        "not_found_24h": _count("not_found"),
        "failed_24h": len(failed),
        "incomplete_24h": len(logs) - _count("completed"),
        "records_imported_24h": sum(int(e.get("records_imported") or 0) for e in logs),
        "last_success_at": (last_success or {}).get("created_at"),
        "last_failure_at": (last_failure or {}).get("created_at"),
        "last_failure_reason": (last_failure or {}).get("error"),
        "failure_reasons": [
            {"email": e.get("email"), "error": (e.get("error") or "")[:160],
             "at": e.get("created_at")}
            for e in failed[:5]
        ],
        "total_diagnoses": await db.wladhub_diagnoses.count_documents({}),
        "connected_users": len(await db.wladhub_diagnoses.distinct("user_id")),
        "recent": logs[:10],
        "computed_at": now.isoformat(),
    }


@router.post("/users/set-tier/{email}")
async def admin_set_tier(email: str, request: Request, tier: str = "accelerator"):
    """Grant a user full paid-tier access (admin panel / founder testing)."""
    await require_admin(request)
    email = email.strip().lower()
    if tier not in TIER_CONFIG or tier == "free":
        raise HTTPException(status_code=400, detail=f"Ungültiger Tier. Erlaubt: {[t for t in TIER_CONFIG if t != 'free']}")
    user = await db.users.find_one(
        {"$or": [{"email_lower": email}, {"email": email}]}, {"_id": 0, "user_id": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")
    from services_tier import activate_tier
    await activate_tier(user["user_id"], tier)
    return {"email": email, "tier": tier, "activated": True}


@router.get("/admins")
async def admin_list_admins(request: Request):
    """Wer hat Admin-Recht? (Iter 191 — Schalter im Admin-Bereich)"""
    me = await require_admin(request)
    rows = await db.users.find(
        {"is_admin": True},
        {"_id": 0, "user_id": 1, "email": 1, "name": 1, "created_at": 1, "last_login_at": 1},
    ).to_list(200)
    seed = sorted(e.lower() for e in ADMIN_SEED_EMAILS)
    for r in rows:
        mail = (r.get("email") or "").lower()
        r["on_allowlist"] = mail in seed
        r["is_you"] = mail == (me.get("email") or "").lower()
    rows.sort(key=lambda r: (not r["is_you"], r.get("email") or ""))
    # Adressen der Liste, zu denen es (noch) kein Konto gibt: bekommen das Recht
    # automatisch mit der ersten Anmeldung.
    have = {(r.get("email") or "").lower() for r in rows}
    revoked = await db.users.find(
        {"admin_revoked": True}, {"_id": 0, "email": 1, "name": 1}
    ).to_list(200)
    return {
        "admins": rows,
        "count": len(rows),
        "allowlist_pending": [e for e in seed if e not in have],
        "revoked": revoked,
    }


class AdminFlagIn(BaseModel):
    is_admin: bool


@router.put("/users/by-email/{email}/admin")
async def admin_set_admin_flag(email: str, data: AdminFlagIn, request: Request):
    """Admin-Recht geben oder entziehen. Das eigene Recht bleibt unberührt."""
    me = await require_admin(request)
    email = email.strip().lower()
    if email == (me.get("email") or "").lower():
        raise HTTPException(status_code=400, detail="cannot_change_own_admin")
    user = await db.users.find_one(
        {"$or": [{"email_lower": email}, {"email": email}]}, {"_id": 0, "user_id": 1, "email": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")
    update = (
        {"$set": {"is_admin": True}, "$unset": {"admin_revoked": "", "admin_revoked_at": ""}}
        if data.is_admin else
        {"$set": {"is_admin": False, "admin_revoked": True,
                  "admin_revoked_at": datetime.now(timezone.utc).isoformat()}}
    )
    await db.users.update_one({"user_id": user["user_id"]}, update)
    logger.warning("Admin %s setzt is_admin=%s für %s", me.get("email"), data.is_admin, email)
    return {"email": user.get("email"), "is_admin": data.is_admin}


@router.delete("/users/by-email/{email}")
async def admin_delete_user(email: str, request: Request) -> dict:
    """Hard-delete a user + all related data (Iter 92.52: clean re-test accounts).

    Admin-only. Never deletes another admin account (safety guard).
    """
    admin = await require_admin(request)
    email = email.strip().lower()
    if email == (admin.get("email") or "").lower():
        raise HTTPException(status_code=400, detail="cannot_delete_own_account")

    user = await db.users.find_one({"email": email}, {"_id": 0, "user_id": 1, "is_admin": 1})
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")
    if user.get("is_admin"):
        # Iter 130: allow deleting OTHER admin-flagged accounts (e.g. Wlad's
        # old private mail) — only self-deletion stays blocked above.
        logger.warning(f"Admin {admin.get('email')} deletes admin-flagged account {email}")
    uid = user.get("user_id")

    related: dict = {}
    for col in _USER_DATA_COLLECTIONS:
        try:
            res = await db[col].delete_many({"$or": [{"user_id": uid}, {"email": email}]})
            if res.deleted_count:
                related[col] = res.deleted_count
        except Exception:  # noqa: BLE001 — best-effort cleanup per collection
            continue
    await db.users.delete_one({"email": email})
    return {"deleted_user": email, "user_id": uid, "related": related}


async def _compute_user_stats(last_30: str, last_7: str) -> dict:
    return {
        "total": await db.users.count_documents({}),
        "new_30d": await db.users.count_documents({"created_at": {"$gte": last_30}}),
        "new_7d": await db.users.count_documents({"created_at": {"$gte": last_7}}),
    }


async def _compute_tier_distribution() -> dict:
    tier_dist: dict = {t: await db.users.count_documents({"tier": t}) for t in TIER_CONFIG.keys()}
    legacy_premium = await db.users.count_documents({"premium": True, "tier": {"$in": [None, "free"]}})
    if legacy_premium:
        tier_dist["legacy_premium"] = legacy_premium
    return tier_dist


async def _compute_revenue(last_30: str) -> dict:
    paid_txs = await db.payment_transactions.find(
        {"payment_status": "paid"},
        {"_id": 0, "amount": 1, "currency": 1, "created_at": 1, "package_id": 1, "tier": 1},
    ).to_list(5000)
    total_revenue = sum(t.get("amount", 0) for t in paid_txs)
    revenue_30d = sum(t.get("amount", 0) for t in paid_txs if t.get("created_at", "") >= last_30)
    revenue_per_tier: dict = {}
    for t in paid_txs:
        tier = t.get("tier", "unknown")
        revenue_per_tier[tier] = revenue_per_tier.get(tier, 0) + t.get("amount", 0)
    return {
        "total_eur": round(total_revenue, 2),
        "last_30d_eur": round(revenue_30d, 2),
        "per_tier": {k: round(v, 2) for k, v in revenue_per_tier.items()},
        "mrr_estimate_eur": round(revenue_30d, 2),
        "arr_estimate_eur": round(revenue_30d * 12, 2),
    }


async def _compute_community_stats(last_7: str) -> dict:
    return {
        "total_posts": await db.community_posts.count_documents({}),
        "posts_7d": await db.community_posts.count_documents({"created_at": {"$gte": last_7}}),
        "total_comments": await db.community_comments.count_documents({}),
    }


async def _compute_installments() -> dict:
    return {
        "active_plans": await db.installment_plans.count_documents({"active": True}),
        "completed_plans": await db.installment_plans.count_documents({"active": False}),
    }


@router.get("/overview")
async def admin_overview(request: Request) -> dict:
    """Top-level metrics for admin dashboard."""
    await require_admin(request)
    now = datetime.now(timezone.utc)
    last_30 = (now - timedelta(days=30)).isoformat()
    last_7 = (now - timedelta(days=7)).isoformat()

    enterprise_leads = await db.payment_transactions.count_documents({"package_id": "enterprise"})
    total_referrals = await db.referrals.count_documents({}) if "referrals" in await db.list_collection_names() else 0

    return {
        "users": await _compute_user_stats(last_30, last_7),
        "tier_distribution": await _compute_tier_distribution(),
        "revenue": await _compute_revenue(last_30),
        "installments": await _compute_installments(),
        "community": await _compute_community_stats(last_7),
        "enterprise_leads": enterprise_leads,
        "referrals": total_referrals,
    }


async def _gather_registration_counts(cutoff_24h_iso: str, cutoff_7d_iso: str) -> dict:
    """Registration counts for auth-health widget."""
    return {
        "registrations_24h": await db.users.count_documents({"created_at": {"$gte": cutoff_24h_iso}}),
        "registrations_7d": await db.users.count_documents({"created_at": {"$gte": cutoff_7d_iso}}),
    }


async def _gather_login_stats(cutoff_24h: datetime) -> dict:
    """Total / success / failed logins + success-rate % for last 24h."""
    total = await db.login_attempts.count_documents({"created_at": {"$gte": cutoff_24h}})
    failed = await db.login_attempts.count_documents({"created_at": {"$gte": cutoff_24h}, "success": False})
    success = total - failed
    rate = round((success / total * 100), 1) if total else 100.0
    return {"total": total, "success": success, "failed": failed, "success_rate_pct": rate}


async def _gather_top_offenders(cutoff_24h: datetime) -> list:
    """Top 10 (email, ip) combos with ≥5 failed logins — brute-force indicators."""
    pipeline = [
        {"$match": {"created_at": {"$gte": cutoff_24h}, "success": False}},
        {"$group": {"_id": {"ip": "$ip", "email": "$email"}, "count": {"$sum": 1}}},
        {"$match": {"count": {"$gte": 5}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
        {"$project": {"_id": 0, "ip": "$_id.ip", "email": "$_id.email", "failed_count": "$count"}},
    ]
    return await db.login_attempts.aggregate(pipeline).to_list(10)


async def _count_rate_limit_triggers(cutoff_24h: datetime) -> int:
    """Count (email, ip) combos that hit the 10-fail threshold → would 429."""
    pipeline = [
        {"$match": {"created_at": {"$gte": cutoff_24h}, "success": False}},
        {"$group": {"_id": {"ip": "$ip", "email": "$email"}, "count": {"$sum": 1}}},
        {"$match": {"count": {"$gte": 10}}},
        {"$count": "rate_limited"},
    ]
    result = await db.login_attempts.aggregate(pipeline).to_list(1)
    return result[0]["rate_limited"] if result else 0


def _auth_config_snapshot() -> tuple[dict, dict]:
    """Env-driven provider flags + config fingerprints. NEVER leaks secrets."""
    import os as _os
    google_id = _os.environ.get("GOOGLE_CLIENT_ID") or ""
    apple_id = _os.environ.get("APPLE_SERVICE_ID") or _os.environ.get("APPLE_CLIENT_ID") or ""
    msft_id = _os.environ.get("MICROSOFT_CLIENT_ID") or ""
    stripe = _os.environ.get("STRIPE_API_KEY") or ""
    resend = _os.environ.get("RESEND_API_KEY") or ""
    env_name = (_os.environ.get("ENV") or _os.environ.get("ENVIRONMENT") or "").lower()

    enabled = {
        "email_password": True,
        "magic_link": bool(resend),
        "google": bool(google_id),
        "apple": bool(apple_id),
        "microsoft": bool(msft_id),
        "phone": True,  # phone-OR-email login (Iter 92.24)
    }
    config = {
        "environment": env_name or "unknown",
        "frontend_base_url": (_os.environ.get("FRONTEND_BASE_URL") or "") or "(missing)",
        "google_client_id_set": bool(google_id),
        "google_client_id_prefix": (google_id.split("-")[0] if "-" in google_id else google_id[:8]) if google_id else None,
        "apple_service_id_set": bool(apple_id),
        "microsoft_client_id_set": bool(msft_id),
        "sentry_dsn_set": bool(_os.environ.get("SENTRY_DSN")),
        "stripe_api_key_set": bool(stripe),
        "stripe_mode": "live" if stripe.startswith("sk_live_") else ("test" if stripe.startswith("sk_test_") else "unknown"),
        "resend_api_key_set": bool(resend),
        "rag_embeddings": "local (multilingual MiniLM, 384-dim, keine externen Keys)",
        "supabase_url_set": bool(_os.environ.get("SUPABASE_URL")),
    }
    return enabled, config


@router.get("/auth-health")
async def auth_health(request: Request) -> dict:
    """Auth metrics + config-state snapshot for launch monitoring (last 24h)."""
    await require_admin(request)
    now = datetime.now(timezone.utc)
    cutoff_24h = now - timedelta(hours=24)
    cutoff_7d_iso = (now - timedelta(days=7)).isoformat()

    regs = await _gather_registration_counts(cutoff_24h.isoformat(), cutoff_7d_iso)
    logins = await _gather_login_stats(cutoff_24h)
    top_offenders = await _gather_top_offenders(cutoff_24h)
    rate_limit_triggers = await _count_rate_limit_triggers(cutoff_24h)
    enabled, config = _auth_config_snapshot()

    return {
        "window_hours": 24,
        **regs,
        "logins_24h": logins,
        "rate_limit_triggers_24h": rate_limit_triggers,
        "duplicate_email_blocks_24h": 0,
        "top_offenders": top_offenders,
        "enabled": enabled,
        "config": config,
        "computed_at": now.isoformat(),
    }


@router.get("/users")
async def admin_users(request: Request, limit: int = 100):
    """List users with tier info for admin."""
    await require_admin(request)
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0, "login_history": 0, "signup_ip": 0}
    ).sort("created_at", -1).to_list(limit)
    return users


@router.get("/transactions")
async def admin_transactions(request: Request, limit: int = 100):
    """Recent payment transactions."""
    await require_admin(request)
    txs = await db.payment_transactions.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return txs


@router.get("/enterprise-leads")
async def admin_enterprise_leads(request: Request):
    """Enterprise tier inquiries + paid."""
    await require_admin(request)
    leads = await db.payment_transactions.find(
        {"package_id": "enterprise"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return leads


@router.get("/referrals")
async def admin_referrals(request: Request):
    """Top referral codes by usage."""
    await require_admin(request)
    cols = await db.list_collection_names()
    if "referrals" not in cols:
        return []
    pipeline = [
        {"$group": {"_id": "$referrer_code", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 50},
    ]
    results = await db.referrals.aggregate(pipeline).to_list(50)
    return [{"code": r["_id"], "count": r["count"]} for r in results]


@router.get("/community/leaderboard")
async def community_leaderboard(request: Request, limit: int = 10):
    """Public — top Leaders by post count + likes. Not admin-only."""
    await get_current_user(request)
    pipeline = [
        {"$project": {
            "user_id": 1,
            "post_count": 1,
            "total_likes": {"$size": {"$ifNull": ["$likes", []]}},
        }},
        {"$group": {
            "_id": "$user_id",
            "post_count": {"$sum": 1},
            "total_likes": {"$sum": "$total_likes"},
        }},
        {"$sort": {"total_likes": -1, "post_count": -1}},
        {"$limit": limit},
    ]
    rows = await db.community_posts.aggregate(pipeline).to_list(limit)
    user_ids = [r["_id"] for r in rows]
    users = {
        u["user_id"]: u
        for u in await db.users.find(
            {"user_id": {"$in": user_ids}},
            {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "tier": 1, "level": 1, "xp": 1},
        ).to_list(limit)
    }
    result = []
    for r in rows:
        u = users.get(r["_id"], {})
        result.append({
            "user_id": r["_id"],
            "name": u.get("name", "Leader"),
            "picture": u.get("picture"),
            "tier": u.get("tier", "free"),
            "level": u.get("level", ""),
            "xp": u.get("xp", 0),
            "post_count": r["post_count"],
            "total_likes": r["total_likes"],
        })
    return result


# ─────────────────────────────────────────────────────────────────────────
# RAG Debug — see exactly which Wlad-chunks WladBot retrieves for any query.
# Critical tool to spot knowledge gaps in the 609-chunk corpus before users do.
# ─────────────────────────────────────────────────────────────────────────

async def _rag_fetch_chunks(embedding: list, match_threshold: float, match_count: int) -> list:
    """Local Mongo vector-store match — same path as live chat retrieval."""
    from services_rag import _match_local
    chunks = await _match_local(embedding, threshold=match_threshold, count=match_count)
    for i, c in enumerate(chunks):
        c.setdefault("id", f"local_{i}")
    return chunks


def _rag_build_coverage(chunks_raw: list) -> tuple[list, dict]:
    """Aggregate chunk metadata into UI-ready chunks + coverage breakdown."""
    courses: dict[str, int] = {}
    sections: dict[str, int] = {}
    themes: dict[str, int] = {}
    layers: dict[str, int] = {}
    similarities: list[float] = []
    chunks_out = []

    for c in chunks_raw:
        meta = c.get("metadata") or {}
        sim = float(c.get("similarity") or 0)
        similarities.append(sim)
        course = meta.get("course") or "unknown"
        section = meta.get("section") or "unknown"
        layer = str(meta.get("layer") or "unknown")
        chunk_themes = meta.get("themes") or []

        courses[course] = courses.get(course, 0) + 1
        sections[section] = sections.get(section, 0) + 1
        layers[layer] = layers.get(layer, 0) + 1
        for t in chunk_themes:
            themes[t] = themes.get(t, 0) + 1

        chunks_out.append({
            "id": c.get("id"),
            "similarity": round(sim, 4),
            "content": (c.get("content") or "")[:400],
            "metadata": {"course": course, "section": section, "layer": layer, "themes": chunk_themes},
        })

    top_score = max(similarities) if similarities else 0
    avg_score = (sum(similarities) / len(similarities)) if similarities else 0
    coverage = {
        "courses": dict(sorted(courses.items(), key=lambda x: -x[1])),
        "sections": dict(sorted(sections.items(), key=lambda x: -x[1])[:8]),
        "themes": dict(sorted(themes.items(), key=lambda x: -x[1])[:15]),
        "layers": dict(sorted(layers.items(), key=lambda x: -x[1])),
        "top_score": round(top_score, 4),
        "avg_score": round(avg_score, 4),
        "chunks_returned": len(chunks_out),
    }
    return chunks_out, coverage


def _rag_warnings(chunks_out: list, top_score: float) -> list[str]:
    if not chunks_out:
        return ["ZERO_CHUNKS: query returned 0 chunks even at threshold=0.0 — embedding may be malformed."]
    if top_score < 0.40:
        return [f"LOW_RELEVANCE: top similarity is only {top_score:.2f} — corpus likely lacks content for this topic. Consider adding source material."]
    if top_score < 0.55:
        return [f"MEDIUM_RELEVANCE: top similarity {top_score:.2f} — answers will be loosely grounded. Stronger coverage would help."]
    return []


@router.post("/rag-debug")
async def rag_debug(request: Request):
    """For a given query, return top-N chunks + similarity + metadata coverage.

    Body: { "query": str, "match_count": int=10, "match_threshold": float=0.0 }
    """
    await require_admin(request)
    body = await request.json()
    query = (body.get("query") or "").strip()
    if not query or len(query) < 3:
        raise HTTPException(status_code=400, detail="Query must be at least 3 characters")
    match_count = max(1, min(int(body.get("match_count", 10)), 30))
    match_threshold = max(0.0, min(float(body.get("match_threshold", 0.0)), 1.0))

    from services_rag import _embed_query
    from services_embeddings import EMBED_MODEL_NAME, EMBEDDING_DIM

    embedding = await _embed_query(query)
    if not embedding:
        raise HTTPException(status_code=503, detail="Embedding service unavailable (local model)")

    chunks_raw = await _rag_fetch_chunks(embedding, match_threshold, match_count)
    chunks_out, coverage = _rag_build_coverage(chunks_raw)

    return {
        "query": query,
        "model": EMBED_MODEL_NAME,
        "embedding_dim": EMBEDDING_DIM,
        "match_count": match_count,
        "match_threshold": match_threshold,
        "chunks": chunks_out,
        "coverage": coverage,
        "warnings": _rag_warnings(chunks_out, coverage["top_score"]),
    }


@router.get("/rag-corpus-stats")
async def rag_corpus_stats(request: Request):
    """Overview of the local rag_chunks corpus — which courses are best covered."""
    await require_admin(request)
    rows = await db.rag_chunks.find({}, {"_id": 0, "metadata": 1}).to_list(60000)
    courses: dict[str, int] = {}
    themes: dict[str, int] = {}
    layers: dict[str, int] = {}
    for row in rows:
        m = row.get("metadata") or {}
        course = m.get("course") or "unknown"
        courses[course] = courses.get(course, 0) + 1
        layers[str(m.get("layer") or "unknown")] = layers.get(str(m.get("layer") or "unknown"), 0) + 1
        for t in (m.get("themes") or []):
            themes[t] = themes.get(t, 0) + 1

    return {
        "total_chunks": len(rows),
        "courses": dict(sorted(courses.items(), key=lambda x: -x[1])),
        "layers": dict(sorted(layers.items(), key=lambda x: -x[1])),
        "top_themes": dict(sorted(themes.items(), key=lambda x: -x[1])[:30]),
        "unique_courses": len(courses),
        "unique_themes": len(themes),
    }



# ── RAG Metadata Enrichment ────────────────────────────────────────────────
# Maps the legacy `book` field (and content heuristics) to the canonical
# `course` field used by the WladBot UI + Admin RAG Studio.

BOOK_TO_COURSE = {
    "verhandlung":          "Verhandlungstraining",
    "5_rollen":             "Die 5 Rollen einer Führungskraft",
    "schwierige_gespraeche": "Schwierige Gespräche",
    "fuehrung_durch_gruende": "Führung durch Gründe",
    "Führung durch Gründe":  "Führung durch Gründe",
    "digitale_rhetorik":     "Digitale Rhetorik",
}

# Canonicalisation: existing rows that have a non-canonical `course` value
# get normalised to the canonical name (run by the enrichment endpoint).
COURSE_ALIASES = {
    "30_schlagfertigkeit":     "30 Schlagfertigkeitstechniken",
    "13_kommunikationsfehler": "13 Kommunikationsfehler",
}

# Heuristics for chunks that have NEITHER `course` NOR `book`.
# Order matters — first match wins.
HEURISTIC_RULES = [
    # 13 Kommunikationsfehler chunks tag themselves with `fehler_nr` or a summary topic
    (lambda m, c: "fehler_nr" in m, "13 Kommunikationsfehler"),
    (lambda m, c: m.get("topic") == "zusammenfassung" and "13 Kommunikationsfehler" in (c or ""),
     "13 Kommunikationsfehler"),
    # Schlagfertigkeit chunks always carry a `technique` numeric tag + `name`
    (lambda m, c: isinstance(m.get("technique"), int) and m.get("name"),
     "30 Schlagfertigkeitstechniken"),
    # Argumentorik / Masterclass organisational FAQ
    (lambda m, c: "Masterclass" in str(m.get("topic", "")),
     "Argumentorik Masterclass FAQ"),
    # Rolle-1-5 framework chunks (5 Rollen course expansion)
    (lambda m, c: isinstance(m.get("role"), int) and 1 <= m["role"] <= 5,
     "Die 5 Rollen einer Führungskraft"),
    # 3-Layer Elite-Leader framework foundational chunks
    (lambda m, c: m.get("framework") == "3layer", "Leader-OS Framework"),
    # Other Leader-OS meta frameworks (diagnostic / ecosystem / agents)
    (lambda m, c: m.get("framework") in {"diagnostic", "ecosystem", "agents"},
     "Leader-OS Framework"),
    # WladBot-expansion library (synthetic enrichment chunks)
    (lambda m, c: m.get("author") == "wladbot_expansion", "WladBot Expansion Library"),
    # Meta / resource pointers
    (lambda m, c: m.get("topic") in {"weiterführende_ressourcen", "weiterfuehrende_ressourcen"},
     "Empfehlungen & Ressourcen"),
]


def _infer_course(meta: dict, content: str) -> str | None:
    """Return the inferred canonical course name, or None if no match.

    Also returns the canonical name for chunks already labeled with an alias.
    """
    current = meta.get("course")
    if current:
        # Normalise non-canonical aliases
        return COURSE_ALIASES.get(current) if current in COURSE_ALIASES else None
    book = meta.get("book")
    if book and book in BOOK_TO_COURSE:
        return BOOK_TO_COURSE[book]
    for predicate, course_name in HEURISTIC_RULES:
        try:
            if predicate(meta, content or ""):
                return course_name
        except Exception:
            continue
    return None


@router.post("/rag-enrich-metadata")
async def rag_enrich_metadata(request: Request):
    """One-shot endpoint to backfill `course` metadata for every chunk that's missing it.

    Body (optional): { "dry_run": bool, "limit": int }
    Returns a per-course summary of how many chunks were enriched.
    """
    await require_admin(request)
    body = {}
    try:
        body = await request.json()
    except Exception:
        body = {}
    dry_run = bool(body.get("dry_run", False))
    limit = int(body.get("limit", 1000))

    import os
    import httpx

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not (url and key):
        raise HTTPException(status_code=503, detail="Supabase not configured")

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            f"{url}/rest/v1/wladbot_documents?select=id,metadata,content&limit={limit}",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Supabase fetch failed: {r.text[:200]}")
        rows = r.json() if isinstance(r.json(), list) else []

        enriched_by_course: dict[str, int] = {}
        skipped_no_match = 0
        already_labeled = 0
        updates_failed = 0
        plan: list[dict] = []

        for row in rows:
            meta = row.get("metadata") or {}
            current_course = meta.get("course")
            inferred = _infer_course(meta, row.get("content") or "")
            if current_course and not inferred:
                # already on a canonical course
                already_labeled += 1
                continue
            if not inferred:
                skipped_no_match += 1
                continue
            enriched_by_course[inferred] = enriched_by_course.get(inferred, 0) + 1
            plan.append({"id": row["id"], "course": inferred,
                         "was": current_course or "(none)"})

            if dry_run:
                continue

            new_meta = dict(meta)
            new_meta["course"] = inferred
            patch_resp = await client.patch(
                f"{url}/rest/v1/wladbot_documents?id=eq.{row['id']}",
                headers=headers,
                json={"metadata": new_meta},
            )
            if patch_resp.status_code not in (200, 204):
                updates_failed += 1

    return {
        "dry_run": dry_run,
        "total_scanned": len(rows),
        "already_labeled": already_labeled,
        "enriched_by_course": dict(sorted(enriched_by_course.items(), key=lambda x: -x[1])),
        "enriched_total": sum(enriched_by_course.values()),
        "skipped_no_match": skipped_no_match,
        "updates_failed": updates_failed,
        "plan_preview": plan[:25] if dry_run else [],
    }


@router.get("/rag-uncategorized-samples")
async def rag_uncategorized_samples(request: Request, sample_size: int = 20):
    """Return sample chunks that have neither `course` nor `book` — useful to extend heuristics."""
    await require_admin(request)
    import os
    import httpx

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not (url and key):
        raise HTTPException(status_code=503, detail="Supabase not configured")

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            f"{url}/rest/v1/wladbot_documents?select=id,metadata,content&limit=2000",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Supabase fetch failed: {r.text[:200]}")
    rows = r.json() if isinstance(r.json(), list) else []

    samples = []
    for row in rows:
        m = row.get("metadata") or {}
        if m.get("course") or m.get("book"):
            continue
        samples.append({
            "id": row["id"],
            "metadata": m,
            "preview": (row.get("content") or "")[:240],
        })
        if len(samples) >= sample_size:
            break
    return {"count": len(samples), "samples": samples}



# ─────────────────────────────────────────────────────────────────────────
# Learning Videos — admin endpoints for managing Vimeo metadata
# ─────────────────────────────────────────────────────────────────────────

@router.get("/learning-videos")
async def admin_list_learning_videos(request: Request):
    """List all learning videos with their current vimeo metadata status."""
    await require_admin(request)
    from routes.my_path import LEARNING_VIDEOS

    overrides = {row["id"]: row async for row in db.learning_videos.find({}, {"_id": 0}) if row.get("id")}
    out = []
    for v in LEARNING_VIDEOS:
        ov = overrides.get(v["id"], {})
        merged = {
            "id": v["id"],
            "title": v["title"],
            "module": v["module"],
            "min_tier": v["min_tier"],
            "duration": v["duration"],
            "episodes": v["episodes"],
            "vimeo_id": ov.get("vimeo_id"),
            "vimeo_url": ov.get("vimeo_url"),
            "video_url": ov.get("video_url"),
            "release_date": ov.get("release_date"),
            "has_video": bool(ov.get("vimeo_id") or ov.get("vimeo_url") or ov.get("video_url")),
        }
        out.append(merged)
    ready = sum(1 for v in out if v["has_video"])
    return {"videos": out, "total": len(out), "ready": ready, "missing": len(out) - ready}


@router.put("/learning-videos/{video_id}")
async def admin_update_learning_video(video_id: str, request: Request):
    """Upsert vimeo metadata for a learning video. Body: {vimeo_id, vimeo_url, video_url, release_date}."""
    await require_admin(request)
    from routes.my_path import LEARNING_VIDEOS

    valid_ids = {v["id"] for v in LEARNING_VIDEOS}
    if video_id not in valid_ids:
        raise HTTPException(status_code=404, detail=f"Unknown video id: {video_id}")

    body = await request.json()
    update_fields = {}
    for field in ("vimeo_id", "vimeo_url", "video_url", "release_date", "transcript_url", "thumbnail_url"):
        if field in body:
            value = body[field]
            if value in (None, ""):
                update_fields[field] = None
            else:
                update_fields[field] = str(value).strip()

    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields provided")

    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.learning_videos.update_one(
        {"id": video_id},
        {"$set": update_fields, "$setOnInsert": {"id": video_id,
                                                 "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    row = await db.learning_videos.find_one({"id": video_id}, {"_id": 0})
    return {"updated": True, "video": row}
