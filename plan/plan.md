# Leader-OS · Gemeldete Fehler und Klarheit für den ersten Besuch

Ein Plan für alles Offene. Reihenfolge: erst die gemeldeten Fehler, dann Credits, dann
Startseite, Kurse, die öffentliche Coaching-Seite und „Was ist neu".

Leitlinie für alles Neue: **eine Sache pro Abschnitt, ein Satz Erklärung dazu, alles Übrige
eingeklappt.** Für jeden Kunden ist das hier das erste Mal.

---

# Teil 0 · Vier gemeldete Fehler

### 0.1 Lichtkegel der Einführung auf dem falschen Menüpunkt
Gemeldet: Das Pop-up erklärt „Playbooks", hervorgehoben wird „Challengers".

Ursache ist derselbe Fehler, der vorher „Video-Analyse" erklärte und „Mein Fortschritt"
markierte: Der Rahmen wurde einmal pro Schritt gemessen — **bevor** die Menüliste sanft
weiterscrollt. Danach liegt er eine Zeile daneben, und „Challengers" steht direkt über
„Playbooks".

Die Korrektur ist bereits gebaut und in der Testumgebung geprüft (Abweichung 0 Pixel über
„Weiter/Zurück/Weiter"), **aber noch nicht live**. Die gemeldete Sichtung stammt von der
Live-Seite. Zu tun:
- Veröffentlichen und danach **auf der Live-Seite** genau ihren Weg nachlaufen: Einführung
  öffnen, bis zum Playbooks-Schritt klicken, vor und zurück, Markierung gegen den erklärten
  Bereich prüfen — auf Desktop und Handy.
- Zusätzliche Absicherung: Ein Schritt markiert ausschließlich sein eigenes Ziel. Lässt sich
  das Ziel nicht sauber vermessen, erscheint der Schritt mittig ohne Markierung, statt
  irgendetwas anderes hervorzuheben.

### 0.2 Level und XP im hellen Modus unlesbar
Gemeldet: Auf der Profilseite sind „Aktuelles Level", „Visionär", „3.537 XP" und „Höchstes
Level erreicht" im hellen Modus nicht zu lesen.

Ursache: Die Schriftfarbe dieser Karte ist die Farbe des jeweiligen Levels. Beim höchsten
Level ist das das Neongrün der Marke — auf weißem Hintergrund praktisch unsichtbar.
- Jede Levelfarbe bekommt eine zweite, dunklere Variante für den hellen Modus. Neongrün wird
  dort zu einem dunklen Grün, wie es der Rest der App schon macht.
- Derselbe Griff wird überall geprüft, wo Levelfarben als Schrift auftauchen: Aktivitätsliste,
  XP-Abzeichen, Kennzahlen-Kacheln, Fortschrittsbalken.
- Prüfmaßstab: Jeder Text hat im hellen **und** im dunklen Modus einen lesbaren Kontrast.
  Geprüft wird an einem Konto mit höchstem Level, weil nur dort das Neongrün auftritt.

### 0.3 Ton läuft weiter, wenn ein Video weggeklickt wird
Gemeldet: Video läuft, es wird weggeklickt oder es soll mit WladBot gesprochen werden — der
Ton läuft weiter.

Ursache: Es gibt einen zentralen Ton-Aus-Schalter, aber Videos melden sich dort nicht an. Er
greift heute nur beim Seitenwechsel und nur für Sprachausgaben.
- Jedes Video meldet sich am zentralen Schalter an. Der Ton hört sofort auf, wenn: das Video
  zugeklappt oder geschlossen wird, der Sprach-Modus oder der Coach-Dialog geöffnet wird, ein
  anderes Video gestartet wird, oder die Seite gewechselt wird.
- Zwei Tonquellen gleichzeitig sind ausgeschlossen — es läuft immer nur eine.
- Beim erneuten Öffnen läuft das Video an der Stelle weiter, an der es angehalten wurde.

### 0.4 Vorschaubilder fehlen manchmal
Gemeldet: „die Thumbnails sind nicht immer da".

Heute gibt es eine gestaltete Ersatzkachel, wenn ein Vorschaubild fehlt — die fällt genau so
auf. Zu tun:
- Kein Video wird veröffentlicht, ohne dass ein Vorschaubild dauerhaft gespeichert vorliegt.
- Nachträglich für alle bestehenden Videos ergänzen — auch für eingebettete und
  hochgeladene.
- Die Prüfung im Admin-Bereich prüft künftig nicht nur, ob ein Bild **eingetragen** ist,
  sondern ob es sich auch tatsächlich **abrufen** lässt; defekte werden gemeldet und neu
  erzeugt.

### 0.5 Benennung „Wlad" bei den KI-Videos
Die Erklär- und Best-Practice-Clips sind KI-erzeugt. Sie heißen künftig nach WladBot, nicht
nach der Person. Kursvideos, in denen Wlad selbst zu sehen ist, bleiben „Wlad".

---

# Teil 1 · Credits & Kaufhinweise (blockiert aktuell eine Kundin)

- Ohne bezahlten Zugang gibt es **50 Credits — einmalig, ohne Nachfüllen**. Jede KI-Aktion
  kostet 1. Ist es leer, wird jede weitere KI-Aktion abgewiesen; das ist im gemeldeten Fall
  sehr wahrscheinlich die Ursache. Belegt wird es zuerst (Zugang, Restguthaben, Verbrauch,
  Zeitpunkte).
- **Fehler:** Bei leerem Guthaben öffnet die App zusätzlich und ungefragt die Kaufabwicklung —
  daher „Kauffenster plus keine Credits". Künftig: genau eine Meldung in Klartext (was
  verbraucht wurde, wofür, welche Möglichkeiten es gibt), der Kauf ist ein Klick darin.
