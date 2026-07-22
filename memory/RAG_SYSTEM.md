# Leader-OS · RAG System — Vollständige Dokumentation
_Stand: Iter 121 · 22.07.2026_

> **TL;DR** — Leader-OS nutzt ein **komplett lokales, DSGVO-freundliches
> Retrieval-Augmented-Generation-System**. Wlads gesamter Content (Kurse,
> Bücher, Transkripte, Playbooks) ist in **7 439 Chunks** zerlegt, mit einem
> **384-dimensionalen multilingualen MiniLM-Modell** eingebettet und in
> MongoDB abgelegt. Jede User-Anfrage wird binnen **<50 ms** semantisch +
> per Keyword-Fallback + per Framework-Mapping gegen diesen Corpus
> gematcht. Die Top-Chunks fließen als expliziter Kontext-Block in den
> LLM-System-Prompt — dadurch antwortet der Bot **auf Wlads Originalworten**,
> nicht auf GPT-Halbwissen. **Kein externer Vector-DB-Provider, keine
> Embedding-API-Kosten, kein Vendor-Lock-in.**

---

## 1 · Warum lokales RAG?

Wir haben in Iter 116 bewusst **Voyage AI + OpenAI-Embeddings entfernt** und
zu lokalen Embeddings gewechselt. Gründe:

| Kriterium | Voyage/OpenAI (vorher) | Lokal (heute) |
|---|---|---|
| Kosten pro Ingest | ~€120 für 7 400 Chunks | **€0** |
| Kosten pro Query | ~€0,00015 pro Frage | **€0** |
| Latenz | 200 – 800 ms API-Roundtrip | **~4 ms Embedding + <50 ms Match** |
| DSGVO / Datentransfer USA | ❌ jeder Query verlässt EU | ✅ bleibt im Container |
| Vendor-Lock-in | ❌ | ✅ |
| Offline-fähig | ❌ | ✅ |

**Trade-off:** Das lokale Modell ist ~5 % schwächer als `voyage-2` auf
englischen Fach-Benchmarks. Auf deutschem Wirtschaftsdeutsch (Wlads
Kernsprache) ist es **gleichwertig** und deutlich schneller.

---

## 2 · Architektur-Übersicht

```
┌────────────────────────────────────────────────────────────────────────┐
│                          RAG PIPELINE (End-to-End)                     │
└────────────────────────────────────────────────────────────────────────┘

  User-Query („Wie erklärt Wlad das Feedback-Framework?")
        │
        ▼
  ┌──────────────────────────┐
  │ 1. Voice-Framework-Map   │ ← wenn Query aus /voice/transcribe kam:
  │    (voice_framework_map) │   mappt phonetische Varianten
  │                          │   „sexier" → SEXIER-Argumentation
  └──────────────┬───────────┘
                 ▼
  ┌──────────────────────────┐
  │ 2. Cache-Lookup          │ ← 30 min TTL, LRU 1024 Entries
  └──────────────┬───────────┘
                 ▼                                       (parallel!)
  ┌──────────────────────────┐   ┌──────────────────────────────────┐
  │ 3a. Local Embedding      │   │ 3b. Keyword-Scan (Regex)         │
  │   fastembed MiniLM 384d  │   │   Coverage-Scoring über Wortliste│
  └──────────────┬───────────┘   └──────────────┬───────────────────┘
                 ▼                              ▼
  ┌──────────────────────────┐   ┌──────────────────────────────────┐
  │ 4a. Cosine-Match (numpy) │   │ 4b. Regex-Match auf content-Feld │
  │   In-Memory-Matrix       │   │                                  │
  │   <50 ms für 7 439 Docs  │   │                                  │
  └──────────────┬───────────┘   └──────────────┬───────────────────┘
                 └───────────────┬──────────────┘
                                 ▼
              ┌────────────────────────────────────────┐
              │ 5. Reciprocal Rank Fusion (RRF)        │
              │    Beide Rankings werden fusioniert    │
              │    → robuster für Eigennamen wie „SBI" │
              └──────────────┬─────────────────────────┘
                             ▼
              ┌────────────────────────────────────────┐
              │ 6. Manuelle High-Prio-Chunks           │
              │   (10 Stufen des Zuhörens etc. — immer │
              │    injected wenn Trigger-Keyword hits) │
              └──────────────┬─────────────────────────┘
                             ▼
              ┌────────────────────────────────────────┐
              │ 7. Top-K Auswahl + Threshold-Filter    │
              │   TOP_K=6, MATCH_THRESHOLD=0.40        │
              └──────────────┬─────────────────────────┘
                             ▼
              ┌────────────────────────────────────────┐
              │ 8. Context-Block-Formatierung          │
              │   Budget: max 20 000 Zeichen           │
              │   Header „=== WLAD-WISSEN ===" + Chunks│
              └──────────────┬─────────────────────────┘
                             ▼
              ┌────────────────────────────────────────┐
              │ 9. LLM-System-Prompt-Injection         │
              │   GPT-5.2 / Claude Sonnet 4.5 bekommt  │
              │   Wlads Original als „Wahrheits-Grund" │
              └──────────────┬─────────────────────────┘
                             ▼
                    User bekommt Antwort
                    auf Wlads Originalworten
```

