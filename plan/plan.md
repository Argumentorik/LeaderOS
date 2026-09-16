# Kundenfeedback abarbeiten · Qualität auf Produktionsniveau

## 1. Tour-Fehler: Spotlight springt auf das falsche Element

**Gemeldet:** Kundin loggt sich ein, sieht das Video, klickt „Weiter", dann „Zurück", dann wieder
„Weiter" — danach liegt der Lichtkegel auf „Mein Fortschritt", während der Text und der Pfeil
„Video-Analyse" erklären (Schritt 7/12).

**Was passiert:** Beim Zurückgehen wird der Text-Schritt gewechselt, der markierte Bereich aber
nicht neu berechnet. Ab da laufen Erklärung und Markierung dauerhaft auseinander — jeder weitere
Klick verschiebt die Lücke.

**Künftig:**
- Markierung, Text und Pfeil kommen aus einer Quelle: Der Lichtkegel wird bei JEDEM Schrittwechsel
  neu am Ziel gemessen — vor, zurück, übersprungen, Fenster verkleinert, Seite gescrollt.
- Ist das Ziel eines Schritts gerade nicht sichtbar (zugeklappte Sidebar, Handy-Ansicht, Feature für
  diesen Kunden gesperrt), wird es vorher sichtbar gemacht; geht das nicht, erscheint der Schritt
  ohne Lichtkegel mittig statt mit falscher Markierung.
- „Zurück" und „Weiter" lassen sich schnell mehrfach klicken, ohne dass Schritte doppelt zählen oder
  die Zählung („7 / 12") von der Anzeige abweicht.
- Wer die Tour abbricht oder durchläuft, bekommt sie nicht erneut; „Tour erneut ansehen" startet
  sauber bei Schritt 1.

## 2. WladBot-Antwort mit „komischen Abkürzungen"

**Gemeldet:** In der Antwort stehen Zeichenfolgen wie `\n`, `\u201e`, `\u201c` mitten im Text —
besonders in den nummerierten Schritten, nachdem die Kundin im Gespräch nachgefragt und Details
ergänzt hat.

**Was passiert:** Es sind keine Abkürzungen, sondern unaufgelöste Steuerzeichen für Zeilenumbruch
und Anführungszeichen. Die Antwort wird an einer Stelle doppelt verpackt und dann als Rohtext
angezeigt, statt als Absätze und „Anführungszeichen".

**Künftig:**
- Antworten werden an einer Stelle entpackt, bevor sie irgendwo erscheinen. Zeilenumbrüche werden zu
  echten Absätzen, `\u201e`/`\u201c` zu deutschen Anführungszeichen. Gilt für Chat, Sprach-Modus,
  Aufgaben-/Schritt-Listen, Verlauf, PDF-Export und Gesprächstitel.
- Ein Schutznetz zusätzlich in der Anzeige: Falls doch einmal Rohzeichen durchkommen, werden sie beim
  Darstellen bereinigt, statt sie dem Kunden zu zeigen.
- Bereits gespeicherte Antworten mit solchen Zeichen werden einmalig mitkorrigiert, damit auch alte
  Gespräche und übernommene Aufgaben sauber aussehen.
- Dieser Fall wird dauerhaft mitgeprüft: eine Nachfrage im laufenden Gespräch („vertiefe das",
  Details nachschieben) muss ohne Rohzeichen ankommen — genau der Weg, den die Kundin gegangen ist.

## 3. Qualität: „keine Vibe-Coded App mehr"

Der Anspruch ist berechtigt, aber „alles auf 100 %" ist kein prüfbares Ziel. Vorgeschlagen wird ein
Durchgang mit harten, nachprüfbaren Grenzen — statt einer offenen Umbau-Runde:

- **Nichts bleibt still kaputt:** Jede Stelle, an der heute ein Fehler unsichtbar verschluckt wird,
  bekommt entweder eine Klartext-Meldung für den Kunden oder einen Eintrag im Fehler-Monitor. Ziel:
  ein Kunde sieht nie einen leeren Bereich ohne Erklärung.
- **Kein Rohtext, keine Platzhalter im Bild:** Systematischer Durchgang über alle Bildschirme auf
  Rohzeichen, „undefined", „NaN", leere Kacheln, abgeschnittene Texte — Handy und Desktop.
- **Große Bausteine entflechten:** Die fünf größten Bildschirme (Dashboard, Challenge, Video-Studio,
  Chat, Admin) werden in kleinere Teile zerlegt, ohne das Verhalten zu ändern. Das ist die Grundlage
  dafür, dass künftige Änderungen nicht an anderer Stelle etwas umwerfen.
- **Kunden-Wege abgesichert:** Registrieren, Login (Passwort, Magic Link, Google), Onboarding samt
  Tour, Chat, Sprach-Modus, Video-Analyse, Kurse, Challenge, Zahlung — jeder Weg wird als
  wiederholbarer Test hinterlegt, der bei jeder späteren Änderung mitläuft.

## 4. 1000 Kunden gleichzeitig

Aktuell ist nichts auf diese Last gemessen — es wäre unseriös, das ohne Zahlen zu behaupten.
Vorgeschlagen:

- **Messen statt hoffen:** Lasttest mit 1000 gleichzeitigen Kunden auf den typischen Wegen
  (Dashboard öffnen, Video starten, Chat-Frage, Kurs-Folge). Ergebnis als Zahlen: Antwortzeiten,
  Fehlerquote, wo es zuerst eng wird.
- **Erwartbare Engstellen vorab entschärfen:** Videos und Vorschaubilder über einen Auslieferungs-
  Dienst (CDN) statt über die App; gleichzeitige Video-Analysen in eine Warteschlange mit ehrlicher
  Wartezeit-Anzeige statt Absage; teure Abfragen einmal berechnen und kurz zwischenspeichern.
- **Ehrliche Obergrenzen:** Für Sprach-Modus und Video-Analyse wird festgehalten, wie viele Kunden
  gleichzeitig bedient werden können, und was passiert, wenn es mehr sind — inklusive dem, was der
  Kunde dann sieht.
- **Grenze:** Mehr Last braucht am Ende mehr Serverleistung. Was mit Code erreichbar ist, wird
  erreicht; wenn danach mehr Leistung nötig ist, kommt eine Kostenangabe statt einer Codeänderung.

## Reihenfolge und Annahmen

1. Die zwei Kundenmeldungen zuerst (Tour, Rohzeichen) — sie treffen jeden neuen Kunden sofort.
2. Danach der Qualitäts-Durchgang aus Punkt 3.
3. Zum Schluss Messung und Engstellen aus Punkt 4.

Annahmen, die widersprochen werden können:
- Punkt 3 und 4 verändern das Aussehen nicht. Es geht um Stabilität, nicht um Design.
- Es werden keine Videos, Stimmen oder Skripte neu produziert.
- Der Lasttest läuft gegen die Testumgebung, nicht gegen die Live-Seite mit echten Kunden.
- Für den Lasttest entstehen geringe Kosten für Rechenzeit; Sprach- und Analyse-Wege werden dabei nur
  stichprobenartig mitgetestet, damit keine unnötigen KI-Kosten anfallen.

## Nicht Teil dieses Plans

- Neue Funktionen.
- Wechsel von Anbietern (Stimme, KI-Modelle, Zahlung).
- Umstellung der Infrastruktur auf einen anderen Hoster.