- Gesperrter Bereich und leeres Guthaben sind getrennte Meldungen — nie beide gleichzeitig.
- Vor jeder kostenpflichtigen Aktion steht „kostet 1 von noch 3". Bei 0 ist der Knopf von
  Anfang an ruhiggestellt mit Begründung statt einer Absage nach der Arbeit.
- Video-Auswertung wird **vor** dem Aufnehmen geprüft; wer aufnehmen darf, bekommt die
  Auswertung garantiert.
- Was Coach oder Startseite anbieten, muss mit dem aktuellen Zugang erledigbar sein.
- Support-Werkzeug: pro Kunde Zugangsstufe, Restguthaben, Verbrauch und letzte Aktionen
  sichtbar; Guthaben einzeln auffüllbar ohne Vollzugang; Liste „steckt fest".

---

# Teil 2 · Die Startseite

Heute steht oben eine Sieben-Schritte-Strecke, daneben drei Kennzahlen-Kacheln und eine große
Level-/XP-Karte. Tagesaufgabe, Check-in und Kurse kommen nicht vor. Ergebnis: Messen statt
Machen — und keine Antwort auf „was soll ich hier tun?".

Künftig, in dieser Reihenfolge:
1. **Datum und Stand** — heutiges Datum, Begrüßung, „Tag 7 von 30".
2. **Die Aufgabe für heute** — die Tagesaufgabe der 30-Tage-Herausforderung als einzige große
   Karte: was, wie lange, ein Knopf hinein. Nicht gestartet → „Tag 1 starten". Erledigt →
   sichtbar erledigt plus die nächste sinnvolle Sache.
3. **Check-in (2 Minuten)** — eine Zeile, ein Knopf, ein Satz wozu.
4. **Frag deinen Coach** — Feld plus drei antippbare Beispielfragen, damit die erste Frage
   nicht selbst erfunden werden muss. Diese Stelle trägt am Ende die Nutzung.
5. **Kurse** — wie viele freigeschaltet sind, was als Nächstes dazukommt, wie man an den Rest
   kommt, plus ein Satz, was Kurse hier überhaupt sind.
6. **Eigene Aufgabe anlegen** — ein Feld direkt auf der Startseite.
7. **Über dich** — drei bis vier kurze Angaben (Rolle, Teamgröße, aktuelles Ziel) mit dem
   ehrlichen Grund: damit die Antworten zur eigenen Lage passen. Jederzeit überspringbar.
8. **Nächstes Live-Event** mit Datum und Uhrzeit.
9. **Dein Weiterkommen** — eine ruhige Statuszeile: Level-Name, Tage dabei, gesehene Videos,
   besuchte Live-Events. Zweck ist „ich bilde mich weiter", nicht „ich werde bewertet". XP-Zahl
   und alte Kennzahlen wandern nach „Mehr".
10. **Mehr** — alles Weitere eingeklappt.

Jede Section trägt eine Zeile in normaler Sprache, die sagt, was sie ist. Weniger Karten, mehr
Luft, klare Abstufung zwischen „jetzt" und „später". Gleiche Farben, gleiche Schrift.

**Menü — nur diese drei Wörter ändern:**

| heute | neu |
|---|---|
| Simulationen | Gesprächs-Training |
| Playbooks | Leitfäden |
| Workflows / Tools | Werkzeuge |

