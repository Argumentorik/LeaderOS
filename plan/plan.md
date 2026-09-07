# Plan: /kurse im Academy-Look (Vorbild higgsfield.ai/academy)

Hinweis: Der erwähnte Screenshot ist nicht als Anhang angekommen; die Struktur wurde direkt von higgsfield.ai/academy übernommen (Hero → Kategorien → Kurs-Karten mit Vorschau → „Was drin ist“ → „Mehr aus …“). Falls der Screenshot einen anderen Ausschnitt zeigt (z. B. die Kursliste `/academy/courses` mit Filterleiste), bitte kurz sagen.

## Ziel

Die Kurs-Bibliothek `/kurse` wird von der heutigen Text-Kartenliste zu einer **visuellen Academy-Startseite** mit Vorschaubildern, Kategorien, klaren Meta-Angaben und zwei Aktionen pro Kurs („Kostenlos starten“ / „Details“). Jeder Kurs bekommt zusätzlich eine **eigene Detailseite** `/kurse/<kurs>` mit Player und Folgenliste (heute: Popup).

## Aufbau der Seite (von oben nach unten)

1. **Hero** (dunkel, Wlad-Präsenz-Look, Limette als Akzent)
   Eyebrow „Kurs-Bibliothek“ · Headline „Lernen. Üben. Führen. Alles an einem Ort.“ · Subline „Echte Führungssituationen statt Theorie — vom 30-Sekunden-Statement bis zur Boardroom-Strategie. 10 Kurse, 72 Folgen, Folge 1 immer kostenlos.“ · Primär-Button „Kostenlos starten“ (öffnet Folge 1 des ersten noch nicht gesehenen Kurses) · Sekundär „Alle Kurse“ (scrollt zur Liste). Rechts/oben: Fortschritt des Nutzers („12 von 72 Folgen gesehen“) statt Marketing-Bild — die Seite ist eingeloggt.

2. **Nach Kategorie stöbern** — drei große Kacheln mit Bild und Titel, Klick filtert die Liste:
   - **Rhetorik & Kommunikation** (Rhetorik-Grundlagen, Storytelling im Boardroom, Meeting-Rhetorik)
   - **Führung & Gespräche** (Schwierige Gespräche, Delegation, Feedback-Formate)
   - **Strategie & Executive** (KI-First Leadership, Change Management, Executive Presence, Boardroom-Strategie)

3. **Alle Kurse** — Kartenraster (3 Spalten Desktop, 2 Tablet, 1 Mobil). Über dem Raster eine Filterzeile: Kategorie-Chips + „Alle · Freigeschaltet · Gesperrt · Angefangen“. Jede Karte:
   - **Vorschaubild 16:9** (neu erzeugt je Kurs: Wlad frontal im Präsenz-Look + Kurstitel als Typo-Overlay, dunkler Grund, Limetten-Akzent — konsistent mit den Video-Guide-Thumbnails). Beim Hover läuft — falls vorhanden — die Folge 1 stumm als Vorschau an (wie beim Vorbild).
   - Badges oben links: „KOSTENLOS · FOLGE 1“ (immer) sowie „GESPERRT“ mit Schloss bei fehlendem Paket, „NEU“ für Kurse mit frisch hochgeladenen Videos, Fortschrittsring/-balken bei angefangenen Kursen.
   - Titel, ein Satz Beschreibung (bestehende Tagline).
   - Meta-Zeile als Chips: Kategorie · Level (Grundlagen / Aufbau / Executive) · „7 Folgen“ · „48 Min“.
   - Zwei Aktionen: **„Kostenlos starten“** (spielt Folge 1 sofort; bei angefangenem Kurs: „Weiter mit Folge n“) und **„Details“** (Detailseite). Gesperrte Kurse zeigen statt „Weiter“ den Hinweis „Teil von Leadership OS / PLUS“ und führen über „Details“ zur Folgenliste mit Upgrade-Hinweis — die Vorschau (Folge 1) bleibt spielbar.

4. **Was drin ist** — sechs kurze Nutzen-Kacheln, wie beim Vorbild: „Echte Situationen, keine Theorie“, „Frag Wlad direkt aus der Folge“, „Folge gesehen = Fortschritt gezählt“, „Sofort anwenden: Playbook zu jedem Kurs“, „Kurze Folgen, max. 12 Minuten“, „Neue Folgen erscheinen automatisch“. Daneben ein großes Standbild aus einem Wlad-Clip.

5. **Mehr aus Leader-OS** — drei Karten: „Frag Wlad“ (Chat), „Video-Guide“ (Wlad erklärt die Plattform), „30-Tage-Challenge“ — jeweils mit Kurztext und Button.

6. Der bestehende **Upsell-Block** (x Kurse / y Folgen warten) wandert ans Ende der Kursliste (nur für Nutzer mit gesperrten Kursen) und übernimmt den Look der Karten.

## Detailseite `/kurse/<kurs>`

- Kopf: Vorschaubild groß, Titel, Beschreibung, Meta-Chips, Fortschritt („3 von 7 gesehen“), Button „Weiter mit Folge n“ / „Folge 1 kostenlos ansehen“.
- Player mit der gewählten Folge; darunter Folgenliste (Nummer, Titel, Dauer, gesehen/frei/gesperrt), Lernziele (bestehende Bullets), „Frag Wlad dazu“, „Mit Wlad sprechen (Beta)“.
- Gesperrte Folgen: Schloss + „Teil von Leadership OS PLUS“ + Button „Pakete ansehen“ (wie heute im Popup).
- Direktlinks aus Dashboard/Guide/E-Mails auf einzelne Folgen (`/kurse/<kurs>?folge=3`) funktionieren.

## Was sich NICHT ändert

- Zugriffslogik (Folge 1 frei, Rest nach Paket), „gesehen“-Zählung, Video-Verwaltung im Admin, Kursinhalte und Reihenfolge.
- Die Seite bleibt nur eingeloggt erreichbar; die öffentliche Übersicht bleibt `/kurse-uebersicht/` (SEO).

## Annahmen (bei Bedarf widersprechen)

- Level-Zuordnung: Kurse 1–3 „Grundlagen“, 4–6 „Aufbau“, 7–10 „Executive“.
- Vorschaubilder werden einmalig KI-generiert (10 Stück) und im Admin später austauschbar; Hover-Video nutzt die vorhandene Folge-1-Aufnahme, sonst bleibt das Standbild.
- Dunkler Hero + helle/dunkle Karten je nach App-Theme (kein komplett dunkles Redesign der ganzen App).
- Deutsch primär, Englisch wie bisher über den Sprachschalter.

## Nicht Teil dieses Plans

Neue Kursinhalte oder Videos, Preis-/Zugriffsänderungen, Kommentar-/Bewertungsfunktion, Zertifikate.
