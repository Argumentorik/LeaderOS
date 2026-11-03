# LinkedIn Ads · Webinar 26.11.2026 · Launch-Paket

> Schwester-Dokument zu `META_ADS_WEBINAR.md`. Gleiche 8 Angles, gleiche
> Ehrlichkeitsregeln, andere Plattform-Logik: LinkedIn ist 5–8× teurer pro
> Klick, trifft dafür Job-Titel statt Interessen. Hier steht, was sich
> dadurch ändert — und was am Montag im Campaign Manager eingetragen wird.
>
> Stand 06.09.2026 · Budgetannahme aus `RUNBOOK_ADS_CHANNELS.md` §2:
> **50 €/Tag**, eine Kampagne.

---

## 0. Warum LinkedIn überhaupt, bei diesem Budget

Meta liefert Reichweite, LinkedIn liefert **die richtige Person**: „Head
of", „Teamleiter", „Geschäftsführer" sind dort Zielgruppen-Filter, bei
Meta nur Vermutungen. Für ein Führungskräfte-Webinar ist das der Kanal,
auf dem der einzelne Lead am meisten wert ist — und am meisten kostet.

| | Meta | LinkedIn |
| --- | --- | --- |
| CPM DACH | 8–15 € | 60–120 € |
| CPC | 1,50–3 € | 6–10 € |
| Wer klickt | Interessierte | Führungskräfte mit Titel |
| Lead-Qualität fürs Webinar | mittel | hoch |
| Lernphase | 50 Conversions/Woche | keine harte Schwelle, aber 300 € Mindest-Signal |

Bei 50 €/Tag über 8 Tage sind das **400 €** → 40–70 Klicks → **6–20
Anmeldungen**, aber jede davon ist eine Person, die wir sonst nicht
erreichen. Das ist die ehrliche Rechnung. LinkedIn skaliert später,
wenn das Webinar-Angebot als Lead-Magnet bewiesen ist.

---

## 1. Kampagnenstruktur

```
Kampagnengruppe  LEADEROS-WEBINAR-2026-09
│
└─ Kampagne  WEBINAR-DACH-LEADERS                    50 €/Tag · Laufzeit 09.09.–26.11.
     Ziel: Website-Conversions (Conversion „Webinar-Lead", Insight Tag)
     Format: Single Image Ad (Sponsored Content)
     Sprache: Deutsch · Standort: DE, AT, CH
     Zielgruppe (§3): Job-Funktion + Seniorität + Unternehmensgröße
     Gebot: Maximale Auslieferung (automatisch) — Cost Cap erst ab W2
     Audience Expansion: AUS · LinkedIn Audience Network: AUS
     URL-Parameter: alle Ads tragen utm_source=linkedin (in der Ad-URL)
     Ads (4 aktiv): AD-D03-1.91x1-a · AD-B01-1.91x1-a · AD-C02-1.91x1-a · AD-A02-1.91x1-a
     Rotation: „Ads gleichmäßig ausspielen" für die ersten 5 Tage, danach „optimiert"
```

**Warum Website-Conversions statt Lead Gen Forms:** LinkedIn Lead Gen
Forms konvertieren 2–3× besser (Formular ist vorausgefüllt), aber die
Leads liegen dann im Campaign Manager — ohne Bestätigungsmail, ohne
Kalendereintrag, ohne Reminder, ohne `webinar_leads`. Alles, was die
Show-up-Rate trägt, fehlt. Erst wenn CPL auf der Website > 2× Ziel:
Lead Gen Form testen und per CSV-Export täglich in
`POST /api/webinar/register` nachtragen (manuell, kein Zapier).

**Warum nur 4 Ads:** 400 € Budget verteilt auf 8 Ads sind 50 € pro Ad —
das reicht für 5–8 Klicks, daraus liest niemand etwas. Vier Angles, zwei
Beweis (D03, C02), zwei Lehre (B01, A02).

---

## 2. Die Creatives

Im Ad-Studio `/ads` → Filter **Plattform → linkedin**. Daten in
`contentAds.js` (`LINKEDIN_ADS`), Format `1.91x1` = 1200 × 627 px.

