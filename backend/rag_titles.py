"""Anzeigetitel für RAG-Quellen — geteilt von Admin-Routen und services_rag (kein Import routes -> services -> routes)."""
from __future__ import annotations



def clean_display_title(source_file: str, raw_course: str | None) -> str:
    """Human-friendly source title.

    Uses the FILENAME as the authoritative title source. The stored `course`
    metadata is only reused when it clearly looks like a curated title
    (e.g. "Live-Call 2025.10.15") — never when it's an ALL-CAPS content
    fragment like "WLAD JACHTCHENKO DUBISTER BESERECHEF" or a long
    lowercase sentence copy-pasted from the first chunk.
    """
    base = (source_file or "").rsplit(".", 1)[0].replace("_", " ").strip()

    def _looks_curated(s: str) -> bool:
        if not s or len(s) > 60 or len(s) < 4:
            return False
        # Live-Call titles are ideal — accept them.
        if s.startswith("Live-Call"):
            return True
        # Reject ALL-CAPS strings that are clearly OCR-garbage or content-echo.
        letters = [c for c in s if c.isalpha()]
        if letters and sum(1 for c in letters if c.isupper()) / len(letters) > 0.75:
            return False
        # Reject if any word is longer than 20 chars (fused content).
        if any(len(w) > 20 for w in s.split()):
            return False
        return s[0].isupper()

    if _looks_curated(raw_course or ""):
        return raw_course.strip()

    if not base:
        return raw_course or source_file or "(unnamed)"

    pretty = base.title()
    # Normalize the German character mangling from earlier ingest runs.
    # 1) ß encoded as "├Ƒ" or "├ƒ" (mojibake in Windows-1252 → UTF-8 roundtrip).
    for bad in ("├Ƒ", "├ƒ", "├ƒe", "├Ƒe"):
        pretty = pretty.replace(bad, "ß")
    # 2) Snake-case umlaut placeholders → real umlauts (both title & lowercase).
    replacements = [
        ("Ae", "ä"), ("Oe", "ö"), ("Ue", "ü"),
        ("ae", "ä"), ("oe", "ö"), ("ue", "ü"),
    ]
    for old, new in replacements:
        pretty = pretty.replace(old, new)
    # Restore capitalisation after the umlaut substitution ate leading caps.
    words = pretty.split(" ")
    pretty = " ".join(w[:1].upper() + w[1:] if w else w for w in words)
    return pretty
