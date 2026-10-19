# Paid-Ads-Channels · Setup-Sequenz

> Die Creatives kommen aus `/ads`. Diese Doku regelt nur das Drumherum:
> Pixel, Conversions, Audiences, UTM-Tracking, Budget-Hygiene.

## Channel-Auswahl & Reihenfolge

| # | Channel        | Wofür                                    | Wann starten       |
| - | -------------- | ---------------------------------------- | ------------------ |
| 1 | Meta (IG/FB)   | Bottom-of-Funnel · DACH-Reichweite       | Sofort             |
| 2 | LinkedIn       | B2B · Demo/Beratung · Enterprise         | Nach Meta-Learning |
| 3 | TikTok         | Top-of-Funnel · Awareness · jünger       | Wenn Reel-Workflow |
| 4 | YouTube Shorts | Reach + Wlad-Authority via 90-Sek-Intro  | Nach TikTok        |
| 5 | Google Search  | Intent · "leadership coaching" Keywords  | Nach 1k Site-Visits |

Pro Channel ein eigener Manager-Account, eine eigene Pixel-ID, eine
eigene UTM-Konvention. Nichts mischen.

## 1. Meta (Instagram + Facebook)

### Vor dem ersten Ad

- Business-Manager (`business.facebook.com`) angelegt.
- Asset: `leader-os.de` als Domain verifiziert (DNS-TXT-Record oder
  Meta-Tag im `<head>` von `frontend/public/index.html`).
- Meta-Pixel installiert. Status: **gebaut, inaktiv bis Pixel-ID** —
  `frontend/src/lib/metaPixel.js` (consent-gated über die Kategorie
  „Marketing") + Conversions API in `backend/routes/webinar.py`
  (Env `META_PIXEL_ID`, `META_CAPI_TOKEN`). Scharfschalten:
  `META_ADS_WEBINAR.md` §4.
- Wlad-Profil und LeaderOS-Page sind beide im Business-Manager.

### Conversions tracken

Standard-Events die wir feuern sollten:

| Event              | Wann                                              |
| ------------------ | ------------------------------------------------- |
| `ViewContent`      | Landing geladen                                   |
| `Lead`             | Email im LeadCaptureModal eingetragen             |
| `CompleteRegistration` | Diagnose-Quiz abgeschlossen                   |
| `Purchase`         | Stripe-Checkout-success Webhook                   |
| `Schedule`         | Cal.com Booking (Demo/Beratung) bestätigt         |

`Lead` und `Schedule` kommen client-side. `Purchase` muss zwingend
über die Conversions-API serverseitig — sonst halluziniert der
Browser-Pixel bei iOS17+ deutlich.

### UTM-Konvention

Jeder Ad-Link muss am Ende dieses UTM-Suffix tragen:

```
?utm_source=meta&utm_medium=paid_social&utm_campaign=<campaign-slug>&utm_content=<ad-id>&utm_term=<audience-slug>
```

Beispiel für AD-A-01 → leader-os.de:

```
https://leader-os.de/?utm_source=meta&utm_medium=paid_social&utm_campaign=ki-nativ-werden&utm_content=AD-A-01&utm_term=dach-c-level
```

UTM-Werte landen in PostHog Person-Properties → in der `users`-Tabelle
sichtbar nach Login. So weißt du welche Ad jemanden konvertiert hat.

### Audiences

| Audience-Slug      | Wer                                          |
| ------------------ | -------------------------------------------- |
| `dach-c-level`     | DACH · C-Suite-Titles · Lookalike 1%         |
| `dach-team-lead`   | DACH · "Head of" / "Lead" · 30–50 J          |
| `dach-founder`     | DACH · Founder/CEO · 1–50 Employees          |
| `dach-warm-30d`    | leader-os.de-Visitors letzte 30 Tage         |
| `dach-cart-7d`     | Stripe-Checkout-started, no purchase         |

Custom Audiences brauchen entweder Pixel-Daten (Warm Web) oder
Email-Listen (Customer Lists). Beides per Cookie-Consent
DSGVO-konform — Banner erlaubt Marketing-Cookies, Pixel feuert.

### Budget-Hygiene

- **Lerning-Phase Meta**: mindestens 50 Conversions pro Ad-Set pro Woche.
  Bei 997 € Sprint-Preis = etwa 30 € pro Lead realistisch in DACH → 1500 €
  Wochen-Budget pro Ad-Set.
- **Anfangs lieber 1 Campaign, 2 Ad-Sets (Cold + Warm), 3 Ads pro Set.**
  Nicht 5 Campaigns × 3 Sets — das tötet das Learning.
- **Pause-Regel**: Ad mit CTR < 0.5% nach 1000 Impressions pausieren.

## 2. LinkedIn

LinkedIn ist teuer (CPM 60–120 €), aber bei Demo/Beratung-Funnel
kannst du deutlich höheren CPL akzeptieren weil der Deal größer ist.

- LinkedIn Insight-Tag: **gebaut, inaktiv bis Partner-ID** —
  `frontend/src/lib/linkedinInsight.js`, consent-gated. Scharfschalten:
  `LINKEDIN_ADS_WEBINAR.md` §4.
- Conversions: `Lead` (Email-Submit) und `Schedule` (Cal-Booking).
- Audiences:
  - Job-Title-Liste: "Head of Engineering, VP Sales, CTO, …"
  - Company-Size-Filter: 50–500 Employees (Mittelstand).
  - Account-List-Targeting: wenn ihr 200 Ziel-Unternehmen habt.
- Format-Preset: `4x5` (mehr Real-Estate) → AD-A-02, AD-D-01, AD-G-01,
  AD-G-02.
- Budget: 50 €/Tag pro Campaign reicht für erste Tests.

## 3. TikTok

- TikTok-for-Business-Account.
- TikTok-Pixel (analog Meta).
- Format-Preset: `9x16` (Vollbild) → AD-A-03, AD-B-02, AD-F-02, AD-H-01.
- Content-Pattern: 0–3 Sek Hook, 3–9 Sek Pain, 9–15 Sek Lösung
  (LeaderOS), 15-Sek CTA. Standbilder hier funktionieren als
  Title-Card / End-Card eines Videos, nicht als Standalone.

## 4. Google Search

- Search-Campaign auf Keywords:
  - "leadership coaching" · "wlad jachtchenko" · "ki führungskraft"
  - "argumentation training" · "rhetorik coach" · "feedback geben lernen"
- Landing: leader-check.de (kurzer Funnel, höhere Conversion-Rate).
- Conversion-Goal: `Lead` (Email-Submit nach Diagnose).
- Budget: 30 €/Tag, Long-Tail-Keywords zuerst (geringere CPC).

## Reporting-Loop

Wöchentlich (Montag morgen):

1. PostHog → Funnel-Insight: `Landing → Lead → CompleteRegistration → Purchase`.
2. Stripe → Conversion-Rate Sprint vs OS.
3. Meta/LinkedIn-Manager → CTR, CPL, CAC pro Ad.
4. Welche Ad mit höchstem Lead-zu-Purchase-Verhältnis?
5. Gewinner pushen, Verlierer pausieren, 1–2 neue Varianten in
   `contentAds.js` adden.

## Nicht im Scope dieses Runbooks

- Influencer / Affiliate
- Podcast-Sponsoring
- Outdoor (Plakate, OOH)
- Pre-Roll YouTube ads

Wenn das kommt, kriegt es ein eigenes Dokument.
