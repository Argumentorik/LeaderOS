# Social-Kit · gemeinsame Bildwelt für Karussells und Instagram-Feed

Bausteine, die `../linkedin-wladbot-01` (Karussells W01 bis W03) und
`../instagram-feed-01` (Feed-Kacheln) teilen. Ein Look, damit LinkedIn und
Instagram als eine Marke gelesen werden.

| Datei | Was |
|---|---|
| `kit.css` | Tokens und Bauteile: Glas hell und dunkel, Mitteilung des WladBot, Chat, Chips, runder Knopf, Zeilen in zwei Tönen, Korn, Vignette |
| `kit.js` | Markup-Helfer: Fotoausschnitt, Lichtgrund, Mitteilung, Markierungen (Punkt, Linie, Chip), Maskottchen |
| `build_assets.py` | erzeugt `build/` (nicht eingecheckt): Foto in Farbkorrektur, drei Lichtgründe, Korn, Maskottchen-Freisteller, QR-Codes |
| `src/wlad-stage.webp` | das echte Bühnenfoto (1342×1076, kam über den Chat); Quelle und Nutzungsrecht klären |

## Regeln

- **Nur echte Bilder.** Foto und Lichtgrund stammen aus dem Bühnenfoto, die Figur ist das
  bestehende Produkt-Maskottchen. Keine KI-Gesichter, keine Videostandbilder.
- **Kein Name, keine Credentials auf den Bildern**; Fakten nur aus `../WLAD_CANON.md`.
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
