from fastapi import APIRouter, HTTPException, Request, Response
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import httpx
import logging

from models import AuthSession, UserCreate

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_current_user(db, request: Request) -> Optional[dict]:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    if not session_token:
        return None
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


async def fetch_auth_data(session_id: str):
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        return resp.json()


async def upsert_user(db, auth_data: dict) -> str:
    email = (auth_data.get("email") or "").lower().strip()
    name = auth_data.get("name")
    picture = auth_data.get("picture", "")
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user.get("user_id") or existing_user.get("session_id")
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture, "user_id": user_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name, "picture": picture,
            "role": None, "consent_privacy": True, "consent_marketing": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return user_id


async def create_session(db, user_id: str, response: Response) -> str:
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at.isoformat(), "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60
    )
    return session_token


def register_auth_routes(router: APIRouter, db):

    @router.post("/auth/session")
    async def exchange_session(data: AuthSession, response: Response):
        try:
            auth_data = await fetch_auth_data(data.session_id)
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
        user_id = await upsert_user(db, auth_data)
        await create_session(db, user_id, response)
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        return user

    @router.get("/auth/me")
    async def get_me(request: Request):
        user = await get_current_user(db, request)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return user

    @router.post("/auth/logout")
    async def logout(request: Request, response: Response):
        session_token = request.cookies.get("session_token")
        if session_token:
            await db.user_sessions.delete_one({"session_token": session_token})
        response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
        return {"message": "Logged out"}

    @router.post("/auth/update-profile")
    async def update_profile(request: Request):
        user = await get_current_user(db, request)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        data = await request.json()
        update_fields = {}
        for field in ("role", "custom_role", "consent_privacy", "consent_marketing"):
            if field in data:
                update_fields[field] = data[field]
        if update_fields:
            update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_fields})
        return await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})

    @router.get("/privacy-policy")
    async def privacy_policy():
        return {
            "title": "Datenschutzerklärung", "last_updated": "2025-01-01",
            "content": {
                "data_collection": "Wir erheben Name, E-Mail und Diagnose-Antworten.",
                "data_usage": "Daten werden zur Erstellung deines Leadership-Reports verwendet.",
                "data_storage": "Daten werden sicher auf EU-Servern gespeichert.",
                "data_deletion": "Du kannst jederzeit die Löschung deiner Daten anfordern.",
                "cookies": "Wir verwenden notwendige Session-Cookies für die Authentifizierung.",
                "third_parties": "Wir teilen keine Daten mit Dritten ohne deine Zustimmung.",
                "contact": "Datenschutz-Anfragen: datenschutz@leaderos.de"
            }
        }

    @router.delete("/user/delete-data")
    async def delete_user_data(request: Request):
        user = await get_current_user(db, request)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        user_id = user["user_id"]
        await db.users.delete_one({"user_id": user_id})
        await db.user_sessions.delete_many({"user_id": user_id})
        await db.reports.delete_many({"session_id": user_id})
        return {"message": "All your data has been deleted"}

    @router.post("/auth/quick-login")
    async def quick_login(payload: dict):
        """Lightweight returning-user login by phone OR email.
        Lowers signup friction: existing users skip Google OAuth and resume
        their session. Unknown identifiers return 404 so the frontend can
        route into the diagnosis funnel with a prefill.
        """
        identifier = (payload or {}).get("identifier", "").strip()
        if not identifier:
            raise HTTPException(status_code=400, detail="Identifier required")

        looks_like_email = "@" in identifier
        if looks_like_email:
            query = {"email": identifier.lower()}
        else:
            # Match phone loosely: stored values may contain spaces/+/etc.
            digits = "".join(ch for ch in identifier if ch.isdigit())
            if len(digits) < 6:
                raise HTTPException(status_code=400, detail="Invalid identifier")
            # Match last 8 digits at the END of stored phone (handles +49 / 0049 / 0151 variants)
            tail = digits[-8:]
            query = {"phone": {"$regex": f"{tail}$"}}

        user = await db.users.find_one(query, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="No account found")

        # Check if user already has a report
        report = await db.reports.find_one(
            {"$or": [
                {"session_id": user.get("session_id")},
                {"session_id": user.get("user_id")},
            ]},
            {"_id": 0, "session_id": 1},
        )

        return {
            "session_id": user.get("session_id") or user.get("user_id"),
            "user_id": user.get("user_id"),
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone"),
            "has_report": bool(report),
        }
