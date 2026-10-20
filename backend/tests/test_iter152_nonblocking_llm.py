"""Iter 152: LLM-Aufrufe blockieren den Event-Loop nicht mehr (litellm.acompletion-Patch)."""
import asyncio
import inspect
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv  # noqa: E402

load_dotenv("/app/backend/.env")


def test_llmchat_patch_installed_and_async():
    import services_llm_async
    from emergentintegrations.llm.chat import LlmChat

    services_llm_async.install()
    assert LlmChat._execute_completion is services_llm_async._execute_completion_async
    assert inspect.iscoroutinefunction(LlmChat._execute_completion)


def test_patched_completion_awaits_acompletion(monkeypatch):
    import litellm
    import services_llm_async
    from emergentintegrations.llm.chat import LlmChat

    seen = {}

    async def fake_acompletion(**params):
        seen.update(params)
        await asyncio.sleep(0)
        return "ok"

    monkeypatch.setattr(litellm, "acompletion", fake_acompletion)
    chat = LlmChat(api_key=os.environ.get("EMERGENT_LLM_KEY", "sk-test-placeholder"), session_id="s", system_message="sys").with_model("openai", "gpt-4o-mini")
    chat.with_params(max_tokens=5)
    out = asyncio.run(services_llm_async._execute_completion_async(chat, [{"role": "user", "content": "hi"}]))
    assert out == "ok"
    assert seen["model"] == "gpt-4o-mini" and seen["max_tokens"] == 5
    assert seen["api_base"].endswith("/llm") and seen["custom_llm_provider"] == "openai"
