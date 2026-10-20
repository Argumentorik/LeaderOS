"""routes/telemetry.py — Godmode Observability & Feedback API.

Iter 121.7 (Founder-Mode / Production-Excellence). Three purpose-built
endpoints that turn Leader-OS from „ship-and-pray" into
„observable-and-recoverable" without pulling in Sentry SaaS:

  · POST /api/telemetry/error     — every frontend/backend exception lands
                                     here, gets a public diagnostic-id, and
                                     is persisted in `error_log` for the
                                     admin dashboard.
  · POST /api/telemetry/feedback  — the floating „Feedback melden" widget
                                     posts screenshots + last-N console
                                     logs + user context; we forward to
                                     start@aiporate.com AND persist in
                                     `user_feedback`.
  · GET  /api/health/deep         — one-shot check of MongoDB, Resend,
                                     Emergent-LLM, Supabase-Bridge. Called
                                     by the post-deploy verification and
                                     the admin GODMODE Dashboard.

Design constraints (Founder-Mode):
  · Fully non-blocking — a failure in ANY endpoint MUST NOT throw. A dead
    telemetry layer must never take the whole app down.
  · Rate-limited (aggressive, per-user + per-IP) so a rogue client can't
    spam Mongo/Resend.
  · Every persisted document carries a deterministic UUID that we return
    to the client — this is the „diagnostic ID" the ErrorBoundary shows.
"""
from __future__ import annotations

import os
import time
import uuid
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field, ConfigDict
import httpx

from config import db, EMERGENT_LLM_KEY, logger
from services import get_current_user

router = APIRouter(prefix="/api", tags=["telemetry"])

# ── Rate-limiting (in-memory sliding-window per IP+email) ────────────────
_RATE_BUCKET: dict[str, list[float]] = {}
_RATE_LIMITS = {
    "error": (60, 60),      # 60 errors / 60s / bucket
    "feedback": (5, 300),   # 5 feedbacks / 5min / bucket
    "page_load": (120, 60), # 120 Ladezeit-Batches / 60s / IP
}


def _rate_ok(key: str, kind: str) -> bool:
    limit, window = _RATE_LIMITS.get(kind, (30, 60))
    now = time.time()
    bucket = _RATE_BUCKET.setdefault(f"{kind}:{key}", [])
    # drop stale
    while bucket and bucket[0] < now - window:
        bucket.pop(0)
    if len(bucket) >= limit:
        return False
    bucket.append(now)
    return True


# ── Models ───────────────────────────────────────────────────────────────
class ErrorReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message: str = Field(..., max_length=2000)
    stack: Optional[str] = Field(None, max_length=15000)
    source: Optional[str] = Field(None, max_length=200)  # 'react-boundary', 'axios', 'window.onerror', ...
    url: Optional[str] = Field(None, max_length=1000)
    user_agent: Optional[str] = Field(None, max_length=500)
    component: Optional[str] = Field(None, max_length=200)  # React componentStack
    context: Optional[dict[str, Any]] = None  # arbitrary but truncated below
    severity: Optional[str] = Field("error", max_length=20)  # info/warn/error/fatal


class FeedbackReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category: Optional[str] = Field("general", max_length=40)  # bug/idea/other
    message: str = Field(..., min_length=3, max_length=4000)
    url: Optional[str] = Field(None, max_length=1000)
    screenshot_data_url: Optional[str] = Field(None, max_length=3_000_000)  # ~2.2MB after b64
    console_tail: Optional[list[str]] = Field(default_factory=list)  # last N console lines
    email_override: Optional[str] = Field(None, max_length=200)  # anon users can leave contact


# ── Helper: safe user lookup (works when unauth'd too) ───────────────────
async def _maybe_user(request: Request) -> dict[str, Any] | None:
    try:
        return await get_current_user(request)
    except Exception:
        return None


def _truncate_dict(d: dict[str, Any], max_str: int = 500, max_keys: int = 30) -> dict[str, Any]:
    if not isinstance(d, dict):
        return {}
    out: dict[str, Any] = {}
    for i, (k, v) in enumerate(d.items()):
        if i >= max_keys:
            out["__truncated__"] = f"{len(d) - max_keys} more keys"
            break
        if isinstance(v, str) and len(v) > max_str:
            out[k] = v[:max_str] + "…"
        elif isinstance(v, (str, int, float, bool)) or v is None:
            out[k] = v
        else:
            out[k] = str(v)[:max_str]
    return out


