/**
 * topicCovers · themenpassendes Editorial-Foto für jeden Artikel ohne
 * eigenes `cover`.
 *
 * 16 Szenen (Schwarz-Weiß, Athletic-Editorial wie DESIGN.md) liegen unter
 * public/journal/topics/<theme>[-b].webp. Die Regeln unten ordnen jeden
 * Artikel über Slug, Titel und Tags einer Szene zu — erste passende Regel
 * gewinnt, deshalb stehen die spezifischen Themen oben. Häufige Themen haben
 * eine zweite Variante (`-b`), damit zwei Karten nebeneinander nicht dasselbe
 * Bild zeigen.
 *
 * Pure ES module ohne React: auch in Node-Skripten nutzbar.
 */

export const TOPIC_THEMES = {
  app: 'Training mit der LeaderOS-App',
  negotiation: 'Verhandlung am Konferenztisch',
  feedback: 'Feedback-Gespräch unter vier Augen',
  conflict: 'Konfliktgespräch im Meetingraum',
  presence: 'Körpersprache und Ausstrahlung',
  stage: 'Rede vor vollem Saal',
  solitude: 'Führungskraft allein am Fenster',
  writing: 'Persönliche Notizen am Schreibtisch',
  sprint: 'Läufer auf der Bahn · tägliches Training',
  time: 'Wochenplaner und Uhr auf dem Schreibtisch',
  remote: 'Videocall im Homeoffice',
  training: 'Führungskräfte-Workshop',
  boardroom: 'Präsentation im Boardroom',
  ai: 'Arbeit mit KI am Laptop',
  listening: 'Coach hört aufmerksam zu',
  team: 'Team am Whiteboard',
};

// Einzelfälle, die keine Regel sauber trifft.
const OVERRIDES = {
  'liebe-mitarbeiter-das-hier-wollte-ich-euch-immer-sagen': 'writing',
  'warum-die-besten-chefs-die-schlechtesten-mentoren-sind': 'listening',
  'group-coaching-vs-einzelcoaching-fuer-fuehrungskraefte': 'training',
  'teamentwicklung-nach-tuckman-fuer-fuehrungskraefte': 'team',
  'e-mails-die-autoritaet-zeigen-drei-regeln': 'remote',
  'micromanagement-erkennen-bei-dir-selbst': 'team',
  'mitarbeiter-motivation-4-0-was-wirklich-zieht': 'listening',
};

// Reihenfolge = Priorität. Die App-Regel prüft nur den Slug: Das Tag
// „LeaderOS“ steht auch an vielen Methodik-Artikeln.
const RULES = [
  ['app', /leader-os|wladbot|kurs-architektur|kurs-bibliothek|erster-tag|ersten-7-tage|sprint-vs-plus|business-case|zugaenglichkeit|versprechen-und-die-grenzen|system-hinter-dem-system|fuer-jeden-mitarbeiter/, 'slug'],
  ['writing', /brief-an|erste-fuehrungsentscheidung|wer-ist-wlad/, 'slug'],
  ['remote', /remote|async|slack|homeoffice|new-work/],
  ['negotiation', /verhandl|gehalt|harvard/],
  ['feedback', /feedback|1-zu-1|1:1|mitarbeitergespr|mitarbeiterbewert|drei-saetze/],
  ['conflict', /konflikt|konfront|kuendigung|manipul|dunkle|schlagfertig|nein-sagst|schwierige-nachrichten|team-uebernimmst/],
  ['presence', /koerpersprache|charisma|stimme|sieben-sekunden|ausstrahlung|autoritaet/],
  ['stage', /rede|townhall|rhetorik|praesent|pitch|storytelling|sexier|logos-ethos|argumentation|ueberzeug|elevator/],
  ['solitude', /burnout|einsam|imposter|selbstfuehr|stress|aufhoerte-zu-pushen/],
  ['sprint', /sprint|30-tage|dreissig-tage|drill|routine|challenge|marathon|gewohnheit|lernpfad|6-monaten|vergessenskurve|micro-learning|reflex|ritual|frameworks-nicht-im-kopf/],
  ['time', /zeitmanagement|kalender|eisenhower|pareto|alpen|produktiv|stunden|minuten-pro-tag|delegat|micromanag|output-messen|verlangsamt/],
  ['training', /training|seminar|schulung|curriculum|workshop|zertifizierung|blended|inhouse|fuehrungskraefteentwicklung|train-the-trainer|formate|coaching-programm/],
  ['boardroom', /\bceo\b|\bcto\b|c-level|director|vorstand|mittelstand|board|\broi\b|strategie|transformation|okr|kpi|investition/],
  ['ai', /\bki\b|ki-|chatgpt|prompt|claude|gemini|halluzin|\bai\b|tool/],
  ['listening', /zuhoer|coach|mentor|peer|\beq\b|empath|vertrauen|schulz-von-thun|quadrat|gespraechstyp|farben/],
  ['team', /./],
];

// Themen mit zweiter Bildvariante (-b).
const VARIANTS = new Set(['app', 'training', 'ai', 'team', 'sprint', 'boardroom', 'conflict', 'listening']);

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function topicThemeFor(article) {
  const slug = article?.slug || '';
  if (OVERRIDES[slug]) return OVERRIDES[slug];
  const hay = [slug, article?.title, ...(article?.tags || [])].join(' ').toLowerCase();
  for (const [theme, re, scope] of RULES) if (re.test(scope === 'slug' ? slug : hay)) return theme;
  return 'team';
}

// Themen ohne -b-Variante: verwandtes Motiv als zweites Bild.
const SIBLING = {
  feedback: 'listening',
  negotiation: 'conflict-b',
  presence: 'stage',
  stage: 'presence',
  solitude: 'writing',
  writing: 'solitude',
  time: 'writing',
  remote: 'ai-b',
};

/** Bildpfad für das Thema; Variante deterministisch per Slug, optional erzwungen. */
export function topicCover(article, variant) {
  const theme = topicThemeFor(article);
  if (!VARIANTS.has(theme)) {
    return `/journal/topics/${variant === 'b' ? SIBLING[theme] : theme}.webp`;
  }
  const useB = (variant ?? (hash(article?.slug || '') % 2 === 1 ? 'b' : 'a')) === 'b';
  return `/journal/topics/${theme}${useB ? '-b' : ''}.webp`;
}

export const topicAlt = (article) => TOPIC_THEMES[topicThemeFor(article)];
