/**
 * Article: Die Feedback-Formel B-W-W.
 *
 * Framework deep-dive. Proves the framework block-type renders cleanly
 * for hands-on content. Hooks into the Sprint product via the drill
 * Mechanic at the end.
 */
export default {
  slug: 'die-feedback-formel-bww',
  type: 'guide',
  status: 'published',
  title: 'Die Feedback-Formel: B-W-W.',
  description:
    'Beobachtung, Wirkung, Wunsch. Drei Sätze, die jedes harte ' +
    'Feedback-Gespräch in zwölf Sekunden eröffnen. Mit drei Drill-' +
    'Varianten und einer Anti-Falle, die fast jeder ignoriert.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-06-19',
  cover: null,
  tags: ['Frameworks', 'Feedback', 'Drill'],
  body: [
    {
      type: 'paragraph',
      text:
        'Die meisten Führungskräfte vermeiden Feedback-Gespräche nicht weil sie nicht wissen WAS sie sagen wollen. ' +
        'Sie vermeiden sie weil sie nicht wissen wie sie den ersten Satz konstruieren. Wer die ersten zwölf Sekunden ' +
        'kontrolliert, kontrolliert das gesamte Gespräch.',
    },
    {
      type: 'paragraph',
      text:
        'B-W-W ist die Formel, die diese zwölf Sekunden strukturiert. Drei Sätze, drei Bauteile, kein Vorwurfs-Frame. ' +
        'Sie funktioniert für jeden Empfänger-Typ: Senior-Mitarbeiter, Peer, neue Hire, sogar deinen eigenen Manager.',
    },
    {
      type: 'framework',
      code: 'B-W-W',
      title: 'Die Feedback-Formel',
      explanation:
        'Beobachtung. Wirkung. Wunsch. Du beschreibst zuerst was du tatsächlich gesehen hast (Fakt, nicht Interpretation), ' +
        'dann welche Konsequenz das hatte (operativ oder emotional), dann was du dir konkret stattdessen wünschst.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'B · Beobachtung, kein Urteil.',
    },
    {
      type: 'paragraph',
      text:
        'Die häufigste Fehlöffnung ist die Verallgemeinerung: "Du bist immer zu spät." Das ist kein Fakt, das ist ein ' +
        'Etikett. Der Empfänger reagiert auf das Etikett, nicht auf das Verhalten. Sofort defensiv.',
    },
    {
      type: 'paragraph',
      text:
        'Tausche das gegen ein einziges konkretes Datum: "Am Dienstag warst du um 9:18 in der Standup, der Termin ' +
        'war für 9:00 angesetzt." Beobachtung. Nicht widerlegbar. Der Empfänger bleibt offen.',
    },
    {
      type: 'callout',
      tone: 'lime',
      text:
        'Wenn du das Gefühl hast, dass deine Beobachtung interpretiert wird, ersetze jedes Adjektiv durch eine Zahl, ' +
        'ein Datum oder ein Zitat.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'W · Wirkung, in deinem System.',
    },
    {
      type: 'paragraph',
      text:
        'Die Wirkung ist die Brücke zwischen Beobachtung und Wunsch. Sie macht klar warum die Beobachtung relevant ' +
        'ist. Wirkung ist immer eine Aussage über DICH und das System, nicht über den Anderen.',
    },
    {
      type: 'paragraph',
      text:
        'Schlecht: "Das ist unprofessionell." (Das ist wieder ein Urteil.) Gut: "Wir mussten den Stand-Up ohne dich ' +
        'starten und drei Items nochmal wiederholen als du dazu kamst." (Operative Wirkung. Nachvollziehbar.)',
    },
    {
      type: 'heading',
      level: 2,
      text: 'W · Wunsch, konkret und in der Zukunft.',
    },
    {
      type: 'paragraph',
      text:
        'Der Wunsch ist die Vorwärts-Bewegung. Er muss konkret genug sein dass der Empfänger im nächsten Moment ' +
        'eine andere Wahl treffen könnte. "Sei pünktlicher" ist kein Wunsch, das ist ein leeres Etikett.',
    },
    {
      type: 'paragraph',
      text:
        '"Ich wünsche mir dass wir die Standup zukünftig gemeinsam um 9 Uhr starten. Wenn dir mal etwas dazwischen ' +
        'kommt, ein Ping in den Channel bevor 9 Uhr." Das ist ein Wunsch. Spezifisch, ausführbar, kollaborativ.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Die Anti-Falle.',
    },
    {
      type: 'paragraph',
      text:
        'Fast jede B-W-W-Anwendung scheitert am vierten Satz: dem nicht-gewünschten "Sandwich-Move". Manager packen ' +
        'das Feedback in ein Lob-Sandwich ein ("Du machst sonst so tolle Arbeit, ABER..."). Damit zerstören sie die ' +
        'gesamte Klarheit der Formel.',
    },
    {
      type: 'paragraph',
      text:
        'Wenn das Feedback hart ist, ist es hart. Verstecke es nicht in einer Komplimente-Wattierung. Der Empfänger ' +
        'fühlt den Trick, und das Vertrauen sinkt jedes Mal ein bisschen mehr. Lieber drei separate Gespräche: ' +
        'positives Feedback an Tag A, konstruktives an Tag B, Anerkennung an Tag C.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Drei Drill-Varianten.',
    },
    {
      type: 'list',
      style: 'numbered',
      items: [
        'Schreibe ein Feedback das du diese Woche geben musst auf eine Karteikarte. Drei Sätze, B-W-W. Wenn du mehr als drei Sätze brauchst, ist mindestens einer eine Interpretation. Streichen.',
        'Lass deinen Sparring-Partner deinen ersten Satz wiederholen. Klingt der Satz wie eine Beobachtung oder wie ein Urteil? Wenn Urteil, neu formulieren.',
        'Übe die Wirkungs-Brücke. Sage immer den Wirkungs-Satz ZWEIMAL: einmal operativ, einmal emotional. Wähle danach die Variante die zum Empfänger passt.',
      ],
    },
    {
      type: 'quote',
      text:
        'Ein Feedback-Gespräch das du nicht in drei Sätzen vorbereiten kannst, ist noch nicht klar genug. Bereite es ' +
        'so lange vor bis es passt. Dann ist es einfacher zu liefern als ein schlecht vorbereitetes Lob.',
      attribution: 'Wlad, Argumentorik-Akademie 2024',
    },
    {
      type: 'paragraph',
      text:
        'In der 30-Tage-Challenge trainierst du B-W-W an dreißig deiner echten Situationen. WladBot bekommt deinen Kontext ' +
        '(Rolle, Team, dein Challenge-Score) und korrigiert jeden ersten Satz live. Nach den dreißig Tagen ist es kein ' +
        'Werkzeug mehr, das du anwendest. Es ist dein Default.',
    },
  ],
  seo: {
    title: 'Feedback-Formel B-W-W: Skript + Beispiele · LeaderOS',
    description:
      'Feedback-Formel B-W-W: Beobachtung, Wirkung, Wunsch · die Drei-Satz-Formel, die harte Gespräche in zwölf ' +
      'Sekunden öffnet, ohne das Gegenüber zu verlieren. Mit Drill-Varianten. Von Wlad Jachtchenko.',
    keywords: [
      'Feedback-Formel',
      'B-W-W Feedback',
      'Wlad Jachtchenko Feedback',
      'Mitarbeiter-Gespräch',
      'Feedback Skript',
      'Führungs-Kommunikation',
    ],
  },
  related: ['warum-frameworks-nicht-im-kopf-bleiben', 'sprint-oder-marathon'],
};
