"""Einmalige Korrektur alter Texte: „Vlad" → „Wlad" (Iter 183).

Betrifft nur maschinell erzeugte bzw. transkribierte Inhalte:
Gesprächstitel, gespeicherte Coach-Antworten, Analyse-Transkripte.
Selbst getippter Nutzertext bleibt unangetastet.

Aufruf: python3 scripts_fix_vlad_names.py
"""
from __future__ import annotations

import asyncio
import re

from config import db
from services_speech_text import fix_brand_names

_HAS_VLAD = re.compile(r"\b(?:Vlad|Vlat|Vladimir|Wladimir|Flad|Flat|Blad)\b|\bVlad[\s-]?Bot\b")


async def _fix_titles() -> int:
    changed = 0
    async for s in db.chat_sessions.find({"title": {"$regex": _HAS_VLAD.pattern}}, {"_id": 1, "title": 1}):
        fixed = fix_brand_names(s.get("title") or "")
        if fixed != s.get("title"):
            await db.chat_sessions.update_one({"_id": s["_id"]}, {"$set": {"title": fixed}})
            changed += 1
    return changed


async def _fix_assistant_messages() -> int:
    changed = 0
    async for m in db.chat_messages.find(
        {"role": "assistant", "content": {"$regex": _HAS_VLAD.pattern}}, {"_id": 1, "content": 1},
    ):
        fixed = fix_brand_names(m.get("content") or "")
        if fixed != m.get("content"):
            await db.chat_messages.update_one({"_id": m["_id"]}, {"$set": {"content": fixed}})
            changed += 1
    return changed


async def _fix_transcripts() -> int:
    changed = 0
    for coll in ("video_archive", "video_challenges", "video_attempts"):
        async for doc in db[coll].find(
            {"analysis.transcript": {"$regex": _HAS_VLAD.pattern}}, {"_id": 1, "analysis": 1},
        ):
            analysis = doc.get("analysis") or {}
            fixed = fix_brand_names(analysis.get("transcript") or "")
            if fixed and fixed != analysis.get("transcript"):
                await db[coll].update_one({"_id": doc["_id"]}, {"$set": {"analysis.transcript": fixed}})
                changed += 1
    return changed


async def main() -> None:
    titles = await _fix_titles()
    messages = await _fix_assistant_messages()
    transcripts = await _fix_transcripts()
    print(f"Titel korrigiert: {titles} · Coach-Antworten: {messages} · Transkripte: {transcripts}")


if __name__ == "__main__":
    asyncio.run(main())
