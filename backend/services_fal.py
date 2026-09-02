"""fal.ai über den Emergent Universal Key (Iter 142).

Nur Queue-Inferenz über den Emergent-Integration-Proxy — keine Fal-Platform-APIs.
Verwendete Endpoints (Contracts wurden vor der Implementierung live geprüft):

  fal-ai/minimax/voice-clone   audio_url            -> custom_voice_id
  fal-ai/minimax/speech-02-hd  text + voice_setting -> audio.url + duration_ms
  fal-ai/sadtalker             source_image_url + driven_audio_url -> video.url

Die Aufrufe sind blockierend (`requests`) und MÜSSEN aus einem Worker-Thread
heraus laufen (`asyncio.to_thread`), damit der Event-Loop frei bleibt.
"""

import logging
import os
import time
from typing import Any, Optional
from urllib.parse import urlparse

import requests

logger = logging.getLogger("wladbot")

VOICE_CLONE_ENDPOINT = "fal-ai/minimax/voice-clone"
TTS_ENDPOINT = "fal-ai/minimax/speech-02-hd"
TALKING_VIDEO_ENDPOINT = "fal-ai/sadtalker"

QUEUE_ORIGIN = "https://queue.fal.run"


def _control_base() -> str:
    base = os.environ.get("INTEGRATION_PROXY_URL", "https://integrations.emergentagent.com").rstrip("/")
    return f"{base}/api/v1/fal"


class FalError(Exception):
    pass


class FalInsufficientCredits(FalError):
    pass


def _headers(extra: Optional[dict] = None) -> dict:
    headers = {
        "Authorization": f"Bearer {os.environ['EMERGENT_LLM_KEY']}",
        "Content-Type": "application/json",
    }
    job_id = os.environ.get("job_id")
    if job_id:
        headers["X-App-ID"] = job_id
        headers["X-Job-ID"] = job_id
    env_id = os.environ.get("run_id")
    if env_id:
        headers["X-Environment-ID"] = env_id
    if extra:
        headers.update(extra)
    return headers


def _trusted_queue_url(value: str) -> str:
    queue_base = urlparse(f"{_control_base()}/queue")
    candidate = urlparse(value)
    prefix = queue_base.path.rstrip("/") + "/"
    if (
        candidate.scheme != queue_base.scheme
        or candidate.netloc != queue_base.netloc
        or candidate.username is not None
        or candidate.password is not None
        or candidate.fragment
        or not candidate.path.startswith(prefix)
    ):
        raise FalError("Proxy lieferte eine nicht vertrauenswürdige Queue-URL")
    return value


def _get_with_retry(url: str, *, timeout_seconds: int, deadline: float, max_attempts: int = 5):
    delay = 1
    for attempt in range(max_attempts):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise FalError("Zeitüberschreitung bei der Generierung")
        try:
            return requests.get(url, headers=_headers(), timeout=min(timeout_seconds, remaining))
        except (requests.ConnectTimeout, requests.ReadTimeout, requests.ConnectionError) as exc:
            if attempt == max_attempts - 1:
                raise FalError("Netzwerkfehler beim Abfragen der Generierung") from exc
            sleep_for = min(delay, deadline - time.monotonic())
            if sleep_for <= 0:
                raise FalError("Zeitüberschreitung bei der Generierung") from exc
            time.sleep(sleep_for)
            delay *= 2
    raise AssertionError("unreachable")


def run_fal(endpoint_id: str, payload: dict, timeout_seconds: int = 900) -> dict[str, Any]:
    """Ein Submit, dann Polling bis zum Endzustand. Submit wird NIE automatisch
    wiederholt — Fal könnte den (kostenpflichtigen) Job schon angenommen haben."""
    control = _control_base()
    submit = requests.post(
        f"{control}/proxy",
        headers=_headers({"X-Fal-Target-Url": f"{QUEUE_ORIGIN}/{endpoint_id}"}),
        json=payload,
        timeout=60,
    )
    if submit.status_code == 402:
        raise FalInsufficientCredits("Universal-Key-Guthaben reicht für diese Generierung nicht")
    if submit.status_code >= 400:
        raise FalError(f"Fal-Submit fehlgeschlagen ({submit.status_code}): {submit.text[:300]}")
    body = submit.json()
    status_url = _trusted_queue_url(body["status_url"])
    response_url = _trusted_queue_url(body["response_url"])

    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        status_res = _get_with_retry(status_url, timeout_seconds=30, deadline=deadline)
        if status_res.status_code >= 400:
            raise FalError(f"Statusabfrage fehlgeschlagen ({status_res.status_code})")
        status_body = status_res.json()
        status = (status_body.get("status") or "").upper()
        if status in {"COMPLETED", "OK"}:
            if status_body.get("error"):
                raise FalError(f"Generierung fehlgeschlagen: {status_body['error']}")
            result = _get_with_retry(response_url, timeout_seconds=60, deadline=deadline)
            if result.status_code >= 400:
                raise FalError(f"Ergebnisabfrage fehlgeschlagen ({result.status_code})")
            return result.json()
        if status in {"FAILED", "CANCELLED", "CANCELED", "ERROR"}:
            raise FalError(f"Generierung fehlgeschlagen: {status}")
        time.sleep(3)
    raise FalError("Zeitüberschreitung bei der Generierung")


