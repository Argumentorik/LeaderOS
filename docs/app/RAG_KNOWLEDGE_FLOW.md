# How Wlad's knowledge flows into every surface

> **Chunk counts and the retrieval mechanism below are stale** (this doc
> predates the hybrid vector+lexical RRF retrieval and the corpus has
> grown to 2212 chunks since). For current numbers and architecture, see
> `docs/gtm/KNOWLEDGE_ONE_PAGER.md`. This file is kept for the per-surface
> route/file mapping in the table below, which is still structurally
> accurate.

Last verified: 2026-06-05 after the 996-chunk net-new ingest (corpus: **609 → 1605 chunks**).

This document maps every user-facing AI surface to the exact code paths
that pull from the Wlad knowledge corpus, so you can audit at a glance
where the corpus *does* and *does not* show up.

## The two pieces that ground every reply

Two independent guardrails sit between the LLM and the user:

| Mechanism | Source of truth | What it does |
| --- | --- | --- |
| **`retrieve_context(query)`** | `backend/services_rag.py` | Embeds the user query with Voyage `voyage-3` (1024 dim), calls `match_wladbot_documents` RPC (threshold 0.25, k=6), expands with adjacent chunks via `match_wladbot_with_neighbors`, returns labelled excerpts. |
| **`WLAD_HARD_RULES`** | `backend/services.py` | Constant appended to every Wlad-coaching system prompt. Locks the name spelling ("Wlad" never "Vlad"), enforces *use the corpus if provided*, and reminds the model that Wlad's corpus spans 17 curated + 9 raw books + 28 weekly live courses. |

An endpoint can use neither, one, or both. The matrix below is the
canonical source.

## The matrix — every surface, in one table

