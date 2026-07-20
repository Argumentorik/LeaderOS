"""Folder Knowledge service — second-layer "history" RAG.

Mert (Iter 92.23.9):
    "Folder Knowledge-RAG — neben dem Wissens-RAG auf Wlad-Corpus ein zweiter
    Mini-RAG nur ueber die Folder-Items, damit der Agent 'die Geschichte
    deines Themas' kennt"

Strategy:
    We deterministically pull the most recent N items, summarise each in
    1-2 lines, and inject them as a compact timeline block. Recent context
    dominates leadership decisions.
"""
from __future__ import annotations

from typing import Optional, List
from config import db


MAX_ITEMS_PER_FOLDER = 8
MAX_TRANSCRIPT_CHARS = 600
MAX_ASSESSMENT_CHARS = 500
MAX_MSG_CHARS = 400
MAX_CHAT_TURNS = 4


async def _fetch_video_item(source_id: str, user_id: str) -> Optional[dict]:
    doc = await db.video_challenges.find_one(
        {"entry_id": source_id, "user_id": user_id},
        {"_id": 0, "challenge_id": 1, "custom_title": 1, "created_at": 1, "analysis": 1},
    )
    if not doc:
        return None
    ana = doc.get("analysis") or {}
    return {
        "type": "video_mission",
        "title": doc.get("custom_title") or "Video-Mission",
        "date": doc.get("created_at", ""),
        "score": ana.get("overall_score"),
        "transcript": (ana.get("transcript") or "")[:MAX_TRANSCRIPT_CHARS],
        "wlad": (ana.get("wlad_assessment") or "")[:MAX_ASSESSMENT_CHARS],
        "strengths": ana.get("strengths", [])[:2],
        "improvements": ana.get("improvements", [])[:2],
    }


async def _fetch_chat_item(source_id: str, user_id: str) -> Optional[dict]:
    sess = await db.chat_sessions.find_one(
        {"session_id": source_id, "user_id": user_id},
        {"_id": 0, "session_id": 1, "title": 1, "created_at": 1},
    )
    if not sess:
        return None
    msgs = await db.chat_messages.find(
        {"session_id": source_id, "user_id": user_id},
        {"_id": 0, "role": 1, "content": 1, "created_at": 1},
    ).sort("created_at", -1).to_list(MAX_CHAT_TURNS * 2)
    msgs.reverse()
    compressed = []
    for m in msgs[-MAX_CHAT_TURNS * 2 :]:
        role = "User" if m.get("role") == "user" else "Wlad"
        compressed.append(f"{role}: {(m.get('content') or '')[:MAX_MSG_CHARS]}")
    return {
        "type": "chat_session",
        "title": sess.get("title") or "Chat-Session",
        "date": sess.get("created_at", ""),
        "turns": compressed,
    }


async def build_folder_timeline(folder_id: str, user_id: str, limit: int = MAX_ITEMS_PER_FOLDER) -> tuple[List[dict], str]:
    """Return (items, formatted_text). Empty text if folder has no items."""
    items = await db.folder_items.find(
        {"folder_id": folder_id, "user_id": user_id},
        {"_id": 0},
    ).sort("created_at", -1).to_list(limit)

    resolved: List[dict] = []
    for it in items:
        if it.get("item_type") == "video_mission":
            r = await _fetch_video_item(it["source_id"], user_id)
        elif it.get("item_type") == "chat_session":
            r = await _fetch_chat_item(it["source_id"], user_id)
        else:
            r = None
        if r:
            r["item_id"] = it.get("item_id")
            resolved.append(r)

    if not resolved:
        return [], ""

    lines = ["--- FOLDER-HISTORIE (juengste Items zuerst — referenziere relevante Items kurz im Antwortton) ---"]
    for idx, r in enumerate(resolved, 1):
        date_short = (r.get("date") or "")[:10]
        title = r.get("title") or ""
        if r["type"] == "video_mission":
            score_suffix = f" (Score {r['score']}/100)" if r.get("score") is not None else ""
            lines.append(f"[{idx}] {date_short} · Video-Mission '{title}'{score_suffix}")
            if r.get("wlad"):
                lines.append(f"   Wlads Einschaetzung: {r['wlad']}")
            if r.get("strengths"):
                lines.append(f"   Staerken: {' · '.join(r['strengths'])}")
            if r.get("improvements"):
                lines.append(f"   Verbesserungen: {' · '.join(r['improvements'])}")
        elif r["type"] == "chat_session":
            lines.append(f"[{idx}] {date_short} · Chat '{title}'")
            for t in r.get("turns", []):
                lines.append(f"   {t}")
    lines.append("--- ENDE FOLDER-HISTORIE ---")
    return resolved, "\n".join(lines)


