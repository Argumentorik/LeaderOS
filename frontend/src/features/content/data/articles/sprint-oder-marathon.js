/**
 * Article: Sprint oder Marathon.
 *
 * Second starter article. Argues why 30-Tage-Sprint is the right
 * intensity for skill acquisition versus 12-Monats-Coaching. Lands the
 * tier-positioning between Sprint and Plus-Plus without sounding like
 * a pricing page.
 */
export default {
  slug: 'sprint-oder-marathon',
  type: 'article',
  status: 'published',
  title: 'Challenge oder Marathon.',
  description:
    'Warum dreißig Tage präziser sind als zwölf Monate, und wann der ' +
    'umgekehrte Fall stimmt. Eine ehrliche Trennlinie zwischen den zwei ' +
    'Lerntypen.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-06-20',
  cover: null,
  tags: ['Sprint', 'Lernen', 'Methodik'],
  body: [
    {
      type: 'paragraph',
      text:
        'Die meisten Coaching-Angebote dauern entweder eine Stunde oder ein Jahr. Beides ist unscharf. ' +
        'Eine Stunde reicht für ein Aha, nicht für ein neues Reflex-Muster. Zwölf Monate reichen für ' +
        'Identitäts-Veränderung, sind aber zu lang für eine konkrete Skill-Lücke.',
    },
    {
      type: 'paragraph',
      text:
        'Dreißig Tage sind kein Marketing-Bogen. Sie sind die kürzeste Periode in der ein Reflex stabil ' +
        'wird. Das ist neurologisch ungefähr richtig: rund 21 bis 28 Tage Wiederholung verschieben das ' +
        'neue Verhalten von bewusst kontrolliert auf default. Ein Tag mehr ist Puffer.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Wann die Challenge richtig ist.',
    },
    {
      type: 'list',
      style: 'bullet',
      items: [
        'Du hast eine konkrete Skill-Lücke, die du benennen kannst.',
        'Die Lücke kostet dich identifizierbar Zeit, Geld oder Kapital.',
        'Du kannst dreißig Tage lang jeden Werktag fünfzehn Minuten investieren.',
        'Du willst messbares Output, nicht jahrelange Identitäts-Arbeit.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Wann der Marathon richtig ist.',
    },
    {
      type: 'list',
      style: 'bullet',
      items: [
        'Du hast keine Skill-Lücke · du hast eine Rollen-Lücke (vom Senior zum VP).',
        'Du brauchst einen externen Sparrings-Partner über mindestens vier Quartale.',
        'Deine Probleme wechseln im Quartalsrhythmus.',
        'Du willst keinen Werkzeugkasten, du willst einen begleitenden Spiegel.',
      ],
    },
    {
      type: 'callout',
      tone: 'lime',
      text:
        'Plus-Plus ist beides: die Challenge baut den Werkzeugkasten in dreißig Tagen, die zwölf Monate ' +
        'danach sind der Sparrings-Partner. Wer beides braucht, fängt mit der Challenge an.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Die häufigste Fehlentscheidung.',
    },
    {
      type: 'paragraph',
      text:
        'Die Standard-Reaktion auf eine Skill-Lücke ist Marathon-buchen: zwölf Monate Coaching, ' +
        'monatliche Sessions, viel Reflexion. Das fühlt sich nach Investition an. Tatsächlich ist es ' +
        'meistens Aufschub. Die Skill-Lücke bleibt elf Monate offen, dann erinnert sich keiner mehr ' +
        'an die initiale Frage.',
    },
    {
      type: 'quote',
      text:
        'Wer eine konkrete Lücke hat, schließt sie in dreißig Tagen · oder erkennt schnell, dass die ' +
        'Lücke gar nicht das echte Problem war.',
      attribution: 'Wlad, aus dem Challenge-Briefing 2026',
    },
    {
      type: 'paragraph',
      text:
        'Wenn du gerade liest und denkst "ich habe drei Lücken gleichzeitig" · das ist normal. Die ' +
        'kostenlose Diagnose auf leadercheck.de priorisiert sie für dich. Du startest mit der größten, ' +
        'nicht mit der lautesten.',
    },
  ],
  seo: {
    title: 'Challenge oder Marathon: 30 Tage vs 12 Monate Coaching',
    description:
      'Challenge oder Marathon? Warum 30 Tage präziser sind als zwölf Monate Coaching und welche ' +
      'Fehlentscheidung die meisten treffen. Von Wlad Jachtchenko.',
    keywords: [
      'Challenge Coaching',
      'Leadership-Challenge',
      'Wlad Jachtchenko Challenge',
      '30 Tage Programm',
      'Coaching Dauer',
      'Skill Acquisition',
    ],
  },
  related: ['warum-frameworks-nicht-im-kopf-bleiben'],
};
