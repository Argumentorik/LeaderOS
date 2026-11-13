// Rendert die zwei Einzelposts je als 4:5 (1620×2025) und als Story (1080×1920).
//   NODE_PATH=/opt/node22/lib/node_modules node render.cjs <fontCss mit Instrument Serif aufrecht>
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const css = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : null;
(async () => { const b = await chromium.launch();
  for (const [file, id] of [['post.html', 'R01'], ['nein.html', 'N01']]) for (const story of [false, true]) {
    const c = await b.newContext({ viewport: { width: 1080, height: story ? 1920 : 1350 }, deviceScaleFactor: story ? 1 : 1.5 });
    if (css) await c.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
    const p = await c.newPage(); await p.goto('file://' + path.join(__dirname, file) + (story ? '?f=story' : ''), { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.locator('#sheet').screenshot({ path: path.join(__dirname, id + (story ? '-story' : '') + '.jpg'), type: 'jpeg', quality: 90 }); await c.close(); console.log(id, story ? 'story' : '4x5');
  } await b.close(); })();
