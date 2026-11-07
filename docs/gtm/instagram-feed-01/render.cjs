// Rendert die neun Kacheln des Instagram-Feeds (feed.html) als JPG in 1080×1350
// (4:5, die Größe, die Instagram ausliefert) und schreibt manifest.json.
// Die Kacheln 01, 05 und 08 sind die Titelfolien der W-Karussells und kommen aus
// ../linkedin-wladbot-01 (siehe build_grid.py, das alle zwölf zum Raster legt).
//
//   PYTHONPATH=<dir mit qrcode, scipy> /usr/bin/python3 ../social-kit/build_assets.py
//   NODE_PATH=/opt/node22/lib/node_modules node render.cjs [outDir] [fontCssFile]
//
// Ohne Netz zu Google Fonts (Sandbox) eine lokale @font-face-CSS-Datei übergeben
// (Outfit 700, Instrument Serif kursiv); Inter und JetBrains Mono kommen dann
// aus den System-Schriften.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const [, , outDir = __dirname, fontCss] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const pageUrl = 'file://' + path.join(__dirname, 'feed.html');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  if (fontCss) {
    const css = fs.readFileSync(fontCss, 'utf8');
    await ctx.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: css }));
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => { if (!r.url().includes('fonts.g')) errors.push('REQFAIL ' + r.url()); });
  await page.goto(pageUrl);
  const tiles = await page.evaluate(() => window.TILES);
  const manifest = [];
  for (let i = 0; i < tiles.length; i += 1) {
    await page.goto(pageUrl + `?t=${i}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const file = `${tiles[i].id}.jpg`;
    await page.locator('#sheet').screenshot({ path: path.join(outDir, file), type: 'jpeg', quality: 90 });
    manifest.push({ ...tiles[i], file });
    console.log('rendered', file);
  }
  await browser.close();
  if (errors.length) console.log('PAGE ERRORS', errors);
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
})();
