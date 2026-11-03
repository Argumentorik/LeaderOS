# Wlads Wissen im Produkt — ein Seiter

> Diese Datei ist der aktuelle Stand (Stand: dieser Commit). Sie ersetzt
> `docs/app/RAG_KNOWLEDGE_FLOW.md` (Stand 2026-06-05, 1605 Chunks, alte
> Vector-only-Architektur) als Referenz für aktuelle Zahlen — jenes
> Dokument bleibt als Architektur-Geschichte erhalten, aber die Chunk-
> Zahlen und der Retrieval-Mechanismus dort sind überholt.

## 1. Woraus Wlads Wissen besteht

| Quelle | Was |
|---|---|
| **13 Bücher** (3× SPIEGEL-Bestseller: Weiße Rhetorik, Dunkle Rhetorik, Die 5 Rollen einer Führungskraft) | Kapitelweise gechunkt |
| **Live-Kurse** (wöchentliche Trainings, Argumentorik-Akademie) | Transkribiert + gechunkt |
| **Podcast- & YouTube-Vorträge** | Transkribiert + gechunkt |
| **LeaderOS-Eigenframeworks** | 11 Frameworks, Rollen-Karten, Drill-Definitionen |

Alles liegt embedded in **Supabase Postgres** (`public.wladbot_documents`,
`embedding vector(1024)`, Voyage `voyage-3`) — **2212 Chunks** aktuell
(`backend/services_rag.py`). Das ist keine MongoDB-Collection und kein
Datei-Korpus im Repo — es ist eine live Datenbank-Tabelle, separat von
allem, was hier im Git-Repo versioniert ist.

## 2. Die zwei Wahrheits-Schichten (in dieser Reihenfolge geprüft)

1. **`docs/gtm/WLAD_CANON.md`** — die kanonische Referenz für jeden Framework-
   Namen, jede Buchreferenz, jede Biografie-Aussage. Existiert, weil ein
   einzelner Korpus-Chunk (`layer202_drills`) eine falsche SEXIER-Definition
   enthielt (Repeat/Implications/Evidence statt Rebuttal/Impact/Explanation
   of Impact) — LLM-Antworten waren entsprechend falsch, bis das entdeckt
   wurde. **Bei Konflikt zwischen Korpus-Chunk und Canon gilt der Canon.**
2. **`WLAD_HARD_RULES`** (`backend/services.py`) — wird an JEDEN
   Wlad-Coaching-System-Prompt angehängt. Hard-codet die korrekten
   Framework-Definitionen direkt in den Prompt (SEXIER, 10 Stufen des
   Zuhörens, Feedbackformel, 5 Rollen, 3 Säulen, Kommunikationsquadrant,
   Dunkle Rhetorik, 4-Farben-Modell) — das ist die Absicherung, die auch
   dann noch die richtige Antwort erzwingt, wenn ein einzelner
   RAG-Chunk mal falsch ist. Sperrt außerdem "Wlad" (nie "Vlad") und
   erzwingt Framework-ANWENDUNG statt bloßes Benennen.

**Wichtig — offener Punkt:** der defekte `layer202_drills`-Chunk selbst
lebt weiterhin live in der Supabase-Tabelle und wurde in dieser Session
NICHT neu eingebettet (kein DB-Zugriff in dieser Session verfügbar) —
nur die Prompt-Ebene (`WLAD_HARD_RULES`) fängt ihn ab. Der Chunk sollte
perspektivisch über die Supabase-MCP-Tools oder einen Admin-Ingest-Lauf
korrigiert/neu embedded werden, damit auch die reine Retrieval-Ausgabe
(z. B. im Admin-RAG-Debug-View) nicht mehr die falsche Definition zeigt.

Bei dieser Durchsicht wurden zusätzlich **im öffentlichen Journal-Content**
(nicht im RAG-Korpus, sondern in `frontend/src/features/content/data/articles/*.js`)
mehrere Artikel gefunden, die Frameworks komplett neu erfunden hatten
(falsches SEXIER, falsches 5-Rollen-Modell, falsche 10-Stufen-Zuhören-
Reihenfolge, falsche Wlad-Biografie-Fakten) — alle wurden in dieser
Session korrigiert (siehe Commit-Historie).

**Nachtrag (zweite, tiefere Durchsicht):** der SEXIER-Bug war nicht der
einzige. Eine gezielte Prüfung aller Stellen, die "10 Stufen des Zuhörens"
referenzieren, fand ein fabriziertes **"5 Ebenen"-Modell** (Ignorieren →
So-tun-als-ob → Selektiv → Aufmerksam → Empathisch — bzw. in `checkin.py`
sogar eine DRITTE, wieder andere Variante) direkt in sieben Live-Prompts/
-Inhalten: `WLADBOT_SYSTEM_PROMPT` (services.py), `checkin.py`,
`chat.py`s Rollen-Map, `quiz_bank.py` (eine Quiz-Frage, die das falsche
Modell als "richtige" Antwort markierte), `challenge30.py` und
`DownloadsPage.js` (echter Nutzer-Download, kein LLM). Anders als der
Korpus-Chunk-Bug lagen diese ALLE in versioniertem Repo-Code — kein
DB-Zugriff nötig, alle in dieser Session direkt gefixt. Ebenso gefixt:
"12 Bücher" (stale, sollte 13 sein) in `WLADBOT_SYSTEM_PROMPT` und sechs
weiteren Frontend-Dateien, eine überharte "nenne nur diese drei Bücher"-
Regel im selben Prompt, und ein fabriziertes Kommunikationsquadrant in
`checkin.py` ("Klar/Empathisch/Strukturiert/Mutig" statt Sache/
Selbstoffenbarung/Beziehung/Appell). Details + zwei neue, NICHT
code-fixbare offene Punkte (Dunkle- vs. Schwarze-Rhetorik-Namenskonflikt,
Buchlisten-Diskrepanz Canon-vs-WladJachtchenkoPage) stehen in
`docs/gtm/WLAD_CANON.md` unter "Offene Punkte".

