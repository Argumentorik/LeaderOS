"""Einmalige Korrektur bereits gespeicherter Antworten mit Rohzeichen.

Kundenmeldung (Iter 184): In gespeicherten Chat-Antworten stehen `\\n`,
`\\u201e`, `\\u201c` als Rohzeichen. Dieses Skript bereinigt sie, damit auch
alte Gespräche, Gesprächstitel und übernommene Aufgaben sauber aussehen.

Aufruf:
    cd /app/backend && python scripts_fix_escaped_text.py          # Vorschau
    cd /app/backend && python scripts_fix_escaped_text.py --apply  # schreiben
"""
from __future__ import annotations

import asyncio
import json
import sys

from config import db
from services_text_clean import deep_unescape, has_raw_escapes, unwrap_json_string


def _any_raw(value) -> bool:
    if isinstance(value, str):
        return has_raw_escapes(value)
    if isinstance(value, list):
        return any(_any_raw(v) for v in value)
    if isinstance(value, dict):
        return any(_any_raw(v) for v in value.values())
    return False


async def fix_chat_messages(apply: bool) -> int:
    fixed = 0
    cursor = db.chat_messages.find({"role": "assistant"}, {"_id": 1, "content": 1, "parsed": 1})
    async for doc in cursor:
        update: dict = {}
        parsed = doc.get("parsed")
        content = doc.get("content")

        if isinstance(parsed, dict) and _any_raw(parsed):
            update["parsed"] = deep_unescape(parsed)

        if isinstance(content, str):
            new_content = content
            stripped = content.strip()
            if stripped.startswith("{") or stripped.startswith('"'):
                try:
                    obj = json.loads(unwrap_json_string(stripped))
                    if isinstance(obj, dict):
                        cleaned = deep_unescape(obj)
                        if cleaned != obj or unwrap_json_string(stripped) != stripped:
                            new_content = json.dumps(cleaned, ensure_ascii=False)
                except (json.JSONDecodeError, ValueError):
                    if has_raw_escapes(content):
                        new_content = deep_unescape(content)
            elif has_raw_escapes(content):
                new_content = deep_unescape(content)
            if new_content != content:
                update["content"] = new_content
            elif "parsed" in update:
                update["content"] = json.dumps(update["parsed"], ensure_ascii=False)

        if update:
            fixed += 1
            if apply:
                await db.chat_messages.update_one({"_id": doc["_id"]}, {"$set": update})
    return fixed


async def fix_simple_fields(collection, fields: list[str], apply: bool) -> int:
    fixed = 0
    projection = {"_id": 1, **{f: 1 for f in fields}}
    async for doc in collection.find({}, projection):
        update = {f: deep_unescape(doc[f]) for f in fields
                  if isinstance(doc.get(f), str) and has_raw_escapes(doc[f])}
        if update:
            fixed += 1
            if apply:
                await collection.update_one({"_id": doc["_id"]}, {"$set": update})
    return fixed


async def main() -> None:
    apply = "--apply" in sys.argv
    msgs = await fix_chat_messages(apply)
    sessions = await fix_simple_fields(db.chat_sessions, ["title"], apply)
    tasks = await fix_simple_fields(db.tasks, ["title", "description"], apply)
    mode = "korrigiert" if apply else "betroffen (Vorschau, nichts geschrieben)"
    print(f"chat_messages: {msgs} {mode}")
    print(f"chat_sessions: {sessions} {mode}")
    print(f"tasks:         {tasks} {mode}")
    if not apply:
        print("\nZum Schreiben erneut mit --apply starten.")


if __name__ == "__main__":
    asyncio.run(main())
