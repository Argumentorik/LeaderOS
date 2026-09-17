# LeaderOS · Launch-Plan bis zum Webinar

> **Fixpunkt: Donnerstag, 15.10.2026, 10:00 Uhr — Live-Webinar.**
> Stand 24.08.2026 (Montag). **24 Tage, davon 17 Werktage.**
>
> Der Termin ist öffentlich, in Mails, JSON-LD und auf vier Seiten
> verdrahtet. Er ist die Deadline, nicht der Wunschtermin. Alles in
> diesem Plan ist rückwärts von ihm gerechnet.
>
> Detail-Backlog: [`app/FEEDBACK_BACKLOG.md`](./app/FEEDBACK_BACKLOG.md) ·
> Ads-Setup: [`gtm/GOOGLE_ADS_SETUP.md`](./gtm/GOOGLE_ADS_SETUP.md) ·
> Sichtbarkeit: [`gtm/SEO_AEO_PLAYBOOK.md`](./gtm/SEO_AEO_PLAYBOOK.md)

---

## 0. Die unbequeme Wahrheit vorweg

**Was das Projekt aufhält, ist überwiegend kein Code.** Die
Marketing-Maschine ist gebaut und wartet auf Zugänge und
Entscheidungen:

| Blocker | Typ | Wartet auf | Vorlaufzeit |
| --- | --- | --- | --- |
| Vercel Domain-Flip | 1 Klick | Zugang | Minuten |
| Google-Ads-Konto + AW-ID | Konto | Zugang | ~1 Tag |
| API-Keys auf Emergent | Konfiguration | Zugang | Minuten |
| Videos mit Wlad | Produktion | **Wlads Kalender** | **1–2 Wochen** |
| Brand-Farben-Entscheidung | Produkt | Wlad | 1 Gespräch |

**Die Videos sind der kritische Pfad.** Alles andere lässt sich in
Tagen erledigen; ein Drehtermin mit Wlad nicht. Wenn diese Woche kein
Termin steht, fällt Punkt 6 unten aus dem Plan — dann startet das
Webinar ohne Onboarding-Video, obwohl es der meistgewünschte Punkt des
Teams war (4 von 9 Testern).

**Deshalb ist Aufgabe Nr. 1 dieser Woche kein Ticket, sondern ein
Kalendereintrag.**

---

## 1. Ist-Stand · was steht bereits

Ehrlich getrennt nach „verifiziert live" und „gebaut, aber ungeprüft":

**✅ Live und verifiziert**
- Webinar-Termin 15.10. konsistent über 12 Dateien (inkl. Wochentag-Fix)
- `/fragen` — 9 Antworten als statisches HTML, von AI-Crawlern lesbar
- `/wladbot`, `/os`, `/app` — Kampagnenseiten, Lead-Formular verdrahtet
- 153 Journal-Artikel per Build-Prerendering crawlbar
- Bing entdrosselt, 6 zusätzliche AI-Crawler erlaubt
- IndexNow: **168 URLs, HTTP 202 bestätigt** — läuft bei jedem Push
- 7-Mail-Nurture-Journey + Cron
- CI-Gates: Build, Backend-Syntax, Lockfile, Secret-Scan, URL-Guard

**⚠️ Gebaut, aber noch nicht scharf**
- Google-Tag + Consent-Banner (Platzhalter-ID → lädt bewusst nichts)
- Lead-Mail-Zustellung (hängt an `RESEND_API_KEY` auf Emergent)

**❌ Offen**
- 80 GSC-Fehler „Seite mit Weiterleitung" (Domain-Flip)
- P0-Bugs aus dem MA-Feedback
- Alle vier Videos

---

## 2. Drei Arbeitsströme, drei Verantwortliche

Sie laufen **parallel**. Wer auf den anderen wartet, verliert die 24 Tage.

| | Strom | Inhalt | Wer |
| --- | --- | --- | --- |
| **A** | **Produkt** | P0/P1-Bugs aus dem MA-Feedback | Dev |
| **B** | **Marketing-Technik** | Domain, Ads, Tracking, Indexierung | Du + Dev |
| **C** | **Content** | 4 Videos, Anzeigentexte, Mails | Wlad + Marketing |

**Gate-Logik — was wovon abhängt:**

```
B-Domain-Flip ──► GSC validieren ──► saubere Rankings
                                          │
B-AW-ID ──► gtag scharf ──► Ads live ◄────┘   (braucht C-Anzeigentexte)
                              │
                              ▼
                        Traffic auf /wladbot
                              │
                              ▼
A-P0-Bugs gefixt ──────► Webinar 15.10. ──► Masterclass-Rollout
                              ▲
C-Videos ─────────────────────┘
```

Traffic vor gefixten P0-Bugs zu kaufen wäre der teuerste Fehler im Plan:
Ads bringen Leute auf eine Software, in der 5 von 9 Testern das Quiz
durchschaut haben. **Ads erst scharf schalten, wenn A abgeschlossen ist.**

---

