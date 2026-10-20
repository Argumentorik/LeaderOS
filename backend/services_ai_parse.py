"""Shared AI JSON parsing — handles markdown fences, leading prose, trailing prose.

GPT-5.2 and other LLMs sometimes wrap JSON output in ```json ... ``` fences
or prefix with prose ("Hier ist deine Antwort:\n{...}") despite explicit
instructions. A plain `json.loads()` fails in those cases.

This helper handles:
  1. Direct JSON string
  2. ```json ... ``` fenced code blocks
  3. ``` ... ``` (unlabelled) fenced code blocks
  4. Prose-prefixed JSON: "Hier kommt: {...}"  → extracts outer-most {...}
  5. Iter 184: doppelt verpackte Antworten ("{\"insight\": \"…\\n…\"}") —
     sonst landen `\n` / `\u201e` als Rohzeichen im Kundentext.

Returns the parsed dict on success, or None if no valid JSON found.
"""
from __future__ import annotations

import json
import re
from typing import Any

from services_text_clean import deep_unescape, unescape_text, unwrap_json_string

_FENCE_PATTERN = re.compile(r"```(?:json|JSON)?\s*(\{.*?\})\s*```", re.DOTALL)


def _brace_block(text: str) -> str | None:
    first, last = text.find("{"), text.rfind("}")
    if first != -1 and last > first:
        return text[first:last + 1]
    return None


def parse_ai_json(text: str) -> dict[str, Any] | None:
    """Best-effort JSON extraction from an LLM response.

    Returns None when nothing parseable was found — callers should handle this
    (typically by re-prompting the model or surfacing an error to the user).
    Never raises.
    """
    if not text or not isinstance(text, str):
        return None

    # Doppelt verpackten JSON-String zuerst auspacken.
    unwrapped = unwrap_json_string(text)
    variants = [text]
    if unwrapped != text:
        variants.append(unwrapped)
    # Fallback: Antwort war kein gültiger JSON-String, trägt aber Escapes
    # (z. B. `{\"insight\": …}`) — einmal entschärfen und erneut versuchen.
    escaped_free = unescape_text(text)
    if escaped_free != text:
        variants.append(escaped_free)

    candidates: list[str] = []
    for variant in variants:
        candidates.append(variant)
        fence_match = _FENCE_PATTERN.search(variant)
        if fence_match:
            candidates.append(fence_match.group(1))
        block = _brace_block(variant)
        if block:
            candidates.append(block)

    for c in candidates:
        try:
            parsed = json.loads(c)
        except (json.JSONDecodeError, ValueError):
            continue
        if isinstance(parsed, dict):
            return deep_unescape(parsed)
    return None
