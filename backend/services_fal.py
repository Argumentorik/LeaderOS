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
TTS_TURBO_ENDPOINT = "fal-ai/minimax/speech-02-turbo"
TALKING_VIDEO_ENDPOINT = "fal-ai/sadtalker"

QUEUE_ORIGIN = "https://queue.fal.run"


def _control_base() -> str:
    base = os.environ.get("INTEGRATION_PROXY_URL", "https://integrations.emergentagent.com").rstrip("/")
    return f"{base}/api/v1/fal"


def _direct_key() -> str | None:
    """Optional: eigener Fal-Key (FAL_KEY) -> direkt gegen queue.fal.run statt über den geteilten Emergent-Proxy."""
    return os.environ.get("FAL_KEY") or None


class FalError(Exception):
    pass


class FalInsufficientCredits(FalError):
    pass


def _headers(extra: Optional[dict] = None) -> dict:
    if _direct_key():
        return {"Authorization": f"Key {_direct_key()}", "Content-Type": "application/json", **(extra or {})}
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
    queue_base = urlparse(QUEUE_ORIGIN if _direct_key() else f"{_control_base()}/queue")
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


class FalTimeout(FalError):
    """Fal hat den Job angenommen, aber nicht rechtzeitig geliefert — Request bleibt abholbar."""

    def __init__(self, message: str, request: dict):
        super().__init__(message)
        self.request = request


def submit_fal(endpoint_id: str, payload: dict, timeout_seconds: int = 900) -> dict[str, Any]:
    """Ein Submit (nie automatisch wiederholt — Fal könnte den Job schon angenommen haben).
    Liefert den Queue-Body (request_id, status_url, response_url) zum späteren Abholen."""
    direct = _direct_key()
    for attempt in range(4):
        submit = requests.post(
            f"{QUEUE_ORIGIN}/{endpoint_id}" if direct else f"{_control_base()}/proxy",
            headers=_headers(None if direct else {"X-Fal-Target-Url": f"{QUEUE_ORIGIN}/{endpoint_id}"}),
            json=payload,
            timeout=min(60, max(10, timeout_seconds)),
        )
        if submit.status_code in (502, 503, 504) and attempt < 3:
            wait = 3 if timeout_seconds <= 60 else 20 * (attempt + 1)
            logger.warning("Fal capacity unavailable (503) — retry %s/3 in %ss", attempt + 1, wait)
            time.sleep(wait)
            continue
        break
    if submit.status_code == 402:
        raise FalInsufficientCredits("Universal-Key-Guthaben reicht für diese Generierung nicht")
    if submit.status_code >= 400:
        raise FalError(f"Fal-Submit fehlgeschlagen ({submit.status_code}): {submit.text[:300]}")
    body = submit.json()
    logger.info("Fal %s submitted: request_id=%s", endpoint_id, body.get("request_id"))
    return {"endpoint": endpoint_id, "request_id": body.get("request_id"),
            "status_url": body["status_url"], "response_url": body["response_url"]}


def wait_fal(request: dict, timeout_seconds: int = 900, poll_interval: float = 3.0) -> dict[str, Any]:
    """Pollt einen bereits eingereichten Request bis zum Endzustand."""
    endpoint_id = request.get("endpoint") or "?"
    status_url = _trusted_queue_url(request["status_url"])
    response_url = _trusted_queue_url(request["response_url"])

    deadline = time.monotonic() + timeout_seconds
    last_log = time.monotonic()
    while time.monotonic() < deadline:
        status_res = _get_with_retry(status_url, timeout_seconds=30, deadline=deadline)
        if status_res.status_code in (502, 503, 504, 429):
            # Proxy/Fal kurz nicht erreichbar -> der Job läuft weiter, nur nochmal fragen
            logger.warning("Fal status %s — retry in %ss", status_res.status_code, max(poll_interval, 5))
            time.sleep(max(poll_interval, 5))
            continue
        if status_res.status_code >= 400:
            raise FalError(f"Statusabfrage fehlgeschlagen ({status_res.status_code})")
        status_body = status_res.json()
        status = (status_body.get("status") or "").upper()
        if time.monotonic() - last_log > 120:
            last_log = time.monotonic()
            logger.info("Fal %s [%s]: %s (%ss übrig)", endpoint_id, request.get("request_id"), status,
                        int(deadline - time.monotonic()))
        if status in {"COMPLETED", "OK"}:
            if status_body.get("error"):
                raise FalError(f"Generierung fehlgeschlagen: {status_body['error']}")
            result = _get_with_retry(response_url, timeout_seconds=60, deadline=deadline)
            if result.status_code >= 400:
                raise FalError(f"Ergebnisabfrage fehlgeschlagen ({result.status_code})")
            return result.json()
        if status in {"FAILED", "CANCELLED", "CANCELED", "ERROR"}:
            raise FalError(f"Generierung fehlgeschlagen: {status}")
        time.sleep(poll_interval)
    raise FalTimeout("Zeitüberschreitung bei der Generierung — Request bleibt abholbar", request)


def run_fal(endpoint_id: str, payload: dict, timeout_seconds: int = 900, poll_interval: float = 3.0) -> dict[str, Any]:
    """Submit + Polling bis zum Endzustand."""
    return wait_fal(submit_fal(endpoint_id, payload, timeout_seconds), timeout_seconds, poll_interval)


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


