// Rendert das Takeover "WLAD AI übernimmt":
//   post.html     Karussell T01, acht Folien, 1620×2025 (4:5 bei Maßstab 1,5)  -> T01-01.jpg …
//   stories.html  Stories je Tag, 1080×1920 (9:16)                             -> stories/D01-1.jpg …
//                 dazu die Vorschau mit eingezeichneten Sticker-Zonen          -> _guide/D01-1.jpg …
// und schreibt manifest.json (für das LinkedIn-PDF) und stories.json (Dateien je Tag).
//
//   PYTHONPATH=<dir mit qrcode, scipy> /usr/bin/python3 ../social-kit/build_assets.py
//   NODE_PATH=/opt/node22/lib/node_modules node render.cjs [outDir] [fontCssFile] [was]
//   /usr/bin/python3 -I ../linkedin-carousels-01/build_pdf.py [outDir]
//
// was = all (Standard) | post | stories | d03 (nur die Stories von Tag 3).
// Ohne Netz zu Google Fonts (Sandbox) eine lokale @font-face-CSS-Datei übergeben
// (Outfit 700, Instrument Serif kursiv); Inter und JetBrains Mono kommen dann aus den System-Schriften.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const [, , outDir = __dirname, fontCss, what = 'all'] = process.argv;
fs.mkdirSync(path.join(outDir, 'stories'), { recursive: true });
fs.mkdirSync(path.join(outDir, '_guide'), { recursive: true });
const url = (f) => 'file://' + path.join(__dirname, f);
const pad = (n) => String(n).padStart(2, '0');

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const open = async (viewport, deviceScaleFactor) => {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor });
    if (fontCss) {
      const css = fs.readFileSync(fontCss, 'utf8');
      await ctx.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: css }));
    }
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('requestfailed', (r) => { if (!r.url().includes('fonts.g')) errors.push('REQFAIL ' + r.url()); });
    return page;
  };
  const shoot = async (page, href, file, quality = 88) => {
    await page.goto(href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.locator('#sheet').screenshot({ path: file, type: 'jpeg', quality });
  };

  if (what === 'all' || what === 'post') {
    const page = await open({ width: 1080, height: 1350 }, 1.5);
    await page.goto(url('post.html'));
    const n = await page.evaluate(() => window.SLIDES_N);
    const slides = [];
    for (let s = 0; s < n; s += 1) {
      slides.push(`T01-${pad(s + 1)}.jpg`);
      await shoot(page, url('post.html') + `?s=${s}`, path.join(outDir, slides[s]));
    }
    fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify([{ id: 'T01', slug: 'wlad-ai-uebernimmt', title: 'WLAD AI übernimmt', slides, pdf: 'T01.pdf' }], null, 2) + '\n');
    console.log('rendered T01', slides.length, 'Folien');
    await page.context().close();
  }

  if (what !== 'post') {
    const page = await open({ width: 1080, height: 1920 }, 1);
    await page.goto(url('stories.html'));
    const meta = await page.evaluate(() => window.META);
    const only = /^d\d+$/i.test(what) ? Number(what.slice(1)) : 0;
    const file = path.join(outDir, 'stories.json');
    const previous = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
    const out = [];
    for (const d of meta) {
      if (only && only !== d.n) { const p = previous.find((e) => e.day === d.n); if (p) out.push(p); continue; }
      const files = [];
      for (let s = 1; s <= d.stories.length; s += 1) {
        const name = `D${pad(d.n)}-${s}.jpg`;
        files.push({ file: `stories/${name}`, type: d.stories[s - 1].type, sticker: d.stories[s - 1].sticker });
        await shoot(page, url('stories.html') + `?d=${d.n}&s=${s}`, path.join(outDir, 'stories', name), 86);
        await shoot(page, url('stories.html') + `?d=${d.n}&s=${s}&guide=1`, path.join(outDir, '_guide', name), 80);
      }
      out.push({ day: d.n, date: d.date, theme: d.theme, post: d.post, stories: files });
      console.log('rendered Tag', d.n, files.length, 'Stories');
    }
    fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
    await page.context().close();
  }
  await browser.close();
  if (errors.length) console.log('PAGE ERRORS', errors);
})();
