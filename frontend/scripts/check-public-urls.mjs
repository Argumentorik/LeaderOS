#!/usr/bin/env node
/**
 * check-public-urls.mjs
 *
 * Verhindert eine Klasse von SEO-Bugs: **wir versprechen Suchmaschinen
 * eine URL, die es nicht gibt.**
 *
 * Anlass (August 2026): das JSON-LD der Startseite enthielt eine
 * `SearchAction` auf `/search?q={search_term_string}`. Eine Route
 * `/search` gab es nie — die Journal-Suche ist reiner Client-State.
 * Google hat das Template wörtlich gecrawlt; die Phantom-URL tauchte in
 * der Search-Console-Abdeckung als eigener Fehler auf. Niemand hat es
 * gemerkt, weil nichts im Build eine solche Behauptung geprüft hat.
 *
 * Geprüft wird für leader-os.de:
 *   1. jede <loc> in public/sitemap.xml
 *   2. jede interne URL im JSON-LD von public/index.html
 *      (`url`, `target`, `item`, `mainEntityOfPage`, …)
 *
 * Ein Pfad gilt als gültig, wenn er entweder
 *   · als statische Datei unter public/<pfad>/index.html liegt, oder
 *   · als <Route path="…"> in src/App.js deklariert ist.
 *
 * Reine Fragment-Referenzen (`#organization`) und die App-Hosts
 * (leaderos.de, leadercheck.de) sind ausgenommen — Erstere sind
 * @id-Anker, Letztere liegen in einem anderen Deployment.
 *
 * Aufruf: node scripts/check-public-urls.mjs   · Exit 1 bei Fund.
 */
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const APP_FILE = join(__dirname, '..', 'src', 'App.js');
const HOST = 'https://leader-os.de';

const exists = (p) => access(p).then(() => true, () => false);

/** Alle <Route path="…"> aus App.js, als Regex-Matcher. */
async function routeMatchers() {
  const src = await readFile(APP_FILE, 'utf8');
  const paths = [...src.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
  return paths.map((p) => {
    // ':slug' → ein beliebiges Segment, '*' → Rest der URL
    const rx = p
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/:[A-Za-z0-9_]+/g, '[^/]+')
      .replace(/\*/g, '.*');
    return new RegExp(`^${rx}$`);
  });
}

async function isValid(pathname, matchers) {
  const clean = pathname.replace(/\/$/, '') || '/';
  if (clean === '/') return true;
  const rel = clean.replace(/^\//, '');
  if (await exists(join(PUBLIC_DIR, rel, 'index.html'))) return true;   // statische Seite
  if (await exists(join(PUBLIC_DIR, rel))) return true;                 // statische Datei
  return matchers.some((rx) => rx.test(clean));                         // React-Route
}

/** Interne URLs aus einem JSON-LD-Objektbaum einsammeln. */
function collectUrls(node, out = []) {
  if (typeof node === 'string') {
    if (node.startsWith(HOST)) out.push(node);
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((n) => collectUrls(n, out));
    return out;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === '@id') continue;   // @ids sind Anker, keine abrufbaren URLs
      collectUrls(value, out);
    }
  }
  return out;
}

async function main() {
  const matchers = await routeMatchers();
  const problems = [];

  // 1 · Sitemap
  const sitemap = await readFile(join(PUBLIC_DIR, 'sitemap.xml'), 'utf8');
  const locs = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  for (const loc of locs) {
    if (!loc.startsWith(HOST)) continue;
    const { pathname } = new URL(loc);
    if (!(await isValid(pathname, matchers))) {
      problems.push(`sitemap.xml listet ${loc} — weder statische Seite noch Route in App.js`);
    }
  }

  // 2 · JSON-LD der Shell
  const indexHtml = await readFile(join(PUBLIC_DIR, 'index.html'), 'utf8');
  const blocks = [...indexHtml.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )].map((m) => m[1]);
  for (const block of blocks) {
    const data = JSON.parse(block);
    for (const url of new Set(collectUrls(data))) {
      const { pathname, search } = new URL(url);
      if (search.includes('{') || pathname.includes('{')) {
        problems.push(
          `index.html JSON-LD enthält ein URL-Template: ${url} — ` +
          'Suchmaschinen crawlen das wörtlich (siehe SEO_AEO_PLAYBOOK §2)',
        );
        continue;
      }
      if (!(await isValid(pathname, matchers))) {
        problems.push(`index.html JSON-LD verweist auf ${url} — diese Route existiert nicht`);
      }
    }
  }

  if (problems.length) {
    console.error('✖ Öffentlich versprochene URLs ohne Gegenstück:\n');
    problems.forEach((p) => console.error(`   · ${p}`));
    console.error('\nRegel: kein Schema und kein Sitemap-Eintrag für Seiten, die es nicht gibt.');
    process.exit(1);
  }
  console.log(`✓ ${locs.length} Sitemap-URLs und alle JSON-LD-Verweise haben ein Gegenstück.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
