# Onboarding-Videos mit Wlad-Avatar: „So nutzt du die KI richtig"

## Ziel

Jeder Nutzer versteht in den ersten Minuten, wie er mit der KI arbeitet — und vor
jeder Mission kurz, was in genau dieser Mission von ihm erwartet wird. Statt
Textwänden erklärt Wlad es selbst: als kurzer Video-Clip mit seinem Avatar und
seiner Stimme, überall im gleichen Ton und im gleichen Look.

Zwei Video-Familien:

1. **Erststart-Serie** (für alle Neuen, einmalig im Onboarding)
2. **Mission-Intros** (ein kurzer Clip pro Mission, direkt vor dem Start)

---

## Was der Nutzer sieht

**Erststart-Serie — 5 Clips, je 30–45 Sekunden:**

| # | Clip | Inhalt |
|---|------|--------|
| 1 | Willkommen | Was Leader-OS ist, was in den nächsten 10 Minuten passiert |
| 2 | So sprichst du mit der KI | Konkrete Frage statt Stichwort; Beispiel „schlecht → gut" |
| 3 | Kontext ist alles | Rolle, Unternehmen, Branche + „Über mich" — warum die Antworten dadurch anders werden |
| 4 | Deine Werkzeuge | Chat, Simulation, Video-Analyse, Playbooks — wann welches |
| 5 | Deine ersten 7 Tage | Was der Nutzer konkret zuerst macht |

Die Serie läuft im Onboarding, ist jederzeit überspringbar und danach dauerhaft
in einem **Video-Guide** abrufbar (eigener Menüpunkt). Fortschritt wird gemerkt:
„3 von 5 gesehen".

**Mission-Intros — je 20–35 Sekunden**, direkt vor dem Missionsstart:
Was diese Mission trainiert, wie man die KI dabei einsetzt, was ein gutes
Ergebnis ist. Wird beim ersten Aufruf automatisch gezeigt, danach als kleines
Play-Symbol im Missions-Kopf; „Nicht mehr automatisch zeigen" ist möglich.

**Für alle Clips gilt:**
- Untertitel sind standardmäßig sichtbar (die meisten schauen mobil ohne Ton)
- Das Skript steht als aufklappbarer Text unter dem Player — lesbar in 20 Sekunden,
  für alle, die nicht schauen wollen
- Kein Autoplay mit Ton; Ton startet erst auf Klick
- Fehlt ein Video (noch nicht produziert oder Ladefehler), erscheint automatisch
  der Textabschnitt — es entsteht nie ein Loch in der Oberfläche

---

## Wie die Videos entstehen

Ein Standbild von Wlad plus eine Tonspur werden von einem KI-Dienst zu einem
sprechenden Video zusammengesetzt (fal.ai, über das bestehende Emergent-Guthaben
abgerechnet). Die Videos werden **einmal von Wlad im Admin-Bereich erzeugt und
freigegeben**, danach dauerhaft gespeichert und an alle Nutzer ausgeliefert.
Es wird nichts pro Nutzer generiert — laufende Kosten pro Aufruf entstehen nicht.

Ablauf im Admin-Bereich, pro Clip:

1. **Skript** — wird aus den vorhandenen Missions- und Onboarding-Inhalten
   vorgeschlagen, in Wlads Sprache, 60–110 Wörter
2. **Wlad liest, kürzt, schärft** — nichts geht ungeprüft raus
3. **Stimme erzeugen** → kurz anhören
4. **Video erzeugen** → ansehen
5. **Freigeben** — erst danach ist es für Nutzer sichtbar

Ohne Freigabe passiert nichts. Jeder Clip kann jederzeit neu erzeugt oder durch
eine echte Aufnahme von Wlad ersetzt werden, ohne dass sich an der Oberfläche
etwas ändert.

### Was dafür einmalig gebraucht wird

- **Ein sauberes Frontalfoto von Wlad**: Kopf und Schultern, Blick in die Kamera,
  Augen offen, ruhiger Hintergrund, gleichmäßiges Licht. Je besser dieses eine
  Bild, desto besser sehen alle 45 Clips aus. Alternativ kann ein Einzelbild aus
  dem bestehenden Willkommensvideo verwendet werden.
- **Eine Stimmprobe von Wlad**, 30–60 Sekunden sauber gesprochen (die Tonspur des
  bestehenden Willkommensvideos genügt voraussichtlich).

