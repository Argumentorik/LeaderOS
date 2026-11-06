from fastapi import FastAPI, APIRouter, Request
from dotenv import load_dotenv
from pathlib import Path
import os

# Load env BEFORE any route module imports — several modules read env vars at
# import time (admin JWT secret, security service). If dotenv runs later, those
# reads return empty and the module raises RuntimeError at import.
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging
import uuid
import asyncio
from datetime import datetime, timezone
import resend

from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.responses import JSONResponse

from models import UserCreate
from routes.auth import register_auth_routes
from routes.quiz import register_quiz_routes
from routes.payments import register_payment_routes
from routes.email import register_email_routes, send_welcome_email_background
from routes.admin import register_admin_routes, register_booking_routes, register_enterprise_routes
from services.email_scheduler import start_scheduler, stop_scheduler
from services.security import secure_client_ip

ROOT_DIR = Path(__file__).parent

# --- Database ---
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# --- Config ---
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

if RESEND_API_KEY and RESEND_API_KEY != "your_resend_api_key_here":
    resend.api_key = RESEND_API_KEY

config = {
    "llm_key": os.environ.get('ANTHROPIC_API_KEY', ''),
    "stripe_key": os.environ.get('STRIPE_API_KEY', ''),
    "resend_key": RESEND_API_KEY if RESEND_API_KEY != "your_resend_api_key_here" else "",
    "sender_email": SENDER_EMAIL,
    "admin_password": os.environ.get('ADMIN_PASSWORD', ''),
    "stripe_webhook_secret": os.environ.get('STRIPE_WEBHOOK_SECRET', ''),
}

# --- App Setup ---
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Rate limiter (global · used as decorator on expensive routes) ---
limiter = Limiter(key_func=secure_client_ip, default_limits=[])
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded · try again in a moment ({exc.detail})"},
    )


app.add_middleware(SlowAPIMiddleware)

# --- CORS · production hardened ---
# Wildcard + allow_credentials=True was reflected by Starlette on any Origin,
# letting attacker sites read logged-in users' data. Now: explicit allowlist,
# extendable via CORS_ORIGINS env (comma-separated).
_default_origins = [
    "https://exec-eval.emergent.host",                               # production
    "https://role-assessment-lab.preview.emergentagent.com",         # preview
    "http://localhost:3000",                                         # dev
]
# Explicit override via CORS_ORIGINS env — comma-separated list. Wildcards ("*")
# are FILTERED OUT because with allow_credentials=True Starlette reflects any
# Origin and defeats CSRF/data-exfil protections (SEC-003).
_env_raw = os.environ.get("CORS_ORIGINS", "")
_env_origins = [
    o.strip().strip('"').strip("'")
    for o in _env_raw.split(",")
    if o.strip() and o.strip() != "*"
]
CORS_ORIGINS = list({*_default_origins, *_env_origins})

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"^https://.*\.preview\.emergentagent\.com$",  # allow preview subdomains
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "X-Session-ID"],
)
logger.info(f"[cors] allowlist = {CORS_ORIGINS}")

# --- Register Routes ---
register_auth_routes(api_router, db, config, limiter)
register_quiz_routes(api_router, db, config, limiter)
register_payment_routes(api_router, db, config)
register_email_routes(api_router, db, config, limiter)
register_admin_routes(api_router, db, config)
register_booking_routes(api_router, db, config)
register_enterprise_routes(api_router, db, config, limiter)


# --- Core Endpoints (kept in server.py) ---

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Leader OS Leadership Diagnose"}


import html as html_lib


def _sanitize_user_input(s: str | None, max_len: int = 200) -> str:
    """Strip HTML/script tags + length limit. Used for user-supplied fields
    that get embedded in HTML emails. React UI is safe by default; emails are
    raw HTML templates and need escaping at input time.
    """
    if not s:
        return ""
    return html_lib.escape(s.strip()[:max_len], quote=True)


@api_router.post("/user/create")
@limiter.limit("10/minute")
async def create_user(request: Request, data: UserCreate):
    session_id = str(uuid.uuid4())
    safe_name = _sanitize_user_input(data.name, 100)
    safe_email = (data.email or "").lower().strip()[:254]
    safe_phone = _sanitize_user_input(data.phone, 30)
    doc = {
        "session_id": session_id,
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "name": safe_name, "email": safe_email, "phone": safe_phone, "role": data.role,
        "custom_role": _sanitize_user_input(data.custom_role, 100) if data.custom_role else None,
        "consent_privacy": data.consent_privacy,
        "consent_marketing": data.consent_marketing,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(doc)
    asyncio.create_task(send_welcome_email_background(db, config, safe_name, safe_email, data.role))
    return {"session_id": session_id, "name": safe_name, "email": safe_email, "role": data.role}


@api_router.get("/")
async def root():
    return {"message": "Leader OS Leadership Diagnose API"}


# --- Mount Router ---
app.include_router(api_router)


@app.on_event("startup")
async def startup():
    # Indexes for the drip queue (idempotent)
    await db.email_queue.create_index([("status", 1), ("due_at", 1)])
    await db.email_queue.create_index([("email", 1), ("status", 1)])

    # SEC-001 idempotency guard · unique event_id prevents duplicate Stripe
    # webhook fulfillment on retries (Stripe delivers each event 2-3× within
    # seconds; without this we'd mint license keys N times).
    try:
        await db.stripe_webhook_events.create_index("event_id", unique=True, name="event_id_unique")
    except Exception:
        pass

    # OTP lookup + auto-expiry (Mongo TTL). auth_otp entries auto-purge 15min
    # after `expires_at` (OTP TTL is 10min · buffer 5min for clock skew).
    try:
        await db.auth_otp.create_index("email", unique=True, name="otp_email_unique")
    except Exception:
        pass

    # Uniqueness for users.email — prevents duplicate-account race conditions
    # at 1000-concurrent-user scale. Skip silently if any compatible email index
    # already exists (idempotent on warm restarts).
    try:
        existing = await db.users.list_indexes().to_list(50)
        has_email_unique = any(
            i.get("key", {}) == {"email": 1} and i.get("unique", False)
            for i in existing
        )
        if not has_email_unique:
            try:
                await db.users.create_index("email", unique=True, sparse=True, name="email_unique")
            except Exception:  # duplicates pre-exist → unique not possible
                pass
    except Exception:
        pass

    # Quiz progress (server-side resume + abandonment reminders)
    try:
        await db.quiz_progress.create_index("session_id", unique=True, name="quiz_progress_sid_unique")
        await db.quiz_progress.create_index([("completed", 1), ("updated_at", 1)])
    except Exception:
        pass

    start_scheduler(db)

    # Stripe self-healing background loop — expires stale pending checkouts
    # (> 26h old) every hour. Reconciles paid/expired status against Stripe
    # so the admin dashboard and conversion-funnel math stay accurate.
    import asyncio
    from services.stripe_checkout import start_self_healing_loop
    app.state.stripe_healer_task = asyncio.create_task(
        start_self_healing_loop(db, interval_seconds=3600)
    )


@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()
    # Cancel the self-healing loop cleanly
    healer = getattr(app.state, "stripe_healer_task", None)
    if healer:
        healer.cancel()
    client.close()
