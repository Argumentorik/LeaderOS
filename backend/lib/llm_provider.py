"""
llm_provider — LLM- und STT-Zugang ohne Emergent.

Ersetzt `emergentintegrations.llm.chat` mit derselben Aufruf-Kette, damit die
Routes unverändert bleiben:

    from lib.llm_provider import LlmChat, UserMessage
    chat = LlmChat(api_key=…, session_id=…, system_message=…)
    chat.with_model("openai", "gpt-5.2")
    resp = await chat.send_message(UserMessage(text="…"))

Provider ist ausschließlich Anthropic (`ANTHROPIC_API_KEY`, workspace-scoped
`sk-ant-api…`). Kein stiller Provider-Wechsel mehr über ENV.

Modellwahl
----------
- `LLM_MODEL`      (Default `claude-opus-5-5`)  — alle Routes.
- `LLM_FAST_MODEL` (Default `claude-haiku-5-5`) — nur explizit angefordert
  (services_classifier).
Die alten OpenAI-Modellnamen an den Callsites ("gpt-5.2", "gpt-4o-mini", …)
werden auf `LLM_MODEL` abgebildet; ein explizites `claude-*` gewinnt.
`api_key` und `session_id` werden nur noch aus Kompatibilität angenommen.

STT
---
`OpenAISpeechToText` behält Namen und Signatur, transkribiert aber über
ElevenLabs Scribe (`ELEVENLABS_API_KEY`) — es gibt keinen OpenAI-Key.
"""

import io
import logging
import os
from typing import Optional

logger = logging.getLogger("wladbot.llm")

MODEL = os.environ.get("LLM_MODEL", "claude-opus-5-5")
FAST_MODEL = os.environ.get("LLM_FAST_MODEL", "claude-haiku-5-5")
MAX_TOKENS = int(os.environ.get("LLM_MAX_TOKENS", "8192"))
# Harte Obergrenze pro Aufruf, damit ein hängender Upstream keinen Worker blockiert.
TIMEOUT_S = 120

_client = None


def anthropic_client():
    """Ein geteilter AsyncAnthropic-Client (Connection-Pool) für Shim und Streaming."""
    global _client
    if _client is None:
        import anthropic
        key = os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        _client = anthropic.AsyncAnthropic(api_key=key, timeout=TIMEOUT_S, max_retries=2)
    return _client


def resolve_model(model: Optional[str]) -> str:
    """Callsite-Modell → Claude-Modell. Nur `claude-*` wird durchgereicht."""
    if model and model.startswith("claude-"):
        return model
    return MODEL


# ─── User-Message ──────────────────────────────────────────────────

class UserMessage:
    """Drop-in für `emergentintegrations.llm.chat.UserMessage`."""

    def __init__(self, text: str = "", files: Optional[list] = None):
        self.text = text
        self.files = files or []

    def __repr__(self) -> str:
        return f"<UserMessage text={self.text[:40]!r}…>"


# ─── LlmChat ───────────────────────────────────────────────────────

class LlmChat:
    """Drop-in für `emergentintegrations.llm.chat.LlmChat` (single-turn)."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        session_id: Optional[str] = None,
        system_message: str = "",
    ):
        self._session_id = session_id or "ad-hoc"
        self._system = system_message
        self._model = MODEL

    def with_model(self, provider_or_model: str, model: Optional[str] = None) -> "LlmChat":
        """Akzeptiert `with_model("openai", "gpt-5.2")` und `with_model("openai/gpt-5.2")`."""
        self._model = resolve_model(model if model is not None else provider_or_model.split("/")[-1])
        return self

    async def send_message(self, message: UserMessage) -> str:
        kwargs = {
            "model": self._model,
            "max_tokens": MAX_TOKENS,
            "messages": [{"role": "user", "content": message.text}],
        }
        if self._system:
            kwargs["system"] = self._system
        try:
            msg = await anthropic_client().messages.create(**kwargs)
        except Exception as e:
            logger.error("llm_provider send failed (model=%s session=%s): %s",
                         self._model, self._session_id, e)
            raise
        return "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")


# ─── OpenAISpeechToText → ElevenLabs Scribe ────────────────────────

class _Transcript(str):
    """Transkript als `str` **mit** `.text`.

    Die Aufrufer nutzen zwei Stile: `text = await stt.transcribe(path)` und
    `resp = await stt.transcribe(file=f, …); resp.text` (routes/video.py,
    routes/voice_tts.py). Ein str mit `.text` bedient beide.
    """

    @property
    def text(self) -> str:
        return str(self)


class OpenAISpeechToText:
    """Drop-in für `emergentintegrations.llm.openai.OpenAISpeechToText`."""

    URL = "https://api.elevenlabs.io/v1/speech-to-text"

    def __init__(self, api_key: Optional[str] = None, model: str = "scribe_v1"):
        self._model = model

    async def transcribe(self, file_path: Optional[str] = None, language: Optional[str] = None, *,
                         file=None, **_ignored) -> "_Transcript":
        """STT aus Pfad **oder** offenem File-Objekt. OpenAI-Parameter
        (model=whisper-1, response_format, prompt) werden ignoriert."""
        if file is None and not file_path:
            raise TypeError("transcribe() braucht file_path oder file=")
        if file is not None:
            return _Transcript(await self._scribe(file.read(), getattr(file, "name", "audio"), language))
        with open(file_path, "rb") as fh:
            return _Transcript(await self._scribe(fh.read(), os.path.basename(file_path), language))

    async def transcribe_bytes(self, data: bytes, filename: str = "audio.webm",
                               language: Optional[str] = None) -> "_Transcript":
        """STT aus rohen Bytes (Voice-Mode-Recording)."""
        return _Transcript(await self._scribe(data, filename, language))

    async def _scribe(self, data: bytes, filename: str, language: Optional[str]) -> str:
        import httpx
        key = os.environ.get("ELEVENLABS_API_KEY")
        if not key:
            raise RuntimeError("Speech-to-text requires ELEVENLABS_API_KEY.")
        form = {"model_id": self._model}
        if language:
            form["language_code"] = language
        async with httpx.AsyncClient(timeout=TIMEOUT_S) as http:
            resp = await http.post(
                self.URL,
                headers={"xi-api-key": key},
                data=form,
                files={"file": (os.path.basename(str(filename)), io.BytesIO(data))},
            )
        resp.raise_for_status()
        return resp.json().get("text", "") or ""
