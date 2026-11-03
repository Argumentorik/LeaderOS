import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { CLIENT_LOGOS, logoSrc } from '../../data/clientLogos';

/**
 * LogoWall · Referenz-Logos als fließende Wand statt Raster.
 *
 *  - Layout: zwei bis drei leicht gekippte Laufbänder, abwechselnd nach
 *    links/rechts und in unterschiedlichem Tempo; Ränder weich ausgeblendet.
 *    Hover auf ein Band hält es an, damit man ein Logo „greifen" kann.
 *  - Animation: Blur-Reveal beim ersten Sichtkontakt, ein einmaliger
 *    Lichtglanz läuft über alle Logos, danach schweben sie minimal (Loop).
 *  - Hover: Chrome. Das Logo ist eine CSS-Maske über einem Metall-Verlauf,
 *    darüber wandert eine Lichtkante — Reflexion nur innerhalb der Logoform.
 *  - Nur echte Logo-Dateien (src/data/clientLogos.js). `pending`-Marken
 *    erscheinen automatisch, sobald ihre SVG unter public/logos/clients/ liegt.
 *  - prefers-reduced-motion: stehende, zentrierte Reihe ohne Bewegung.
 *
 * tone="dark" für eigene dunkle Bänder, tone="light" innerhalb heller Seiten.
 */

const TONES = {
  dark: {
    bg: '#0A0A0A',
    idle: 'rgba(255,255,255,0.52)',
    text: '#FFFFFF',
    muted: 'rgba(255,255,255,0.55)',
    accent: '#BFFF00',
    chrome: 'linear-gradient(100deg,#7d838d 0%,#f4f6f9 14%,#a3a9b3 27%,#ffffff 39%,#737a85 51%,#e6eaef 64%,#959ba5 78%,#ffffff 90%,#7d838d 100%)',
    glint: 'rgba(255,255,255,0.95)',
    glow: 'drop-shadow(0 0 14px rgba(255,255,255,0.28))',
  },
  light: {
    bg: 'transparent',
    idle: 'rgba(10,10,10,0.42)',
    text: '#0A0A0A',
    muted: '#5F6166',
    accent: '#5A7700',
    chrome: 'linear-gradient(100deg,#15181c 0%,#8e949d 14%,#262a30 27%,#d3d8df 39%,#101316 51%,#9aa1ab 64%,#2a2e34 78%,#dfe3e9 90%,#15181c 100%)',
    glint: 'rgba(255,255,255,0.9)',
    glow: 'drop-shadow(0 6px 14px rgba(0,0,0,0.18))',
  },
};

const CSS = `
@keyframes lw-marquee { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
@keyframes lw-float { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-6px,0); } }
@keyframes lw-sheen { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }
@keyframes lw-glint { from { transform: translateX(-130%) skewX(-18deg); } to { transform: translateX(230%) skewX(-18deg); } }
.lw-row { -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); }
.lw-track { display: flex; width: max-content; animation: lw-marquee var(--lw-dur, 60s) linear infinite; animation-direction: var(--lw-dir, normal); will-change: transform; }
.lw-row:hover .lw-track, .lw-row:focus-within .lw-track { animation-play-state: paused; }
.lw-item { display: inline-flex; align-items: center; gap: 12px; padding: 18px clamp(22px, 3.2vw, 46px); animation: lw-float var(--lw-float, 7s) ease-in-out infinite; animation-delay: var(--lw-delay, 0s); cursor: default; outline: none; }
.lw-ink { position: relative; display: block; overflow: hidden; background: var(--lw-idle); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-size: contain; mask-size: contain; -webkit-mask-position: center; mask-position: center; transition: transform .5s cubic-bezier(.2,.8,.2,1), filter .5s; }
.lw-ink::after { content: ''; position: absolute; top: -20%; bottom: -20%; left: 0; width: 45%; background: linear-gradient(90deg, transparent, var(--lw-glint), transparent); transform: translateX(-130%) skewX(-18deg); opacity: 0; }
.lw-label { font-family: Inter, system-ui, sans-serif; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; color: var(--lw-idle); transition: color .4s; }
.lw-intro .lw-ink::after { opacity: 1; animation: lw-glint 1.3s cubic-bezier(.3,.6,.3,1) both; animation-delay: var(--lw-glint-delay, 0s); }
.lw-item:hover .lw-ink, .lw-item:focus-visible .lw-ink { background: var(--lw-chrome); background-size: 260% 100%; animation: lw-sheen 1.8s linear infinite alternate; transform: scale(1.08); filter: var(--lw-glow); }
.lw-item:hover .lw-ink::after, .lw-item:focus-visible .lw-ink::after { opacity: 1; animation: lw-glint 1.1s ease-in-out infinite; }
.lw-item:hover .lw-label, .lw-item:focus-visible .lw-label { color: transparent; background: var(--lw-chrome); background-size: 260% 100%; -webkit-background-clip: text; background-clip: text; animation: lw-sheen 1.8s linear infinite alternate; }
@media (prefers-reduced-motion: reduce) {
  .lw-track { animation: none; width: 100%; flex-wrap: wrap; justify-content: center; }
  .lw-dup { display: none; }
  .lw-item { animation: none; }
  .lw-intro .lw-ink::after, .lw-item:hover .lw-ink::after { animation: none; opacity: 0; }
  .lw-rows { transform: none !important; }
}
`;

let cssInjected = false;
function useLogoWallCss() {
  useEffect(() => {
    if (cssInjected || typeof document === 'undefined') return;
    const el = document.createElement('style');
    el.setAttribute('data-logo-wall', '');
    el.textContent = CSS;
    document.head.appendChild(el);
    cssInjected = true;
  }, []);
}