def synthesize_speech(text: str, voice_id: str, speed: float = 1.0, fast: bool = False,
                      timeout_seconds: int | None = None) -> tuple[bytes, int]:
    """Deutsche Sprachausgabe. Liefert (mp3-Bytes, Dauer in Sekunden).
    fast=True nutzt speech-02-turbo mit engem Polling — für den Voice-Mode/Chat."""
    from services_speech_text import to_speakable

    result = run_fal(TTS_TURBO_ENDPOINT if fast else TTS_ENDPOINT, {
        "text": to_speakable(text),
        "voice_setting": {"voice_id": voice_id, "speed": speed, "vol": 1, "pitch": 0},
        "audio_setting": {"format": "mp3", "sample_rate": 32000, "channel": 1, "bitrate": 128000},
        "output_format": "url",
        "language_boost": "German",
    }, timeout_seconds=timeout_seconds or (45 if fast else 600), poll_interval=0.8 if fast else 3.0)
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
I2V_PRO_ENDPOINT = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video"
OMNIHUMAN_ENDPOINT = "fal-ai/bytedance/omnihuman/v1.5"
I2V_AUDIO_ENDPOINT = "fal-ai/kling-video/v2.6/pro/image-to-video"
AMBIENCE_ENDPOINT = "fal-ai/mmaudio-v2"
COST_I2V_PRO = {"5": 0.35, "10": 0.70}
COST_I2V_AUDIO = {"5": 0.36, "10": 0.71}  # Kling 2.6 ohne Ton (0,07 $/s) + MMAudio (0,001 $/s)
COST_OMNIHUMAN_PER_S = 0.16

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


def image_to_video(image_url: str, prompt: str, duration: str = "10", aspect_ratio: str = "9:16", pro: bool = False) -> bytes:
    """Keyframe + Bewegungs-Prompt -> Kling-Shot (mp4-Bytes, ohne Ton). pro = Kling 2.5 Turbo Pro (1080p)."""
    payload = {
        "prompt": prompt,
        "image_url": image_url,
        "duration": duration,
        "negative_prompt": "blur, distort, low quality, extra limbs, deformed hands, text, watermark, subtitles, camera cut",
        "cfg_scale": 0.5,
    }
    if not pro:
        payload["aspect_ratio"] = aspect_ratio
    result = run_fal(I2V_PRO_ENDPOINT if pro else I2V_ENDPOINT, payload, timeout_seconds=1800)
    url = (result.get("video") or {}).get("url")
    if not url:
        raise FalError("Kling lieferte keine Video-URL")
    return download(url, timeout=300)


def image_to_video_v26(image_url: str, prompt: str, duration: str = "5", end_image_url: str | None = None) -> bytes:
    """Kling 2.6 Pro ohne nativen Ton: Start-Keyframe (+ optional End-Keyframe, damit der Shot exakt auf dem Bild
    endet, mit dem der nächste Talk-Shot beginnt) -> mp4. End-Frame und native Audio schließen sich bei Kling aus,
    deshalb kommt der Ton anschließend aus MMAudio (`add_ambience`)."""
    payload = {
        "prompt": prompt,
        "start_image_url": image_url,
        "duration": duration,
        "generate_audio": False,
        "negative_prompt": "blur, distort, low quality, extra limbs, deformed hands, text, watermark, subtitles, camera cut",
    }
    if end_image_url:
        payload["end_image_url"] = end_image_url
    result = run_fal(I2V_AUDIO_ENDPOINT, payload, timeout_seconds=1800)
    url = (result.get("video") or {}).get("url")
    if not url:
        raise FalError("Kling 2.6 lieferte keine Video-URL")
    return download(url, timeout=300)


MUSIC_ENDPOINT = "fal-ai/stable-audio-25/text-to-audio"


def generate_music(prompt: str, seconds: int = 47) -> bytes:
    """Stable Audio 2.5: lizenzfreier Musikteppich (Text -> Audio). Einmalig, danach aus dem Storage."""
    result = run_fal(MUSIC_ENDPOINT, {"prompt": prompt, "seconds_total": int(seconds)}, timeout_seconds=600)
    url = ((result.get("audio") or result.get("audio_file") or {}).get("url"))
    if not url:
        raise FalError("Stable Audio lieferte keine Audio-URL")
    return download(url, timeout=300)


def add_ambience(video_url: str, prompt: str, duration: float) -> bytes:
    """MMAudio v2: erzeugt zum Bild synchronen Ton (Schritte, Raumklang) und liefert das Video mit Tonspur."""
    result = run_fal(AMBIENCE_ENDPOINT, {
        "video_url": video_url,
        "prompt": prompt,
        "negative_prompt": "speech, talking, voice, singing, music, melody, lyrics",
        "duration": max(1.0, min(30.0, float(duration))),
        "num_steps": 25,
        "cfg_strength": 4.5,
    }, timeout_seconds=900)
    url = (result.get("video") or {}).get("url")
    if not url:
        raise FalError("MMAudio lieferte keine Video-URL")
    return download(url, timeout=300)


def omnihuman_video(image_url: str, audio_url: str, prompt: str | None = None,
                    pending: dict | None = None, on_submit=None, resolution: str = "1080p") -> bytes:
    """Keyframe + Tonspur -> sprechendes Video mit nativer Lippen-/Körperbewegung (1080p).
    `pending`: früher eingereichter Request, der nur noch abgeholt wird (kein neuer Submit).
    `on_submit(request)`: Callback direkt nach dem Submit, damit der Aufrufer den Request persistiert."""
    if pending:
        request = pending
    else:
        # 1080p erlaubt max. 30 s Ton, 720p bis 60 s (Single-Take-Clips)
        payload = {"image_url": image_url, "audio_url": audio_url, "resolution": resolution, "turbo_mode": False}
        if prompt:
            payload["prompt"] = prompt[:600]
        request = submit_fal(OMNIHUMAN_ENDPOINT, payload, timeout_seconds=3600)
        if on_submit:
            on_submit(request)
    result = wait_fal(request, timeout_seconds=3600)
    url = (result.get("video") or {}).get("url")
    if not url:
        raise FalError("OmniHuman lieferte keine Video-URL")
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