## 3. Woche 1 · 24.–30.08 · „Zugänge und Diagnose"

Ziel: alle Fremdabhängigkeiten aufgelöst, echte Bug-Ursachen bekannt.

### Sofort (Tag 1, ~45 Minuten insgesamt)

- [ ] **Drehtermin mit Wlad blocken** — 2–3 Stunden für alle vier Videos
      in einem Rutsch. Ohne diesen Termin ist Strom C tot.
- [ ] **Vercel Domain-Flip**: Team `INHALE` → Projekt `leaderos` →
      Settings → Domains → `leader-os.de` „Set as Primary". Gleiches für
      `leader-check.de`. → löst **80 GSC-Fehler** auf einen Schlag
- [ ] **Google Ads Konto anlegen** (EUR, Zeitzone Berlin,
      **Expertenmodus**) → AW-ID notieren
- [ ] **Bing Webmaster Tools**: Domain per GSC-Import verifizieren
- [ ] **Emergent-Keys prüfen** — der wichtigste Diagnoseschritt:
      `EMERGENT_LLM_KEY`, `ELEVENLABS_API_KEY`, `RESEND_API_KEY`,
      `STRIPE_API_KEY`. Verdacht: mehrere der gemeldeten „Bugs" sind
      schlicht fehlende Keys

### Dev-Strom A

- [x] **Health-Check erweitert** ✅ *(24.08. erledigt)* — er kannte
      `ELEVENLABS_API_KEY` und `RESEND_API_KEY` gar nicht. Genau deshalb
      brauchte es vier Tester, um „Sprachausgabe kaputt" zu finden: ein
      fehlender Key sah aus wie ein Produktfehler. `/api/system/health`
      meldet jetzt `tts` und `email` mit — **nach dem Key-Check dort
      zuerst nachsehen**
- [ ] **Elias' 10 Ausfälle reproduzieren** — mit seinem Account, Logs
      dagegenhalten. Entscheidet, ob es ein Environment-Problem oder zehn
      Tickets sind. **Bis das geklärt ist, ist der Restaufwand unbekannt**
- [ ] **Quiz-Fix Teil 1 (Code)**: Positionen deterministisch
      randomisieren (`user_id + day`), Rück-Übersetzung serverseitig,
      Verteilungs-Test in CI

### Content-Strom C

- [ ] Skripte für die vier Videos schreiben (Vorlagen: Hero-Skript in
      `gtm/WEBINAR_FUNNEL.md`, Onboarding-Struktur von Bennet)
- [ ] Anzeigentexte final aus `gtm/GOOGLE_ADS_SETUP.md` §5 abnehmen

### 💬 Entscheidungen, die diese Woche fallen müssen

1. **Brand-Farben** — 3 von 9 stoßen sich daran. Entweder bleibt es bei
   Athletic-Editorial (dann ans Team kommunizieren, warum) oder wir ziehen
   es ans Argumentorik-Brand. **Nach Woche 1 wird es teuer**, weil bis
   dahin Anzeigen und Videos im aktuellen Look produziert sind.
2. **Dürfen Nicht-Masterclässler LeaderOS nutzen?** Bestimmt, ob Ads auf
   Selbstregistrierung oder auf Terminbuchung optimieren.
3. **AI-Skills als Kursstrang + Zertifikat?** Bennets Argument: Firmen
   finanzieren eher, wenn Führung **und** KI kombiniert sind. Wenn ja,
   gehört es in die Webinar-Story — also **vor** den 15.10.

---

## 4. Woche 2 · 31.08.–06.09 · „Bugs zu, Ads scharf"

- [ ] **Quiz-Fix Teil 2 (Redaktion)**: 232 Distraktoren auf Länge der
      richtigen Antwort bringen. LLM-gestützt mit menschlichem Review,
      ~1,5–2 Tage. *Ohne diesen Teil ist der Quiz-Bug nicht behoben —
      wer die längste Antwort wählt, liegt weiter zu 99 % richtig.*
- [ ] Audio-Modus: Antwort stehen lassen statt nach 2 Sek. ausblenden;
      Vorlesen aktivieren (setzt geprüften ElevenLabs-Key voraus)
- [ ] Check-In-Abbruch beheben, Mindestwortzahl **vor** dem Klick anzeigen
- [ ] Event-Duplikat: Unique-Index auf `event_id`, `insert_one` → `upsert`
- [ ] 402-Behandlung im Frontend vereinheitlichen (8 Endpunkte werfen sie,
      3 Stellen behandeln sie) — „keine Credits" darf nicht wie „kaputt"
      aussehen
- [ ] PDF-Layout, Dark-Mode-Kontrast, Support-Adresse im RAG-Korpus
      (`info@` → `support@argumentorik.com`), Vorname-Großschreibung
- [ ] **Videos drehen** (Termin aus Woche 1)
- [ ] **`AW_ID` eintragen** in `frontend/public/js/consent-gtag.js` +
      `/datenschutz` um den vorbereiteten Google-Ads-Absatz ergänzen
      (**muss im selben PR passieren**)
