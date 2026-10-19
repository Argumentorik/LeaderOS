#!/usr/bin/env node
/**
 * indexnow-submit.mjs
 *
 * Meldet alle öffentlichen URLs per IndexNow an Bing, Yandex, Seznam
 * und Naver (ein Endpoint, alle teilnehmenden Suchmaschinen bekommen
 * den Ping weitergereicht).
 *
 * WARUM: Bing crawlt neue Seiten von sich aus in Tagen bis Wochen.
 * IndexNow drückt sie in Minuten in den Index. Das zahlt doppelt ein,
 * weil ChatGPT-Search, Copilot und DuckDuckGo denselben Bing-Index
 * benutzen — schnelle Bing-Indexierung ist damit direkt AEO-Reichweite.
 * Google nimmt an IndexNow NICHT teil (dort zählt der Sitemap-Ping +
 * Search Console).
 *
 * Aufruf:
 *     node scripts/indexnow-submit.mjs            # alle URLs
 *     node scripts/indexnow-submit.mjs --dry-run  # nur anzeigen
 *     node scripts/indexnow-submit.mjs https://leader-os.de/journal/x
 *                                                 # gezielt einzelne URLs
 *
 * Die Key-Datei muss unter https://leader-os.de/<KEY>.txt erreichbar
 * sein und exakt den Key enthalten — liegt als public/<KEY>.txt im
 * Repo. Ohne erreichbare Key-Datei antwortet IndexNow mit 403.
 *
 * Läuft NICHT im Vercel-Build (der Build kennt die Live-URL noch nicht
 * und würde bei jedem Preview-Deploy pingen). Getriggert wird es vom
 * Workflow .github/workflows/indexnow.yml nach einem Push auf mvpcode.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const KEY = '57d353bdcebaa0a63677822fd59447f8';

// Der Host, an den gemeldet wird. IndexNow verlangt, dass keyLocation
// und alle gemeldeten URLs auf DEMSELBEN Host liegen — ein Redirect
// dazwischen ist ein 403/422-Risiko.
//
// Aktuell ist in Vercel `www` die Primary-Domain: der Apex antwortet mit
// 308 auf www. Unsere Sitemaps und Canonicals zeigen dagegen auf den
// Apex. Solange das so ist, muss an den Host gemeldet werden, der
// tatsächlich 200 liefert — sonst zeigt keyLocation ins Leere.
// Deshalb ist der Host überschreibbar (INDEXNOW_HOST): der Workflow
// ermittelt ihn, indem er dem Redirect der Key-Datei folgt. Nach dem
// Domain-Flip auf den Apex ergibt dieselbe Logik automatisch
// `leader-os.de` — an diesem Skript ist dann nichts zu ändern.
//
// Für die Discovery ist das unkritisch: IndexNow ist ein
// "diese URL hat sich geändert"-Signal, keine Canonical-Aussage. Bing
// crawlt die gemeldete URL und wertet das <link rel="canonical"> der
// Seite selbst aus.
const HOST = process.env.INDEXNOW_HOST || 'leader-os.de';
const SITEMAP_HOST = 'leader-os.de';   // so stehen die URLs in den XML-Dateien
const ENDPOINT = 'https://api.indexnow.org/IndexNow';
// IndexNow akzeptiert max. 10.000 URLs pro Request.
const BATCH_SIZE = 10000;

const SITEMAPS = ['sitemap.xml', 'sitemap-articles.xml'];

/** Zieht die <loc>-Werte aus einer Sitemap-Datei. */
async function urlsFromSitemap(file) {
  const xml = await readFile(join(PUBLIC_DIR, file), 'utf8');
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const explicit = args.filter((a) => a.startsWith('http'));

  let urls;
  if (explicit.length) {
    urls = explicit;
  } else {
    const lists = await Promise.all(SITEMAPS.map(urlsFromSitemap));
    urls = [...new Set(lists.flat())];
  }

  // Sitemap-URLs auf den Meldehost umschreiben (siehe HOST oben).
  if (HOST !== SITEMAP_HOST) {
    urls = urls.map((u) => u.replace(`https://${SITEMAP_HOST}`, `https://${HOST}`));
  }

  // Nur URLs des eigenen Hosts — IndexNow lehnt fremde Hosts ab (422).
  const foreign = urls.filter((u) => !u.startsWith(`https://${HOST}/`) && u !== `https://${HOST}`);
  if (foreign.length) {
    console.error(`✖ ${foreign.length} URL(s) gehören nicht zu ${HOST}:`);
    foreign.slice(0, 5).forEach((u) => console.error(`   ${u}`));
    process.exit(1);
  }

  console.log(`IndexNow · ${urls.length} URLs · host=${HOST}`);
  if (dryRun) {
    urls.slice(0, 10).forEach((u) => console.log(`   ${u}`));
    if (urls.length > 10) console.log(`   … +${urls.length - 10} weitere`);
    console.log('(--dry-run · nichts gesendet)');
    return;
  }

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `https://${HOST}/${KEY}.txt`,
        urlList: batch,
      }),
    });
    // 200 = angenommen, 202 = angenommen, Key wird noch verifiziert.
    if (res.status !== 200 && res.status !== 202) {
      const body = await res.text().catch(() => '');
      console.error(`✖ IndexNow ${res.status} ${res.statusText}\n${body.slice(0, 400)}`);
      console.error(
        '  403 = Key-Datei nicht erreichbar · 422 = Host/URL-Mismatch · 429 = zu viele Requests',
      );
      process.exit(1);
    }
    console.log(`✓ Batch ${i / BATCH_SIZE + 1}: ${batch.length} URLs → ${res.status}`);
  }
  console.log('IndexNow fertig.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
