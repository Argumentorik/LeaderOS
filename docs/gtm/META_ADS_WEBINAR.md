# Meta Ads · Webinar 26.11.2026 · Launch-Paket

> Die Matrix „educate ↔ convert × more budget ↔ no budget" auf LeaderOS
> übersetzt, plus alles, was am Montag im Ads-Manager eingetragen wird:
> Struktur, Zielgruppen, 24 Creatives mit fertiger Copy, Tracking, Regeln.
>
> Stand 06.09.2026 · Ads-Start nächste Woche · Webinar Do 26.11., 10:00 Uhr.
> Budgetannahme aus `GOOGLE_ADS_SETUP.md` §5: **30 €/Tag**.

---

## 0. Die Matrix, übersetzt

Die Vorlage sortiert Maßnahmen nach zwei Achsen: **Lehren oder Verkaufen**
und **Geld oder keins**. Das Raster stimmt — die Einträge sind für einen
E-Commerce-Shop gedacht. Hier steht, was davon bei uns wirklich existiert,
was wir ehrlich tun können und was nicht.

### Educate · more budget → **Reichweite kaufen für Wlad**

| Vorlage | Bei uns | Status |
| --- | --- | --- |
| Founder ads | **Wlad-Ads.** Wlad ist der Founder, das Gesicht, der Beleg. Jede Paid-Ad zeigt ihn, nie Stock. | W1 (`AD-*`, Foto `/wlad/wlad-portrait.jpg`) |
| Video views | **Clip-Kampagne** auf Reichweite/ThruPlay: 15–30-Sek-Schnitte aus vorhandenem Material. Baut die Retargeting-Zielgruppe „Video ≥ 25 %". | Blockiert durch Drehtermin (`LAUNCH_PLAN.md` §0) — bis dahin Motion-Typografie auf CloudFront-Clips |
| Creator whitelisting | Nicht jetzt. Kein Creator, keine Beziehung. | — |
| New offers ads | **Das Webinar ist das neue Angebot.** Angle D03. | W1 |
| Podcast clip ads | Wlad hat Podcast-Folgen (`WLAD_CANON.md` Quellen). Audiogramm + Untertitel = billigstes Video-Creative, das wir haben. | W2, braucht Freigabe der Folgen-Ausschnitte |
| Pre-launch / Waitlist ads | Bei uns: **Webinar-Anmeldung** = die Warteliste. | W1 |
| Organic reels | `/social` Set 01 + 02 (12 Karten), täglich eine. | läuft |

### Convert · more budget → **Leads kaufen**

