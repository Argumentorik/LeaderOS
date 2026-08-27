"""Quiz-Qualität (Iter 139).

Zwei Probleme im Bestand:
1. Positions-Bias: 229 von 235 MC-Fragen hatten die richtige Antwort auf Position B.
2. Schwache Distraktoren: die richtige Antwort war in 229 Fällen die längste Option.

`shuffle_options` löst (1) deterministisch pro (User, Tag, Frage) — gleiche
Reihenfolge bei Reload, aber nicht vorhersehbar und ohne Leak im Client.
`validate_question` löst (2) als harte Regel: verletzte Regeln => Frage wird
beim Generieren/Rewriten abgelehnt und neu erzeugt.
"""

import hashlib
import random
import statistics
from typing import Optional

# Signalwörter, die eine Antwort verräterisch machen, wenn nur EINE Option sie trägt
ABSOLUTE_WORDS = ("immer", "alle", "nie", "niemals", "jeder", "ausschließlich", "grundsätzlich")
LENGTH_TOLERANCE = 0.25  # ±25 % zur Median-Länge
MIN_OPTION_CHARS = 25


def _seeded_rng(*parts: str) -> random.Random:
    digest = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()
    return random.Random(int(digest[:16], 16))


def shuffle_options(options: list, correct_index: int, *seed_parts: str) -> tuple[list, int]:
    """Deterministisch geshuffelte Optionen + neuer Index der richtigen Antwort."""
    if not options:
        return [], -1
    order = list(range(len(options)))
    _seeded_rng(*seed_parts).shuffle(order)
    shuffled = [options[i] for i in order]
    new_correct = order.index(correct_index) if 0 <= correct_index < len(options) else -1
    return shuffled, new_correct


def validate_question(question: dict) -> list:
    """Liefert eine Liste verletzter Regeln (leer = Frage ist zulässig)."""
    issues = []
    options = question.get("options") or []
    correct = question.get("correct", -1)
    if len(options) < 3:
        issues.append("zu_wenige_optionen")
        return issues
    if not 0 <= correct < len(options):
        # correct == -1 ist eine Selbstauskunft-Frage (jede Antwort zählt) —
        # dort gibt es keinen Distraktor, der bewertet werden könnte.
        if correct == -1:
            return []
        issues.append("kein_gueltiger_correct_index")
        return issues

    lengths = [len(o) for o in options]
    median = statistics.median(lengths)
    for i, length in enumerate(lengths):
        if length < MIN_OPTION_CHARS:
            issues.append(f"option_{i}_zu_kurz")
        if median and abs(length - median) / median > LENGTH_TOLERANCE:
            issues.append(f"option_{i}_laengenabweichung")

    if lengths[correct] == max(lengths) and lengths[correct] > median * (1 + LENGTH_TOLERANCE):
        issues.append("richtige_antwort_ist_deutlich_laengste")

    lowered = [o.lower() for o in options]
    if len({o.strip().lower() for o in options}) != len(options):
        issues.append("doppelte_optionen")

    for word in ABSOLUTE_WORDS:
        carriers = [i for i, o in enumerate(lowered) if word in o]
        if carriers == [correct]:
            issues.append(f"signalwort_nur_in_richtiger_antwort:{word}")

    return issues


def position_distribution(bank: dict) -> dict:
    """Diagnose-Helper: Verteilung der Position der richtigen Antwort."""
    dist: dict = {}
    for questions in bank.values():
        for q in questions:
            if q.get("type", "mc") == "mc" and q.get("options"):
                idx: Optional[int] = q.get("correct")
                dist[idx] = dist.get(idx, 0) + 1
    return dict(sorted(dist.items(), key=lambda kv: (kv[0] is None, kv[0])))