async def generate_briefing_prompt(folder: dict, items: List[dict], lang: str = "de") -> str:
    """Build the LLM prompt for the 30-second briefing."""
    name = folder.get("name") or "Ordner"
    summary = (folder.get("context_summary") or "").strip()

    if lang == "en":
        intro = (
            f"You are WladBot, a senior leadership coach. The user is opening folder '{name}' and "
            "needs a 30-second briefing on where they stand. Style: warm, direct, no fluff, no bullet "
            "soup — flowing sentences a coach would say out loud. Reference the most relevant items, "
            "highlight the single most important next step.\n\n"
        )
    else:
        intro = (
            f"Du bist WladBot, ein Senior Leadership-Coach. Der User oeffnet gerade den Ordner '{name}' und "
            "braucht ein 30-Sekunden-Briefing, wo er steht. Stil: warm, direkt, kein Fluff, keine Bullet-"
            "Suppe — fliessende Saetze wie ein Coach sie laut sagen wuerde. Erwaehne die wichtigsten "
            "Items kurz, hebe den EINEN naechsten Schritt heraus.\n\n"
            "SPRACH-POLICY: Schreibe in einfacher, klarer Sprache. KEINE Anglizismen wie 'Advisory Board', "
            "'Leadership Mastery', 'Impact', 'Mindset', 'Performance', 'Engagement'. Benutze stattdessen "
            "'Beirat', 'Führungskompetenz', 'Wirkung', 'Haltung', 'Leistung', 'Beteiligung'. KEIN 'THE IDEAL "
            "LEADER' / 'Mastering the X Roles' — sprich einfach von 'den wichtigsten Rollen einer Führungskraft'. "
            "Lieber kurze, klare deutsche Saetze als ein langer mit Fremdwoertern.\n\n"
        )

    intro += f"ORDNER-KONTEXT: {summary or '(noch keine Zusammenfassung hinterlegt)'}\n\n"

    if not items:
        intro += "Der Ordner ist noch leer. Begruesse den User kurz und ermutige ihn, die erste Mission oder Chat hier abzulegen."
        return intro

    intro += "RECENT ITEMS (neueste zuerst):\n"
    for idx, r in enumerate(items, 1):
        date_short = (r.get("date") or "")[:10]
        title = r.get("title") or ""
        if r["type"] == "video_mission":
            intro += f"\n[{idx}] {date_short} · Video-Mission '{title}'"
            if r.get("score") is not None:
                intro += f" — Score {r['score']}/100"
            intro += "\n"
            if r.get("wlad"):
                intro += f"   Wlads Notiz: {r['wlad'][:300]}\n"
            if r.get("improvements"):
                intro += f"   Offene Punkte: {' · '.join(r['improvements'])}\n"
        elif r["type"] == "chat_session":
            intro += f"\n[{idx}] {date_short} · Chat '{title}'\n"
            last_user = next((t for t in reversed(r.get("turns", [])) if t.startswith("User:")), None)
            if last_user:
                intro += f"   Letzte Frage: {last_user[:200]}\n"

    intro += (
        "\n\nJETZT erstelle das Briefing. WICHTIG: max 4 Saetze, deutsch, kein Bullet, kein 'Hier ist dein "
        "Briefing:' Vorwort — starte direkt mit dem Inhalt. Schliesse mit einer konkreten naechsten "
        "Handlungsempfehlung (1 Satz)."
    )
    return intro
