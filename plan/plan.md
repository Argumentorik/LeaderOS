# Plan: Report-Ablauf klar machen + Godmode-Upgrade der Diagnose-E-Mail

## Worum es geht

Zwei Probleme aus deinem Feedback:

1. **Der Ablauf nach den 20 Fragen ist verwirrend.** Es entsteht der Eindruck,
   der Report werde "gerade im Hintergrund erstellt und per E-Mail geschickt" –
   in Wahrheit passiert nichts, bis man einen Button drückt. Deshalb hast du
   gewartet, mehrfach nachgefragt, und der Report erschien erst, als du zufällig
   auf den "30-Tage-Challenge"-Button geklickt hast.

2. **Die Diagnose-E-Mail (mit dem 7-Seiten-PDF aus deinem Screenshot) soll ein
   Godmode-Design-Upgrade bekommen.** Nur diese eine E-Mail – die anderen
   E-Mails bleiben unangetastet.

---

## Teil 1 · Ablauf nach Frage 20 (klar & eindeutig)

**Ursache:** Nach Frage 20 kommt ein optionaler WladBot-Chat. Der Chat-Bot
antwortet frei und behauptet dabei teils, er "erstelle den Report" und "schicke
eine E-Mail" – obwohl der Report erst startet, wenn man den (unklar benannten)
Button "Deinen 30-Tage-Plan aktivieren" drückt.

**Was sich ändert (gewählte Variante b):**

- Der WladBot-Chat **bleibt erhalten**, wird aber klar als **optional**
  gekennzeichnet ("Optional · du kannst direkt weiter").
- Ein **großer, unmissverständlicher Haupt-Button** wird zur klaren Aktion:
  **"Meinen Report jetzt erstellen →"**. Kein Zweifel mehr, was der nächste
  Schritt ist.
- WladBot wird so eingestellt, dass er **nie mehr behauptet**, er erstelle den
  Report im Hintergrund oder verschicke von selbst eine E-Mail. Stattdessen
  weist er am Ende jeder Antwort freundlich darauf hin, auf den Button zu tippen,
  um den Report jetzt zu bekommen.
- Nach dem Klick wird der Report erstellt und **erscheint automatisch auf
  derselben Seite** – ohne dass man irgendeinen weiteren Button suchen muss.

## Teil 2 · Report erscheint zuverlässig, kein "Hängen"

- Der Erstellungs-Screen ("Dein Leadership-Profil wird erstellt") bekommt eine
  **ehrliche Status-Kommunikation**: klarer Hinweis, dass es bis zu ~60 Sekunden
  dauern kann und man auf der Seite bleiben soll.
- Sobald der Report fertig ist, geht es **automatisch** weiter zum Report – auch
  wenn es etwas länger dauert.
- Falls die Erstellung wirklich mal fehlschlägt, gibt es einen klaren
  "Erneut versuchen"-Button (deine Antworten bleiben gespeichert, du musst nichts
  neu beantworten).
- Wenn man die Seite neu lädt: Report/Antworten gehen nicht verloren, und man
  landet nicht wieder bei einer schon beantworteten Frage.

## Teil 3 · Kostenlos klarmachen – UND den Kursverkauf sichtbar zeigen

Du warst unsicher, ob das Weitermachen Geld kostet. Gleichzeitig sollen wir klar
aufzeigen, dass es auch das **kostenpflichtige Kurs-/Paket-Angebot** gibt – im
selben Aufbau wie auf `leaderos.de/coaching` ("DAS STECKT IN DEN PAKETEN").

**Was gebaut wird:**

- Report **und** 30-Tage-Plan werden klar als **kostenlos** gekennzeichnet
  ("gratis · kein Konto nötig"), damit niemand denkt, der Report koste etwas.
