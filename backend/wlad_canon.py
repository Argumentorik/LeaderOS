"""Verbindliches Kernwissen (Iter 183).

Problem: Im Sprach-Modus hat das Modell beim SEXIER-Modell E und X vertauscht und
beim zweiten E ein „Explore" erfunden. Im Text-Modus war die Antwort korrekt, weil
dort zufällig ein passender Wissens-Baustein gegriffen hat.

Lösung: Die tragenden Modelle stehen hier WÖRTLICH und werden in JEDEN Modus
(Chat, Sprache, Interaktiver Wlad, Video-Analyse) als verbindliche Definition
eingespielt, sobald der Nutzer sie anspricht. Damit kann kein Buchstabe wandern.

Quellen: `services.WLADBOT_SYSTEM_PROMPT` (Signature-Frameworks), Buch „Weiße
Rhetorik" (3-B-Schema: B1 Behauptung · B2 Begründung · B3 Beispiel),
`services_rag.MANUAL_CHUNKS`. Es wird NICHTS ergänzt, was nicht belegt ist.
"""
from __future__ import annotations

import re

CANON: list[dict] = [
    {
        "key": "sexier",
        # „sexi" deckt auch „sexier" ab (Teilstring) — deshalb genügt der kurze Stamm.
        "aliases": ("sexier", "sexi", "sexy", "sechsier", "sechser", "sexer", "s e x i e r",
                    "statement explanation", "argumentationsmodell", "argumentations-modell"),
        "text": (
            "SEXIER-Modell (Argumentation, genau 6 Elemente, Reihenfolge und Bedeutung sind fix):\n"
            "S = Statement (die Behauptung/These)\n"
            "E = Explanation (die Begründung: warum ist die These wahr?)\n"
            "X = eXample (das Beispiel: ein konkreter Fall, der die These belegt)\n"
            "I = Impact (die Relevanz: warum ist das für den Zuhörer wichtig?)\n"
            "E = Explanation of Impact (die Begründung der Relevanz: warum hat es genau diese Wirkung?)\n"
            "R = Rebuttal (die Widerlegung des stärksten Einwands)\n"
            "STRIKT VERBOTEN: E und X vertauschen, „Example\" als zweiten Buchstaben nennen, "
            "„Explore\", „Repeat\", „Implications\" oder irgendein anderes Element erfinden. "
            "Die Kurzform „SEXI\" umfasst nur die ersten vier Schritte (Statement, Explanation, "
            "eXample, Impact) — das vollständige Modell heißt SEXIER und hat sechs."
        ),
    },
    {
        "key": "3b",
        "aliases": ("3-b-schema", "3 b schema", "drei-b-schema", "drei b schema", "3b-schema", "3b schema"),
        "text": (
            "3-B-Schema (das Schul-Argumentationsmodell, Quelle: „Weiße Rhetorik\"):\n"
            "B1 = Behauptung · B2 = Begründung · B3 = Beispiel.\n"
            "Es ist die verkürzte Vorstufe zum SEXIER-Modell — es fehlen Impact, "
            "Explanation of Impact und Rebuttal."
        ),
    },
    {
        "key": "saeulen",
        "aliases": ("3 säulen", "drei säulen", "logos", "ethos", "pathos", "loguse", "patos"),
        "text": (
            "3 Säulen der Überzeugung: Logos (Logik, Daten, Struktur) · Ethos (Glaubwürdigkeit, "
            "Haltung, Expertise) · Pathos (Emotion, Storytelling, Bilder). Genau drei Säulen, "
            "keine weiteren."
        ),
    },
    {
        "key": "feedback",
        "aliases": ("feedbackformel", "feedback-formel", "feedback geben", "wwww", "www-feedback", "sbi"),
        "text": (
            "Feedbackformel: Beobachtung + Wirkung + Wunsch. Immer „Ich habe beobachtet, dass …\", "
            "niemals „Du bist …\"."
        ),
    },
    {
        "key": "rhetorik",
        "aliases": ("weiße rhetorik", "weisse rhetorik", "weiß rhetorik", "schwarze rhetorik",
                    "dunkle rhetorik", "dark rhetoric", "manipulation"),
        "text": (
            "Weiße Rhetorik = ethisches Überzeugen (Buch „Weiße Rhetorik\", Goldmann): "
            "sachlich argumentieren, Struktur, Respekt vor dem Gegenüber. "
            "Dunkle/Schwarze Rhetorik = Manipulationstechniken (Strohmann, Ad hominem, "
            "Whataboutism …) ERKENNEN und ABWEHREN (Buch „Dunkle Rhetorik\") — Wlad lehrt "
            "die Abwehr, nicht den Einsatz."
        ),
    },
    {
        "key": "6p",
        "aliases": ("6p", "6-p-modell", "sechs p", "storytelling-modell", "peripetie"),
        "text": (
            "6P-Modell (Storytelling, 6 Elemente, feste Reihenfolge): 1. Plot (Handlung) · "
            "2. Polarität (Konflikt) · 3. Protagonist (Hauptfigur) · 4. Peripetie (Wendepunkt) · "
            "5. Pointe (Moral) · 6. Präsentation (Vortrag)."
        ),
    },
    {
        "key": "charisma",
        "aliases": ("charisma-code", "charisma code", "charisma", "credo habitus"),
        "text": (
            "Charisma-Code (8 Elemente, feste Reihenfolge): 1. Credo · 2. Habitus · "
            "3. Außeralltäglichkeit · 4. Rhetorik · 5. Inszenierung · 6. Superskills · "
            "7. Motivation · 8. Arbeit."
        ),
    },
    {
        "key": "zuhoeren",
        "aliases": ("10 stufen", "zehn stufen", "stufen des zuhörens", "zuhören"),
        "text": (
            "10 Stufen des Zuhörens, zwei Kategorien:\n"
            "Antwortenorientiert (1–6): Vortäuschendes · Kürzendes · Selektives · "
            "Übertrumpfendes · Egoistisches · Beratendes Zuhören.\n"
            "Verstehend (7–10): Aufmerksames · Aktives · Empathisches · Helfendes Zuhören."
        ),
    },
    {
        "key": "rollen",
        "aliases": ("5 rollen", "fünf rollen", "rollen einer führungskraft"),
        "text": (
            "Die 5 Rollen einer Führungskraft: 1. Kommunikator · 2. Manager · 3. Team Leader · "
            "4. Psychologe · 5. Problemlöser."
        ),
    },
    {
        "key": "gespraechstypen",
        "aliases": ("4 gesprächstypen", "vier gesprächstypen", "gesprächstypen", "einwandbehandlung", "einwand"),
        "text": (
            "Die 4 Gesprächstypen: Informieren · Überzeugen · Verhandeln · Konfrontieren — "
            "jeder Typ braucht eine andere Strategie. Einwände werden nach SEXIER im Rebuttal "
            "antizipiert und entkräftet (verstehen → würdigen → mit Beispiel widerlegen)."
        ),
    },
]

