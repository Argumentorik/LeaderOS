/**
 * Article: Dein Kalender führt dich.
 *
 * Field note about time leadership. Connects to ALPEN framework (#10
 * in the Sprint curriculum) and lands the "calendar as artifact"
 * thesis. Shorter than the deep-dive, deliberately punchy.
 */
export default {
  slug: 'dein-kalender-fuehrt-dich',
  type: 'field-note',
  status: 'published',
  title: 'Dein Kalender führt dich.',
  description:
    'Ein offener Kalender macht dich verfügbar. Ein verteidigter Kalender ' +
    'macht dich führbar. Eine kurze Notiz darüber wie die Wahrheit über ' +
    'deine Prioritäten in deinem Mittwoch sichtbar wird.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-06-15',
  cover: null,
  tags: ['Zeit', 'Mindset', 'ALPEN'],
  body: [
    {
      type: 'paragraph',
      text:
        'Zeig mir deinen Kalender von letztem Mittwoch und ich sage dir was du in den letzten zwölf Monaten priorisiert ' +
        'hast. Nicht was du SAGST dass du priorisiert hast. Was du tatsächlich getan hast.',
    },
    {
      type: 'paragraph',
      text:
        'Die häufigste Lüge in Coachings ist: "Ich habe keine Zeit für strategische Arbeit." Die Wahrheit ist: " ' +
        'Ich habe meine Zeit in den letzten zwölf Monaten für andere Sachen vergeben. Bewusst oder unbewusst."',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Drei Diagnosen am Kalender.',
    },
    {
      type: 'paragraph',
      text:
        'Wenn du heute fünf Minuten Zeit hast, mach diese drei Übungen.',
    },
    {
      type: 'list',
      style: 'numbered',
      items: [
        'Zähle die Stunden Deep Work letzte Woche. Definition: zusammenhängende Blöcke über 90 Minuten ohne Meeting-Unterbrechung. Wenn unter 6 Stunden: dein Kalender ist nicht deiner.',
        'Schau dir den Mittwoch-Nachmittag an. Wenn der frei für strategische Arbeit war: gut. Wenn da fünf 30-Min-Slots stehen: deine Energie wird in Häppchen zerlegt bevor du wichtige Arbeit erreichst.',
        'Wer hat in der letzten Woche deinen Kalender geblockt? Wenn die Antwort "andere" ist und du das aus der Zeile zurückverfolgen kannst: das ist deine echte Hierarchie, unabhängig davon was im Org-Chart steht.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Die ALPEN-Methode in einer Zeile.',
    },
    {
      type: 'framework',
      code: 'ALPEN',
      title: 'Zeit-Methodik',
      explanation:
        'Aufgaben aufschreiben. Länge schätzen. Pufferzeit einplanen. Entscheidungen treffen. Nachkontrolle. ' +
        'Klingt nach Tagesplanung. In Wirklichkeit ist es ein Schutz-Frame gegen Kalender-Übernahme.',
    },
    {
      type: 'paragraph',
      text:
        'Der harte ALPEN-Schritt ist nicht das Aufschreiben. Es ist E. Entscheidungen treffen. Welche drei Sachen ' +
        'landen NICHT auf deinem Mittwoch. Welche zwei Meetings sagst du ab. Welcher Slack-Channel ist diese Woche ' +
        'auf Mute. Wenn du die Streich-Entscheidungen nicht trifft, ist die Tagesplanung Kosmetik.',
    },
    {
      type: 'callout',
      tone: 'lime',
      text:
        'Streichen ist die Führungs-Bewegung. Hinzufügen ist die Mitarbeiter-Bewegung. Wer den eigenen Kalender ' +
        'nicht zustreichen kann, kann auch nicht das Team-Backlog priorisieren.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Ein Experiment für die nächste Woche.',
    },
    {
      type: 'paragraph',
      text:
        'Block am Sonntagabend zwei Stunden im Kalender für Montag-Vormittag. Titel: "Strategie · nicht verschieben." ' +
        'Wenn du den Block nicht halten kannst, ist deine Schicht in die operative Maschine kompletter als du denkst. ' +
        'Das ist keine Schande, das ist eine Information. Sie sagt dir wo dein Challenge-Hebel liegt.',
    },
    {
      type: 'paragraph',
      text:
        'Die kostenlose Diagnose auf leadercheck.de hat keine Zeit-Dimension. Aber wenn dein Rhetorik-Score hoch ist ' +
        'und du trotzdem das Gefühl hast nicht weiterzukommen, ist die Wahrheit oft in deinem Kalender, nicht in ' +
        'deiner Sprache.',
    },
  ],
  seo: {
    title: 'Kalender als Führungsinstrument: so geht Zeitführung',
    description:
      'Zeitmanagement für Führungskräfte: Ein verteidigter Kalender macht dich führbar statt nur verfügbar. Drei Mikro-Diagnosen plus ALPEN als Streich-Frame. Von Wlad Jachtchenko.',
    keywords: [
      'Kalender Management Führung',
      'ALPEN Methode',
      'Deep Work Leadership',
      'Zeitmanagement Führungskraft',
      'Wlad Jachtchenko Zeit',
    ],
  },
  related: ['warum-frameworks-nicht-im-kopf-bleiben', 'die-feedback-formel-bww'],
};
