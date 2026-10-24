// Rendert alle Karussell-Folien aus carousel.html + data.js als JPG (2160×2700)
// und schreibt pro Karussell eine PDF (LinkedIn-Dokument) sowie manifest.json.
//
//   NODE_PATH=/opt/node22/lib/node_modules node render.cjs [outDir] [fontCssFile] [only=C03]
//
// Ohne Netz zu Google Fonts (Sandbox) kann eine lokale @font-face-CSS-Datei
// übergeben werden, die statt fonts.googleapis.com ausgeliefert wird.
// Die PDF-Erzeugung passiert in build_pdf.py (Pillow), siehe unten.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const [, , outDir = path.join(__dirname, 'out'), fontCss, only] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const page_url = 'file://' + path.join(__dirname, 'carousel.html');

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
  await page.goto(page_url);
  const meta = await page.evaluate(() => window.CAROUSELS.map((c) => ({ id: c.id, slug: c.slug, title: c.title, n: c.slides.length })));
  const manifest = [];
  for (let c = 0; c < meta.length; c += 1) {
    if (only && only !== meta[c].id) continue;
    const files = [];
    for (let s = 0; s < meta[c].n; s += 1) {
      await page.goto(page_url + `?c=${c}&s=${s}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(250);
      const file = path.join(outDir, `${meta[c].id}-${String(s + 1).padStart(2, '0')}.jpg`);
      await page.locator('#sheet').screenshot({ path: file, type: 'jpeg', quality: 90 });
      files.push(path.basename(file));
    }
    // Instagram-Variante der letzten Folie (Link in der Bio statt im Kommentar)
    const last = meta[c].n - 1;
    await page.goto(page_url + `?c=${c}&s=${last}&v=ig`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const igFile = path.join(outDir, `${meta[c].id}-${String(last + 1).padStart(2, '0')}-ig.jpg`);
    await page.locator('#sheet').screenshot({ path: igFile, type: 'jpeg', quality: 90 });
    manifest.push({ ...meta[c], slides: files, slides_instagram: [...files.slice(0, -1), path.basename(igFile)], pdf: `${meta[c].id}.pdf` });
    console.log('rendered', meta[c].id, files.length, 'slides');
  }
  await browser.close();
  if (errors.length) console.log('PAGE ERRORS', errors);
  // Bei only=… bleibt das bestehende Manifest erhalten, nur der Eintrag wird ersetzt.
  const manifestFile = path.join(outDir, 'manifest.json');
  let merged = manifest;
  if (only && fs.existsSync(manifestFile)) {
    const previous = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    merged = meta.map((m) => manifest.find((e) => e.id === m.id) || previous.find((e) => e.id === m.id)).filter(Boolean);
  }
  fs.writeFileSync(manifestFile, JSON.stringify(merged, null, 2));
  execFileSync('python3', ['-I', path.join(__dirname, 'build_pdf.py'), outDir, ...(only ? [only] : [])], { stdio: 'inherit' });
})();
