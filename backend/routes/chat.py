"""Chat routes with user memory injection."""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
import uuid
import json
import io
import base64
import asyncio
from datetime import datetime, timezone
from typing import Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
import pypdf
import docx

from config import db, EMERGENT_LLM_KEY, logger
from models import ChatMessageIn, ChatSessionCreate
from services import get_current_user, get_user_memory, WLADBOT_SYSTEM_PROMPT, WLADBOT_CHAT_STYLE, WLADBOT_JSON_FORMAT
from services_actions import record_user_action
from services_text_clean import deep_unescape, unescape_text, unwrap_json_string
from data import LEADERSHIP_QUOTES

router = APIRouter(prefix="/api", tags=["chat"])


# Iter 92.34 (Mert Go-Live §A=b): standalone classification endpoint for the
# frontend to call BEFORE sending the message to /chat. Two-call pattern lets
# the UI render the intent-badge ("Erkannt: 🎤 Speech Coaching") with override
# button immediately, then route the actual chat call with the resolved intent.
from services_classifier import classify_intent

from pydantic import BaseModel
from services_ai_errors import ai_http_error


class IntentClassifyIn(BaseModel):
    message: str
    override: Optional[str] = None


@router.post("/chat/classify-intent")
async def classify_intent_endpoint(payload: IntentClassifyIn, request: Request):
    user = await get_current_user(request)
    _ = user  # auth-only; no per-user state needed for classification
    return await classify_intent(payload.message, override=payload.override)



# Max sizes
MAX_PDF_SIZE = 15 * 1024 * 1024   # 15 MB
MAX_DOC_SIZE = 10 * 1024 * 1024   # 10 MB
MAX_TXT_SIZE = 2 * 1024 * 1024    # 2 MB
MAX_IMG_SIZE = 10 * 1024 * 1024   # 10 MB
MAX_EXTRACT_CHARS = 40000


def _extract_pdf_text(data: bytes) -> tuple[str, int, int]:
    reader = pypdf.PdfReader(io.BytesIO(data))
    pages_to_read = min(30, len(reader.pages))
    chunks = []
    for i in range(pages_to_read):
        try:
            chunks.append(reader.pages[i].extract_text() or "")
        except Exception:
            continue
    full_text = "\n\n".join(chunks).strip()
    return full_text, len(reader.pages), pages_to_read


def _extract_docx_text(data: bytes) -> str:
    doc = docx.Document(io.BytesIO(data))
    parts = [p.text for p in doc.paragraphs if p.text.strip()]
    for table in doc.tables:
        for row in table.rows:
            row_txt = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_txt:
                parts.append(row_txt)
    return "\n".join(parts).strip()


def _truncate(text: str) -> str:
    if len(text) > MAX_EXTRACT_CHARS:
        return text[:MAX_EXTRACT_CHARS] + "\n\n[… gekürzt …]"
    return text


def _handle_pdf(filename: str, data: bytes) -> dict:
    if len(data) > MAX_PDF_SIZE:
        raise HTTPException(status_code=413, detail="PDF zu groß (max 15 MB)")
    text, total_pages, pages_read = _extract_pdf_text(data)
    if not text:
        raise HTTPException(status_code=400, detail="PDF enthält keinen extrahierbaren Text")
    text = _truncate(text)
    return {
        "filename": filename, "type": "pdf",
        "pages": total_pages, "pages_read": pages_read,
        "chars": len(text), "text_preview": text[:400], "full_text": text,
    }


def _handle_docx(filename: str, data: bytes) -> dict:
    if len(data) > MAX_DOC_SIZE:
        raise HTTPException(status_code=413, detail="DOCX zu groß (max 10 MB)")
    text = _extract_docx_text(data)
    if not text:
        raise HTTPException(status_code=400, detail="DOCX enthält keinen Text")
    text = _truncate(text)
    return {
        "filename": filename, "type": "docx",
        "chars": len(text), "text_preview": text[:400], "full_text": text,
    }


