"""GODMODE-Scripts (Iter 154): Wlads Sprache — direkt, warm, ohne AI-Slop.

Jedes Script: klarer Einstieg → Spannungsbogen → Übergänge → Abschluss → konkreter Next Step.
Haupt- und Nebensätze bewusst gemischt, so erklärt, dass es eine 50-jährige Führungskraft ohne
Tech-Hintergrund sofort versteht. Wlad-Frameworks statt Allgemeinplätze.
"""

SCRIPTS = {
    "start-1-willkommen": (
        "Schön, dass du da bist. Ich bin Wlad, und ich sage dir gleich zu Beginn, was Leader-OS nicht ist: "
        "kein Kurs mit dreißig Videos, die du brav abarbeitest und danach vergisst. Leader-OS ist dein "
        "Sparringspartner für den Führungsalltag – für das Gespräch, das dir seit Tagen im Kopf herumgeht, "
        "für den Mitarbeiter, der nachlässt, für die Präsentation, bei der es wirklich um etwas geht. "
        "Du beschreibst mir deine Situation, und wir arbeiten sie gemeinsam durch: mit den Frameworks aus "
        "meinen Trainings, mit klaren Schritten und mit ehrlichem Feedback. Warum das anders ist? Weil hier "
        "nicht das Lehrbuch entscheidet, sondern deine Realität. In den nächsten Videos zeige ich dir, wie du "
        "mit mir sprichst, wie du dein System einrichtest und womit du in der ersten Woche anfängst. "
        "Nimm dir dafür zehn Minuten. Sie sind gut investiert."
    ),
    "start-2-so-sprichst-du": (
        "Wie gut ich dir helfen kann, hängt an einer einzigen Sache: an deiner Frage. Die meisten tippen "
        "Stichworte ein – „Mitarbeitergespräch“, „Konflikt im Team“ – und bekommen Antworten, die auf jeden "
        "passen und deshalb niemandem wirklich helfen. Mach es anders. Erzähl mir die Situation so, wie du "
        "sie einer guten Freundin erzählen würdest: Wer ist beteiligt, was ist passiert, wann steht das "
        "Gespräch an, und was willst du am Ende erreichen? Zum Beispiel: „Zwei aus meinem Team reden seit "
        "drei Wochen nicht mehr miteinander, das Projekt steht, morgen um zehn habe ich beide im Raum. Wie "
        "eröffne ich das Gespräch?“ Merkst du den Unterschied? Jetzt kann ich mit dir vorbereiten, statt zu "
        "dozieren. Schreib mir wie einem Coach, der dich kennt – nicht wie einer Suchmaschine. Dann wird "
        "jede Antwort deine Antwort."
    ),
    "start-3-kontext": (
        "Stell dir vor, zwei Führungskräfte stellen mir dieselbe Frage. Die eine leitet vier Pflegekräfte auf "
        "einer Station, der andere achtzig Leute im Vertrieb. Dieselbe Frage – und trotzdem brauchen beide "
        "völlig verschiedene Antworten. Genau deshalb gibt es deinen Kontext. Du hinterlegst einmal deine "
        "Rolle, dein Unternehmen und deine Branche, und unter „Über mich“ schreibst du auf, was dich "
        "ausmacht: deine Stärken, deine Baustellen, wofür du Verantwortung trägst und was du erreichen "
        "willst. Das lese ich bei jeder einzelnen Antwort mit, ohne dass du es wiederholen musst. Fünf "
        "Minuten Aufwand – und aus allgemeinen Ratschlägen wird Beratung, die in deinen Alltag passt. Also: "
        "Bevor du mir die erste Frage stellst, füll deinen Kontext aus. Je ehrlicher du dort bist, desto "
        "besser werde ich für dich."
    ),
    "start-4-werkzeuge": (
        "Leader-OS gibt dir vier Werkzeuge, und jedes hat seinen Platz. Der Chat ist zum Denken und "
        "Vorbereiten da: Wie baue ich das Gespräch auf, welche Argumente tragen, was ist mein Ziel? In der "
        "Simulation übst du dann – dein Gegenüber antwortet, und zwar nicht bequem, sondern so, wie es im "
        "echten Leben antworten würde. Die Video-Analyse zeigt dir anschließend, wie du wirkst: deine Stimme, "
        "dein Tempo, deine Struktur, deine Präsenz. Und die Playbooks sind fertige Abläufe für Situationen, "
        "die immer wiederkommen – Feedback geben, Kritik annehmen, eine Entscheidung verkünden. Meine "
        "Empfehlung für den Anfang: erst denken im Chat, dann üben in der Simulation, dann aufnehmen in der "
        "Video-Analyse. Genau diese Reihenfolge macht aus Wissen Können. Probier heute das erste Werkzeug "
        "aus – der Chat wartet schon auf dich."
    ),
    "start-5-erste-7-tage": (
        "Lass uns konkret werden, denn Vorsätze führen nicht – Gewohnheiten schon. Heute füllst du deinen "
        "Kontext aus und stellst mir eine echte Frage aus deinem Alltag, die dich gerade beschäftigt. Morgen "
        "beginnt Tag eins deiner Challenge: zehn Minuten, mehr nicht. Dabei lernst du Werkzeuge kennen, die "
        "du sofort einsetzen kannst – zum Beispiel die Feedbackformel: erst sagen, was du beobachtet hast, "
        "dann, was es auslöst, und schließlich, was du dir wünschst. Drei Sätze, die schwierige Gespräche "
        "entschärfen. In dieser ersten Woche nimmst du außerdem ein kurzes Video auf. Ja, das kostet "
        "Überwindung – und genau deshalb wirkt es. Sieben Tage, jeden Tag zehn Minuten. Den Unterschied "
        "merkst du nicht am Wissen, sondern daran, wie ruhig du im nächsten schwierigen Gespräch dastehst. "
        "Fangen wir an."
    ),
    "teaser-login": (
        "Du führst ein Team – aber wer coacht eigentlich dich? Ich bin Wlad. Leader-OS ist dein persönlicher "
        "Sparringspartner: Wir bereiten schwierige Gespräche gemeinsam vor, du übst sie in der Simulation, und "
        "in der Video-Analyse siehst du, wie du wirklich wirkst. Kein Kurs zum Abarbeiten, sondern ein System, "
        "das mit dir arbeitet – jeden Tag zehn Minuten. Starte jetzt, kostenlos."
    ),
}

# Formulierungen, die nach Maschine klingen — der Qualitätscheck schlägt an, wenn sie vorkommen.
AI_SLOP = (
    "in der heutigen", "es ist wichtig zu", "tauchen wir ein", "lassen sie uns", "revolutionär", "nahtlos",
    "ganzheitlich", "unverzichtbar", "spielend leicht", "auf das nächste level", "game changer", "letztendlich",
    "zusammenfassend", "in diesem video", "herzlich willkommen zu", "ohne weiteres", "bahnbrechend",
)
