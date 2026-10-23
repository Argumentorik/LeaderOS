// Rendert die fünf LinkedIn-Poster aus poster.html als JPG (2160×2700, 4:5).
//
//   NODE_PATH=/opt/node22/lib/node_modules node render.cjs [outDir] [fontCssFile]
//
// Ohne Netz zu Google Fonts (Sandbox) kann eine lokale @font-face-CSS-Datei
// übergeben werden, die statt fonts.googleapis.com ausgeliefert wird.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const [, , outDir = path.join(__dirname, 'out'), fontCss] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const page_url = 'file://' + path.join(__dirname, 'poster.html');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  if (fontCss) {
    const css = fs.readFileSync(fontCss, 'utf8');
    await ctx.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: css }));
  }
  const page = await ctx.newPage();
  await page.goto(page_url + '?i=0');
  const n = await page.evaluate(() => window.POSTS.length);
  for (let i = 0; i < n; i += 1) {
    await page.goto(page_url + `?i=${i}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const id = await page.evaluate((k) => window.POSTS[k].id.replace('·', '-'), i);
    const file = path.join(outDir, `${id}.jpg`);
    await page.locator('#sheet').screenshot({ path: file, type: 'jpeg', quality: 90 });
    console.log('wrote', file);
  }
  await browser.close();
})();