## 3. Wie eine Antwort entsteht (Chat/Voice/Video)

```
User-Frage
  → Router (< 30 Wörter? sonst Mini-LLM-Klassifikator)
      entscheidet: "theory" (Konzept-Frage) oder "speech" (Rede-Feedback)
      Quelle: backend/data/prompts/wlad/{router,theory,speech}_{de,en}.txt
  → Hybrid-RAG-Retrieval (backend/services_rag.py)
      A) SEMANTISCH: Voyage-3-Embedding → match_wladbot_documents (pgvector, Schwelle 0.25)
      B) LEXIKALISCH: Postgres-Volltext (GIN) → match_wladbot_lexical (findet exakte
         Begriffe wie "SEXIER"/"ALPEN" auch wenn die Embedding-Suche daneben liegt)
      → Reciprocal Rank Fusion der beiden Listen → Top-8 Chunks
      (Cache: 30 Min in-memory LRU pro Frage)
  → System-Prompt = Theory/Speech-Prompt + WLAD_HARD_RULES + injizierte Chunks
  → LLM-Call → Antwort in Wlads Ton
```

Degradiert graceful: fällt Voyage aus (Rate-Limit) → lexikalische Suche
trägt allein. Fällt Supabase aus → Chat läuft mit Base-Prompt ohne
RAG-Kontext weiter. Chat bricht nie wegen RAG.

## 4. Wo das überall verwendet wird

| Surface | Route | RAG? | Hard Rules? |
|---|---|:-:|:-:|
| Chat | `POST /api/chat` | ✅ | ✅ |
| Voice-Gespräch | `POST /api/voice/converse` | ✅ | ✅ |
| Video-/Rede-Analyse | `POST /api/video/analyze` | ✅ | ✅ |
| Playbooks | `POST /api/playbooks/{id}/step` | ✅ | ✅ |
| Simulationen/Rollenspiel | `POST /api/simulations/{id}/feedback` | ✅ | ✅ |
| Daily Check-in | `POST /api/daily-checkin` | ❌ (bewusst — Reflexion, nicht Q&A) | ✅ |
| Journal/SEO-Content (132 Artikel) | statisch, `frontend/src/features/content/data/articles/` | n/a (kein LLM zur Laufzeit) | n/a — Qualität hier hängt an Autoren-Sorgfalt, siehe Punkt 6 |
| KI-Suchmaschinen (ChatGPT/Perplexity/Claude/Google AI) | `frontend/public/llms.txt` + `robots.txt` (Crawler explizit erlaubt) | n/a | n/a |

## 5. Qualitätssicherung — der Audit-Loop

`backend/routes/admin_quality.py` — `POST /api/admin/rag-quality-audit`.
Läuft den ECHTEN Produktions-Pfad (gleiches Retrieval, gleicher Prompt,
gleiches Modell) gegen ein **Signature-Set von 18 Fragen**, eine pro
Kern-Framework — inklusive einer expliziten SEXIER-Sonde, die bis zu
dieser Session fehlte, obwohl SEXIER das Framework mit der dokumentierten
Bug-Historie ist. Ein zweiter, strenger LLM-Call bewertet jede Antwort:
wird das Framework wirklich angewendet (nicht nur genannt), ist die
Antwort im Korpus verankert, ist sie generische Coaching-Sprache. Ergebnis
wird in `rag_quality_runs` persistiert für Trend-Ansicht.

## 6. Was "korrekt" hier eigentlich heißt

Drei unabhängige Ebenen müssen übereinstimmen, sonst driftet Wissen
auseinander wie beim SEXIER-Bug:
1. **RAG-Korpus** (Supabase, live) — kann falsch sein durch schlechte
   Ingest-Chunks (wie `layer202_drills`).
2. **Prompt-Ebene** (`WLAD_HARD_RULES`, `theory_de.txt` etc., versioniert
   in diesem Repo) — muss den Canon spiegeln.
3. **Öffentlicher Content** (Journal-Artikel, versioniert in diesem Repo)
   — muss unabhängig vom RAG/Prompt-System stimmen, weil er direkt an
   Menschen und Suchmaschinen geht, ohne LLM dazwischen.

`docs/gtm/WLAD_CANON.md` ist der einzige Ort, gegen den alle drei geprüft
werden sollten. Jeder neue Artikel, der ein Framework benennt, und jeder
neue Korpus-Chunk sollte vor Veröffentlichung gegen diese Datei geprüft
werden — das ist aktuell ein manueller Schritt, kein automatischer Gate.
