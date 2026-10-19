/**
 * Tag-Taxonomy · curated grouping for the Journal index.
 *
 * Article tags in /data/articles/*.js are free-form strings (KI, Frameworks,
 * Rhetorik, Skripte, …). For SEO + discovery the index needs ordered
 * categories · "KI-Praxis", "Methoden", "Rollen", "Karriere", "Plattform" ·
 * each with a clear positioning and a curated tag list.
 *
 * The order of TAXONOMY is the order of rendering. Each category captures
 * a slice of the funnel: KI-Praxis (top of funnel, viral), Methoden
 * (consideration), Rollen (identity), Karriere (outcome), Plattform
 * (conversion-side).
 */

export const TAXONOMY = [
  {
    code: 'C-01',
    slug: 'ki-praxis',
    name: 'KI-Praxis',
    tagline: 'Was du Montagmorgen einsetzen kannst.',
    description:
      'KI-Prompts, Routinen und Mikro-Drills. Was wirklich funktioniert ' +
      'im Führungsalltag, was nicht. Keine Tool-Reviews, sondern ' +
      'Methodik-Werkzeuge.',
    tagMatches: ['KI', 'Prompts', 'KI-Routine', 'Tools'],
    funnelLabel: 'OFT GELESEN',
  },
  {
    code: 'C-02',
    slug: 'methoden',
    name: 'Methoden & Frameworks',
    tagline: 'Die elf Modelle die jede Führungskraft beherrschen sollte.',
    description:
      'B-W-W, Harvard-Verhandlung, Schulz von Thun, Vier-Farben · die ' +
      'Klassiker richtig erklärt. Plus die KI-Verstärkung dahinter.',
    tagMatches: ['Frameworks', 'Methodik', 'Skripte', 'Feedback', 'Training', 'Coaching', 'Team'],
    funnelLabel: 'EVERGREEN',
  },
  {
    code: 'C-03',
    slug: 'rhetorik',
    name: 'Rhetorik & Kommunikation',
    tagline: 'Schlagfertigkeit, Verhandlung, Konflikt · souverän auflösen.',
    description:
      'Aus Wlads 3 SPIEGEL-Bestsellern: Dunkle Rhetorik erkennen, ' +
      'Schlagfertigkeit trainieren, Verhandlungen führen ohne sich ' +
      'verbiegen zu müssen.',
    tagMatches: ['Rhetorik', 'Schlagfertigkeit', 'Verhandlung', 'Kommunikation'],
    funnelLabel: 'SPIEGEL-BESTSELLER',
  },
  {
    code: 'C-04',
    slug: 'rollen-karriere',
    name: 'Rollen & Karriere',
    tagline: 'Vom IC zur Führungskraft. Vom Manager zum Multiplikator.',
    description:
      'Identitäts-Sprünge zwischen Stufen · was sich ändern muss, ' +
      'was nicht. Speziell für die Übergänge die jeder verpatzt.',
    tagMatches: ['Rollen', 'Karriere', 'Identity', 'Sprint', 'Strategie'],
    funnelLabel: 'IDENTITY-SHIFT',
  },
  {
    code: 'C-05',
    slug: 'plattform',
    name: 'Plattform & LeaderOS',
    tagline: 'Was LeaderOS ist, wie die Challenge läuft, für wen es passt.',
    description:
      'Konkretes über die Plattform, die 30-Tage-Challenge und alle Vorteile, ' +
      'die du ab Tag 1 bekommst.',
    tagMatches: ['Plattform', 'Sprint', 'LeaderOS'],
    funnelLabel: 'WIE GEHT ES WEITER',
  },
];

/**
 * Bucket an article into the first matching category.
 * Falls back to "C-02 Methoden" if no tag matches · that bucket is generic
 * enough that it never reads as "uncategorized".
 */
export function categoryForArticle(article, manualOverrides = {}) {
  if (manualOverrides[article.slug]) return manualOverrides[article.slug];
  const tags = (article.tags || []).map((t) => t.toLowerCase());
  for (const cat of TAXONOMY) {
    if (cat.tagMatches.some((m) => tags.includes(m.toLowerCase()))) return cat.code;
  }
  return 'C-02';
}

/**
 * Group all published articles into the curated categories.
 * Returns the TAXONOMY order, each with its `articles` populated.
 */
export function groupByTaxonomy(articles, manualOverrides = {}) {
  const buckets = Object.fromEntries(TAXONOMY.map((c) => [c.code, []]));
  for (const a of articles) {
    const code = categoryForArticle(a, manualOverrides);
    buckets[code].push(a);
  }
  return TAXONOMY.map((c) => ({ ...c, articles: buckets[c.code] }));
}
