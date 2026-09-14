"""Rate limiting + security headers middleware."""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from collections import defaultdict
import time
import asyncio

from services_login_security import get_client_ip


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window rate limiter per client IP.

    Tiers:
      - Auth endpoints (/api/auth/login, /register): 20 req/min (brute-force protection)
      - AI endpoints (/api/chat/, /api/video-challenges/*/analyze): 20 req/min
      - General API: 120 req/min
      - Static/non-API: unlimited
    """

    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._cleanup_counter = 0

    def _get_ip(self, request: Request) -> str:
        # Nur der vertrauenswürdige Proxy-Hop zählt (kein client-gesetztes XFF/CF-Header).
        return get_client_ip(request)

    # Iter 178 (Go-Live-Check): nur Credential-Endpoints werden hart begrenzt.
    # Session-Endpoints (/auth/me, /auth/refresh, /auth/providers, /auth/logout)
    # laufen bei jedem Seitenaufruf und dürfen NICHT im Login-Budget liegen —
    # sonst löst ein 429 bei mehreren Nutzern hinter derselben IP (Firmen-NAT,
    # Mobilfunk) ein scheinbares Ausloggen aus.
    _CREDENTIAL_PATHS = (
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/magic-link",
        "/api/auth/license",
        "/api/auth/google-session",
        "/api/auth/google/callback",
        "/api/auth/apple/callback",
        "/api/auth/microsoft/callback",
        "/api/auth/password/change",
    )

    _MEDIA_PATHS = ("/api/guide/media", "/api/guide/broll", "/api/courses/episodes")

    def _get_limit(self, path: str) -> tuple[int, int]:
        """Returns (max_requests, window_seconds) for the given path."""
        # Iter 181 (Code Review): Medien-Auslieferung (Poster-Flut beim Erststart, Range-Requests
        # eines Videos) darf nicht im Kunden-Bucket landen — sonst 429 hinter Firmen-NAT.
        if any(path.startswith(p) for p in self._MEDIA_PATHS):
            return 0, 0
        if any(path.startswith(p) for p in self._CREDENTIAL_PATHS):
            # 40/min je Endpoint und IP — Brute-Force pro Konto wird zusätzlich
            # in routes/auth.py (10 Fehlversuche / 15 min je E-Mail+IP) gebremst.
            return 40, 60
        if "/api/chat/send" in path or "/analyze" in path:
            return 20, 60
        if path.startswith("/api/"):
            return 120, 60
        return 0, 0  # no limit for non-API

    def _bucket(self, path: str) -> str:
        """Eigener Zähler je Credential-Endpoint, sonst je API-Bereich."""
        for p in self._CREDENTIAL_PATHS:
            if path.startswith(p):
                return p
        parts = path.split("/")
        return parts[2] if len(parts) > 2 else "api"

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        max_req, window = self._get_limit(path)

        if max_req == 0:
            return await call_next(request)

        ip = self._get_ip(request)
        key = f"{ip}:{self._bucket(path)}"
        now = time.monotonic()

        # Prune old entries
        self._hits[key] = [t for t in self._hits[key] if now - t < window]

        if len(self._hits[key]) >= max_req:
            retry_after = int(window - (now - self._hits[key][0])) + 1
            return JSONResponse(
                status_code=429,
                content={"detail": "Zu viele Anfragen. Bitte warte einen Moment."},
                headers={"Retry-After": str(retry_after)},
            )

        self._hits[key].append(now)

        # Periodic cleanup of stale keys (every 500 requests)
        self._cleanup_counter += 1
        if self._cleanup_counter >= 500:
            self._cleanup_counter = 0
            asyncio.get_event_loop().call_soon(self._cleanup, now, window)

        return await call_next(request)

    def _cleanup(self, now: float, max_window: int = 120):
        stale = [k for k, v in self._hits.items() if not v or now - v[-1] > max_window]
        for k in stale:
            del self._hits[k]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Production-grade security headers.
    Prevents clickjacking, XSS, MIME sniffing, and enforces HTTPS.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Prevent clickjacking — only allow embedding from same origin
        response.headers["X-Frame-Options"] = "SAMEORIGIN"

        # Block MIME-type sniffing (prevents IE from interpreting files as different MIME types)
        response.headers["X-Content-Type-Options"] = "nosniff"

        # XSS Protection fallback for older browsers
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer policy — send origin only, strip path info
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions policy — disable unused browser features
        response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=(), payment=()"

        # HSTS — force HTTPS for 2 years, preload-list eligible
        if request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"

        # CSP (safe baseline for an API): no plugins, no framing, no base hijack
        response.headers["Content-Security-Policy"] = (
            "frame-ancestors 'self'; object-src 'none'; base-uri 'self'"
        )

        # Allow OAuth popups (Google Sign-In) while isolating the browsing context
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"

        # Block Flash/PDF cross-domain policy files
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

        return response
