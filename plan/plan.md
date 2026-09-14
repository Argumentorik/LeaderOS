# Plan: Fix „App hängt nach der Diagnose & Fragen müssen neu beantwortet werden"

## Was gemeldet wurde
Nach Beantwortung der 20 Fragen wurde die Diagnose angezeigt. Danach fror die App ein — und beim erneuten Öffnen mussten alle Fragen wieder von vorne beantwortet werden. Ziel war der untere Button „30-Tage-Plan ansehen".

## Vermutete Ursache (wird beim Fix verifiziert)
Die App löscht die gespeicherten Quiz-Antworten in dem Moment, in dem der Report angefordert wird — nicht erst, wenn der Report sicher angekommen ist. Wenn danach irgendetwas schiefgeht (Seite hängt, Reload, Timeout bei der KI-Generierung, Netzwerkfehler), ist alles weg: Der Nutzer landet wieder bei Frage 1. Zusätzlich hängt die Report-Seite komplett vom Browser-Speicher ab — obwohl der Report bereits auf dem Server liegt und wiederherstellbar wäre.

## Was gebaut wird

### 1. Fortschritt geht nie mehr verloren
- Quiz-Antworten werden erst gelöscht, wenn der Report erfolgreich erstellt UND gespeichert wurde — nicht schon beim Absenden.
- Schlägt die Report-Erstellung fehl, bekommt der Nutzer einen „Erneut versuchen"-Button statt zurück zu Frage 1 geschickt zu werden. Die Antworten bleiben erhalten.

### 2. Report übersteht Reload & Absturz
- Der fertige Report liegt bereits auf dem Server. Wenn der Browser-Speicher leer ist (Absturz, Reload, neuer Tab), lädt die Report-Seite den Report automatisch vom Server nach, statt den Nutzer auf die Startseite zu werfen.
- Gleiches gilt für die Roadmap-Seite („30-Tage-Plan"): Sie funktioniert auch nach einem Reload.

### 3. Ursache des Einfrierens finden und beheben
- Reproduktion des kompletten Flows (20 Fragen → Diagnose → Klick auf „30-Tage-Plan ansehen") und Prüfung, was genau einfriert (z. B. Speicher-/Render-Problem auf der Report-Seite oder blockierende PDF-/Chart-Erzeugung).
- Der gefundene Auslöser wird behoben.

## Annahmen (bitte widersprechen, falls falsch)
- Der Vorfall war auf der Live-Version (exec-eval.emergent.host), nicht in der Preview. Der Fix erfolgt im Code und gilt für beide — danach ist ein erneutes Deployment nötig, damit er live geht.
- „Von vorne beantworten" heißt: Quiz startete wieder bei Frage 1 (nicht: Login verloren).

## Ergebnis für den Nutzer
Egal ob Absturz, Reload oder Timeout: Antworten und Report bleiben erhalten, der Weg zum 30-Tage-Plan funktioniert immer — niemand beantwortet die 20 Fragen zweimal.
