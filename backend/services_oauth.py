"""OAuth ID-token verification for direct provider integration.

Each provider returns a signed ID token (JWT) to the frontend. The frontend
sends it to our backend, which verifies the signature against the provider's
public keys (JWKS) before trusting any claim.

NEVER trust an ID token without verifying its signature, issuer, audience,
and expiry. The verify_* helpers below do all of that.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

import httpx
import jwt
from jwt import PyJWKClient

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

logger = logging.getLogger("wladbot.oauth")


# ────────────────────────────────────────────────────────────────────────────
# Google Sign-In
# ────────────────────────────────────────────────────────────────────────────

def google_client_id() -> Optional[str]:
    """GOOGLE_CLIENT_ID from env — defensively sanitized.

    Strips accidental 'Client:' labels, quotes and whitespace that sneak in
    when the value is copy-pasted out of the Google Cloud Console UI.
    """
    raw = (os.environ.get("GOOGLE_CLIENT_ID") or "").strip().strip('"').strip("'").strip()
    if raw.lower().startswith("client:"):
        raw = raw.split(":", 1)[1].strip()
    return raw or None


def verify_google_id_token(credential: str) -> dict:
    """Verify a Google ID token and return a normalized user profile.

    Raises ValueError if the token is invalid, expired, or audience mismatch.
    """
    client_id = google_client_id()
    if not client_id:
        raise ValueError("GOOGLE_CLIENT_ID is not configured on the server.")

    try:
        # google-auth handles JWKS fetching + caching + signature + exp + iss + aud.
        info = google_id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            client_id,
            clock_skew_in_seconds=10,
        )
    except ValueError as e:
        logger.warning("Google ID token verification failed: %s", e)
        raise

    if info.get("iss") not in {"https://accounts.google.com", "accounts.google.com"}:
        raise ValueError(f"Invalid issuer: {info.get('iss')}")
    if not info.get("email_verified"):
        raise ValueError("Google account email is not verified.")

    return {
        "provider": "google",
        "sub": info["sub"],
        "email": (info["email"] or "").lower(),
        "email_verified": True,
        "name": info.get("name") or "",
        "picture": info.get("picture") or "",
        "given_name": info.get("given_name") or "",
        "family_name": info.get("family_name") or "",
    }


# ────────────────────────────────────────────────────────────────────────────
# Apple Sign-In
# ────────────────────────────────────────────────────────────────────────────

APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
APPLE_ISSUER = "https://appleid.apple.com"
_apple_jwk_client: Optional[PyJWKClient] = None


def apple_service_id() -> Optional[str]:
    """The Apple Services ID acts as the audience claim. Get it from
    https://developer.apple.com → Certificates, Identifiers & Profiles → Services IDs."""
    return os.environ.get("APPLE_SERVICE_ID") or os.environ.get("APPLE_CLIENT_ID") or None


def _get_apple_jwk_client() -> PyJWKClient:
    global _apple_jwk_client
    if _apple_jwk_client is None:
        _apple_jwk_client = PyJWKClient(APPLE_JWKS_URL, cache_keys=True, lifespan=3600)
    return _apple_jwk_client


def verify_apple_id_token(identity_token: str, *, user_payload: Optional[dict] = None) -> dict:
    """Verify an Apple identity token.

    `user_payload` (optional) is the `user` JSON Apple returns ONLY on the very
    first sign-in — it contains the user's first/last name and email. After
    that, only the JWT is available.
    """
    audience = apple_service_id()
    if not audience:
        raise ValueError("APPLE_SERVICE_ID is not configured on the server.")

    jwk_client = _get_apple_jwk_client()
    signing_key = jwk_client.get_signing_key_from_jwt(identity_token)
    info = jwt.decode(
        identity_token,
        signing_key.key,
        algorithms=["RS256"],
        audience=audience,
        issuer=APPLE_ISSUER,
        options={"require": ["exp", "iat", "sub", "aud", "iss"]},
    )

    email = (info.get("email") or "").lower()
    name = ""
    if user_payload and isinstance(user_payload.get("name"), dict):
        first = user_payload["name"].get("firstName") or ""
        last = user_payload["name"].get("lastName") or ""
        name = f"{first} {last}".strip()

    if not email:
        raise ValueError("Apple token has no email claim — request 'email' scope.")

    return {
        "provider": "apple",
        "sub": info["sub"],
        "email": email,
        "email_verified": bool(info.get("email_verified", True)),
        "name": name,
        "picture": "",  # Apple does not provide profile pictures
    }


# ────────────────────────────────────────────────────────────────────────────
# Microsoft (Azure AD / Entra ID)
# ────────────────────────────────────────────────────────────────────────────

_MS_JWKS_URL_TEMPLATE = "https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys"
_MS_ISSUER_V2 = "https://login.microsoftonline.com/{tenant}/v2.0"
_ms_jwk_clients: dict = {}


def microsoft_client_id() -> Optional[str]:
    return os.environ.get("MICROSOFT_CLIENT_ID") or None


def microsoft_tenant() -> str:
    """Default 'common' supports any Microsoft work/school/personal account."""
    return os.environ.get("MICROSOFT_TENANT", "common")


def _get_ms_jwk_client(tenant: str) -> PyJWKClient:
    if tenant not in _ms_jwk_clients:
        _ms_jwk_clients[tenant] = PyJWKClient(
            _MS_JWKS_URL_TEMPLATE.format(tenant=tenant),
            cache_keys=True,
            lifespan=3600,
        )
    return _ms_jwk_clients[tenant]


def verify_microsoft_id_token(id_token_value: str) -> dict:
    """Verify a Microsoft (Entra ID) ID token."""
    audience = microsoft_client_id()
    if not audience:
        raise ValueError("MICROSOFT_CLIENT_ID is not configured on the server.")

    tenant = microsoft_tenant()
    jwk_client = _get_ms_jwk_client(tenant)
    signing_key = jwk_client.get_signing_key_from_jwt(id_token_value)

    # When tenant=common, the issuer in the token is the user's actual tenant ID
    # — so we verify the issuer structure manually.
    info = jwt.decode(
        id_token_value,
        signing_key.key,
        algorithms=["RS256"],
        audience=audience,
        options={"require": ["exp", "iat", "sub", "aud", "iss"], "verify_iss": False},
    )

    iss = info.get("iss") or ""
    if not iss.startswith("https://login.microsoftonline.com/") or "/v2.0" not in iss:
        raise ValueError(f"Invalid Microsoft issuer: {iss}")

    email = (info.get("email") or info.get("preferred_username") or "").lower()
    if not email:
        raise ValueError("Microsoft token has no email/preferred_username.")

    return {
        "provider": "microsoft",
        "sub": info["sub"],
        "email": email,
        "email_verified": True,  # Microsoft work/school emails are pre-verified
        "name": info.get("name") or "",
        "picture": "",  # Graph API call needed for picture — skip for v1
    }


# ────────────────────────────────────────────────────────────────────────────
# Provider availability (for frontend feature detection)
# ────────────────────────────────────────────────────────────────────────────

def available_providers() -> dict:
    """Return which OAuth providers are configured on this server.

    The frontend calls this on the login screen to know which buttons to render.
    Google is served via Emergent-managed OAuth (OAUTH_SESSION_URL) — no
    Google Cloud Console client needed.
    """
    import os
    return {
        "google": bool(os.environ.get("OAUTH_SESSION_URL") or google_client_id()),
        "apple": bool(apple_service_id()),
        "microsoft": bool(microsoft_client_id()),
        "magic_link": True,
    }
