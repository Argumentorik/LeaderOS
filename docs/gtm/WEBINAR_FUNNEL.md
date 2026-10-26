# Webinar Ascension Funnel — Struktur, Assets, offene Aufnahmen

Stand: Oktober 2026 (Seiten-Rebuild 2026-10-20). Der `/webinar`-Funnel folgt dem Hormozi-Prinzip:
**Hook → Problem eskalieren → Neue Opportunity → Beweis → Mechanismus →
Value Stack → CTA → Risk Reversal → CTA → Follow-up.**

Kernidee: **Das Webinar ist nicht das Produkt.** Jede Stufe verkauft die
nächste — nie einen "neuen Kauf", immer den logischen nächsten Schritt.

## Die Ascension-Treppe

```
Ad / Organic / QR-Ticket-Anzeige
        ↓
/webinar               (Landing · Hook + Problem + Opportunity + Value Stack)
        ↓
Opt-in                 (E-Mail · routes/webinar.py → Bestätigung + Kalender)
        ↓
/webinar/danke         (Schritt 1: 4-Videoserie freischalten · Referral-Share · Schritt 2: Trial)
/webinar/live          (Warteraum · Countdown, Ablauf, Kalender, Late-Registration —
                        WEBINAR_JOIN_URL env auf https://leader-os.de/webinar/live setzen,
                        damit die Reminder-Mails hierher zeigen)
        ↓
4 kostenlose Videos    (/fuehrung-beginnt-hier · 1 Video/Tag per Mail)
        ↓
Live-Webinar 26.11.    (Live-Demo + Q&A + Leader-Check-Empfehlung)
        ↓
Follow-up-Mail         (Tag danach · services_email.webinar_followup_email)
        ↓
Leader-Check           (kostenlos · personalisierte Auswertung)
        ↓
14-Tage-Trial          (leaderos.de/signup?trial=14)
        ↓
30-Tage-Challenge      (997 €)
        ↓
Leadership Plus Pro    (4 797 € · 12 Monate)
```

## Ehrlichkeits-Regeln (nicht verhandelbar)

Der Funnel verkauft hart, aber lügt nie:

- **Keine erfundenen Testimonials.** Solange keine echten (Video-)Testimonials
  vorliegen, zeigt die Seite verlinkte Review-Plattformen (Trustpilot 4,9/388,
  Greator 4,7/995) und die verifizierte Kunden-Wordmark-Liste.
- **Keine Fake-Scarcity.** Kein "Nur noch 18 Plätze!"-Zähler und seit dem
  Rebuild 2026-10 auch keine Kapazitätsanzeige mehr (die Zahl aus
  `/api/webinar/stats` war ehrlich, aber unter 25 Anmeldungen nur schädlich).
  Einziger Zeitbezug: "Noch N Tage", einmal beim Laden berechnet, kein
  tickender Countdown. Die Live-Gründe sind echt: keine Aufzeichnung,
  Live-Q&A, Live-Case.
- **Lead-Erfassung mit Netz und doppeltem Boden.** Primär
  `POST /api/webinar/register` (FastAPI auf Emergent: Mongo, Bestätigung,
  Erinnerungen, Meta CAPI). Antwortet das Backend nicht oder kennt die Route
  nicht (404, solange der Emergent-Deploy hinter `mvpcode` liegt), geht die
  Adresse an `/api/newsletter/subscribe` (Supabase-Edge-Function) mit
  `source=webinar-lp`, `campaign=webinar-2026-11-26`. Die Danke-Seite bekommt
  dann `?v=f` und verspricht keine Mails, die niemand verschickt. Fallback-
  Leads vor dem Webinar manuell aus der Newsletter-Tabelle nachziehen.
- **Keine Fake-Exklusivität bei den 4 Videos.** Die Serie ist frei über
  /fuehrung-beginnt-hier erhältlich. Formulierung daher: "schaltest du direkt
  auf der Bestätigungsseite frei" (wahr) — nicht "nur Teilnehmer erhalten sie"
  (falsch).
- **Alle Zahlen aus dem verifizierten Set:** 400.000+ Klienten, 20+ Länder,
  3× SPIEGEL-Bestseller, 4,9/5 Trustpilot (388), seit 2007 im Coaching.
  "13 Bücher" bleibt bis zur Klärung der Buchlisten-Diskrepanz (Canon,
  offener Punkt 2) draußen; "3× TEDx" ist nicht im Canon und wird nicht
  verwendet. Kanon: `docs/gtm/WLAD_CANON.md`.

## Fehlende Assets (Aufnahmen für Wlad / Team)

### 1. Hero-Video · 90 Sekunden (PRIORITÄT 1)

Seit dem Rebuild 2026-10 trägt der Hero das echte Wlad-Porträt
(`/wlad/wlad-portrait.webp`), kein Video und kein KI-generiertes Material.
Das skriptete 90-Sekunden-Video bekommt seinen Platz direkt unter dem Hero,
sobald es gedreht ist (`frontend/src/pages/WebinarPage.js`).

**Script (canon-geprüft):**

