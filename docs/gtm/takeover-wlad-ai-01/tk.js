/* Takeover-Bausteine zu ../social-kit/kit.js: Wortmarke, Statuszeile, Foto mit
   Gesichtsanker, Icons. Wird von post.html und stories.html geladen. */
const TK = (() => {
  const B = '../social-kit/build/';
  const FACE = { x: 770, y: 232 };                 // Gesichtsmitte im Foto (Quellpixel, 1342×1076)
  const SRC = { warm: 'stage.jpg', ice: 'stage-ice.jpg', smoke: 'stage-smoke.jpg' };
  const IC = {
    chat: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    up: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 20V5M6 11l6-6 6 6"/></svg>',
    next: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
    link: '<svg class="ic" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    check: '<svg class="ic" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    mark: '<svg class="ic" viewBox="0 0 24 24"><path d="M6.5 4h11v16.5l-5.5-3.8-5.5 3.8z"/></svg>',
  };
  /* Wortmarke WLAD AI; cls "k" = dunkle Fassung für helle Flächen */
  const wm = (size, cls = '', extra = '') => `<span class="wm2 ${cls}" style="font-size:${size}px;${extra}">WLAD<i>AI</i></span>`;
  const stat = (label, style = '') => `<div class="g d stat" style="${style}"><span class="dot"></span>${label}</div>`;
  /* Foto: Gesichtsmitte landet auf (fx, fy), Maßstab k. o.fade blendet die Oberkante weich ein. */
  const photo = (grade, k, fx, fy, o = {}) => {
    const top = fy - FACE.y * k;
    const a = Math.max(top, 0);
    const mask = o.fade ? `-webkit-mask-image:linear-gradient(to bottom,transparent ${a}px,#000 ${a + o.fade}px);mask-image:linear-gradient(to bottom,transparent ${a}px,#000 ${a + o.fade}px);` : '';
    return `<div class="lay ph" style="${mask}${o.css || ''}"><img src="${B}${SRC[grade]}" style="left:${fx - FACE.x * k}px;top:${top}px;width:${1342 * k}px;height:${1076 * k}px" alt=""></div>`;
  };
  /* Weitere Fotos (Quellmaße in Pixeln; die Dateien in build/ sind doppelt so groß). Das Quellfenster
     (sx, sy, Breite sw) füllt die Box (l, t, w, h). Nur als Karte oder Ausschnitt einsetzen. */
  const PICS = { coaching: [800, 800], arena: [800, 800], seminar: [800, 500], talk: [463, 567] };
  const pic = (name, sx, sy, sw, l, t, w, h, extra = '') => {
    const [W, H] = PICS[name];
    const k = w / sw;
    return `<div class="ph" style="left:${l}px;top:${t}px;width:${w}px;height:${h}px;${extra}"><img src="${B}${name}.jpg" style="width:${W * k}px;height:${H * k}px;left:${-sx * k}px;top:${-sy * k}px" alt=""></div>`;
  };
  /* Freigestelltes Porträt (grünes Samtsakko, dieselbe Kleidung wie die Figur) */
  const portrait = (style) => `<img src="${B}portrait.png" style="${style}" alt="">`;
  /* Echtes Buchcover aus frontend/public/wlad/books */
  const book = (slug, style = '') => `<img class="bk" src="../../../frontend/public/wlad/books/${slug}.jpg" style="${style}" alt="">`;
  /* [Platzhalter] hervorheben */
  const hl = (t) => t.replace(/\[([^\]]*)\]/g, '<em>[$1]</em>');
  return { B, IC, wm, stat, photo, pic, portrait, book, hl };
})();
if (typeof module !== 'undefined') module.exports = TK;
