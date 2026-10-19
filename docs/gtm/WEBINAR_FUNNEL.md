# Webinar Ascension Funnel — Struktur, Assets, offene Aufnahmen

Stand: Juli 2026. Der `/webinar`-Funnel folgt dem Hormozi-Prinzip:
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
Live-Webinar 29.10.    (Live-Demo + Q&A + Leader-Check-Empfehlung)
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
- **Keine Fake-Scarcity.** Kein "Nur noch 18 Plätze!"-Zähler. Die
  Kapazitätsanzeige kommt live aus `/api/webinar/stats` (echte Anmeldungen
  gegen echte Zoom-Kapazität). Die Live-Gründe sind echt: keine Aufzeichnung,
  Live-Q&A, Live-Case.
- **Keine Fake-Exklusivität bei den 4 Videos.** Die Serie ist frei über
  /fuehrung-beginnt-hier erhältlich. Formulierung daher: "schaltest du direkt
  auf der Bestätigungsseite frei" (wahr) — nicht "nur Teilnehmer erhalten sie"
  (falsch).
- **Alle Zahlen aus dem verifizierten Set:** 400.000+ Klienten, 20+ Länder,
  13 Bücher / 3× SPIEGEL, 4,9/5 Trustpilot (388), seit 2007 im Coaching.
  Kanon: `docs/gtm/WLAD_CANON.md`.

## Fehlende Assets (Aufnahmen für Wlad / Team)

### 1. Hero-Video · 90 Sekunden (PRIORITÄT 1)

Aktuell nutzt der Hero das bestehende 30-Sekunden-Intro (Vimeo 1197728183).
Das skriptete 90-Sekunden-Video ersetzt es, sobald gedreht — ID in
`frontend/src/pages/WebinarPage.js` (`HERO_VIMEO_ID`) tauschen.

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

## Seiten-Struktur /webinar (implementiert)

1. **Hook** — Headline "Die meisten Führungskräfte trainieren nie." +
   Subheadline + CTA "Ja, ich möchte teilnehmen" + Risk-Reversal-Microcopy +
   Video direkt im Hero + Countdown + echte Kapazitätsanzeige + Formular
2. **Beweis** — Stat-Band (400k/20+/4,9/3×) + Kunden-Wordmarks + Review-Links
3. **Problem** — "Führung scheitert nicht am Wissen. Sie scheitert am Alltag."
   + Mo–Fr-Wochen-Story (Punchline Freitag, invertiert)
4. **Statement-Band** — "Seminare verändern Wissen. Nicht Verhalten."
5. **Opportunity** — "Was wäre, wenn Führung so trainierbar wäre wie Fitness?"
   + Triples (Nicht Motivation. Training. / …) + Seminar-vs-LeaderOS-Flow
6. **Mechanismus** — 5 Lern-Karten (Gespräche, KI-Coach, Simulationen,
   Challenge, Frameworks)
7. **Statement-Band** — "Die Zukunft gehört nicht den besten Führungskräften…"
8. **Value Stack** — "Im Webinar bekommst du Zugriff auf:" 6 echte Leistungen
   + Mid-Page-CTA
9. **Reveal** — die 4 Videos mit echten Titeln + Laufzeiten
10. **Story** — Über Wlad als Erzählung (UNO → Debating → 2007 → die
    Erkenntnis Wissen ≠ Verhalten → LeaderOS)
11. **Beweis II** — 4 Framework-Teaser mit kanonischen Definitionen →
    Journal-Deep-Dives
12. **Ehrliche Scarcity** — 4 echte Live-Gründe + Anti-Fake-Counter-Hinweis
13. **FAQ** — 5 Fragen (FAQPage-Schema aktiv)
14. **Final CTA** — "In einem Jahr wirst du sowieso geführt haben…" +
    Countdown + Formular
15. Sticky-Mobile-CTA durchgehend

## Follow-up (implementiert · backend)

- Sofort: Bestätigung + Google-Calendar-Link (`routes/webinar.py`)
- 24h + 1h vorher: Reminder (`/api/cron/webinar-reminders`)
- Tag danach: `webinar_followup_email` → Trial-Brücke
  (`/api/cron/webinar-followup`)
