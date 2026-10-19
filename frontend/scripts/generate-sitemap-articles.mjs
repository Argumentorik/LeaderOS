#!/usr/bin/env node
/**
 * generate-sitemap-articles.mjs
 *
 * Emits `public/sitemap-articles.xml` — the complete list of every
 * published journal article under https://leader-os.de/journal/<slug>.
 *
 * Why a generator (vs hand-editing XML): the journal grows constantly and
 * hand-maintained sitemaps silently drift (we shipped 107 articles but the
 * sitemap listed only 81 — 26 pages invisible to Google). This script is the
 * single source of truth: it reads the same article modules the app renders,
 * so the sitemap can never fall out of sync again. Re-run after adding posts:
 *
 *     node scripts/generate-sitemap-articles.mjs
 *
 * The output is committed as a static file (Vercel serves public/ verbatim);
 * this script is NOT wired into the Vercel build to keep the build surface
 * minimal — regenerate locally and commit.
 *
 * Rules mirrored from src/features/content/data/registry.js:
 *   · Only status === 'published' (or missing status) is emitted.
 *   · lastmod = publishedAt, capped at today (a future editorial date is not
 *     a real "last modified" date; crawlers distrust future lastmod values).
 *
 * Priority signal: SEO-pillar slugs keep their elevated weight (head-term
 * winners at 1.0/0.9, cluster pages at 0.85/0.8); everything else defaults
 * to 0.7. Keeping this map here means the sitemap's priorities survive
 * regeneration instead of being flattened.
 */
import { readdir } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = join(__dirname, '..', 'src', 'features', 'content', 'data', 'articles');
const OUT_FILE = join(__dirname, '..', 'public', 'sitemap-articles.xml');
const BASE = 'https://leader-os.de';

// Cap lastmod at the generation date · a future publishedAt is an editorial
// schedule, not a modification timestamp. Passed in so runs are reproducible.
const TODAY = process.env.SITEMAP_TODAY || new Date().toISOString().slice(0, 10);

// Per-slug priority overrides · pillars and money-pages keep their weight.
// Anything not listed defaults to 0.7. Derived from the launch sitemap so no
// SEO signal is lost when we regenerate.
const PRIORITY = {
  // 1.0 · head-term SERP winners we are actively fighting for
  'transformationale-fuehrung': '1.0',
  'laterale-fuehrung': '1.0',
  'fachliche-vs-disziplinarische-fuehrung': '1.0',
  'fuehrungskraefteentwicklung-leadership-development': '1.0',
  'leader-os-vs-chatgpt-claude-perplexity': '1.0',
  'was-ist-eine-ki-native-fuehrungskraft': '1.0',
  'wer-ist-wlad-jachtchenko': '1.0',
  // 0.9 · strong cluster pillars
  'das-ki-produktivitaets-paradox': '0.9',
  'das-system-hinter-dem-system': '0.9',
  'fachliche-fuehrung-ohne-disziplinarische-verantwortung': '0.9',
  'fuehren-ohne-weisungsbefugnis': '0.9',
  'fuehrungskompetenzen-die-wichtigsten': '0.9',
  'fuehrungskraeftetraining-formate-im-vergleich': '0.9',
  'fuehrungsverantwortung-was-bedeutet-das': '0.9',
  'ki-ohne-methodik-ist-slop': '0.9',
  'matrix-organisation-fuehren': '0.9',
  'mehr-als-eine-transformation': '0.9',
  'system-statt-transformation-der-kleine-hebel': '0.9',
  'transformationale-fuehrung-beispiele': '0.9',
  'transformationale-vs-transaktionale-fuehrung': '0.9',
  'warum-dein-chatgpt-tab-dich-nicht-effizienter-macht': '0.9',
  'wenn-deine-ki-investition-versickert-fuenf-diagnose-fragen': '0.9',
  // 0.85 · product/course cluster
  'damit-es-jeder-schafft-die-zugaenglichkeits-philosophie': '0.85',
  'das-versprechen-und-die-grenzen': '0.85',
  'der-ki-sprint-was-dreissig-tage-strukturierte-anwendung-veraendern': '0.85',
  'der-lernpfad-vom-ki-nutzer-zum-ki-leader': '0.85',
  'die-kurs-bibliothek-strukturierte-pfade-durch-leader-os': '0.85',
  'die-leader-os-kurs-architektur': '0.85',
  'drei-rituale-die-ki-investments-rentabel-machen': '0.85',
  'fuer-jeden-mitarbeiter-nicht-nur-fuer-fuehrungskraefte': '0.85',
  'ki-in-zehn-minuten-pro-tag': '0.85',
  'ki-strategie-fuer-mittelstand': '0.85',
  'ki-tool-muedigkeit-was-zu-tun-ist': '0.85',
  'ki-tools-fuer-fuehrungskraefte-2026': '0.85',
  'ki-wissen-vs-ki-reflex': '0.85',
  'leader-os-fuer-cto-und-tech-vorstand': '0.85',
  'leader-os-fuer-mittelstand-ceo': '0.85',
  'leader-os-fuer-neu-befoerderte-leads': '0.85',
  'leader-os-fuer-vertriebsleitung': '0.85',
  'mikro-drills-fuenfzehn-minuten-pro-tag': '0.85',
  'output-messen-im-ki-zeitalter': '0.85',
  'vom-einzel-erfolg-zum-team-system': '0.85',
  'vom-power-user-zum-multiplikator': '0.85',
  'warum-90-prozent-aller-ki-trainings-scheitern': '0.85',
  'warum-leader-os': '0.85',
  'was-in-leader-os-drin-ist': '0.85',
  'wenn-ki-dich-verlangsamt': '0.85',
  // 0.8 · topic guides + scripts
  '5-rollen-der-fuehrung-nach-wlad-jachtchenko': '0.8',
  'alpen-methode-fuer-fuehrungskraefte': '0.8',
  'dein-erster-tag-mit-leader-os': '0.8',
  'der-business-case-fuer-leader-os': '0.8',
  'drei-saeulen-der-ueberzeugung-logos-ethos-pathos': '0.8',
  'dunkle-rhetorik-erkennen-und-abwehren': '0.8',
  'erste-100-tage-als-cto-oder-vp-engineering': '0.8',
  'feedback-geben-vorlage-bww-framework': '0.8',
  'gehaltsgespraech-vorbereiten-skript': '0.8',
  'harvard-verhandlungsmethode-erklaert': '0.8',
  'ki-coaching-vs-traditionelles-coaching-dach': '0.8',
  'ki-leadership-was-bedeutet-das-konkret': '0.8',
  'konfliktgespraech-fuehren-skript': '0.8',
  'kuendigungsgespraech-richtig-fuehren': '0.8',
  'leader-os-fuer-engineering-leitung': '0.8',
  'leader-os-fuer-hr-und-people-ops': '0.8',
  'leader-os-fuer-scaleup-gruender': '0.8',
  'leader-os-im-team-rollout': '0.8',
  'leader-os-vs-klassisches-coaching': '0.8',
  'mitarbeitergespraech-vorbereiten-mit-ki': '0.8',
  'prompt-engineering-fuer-fuehrungskraefte': '0.8',
  'schlagfertigkeit-lernen-als-fuehrungskraft': '0.8',
  'schulz-von-thun-kommunikationsquadrat-fuer-fuehrungskraefte': '0.8',
  'townhall-rede-strukturieren-sexier': '0.8',
  'vier-farben-modell-personalities': '0.8',
  'wladbot-vs-chatgpt-vs-coach': '0.8',
  'zehn-stufen-des-zuhoerens': '0.8',
  // 0.75 · early skill posts
  'chatgpt-als-sparring-partner-fuenf-skripte': '0.75',
  'ki-im-fuehrungs-alltag-drei-use-cases': '0.75',
};

