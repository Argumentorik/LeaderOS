"""Zernio · Social-Posting-API als dünner REST-Client (LinkedIn, Instagram, …).

Zernio plant und veröffentlicht Posts auf verbundenen Social-Media-Konten
(Konten werden einmalig im Zernio-Dashboard verbunden). Wir sprechen die
REST-API direkt per httpx an, bewusst ohne SDK.

Quellen: https://zernio.com/agent-quickstart.md · https://docs.zernio.com

Env (nur Backend/CLI, niemals ins Frontend oder ins Repo):
  ZERNIO_API_KEY    Bearer-Token aus dem Zernio-Dashboard
  ZERNIO_BASE_URL   optional, Standard https://zernio.com/api/v1

Request-Form laut Docs (Stand Oktober 2026):
  GET  /accounts              verbundene Konten → accountId je Plattform
  POST /posts                 {content, platforms:[{platform, accountId}],
                               mediaItems:[{url, type}], scheduledFor,
                               timezone, publishNow}
  GET  /posts/{id}            Status eines Posts

Plattform-Grenzen, die wir vor dem Request prüfen:
  LinkedIn   bis 20 Bilder ODER genau ein PDF (Dokument-Karussell, ≤300 Seiten,
             ≤100 MB); Dokument nicht mit Bildern/Video mischen
  Instagram  Karussell bis 10 Bilder
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Iterable

import httpx

DEFAULT_BASE_URL = "https://zernio.com/api/v1"
MEDIA_TYPES = ("image", "video", "document")
MAX_IMAGES = {"linkedin": 20, "instagram": 10}


class ZernioError(RuntimeError):
    """Fehler aus der Zernio-API oder aus unserer Vorprüfung."""

    def __init__(self, message: str, status: int | None = None, payload: Any = None):
        super().__init__(message)
        self.status = status
        self.payload = payload


def platform_target(platform: str, account_id: str, **platform_specific: Any) -> dict:
    """Ein Eintrag für `platforms`: Plattform plus accountId aus GET /accounts."""
    if not platform or not account_id:
        raise ZernioError("platform und accountId sind Pflicht")
    target: dict[str, Any] = {"platform": platform.lower(), "accountId": account_id}
    if platform_specific:
        target["platformSpecificData"] = platform_specific
    return target


def media_item(url: str, media_type: str = "image") -> dict:
    """Ein Eintrag für `mediaItems`: öffentliche URL plus Typ."""
    if media_type not in MEDIA_TYPES:
        raise ZernioError(f"unbekannter Medientyp {media_type!r}, erlaubt: {', '.join(MEDIA_TYPES)}")
    if not url.startswith("https://"):
        raise ZernioError(f"Medien-URL muss öffentlich per https erreichbar sein: {url!r}")
    return {"url": url, "type": media_type}


def build_post_payload(
    content: str,
    platforms: Iterable[dict],
    media_items: Iterable[dict] | None = None,
    scheduled_for: str | None = None,
    timezone: str | None = None,
    publish_now: bool = False,
) -> dict:
    """Baut den Body für POST /posts und prüft die Plattform-Grenzen vorab.

    Reine Funktion ohne Netz, damit die Prüfung testbar bleibt. `scheduled_for`
    ist ISO-8601 (z. B. 2026-10-28T07:30:00) und braucht eine IANA-Zeitzone.
    """
    targets = list(platforms)
    media = list(media_items or [])
    if not content.strip():
        raise ZernioError("content darf nicht leer sein")
    if not targets:
        raise ZernioError("mindestens eine Plattform mit accountId angeben")
    if publish_now and scheduled_for:
        raise ZernioError("entweder publishNow oder scheduledFor, nicht beides")
    if not publish_now and not scheduled_for:
        raise ZernioError("ohne publishNow ist scheduledFor Pflicht")
    if scheduled_for and not timezone:
        raise ZernioError("scheduledFor braucht eine Zeitzone, z. B. Europe/Berlin")

    types = [m["type"] for m in media]
    images = types.count("image")
    documents = types.count("document")
    for target in targets:
        name = target["platform"]
        if documents and name != "linkedin":
            raise ZernioError(f"{name}: PDF-Dokumente gehen nur auf LinkedIn")
        if documents > 1:
            raise ZernioError("LinkedIn nimmt genau ein Dokument pro Post")
        if documents and len(media) > 1:
            raise ZernioError("LinkedIn: Dokument nicht mit Bildern oder Video mischen")
        limit = MAX_IMAGES.get(name)
        if limit and images > limit:
            raise ZernioError(f"{name}: höchstens {limit} Bilder pro Post, {images} übergeben")

    payload: dict[str, Any] = {"content": content, "platforms": targets}
    if media:
        payload["mediaItems"] = media
    if publish_now:
        payload["publishNow"] = True
    else:
        payload["scheduledFor"] = scheduled_for
        payload["timezone"] = timezone
    return payload


@dataclass
class ZernioClient:
    api_key: str
    base_url: str = DEFAULT_BASE_URL
    timeout: float = 30.0
    transport: httpx.BaseTransport | None = None  # Tests: httpx.MockTransport

    @classmethod
    def from_env(cls) -> "ZernioClient":
        key = os.environ.get("ZERNIO_API_KEY", "").strip()
        if not key:
            raise ZernioError("ZERNIO_API_KEY fehlt (Backend-Env oder lokale .env)")
        return cls(api_key=key, base_url=os.environ.get("ZERNIO_BASE_URL", DEFAULT_BASE_URL).rstrip("/"))

    @staticmethod
    def is_enabled() -> bool:
        return bool(os.environ.get("ZERNIO_API_KEY", "").strip())

    def _request(self, method: str, path: str, json: dict | None = None) -> Any:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "User-Agent": "LeaderOS/1.0 (+https://leader-os.de)",
        }
        with httpx.Client(base_url=self.base_url, headers=headers, timeout=self.timeout, transport=self.transport) as client:
            try:
                response = client.request(method, path, json=json)
            except httpx.HTTPError as exc:
                raise ZernioError(f"Zernio nicht erreichbar: {exc}") from exc
        body: Any
        try:
            body = response.json()
        except ValueError:
            body = response.text
        if response.status_code >= 400:
            raise ZernioError(f"Zernio {method} {path} → HTTP {response.status_code}: {body}", response.status_code, body)
        return body

    def list_accounts(self) -> Any:
        """Verbundene Konten; die accountId steht in jedem Eintrag."""
        return self._request("GET", "/accounts")

    def create_post(
        self,
        content: str,
        platforms: Iterable[dict],
        media_items: Iterable[dict] | None = None,
        scheduled_for: str | None = None,
        timezone: str | None = None,
        publish_now: bool = False,
    ) -> Any:
        payload = build_post_payload(content, platforms, media_items, scheduled_for, timezone, publish_now)
        return self._request("POST", "/posts", json=payload)

    def get_post(self, post_id: str) -> Any:
        return self._request("GET", f"/posts/{post_id}")
