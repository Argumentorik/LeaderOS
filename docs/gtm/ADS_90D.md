# 90-Tage Ads-Playbook · LeaderOS

3 parallele Funnels, je 3 Creatives pro Plattform, A/B-fähig.
Alle CTAs landen auf `leader-check.de/?utm_source=…&utm_medium=…&utm_campaign=…`
(Diagnose = KPI). Conversion-Tracking via PostHog → `users.meta_tags`.

## Funnel 1 · KI-COACH

**Hook**: „Dein KI-Coach wartet nie bis Montag."

### Meta (FB/IG) — 1:1 Square + 9:16 Reel
```
HEADLINE: 24 Stunden. 7 Tage.
PRIMARY  : WladBot kennt die Methodik von 3× SPIEGEL-Bestseller Wlad
           Jachtchenko. Antwort in < 3 Sek. Auf Deutsch + Englisch.
DESC     : 5-Min-Diagnose. Kostenlos. Kohorte 02 öffnet bald.
CTA-BTN  : Diagnose starten
URL      : leader-check.de/?utm_source=meta&utm_campaign=ki-coach
```

### LinkedIn Single Image
```
HEADLINE: Dein KI-Coach wartet nie bis Montag.
INTRO   : Wlads Methodik live in deiner Tasche. Nach 5-Min-Diagnose
          weißt du, wo du stehst — und welcher Sprint zu dir passt.
CTA-BTN : Diagnose starten
```

### LinkedIn Video Ad (15 Sek Storyboard)
```
0–2s   Close-Up Handy, WladBot-Chat öffnet sich
2–5s   Texteinblendung: „24 Stunden. 7 Tage."
5–10s  Quick-Cuts: Frage tippen → Antwort in Wlads Stimme
10–13s WLAD-Brand-Mark, Tagline „KI-nativ führen."
13–15s CTA-Card: „leader-check.de"
```

---

## Funnel 2 · SPIEGEL

**Hook**: „3× SPIEGEL-Bestseller. Live. In deiner Tasche."

### Meta — Carousel (5 Cards)
```
Card 1: COVER „Weiße Rhetorik"      | Tag: Wlad's Klassiker
Card 2: COVER „Dunkle Rhetorik"     | Tag: 80.000 Verkäufe
Card 3: COVER „5 Rollen"            | Tag: Identitäts-Framework
Card 4: WLADBOT-Chat-Screen         | Tag: Jetzt als KI-Coach
Card 5: CTA „leader-check.de"
```

### LinkedIn Single Image
```
HEADLINE: Die Methodik aus 3 SPIEGEL-Bestsellern. Jetzt 24/7.
PRIMARY : Wlad Jachtchenko hat seine Bücher in WladBot gegossen.
          2212 RAG-Chunks, GPT-5.2, Voyage-3 Embeddings.
          Antwort in Wlads Stimme. Auf deine Situation.
CTA-BTN : Mehr erfahren
```

### LinkedIn Document Ad (5-Seiten PDF Lead-Magnet)
```
Seite 1: „SEXIER — das Argumentations-Modell" (Wlad-Original-Auszug)
Seite 2: 5 ROLLEN — Identitäts-Test
Seite 3: BWW-Feedback-Formel
Seite 4: Wlads 4 Farben (Persönlichkeits-Filter)
Seite 5: CTA + leader-check.de
```

---

## Funnel 3 · BIB 0001

**Hook**: „Startnummer 0001 ist noch frei."

### Meta — 1:1 Square (Specimen-Style)
```
VISUAL : Schwarze BIB-Plate „0001" auf weißem Hintergrund (Mockup-Style)
HEADLN : Dreißig Tage. Ein neues Du.
PRIMARY: Sprint 0001 = 30 Tage Wlad-Methodik mit WladBot als Coach.
         Tägliche Drills. Zertifikat 0001. LinkedIn-ready.
CTA-BTN: Startnummer holen
```

### Meta — 9:16 Reel (15 Sek)
```
0–3s   BIB-Plate „0001" Animation (Zoom-In)
3–7s   Text: „Jeden Tag 1 Frage. 1 Drill. 1 Reflexion."
7–11s  Quick-Cuts: Phone + WladBot-Chat
11–13s Zertifikat-Mockup mit Wlad-Unterschrift
13–15s CTA „leader-check.de"
```

### LinkedIn Sponsored Content
```
HEADLINE: Sprint 0001 — Startnummer für deine Führungs-Evolution.
INTRO   : 30 Tage. Wlads Methodik. WladBot als 24/7-Coach.
          Zertifikat 0001. Kohorte 01 voll, Kohorte 02 startet bald.
CTA-BTN : Frühzugang sichern
```

---

## Budget-Plan (Empfehlung Start)

```
Woche 1–2 · Validierung
  - Meta:     €30/Tag × 3 Funnels = €90/Tag → €1 260 / 14 Tage
  - LinkedIn: €40/Tag × 2 Funnels = €80/Tag → €1 120 / 14 Tage
  - Total:    €2 380 in den ersten 14 Tagen
  - KPI:      CPL < €15 (Cost per Diagnose-Lead)

Woche 3–6 · Skalierung Top-Performer
  - Auf die 3 besten Creatives skalieren auf €100/Tag × 4 Wochen
  - Total:    €8 400
  - KPI:      Diagnose-Completion-Rate > 60%

Woche 7–13 · Always-On + Retargeting
  - Top-2-Creatives + Retargeting auf Diagnose-Abbrecher
  - Retargeting: €50/Tag × 7 Wochen → €2 450
  - Always-On:  €150/Tag × 7 Wochen → €7 350
  - Total:      €9 800

GESAMT 90 TAGE: ~€20 580
```

## Tracking & Optimierung

| Metrik                  | Quelle             | Optimieren auf      |
|-------------------------|--------------------|----------------------|
| Impressions             | Plattform-Ads      | Reichweite         |
| CTR                     | Plattform-Ads      | Hook-Stärke        |
| Diagnose-Completion     | PostHog            | Funnel-Conversion  |
| Sprint-Sign-Up          | `users` Tabelle    | Endziel            |
| LTV / Cohort            | Supabase + PostHog | Skalierungs-Entscheid|

UTM-Konvention:
- `utm_source` = meta · linkedin · twitter
- `utm_medium` = cpc · social
- `utm_campaign` = ki-coach · spiegel · bib-0001
- `utm_content` = ad-id (rotation tracking)

## Creative-Pipeline

Jede Woche 3 frische Creatives pro Funnel:
1. **Mo**: Variation des Hooks (selber Visual, neuer Text)
2. **Mi**: Variation des Visuals (selber Text, neuer Hero)
3. **Fr**: Frischer Wlad-O-Ton (15-Sek Podcast-Clip mit Untertiteln)

Generierungs-Workflow:
- Specimen-Frame-Vorlage aus `frontend/src/components/landing/BenefitVisual.js`
- Hero-Bilder via Higgsfield (Brand-Prompt im Style-Guide)
- Video-Cuts via Personal Clipper (Higgsfield Tool)
- Copy via WladBot mit Prompt „Schreibe Ad-Copy für Funnel X, Hook Y"

## Compliance & Brand-Safety

- Keine Vorher-Nachher-Vergleiche (€-Versprechen)
- Keine Garantien („Du wirst CEO")
- Keine Stockfotos von „glücklichen Führungskräften"
- Brand-Mark + Wlad-Foto in jeder Ad
- DSGVO: Lead-Capture nur über leader-check.de (Server-Side Tracking)