| Surface | Frontend trigger | Backend route | Whisper? | `retrieve_context`? | `WLAD_HARD_RULES`? | TTS reply? |
| --- | --- | --- | :-: | :-: | :-: | :-: |
| **WladBot text chat** | `/chat` page → `POST /api/chat` | `routes/chat.py:243` | — | ✅ `chat.py:244` | ✅ via `WLADBOT_SYSTEM_PROMPT` (`services.py`) | — |
| **WladBot voice conversation** (godmode 2-min input → ≤1000-word reply) | `VoiceRecorder.js` → `POST /api/voice/transcribe` then `POST /api/voice/converse` | `routes/voice_tts.py:362` | ✅ OpenAI Whisper-1 on input | ✅ `voice_tts.py:363` (added in PR #43) | ✅ via `VOICE_CONVO_SYSTEM_PROMPT` | ✅ OpenAI TTS (8 personas) |
| **Video analysis** (incl. Challenge30 video missions on day 18 & 28) | Upload form → `POST /api/video/analyze` | `routes/video.py:336` | ✅ Whisper-1 after ffmpeg extracts audio (150 MB raw / 25 MB Whisper post-extract) | ✅ `video.py:338` | ✅ via `VIDEO_ANALYSIS_PROMPT` | — |
| **Playbook generation** (multi-step coaching plan + final report) | `/playbooks` → `POST /api/playbooks/{id}/step` + `/report` | `routes/playbooks.py:61` | — | ✅ `playbooks.py:63` (called per step *and* per report) | ✅ appended to both inline system messages | — |
| **Simulation / roleplay feedback** | `/simulations` → `POST /api/simulations/{id}/feedback` | `routes/simulations.py:106` | — | ✅ `simulations.py:112` | ✅ via `SIMULATION_SYSTEM_PROMPT` | — |
| **Daily check-in** | Dashboard widget → `POST /api/daily-checkin` | `routes/checkin.py:45` | — | ❌ *intentional* — reflective coaching, not Q&A | ✅ via `CHECKIN_SYSTEM_PROMPT` | — |
| **Admin RAG-Studio debug** | `/admin/rag-debug` UI | `routes/admin.py:257` | — | ✅ direct `match_wladbot_documents` RPC, no LLM | n/a | — |

### Surfaces with LLM but **no** Wlad guardrails (by design — not coaching content)

| Surface | Route | Why no grounding |
| --- | --- | --- |
| Generic "Deep-Assist" / Tools (`/tools/{id}`) | `routes/tools.py:65,137` | Argumentation/Konflikt/etc. tools use **static, hand-crafted system prompts** from `data.TOOL_PROMPTS` — not generic Wlad coaching, so the corpus isn't a fit. |
| Challenge-mode opposing personas | `routes/challengers.py:36,92` | The "challenger" plays a **counter-role** (sceptic, hard buyer, devil's-advocate) — Wlad-corpus citation would break the persona. |
| Stripe receipt copy, marketing snippets | `routes/payments.py` | Transactional text — no coaching, no Wlad voice. |

## How the chain executes — one surface in detail (voice)

1. User taps mic in `VoiceRecorder.js`. UI shows the 2-min progress ring.
2. WebM blob → `POST /api/voice/transcribe` → Whisper-1 returns text.
3. UI calls `POST /api/voice/converse` with `{ transcript, persona }`.
4. `voice_tts.py:_voice_llm_reply()`:
   1. **`retrieve_context(transcript)`** — Voyage-embeds the transcript,
      calls `match_wladbot_documents`, expands neighbours, formats top-6
      excerpts as `<corpus>…</corpus>` blocks injected into the user
      message.
   2. LLM call (`gpt-5.2` via Emergent) with
      `VOICE_CONVO_SYSTEM_PROMPT + WLAD_HARD_RULES`.
   3. Reply length scales with question complexity (1-2 sentences for
      small-talk, up to ~1000 words for a deep framework explanation).
5. Reply text → OpenAI TTS with the user-selected persona voice → audio
   streamed back. Reply text *also* logged to `voice_messages` so the UI
   can render a transcript bubble.

Every other Wlad-grounded surface follows the same shape — only the
system prompt and the post-processing differ.

## What the new 996 chunks unlocked (live retrieval test, 2026-06-05)

Sample queries against `match_wladbot_documents` after embedding via
`voyage-3` with `input_type=query`, threshold 0.25, k=6:

| Query | Top similarity | New chunks in top-6 | Top source |
| --- | :-: | :-: | --- |
| "Wie werde ich eine charismatische Führungskraft?" | 0.7124 | **5/6** | `2026.02.04` live course (Charisma session) |
| "Was sind die Techniken der weißen Rhetorik?" | 0.6658 | **6/6** | `weiße_rhetorik` book |
| "Wie motiviere ich Mitarbeiter nachhaltig?" | 0.6336 | **6/6** | `2026.01.29` live course |
| "Wie strukturiere ich eine überzeugende Präsentation?" | 0.6678 | **5/6** | `klassische_rhetorik` + `praesentation` books |
| "Wie funktioniert effektives Homeoffice-Leadership?" | 0.6019 | **6/6** | `2026.02.25` live course + `homeoffice` book |

All five queries return top similarity ≥ 0.60 (Voyage `voyage-3` calls
≥ 0.55 "strongly grounded"). Existing curated chunks still dominate for
the topics they cover (`5_rollen_*`, `Eisenhower`, `ALPEN`, …) — the
new ingest is purely additive.

## Corpus shape (post-ingest)

```
total            1605
embedded         1605 (100% — Voyage voyage-3, 1024 dim, HNSW m=16 ef=64)
parent_docs        62
document_sets       3 (wlad_books_v1, wlad_courses_v1, leader_os_framework)
sources             4 (book, transcript, framework, manual)
```

| Document set | Chunks | What it is |
| --- | --: | --- |
| `wlad_books_v1` | 451 | Wlad's published books (curated + raw) |
| `wlad_courses_v1` | 1043 | Live weekly course transcripts + Argumentorik training cards |
| `leader_os_framework` | 18 | LeaderOS in-house frameworks (3-layer model, role cards, drills) |

## The two single-points-of-truth, for reviewers

- **`services_rag.py`** — `MATCH_THRESHOLD = 0.25`, `MATCH_K = 6`,
  `VOYAGE_MODEL = "voyage-3"`, `EMBEDDING_DIM = 1024`. Enforced by the
  `constants-drift.yml` CI workflow against the Edge-Function source.
- **`services.py`** — `WLAD_HARD_RULES` constant. Every coaching prompt
  appends this verbatim; grepping for `WLAD_HARD_RULES` lists every
  prompt that should be grounded.

## How to add a new Wlad-grounded surface

1. In the route handler, build the user query string (typically the
   user's message or transcript).
2. `from services_rag import retrieve_context` →
   `rag_ctx = await retrieve_context(query_string)`.
3. Inject `rag_ctx` into the user message (existing routes show the
   pattern — `<corpus>…</corpus>` wrapper).
4. In the system prompt, `from services import WLAD_HARD_RULES` and
   append it to your `SYSTEM_PROMPT` string.
5. Add a row to the matrix above so the next reviewer knows the surface
   is grounded.

## Diagnostic & ops Edge Functions deployed for this corpus

| EF | Purpose | Auth |
| --- | --- | --- |
| `embed-rag-documents` (v21) | Production embedding worker. POST with `?limit=100`; embeds NULL-embedding rows via Voyage. | `verify_jwt=true` |
| `ingest-rag` (v15) | Curated chunk ingest by `parent_doc` (called by Pod admin route). | `verify_jwt=false` (service-role bearer required in body check) |
| `ingest-rag-jsonl` (v2, new) | Bulk-fetches a gzipped JSONL from a public URL and upserts into `wladbot_documents`. Used for the 996-chunk drop. | `verify_jwt=true` |
| `embed-rag-runner` (v3, new) | Wraps `embed-rag-documents` in a 15-iteration in-EF loop to avoid pg_net race conditions when backfilling large drops. | `verify_jwt=true` |
| `rag-test-query` (v1, new) | Diagnostic: takes `{query, k, threshold}`, embeds via Voyage, runs the RPC, returns ranked chunks plus a `new_chunks_in_topk` counter. | `verify_jwt=true` |
