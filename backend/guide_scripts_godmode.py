"""GODMODE-Scripts (Iter 154): Wlads Sprache — direkt, warm, ohne AI-Slop.

Jedes Script: klarer Einstieg → Spannungsbogen → Übergänge → Abschluss → konkreter Next Step.
Haupt- und Nebensätze bewusst gemischt, so erklärt, dass es eine 50-jährige Führungskraft ohne
Tech-Hintergrund sofort versteht. Wlad-Frameworks statt Allgemeinplätze.
"""

SCRIPTS = {
    "start-1-willkommen": (
        "Schön, dass du hier bist. Ich bin Wlad, und das hier ist kein Kurs, den du abarbeitest, sondern ein Ort, an "
        "dem du an deinen eigenen Führungssituationen arbeitest. Stell dir vor, morgen um zehn sitzt dir ein "
        "Mitarbeiter gegenüber, der seit Wochen abbaut, und du weißt noch nicht, wie du das Gespräch eröffnest. Genau "
        "dafür bin ich da. Du sagst mir, was gerade anliegt, damit ich dir nicht irgendwas, sondern den nächsten "
        "sinnvollen Schritt vorschlage. Damit das funktioniert, brauche ich zehn Minuten von dir: Wer bist du, wo "
        "führst du, was macht dir gerade am meisten zu schaffen. Je ehrlicher du das beantwortest, desto besser wird "
        "alles, was danach kommt. Also nimm dir diese zehn Minuten jetzt, nicht später. Wir sehen uns gleich im "
        "nächsten Video – da zeige ich dir, wie du mit mir sprichst."
    ),
    "start-2-so-sprichst-du": (
        "Der Unterschied zwischen einer brauchbaren und einer beliebigen Antwort liegt fast immer in deiner Frage. "
        "Wenn du mir nur Mitarbeitergespräch schreibst, bekommst du das, was in jedem Ratgeber steht, weil ich nichts "
        "über deine Lage weiß. Schreib mir stattdessen so, wie du es einem Coach erzählen würdest, der dich kennt. "
        "Zum Beispiel: Zwei meiner Entwickler reden seit drei Wochen nicht mehr miteinander, das Projekt steht, und "
        "morgen um zehn habe ich beide im Raum. Wie eröffne ich das Gespräch, ohne dass einer gleich dichtmacht? "
        "Jetzt weiß ich, worum es geht, wer beteiligt ist, wann es passiert und was du erreichen willst, und genau "
        "darauf antworte ich dir. Und wenn dir meine Antwort zu allgemein vorkommt, sag es mir, dann frage ich nach, "
        "bis es passt. Deine Aufgabe für heute: Schreib mir die eine Situation, die dir diese Woche am meisten im "
        "Kopf herumgeht. Ich lese mit."
    ),
    "start-3-kontext": (
        "Stell dir vor, zwei Führungskräfte stellen mir dieselbe Frage. Die eine leitet vier Pflegekräfte auf einer "
        "Station, der andere achtzig Leute im Vertrieb. Dieselbe Frage – und trotzdem brauchen beide völlig "
        "verschiedene Antworten. Genau deshalb gibt es deinen Kontext. Du hinterlegst einmal deine Rolle, dein "
        "Unternehmen und deine Branche, und unter „Über mich“ schreibst du auf, was dich ausmacht: deine Stärken, "
        "deine Baustellen, wofür du Verantwortung trägst und was du erreichen willst. Das lese ich bei jeder "
        "einzelnen Antwort mit, ohne dass du es wiederholen musst. Fünf Minuten Aufwand – und aus allgemeinen "
        "Ratschlägen wird Beratung, die in deinen Alltag passt. Also: Bevor du mir die erste Frage stellst, füll "
        "deinen Kontext aus. Je ehrlicher du dort bist, desto besser werde ich für dich. Nimm dir die fünf Minuten "
        "jetzt. Ich warte hier auf dich."
    ),
    "start-4-werkzeuge": (
        "Leader-OS gibt dir vier Werkzeuge, und jedes hat seinen Platz. Der Chat ist zum Denken und Vorbereiten da: "
        "Wie baue ich das Gespräch auf, welche Argumente tragen, was ist mein Ziel? In der Simulation übst du dann – "
        "dein Gegenüber antwortet, und zwar nicht bequem, sondern so, wie es im echten Leben antworten würde. Die "
        "Video-Analyse zeigt dir anschließend, wie du wirkst: deine Stimme, dein Tempo, deine Struktur, deine "
        "Präsenz. Und die Playbooks sind fertige Abläufe für Situationen, die immer wiederkommen – Feedback geben, "
        "Kritik annehmen, eine Entscheidung verkünden. Meine Empfehlung für den Anfang: erst denken im Chat, dann "
        "üben in der Simulation, dann aufnehmen in der Video-Analyse. Genau diese Reihenfolge macht aus Wissen "
        "Können. Probier heute das erste Werkzeug aus – der Chat wartet schon auf dich. Fünf Minuten reichen für den "
        "Anfang. Und im nächsten Video zeige ich dir, wie deine erste Woche aussieht."
    ),
    "start-5-erste-7-tage": (
        "Lass uns konkret werden, denn Vorsätze führen nicht – Gewohnheiten schon. Heute füllst du deinen Kontext aus "
        "und stellst mir eine echte Frage aus deinem Alltag, die dich gerade beschäftigt. Morgen beginnt Tag eins "
        "deiner Challenge: zehn Minuten, mehr nicht. Dabei lernst du Werkzeuge kennen, die du sofort einsetzen kannst "
        "– zum Beispiel die Feedbackformel: erst sagen, was du beobachtet hast, dann, was es auslöst, und "
        "schließlich, was du dir wünschst. Drei Sätze, die schwierige Gespräche entschärfen. In dieser ersten Woche "
        "nimmst du außerdem ein kurzes Video auf. Ja, das kostet Überwindung – und genau deshalb wirkt es. Sieben "
        "Tage, jeden Tag zehn Minuten. Den Unterschied merkst du nicht am Wissen, sondern daran, wie ruhig du im "
        "nächsten schwierigen Gespräch dastehst. Fangen wir an. Leg dir deine zehn Minuten jetzt in den Kalender. "
        "Morgen sehen wir uns zur ersten Challenge – ich freue mich auf dich."
    ),
    # Iter 167: Login-Teaser GODMODE — Walk-in mit Ton, dann ein durchgehender Take (~47 s). Ton der Landing-Copy
    # („Führe besser. Jeden Tag.“ / „Kein Onlinekurs. Kein Chatbot. Dein tägliches Betriebssystem.“).
    "teaser-login": (  # 3 Kapitel = 3 Absätze (Loft -> Studio -> Studio nah), Leerzeile trennt
        "Du führst ein Team. Du triffst jeden Tag Entscheidungen, die andere Menschen betreffen. Aber wer "
        "bereitet eigentlich dich vor? Ich bin Wlad. Und nach über tausend Trainings weiß ich: Führung scheitert "
        "selten am Wissen. Sie scheitert am Mittwoch um vierzehn Uhr, wenn das schwierige Gespräch wirklich "
        "ansteht.\n\n"
        "Genau dafür habe ich Leader-OS gebaut. Kein Onlinekurs, den du abarbeitest und wieder vergisst. Kein "
        "Chatbot, der dir Allgemeinplätze liefert. Sondern dein tägliches Betriebssystem für Führung: Du "
        "beschreibst mir deine Situation. Wir bereiten das Gespräch gemeinsam vor. Du übst es in der Simulation – "
        "so unbequem wie das echte Leben. Und in der Video-Analyse siehst du, wie du wirklich wirkst.\n\n"
        "Zehn Minuten am Tag. Mit meinen Frameworks, mit deinem Kontext, mit ehrlichem Feedback. Führe besser. "
        "Jeden Tag. Und wenn du erst wissen willst, wo du heute stehst: Mach den kostenlosen Leader-Check auf "
        "leadercheck.de. Danach sehen wir uns hier."
    ),
}

