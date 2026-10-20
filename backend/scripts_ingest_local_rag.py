"""Ingest Wlad's unchunked course material into the local Mongo vector store.

Embeddings: LOCAL multilingual MiniLM (384-dim) via fastembed — no API keys,
no rate limits, no external embedding provider.

Usage: python3 scripts_ingest_local_rag.py /tmp/unchunked/unchunked
Idempotent: re-running replaces chunks per source_file. If the store still
holds vectors with a different dimension (older model), it is wiped first.
"""
import asyncio
import hashlib
import os
import re
import sys
import time

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402

CHUNK_SIZE = 1100
OVERLAP = 150
BATCH = 128

DATE_RE = re.compile(r"^\d{4}\.\d{2}\.\d{2}")


def chunk_text(text: str) -> list[str]:
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks, cur = [], ""
    for p in paras:
        if len(cur) + len(p) + 2 <= CHUNK_SIZE:
            cur = f"{cur}\n\n{p}" if cur else p
        else:
            if cur:
                chunks.append(cur)
            while len(p) > CHUNK_SIZE:
                chunks.append(p[:CHUNK_SIZE])
                p = p[CHUNK_SIZE - OVERLAP:]
            cur = p
    if cur:
        chunks.append(cur)
    # prepend a sliver of previous chunk for context continuity
    out = []
    for i, c in enumerate(chunks):
        if i > 0 and OVERLAP > 0:
            tail = chunks[i - 1][-OVERLAP:]
            c = f"…{tail}\n{c}"
        out.append(c)
    return out


def derive_meta(fname: str, first_line: str) -> dict:
    base = fname.rsplit(".txt", 1)[0]
    if DATE_RE.match(base):
        return {"course": f"Live-Call {base}", "type": "live_call", "source_file": fname}
    title = (first_line or base.replace("_", " ").title()).strip()[:90]
    return {"course": title, "type": "course", "source_file": fname}


async def main(folder: str):
    from services_embeddings import embed_documents, EMBEDDING_DIM
    t0 = time.time()
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]

    # Dimension guard: wipe vectors of a different dimension before re-ingest
    sample = await db.rag_chunks.find_one({}, {"embedding": 1})
    if sample and len(sample.get("embedding") or []) != EMBEDDING_DIM:
        old = await db.rag_chunks.estimated_document_count()
        await db.rag_chunks.drop()
        print(f"Dropped {old} legacy chunks (dim mismatch → {EMBEDDING_DIM})", flush=True)

    await db.rag_chunks.create_index("metadata.source_file")
    files = sorted(f for f in os.listdir(folder) if f.endswith(".txt"))
    print(f"{len(files)} files to ingest", flush=True)
    total, failed = 0, 0
    for n, fname in enumerate(files, 1):
        text = open(os.path.join(folder, fname), encoding="utf-8", errors="ignore").read()
        if len(text.strip()) < 50:
            continue
        meta = derive_meta(fname, text.strip().split("\n")[0])
        chunks = chunk_text(text)
        docs = []
        try:
            for i in range(0, len(chunks), BATCH):
                batch = chunks[i:i + BATCH]
                embs = await embed_documents(batch)
                for c, e in zip(batch, embs):
                    docs.append({
                        "chunk_id": hashlib.sha1(f"{fname}:{c[:80]}:{len(c)}".encode()).hexdigest()[:16],
                        "content": c,
                        "metadata": meta,
                        "embedding": e,
                        "ingested_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    })
        except Exception as e:
            failed += len(chunks)
            print(f"[{n}/{len(files)}] {fname} FAILED: {e}", flush=True)
            continue
        await db.rag_chunks.delete_many({"metadata.source_file": fname})
        if docs:
            await db.rag_chunks.insert_many(docs)
        total += len(docs)
        print(f"[{n}/{len(files)}] {fname} → {len(docs)} chunks (total {total})", flush=True)
    print(f"DONE — {total} chunks ok, {failed} failed, {time.time() - t0:.0f}s runtime", flush=True)


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "/tmp/unchunked/unchunked"))
