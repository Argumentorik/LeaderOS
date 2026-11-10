# Social-Kit · gemeinsame Bildwelt für Karussells und Instagram-Feed

Bausteine, die `../linkedin-wladbot-01` (Karussells W01 bis W03), `../instagram-feed-01`
(Feed-Kacheln), `../carousels-save-01`, `../ads-frosted-01` und `../takeover-wlad-ai-01` teilen. Ein Look, damit LinkedIn und
Instagram als eine Marke gelesen werden.

| Datei | Was |
|---|---|
| `kit.css` | Tokens und Bauteile: Glas hell und dunkel, Mitteilung von WLAD AI, Chat, Chips, runder Knopf, Zeilen in zwei Tönen, Korn, Vignette |
| `kit.js` | Markup-Helfer: Fotoausschnitt, Lichtgrund, Mitteilung, Markierungen (Punkt, Linie, Chip), Maskottchen |
| `build_assets.py` | erzeugt `build/` (nicht eingecheckt): Fotos in Farbkorrektur, freigestelltes Porträt, drei Lichtgründe, Korn, Maskottchen-Freisteller, QR-Codes |
| `src/wlad-stage.webp` | das echte Bühnenfoto (1342×1076, kam über den Chat); Quelle und Nutzungsrecht klären |
| `src/wlad-portrait.jpg` | Porträt im grünen Samtsakko (500×500), wird freigestellt; Titelfolie des Takeovers |
| `src/wlad-coaching.png`, `wlad-arena.png`, `wlad-seminar.jpg`, `wlad-talk.png` | vier weitere echte Fotos (463 bis 800 Pixel breit, kamen am 10.11.2026 über den Chat); Rechte, Fotografen und Einwilligung der Abgebildeten klären |

## Regeln

- **Nur echte Bilder.** Fotos und Lichtgrund sind echt, die Figur ist das bestehende
  Produkt-Maskottchen. Keine KI-Gesichter, keine Videostandbilder, kein Hochrechnen von Gesichtern
  mit KI. Die Fotos sind klein: höchstens auf das Doppelte vergrößern, als Karte oder Ausschnitt.
- **Kein voller Name auf den Bildern.** Fakten nur aus `../WLAD_CANON.md`, Zahlen nur aus dem
  verifizierten Set in `../WEBINAR_FUNNEL.md` (so im Takeover `../takeover-wlad-ai-01`).
- **Glas statt Grau:** Flächen sind Glas über Farbe (Foto, Lichtgrund) oder Limette,
  Weiß, Schwarz. Keine grauen Kästen.
- **Eine Farbfamilie je Bild:** Lichtgründe laufen über Farbverläufe (Amber, Blaugrün,
  Limette), nicht über bunte Flecken.
- **Sicherer Rand 72 px:** Instagram schneidet das Raster auf 3:4 (je 34 px links und rechts).
- Alle Maße gelten für ein Blatt 1080×1350; gerendert wird mit Playwright
  (Karussells 1,5-fach, Feed 1-fach).

## Neu-Bauen

```
PYTHONPATH=<dir mit qrcode, scipy> /usr/bin/python3 build_assets.py     # erzeugt build/
```

Danach in `../linkedin-wladbot-01` und `../instagram-feed-01` `render.cjs` ausführen.
Ein besseres Foto: `src/wlad-stage.webp` ersetzen (Seitenverhältnis beibehalten oder die
Konstanten `STAGE` in `kit.js` und `light` in `build_assets.py` anpassen) und neu bauen.