# Formulierungen, die nach Maschine klingen — der Qualitätscheck schlägt an, wenn sie vorkommen.
SCRIPTS["coaching-pakete"] = (
    "Bevor du dir die Pakete ansiehst, eine ehrliche Einordnung. Die meisten Führungskräfte scheitern "
    "nicht am Wissen. Sie scheitern am Mittwoch um vierzehn Uhr, wenn das Gespräch wirklich ansteht. "
    "Genau dafür ist Leader-OS gebaut: zehn Kurse, zweiundsiebzig Folgen, jede unter zwölf Minuten, jede "
    "mit einem Werkzeug, das du am selben Tag einsetzt. Leader-OS für neunhundertsiebenundneunzig Euro im "
    "Jahr enthält die sechs Fundament-Kurse – Rhetorik, schwierige Gespräche, Delegation, Feedback, "
    "Storytelling, Meetings – und mich als Coach, jederzeit, mit deinem Kontext im Kopf. "
    "Leader-OS PLUS ergänzt die vier Kurse für die oberste Ebene – KI-First Leadership, Change, "
    "Executive Presence, Boardroom-Strategie – und zwölf Live-Coachings mit meinem Team, in denen wir "
    "deine echten Fälle durcharbeiten. Der Prozess ist bei beiden gleich: Situation beschreiben, "
    "Werkzeug anwenden, Feedback bekommen, besser ins nächste Gespräch gehen. Das Ergebnis siehst du "
    "nicht in einem Zertifikat, sondern in deinem Team. Schau dir unten an, welches Paket zu deiner "
    "Situation passt. Und wenn du unsicher bist, frag mich einfach direkt."
)

