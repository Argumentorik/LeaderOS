import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WLADBOT_AVATAR, WLADBOT_AVATAR_FALLBACKS } from '../../lib/brandAssets';

/**
 * WladSignGuy · Mascot rechts unten der ein Schild hochhält und rotierend
 * Botschaften zeigt. Inspiriert vom "Sign Guy" auf Instagram, aber als
 * Pixel-Minecraft-Wlad mit Lime-Akzent.
 *
 * Verhalten:
 * - Idle: Wlad bobt sanft, hält ein Schild mit der aktuellen Botschaft.
 * - Alle 6s rotiert die Botschaft (50 FREE CREDITS → DIAGNOSE STARTEN → …)
 * - Klick auf Wlad oder Schild → onOpen() Callback (öffnet ChatPod-Modal).
 * - Auf Mobile fix unten rechts, schmaler. Auf Desktop größer mit Schatten.
 *
 * Komplett SVG · keine Bilder, kein Asset-Download, immer scharf.
 */

const MESSAGES = [
  { eyebrow: '▸ JETZT', big: '50 FREE', small: 'CREDITS' },
  { eyebrow: '▸ 10 MIN', big: 'DIAGNOSE', small: 'KOSTENLOS' },
  { eyebrow: '▸ FRAG', big: 'WLADBOT', small: '24 / 7' },
  { eyebrow: '▸ START', big: 'WERDE', small: 'TEIL' },
];

const PixelWlad = () => (
  // 16×24 Pixel-Wlad · Kopf, Sakko, kleine Lime-Punkte als Augen-Akzent.
  // Bewusst grob · Minecraft-DNA.
  <svg
    viewBox="0 0 16 24"
    aria-hidden
    style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
    className="w-full h-full"
  >
    {/* Hair */}
    <rect x="3" y="0" width="10" height="3" fill="#3A2418" />
    {/* Forehead skin */}
    <rect x="3" y="3" width="10" height="2" fill="#F2C8A4" />
    {/* Eyes block · lime accent dots */}
    <rect x="3" y="5" width="10" height="2" fill="#F2C8A4" />
    <rect x="5" y="5" width="2" height="2" fill="#0A0A0A" />
    <rect x="9" y="5" width="2" height="2" fill="#0A0A0A" />
    {/* Cheeks */}
    <rect x="3" y="7" width="10" height="2" fill="#F2C8A4" />
    {/* Beard / stubble row */}
    <rect x="3" y="9" width="10" height="1" fill="#6B4530" />
    {/* Neck */}
    <rect x="6" y="10" width="4" height="1" fill="#F2C8A4" />
    {/* Shirt collar · light blue */}
    <rect x="5" y="11" width="6" height="1" fill="#E8F1FF" />
    {/* Velvet green jacket (mimics the Wlad portrait) */}
    <rect x="2" y="12" width="12" height="9" fill="#0E3B1F" />
    {/* Lapels darker */}
    <rect x="5" y="12" width="1" height="6" fill="#072714" />
    <rect x="10" y="12" width="1" height="6" fill="#072714" />
    {/* Lime pocket-square accent */}
    <rect x="10" y="14" width="1" height="2" fill="#BFFF00" />
    {/* Arms */}
    <rect x="0" y="13" width="2" height="6" fill="#0E3B1F" />
    <rect x="14" y="13" width="2" height="6" fill="#0E3B1F" />
    {/* Hand holding sign (right) */}
    <rect x="14" y="13" width="2" height="2" fill="#F2C8A4" />
    {/* Belt/waist */}
    <rect x="2" y="21" width="12" height="1" fill="#072714" />
    {/* Legs (trousers) */}
    <rect x="3" y="22" width="4" height="2" fill="#1A1A1A" />
    <rect x="9" y="22" width="4" height="2" fill="#1A1A1A" />
  </svg>
);

