/* Social-Kit · gemeinsame Bausteine (Markup-Helfer zu kit.css).
   Wird von linkedin-wladbot-01/carousel.html und instagram-feed-01/feed.html
   geladen. Pfade sind relativ zu einem Ordner unter docs/gtm/. */
const K = (() => {
  const B = '../social-kit/build/';
  const STAGE = { src: B + 'stage.jpg', w: 1342, h: 1076 };          // Quellmaße des Fotos
  const AVATAR = '../../../frontend/public/wladbot-avatar-clean.png';
  const TILE = `<svg class="bt" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="fb" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#D4FF4D"/><stop offset="55%" stop-color="#BFFF00"/><stop offset="100%" stop-color="#A8E600"/></linearGradient></defs><rect width="32" height="32" rx="9.6" fill="url(#fb)"/><g transform="translate(4.2 4.2) scale(0.7375)" fill="none" stroke="#0A0A0A" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 4.8 L8.6 24.4 Q10 25.8 11.4 24.2 L15.4 9.8 Q16.4 8.8 17.4 9.8 L20.8 24.2 Q22.2 25.8 23.6 24.4 L28.8 4" stroke-width="3"/><path d="M28.8 4 Q30.2 4.6 29.6 6.4" stroke-width="2.6"/><circle cx="29.6" cy="6.4" r="1.2" fill="#0A0A0A" stroke="none"/></g></svg>`;
  const ARROW = '<svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
  const ARROW_UR = '<svg viewBox="0 0 24 24"><path d="M7 17L17 7M8 7h9v9"/></svg>';
  const ARROW_UP = '<svg viewBox="0 0 24 24"><path d="M12 20V5M6 11l6-6 6 6"/></svg>';
  const av = (extra = '') => `<span class="av" style="${extra}"><img src="${AVATAR}" alt=""></span>`;

  return {
    B, TILE, ARROW, ARROW_UR, ARROW_UP, av,
    /* Fotoausschnitt: das Quellfenster (sx, sy, Breite sw in Foto-Pixeln) füllt die Box (l, t, w, h). */
    photo(sx, sy, sw, l, t, w, h, extra = '') {
      const k = w / sw;
      return `<div class="ph" style="left:${l}px;top:${t}px;width:${w}px;height:${h}px;${extra}"><img src="${STAGE.src}" style="width:${STAGE.w * k}px;height:${STAGE.h * k}px;left:${-sx * k}px;top:${-sy * k}px" alt=""></div>`;
    },
    amb: (name, pos = 'tl', extra = '') => `<div class="amb ${pos}" style="background-image:url(${B}${name}.jpg);${extra}"></div>`,
    dim: (a, b) => `<div class="lay" style="background:linear-gradient(to bottom,rgba(6,8,12,${a}),rgba(6,8,12,${b}))"></div>`,
    vig: '<div class="vig"></div>',
    grain: '<div class="grain"></div>',
    chrome: (label) => `<div style="left:72px;top:64px">${TILE}</div><div class="tag" style="left:144px;top:82px">${label}</div>`,
    mascot: (style) => `<img src="${B}mascot.png" style="${style}" alt="">`,
    /* Mitteilung des WladBot (helles Glas, .d = dunkles Glas) */
    note: (style, html, o = {}) => `<div class="g${o.d ? ' d' : ''} note" style="${style}">${av()}<div class="nb"><div class="nt"><span>WladBot</span><i>${o.time || 'jetzt'}</i></div><p>${html}</p></div></div>`,
    /* Runder Glasknopf mit Pfeil und kleiner Beschriftung darunter */
    rb: (l, t, label) => `<div class="g d rb" style="left:${l}px;top:${t}px">${ARROW}</div>${label ? `<div class="tag" style="left:${l - 30}px;top:${t + 148}px;width:188px;text-align:center">${label}</div>` : ''}`,
    /* Markierungen: Punkt (x, y) auf dem Bild, Linie zum Chip bei (cx, cy); side = Seite des Chips zum Anker */
    anchors(list) {
      const tr = { l: 'translate(-100%,-50%)', r: 'translate(0,-50%)', t: 'translate(-50%,-100%)', b: 'translate(-50%,0)' };
      const svg = list.map((a) => `<line x1="${a.x}" y1="${a.y}" x2="${a.cx}" y2="${a.cy}" stroke="rgba(255,255,255,.9)" stroke-width="1.8"/>
        <circle cx="${a.x}" cy="${a.y}" r="42" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1.5"/>
        <circle cx="${a.x}" cy="${a.y}" r="23" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.8"/>
        <circle cx="${a.x}" cy="${a.y}" r="8.5" fill="#fff"/>`).join('');
      const chips = list.map((a) => `<div class="g chip${a.d ? ' d' : ''}" style="left:${a.cx}px;top:${a.cy}px;transform:${tr[a.side || 'r']}">${a.av ? av() : ''}${a.label}</div>`).join('');
      return `<svg class="lay" viewBox="0 0 1080 1350">${svg}</svg>${chips}`;
    },
  };
})();