Zusätzlich: Die 30-Tage-Herausforderung zeigt ihren Stand direkt im Menü („Tag 7 / 30"), und
es gibt eine dauerhaft erreichbare Seite „Was ist was?" mit einem Satz pro Bereich.

---

# Teil 3 · Kurse-Seite

- **Volle Breite** statt schmaler Spalte.
- **Erklärt statt vorausgesetzt:** oben zwei Sätze — was diese Kurse sind, wie lange eine
  Folge dauert, wie man anfängt — plus ein klarer „Hier starten"-Vorschlag statt einer Wand
  aus Kacheln.
- **Freischaltung sichtbar** an jeder Kachel: frei, freigeschaltet oder noch nicht — und wann
  bzw. wie sie dazukommt. Keine Kachel, die erst beim Klick sperrt.

---

# Teil 4 · Die Seite leaderos.de/coaching

**Wichtigster Befund:** Diese Seite verlangt heute einen Login. Wer über eine Suche oder eine
KI-Empfehlung kommt, landet auf dem Anmeldeformular und ist weg — eine Verkaufsseite, die von
außen niemand sehen kann.

- **Öffentlich ohne Login**, mit Preisen, Leistungen, häufigen Fragen und Kaufmöglichkeit. Wer
  eingeloggt ist, sieht dieselbe Seite passend zum eigenen Zugang.
- **Auffindbar für Suche und KI:** aussagekräftiger Titel und Beschreibung, echte Texte,
  Frage-Antwort-Block in der Sprache, in der Menschen suchen, schnelle Ladezeit.
- **Ein Angebot, ein nächster Schritt:** klare Trennung zwischen selbst lernen (Programm) und
  persönlich arbeiten (Coaching). Keine doppelten Kaufknöpfe, keine widersprüchlichen Preise.
- Die alte Adresse bleibt gültig und leitet weiter, falls umbenannt wird.

---

# Teil 5 · „Was ist neu"

- **Kundensprache statt Technik.** Einträge wie „RAG-Engine 2.0 — Embeddings 100% lokal"
  sagen einem Kunden nichts. Jeder Eintrag beantwortet: was ist neu, und was heißt das für
  dich.
- **Ehrliche, aktuelle Daten.** Die Liste bricht heute mitten im Jahr ab und trägt Daten, die
  nicht zum Kalender passen. Sie wird korrigiert und bis heute geführt.
- **Für die von Anfang an Dabeien:** sichtbar, was aus Kundenrückmeldungen entstanden ist.
- **Für Unternehmen:** ein eigener Block, was die Änderungen für ein Team bedeuten, mit Weg
  zum Team-Angebot.

---

## Entscheidungen

1. **Konto der Kundin (Credits):** a) Vollzugang · b) **(Empfehlung)** 50 Credits auffüllen ·
   c) nur erklären
2. **Freier Zugang generell:** a) 50 einmalig wie heute · b) **(Empfehlung)** monatlich 20
   nachfüllen · c) höheres Einmal-Guthaben
3. **Aufgaben-Bereich für freien Zugang:** a) **(Empfehlung)** aufschließen (zeigt nur eigene
   Aufgaben, kostet keine KI-Leistung) · b) gesperrt lassen — dann bietet der Coach keine
   Aufgaben mehr zum Übernehmen an
4. **Erste Video-Auswertung:** a) **(Empfehlung)** für jeden garantiert · b) keine Ausnahme
5. **Kurse-Section auf der Startseite:** a) **(Empfehlung)** Stand plus nächste Folge plus Weg
   zum Rest · b) nur der Stand · c) nur ein Kaufangebot
6. **XP-Zahl:** a) **(Empfehlung)** vorne nur Level-Name und Statuszeile, Zahl unter „Mehr" ·
   b) XP-Zahl bleibt vorne
7. **Name und Adresse der Coaching-Seite:** a) bleibt „Coaching" · b) **(Empfehlung)**
   „Leadership-Programm" · c) „Mit Wlad arbeiten" · d) „Preise & Programme" · e) eigener
   Vorschlag
8. **Benennung der KI-Videos:** a) **(Empfehlung)** KI-erzeugte Clips heißen „WladBot",
   Kursvideos mit Wlad selbst bleiben „Wlad" · b) überall „WladBot"

## Annahmen
- Keine Funktion wird entfernt; es wird umbenannt, umsortiert, erklärt und aufgeräumt.
- Kein Design-Umbau: Farben, Schrift und Bildsprache bleiben. Ruhiger, nicht anders.
- Alle Texte in Deutsch und Englisch.
- Preise, Pakete und Zahlungsanbieter bleiben unverändert.
- Keine neu produzierten Videos, Stimmen oder Kursinhalte.
- Keine automatischen Mails an betroffene Kunden; Anschreiben bleibt Handarbeit.

## Nicht Teil dieses Plans
- Neue Funktionen, neue Pakete, Rückerstattungen.
- Der offene Qualitäts-Durchgang und der Lasttest für 1000 gleichzeitige Kunden — die bleiben
  danach an der Reihe.
