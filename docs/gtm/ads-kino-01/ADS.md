# Anzeigen K01 bis K04 · „Kino" · App-Anzeigen als Filmplakat

Stand 12.11.2026. Vier Motive in drei Formaten (`AD-K0x-<Format>-a.jpg`: 4:5, 9:16, 1:1).
Schwesterserie zu `../ads-fokus-01`: dieselben vier Aussagen, hier als Filmplakat.

Das echte Foto liegt hinter Riffelglas, nur das Gesicht bleibt scharf (`build_bg.py`).
Titel in Serifenschrift, darunter der Satz zur App, der Abspann mit den Bausteinen und der Knopf.

| Motiv | Titel | Unterzeile |
|---|---|---|
| K01 | Üben | bevor es zählt |
| K02 | 23 Uhr | und dein Coach antwortet |
| K03 | 15 Min | jeden Tag ein Drill |
| K04 | WLAD AI | Wlads Methodik in einer App |

Texte, Ziel-URL und Regeln wie in `../ads-fokus-01/ADS.md`, `utm_content` ist der Dateiname.

```bash
/usr/bin/python3 -I build_bg.py
NODE_PATH=/opt/node22/lib/node_modules node render.cjs . <fonts.css mit Instrument Serif>
```
