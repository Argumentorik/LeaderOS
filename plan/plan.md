# Plan: Leader-Diagnose-Einstieg, „Mit Wlad sprechen“, Video-Verwaltung im Admin, Thumbnails

Vier Themen aus der Nachricht, in dieser Reihenfolge umgesetzt.

---

## 1. Leader-Diagnose: Einstieg für Nutzer ohne Leader-Check

**Heute**: `/leader-diagnose` zeigt auch ohne vorhandene Diagnose die volle Seite — Ring-Score, 3 Layer, Dimensionen. Ohne Daten stehen dort abgeleitete oder Null-Werte. Der Weg zu leadercheck.de existiert nur versteckt: als Aktion in einer Hinweis-Meldung, die erst nach einem Klick auf „Mit leadercheck.de syncen“ erscheint.

**Neu**: Wer noch keine Diagnose hat, sieht statt der Zahlen eine eigene Startansicht:

- Kurze Erklärung, was der Leader-Check ist und was er in Leader-OS auslöst (personalisierte Reise, Fokus in der Challenge, Wlads Kontextwissen) — also warum sich die 5 Minuten lohnen.
- Großer Hauptbutton **„Leader-Check auf leadercheck.de starten“** (öffnet in neuem Tab).
- Darunter ein zweiter Schritt **„Ergebnis jetzt holen“**: holt die Diagnose per Sync. Findet sich nichts, bleibt eine verständliche Erklärung stehen statt einer Fehlermeldung (z. B. „Noch nichts unter deiner E-Mail gefunden — schließe den Check ab und tippe hier erneut.“).
- Erkennbar, mit welcher E-Mail gesucht wird, damit ein Nutzer merkt, wenn er den Check mit einer anderen Adresse gemacht hat.
- Die E-Mail wird beim Sprung auf leadercheck.de mitgegeben, damit das Ergebnis zuverlässig zurückfindet. Sollte leadercheck.de diesen Parameter nicht auswerten, entfällt nur diese Bequemlichkeit; der Rest funktioniert unverändert.
- Rückkehr aus dem anderen Tab: beim erneuten Fokussieren des Fensters wird einmal still nachgesehen, ob inzwischen ein Ergebnis vorliegt — liegt es vor, wechselt die Seite ohne Klick in die volle Diagnose-Ansicht.

Wer eine Diagnose hat, sieht die Seite unverändert wie heute.

Derselbe Einstieg wird überall dort angeboten, wo heute ins Leere verlinkt wird (Dashboard-Hinweis „Diagnose“, „Nächster Schritt“ unter den Guide-Videos), damit es nur einen Weg gibt.

---

## 2. „Mit Wlad sprechen“ (u. a. bei den Leadership Playbooks) — lesbar und ruhiger

**Heute**: Vollbild-Overlay. Oben Titelzeile, in der Mitte ein sehr großer Avatar (bis 224 px), darunter Status, Vorschlagsfragen und erst dann die Antwort in einem Bereich, der auf ein Drittel der Fensterhöhe begrenzt ist — ohne Abstand nach unten, direkt an den Sprachsteuerungs-Buttons. Auf Laptops und Handys bleibt für die eigentliche Antwort sehr wenig Platz; das Ende des Textes klebt am Rand und ist schwer zu lesen.

**Neu** — dasselbe Gespräch, andere Gewichtung:

- **Antwort ist der Hauptdarsteller**: Der Textbereich bekommt den größten Teil der Fläche und echten Abstand nach unten (kein Text mehr direkt an den Buttons), damit der letzte Satz immer vollständig lesbar ist.
- **Avatar wird kompakter, sobald gesprochen wird**: Beim Start groß und einladend; sobald die erste Antwort kommt, rückt er als kleinerer Kopf nach oben. Sprech-Ring und Pegel bleiben, nur kleiner.
- **Frage und Antwort klar getrennt**: Frage als Zitat, Antwort in größerer, ruhig gesetzter Schrift mit mehr Zeilenabstand; mehrere Absätze werden als Absätze dargestellt statt als Textblock.
- **Neue Antwort wird nicht verpasst**: sanftes Einblenden, automatisches Nachscrollen nur, wenn man unten ist; sonst erscheint „Neue Antwort ↓“.
- **Lesehilfen**: Antwort kopieren; Verlauf des Gesprächs nach oben scrollbar; Vorschlagsfragen rutschen nach dem ersten Wortwechsel in eine schmale Zeile, statt Platz zu belegen.
- **Handy**: eigene Aufteilung (Avatar klein oben, Text scrollt darunter, Steuerung unten mit Sicherheitsabstand zur Home-Leiste). Text bleibt auch bei langer Antwort vollständig erreichbar.
- **Status bleibt sichtbar** („Ich höre dir zu…“, „Wlad denkt nach…“, „Wlad spricht“) — nur dezenter, direkt am Avatar.
- Hinweis „Noch X Test-Gespräche“ und der Upgrade-Weg bleiben unverändert, nur besser platziert.

Funktion, Kosten und Sprachlogik bleiben identisch — es ändert sich nur die Darstellung. Da dieses Overlay überall gleich verwendet wird (Playbooks, Video-Guide, Missionen, Features), wirkt die Verbesserung an allen Stellen.

---

## 3. Videos im Admin: Vimeo-Link oder eigenes Video hochladen — und herunterladen

Ein **einheitliches Video-Feld** für beide Welten: Wlad-Guide-Clips (Video-Guide, Missions-Briefings, Login-Teaser, Feature-Clips) und Kurs-Folgen.

