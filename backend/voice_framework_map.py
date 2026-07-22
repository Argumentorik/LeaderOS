"""voice_framework_map.py — Wlad-Framework Keyword Normalisation.

Voice input (Whisper) often mis-hears fachlich / rhetorisch spezifische
Begriffe. Wlads Frameworks tauchen dann als phonetisch verwandte Wörter im
Transkript auf ("sexier" statt „SEXIER" oder „Sekura", „Loguse" statt Logos
etc.). Wir mappen bekannte Fehl-Hörungen zurück auf die kanonischen
Frameworks und liefern zusätzlich einen `matched_frameworks`-Hinweis, den
das Frontend als „Meintest du…?"-Chip zeigen kann.

Zusätzlich klassifiziert `assess_transcript_quality`, ob die Aufnahme zu
undeutlich war (< MIN_WORDS_FOR_QUESTION Wörter oder nur Füllwörter), damit
die UI dem User sagen kann „Bitte deutlicher sprechen".
"""
from __future__ import annotations

import re
from typing import Any

# ── Kanonische Wlad-Frameworks + phonetische Variants ────────────────────
# Die Keys sind LEXikalische Trigger (auch grob phonetisch gefuzzt); der
# Wert benennt Framework + kurze Beschreibung, die das LLM als expliziten
# Kontext-Boost bekommt.
FRAMEWORK_ALIASES: dict[str, dict[str, str]] = {
    # 3 Säulen der Überzeugung: Logos, Ethos, Pathos
    "logos": {"framework": "3 Säulen der Überzeugung", "pillar": "Logos"},
    "loguse": {"framework": "3 Säulen der Überzeugung", "pillar": "Logos"},
    "logus": {"framework": "3 Säulen der Überzeugung", "pillar": "Logos"},
    "ethos": {"framework": "3 Säulen der Überzeugung", "pillar": "Ethos"},
    "etus": {"framework": "3 Säulen der Überzeugung", "pillar": "Ethos"},
    "pathos": {"framework": "3 Säulen der Überzeugung", "pillar": "Pathos"},
    "patos": {"framework": "3 Säulen der Überzeugung", "pillar": "Pathos"},
    "pathus": {"framework": "3 Säulen der Überzeugung", "pillar": "Pathos"},

    # SEXIER Argumentation (Wlads Signature-Framework für starke Argumente)
    "sexier": {"framework": "SEXIER-Argumentation", "pillar": "SEXIER"},
    "sexy": {"framework": "SEXIER-Argumentation", "pillar": "SEXIER"},
    "sechsier": {"framework": "SEXIER-Argumentation", "pillar": "SEXIER"},
    "sechser": {"framework": "SEXIER-Argumentation", "pillar": "SEXIER"},
    "sexer": {"framework": "SEXIER-Argumentation", "pillar": "SEXIER"},

    # Kommunikationsquadrant
    "kommunikationsquadrant": {"framework": "Kommunikationsquadrant", "pillar": "Quadrant"},
    "quadrant": {"framework": "Kommunikationsquadrant", "pillar": "Quadrant"},
    "klarheit": {"framework": "Kommunikationsquadrant", "pillar": "Klarheit"},
    "empathie": {"framework": "Kommunikationsquadrant", "pillar": "Empathie"},

    # Schwarze Rhetorik / Manipulationsabwehr
    "schwarze rhetorik": {"framework": "Schwarze Rhetorik", "pillar": "Manipulationsabwehr"},
    "manipulation": {"framework": "Schwarze Rhetorik", "pillar": "Manipulationsabwehr"},
    "dark rhetoric": {"framework": "Schwarze Rhetorik", "pillar": "Manipulationsabwehr"},

    # Verhandeln nach Wlad
    "verhandlung": {"framework": "Verhandeln nach Wlad", "pillar": "Verhandlungstaktik"},
    "verhandeln": {"framework": "Verhandeln nach Wlad", "pillar": "Verhandlungstaktik"},
    "batna": {"framework": "Verhandeln nach Wlad", "pillar": "BATNA"},

    # Storytelling
    "storytelling": {"framework": "Storytelling im Boardroom", "pillar": "Story-Struktur"},
    "story": {"framework": "Storytelling im Boardroom", "pillar": "Story-Struktur"},

    # Feedback (SBI / WWW)
    "sbi": {"framework": "SBI-Feedback", "pillar": "Situation-Behaviour-Impact"},
    "www": {"framework": "WWW-Feedback", "pillar": "Wahrnehmung-Wirkung-Wunsch"},
}

# Minimum-Anforderungen an eine Voice-Frage
MIN_WORDS_FOR_QUESTION = 3
MIN_CHARS_FOR_QUESTION = 10

# „Filler"-Wörter, die alleine keine echte Frage ergeben
_FILLERS = {
    "äh", "ähm", "ehm", "hm", "hmm", "mhm", "ok", "okay", "ja", "nein",
    "also", "genau", "quasi", "irgendwie", "eigentlich",
}


def _normalise(text: str) -> str:
    return re.sub(r"[^a-zäöüß\s-]", " ", (text or "").lower()).strip()


def match_frameworks(transcript: str) -> list[dict[str, str]]:
    """Return the list of Wlad-Frameworks referenced (or approximately spoken)
    in the transcript. Order: first hit wins per framework."""
    if not transcript:
        return []
    norm = f" {_normalise(transcript)} "
    seen: set[str] = set()
    hits: list[dict[str, str]] = []
    for alias, meta in FRAMEWORK_ALIASES.items():
        # Wort-Grenzen sind wichtig, sonst matcht „story" in „historically".
        if f" {alias} " in norm and meta["framework"] not in seen:
            seen.add(meta["framework"])
            hits.append({**meta, "alias": alias})
    return hits


def assess_transcript_quality(transcript: str) -> dict[str, Any]:
    """Return a heuristic quality signal for the recording.

    Frontend nutzt `low_confidence` um den „Bitte deutlicher sprechen"-Hint
    anzuzeigen, sowie `is_question` um dem User zu bestätigen, dass wir seine
    Frage verstanden haben.
    """
    if not transcript:
        return {
            "low_confidence": True,
            "hint": "Ich habe nichts verstanden. Bitte tippe den Mikro-Button und sprich deutlich in Richtung Mikrofon.",
            "is_question": False,
            "word_count": 0,
        }

    words = [w for w in re.split(r"\s+", transcript.strip()) if w]
    word_count = len(words)
    meaningful = [w for w in words if w.lower() not in _FILLERS]
    meaningful_count = len(meaningful)
    char_count = len(transcript.strip())

    low_confidence = (
        word_count < MIN_WORDS_FOR_QUESTION
        or char_count < MIN_CHARS_FOR_QUESTION
        or meaningful_count == 0
    )

    is_question = (
        "?" in transcript
        or bool(re.search(r"\b(wie|was|warum|weshalb|wann|wo|wer|welche|kannst du|kannst ihr|erkl(ä|ae)r|zeig|sag)\b",
                          transcript.lower()))
    )

    hint = None
    if low_confidence:
        hint = (
            "Deine Frage kam sehr kurz/undeutlich an. Bitte sprich einen "
            "vollständigen Satz deutlich in Richtung Mikrofon."
        )

    return {
        "low_confidence": low_confidence,
        "hint": hint,
        "is_question": is_question,
        "word_count": word_count,
    }


def enrich_transcript(transcript: str) -> dict[str, Any]:
    """One-shot enrichment used by /voice/transcribe."""
    frameworks = match_frameworks(transcript)
    quality = assess_transcript_quality(transcript)
    return {
        "text": transcript,
        "matched_frameworks": frameworks,
        **quality,
    }
