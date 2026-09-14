"""Aussprache-Schicht vor der Sprachausgabe (Iter 180).

Der Klon liest deutschen Text meist korrekt — bei einigen Wörtern greift aber die
englische Lesart oder eine verschluckte Endung. Hier steht die Liste, die der
Text kurz VOR dem TTS durchläuft (Live-Stimme und Video-Rendering gleichermaßen).
Der angezeigte Text bleibt unverändert — nur die Sprachausgabe wird korrigiert.

Regeln:
* Nur ganze Wörter (Wortgrenzen), Groß-/Kleinschreibung bleibt erhalten.
* Keine Silbentrenn-Bindestriche (der Klon macht daraus eine Pause), stattdessen
  lautschriftliche Umschrift.
"""
from __future__ import annotations

import re

# Wort (klein geschrieben) -> gesprochene Umschrift
PRONUNCIATION: dict[str, str] = {
    # Mert: „im" wird verschluckt → doppeltes m macht das Wort vollständig hörbar
    "im": "imm",
    # „Lade/Laden" wurde englisch gelesen (leid) → deutsches langes a, hörbares e
    "lade": "lahde",
    "laden": "lahden",
    "ladest": "lahdest",
    "lädt": "lähdt",
    # Abkürzungen, die als Wort gelesen wurden
    "ki": "k-i",
    "roi": "r-o-i",
    "sbi": "s-b-i",
    "www": "w-w-w",
    "kpi": "k-p-i",
    "kpis": "k-p-is",
    "eq": "e-q",
    # Marke: nie „Vlad", nie getrennt gesprochen
    "vlad": "Wlad",
    "vladimir": "Wlad",
    "wladimir": "Wlad",
}

_WORD_RE = re.compile(r"[A-Za-zÄÖÜäöüß]+")


def _match_case(original: str, replacement: str) -> str:
    if original.isupper() and len(original) > 1:
        return replacement.upper()
    if original[:1].isupper():
        return replacement[:1].upper() + replacement[1:]
    return replacement


def to_speakable(text: str) -> str:
    """Text für die Sprachausgabe aufbereiten (Aussprache + Namensregel)."""
    if not text:
        return text

    def repl(m: re.Match) -> str:
        word = m.group(0)
        fix = PRONUNCIATION.get(word.lower())
        return _match_case(word, fix) if fix else word

    spoken = _WORD_RE.sub(repl, text)
    # Sternchen/Markdown würden mitgelesen
    spoken = re.sub(r"[*_#`]+", "", spoken)
    return spoken
