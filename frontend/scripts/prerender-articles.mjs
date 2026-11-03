#!/usr/bin/env node
/**
 * prerender-articles.mjs · Build-time static HTML for every journal article.
 *
 * WHY: The CRA bundle ships an empty <div id="root"> — Google defers
 * JS-rendering for weeks on low-authority pages ("Discovered – currently
 * not indexed", GSC Aug 2026), and AI crawlers (GPTBot, ClaudeBot,
 * PerplexityBot) execute NO JavaScript at all. Worse, every deep URL served
 * the HOMEPAGE's <title>/<meta>/canonical until JS ran, telling crawlers
 * each article was a duplicate of "/". This script fixes both at build
 * time, with zero new dependencies:
 *
 *   build/journal/<slug>/index.html  ← full article HTML + correct meta
 *   build/journal/index.html         ← crawlable A–Z hub linking every post
 *
 * Vercel serves real files before SPA rewrites (filesystem beats the
 * catch-all rewrite in vercel.json), so crawlers get complete, canonical,
 * semantic HTML — and human visitors get the same page, then React mounts
 * on #root and takes over (createRoot().render() replaces the prerendered
 * content; no hydration involved).
 *
 * Wired into `yarn build` (package.json) so Vercel AND the CI parity build
 * both run it — the script failing fails the build ON PURPOSE: a silent
 * prerender regression would silently re-break SEO.
 *
 * Article data contract: same modules the app renders
 * (src/features/content/data/articles/*.js — pure default-export objects,
 * verified import-free). Body block types handled: paragraph, heading,
 * list, framework, callout, quote. Unknown types fail the build loudly.
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = join(__dirname, '..', 'src', 'features', 'content', 'data', 'articles');
const BUILD_DIR = join(__dirname, '..', 'build');
const BASE = 'https://leader-os.de';

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// ---------------------------------------------------------------- articles
async function loadArticles() {
  const files = (await readdir(ARTICLES_DIR)).filter((f) => f.endsWith('.js'));
  const articles = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(ARTICLES_DIR, f)).href);
    const a = mod.default;
    if (!a || !a.slug) throw new Error(`prerender: ${f} has no default export with slug`);
    if (a.status && a.status !== 'published') continue;
    articles.push(a);
  }
  articles.sort((x, y) => (y.publishedAt || '').localeCompare(x.publishedAt || ''));
  return articles;
}

// ------------------------------------------------------------- body → HTML
const P = 'margin:0 0 1.15em;line-height:1.7;color:#1a1a1a;';
function blockToHtml(b, slug) {
  switch (b.type) {
    case 'paragraph':
      return `<p style="${P}">${esc(b.text)}</p>`;
    case 'heading': {
      const lvl = Math.min(Math.max(b.level || 2, 2), 4);
      return `<h${lvl} style="margin:1.6em 0 .6em;line-height:1.25;font-weight:800;color:#000;">${esc(b.text)}</h${lvl}>`;
    }
    case 'list': {
      const tag = b.style === 'numbered' ? 'ol' : 'ul';
      const items = (b.items || []).map((i) => `<li style="margin:0 0 .55em;line-height:1.65;">${esc(i)}</li>`).join('');
      return `<${tag} style="margin:0 0 1.15em;padding-left:1.4em;color:#1a1a1a;">${items}</${tag}>`;
    }
    case 'framework':
      return (
        `<aside style="border:2px solid #000;padding:16px 18px;margin:0 0 1.3em;">` +
        `<p style="margin:0 0 .4em;font-family:monospace;font-size:.8em;letter-spacing:.12em;text-transform:uppercase;">▸ ${esc(b.code || 'FRAMEWORK')}</p>` +
        `<p style="margin:0 0 .5em;font-weight:800;">${esc(b.title || '')}</p>` +
        `<p style="margin:0;line-height:1.65;color:#1a1a1a;">${esc(b.explanation || b.text || '')}</p></aside>`
      );
    case 'callout':
      return `<aside style="border-left:4px solid #BFFF00;background:#fafafa;padding:14px 18px;margin:0 0 1.3em;line-height:1.65;color:#1a1a1a;">${esc(b.text)}</aside>`;
    case 'quote':
      return (
        `<blockquote style="border-left:4px solid #000;margin:0 0 1.3em;padding:6px 18px;font-style:italic;line-height:1.65;color:#1a1a1a;">` +
        `<p style="margin:0;">${esc(b.text)}</p>` +
        (b.attribution ? `<footer style="margin-top:.5em;font-style:normal;font-size:.9em;color:#555;">— ${esc(b.attribution)}</footer>` : '') +
        `</blockquote>`
      );
    case 'diagnostic': {
      // Interactive in the app (InlineDiagnostic) · statically: prompt + options,
      // so crawlers see the content and React upgrades it after mount.
      const opts = (b.options || [])
        .map((o) => `<li style="margin:0 0 .55em;line-height:1.6;">${esc(o.label)}</li>`)
        .join('');
      return (
        `<aside style="border:2px solid #000;padding:16px 18px;margin:0 0 1.3em;">` +
        `<p style="margin:0 0 .6em;font-weight:800;">${esc(b.prompt || '')}</p>` +
        `<ul style="margin:0;padding-left:1.4em;color:#1a1a1a;">${opts}</ul></aside>`
      );
    }
    case 'faq': {
      // Antwort-Block (AEO): Frage als h3, Antwort als erster Absatz darunter.
      // Spiegelt sich 1:1 im FAQPage-Schema (articleJsonLd) — Googles Regel.
      const items = (b.items || [])
        .map(
          ([q, a]) =>
            `<h3 style="margin:1.2em 0 .4em;line-height:1.3;font-weight:800;color:#000;">${esc(q)}</h3>` +
            `<p style="${P}">${esc(a)}</p>`
        )
        .join('');
      return `<section style="margin:1.6em 0 1.3em;border-top:2px solid #000;padding-top:.6em;"><h2 style="margin:.4em 0 .2em;line-height:1.25;font-weight:800;color:#000;">${esc(b.title || 'Häufige Fragen')}</h2>${items}</section>`;
    }
    case 'image':
      return b.src
        ? `<figure style="margin:0 0 1.3em;"><img src="${esc(b.src)}" alt="${esc(b.alt || '')}" loading="lazy" style="max-width:100%;height:auto;"/>` +
            (b.caption ? `<figcaption style="font-size:.85em;color:#555;margin-top:.4em;">${esc(b.caption)}</figcaption>` : '') +
            `</figure>`
        : '';
    default:
      throw new Error(`prerender: unknown body block type "${b.type}" in ${slug}`);
  }
}

function articleBodyHtml(a) {
  const date = a.publishedAt
    ? new Date(`${a.publishedAt}T00:00:00Z`).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    : '';
  const related = (a.related || [])
    .map((slug) => `<li style="margin:0 0 .5em;"><a href="/journal/${esc(slug)}" style="color:#000;">${esc(slug.replace(/-/g, ' '))}</a></li>`)
    .join('');
  return (
    `<div style="max-width:720px;margin:0 auto;padding:40px 20px;font-family:Inter,system-ui,sans-serif;background:#fff;">` +
    `<nav style="margin-bottom:28px;font-size:.85em;"><a href="/" style="color:#555;">LeaderOS</a> · <a href="/journal" style="color:#555;">Journal</a></nav>` +
    `<article>` +
    `<header style="margin-bottom:28px;">` +
    `<p style="font-family:monospace;font-size:.75em;letter-spacing:.14em;text-transform:uppercase;color:#557a00;margin:0 0 12px;">▸ LEADEROS JOURNAL · FELDNOTIZEN</p>` +
    `<h1 style="font-size:clamp(28px,5vw,44px);line-height:1.12;font-weight:900;font-style:italic;color:#000;margin:0 0 14px;">${esc(a.title)}</h1>` +
    `<p style="${P}color:#444;">${esc(a.description || '')}</p>` +
    `<p style="font-size:.85em;color:#666;margin:0;">Von ${esc(a.author || 'Wlad Jachtchenko')}${date ? ` · ${date}` : ''}</p>` +
    `</header>` +
    (a.body || []).map((b) => blockToHtml(b, a.slug)).join('\n') +
    `</article>` +
    (related ? `<section style="margin-top:40px;border-top:2px solid #000;padding-top:20px;"><p style="font-weight:800;margin:0 0 .7em;">Weiterlesen</p><ul style="padding-left:1.2em;margin:0;">${related}</ul></section>` : '') +
    `<footer style="margin-top:40px;border-top:1px solid #ddd;padding-top:18px;font-size:.85em;color:#555;">` +
    `<p style="margin:0 0 .5em;">Trainiere Führung täglich: <a href="https://leadercheck.de" style="color:#000;">kostenloser Leader-Check (10 Min)</a> · <a href="/webinar" style="color:#000;">kostenloses Webinar mit Wlad Jachtchenko</a></p>` +
    `</footer></div>`
  );
}

// -------------------------------------------------------------- JSON-LD
function articleJsonLd(a) {
  const url = `${BASE}/journal/${a.slug}`;
  const faqItems = (a.body || []).filter((b) => b.type === 'faq').flatMap((b) => b.items || []);
  const graph = [
    {
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      headline: a.title,
      description: a.seo?.description || a.description || '',
      inLanguage: 'de-DE',
      datePublished: a.publishedAt || undefined,
      dateModified: a.updatedAt || a.publishedAt || undefined,
      keywords: (a.seo?.keywords || a.tags || []).join(', '),
      // Gleiche @id wie der Person-Knoten in public/index.html und in
      // features/content/utils/seo.js — ein Autor, ein Entity-Knoten.
      author: { '@id': `${BASE}/#wlad` },
      publisher: { '@id': `${BASE}/#organization` },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', 'article p:first-of-type', 'article h2'] },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'LeaderOS', item: `${BASE}/` },
        { '@type': 'ListItem', position: 2, name: 'Journal', item: `${BASE}/journal` },
        { '@type': 'ListItem', position: 3, name: a.title, item: url },
      ],
    },
  ];
  if (faqItems.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: faqItems.map(([q, ans]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: ans },
      })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

// -------------------------------------------- template surgery per page
function replaceOnce(html, regex, replacement, what, slug) {
  if (!regex.test(html)) throw new Error(`prerender: template anchor missing (${what}) while rendering ${slug}`);
  return html.replace(regex, replacement);
}

function renderPage(template, { title, description, url, ogType, jsonLd, rootHtml }) {
  let html = template;
  const t = esc(title);
  const d = esc(description);
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${t}</title>`, 'title', url);
  html = replaceOnce(html, /(<meta name="description" content=")[^"]*(")/, `$1${d}$2`, 'meta description', url);
  html = replaceOnce(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, 'canonical', url);
  html = html.replace(/(<link rel="alternate" hreflang="[^"]*" href=")[^"]*(")/g, `$1${url}$2`);
  html = replaceOnce(html, /(<meta property="og:type" content=")[^"]*(")/, `$1${ogType}$2`, 'og:type', url);
  html = replaceOnce(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`, 'og:url', url);
  html = replaceOnce(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`, 'og:title', url);
  html = replaceOnce(html, /(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`, 'og:description', url);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${d}$2`);
  html = replaceOnce(
    html,
    /<\/head>/,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head>`,
    'head close',
    url
  );
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${rootHtml}</div>`, 'root div', url);
  return html;
}

// ------------------------------------------------------------------ main
const template = await readFile(join(BUILD_DIR, 'index.html'), 'utf8');
const articles = await loadArticles();

let written = 0;
for (const a of articles) {
  const url = `${BASE}/journal/${a.slug}`;
  const html = renderPage(template, {
    title: a.seo?.title || a.title,
    description: a.seo?.description || a.description || '',
    url,
    ogType: 'article',
    jsonLd: articleJsonLd(a),
    rootHtml: articleBodyHtml(a),
  });
  const dir = join(BUILD_DIR, 'journal', a.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html);
  written += 1;
}

// /journal hub · a fully crawlable index linking every article.
const hubLinks = articles
  .map(
    (a) =>
      `<li style="margin:0 0 .8em;line-height:1.5;"><a href="/journal/${esc(a.slug)}" style="color:#000;font-weight:600;">${esc(a.title)}</a>` +
      `<br><span style="font-size:.85em;color:#555;">${esc(a.description || '')}</span></li>`
  )
  .join('\n');
const hubHtml =
  `<div style="max-width:760px;margin:0 auto;padding:40px 20px;font-family:Inter,system-ui,sans-serif;background:#fff;">` +
  `<nav style="margin-bottom:28px;font-size:.85em;"><a href="/" style="color:#555;">LeaderOS</a></nav>` +
  `<h1 style="font-size:clamp(30px,5vw,48px);font-weight:900;font-style:italic;color:#000;margin:0 0 10px;">LeaderOS Journal · Feldnotizen<span style="color:#BFFF00;">.</span></h1>` +
  `<p style="${P}color:#444;">${articles.length} Artikel über Führung, KI und Kommunikation — von Wlad Jachtchenko (3× SPIEGEL-Bestseller-Autor, seit 2007 über 400.000 trainierte Klienten).</p>` +
  `<ol style="padding-left:1.2em;margin:24px 0 0;">${hubLinks}</ol></div>`;
const hubJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${BASE}/journal`,
  name: 'LeaderOS Journal · Feldnotizen für Führungskräfte',
  inLanguage: 'de-DE',
  isPartOf: { '@id': `${BASE}/#website` },
  about: 'Führung, KI und Kommunikation — Frameworks und Feldnotizen von Wlad Jachtchenko.',
};
const hubPage = renderPage(template, {
  title: 'LeaderOS Journal · Feldnotizen für Führungskräfte',
  description:
    `${articles.length} Artikel über Führung, KI und Kommunikation: Frameworks (SEXIER, B-W-W, 10 Stufen des Zuhörens), ` +
    'Praxis-Guides und Feldnotizen von Wlad Jachtchenko, 3× SPIEGEL-Bestseller-Autor.',
  url: `${BASE}/journal`,
  ogType: 'website',
  jsonLd: hubJsonLd,
  rootHtml: hubHtml,
});
await mkdir(join(BUILD_DIR, 'journal'), { recursive: true });
await writeFile(join(BUILD_DIR, 'journal', 'index.html'), hubPage);

console.log(`prerender: ${written} article pages + /journal hub written to build/journal/`);