| Ad-ID | Angle | LinkedIn-Headline (≤ 70) | Intro (≤ 150) |
| --- | --- | --- | --- |
| `AD-D03-1.91x1-a` | Webinar | Live-Webinar mit Wlad Jachtchenko · 26. November · kostenlos | ✅ |
| `AD-B01-1.91x1-a` | Seminar-Schmerz | Seminare ändern Wissen, nicht Verhalten. Live-Webinar am 26.11. | ✅ |
| `AD-A02-1.91x1-a` | Feedbackformel | Drei Sätze für jedes schwierige Gespräch · Live-Webinar | ✅ |
| `AD-A01-1.91x1-a` | SEXIER | SEXIER: sechs Schritte, ein vollständiges Argument · live | Reserve |
| `AD-C02-1.91x1-a` | 400.000+ | Wlad Jachtchenko live · 26. November · 90 Minuten · kostenlos | ✅ |
| `AD-C01-1.91x1-a` | SPIEGEL | Der Autor von „Weiße Rhetorik" live · kostenloses Webinar | Reserve |
| `AD-D01-1.91x1-a` | Leader-Check | Leader-Check: dein Führungsprofil in 10 Minuten · kostenlos | nicht in dieser Kampagne |
| `AD-D02-1.91x1-a` | Challenge | Führung trainieren wie Fitness · 14 Tage kostenlos testen | W2 |

**Die 1x1-Webinar-Ads (Meta) laufen auf LinkedIn unverändert** — 1:1 ist
dort ein Standardformat. Zwei Ratios pro Angle, ohne neues Design.

**CTA-Button:** „Registrieren" (D03, C01, C02) · „Mehr erfahren" (A01, A02, B01).

Intro-Texte bleiben unter 150 Zeichen, damit LinkedIn sie im Feed nicht
hinter „…mehr anzeigen" kürzt. Zeichenzahlen stehen unter jedem Tile im
Studio.

### 2.1 Document Ad · jetzt der Standard

Stand 29.09.: LinkedIn läuft nur noch mit Document Ads. Das 6-Seiten-PDF,
die Anlage und die Intro-Varianten stehen in `ADS_BING_LINKEDIN_WEBINAR.md`
§1. Die Seite `/frameworks` gibt es nicht mehr.

---

## 3. Zielgruppe

Eine Zielgruppe, präzise statt breit. LinkedIn bestraft kleine Audiences
nicht, es bestraft unklare.

| Filter | Wert |
| --- | --- |
| Standort | Deutschland, Österreich, Schweiz |
| Sprache Profil | Deutsch |
| Job-Funktion | Geschäftsführung, Betriebsleitung, Personalwesen, Projektmanagement, Vertrieb, Produktmanagement, Engineering |
| Seniorität | Manager, Direktor, VP, CXO, Inhaber |
| Unternehmensgröße | 11–10.000 (Mittelstand bis Konzern) |
| Ausschluss | Mitarbeiter von LeaderOS/Argumentorik · Job-Funktion „Marketing" (klickt Ads beruflich) |
| Geschätzte Größe | 400.000–900.000 — gut, nicht zu eng |

**Kein Audience Expansion, kein Audience Network.** Beides streckt das
Budget auf Leute außerhalb der Filter — genau das, wofür wir LinkedIn
nicht bezahlen.

**Retargeting** (Website-Besucher via Insight Tag) braucht ≥ 300 Personen
in der Audience, bevor LinkedIn ausliefert. Bei unserem Traffic frühestens
W2 — das Tag muss trotzdem **jetzt** live, sonst füllt sich nichts.

---

## 4. Tracking · Insight Tag

Gebaut, inert bis zur Partner-ID — gleiches Muster wie Meta-Pixel und
Google-Tag.

