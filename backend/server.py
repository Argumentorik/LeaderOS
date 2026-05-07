from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os
import logging
import uuid
import asyncio
from datetime import datetime, timezone
import resend

from models import UserCreate
from routes.auth import register_auth_routes
from routes.quiz import register_quiz_routes
from routes.payments import register_payment_routes
from routes.email import register_email_routes, send_welcome_email_background
from routes.admin import register_admin_routes, register_booking_routes, register_enterprise_routes

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
    "llm_key": os.environ.get('EMERGENT_LLM_KEY', ''),
    "stripe_key": os.environ.get('STRIPE_API_KEY', ''),
    "resend_key": RESEND_API_KEY if RESEND_API_KEY != "your_resend_api_key_here" else "",
    "sender_email": SENDER_EMAIL,
    "admin_password": os.environ.get('ADMIN_PASSWORD', ''),
}

# --- App Setup ---
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register Routes ---
register_auth_routes(api_router, db)
register_quiz_routes(api_router, db, config)
register_payment_routes(api_router, db, config)
register_email_routes(api_router, db, config)
register_admin_routes(api_router, db, config)
register_booking_routes(api_router, db, config)
register_enterprise_routes(api_router, db, config)


# --- Core Endpoints (kept in server.py) ---

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "WLADHUB Leadership Diagnose"}


@api_router.post("/user/create")
async def create_user(data: UserCreate):
    session_id = str(uuid.uuid4())
    doc = {
        "session_id": session_id,
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "name": data.name, "email": data.email, "role": data.role,
        "custom_role": data.custom_role,
        "consent_privacy": data.consent_privacy,
        "consent_marketing": data.consent_marketing,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(doc)
    asyncio.create_task(send_welcome_email_background(db, config, data.name, data.email, data.role))
    return {"session_id": session_id, "name": data.name, "email": data.email, "role": data.role}


@api_router.get("/")
async def root():
    return {"message": "WLADHUB Leadership Diagnose API"}


# --- Mount Router ---
app.include_router(api_router)


@app.on_event("shutdown")
async def shutdown():
    client.close()
