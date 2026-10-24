/* Acht Karussells für Wlads LinkedIn (und Instagram) · Serie 01.
 *
 * Jede Folie: { t: Typ, ... }. Typen:
 *   cover     rows (große Wörter, automatisch auf Breite gesetzt), body, photo, sticker
 *   statement rows + optionale Annotation
 *   text      kicker, h (bis 3 Zeilen), p
 *   list      kicker, h, items [[Titel, Beschreibung], …] (max. 5)
 *   figure    Titelzeile dreifach verblassend, großes Wort mit Figur im Buchstaben
 *   photo     Vollbild-Foto (s/w) + Headline
 *   cta       Beta-CTA (Text zentral in CTA unten)
 *
 * Fakten nur aus docs/gtm/WLAD_CANON.md. Keine Webinar-Versprechen: der CTA
 * ist der kostenlose Zugang in der Beta-Phase. SEATS muss der realen
 * Begrenzung entsprechen (Aufnahme stoppt bei dieser Zahl).
 *
 * Ansprache: alle, die ein Team, ein Projekt oder ein Gespräch führen, mit
 * oder ohne Titel. Credentials (seit 2007, 400.000+ Klienten) stehen nicht
 * auf den Folien; der Absender steht einmal, auf der CTA-Folie (BYLINE).
 * `tag` ist die Mono-Zeile oben links: Feldnotiz-Nummer und Thema. */

const SEATS = 50;
const PH = '../../../frontend/public/journal/topics/';
const BYLINE = 'Wlad Jachtchenko · LeaderOS';

const CTA = {
  t: 'cta',
  kicker: 'Beta-Phase · kostenloser Zugang',
  rows: [['Beta.', 'left'], ['Für alle,', 'right'], ['die führen', 'left', true]],
  p: `LeaderOS geht in die Beta: ${SEATS} Plätze, kostenlos, kein Abo. Alle Kurse, die Simulationen und WladBot, der KI-Coach mit meiner Methodik. Für alle, die ein Team, ein Projekt oder ein Gespräch führen, <b>mit oder ohne Titel.</b> Wer dabei sein will: <b>Link im ersten Kommentar.</b>`,
  sticker: [`${SEATS}`, 'Plätze · Beta'],
  note: 'beta · kostenlos · kein abo · solange plätze frei sind',
};

