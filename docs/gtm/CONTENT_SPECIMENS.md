# Specimen-Content · Instagram + LinkedIn

> Editorial-Specimen-Posts im Athletic-Editorial-Stil der Landing-Page.
> Same DNA: Outfit-Black-Italic-Headline, Lime-Punkt, BIB-Code, dichotomie-Slogan
> ("X. Y."), Mono-Metadata-Footer.

## Wo

- **Studio (intern)**: `https://leader-os.de/specimens` — alle Posts gerendert,
  Native-Size-Modal für Screenshots, Caption neben jedem Tile mit Copy-Button.
- **Daten**: `frontend/src/data/contentSpecimens.js` — single source of truth.
- **Renderer**: `frontend/src/components/specimens/PostSpecimen.js` — fünf
  Varianten (`headline`, `quote`, `numbers`, `framework`, `bib`).

## Formate

| Format     | Pixel       | Plattform           |
| ---------- | ----------- | ------------------- |
| `square`   | 1080 × 1080 | Instagram-Feed      |
| `vertical` | 1080 × 1350 | LinkedIn · IG Story |

## Wording-Regeln (für alle Specimens)

1. **Kein "Kohorte".** Stattdessen `Class 0001` oder `BIB · 0001`.
2. **Dichotomie-Headline**: zweiteilig im "X. Y."-Pattern. Erste Zeile
   schwarz, zweite Zeile grau (45 %), Lime-Punkt zum Schluss.
3. **Kein "wir bauen", kein "wir launchen"** — der Leser ist im Zentrum,
   nicht das Produkt.
4. **Kein Excitement-Lexikon** ("revolutionär", "game-changing", "ultimate").
   Sätze sind kurz, fast trocken — das macht sie editorial.
5. **CTA immer am Ende der Caption** als ein Satz, nicht als Aufzählung.

## Posts in dieser Iteration

### Serie A · Manifesto (3 Posts)

| ID   | Format     | Headline                                           | Variant   |
| ---- | ---------- | -------------------------------------------------- | --------- |
| A-01 | 1080×1080  | KI bestimmt das Tempo. Du den Kurs.                | headline  |
| A-02 | 1080×1350  | Algorithmen führen Prozesse. Menschen Menschen.    | quote     |
| A-03 | 1080×1350  | Wer heute zögert, führt morgen unter jemandem …    | headline  |

### Serie B · Framework-Drills (5 Posts)

| ID   | Format     | Framework             | Variant   |
| ---- | ---------- | --------------------- | --------- |
| B-01 | 1080×1080  | SEXIER · Argumentieren in 6 Schritten | framework |
| B-02 | 1080×1080  | Logos · Ethos · Pathos                | framework |
| B-03 | 1080×1350  | Feedback-Formel (B/W/W)               | framework |
| B-04 | 1080×1080  | Dunkle Rhetorik · 3 Konter            | framework |
| B-05 | 1080×1350  | 5 Rollen · Visionär bis Botschafter   | framework |

### Serie C · Trust + Produkt (4 Posts)

| ID   | Format     | Headline                                     | Variant   |
| ---- | ---------- | -------------------------------------------- | --------- |
| C-01 | 1080×1080  | 400 Tausend. 14 Millionen.                   | numbers   |
| C-02 | 1080×1080  | 24 Stunden. 7 Tage.                          | headline  |
| C-03 | 1080×1350  | Dreißig Tage. Ein neues Du.                  | bib       |
| C-04 | 1080×1350  | Du lernst nicht allein. Du wirst Teil von …  | framework |

## Posting-Rhythmus (Empfehlung)

- **Mo/Mi/Fr Instagram-Feed** — alternierend Manifesto + Framework-Drill.
- **Di/Do LinkedIn** — alternierend Manifesto + Trust/Produkt.
- **Sa Specimen-Carousel** — drei Frameworks am Stück (B-01, B-02, B-05).
- **So Pause** — die Audience auch.

## Workflow

1. `/specimens` aufrufen, Plattform-Filter setzen.
2. Tile auswählen, **Native size ↗** klicken.
3. Vollbild-Modal screenshotten (Cmd+Shift+4 → Tile-Bereich).
4. Caption per Copy-Button kopieren.
5. In Buffer / Later / Meta Composer / LinkedIn-Composer einfügen.

## Neue Posts hinzufügen

Eintrag in `frontend/src/data/contentSpecimens.js` ergänzen:

```js
{
  id: 'D-01',                      // Serie-Buchstabe + Nummer
  slug: 'sprechpause-kraft',
  format: 'square',                // 'square' | 'vertical'
  platform: 'instagram',           // 'instagram' | 'linkedin'
  variant: 'headline',             // 'headline'|'quote'|'numbers'|'framework'|'bib'
  bib: 'DRILL · 0009',
  eyebrow: 'BENEFIT · STIMME',
  headline: 'Die Pause ist',
  accent: 'das stärkste Wort.',
  body: 'Wer eine Sekunde wartet, wird gehört.',
  foot: 'leader-os.de',
  caption: '…',                    // exakter Posttext für IG/LinkedIn
}
```

Beim nächsten Build erscheint das Tile automatisch im Studio.

## Wlad-Fotos einbauen

Sobald `wlad-portrait.jpg` und `wlad-stage.jpg` in `frontend/public/wlad/`
liegen, können wir eine Variante `'portrait'` zu `PostSpecimen.js`
hinzufügen, die Wlads Foto neben der Headline rendert (z.B. für Authority-
Posts in Serie A oder als Author-Card bei C-01).

## Design-Konsistenz mit der Landing-Page

| Element        | Landing       | Specimen          |
| -------------- | ------------- | ----------------- |
| Headline-Font  | Outfit 900 it | Outfit 900 it     |
| Akzent-Punkt   | `text-brand`  | `text-brand`      |
| BIB-Code       | Mono 0.22em   | Mono 0.22em       |
| Lime-HSL       | `--brand`     | `--brand` (gleich) |
| Background     | `#FFFFFF`     | `#FFFFFF` (Tile)  |

Wenn die Landing-Page neue Visual-Sprache bekommt (z.B. eine zweite Akzentfarbe),
muss `PostSpecimen.js` mitziehen — sonst zerfällt das Brand-System.
