# 90-Tage Content-Strategie · LeaderOS

Quelle der Stimme: Wlad Jachtchenkos Frameworks (siehe `docs/app/SCHEMA.md` ·
2212 RAG-Chunks). Quelle der CTAs: `leader-check.de` (Diagnose, kostenlos).
Sprache: Du-Form, Deutsch. Tonalität: athletic editorial — direkt, ohne
Phrasen, mit Daten und Bildern.

## Strategischer Rahmen

Jede Woche **ein Wlad-Framework** als Thema. Jeder Tag **ein Drill**.
Jede Plattform **eine eigene Übersetzung** desselben Insights:

```
┌────────────┬────────────────────────────────────────────────────────┐
│ LinkedIn   │ Thought-Leadership · 80–120 Wörter · 1 Hook + 3 Bullets│
│            │ + 1 CTA. Berufliches Publikum, harte Punkte.           │
│            │ Best-Times: Di/Mi/Do 07:30 + 12:30                     │
├────────────┼────────────────────────────────────────────────────────┤
│ Instagram  │ Carousel-First · 8–10 Slides · 30–50 Wort Caption +    │
│            │ Story-Sequel. Visual = Specimen-Frame (BIB-Style).     │
│            │ Best-Times: Mo/Mi/Fr 08:00 + 19:00                     │
├────────────┼────────────────────────────────────────────────────────┤
│ Facebook   │ Story-First · 60–100 Wörter · persönlicher Tone, kein  │
│            │ Hashtag-Spam. Hier wohnen Wlads bestehende Fans.       │
│            │ Best-Times: Mo–Fr 10:00 + 17:00                        │
├────────────┼────────────────────────────────────────────────────────┤
│ X (Twitter)│ Punchline · 1–2 Sätze · ein Insight, eine Pointe.      │
│            │ Threads nur Mittwochs (Deep-Dive-Tag).                 │
│            │ Best-Times: Mo–Fr 09:00 + 13:00 + 20:00                │
└────────────┴────────────────────────────────────────────────────────┘
```

**Universal-CTA-Reihenfolge** (jeder Tag rotiert):

1. `→ leader-check.de` (kostenlose 5-Min-Diagnose)
2. `→ WladBot starten` (auf leader-os.de — wenn Account existiert)
3. `→ Sprint 0001 freischalten` (nach Diagnose-Abschluss)

## 13-Wochen Themenarc

| Woche | Theme              | Framework           | Hauptfrage                    |
|------:|--------------------|---------------------|-------------------------------|
| 01    | Argumentieren      | SEXIER              | Wie überzeuge ich?            |
| 02    | Rolle finden       | 5 ROLLEN            | Wer bin ich beruflich?        |
| 03    | Feedback geben     | BWW-Formel          | Wie sage ich's ohne zu kränken? |
| 04    | Reden halten       | 3 SÄULEN            | Logos · Ethos · Pathos        |
| 05    | Aktiv zuhören      | 10 STUFEN           | Höre ich wirklich zu?         |
| 06    | Missverständnisse  | KOMM-QUADRAT        | Vier Ohren, vier Welten       |
| 07    | Manipulation       | DUNKLE RHETORIK     | Wie erkenne ich Tricks?       |
| 08    | Menschen lesen     | 4-FARBEN            | Welcher Typ ist mein Gegenüber? |
| 09    | Schlagfertigkeit   | VERBALE REFLEXE     | Was sage ich JETZT?           |
| 10    | Zeit-Methodik      | ALPEN               | Wie strukturiere ich den Tag? |
| 11    | Verhandeln         | HARVARD-METHODE     | Win-Win statt Konflikt        |
| 12    | KI-Native werden   | LEADEROS           | KI als Co-Pilot der Führung   |
| 13    | Trust + Sprint     | SOCIAL PROOF        | Was Teilnehmer berichten      |

90 Tage = 13 Wochen × 7 Tage = **91 Tage**. Tag 91 ist Launch-Recap.

## Per-Tag-Format

Jeder Tag hat eine **Headline** (gemeinsam für alle Plattformen) und
**4 platzspezifische Bodies**. Beispiel-Tag siehe `CONTENT_90D.md`.

## Asset-Generierung

- **Hero-Visuals**: Higgsfield `generate_image` mit Brand-Prompt
  („athletic editorial, B&W, harte Schatten, BIB-Style, Outfit/Inter
  900 italic, lime accent #C6FF00") — 1 Visual pro Tag.
- **Carousel-Slides**: Specimen-Sheet-Template (im Repo: siehe
  `frontend/src/components/landing/BenefitVisual.js`). Re-use als
  Figma-Vorlage oder direkter Screenshot der Landing-Sections.
- **Reels/Shorts**: 15–30 Sek., immer mit Wlad-O-Ton aus seinem
  Podcast (Lizenz: eigene Inhalte).

## Ad-Strategie (90-Tage)

Drei parallele Funnels:

| Ad-Set       | Plattform        | Hook                                | Ziel-URL                         |
|--------------|------------------|-------------------------------------|----------------------------------|
| `KI-COACH`   | Meta + LinkedIn  | „Dein KI-Coach wartet nie."         | leader-check.de/?utm=ad-kicoach  |
| `SPIEGEL`    | Meta + LinkedIn  | „3× SPIEGEL-Bestseller. Live."      | leader-check.de/?utm=ad-spiegel  |
| `BIB-0001`   | Meta + LinkedIn  | „Startnummer 0001 ist noch frei."   | leader-check.de/?utm=ad-bib      |

Budget-Empfehlung Startphase: €30/Tag pro Set, A/B mit je 3 Creatives.
Skalierung nach CPL — Diagnoses sind das KPI (Conversion zu `users`
mit `meta_tags @> ARRAY['leader-check']`).

Volltexte für die 9 Initial-Ads → `docs/gtm/ADS_90D.md`.

## Posting-Quelle

Alle Posts → `docs/gtm/CONTENT_90D.md` (Tag 1–91). Format pro Tag:

```
## DAY N · YYYY-MM-DD · WOCHE X · FRAMEWORK
Headline: <gemeinsamer Hook>
🟦 LinkedIn: <80–120 Wörter>
🟪 Instagram: <Carousel-Outline + Caption>
🟦 Facebook: <60–100 Wörter>
⬛ X: <≤280 Zeichen>
CTA: <gewählter CTA dieser Tag-Rotation>
```
