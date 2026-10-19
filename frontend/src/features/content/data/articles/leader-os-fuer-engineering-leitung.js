/**
 * Article 5/10 · persona use case for engineering leaders.
 */
export default {
  slug: 'leader-os-fuer-engineering-leitung',
  type: 'case-study',
  status: 'published',
  title: 'LeaderOS für Engineering-Leitung.',
  description:
    'Tech-Lead bis VP Engineering: was die spezifischen Reibungspunkte ' +
    'sind, welche der elf Frameworks am stärksten greifen, und wie die ' +
    'Challenge sich an deinen Rhythmus anpasst.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-06-25',
  cover: null,
  tags: ['LeaderOS', 'Use Case', 'Engineering'],
  body: [
    { type: 'paragraph', text:
      'Engineering-Verantwortliche teilen ein Muster: technisch brillant, kommunikativ unterdimensioniert. ' +
      'Nicht weil sie nicht reden können · sondern weil ihr Wachstum auf der technischen Spur kein Bedürfnis ' +
      'für SEXIER, Drei Säulen oder ALPEN aufgebaut hat. Bis sie als VP plötzlich sechzig Leute führen.' },
    { type: 'heading', level: 2, text: 'Die drei häufigsten Reibungspunkte.' },
    { type: 'list', style: 'numbered', items: [
      'Firmenreden die in Detail-Diskussionen kippen. Du wolltest eine Quartals-Roadmap kommunizieren, du hast eine Architektur-Diskussion bekommen.',
      '1:1s mit Senior-ICs die zu Coaching-Sessions ohne Ergebnis werden. Du gehst nach 30 Minuten mit dem Gefühl raus, dass nichts passiert ist.',
      'Verhandlungen mit Produkt- oder GTM-Counterparts wo du Daten hast, aber kein Skript für die Übergabe vom Datenpunkt zur Forderung.',
    ] },
    { type: 'heading', level: 2, text: 'Welche Frameworks am stärksten greifen.' },
    { type: 'paragraph', text:
      'In Challenge-Daten aus Engineering-Teilnehmern sehen wir drei Frameworks dominieren: SEXIER für die ' +
      'Firmenrede-Struktur, B-W-W für die 1:1-Eröffnung, Drei Säulen für Verhandlungen mit nicht-technischen ' +
      'Stakeholdern.' },
    { type: 'framework', code: 'COMBO', title: 'Die Engineering-Kombi',
      explanation:
        'SEXIER strukturiert deine Roadmap so, dass die Tech-Leads den roten Faden behalten und das Senior-Team ' +
        'den Business-Case versteht. B-W-W eröffnet 1:1s mit konkreter Beobachtung statt mit "wie geht es dir". ' +
        'Drei Säulen gibt dir Logos-Daten + Ethos-Glaubwürdigkeit + Pathos-Anker für die Übersetzung zu nicht-' +
        'technischen Räumen.' },
    { type: 'heading', level: 2, text: 'Beispiel: VP Engineering, Series B.' },
    { type: 'paragraph', text:
      'Lena (anonymisiert) hat in 30 Tagen ihre Firmenrede-Welle gedreht: von zwölf 1:1-Alignment-Anfragen ' +
      'pro Firmenrede auf zwei. Ihre Challenge fokussierte sich auf SEXIER und Drei Säulen, weil ihre Diagnose ' +
      'EQ-stark und Rhetorik-schwach war. Die volle Geschichte steht im Case Study "Wie Lena ihre Firmenrede drehte".' },
    { type: 'heading', level: 2, text: 'Wie sich die Challenge an Engineering-Rhythmus anpasst.' },
    { type: 'list', style: 'bullet', items: [
      'On-Call-Wochen sind erkannt: WladBot reduziert in dieser Phase die tägliche Drill-Dauer auf fünf Minuten.',
      'Challenge-Reviews werden synchron zu deinen Engineering-Sprint-Endpunkten gelegt, nicht zu generischen Sonntagsterminen.',
      'Code-Review-Slots werden NICHT als Drill-Zeit angeschlagen. Wir respektieren technische Deep-Work-Blöcke.',
    ] },
    { type: 'callout', tone: 'lime', text:
      'Wenn du heute Engineering-Verantwortung trägst und das Gefühl hast deine kommunikative Bandbreite ' +
      'wächst nicht im Tempo deiner Org-Reichweite, ist die Challenge genau dafür gebaut.' },
    { type: 'paragraph', text:
      'Du bist nicht alleine: über 30 Prozent der Challenge-Teilnehmer kommen aus Engineering. Wenn du die ' +
      'Plattform an einem Engineering-Case sehen willst, buch eine 20-Min-Demo. Wir nehmen einen Case aus ' +
      'deinem Backlog und gehen Live durch den ersten Drill.' },
  ],
  seo: {
    title: 'LeaderOS für Engineering-Leitung: CTO, VP, Tech-Lead',
    description:
      'LeaderOS für Engineering-Leitung: die drei Reibungspunkte, die stärksten Frameworks ' +
      'und wie die Challenge sich an deinen Rhythmus anpasst. Von Wlad Jachtchenko.',
    keywords: ['Engineering Leadership Coaching', 'VP Engineering Training', 'Tech Lead Kommunikation', 'CTO Coaching KI', 'Wlad Jachtchenko Engineering'],
  },
  related: ['wie-lena-ihr-townhall-drehte', 'leader-os-im-team-rollout'],
};
