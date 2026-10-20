"""Golden-Question regression tests — Wlad framework retrieval must never regress.

Runs the canonical customer questions through the LIVE hybrid retrieval
(vector + keyword RRF fusion) and asserts the expected framework content
lands in the context block. Retrieval-level only (no LLM cost).
"""
import asyncio
import sys

import pytest

sys.path.insert(0, "/app/backend")

GOLDEN = [
    ("Erklär mir das SEXIER Modell von Wlad anhand eines Beispiels", ["SEXIER", "sexier"]),
    ("Was sind die 30 Schlagfertigkeitstechniken von Wlad?", ["chlagfertig"]),
    ("Es gibt doch irgendein 6P-Modell zum Thema Storytelling bei Wlad. Was ist das genau?", ["6P", "6 P"]),
    ("Was sind die zehn Stufen des Zuhörens?", ["Stufen des Zuhörens", "Zuhör"]),
    ("Wlad hat ein Charisma-Modell aus acht Elementen. Was sind diese acht?", ["harisma"]),
    ("Was ist die Weiße Rhetorik?", ["Rhetorik"]),
    ("Wie setze ich einen Anker in der Gehaltsverhandlung?", ["nker", "erhandl"]),
]


@pytest.mark.parametrize("question,expect_any", GOLDEN)
def test_golden_retrieval(question, expect_any):
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")
    from services_rag import retrieve_context

    ctx = asyncio.get_event_loop().run_until_complete(retrieve_context(question))
    assert ctx["rag_active"], f"RAG inactive for: {question}"
    block = ctx["context_block"]
    assert any(t in block for t in expect_any), (
        f"Expected one of {expect_any} in context for: {question}\n"
        f"Got chunks={ctx['chunks_count']}, block head: {block[:300]}"
    )
