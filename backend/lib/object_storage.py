"""
object_storage — Compat-Shim für den Emergent-Object-Storage.

Migrationsziel: weg von `integrations.emergentagent.com/objstore`,
hin zu Supabase Storage (selbe Project-ID die das RAG schon nutzt:
`srujvjjncrszhaaxepxf`). Routes in uploads.py wechseln per Import-
Swap, sonst gar nichts.

Provider-Switch per ENV:
  - `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` gesetzt → Supabase-Storage
  - sonst → Legacy Emergent-Storage

Bucket-Name: `SUPABASE_STORAGE_BUCKET` (Default `wladbot-uploads`).
Bucket muss VOR der ersten Nutzung im Supabase-Dashboard angelegt sein
(Storage → New Bucket → Private). Code legt ihn nicht automatisch an,
weil das dann bei jedem Boot-Restart einen Schreib-Check macht.

API ist 1:1 die der Emergent-Helfer in uploads.py:
    put_object(path, data, content_type)  → {"path": str, ...}
    get_object(path)                      → (bytes, content_type)

Beide Aufrufe sind synchron (kompatibel mit dem alten Code, der sie
in einem `async def` aber synchron via `requests` aufruft — wir bleiben
beim selben Pattern).
"""

import os
import logging
import requests
from typing import Tuple

logger = logging.getLogger("wladbot.storage")

# Legacy-Endpoint (Emergent). Bleibt als Fallback solange wir parallel laufen.
_LEGACY_BASE = "https://integrations.emergentagent.com/objstore/api/v1/storage"
_legacy_storage_key: str | None = None


def _supabase_configured() -> bool:
    return bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_KEY"))


def _bucket() -> str:
    return os.environ.get("SUPABASE_STORAGE_BUCKET", "wladbot-uploads")


# ─── Native Adapter: Supabase Storage ────────────────────────────

def _supabase_url(path: str) -> str:
    base = os.environ["SUPABASE_URL"].rstrip("/")
    return f"{base}/storage/v1/object/{_bucket()}/{path.lstrip('/')}"


def _supabase_headers(content_type: str | None = None) -> dict:
    key = os.environ["SUPABASE_SERVICE_KEY"]
    h = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
    }
    if content_type:
        h["Content-Type"] = content_type
    return h


def _supabase_put(path: str, data: bytes, content_type: str) -> dict:
    # upsert=true im Header, damit Re-Upload (etwa beim Profil-Avatar)
    # nicht mit 409 Conflict scheitert.
    headers = _supabase_headers(content_type)
    headers["x-upsert"] = "true"
    resp = requests.post(_supabase_url(path), headers=headers, data=data, timeout=120)
    resp.raise_for_status()
    return {"path": path, "bucket": _bucket(), "size": len(data)}


def _supabase_get(path: str) -> Tuple[bytes, str]:
    resp = requests.get(_supabase_url(path), headers=_supabase_headers(), timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ─── Legacy Adapter: Emergent Storage ────────────────────────────

def _emergent_init_key() -> str:
    """Init Emergent-Storage via dem Auth-Token in EMERGENT_LLM_KEY.
    Memoized — der Storage-Key kommt einmalig vom Emergent-Endpoint."""
    global _legacy_storage_key
    if _legacy_storage_key:
        return _legacy_storage_key
    em_token = os.environ.get("EMERGENT_LLM_KEY") or ""
    if not em_token:
        raise RuntimeError(
            "Neither SUPABASE_URL/KEY nor EMERGENT_LLM_KEY are set — "
            "object storage cannot init."
        )
    resp = requests.post(
        f"{_LEGACY_BASE}/init", json={"emergent_key": em_token}, timeout=30
    )
    resp.raise_for_status()
    _legacy_storage_key = resp.json()["storage_key"]
    logger.info("object_storage: legacy Emergent backend initialized")
    return _legacy_storage_key


def _emergent_put(path: str, data: bytes, content_type: str) -> dict:
    key = _emergent_init_key()
    resp = requests.put(
        f"{_LEGACY_BASE}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def _emergent_get(path: str) -> Tuple[bytes, str]:
    key = _emergent_init_key()
    resp = requests.get(
        f"{_LEGACY_BASE}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ─── Public API — identisch zur alten put_object/get_object ──────

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Lädt Bytes unter `path` hoch. Path-Konvention bleibt
    `wladbot/<scope>/<uuid>.<ext>` damit Files-Records weiterhin
    den vollen Pfad als Key verwenden."""
    if _supabase_configured():
        return _supabase_put(path, data, content_type)
    return _emergent_put(path, data, content_type)


def get_object(path: str) -> Tuple[bytes, str]:
    """Holt Bytes + Content-Type für `path`."""
    if _supabase_configured():
        return _supabase_get(path)
    return _emergent_get(path)


def health() -> dict:
    """Diagnostik — welcher Backend ist aktiv?"""
    if _supabase_configured():
        return {
            "backend": "supabase",
            "url": os.environ["SUPABASE_URL"],
            "bucket": _bucket(),
        }
    return {
        "backend": "emergent",
        "url": _LEGACY_BASE,
        "warning": "Legacy backend in use. Set SUPABASE_URL + SUPABASE_SERVICE_KEY to migrate.",
    }
