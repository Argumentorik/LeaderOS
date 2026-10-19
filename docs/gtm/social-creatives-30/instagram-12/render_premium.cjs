const { chromium } = require('playwright');
const fs = require('fs');
const dir = '/tmp/claude-0/-home-user-SHIPOS/fa058643-c9d7-5647-8429-9989b7c5f937/scratchpad/creatives';
const sets = (process.argv[2] || 'ig,a,b,story').split(',');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const out = dir + '/out-premium'; fs.mkdirSync(out, { recursive: true });
  const problems = []; let total = 0;
  for (const set of sets) {
    const p = await b.newPage({ viewport: { width: 1080, height: set === 'story' ? 1920 : 1350 } });
    await p.goto('file://' + dir + '/premium.html?set=' + set); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
    const n = await p.locator('.slide').count(); if (set==='ig') fs.writeFileSync(out+'/copy-all.json', JSON.stringify(await p.evaluate(()=>window.__ALL), null, 1));
    for (let i = 0; i < n; i++) {
      const el = p.locator('.slide').nth(i);
      const m = await el.evaluate((s) => {
        const mid = s.querySelector('.mid').getBoundingClientRect(); const bot = s.querySelector('.bot').getBoundingClientRect(); const top = s.querySelector('.top').getBoundingClientRect();
        const h = s.querySelector('h1'); const av = s.querySelector('.avatar'); let overlap = 0;
        if (av) { const a = av.getBoundingClientRect(); [...s.querySelectorAll('.mid h1, .mid p, .mid .card, .mid .list div')].forEach((e) => { const r = e.getBoundingClientRect(); const ox = Math.min(r.right, a.right - 120) - Math.max(r.left, a.left + 150); const oy = Math.min(r.bottom, a.bottom) - Math.max(r.top, a.top + 80); if (ox > 0 && oy > 0) overlap = Math.max(overlap, Math.round(ox)); }); }
        return { gap: Math.round(bot.top - mid.bottom), topgap: Math.round(mid.top - top.bottom), wide: h.scrollWidth > h.clientWidth + 2, overlap, c: s.dataset.c, i: s.dataset.i };
      });
      if (m.gap < 16 || m.topgap < 40 || m.wide || m.overlap > 0) problems.push({ set, ...m });
      const name = set === 'ig' ? `${m.c}-${String(m.i).padStart(2, '0')}` : `${m.c}`;
      await el.screenshot({ path: `${out}/${name}.png` }); total++;
    }
    await p.close();
  }
  console.log('rendered', total, 'problems', JSON.stringify(problems));
  await b.close();
})();
