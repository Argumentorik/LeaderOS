# Plan: Video-Guide auf Gesprächsniveau (GODMODE) · Tempo der gesamten App · Event-Hinweis aus

## 1. Video-Guide-Produktion: Skripte, Bildführung, Schnitt

Heute stören drei Dinge: Wlad geht in mehreren Clips sichtbar „auf den Zuschauer zu“ statt einfach mit ihm zu reden; die Clips sind aus mehreren Einzelaufnahmen zusammengesetzt und man hört und sieht die Schnitte; die Skripte klingen stellenweise nach Aufzählung statt nach Wlad.

**Bild & Schnitt**
- Wlad bleibt in einer ruhigen Präsenz-Einstellung (frontal, direkter Blick, leichte natürliche Bewegung) — kein Heranlaufen, kein Zugehen auf die Kamera, kein Positionswechsel mitten im Satz.
- Ein durchgehender Take pro Clip. Ein Schnitt nur für einen App-Einblender, und dann als weicher Übergang über die durchlaufende Stimme, nicht als harter Sprung.
- Die Stimme wird pro Clip als **eine** zusammenhängende Tonspur erzeugt (nicht satzweise zusammengeklebt), damit Atem, Tempo und Betonung durchgehend natürlich sind.

**Skripte (alle Guide-Clips, zuerst die Erststart-Serie)**
- Gesprochene Sprache statt Aufzählung: Hauptsatz-Nebensatz-Erklärungen („Du sagst mir, was gerade anliegt, damit ich dir nicht irgendwas, sondern den nächsten sinnvollen Schritt vorschlage.“), ein Gedanke pro Satz, ein konkretes Beispiel pro Clip, ein klarer Auftrag am Ende.
- Kein KI-Ton: keine Floskeln („In diesem Video zeige ich dir …“), keine Dreierlisten, kein „Lass uns …“, kein Bindestrich-Stakkato. Wlads Wortschatz aus Büchern und Live-Calls, wo er passt.
- Prioritäten: **1. „Willkommen bei Leader-OS“** (erster Eindruck, muss sitzen), **2. „So sprichst du mit der KI“** (komplett neu: was man Wlad sagt, wie man fragt, ein echter Beispiel-Dialog in Wlads Worten, was man danach tut), dann die restlichen Erststart-Clips, danach die Mission-Briefings.
- Jedes Skript wird vor dem Rendern als Text freigegeben (Vorschau im Guide Studio, direkt umformulierbar). Ohne Freigabe kein Render.

**Ablauf**
- Erststart-Serie wird mit neuen Skripten und ruhiger Einstellung neu produziert; die alten Clips bleiben online, bis der neue Clip freigegeben ist (kein Loch im Guide).
- Mission-Briefings folgen in einem zweiten Durchgang nach Freigabe der ersten Serie.

## 2. Video-Guide-Seite: schnell, mit Vorschaubildern

Heute erscheinen die Kacheln als schwarze Flächen (kein Vorschaubild vorhanden), die Seite lädt zuerst die komplette Clip-Datenbank samt Untertiteln und Produktionsdaten, und das aktive Video wird sofort vollständig geladen.

- Für jeden freigegebenen Clip wird automatisch ein Standbild aus dem Video gezogen (Kachel- und Player-Poster, im Guide Studio austauschbar); neue Clips bekommen ihr Bild beim Freigeben.
- Die Seite lädt nur, was sie zeigt (Titel, Dauer, Bild, gesehen) — Liste in unter einer Sekunde, bis dahin Platzhalter-Kacheln.
- Video lädt erst auf Klick (nur die ersten Sekunden vorab); Bilder und Videos werden vom Browser gecacht.
- Kachel-Look wie in der Kurs-Bibliothek (16:9, Dauer-Badge, gesehen-Haken, Hover).

## 3. Tempo der gesamten App

Ziel: Jede Seite zeigt in unter 1,5 Sekunden Inhalt, Seitenwechsel fühlen sich sofort an, keine leeren Flächen beim Laden. Messlatte je Seite (Dashboard, Chat, Kurse, Video-Guide, Missionen, Playbooks, Admin): Inhalt sichtbar < 1,5 s, vollständig < 3 s bei normaler Verbindung; im Admin eine Tempo-Übersicht mit diesen Werten.

- **Nur laden, was gezeigt wird**: Listen-Antworten werden auf die Felder reduziert, die die Seite braucht (heute kommen z. B. bei Clips, Kursen und Dashboard-Daten ganze Datensätze mit). Große Bereiche hinter „Mehr“ laden erst beim Aufklappen.
- **Erste Anzeige sofort**: Jede Seite zeigt Platzhalter statt Weißfläche; Daten, die sich selten ändern (Kurse, Clips, Profil), kommen beim Wiederbesuch aus dem Zwischenspeicher und werden im Hintergrund aktualisiert.
- **Dashboard in einem Zug**: Die vielen Einzelabfragen beim Start werden zu einer gebündelten Antwort, Aggregate werden serverseitig kurz zwischengespeichert.
- **Bilder & Videos**: alle Bilder komprimiert und in passender Größe (Thumbnails ≤ 150 KB), Videos mit Poster und erst-auf-Klick-Laden, alle Medien mit langem Browser-Cache.
- **Weniger Startgepäck**: Seiten und schwere Bausteine (Player, Aufnahme, Admin-Studio, Diagramme) werden erst geladen, wenn sie gebraucht werden; wichtigste Schrift und Logo werden vorgeladen.
- **Wlad-Antworten**: Chat-Antworten erscheinen weiterhin gestreamt; Wissenssuche und Nutzer-Gedächtnis werden beim Öffnen einer Seite vorgeladen statt bei jeder Frage neu geholt.

## 4. Event-Hinweis „Monats-Update-Call · Beraterteam · Leader·OS“

Erscheint heute direkt nach dem Login. Wird komplett abgeschaltet: kein Event-Hinweis beim Start, im Dashboard, in der Inbox oder als Einblendung. Events bleiben über die Seite „Events“ erreichbar. Admin-Schalter „Event-Hinweise auf dem Dashboard“, standardmäßig aus.

## 5. Nicht Teil dieses Plans

Interaktiver Wlad / Sprach-Gespräch (bewusst zurückgestellt), neue Kursinhalte, Preis-/Zugriffsänderungen.

## 6. Annahmen (bei Bedarf widersprechen)

- Neuproduktion der Erststart-Serie (ca. 5 Clips) kostet Render-Budget (bisher ~15–20 US-$ je Clip); Mission-Briefings erst nach Freigabe der ersten Serie.
- Skripte werden vor dem Rendern als Text freigegeben — das bremst einen Tag, sichert aber „kein AI-Slop“.
- Vorschaubilder werden automatisch aus den Videos gezogen; Austausch im Guide Studio möglich.
- Der Event-Hinweis wird für alle Nutzer abgeschaltet.