# ── Fachliche Wrapper ───────────────────────────────────────────────────────

def clone_voice(audio_url: str) -> str:
    """Klont eine Stimme aus einer Sprachprobe (>= 10 s) und liefert die Voice-ID."""
    result = run_fal(VOICE_CLONE_ENDPOINT, {
        "audio_url": audio_url,
        "model": "speech-02-hd",
        "noise_reduction": True,
        "need_volume_normalization": True,
    }, timeout_seconds=600)
    voice_id = result.get("custom_voice_id")
    if not voice_id:
        raise FalError("Voice-Clone lieferte keine custom_voice_id")
    return voice_id


def synthesize_speech(text: str, voice_id: str, speed: float = 1.0) -> tuple[bytes, int]:
    """Deutsche Sprachausgabe. Liefert (mp3-Bytes, Dauer in Sekunden)."""
    result = run_fal(TTS_ENDPOINT, {
        "text": text,
        "voice_setting": {"voice_id": voice_id, "speed": speed, "vol": 1, "pitch": 0},
        "audio_setting": {"format": "mp3", "sample_rate": 32000, "channel": 1, "bitrate": 128000},
        "output_format": "url",
        "language_boost": "German",
    }, timeout_seconds=600)
    url = (result.get("audio") or {}).get("url")
    if not url:
        raise FalError("TTS lieferte keine Audio-URL")
    duration = round((result.get("duration_ms") or 0) / 1000)
    return download(url), duration


def render_talking_video(image_url: str, audio_url: str, resolution: str = "512") -> bytes:
    """Standbild + Tonspur -> sprechendes Video (mp4-Bytes)."""
    result = run_fal(TALKING_VIDEO_ENDPOINT, {
        "source_image_url": image_url,
        "driven_audio_url": audio_url,
        "preprocess": "full",
        "still_mode": True,
        "expression_scale": 1.0,
        "face_model_resolution": resolution,
        "face_enhancer": "gfpgan",
    }, timeout_seconds=1800)
    url = (result.get("video") or {}).get("url")
    if not url:
        raise FalError("Video-Generierung lieferte keine Video-URL")
    return download(url, timeout=300)


# ── Cinematic (Iter 143): Keyframe -> Bewegung -> Lipsync ──────────────────

IMAGE_EDIT_ENDPOINT = "fal-ai/nano-banana/edit"
I2V_ENDPOINT = "fal-ai/kling-video/v2.1/standard/image-to-video"
LIPSYNC_ENDPOINT = "fal-ai/kling-video/lipsync/audio-to-video"

COST_KEYFRAME = 0.04
COST_I2V = {"5": 0.25, "10": 0.50}
COST_LIPSYNC_PER_S = 0.014


def edit_image(prompt: str, image_urls: list[str], aspect_ratio: str = "9:16") -> bytes:
    """Referenzbilder + Prompt -> ein Keyframe (png-Bytes)."""
    result = run_fal(IMAGE_EDIT_ENDPOINT, {
        "prompt": prompt,
        "image_urls": image_urls,
        "num_images": 1,
        "output_format": "png",
        "aspect_ratio": aspect_ratio,
    }, timeout_seconds=600)
    images = result.get("images") or []
    url = images[0].get("url") if images else None
    if not url:
        raise FalError("Keyframe-Generierung lieferte kein Bild")
    return download(url)


def image_to_video(image_url: str, prompt: str, duration: str = "10", aspect_ratio: str = "9:16") -> bytes:
    """Keyframe + Bewegungs-Prompt -> Kling-Shot (mp4-Bytes, ohne Ton)."""
    result = run_fal(I2V_ENDPOINT, {
        "prompt": prompt,
        "image_url": image_url,
        "duration": duration,
        "aspect_ratio": aspect_ratio,
        "negative_prompt": "blur, distort, low quality, extra limbs, deformed hands, text, watermark, subtitles, camera cut",
        "cfg_scale": 0.5,
    }, timeout_seconds=1800)
    url = (result.get("video") or {}).get("url")
    if not url:
        raise FalError("Kling lieferte keine Video-URL")
    return download(url, timeout=300)


def lipsync_video(video_url: str, audio_url: str) -> bytes:
    """Shot (2-10 s) + Tonspur -> Shot mit passenden Lippenbewegungen."""
    result = run_fal(LIPSYNC_ENDPOINT, {"video_url": video_url, "audio_url": audio_url}, timeout_seconds=1800)
    url = (result.get("video") or {}).get("url")
    if not url:
        raise FalError("Lipsync lieferte keine Video-URL")
    return download(url, timeout=300)


def download(url: str, timeout: int = 120) -> bytes:
    """Ergebnis-URLs von Fal sind temporär — Inhalt sofort holen."""
    res = requests.get(url, timeout=timeout)
    res.raise_for_status()
    return res.content
