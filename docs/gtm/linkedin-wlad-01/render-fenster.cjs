// Rendert LI·07 (poster-fenster.html) als JPG (2160×2700, 4:5).
//
//   /usr/bin/python3 build_fenster_assets.py          (erzeugt build/li07-photo.png)
//   NODE_PATH=/opt/node22/lib/node_modules node render-fenster.cjs [outFile] [fontCssFile]
//
// Ohne Netz zu Google Fonts (Sandbox) kann eine lokale @font-face-CSS-Datei
// übergeben werden, die statt fonts.googleapis.com ausgeliefert wird.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const [, , outFile = path.join(__dirname, 'LI-07.jpg'), fontCss] = process.argv;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  if (fontCss) {
    const css = fs.readFileSync(fontCss, 'utf8');
    await ctx.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: css }));
  }
  const page = await ctx.newPage();
  await page.goto('file://' + path.join(__dirname, 'poster-fenster.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await page.locator('#sheet').screenshot({ path: outFile, type: 'jpeg', quality: 90 });
  console.log('wrote', outFile);
  await browser.close();
})();