SCRIPTS["bp-playbooks"] = (
    "Die Playbooks sind kein Fragebogen. Sie sind die Vorbereitung, die ich mit meinen Klienten vor jedem "
    "wichtigen Gespräch mache – in fünf Schritten. Best Practice: Nimm ein echtes Gespräch, das in den nächsten "
    "sieben Tagen ansteht, nicht ein Beispiel. Schreib im ersten Schritt die Situation so auf, wie du sie einem "
    "Freund erzählen würdest, mit Namen und Zitat. Beim Ziel formulierst du das Ergebnis in einem Satz, den dein "
    "Gegenüber am Ende selbst sagen könnte. Und lies den Advice Report nicht nur – markiere den einen Satz, den "
    "du morgen wörtlich benutzt. Zehn Minuten Vorbereitung, und das Gespräch läuft anders. Fang mit dem Gespräch an, "
    "vor dem du dich am meisten drückst."
)

SCRIPTS["bp-missionen"] = (
    "Video-Missionen sind dein Trainingsraum. Du bekommst eine Situation – Veränderung erklären, Vision pitchen, "
    "kritisches Feedback geben – und sprichst zwei Minuten in die Kamera. Best Practice aus tausend Trainings: "
    "Erster Versuch ohne Notizen, so wie es im Meeting auch wäre. Dann liest du das Feedback, änderst genau eine "
    "Sache – den Einstieg, das Beispiel, den Schluss – und nimmst sofort ein zweites Mal auf. Nicht drei Sachen. "
    "Eine. So entsteht der Fortschritt, den du nach einer Woche im echten Raum spürst. Und nimm die Mission, die "
    "dir unangenehm ist. Die angenehme kannst du schon. Starte heute mit einem Versuch, zwei Minuten."
)

