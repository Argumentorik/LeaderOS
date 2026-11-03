// LeaderOS Kurs-Bibliothek · eine Quelle für Landing, Webinar, Kommunikation,
// KI-Führungskraft und die CTA-Sektion unter den Journal-Artikeln.
//
// Titel, Module und Level stammen aus dem App-Katalog
// (backend/routes/my_path.py · LEARNING_VIDEOS, v1–v10). Bewusst NICHT
// übernommen: Laufzeiten und Folgenzahlen. Ob jede Aufnahme schon
// hochgeladen ist, entscheidet die Mongo-Collection `learning_videos` (Feld
// vimeo_id) — von hier aus nicht prüfbar. Auf Marketingseiten stehen deshalb
// keine Minuten- oder Folgenversprechen.
//
// Zugang laut Tier-Katalog: v1–v6 `free` (jeder Account), v7–v10
// `accelerator` = „Leadership OS PLUS“ (Leadership Plus Pro).

export const COURSE_TRIAL_URL = 'https://leaderos.de/signup?trial=14';

export const COURSES = [
  {
    id: 'v1', code: 'K·01', group: 'basics', title: 'Rhetorik-Grundlagen', module: 'Kommunikation', level: 'Einstieg',
    desc: 'Die drei Säulen wirkungsvoller Führungssprache: Körpersprache, Stimme und Wortwahl.',
    photo: '/journal/topics/stage.webp', tint: '#6366F1',
  },
  {
    id: 'v2', code: 'K·02', group: 'basics', title: 'Schwierige Gespräche meistern', module: 'Kommunikation', level: 'Einstieg',
    desc: 'Konflikt, Kritik und Kündigung führen, ohne dass das Gespräch kippt.',
    photo: '/journal/topics/conflict.webp', tint: '#8B5CF6',
  },
  {
    id: 'v3', code: 'K·03', group: 'basics', title: 'Delegation wie ein Profi', module: 'Führung', level: 'Einstieg',
    desc: 'Aufgaben richtig abgeben, Vertrauen aufbauen, Mikromanagement vermeiden.',
    photo: '/journal/topics/team.webp', tint: '#EC4899',
  },
  {
    id: 'v4', code: 'K·04', group: 'basics', title: 'Feedback-Formate', module: 'Coaching', level: 'Einstieg',
    desc: 'Strukturiert Feedback geben: regelmäßig, an Fakten gebunden, wirksam.',
    photo: '/journal/topics/feedback.webp', tint: '#F59E0B',
  },
  {
    id: 'v5', code: 'K·05', group: 'basics', title: 'Storytelling im Boardroom', module: 'Kommunikation', level: 'Fortgeschritten',
    desc: 'Komplexe Ideen so erzählen, dass sie in zwei Minuten hängen bleiben.',
    photo: '/journal/topics/writing.webp', tint: '#10B981',
  },
  {
    id: 'v6', code: 'K·06', group: 'basics', title: 'Meeting-Rhetorik', module: 'Führung', level: 'Einstieg',
    desc: 'Agenda, Eröffnung und Wortmeldungen: Meetings führen, die zu Entscheidungen kommen.',
    photo: '/journal/topics/boardroom.webp', tint: '#14B8A6',
  },
  {
    id: 'v7', code: 'M·01', group: 'master', title: 'KI-First Leadership', module: 'AI-Strategie', level: 'Master',
    desc: 'KI in Entscheidungen und Teamabläufe einbauen, ohne das eigene Urteil abzugeben.',
    photo: '/journal/topics/ai.webp', tint: '#BFFF00',
  },
  {
    id: 'v8', code: 'M·02', group: 'master', title: 'Change Management Master', module: 'Strategie', level: 'Master',
    desc: 'Veränderung so führen, dass das Team mitgeht. Mit Kotters 8-Schritte-Modell, KI-aktualisiert.',
    photo: '/journal/topics/team-b.webp', tint: '#BFFF00',
  },
  {
    id: 'v9', code: 'M·03', group: 'master', title: 'Executive Presence', module: 'Führung', level: 'Master',
    desc: 'Raum einnehmen, bevor du sprichst: Präsenz und Gravitas trainieren.',
    photo: '/journal/topics/presence.webp', tint: '#BFFF00',
  },
  {
    id: 'v10', code: 'M·04', group: 'master', title: 'Boardroom-Strategie', module: 'Strategie', level: 'Master',
    desc: 'C-Level-Entscheidungen vorbereiten, präsentieren und durchsetzen.',
    photo: '/journal/topics/boardroom-b.webp', tint: '#BFFF00',
  },
];

export const COURSE_ACCESS = {
  basics: 'Im 14-Tage-Test enthalten',
  master: 'Im OS-Jahr · Leadership Plus Pro',
};

// Framework-Drills laut OfferProofSection: „11 Framework-Kurse · Harvard-Verhandlung,
// BWW-Feedback, 5 Rollen, Dunkle-Rhetorik-Defensive u. a.“ — keine vollständige
// Liste, weil sie im Repo nirgends als Katalog steht.
export const FRAMEWORK_DRILLS = ['Harvard-Verhandlung', 'Feedbackformel', '5 Rollen', 'Dunkle Rhetorik', 'SEXIER', '10 Stufen des Zuhörens'];

const RULES = [
  [/(feedback|lob|anerkennung)/i, 'v4'],
  [/(konflikt|kritik|kündig|kuendig|schwierig|gespräch|gespraech|jahresgespr)/i, 'v2'],
  [/(delegier|ownership|verantwortung|micromanage)/i, 'v3'],
  [/(storytelling|präsentation|praesentation|townhall|rede)/i, 'v5'],
  [/(meeting|agenda|q-and-a|besprechung)/i, 'v6'],
  [/(ki-|\bki\b|prompt|chatgpt|agent|shadow)/i, 'v7'],
  [/(change|transform|veränderung|veraenderung|team-uebernimmst|rollout)/i, 'v8'],
  [/(charisma|präsenz|praesenz|körpersprache|koerpersprache|erster eindruck|sieben-sekunden)/i, 'v9'],
  [/(strategie|boardroom|entscheidung|business-case|cto|ceo)/i, 'v10'],
  [/(rhetorik|schlagfertig|argument|überzeug|ueberzeug|sexier|zuhör|zuhoer)/i, 'v1'],
];

/** Passender Kurs zu einem Artikel (Slug + Tags + Titel), Fallback Rhetorik-Grundlagen. */
export function courseForArticle(article) {
  const hay = `${article?.slug ?? ''} ${(article?.tags ?? []).join(' ')} ${article?.title ?? ''}`;
  for (const [re, id] of RULES) if (re.test(hay)) return COURSES.find((c) => c.id === id);
  return COURSES[0];
}
