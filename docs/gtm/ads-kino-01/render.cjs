// Rendert die Anzeigenserie "Kino" (ads.html): vier Motive in drei Formaten
// (4:5 1080×1350, 9:16 1080×1920, 1:1 1080×1080) als JPG, dazu manifest.json.
// Dateiname: AD-<ID>-<Format>-a.jpg (a = erste Variante, Namensschema wie in
// ../META_ADS_WEBINAR.md). Maßstab 1: 1080 px Breite ist die Größe, die Meta ausliefert.
//
//   PYTHONPATH=<dir mit qrcode, scipy> /usr/bin/python3 ../social-kit/build_assets.py
//   NODE_PATH=/opt/node22/lib/node_modules node render.cjs [outDir] [fontCssFile]
//   /usr/bin/python3 -I build_overview.py
//
// Ohne Netz zu Google Fonts (Sandbox) eine lokale @font-face-CSS-Datei übergeben
// (Outfit 700); Inter und JetBrains Mono kommen dann aus den System-Schriften.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const [, , outDir = __dirname, fontCss] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const pageUrl = 'file://' + path.join(__dirname, 'ads.html');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  if (fontCss) {
    const css = fs.readFileSync(fontCss, 'utf8');
    await ctx.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: css }));
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => { if (!r.url().includes('fonts.g')) errors.push('REQFAIL ' + r.url()); });
  await page.goto(pageUrl);
  const ads = await page.evaluate(() => window.ADS);
  const manifest = [];
  for (const ad of ads) {
    const files = {};
    for (const f of ad.formats) {
      await page.goto(`${pageUrl}?a=${ad.id}&f=${f}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(250);
      const file = `AD-${ad.id}-${f}-a.jpg`;
      await page.locator('#ad').screenshot({ path: path.join(outDir, file), type: 'jpeg', quality: 90 });
      files[f] = file;
    }
    manifest.push({ id: `AD-${ad.id}`, slug: ad.slug, title: ad.title, dest: ad.dest, files });
    console.log('rendered', ad.id, Object.keys(files).join(' '));
  }
  await browser.close();
  if (errors.length) console.log('PAGE ERRORS', errors);
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
})();