def _handle_plaintext(filename: str, ext: str, data: bytes) -> dict:
    if len(data) > MAX_TXT_SIZE:
        raise HTTPException(status_code=413, detail="Textdatei zu groß (max 2 MB)")
    try:
        text = data.decode("utf-8", errors="ignore")
    except Exception:
        raise HTTPException(status_code=400, detail="Datei ist nicht UTF-8 lesbar")
    if not text.strip():
        raise HTTPException(status_code=400, detail="Datei ist leer")
    text = _truncate(text)
    return {
        "filename": filename, "type": ext,
        "chars": len(text), "text_preview": text[:400], "full_text": text,
    }


def _handle_image(filename: str, ext: str, data: bytes) -> dict:
    if len(data) > MAX_IMG_SIZE:
        raise HTTPException(status_code=413, detail="Bild zu groß (max 10 MB)")
    img_b64 = base64.b64encode(data).decode()
    mime = f"image/{'jpeg' if ext == 'jpg' else ext}"
    return {
        "filename": filename, "type": "image",
        "mime": mime, "bytes": len(data),
        "image_b64": img_b64, "data_url": f"data:{mime};base64,{img_b64}",
    }


# Extension → handler dispatcher (keeps the main endpoint a thin router).
_DOC_HANDLERS = {
    "pdf":  lambda fn, ext, data: _handle_pdf(fn, data),
    "docx": lambda fn, ext, data: _handle_docx(fn, data),
    "txt":  _handle_plaintext, "md": _handle_plaintext, "csv": _handle_plaintext,
    "png":  _handle_image, "jpg": _handle_image, "jpeg": _handle_image,
    "webp": _handle_image, "gif": _handle_image,
}


@router.post("/chat/upload-document")
async def chat_upload_document(request: Request, file: UploadFile = File(...)):
    """Universal document upload — accepts PDF, DOCX, TXT, MD, PNG, JPG.
    Returns {filename, type, chars/pages, full_text OR image_b64 for vision}."""
    await get_current_user(request)
    name = (file.filename or "upload").lower()
    ext = name.rsplit(".", 1)[-1] if "." in name else ""

    try:
        data = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Datei konnte nicht gelesen werden: {e}")

    handler = _DOC_HANDLERS.get(ext)
    if not handler:
        raise HTTPException(status_code=400, detail=f"Format .{ext} nicht unterstützt. Erlaubt: PDF, DOCX, TXT, MD, PNG, JPG")

    try:
        return handler(file.filename, ext, data)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Doc upload failed")
        raise HTTPException(status_code=500, detail=f"Upload fehlgeschlagen: {e}")


@router.post("/chat/upload-pdf")
async def chat_upload_pdf(request: Request, file: UploadFile = File(...)):
    """Legacy PDF-only endpoint — proxies to universal /chat/upload-document."""
    return await chat_upload_document(request, file)


