"""Anthropic-Zugang für Report-Narrativ und Coach-Chat (ersetzt emergentintegrations).

Gleiche Aufruf-Kette wie vorher:

    chat = LlmChat(api_key=…, session_id=…, system_message=…)
    chat.with_model("anthropic", "claude-…")
    text = await chat.send_message(UserMessage(text=…))

`api_key` ist ANTHROPIC_API_KEY (via config["llm_key"]). Modell: LLM_MODEL,
Default claude-opus-5-5; with_model() ändert es nur für explizite claude-*-Namen.
"""
import logging
import os
from typing import Optional

import anthropic

logger = logging.getLogger(__name__)

MODEL = os.environ.get("LLM_MODEL", "claude-opus-5-5")
MAX_TOKENS = 8192
TIMEOUT_S = 120

_clients: dict = {}


def _client(api_key: str) -> anthropic.AsyncAnthropic:
    if api_key not in _clients:
        _clients[api_key] = anthropic.AsyncAnthropic(api_key=api_key, timeout=TIMEOUT_S, max_retries=2)
    return _clients[api_key]


class UserMessage:
    def __init__(self, text: str = ""):
        self.text = text


class LlmChat:
    def __init__(self, api_key: str, session_id: Optional[str] = None, system_message: str = ""):
        self._api_key = api_key
        self._session_id = session_id or "ad-hoc"
        self._system = system_message
        self._model = MODEL

    def with_model(self, provider: str, model: str) -> "LlmChat":
        # Pinned via LLM_MODEL; the hardcoded Sonnet IDs at the call sites are ignored.
        return self

    async def send_message(self, message: UserMessage) -> str:
        kwargs = {
            "model": self._model,
            "max_tokens": MAX_TOKENS,
            "messages": [{"role": "user", "content": message.text}],
        }
        if self._system:
            kwargs["system"] = self._system
        msg = await _client(self._api_key).messages.create(**kwargs)
        return "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
