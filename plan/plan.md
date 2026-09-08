# Plan: Voyage-Frage von Stefan klären · Stand auf GitHub bringen · 2-MB-Wissens-Upload bestätigen

## Ausgangslage
Stefan sieht in seinem Code-Stand eine Funktion `_embed_query`, die bei jeder Nutzer-Nachricht die Anfrage über **Voyage** einbettet (mit Retry bei 429).
Dieser Stand ist **veraltet**. Seit Iteration 162 läuft die gesamte RAG-Einbettung **lokal** (sentence-transformers, 384 Dimensionen, kein externer Dienst, keine Rate-Limits, kein API-Key). Voyage wurde aus Code, Tests und Doku entfernt; `GET /api/rag-status` zeigt `provider: local`.
Stefans Kopie stammt also aus einem GitHub-Stand, der **vor** dieser Umstellung liegt – das Repo wurde seither nicht aktualisiert.

## Was gemacht wird

### 1. Godmode-Check „kein Voyage mehr“ (Code, Tests, Doku)
- Kompletter Durchlauf über Backend, Skripte, Tests und Doku: keine `VOYAGE_*`-Variablen, keine Voyage-URL, keine Voyage-Kommentare/Docstrings, kein `_embed_query` mit HTTP-Aufruf.
- Falls Reste gefunden werden: entfernen bzw. auf die lokale Einbettung umstellen. Falls nichts gefunden wird: als geprüft dokumentiert.
- `.env.example`: keine Voyage-Variable mehr; ein kurzer Hinweis, dass Einbettungen lokal laufen.
- Ergebnis für Stefan: eine kurze Notiz in `docs/RAG_SYSTEM.md` („Wie eine Nutzer-Nachricht heute eingebettet wird“ – lokal, synchron, ohne Retry-Logik, welche Funktion dafür zuständig ist), damit die Frage nicht wieder aufkommt.

### 2. Sichtbarkeit im Admin-Dashboard (Wissen-Bereich)
- Kleine Statuszeile im Wissens-Upload: **„Einbettung: lokal (384-dim) · Store konsistent“** aus dem bestehenden Status-Endpunkt – so sieht jeder Admin/Dev sofort, dass kein Voyage im Spiel ist.

### 3. 2-MB-Wissens-Upload bestätigen
- Der Upload bis **2 MB** (PDF, DOCX, TXT, MD, einzeln und als Mehrfach-Upload mit Drag & Drop) ist seit Iteration 160/161 im Admin-Dashboard live.
- Wird noch einmal Ende-zu-Ende geprüft (Datei nahe 2 MB → angenommen; über 2 MB → klare Fehlermeldung; Beschriftung „max 2 MB“ sichtbar). Nur wenn dabei etwas fehlt, wird nachgebessert.

### 4. GitHub aktualisieren
- Der Agent kann **nicht selbst** nach GitHub pushen. Nach Abschluss der Punkte 1–3 wird der Stand fertig gemeldet; dann bitte im Chat unten **„Save to GitHub“** klicken. Damit landet alles auf dem Repo – Voyage-Cleanup, 2-MB-Upload, Login-Teaser, Kurs-Bibliothek, Events-Fix usw.
- Empfehlung an Stefan: nach dem Push seinen lokalen Stand komplett neu vom Repo ziehen (nicht mergen), da sein Stand mehrere Iterationen zurückliegt.

## Annahmen
- Keine Voyage-Rückkehr gewünscht; lokal bleibt der einzige Einbettungs-Weg (auch in Produktion).
- Kein weiterer Umbau am RAG (Suche, Chunking, Modell) – nur Nachweis, Aufräumen und Sichtbarkeit.
- Die 2-MB-Grenze bleibt (kein Anheben auf z. B. 10 MB).

## Nicht enthalten
- Größere Refactorings am RAG oder am Chat-Flow.
- Änderungen an Stefans lokalem Setup.
