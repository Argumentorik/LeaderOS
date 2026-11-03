# WladBot — How It Works (One-Page Overview)

> Du fragst → WladBot weiß was er ist (Theory oder Speech) → holt Wlads
> echtes Wissen aus der Datenbank → antwortet in Wlads Ton.

## Der Flow in 4 Schritten

```
   USER                                                       USER
    │                                                          ▲
    │ 1. Frage stellen                              4. Antwort │
    ▼                                                          │
 ┌────────────────────────────────────────────────────────────────┐
 │                          /api/chat                              │
 │                                                                 │
 │  ┌──────────┐    ┌────────────────┐    ┌─────────────────────┐  │
 │  │ 2. Router│    │ 3. RAG-Lookup  │    │ 5. LLM-Call         │  │
 │  │ entscheidet │  │ aus 2 200    │    │ Claude Haiku 4.5    │  │
 │  │ Theory oder│ → │ Wlad-Chunks  │ →  │ + System-Prompt     │  │
 │  │ Speech?  │    │ + Kontext    │    │ + Kontext           │  │
 │  └──────────┘    └────────────────┘    └─────────────────────┘  │
 │       │                  │                       │              │
 │       │                  │                       │              │
 │  router_de.txt    wladbot_documents     theory_de.txt           │
 │  (oder _en)       (Supabase pgvector)   oder speech_de.txt      │
 └────────────────────────────────────────────────────────────────┘
```

## Wo das Wissen herkommt

### 2 200 Lektionen aus Wlads Methodik

Stored in Supabase: `public.wladbot_documents` (mit `embedding vector(1024)`).
Embedded via **Voyage `voyage-3`** Model. Quelle:

- Wlads YouTube-Vorträge (transcribed + chunked)
- Wlads Bücher (3 SPIEGEL-Bestseller, capitelweise)
- Wlads Online-Kurse (38 Module, ~600 Lektionen)
- Wlads Podcast-Folgen
- Wlads Live-Trainings-Mitschnitte

Jeder Chunk: ~500 Tokens, mit Source-URL + Topic-Tags.

### Die 6 System-Prompts (Wlads Stimme)

`backend/data/prompts/wlad/`

| File | Wird verwendet wenn |
|---|---|
| `router_de.txt` | DE-Klassifikator: speech oder theory? |
| `router_en.txt` | EN-Klassifikator |
| `theory_de.txt` | Theorie/Methodik-Fragen (Default) |
| `theory_en.txt` | Theory in English |
| `speech_de.txt` | Rede-Feedback nach SEXIER-Modell |
| `speech_en.txt` | Speech feedback |

**Brand-pluggable**: Drop `backend/data/prompts/<coach>/` mit den 6
Files rein → derselbe Engine läuft mit beliebigem Personal-Brand-Coach.

## Der Router-Klassifikator (Schritt 2)

```
Heuristik: < 30 Wörter? → automatisch "theory" (spart LLM-Call)

Sonst: LLM-Mini-Call mit router_<lang>.txt
  Antwort = "speech" oder "theory"
  Fallback bei Error → "theory"
```

**Beispiele**:

| User-Input | Decision |
|---|---|
| "Was ist SEXIER?" | theory |
| "Wie eröffne ich ein Mitarbeitergespräch?" | theory |
| "Hier ist meine Rede: [800 Wörter Text]" | speech |
| "Bewerte meine Präsentation nach SEXIER" | speech |
| "Danke!" | theory |
| (audio.mp3 hochgeladen) | speech |

## Das RAG-System (Schritt 3) — Hybrid-Retrieval

`backend/services_rag.py`

**Zwei parallele Suchen, dann fusioniert:**

```
   User-Frage
      │
      ├──── A) SEMANTIC ─────────────────────┐
      │     Voyage-3 embedding (1024-dim)    │
      │     → match_wladbot_documents()      │
      │     → cosine-similarity top-K        │
      │                                      │
      └──── B) LEXICAL ──────────────────────┤
            Postgres German full-text (GIN)  │
            → match_wladbot_lexical()        │
            → BM25/ts_rank top-K             │
                                             │
                                             ▼
                          RRF-Fusion (Reciprocal Rank Fusion)
                                             │
                                             ▼
                          Top-N Chunks → in System-Prompt injizieren
                          (vor `User: ...`)
```