const CAROUSELS = [
  {
    id: 'C01', slug: 'wissen-vs-training', title: 'Wissen wird gelehrt. Verhalten wird trainiert.', tag: 'feldnotiz 01 · wissen vs. training',
    slides: [
      { t: 'cover', rows: [['Wissen', 'left'], ['wird gelehrt.', 'right'], ['Verhalten', 'left'], ['wird trainiert', 'right', true]],
        ann: ['seminar · folien · vergessen', 'nochmal lesen (←)'], photo: PH + 'training-b.webp', pos: '50% 30%',
        p: 'Nach jedem Seminar wissen alle, was zu tun ist. Sechs Wochen später ist das Verhalten das alte. <b>Weil niemand trainiert hat.</b>', sticker: ['W.', 'Führung trainieren'] },
      { t: 'text', kicker: 'Das Muster', h: 'Nach dem Seminar wissen alle Bescheid.',
        p: 'Zwei Tage, 140 Folien, gute Stimmung. Sechs Wochen später: dieselben Meetings, dasselbe Feedback, derselbe Konflikt. Nicht, weil du es nicht verstanden hättest. Du hast es verstanden. Du hast es nur nie geübt.' },
      { t: 'statement', rows: [['Das Problem', 'left'], ['ist nicht', 'right'], ['das Wissen', 'left', true]], ann: 'es ist die wiederholung' },
      { t: 'list', kicker: 'Was Training anders macht', h: 'Drei Dinge.', items: [
        ['Echter Fall', 'Nicht das Beispiel aus dem Buch, sondern dein Gespräch von morgen.'],
        ['Wiederholung', 'Dieselbe Situation fünfmal, bis die Formulierung sitzt.'],
        ['Feedback sofort', 'Nicht im Jahresgespräch, sondern in der Minute danach.'] ] },
      { t: 'photo', photo: PH + 'sprint-b.webp', pos: '50% 55%', h: 'Niemand wird fit von einem Vortrag über Fitness.', ann: 'führung auch nicht' },
      CTA,
    ],
  },
  {
    id: 'C02', slug: '10-stufen-des-zuhoerens', title: 'Gefangen im eigenen Kopf: die 10 Stufen des Zuhörens', tag: 'feldnotiz 02 · zuhören',
    slides: [
      { t: 'figure', fade: 'Ich höre zu. Glaube ich.', word: 'Kopf', letter: 1, vert: 'Nr. 02 · Stufe 2 · auf die eigene Antwort warten', ann: 'gefangen im eigenen' },
      { t: 'text', kicker: 'Montag, Eins-zu-eins', h: 'Sie redet. Ich nicke.',
        p: 'Nennen wir sie Lena. Sie erklärt, warum das Projekt hakt. Ich nicke, ich schaue sie an, ich bin höflich. Und in meinem Kopf formuliere ich schon den Gegenentwurf. Ich warte nur, bis sie fertig ist. Das ist Stufe 2. Dort bleiben die meisten von uns hängen, ein Leben lang.' },
      { t: 'list', kicker: 'Die 10 Stufen des Zuhörens', h: 'Unten und oben.', items: [
        ['Stufe 1', 'Nicht zuhören. Handy, Laptop, der Blick zur Tür.'],
        ['Stufe 2', 'Auf die eigene Antwort warten. Der andere redet, du formulierst.'],
        ['Stufe 10', 'Stille als Zuhören. Du sagst nichts, und der andere kommt auf den Punkt, den er die ganze Zeit umkreist hat.'] ] },
      { t: 'statement', rows: [['Rede', 'left'], ['weniger.', 'right'], ['Frage', 'left'], ['mehr', 'right', true]], ann: 'pro gespräch · jeden tag' },
      { t: 'text', kicker: 'Der Test', h: 'Zähl deine Unterbrechungen.',
        p: 'Nächstes Gespräch, egal ob Eins-zu-eins, Meeting oder Küchentisch: Strichliste. Jedes Mal, wenn du den Satz des anderen beendest oder dazwischengehst, ein Strich. Die Zahl überrascht fast jeden. Dann der Weg nach oben: eine Frage mehr, ein Satz weniger. Pro Gespräch.' },
      { t: 'figure', fade: 'Stille ist auch eine Antwort.', word: 'Still', letter: -1, vert: 'Nr. 02 · Stufe 10 · Stille als Zuhören', ann: 'das ohr ist leer, der andere redet' },
      CTA,
    ],
  },
  {
    id: 'C03', slug: 'feedbackformel-bww', title: 'Die Feedbackformel: Beobachtung, Wirkung, Wunsch', tag: 'feldnotiz 03 · feedback',
    slides: [
      { t: 'cover', rows: [['Nie:', 'left'], ['du bist.', 'right'], ['Immer:', 'left'], ['ich sehe', 'right', true]],
        ann: ['urteil über die person', 'beobachtung · wirkung · wunsch'], photo: PH + 'feedback.webp', pos: '50% 40%',
        p: 'Die Feedbackformel hat drei Teile. <b>Drei Sätze, keine Minute.</b> Kein Urteil über den Menschen, nur über die Situation.', sticker: ['B·W·W', 'Feedbackformel'] },
      { t: 'text', kicker: 'Warum Feedback scheitert', h: '„Du bist unzuverlässig."',
        p: 'Dieser Satz hat noch nie jemanden zuverlässiger gemacht. Er urteilt über den Menschen, nicht über die Situation. Das Gegenüber geht in die Verteidigung, und ab da wird nichts mehr gelernt. Im Team, im Projekt, zu Hause.' },
      { t: 'list', kicker: 'Die Feedbackformel', h: 'B · W · W', items: [
        ['Beobachtung', '„Ich habe gesehen, dass du im Meeting dreimal unterbrochen hast." Nur, was eine Kamera auch gesehen hätte.'],
        ['Wirkung', '„Auf die anderen wirkt das, als zählten ihre Punkte nicht." Die Folge, nicht die Absicht.'],
        ['Wunsch', '„Ich wünsche mir, dass du ausreden lässt." Konkret, machbar, beim nächsten Mal überprüfbar.'] ] },
      { t: 'statement', rows: [['Drei Sätze.', 'left'], ['Keine', 'right'], ['Minute', 'left', true]], ann: 'kein adjektiv, keine diagnose' },
      { t: 'text', kicker: 'Das Schwierige', h: 'Nicht die Formel. Der Moment.',
        p: 'Die Formel kennt jeder nach einer Minute. Schwer ist, sie zu benutzen, wenn der Ärger schon da ist. Deshalb übt man sie vorher. Laut. Mehrmals. Mit einem Gegenüber, das zurückredet.' },
      CTA,
    ],
  },
  {
    id: 'C04', slug: 'sexier-sechs-schritte', title: 'Behaupten reicht nicht: das SEXIER-Modell', tag: 'feldnotiz 04 · argumentieren',
    slides: [
      { t: 'cover', rows: [['Behaupten', 'left'], ['reicht nicht.', 'right'], ['Begründe', 'left'], ['in sechs', 'right'], ['Schritten', 'left', true]],
        ann: ['statement', 'rebuttal'], photo: PH + 'boardroom.webp', pos: '50% 45%',
        p: 'Ein vollständiges Argument hat sechs Schritte. <b>Die meisten hören nach dem ersten auf</b> und wundern sich, dass niemand folgt.', sticker: ['6', 'Schritte · SEXIER'] },
      { t: 'text', kicker: 'Das Meeting', h: '„Wir müssen das Projekt stoppen."',
        p: 'Und dann? Schweigen im Raum. Nicken, keine Bewegung. Die meisten Argumente bestehen aus einer Behauptung. Das ist Schritt eins von sechs. Wer dort aufhört, bekommt Zustimmung im Raum und Widerstand im Flur. Egal, ob du das Meeting leitest oder nur einen Punkt darin hast.' },
      { t: 'list', kicker: 'SEXIER · Schritt 1 bis 3', h: 'Statement. Explanation. Example.', items: [
        ['S · Statement', 'Die These. Ein Satz.'],
        ['E · Explanation', 'Warum das so ist.'],
        ['X · eXample', 'Ein konkreter Fall, den alle im Raum kennen.'] ] },
      { t: 'list', kicker: 'SEXIER · Schritt 4 bis 6', h: 'Impact. Explanation of Impact. Rebuttal.', items: [
        ['I · Impact', 'Was passiert, wenn wir es tun. Und wenn wir es lassen.'],
        ['E · Explanation of Impact', 'Warum diese Folge für genau diese Zuhörer zählt.'],
        ['R · Rebuttal', 'Der stärkste Einwand, selbst vorweggenommen.'] ] },
      { t: 'statement', rows: [['Sechs Schritte.', 'left'], ['Zwei', 'right'], ['Minuten', 'left', true]], ann: 'aus „weiße rhetorik"' },
      { t: 'text', kicker: 'Der häufigste Fehler', h: 'Schritt sechs weglassen.',
        p: 'Aus Angst, dem Einwand Raum zu geben. Dabei ist genau das der Moment, in dem Skeptiker umkippen: Sie merken, dass du ihre Frage schon gedacht hast. Wer alle sechs Schritte geht, muss nicht lauter werden und nicht öfter wiederholen.' },
      { t: 'photo', photo: PH + 'presence.webp', pos: '50% 40%', h: 'Das Argument trägt sich selbst.', ann: 'nicht die lautstärke' },
      CTA,
    ],
  },
  {
    id: 'C05', slug: 'fuenf-rollen', title: 'Die 5 Rollen einer Führungskraft', tag: 'feldnotiz 05 · fünf rollen',
    slides: [
      { t: 'cover', rows: [['Fünf Rollen.', 'left'], ['Eine', 'right'], ['fehlt', 'left'], ['immer', 'right', true]],
        ann: ['kommunikator · manager · team-leader', 'psychologe · problemlöser'], photo: PH + 'team-b.webp', pos: '50% 40%',
        p: 'Wer Verantwortung trägt, spielt drei Rollen gut, eine mittel, <b>und eine lässt er systematisch weg.</b> Meistens, ohne es zu merken.', sticker: ['5', 'Rollen'] },
      { t: 'text', kicker: 'Aus „Die 5 Rollen einer Führungskraft"', h: 'Führung ist kein Job. Es sind fünf.',
        p: 'Kommunikator, Manager, Team-Leader, Psychologe, Problemlöser. Jede Rolle hat ihr eigenes Handwerk, keine ersetzt eine andere. Das gilt für den Teamlead mit drei Leuten genauso wie für die Geschäftsführerin. Und für alle, die noch keinen Titel haben, aber schon Verantwortung.' },
      { t: 'list', kicker: 'Die 5 Rollen', h: 'Welche fehlt bei dir?', items: [
        ['Kommunikator', 'Klar sagen, was Sache ist. Und zuhören, was zurückkommt.'],
        ['Manager', 'Prioritäten, Entscheidungen, Termine. Struktur statt Hektik.'],
        ['Team-Leader', 'Aus Einzelnen eine Mannschaft machen.'],
        ['Psychologe', 'Verstehen, was Menschen antreibt und was sie bremst.'],
        ['Problemlöser', 'Hindernisse wegräumen, bevor das Team darüber stolpert.'] ] },
      { t: 'statement', rows: [['Die Rolle,', 'left'], ['die fehlt,', 'right'], ['sehen die', 'left'], ['anderen zuerst', 'right', true]], ann: 'du selbst zuletzt' },
      { t: 'text', kicker: 'Der Check', h: 'Eine Woche, fünf Striche.',
        p: 'Notiere jeden Abend, welche Rolle du heute gespielt hast. Nach einer Woche siehst du das Muster: Eine Spalte bleibt leer. Genau dort beginnt dein Training. Nicht bei der Rolle, die du schon kannst.' },
      { t: 'photo', photo: PH + 'boardroom-b.webp', pos: '50% 40%', h: 'Führung ist die Rolle, die gerade gebraucht wird.', ann: 'nicht die, die dir liegt' },
      CTA,
    ],
  },
  {
    id: 'C06', slug: 'charisma-code', title: 'Der Charisma-Code: Präsenz, Wärme, Kompetenz', tag: 'feldnotiz 06 · charisma',
    slides: [
      { t: 'cover', rows: [['Charisma', 'left'], ['ist kein', 'right'], ['Talent', 'left', true]],
        ann: ['präsenz · wärme · kompetenz', 'drei signale'], photo: PH + 'stage.webp', pos: '50% 50%',
        p: 'Charisma ist die Summe von drei Signalen, die dein Gegenüber in Sekunden liest. <b>Jedes der drei ist trainierbar.</b>', sticker: ['3', 'Signale'] },
      { t: 'text', kicker: 'Drei Signale', h: 'Präsenz. Wärme. Kompetenz.',
        p: 'Bist du ganz da? Meinst du es gut mit mir? Weißt du, wovon du redest? Mehr fragt dein Gegenüber nicht, und es fragt es in den ersten Sekunden. Die Antworten liest es an deinem Verhalten ab, nicht an deinem Titel.' },
      { t: 'list', kicker: 'Der Charisma-Code', h: 'So liest dich dein Gegenüber.', items: [
        ['Präsenz', 'Handy weg, Blick halten, Pause aushalten. Du bist im Raum, nicht im Kalender.'],
        ['Wärme', 'Namen, Fragen, echtes Interesse. Nicht nett, sondern zugewandt.'],
        ['Kompetenz', 'Klare Sätze, eine These, ein Beleg. Weniger Konjunktiv.'] ] },
      { t: 'statement', rows: [['Leise', 'left'], ['kann', 'right'], ['laut', 'left'], ['sein', 'right', true]], ann: 'präsenz ist keine lautstärke' },
      { t: 'text', kicker: 'Die Übung', h: 'Drei Sekunden Pause.',
        p: 'Bevor du antwortest: drei Sekunden Stille. Es fühlt sich lang an. Für dein Gegenüber wirkt es wie Gewicht. Wer die Pause aushält, wirkt präsenter als jeder, der schnell redet. Übe es heute in einem Gespräch, das nichts kostet.' },
      CTA,
    ],
  },
  {
    id: 'C07', slug: 'die-woche', title: 'Die Woche, die jeder kennt', tag: 'feldnotiz 07 · die woche',
    slides: [
      { t: 'cover', rows: [['Montag:', 'left'], ['diese Woche.', 'right'], ['Freitag:', 'left'], ['nächste Woche', 'right', true]],
        ann: ['„diesmal wirklich"', 'nochmal lesen (←)'], photo: PH + 'solitude.webp', pos: '50% 40%',
        p: 'Du weißt, wie gute Führung geht. <b>Du kommst nur nicht dazu.</b> Die Woche unten kennst du vermutlich auswendig.', sticker: ['Mo', 'bis Fr'] },
      { t: 'list', kicker: 'Die Woche, die jeder kennt', h: 'Mo bis Fr.', items: [
        ['Montag', '„Diese Woche gebe ich endlich gutes Feedback."'],
        ['Dienstag', 'Stress. Drei Meetings. Ein Konflikt. Feedback verschoben.'],
        ['Mittwoch', 'Das schwierige Gespräch? „Nächste Woche wirklich."'],
        ['Donnerstag', 'Der Konflikt eskaliert. Jetzt ist es ein Krisengespräch.'],
        ['Freitag', 'Vom letzten Seminar ist nichts mehr übrig außer den Folien.'] ] },
      { t: 'statement', rows: [['Du weißt,', 'left'], ['wie Führung', 'right'], ['geht. Du', 'left'], ['kommst nur', 'right'], ['nicht dazu', 'left', true]], ann: 'wissen ≠ verhalten' },
      { t: 'text', kicker: 'Warum', h: 'Wissen wird erst durch Training zu Verhalten.',
        p: 'Feedback geben, Konflikte früh ansprechen, klar entscheiden: Du kennst die Theorie. Im Alltag passiert sie trotzdem selten, weil der Alltag keine Gelegenheit zum Üben lässt. Also übt man außerhalb. Kurz. Täglich. Am Fall von morgen.' },
      { t: 'photo', photo: PH + 'time.webp', pos: '50% 50%', h: '15 Minuten am Tag schlagen zwei Tage im Jahr.', ann: 'training statt seminar' },
      CTA,
    ],
  },
  {
    id: 'C08', slug: 'trainierbar-wie-fitness', title: 'Führung ist trainierbar. Wie Fitness.', tag: 'feldnotiz 08 · training',
    slides: [
      { t: 'cover', rows: [['Führung', 'left'], ['ist', 'right'], ['trainierbar.', 'left'], ['Wie Fitness', 'right', true]],
        ann: ['keine frage des talents', 'kurz · täglich · am echten fall'], photo: PH + 'sprint-b.webp', pos: '50% 55%',
        p: 'Niemand wird fit von einem Vortrag über Fitness. <b>Führung funktioniert genauso.</b> Kurze Einheiten, echte Situationen, Feedback, das sofort kommt.', sticker: ['15', 'Minuten am Tag'] },
      { t: 'text', kicker: 'Das Prinzip', h: 'Kurz. Täglich. Am echten Fall.',
        p: 'Nicht einmal im Jahr zwei Tage, sondern jeden Tag ein bisschen. Nicht das Beispiel aus dem Buch, sondern das Gespräch, das morgen ansteht. Nicht Nicken im Seminar, sondern ein Gegenüber, das zurückredet.' },
      { t: 'list', kicker: 'Eine Trainingseinheit', h: '15 Minuten.', items: [
        ['Fall', 'Das Gespräch, das morgen ansteht.'],
        ['Simulation', 'Ein Gegenüber, das zurückredet, statt zu nicken.'],
        ['Feedback', 'Was saß, was fehlte, was du beim nächsten Mal anders sagst.'],
        ['Wiederholung', 'Dieselbe Szene noch einmal. Bis die Formulierung sitzt.'] ] },
      { t: 'statement', rows: [['Nicht', 'left'], ['mehr wissen.', 'right'], ['Öfter', 'left'], ['üben', 'right', true]], ann: 'das ist der ganze trick' },
      { t: 'text', kicker: 'Was wir gebaut haben', h: 'Ein Trainingssystem. Kein Seminar.',
        p: `LeaderOS: meine Methodik als tägliches Training. Die Frameworks aus den Büchern, ein KI-Coach, der sie kennt, Simulationen mit einem Gegenüber, das zurückredet. In der Beta öffnen wir den Zugang jetzt kostenlos: ${SEATS} Plätze, mit oder ohne Titel.` },
      CTA,
    ],
  },
];

window.CAROUSELS = CAROUSELS;
window.BYLINE = BYLINE;