| Baustein | Wo | Status |
| --- | --- | --- |
| Insight Tag, consent-gated (Kategorie „Marketing") | `frontend/src/lib/linkedinInsight.js`, Boot in `index.js` | ✅ gebaut, inaktiv (Platzhalter) |
| Conversion „Webinar-Lead" | `trackLinkedInLead()` beim erfolgreichen Absenden auf `/webinar` | ✅ |
| UTM am Lead | `utm_source=linkedin&utm_content=<Ad-ID>` → `webinar_leads.utm` | ✅ |
| CSP | `vercel.json`: `snap.licdn.com`, `px.ads.linkedin.com`, `p.adsymptotic.com` | ✅ |

### 4.1 Scharfschalten

1. Campaign Manager → Analysieren → **Insight Tag** → Partner-ID (6–8 Ziffern).
2. Campaign Manager → Analysieren → **Conversions** → neue Conversion
   „Webinar-Lead", Typ „Lead", Methode **Ereignisspezifisch** (nicht
   URL-basiert — `/webinar/danke` trägt die E-Mail als Parameter, das
   wollen wir nicht als Matching-Regel). Conversion-ID notieren.
3. `LINKEDIN_PARTNER_ID` und `LINKEDIN_LEAD_CONVERSION_ID` in
   `frontend/src/lib/linkedinInsight.js` eintragen. Ein PR.
4. Datenschutz-Absatz (unten) im selben PR.
5. Test: `/webinar` → Marketing akzeptieren → anmelden → Campaign Manager
   zeigt das Tag als „aktiv" und die Conversion innerhalb von ~1 h.

Kein Server-Side-Pendant: LinkedIn hat eine Conversions API, aber bei
diesem Volumen lohnt der Aufwand nicht. Die echte Lead-Zahl steht ohnehin
in `webinar_leads`, gefiltert nach `utm.source = linkedin`.

### 4.2 Datenschutz-Absatz (Vorlage)

> **LinkedIn Insight Tag.** Wenn du der Kategorie „Marketing" zustimmst,
> setzen wir das Insight Tag der LinkedIn Ireland Unlimited Company ein,
> um zu messen, ob eine Anzeige auf LinkedIn zu einer Webinar-Anmeldung
> geführt hat, und um Besucher unserer Seite auf LinkedIn erneut
> anzusprechen. Ohne Zustimmung wird das Tag nicht geladen. Rechtsgrundlage
> ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG),
> jederzeit widerrufbar über die Cookie-Einstellungen. LinkedIn
> verarbeitet Daten auch in den USA; Grundlage ist das EU-US Data Privacy
> Framework.

---

## 5. Regeln

| Regel | Schwelle |
| --- | --- |
| Pausieren | CTR < 0,4 % nach 2.000 Impressionen (LinkedIn-Benchmark liegt bei 0,4–0,6 %) |
| Pausieren | CPL > 60 € nach ≥ 20 Klicks |
| Nicht anfassen | Gebot, Zielgruppe und Budget in den ersten 5 Tagen — jede Änderung setzt die Auslieferung zurück |
| Urteilen | erst ab 20 Klicks pro Ad (teurer Klick, kleinere Stichprobe als bei Meta) |

---

## 6. Nach dem Webinar · W2

- Retargeting-Kampagne auf Website-Besucher (sobald ≥ 300) mit D02.
- Document-Ad-Varianten testen (§2.1).
- Kundenliste (E-Mails der Registrierten mit Marketing-Einwilligung) als
  Matched Audience — Lookalike-Ersatz auf LinkedIn.
- Thought-Leader-Ads: Wlads eigene Posts sponsern statt Unternehmens-Ads
  — auf LinkedIn günstiger und glaubwürdiger. Braucht Wlads Freigabe.

---

## 7. Checkliste

**Code (erledigt mit diesem PR)**
- [x] Insight Tag + Conversion, consent-gated, inert
- [x] 8 LinkedIn-Creatives 1200×627 mit Intro + Headline im Studio
- [x] 1x1-Webinar-Ads als Zweitformat nutzbar
- [x] UTM-Trennung Meta/LinkedIn am Lead

**Deine Seite**
- [ ] Campaign Manager + Unternehmensseite LeaderOS verknüpft
- [ ] Partner-ID + Conversion-ID → Code
- [ ] Datenschutz-Absatz
- [ ] Zahlungsmethode, Kampagne nach §1
- [ ] Wlads Freigabe für Thought-Leader-Ads (W2)
