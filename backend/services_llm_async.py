"""Token-Streaming für /chat/stream über die native Anthropic-API.

Früher: litellm über den Emergent-Proxy, plus ein Patch, der den blockierenden
`LlmChat._execute_completion` von emergentintegrations durch `acompletion`
ersetzte. Der Shim (lib/llm_provider) nutzt jetzt `AsyncAnthropic` und blockiert
den Event-Loop nicht mehr — der Patch entfällt.
"""
import asyncio

from lib.llm_provider import MAX_TOKENS, anthropic_client, resolve_model


async def stream_completion(provider: str, model: str, messages, timeout: int = 120, idle_timeout: int = 30):
    """Token-Stream (Text-Deltas). `messages` im OpenAI-Format (system + user).

    `timeout` begrenzt den Verbindungsaufbau; `idle_timeout` begrenzt die Pause
    ZWISCHEN zwei Chunks. Hängt der Stream länger als `idle_timeout` Sekunden,
    wird `asyncio.TimeoutError` ausgelöst — der Aufrufer beendet den Stream dann
    sauber mit einem `error`-Event statt endlos offen zu bleiben.
    """
    system = "\n\n".join(m["content"] for m in messages if m["role"] == "system")
    turns = [{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"]
    kwargs = {"model": resolve_model(model), "max_tokens": MAX_TOKENS, "messages": turns}
    if system:
        kwargs["system"] = system

    manager = anthropic_client().messages.stream(**kwargs)
    stream = await asyncio.wait_for(manager.__aenter__(), timeout=timeout)
    try:
        aiter = stream.text_stream.__aiter__()
        while True:
            try:
                text = await asyncio.wait_for(aiter.__anext__(), timeout=idle_timeout)
            except StopAsyncIteration:
                break
            if text:
                yield text
    finally:
        await manager.__aexit__(None, None, None)
