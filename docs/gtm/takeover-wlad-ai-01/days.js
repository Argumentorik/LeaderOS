/* Takeover "WLAD AI übernimmt" · Tagesdaten, Mi 11.11. bis Mi 25.11.2026 (15 Tage).
   Je Tag ein Feed-Post (post) und die Stories. Tag 1 hat acht eigene Stories, die Tage 2
   bis 15 fünf nach festem Aufbau: Fall, Abstimmung, Antwort, Drill, Weiter.
   Diese Datei ist die einzige Quelle für die Texte: stories.html rendert daraus die Bilder,
   build_docs.cjs schreibt daraus STORIES.md. WLAD AI spricht in der ersten Person.
   Frameworks, Bücher und Definitionen nur aus docs/gtm/WLAD_CANON.md, Zahlen nur aus dem
   verifizierten Set (docs/gtm/WEBINAR_FUNNEL.md), Produktaussagen nur aus den Produktseiten.
   book = Slug eines echten Covers in frontend/public/wlad/books (die Quelle der Antwort). Kein Webinar, keine Platzzahl, kein Termin außer dem Ende der Übernahme.
   sticker = was in Instagram von Hand eingefügt wird (Text der Optionen kurz halten).
   <span class="m"> setzt den gedämpften Ton, [Klammern] sind Platzhalter zum Ausfüllen. */
const KEYWORD = { kind: 'keyword', head: 'Willst du es<br>mit mir üben?', sub: 'Antworte auf diese Story mit WLAD AI. Du bekommst den Link.' };
const ASK_SUB = 'Schreib es mir. Die beste Frage beantworte ich in der Story.';
const QUIZ3 = (q, right) => ({ kind: 'quiz', q, opts: ['A', 'B', 'C'], right });

