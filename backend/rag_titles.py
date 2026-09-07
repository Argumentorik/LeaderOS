"""Anzeigetitel für RAG-Quellen — geteilt von Admin-Routen und services_rag (kein Import routes -> services -> routes)."""
from __future__ import annotations



_MOJIBAKE_SS = ("├Ƒ", "├ƒ", "├ƒe", "├Ƒe")
_UMLAUTS = (("Ae", "ä"), ("Oe", "ö"), ("Ue", "ü"), ("ae", "ä"), ("oe", "ö"), ("ue", "ü"))


def _looks_curated(s: str) -> bool:
    """Kuratierter Titel (z. B. "Live-Call 2025.10.15") — nicht ALL-CAPS-OCR-Müll oder Inhalts-Echo."""
    if not s or len(s) > 60 or len(s) < 4:
        return False
    if s.startswith("Live-Call"):
        return True
    letters = [c for c in s if c.isalpha()]
    if letters and sum(1 for c in letters if c.isupper()) / len(letters) > 0.75:
        return False
    if any(len(w) > 20 for w in s.split()):
        return False
    return s[0].isupper()


def _prettify_filename(base: str) -> str:
    """Title-Case + Reparatur von ß-Mojibake und Snake-Case-Umlauten (Ae/Oe/Ue)."""
    pretty = base.title()
    for bad in _MOJIBAKE_SS:
        pretty = pretty.replace(bad, "ß")
    for old, new in _UMLAUTS:
        pretty = pretty.replace(old, new)
    return " ".join(w[:1].upper() + w[1:] if w else w for w in pretty.split(" "))


def clean_display_title(source_file: str, raw_course: str | None) -> str:
    """Anzeigetitel einer Quelle: Dateiname ist maßgeblich; gespeichertes `course` nur, wenn kuratiert."""
    if _looks_curated(raw_course or ""):
        return raw_course.strip()
    base = (source_file or "").rsplit(".", 1)[0].replace("_", " ").strip()
    if not base:
        return raw_course or source_file or "(unnamed)"
    return _prettify_filename(base)
