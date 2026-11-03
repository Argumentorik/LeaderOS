export default {
  slug: 'wenn-ki-dich-verlangsamt',
  type: 'guide',
  status: 'published',
  title: 'Wenn KI dich verlangsamt.',
  description:
    'Vier Situationen in denen KI-Nutzung statistisch zu schlechterem ' +
    'Output führt. Plus drei Indikatoren bei dir selbst zu erkennen, ' +
    'ob du gerade in einer der vier steckst.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-07-12',
  cover: null,
  tags: ['KI-Paradox', 'Anti-Patterns', 'Output'],
  body: [
    { type: 'paragraph', text: 'KI ist kein universaler Hebel. In manchen Situationen verlangsamt sie dich tatsächlich. Wer das nicht erkennt, baut Frustration. Hier sind die vier häufigsten.' },
    { type: 'heading', level: 2, text: 'Situation 01: Kurze Routine-Antworten.' },
    { type: 'paragraph', text: 'Eine Slack-Antwort die du in 20 Sekunden tippst, wird mit ChatGPT zu einer Drei-Minuten-Interaktion (Tab öffnen, Kontext erklären, Antwort iterieren, kopieren, einfügen, anpassen). Output ist gleich oder schlechter. Pauschal-Regel: unter 30 Sekunden Aufgabe = nicht in KI.' },
    { type: 'heading', level: 2, text: 'Situation 02: Hoch-emotionale Konversationen.' },
    { type: 'paragraph', text: 'Wenn dein direct report in Tränen ausbricht, ist ein KI-vorbereitetes Skript der Tod der Konversation. Du brauchst Anwesenheit, Empathie, Zuhören · keine vorbereiteten Sätze. Wer in emotional aufgeladenen Momenten KI nutzt, klingt mechanisch.' },
    { type: 'heading', level: 2, text: 'Situation 03: Strategische Wetten unter Unsicherheit.' },
    { type: 'paragraph', text: 'KI extrapoliert aus der Vergangenheit. Wenn du eine Wette auf eine Zukunft eingehst die in den Trainings-Daten nicht vorkam, wird KI dich systematisch in die "Mainstream-Antwort" lenken. Strategische Innovation verlangt menschliches "trotzdem".' },
    { type: 'heading', level: 2, text: 'Situation 04: Identitäts-Fragen.' },
    { type: 'paragraph', text: '"Sollte ich diese Beförderung annehmen?" "Bin ich noch der Architekt der ich sein wollte?" KI kann reflektieren, aber nicht spiegeln. Diese Fragen verlangen einen menschlichen Coach oder einen Sparrings-Partner mit echter Lebens-Erfahrung.' },
    { type: 'framework', code: 'NICHT-KI', title: 'Vier Anti-Slots', explanation: 'Kurze Routine-Antworten (unter 30 Sek) · hoch-emotionale Konversationen · strategische Wetten unter Unsicherheit · Identitäts-Fragen. Wer diese vier in KI verlagert, verlangsamt sich oder schadet sich aktiv.' },
    { type: 'heading', level: 2, text: 'Drei Indikatoren bei dir selbst.' },
    { type: 'list', style: 'numbered', items: [
      'Du bist nach einer KI-Session emotional dünner als vorher. Dein Körper sagt dir dass die Konversation kein KI-Slot war.',
      'Du brauchst nach der KI-Vorbereitung mehr Bearbeitung als Selbst-Schreiben gedauert hätte. Das ist Effizienz-Verlust.',
      'Du fühlst dich generischer im Output. Dein Team merkt es als "die Firmenrede klang heute anders".',
    ] },
    { type: 'callout', tone: 'lime', text: 'Bewusste Nicht-Nutzung ist genauso wichtig wie bewusste Nutzung. Wer alles in KI verlagert, verliert seine eigene Stimme.' },
    { type: 'paragraph', text: 'In der Challenge trainierst du explizit diese Trennlinie. WladBot wird dich aktiv warnen wenn du gerade einen Anti-Slot in ein Drill schiebst · und dir vorschlagen statt KI eine menschliche Konversation zu führen.' },
  ],
  seo: {
    title: 'Wann KI dich verlangsamt: 4 Situationen ohne KI',
    description: 'Wann KI dich verlangsamt statt beschleunigt: vier Situationen – Routine-Antworten, emotionale Gespräche, strategische Wetten, Identitäts-Fragen. Von Wlad Jachtchenko.',
    keywords: ['KI Anti-Patterns', 'Wann nicht KI nutzen', 'ChatGPT verlangsamt', 'KI ungeeignet', 'Manuelle Arbeit besser KI'],
  },
  related: ['das-ki-produktivitaets-paradox', 'wladbot-vs-chatgpt-vs-coach'],
};