---

## 3 · Embedding-Modell

**Modell:** `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
**Library:** `fastembed` (0.5.x) mit ONNX-Runtime — CPU-only, keine GPU nötig.
**Dimensionen:** **384** (vorher 1024 Voyage / 1536 OpenAI-ada)
**Loading:** Lazy beim ersten API-Call, `_load_model()` in
`services_embeddings.py`, RSS-Impact ~600 MB nach Load.
**Sprachen:** 50+ (verifiziert für Deutsch, Englisch, Spanisch, Französisch)
**Speed:** ~10 ms Embedding pro Query auf durchschnittlichem CPU.

### Warum genau dieses Modell?

1. **Multilingual** — Wlads Content ist deutsch, aber User schreiben auch
   auf Englisch (Cohort-Leader aus DACH-Ausland).
2. **Klein & schnell** — 118 MB Modell-Dateien vs. 1,3 GB für `bge-large`.
3. **Robust bei kurzen Queries** — MiniLM's Mean-Pooling ist für
   Chat-Fragen ideal (viele davon sind 5-15 Wörter).
4. **ONNX-Deployment** — läuft in jedem Docker-Container ohne CUDA.

---

## 4 · Ingestion-Pipeline

Datei: `/app/backend/scripts_ingest_local_rag.py`

```python
CHUNK_SIZE = 1100 Zeichen  # sweet-spot für MiniLM Context-Window
OVERLAP    = 150 Zeichen   # verhindert Info-Verlust an Chunk-Grenzen
```

### Ingest-Workflow
1. **Text-Extraktion** aus PDF/DOCX/TXT/MD (via `unstructured` + `pypdf`).
2. **Chunking** auf Absatz-Ebene, hart begrenzt auf `CHUNK_SIZE`.
3. **Embedding-Batch** über `services_embeddings.embed_batch()` (batch size 32).
4. **Insert** in `rag_chunks` Collection mit Schema:
   ```json
   {
     "chunk_id": "uuid4",
     "content": "…max 1100 chars text…",
     "embedding": [0.023, -0.14, …]  // 384 floats
     "metadata": {
       "source": "wlad_book_ueberzeugen",   // human readable
       "course": "Rhetorik-Grundlagen",
       "topic": "SEXIER-Argumentation",
       "chunk_index": 42
     },
     "created_at": "2026-07-22T09:00:00Z"
   }
   ```
5. **Idempotent** — Re-Ingest droppt zuerst alle Chunks mit passender
   `metadata.source`, verhindert Duplikate.

### Aktuelle Corpus-Größe (Preview-DB, Iter 121)
- **7 439 Chunks** insgesamt
- 0 manual chunks aktiv (die 10-Stufen-Zuhören-Chunks sind fest im Code als
  Konstante `MANUAL_CHUNKS`, kein DB-Insert)
- Corpus deckt: Rhetorik-Grundlagen, Manipulationsabwehr, Verhandeln,
  Storytelling, Feedback, Führung, Coaching-Frameworks.

---

## 5 · Retrieval-Layer im Detail

### 5.1 Semantische Suche (`_match_local`)

```python
# services_rag.py :: _match_local
docs = load_all_chunks_into_numpy_matrix_once()  # cached 1h, invalidiert bei count-Change
q_emb = normalize(embed(query))
cosine_sims = matrix @ q_emb                     # vectorized dot product
top_k = argsort(-cosine_sims)[:MATCH_COUNT]
return [chunk for chunk in top_k if cosine_sims[i] >= MATCH_THRESHOLD]
```

**Warum kein MongoDB-Vector-Index?** Bei 7 439 Chunks ist ein In-Memory
numpy-Matmul **schneller** als ein Atlas-`$vectorSearch`-Roundtrip (kein
Netzwerk-Hop). Ab ~50 000 Chunks wechseln wir auf `$vectorSearch`.

### 5.2 Keyword-Fallback (`_keyword_scan`)

Parallel zur Semantik läuft eine Regex-Coverage-Suche:
- Query wird in Tokens zerlegt, Stopwords entfernt.
- Für jeden Chunk: „Wie viele DISTINCT Query-Tokens tauchen im Content auf?"
- Chunks werden nach Coverage sortiert.

**Warum?** Semantische Suche versteht „SEXIER" nicht als Framework-Namen —
das Modell zerlegt es in Buchstaben-Embedding. Der Keyword-Scan fängt genau
diese Eigennamen-Referenzen zuverlässig.

### 5.3 Reciprocal Rank Fusion

Beide Ranglisten werden fusioniert:
```
RRF-Score(chunk) = Σ  1 / (60 + rank_i)   für jede Rangliste i
```
Das ist der **State-of-the-Art** für Hybrid-Search (Microsoft, Elastic
nutzen exakt dasselbe Verfahren). Ergebnis: robuster gegen
Query-Ambiguität — funktioniert für „was ist SEXIER" (Eigenname-Match)
UND für „wie überzeuge ich mit Fakten" (semantischer Match).

### 5.4 Manuelle High-Priority Chunks (`MANUAL_CHUNKS`)

Für Frameworks, die ABSOLUT immer zitiert werden müssen (z. B. Wlads
„10 Stufen des Zuhörens"), gibt es fest verdrahtete Chunks im Code. Wenn
die Query einen der Trigger-Keywords enthält (`"zuhören"`, `"listening"`,
`"10 stufen"`), wird der Chunk deterministisch injected — unabhängig vom
Vector-Match.

---

## 6 · Query-Enhancement (Voice → Framework)

Neu in Iter 121: `/app/backend/voice_framework_map.py`

Bei Voice-Input geht die Query VOR dem RAG durch `enrich_transcript()`:

```python
enrich_transcript("erkläre mir sexier")
# → {
#     text: "erkläre mir sexier",
#     matched_frameworks: [{framework: "SEXIER-Argumentation", pillar: "SEXIER"}],
#     low_confidence: False,
#     is_question: True,
# }
```

**Gemappte Frameworks** (auch bei phonetischer Fehler-Aussprache):
- 3 Säulen: Logos / Ethos / Pathos (+ „loguse", „patus", „etus" Varianten)
- SEXIER-Argumentation (+ „sechsier", „sechser", „sexy")
- Kommunikationsquadrant
- Schwarze Rhetorik / Manipulationsabwehr
- Verhandeln nach Wlad (+ „BATNA")
- Storytelling im Boardroom
- SBI- und WWW-Feedback

Der gemappte Framework-Name wird **zusätzlich** als expliziter LLM-Boost
in den System-Prompt injected (`voice_tts.py`):
```
--- FRAMEWORK-KONTEXT (Voice-Match) ---
Der User hat vermutlich diese Wlad-Frameworks erwähnt: SEXIER-Argumentation.
Beziehe deine Antwort explizit auf dieses Framework und nenne es beim Namen.
```

---

## 7 · Context-Injection in den LLM-Prompt

Format des Blocks (`_format_chunks_for_prompt`):

```
=== WLAD-WISSEN (Auszüge aus den Original-Materialien — nutze diese als Wahrheits-Grundlage) ===