| Vorlage | Bei uns | Status |
| --- | --- | --- |
| UGC creative | **Nein.** Wir haben keine UGC-Creator und erfinden keine. Ehrlichkeitsregel. | — |
| Cost cap bidding | Erst ab ≥ 50 Leads Historie. Vorher „Höchstes Volumen" — Cost Cap ohne Daten lernt nichts. | ab W3 |
| Retargeting offer | Warm-Ad-Set: Website-Besucher 30 Tage + IG/FB-Interaktion 90 Tage → D03/C01. | W1 (Ad-Set 2) |
| Catalogue ads | Kein Katalog. Entfällt. | — |
| Broad + strong creative | **Cold-Ad-Set: Advantage+ Audience DACH, 30–55**, Creative macht das Targeting. | W1 (Ad-Set 1) |
| Landing page CRO | Erledigt diese Woche: `/webinar` Hero mobil + Desktop mit Formular im ersten Viewport (PR #233, #234). | ✅ |
| Purchaser lookalikes | Zu wenige Käufer für ein Lookalike (< 100). Stattdessen Lookalike 1 % auf **Webinar-Registrierungen**, sobald ≥ 100. | ab W2 |

### Educate · no budget → **Organisch**

| Vorlage | Bei uns |
| --- | --- |
| Short clips / Organic reels | `/social` Sets, `CREATIVE_MATRIX.md` (~170 organische Assets) |
| Comment-to-DM reels / ManyChat | Kein ManyChat. Manuell: Kommentar „WEBINAR" → Link per DM. Skaliert nicht, kostet nichts, reicht für September. |
| How-to carousels | Frameworks A01–A12 als Carousel (SEXIER in 6 Slides, 10 Stufen des Zuhörens in 10) |
| £10/day hook tests | **Ja, das ist unser Modus.** Bei 30 €/Tag testen wir Hooks, keine Skalierung. §5 |

### Convert · no budget → **Retargeting, was da ist**

| Vorlage | Bei uns | Status |
| --- | --- | --- |
| Retargeting video viewers | Sobald Video-Views existieren (siehe oben). | W2 |
| Instant lead forms | **Möglich, aber nicht jetzt.** Das Formular auf `/webinar` schreibt in unsere DB, schickt Bestätigung + Kalender + Reminder. Ein Instant Form bräuchte einen Webhook zu `/api/webinar/register`. Erst testen, wenn CPL auf der Website > 2× Ziel. | Option |
| Static + offer | D03 in 1x1 / 4x5 / 9x16. | W1 |
| Website visitor retargeting | Ad-Set 2 (Warm). Pixel muss dafür **vor** den Ads live sein, sonst ist die Zielgruppe leer. §4 | W1 |
| Testimonial ads | **Nein, solange keine echten, freigegebenen Zitate vorliegen.** `WEBINAR_FUNNEL.md` Honesty-Regeln. Trustpilot 4,9 (388) darf als Zahl stehen, nicht als erfundenes Zitat. | — |
| Abandoned cart ads | Bei uns: Trial gestartet, nicht gekauft → nach dem Webinar (W2). | W2 |

**Kurz:** Von 24 Feldern der Vorlage sind 9 diese Woche umsetzbar, 6 nach
dem Webinar, 5 brauchen Material (Video, Creator, Zitate), 4 passen nicht
zum Produkt. Das ist kein Mangel, das ist die Reihenfolge.

---

## 1. Kampagnenstruktur · 30 €/Tag

`RUNBOOK_ADS_CHANNELS.md` §1: **eine Kampagne, zwei Ad-Sets, 3–4 Ads pro
Set.** Nicht mehr. Fünf Kampagnen bei diesem Budget töten die Lernphase.

```
Kampagne   WEBINAR-2026-09 · Ziel: Leads · Conversion-Event: Lead (Pixel + CAPI)
           Budget auf Kampagnenebene (Advantage+ Campaign Budget): 30 €/Tag
│
├─ Ad-Set 1 · COLD-DACH-BROAD                      ~20 €/Tag
│    Standort DE/AT/CH · Alter 30–55 · Advantage+ Audience
│    Vorschlag-Interessen (nur als Signal): Führung, Management, Rhetorik
│    Platzierungen: Advantage+ (automatisch)
│    URL-Parameter des Ad-Sets: utm_term=cold-dach-broad
│    Ads: AD-D03-4x5-a · AD-B01-4x5-a · AD-A02-4x5-a · AD-C02-4x5-a
│         (+ die 9x16-Zwillinge derselben Angles für Stories/Reels)
│
└─ Ad-Set 2 · WARM-30D                             ~10 €/Tag
     Custom Audiences: Website-Besucher 30 Tage (Pixel) ∪
     IG-Konto-Interaktion 90 Tage ∪ FB-Seite-Interaktion 90 Tage
     Ausschluss: Personen, die /webinar/danke gesehen haben (Lead-Event)
     URL-Parameter: utm_term=warm-30d
     Ads: AD-D03-1x1-a · AD-C01-1x1-a · AD-A01-1x1-a
```

**Warum 4x5 im Cold-Set und 1x1 im Warm-Set:** 4x5 nimmt im Feed mehr
Fläche, das zählt bei Fremden. Warme Kontakte kennen das Gesicht, dort
reicht 1x1 und spart Produktionszeit für Varianten.

**CTA-Button** im Ads-Manager: „Registrieren" für D03/C01/C02,
„Mehr dazu" für A01/A02/B01.

**Ausschluss der Registrierten** ist Pflicht: Wer angemeldet ist, sieht
keine Anmelde-Ads mehr — sonst zahlen wir für Leute, die wir schon haben,
und es wirkt wie Spam.

---

## 2. Die 24 Creatives · Welle 1

Aus `CREATIVE_MATRIX.md` §3 (W1 = 8 Angles × 3 Formate). Alle im
Ad-Studio unter `/ads`, Filter **Kampagne → webinar-2026-09**. Daten in
`frontend/src/data/contentAds.js` (`WEBINAR_ANGLES`).

| Angle | Quadrant | Ad-IDs (1x1 · 4x5 · 9x16) | Ad-Set | Landing |
| --- | --- | --- | --- | --- |
| D03 Webinar | convert | `AD-D03-1x1-a` · `-4x5-a` · `-9x16-a` | Cold + Warm | /webinar |
| B01 Seminar-Schmerz | educate | `AD-B01-*` | Cold | /webinar |
| A02 Feedbackformel | educate | `AD-A02-*` | Cold | /webinar |
| A01 SEXIER | educate | `AD-A01-*` | Warm | /webinar |
| C02 400.000+ seit 2007 | convert | `AD-C02-*` | Cold | /webinar |
| C01 3× SPIEGEL | convert | `AD-C01-*` | Warm | /webinar |
| D01 Leader-Check | educate | `AD-D01-*` | organisch (Reserve) | leader-check.de |
| D02 30-Tage-Challenge | convert | `AD-D02-*` | nach dem Webinar | leader-os.de |

**Varianten b und c** liegen für alle acht Angles bereit (Filter „Variante"
im Studio): gleicher Claim und Primärtext, andere Palette und Hook-Zeile —
reine A/B-Tests, erst einsetzen, wenn Variante a ≥ 50 Klicks hat.

D01 und D02 sind produziert, aber **nicht** in der Webinar-Kampagne: bei
30 €/Tag verwässert jedes zusätzliche Ziel das Learning. D01 läuft
organisch, D02 kommt in W2 als Retargeting für Registrierte.

**Export:** `/ads` → Kampagnen-Filter → Tile → „Native ↗" → Screenshot bei
1080 px. Primärtext und URL per Copy-Button. Headline und Beschreibung
stehen unter jedem Tile mit Zeichenzahl (Meta kürzt Headlines > 40,
Beschreibungen > 30 Zeichen).

### 2.1 Copy je Angle (Primärtext · Headline · Beschreibung)

Vollständig in `contentAds.js`; hier die Kurzfassung zum Gegenlesen.

**D03 · Webinar**
Headline: *Live-Webinar mit Wlad Jachtchenko* · Beschreibung: *17. Sept · 10 Uhr · 90 Min*
Primärtext: „Du weißt, wie gute Führung geht. Du kommst nur nicht dazu, sie zu leben. Am 26. November zeigt Wlad Jachtchenko (3× SPIEGEL-Bestseller, seit 2007 Coach für über 400.000 Klienten) live, wie Führung täglich trainierbar wird … 90 Minuten. Kostenlos. Keine Aufzeichnung."

**B01 · Seminar-Schmerz**
Headline: *Seminare ändern Wissen. Nicht Verhalten.* · Beschreibung: *17. Sept · live · kostenlos*
Primärtext: „Kennst du das? Das Führungsseminar war wirklich gut. Drei Wochen später ist vom Feedback-Vorsatz nichts übrig außer den Folien …"

**A02 · Feedbackformel**
Headline: *Drei Sätze für jedes schwierige Gespräch* · Beschreibung: *Wlads Feedbackformel · live*
Primärtext: „Nie ‚Du bist…'. Immer ‚Ich habe beobachtet, dass…'. Beobachtung + Wirkung + Wunsch …"

**A01 · SEXIER**
Headline: *SEXIER: sechs Schritte, ein Argument* · Beschreibung: *SEXIER · live · kostenlos*
Primärtext: „Statement. Explanation. eXample. Impact. Explanation of Impact. Rebuttal …" (Definition wörtlich aus dem Kanon)

**C02 · 400.000+**
Headline: *Wlad Jachtchenko · live am 26. November* · Beschreibung: *90 Min · Q&A · live*

**C01 · SPIEGEL**
Headline: *Der Autor von „Weiße Rhetorik" — live* · Beschreibung: *17. Sept · 10 Uhr · kostenlos*

**D01 · Leader-Check**
Headline: *Dein Führungsprofil in 10 Minuten* · Beschreibung: *Kostenlos · ohne Login*

**D02 · Challenge**
Headline: *Führung trainieren wie Fitness* · Beschreibung: *14 Tage kostenlos · ohne Karte*

### 2.2 Was in keiner Ad steht

- Keine Zahl außerhalb von `WLAD_CANON.md`. „14 Mio. Views" und
  „250.000 verkaufte Bücher" sind aus `contentAds.js` entfernt.
- Keine Verknappung („nur noch 18 Plätze"). Die echte Kapazität zeigt die
  Seite selbst aus der Datenbank.
- Keine Zitate, keine Testimonials, keine Sterne-Grafiken.
- Kein Stockfoto, keine fremde Marke, kein ®.
- SEXIER mit **Rebuttal**, nicht Resolution/Repeat (`AD-F-01` korrigiert).

---

## 3. Zielgruppen · was heute existiert

| Audience | Quelle | Verfügbar |
| --- | --- | --- |
| Website-Besucher 30 Tage | Meta-Pixel | **erst nach Pixel-Live** (§4) — heute leer |
| IG/FB-Interaktion 90 Tage | Meta-Konten | sofort, wenn die Konten im Business-Manager sind |
| Webinar-Registrierte (Ausschluss) | Lead-Event (Pixel + CAPI) | nach Pixel-Live |
| Kundenliste (E-Mails) | `webinar_leads` + `users` Export | sofort möglich, DSGVO: nur Kontakte mit Marketing-Einwilligung |
| Lookalike 1 % Registrierte | ab ≥ 100 Registrierten | W2 |
| Video ≥ 25 % | Clip-Kampagne | W2 |

**Konsequenz:** Ad-Set 2 (Warm) startet praktisch nur mit den
IG/FB-Interaktionen. Das Pixel muss diese Woche live gehen, damit die
Website-Zielgruppe bis zum Webinar überhaupt entsteht.

---

## 4. Tracking · Pixel + Conversions API

Gebaut, **inert bis zur Pixel-ID** — exakt wie das Google-Tag.

| Baustein | Wo | Status |
| --- | --- | --- |
| Consent-Kategorie „Marketing" | `frontend/src/lib/consent.js`, `components/legal/CookieConsent.js` | ✅ live mit diesem PR, Toggle sichtbar |
| Meta-Pixel, consent-gated | `frontend/src/lib/metaPixel.js`, Boot in `index.js` | ✅ gebaut, inaktiv (Platzhalter `META_PIXEL_ID`) |
| Events Browser | `PageView` (Boot) · `ViewContent` (/webinar) · `Lead` (Formular ok) | ✅ |
| Conversions API | `backend/routes/webinar.py` `_forward_to_meta_capi` | ✅ gebaut, inaktiv ohne Env-Vars |
| Deduplizierung | `event_id` vom Browser → `meta_event_id` im POST → CAPI mit derselben ID | ✅ |
| UTM am Lead | `/webinar?utm_*` → `sessionStorage` → `webinar_leads.utm` | ✅ (war vorher nicht verdrahtet) |
| CSP | `vercel.json`: `connect.facebook.net`, `www.facebook.com` | ✅ |

### 4.1 Scharfschalten (Reihenfolge)

1. **Business-Manager:** Domain `leader-os.de` verifizieren (Meta-Tag in
   `frontend/public/index.html` oder DNS-TXT). Pixel anlegen → ID (15–16
   Ziffern).
2. **Frontend:** `META_PIXEL_ID` in `frontend/src/lib/metaPixel.js`
   eintragen. Eine Zeile, ein PR.
3. **Backend (Emergent Env):** `META_PIXEL_ID`, `META_CAPI_TOKEN`
   (Events Manager → Einstellungen → Conversions API → Zugriffsschlüssel
   generieren). Optional `META_TEST_EVENT_CODE` für den Test.
4. **Datenschutz:** Absatz unten in `/datenschutz` einfügen, **im selben
   PR** wie die Pixel-ID.
5. **Test:** Events Manager → „Test-Events" → `/webinar` aufrufen, Marketing
   akzeptieren, anmelden. Erwartung: `PageView`, `ViewContent`, `Lead`
   (Browser) und `Lead` (Server) mit **„Dedupliziert"**-Hinweis.
6. **Aggregated Event Measurement:** `Lead` als priorisiertes Event der
   Domain setzen, sonst fehlen iOS-Conversions.

### 4.2 Datenschutz-Absatz (Vorlage)

> **Meta-Pixel (Facebook, Instagram).** Wenn du der Kategorie „Marketing"
> zustimmst, setzen wir das Meta-Pixel der Meta Platforms Ireland Ltd.
> ein, um zu messen, ob eine Anzeige auf Facebook oder Instagram zu einer
> Webinar-Anmeldung geführt hat, und um dir passende Anzeigen zu zeigen.
> Ohne Zustimmung wird das Pixel nicht geladen. Bei einer Anmeldung
> übermitteln wir zusätzlich serverseitig einen Hashwert deiner
> E-Mail-Adresse (SHA-256) sowie IP-Adresse und Browserkennung an Meta
> („Conversions API"). Rechtsgrundlage ist deine Einwilligung
> (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG), widerrufbar jederzeit
> über die Cookie-Einstellungen. Meta verarbeitet Daten auch in den USA;
> Grundlage ist das EU-US Data Privacy Framework.

### 4.3 Was ohne Consent passiert

Nichts. Kein Skript, kein Cookie, kein Server-Event. Wer „Nur notwendige"
klickt, ist für Meta unsichtbar — auch der Lead. Das kostet Messgenauigkeit
(erwartet: 30–50 % der DACH-Nutzer lehnen ab), ist aber die einzige
saubere Variante. Die echte Lead-Zahl steht immer in `webinar_leads`, nie
im Ads-Manager.

---

## 5. Zahlen, die man erwarten darf

Ads-Start Di 09.09., Webinar Do 26.11. → **8 Tage Laufzeit.**

| | konservativ | gut |
| --- | --- | --- |
| Budget | 240 € | 240 € |
| CPC (DACH, Führungskräfte) | 3,00 € | 1,50 € |
| Klicks | 80 | 160 |
| Landing-Conversion (`/webinar`) | 15 % | 30 % |
| **Anmeldungen aus Ads** | **12** | **48** |
| Show-up-Rate live | 30 % | 45 % |
| Teilnehmer aus Ads | 4 | 22 |

Das ist die ehrliche Größenordnung bei 30 €/Tag. Der eigentliche Ertrag
der ersten Welle ist nicht die Teilnehmerzahl, sondern: welche zwei Angles
CTR > 1 % haben, ein gefülltes Pixel und eine Lookalike-Basis. Wer im
September 500 Teilnehmer will, braucht 100–150 €/Tag oder eine Liste.

---

## 6. Regeln · aus `CREATIVE_MATRIX.md` §6

| Regel | Schwelle |
| --- | --- |
| Pausieren | CTR < 1 % nach 1.000 Impressionen |
| Pausieren | CPL > 2× Median der Kampagne (nach ≥ 50 Klicks) |
| Skalieren | Budget +20 % alle 48 h, nie verdoppeln (Lernphase-Reset) |
| Urteilen | erst ab 50 Klicks pro Ad |
| Rotieren | Montag: Verlierer raus, eine b-Variante des Gewinners rein |

Reporting montags (`RUNBOOK_ADS_CHANNELS.md` Reporting-Loop) plus die eine
Zahl, die zählt: `webinar_leads` gefiltert nach `utm.content` = Ad-ID.

---

## 7. Nach dem Webinar · Welle 2 (30.10.–29.11.)

- **Registrierte, nicht erschienen** → Retargeting mit D02 (Trial). Kein
  „Replay" — es gibt bewusst keine Aufzeichnung, das bleibt so.
- **Erschienen** → Trial-Angebot per E-Mail (`/api/cron/webinar-followup`
  existiert), Ads nur als Verstärker.
- **Video-Views** aus den Clip-Ads → eigene Warm-Zielgruppe.
- **Lookalike 1 %** auf Registrierte, sobald ≥ 100.
- Framework-Angles A03–A08 als Carousels (`CREATIVE_MATRIX.md` W2).

---

## 8. Checkliste vor dem ersten Euro

**Code (erledigt mit diesem PR)**
- [x] Consent-Kategorie Marketing
- [x] Pixel + CAPI gebaut, dedupliziert, inert
- [x] UTM am Lead
- [x] 24 Creatives mit Copy im Ad-Studio
- [x] Kanon-Verstöße in `contentAds.js` entfernt

**Deine Seite (blockierend, in dieser Reihenfolge)**
- [ ] Business-Manager, Domain-Verifizierung, Pixel-ID → §4.1 Schritt 1
- [ ] `META_PIXEL_ID` im Code + Env, `META_CAPI_TOKEN` in Env → Schritt 2–3
- [ ] Datenschutz-Absatz → Schritt 4
- [ ] Test-Event mit Deduplizierung gesehen → Schritt 5
- [ ] IG-Konto + FB-Seite im Business-Manager (für Ad-Set 2)
- [ ] Kampagne nach §1 anlegen, Creatives aus `/ads` hochladen
- [ ] Vercel-Domain-Flip auf `leader-os.de` — sonst laufen Ad-Klicks über
      einen 308-Redirect (kostet ~100–200 ms und Attribution)