SCRIPTS["bp-video-analyse"] = (
    "Die Video-Analyse bewertet, was dein Team hört, nicht was du gemeint hast. Ich schaue auf Klarheit, "
    "Sicherheit, Empathie und Struktur – und auf SEXIER: Statement, Erklärung, Beispiel, Wirkung, Begründung, "
    "Einwand. Best Practice: Lade echtes Material hoch, nicht die geschönte Version. Ein Meeting-Ausschnitt, eine "
    "Präsentation vom Handy, drei Minuten reichen. Schau dir zuerst das schwächste Feld an, nicht die Gesamtnote, "
    "und übe genau dort mit der Übung, die ich dir dazu gebe. Vergleiche nach zwei Wochen den zweiten Upload mit "
    "dem ersten – das ist dein Fortschritt, sichtbar in Zahlen. Nimm dir heute ein Video aus der letzten Woche "
    "und lade es hoch."
)

AI_SLOP = (
    "in der heutigen", "es ist wichtig zu", "tauchen wir ein", "lassen sie uns", "revolutionär", "nahtlos",
    "ganzheitlich", "unverzichtbar", "spielend leicht", "auf das nächste level", "game changer", "letztendlich",
    "zusammenfassend", "in diesem video", "herzlich willkommen zu", "ohne weiteres", "bahnbrechend",
)

# Iter 169: Mission-Briefings Tag 1–7 — ein Take, nur Wlad, klare Aufgabe, natürlicher Schluss.
SCRIPTS["mission-day-1"] = (
    "Tag eins. Bevor wir irgendetwas verändern, wollen wir wissen, wo du stehst. Heute beantwortest du zehn "
    "Fragen zu deinem Führungsalltag – ehrlich, nicht so, wie du gern wärst. Es gibt kein Falsch. Diese Baseline "
    "ist dein Ausgangspunkt, und in einer Woche schauen wir gemeinsam, was sich bewegt hat. Nimm dir zehn ruhige "
    "Minuten, kein Handy nebenbei. Los geht's – ich bin gespannt, wo du startest."
    )
SCRIPTS["mission-day-2"] = (
    "Tag zwei. Jeder redet über KI, und die meisten Führungskräfte schwanken zwischen Hype und Abwehr. Beides "
    "hilft deinem Team nicht. Heute schauen wir nüchtern hin: Wo nimmt KI dir Arbeit ab, wo braucht dein Team "
    "weiter dein Urteil – und wie sprichst du darüber, ohne Angst zu machen oder Versprechen zu geben, die du "
    "nicht halten kannst? Deine Aufgabe: Nenne mir im Chat eine Aufgabe in deinem Team, bei der du dir heute "
    "unsicher bist, ob KI helfen sollte. Damit arbeiten wir."
    )
SCRIPTS["mission-day-3"] = (
    "Tag drei. Du sagst etwas, dein Team hört etwas anderes – und du merkst es erst, wenn das Ergebnis nicht "
    "stimmt. Heute geht es darum, wie deine Botschaft wirklich ankommt: ein klarer Kern, ein Satz, den man sich "
    "merken kann, und die Frage danach, was verstanden wurde. In der Challenge übst du das an einer echten "
    "Nachricht, die du diese Woche loswerden musst. Formuliere sie heute einmal so, wie du sie normalerweise "
    "sagen würdest – und dann so, dass sie hängen bleibt. Wir vergleichen."
    )
SCRIPTS["mission-day-4"] = (
    "Tag vier. Feedback scheitert selten an der Absicht, fast immer an der Form. Zu weich, und nichts ändert "
    "sich. Zu hart, und dein Gegenüber macht dicht. Heute lernst du eine Struktur, mit der du klar bleibst und "
    "trotzdem in Verbindung: Beobachtung, Wirkung, Wunsch. Deine Aufgabe: Denk an eine Person, der du seit Wochen "
    "etwas sagen willst. Formuliere ihr Feedback heute in drei Sätzen – und übe es in der Simulation, bevor du es "
    "wirklich sagst. Ich höre zu."
    )
