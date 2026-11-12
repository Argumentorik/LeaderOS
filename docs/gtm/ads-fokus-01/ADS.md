# Anzeigen F01 bis F04 · „Fokus" · App-Anzeigen für die 14 Tage

Stand 12.11.2026. Vier Motive in drei Formaten (`AD-F0x-<Format>-a.jpg`: 4:5, 9:16, 1:1).
Ziel ist der kostenlose Test der App, nicht das Webinar.

## Die Idee

Ein echtes Foto liegt hinter Rasterglas in unseren Farben (Limette oder Papier). Nur ein
Fenster ist scharf: das Gesicht. Daneben liegt ein Stück App. Jede Anzeige sagt in einem Satz,
was LeaderOS ist, zeigt die fünf Bausteine und endet mit einem Knopf.

| Motiv | Aussage | App-Ausschnitt | Farbwelt |
|---|---|---|---|
| **F01** | Übe das Gespräch, bevor es zählt. | Simulation mit Einwand | Limette |
| **F02** | Dein Coach antwortet. Auch um 23 Uhr. | WLAD AI per Stimme | Papier |
| **F03** | 15 Minuten am Tag. Ein Drill, der sitzt. | Drill des Tages, Feedbackformel | Limette |
| **F04** | Wlads Methodik. In einer App. | Verifizierte Zahlen | Papier |

Die App-Ausschnitte sind nachgebaut und tragen das Etikett „Beispiel". Sobald echte
Screenshots vorliegen, gehören sie an diese Stelle.

## Ziel-URL

```
https://leaderos.de/signup?trial=14&utm_source=meta&utm_medium=paid&utm_campaign=app-trial&utm_content=AD-F01-4x5-a
```

`utm_content` ist der Dateiname ohne `.jpg`, auf LinkedIn `utm_source=linkedin`.

## Texte

| Motiv | Primärtext | Headline | Beschreibung |
|---|---|---|---|
| F01 | Das schwierige Gespräch ist morgen. Spiel es heute durch. WLAD AI übernimmt dein Gegenüber und bringt die Einwände, die du fürchtest. 14 Tage kostenlos, ohne Karte. | Übe das Gespräch, bevor es zählt | 14 Tage kostenlos testen |
| F02 | Dein Coach ist nicht erreichbar, das Gespräch ist morgen früh. WLAD AI antwortet per Text und Stimme, mit Wlads Methodik. 14 Tage kostenlos, ohne Karte. | Dein Coach antwortet. Auch um 23 Uhr | 14 Tage kostenlos testen |
| F03 | Führung lernt man nicht an einem Seminartag. Jeden Tag ein Drill von 15 Minuten, dazu Kurse, Simulationen und elf Frameworks. 14 Tage kostenlos, ohne Karte. | 15 Minuten am Tag für deine Führung | 14 Tage kostenlos testen |
| F04 | Wlad ist dreifacher SPIEGEL-Bestseller-Autor und seit 2007 im Coaching. Seine Methodik gibt es jetzt als App mit WLAD AI. 14 Tage kostenlos, ohne Karte. | Wlads Methodik. In einer App | 14 Tage kostenlos testen |

## Regeln

- Produktaussagen nur, was die 14 Tage enthalten: Kurse, WLAD AI per Text und Stimme,
  Simulationen, tägliche Drills von 15 Minuten, elf Frameworks, ohne Karte.
- Zahlen nur aus dem verifizierten Set (`../WEBINAR_FUNNEL.md`).
- Echte Fotos, kein erzeugtes Gesicht. Das Fenster zeigt das Foto unverändert.

## Bauen

```bash
NODE_PATH=/opt/node22/lib/node_modules node render.cjs . <fonts-local.css>
```
