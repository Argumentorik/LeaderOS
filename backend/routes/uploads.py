"""File upload routes - Profile picture + file storage."""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import Response
import uuid
import os
import requests
from datetime import datetime, timezone

from config import db, EMERGENT_LLM_KEY, logger
from services import get_current_user

router = APIRouter(prefix="/api", tags=["uploads"])

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "wladbot"
storage_key = None

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    logger.info("Object storage initialized")
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


@router.post("/upload/profile-picture")
async def upload_profile_picture(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Nur Bilder erlaubt (JPEG, PNG, WebP)")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Datei zu groß (max 5MB)")

    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/profiles/{user['user_id']}/{uuid.uuid4().hex[:12]}.{ext}"

    try:
        result = put_object(path, data, file.content_type)
        storage_path = result.get("path", path)

        await db.files.insert_one({
            "file_id": f"file_{uuid.uuid4().hex[:12]}",
            "storage_path": storage_path,
            "user_id": user["user_id"],
            "file_type": "profile_picture",
            "original_filename": file.filename,
            "content_type": file.content_type,
            "size": len(data),
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"picture": storage_path}})

        return {"path": storage_path, "size": len(data)}
    except Exception as e:
        logger.error(f"Profile picture upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload fehlgeschlagen: {str(e)}")


@router.get("/files/{path:path}")
async def serve_file(path: str, request: Request):
    # SEC-004: cookie/header auth only (no token in URL) + owner-scoped lookup.
    user = await get_current_user(request)
    record = await db.files.find_one(
        {"storage_path": path, "is_deleted": False, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=record.get("content_type", content_type))
    except Exception as e:
        logger.error(f"File serve error: {e}")
        raise HTTPException(status_code=500, detail="File not found")