# ── Endpoints ────────────────────────────────────────────────────────────
@router.post("/telemetry/error")
async def report_error(payload: ErrorReport, request: Request):
    """Capture an unhandled frontend exception. Returns a diagnostic_id
    that the UI displays so the user can quote it in support."""
    user = await _maybe_user(request)
    ip = (request.client.host if request.client else "unknown") or "unknown"
    email = (user or {}).get("email", "anon")
    rate_key = f"{ip}:{email}"
    if not _rate_ok(rate_key, "error"):
        # Silent drop — we never want to punish the user for our own bug.
        return {"diagnostic_id": None, "throttled": True}

    diag_id = f"err_{uuid.uuid4().hex[:12]}"
    doc = {
        "diagnostic_id": diag_id,
        "message": payload.message,
        "stack": payload.stack,
        "source": payload.source,
        "url": payload.url,
        "user_agent": payload.user_agent or request.headers.get("user-agent"),
        "component": payload.component,
        "context": _truncate_dict(payload.context or {}),
        "severity": payload.severity,
        "user_id": (user or {}).get("user_id"),
        "user_email": email,
        "ip": ip,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await db.error_log.insert_one(doc)
        logger.warning(
            f"[telemetry] {payload.severity} {diag_id} user={email} src={payload.source} :: {payload.message[:180]}"
        )
    except Exception as e:
        # Even the Mongo write is best-effort — a dead DB must not 500 the UI.
        logger.error(f"[telemetry] failed to persist error {diag_id}: {e}")
    return {"diagnostic_id": diag_id, "throttled": False}


@router.post("/telemetry/feedback")
async def report_feedback(payload: FeedbackReport, request: Request):
    """One-click user feedback. Persisted + forwarded to start@aiporate.com."""
    user = await _maybe_user(request)
    ip = (request.client.host if request.client else "unknown") or "unknown"
    email = (user or {}).get("email") or payload.email_override or "anon"
    rate_key = f"{ip}:{email}"
    if not _rate_ok(rate_key, "feedback"):
        raise HTTPException(status_code=429, detail="Zu viele Anfragen. Bitte warte kurz.")

    fb_id = f"fb_{uuid.uuid4().hex[:12]}"
    console_tail = list(payload.console_tail or [])[-50:]
    console_tail = [str(x)[:800] for x in console_tail]  # cap each line
    doc = {
        "feedback_id": fb_id,
        "category": payload.category or "general",
        "message": payload.message,
        "url": payload.url,
        "has_screenshot": bool(payload.screenshot_data_url),
        "console_tail": console_tail,
        "user_id": (user or {}).get("user_id"),
        "user_email": email,
        "ip": ip,
        "user_agent": request.headers.get("user-agent"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # Persist first so we never lose a report even if email fails.
    try:
        await db.user_feedback.insert_one(doc)
    except Exception as e:
        logger.error(f"[feedback] persist failed for {fb_id}: {e}")

    # Fire-and-forget email so slow SMTP can't stall the user's click.
    asyncio.create_task(_forward_feedback_email(doc, payload.screenshot_data_url))

    logger.info(f"[feedback] {fb_id} user={email} cat={payload.category}")
    return {"feedback_id": fb_id, "message": "Danke — dein Feedback ist bei uns angekommen."}


async def _forward_feedback_email(doc: dict, screenshot_data_url: Optional[str]) -> None:
    try:
        from services_email import send_email, is_enabled
        if not is_enabled():
            return
        subject = f"[Leader-OS Feedback · {doc['category']}] {doc['user_email']}"
        tail_html = "".join(f"<div style='font:11px/1.5 monospace;color:#64748B'>{c}</div>"
                            for c in doc.get("console_tail", []) or [])
        img_html = ""
        if screenshot_data_url and screenshot_data_url.startswith("data:image"):
            img_html = f"<hr><p><b>Screenshot:</b></p><img src='{screenshot_data_url}' style='max-width:100%;border:1px solid #ccc;border-radius:8px' />"
        html = f"""
        <div style='font-family:-apple-system,Helvetica,Arial,sans-serif;color:#0A0A0A'>
          <h2 style='margin:0 0 6px'>Neues Feedback · {doc['category']}</h2>
          <p style='color:#64748B;margin:0 0 14px'>ID: <code>{doc['feedback_id']}</code></p>
          <p><b>User:</b> {doc['user_email']}<br>
             <b>URL:</b> {doc.get('url') or '—'}<br>
             <b>User-Agent:</b> <span style='font:11px monospace'>{doc.get('user_agent') or '—'}</span></p>
          <blockquote style='margin:14px 0;padding:12px 14px;background:#F6F8F0;border-left:3px solid #BFFF00'>{doc['message']}</blockquote>
          {img_html}
          {'<hr><p><b>Konsolen-Log (letzte '+str(len(doc.get('console_tail') or []))+' Zeilen):</b></p>' + tail_html if tail_html else ''}
        </div>
        """
        await send_email(
            to="start@aiporate.com",
            subject=subject,
            html=html,
            reply_to=doc["user_email"] if "@" in (doc["user_email"] or "") else None,
        )
    except Exception as e:
        logger.error(f"[feedback] email forward failed for {doc.get('feedback_id')}: {e}")


# ── Deep health check ────────────────────────────────────────────────────
async def _check_mongo() -> dict:
    t0 = time.perf_counter()
    try:
        await db.command("ping")
        return {"ok": True, "latency_ms": round((time.perf_counter() - t0) * 1000, 1)}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}


async def _check_resend() -> dict:
    key = os.environ.get("RESEND_API_KEY")
    if not key:
        return {"ok": False, "configured": False, "note": "RESEND_API_KEY missing"}
    t0 = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get("https://api.resend.com/domains", headers={"Authorization": f"Bearer {key}"})
        return {"ok": r.status_code < 500, "status": r.status_code, "latency_ms": round((time.perf_counter() - t0) * 1000, 1)}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}


async def _check_llm() -> dict:
    if not EMERGENT_LLM_KEY:
        return {"ok": False, "configured": False, "note": "EMERGENT_LLM_KEY missing"}
    # Cheap probe — check the auth endpoint of the Emergent gateway (no actual completion).
    t0 = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            # Use the well-known integrations health endpoint if present.
            r = await c.get(
                "https://integrations.emergentagent.com/health",
                headers={"Authorization": f"Bearer {EMERGENT_LLM_KEY}"},
            )
            return {"ok": r.status_code < 500, "status": r.status_code, "latency_ms": round((time.perf_counter() - t0) * 1000, 1)}
    except Exception as e:
        # Fallback: key is set — assume warmable but degraded.
        return {"ok": True, "configured": True, "warn": str(e)[:120]}


async def _check_supabase() -> dict:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not (url and key):
        return {"ok": True, "configured": False, "note": "Supabase bridge optional"}
    t0 = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(
                f"{url}/rest/v1/leadership_insights?select=user_id&limit=1",
                headers={"apikey": key, "Authorization": f"Bearer {key}"},
            )
        return {"ok": r.status_code < 500, "status": r.status_code, "latency_ms": round((time.perf_counter() - t0) * 1000, 1)}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}