- Direkt im Anschluss (im kostenlosen Report- und/oder 30-Tage-Plan-Bereich)
  kommt eine neue **Paket-Sektion im Coaching-Seiten-Stil**:
  - Kopf-Leiste mit Kennzahlen: **10 Kurse · 72 Folgen · 12 h Praxis ·
    10 Folgen gratis** (analog zum Screenshot).
  - Zwei Paket-Karten:
    - **Leader-OS** — 6 Kurse · 31 Folgen ("Kurse 1–6 · das Fundament", 288 Min):
      Rhetorik-Grundlagen, Schwierige Gespräche meistern, Delegation wie ein
      Profi, Feedback-Formate (SBI & WWW), Storytelling im Boardroom,
      Meeting-Rhetorik.
    - **Leader-OS Plus** — 4 Kurse · 41 Folgen ("Kurse 7–10 · Top-Ebene +
      Live-Coachings", 456 Min): KI-First Leadership, Change Management Master,
      Executive Presence & Charisma, Boardroom-Strategie. Mit "Live dabei"-Badge.
  - Pro Kurs: Titel, Anzahl Folgen, Minuten, ein **"1 gratis"**-Hinweis und ein
    kurzer Teaser-Satz (wie im Screenshot, aufklappbar).
  - Klarer **Verkaufs-CTA** ("Sprint sichern" / "Zur Bibliothek →"), der zur
    bestehenden Checkout-Seite führt.
- Die Botschaft bleibt eindeutig: **Report + 30-Tage-Plan = gratis. Die tiefen
  Kurse/Live-Coachings = das bezahlte Upgrade.**

Preise werden aus dem bestehenden System übernommen (Sprint = 997 €,
Plus-Plus = 4.797 €). Es werden **keine neuen Preise erfunden**.

---

## Teil 4 · Godmode-Design-Upgrade der Diagnose-E-Mail

Betrifft **nur** die Diagnose-/Report-E-Mail: den E-Mail-Text **und** das
angehängte 7-Seiten-PDF (das ist genau der Screenshot, den du geschickt hast).

**Konkrete Probleme, die behoben werden:**

- **Kaputte Symbole im PDF:** Icons wie das Schloss (🔒), Funkeln (✨) und
  Häkchen werden aktuell von der PDF-Schrift nicht sauber dargestellt (leere
  Kästchen / fehlende Zeichen). Diese werden durch **sauber gezeichnete Icons /
  Symbole** ersetzt, die überall korrekt aussehen.
- **Überlaufender Text:** Auf der "Pattern"-Seite läuft der Text teils über den
  Rahmen hinaus (im Screenshot sichtbar). Karten und Textboxen werden so
  angepasst, dass **nichts mehr über den Rand ragt**.

**Design-Upgrade (im bestehenden Dark/Lime-Look, Ästhetik bleibt):**

- Hochwertigeres, ruhigeres Layout mit mehr Struktur und Weißraum (Apple/Linear-
  Niveau) über alle 7 PDF-Seiten.
- Sauberere Typo-Hierarchie, klarere "Enthüllt vs. gesperrt"-Optik, edlere
  Karten und Fortschritts-Elemente.
- Der E-Mail-Text (Betreff, Vorschau, Body) wird ebenfalls auf dasselbe
  Premium-Niveau gehoben, damit E-Mail und PDF wie aus einem Guss wirken.

**Ziel:** Die Diagnose-E-Mail, die beim Kunden ankommt, sieht durchgehend
premium aus – kein einziges kaputtes Symbol, kein Überlauf, kein "billiger"
Eindruck.

---

## Teil 5 · Quiz später fortsetzen + Erinnerungs-E-Mail

**Problem heute:** Der Quiz-Fortschritt wird nur im Browser gespeichert. Wer bei
Frage 13 abbricht, den Browser schließt oder das Gerät wechselt, verliert den
Fortschritt – und es gibt keine Erinnerung, weiterzumachen. (Kleiner Bug obendrauf:
nach einem Neuladen musste teils die letzte Frage erneut beantwortet werden.)

Die gute Nachricht: Name + E-Mail werden bereits **vor** dem Quiz erfasst. Damit
können wir zuverlässig speichern und erinnern.

**Was gebaut wird:**

1. **Fortschritt serverseitig sichern:** Jede beantwortete Frage wird (zusätzlich
   zum Browser) am Server gespeichert – inkl. der Stelle, an der man ist.
2. **Nahtlos fortsetzen:** Kcommt jemand zurück, landet er automatisch **genau bei
   der nächsten offenen Frage** – egal ob gleicher Browser, neuer Browser oder
   anderes Gerät. Der "letzte Frage erneut beantworten"-Effekt wird behoben.
3. **Wiederaufnahme-Link:** Ein persönlicher Link führt direkt zurück in das Quiz
   an die richtige Stelle (für die Erinnerungs-E-Mail und geräteübergreifend).
4. **Erinnerungs-E-Mail bei Abbruch:** Wer das Quiz startet, aber nicht abschließt,
   bekommt automatisch eine freundliche Erinnerung mit dem Wiederaufnahme-Link
   ("Du warst bei Frage X von 20 – mach in 3 Minuten fertig").
   - **Timing (Vorschlag):** 1. Erinnerung ~2 Stunden nach dem Abbruch, 2. (letzte)
     Erinnerung ~24 Stunden später, wenn immer noch nicht fertig.
   - **Nicht erinnern**, wenn der Report bereits erstellt wurde (fertig), der Nutzer
     abbestellt hat oder bereits gekauft hat.
   - Design im gleichen Premium-Dark/Lime-Look wie die übrigen Mails.

**Ziel:** Kein verlorener Lead mehr. Abbrecher werden zurückgeholt und können ohne
Reibung genau dort weitermachen, wo sie waren.

---

## Nicht Teil dieses Plans (bewusst ausgeklammert)

- Die **anderen bestehenden E-Mails** (Willkommen, 7 Upgrade-/Drip-Episoden,
  Zahlungsbestätigung, Wochen-Erinnerungen) werden **nicht** verändert. (Die
  Quiz-Erinnerung ist eine neue, zusätzliche E-Mail.)
- Der **Dark/Lime-Look** und die generelle Ästhetik bleiben – es wird verfeinert,
  nicht neu erfunden.
- **Preise/Stripe-Logik** werden nicht geändert.
- Die 20 Diagnose-Fragen und die Score-Berechnung bleiben unverändert.

## Annahmen

- Der Report und der 30-Tage-Plan sind und bleiben kostenlos; bezahlt werden nur
  die Kurs-Pakete (Sprint / Plus-Plus). (Falls das nicht stimmt, bitte melden.)
- Die neue Paket-Sektion wird optisch am Screenshot von `leaderos.de/coaching`
  ("DAS STECKT IN DEN PAKETEN") ausgerichtet und im kostenlosen Report-/
  30-Tage-Plan-Bereich platziert. Sie verlinkt zum bestehenden Checkout.
- "Die eine E-Mail" = die Diagnose-/Report-E-Mail inkl. ihrem PDF-Anhang.
- Quiz-Erinnerung: 1. Mail nach ~2 h, 2. Mail nach ~24 h; ausgelöst, sobald jemand
  das Quiz begonnen, aber nicht abgeschlossen hat. (Timing anpassbar.)

## Hinweis zum Live-Gang

Die Änderungen werden zuerst in der Vorschau-Umgebung gebaut und getestet. Damit
sie auf der Live-Seite ankommen, muss anschließend einmal manuell neu deployed
werden.
