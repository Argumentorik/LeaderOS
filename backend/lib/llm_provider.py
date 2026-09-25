"""
llm_provider — Compat-Shim für `emergentintegrations.llm.chat`.

Das Problem
-----------
12 backend/routes/* Files binden direkt `emergentintegrations.llm.chat`:

    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=…, system_message=…)
    chat.with_model("openai", "gpt-5.2")
    resp = await chat.send_message(UserMessage(text="…"))

Wir wollen weg von Emergent, ohne die 12 Routes auf einmal umzuschreiben
und in Produktion einen Halbtag stillzustehen. Dieser Shim emuliert die
Emergent-API mit nativen SDKs:

    from lib.llm_provider import LlmChat, UserMessage
    chat = LlmChat(api_key=ANTHROPIC_KEY, session_id=…, system_message=…)
    chat.with_model("anthropic", "claude-haiku-4-5-20251001")
    resp = await chat.send_message(UserMessage(text="…"))

Routes ändern sich mit nur 2 Zeilen:

    -from emergentintegrations.llm.chat import LlmChat, UserMessage
    +from lib.llm_provider import LlmChat, UserMessage
    …
    -chat.with_model("openai", "gpt-5.2")
    +chat.with_model("anthropic", "claude-haiku-4-5-20251001")

Provider-Auswahl per Env
------------------------
- `ANTHROPIC_API_KEY` gesetzt  → Anthropic-Pfad (Claude)
- `OPENAI_API_KEY` gesetzt     → OpenAI-Pfad (GPT)
- sonst `EMERGENT_LLM_KEY`     → Emergent-Pfad (alt, Wrapper)

Die `with_model("provider", "model")`-Aufrufe override den Provider explizit.
"""

import os
import logging
from typing import Optional

logger = logging.getLogger("wladbot.llm")


# ─── User-Message ──────────────────────────────────────────────────
# Drop-in für `emergentintegrations.llm.chat.UserMessage`.

class UserMessage:
    """Einfacher Container, exakt wie Emergent-UserMessage."""

    def __init__(self, text: str = "", files: Optional[list] = None):
        self.text = text
        self.files = files or []

    def __repr__(self) -> str:
        return f"<UserMessage text={self.text[:40]!r}…>"


# ─── Provider-Adapters ─────────────────────────────────────────────

class _AnthropicAdapter:
    """Direkter Pfad → official `anthropic` SDK."""

    def __init__(self, api_key: str, model: str, system_message: str):
        try:
            import anthropic  # noqa: E402
        except ImportError as e:  # pragma: no cover — wir installieren das SDK
            raise RuntimeError(
                "anthropic SDK not installed. Add `anthropic>=0.39` to requirements.txt."
            ) from e
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._model = model
        self._system = system_message

    async def send(self, user_text: str) -> str:
        msg = await self._client.messages.create(
            model=self._model,
            max_tokens=4096,
            system=self._system,
            messages=[{"role": "user", "content": user_text}],
        )
        # claude antwortet als Liste von Content-Blocks; wir mergen text-only.
        parts = [b.text for b in msg.content if getattr(b, "type", "") == "text"]
        return "".join(parts)


class _OpenAIAdapter:
    """Direkter Pfad → official `openai` SDK (bereits in requirements.txt)."""

    def __init__(self, api_key: str, model: str, system_message: str):
        try:
            from openai import AsyncOpenAI
        except ImportError as e:  # pragma: no cover
            raise RuntimeError("openai SDK not installed.") from e
        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model
        self._system = system_message

    async def send(self, user_text: str) -> str:
        resp = await self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": self._system},
                {"role": "user", "content": user_text},
            ],
            max_tokens=4096,
        )
        return resp.choices[0].message.content or ""


class _EmergentAdapter:
    """Legacy-Pfad → emergentintegrations. Nur aktiv solange wir die
    Migration nicht abgeschlossen haben. Wird gelöscht zusammen mit
    der Dependency."""

    def __init__(self, api_key: str, model: str, system_message: str, session_id: str):
        from emergentintegrations.llm.chat import LlmChat  # type: ignore
        self._chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message,
        )
        # Emergent will provider + model getrennt.
        provider, model_id = self._parse(model)
        self._chat.with_model(provider, model_id)

    @staticmethod
    def _parse(model: str) -> tuple[str, str]:
        # Modell-Strings im Format "openai/gpt-5.2" oder "openai:gpt-5.2"
        # mappen wir auf (provider, model_id). Default-Provider openai.
        for sep in ("/", ":"):
            if sep in model:
                p, m = model.split(sep, 1)
                return p, m
        return "openai", model

    async def send(self, user_text: str) -> str:
        from emergentintegrations.llm.chat import UserMessage as EmUserMessage  # type: ignore
        return await self._chat.send_message(EmUserMessage(text=user_text))