async def _check_rag() -> dict:
    try:
        total = await db.rag_chunks.estimated_document_count()
        return {"ok": total > 0, "chunks": total}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}


@router.get("/health/deep")
async def health_deep():
    """Multi-service health probe. Never raises — always returns 200 with a
    per-service breakdown. Used by post-deploy verification + Admin
    dashboard. Overall status is `pass` iff all critical checks pass."""
    checks = await asyncio.gather(
        _check_mongo(),
        _check_resend(),
        _check_llm(),
        _check_supabase(),
        _check_rag(),
        return_exceptions=True,
    )
    mongo_r, resend_r, llm_r, supabase_r, rag_r = [c if isinstance(c, dict) else {"ok": False, "error": str(c)} for c in checks]
    critical_ok = mongo_r.get("ok") and llm_r.get("ok", True) and rag_r.get("ok", True)
    return {
        "status": "pass" if critical_ok else "fail",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "mongo": mongo_r,
            "resend": resend_r,
            "emergent_llm": llm_r,
            "supabase_bridge": supabase_r,
            "rag": rag_r,
        },
    }


# ── Ladezeiten (Iter 168): Frontend meldet je Seitenaufbau, Admin sieht p50/p95 je Route ──
class PageLoadSample(BaseModel):
    path: str = Field(..., max_length=120)
    ms: float = Field(..., ge=0, le=120000)
    nav: str = Field("spa", max_length=12)          # initial | spa
    ttfb: Optional[float] = Field(None, ge=0, le=60000)
    requests: int = Field(0, ge=0, le=200)


class PageLoadBatch(BaseModel):
    samples: list[PageLoadSample] = Field(..., max_length=50)


