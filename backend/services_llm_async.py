"""Macht LLM-Aufrufe nicht-blockierend.

`emergentintegrations.LlmChat._execute_completion` ruft das synchrone `litellm.completion`
in einer async-Methode auf und blockiert damit den gesamten Event-Loop für die Dauer der
Antwort (2–40 s). Mit vielen gleichzeitigen Nutzern hängen dann ALLE Requests. Dieser Patch
ersetzt die Methode 1:1 durch `litellm.acompletion` (gleiche Parameter, gleicher Rückgabetyp).
"""
import litellm
from emergentintegrations.llm.chat import LlmChat
from emergentintegrations.llm.utils import get_integration_proxy_url

from config import logger


async def _execute_completion_async(self, messages):
    params = {
        "model": f"{self.provider}/{self.model}",
        "messages": messages,
        "api_key": self.api_key,
    }
    if self._is_emergent_key(self.api_key):
        params["api_base"] = get_integration_proxy_url() + "/llm"
        params["custom_llm_provider"] = "openai"
        params["model"] = f"gemini/{self.model}" if self.provider == "gemini" else self.model
        if self.custom_headers:
            params["extra_headers"] = self.custom_headers
    params.update(self.extra_params)
    return await litellm.acompletion(**params)


def install() -> None:
    required = ("_is_emergent_key", "custom_headers", "extra_params", "provider", "model")
    if not all(hasattr(LlmChat, a) or a in LlmChat.__init__.__code__.co_names for a in required):
        logger.warning("LlmChat-Layout unbekannt — async-Patch NICHT installiert (LLM-Aufrufe blockieren den Loop)")
        return
    LlmChat._execute_completion = _execute_completion_async
    logger.info("LlmChat: non-blocking litellm.acompletion installiert")
