"""Folders — Wingman-style knowledge organization for video missions + chats.

Vision (Mert Iter 92.23.7):
    "create folders. which also gives context and the knowledge is always
    used something like wingman.com but for leaders, like openclaw so the
    agent who is then always next to you."

Concept:
    - A user creates folders ("Boardroom Pitches", "Team-Meetings 2026", …).
    - Each folder holds references to items (video missions, chat sessions,
      notes) that share a context.
    - Each folder has a `context_summary` — a short prompt-injected snippet
      that travels with every interaction inside the folder so the LLM
      remembers the goal/stakeholders/constraints without the user repeating
      themselves.

Data model:
    db.folders                {folder_id, user_id, name, color, icon,
                               context_summary, created_at, updated_at}
    db.folder_items           {item_id, folder_id, user_id, item_type,
                               source_id, title, created_at}
        item_type ∈ {video_mission, chat_session, note}

Public endpoints (all owner-only):
    GET    /api/folders                       — list mine
    POST   /api/folders                       — create
    PATCH  /api/folders/{folder_id}           — rename, recolor, update context
    DELETE /api/folders/{folder_id}           — remove + un-link items
    POST   /api/folders/{folder_id}/items     — link an item
    DELETE /api/folders/{folder_id}/items/{item_id} — unlink
    GET    /api/folders/{folder_id}/items     — list contents
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from config import db
from services import get_current_user
from services_folder_knowledge import build_folder_timeline, generate_briefing_prompt
from emergentintegrations.llm.chat import LlmChat, UserMessage

router = APIRouter(prefix="/api/folders", tags=["folders"])


# ── Schemas ────────────────────────────────────────────────────────────────
class FolderIn(BaseModel):
    name: str
    color: Optional[str] = "#BFFF00"
    icon: Optional[str] = "folder"
    context_summary: Optional[str] = ""


class FolderUpdateIn(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    context_summary: Optional[str] = None


class FolderItemIn(BaseModel):
    item_type: Literal["video_mission", "chat_session", "note"]
    source_id: str
    title: Optional[str] = ""


# ── Helpers ────────────────────────────────────────────────────────────────
async def _own_folder(folder_id: str, user_id: str) -> dict:
    folder = await db.folders.find_one({"folder_id": folder_id, "user_id": user_id}, {"_id": 0})
    if not folder:
        raise HTTPException(status_code=404, detail="Ordner nicht gefunden")
    return folder


# ── Routes ─────────────────────────────────────────────────────────────────
@router.get("")
async def list_folders(request: Request):
    """List my folders newest-first with item counts injected."""
    user = await get_current_user(request)
    folders = await db.folders.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("updated_at", -1).to_list(200)

    if folders:
        folder_ids = [f["folder_id"] for f in folders]
        pipeline = [
            {"$match": {"folder_id": {"$in": folder_ids}}},
            {"$group": {"_id": "$folder_id", "count": {"$sum": 1}}},
        ]
        counts = {doc["_id"]: doc["count"] async for doc in db.folder_items.aggregate(pipeline)}
        for f in folders:
            f["item_count"] = counts.get(f["folder_id"], 0)
    return folders


@router.post("")
async def create_folder(payload: FolderIn, request: Request):
    user = await get_current_user(request)
    name = (payload.name or "").strip()[:120]
    if not name:
        raise HTTPException(status_code=400, detail="Name darf nicht leer sein")
    now = datetime.now(timezone.utc).isoformat()
    folder = {
        "folder_id": f"fld_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "name": name,
        "color": (payload.color or "#BFFF00")[:12],
        "icon": (payload.icon or "folder")[:40],
        "context_summary": (payload.context_summary or "").strip()[:2000],
        "created_at": now,
        "updated_at": now,
    }
    await db.folders.insert_one(dict(folder))
    folder["item_count"] = 0
    return folder


@router.patch("/{folder_id}")
async def update_folder(folder_id: str, payload: FolderUpdateIn, request: Request):
    user = await get_current_user(request)
    await _own_folder(folder_id, user["user_id"])
    updates: dict = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if payload.name is not None:
        name = payload.name.strip()[:120]
        if not name:
            raise HTTPException(status_code=400, detail="Name darf nicht leer sein")
        updates["name"] = name
    if payload.color is not None:
        updates["color"] = payload.color[:12]
    if payload.icon is not None:
        updates["icon"] = payload.icon[:40]
    if payload.context_summary is not None:
        updates["context_summary"] = payload.context_summary.strip()[:2000]
    await db.folders.update_one({"folder_id": folder_id, "user_id": user["user_id"]}, {"$set": updates})
    return await _own_folder(folder_id, user["user_id"])


@router.delete("/{folder_id}")
async def delete_folder(folder_id: str, request: Request):
    user = await get_current_user(request)
    await _own_folder(folder_id, user["user_id"])
    await db.folders.delete_one({"folder_id": folder_id, "user_id": user["user_id"]})
    # Best-effort: unlink items (we don't delete the underlying video/chat).
    await db.folder_items.delete_many({"folder_id": folder_id, "user_id": user["user_id"]})
    # Iter 92.23.9 P2: also tear down any active public share so the slug
    # doesn't return 404 with a dangling folder_shares row in the DB.
    await db.folder_shares.delete_many({"folder_id": folder_id, "user_id": user["user_id"]})
    # Also clear folder_id off video_challenges entries pointing here.
    await db.video_challenges.update_many(
        {"folder_id": folder_id, "user_id": user["user_id"]},
        {"$unset": {"folder_id": ""}},
    )
    return {"deleted": True}


@router.get("/{folder_id}/items")
async def list_items(folder_id: str, request: Request):
    user = await get_current_user(request)
    await _own_folder(folder_id, user["user_id"])
    items = await db.folder_items.find(
        {"folder_id": folder_id, "user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    return items


@router.post("/{folder_id}/items")
async def add_item(folder_id: str, payload: FolderItemIn, request: Request):
    user = await get_current_user(request)
    await _own_folder(folder_id, user["user_id"])

    # Dedupe: if the same source_id is already in this folder, return existing.
    existing = await db.folder_items.find_one(
        {"folder_id": folder_id, "user_id": user["user_id"], "source_id": payload.source_id},
        {"_id": 0},
    )
    if existing:
        return existing

    item = {
        "item_id": f"fi_{uuid.uuid4().hex[:12]}",
        "folder_id": folder_id,
        "user_id": user["user_id"],
        "item_type": payload.item_type,
        "source_id": payload.source_id,
        "title": (payload.title or "").strip()[:200],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.folder_items.insert_one(dict(item))

    # Convenience: also stamp the folder_id directly on the underlying video
    # challenge entry so studio sidebar can filter by folder without a join.
    if payload.item_type == "video_mission":
        await db.video_challenges.update_one(
            {"entry_id": payload.source_id, "user_id": user["user_id"]},
            {"$set": {"folder_id": folder_id}},
        )

    # Bump folder updated_at so the sidebar shows the most-recently-active first.
    await db.folders.update_one(
        {"folder_id": folder_id, "user_id": user["user_id"]},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return item


@router.delete("/{folder_id}/items/{item_id}")
async def remove_item(folder_id: str, item_id: str, request: Request):
    user = await get_current_user(request)
    await _own_folder(folder_id, user["user_id"])
    item = await db.folder_items.find_one(
        {"item_id": item_id, "folder_id": folder_id, "user_id": user["user_id"]},
        {"_id": 0},
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item nicht im Ordner")
    await db.folder_items.delete_one({"item_id": item_id})
    if item.get("item_type") == "video_mission":
        await db.video_challenges.update_one(
            {"entry_id": item.get("source_id"), "user_id": user["user_id"]},
            {"$unset": {"folder_id": ""}},
        )
    return {"removed": True}


# ── Briefing (Iter 92.23.9 P1) ─────────────────────────────────────────────
def _deterministic_briefing_fallback(folder: dict, items: list) -> str:
    """Last-resort briefing if every LLM call fails. Deterministic, no PII leak,
    still warm-and-direct in tone. Used only when both gpt-4o-mini and gpt-4o
    error out — keeps the UX from showing a hard error."""
    name = folder.get("name") or "diesem Ordner"
    if not items:
        return (
            f"Du oeffnest gerade '{name}' — der Workspace ist noch leer. Leg deine erste Video-Mission "
            "oder einen Chat ab, damit ich beim naechsten Mal eine echte Lagebeurteilung geben kann. "
            "Konkret: starte eine 2-minuetige Mission zum Thema, das dich am meisten beschaeftigt."
        )
    latest = items[0]
    rest = len(items) - 1
    bits = [f"In '{name}' liegen aktuell {len(items)} Eintrag" + ("e" if len(items) != 1 else "") + "."]
    if latest.get("type") == "video_mission":
        score = latest.get("score")
        bits.append(
            f"Dein juengster Versuch war '{latest.get('title')}'" +
            (f" mit Score {score}/100." if score is not None else ".")
        )
        if latest.get("improvements"):
            bits.append(f"Offener Punkt: {latest['improvements'][0]}.")
    elif latest.get("type") == "chat_session":
        bits.append(f"Dein letzter Chat war '{latest.get('title')}'.")
    if rest > 0:
        bits.append(f"Davor noch {rest} weitere Eintrag" + ("e" if rest != 1 else "") + " im Verlauf.")
    bits.append("Naechster Schritt: wiederhole die juengste Mission und beobachte, wo dein Score steigt.")
    return " ".join(bits)


@router.post("/{folder_id}/briefing")
async def folder_briefing(folder_id: str, request: Request):
    """Generate a 30-second 'where you stand' briefing from the folder's items.

    Mert: "Klick erstellt 30-Sekunden-Briefing aus den letzten 5 Missionen+
    Chats des Folders". Returns a single flowing summary the user can read
    or listen to via the WladBot drawer.

    Resilience (Iter 92.23.9 code-review): tries gpt-4o-mini first, falls
    back to gpt-4o, and finally to a deterministic locally-generated briefing
    so the user never gets a 502.
    """
    user = await get_current_user(request)
    folder = await _own_folder(folder_id, user["user_id"])

    items, _timeline = await build_folder_timeline(folder_id, user["user_id"], limit=5)
    prompt = await generate_briefing_prompt(folder, items, lang="de")

    api_key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        # No LLM key at all — use deterministic fallback so the feature still works.
        return {
            "folder_id": folder_id,
            "folder_name": folder.get("name"),
            "briefing": _deterministic_briefing_fallback(folder, items),
            "items_used": len(items),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source": "fallback_no_key",
        }

    response_text = None
    used_model = None
    for model in ("gpt-4o-mini", "gpt-4o"):
        session_id = f"briefing_{uuid.uuid4().hex[:10]}"
        chat = LlmChat(
            api_key=api_key, session_id=session_id,
            system_message="Du bist WladBot, Senior Leadership-Coach. Antworte praezise und warm.",
        ).with_model("openai", model)
        try:
            response_text = await chat.send_message(UserMessage(text=prompt))
            used_model = model
            if response_text and response_text.strip():
                break
        except Exception as e:  # noqa: BLE001
            import logging
            logging.getLogger("wladbot").warning("briefing %s failed: %s", model, e)
            response_text = None
            continue

    if not response_text or not response_text.strip():
        # Both models failed — graceful degradation.
        return {
            "folder_id": folder_id,
            "folder_name": folder.get("name"),
            "briefing": _deterministic_briefing_fallback(folder, items),
            "items_used": len(items),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source": "fallback_llm_unavailable",
        }

    return {
        "folder_id": folder_id,
        "folder_name": folder.get("name"),
        "briefing": response_text.strip(),
        "items_used": len(items),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": used_model,
    }


# ── Sharing (Iter 92.23.9 P2) ──────────────────────────────────────────────
def _gen_slug() -> str:
    return uuid.uuid4().hex[:10]


@router.post("/{folder_id}/share")
async def share_folder(folder_id: str, request: Request):
    """Create (or reuse) a public read-only share-slug for the folder.

    Returns {share_url, slug, expires_at: null}. The slug is stable per
    folder — calling share twice yields the same URL.
    """
    user = await get_current_user(request)
    folder = await _own_folder(folder_id, user["user_id"])

    existing = await db.folder_shares.find_one(
        {"folder_id": folder_id, "user_id": user["user_id"]},
        {"_id": 0},
    )
    if existing:
        return {
            "slug": existing["slug"],
            "share_url": f"/f/{existing['slug']}",
            "folder_name": folder.get("name"),
            "created_at": existing.get("created_at"),
        }

    slug = _gen_slug()
    # Extra dedupe: ensure slug is unique (collision is ~0 but defensive).
    while await db.folder_shares.find_one({"slug": slug}):
        slug = _gen_slug()

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "share_id": f"fsh_{uuid.uuid4().hex[:10]}",
        "slug": slug,
        "folder_id": folder_id,
        "user_id": user["user_id"],
        "created_at": now,
        "views": 0,
    }
    await db.folder_shares.insert_one(dict(doc))
    return {
        "slug": slug,
        "share_url": f"/f/{slug}",
        "folder_name": folder.get("name"),
        "created_at": now,
    }


@router.delete("/{folder_id}/share")
async def unshare_folder(folder_id: str, request: Request):
    user = await get_current_user(request)
    await _own_folder(folder_id, user["user_id"])
    r = await db.folder_shares.delete_many(
        {"folder_id": folder_id, "user_id": user["user_id"]},
    )
    return {"deleted": r.deleted_count}


# Public — no auth. Mounted under /api/folders/share to keep CORS/path config simple.
@router.get("/share/{slug}")
async def get_shared_folder(slug: str):
    """Public read-only view of a shared folder.

    Returns: folder name + context_summary + items (titles + scores + dates)
    WITHOUT user PII and WITHOUT full transcripts/AI text. The point is to
    convey progress, not to expose private analyses.
    """
    share = await db.folder_shares.find_one({"slug": slug}, {"_id": 0})
    if not share:
        raise HTTPException(status_code=404, detail="Geteilter Ordner nicht gefunden")
    folder = await db.folders.find_one(
        {"folder_id": share["folder_id"]},
        {"_id": 0, "folder_id": 1, "name": 1, "color": 1, "icon": 1, "context_summary": 1, "created_at": 1},
    )
    if not folder:
        raise HTTPException(status_code=404, detail="Ordner wurde geloescht")

    # Owner-author meta — name only (no email/avatar).
    owner = await db.users.find_one(
        {"user_id": share["user_id"]},
        {"_id": 0, "name": 1, "picture": 1, "level": 1, "tier": 1},
    ) or {}

    items_raw = await db.folder_items.find(
        {"folder_id": share["folder_id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(20)

    items_safe = []
    for it in items_raw:
        if it["item_type"] == "video_mission":
            v = await db.video_challenges.find_one(
                {"entry_id": it["source_id"]},
                {"_id": 0, "custom_title": 1, "challenge_id": 1, "analysis.overall_score": 1, "created_at": 1},
            )
            if not v:
                continue
            items_safe.append({
                "item_type": "video_mission",
                "title": v.get("custom_title") or it.get("title") or "Video-Mission",
                "score": (v.get("analysis") or {}).get("overall_score"),
                "created_at": v.get("created_at"),
            })
        elif it["item_type"] == "chat_session":
            c = await db.chat_sessions.find_one(
                {"session_id": it["source_id"]},
                {"_id": 0, "title": 1, "created_at": 1},
            )
            if not c:
                continue
            items_safe.append({
                "item_type": "chat_session",
                "title": c.get("title") or it.get("title") or "Chat",
                "created_at": c.get("created_at"),
            })

    # Atomically increment-and-fetch the view counter so concurrent requests
    # don't see stale values (Iter 92.23.9 code-review fix). Falls back to
    # the pre-increment value if pymongo doesn't expose return_document.
    new_views = None
    try:
        from pymongo import ReturnDocument
        updated = await db.folder_shares.find_one_and_update(
            {"slug": slug},
            {"$inc": {"views": 1}},
            return_document=ReturnDocument.AFTER,
        )
        new_views = (updated or {}).get("views")
    except Exception:  # noqa: BLE001
        # Best-effort fallback: still bump the counter, just report the
        # client-side estimate as before.
        try:
            await db.folder_shares.update_one({"slug": slug}, {"$inc": {"views": 1}})
            new_views = (share.get("views") or 0) + 1
        except Exception:  # noqa: BLE001
            new_views = share.get("views", 0)

    return {
        "folder": {
            "name": folder.get("name"),
            "color": folder.get("color"),
            "context_summary": folder.get("context_summary"),
            "created_at": folder.get("created_at"),
        },
        "owner": {
            "name": owner.get("name", "Leader"),
            "picture": owner.get("picture"),
            "level": owner.get("level", ""),
        },
        "items": items_safe,
        "share": {"created_at": share.get("created_at"), "views": new_views},
    }
