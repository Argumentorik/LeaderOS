#!/usr/bin/env node
/**
 * check-canonical-host.mjs
 *
 * Prüft die vielleicht folgenreichste Annahme des ganzen SEO-Setups:
 * **liefert der Host, auf den unsere Canonicals zeigen, überhaupt 200?**
 *
 * Anlass (August 2026): Sitemaps und alle 153 Artikel-Canonicals zeigen
 * auf den Apex `leader-os.de`. In Vercel war aber `www` als Primary
 * gesetzt, der Apex antwortete mit 308. Google hat daraufhin
 *   · 80 Artikel gecrawlt und als "Seite mit Weiterleitung" abgelegt
 *   · 67 Artikel gar nicht erst gecrawlt ("Discovered – not indexed")
 * Überschneidung null, Vereinigung 147 von 153 Artikeln — **96 % des
 * Journals waren wegen einer einzigen Domain-Einstellung unsichtbar**,
 * monatelang, ohne dass irgendein Test angeschlagen hätte.
 *
 * Genau diese Lücke schließt dieses Skript: es folgt keinem Redirect,
 * sondern prüft, ob die kanonische URL direkt mit 200 antwortet. Weicht
 * der ausliefernde Host vom kanonischen ab, ist das ein Fehler — egal
 * in welche Richtung.
 *
 * Aufruf:
 *   node scripts/check-canonical-host.mjs
 *   node scripts/check-canonical-host.mjs --warn-only   (Exit 0 trotz Fund)
 *
 * Läuft NICHT in der PR-CI: das Problem liegt in der Domain-Konfiguration,
 * nicht im Diff — ein roter PR-Check würde nur Merges blockieren, die
 * nichts damit zu tun haben. Stattdessen täglich per
 * .github/workflows/canonical-host.yml.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const WARN_ONLY = process.argv.includes('--warn-only');

/** Erste <loc> der Sitemap = die kanonische Startseite. */
async function canonicalOrigin() {
  const xml = await readFile(join(PUBLIC_DIR, 'sitemap.xml'), 'utf8');
  const m = xml.match(/<loc>\s*([^<\s]+)\s*<\/loc>/);
  if (!m) throw new Error('Keine <loc> in sitemap.xml gefunden');
  return new URL(m[1]).origin;
}

/** Eine Stichprobe echter URLs: Startseite, eine statische Seite, ein Artikel. */
async function sampleUrls(origin) {
  const urls = [`${origin}/`, `${origin}/fragen`];
  try {
    const xml = await readFile(join(PUBLIC_DIR, 'sitemap-articles.xml'), 'utf8');
    const first = xml.match(/<loc>\s*([^<\s]+)\s*<\/loc>/);
    if (first) urls.push(first[1]);
  } catch { /* Artikel-Sitemap optional */ }
  return urls;
}

async function probe(url) {
  // redirect:'manual' ist der Kern: wir wollen den Redirect SEHEN, nicht folgen.
  const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'LeaderOS-canonical-check' } });
  return { status: res.status, location: res.headers.get('location') || null };
}

async function main() {
  const origin = await canonicalOrigin();
  const urls = await sampleUrls(origin);
  console.log(`Kanonischer Host laut sitemap.xml: ${origin}`);

  const problems = [];
  for (const url of urls) {
    let r;
    try {
      r = await probe(url);
    } catch (err) {
      problems.push(`${url} — nicht erreichbar (${err.message})`);
      continue;
    }
    if (r.status >= 300 && r.status < 400) {
      problems.push(
        `${url} → ${r.status} auf ${r.location}\n` +
        '     Die kanonische URL leitet weiter. Google crawlt solche URLs ' +
        'entweder gar nicht\n     ("Discovered – not indexed") oder legt sie ' +
        'als "Seite mit Weiterleitung" ab.',
      );
    } else if (r.status !== 200) {
      problems.push(`${url} → HTTP ${r.status} (erwartet 200)`);
    } else {
      console.log(`  ✓ ${url} → 200`);
    }
  }

  if (!problems.length) {
    console.log('\n✓ Kanonischer Host liefert direkt 200 — keine Weiterleitung im Weg.');
    return;
  }

  console.error('\n✖ Der kanonische Host stimmt nicht mit dem ausliefernden überein:\n');
  problems.forEach((p) => console.error(`   · ${p}`));
  console.error(
    '\nFix: in Vercel → Projekt `leaderos` → Settings → Domains den kanonischen\n' +
    'Host als "Primary" setzen (oder die Canonicals im Repo auf den ausliefernden\n' +
    'Host umziehen — dann aber überall: Sitemaps, JSON-LD, llms.txt, Mails).\n' +
    'Hintergrund: docs/gtm/SEO_AEO_PLAYBOOK.md §2.',
  );
  if (!WARN_ONLY) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