**Warum hybrid?** Semantic findet "Paraphrasen" (Frage über Vertrauen
findet Chunk über Authorität). Lexical findet exakte Begriffe ("SEXIER",
"ALPEN") wenn die Embedding nicht greift. Zusammen decken sie sich
gegenseitig ab.

**Cache**: 30-Min in-memory LRU. Gleiche Frage in 30 Min → kein Voyage-Call.

**Graceful degradation**: Wenn Voyage oder Supabase failt → Chat läuft
trotzdem mit nur dem Base-Prompt, ohne RAG-Kontext.

## Was am Ende beim LLM ankommt (Schritt 5)

```
System: [theory_de.txt — Wlads Voice + Regeln]

        --- USER MEMORY (personalisiert) ---
        Name: Maria · Rolle: CFO · Sprint Tag 12
        Letzte Drills: SEXIER, 3 Säulen
        ---

        --- AKTIVER ORDNER-KONTEXT ---
        Folder "Q3-Verhandlung mit Investor"
        ---

        --- WLAD-KONTEXT (RAG) ---
        Chunk 1: "Beim Verhandeln nutzt du..."
                 (Quelle: Wlads Buch S. 142)
        Chunk 2: "Drei Säulen sind dabei..."
                 (Quelle: YouTube-Vortrag 04:17)
        ---

User:   Maria's tatsächliche Frage
```

→ Claude Haiku 4.5 → Antwort in unter 3 Sekunden.

## Wo WladBot überall lebt

| Surface | Endpoint | Datei | Status |
|---|---|---|---|
| **Chat-Page** | `/api/chat` POST | `routes/chat.py` | ✅ live |
| **Voice-Call** | `/api/voice/personas` + `/api/voice/respond` | `routes/voice_tts.py` | ✅ live |
| **Speech-Analyse** | `/api/video/analyze` | `routes/video.py` | ✅ live (Audio/Video extrahiert → speech-prompt) |
| **Landing-Mini-Chat** | `LandingChatPod.js` (lead-mode) | client-only | ✅ live |
| **Edge-Function-Backup** | `/wladbot-chat` | `supabase/functions/wladbot-chat/index.ts` | ✅ als Fallback |

## Was du tust um neues Wissen reinzukriegen

### Option A — Neuer Chunk einzeln

```sql
INSERT INTO public.wladbot_documents (content, source_url, topic_tags, embedding)
VALUES (
  'Wlad-Lektion-Text...',
  'https://youtube.com/...',
  ARRAY['rhetorik', 'sexier'],
  -- embedding via Voyage-3 vorher generieren
  '[0.123, -0.456, ...]'::vector
);
```

### Option B — Bulk-Import via Pipeline

`backend/services_rag.py` hat `_backfill_metadata()` Funktion. Hand ihr
URLs + Texte → embedded sie + insertet. Existiert schon, einfach
Pipeline-Skript drüberlaufen lassen für neue Wlad-Lektionen.

### Option C — Prompt-Update statt Knowledge

Wenn du Wlads **Voice/Regeln** ändern willst (z.B. neue Schlagfertigkeits-
Technik in die Theorie-Antwort einbinden), editiere `theory_de.txt`
direkt. Kein Re-Embedding nötig. Engine lädt die Datei beim nächsten
Request neu (LRU-Cache `@lru_cache(maxsize=64)` → invalidate via Restart).

## Sanity-Check: läuft alles?

```bash
# 1. Router-Files existieren
ls backend/data/prompts/wlad/   # → 6 .txt files

# 2. Backend-Endpoint antwortet
curl -X POST https://leaderos.de/api/chat \
  -H "Authorization: Bearer <token>" \
  -d '{"message":"Was ist SEXIER?", "session_id":"test"}'

# 3. RAG-Health
curl https://leaderos.de/api/monitoring/system   # check rag.status
```

## In einem Satz

> **User-Frage → 30-Wort-Heuristik oder Mini-LLM-Router entscheidet
> Theory vs Speech → Hybrid-RAG holt Top-Chunks aus 2 200 echten
> Wlad-Lektionen → Personalisierter System-Prompt mit User-Memory +
> Folder-Kontext + Wlad-Chunks → Claude Haiku 4.5 → Antwort in Wlads
> Ton, in der Sprache der Frage.**