@router.post("/chat/sessions")
async def create_chat_session(data: ChatSessionCreate, request: Request):
    user = await get_current_user(request)
    session_id = f"chat_{uuid.uuid4().hex[:12]}"
    doc = {
        "session_id": session_id, "user_id": user["user_id"],
        "title": data.title, "agent": data.agent,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if data.folder_id:
        # Owner-guard: only stamp folder_id if the user actually owns that folder.
        own = await db.folders.find_one(
            {"folder_id": data.folder_id, "user_id": user["user_id"]},
            {"_id": 0, "folder_id": 1},
        )
        if own:
            doc["folder_id"] = data.folder_id
            # Auto-link the new chat session into the folder so it shows up
            # in the folder's item list — mirrors the video-mission behavior.
            await db.folder_items.insert_one({
                "item_id": f"fi_{uuid.uuid4().hex[:12]}",
                "folder_id": data.folder_id,
                "user_id": user["user_id"],
                "item_type": "chat_session",
                "source_id": session_id,
                "title": (data.title or "")[:200],
                "created_at": doc["created_at"],
            })
    await db.chat_sessions.insert_one(doc)
    return {"session_id": session_id, "title": data.title, "agent": data.agent, "folder_id": doc.get("folder_id"), "created_at": doc["created_at"]}


@router.get("/chat/sessions")
async def list_chat_sessions(request: Request, folder_id: Optional[str] = None):
    """List my chat sessions, optionally filtered by folder.

    Iter 92.23.8: when ?folder_id= is set we only return sessions tagged with
    that folder — used by the folder-scoped chat sidebar in the new UX.
    """
    user = await get_current_user(request)
    query: dict = {"user_id": user["user_id"]}
    if folder_id:
        query["folder_id"] = folder_id
    return await db.chat_sessions.find(
        query,
        {"_id": 0, "session_id": 1, "title": 1, "agent": 1, "folder_id": 1, "created_at": 1, "updated_at": 1, "message_count": 1},
    ).sort("updated_at", -1).to_list(50)


@router.delete("/chat/sessions/{session_id}")
async def delete_chat_session(session_id: str, request: Request):
    """Delete a chat session + all its messages (owner-guarded)."""
    user = await get_current_user(request)
    res = await db.chat_sessions.delete_one({"session_id": session_id, "user_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session nicht gefunden.")
    await db.chat_messages.delete_many({"session_id": session_id, "user_id": user["user_id"]})
    await db.folder_items.delete_many({"source_id": session_id, "user_id": user["user_id"], "item_type": "chat_session"})
    return {"deleted": True}


ROLE_MAP = {
    "Kommunikator": "Du agierst als KOMMUNIKATOR-Rolle. Fokus: Charismatisch auftreten und überzeugen. Nutze die 3 Säulen der Überzeugung (Logos, Ethos, Pathos), den Kommunikationsquadrant und die Feedbackformel.",
    "Manager": "Du agierst als MANAGER-Rolle. Fokus: Effektiver und effizienter arbeiten. Nutze die Entscheidungsmatrix, Delegations-Framework und Priorisierung nach Impact.",
    "Team-Leader": "Du agierst als TEAM-LEADER-Rolle. Fokus: Nachhaltig motivieren und besser delegieren. Nutze Delegation als Befähigung, aktives Zuhören und Motivation-Frameworks.",
    "Psychologe": "Du agierst als PSYCHOLOGE-Rolle. Fokus: Jedem Mitarbeiter individuell und empathisch begegnen. Nutze aktives Zuhören (5 Ebenen), Emotionsregulation und empathische Gesprächsführung.",
    "Problemlöser": "Du agierst als PROBLEMLÖSER-Rolle. Fokus: Konflikte managen und Veränderungen durchsetzen. Nutze die 4 Gesprächstypen, Schwarze Rhetorik Defense und Mediationstechniken.",
}


def _build_system_message(agent: str, user_memory: str, folder_context: str = "", structured: bool = False) -> str:
    """Build AI system message with agent role, user memory, and folder context.

    Iter 96 (Mert): default is a natural conversational style (ChatGPT/Grok
    feel). The structured JSON coach format is opt-in — active only when the
    user picks an agent or enables Coach-Modus.
    """
    agent_context = ""
    if agent and agent != "auto":
        agent_context = f"\n{ROLE_MAP.get(agent, f'Der User hat die Rolle {agent} gewählt. Fokussiere deine Antwort auf die Spezialität dieser Rolle.')}"
    memory_context = f"\n\n--- USER MEMORY (nutze dies fuer personalisierte Antworten) ---\n{user_memory}\n---" if user_memory else ""
    folder_block = ""
    if folder_context:
        folder_block = (
            "\n\n--- AKTIVER ORDNER-KONTEXT (der User arbeitet gerade in diesem Themenbereich — "
            "alle Antworten sollen diesen Kontext beruecksichtigen) ---\n"
            f"{folder_context}\n---"
        )
    style_block = WLADBOT_JSON_FORMAT if structured else WLADBOT_CHAT_STYLE
    return WLADBOT_SYSTEM_PROMPT + style_block + agent_context + memory_context + folder_block


async def _resolve_folder_context(folder_id: Optional[str], user_id: str) -> tuple[str, Optional[dict]]:
    """Return (context_summary_text, folder_doc) — owner-guarded.

    Iter 92.23.9 (Mert P1 Folder-Knowledge-RAG): now also appends a
    deterministic timeline of the folder's most-recent items so the agent
    "kennt die Geschichte deines Themas" without needing a vector store.
    """
    if not folder_id:
        return "", None
    folder = await db.folders.find_one({"folder_id": folder_id, "user_id": user_id}, {"_id": 0})
    if not folder:
        return "", None
    summary = (folder.get("context_summary") or "").strip()
    name = folder.get("name") or ""
    pretty_parts = [f"Ordner: {name}"]
    if summary:
        pretty_parts.append(f"Zusammenfassung: {summary}")

    # P1 Folder-Knowledge-RAG: append item timeline.
    try:
        from services_folder_knowledge import build_folder_timeline
        _items, timeline_text = await build_folder_timeline(folder_id, user_id)
        if timeline_text:
            pretty_parts.append(timeline_text)
    except Exception as e:  # noqa: BLE001
        # Knowledge enrichment is best-effort — never block the chat on it.
        import logging
        logging.getLogger("wladbot").warning("folder_timeline failed: %s", e)

    return "\n\n".join(pretty_parts), folder


async def _ensure_session(session_id: str, user_id: str, message: str, agent: str, folder_id: Optional[str] = None) -> str:
    """Create chat session if needed, return session_id.

    Iter 135 (Security): a client-supplied session_id MUST belong to the caller.
    Without this check another user's session_id would load their history into
    the prompt and leak their conversation back in the answer.
    """
    if session_id:
        owned = await db.chat_sessions.find_one(
            {"session_id": session_id, "user_id": user_id}, {"_id": 1}
        )
        if not owned:
            raise HTTPException(status_code=404, detail="Session nicht gefunden")
        return session_id
    new_id = f"chat_{uuid.uuid4().hex[:12]}"
    from services_speech_text import fix_brand_names
    doc = {
        "session_id": new_id, "user_id": user_id,
        "title": fix_brand_names(unescape_text(message)[:50]), "agent": agent,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if folder_id:
        doc["folder_id"] = folder_id
    await db.chat_sessions.insert_one(doc)
    return new_id


async def _save_ai_tasks(tasks: list, user_id: str, session_id: str):
    for task in tasks:
        await db.tasks.insert_one({
            "task_id": f"task_{uuid.uuid4().hex[:12]}", "user_id": user_id,
            "title": task.get("title", ""), "description": task.get("description", ""),
            "priority": task.get("priority", "medium"), "status": "pending",
            "source": "ai_coach", "session_id": session_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


class TasksAcceptIn(BaseModel):
    tasks: list
    session_id: str = ""


@router.post("/chat/tasks/accept")
async def accept_suggested_tasks(data: TasksAcceptIn, request: Request):
    """Iter 92.58: tasks suggested by WladBot are created only on user click."""
    user = await get_current_user(request)
    clean = [deep_unescape(t) for t in (data.tasks or []) if isinstance(t, dict) and t.get("title")][:5]
    if not clean:
        raise HTTPException(status_code=400, detail="no_tasks")
    await _save_ai_tasks(clean, user["user_id"], data.session_id or "")
    return {"created": len(clean)}


async def _prepare_chat(data: ChatMessageIn, request: Request) -> dict:
    """Gemeinsamer Vorlauf für /chat und /chat/stream: Credits, Session, Kontext, System-Prompt, Modellwahl."""
    from routes.credits import check_and_deduct_credit, no_credits_detail
    user = await get_current_user(request)

    credit_result = await check_and_deduct_credit(user, "chat")
    if not credit_result["allowed"]:
        raise HTTPException(status_code=402, detail=no_credits_detail("chat", credit_result))

    session_id = await _ensure_session(data.session_id, user["user_id"], data.display_text or data.message, data.agent, data.folder_id)

    # Iter 92.42 (Vibe-Security): normalize modality early so persistence + response agree.
    VALID_MODALITIES = ("text", "speech", "video")
    msg_modality = (data.modality or "text").lower()
    if msg_modality not in VALID_MODALITIES:
        msg_modality = "text"

    # Iter 92.53 (Speed): fetch history BEFORE inserting the new user message
    # and run history | memory | folder-context | RAG in PARALLEL (saves 1-3s).
    from services_rag import retrieve_context
    history, user_memory, folder_res, rag_ctx = await asyncio.gather(
        db.chat_messages.find({"session_id": session_id, "user_id": user["user_id"]}, {"_id": 0}).sort("created_at", 1).to_list(20),
        get_user_memory(user["user_id"]),
        _resolve_folder_context(data.folder_id, user["user_id"]),
        retrieve_context(data.message),
    )
    folder_context, _folder_doc = folder_res

    # Iter 141 (Code Review): attachment ist Client-Input — nur die zwei Felder
    # übernehmen, die die UI braucht, damit kein beliebiges Dict in Mongo landet.
    attachment = None
    if isinstance(data.attachment, dict):
        filename = str(data.attachment.get("filename") or "")[:200]
        if filename:
            pages = data.attachment.get("pages")
            attachment = {"filename": filename, "pages": pages if isinstance(pages, int) else None}

    # 1.1: persist the user message as "pending" BEFORE the LLM call and only
    # finalize it on success (or delete it on failure) — so a retry after a
    # failed/stalled call never duplicates the user's message.
    user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    await db.chat_messages.insert_one({
        "message_id": user_msg_id, "session_id": session_id,
        "user_id": user["user_id"], "role": "user", "content": data.message,
        "display_text": (data.display_text or "")[:4000] or None,
        "attachment": attachment,
        "modality": msg_modality,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Iter 96 (Mert): normal conversational chat is the DEFAULT. Structured
    # coach output only when the user picked an agent or Coach-Modus.
    structured = (data.mode == "coach") or bool(data.agent and data.agent != "auto")
    system_msg = _build_system_message(data.agent, user_memory, folder_context, structured)
    # Iter 183: Verbindliche Definitionen (SEXIER & Co.) — dieselbe Quelle wie im Sprach-Modus.
    try:
        from wlad_canon import canon_block
        system_msg += canon_block(data.message)
    except Exception as e:
        logger.warning("Canon block skipped: %s", e)
    if rag_ctx["context_block"]:
        system_msg = system_msg + rag_ctx["context_block"]
        # Premium-first (Iter 135): paid users get explicit source attribution.
        from routes.features import is_feature_enabled
        if await is_feature_enabled("rag_source_labels", user):
            system_msg += (
                "\nQUELLENANGABE (Pflicht bei Wissensfragen): Wenn deine Antwort auf "
                "den obigen Quellen beruht, schließe mit einer eigenen letzten Zeile ab: "
                "\"Quelle: <Titel>\" — der Titel steht im jeweiligen [Quelle …]-Header. "
                "Mehrere Titel mit Komma trennen. Nie erfundene Titel, nie Seitenzahlen.\n"
            )

    # Iter 92.48 (Mert · GODMODE): Hybrid model routing.
    # - Short questions (<180 chars, no code blocks, no PDF attachment) →
    #   gpt-4o-mini: ~3-5x faster (2-4s vs 12-18s), plenty smart when
    #   grounded in Wlad's RAG context.
    # - Long/deep coaching messages → gpt-5.2: full reasoning power for
    #   nuanced advice, playbook building, strategic breakdowns.
    msg_len = len(data.message or "")
    has_attachment = "[Dokument:" in (data.message or "") or "[Bild angehängt:" in (data.message or "")
    use_deep_model = msg_len > 180 or has_attachment or msg_modality != "text"
    model_name = "gpt-5.2" if use_deep_model else "gpt-4o-mini"
    context = "".join(f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}\n" for m in history[-10:])

    return {
        "user": user, "credit_result": credit_result, "session_id": session_id, "modality": msg_modality,
        "structured": structured, "system_msg": system_msg, "model_name": model_name,
        "prompt": f"{context}\nUser: {data.message}", "rag_ctx": rag_ctx, "folder_context": folder_context,
        "agent": data.agent, "user_msg_id": user_msg_id,
    }


def _parse_chat_reply(ai_response: str, structured: bool, agent: Optional[str]) -> dict:
    if structured:
        try:
            from services_ai_parse import parse_ai_json
            parsed = parse_ai_json(ai_response)
        except Exception:
            parsed = None
        return parsed or {"insight": ai_response, "strategy": "", "action_steps": [], "simulation_prompt": None,
                          "reflection": "", "tasks": [], "follow_up_questions": [], "agent_used": agent or "General"}
    # Iter 184: doppelt verpackte Antwort zuerst auspacken, sonst sieht der
    # Kunde `\n` / `\u201e` als Rohzeichen im Text.
    text_reply = unwrap_json_string((ai_response or "").strip()).strip()
    # Extract follow-up questions marker → clickable chips in the UI.
    followups = []
    if FOLLOWUP_MARKER in text_reply:
        text_reply, _, tail = text_reply.partition(FOLLOWUP_MARKER)
        text_reply = text_reply.strip()
        try:
            followups = [q for q in json.loads(tail.strip()) if isinstance(q, str) and q.strip()][:2]
        except Exception:
            followups = []
    # Defensive: if the model slipped into JSON anyway, unwrap it.
    if text_reply.startswith("{"):
        try:
            from services_ai_parse import parse_ai_json
            maybe = parse_ai_json(text_reply)
            if maybe and maybe.get("insight"):
                text_reply = "\n\n".join(p for p in [maybe.get("insight", ""), maybe.get("strategy", "")] if p)
                followups = followups or (maybe.get("follow_up_questions") or [])[:2]
        except Exception:
            pass
    return {"text": unescape_text(text_reply), "follow_up_questions": followups}


FOLLOWUP_MARKER = "###WEITER###"


async def _finalize_chat(prep: dict, ai_response: str) -> dict:
    """Antwort parsen, persistieren, Session/Action aktualisieren — identisch für Stream und Nicht-Stream."""
    from services_speech_text import fix_brand_names
    ai_response = fix_brand_names(ai_response)
    user, session_id = prep["user"], prep["session_id"]
    # Iter 184: an EINER Stelle entpacken — Chat, Verlauf, Aufgaben und
    # PDF-Export lesen danach denselben, bereinigten Text.
    parsed = deep_unescape(_parse_chat_reply(ai_response, prep["structured"], prep["agent"]))
    msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    await db.chat_messages.insert_one({
        "message_id": msg_id, "session_id": session_id, "user_id": user["user_id"],
        "role": "assistant", "content": json.dumps(parsed), "parsed": parsed,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    # Iter 92.58 (Mert): tasks are SUGGESTIONS now — persisted only after
    # the user clicks "übernehmen" (POST /chat/tasks/accept). No auto-save.
    # 1.1: finalize the pending user message now that we have a real answer.
    if prep.get("user_msg_id"):
        await db.chat_messages.update_one(
            {"message_id": prep["user_msg_id"]}, {"$set": {"status": "sent"}})
    await db.chat_sessions.update_one({"session_id": session_id}, {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    await record_user_action(user["user_id"], "chat_message", metadata={"session_id": session_id, "agent": prep["agent"]})
    return {
        "session_id": session_id,
        "message_id": msg_id,
        "response": parsed,
        "raw": unescape_text(ai_response),
        "rag": {"active": prep["rag_ctx"]["rag_active"], "chunks": prep["rag_ctx"]["chunks_count"]},
        "folder_context_used": bool(prep["folder_context"]),
        "modality": prep["modality"],
    }


async def _refund_after_failure(prep: dict) -> None:
    # 1.1: drop the pending user message so a retry doesn't duplicate it.
    uid = prep.get("user_msg_id")
    if uid:
        try:
            await db.chat_messages.delete_one({"message_id": uid, "status": "pending"})
        except Exception as del_err:
            logger.warning(f"Pending user message cleanup failed: {del_err}")
    # Refund the credit — the user paid but got no answer.
    if not prep["credit_result"].get("is_premium"):
        try:
            from routes.credits import refund_credit
            await refund_credit(prep["user"]["user_id"])
        except Exception as refund_err:
            logger.warning(f"Credit refund failed: {refund_err}")


@router.post("/chat")
async def send_chat_message(data: ChatMessageIn, request: Request):
    prep = await _prepare_chat(data, request)
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"wladbot_{prep['session_id']}", system_message=prep["system_msg"])
        chat.with_model("openai", prep["model_name"])
        ai_response = await asyncio.wait_for(chat.send_message(UserMessage(text=prep["prompt"])), timeout=120)
        return await _finalize_chat(prep, ai_response)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        await _refund_after_failure(prep)
        raise await ai_http_error(e, "chat")


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


def _safe_visible_len(text: str) -> int:
    """Zeichen, die sicher gestreamt werden können: alles vor dem Follow-up-Marker,
    ohne ein angefangenes Marker-Präfix am Ende preiszugeben."""
    cut = text.find(FOLLOWUP_MARKER)
    if cut >= 0:
        return cut
    for k in range(min(len(FOLLOWUP_MARKER) - 1, len(text)), 0, -1):
        if text.endswith(FOLLOWUP_MARKER[:k]):
            return len(text) - k
    return len(text)


@router.post("/chat/stream")
async def send_chat_message_stream(data: ChatMessageIn, request: Request):
    """Wie /chat, aber Wlads Antwort kommt als Server-Sent-Events Wort für Wort.
    Events: start → delta* → done | error. Coach-/Agent-Modus (JSON) wird am Ende als ein Block geliefert."""
    from fastapi.responses import StreamingResponse
    from services_llm_async import stream_completion

    prep = await _prepare_chat(data, request)

    async def gen():
        yield _sse({"type": "start", "session_id": prep["session_id"], "model": prep["model_name"], "structured": prep["structured"]})
        full, sent = "", 0
        try:
            messages = [{"role": "system", "content": prep["system_msg"]}, {"role": "user", "content": prep["prompt"]}]
            async for delta in stream_completion("openai", prep["model_name"], messages, timeout=120):
                full += delta
                if prep["structured"]:
                    continue
                visible = _safe_visible_len(full)
                if visible > sent:
                    yield _sse({"type": "delta", "text": full[sent:visible]})
                    sent = visible
            result = await _finalize_chat(prep, full)
            yield _sse({"type": "done", **result})
        except Exception as e:
            logger.error(f"Chat stream error: {e}")
            await _refund_after_failure(prep)
            try:
                http_err = await ai_http_error(e, "chat")
                detail, status = http_err.detail, http_err.status_code
            except Exception:
                detail, status = "Ein Fehler ist aufgetreten. Bitte versuche es erneut.", 500
            yield _sse({"type": "error", "status": status, "detail": detail})

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", "Connection": "keep-alive"})


@router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str, request: Request):
    user = await get_current_user(request)
    return await db.chat_messages.find({"session_id": session_id, "user_id": user["user_id"]}, {"_id": 0}).sort("created_at", 1).to_list(100)


@router.get("/quote")
async def get_daily_quote():
    import secrets
    return secrets.choice(LEADERSHIP_QUOTES)
