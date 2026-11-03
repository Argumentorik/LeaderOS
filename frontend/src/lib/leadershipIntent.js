/**
 * leadershipIntent · the Intent Schema Layer (Growth-Loop Layer 2 + 4).
 *
 * Every raw leadership problem a visitor types — into the WladBot funnel
 * card, an in-article diagnostic block, the lead modal — gets normalized
 * HERE into one machine-readable shape, then fired as a single canonical
 * PostHog event. That uniformity is the whole point: one event name, one
 * schema, so the Intelligence Layer (clustering, content-gap detection)
 * has clean data to compound on. See docs/gtm/GROWTH_LOOP.md.
 *
 * Intent shape (stable contract · don't rename fields, only add):
 *   {
 *     raw_problem:      string,           // verbatim user text
 *     category:         enum,             // conflict|delegation|performance|
 *                                         //   communication|change|identity|other
 *     leadership_level: enum|null,        // first-time|senior|exec|null
 *     urgency:          'low'|'medium'|'high',
 *     clarity_score:    number,           // 0..1 · how actionable the input is
 *     keywords:         string[],         // extracted signal terms
 *     source:           string,           // which surface captured it
 *     article:          string|null,      // article slug if on a journal page
 *   }
 *
 * v1 classification is keyword-based on purpose: it ships today, runs
 * client-side with zero latency/cost, and starts filling the intent
 * database immediately. The category model can be upgraded to an LLM
 * pass server-side later without changing this contract or the event.
 */

// Category keyword maps · German first (primary audience) + English.
// Order matters only for tie-breaks; we score all and take the max.
const CATEGORY_SIGNALS = {
  conflict: [
    'konflikt', 'streit', 'spannung', 'eskaliert', 'eskalation', 'zieht nicht mit',
    'widerstand', 'blockiert', 'gegenwind', 'auseinandersetzung', 'reibung',
    'conflict', 'tension', 'pushback', 'resist',
  ],
  delegation: [
    'delegier', 'abgeben', 'loslassen', 'micromanage', 'mikromanage', 'alles selbst',
    'überlastet', 'überlastung', 'zu viel', 'kapazität', 'priorisier',
    'delegate', 'hand off', 'overloaded', 'capacity',
  ],
  performance: [
    'leistung', 'performance', 'underperform', 'minderleist', 'zieht nicht', 'low performer',
    'ziele nicht', 'liefert nicht', 'motivation', 'demotiviert', 'kündig', 'feedback',
    'gespräch', 'kritik', 'bewertung', 'unterperform',
  ],
  communication: [
    'kommunik', 'firmenrede', 'präsentation', 'rede', 'meeting', 'rhetorik',
    'überzeug', 'durchdring', 'gehört werden', 'schlagfertig', 'verhandl',
    'communication', 'presentation', 'negotiat', 'persuad',
  ],
  change: [
    'change', 'wandel', 'transformation', 'umbruch', 'reorganisation', 'reorg',
    'einführen', 'rollout', 'widerstand gegen', 'neue strategie', 'restructur',
    'unsicherheit', 'angst vor',
  ],
  identity: [
    'imposter', 'hochstapler', 'selbstzweifel', 'unsicher in meiner rolle',
    'neu befördert', 'erste mal führung', 'überfordert', 'burnout', 'erschöpf',
    'wer bin ich', 'identität', 'rolle finden', 'self-doubt', 'first-time',
  ],
};

const URGENCY_HIGH = [
  'sofort', 'dringend', 'morgen', 'heute', 'jetzt', 'eskaliert', 'krise', 'notfall',
  'urgent', 'asap', 'tomorrow', 'crisis', 'now',
];
const URGENCY_MED = [
  'diese woche', 'bald', 'demnächst', 'ansteh', 'this week', 'soon',
];

const LEVEL_SIGNALS = {
  'first-time': ['neu befördert', 'erste mal', 'frisch', 'first-time', 'new lead', 'gerade team'],
  exec: ['vorstand', 'geschäftsführ', 'c-level', 'ceo', 'cto', 'vp', 'executive', 'board'],
  senior: ['senior', 'bereichsleit', 'abteilungsleit', 'director', 'head of', 'manage manager'],
};

const STOPWORDS = new Set([
  'und', 'der', 'die', 'das', 'ein', 'eine', 'ich', 'mein', 'meine', 'mit', 'für', 'auf',
  'ist', 'sind', 'wie', 'was', 'wer', 'wenn', 'aber', 'nicht', 'zum', 'zur', 'den', 'dem',
  'the', 'and', 'with', 'for', 'how', 'what', 'when', 'but', 'not', 'this', 'that',
]);

