"""File upload routes - Profile picture + file storage."""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import Response
import uuid
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


def object_exists(path: str) -> bool:
    """Iter 185: Liegt das Objekt wirklich abrufbar im Speicher?

    Die Poster-Prüfung im Admin-Bereich verließ sich bisher darauf, dass ein
    Pfad in der Datenbank *eingetragen* ist. Kundenmeldung: „die Thumbnails
    sind nicht immer da" — ein eingetragener Pfad kann ins Leere zeigen.
    """
    if not path:
        return False
    key = init_storage()
    try:
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Range": "bytes=0-64"},
            timeout=20, stream=True,
        )
        ok = resp.status_code < 400
        resp.close()
        return ok
    except requests.RequestException:
        return False


def download_object(path: str, dest: str, chunk_size: int = 1024 * 1024) -> str:
    """Objekt gestreamt auf die Platte schreiben (nie komplett im RAM)."""
    key = init_storage()
    with requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=120, stream=True) as resp:
        resp.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in resp.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
        return resp.headers.get("Content-Type", "application/octet-stream")


@router.get("/uploads/health")
async def uploads_health():
    """Diagnostik (aus mvpcode übernommen) — welcher Storage-Backend ist aktiv?
    Public, gibt keine Keys oder Bucket-Inhalte aus.

    Diese Route nutzt den Emergent-Objstore direkt (siehe oben); lib/object_storage
    (Supabase-Shim aus mvpcode) ist bewusst NICHT angeschlossen, weil bestehende
    Objekte im Emergent-Storage liegen und ein ENV-getriebener Wechsel sie
    unauffindbar machen würde.
    """
    return {
        "backend": "emergent",
        "url": STORAGE_URL,
        "initialized": storage_key is not None,
        "key_configured": bool(EMERGENT_LLM_KEY),
    }


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
        from services_actions import record_user_action
        await record_user_action(user["user_id"], "file_uploaded", metadata={"type": "profile_picture", "size": len(data)})

        return {"path": storage_path, "size": len(data)}
    except Exception as e:
        logger.error(f"Profile picture upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload fehlgeschlagen: {str(e)}")


@router.delete("/files/{path:path}")
async def delete_file(path: str, request: Request):
    """GDPR Art. 17 — soft-delete an owned file (storage has no hard-delete API)."""
    user = await get_current_user(request)
    res = await db.files.update_one(
        {"storage_path": path, "user_id": user["user_id"], "is_deleted": False},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}},
    )
    if not res.modified_count:
        raise HTTPException(status_code=404, detail="File not found")
    # If it was the active profile picture, clear it
    await db.users.update_one(
        {"user_id": user["user_id"], "picture": path}, {"$set": {"picture": None}}
    )
    from services_actions import record_user_action
    await record_user_action(user["user_id"], "file_deleted", metadata={"path_prefix": path.split("/")[0]})
    return {"ok": True}


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
