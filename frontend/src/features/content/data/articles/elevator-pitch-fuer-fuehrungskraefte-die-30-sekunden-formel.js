/**
 * Article: Elevator Pitch · Reels-Serie.
 *
 * Aus Wlads täglichen Führungstipps (@wlad.jachtchenko). Elevator Pitch ist
 * eines seiner Kern-Reel-Themen (siehe wladTopics.js · Inspire).
 */
export default {
  slug: 'elevator-pitch-fuer-fuehrungskraefte-die-30-sekunden-formel',
  type: 'guide',
  status: 'published',
  title: 'Elevator Pitch für Führungskräfte: Die 30-Sekunden-Formel.',
  description:
    'Dein Vorstand fragt im Aufzug: „Woran arbeitet ihr gerade?" Was du in ' +
    'den nächsten 30 Sekunden sagst, entscheidet über Budget, Sichtbarkeit ' +
    'und deinen nächsten Karriereschritt. Die P-P-N-Formel aus Wlads Reels.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-07-02',
  cover: null,
  tags: ['Reels', 'Rhetorik', 'Skripte', 'Karriere'],
  body: [
    {
      type: 'paragraph',
      text:
        'Es passiert genau dann, wenn du nicht vorbereitet bist: Der CEO steht neben dir am Kaffeeautomaten und ' +
        'fragt beiläufig, woran dein Team gerade arbeitet. Die meisten antworten mit einer Feature-Liste — und ' +
        'verschenken den wertvollsten Kommunikations-Moment des Quartals.',
    },
    {
      type: 'paragraph',
      text:
        'Ein Elevator Pitch ist keine Verkaufsnummer für Gründer. Er ist das Standard-Werkzeug jeder ' +
        'Führungskraft, die will, dass ihre Arbeit oben richtig ankommt. Und er folgt einer Formel, die du ' +
        'in einer Mittagspause lernen kannst.',
    },
    {
      type: 'framework',
      code: 'P-P-N',
      title: 'Problem · Progress · Next',
      explanation:
        'Problem: Ein Satz, welches Geschäftsproblem ihr löst — in der Sprache des Zuhörers, nicht deines Teams. ' +
        'Progress: Ein Satz, was sich messbar bewegt hat — Zahl schlägt Adjektiv. ' +
        'Next: Ein Satz, was als Nächstes kommt und was du dafür brauchst. ' +
        'Drei Sätze, unter 30 Sekunden, endet mit einem Haken für die Rückfrage.',
    },
    { type: 'heading', text: 'Das Skript zum Einsetzen' },
    {
      type: 'list',
      style: 'numbered',
      items: [
        'Problem: „Wir lösen gerade [Geschäftsproblem], das uns pro Quartal [Kosten/Risiko] kostet."',
        'Progress: „Seit [Zeitraum] haben wir [messbare Bewegung] — konkret [Zahl]."',
        'Next: „Der nächste Schritt ist [Meilenstein]. Was uns dahin beschleunigt: [eine Sache]."',
      ],
    },
    {
      type: 'callout',
      tone: 'neutral',
      text:
        'Anti-Falle: Der häufigste Fehler ist, mit der Lösung zu beginnen („Wir bauen gerade ein Dashboard…"). ' +
        'Ohne Problem-Satz hat der Zuhörer keinen Grund zuzuhören — ein Dashboard interessiert niemanden, ' +
        'gestopptes Umsatz-Leck schon.',
    },
    {
      type: 'quote',
      text: 'Wer sein Thema nicht in dreißig Sekunden erklären kann, dem gibt niemand dreißig Minuten.',
      attribution: 'WLAD JACHTCHENKO',
    },
    { type: 'heading', text: 'Der Drill', level: 3 },
    {
      type: 'paragraph',
      text:
        'Schreib deinen P-P-N-Pitch heute auf — laut gesprochen unter 30 Sekunden. Dann teste ihn dreimal diese ' +
        'Woche: einmal beim Peer, einmal beim eigenen Team, einmal nach oben. Nach jedem Durchlauf eine Frage: ' +
        'Welcher der drei Sätze hat die Rückfrage ausgelöst? Das ist dein stärkster Satz — er kommt beim ' +
        'nächsten Mal zuerst.',
    },
    {
      type: 'callout',
      tone: 'lime',
      text:
        'In der LeaderOS-Challenge ist der Elevator Pitch ein eigener Tages-Drill: WladBot spielt den ungeduldigen ' +
        'Vorstand und unterbricht nach Sekunde 20. Wer das dreimal überlebt hat, pitcht überall.',
    },
  ],
};