const countHits = (text, terms) =>
  terms.reduce((n, t) => (text.includes(t) ? n + 1 : n), 0);

/**
 * Normalize a raw problem string (+ optional explicit hints) into the
 * structured intent object. Pure · no side effects.
 */
export function classifyIntent(rawProblem, opts = {}) {
  const raw = (rawProblem || '').trim();
  const text = raw.toLowerCase();

  // Category · highest keyword score wins; ties fall back to 'other'.
  let category = 'other';
  let best = 0;
  for (const [cat, terms] of Object.entries(CATEGORY_SIGNALS)) {
    const score = countHits(text, terms);
    if (score > best) { best = score; category = cat; }
  }
  // An explicit category hint (e.g. from a diagnostic block's preset)
  // overrides the keyword guess.
  if (opts.category) category = opts.category;

  // Urgency.
  let urgency = 'low';
  if (countHits(text, URGENCY_HIGH) > 0) urgency = 'high';
  else if (countHits(text, URGENCY_MED) > 0) urgency = 'medium';

  // Leadership level.
  let leadership_level = opts.level || null;
  if (!leadership_level) {
    for (const [lvl, terms] of Object.entries(LEVEL_SIGNALS)) {
      if (countHits(text, terms) > 0) { leadership_level = lvl; break; }
    }
  }

  // Clarity score 0..1 · rewards a specific, sized problem statement.
  // Empty = 0, one vague word ≈ 0.1, a real 2-sentence situation ≈ 0.8+.
  const words = text.split(/\s+/).filter(Boolean);
  const lenScore = Math.min(words.length / 25, 1);        // ~25 words = full
  const specificity = best > 0 ? 0.3 : 0;                  // matched a category
  const hasContext = /weil|wenn|nachdem|seit|obwohl|trotz|because|when|after|since/.test(text) ? 0.2 : 0;
  const clarity_score = raw ? Math.min(Math.round((lenScore * 0.5 + specificity + hasContext) * 100) / 100, 1) : 0;

  // Keyword extraction · the signal terms for the Intelligence Layer's
  // content-gap detection. Dedup, drop stopwords + short tokens.
  const keywords = Array.from(new Set(
    words.filter((w) => w.length >= 4 && !STOPWORDS.has(w)).map((w) => w.replace(/[^a-zäöüß]/g, '')),
  )).filter(Boolean).slice(0, 8);

  return {
    raw_problem: raw,
    category,
    leadership_level,
    urgency,
    clarity_score,
    keywords,
    source: opts.source || 'unknown',
    article: opts.article || null,
  };
}

/**
 * Fire the canonical intent event to PostHog. ONE event name across every
 * capture surface so the Intelligence Layer queries a single stream.
 * Never throws · analytics must never block the funnel.
 */
export function captureLeadershipIntent(rawProblem, opts = {}) {
  const intent = classifyIntent(rawProblem, opts);
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try {
      window.posthog.capture('leadership_intent_captured', intent);
      // Person-property roll-up so a returning visitor's dominant problem
      // category + level become queryable cohort traits.
      if (intent.category !== 'other' || intent.leadership_level) {
        window.posthog.people?.set?.({
          last_problem_category: intent.category,
          ...(intent.leadership_level ? { leadership_level: intent.leadership_level } : {}),
        });
      }
    } catch { /* never block UX */ }
  }
  return intent;
}

/**
 * Build the WladBot deep-link for a captured intent · routes the visitor
 * into the Solution Layer (Layer 3) with their problem + category so the
 * bot can open with a category-tuned diagnosis instead of a blank prompt.
 */
export function wladbotUrlForIntent(intent, articleTitle) {
  const prompt = intent.raw_problem
    ? `Meine Situation als Führungskraft (${intent.category}): ${intent.raw_problem}.` +
      (articleTitle ? ` Ich habe gerade „${articleTitle}" gelesen.` : '') +
      ' Gib mir Diagnose, Framework und 3 konkrete nächste Schritte nach Wlads Methodik.'
    : `Ich brauche Hilfe bei einer Führungs-Situation${articleTitle ? ` · ich habe gerade „${articleTitle}" gelesen` : ''}. Was ist mein nächster Schritt nach Wlads Methodik?`;
  const u = new URL('https://leaderos.de/chat');
  u.searchParams.set('prompt', prompt);
  u.searchParams.set('utm_source', 'leader-os');
  u.searchParams.set('utm_medium', 'intent-funnel');
  u.searchParams.set('utm_campaign', intent.source || 'wladbot');
  if (intent.category) u.searchParams.set('cat', intent.category);
  if (intent.article) u.searchParams.set('article', intent.article);
  return u.toString();
}