> Ich habe über 400.000 Führungskräfte trainiert.
>
> Und irgendwann ist mir aufgefallen: Das Problem ist fast nie fehlendes
> Wissen.
>
> Jeder weiß, dass man Feedback geben sollte. Jeder weiß, dass man Konflikte
> früh anspricht. Jeder weiß, dass gute Kommunikation wichtig ist.
>
> Warum passiert es trotzdem nicht?
>
> Weil Führung nicht gelernt wird. Sie wird trainiert.
>
> Genau dafür haben wir LeaderOS entwickelt.
>
> Im Webinar zeige ich dir zum ersten Mal live unser gesamtes System.
>
> [CTA-Einblendung: Ja, ich möchte teilnehmen — kostenlos]

Regieanweisung: direkt in die Kamera, ein Take-Gefühl, kein Musikbett unter
der Stimme, Schnittbilder optional (Bühne/Training), Untertitel einbrennen
(80 % schauen stumm).

### 2. Live-Demo-Video · 2-3 Minuten (PRIORITÄT 2)

Screencapture-Tour mit Voice-over, keine Standbilder. Shot-List:

1. Dashboard (Öffnen, Tagesüberblick)
2. WladBot-Chat (echte Frage → Antwort mit Framework)
3. Simulation (Konfliktgespräch durchspielen)
4. Feedback/Score nach der Simulation
5. 30-Tage-Challenge (Tagesansicht)
6. Playbooks + Video-Analyse (kurz)
7. Community + Leader-Check (kurz)

Einbau: eigene Sektion zwischen "Value Stack" und "Teilnehmer-Bonus" auf
`/webinar`, gleiche Video-Card-Optik wie der Hero.

### 3. Video-Testimonials (PRIORITÄT 3)

Ziel-Format: 30-60 Sekunden, Gesicht + Name + Rolle, Outcome-Sätze statt
"tolles Webinar" — z. B. Richtung: "Endlich weiß ich, was ich täglich tun
muss." Erst wenn ECHTE Aufnahmen mit Einverständnis vorliegen, bekommt die
Seite eine Testimonial-Sektion. Bis dahin bleiben die Review-Plattformen der
Social Proof.

### 4. Persönliches Danke-Video · 20-30 Sekunden (NICE TO HAVE)

Für /webinar/danke: "Perfekt, bis zum Webinar! Damit du maximal profitierst,
schau dir vorher die vier Videos an." Ersetzt dann den Text-Intro der
Bonus-Sektion.

## Seiten-Struktur /webinar (implementiert · Rebuild 2026-10)

Athletic-Editorial-DNA (`frontend/DESIGN.md`): echte Fotografie, Hairline-
Zeilen statt Karten, Mono-BIB-Codes statt Icons, Pill-CTAs, kein Countdown-
Ticken, kein Glas, kein KI-generiertes Bildmaterial.

1. **Hero** — echtes Wlad-Porträt, Vierzeiler "Trainiere Führung. Nicht nur
   Wissen.", E-Mail-Formular im ersten Viewport (mobil und Desktop),
   Fakten-Zeile (26. Nov · 10:00 · 90 Min · 0 € · Noch N Tage)
2. **Beweis** — fünf verifizierte Zahlen als Typo-Zeile, Kunden-Logowand,
   Review-Links (Trustpilot, Greator)
3. **Problem** — "Du weißt, wie Führung geht. Du kommst nur nicht dazu." +
   Mo–Fr-Woche als Hairline-Zeilen (Freitag invertiert), Foto
4. **Statement-Band** — "Seminare verändern Wissen. Noch kein Verhalten."
5. **Neue Möglichkeit** — "Führung ist trainierbar. Wie Fitness." + alter
   Weg vs. LeaderOS, Link zu /kurse, Foto
6. **Inhalte** — sechs Themen mit Bild (Gespräche, KI-Coach, Simulationen,
   Challenge, Frameworks, Live-Q&A)
7. **Ablauf** — Agenda aus `data/webinarEvent.js`, Ink-Sektion mit Foto
8. **Value Stack** — sechs echte Leistungen, "Inklusive", Mid-Page-CTA
9. **Bonus** — die vier Videos mit Titeln + Laufzeiten
10. **Host** — Wlad, Bio nach Canon (keine "13 Bücher", kein TEDx), Porträt
11. **Statement-Band** — "Wissen wird gelehrt. Verhalten wird trainiert."
12. **Bücherregal** — `BookShelf` mit echten Covern
13. **Methodik** — vier Frameworks mit kanonischen Definitionen → Journal
14. **Warum live** — vier echte Gründe, kein Zähler
15. **FAQ** — sechs Fragen aus `data/webinarEvent.js` (FAQPage-Schema aktiv)
16. **Schluss** — "Sichere dir deinen Platz." auf Foto-Scrim + Formular
17. Sticky-Leiste, sobald das Hero-Formular aus dem Bild ist (Desktop mit
    Inline-Formular, mobil Button zum Schlussformular)

## Follow-up (implementiert · backend)

- Sofort: Bestätigung + Google-Calendar-Link (`routes/webinar.py`)
- 24h + 1h vorher: Reminder (`/api/cron/webinar-reminders`)
- Tag danach: `webinar_followup_email` → Trial-Brücke
  (`/api/cron/webinar-followup`)