# ─── LlmChat — public, identische Signatur wie Emergent ───────────

class LlmChat:
    """Drop-in für `emergentintegrations.llm.chat.LlmChat`.

    Behält die Methoden-Kette der Emergent-API:

        chat = LlmChat(api_key=..., session_id=..., system_message=...)
        chat.with_model("anthropic", "claude-haiku-4-5-20251001")
        resp = await chat.send_message(UserMessage(text="..."))

    `api_key` wird wegen Backward-Compat akzeptiert, aber bei
    Anthropic / OpenAI von ENV überschrieben. Dadurch können
    Routes weiter `EMERGENT_LLM_KEY` übergeben, ohne dass das
    den Provider wechselt — der ENV-Switch steuert.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        session_id: Optional[str] = None,
        system_message: str = "",
    ):
        self._api_key = api_key
        self._session_id = session_id or "ad-hoc"
        self._system = system_message
        self._provider = self._default_provider()
        # Default-Modelle, werden überschrieben durch `with_model(...)`.
        self._model = self._default_model(self._provider)
        self._adapter = None  # lazy — erst beim ersten send() instanziieren

    @staticmethod
    def _default_provider() -> str:
        if os.environ.get("ANTHROPIC_API_KEY"):
            return "anthropic"
        if os.environ.get("OPENAI_API_KEY"):
            return "openai"
        return "emergent"

    @staticmethod
    def _default_model(provider: str) -> str:
        return {
            "anthropic": "claude-haiku-4-5-20251001",
            "openai":    "gpt-4o-mini",
            "emergent":  "openai/gpt-5.2",
        }[provider]

    def with_model(self, provider_or_model: str, model: Optional[str] = None) -> "LlmChat":
        """
        Akzeptiert beide Signaturen:
          - with_model("anthropic", "claude-haiku-4-5-20251001")
          - with_model("openai/gpt-5.2")
        Damit bleiben alte Emergent-Callsites unverändert.
        """
        if model is None:
            # Emergent ließ auch `with_model("openai/gpt-5.2")` zu.
            self._model = provider_or_model
        else:
            # Wenn ein Env-Native-Provider verfügbar ist, bleiben wir dort —
            # `with_model("openai", "...")` wechselt nicht zurück auf Emergent.
            preferred = self._default_provider()
            if preferred in ("anthropic", "openai"):
                self._provider = preferred
                # Behalte das alte Modell falls Provider gleich, sonst Default.
                self._model = self._default_model(preferred) if preferred != provider_or_model else model
            else:
                self._provider = provider_or_model
                self._model = model
        return self

    def _build_adapter(self):
        if self._provider == "anthropic":
            return _AnthropicAdapter(
                api_key=os.environ["ANTHROPIC_API_KEY"],
                model=self._model,
                system_message=self._system,
            )
        if self._provider == "openai":
            return _OpenAIAdapter(
                api_key=os.environ["OPENAI_API_KEY"],
                model=self._model,
                system_message=self._system,
            )
        # Legacy fallback
        return _EmergentAdapter(
            api_key=self._api_key or os.environ.get("EMERGENT_LLM_KEY", ""),
            model=self._model,
            system_message=self._system,
            session_id=self._session_id,
        )

    async def send_message(self, message: UserMessage) -> str:
        if self._adapter is None:
            self._adapter = self._build_adapter()
        try:
            return await self._adapter.send(message.text)
        except Exception as e:
            logger.error("llm_provider send failed (provider=%s model=%s): %s",
                         self._provider, self._model, e)
            raise


# ─── OpenAISpeechToText — Drop-in für emergentintegrations STT ─────
#
# Emergent stellt eine kleine STT-Klasse bereit, video.py und voice_tts.py
# nutzen sie. Die OpenAI-API spricht das direkt — wir kapseln es so dass
# der Callsite identisch bleibt:
#
#     stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
#     text = await stt.transcribe(file_path) | .transcribe_bytes(b)
#
# Wenn OPENAI_API_KEY in der ENV ist, geht das direkt zu OpenAI. Sonst
# fällt es auf emergentintegrations zurück (übergangsweise).

class _Transcript(str):
    """Transkript als `str` **mit** `.text`.

    Die Aufrufer im Code nutzen zwei Stile: `text = await stt.transcribe(path)`
    und `resp = await stt.transcribe(file=f, …); resp.text` (Emergent-/OpenAI-
    Stil, u. a. routes/video.py, routes/voice_tts.py). Ein str mit `.text`
    bedient beide, ohne die Aufrufer anzufassen.
    """

    @property
    def text(self) -> str:
        return str(self)


class OpenAISpeechToText:
    """Drop-in für `emergentintegrations.llm.openai.OpenAISpeechToText`."""

    def __init__(self, api_key: Optional[str] = None, model: str = "whisper-1"):
        self._legacy_key = api_key
        self._model = model
        # ENV gewinnt — eigener OpenAI-Key überschreibt den Emergent-Key.
        self._openai_key = os.environ.get("OPENAI_API_KEY")

    async def transcribe(self, file_path: Optional[str] = None, language: Optional[str] = None, *,
                         file=None, model: Optional[str] = None,
                         response_format: Optional[str] = None, **_ignored) -> "_Transcript":
        """STT aus Pfad **oder** offenem File-Objekt.

        Beide Signaturen sind gültig:
          await stt.transcribe("a.mp3", language="de")                     → str
          await stt.transcribe(file=f, model="whisper-1",
                               response_format="json", language="de")     → .text
        Vorher akzeptierte der Shim nur (file_path, language) — die Aufrufe mit
        file=… endeten in einem TypeError, d. h. Video-Analyse und Voice-Mode
        wären nach einem Deploy dieses Codes ausgefallen.
        """
        if file is None and not file_path:
            raise TypeError("transcribe() braucht file_path oder file=")
        use_model = model or self._model
        if self._openai_key:
            if file is not None:
                return _Transcript(await self._native(file, language, use_model))
            with open(file_path, "rb") as fh:
                return _Transcript(await self._native(fh, language, use_model))
        return _Transcript(await self._legacy(file if file is not None else file_path,
                                              language, use_model, response_format))

    async def transcribe_bytes(self, data: bytes, filename: str = "audio.webm",
                               language: Optional[str] = None) -> "_Transcript":
        """STT aus rohen Bytes (Voice-Mode-Recording)."""
        import io
        if self._openai_key:
            f = io.BytesIO(data); f.name = filename
            return _Transcript(await self._native(f, language, self._model))
        # Legacy-Pfad braucht ein File — temporär schreiben.
        import tempfile, os as _os
        with tempfile.NamedTemporaryFile(delete=False, suffix=_os.path.splitext(filename)[1] or ".webm") as tf:
            tf.write(data); path = tf.name
        try:
            return _Transcript(await self._legacy(path, language, self._model, None))
        finally:
            try: _os.unlink(path)
            except OSError: pass

    async def _native(self, file_obj, language: Optional[str], model: Optional[str] = None) -> str:
        try:
            from openai import AsyncOpenAI
        except ImportError as e:  # pragma: no cover
            raise RuntimeError("openai SDK not installed.") from e
        client = AsyncOpenAI(api_key=self._openai_key)
        kwargs = {"model": model or self._model, "file": file_obj}
        if language:
            kwargs["language"] = language
        resp = await client.audio.transcriptions.create(**kwargs)
        return getattr(resp, "text", "") or ""

    async def _legacy(self, file_or_path, language: Optional[str], model: Optional[str] = None,
                      response_format: Optional[str] = None) -> str:
        # Explizite Fehlermeldung wenn weder OpenAI noch Emergent
        # verfügbar — sonst kracht's später irgendwo in der Emergent-
        # Library mit unverständlichem Stack-Trace.
        em_key = self._legacy_key or os.environ.get("EMERGENT_LLM_KEY", "")
        if not em_key:
            raise RuntimeError(
                "Voice-Mode (STT) requires OPENAI_API_KEY for native Whisper, "
                "or EMERGENT_LLM_KEY for the legacy wrapper. Neither is set — "
                "disable Voice-Mode in the UI or set one of the keys."
            )
        from emergentintegrations.llm.openai import (  # type: ignore
            OpenAISpeechToText as _EmSTT,
        )
        em = _EmSTT(api_key=em_key)
        # Die Emergent-Lib erwartet den OpenAI-Stil (file=…, model=…,
        # response_format=…) und liefert ein Objekt mit .text — so ruft es
        # auch der Live-Code auf Emergent auf.
        is_path = isinstance(file_or_path, (str, bytes, os.PathLike))
        fh = open(file_or_path, "rb") if is_path else file_or_path
        try:
            kwargs = {"file": fh, "model": model or self._model, "response_format": response_format or "json"}
            if language:
                kwargs["language"] = language
            resp = await em.transcribe(**kwargs)
        finally:
            if is_path:
                fh.close()
        return (getattr(resp, "text", None) if not isinstance(resp, str) else resp) or ""
