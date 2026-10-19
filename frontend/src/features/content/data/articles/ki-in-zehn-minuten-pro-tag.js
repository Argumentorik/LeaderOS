export default {
  slug: 'ki-in-zehn-minuten-pro-tag',
  type: 'guide',
  status: 'published',
  title: 'KI in zehn Minuten pro Tag.',
  description:
    'Wenn du keine fünfzehn Minuten am Stück hast: die Drei-Block-' +
    'Routine die in zehn Minuten passt. Mit konkreten Slots für ' +
    'Engineering-On-Call-Wochen und Fundraising-Phasen.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-07-14',
  cover: null,
  tags: ['LeaderOS', 'Routine', 'Zugänglichkeit'],
  body: [
    { type: 'paragraph', text: 'Manchmal hast du keine fünfzehn Minuten am Stück. On-Call-Woche, Fundraising-Sprint, Familien-Krise. Hier ist die Zehn-Minuten-Variante die in diese Phasen passt.' },
    { type: 'heading', level: 2, text: 'Drei-Block-Routine, je drei Minuten.' },
    { type: 'list', style: 'numbered', items: [
      'Block 1 (morgens, 3 Min): einen Prompt für die wichtigste Konversation des Tages schreiben.',
      'Block 2 (zwischen zwei Meetings, 3 Min): den Prompt ausführen und die Antwort in deine Notiz kopieren.',
      'Block 3 (abends, 3 Min): kurz reflektieren · hat es geholfen oder nicht.',
    ] },
    { type: 'heading', level: 2, text: 'Was in den zehn Minuten passiert.' },
    { type: 'paragraph', text: 'Du löst nicht das ganze Tages-Problem, du baust eine winzige Skill-Anwendung ein. Du bleibst im Drill-Modus, auch wenn die Woche brennt. Das ist der einzige Hebel der "Challenge-Pause" verhindert.' },
    { type: 'heading', level: 2, text: 'Wann das die richtige Variante ist.' },
    { type: 'list', style: 'bullet', items: [
      'On-Call-Wochen in Engineering: du hast Code-Crashes statt Deep-Work.',
      'Fundraising-Sprints: jeder Vormittag ist Investor-Call.',
      'Family-Krise: dein Kalender ist nicht dein eigener.',
      'Dritte Welle einer Pandemie: pragmatisch sein.',
    ] },
    { type: 'framework', code: '10 MIN', title: 'Drei-Block-Variante', explanation: 'Morgens 3 Min Prompt schreiben · zwischen Meetings 3 Min ausführen · abends 3 Min reflektieren. Insgesamt 9 Min effektiv. Funktioniert während Phasen wo 15-Min-Slots unmöglich sind.' },
    { type: 'callout', tone: 'lime', text: 'Zehn Minuten an einem Tag schlagen null Minuten. Challenge-Pause kostet dich zwei bis drei Wochen Rück-Schritt. Mini-Routine in der Krise hält den Drill am Laufen.' },
    { type: 'paragraph', text: 'WladBot erkennt eingebaut wenn du eine Krise-Phase signalisierst und schlägt automatisch die Zehn-Minuten-Variante vor · ohne dass du es bewusst einstellen musst.' },
  ],
  seo: {
    title: 'KI in 10 Minuten pro Tag · LeaderOS',
    description: 'KI in 10 Minuten pro Tag: die Drei-Block-Routine, die selbst in On-Call-Wochen und Fundraising-Phasen hält. So bleibst du im Drill. Von Wlad Jachtchenko.',
    keywords: ['KI 10 Minuten', 'Mikro-Routine Manager', 'Challenge Pause vermeiden', 'KI in stressigen Wochen', 'Leadership Routine kurz'],
  },
  related: ['mikro-drills-fuenfzehn-minuten-pro-tag', 'damit-es-jeder-schafft-die-zugaenglichkeits-philosophie'],
};