- [ ] Kampagnen S-01/S-02 anlegen, **Budget zunächst klein** (30 €/Tag)
- [ ] GSC: „Fehlerbehebung validieren" für „Seite mit Weiterleitung"

---

## 5. Woche 3 · 07.–13.09 · „Feinschliff und Generalprobe"

- [ ] P1-Reste: Onboarding-Kacheln entklickbar machen, Terminbuchung
      reparieren, Leadership-Diagnose-Ergebnisse anzeigen,
      Workflow-Eingaben speichern, Zielgruppe „Selbstständige" ergänzen
- [ ] Videos schneiden und einbauen (Onboarding modular in 6 Clips à
      20–40 Sek., je 3 Stichpunkte als Text darunter)
- [ ] **Zweiter Testlauf mit demselben Team** — dieselben 9 Personen,
      dieselbe Methode. Das ist die einzige ehrliche Erfolgskontrolle:
      finden sie die gemeldeten Punkte wirklich nicht mehr?
- [ ] Ads-Zwischenauswertung: CPL pro Kampagne aus `nurture_leads.campaign`
- [ ] **Generalprobe Webinar** (Technik, Zoom-Kapazität, `/webinar/live`)
- [ ] Reminder-Mails testen (T-24h, T-1h) — mit echtem Postfach

**Feature-Freeze: Freitag, 11.09.** Danach nur noch Bugfixes. Wer nach
diesem Datum ein Feature einbaut, riskiert das Webinar für eine
Funktion, die niemand vermisst hat.

---

## 6. Woche 4 · 14.–17.09 · „Ruhig bleiben"

- [ ] Mo 14.09.: letzter Deploy-Slot für Nicht-Notfälle
- [ ] Di 15.09.: Smoke-Test der gesamten Kette — Anzeige → `/wladbot` →
      E-Mail → `/wladbot/danke` → Leader-Check → Webinar-Anmeldung
- [ ] Mi 16.09.: Ads-Budget für die Webinar-Kampagne hochziehen,
      Reminder-Mail T-24h kontrollieren
- [ ] **Do 15.10., 10:00: Webinar.** Danach: Aufzeichnungsverzicht ist
      Teil des Versprechens — keine Aufzeichnung veröffentlichen
- [ ] Fr 16.10.: Nachfass-Mails, Leads auswerten, Masterclass-Rollout
      entscheiden

---

## 7. Danach · Phase 2 (nicht vorher anfangen)

Die Migration weg von Emergent ist **kein Launch-Thema**. Größe laut
Bestandsaufnahme: 27.581 Zeilen FastAPI, ~57 Mongo-Collections, während
Auth, RAG und Storage bereits auf Supabase laufen.

Die eine Entscheidung, die alles bestimmt:

| Weg | Bedeutung | Größenordnung |
| --- | --- | --- |
| FastAPI behalten | Nur DB-Migration + neues Hosting | **Wochen** |
| Edge Functions | Neuimplementierung von 27k Zeilen | **Monate** |

Erster Schritt ist in beiden Fällen derselbe und lohnt sich sofort:
**Inventur, welche der ~57 Collections überhaupt noch benutzt werden.**
Tote Collections sind der billigste Weg, den Migrationsumfang zu senken.

**Warum nicht parallel:** Bei jedem Bug stellt sich dann die Frage, ob es
der Bug war oder die Migration. Das verdoppelt die Fehlersuche genau in
den Wochen, in denen die ersten zahlenden Kunden auf die Plattform kommen.

---

## 8. Was den Termin kippen kann

| Risiko | Wahrscheinlichkeit | Gegenmaßnahme |
| --- | --- | --- |
| **Kein Drehtermin mit Wlad** | hoch | Diese Woche blocken. Fallback: Webinar ohne Onboarding-Video, Loom-Aufnahme statt Studio |
| **Elias' 10 Ausfälle sind echte Bugs** | mittel | Reproduktion in Woche 1 vorziehen — davon hängt der gesamte Restaufwand ab |
| **Quiz-Redaktion dauert länger** | mittel | Notfalls Teilmenge: die 30 Fragen der ersten Challenge-Woche zuerst |
| **Ads fressen Budget ohne Leads** | mittel | Klein starten, erst nach ≥30 Conversions auf „Conversions maximieren" |
| **Brand-Entscheidung kommt spät** | mittel | Deadline Ende Woche 1 — danach ist Material produziert |

---

## 9. Die kürzeste Fassung

**Wenn du diese Woche nur fünf Dinge tust:**

1. Drehtermin mit Wlad blocken
2. Domain-Flip in Vercel klicken
3. Google-Ads-Konto anlegen, AW-ID herausgeben
4. Alle vier API-Keys auf Emergent prüfen
5. Brand-Farben entscheiden

Punkt 1 bis 5 kosten zusammen unter zwei Stunden und lösen mehr auf als
zwei Wochen Entwicklung. **Alles andere kann parallel laufen — das hier
nicht.**