function changefreqFor(priority) {
  // Pillars we refresh often → weekly; the long tail → monthly.
  return Number(priority) >= 0.85 ? 'weekly' : 'monthly';
}

const files = (await readdir(ARTICLES_DIR)).filter((f) => f.endsWith('.js'));

const articles = [];
for (const file of files) {
  const mod = await import(pathToFileURL(join(ARTICLES_DIR, file)).href);
  const a = mod.default;
  if (!a || !a.slug) continue;
  if (a.status && a.status !== 'published') continue;
  const lastmod = a.publishedAt && a.publishedAt > TODAY ? TODAY : (a.publishedAt || TODAY);
  articles.push({ slug: a.slug, lastmod, priority: PRIORITY[a.slug] || '0.7' });
}

// Newest first, then by slug for stable diffs among same-date posts.
articles.sort((x, y) => (x.lastmod === y.lastmod ? x.slug.localeCompare(y.slug) : x.lastmod < y.lastmod ? 1 : -1));

const body = articles
  .map(
    (a) =>
      `  <url>\n` +
      `    <loc>${BASE}/journal/${a.slug}</loc>\n` +
      `    <lastmod>${a.lastmod}</lastmod>\n` +
      `    <changefreq>${changefreqFor(a.priority)}</changefreq>\n` +
      `    <priority>${a.priority}</priority>\n` +
      `  </url>`,
  )
  .join('\n\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Article sitemap for leader-os.de · EVERY published journal post.

  GENERATED by scripts/generate-sitemap-articles.mjs — do not hand-edit.
  Re-run \`node scripts/generate-sitemap-articles.mjs\` after adding posts.
  Kept separate from sitemap.xml (static pages) so the two update
  independently and never list the same URL twice within the index.

  ${articles.length} published articles · generated for ${TODAY}.
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${body}

</urlset>
`;

await writeFile(OUT_FILE, xml, 'utf8');
console.log(`Wrote ${OUT_FILE} · ${articles.length} article URLs (lastmod capped at ${TODAY}).`);