/** Lädt `pending`-Logos nach, sobald ihre SVG existiert (SPA-Fallback liefert
 *  sonst index.html mit 200 — deshalb Content-Type + viewBox prüfen). */
function usePendingLogos(list) {
  const [found, setFound] = useState([]);
  useEffect(() => {
    let alive = true;
    const pending = list.filter((l) => l.pending);
    Promise.all(pending.map((l) =>
      fetch(logoSrc(l.key))
        .then((r) => (r.ok && /svg/.test(r.headers.get('content-type') || '') ? r.text() : null))
        .then((txt) => {
          const vb = txt && txt.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/);
          return vb ? { ...l, pending: false, ratio: Number(vb[1]) / Number(vb[2]), h: l.h || 30 } : null;
        })
        .catch(() => null),
    )).then((res) => { if (alive) setFound(res.filter(Boolean)); });
    return () => { alive = false; };
  }, [list]);
  return found;
}

function Logo({ logo, index, rowIndex, focusable = true }) {
  const src = `url(${logoSrc(logo.key)})`;
  const h = logo.h || 30;
  const style = {
    '--lw-float': `${6 + ((index * 7 + rowIndex * 3) % 5)}s`,
    '--lw-delay': `-${((index * 1.7 + rowIndex) % 6).toFixed(1)}s`,
    '--lw-glint-delay': `${0.25 + index * 0.09 + rowIndex * 0.2}s`,
  };
  return (
    <div className="lw-item" style={style} tabIndex={focusable ? 0 : -1} role="img" aria-label={logo.name}>
      <span
        className="lw-ink"
        style={{
          width: Math.round(h * (logo.ratio || 1)), height: h,
          WebkitMaskImage: src, maskImage: src,
        }}
      />
      {logo.label && <span className="lw-label" style={{ fontSize: Math.round(h * 0.62) }}>{logo.label}</span>}
    </div>
  );
}

export function LogoWall({
  tone = 'dark',
  eyebrow = 'Referenzen · Inhouse-Trainings & Keynotes',
  title = 'Führungskräfte dieser Unternehmen haben Wlads Trainings durchlaufen.',
  compact = false,
  logos = CLIENT_LOGOS,
  className = '',
}) {
  useLogoWallCss();
  const t = TONES[tone] || TONES.dark;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [intro, setIntro] = useState(false);
  const extra = usePendingLogos(logos);

  const visible = useMemo(() => [...logos.filter((l) => !l.pending), ...extra], [logos, extra]);
  const rows = useMemo(() => {
    const n = visible.length >= 18 ? 3 : 2;
    const out = Array.from({ length: n }, () => []);
    visible.forEach((l, i) => out[i % n].push(l));
    return out;
  }, [visible]);

  useEffect(() => {
    if (!inView) return undefined;
    setIntro(true);
    const t0 = setTimeout(() => setIntro(false), 3200);
    return () => clearTimeout(t0);
  }, [inView]);

  const vars = { '--lw-idle': t.idle, '--lw-chrome': t.chrome, '--lw-glint': t.glint, '--lw-glow': t.glow };

  return (
    <section
      ref={ref}
      aria-label="Referenzen"
      className={`relative overflow-hidden ${className}`}
      style={{ background: t.bg, ...vars }}
    >
      {tone === 'dark' && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 0%, rgba(191,255,0,0.08), transparent 55%), radial-gradient(ellipse at 10% 100%, rgba(255,255,255,0.05), transparent 50%)' }} />
      )}

      <div className="relative mx-auto" style={{ maxWidth: 1280, padding: compact ? '36px 20px 8px' : 'clamp(64px, 8vw, 104px) 20px 12px' }}>
        <motion.p
          initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className={`text-[11px] ${compact ? 'text-center' : ''}`}
          style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: compact ? t.muted : t.accent }}
        >
          ▸ {eyebrow}
        </motion.p>
        {!compact && title && (
          <motion.h2
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }} animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.8, delay: 0.08 }}
            className="mt-4 text-[28px] sm:text-[36px] lg:text-[46px] max-w-[860px]"
            style={{ fontFamily: 'Geist, Inter, system-ui, sans-serif', fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.08, color: t.text }}
          >
            {title}
          </motion.h2>
        )}
      </div>

      <div
        className="lw-rows relative"
        style={{ transform: 'rotate(-1.6deg) scale(1.04)', margin: compact ? '8px 0 20px' : 'clamp(28px, 4vw, 48px) 0 clamp(56px, 7vw, 96px)' }}
      >
        {rows.map((row, r) => (
          <motion.div
            key={r}
            className={`lw-row ${intro ? 'lw-intro' : ''}`}
            initial={{ opacity: 0, x: r % 2 ? 80 : -80, filter: 'blur(10px)' }}
            animate={inView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 1.1, delay: 0.15 + r * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="lw-track" style={{ '--lw-dur': `${Math.max(36, row.length * (r % 2 ? 9 : 7.5))}s`, '--lw-dir': r % 2 ? 'reverse' : 'normal' }}>
              {[0, 1].map((copy) => (
                <div key={copy} className={`flex items-center ${copy ? 'lw-dup' : ''}`} aria-hidden={copy ? 'true' : undefined}>
                  {/* Jede Hälfte breiter als jeder Viewport, sonst klafft beim Loop eine Lücke. */}
                  {Array.from({ length: Math.max(1, Math.ceil(12 / Math.max(1, row.length))) }).flatMap((_, rep) =>
                    row.map((l, i) => (
                      <Logo key={`${l.key}-${copy}-${rep}`} logo={l} index={i + rep * row.length} rowIndex={r} focusable={copy === 0 && rep === 0} />
                    )))}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default LogoWall;