Pro Video drei Quellen, sichtbar als Auswahl mit Kennzeichnung, welche gerade live ist:

1. **Generiert** (wie heute, nur bei Guide-Clips)
2. **Vimeo-Link** (Link oder ID einfügen)
3. **Eigenes Video hochgeladen**

Verhalten:

- **Sofort live**: Sobald ein Link gesetzt oder ein Upload fertig ist, sehen Nutzer dieses Video. Das generierte Video bleibt gespeichert und ist per Klick wieder aktivierbar („Zurück zum generierten Video“) — nichts wird überschrieben oder gelöscht.
- **Upload großer Dateien**: Videos werden in Stücken hochgeladen, mit Fortschritt in Prozent und Phase („Lädt 43 %“ → „Wird geprüft“ → „Fertig“). Abbrechen und Fortsetzen möglich. Erlaubt: MP4 und MOV bis 2 GB je Datei.
- **Nach dem Upload** wird Dauer erkannt, ein Vorschaubild erzeugt und die Adresse frisch versioniert, damit alle Nutzer sofort das neue Video sehen (kein Browser-Cache-Problem wie zuletzt).
- **Fehlerfälle in Klartext**: falsches Format, zu groß, Verbindung abgebrochen, Vimeo-Link privat/nicht abspielbar — jeweils mit dem konkreten nächsten Schritt.
- **Vimeo-Link wird vor dem Speichern geprüft** (existiert, ist einbettbar). Nicht einbettbare Links werden abgelehnt, statt später beim Kunden schwarz zu bleiben.

**Download für Detailarbeit** (nur Admin):

- Pro Video ein **Herunterladen**-Button mit sprechendem Dateinamen (z. B. `mission-tag-1_v7.mp4`), direkt neben dem Video im Admin.
- Ein kurzer Hinweistext macht den Arbeitsweg explizit: **herunterladen → außerhalb schneiden → als eigenes Video wieder hochladen** (das generierte bleibt als Rückfall erhalten).
- Bei Guide-Clips ist zusätzlich der letzte Vorschau-Schnitt herunterladbar, nicht nur die Live-Fassung.
- Kunden bekommen keinen Download (bewusst), weder im Player noch über eine Adresse, die man weitergeben kann.

---

## 4. Thumbnails: überall korrekt

**Ziel**: Es gibt keine Kachel mehr ohne Vorschaubild und kein verzerrtes oder falsch beschnittenes Bild.

- **Bestandsaufnahme über alle Stellen**, an denen Videos als Kachel erscheinen: Video-Guide, Missions-Briefing in der Challenge, Tages-Briefing auf dem Dashboard, Playbooks/Feature-Abschnitte, Kurs-Übersicht `/kurse`, Kurs-Detailseite mit Folgenliste, Login-Teaser-Poster, Admin-Listen. Jede Stelle wird auf Desktop und Handy geprüft.
- **Einheitliches Verhalten**: festes 16:9-Format, Bild füllt die Kachel ohne Verzerrung, Dauer- und „gesehen“-Marker an derselben Position, ruhiges Nachladen (kein Springen des Layouts, kein weißes Aufblitzen).
- **Immer ein Bild**: Fehlt ein Vorschaubild, wird automatisch eines aus dem Video gezogen. Ist auch das nicht möglich (z. B. reiner Vimeo-Link ohne Zugriff), erscheint eine gestaltete Ersatzkachel im Leader-OS-Look mit Titel — nie ein leerer Kasten oder ein gebrochenes Bild-Symbol.
- **Bild aus dem Video wählen** (deine Entscheidung): Im Admin pro Video ein Sekundenfeld mit Sofort-Vorschau — „Sekunde 4,5 als Vorschaubild übernehmen“. Gilt für generierte Clips, eigene Uploads und Kurs-Folgen gleichermaßen. Das gewählte Bild wird versioniert, damit es bei allen Nutzern sofort wechselt.
- Für Vimeo-Links wird das Vimeo-Standbild verwendet; wer ein anderes Bild will, wählt es aus einem hochgeladenen Video oder behält das Vimeo-Bild.

---

## Annahmen

- Die Videos im Video-Guide, in den Missionen und auf der Login-Seite sind dieselben Guide-Clips wie bisher; es werden keine neuen Videos generiert und es entstehen keine Render-Kosten.
- Es werden keine Inhalte (Skripte, Sprecher-Stimme, Kursstruktur) verändert.
- Uploads liegen im bestehenden Objektspeicher; Videos werden weiterhin über die App ausgeliefert, nicht über eine öffentliche Adresse.
- Zugriffsrechte bleiben wie heute: gesperrte Kurs-Folgen bleiben gesperrt, auch wenn ein Vimeo-Link gesetzt ist.
- Der Download im Admin ist an den Admin-Zugang gebunden; Adressen sind nicht ohne Anmeldung aufrufbar und nicht teilbar.
- Reihenfolge der Auslieferung: Diagnose-Einstieg → „Mit Wlad sprechen“ → Video-Feld mit Upload/Link/Download → Thumbnails. Jeder Punkt ist einzeln nutzbar, falls du zwischendurch etwas vorziehen willst.

## Nicht Teil dieses Plans

- Schneiden/Trimmen direkt in der App (bewusst außerhalb: Download → externes Programm → Upload).
- Neue Videos generieren, neue Kurse oder neue Challenge-Erklärvideos.
- Vimeo-Konto-Einstellungen (Sichtbarkeit, Domain-Sperre) — das passiert in deinem Vimeo-Konto; die App prüft nur, ob ein Link abspielbar ist.
