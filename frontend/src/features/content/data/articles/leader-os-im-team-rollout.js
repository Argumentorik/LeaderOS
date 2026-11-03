/**
 * Article 8/10 · B2B rollout guide (10-50 people).
 */
export default {
  slug: 'leader-os-im-team-rollout',
  type: 'guide',
  status: 'published',
  title: 'LeaderOS im Team-Rollout.',
  description:
    'Zehn bis fünfzig Führungskräfte gleichzeitig auf LeaderOS bringen, ' +
    'ohne dass es nach Top-Down-Pflicht-Tool aussieht. Ein erprobter Vier-' +
    'Wochen-Rollout-Plan.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-06-26',
  cover: null,
  tags: ['LeaderOS', 'B2B', 'Rollout'],
  body: [
    { type: 'paragraph', text:
      'Ein Tool top-down einzuführen ist die einfachste Art, es scheitern zu lassen. Wenn deine Führungs-' +
      'kräfte das Gefühl haben "noch eine HR-Initiative", werden sie höflich nicken und die App im ersten ' +
      'Monat zweimal öffnen. Hier ist der Vier-Wochen-Rollout, der das verhindert.' },
    { type: 'heading', level: 2, text: 'Woche -2: Pilot-Kohorte aus drei freiwilligen High-Trust-Profilen.' },
    { type: 'paragraph', text:
      'Drei Führungskräfte aus deiner Senior-Schicht, die für ihr Team als glaubwürdig gelten. Sie machen ' +
      'die Diagnose, danach die Challenge, mit einer einfachen Bitte: ehrliches Feedback nach Tag 7 und Tag 21. ' +
      'Wenn sie nach Tag 21 sagen "das funktioniert", ist deine Hauptauf­gabe für den Rollout erledigt · sie ' +
      'sprechen anders darüber als jedes Marketing-Material.' },
    { type: 'heading', level: 2, text: 'Woche 0: Kickoff in 45 Minuten.' },
    { type: 'list', style: 'numbered', items: [
      '5 Min: einer der Pilot-Teilnehmer beschreibt seine letzten 30 Tage konkret. Kein Demo-Theater, eine echte Stimme.',
      '15 Min: Wlad live (über Cal.com) oder vorab-aufgenommen, Q&A zu Methodik und Erwartungen.',
      '15 Min: Plattform-Walkthrough vom Team · Login, Challenge-Plan, WladBot in Action.',
      '10 Min: Diagnose-Aufruf für alle. Jeder macht die Diagnose direkt im Kickoff-Raum, sieht seinen Score live.',
    ] },
    { type: 'callout', tone: 'lime', text:
      'Wichtig: niemand wird gezwungen die Challenge zu starten. Diagnose ist kostenlos. Wer danach sagt "nicht ' +
      'für mich", ist OK. Wer ja sagt, hat sich selbst entschieden · das ist der Faktor der die Completion-' +
      'Rate auf über 80 Prozent treibt.' },
    { type: 'heading', level: 2, text: 'Woche 1 bis 4: Die Kohorte läuft.' },
    { type: 'paragraph', text:
      'Pro Person eine 30-Tage-Challenge, parallel laufend. Drei zusätzliche Anker:' },
    { type: 'list', style: 'bullet', items: [
      'Wöchentlicher 15-Min-Standup (optional, ohne Pflicht) · drei der Teilnehmer beschreiben ihren größten Drill der Woche.',
      'Slack-Channel mit WladBot-Snippets · wer einen besonders guten Reflex hatte, postet ihn. Soziales Lernen ohne Performance-Druck.',
      'Wlad-Live-Session in Woche 3 (Plus-Plus-Tier) · 60 Minuten Q&A zu echten Cases aus deiner Kohorte.',
    ] },
    { type: 'heading', level: 2, text: 'Woche 5: Reflexions-Runde + Plus-Plus-Entscheidung.' },
    { type: 'paragraph', text:
      'Nach den 30 Tagen sammelt dein L&D-Team das standardisierte Ende-Challenge-Survey ein. Die Personen die ' +
      'mehr wollen, upgraden auf Plus-Plus für die folgenden 12 Monate. Die anderen behalten lebenslangen ' +
      'Zugriff auf die elf Frameworks und WladBot.' },
    { type: 'framework', code: 'ROLLOUT', title: 'Vier-Wochen-Plan',
      explanation:
        'Woche -2: Pilot. Woche 0: Kickoff + freiwillige Diagnose. Woche 1-4: parallele Challenges + drei ' +
        'Anker-Sessions. Woche 5: Reflexions-Runde + Plus-Plus-Wahl. Beobachtete Completion-Rate dieser ' +
        'Mechanik in 12-50-Personen-Kohorten: 78 bis 85 Prozent.' },
    { type: 'heading', level: 2, text: 'Was du als Sponsor NICHT tun solltest.' },
    { type: 'list', style: 'bullet', items: [
      'Die Challenge NICHT als Pflicht für eine Beförderung anschlagen. Macht aus dem Tool ein Bewerbungs-Theater.',
      'Keine Manager-Reports über individuelle Drill-Aktivität ziehen. Challenge-Privatsphäre ist das Vertrauens-Fundament.',
      'Keine zusätzlichen Plattform-Tools "to track engagement". Wir liefern bereits die richtigen Aggregat-Daten.',
    ] },
    { type: 'paragraph', text:
      'Für eine konkrete Rollout-Begleitung mit deinem L&D-Team: 30-Min-Beratung. Wir bringen unseren Rollout-' +
      'Playbook mit und passen ihn an deine Organisation an.' },
  ],
  seo: {
    title: 'LeaderOS im Team-Rollout: der 4-Wochen-Plan (B2B)',
    description:
      'Team-Rollout von LeaderOS: der erprobte Vier-Wochen-Plan für zehn bis fünfzig ' +
      'Führungskräfte. Completion-Rate 78-85 Prozent. Von Wlad Jachtchenko.',
    keywords: ['Leadership Tool Rollout', 'Team Coaching Rollout', 'B2B Leadership Programm', 'Team Challenge Implementation', 'Wlad Jachtchenko Team'],
  },
  related: ['leader-os-fuer-hr-und-people-ops', 'der-business-case-fuer-leader-os'],
};
