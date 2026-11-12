"""Public media from the Railway `media` bucket: GET /api/media/<name>.

The bucket is private (S3-compatible). For files under `public/` this route
answers with a short-lived presigned redirect, so the browser streams straight
from the bucket — including Range requests, so videos can seek — and the
backend never proxies the bytes. Only `public/` is reachable here; anything
else in the bucket (e.g. user uploads later) stays private.

Bucket client and config: lib/media_bucket.py.

Upload new public files with the bucket credentials (`railway bucket
credentials --bucket media`) to key `public/<name>`, with ContentType and
CacheControl set.
"""
import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from lib import media_bucket

router = APIRouter(prefix="/api/media", tags=["media"])

PREFIX = "public/"
URL_TTL_S = 3600
_SAFE_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]{0,200}$")


@router.get("/{name:path}")
async def public_media(name: str):
    if not _SAFE_NAME.match(name) or ".." in name:
        raise HTTPException(status_code=404, detail="not_found")
    s3 = media_bucket.client()
    if s3 is None:
        raise HTTPException(status_code=503, detail="Media storage not configured")
    # Presigning is local (no network call); a missing key 404s at the bucket.
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": media_bucket.bucket_name(), "Key": PREFIX + name},
        ExpiresIn=URL_TTL_S,
    )
    # Browsers may reuse the redirect briefly; the target stays valid for an hour.
    return RedirectResponse(url, status_code=302, headers={"Cache-Control": "private, max-age=600"})
