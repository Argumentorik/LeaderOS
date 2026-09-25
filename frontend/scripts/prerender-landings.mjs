#!/usr/bin/env node
/**
 * prerender-landings.mjs · Build-time static HTML for indexable React landings.
 *
 * Same mechanism and reasoning as prerender-articles.mjs: CRA ships an empty
 * <div id="root"> and the homepage's <title>/canonical on every route.
 * Answer engines (GPTBot, ClaudeBot, PerplexityBot, Applebot) run no
 * JavaScript, so without this the page does not exist for them.
 *
 *   build/ki-fuehrungskraft/index.html  ← full content + meta + JSON-LD
 *
 * Vercel serves the file before the SPA rewrite; React then mounts on #root
 * and replaces the static content with the interactive page.
 *
 * Content comes from src/data/kiFuehrungskraft.js — the same module the
 * React page renders — so the FAQPage schema stays word-for-word identical
 * to the visible answers (Google's rule for structured data). A missing
 * template anchor fails the build on purpose.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = join(__dirname, '..', 'build');
const DATA = join(__dirname, '..', 'src', 'data');
const BASE = 'https://leader-os.de';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function replaceOnce(html, regex, replacement, what, page) {
  if (!regex.test(html)) throw new Error(`prerender-landings: template anchor missing (${what}) while rendering ${page}`);
  return html.replace(regex, replacement);
}

function renderPage(template, { title, description, url, image, jsonLd, rootHtml }) {
  let html = template;
  const t = esc(title);
  const d = esc(description);
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${t}</title>`, 'title', url);
  html = replaceOnce(html, /(<meta name="description" content=")[^"]*(")/, `$1${d}$2`, 'meta description', url);
  html = replaceOnce(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, 'canonical', url);
  html = html.replace(/(<link rel="alternate" hreflang="[^"]*" href=")[^"]*(")/g, `$1${url}$2`);
  html = replaceOnce(html, /(<meta property="og:type" content=")[^"]*(")/, '$1website$2', 'og:type', url);
  html = replaceOnce(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`, 'og:url', url);
  html = replaceOnce(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`, 'og:title', url);
  html = replaceOnce(html, /(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`, 'og:description', url);
  html = replaceOnce(html, /(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`, 'og:image', url);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${d}$2`);
  html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${image}$2`);
  html = replaceOnce(html, /<\/head>/, `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head>`, 'head close', url);
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${rootHtml}</div>`, 'root div', url);
  return html;
}

// ------------------------------------------------------ /ki-fuehrungskraft
const kf = await import(pathToFileURL(join(DATA, 'kiFuehrungskraft.js')).href);
const ev = await import(pathToFileURL(join(DATA, 'webinarEvent.js')).href);
const c = kf.CAMPAIGNS[kf.DEFAULT_CAMPAIGN];

const INK = '#0A0A0A';
const LIME = '#BFFF00';
const OLIVE = '#5A7700';
const wrap = 'max-width:1080px;margin:0 auto;padding:0 20px;';
const h2 = `font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-weight:400;font-size:clamp(34px,6vw,64px);line-height:.95;margin:0 0 18px;color:${INK};`;
const h3 = 'font-family:Geist,Inter,system-ui,sans-serif;font-weight:500;font-size:20px;margin:0 0 6px;color:#0A0A0A;';
const p = 'font-family:Inter,system-ui,sans-serif;font-size:16px;line-height:1.65;color:#2A2B2E;margin:0 0 12px;';
const bib = `font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${OLIVE};font-weight:700;margin:0 0 12px;`;
const section = (id, inner, style = '') => `<section${id ? ` id="${id}"` : ''} style="padding:72px 0;${style}"><div style="${wrap}">${inner}</div></section>`;
const list = (items) => `<ul style="${p}padding-left:1.2em;">${items.map((i) => `<li style="margin:0 0 6px;">${esc(i)}</li>`).join('')}</ul>`;

const rootHtml = [
  `<div style="background:#F4F4F1;color:${INK};">`,
  `<header style="background:${INK};color:#fff;padding:120px 0 90px;text-align:center;"><div style="${wrap}">`,
  `<p style="font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${LIME};margin:0 0 20px;">▸ ${esc(kf.OFFER.label)} · ${esc(kf.OFFER.date)} · ${esc(kf.OFFER.time)}</p>`,
  `<h1 style="font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-weight:400;font-size:clamp(44px,9vw,108px);line-height:.92;margin:0;">${esc(c.h1)} <span style="display:block;color:${LIME};">${esc(c.h1Accent)}</span></h1>`,
  `<p style="font-family:Inter,system-ui,sans-serif;font-size:19px;line-height:1.5;color:rgba(255,255,255,.78);max-width:640px;margin:24px auto 0;">${esc(c.sub)}</p>`,
  `<p style="margin:32px 0 0;"><a href="#anmelden" style="display:inline-block;background:${LIME};color:${INK};font-family:Inter,system-ui,sans-serif;font-weight:700;padding:17px 30px;border-radius:999px;text-decoration:none;">${esc(kf.OFFER.cta)} →</a></p>`,
  `<p style="font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.6);margin:18px 0 0;">${esc(kf.OFFER.facts.join(' · '))}</p>`,
  `</div></header>`,
  `<main>`,
  section('', `<p style="${bib}">▸ Die Arbeitswelt dreht sich</p><h2 style="${h2}">Fleiß allein schützt deinen Job nicht mehr.</h2>` +
    kf.SHIFTS.map(([t, d]) => `<h3 style="${h3}">${esc(t)}</h3><p style="${p}">${esc(d)}</p>`).join('')),
  section('warum', `<p style="${bib}">▸ KI und Führung</p><h2 style="${h2}">${esc(kf.SPLIT.question)}</h2><p style="${p}">${esc(kf.SPLIT.answer)}</p>` +
    `<h3 style="${h3}">KI übernimmt</h3>${list(kf.SPLIT.ki)}<h3 style="${h3}">Du bleibst unersetzlich bei</h3>${list(kf.SPLIT.du)}`),
  section('system', `<p style="${bib}">▸ Was du mitnimmst</p><h2 style="${h2}">Sechs Hebel. Ein System.</h2>` +
    kf.OUTCOMES.map((o, i) => `<h3 style="${h3}">K·0${i + 1} · ${esc(o.title)}</h3><p style="${p}">${esc(o.desc)} <b>${esc(o.tool)}</b> · ${esc(o.fw)}</p>`).join('')),
  section('', `<p style="${bib}">▸ Für wen</p><h2 style="${h2}">Zwei Ausgangspunkte. Ein Ziel: unersetzlich werden.</h2>` +
    kf.AUDIENCES.map((a) => `<h3 style="${h3}">${esc(a.title)}</h3><p style="${p}">${esc(a.lead)}</p>${list(a.points)}`).join('')),
  section('agenda', `<p style="${bib}">▸ Das Live-Webinar · ${esc(kf.OFFER.date)} · ${esc(kf.OFFER.time)}</p><h2 style="${h2}">90 Minuten. Live.</h2><ol style="${p}padding-left:1.2em;">` +
    ev.AGENDA.map(([t, title, d]) => `<li style="margin:0 0 10px;"><b>${esc(t)} · ${esc(title)}</b> – ${esc(d)}</li>`).join('') + '</ol>'),
  section('', `<p style="${bib}">▸ Dein Gastgeber</p><h2 style="${h2}">${esc(kf.HOST.name)}</h2><p style="${p}"><b>${esc(kf.HOST.role)}.</b> ${esc(kf.HOST.bio)}</p>` +
    `<p style="${p}">${kf.STATS.map(([v, l]) => `${esc(v)} ${esc(l)}`).join(' · ')}</p>` +
    `<p style="${p}">Führungskräfte von ${esc(kf.HOST.clients.join(', '))} und vielen weiteren haben Wlads Trainings durchlaufen.</p>`),
  section('', `<p style="${bib}">▸ Stimmen aus Wlads Trainings</p><h2 style="${h2}">4,9 von 5 auf Trustpilot.</h2>` +
    kf.REVIEWS.map(([q, n, ctx, d]) => `<blockquote style="${p}margin:0 0 14px;">„${esc(q)}" – ${esc(n)}, ${esc(ctx)}, ${esc(d)} auf Trustpilot</blockquote>`).join('') +
    `<p style="${p}"><a href="${esc(kf.TRUSTPILOT_URL)}" rel="noopener">Alle 388 Bewertungen auf Trustpilot</a></p>`),
  section('fragen', `<p style="${bib}">▸ Häufige Fragen</p><h2 style="${h2}">Kurz beantwortet.</h2>` +
    kf.FAQ.map(([q, a]) => `<h3 style="${h3}margin-top:22px;">${esc(q)}</h3><p style="${p}">${esc(a)}</p>`).join('')),
  section('anmelden', `<p style="${bib}color:${LIME};">▸ ${esc(kf.OFFER.label)} · ${esc(kf.OFFER.date)}</p><h2 style="${h2}color:#fff;">Werde die Führungskraft, die keine KI ersetzt.</h2>` +
    `<p style="${p}color:rgba(255,255,255,.75);">${esc(kf.OFFER.time)} · online · kostenlos. Die Anmeldung öffnet sich, sobald die Seite geladen ist – oder direkt auf <a href="/webinar" style="color:${LIME};">leader-os.de/webinar</a>.</p>`, `background:${INK};`),
  section('', `<p style="${bib}">▸ Weiterlesen im Journal</p><h2 style="${h2}">Führen mit KI – die Grundlagen</h2><ul style="${p}padding-left:1.2em;">` +
    kf.READING.map(([href, t]) => `<li style="margin:0 0 8px;"><a href="${esc(href)}" style="color:${INK};">${esc(t)}</a></li>`).join('') + '</ul>'),
  `</main>`,
  `<footer style="${wrap}padding-top:24px;padding-bottom:40px;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#5F6166;">`,
  `<a href="/" style="color:#5F6166;">LeaderOS</a> · <a href="/webinar" style="color:#5F6166;">Webinar</a> · <a href="/fragen" style="color:#5F6166;">Fragen &amp; Antworten</a> · <a href="/journal" style="color:#5F6166;">Journal</a> · <a href="/impressum" style="color:#5F6166;">Impressum</a> · <a href="/datenschutz" style="color:#5F6166;">Datenschutz</a>`,
  `</footer></div>`,
].join('');

const url = kf.PAGE_URL;
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: kf.SEO.title,
      description: kf.SEO.description,
      inLanguage: 'de-DE',
      isPartOf: { '@id': `${BASE}/#website` },
      publisher: { '@id': `${BASE}/#organization` },
      author: { '@id': `${BASE}/#wlad` },
      primaryImageOfPage: { '@type': 'ImageObject', url: kf.OG_IMAGE, width: 1200, height: 630 },
      breadcrumb: { '@id': `${url}#breadcrumb` },
      about: [
        { '@type': 'Thing', name: 'KI-Führungskraft' },
        { '@type': 'Thing', name: 'Führen mit KI' },
        { '@type': 'Thing', name: 'KI für Führungskräfte' },
      ],
      mainEntity: { '@id': `${url}#event` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'LeaderOS', item: `${BASE}/` },
        { '@type': 'ListItem', position: 2, name: 'KI-Führungskraft', item: url },
      ],
    },
    {
      '@type': 'Event',
      '@id': `${url}#event`,
      name: 'Führe besser. Jeden Tag. · Das kostenlose LeaderOS Live-Webinar',
      description: 'Kostenloses Live-Webinar mit Wlad Jachtchenko: Charisma-Code live, das Leadership Operating System mit KI-Coach, ein echter Führungsfall und Q&A.',
      startDate: ev.WEBINAR_START,
      endDate: ev.WEBINAR_END,
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'VirtualLocation', url: `${BASE}/webinar` },
      image: [kf.OG_IMAGE],
      inLanguage: 'de-DE',
      isAccessibleForFree: true,
      organizer: { '@id': `${BASE}/#organization` },
      performer: { '@id': `${BASE}/#wlad` },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url, validFrom: '2026-07-04T00:00:00+02:00' },
    },
    {
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: kf.FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ],
};

const template = await readFile(join(BUILD_DIR, 'index.html'), 'utf8');
const html = renderPage(template, {
  title: kf.SEO.title,
  description: kf.SEO.description,
  url,
  image: kf.OG_IMAGE,
  jsonLd,
  rootHtml,
});
const dir = join(BUILD_DIR, kf.PATH.replace(/^\//, ''));
await mkdir(dir, { recursive: true });
await writeFile(join(dir, 'index.html'), html);
console.log(`prerender-landings: ${kf.PATH} written to build${kf.PATH}/index.html`);