SCRIPTS["mission-day-5"] = (
    "Tag fünf. Die wichtigen Entscheidungen triffst du nie mit allen Informationen. Wer wartet, bis alles klar "
    "ist, entscheidet am Ende gar nicht – und das Team wartet mit. Heute schauen wir, wie du gute Entscheidungen "
    "triffst, wenn vieles offen ist: Was weißt du sicher, was nimmst du an, was kannst du in einer Woche wieder "
    "korrigieren? Deine Aufgabe: Nenne mir im Chat eine Entscheidung, die du gerade vor dir herschiebst. Wir "
    "nehmen sie heute auseinander – und du triffst sie bis Freitag."
    )
SCRIPTS["mission-day-6"] = (
    "Tag sechs. Die meisten Konflikte im Team werden nicht zu groß, weil sie groß angefangen haben – sondern weil "
    "niemand sie angesprochen hat, als sie klein waren. Heute geht es um den frühen Satz: ruhig, konkret, ohne "
    "Vorwurf. „Mir ist aufgefallen, dass … Wie siehst du das?“ Das ist alles. Deine Aufgabe: Wo in deinem Team "
    "knirscht es gerade leise? Formuliere den ersten Satz, mit dem du das morgen ansprichst, und übe ihn heute in "
    "der Simulation. Je früher, desto leichter."
    )
SCRIPTS["mission-day-7"] = (
    "Tag sieben. Eine Woche liegt hinter dir – Zeit, ehrlich hinzuschauen. Nicht, ob du alles geschafft hast, "
    "sondern was sich verändert hat: Welches Gespräch ist anders gelaufen? Wo hast du gezögert? Was nimmst du in "
    "die zweite Woche mit? Heute beantwortest du dieselben Fragen wie am ersten Tag, und wir legen die Antworten "
    "nebeneinander. Nimm dir dafür Zeit – das ist der wichtigste Blick der Woche. Ich bin stolz, dass du "
    "drangeblieben bist. Wir sehen uns morgen, in Woche zwei."
    )

# Iter 180: drei neue Ein-Take-Clips (Workflows · Challengers · Simulationen)
SCRIPTS["bp-workflows"] = (
    "Workflows sind die Abkürzung für die Arbeit, die du sowieso machst. Ein Gespräch vorbereiten, eine Absage "
    "formulieren, ein Meeting strukturieren – jeder Workflow ist ein fertiger Ablauf, in den du nur deine Situation "
    "einsetzt. Best Practice: Nimm nicht den, der spannend klingt, sondern den, der zu deinem nächsten Termin passt. "
    "Beantworte die Fragen so, wie du sie einem Kollegen erzählen würdest, mit Namen und Zitat. Am Ende markierst du "
    "den einen Satz, den du wörtlich benutzt. Fünf Minuten Vorbereitung, und du gehst anders in den Raum."
)

SCRIPTS["bp-challengers"] = (
    "Challengers ist die Bühne, auf der du dich vergleichst – nicht mit einem Ranking, sondern mit Menschen, die an "
    "denselben Gesprächen arbeiten wie du. Du wählst eine Herausforderung, sprichst deine Version, und siehst, wie "
    "andere dieselbe Situation gelöst haben. Best Practice: Reiche ein, bevor du dich bereit fühlst. Die erste "
    "Version ist nie die beste, aber sie ist die, aus der du lernst. Schau dir danach genau zwei fremde Beiträge an "
    "und notiere einen Satz, den du übernimmst. So wächst dein Repertoire jede Woche."
)

SCRIPTS["bp-simulationen"] = (
    "Simulationen sind dein Sparringspartner für die Gespräche, vor denen du dich drückst. Du beschreibst die "
    "Situation, ich spiele dein Gegenüber – widerständig, emotional, oder ruhig kalkulierend, so wie im echten Raum. "
    "Best Practice: Nimm ein Gespräch, das wirklich ansteht, und geh mitten hinein, ohne Vorrede. Wenn du merkst, "
    "dass du in die Defensive gerätst, brich ab und starte die Szene neu. Drei Durchläufe, jeweils eine Sache "
    "anders. Danach führst du das Gespräch zum ersten Mal nicht zum ersten Mal."
)