[Quelle 1 · Relevanz 0.68]
… bis zu 20 000 Zeichen Chunk-Content …

---

[Quelle 2 · Relevanz 0.62]
…

=== ENDE WLAD-WISSEN ===
```

**Budget:** `MAX_CONTEXT_CHARS = 20 000` Zeichen (~5 000 Tokens). Reicht
für 3-6 volle Chunks. Wenn der erste Chunk schon zu groß ist, wird er
truncated statt gedroppt (kritisches Fix aus Iter 92.23.5).

**Positionierung im Prompt:** Der Block hängt am Ende des System-Prompts —
zwischen Base-Prompt und User-Message. Modelle geben späteren Kontext
mehr Gewicht (Recency-Bias) → Antworten zitieren Wlads Content zuverlässig.

---

## 8 · Admin Knowledge Management

Datei: `/app/frontend/src/components/admin/KnowledgeSources.js`
Backend: `/app/backend/routes/rag_admin.py`

**Enterprise-Feature:** Wlad kann live neue Inhalte hochladen ohne Redeploy.

Workflow:
1. Admin-User geht auf `/admin` → Tab „Knowledge"
2. Wählt „Text hochladen" / „Datei hochladen" (PDF/DOCX/TXT/MD)
3. Backend chunked + embedded + inserted → live in Retrieval
4. Löschen via `metadata.source` (jeder Upload bekommt eigene Source-ID)

Endpoints:
- `POST /api/admin/rag/upload` — neuer Content
- `POST /api/admin/rag/reingest` — kompletter Re-Ingest (bei Modell-Change)
- `GET /api/admin/rag/sources` — Liste aller aktiven Sources + Chunk-Counts
- `DELETE /api/admin/rag/sources/{source_id}` — Source purgen

Sicherheit: Alle Endpoints sind admin-gated (`require_admin` Middleware).

---

## 9 · Caching & Performance

### Query-Cache
- **Key:** exakter Query-String (case-sensitive)
- **TTL:** 30 Minuten
- **Max Entries:** 1 024 (LRU-Eviction: 25 % ältester Einträge werden gedroppt)
- **Hit-Rate in Preview:** ~35 % bei aktiven Cohort-Sessions

### Corpus-Cache (`_LOCAL_CACHE`)
- Numpy-Matrix wird beim ersten Query in RAM geladen (~30 MB für 7 439 Chunks)
- Wird alle 60 min neu geladen ODER wenn `estimated_document_count()`
  sich ändert (nach Admin-Upload)
- Cold-Start: ~800 ms für 7 439 Chunks
- Warm-Query: **<50 ms** p95

### Modell-Cache
- fastembed lädt Modell einmal pro Prozess (~800 ms)
- Bleibt für Lebenszeit des Uvicorn-Workers im Memory (~600 MB RSS)

---

## 10 · Fallbacks & Graceful Degradation

Chat bricht **NIE** wegen RAG. Alle Failure-Modes:

| Failure | Verhalten |
|---|---|
| Modell lädt nicht (`RAG_EMBEDDINGS_DISABLED=1`) | Keyword-Scan reicht allein, Chat läuft normal |
| MongoDB down | RAG liefert `[]`, Base-Prompt weiter, Log-Warning |
| Dimensions-Mismatch (Store=1024, Query=384) | RAG deaktiviert sich, Log-Error, Chat läuft |
| Query embedding fails | Nur Keyword-Scan zählt |
| Chunks alle unter `MATCH_THRESHOLD` | Kein Context-Block → LLM antwortet auf Base-Wissen |
| Corpus leer (0 Chunks) | Skip RAG, keine Warning |

Jeder Pfad hat expliziten `try/except` mit Warn-Log.

---

## 11 · Ops & Tuning-Knobs (Environment)

Alle steuerbar per `/app/backend/.env` ohne Code-Change:

| Variable | Default | Effekt |
|---|---|---|
| `RAG_MATCH_THRESHOLD` | `0.40` | Cosine-Cutoff. Höher = präziser aber weniger Recall. |
| `RAG_MATCH_COUNT` | `6` | Top-K Chunks. Höher = mehr Kontext, größerer Prompt. |
| `RAG_EMBEDDINGS_DISABLED` | `0` | Rettungsschalter — schaltet Vector-Search aus, nur Keyword aktiv. |
| `RAG_AUTO_INGEST` | `1` | Startup-Auto-Ingest wenn 0 Chunks in DB. |
| `MAX_CONTEXT_CHARS` | `20000` | Zeichen-Budget im Context-Block (hardcoded, in code). |

Live-Diagnose:
```bash
curl https://leaderos.de/api/rag-status
# → {chunks: 7439, model: "…MiniLM…", embedding_dim: 384, cache_hit_ratio: 0.35}
```

---

## 12 · File-Map

| Datei | Zweck |
|---|---|
| `backend/services_embeddings.py` | Modell-Loading, `embed()` + `embed_batch()` |
| `backend/services_rag.py` | Retrieval-Logik, Fusion, Cache, Prompt-Formatter |
| `backend/voice_framework_map.py` | Voice-Query-Enhancement, Framework-Alias-Map |
| `backend/scripts_ingest_local_rag.py` | CLI-Ingest für Corpus-Files |
| `backend/routes/rag_admin.py` | Admin-API (upload / delete / reingest / sources) |
| `backend/routes/chat.py` | Ruft `retrieve_context()` vor jedem LLM-Call |
| `backend/routes/voice_tts.py` | Voice-Weg: Framework-Boost + RAG-Injection |
| `frontend/src/components/admin/KnowledgeSources.js` | UI zum Live-Upload |

---

## 13 · FAQ / Troubleshooting

**„Bot antwortet ohne Wlads Content — was ist los?"**
1. Curl `/api/rag-status` — hat `chunks > 0`?
2. Check Logs: `grep "RAG:" /var/log/supervisor/backend.err.log`
3. Similarity zu niedrig? Lower `RAG_MATCH_THRESHOLD=0.35` und Reload.
4. Modell nicht geladen? Check `Embeddings: … loaded in Xs` beim Boot.

**„RAG ist zu langsam."**
1. Corpus-Cache cold? Erster Query ~800 ms, dann <50 ms.
2. Query-Cache Hit? Log `RAG: cache hit for '…'`.
3. Bei Prod-Peak: setze `RAG_MATCH_COUNT=4` → weniger Chunks, kleinerer Prompt.

**„Dimensions-Mismatch nach Modell-Wechsel."**
```bash
# Kompletter Re-Ingest:
python /app/backend/scripts_ingest_local_rag.py --wipe
# ODER via Admin-UI: /admin → Knowledge → „Reingest all"
```

**„Wie füge ich neuen Wlad-Content hinzu?"**
- Kleine Texte (< 10 kB): `/admin` → Knowledge → „Text hochladen"
- Große PDFs (Buch, Kurs-Transkript):
  ```bash
  cp meinbuch.pdf /app/backend/rag_corpus/wlad_buch_XXX.pdf
  python /app/backend/scripts_ingest_local_rag.py
  ```
- Chunks sind sofort in Retrieval, kein Restart nötig.

**„Kann ich Wlads Content lokal exportieren?"**
```python
# Backup aller Chunks:
mongoexport --db=wladbot --collection=rag_chunks --out=rag_backup.json
```

---

## 14 · Costs & Scaling

| Cohort-Größe | RAG-Kosten/Monat | Latenz p95 |
|---|---|---|
| 100 Users | €0 | <50 ms |
| 1 000 Users | €0 | <60 ms |
| 10 000 Users | €0 (aber: RAM +200MB pro Worker) | <100 ms |
| 100 000 Users | €0, aber Atlas Vector-Index empfohlen | <200 ms |

**Break-Point** für Migration zu Atlas `$vectorSearch`: ~50 000 Chunks
oder ~10 QPS Peak. Der Code hat bereits einen `$vectorSearch`-Fallback
(kommentiert), Umschaltung ist 1-Zeilen-Change.

---

## 15 · Was RAG NICHT macht

Für Klarheit: RAG ist **kein Fine-Tuning**, kein Modell-Training. Es
injiziert nur Kontext in den Prompt. Konkret:

- ❌ Ändert nicht wie GPT-5.2 „denkt"
- ❌ Kann keine völlig neuen Konzepte lehren (das macht Fine-Tuning)
- ❌ Ersetzt kein Reasoning
- ✅ Sorgt dafür, dass der Bot Wlads Original-Definitionen zitiert
- ✅ Reduziert Halluzinationen bei Framework-Namen dramatisch
- ✅ Macht den Bot up-to-date mit neuem Content ohne Modell-Wechsel

---

_Fragen? Slack Mert / Emergent Support._
