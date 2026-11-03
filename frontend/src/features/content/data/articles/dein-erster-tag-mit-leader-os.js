/**
 * Article 3/10 · onboarding mechanics. What happens on day 1.
 */
export default {
  slug: 'dein-erster-tag-mit-leader-os',
  type: 'guide',
  status: 'published',
  title: 'Dein erster Tag mit LeaderOS.',
  description:
    'Was passiert in den ersten 60 Minuten nach Challenge-Kauf. Ohne ' +
    'Marketing-Theater, von Login bis erstem Drill.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-06-24',
  cover: null,
  tags: ['LeaderOS', 'Onboarding', 'Sprint'],
  body: [
    { type: 'paragraph', text:
      'Wenn du die Challenge kaufst, will der erste Tag nicht zum nächsten Marketing-Funnel werden. Hier ist ' +
      'der reale Ablauf, Minute für Minute, damit du genau weißt was passiert.' },
    { type: 'heading', level: 2, text: 'Minute 0 bis 5: Login + Challenge-Plan.' },
    { type: 'paragraph', text:
      'Du loggst dich auf leaderos.de ein. Der Challenge-Plan ist bereits personalisiert: er nutzt deine ' +
      'Diagnose-Scores (KI-Readiness, Rhetorik, EQ) um die Reihenfolge der elf Frameworks für DEIN Programm ' +
      'zu sortieren. Deine schwächste Dimension kommt zuerst.' },
    { type: 'paragraph', text:
      'Wenn deine Diagnose noch nicht gemacht wurde, läuft sie jetzt · zehn Minuten, dreißig Fragen, sofort ' +
      'der Plan. Wenn sie schon gemacht wurde, springst du direkt zu Minute 10.' },
    { type: 'heading', level: 2, text: 'Minute 10 bis 25: Setup-Gespräch mit WladBot.' },
    { type: 'paragraph', text:
      'Der erste echte Drill ist kein Drill. Es ist ein Setup-Gespräch. WladBot fragt dich nach drei realen ' +
      'Situationen aus den letzten zwei Wochen · ein 1:1, eine Firmenrede, eine Verhandlung. Du beschreibst sie ' +
      'in deinen eigenen Worten. Der Bot speichert sie als Trainings-Cases für die restliche Challenge.' },
    { type: 'callout', tone: 'lime', text:
      'Wichtig: ohne diese drei Cases drillst du gegen generische Beispiele. Mit ihnen drillst du gegen dein ' +
      'echtes Leben. Investiere die fünfzehn Minuten.' },
    { type: 'heading', level: 2, text: 'Minute 25 bis 45: Die erste Lektion + erster Drill.' },
    { type: 'paragraph', text:
      'Lektion 1 aus deinem ersten Hebel-Framework. Wlad spricht direkt mit dir, sieben Minuten Video, ' +
      'transkribiert, ohne Soft-Talk. Danach ein direkter Drill: einer deiner drei Cases vom Setup-Gespräch ' +
      'wird gegen die gerade gelernte Methodik gespiegelt. Du schreibst, WladBot korrigiert.' },
    { type: 'heading', level: 2, text: 'Minute 45 bis 60: Reflexion + Tomorrow-Anker.' },
    { type: 'paragraph', text:
      'Am Ende der Stunde: drei Minuten Reflexion (was hast du gelernt, was hat überrascht), gefolgt von ' +
      'einem konkreten Tomorrow-Anker: eine Mikro-Aufgabe für morgen, gekoppelt an einen echten Slot in ' +
      'deinem Kalender. Beispiel: "Eröffne morgen 9:15 Uhr das 1:1 mit Tobias mit dem B-W-W-Skript aus ' +
      'Drill 01."' },
    { type: 'list', style: 'numbered', items: [
      'Login + Challenge-Plan (5 Min)',
      'Diagnose falls noch nicht gemacht (10 Min, optional)',
      'Setup-Gespräch mit WladBot, drei echte Cases (15 Min)',
      'Lektion 1 + erster Drill am eigenen Case (20 Min)',
      'Reflexion + Tomorrow-Anker (10 Min)',
    ] },
    { type: 'paragraph', text:
      'Sechzig Minuten am ersten Tag. Danach: jeden Tag fünfzehn Minuten neuer Drill, drei Mal pro Woche ' +
      'eine neue Lektion, Sonntag-Review mit deinem Wochen-Score. Keine Streaks ohne Substanz, keine ' +
      'künstliche Gamification.' },
    { type: 'callout', tone: 'neutral', text:
      'Wenn du am ersten Tag keine 60 Minuten investierst, verschiebt sich die Challenge einfach. Wir zwingen ' +
      'nichts. Wir warten bis du startklar bist, der Plan wartet auf dich.' },
    { type: 'paragraph', text:
      'Wer den Challenge-Tag-1 vor dem Kauf sehen will, bucht eine 20-Min-Demo. Wir gehen dir mit dem Team durch ' +
      'die Plattform und du siehst Tag 1 in real-time, an einem Case aus deinem Backlog.' },
  ],
  seo: {
    title: 'LeaderOS Onboarding: dein erster Tag in 60 Minuten',
    description:
      'LeaderOS Onboarding Schritt für Schritt: Login, Challenge-Plan, Setup-Gespräch mit WladBot, erste ' +
      'Lektion und erster Drill am eigenen Case. 60 Minuten, kein Marketing-Theater. Von Wlad Jachtchenko.',
    keywords: ['LeaderOS Onboarding', 'Challenge Tag 1', 'Wlad Challenge Ablauf', 'Leadership Onboarding 30 Tage', 'WladBot Setup'],
  },
  related: ['was-in-leader-os-drin-ist', 'leader-os-im-team-rollout'],
};
