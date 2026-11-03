"""Prompt router for the WladBot (and any future personal brand bot).

Architecture (from the napkin sketch the user shared):

    user_query  ──▶  classify_query()        ──▶  "speech" | "theory"
                       │
                       ▼
                load_prompt(brand, kind, lang)
                       │
                       ▼
              llm_chat([system, user])       ──▶  reply

Brand-pluggable: every brand has its own folder under
`backend/data/prompts/<brand>/` with five files:

    router_de.txt    router_en.txt
    speech_de.txt    speech_en.txt
    theory_de.txt    theory_en.txt

To add a new personal brand: drop those five files into a new folder
and pass `brand="newbrand"` into `get_system_prompt`. Engine code stays
the same.
"""
from __future__ import annotations

import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

PROMPTS_ROOT = Path(__file__).parent / "data" / "prompts"

Kind = Literal["router", "speech", "theory"]
Lang = Literal["de", "en"]
RouterDecision = Literal["speech", "theory"]


@lru_cache(maxsize=64)
def load_prompt(brand: str, kind: Kind, lang: Lang) -> str:
    """Load a prompt file from disk. Cached because files are static at runtime.

    Falls back English → German if the requested language file is missing.
    Raises FileNotFoundError only when *neither* language exists for the
    requested kind, since that means a broken brand folder.
    """
    primary = PROMPTS_ROOT / brand / f"{kind}_{lang}.txt"
    if primary.exists():
        return primary.read_text(encoding="utf-8").strip()

    fallback_lang: Lang = "en" if lang == "de" else "de"
    fallback = PROMPTS_ROOT / brand / f"{kind}_{fallback_lang}.txt"
    if fallback.exists():
        logger.warning(
            "Prompt %s/%s_%s.txt missing — falling back to %s",
            brand, kind, lang, fallback_lang,
        )
        return fallback.read_text(encoding="utf-8").strip()

    raise FileNotFoundError(
        f"No prompt file for brand={brand!r} kind={kind!r} in any language"
    )


def normalize_lang(lang: str | None) -> Lang:
    """Coerce frontend-style language codes into the two we support.

    'de', 'de-DE', 'german', 'deutsch', etc. → 'de'
    everything else → 'en'
    """
    if not lang:
        return "de"
    head = lang.lower().split("-")[0]
    if head in ("de", "deu", "ger", "german", "deutsch"):
        return "de"
    return "en"


async def classify_query(
    query: str,
    brand: str = "wlad",
    lang: Lang = "de",
    *,
    llm_call=None,
) -> RouterDecision:
    """Run the router LLM call and parse its single-word answer.

    `llm_call` is an injected async function that takes (system, user)
    and returns a string. We don't import the LLM provider here so the
    router stays unit-testable without network.

    Defensive parsing: model sometimes returns 'Speech.', '"speech"',
    or a full sentence — we accept any answer that starts with 'speech'
    (case-insensitive) and default to 'theory' otherwise.
    """
    if llm_call is None:
        # Lazy import keeps tests light and avoids circular imports.
        from lib.llm_provider import LlmChat, UserMessage  # noqa: F401

        async def llm_call(system: str, user: str) -> str:  # type: ignore[misc]
            chat = LlmChat(system_message=system, model="claude-haiku-4-5-20251001")
            response = await chat.send_message(UserMessage(text=user))
            return getattr(response, "text", str(response))

    system = load_prompt(brand, "router", lang)
    # Truncate ultra-long queries so the classifier still runs cheaply.
    user_excerpt = query if len(query) < 2000 else query[:1800] + "\n[…truncated…]"

    try:
        raw = await llm_call(system, user_excerpt)
    except Exception as exc:
        logger.warning("router classifier failed (%s) — defaulting to theory", exc)
        return "theory"

    answer = (raw or "").strip().lower().strip('"\' .,!?\n')
    return "speech" if answer.startswith("speech") else "theory"


async def get_system_prompt(
    query: str,
    brand: str = "wlad",
    lang_in: str | None = None,
    *,
    llm_call=None,
) -> tuple[str, RouterDecision, Lang]:
    """End-to-end: take a raw user query, decide which prompt fits, return it.

    Returns (system_prompt_text, decision, language). Caller passes
    system_prompt_text into the main LLM call. The other two values are
    returned for logging / PostHog event-tagging so we can later see
    which router decisions drive which responses.
    """
    lang = normalize_lang(lang_in)

    # Cheap heuristic: a message under ~30 words can't realistically be a
    # speech transcript. Skip the router and save a roundtrip.
    if len(query.split()) < 30:
        decision: RouterDecision = "theory"
    else:
        decision = await classify_query(query, brand=brand, lang=lang, llm_call=llm_call)

    prompt = load_prompt(brand, decision, lang)
    return prompt, decision, lang


# Convenience for the FastAPI route — synchronous helper to peek at
# what we'd pick for a query without running the LLM router.
def list_brands() -> list[str]:
    """Return all brand-folders that ship a complete prompt set."""
    if not PROMPTS_ROOT.exists():
        return []
    brands = []
    for d in PROMPTS_ROOT.iterdir():
        if not d.is_dir():
            continue
        required = {"router_de.txt", "speech_de.txt", "theory_de.txt"}
        if required.issubset({f.name for f in d.iterdir()}):
            brands.append(d.name)
    return sorted(brands)
