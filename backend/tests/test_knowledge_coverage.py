"""Full-corpus knowledge coverage — one retrieval probe per Wlad course.

Ensures the hybrid retrieval surfaces content from EVERY major course in the
7,439-chunk corpus, so no knowledge area is dead. Retrieval-level (fast, free).
"""
import asyncio
import sys

import pytest

sys.path.insert(0, "/app/backend")

# (question, [expected substrings — any match passes], course probed)
COVERAGE = [
    ("Was macht laut Wlad einen richtig guten Chef aus?", ["Chef", "Führung", "führ"], "du_bist_der_bessere_chef"),
    ("Was ist die Weiße Rhetorik und wofür brauche ich sie?", ["Rhetorik"], "weiße_rhetorik"),
    ("Warum sollte ich durch Gründe führen statt durch Anweisungen?", ["Gründe", "Begründ", "führ"], "fuehren_durch_gruende"),
    ("Was sind die vier Farbtypen in der Kommunikation?", ["Farb", "rot", "gelb"], "kommunikation"),
    ("Wie überzeuge ich einen Kunden im Verkaufsgespräch?", ["Verkauf", "Kunde", "Sales"], "sales"),
    ("Was sind die 5 Rollen einer Führungskraft?", ["Rolle"], "die_5_rollen_einer_fuehrungskraft"),
    ("Wlad hat ein Charisma-Modell aus acht Elementen. Was sind diese acht?", ["harisma"], "die_charismatische_fuehrungskraft"),
    ("Wie setze ich einen Anker in der Gehaltsverhandlung?", ["nker", "erhandl"], "verhandlungstraining"),
    ("Wie überzeuge ich im Vorstellungsgespräch bei einer Bewerbung?", ["ewerbung", "orstellungsgespräch"], "bewerbung"),
    ("Wie kann ich schneller lernen und mir mehr merken?", ["lern", "merk"], "schneller_lernen"),
    ("Was lehrt die klassische Rhetorik über Ethos, Pathos und Logos?", ["thos", "Rhetorik"], "klassische_rhetorik"),
    ("Wie führe ich mein Team im Homeoffice richtig?", ["omeoffice", "emote", "irtuell"], "homeoffice"),
    ("Wie wirkt meine Körpersprache souveräner auf der Bühne?", ["örpersprache", "örper", "estik"], "koerpersprache"),
    ("Wie baue ich eine überzeugende Präsentation auf?", ["räsentation", "räsentier"], "praesentation"),
    ("Wie führe ich ein schwieriges Gespräch mit einem Mitarbeiter?", ["espräch", "onflikt"], "schwierige_gespraeche"),
    ("Wie motiviere ich mein Team nachhaltig?", ["otivation", "otivier"], "motivation"),
    ("Es gibt doch ein 6P-Modell zum Storytelling bei Wlad. Was ist das?", ["6P", "6 P", "torytelling"], "storytelling"),
    ("Wie überzeuge ich in Online-Meetings und digitaler Rhetorik?", ["igital", "nline", "amera"], "digitale_rhetorik"),
    ("Was sind die 30 Schlagfertigkeitstechniken von Wlad?", ["chlagfertig"], "schlagfertigkeit"),
    ("Was sind die zehn Stufen des Zuhörens?", ["Zuhör", "Stufen des Zuhörens"], "zuhoeren"),
    ("Erklär mir das SEXIER Modell von Wlad anhand eines Beispiels", ["SEXIER", "sexier"], "argumentation"),
]


@pytest.mark.parametrize("question,expect_any,course", COVERAGE, ids=[c[2] for c in COVERAGE])
def test_knowledge_coverage(question, expect_any, course):
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")
    from services_rag import retrieve_context

    ctx = asyncio.get_event_loop().run_until_complete(retrieve_context(question))
    assert ctx["rag_active"], f"[{course}] RAG inactive for: {question}"
    block = ctx["context_block"]
    assert any(t in block for t in expect_any), (
        f"[{course}] expected one of {expect_any} in context.\n"
        f"chunks={ctx['chunks_count']}, head: {block[:250]}"
    )
