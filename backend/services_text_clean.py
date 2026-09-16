"""Zentrales Entpacken von LLM-Antworten.

Kundenmeldung (Iter 184): In Antworten standen Zeichenfolgen wie `\\n`,
`\\u201e`, `\\u201c` mitten im Text. Ursache: das Modell liefert seine
Antwort gelegentlich als *doppelt* verpackten JSON-String
(`"{\\"insight\\": \\"Zeile1\\\\nZeile2\\"}"`). `json.loads` liefert dann
einen String statt eines Dicts, der Parser scheitert, und der Rohtext mit
allen Escape-Sequenzen landt unverändert in der Antwort.

Hier wird an EINER Stelle entpackt: Escape-Sequenzen werden zu echten
Zeichen (Zeilenumbruch, deutsche Anführungszeichen), und doppelt
verpackte JSON-Strings werden ausgepackt.
"""
from __future__ import annotations

import json
import re
from typing import Any

_ESCAPE_RE = re.compile(r'\\(u[0-9a-fA-F]{4}|n|r|t|"|\\)')
_SIMPLE = {"n": "\n", "r": "\r", "t": "\t", '"': '"', "\\": "\\"}


def unescape_text(value: Any) -> Any:
    """Literale Escape-Sequenzen in echte Zeichen umwandeln.

    `\\n` → Zeilenumbruch, `\\u201e` → „, `\\u201c` → “, `\\"` → ".
    Nicht-Strings und Texte ohne Backslash werden unverändert zurückgegeben.
    """
    if not isinstance(value, str) or "\\" not in value:
        return value

    def rep(m: re.Match) -> str:
        g = m.group(1)
        if g[0] == "u":
            try:
                return chr(int(g[1:], 16))
            except ValueError:
                return m.group(0)
        return _SIMPLE.get(g, m.group(0))

    return _ESCAPE_RE.sub(rep, value)


def deep_unescape(obj: Any) -> Any:
    """Rekursiv über Dicts/Listen/Strings — für geparste Coach-Antworten."""
    if isinstance(obj, str):
        return unescape_text(obj)
    if isinstance(obj, list):
        return [deep_unescape(v) for v in obj]
    if isinstance(obj, tuple):
        return tuple(deep_unescape(v) for v in obj)
    if isinstance(obj, dict):
        return {k: deep_unescape(v) for k, v in obj.items()}
    return obj


def unwrap_json_string(text: str, max_depth: int = 3) -> str:
    """Doppelt verpackte JSON-Strings auspacken.

    `'"{\\"a\\": 1}"'` → `'{"a": 1}'`. Gibt den Originaltext zurück, wenn
    nichts auszupacken ist.
    """
    if not isinstance(text, str):
        return text
    cur = text
    for _ in range(max_depth):
        stripped = cur.strip()
        if not stripped.startswith('"'):
            break
        try:
            nxt = json.loads(stripped)
        except (json.JSONDecodeError, ValueError):
            break
        if not isinstance(nxt, str):
            break
        cur = nxt
    return cur


def has_raw_escapes(value: Any) -> bool:
    """True, wenn im Text noch unaufgelöste Steuerzeichen stecken."""
    return isinstance(value, str) and bool(_ESCAPE_RE.search(value))