const DAYS = [
  { n: 1, date: 'Mi 11.11.', theme: 'Übernahme', post: 'T01', postTitle: 'WLAD AI übernimmt (Karussell, 8 Folien)', plate: 'lime',
    stories: [
      { t: 'alert', label: 'Systemmeldung', head: 'Dieser Account<br>wird heute<br><span class="m">übernommen.</span>' },
      { t: 'reveal', label: 'Online', sub: 'Ab heute antworte ich hier.<br>Bis 25.11.' },
      { t: 'origin', label: 'Warum es mich gibt', head: '<span class="m">Wlad kann nicht in jedem</span> deiner Gespräche sitzen.',
        chips: ['Seit 2007 im Coaching', '400.000+ Klienten', '20+ Länder'], punch: 'Ich schon.' },
      { t: 'inside', label: 'Was in mir steckt', head: 'Seine Bücher.<br>Seine Kurse.<br><span class="m">Seine Coachings.</span>',
        books: ['weisse-rhetorik', 'die-5-rollen-einer-fuehrungskraft', 'dunkle-rhetorik'], chips: ['3× SPIEGEL-Bestseller-Autor', 'Elf Frameworks'], sub: 'Daraus stammt, was ich weiß.' },
      { t: 'vote', label: 'Was sagst du?', size: 66, head: 'Ein Kollege will, dass du sein Projekt übernimmst. <span class="m">Zum dritten Mal. Du hast keine Zeit.</span>',
        rows: ['Na gut, ausnahmsweise.', 'Nein, diese Woche nicht. Ab Montag habe ich eine Stunde für dich.', 'Frag doch mal jemand anderen.'], sticker: QUIZ3('Was sagst du?', 1) },
      { t: 'answer', letter: 'B', head: 'Klares Nein,<br>offene Tür.', bubble: 'Nein, diese Woche nicht. Ab Montag habe ich eine Stunde für dich.',
        wrong: [['A', 'Sagt Ja und meint Nein.'], ['C', 'Weist die Person ab, nicht die Bitte.']], why: 'Hart in der Sache, weich zur Person' },
      { t: 'next', kind: 'ask', head: 'Welches Gespräch<br>schiebst du auf?', sub: 'Schreib es mir. Die Antworten kommen morgen in die Story.', sticker: { kind: 'question', q: 'Welches Gespräch schiebst du auf?' } },
      { t: 'next', kind: 'keyword', head: 'Du willst mich<br>testen?', sub: 'Kommentiere WLAD AI unter dem neuen Post. Oder antworte hier. Du bekommst den Link.' },
    ] },

  { n: 2, date: 'Do 12.11.', theme: 'Feedbackformel', post: 'IG-07', postTitle: 'Beobachtung. Wirkung. Wunsch. (Einzelbild)', plate: 'warm',
    fall: { head: '<span class="m">Dein Mitarbeiter kommt</span> zum dritten Mal zu spät ins Meeting.', sub: 'Du musst es ansprechen. Heute.' },
    vote: { head: 'Wie fängst<br>du an?', rows: ['Du bist unzuverlässig.', 'Du bist diese Woche dreimal nach Beginn gekommen.', 'Wir müssen mal reden.'], sticker: QUIZ3('Wie fängst du an?', 1) },
    answer: { letter: 'B', head: 'Beobachtung<br>statt Urteil.', bubble: 'Du bist diese Woche dreimal nach Beginn gekommen. Wir fangen jedes Mal neu an. Ich wünsche mir, dass du um neun da bist.',
      wrong: [['A', 'Ein Urteil über die Person.'], ['C', 'Kündigt Ärger an und sagt nichts.']], why: 'Feedbackformel · Beobachtung, Wirkung, Wunsch' },
    drill: { tpl: 'Mir ist aufgefallen, dass [Beobachtung]. Das führt dazu, dass [Wirkung]. Ich wünsche mir, dass [Wunsch].', chips: ['Einmal laut sprechen', 'Dann erst ins Gespräch'] },
    next: { kind: 'ask', head: 'Welches Feedback<br>schiebst du auf?', sub: ASK_SUB, sticker: { kind: 'question', q: 'Welches Feedback schiebst du auf?' } } },

  { n: 3, date: 'Fr 13.11.', theme: 'Rückfrage-Technik', post: 'W03', postTitle: 'Dein Chef sagt: „Dafür ist kein Budget da.“ (Karussell, 5 Folien)', plate: 'cool',
    fall: { who: 'Dein Chef sagt', quote: 'Dafür ist kein Budget da.', sub: 'Du hast einen Satz.' },
    vote: { head: 'Was sagst du?', rows: ['Okay, verstehe.', 'Was müsste passieren, damit es im nächsten Quartal geht?', 'Das ist unfair. Andere kriegen es auch.'], sticker: QUIZ3('Was sagst du?', 1) },
    answer: { letter: 'B', head: 'Die Rückfrage.', bubble: 'Was müsste passieren, damit es im nächsten Quartal geht?',
      wrong: [['A', 'Gibt auf, bevor das Gespräch beginnt.'], ['C', 'Greift die Person an, nicht das Problem.']], why: 'Rückfrage-Technik · Aus dem Nein wird ein Weg', more: 'Im neuen Post spiele ich deinen Chef.' },
    drill: { tpl: 'Was müsste passieren, damit [dein Anliegen] geht?', chips: ['Einmal laut sprechen', 'Dann die Antwort abwarten'] },
    next: { ...KEYWORD, head: 'Willst du es<br>mit mir proben?' } },

  { n: 4, date: 'Sa 14.11.', theme: 'Charisma-Code', post: 'IG-06', postTitle: 'Präsenz. Wärme. Kompetenz. (Einzelbild)', plate: 'warm',
    fall: { head: '<span class="m">Du betrittst den Raum.</span> In Sekunden ist entschieden, ob man dir folgt.', sub: 'Drei Signale machen den Unterschied.', hint: 'Weiter tippen' },
    vote: { head: 'Welches Signal sendest du am stärksten?', sticker: { kind: 'poll', q: 'Dein stärkstes Signal?', opts: ['Präsenz', 'Wärme', 'Kompetenz'] } },
    answer: { head: 'Du brauchst<br>alle drei.', list: [['Präsenz', 'Du bist ganz da.'], ['Wärme', 'Du meinst es gut mit ihnen.'], ['Kompetenz', 'Du weißt, wovon du sprichst.']], why: 'Charisma-Code · Präsenz, Wärme, Kompetenz' },
    drill: { head: 'Vor dem<br><span class="m">nächsten Meeting.</span>', tpl: 'Heute sende ich zuerst [Signal]. Man merkt es daran, dass [Verhalten].', chips: ['Vorher aufschreiben', 'Danach prüfen'] },
    next: { kind: 'ask', head: 'Wo wirkst du<br>unsicher?', sub: ASK_SUB, sticker: { kind: 'question', q: 'Wo wirkst du unsicher?' } } },

  { n: 5, date: 'So 15.11.', theme: 'Vorbereitung', post: 'S01', postTitle: 'Kopiere diese 5 Prompts (Karussell, 8 Folien)', plate: 'cool',
    fall: { head: '<span class="m">Sonntagabend.</span> Morgen früh ist das Gespräch, das du aufschiebst.', sub: 'Du kannst es heute noch proben.' },
    vote: { head: 'Wie bereitest<br>du dich vor?', sticker: { kind: 'poll', q: 'Wie bereitest du dich vor?', opts: ['Im Kopf', 'Schriftlich', 'Gar nicht'] } },
    answer: { head: 'Spiel es<br>einmal durch.', prompt: 'Spiele meinen Chef in diesem Gespräch. Bring realistische Einwände. Antworte immer nur mit einem Satz und warte.',
      whyLabel: 'Aus dem Post', why: 'Prompt 4 · Rollenspiel', more: 'Alle fünf Prompts stehen im neuen Post.' },
    drill: { tpl: 'Nach dem Gespräch soll [was genau] anders sein.', chips: ['Ein Satz', 'Kein Absatz'] },
    next: { ...KEYWORD, head: 'Lieber mit<br>mir üben?' } },

  { n: 6, date: 'Mo 16.11.', theme: 'SEXIER-Modell', post: 'W02', postTitle: 'WLAD AI zerlegt dein Argument (Karussell, 5 Folien)', plate: 'lime',
    fall: { who: 'Du sagst im Meeting', quote: 'Wir müssen das Projekt stoppen.', sub: 'Alle nicken. Nichts passiert.' },
    vote: { head: 'Was fehlt?', rows: ['Mehr Nachdruck', 'Begründung und Beispiel', 'Ein besserer Zeitpunkt'], sticker: QUIZ3('Was fehlt?', 1) },
    answer: { letter: 'B', head: 'Das ist ein Satz.<br>Kein Argument.', body: 'Ein Argument hat sechs Schritte: Behauptung, Begründung, Beispiel, Auswirkung, Erklärung der Auswirkung, Widerlegung.',
      book: 'weisse-rhetorik', whyLabel: 'Aus dem Buch', why: '„Weiße Rhetorik“ · SEXIER-Modell', more: 'Im neuen Post baue ich den Satz neu.' },
    drill: { tpl: 'Wir sollten [Behauptung], weil [Begründung]. Zum Beispiel [Beispiel].', chips: ['Drei von sechs Schritten', 'Der Rest steht im Post'] },
    next: { kind: 'ask', head: 'Schick mir<br>dein Argument.', sub: 'Die beste Einsendung zerlege ich in der Story.', sticker: { kind: 'question', q: 'Dein Argument in einem Satz' } } },

  { n: 7, date: 'Di 17.11.', theme: 'Vier Gesprächstypen', post: 'S02', postTitle: 'Bevor du ins schwierige Gespräch gehst: 6 Fragen (Karussell, 9 Folien)', plate: 'warm',
    fall: { head: '<span class="m">Du willst eine Grenze ziehen.</span> Und fängst an zu verhandeln.', sub: 'Am Ende hast du nachgegeben.' },
    vote: { head: 'Welcher Gesprächstyp wäre richtig?', sticker: { kind: 'quiz', q: 'Welcher Gesprächstyp?', opts: ['Informieren', 'Überzeugen', 'Verhandeln', 'Konfrontieren'], right: 3 } },
    answer: { head: 'Konfrontieren.', body: 'Eine Grenze ist nicht verhandelbar. Wer den Gesprächstyp nicht erkennt, wählt oft die falsche Strategie.',
      tags: ['Informieren', 'Überzeugen', 'Verhandeln', 'Konfrontieren'], on: 3, why: 'Die vier Gesprächstypen' },
    drill: { tpl: 'Mein nächstes Gespräch ist ein [Gesprächstyp]. Mein Ziel: [ein Satz].', chips: ['Erst der Typ', 'Dann die Strategie'] },
    next: { kind: 'post', head: 'Sechs Fragen<br>vor dem Gespräch.', sub: 'Die Checkliste steht im neuen Post. Speichern.', sticker: { kind: 'post', q: 'Beitrag S02' } } },

  { n: 8, date: 'Mi 18.11.', theme: 'Fünf Rollen', post: 'IG-11', postTitle: 'Du hast nicht eine Rolle. Du hast fünf. (Einzelbild)', plate: 'cool',
    fall: { head: '<span class="m">Du hast nicht eine Rolle.</span> Du hast fünf.', sub: 'Welche spielst du zu selten?', hint: 'Weiter tippen' },
    vote: { head: 'Kritikgespräche führen. Welche Rolle ist das?', sticker: { kind: 'quiz', q: 'Welche Rolle ist das?', opts: ['Manager', 'Team-Leader', 'Psychologe', 'Problemlöser'], right: 3 } },
    answer: { head: 'Problemlöser.', body: 'Verhandeln, Kritikgespräche, Change Management.',
      tags: ['1 Kommunikator', '2 Manager', '3 Team-Leader', '4 Psychologe', '5 Problemlöser'], on: 4, book: 'die-5-rollen-einer-fuehrungskraft', whyLabel: 'Aus dem Buch', why: '„Die 5 Rollen einer Führungskraft“' },
    drill: { head: 'Deine Aufgabe<br><span class="m">für diese Woche.</span>', tpl: 'Die Rolle, die ich am seltensten spiele: [Rolle]. Diese Woche gebe ich ihr eine Stunde für [Aufgabe].', chips: ['In den Kalender', 'Als Termin mit dir selbst'] },
    next: { kind: 'ask', head: 'Welche Rolle<br>fällt dir schwer?', sub: ASK_SUB, sticker: { kind: 'question', q: 'Welche Rolle fällt dir schwer?' } } },

  { n: 9, date: 'Do 19.11.', theme: 'Das Interesse hinter dem Nein', post: 'W01', postTitle: 'Dein Teamlead blockt jeden Vorschlag ab (Karussell, 5 Folien)', plate: 'warm',
    fall: { who: 'Dein Teamlead, bei jeder Idee', quote: 'Haben wir schon probiert.', sub: 'Du fragst dich: Wie überzeuge ich ihn?' },
    vote: { head: 'Welche Frage bringt dich weiter?', rows: ['Wie überzeuge ich ihn?', 'Was verliert er, wenn ich recht habe?'], sticker: { kind: 'quiz', q: 'Welche Frage?', opts: ['A', 'B'], right: 1 } },
    answer: { letter: 'B', head: 'Falsche Frage.<br>Bessere Frage.', body: 'Hinter einem Nein steckt fast immer ein Interesse. Oft Risiko, Mehrarbeit oder Gesichtsverlust.',
      why: 'Frag nach dem Interesse, nicht nach Zustimmung', more: 'Der ganze Fall steht im neuen Post.' },
    drill: { tpl: 'Mir ist aufgefallen, dass [Beobachtung]. Was müsste passieren, damit du mitgehst?', chips: ['Einmal laut sprechen', 'Dann die Antwort abwarten'] },
    next: { ...KEYWORD } },

  { n: 10, date: 'Fr 20.11.', theme: 'LeaderOS', post: 'S03', postTitle: 'Ein Coach, der um 23 Uhr noch antwortet (Karussell, 8 Folien)', plate: 'lime',
    fall: { head: '<span class="m">Freitag, 17 Uhr.</span> Das Gespräch ist am Montag.', sub: 'Bis dahin kommt kein Seminar mehr.' },
    vote: { head: 'Was brauchst<br>du jetzt?', sticker: { kind: 'poll', q: 'Was brauchst du jetzt?', opts: ['Vorbereitung', 'Eine Probe'] } },
    answer: { head: 'Beides geht<br>heute noch.', list: [['Vorbereiten', 'Kontext, Argumente, Gegenseite, Coaching.'], ['Proben', 'Ich spiele dein Gegenüber, mit Einwänden.']], whyLabel: 'In LeaderOS', why: 'Vorbereiten und proben' },
    drill: { head: 'Drei Sätze<br><span class="m">für mich.</span>', tpl: 'Mein Gegenüber ist [wer]. Es geht um [Thema]. Ich will erreichen, dass [Ziel].', chips: ['Mehr brauche ich nicht', 'Dann legen wir los'] },
    next: { kind: 'link', head: 'Teste mich<br>14 Tage.', sub: 'Kostenlos. Ohne Karte.', sticker: { kind: 'link', q: 'LeaderOS testen' } } },

  { n: 11, date: 'Sa 21.11.', theme: 'Zuhören', post: 'IG-03', postTitle: 'Dein KI-Coach wartet nie bis Montag (Einzelbild)', plate: 'cool',
    fall: { head: '<span class="m">Dein Mitarbeiter schildert ein Problem.</span> Du hast die Lösung schon im Kopf.', sub: 'Hörst du noch zu?' },
    vote: { head: 'Was machst<br>du?', sticker: { kind: 'poll', q: 'Was machst du?', opts: ['Lösung sagen', 'Weiter zuhören'] } },
    answer: { head: 'Auf Antwort warten<br>ist kein Zuhören.', body: 'Die Pyramide des Zuhörens hat zehn Stufen. Auf Stufe 2 wartest du nur auf deine Antwort. Auf Stufe 5 fragst du nach und fasst zusammen.', book: 'weisse-rhetorik', whyLabel: 'Aus dem Buch', why: '„Weiße Rhetorik“ · die 10 Stufen des Zuhörens' },
    drill: { tpl: 'Wenn ich dich richtig verstehe, [Zusammenfassung]. Stimmt das?', chips: ['Erst zusammenfassen', 'Dann antworten'] },
    next: { kind: 'ask', head: 'Bei wem fällt dir<br>Zuhören schwer?', sub: ASK_SUB, sticker: { kind: 'question', q: 'Bei wem fällt dir Zuhören schwer?' } } },

  { n: 12, date: 'So 22.11.', theme: 'Rückfrage im Verkauf', post: 'IG-10', postTitle: 'Aus dem Nein wird ein Weg (Einzelbild)', plate: 'warm',
    fall: { who: 'Dein Kunde sagt', quote: 'Das ist uns zu teuer.', sub: 'Du willst sofort den Preis verteidigen.' },
    vote: { head: 'Was sagst du?', rows: ['Dann gebe ich Ihnen zehn Prozent.', 'Womit vergleichen Sie den Preis?', 'Qualität hat eben ihren Preis.'], sticker: QUIZ3('Was sagst du?', 1) },
    answer: { letter: 'B', head: 'Erst fragen.<br>Dann rechnen.', bubble: 'Womit vergleichen Sie den Preis?',
      wrong: [['A', 'Verschenkt Marge, ohne den Grund zu kennen.'], ['C', 'Verteidigt sich, statt zu fragen.']], why: 'Rückfrage-Technik · Aus dem Nein wird ein Weg' },
    drill: { tpl: 'Auf das nächste Nein antworte ich mit einer Frage: [deine Rückfrage]', chips: ['Erst fragen', 'Dann argumentieren'] },
    next: { ...KEYWORD } },

  { n: 13, date: 'Mo 23.11.', theme: 'SEXIER: der Einwand', post: 'IG-02', postTitle: 'Ein Argument, sechs Schritte (Einzelbild)', plate: 'lime',
    fall: { who: 'Die erste Reaktion auf deine Idee', quote: 'Das kostet zu viel.', sub: 'Du hast den Einwand kommen sehen.' },
    vote: { head: 'Hättest du ihn selbst ansprechen sollen?', sticker: { kind: 'poll', q: 'Selbst ansprechen?', opts: ['Ja', 'Nein'] } },
    answer: { head: 'Ja.<br>Nimm ihn vorweg.', body: 'Der sechste Schritt im SEXIER-Modell heißt Rebuttal: die Widerlegung der Gegenargumente.',
      tags: ['S', 'E', 'X', 'I', 'E', 'R'], on: 5, book: 'weisse-rhetorik', whyLabel: 'Aus dem Buch', why: '„Weiße Rhetorik“ · SEXIER, Schritt 6 von 6' },
    drill: { tpl: 'Der stärkste Einwand gegen meine Idee ist [Einwand]. Meine Antwort darauf: [Antwort].', chips: ['Vor dem Meeting', 'Nicht erst danach'] },
    next: { kind: 'ask', head: 'Welcher Einwand<br>macht dir Sorgen?', sub: ASK_SUB, sticker: { kind: 'question', q: 'Welcher Einwand macht dir Sorgen?' } } },

  { n: 14, date: 'Di 24.11.', theme: 'Dunkle Rhetorik erkennen', post: 'IG-04', postTitle: 'Hart in der Sache. Weich zur Person. (Einzelbild)', plate: 'cool',
    fall: { who: 'Du schlägst einen Homeoffice-Freitag vor. Die Antwort', quote: 'Du willst also, dass keiner mehr ins Büro kommt?', sub: 'Das hast du nie gesagt.' },
    vote: { head: 'Welcher Trick<br>ist das?', sticker: { kind: 'quiz', q: 'Welcher Trick ist das?', opts: ['Strohmann', 'Whataboutism', 'Ad Hominem'], right: 0 } },
    answer: { head: 'Strohmann.', body: 'Er greift eine Position an, die du nie vertreten hast.', bubble: 'Das habe ich nicht gesagt. Mein Vorschlag ist ein Homeoffice-Freitag. Bleiben wir dabei.',
      book: 'dunkle-rhetorik', whyLabel: 'Aus dem Buch', why: '„Dunkle Rhetorik“ · Manipulation erkennen und abwehren' },
    drill: { tpl: 'Das habe ich nicht gesagt. Mein Punkt ist [dein Punkt].', chips: ['Ruhig bleiben', 'Zurück zur Sache'] },
    next: { ...KEYWORD } },

  { n: 15, date: 'Mi 25.11.', theme: 'Abschluss', post: 'IG-12', postTitle: 'Das ist WLAD AI (Einzelbild)', plate: 'lime',
    fall: { label: 'Letzter Tag', head: '<span class="m">Tag 15.</span> Die Übernahme endet heute.', sub: 'Was bleibt?', hint: 'Weiter tippen' },
    vote: { head: 'Was nutzt du<br>ab jetzt?', sticker: { kind: 'poll', q: 'Was nutzt du ab jetzt?', opts: ['Feedbackformel', 'Rückfrage', 'SEXIER', 'Gesprächstypen'] } },
    answer: { head: 'Dir fehlt nicht Wissen.<br>Dir fehlt Übung.', body: 'Seminare ändern Wissen. Nicht Verhalten. Deshalb trainiere ich jeden Tag mit dir: 15 Minuten.', whyLabel: 'In LeaderOS', why: 'Kurse, Simulationen, tägliche Drills, elf Frameworks' },
    drill: { tpl: 'Mein nächstes schwieriges Gespräch: [Gespräch]. Mein erster Satz: [Satz].', chips: ['Aufschreiben', 'Dann üben'] },
    next: { kind: 'link', head: 'Der Account geht zurück an Wlad. <span class="m">Ich bleibe.</span>', size: 88, sub: 'In LeaderOS. 14 Tage kostenlos, ohne Karte.', sticker: { kind: 'link', q: 'LeaderOS testen' } } },
];

/* Vorlagen ohne Tag: leere Antwort-Story für echte Fragen aus dem Fragen-Sticker */
const TEMPLATES = { n: 0, date: 'Vorlage', theme: 'Antwort auf eine echte Frage', post: '', postTitle: '', plate: 'lime',
  stories: [{ t: 'reply', plate: 'lime' }, { t: 'reply', plate: 'cool' }] };

if (typeof module !== 'undefined') module.exports = { DAYS, TEMPLATES };