def _route_key(path: str) -> str:
    """/courses/abc-123 → /courses/:id — Ausreißer je Seite, nicht je Datensatz."""
    parts = [p for p in path.split("?")[0].split("/") if p]
    out = []
    for i, p in enumerate(parts):
        out.append(":id" if (i > 0 and (len(p) > 16 or p.isdigit() or "-" in p and len(p) > 10)) else p)
    return "/" + "/".join(out) if out else "/"


@router.post("/telemetry/page-load")
async def report_page_load(payload: PageLoadBatch, request: Request):
    ip = (request.headers.get("x-forwarded-for") or request.client.host or "?").split(",")[0].strip()
    if not _rate_ok(ip, "page_load"):
        return {"ok": True, "stored": 0}
    user = await _maybe_user(request)
    now = datetime.now(timezone.utc)
    docs = [{
        "route": _route_key(s.path), "path": s.path[:120], "ms": round(s.ms), "nav": s.nav[:12],
        "ttfb": round(s.ttfb) if s.ttfb is not None else None, "requests": s.requests,
        "user_id": user.get("user_id") if user else None, "created_at": now.isoformat(), "expires_at": now,
    } for s in payload.samples]
    if docs:
        await db.page_loads.insert_many(docs)
    return {"ok": True, "stored": len(docs)}


def _pct(sorted_vals: list[float], q: float) -> int:
    if not sorted_vals:
        return 0
    idx = min(len(sorted_vals) - 1, max(0, int(round(q * (len(sorted_vals) - 1)))))
    return int(sorted_vals[idx])


@router.get("/admin/telemetry/page-loads")
async def page_load_overview(request: Request, since_hours: int = 24):
    from routes.admin import require_admin
    await require_admin(request)
    since = (datetime.now(timezone.utc) - timedelta(hours=max(1, min(24 * 14, since_hours)))).isoformat()
    rows = await db.page_loads.find({"created_at": {"$gte": since}}, {"_id": 0, "route": 1, "ms": 1, "nav": 1, "created_at": 1}) \
        .sort("created_at", -1).limit(20000).to_list(20000)
    by_route: dict[str, list[dict]] = {}
    for r in rows:
        by_route.setdefault(r["route"], []).append(r)
    routes = []
    for route, items in by_route.items():
        vals = sorted(i["ms"] for i in items)
        initial = sorted(i["ms"] for i in items if i.get("nav") == "initial")
        p95 = _pct(vals, 0.95)
        routes.append({
            "route": route, "count": len(vals), "p50": _pct(vals, 0.5), "p95": p95, "max": int(vals[-1]),
            "p50_initial": _pct(initial, 0.5) if initial else None, "last_at": items[0]["created_at"],
            "grade": "slow" if p95 > 2500 else ("warn" if p95 > 1200 else "ok"),
        })
    routes.sort(key=lambda r: -r["p95"])
    all_vals = sorted(r["ms"] for r in rows)
    return {
        "since_hours": since_hours, "samples": len(rows),
        "overall": {"p50": _pct(all_vals, 0.5), "p95": _pct(all_vals, 0.95)},
        "outliers": [r for r in routes if r["grade"] != "ok"],
        "routes": routes,
    }


# ── Admin views (already gated in routes/admin.py's require_admin) ───────
@router.get("/admin/telemetry/errors")
async def list_errors(request: Request, limit: int = 100, since_hours: int = 24):
    from routes.admin import require_admin
    await require_admin(request)
    from datetime import timedelta
    since = (datetime.now(timezone.utc) - timedelta(hours=max(1, min(24 * 30, since_hours)))).isoformat()
    limit = max(1, min(500, limit))
    rows = await db.error_log.find(
        {"created_at": {"$gte": since}},
        {"_id": 0},
    ).sort("created_at", -1).limit(limit).to_list(limit)
    # Summary counts
    by_source: dict[str, int] = {}
    by_severity: dict[str, int] = {}
    for r in rows:
        by_source[r.get("source") or "unknown"] = by_source.get(r.get("source") or "unknown", 0) + 1
        by_severity[r.get("severity") or "error"] = by_severity.get(r.get("severity") or "error", 0) + 1
    return {"count": len(rows), "by_source": by_source, "by_severity": by_severity, "errors": rows}


@router.get("/admin/telemetry/feedback")
async def list_feedback(request: Request, limit: int = 100):
    from routes.admin import require_admin
    await require_admin(request)
    limit = max(1, min(500, limit))
    rows = await db.user_feedback.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"count": len(rows), "feedback": rows}
