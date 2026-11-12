// Rendert "Die Sammlung": je Blatt sechs Folien 1620×2025 und die LinkedIn-Schlussfolie.
//   NODE_PATH=/opt/node22/lib/node_modules node render.cjs [outDir] [fontCss]
//   /usr/bin/python3 -I ../linkedin-carousels-01/build_pdf.py [outDir]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const [, , outDir = __dirname, fontCss] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1.5 });
  if (fontCss) { const css = fs.readFileSync(fontCss, 'utf8'); await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: css })); }
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const base = 'file://' + path.join(__dirname, 'sammlung.html');
  await page.goto(base); const ids = await page.evaluate(() => window.IDS); const n = await page.evaluate(() => window.SLIDES_N);
  const shoot = async (href, f) => { await page.goto(href, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200); await page.locator('#sheet').screenshot({ path: path.join(outDir, f), type: 'jpeg', quality: 88 }); };
  const manifest = [];
  for (const id of ids) {
    const slides = [];
    for (let s = 0; s < n; s += 1) { const f = `${id}-0${s + 1}.jpg`; slides.push(f); await shoot(`${base}?c=${id}&s=${s}`, f); }
    await shoot(`${base}?c=${id}&s=${n - 1}&li=1`, `${id}-0${n}-li.jpg`);
    manifest.push({ id, slides: [...slides.slice(0, -1), `${id}-0${n}-li.jpg`], slide_ig: slides[n - 1], pdf: `${id}.pdf` });
    console.log('rendered', id);
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await browser.close(); if (errors.length) console.log('PAGE ERRORS', errors);
})();
