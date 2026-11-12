"""File upload routes - Profile picture + file storage.

Storage: the private part of the Railway `media` bucket (lib/media_bucket.py).
Object keys are the storage paths kept in the DB (`wladbot/profiles/…`,
`guide/…`, `posters/guide/…`, `uploads/…`, `courses/…`) — the same keys the
Emergent object store used, so the migrated objects resolve unchanged.
`public/` is reserved for routes/media.py and never written here.
"""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import Response
import re
import uuid
from datetime import datetime, timezone

from config import db, logger
from lib import media_bucket
from services import get_current_user

router = APIRouter(prefix="/api", tags=["uploads"])

APP_NAME = "wladbot"

IMAGE_EXT_BY_TYPE = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}
ALLOWED_IMAGE_TYPES = set(IMAGE_EXT_BY_TYPE)
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def init_storage(force: bool = False):
    """Startup check (server.py): logs whether the bucket is configured."""
    if media_bucket.is_configured():
        logger.info("Object storage: Railway bucket %s", media_bucket.bucket_name())
    else:
        logger.warning("Object storage not configured (MEDIA_S3_*) — uploads and guide media will fail")


_UNSAFE_PATH_CHARS = re.compile(r"[?#%\\\x00-\x1f\x7f]")


def _key(path: str) -> str:
    """Validated object key — no query/fragment, traversal or `public/` area."""
    if (
        not path
        or path.startswith("/")
        or path.startswith("public/")
        or _UNSAFE_PATH_CHARS.search(path)
        or any(seg in ("", ".", "..") for seg in path.split("/"))
    ):
        raise ValueError(f"invalid storage path: {path!r}")
    return path


def _s3():
    s3 = media_bucket.client()
    if s3 is None:
        raise RuntimeError("Object storage not configured (MEDIA_S3_*)")
    return s3


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = _key(path)
    _s3().put_object(Bucket=media_bucket.bucket_name(), Key=key, Body=data, ContentType=content_type)
    return {"path": key, "size": len(data)}


def get_object(path: str):
    obj = _s3().get_object(Bucket=media_bucket.bucket_name(), Key=_key(path))
    return obj["Body"].read(), obj.get("ContentType") or "application/octet-stream"


def object_exists(path: str) -> bool:
    """Iter 185: Liegt das Objekt wirklich abrufbar im Speicher?

    Die Poster-Prüfung im Admin-Bereich verließ sich bisher darauf, dass ein
    Pfad in der Datenbank *eingetragen* ist. Kundenmeldung: „die Thumbnails
    sind nicht immer da" — ein eingetragener Pfad kann ins Leere zeigen.
    """
    if not path:
        return False
    try:
        _s3().head_object(Bucket=media_bucket.bucket_name(), Key=_key(path))
        return True
    except Exception:  # noqa: BLE001 — 404, bad path, storage down: all "not there"
        return False


def download_object(path: str, dest: str, chunk_size: int = 1024 * 1024) -> str:
    """Objekt gestreamt auf die Platte schreiben (nie komplett im RAM)."""
    obj = _s3().get_object(Bucket=media_bucket.bucket_name(), Key=_key(path))
    with open(dest, "wb") as f:
        for chunk in obj["Body"].iter_chunks(chunk_size=chunk_size):
            if chunk:
                f.write(chunk)
    return obj.get("ContentType") or "application/octet-stream"


@router.get("/uploads/health")
async def uploads_health():
    """Diagnostik — welcher Storage-Backend ist aktiv? Public, keine Keys."""
    return {"backend": "railway-bucket", "configured": media_bucket.is_configured()}


@router.post("/upload/profile-picture")
async def upload_profile_picture(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Nur Bilder erlaubt (JPEG, PNG, WebP)")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Datei zu groß (max 5MB)")

    ext = IMAGE_EXT_BY_TYPE[file.content_type]
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
        data, content_type = get_object(record["storage_path"])
        return Response(content=data, media_type=record.get("content_type", content_type))
    except Exception as e:
        logger.error(f"File serve error: {e}")
        raise HTTPException(status_code=500, detail="File not found")