---

## Entscheidungen

### 1. Stimme

| Variante | Bewertung |
|---|---|
| **Stimme aus Wlads Aufnahme klonen** (empfohlen) | Klingt nach Wlad, kein zusätzliches Abo, sofort einsetzbar. Kosten praktisch null (rund 1 $ für alle Skripte zusammen) |
| ElevenLabs-Stimme (bereits vorhanden) | Beste Qualität, aber blockiert: der Professional-Clone braucht dort den Creator-Tarif (ca. 22 $/Monat) |
| Neutrale deutsche KI-Stimme | Sofort verfügbar, aber nicht Wlads Stimme — schwächt die Wirkung deutlich |

Angenommen wird Variante 1. Sobald der Creator-Tarif aktiv ist, kann auf
ElevenLabs umgestellt werden, ohne die Clips neu zu planen.

### 2. Umfang der ersten Runde

Die Videoerzeugung kostet einmalig echtes Guthaben (Abrechnung nach Sekunde).
Deshalb in Stufen:

| Stufe | Inhalt | Videolänge gesamt | Grobe Einmalkosten* |
|---|---|---|---|
| **A** | Erststart-Serie (5 Clips) | ~3 Min | ca. 25–40 $ |
| **B** | A + die ersten 7 Challenge-Tage (12 Clips) | ~7 Min | ca. 60–90 $ |
| **C** | A + alle Missionen, Tools, Simulationen, Video-Analyse (ca. 45 Clips) | ~22 Min | ca. 200–280 $ |

\* inklusive Puffer für Nachdrehs; Auflösung 720p. In 480p etwa halbe Kosten,
sichtbar weicher auf großen Bildschirmen.

Angenommen wird **Stufe B**: die Erststart-Serie plus die ersten sieben Tage.
Damit ist der Moment abgedeckt, in dem Nutzer abspringen, und die Qualität lässt
sich an einem echten Publikum prüfen, bevor Geld in 45 Clips fließt. Der Rest
wird danach batchweise nachgezogen — dieselbe Mechanik, nur mehr Inhalte.

Wichtig: Das Guthaben ist dasselbe, das kürzlich leer lief. Vor einem großen
Batch sollte Auto-Aufladung aktiv sein, sonst bricht die Erzeugung mitten im
Durchlauf ab (halb erzeugte Clips bleiben unveröffentlicht, es geht nichts
verloren).

### 3. Sprache

Deutsch zuerst. Englische Fassungen sind derselbe Ablauf mit übersetztem Skript
und kosten pro Clip erneut — bewusst nicht in dieser Runde, außer es wird
ausdrücklich gewünscht.

### 4. Länge

30–45 Sekunden Erststart, 20–35 Sekunden pro Mission. Kürzer wirkt abgehackt,
länger wird weggeklickt — und die Kosten laufen linear mit der Sekunde.

---

## Nicht Teil dieser Runde

- Videos, die auf den einzelnen Nutzer zugeschnitten sind („Hallo Stefan, …")
- Videos in Marketing-Seiten, E-Mails oder außerhalb der App
- Untertitel als eingebrannte Textspur im Videobild (stattdessen Text unter dem Player)
- Automatische Neuproduktion, wenn sich ein Missionstext ändert — betroffene Clips
  werden im Admin-Bereich lediglich als „Skript veraltet" markiert

---

## Risiken, offen benannt

- **Der Avatar kann unheimlich wirken.** Sprechende Standbilder sind gut geworden,
  aber nicht perfekt; bei schlechter Vorlage fällt es sofort auf. Gegenmaßnahme:
  ein einziger Testclip wird zuerst produziert und beurteilt, bevor der Rest läuft.
  Fällt er durch, ist der bessere Weg, dass Wlad die fünf Erststart-Clips selbst
  aufnimmt und nur die Mission-Intros KI-generiert werden.
- **Kosten laufen über Sekunden, nicht über Clips.** Längere Skripte kosten direkt
  mehr. Die Wortgrenze im Skript ist deshalb keine Kosmetik.
- **Die Produktion braucht Wlads Zeit** — 45 Skripte gegenlesen ist Arbeit. Stufe B
  hält das bei etwa 12 kurzen Texten.
- **Live erst nach erneutem Deploy.** Alles entsteht zuerst in der Vorschau-Umgebung.
