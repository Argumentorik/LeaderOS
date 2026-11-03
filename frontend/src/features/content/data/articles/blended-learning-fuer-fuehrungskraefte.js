/**
 * Article: Blended Learning für Führungskräfte.
 *
 * Explains why pure e-learning licenses stall out, walks through the
 * 70-20-10 model as the real backbone of good blended design, and
 * names the most common blended-learning anti-pattern (frontloaded
 * e-learning + one coaching call at the end).
 */
export default {
  slug: 'blended-learning-fuer-fuehrungskraefte',
  type: 'guide',
  status: 'published',
  title: 'Blended Learning für Führungskräfte: Warum reines E-Learning meistens scheitert.',
  description:
    'Eine E-Learning-Lizenz allein verändert selten Verhalten, die Abschlussquoten nach dem ersten Monat sprechen ' +
    'eine deutliche Sprache. Was Blended Learning konkret bedeutet, und woran man gutes Design von reinem ' +
    'Umverpacken unterscheidet.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-07-15',
  cover: null,
  tags: ['Training', 'Methodik', 'Strategie'],
  body: [
    {
      type: 'paragraph',
      text:
        'Viele Unternehmen haben während und nach der Pandemie E-Learning-Lizenzen für Führungskräfteentwicklung ' +
        'eingekauft. Das Muster danach war fast überall gleich: hohe Aktivierung im ersten Monat, dann ein steiler ' +
        'Abfall der Nutzung. Nicht weil der Inhalt schlecht war. Weil das Format allein nicht ausreicht.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Warum reines Online-Selbstlernen scheitert.',
    },
    {
      type: 'paragraph',
      text:
        'Drei Gründe wiederholen sich in fast jedem Fall. Erstens: keine externe Verbindlichkeit, niemand merkt, ' +
        'wenn ein Modul liegen bleibt. Zweitens: Es konkurriert im selben Zeitfenster mit dem eigentlichen ' +
        'Tagesgeschäft, und das Tagesgeschäft gewinnt fast immer. Drittens: Es fehlt eine Feedback-Schleife, die ' +
        'eine falsche Anwendung des Gelernten korrigiert, bevor sie sich als Gewohnheit festsetzt.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Was Blended Learning konkret bedeutet.',
    },
    {
      type: 'paragraph',
      text:
        'Blended Learning kombiniert bewusst drei Elemente: einen formalen Input (Präsenz-Session oder kurzes ' +
        'Video), individuelles Selbstlernen in kleinen Dosen, und regelmäßige Coaching-Calls, in denen die ' +
        'tatsächliche Anwendung besprochen und korrigiert wird. Keins der drei Elemente ersetzt die anderen beiden.',
    },
    {
      type: 'framework',
      code: '70-20-10',
      title: '70-20-10-Modell für Kompetenzentwicklung',
      explanation:
        'Siebzig Prozent der Entwicklung entsteht durch Anwendung im echten Arbeitsalltag, zwanzig Prozent durch ' +
        'soziales Lernen wie Coaching, Feedback und Austausch mit anderen, zehn Prozent durch formale Trainings ' +
        'oder Kurse. Ein Blended-Design, das neunzig Prozent der Zeit in formale Module steckt, arbeitet gegen ' +
        'dieses Verhältnis statt mit ihm.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Woran du gutes Blended-Design erkennst.',
    },
    {
      type: 'list',
      style: 'numbered',
      items: [
        'Sequencing: kleiner formaler Input zuerst, dann sofortige Anwendung, dann ein Coaching-Check-in dazu, ' +
          'nicht umgekehrt.',
        'Kadenz: regelmäßige kurze Kontaktpunkte statt eines großen Blocks am Anfang und eines einzigen Calls am ' +
          'Ende.',
        'Verbindlichkeit: eine Person oder ein System, das aktiv nachfragt, ob das Modul angewendet wurde.',
        'Messbare Anwendung statt reinem Video-Konsum: die Frage ist nicht "wurde es geschaut?", sondern "wurde ' +
          'es diese Woche gebraucht?".',
      ],
    },
    {
      type: 'callout',
      tone: 'lime',
      text:
        'Blended Learning ist kein Verhältnis von Formaten, sondern ein Verhältnis von Zeitpunkten. Es zählt nicht ' +
        'wie viele Stunden online sind und wie viele live, sondern wie kurz die Abstände zwischen Input und ' +
        'Anwendung sind.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Der Fehler, den die meisten Blended-Programme trotzdem machen.',
    },
    {
      type: 'paragraph',
      text:
        'Viele Programme, die sich "blended" nennen, bestehen aus acht Stunden E-Learning-Modulen am Anfang und ' +
        'einem einzigen Coaching-Call am Ende. Das ist derselbe Einmal-Event-Fehler wie beim klassischen ' +
        'Inhouse-Training, nur in zwei Formate aufgeteilt statt in eines gepresst. Echtes Blending bedeutet kurze ' +
        'Zyklen, nicht zwei große Blöcke hintereinander.',
    },
    {
      type: 'quote',
      text:
        'Ein Blended-Programm mit einem einzigen Coaching-Call ist kein Blended-Programm. Es ist ein E-Learning-Kurs ' +
        'mit einem Abschiedsgespräch.',
      attribution: 'Wlad, Argumentorik-Akademie 2024',
    },
    {
      type: 'paragraph',
      text:
        'Die 30-Tage-Challenge in LeaderOS ist so gebaut, wie gutes Blended Learning sein sollte: tägliche ' +
        'Mikro-Inputs, sofortige Anwendung in echten Situationen, und WladBot als ständig verfügbarer ' +
        'Coaching-Layer dazwischen, der die Anwendung live korrigiert statt erst Wochen später in einem ' +
        'Abschlussgespräch.',
    },
  ],
  seo: {
    title: 'Blended Learning für Führungskräfte: 70-20-10 · LeaderOS',
    description:
      'Blended Learning für Führungskräfte: Warum reines E-Learning scheitert, was das 70-20-10-Modell dazu sagt, ' +
      'und wie gutes Blended-Design aussieht statt eines aufgeteilten Einmal-Events.',
    keywords: [
      'Blended Learning Führungskräfte',
      '70-20-10 Modell',
      'E-Learning Führungskräfteentwicklung',
      'Blended Learning Design',
      'Online Training Führungskräfte',
      'Coaching und E-Learning kombinieren',
    ],
  },
  related: [
    'fuehrungskraeftetraining-formate-im-vergleich',
    'fuehrungskraefteentwicklung-leadership-development',
    'mikro-drills-fuenfzehn-minuten-pro-tag',
  ],
};
