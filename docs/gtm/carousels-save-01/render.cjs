// Rendert alle Folien der S-Serie (carousel.html) als JPG (1620×2025, 4:5 bei Maßstab 1,5),
// je Karussell die letzte Folie zusätzlich für Instagram (-ig: "Link in Bio" statt QR-Code)
// und manifest.json. Die PDFs (LinkedIn-Dokument) baut ../linkedin-carousels-01/build_pdf.py.
//
//   PYTHONPATH=<dir mit qrcode, scipy> /usr/bin/python3 ../social-kit/build_assets.py
//   NODE_PATH=/opt/node22/lib/node_modules node render.cjs [outDir] [fontCssFile] [only=S02]
//   python3 -I ../linkedin-carousels-01/build_pdf.py [outDir]
//
// Ohne Netz zu Google Fonts (Sandbox) eine lokale @font-face-CSS-Datei übergeben
// (Outfit 700, Instrument Serif kursiv); Inter und JetBrains Mono kommen dann aus den System-Schriften.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const [, , outDir = __dirname, fontCss, only] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const pageUrl = 'file://' + path.join(__dirname, 'carousel.html');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1.5 });
  if (fontCss) {
    const css = fs.readFileSync(fontCss, 'utf8');
    await ctx.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: css }));
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => { if (!r.url().includes('fonts.g')) errors.push('REQFAIL ' + r.url()); });
  await page.goto(pageUrl);
  const meta = await page.evaluate(() => window.CAROUSELS);
  const shoot = async (query, file) => {
    await page.goto(pageUrl + query, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.locator('#sheet').screenshot({ path: path.join(outDir, file), type: 'jpeg', quality: 88 });
  };
  const manifest = [];
  for (let c = 0; c < meta.length; c += 1) {
    if (only && only !== meta[c].id) continue;
    const id = meta[c].id;
    const n = meta[c].n;
    const pad = (i) => String(i + 1).padStart(2, '0');
    const slides = [];
    for (let s = 0; s < n; s += 1) {
      slides.push(`${id}-${pad(s)}.jpg`);
      await shoot(`?c=${c}&s=${s}`, slides[s]);
    }
    const slide_ig = `${id}-${pad(n - 1)}-ig.jpg`;
    await shoot(`?c=${c}&s=${n - 1}&ig=1`, slide_ig);
    manifest.push({ id, slug: meta[c].slug, title: meta[c].title, slides, slide_ig, pdf: `${id}.pdf` });
    console.log('rendered', id, slides.length, 'slides + IG-Schlussfolie');
  }
  await browser.close();
  if (errors.length) console.log('PAGE ERRORS', errors);
  const file = path.join(outDir, 'manifest.json');
  let merged = manifest;
  if (only && fs.existsSync(file)) {
    const previous = JSON.parse(fs.readFileSync(file, 'utf8'));
    merged = meta.map((m) => manifest.find((e) => e.id === m.id) || previous.find((e) => e.id === m.id)).filter(Boolean);
  }
  fs.writeFileSync(file, JSON.stringify(merged, null, 2) + '\n');
})();