_MAX_ENTRIES = 3

_NAME_RULE = (
    "NAMENSREGEL: Der Coach heißt „Wlad\" (Wlad Jachtchenko), das Produkt „WladBot\". "
    "Schreibe NIEMALS „Vlad\", „Vladimir\" oder „Wladimir\" — auch nicht, wenn die "
    "Spracherkennung es so geliefert hat."
)


def _norm(text: str) -> str:
    return re.sub(r"[^a-z0-9äöüß\- ]+", " ", (text or "").lower())


def canon_matches(text: str) -> list[dict]:
    """Welche verbindlichen Definitionen spricht der Nutzer an?"""
    if not text:
        return []
    hay = _norm(text)
    hits: list[dict] = []
    for entry in CANON:
        if any(alias in hay for alias in entry["aliases"]):
            hits.append(entry)
        if len(hits) >= _MAX_ENTRIES:
            break
    return hits


def canon_block(text: str, always: tuple[str, ...] = ()) -> str:
    """Block für den System-Prompt: wörtliche Definitionen + Namensregel.

    `always` erzwingt Einträge unabhängig vom Text (z. B. „sexier" in der Video-Analyse).
    Leerer String, wenn nichts zutrifft — dann bleibt der Prompt unverändert kurz.
    """
    hits = canon_matches(text)
    if always:
        keys = {h["key"] for h in hits}
        hits = [e for e in CANON if e["key"] in always and e["key"] not in keys] + hits
    if not hits:
        return ""
    body = "\n\n".join(e["text"] for e in hits[:_MAX_ENTRIES])
    return (
        "\n\n--- VERBINDLICHE DEFINITIONEN (WÖRTLICH, HÖCHSTE PRIORITÄT) ---\n"
        "Diese Angaben sind gesichert. Sie überschreiben dein Trainingswissen UND jede "
        "abweichende Formulierung in den Quellen. Nenne Buchstaben, Reihenfolge und "
        "Bezeichnungen exakt so — im Schreiben wie im Sprechen.\n\n"
        f"{body}\n\n{_NAME_RULE}\n---"
    )
