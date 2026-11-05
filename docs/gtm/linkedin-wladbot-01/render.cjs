// Rendert alle Folien der W-Serie (carousel.html) als JPG (1620×2025, 4:5 bei
// Maßstab 1,5) und je Karussell die Ersatz-CTA-Folie ohne Platzzahl (-open),
// dazu manifest.json mit den Dateinamen. Die PDFs (LinkedIn-Dokument) baut
// ../linkedin-carousels-01/build_pdf.py aus dem Manifest.
//
//   PYTHONPATH=<dir mit qrcode, scipy> /usr/bin/python3 build_assets.py   (erzeugt build/)
//   NODE_PATH=/opt/node22/lib/node_modules node render.cjs [outDir] [fontCssFile] [only=W02]
//   python3 -I ../linkedin-carousels-01/build_pdf.py [outDir]
//
// outDir ist standardmäßig dieser Ordner (Folien, PDFs und Manifest werden eingecheckt).
// Ohne Netz zu Google Fonts (Sandbox) kann eine lokale @font-face-CSS-Datei
// übergeben werden, die statt fonts.googleapis.com ausgeliefert wird.
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
    const slides = [];
    for (let s = 0; s < meta[c].n; s += 1) {
      slides.push(`${meta[c].id}-0${s + 1}.jpg`);
      await shoot(`?c=${c}&s=${s}`, slides[s]);
    }
    const openFile = `${meta[c].id}-0${meta[c].n}-open.jpg`;
    await shoot(`?c=${c}&s=${meta[c].n - 1}&seats=0`, openFile);
    manifest.push({ id: meta[c].id, slug: meta[c].slug, title: meta[c].title, slides, slide_open: openFile, pdf: `${meta[c].id}.pdf` });
    console.log('rendered', meta[c].id, slides.length, 'slides');
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
