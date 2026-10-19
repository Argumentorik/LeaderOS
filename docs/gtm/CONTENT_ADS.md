# Paid-Ad-Creatives · Netflix-Bites-DNA

> Laute Schwester der editorialen Specimens. Gleicher Workflow:
> Datei editieren → Vercel rebuild → unter `/ads` screenshoten →
> in Meta-Ads-Manager hochladen.

## Wo

| Was                      | Pfad                                                   |
| ------------------------ | ------------------------------------------------------ |
| Studio (intern)          | `https://leader-os.de/ads`                             |
| Daten (single source)    | `frontend/src/data/contentAds.js`                      |
| Renderer                 | `frontend/src/components/ads/AdSpecimen.js`            |
| Paletten                 | `AD_PALETTES` in `contentAds.js`                       |

## Design-DNA (Referenz: Netflix Bites)

- **Voller Farbblock** als Hintergrund — keine Mosaike, kein Gradient-Soup.
- **1 Portrait-Foto** full-bleed, gecroppt auf den Moment der Aktion
  (lesen · sprechen · zuhören · zweifeln · entscheiden).
- **Tracked-Uppercase-Headline** in Kontrast-Neon, oben + unten.
  Outfit 900, `letter-spacing` 0.005em, line-height 0.86.
- **CTA-Block** als ausgeschnittenes Farbrechteck mit ▸ Pfeil.
- **Hairline-Trennlinie** zwischen Title und Bottom-Strip — 4px in
  Headline-Farbe, nicht in der BG-Farbe.

## Paletten

| Key      | BG        | Headline-Hi | Caption-Lo | Use-Case                       |
| -------- | --------- | ----------- | ---------- | ------------------------------ |
| midnight | `#0A0A0A` | `#BFFF00`   | `#FAFAF7`  | Brand-Stamm, Authority         |
| heat     | `#E11D74` | `#FFE600`   | `#FFFFFF`  | Manifest, gegen Stillstand     |
| spark    | `#1E40FF` | `#BFFF00`   | `#FFFFFF`  | KI-Headlines, Zukunfts-Hooks   |
| rally    | `#16632B` | `#BFFF00`   | `#FFFFFF`  | Drill, Framework, Aktion       |
| paper    | `#F5F5F2` | `#0A0A0A`   | `#0A0A0A`  | Trust, Bücher, Zahlen          |
| blaze    | `#FF6A2D` | `#0A0A0A`   | `#0A0A0A`  | Urgency, Sprint, Class-Open    |

## Formate

| Key    | Pixel       | Plattform                                |
| ------ | ----------- | ---------------------------------------- |
| `1x1`  | 1080 × 1080 | Meta-Feed · LinkedIn-Feed                |
| `4x5`  | 1080 × 1350 | Meta-Feed-Vertical (mehr Realestate)     |
| `9x16` | 1080 × 1920 | Stories · Reels · TikTok · YT-Shorts     |
| `1.91x1` | 1200 × 627 | LinkedIn Single Image (Querformat) · 1x1 gilt dort ebenfalls |

## Aktueller Bestand

| ID       | Format | Palette  | Headline                          |
| -------- | ------ | -------- | --------------------------------- |
| AD-A-01  | 1x1    | midnight | WERDE KI-NATIV.                   |
| AD-A-02  | 4x5    | heat     | DU BESTIMMST DEN KURS.            |
| AD-A-03  | 9x16   | spark    | 30 TAGE. EIN NEUES DU.            |
| AD-B-01  | 1x1    | rally    | DREI SÄTZE REICHEN.               |
| AD-B-02  | 9x16   | blaze    | KLARE SKRIPTE STATT BAUCH.        |
| AD-C-01  | 1x1    | paper    | 14 MIO VIEWS.                     |
| AD-D-01  | 4x5    | midnight | DEIN USE-CASE. NICHT UNSERER.     |

## Wording-Regeln (für alle Ads)

1. **Zweizeiler in TRACKED UPPERCASE** — keine Sätze, keine Satzzeichen
   außer Schluss-Punkt im Titel.
2. **Verb zuerst** im Titel ("WERDE", "STARTE", "FÜHRE") wo möglich.
3. **Bottom-Strip ist Datum oder BIB** — Eyebrow-Glaubwürdigkeit.
4. **CTA = ein Wort + URL ODER zwei Worte ohne URL.**
5. **Keine Nebensätze, kein Konjunktiv, kein "vielleicht".**

## Workflow (vom Brief zum Posting)

1. `frontend/src/data/contentAds.js` editieren (neuen Eintrag im
   `AD_SERIES`-Array oder bestehenden anpassen).
2. `git commit` + `git push` → Vercel deployt in ~90 Sek.
3. `https://leader-os.de/ads` aufrufen, Filter setzen.
4. Tile auswählen → **Native ↗** klicken.
5. Screenshot des Tiles im Modal (Cmd+Shift+4 → Bereich auswählen,
   oder Browser-DevTools Element-Screenshot bei 1080px Breite).
6. Caption per Copy-Button kopieren.
7. In Meta-Ads-Manager hochladen, Caption einfügen, Targeting setzen,
   Budget setzen, schalten.

## Foto-Quelle (heute Stock, morgen echte Shoots)

Aktuell liefern alle Ads ihr Portrait über `picsum.photos`-Stock
mit deterministischen Seeds (siehe `stock()`-Helper in
`contentAds.js`). Sobald echte Wlad-/Class-Shoots vorliegen:

1. Bilder in `frontend/public/ads/photos/` ablegen, Naming exakt
   nach `slug`-Feld: `feedback-drama.jpg`, `townhall-ohne-angst.jpg`, …
2. Den `photo`-Pfad in `contentAds.js` je Eintrag von der
   `stock(...)`-Funktion auf `'/ads/photos/<slug>.jpg'` umstellen.
3. Push.

Bei einem 1:1-Format mind. 1080×1080, bei 4:5 mind. 1080×1350, bei
9:16 mind. 1080×1920 — sonst skaliert das Browser-Tile hoch und
wirkt blurry beim Screenshot.

## Nicht in diesem System — und warum nicht

- **Bewegt-Bild (Reels-Video):** das Studio rendert Standbilder.
  Reels brauchen After-Effects oder CapCut. Die Standbilder hier
  funktionieren als Title-Card + End-Card; Mittel-Teil ist Video.
- **A/B-Testing-Varianten:** schreib einen separaten `id`-Eintrag
  (z.B. `AD-A-01-b`) — Meta-Ads-Manager macht den eigentlichen
  Split-Test.
- **Lokalisierung (EN):** für jetzt Deutsch only. Wenn EN-Ads
  kommen, gleicher `slug` mit `-en`-Suffix, separate Einträge,
  Studio-Filter um `lang` erweitern.
