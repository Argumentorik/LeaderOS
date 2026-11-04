// Rendert die fünf Folien von F01 (carousel.html) als JPG (2160×2700, 4:5),
// dazu zwei Varianten der letzten Folie: -ig (Link in der Bio statt im
// Kommentar) und -open (ohne Platzzahl, Ersatz solange die Aufnahme nicht
// technisch bei SEATS stoppt), und ein manifest.json mit den Dateinamen.
//
//   PYTHONPATH=<dir mit qrcode> /usr/bin/python3 build_assets.py     (erzeugt build/)
//   NODE_PATH=/opt/node22/lib/node_modules node render.cjs [outDir] [fontCssFile]
//   python3 -I ../linkedin-carousels-01/build_pdf.py [outDir]        (LinkedIn-Dokument F01.pdf)
//
// outDir ist standardmäßig dieser Ordner (Folien, PDF und Manifest werden eingecheckt).
//
// Ohne Netz zu Google Fonts (Sandbox) kann eine lokale @font-face-CSS-Datei
// übergeben werden, die statt fonts.googleapis.com ausgeliefert wird.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const [, , outDir = __dirname, fontCss] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const pageUrl = 'file://' + path.join(__dirname, 'carousel.html');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  if (fontCss) {
    const css = fs.readFileSync(fontCss, 'utf8');
    await ctx.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: css }));
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(pageUrl);
  const ids = await page.evaluate(() => window.SLIDES.map((s) => s.id));
  const shoot = async (query, file) => {
    await page.goto(pageUrl + query, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.locator('#sheet').screenshot({ path: path.join(outDir, file), type: 'jpeg', quality: 90 });
  };
  const slides = [];
  for (let i = 0; i < ids.length; i += 1) {
    slides.push(`${ids[i]}.jpg`);
    await shoot(`?s=${i}`, slides[i]);
    console.log('rendered', slides[i]);
  }
  const last = ids.length - 1;
  const igFile = `${ids[last]}-ig.jpg`;
  await shoot(`?s=${last}&v=ig`, igFile);
  const openFile = `${ids[last]}-open.jpg`;
  await shoot(`?s=${last}&seats=0`, openFile);
  await browser.close();
  if (errors.length) console.log('PAGE ERRORS', errors);
  const manifest = [{
    id: 'F01', slug: 'fenster', title: 'Führung wird nicht gelernt. Sie wird trainiert.',
    slides, slides_instagram: [...slides.slice(0, -1), igFile], slide_open: openFile, pdf: 'F01.pdf',
  }];
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
})();
