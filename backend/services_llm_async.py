"""Macht LLM-Aufrufe nicht-blockierend.

`emergentintegrations.LlmChat._execute_completion` ruft das synchrone `litellm.completion`
in einer async-Methode auf und blockiert damit den gesamten Event-Loop für die Dauer der
Antwort (2–40 s). Mit vielen gleichzeitigen Nutzern hängen dann ALLE Requests. Dieser Patch
ersetzt die Methode 1:1 durch `litellm.acompletion` (gleiche Parameter, gleicher Rückgabetyp).
"""
import litellm
from emergentintegrations.llm.chat import LlmChat
from emergentintegrations.llm.utils import get_integration_proxy_url

from config import EMERGENT_LLM_KEY, logger


def _completion_params(provider: str, model: str, messages, api_key: str, extra_headers=None) -> dict:
    params = {"model": f"{provider}/{model}", "messages": messages, "api_key": api_key}
    if api_key.startswith("sk-emergent-"):
        params["api_base"] = get_integration_proxy_url() + "/llm"
        params["custom_llm_provider"] = "openai"
        params["model"] = f"gemini/{model}" if provider == "gemini" else model
        if extra_headers:
            params["extra_headers"] = extra_headers
    return params


async def _execute_completion_async(self, messages):
    params = _completion_params(self.provider, self.model, messages, self.api_key, self.custom_headers)
    params.update(self.extra_params)
    return await litellm.acompletion(**params)


async def stream_completion(provider: str, model: str, messages, timeout: int = 120):
    """Token-Stream (Text-Deltas) über denselben Emergent-Proxy wie LlmChat."""
    import asyncio

    params = _completion_params(provider, model, messages, EMERGENT_LLM_KEY, _default_headers())
    params["stream"] = True
    response = await asyncio.wait_for(litellm.acompletion(**params), timeout=timeout)
    async for chunk in response:
        choices = getattr(chunk, "choices", None) or []
        if not choices:
            continue
        delta = getattr(choices[0], "delta", None)
        text = getattr(delta, "content", None) if delta is not None else None
        if text:
            yield text


def _default_headers() -> dict | None:
    """Gleiche App-Kennung wie LlmChat (für die Abrechnung über den Emergent-Proxy)."""
    try:
        probe = LlmChat(api_key=EMERGENT_LLM_KEY, session_id="probe", system_message="")
        return probe.custom_headers or None
    except Exception:
        return None


def install() -> None:
    required = ("_is_emergent_key", "custom_headers", "extra_params", "provider", "model")
    if not all(hasattr(LlmChat, a) or a in LlmChat.__init__.__code__.co_names for a in required):
        logger.warning("LlmChat-Layout unbekannt — async-Patch NICHT installiert (LLM-Aufrufe blockieren den Loop)")
        return
    LlmChat._execute_completion = _execute_completion_async
    logger.info("LlmChat: non-blocking litellm.acompletion installiert")