// WladBot 3.0 · the Pixar-style render replaces the old pixel mascot.
// Falls back to the pixel figure if the asset is missing (build-safe).
const WladBotFigure = () => {
  const [failed, setFailed] = useState(false);
  if (failed) return <PixelWlad />;
  return (
    <img
      src={WLADBOT_AVATAR}
      alt="WladBot · dein KI-Coach"
      width={64}
      height={64}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        // Chain: CDN render → real portrait (webp, jpg) → pixel figure.
        const el = e.currentTarget;
        const i = Number(el.dataset.fb || 0);
        if (i < WLADBOT_AVATAR_FALLBACKS.length) {
          el.dataset.fb = String(i + 1);
          el.src = WLADBOT_AVATAR_FALLBACKS[i];
        } else {
          setFailed(true);
        }
      }}
      className="h-full w-full rounded-full bg-[#0A0A0A] object-cover object-[50%_16%] ring-2 ring-brand shadow-[0_10px_28px_-8px_rgba(0,0,0,0.5)]"
    />
  );
};

const SignBoard = ({ msg }) => (
  // Rotierender Holzbrett-Sign. Hochformat damit es neben dem Wlad steht.
  <div className="relative bg-white border-[3px] border-black px-3 py-2.5 text-center min-w-[110px] shadow-[4px_4px_0_0_#000]">
    {/* Sign-Stick going down-left into Wlad's hand */}
    <div
      aria-hidden
      className="absolute -left-2 top-1/2 w-2 h-12 bg-black"
      style={{ transform: 'translateY(-30%) rotate(-12deg)', transformOrigin: 'top left' }}
    />
    <div className="text-[8px] font-bold uppercase tracking-[0.22em] text-brand-strong font-mono leading-none">
      {msg.eyebrow}
    </div>
    <div
      className="mt-1 text-black leading-[0.95] tracking-[-0.02em]"
      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 18 }}
    >
      {msg.big}
    </div>
    <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/65 font-mono">
      {msg.small}
    </div>
  </div>
);

export const WladSignGuy = ({ onOpen }) => {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  // ConversionBand erscheint bei scrollY > 60vh und ist ~60px hoch. WladSignGuy
  // muss dann nach oben ausweichen damit er nicht auf der Band sitzt.
  const [bandActive, setBandActive] = useState(false);

  useEffect(() => {
    // Erscheint mit Delay damit der Above-Fold-Hero atmen kann.
    const showTimer = setTimeout(() => setVisible(true), 1400);
    const rotateTimer = setInterval(() => {
      setIdx((i) => (i + 1) % MESSAGES.length);
    }, 6000);

    const onScroll = () => {
      if (typeof window === 'undefined') return;
      const dismissed = sessionStorage.getItem('leader_os_band_dismissed') === '1';
      setBandActive(!dismissed && window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      clearTimeout(showTimer);
      clearInterval(rotateTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const msg = MESSAGES[idx];

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={onOpen}
          data-testid="wlad-sign-guy"
          aria-label={`${msg.big} ${msg.small} · Wlad fragen`}
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{
            // Mobile floats closer to the edge (8px) so the mascot sits low
            // and out of the content's way; desktop keeps its 16px. When the
            // conversion band is up, both hop above it.
            bottom: bandActive ? 80 : undefined,
            transition: 'bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className={`fixed right-4 md:right-6 z-30 inline-flex items-end gap-2 group cursor-pointer ${bandActive ? '' : 'bottom-2 md:bottom-4'}`}
        >
          {/* Wlad bobt sanft im Stand · kompakter als vorher (-25% Footprint) */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="h-14 w-14 md:h-16 md:w-16 shrink-0"
          >
            <WladBotFigure />
          </motion.div>

          {/* Sign mit smooth crossfade-rotate */}
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 4, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: -4 }}
            exit={{ opacity: 0, rotate: -10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-1.5 md:mb-2"
          >
            <SignBoard msg={msg} />
          </motion.div>

          {/* Hover-Tooltip */}
          <div className="hidden md:block absolute -top-7 right-0 bg-black text-white text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity font-mono whitespace-nowrap pointer-events-none">
            ▸ KLICK · CHAT
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
