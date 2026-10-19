# MA-Feedback WladBot 3.0 / LeaderOS · Triage & To-dos

> Quelle: [MA-Feedback-Doc](https://docs.google.com/document/d/1zL4VnvrI__602GZh2iGEXIYeMVTuEqPxJVVnnWOdW_I/edit)
> (Feedback-Frist 21.08.2026). Ausgewertet am 24.08.2026.
>
> **Teilnehmer:** Bennet, Dominik, Selina, Manuel, Lars, Carolin, Elias,
> Julia, Danny — 9 mit Feedback, Niklas ohne Eintrag.
>
> Ziel laut Wlad: kritisches Feedback **bevor** WladBot 3.0 an die
> Masterclässler geht. Dieses Dokument ist die Arbeitsliste dafür.

## Wie diese Liste zu lesen ist

| Kennzeichnung | Bedeutung |
| --- | --- |
| ✅ **im Code verifiziert** | Ich habe die Ursache im Repo gefunden und belegt |
| 🔍 **Repro nötig** | Meldung plausibel, aber aus dem Code allein nicht bestätigbar — braucht Logs oder einen Test-Account |
| 💬 **Entscheidung** | Kein Bug, sondern eine Produkt-/Brand-Frage für Wlad |

**Priorisierung nach Meldehäufigkeit**, nicht nach Bauchgefühl: was
mehrere Tester unabhängig gefunden haben, finden auch Kunden.

---

## P0 · Release-Blocker

### 1. Quiz: die richtige Antwort ist praktisch immer B ✅

**Gemeldet von 5 von 9 Testern** (Bennet, Manuel, Lars, Julia, Danny) —
das meistgemeldete Problem überhaupt.

Gemessen an `backend/quiz_bank.py`, 232 Multiple-Choice-Fragen:

| Position der richtigen Antwort | Anzahl | Anteil |
| --- | --- | --- |
| A (Index 0) | 1 | 0,4 % |
| **B (Index 1)** | **229** | **98,7 %** |
| D (Index 3) | 2 | 0,9 % |

**Es gibt einen zweiten, unabhängigen Verräter** (von Manuel und Julia
bemerkt, aber unterschätzt): die richtige Antwort ist auch die längste.

- In **229 von 232 Fragen (99 %)** ist die richtige Option die längste.
- Sie ist im Median **4,8× so lang** wie der Durchschnitt der falschen.

**Konsequenz für die Umsetzung:** Nur die Position zu mischen behebt den
Bug **nicht** — wer die längste Antwort wählt, hat weiterhin zu 99 %
recht. Beide Signale müssen weg:

- [ ] Antwortpositionen randomisieren (deterministisch pro `user_id +
      day`, damit ein Reload nicht die Reihenfolge ändert und
      `correct`-Indizes serverseitig gültig bleiben)
- [ ] **Distraktoren auf Länge der richtigen Antwort bringen** — das ist
      redaktionelle Arbeit an 232 Fragen, nicht Code. Grobschätzung
      1,5–2 Tage, ggf. LLM-gestützt mit menschlichem Review
- [ ] Test, der beide Verteilungen prüft und bei Schieflage rot wird
      (analog zum bestehenden `constants-drift`-Muster in CI)

> Vorsicht bei der Umsetzung: `backend/routes/challenge30.py:144`
> vergleicht `user_answer == q["correct"]`. Wird im Frontend gemischt,
> muss die Rück-Übersetzung serverseitig passieren — sonst wird korrekt
> Geantwortetes als falsch gewertet.

### 2. Sprachausgabe / Audio-Modus funktioniert nicht 🔍

**Gemeldet von 4 Testern** (Julia, Elias, Carolin, Manuel).

- Julia: „Sprachausgabe funktioniert nicht"
- Elias: „Wlads Zitat des Tages kann nicht angehört werden"
- Carolin: Antwort wird **nicht vorgelesen** und ist nur ~2 Sek. sichtbar
- Manuel: Sprachmodus in der Tages-Challenge „noch nicht verfügbar"

`backend/routes/voice_tts.py` existiert vollständig (539 Zeilen, ElevenLabs,
Caching). Der Client wird aus `ELEVENLABS_API_KEY` gebaut und gibt ohne
Key `None` zurück.

- [ ] **Zuerst prüfen: ist `ELEVENLABS_API_KEY` auf Emergent gesetzt und
      gültig?** Wenn nein, ist das kein Code-Bug, sondern eine fehlende
      Environment-Variable — und alle vier Meldungen lösen sich auf einmal
- [ ] Wenn der Key sitzt: Logs von `/api/voice/tts` beim Fehlerfall ziehen
- [ ] Unabhängig davon: **Fehlerfall sichtbar machen.** Aktuell wirkt es
      wie „kaputt". Es braucht eine klare Meldung statt Stille

### 3. Audio-Modus: Antwort verschwindet nach ~2 Sekunden ✅ (Verhalten bestätigt gemeldet)

**Gemeldet von Carolin und Lars.** Unabhängig vom TTS-Key: der Text ist
zu kurz sichtbar, um mitzulesen.

- [ ] Antwort im Audio-Modus stehen lassen, bis der Nutzer weiterspricht
      oder wegklickt — kein Auto-Dismiss
- [ ] Wenn TTS läuft: Text mindestens so lange zeigen wie die Audioausgabe

### 4. Täglicher Leadership-Check-In bricht ab 🔍

**Gemeldet von Julia und Elias.** Julia: Analyse startet bei 19 Wörtern
nicht, wiederholtes Klicken auf „analysieren" bewirkt nichts, auch mit
mehr Wörtern nicht.

- [ ] Reproduzieren, Server-Logs zu `/api/checkin/*` prüfen
- [ ] Falls eine Mindestwortzahl greift: Grenze **vor** dem Klick anzeigen
      („noch 6 Wörter") statt den Button ins Leere laufen zu lassen
- [ ] Button-State: während der Analyse deaktivieren und Spinner zeigen

### 5. Elias: 10 Kernfunktionen ohne Antwort 🔍

Elias meldet in Folge: WladBot antwortet nicht (mit und ohne Kontext),
Playbook „Schwieriges Mitarbeitergespräch", WladBot-Icon unten rechts,
Check-In, KI-Aufgabe generieren, Simulationen (SEXIER), Challengers-Chat,
Videoanalyse, Workflow. Danny bestätigt zwei davon.

**Das ist entweder ein kaputtes Konto/Environment oder zehn echte Bugs —
und der Unterschied ist wichtig.** Aus dem Code allein nicht entscheidbar.
Auffällig: alle betroffenen Endpunkte sind LLM- oder credit-gebunden.

- [ ] Mit Elias' Account reproduzieren und Logs korrelieren
- [ ] Prüfen: LLM-Provider-Key/Quota auf Emergent, Credit-Stand des Kontos
- [ ] **Unabhängig vom Ergebnis:** Fehlerbehandlung härten. Acht Endpunkte
      werfen `402 no_credits` (`challenge30`, `challengers`, `chat`,
      `simulations`, `tools` ×2, `video`, `voice_tts`). Im Frontend gibt es
      nur an **drei** Stellen eine 402-Behandlung (`lib/api.js` global,
      `ChatPage`, `useVoiceMode`). Wo der globale Paywall-Event nicht
      sauber gerendert wird, sieht „keine Credits mehr" aus wie „kaputt" —
      genau das Bild, das Elias beschreibt

---

## P1 · Vor dem Masterclass-Rollout

### 6. Onboarding-Video ⭐ meistgewünschtes Feature

**Gewünscht von 4 Testern** (Bennet, Dominik, Selina, Elias). Bennet hat
es sogar mit dem SEXIER-Modell durchargumentiert; Elias sagt „die Tour
erklärt nicht ausreichend".

- [ ] 3–5-Min-Video für den Erst-Login, **modular in 6 Clips à 20–40 Sek.**
      (Bennets Einwand-Widerlegung: kurze Clips bleiben aktualisierbar und
      per Sprungmarke nachschlagbar)
- [ ] Unter jedem Clip 3 Stichpunkte als Text-Backup
- [ ] Zweites Video für den Sales-Cycle (zwischen Setting und Closing) —
      Kontext liegt laut Bennet im Sheet „Bennet x Wlad"

### 7. Weitere bestätigte Bugs

- [ ] **PDF-Feedback: Textfelder überlappen** (Manuel, Carolin) — Layout
      des PDF-Generators
- [ ] **KI-Aufgaben generieren funktioniert nicht** (Elias, Julia)
- [ ] **Termin/Beratungsgespräch nicht buchbar** (Selina, Dominik) — Button
      meldet „noch nicht verfügbar"; Dominik zusätzlich: falsche
      Farbhinterlegung beim 15-Min-Strategiegespräch-Button
- [ ] **Ergebnisse der Leadership-Diagnose werden nicht angezeigt** (Dominik)
- [ ] **Event doppelt in der Liste** (Selina) — ✅ plausible Ursache
      gefunden: `backend/routes/events.py` seedet mit `insert_one` ohne
      Unique-Index auf `event_id`, und `_seed_events_v2()` wird an **zwei**
      Stellen aufgerufen (Zeile 426 und 459). Fix: Unique-Index auf
      `event_id` + `update_one(..., upsert=True)` statt `insert_one`
- [ ] **Dark Mode: Schrift im Menü kaum sichtbar** (Lars) — Kontrastfehler
- [ ] **Falsche Support-Adresse:** WladBot nennt `info@argumentorik.com`,
      richtig ist `support@argumentorik.com` (Carolin). Steht **nicht** im
      Repo-Code → sitzt im RAG-Korpus oder System-Prompt. Korpus prüfen
      (`docs/app/RAG_KNOWLEDGE_FLOW.md`)
- [ ] **Workflows: Daten müssen jedes Mal neu eingegeben werden** (Manuel)
      — macht den E-Mail-Optimierer, der Zeit sparen soll, langsamer als
      manuelles Schreiben. Eingaben pro Nutzer speichern und vorbelegen
- [ ] **Vorname wird klein geschrieben** (Selina)
- [ ] **Onboarding-Video hat am Ende eine Wiederholung** — wirkt wie ein
      Fehler (Carolin)

### 8. UI wirkt anklickbar, ist es aber nicht (Carolin)

- [ ] Onboarding Seite 2: die vier Felder „Wlad. Immer an deiner Seite."
      sehen aus wie Auswahlkacheln
- [ ] Chat: einzelne WladBot-Antworten wirken selektierbar/anklickbar

---

## P2 · UX & Positionierung

### 9. „Überladen und unübersichtlich" — 4 Tester

Selina, Elias, Danny und Lars sagen unabhängig dasselbe: zu viel auf
einmal, unklar wann man welchen Tab benutzt.

- Selina: „nicht eindeutig, wann ich WladBot, wann Coaching, wann
  Simulation nutze" — sie kam über *Coaching → rechts Simulation* dorthin
- Elias: „cleaneres/minimalistischeres Design, ggf. weniger Inhalte, dafür
  ein runderes Gesamtpaket"
- Danny: Funktionen links ein-/ausblendbar machen, Dashboard selbst
  zusammenstellen
- Lars/Manuel: Antworten sind ein „Overload", weniger ist mehr

- [ ] Informationsarchitektur überarbeiten: klare Trennung WladBot /
      Coaching / Simulation, statt drei Einstiege in dasselbe
- [ ] Sidebar-Einträge ein-/ausblendbar (Danny)
- [ ] **Antwortlänge und Sprachniveau an den Nutzer anpassen** (Manuel:
      „30 Sekunden geredet, dann Antwort-Overload und zu komplex
      formuliert"; Lars: „bisschen klarere Antworten")
- [ ] Bei Aufgaben direkt eine Schaltfläche „Umsetzen/Üben" (Manuel)

### 10. Credits sind intransparent (Selina)

- [ ] Sichtbar machen, **wofür** ein Credit verbraucht wird — Selina war
      nach wenigen Suchen leer und konnte danach trotzdem weiter
      trainieren, was den Zähler unglaubwürdig macht
- [ ] Wording „Upgrade" ersetzen: klingt für bestehende Nutzer verwirrend
      („Ich bin doch schon drin"). Vorschlag von Selina: **„Voller Zugriff
      freischalten"**
- [ ] Klären, was Free-User testen können sollen — Selina konnte Teile
      nicht testen und wusste nicht, ob das Absicht ist

### 11. Zielgruppen-Auswahl unvollständig (Selina)

`frontend/src/pages/OnboardingPage.js:37` bietet u. a. „Angehende
Führungskraft". Soloselbstständige, die sich selbst führen und später ein
Team aufbauen, finden sich darin nicht wieder — **in der Leader-Diagnose
gibt es die Option bereits**, im Onboarding nicht.

- [ ] Option ergänzen oder „Angehende Führungskraft" um Selbstständige
      erweitern — die beiden Flows sollten dieselben Rollen kennen

---

## 💬 Entscheidungen für Wlad (kein Code)

1. **Brand-Farben** — Selina, Julia und Danny stoßen sich unabhängig daran,
   dass LeaderOS nicht in den Argumentorik-/Wlad-Farben gehalten ist. Das
   ist bewusst so entschieden (`frontend/DESIGN.md`, Athletic-Editorial mit
   Lime-Akzent). **Entweder** die Entscheidung steht und wird dem Team
   erklärt, **oder** wir ziehen das Design ans Brand heran. Drei von neun
   Testern sind zu viele, um es unkommentiert zu lassen.
2. **Nicht-Masterclass-Nutzer** (Dominik) — dürfen Externe LeaderOS nutzen?
   Wenn ja: Funnel mit Terminbuchung direkt in der App.
3. **AI-Skills als eigener Kursstrang** (Bennet) — täglicher AI-Skill
   unabhängig von der 30-Tage-Challenge, in der Abschlussprüfung abgefragt
   und aufs Zertifikat („hat sich im Bereich KI ausbilden lassen").
   Bennets Argument: Firmen finanzieren eher, wenn Führung **und** KI
   kombiniert sind.
4. **Theming/Dark Mode als Feature** (Danny) — Nutzer die Oberfläche
   mitgestalten lassen, damit es nicht wie ein gekauftes Produkt wirkt.

## Bereits erledigt (im Doc als FIXED markiert)

- Wiederanmeldung über Lizenzschlüssel (Dominik)
- Zu wenige Kontextfelder → Freitextfeld „über mich" (Bennet)

---

## Phase 2 · Weg von Emergent, hin zu Supabase

Noch **nicht** starten — erst das Feedback abarbeiten. Aber die Größe
sollte vorher bekannt sein, denn sie ist erheblich:

| Was | Ist-Zustand |
| --- | --- |
| Backend | FastAPI, **27.581 Zeilen Python**, gehostet auf Emergent |
| Primärdatenbank | **MongoDB Atlas, ~57 Collections** (`users`, `chat_sessions`, `credits`, `challenge30_progress`, `events`, `simulations`, `tasks`, `referrals`, …) |
| Supabase heute | Parallel im Einsatz — Auth, `public.users`, RAG/pgvector, Object Storage, Sync (10+ Backend-Dateien) |

Es läuft also bereits **zweigleisig**: Identität und RAG in Supabase
Postgres, der operative Rest in Mongo. „Komplett auf Supabase" heißt
konkret:

- [ ] Inventur: welche der ~57 Collections sind aktiv, welche tot?
      (Erfahrungsgemäß ist ein spürbarer Teil davon Altlast — das ist der
      billigste Weg, den Migrationsumfang zu senken)
- [ ] Pro Collection ein Postgres-Schema entwerfen — Mongo ist
      schemalos, die Felder müssen erst festgestellt werden
- [ ] Entscheidung: FastAPI behalten (dann nur DB-Migration + neues
      Hosting) **oder** auf Supabase Edge Functions umbauen (dann ist es
      eine Neuimplementierung von 27k Zeilen). Das sind völlig
      verschiedene Projekte — der erste Weg ist Wochen, der zweite Monate
- [ ] Migrationsreihenfolge + Dual-Write-Phase, damit kein Nutzerzustand
      verloren geht
- [ ] `email_lower` bleibt der Dedup-Schlüssel über alles (CLAUDE.md §5)

**Empfehlung zur Reihenfolge:** erst P0 + P1 abarbeiten und an die
Masterclässler ausliefern, dann migrieren. Eine Migration unter offenen
Bugs verdoppelt die Fehlersuche — bei jedem Problem stellt sich dann die
Frage, ob es der Bug war oder die Migration.
