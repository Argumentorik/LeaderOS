# Dev-Handbuch: RAG & Wissenspflege in 5 Minuten

Stand: Iter 167 (08.09.2026). Zielgruppe: Stefan / Entwickler, die Wlads Wissensbasis verstehen oder pflegen wollen.

## 1. Was RAG hier bedeutet (1 Minute)

Jede Chat-Antwort von WladBot bekommt vor dem LLM-Aufruf passende Textstücke („Chunks“) aus Wlads Büchern, Skripten und Trainings in den System-Prompt gelegt. Das LLM (GPT-4o / GPT-5.2) antwortet dann mit Wlads Frameworks statt mit Allgemeinwissen.

**Alles läuft lokal auf dem Backend — kein externer Embedding-Anbieter, kein API-Key, keine Kosten pro Anfrage.**

| Baustein | Wert |
|---|---|
| Embedding-Modell | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`, 384 dim, in-process (fastembed/ONNX) |
| Vektor-Store | MongoDB Collection `rag_chunks` (aktuell ≈ 7.480 Chunks aus 57 Quellen), beim Start als numpy-Matrix in den RAM geladen |
| Suche | Cosine-Ähnlichkeit (Schwelle 0,40, Top 6) **+** paralleler Keyword-Scan, per Reciprocal Rank Fusion zusammengeführt (Eigennamen wie „SEXIER“ treffen sicher) |
| Cache | In-Memory-LRU je Frage, 30 min |
| Ausfallverhalten | Modell lädt nicht → nur Keyword-Suche. Kein Treffer → Chat antwortet ohne Kontext. **Der Chat bricht nie wegen RAG ab.** |

Code: `backend/services_embeddings.py` (Modell), `backend/services_rag.py` (Suche, Fusion, Prompt-Kontext), `backend/scripts_ingest_local_rag.py` (Chunking: 1.100 Zeichen mit Überlappung).

## 2. Der Ablauf einer Frage (1 Minute)

```
Nutzerfrage
  → embed_query()          Frage als 384-dim Vektor (< 50 ms)
  → _match_local()         Cosine gegen alle Chunks im RAM
  → _match_keyword()       parallel: Regex-Scan über rag_chunks.content
  → _fuse_rrf()            beide Trefferlisten verschmelzen, Top 6
  → _format_chunks_for_prompt()  Quellenlabel + Text in den System-Prompt
  → LLM                    Antwort mit Wlads Frameworks
```

Gleiche Frage innerhalb von 30 Minuten → Antwort aus dem Cache-Kontext, kein neues Embedding.

## 3. Wissen pflegen im Admin (2 Minuten)

Admin-Panel → **Wissensbasis** (`RagControlCenter`) und **Wissens-Studio** (`KnowledgeSources`).

### Statuszeile lesen
`7.481 Chunks · 57 Quellen` · `Abruf live geprüft · 9 Treffer` · `Modell OK (384d)` · `Vektor-Cache warm` · `Embeddings lokal · Store 384d ✓`

- **Abruf live geprüft**: Beim Laden wird eine echte Testfrage gestellt. Rot = RAG liefert nichts → Modell/Store prüfen.
- **Store 384d ✓**: Dimension der gespeicherten Vektoren passt zum Modell. Steht dort „≠ Modell — Re-Ingest nötig“, wurde das Modell gewechselt → Button „Neu einlesen“.
- Buttons: **Aktualisieren**, **Ist alles drin? (Bücher-Check)** (Abgleich mit dem Korpus-ZIP), **Golden-Check (21 Fragen)** (Selbsttest nach jedem Deploy — alle 21 Fragen müssen Wlad-Quellen treffen).

### Neues Wissen hochladen
1. Wissens-Studio → Datei(en) in die Drop-Zone ziehen (oder auswählen). Mehrere Dateien gleichzeitig sind erlaubt, sie laufen nacheinander durch.
2. Erlaubt: **.txt, .md, .pdf, .docx — max. 2 MB pro Datei.** PDFs müssen echten Text enthalten (keine Scans).
3. Optional Titel setzen (sonst aus dem Dateinamen). Fortschritt je Datei: Wartet → Lädt hoch → Extrahiert & bettet ein → Fertig.
4. Fertig = die Chunks sind sofort im Chat wirksam (Cache wird geleert). Kein Neustart, kein Deploy.

**Regeln, die das Backend durchsetzt** (`routes/rag_admin.py`):
- `413` bei > 2 MB („Bitte aufteilen“), `422` bei falschem Typ oder < 50 Zeichen Text, `401/403` ohne Admin.
- **Gleicher Dateiname ersetzt die alte Version** (idempotent) — so aktualisierst du eine Quelle: gleiche Datei erneut hochladen.
- Löschen: Papierkorb in der Quellenliste → `DELETE /api/admin/rag/source/{source_file}`.

### Was gehört rein — was nicht
- Rein: Wlads Bücher, Trainingsskripte, Frameworks, kanonische Definitionen, Kursfolgen-Transkripte, Falschzitat-Korrekturen (`WLAD_CANON.md` ist bereits drin).
- Nicht rein: Marketing-Texte, Preise (Quelle der Wahrheit ist `docs/PRODUKT_UND_PREISE.md`), Nutzerdaten, Notizen mit Personenbezug.

## 4. Kompletter Re-Ingest (nur bei Modellwechsel oder Korpus-Update)

Admin → **Neu einlesen (ZIP)** (`POST /api/admin/rag/reingest`) oder lokal:
```bash
cd /app/backend && python3 scripts_ingest_local_rag.py   # 10–30 min, lokales Modell, läuft im Hintergrund
```
Status: `GET /api/admin/rag/local-status` (`last_job`). Eigene Admin-Uploads (Typ `custom`) bleiben erhalten, wenn der Re-Ingest nur den Korpus ersetzt — im Zweifel danach die Quellenliste prüfen.

## 5. Schnellcheck nach einem Deploy (30 Sekunden)

```bash
curl -s $BACKEND/api/rag-status
# erwartet: "provider":"local", "dim":384, "store_dim":384, "consistent":true, "chunks">7000
```
Dann im Admin **Golden-Check** klicken → 21/21 grün. Fertig.

## Häufige Fragen

- **„Warum antwortet Wlad allgemein statt mit seinem Framework?“** Statuszeile prüfen (Abruf rot? Cache kalt?), dann Golden-Check. Ist die Quelle überhaupt drin? → Wissens-Studio, Suche nach dem Titel.
- **„Kann ich ein 5-MB-PDF hochladen?“** Nein — in Kapitel aufteilen (2 MB ≈ 300 Buchseiten Text). Das Limit schützt den Server-RAM beim Einbetten.
- **„Wo ist Voyage?“** Vollständig entfernt (Iter 162). Kein Paket, kein Key, kein Code-Pfad. Erwähnungen gibt es nur noch als Historie im Changelog und in als „HISTORISCH“ markierten Audits.
- **Tests**: `backend/tests/test_iter162_seo_rag.py`, `test_iter162_extras.py`, `test_iter160_*` (Upload-Limits), `test_golden_questions.py`.
