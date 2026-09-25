import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Play, Check, X, Star, ArrowRight, ArrowUpRight } from 'lucide-react';
import { applyPageMeta } from '../lib/pageMeta';
import { WladMark } from '../components/brand/WladMark';
import { BookShelf } from '../components/brand/BookShelf';
import { trackMeta, metaEventId } from '../lib/metaPixel';
import { trackLinkedInLead } from '../lib/linkedinInsight';
import { WEBINAR_TS, WEBINAR_CAMPAIGN } from '../data/webinarEvent';
import {
  PAGE_URL, OG_IMAGE, SEO, OFFER, CAMPAIGNS, campaignFor, SHIFTS, SPLIT, OUTCOMES,
  AUDIENCES, AGENDA, HOST, STATS, REVIEWS, TRUSTPILOT_URL, FAQ, READING,
} from '../data/kiFuehrungskraft';

/**
 * KiFuehrungskraftPage · /ki-fuehrungskraft · Kampagnen-Landing + SEO-Pillar.
 *
 * Eine Seite, sechs Kampagnen: die Anzeige verlinkt ?k=<key>, Hero und
 * hervorgehobene Hebel-Karte folgen dem Schlüssel, der Lead trägt ihn als
 * source + answers.kampagne. Angebot überall dasselbe: das kostenlose
 * Live-Webinar am 29.10. (Agenda aus src/data/webinarEvent.js — dieselbe
 * wie auf /webinar). Kampagnen-Matrix: docs/gtm/KI_FUEHRUNG_KAMPAGNEN.md.
 *
 * Mechanik aus /kommunikation (Pillen-Nav mit Scroll-Morph, Video-Hero mit
 * gebogenem Blur-Fade, Glas-UI), Look aus frontend/DESIGN.md (Schwarz/Weiß,
 * Versal-Display, Lime-Akzent, Mono-BIB-Codes).
 *
 * Anders als /kommunikation ist diese Seite indexierbar: sie ist die
 * Pillar-Seite für „KI-Führungskraft" / „Führen mit KI". Crawler ohne
 * JavaScript lesen die Build-Fassung aus scripts/prerender-landings.mjs,
 * gespeist aus derselben Datendatei.
 */

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260728_015819_1b3ec855-d586-4018-96c8-8bf90cada037.mp4';
const INTRO_VIMEO_ID = '1197728183';

const INK = '#0A0A0A';
const PAPER = '#F4F4F1';
const LIME = '#BFFF00';
const OLIVE = '#5A7700';
const MUTED = '#5F6166';
const HAIR = 'rgba(10,10,10,0.1)';
const PILL_SHADOW = '0 8px 24px rgba(5,8,12,0.10)';

const DISPLAY = { fontFamily: 'Anton, Impact, "Arial Narrow", sans-serif', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '-0.005em' };
const HEAD = { fontFamily: 'Geist, Inter, system-ui, sans-serif', fontWeight: 500, letterSpacing: '-0.02em' };
const BODY = { fontFamily: 'Inter, system-ui, sans-serif' };
const MONO = { fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', letterSpacing: '0.14em', textTransform: 'uppercase' };

const spring = (delay = 0) => ({ type: 'spring', duration: 0.7, bounce: 0, delay });
const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };
const press = { whileHover: { scale: 0.97 }, whileTap: { scale: 0.94 }, transition: { type: 'spring', duration: 0.4, bounce: 0.25 } };
const ease = [0.25, 0.46, 0.45, 0.94];

const track = (event, props = {}) => {
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try { window.posthog.capture(event, { surface: 'leader-os', funnel: 'ki-fuehrung-lp', ...props }); } catch {}
  }
};

function useReveal(margin = '-80px') {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin });
  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.7, ease, delay },
  });
  return [ref, reveal, inView];
}

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
    over: diff === 0,
  };
}

const Dot = ({ color = LIME }) => <span style={{ color }}>.</span>;

const Bib = ({ children, dark = false, className = '' }) => (
  <span className={`inline-block text-[11px] ${className}`} style={{ ...MONO, color: dark ? LIME : OLIVE, fontWeight: 700 }}>
    ▸ {children}
  </span>
);

const goToForm = (where) => {
  track('ki_cta_click', { where });
  document.getElementById('anmelden')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ─── Navbar ───────────────────────────────────────────────────────────

const NAV = [
  ['Warum jetzt', '#warum'],
  ['Das System', '#system'],
  ['Agenda', '#agenda'],
  ['Fragen', '#fragen'],
];

function Brand({ small = false, light = false }) {
  return (
    <a href="/" className="flex items-center" style={{ gap: 10 }} aria-label="LeaderOS Startseite">
      <WladMark size={small ? 24 : 28} variant="solid" />
      <span style={{ ...BODY, fontWeight: 700, fontSize: small ? 16 : 18, color: light ? '#fff' : INK }}>
        Leader<span style={{ color: light ? LIME : OLIVE }}>·</span>OS
      </span>
    </a>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 60);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <>
      <div className="hidden lg:block fixed top-0 inset-x-0 z-30" style={{ padding: '26px 0' }}>
        <motion.div
          className="mx-auto flex items-center"
          style={{ maxWidth: 1280, padding: '0 32px' }}
          animate={{ gap: scrolled ? 12 : 0, justifyContent: scrolled ? 'center' : 'space-between' }}
          transition={{ duration: 0.45, ease: [0.44, 0, 0.56, 1] }}
        >
          <div className="bg-white flex items-center" style={{ borderRadius: 999, padding: '14px 22px', boxShadow: PILL_SHADOW }}>
            <Brand />
          </div>
          <nav className="bg-white flex items-center" style={{ borderRadius: 999, padding: '0 30px', height: 58, gap: 30, boxShadow: PILL_SHADOW }}>
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="hover:opacity-60 transition-opacity" style={{ ...BODY, fontSize: 14, fontWeight: 500, color: INK }}>{label}</a>
            ))}
          </nav>
          <motion.button
            type="button" {...press} onClick={() => goToForm('nav')}
            className="flex items-center"
            style={{ ...BODY, fontWeight: 600, height: 58, padding: '0 26px', gap: 10, borderRadius: 999, fontSize: 14, background: INK, color: '#fff', boxShadow: PILL_SHADOW }}
          >
            <span className="relative flex" style={{ width: 8, height: 8 }}>
              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: LIME, opacity: 0.7 }} />
              <span className="relative rounded-full" style={{ width: 8, height: 8, background: LIME }} />
            </span>
            Platz sichern · kostenlos
          </motion.button>
        </motion.div>
      </div>

      <div className="lg:hidden fixed top-0 inset-x-0 z-30 flex justify-center" style={{ padding: '14px 16px 0' }}>
        <div className="bg-white flex items-center justify-between w-full max-w-[760px]" style={{ borderRadius: 999, padding: '8px 8px 8px 18px', boxShadow: PILL_SHADOW }}>
          <Brand small />
          <motion.button
            type="button" {...press} onClick={() => goToForm('nav-mobile')}
            style={{ ...BODY, fontWeight: 600, fontSize: 13, height: 40, padding: '0 16px', borderRadius: 999, background: INK, color: '#fff' }}
          >
            Platz sichern
          </motion.button>
        </div>
      </div>
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────

const FROSTED = {
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

function Countdown({ dark = true, compact = false }) {
  const { d, h, m, s, over } = useCountdown(WEBINAR_TS);
  if (over) return null;
  const cells = [[d, 'Tage'], [h, 'Std'], [m, 'Min'], [s, 'Sek']];
  return (
    <div className="flex items-center" style={{ gap: compact ? 6 : 8 }} aria-label="Zeit bis zum Webinar">
      {cells.map(([v, l]) => (
        <div
          key={l}
          className="flex flex-col items-center justify-center"
          style={{
            minWidth: compact ? 52 : 64, padding: compact ? '8px 6px' : '10px 8px', borderRadius: 14,
            ...(dark ? FROSTED : { background: '#fff', border: `1px solid ${HAIR}` }),
          }}
        >
          <span style={{ ...HEAD, fontSize: compact ? 20 : 26, lineHeight: 1, color: dark ? '#fff' : INK, fontVariantNumeric: 'tabular-nums' }}>
            {String(v).padStart(2, '0')}
          </span>
          <span className="mt-1 text-[9px]" style={{ ...MONO, color: dark ? 'rgba(255,255,255,0.55)' : MUTED }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

const PREP_STEPS = ['Kontext', 'Argumente', 'Gegenseite', 'Coaching'];

function CoachCard() {
  return (
    <motion.div
      {...fadeUp} transition={spring(0.65)}
      className="w-full max-w-[560px] text-left text-white"
      style={{
        borderRadius: 28, padding: 'clamp(18px, 3vw, 26px)',
        background: 'rgba(12,14,16,0.62)', border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 0 0 8px rgba(255,255,255,0.04), 0 60px 120px rgba(0,0,0,0.5)',
      }}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center" style={{ gap: 12 }}>
          <WladMark size={40} variant="solid" />
          <div>
            <div className="text-[10px]" style={{ ...MONO, color: 'rgba(255,255,255,0.5)' }}>SEXIER-Prep · Wlad Coaching</div>
            <div style={{ ...HEAD, fontSize: 17 }}>Gespräch vorbereiten</div>
          </div>
        </div>
        <span className="hidden sm:inline text-[10px]" style={{ ...MONO, color: LIME }}>● KI-Coach</span>
      </div>

      <div className="mt-5 flex items-center" style={{ gap: 6 }}>
        {PREP_STEPS.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.12 }}
            className="flex-1 text-center text-[11px] sm:text-[12px]"
            style={{
              ...BODY, fontWeight: 600, padding: '8px 4px', borderRadius: 999,
              background: i < 2 ? LIME : i === 2 ? 'rgba(191,255,0,0.14)' : 'rgba(255,255,255,0.06)',
              color: i < 2 ? INK : i === 2 ? LIME : 'rgba(255,255,255,0.45)',
              border: i === 2 ? '1px solid rgba(191,255,0,0.5)' : '1px solid transparent',
            }}
          >
            {i < 2 ? '✓ ' : ''}{step}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2" style={{ gap: 8 }}>
        {[['Ziel', 'Zustimmung zum Bonus-Budget für Q4'], ['Gegenüber', 'CFO · mag Zahlen, kurzer Ton']].map(([k, v]) => (
          <div key={k} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '10px 12px' }}>
            <div className="text-[9px]" style={{ ...MONO, color: 'rgba(255,255,255,0.45)' }}>{k}</div>
            <div className="mt-1 text-[13px]" style={{ ...BODY }}>{v}</div>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
        className="mt-3 flex items-start"
        style={{ gap: 10, background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.25)', borderRadius: 16, padding: '12px 14px' }}
      >
        <img src="/wlad/wladbot3.0.webp" alt="" className="shrink-0 rounded-full object-cover" style={{ width: 30, height: 30 }} />
        <p className="text-[13px] leading-[1.5]" style={{ ...BODY, color: 'rgba(255,255,255,0.88)' }}>
          <b style={{ color: LIME }}>Gegenseite:</b> Dein CFO wird nach dem ROI fragen. Starte mit dem Impact – was kostet es, wenn das Team-Programm weiter blockiert ist?
        </p>
      </motion.div>
    </motion.div>
  );
}

function Hero({ k, onPlay }) {
  const c = CAMPAIGNS[k];
  return (
    <section id="top" className="relative w-full overflow-hidden" style={{ background: INK }}>
      <video className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.55 }} src={HERO_VIDEO} autoPlay muted loop playsInline aria-hidden="true" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(10,10,10,0.2), rgba(10,10,10,0.85) 70%)' }} />

      <div className="absolute z-[2] -left-[60px] -right-[60px] md:-left-[120px] md:-right-[120px] lg:-left-[220px] lg:-right-[220px] pointer-events-none" style={{ bottom: -10 }}>
        <svg viewBox="0 0 5688 1886" className="w-full block" preserveAspectRatio="none" style={{ height: 'clamp(140px, 20vw, 380px)' }}>
          <defs><filter id="kf-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="125" /></filter></defs>
          <path d="M2733.25 1264.78C706.858 1264.78 -50.5828 573.265 -177 202.5V2088.5H5865V202.5C5664.75 539.923 4759.65 1264.78 2733.25 1264.78Z" fill={PAPER} filter="url(#kf-blur)" />
        </svg>
      </div>

      <div className="relative z-[1] mx-auto flex flex-col items-center text-center" style={{ maxWidth: 1100, padding: 'clamp(120px, 14vw, 180px) 20px clamp(90px, 10vw, 140px)', gap: 'clamp(48px, 6vw, 72px)' }}>
        <div className="flex flex-col items-center" style={{ gap: 26 }}>
          <motion.div {...fadeUp} transition={spring(0.05)} className="flex flex-wrap items-center justify-center rounded-full" style={{ ...FROSTED, padding: '6px 16px 6px 6px', gap: 10 }}>
            <span className="rounded-full flex items-center" style={{ ...BODY, fontWeight: 700, fontSize: 12, background: LIME, color: INK, padding: '4px 10px', gap: 6 }}>
              <span className="rounded-full animate-pulse" style={{ width: 6, height: 6, background: INK }} /> LIVE
            </span>
            <span className="text-white text-[13px] sm:text-[14px]" style={{ ...BODY, fontWeight: 500 }}>
              {OFFER.label} · {OFFER.date} · 10:00 Uhr
            </span>
          </motion.div>

          <motion.div {...fadeUp} transition={spring(0.12)}>
            <Bib dark>{c.bib} · {c.eyebrow}</Bib>
          </motion.div>

          <motion.h1
            {...fadeUp} transition={spring(0.2)}
            className="text-white text-[38px] sm:text-[64px] md:text-[84px] lg:text-[108px]"
            style={{ ...DISPLAY, lineHeight: 0.92, textWrap: 'balance', maxWidth: 1060 }}
          >
            {c.h1}{' '}
            <span className="block" style={{ color: LIME }}>{c.h1Accent}</span>
          </motion.h1>

          <motion.p {...fadeUp} transition={spring(0.3)} className="text-[17px] md:text-[20px]" style={{ ...BODY, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5, maxWidth: 640 }}>
            {c.sub}
          </motion.p>

          <motion.div {...fadeUp} transition={spring(0.4)} className="flex flex-wrap items-center justify-center" style={{ gap: 14 }}>
            <motion.button
              type="button" {...press} onClick={() => goToForm('hero')}
              className="flex items-center rounded-full"
              style={{ ...BODY, fontWeight: 700, fontSize: 16, background: LIME, color: INK, padding: '17px 30px', gap: 10, boxShadow: '0 10px 40px rgba(191,255,0,0.25)' }}
            >
              {OFFER.cta} <ArrowRight size={18} strokeWidth={2.5} />
            </motion.button>
            <motion.button
              type="button" {...press} onClick={onPlay}
              className="flex items-center rounded-full text-white"
              style={{ ...FROSTED, ...BODY, fontWeight: 600, fontSize: 15, height: 56, padding: '0 24px', gap: 10 }}
            >
              <Play size={15} fill="#fff" /> Wlad in 30 Sekunden
            </motion.button>
          </motion.div>

          <motion.div {...fadeUp} transition={spring(0.48)} className="flex flex-col items-center" style={{ gap: 14 }}>
            <p className="text-[11px]" style={{ ...MONO, color: 'rgba(255,255,255,0.6)' }}>{OFFER.facts.join(' · ')}</p>
            <Countdown compact />
          </motion.div>
        </div>

        <CoachCard />
      </div>
    </section>
  );
}

// ─── Warum jetzt ──────────────────────────────────────────────────────

function WhyNow() {
  const [ref, reveal] = useReveal();
  return (
    <section ref={ref} className="pt-[90px] lg:pt-[140px]">
      <div className="mx-auto" style={{ maxWidth: 1280, padding: '0 20px' }}>
        <motion.div {...reveal(0)}><Bib>Die Arbeitswelt dreht sich</Bib></motion.div>
        <motion.h2 {...reveal(0.05)} className="mt-4 text-[40px] sm:text-[60px] lg:text-[92px]" style={{ ...DISPLAY, color: INK, lineHeight: 0.92, maxWidth: 1100 }}>
          Fleiß allein schützt deinen Job nicht mehr<Dot color={OLIVE} />
        </motion.h2>
        <div className="mt-12 lg:mt-16 grid grid-cols-1 md:grid-cols-3" style={{ borderTop: `1px solid ${INK}` }}>
          {SHIFTS.map(([title, desc], i) => (
            <motion.div
              key={title} {...reveal(0.1 + i * 0.08)}
              className={`pt-6 pb-8 md:pr-8 ${i > 0 ? 'md:pl-8 md:border-l' : ''} ${i > 0 ? 'border-t md:border-t-0' : ''}`}
              style={{ borderColor: HAIR }}
            >
              <div className="text-[11px]" style={{ ...MONO, color: MUTED }}>0{i + 1}</div>
              <h3 className="mt-3 text-[24px] md:text-[28px]" style={{ ...HEAD, color: INK }}>{title}</h3>
              <p className="mt-3 text-[16px] leading-[1.6]" style={{ ...BODY, color: MUTED }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Split() {
  const [ref, reveal] = useReveal();
  return (
    <section id="warum" ref={ref} className="pt-[90px] lg:pt-[140px] scroll-mt-24">
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14" style={{ maxWidth: 1280, padding: '0 20px' }}>
        <div className="lg:col-span-5">
          <motion.div {...reveal(0)}><Bib>KI und Führung</Bib></motion.div>
          <motion.h2 {...reveal(0.05)} className="mt-4 text-[34px] md:text-[44px]" style={{ ...HEAD, color: INK, lineHeight: 1.1 }}>
            {SPLIT.question}
          </motion.h2>
          <motion.p {...reveal(0.1)} className="mt-5 text-[17px] leading-[1.65]" style={{ ...BODY, color: '#2A2B2E' }}>
            {SPLIT.answer}
          </motion.p>
        </div>
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
          <motion.div {...reveal(0.12)} style={{ background: INK, borderRadius: 28, padding: 'clamp(24px, 3vw, 34px)' }}>
            <div className="text-[11px]" style={{ ...MONO, color: LIME }}>KI übernimmt</div>
            <ul className="mt-5 flex flex-col" style={{ gap: 14 }}>
              {SPLIT.ki.map((t) => (
                <li key={t} className="flex items-start text-white text-[16px]" style={{ ...BODY, gap: 12 }}>
                  <span className="shrink-0 mt-0.5 flex items-center justify-center rounded-full" style={{ width: 22, height: 22, background: LIME }}><Check size={13} strokeWidth={3} color={INK} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...reveal(0.18)} style={{ background: '#fff', borderRadius: 28, padding: 'clamp(24px, 3vw, 34px)', border: `1px solid ${HAIR}` }}>
            <div className="text-[11px]" style={{ ...MONO, color: OLIVE }}>Du bleibst unersetzlich bei</div>
            <ul className="mt-5 flex flex-col" style={{ gap: 14 }}>
              {SPLIT.du.map((t) => (
                <li key={t} className="flex items-start text-[16px]" style={{ ...BODY, color: INK, gap: 12 }}>
                  <span className="shrink-0 mt-0.5 flex items-center justify-center rounded-full" style={{ width: 22, height: 22, background: INK }}><Check size={13} strokeWidth={3} color={LIME} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Sechs Hebel ──────────────────────────────────────────────────────

function Outcomes({ k }) {
  const [ref, reveal] = useReveal();
  return (
    <section id="system" ref={ref} className="pt-[90px] lg:pt-[140px] scroll-mt-24">
      <div className="mx-auto" style={{ maxWidth: 1280, padding: '0 20px' }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between" style={{ gap: 24 }}>
          <div>
            <motion.div {...reveal(0)}><Bib>Was du mitnimmst</Bib></motion.div>
            <motion.h2 {...reveal(0.05)} className="mt-4 text-[40px] sm:text-[56px] lg:text-[80px]" style={{ ...DISPLAY, color: INK, lineHeight: 0.92 }}>
              Sechs Hebel. Ein System<Dot color={OLIVE} />
            </motion.h2>
          </div>
          <motion.p {...reveal(0.1)} className="text-[16px] leading-[1.6] md:max-w-[380px]" style={{ ...BODY, color: MUTED }}>
            Jeder Hebel verbindet eines von Wlads Frameworks mit einem Werkzeug in LeaderOS – damit aus einem Impuls tägliches Verhalten wird.
          </motion.p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
          {OUTCOMES.map((o, i) => {
            const active = o.key === k;
            return (
              <motion.article
                key={o.key} {...reveal(0.06 * i)}
                className="relative overflow-hidden flex flex-col"
                style={{
                  borderRadius: 28, background: active ? INK : '#fff',
                  border: active ? `2px solid ${LIME}` : `1px solid ${HAIR}`,
                  boxShadow: active ? '0 24px 60px rgba(10,10,10,0.25)' : 'none',
                }}
              >
                <div className="relative overflow-hidden" style={{ height: 190, background: active ? '#151515' : '#EDEDEA' }}>
                  <img
                    src={o.img} alt="" loading="lazy"
                    className={`absolute ${o.fit === 'book' ? 'left-1/2 -translate-x-1/2 top-6 h-[210px] w-auto shadow-2xl rotate-[-4deg]' : o.fit === 'avatar' ? 'left-1/2 -translate-x-1/2 top-4 h-[200px] w-auto' : 'inset-0 w-full h-full object-cover object-top'}`}
                    style={o.fit === 'cover' ? { filter: active ? 'none' : 'grayscale(1)' } : undefined}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: `linear-gradient(to bottom, transparent, ${active ? INK : '#fff'})` }} />
                  <span className="absolute top-4 left-4 text-[10px] rounded-full" style={{ ...MONO, fontWeight: 700, padding: '5px 10px', background: active ? LIME : INK, color: active ? INK : '#fff' }}>
                    K·0{i + 1}
                  </span>
                  {active && (
                    <span className="absolute top-4 right-4 text-[10px] rounded-full" style={{ ...MONO, fontWeight: 700, padding: '5px 10px', background: '#fff', color: INK }}>
                      Dein Fokus
                    </span>
                  )}
                </div>
                <div className="flex-1 flex flex-col" style={{ padding: '6px 24px 24px' }}>
                  <h3 className="text-[22px]" style={{ ...HEAD, color: active ? '#fff' : INK }}>{o.title}</h3>
                  <p className="mt-2 text-[15px] leading-[1.55] flex-1" style={{ ...BODY, color: active ? 'rgba(255,255,255,0.72)' : MUTED }}>{o.desc}</p>
                  <div className="mt-5 flex flex-wrap" style={{ gap: 6 }}>
                    {[o.tool, o.fw].map((chip, j) => (
                      <span key={chip} className="text-[12px] rounded-full" style={{
                        ...BODY, fontWeight: 600, padding: '6px 12px',
                        background: j === 0 ? (active ? LIME : INK) : 'transparent',
                        color: j === 0 ? (active ? INK : '#fff') : (active ? '#fff' : INK),
                        border: j === 0 ? 'none' : `1px solid ${active ? 'rgba(255,255,255,0.25)' : HAIR}`,
                      }}>{chip}</span>
                    ))}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Produkt-Showcase ─────────────────────────────────────────────────

const glass = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18 };

function ScreenPrep() {
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <div className="text-[10px]" style={{ ...MONO, color: 'rgba(255,255,255,0.5)' }}>Vorlage laden · Wlad-kuratiert</div>
      <div className="flex flex-wrap" style={{ gap: 8 }}>
        {['Gehaltsverhandlung', 'Kündigungsgespräch', 'Board-Präsentation'].map((t, i) => (
          <span key={t} className="text-[13px] rounded-full" style={{ ...BODY, fontWeight: 600, padding: '8px 14px', background: i === 0 ? LIME : 'rgba(255,255,255,0.07)', color: i === 0 ? INK : '#fff' }}>{t}</span>
        ))}
      </div>
      {[['Hintergrund', 'Seit drei Jahren im Team, übernimmt zwei Projekte mehr als geplant.'], ['Ziel', 'Gehaltsanpassung um 8 % zum Januar.'], ['Beziehung', 'Bereichsleiterin, entscheidet schnell, will Belege.']].map(([k, v]) => (
        <div key={k} style={{ ...glass, padding: '12px 14px' }}>
          <div className="text-[10px]" style={{ ...MONO, color: 'rgba(255,255,255,0.45)' }}>{k}</div>
          <div className="mt-1 text-[14px] text-white" style={BODY}>{v}</div>
        </div>
      ))}
      <div style={{ ...glass, padding: '12px 14px', background: 'rgba(191,255,0,0.08)', borderColor: 'rgba(191,255,0,0.3)' }}>
        <div className="text-[10px]" style={{ ...MONO, color: LIME }}>SEXIER · dein Argument</div>
        <div className="mt-1 text-[14px] text-white" style={BODY}>S: Meine Rolle ist gewachsen. E: Zwei zusätzliche Projekte seit März. X: Launch Q2 ohne Verzug …</div>
      </div>
    </div>
  );
}

function ScreenSim() {
  const bubbles = [
    ['them', 'Ich weiß nicht, was das Problem ist. Ich arbeite doch genug.'],
    ['me', 'Mir ist aufgefallen, dass die letzten drei Reports nach der Deadline kamen. Das Team wartet dann auf dich.'],
    ['them', 'Das lag an den anderen Abteilungen, nicht an mir.'],
  ];
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <div className="flex items-center justify-between">
        <div className="text-[10px]" style={{ ...MONO, color: 'rgba(255,255,255,0.5)' }}>Simulation · Low Performer ansprechen</div>
        <span className="text-[10px]" style={{ ...MONO, color: LIME }}>Runde 2</span>
      </div>
      {bubbles.map(([who, t], i) => (
        <div key={i} className={`max-w-[85%] text-[14px] ${who === 'me' ? 'self-end' : 'self-start'}`} style={{ ...BODY, padding: '10px 14px', borderRadius: 18, background: who === 'me' ? LIME : 'rgba(255,255,255,0.08)', color: who === 'me' ? INK : '#fff' }}>
          {t}
        </div>
      ))}
      <div className="flex items-start" style={{ ...glass, padding: '12px 14px', gap: 10 }}>
        <img src="/wlad/wladbot3.0.webp" alt="" className="shrink-0 rounded-full" style={{ width: 28, height: 28 }} />
        <p className="text-[13px] leading-[1.5]" style={{ ...BODY, color: 'rgba(255,255,255,0.85)' }}>
          <b style={{ color: LIME }}>Coach:</b> Stark – Beobachtung statt Bewertung. Jetzt nicht diskutieren, wer schuld ist: Wirkung benennen, dann den Wunsch formulieren.
        </p>
      </div>
    </div>
  );
}

function ScreenVideo() {
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <div className="text-[10px]" style={{ ...MONO, color: 'rgba(255,255,255,0.5)' }}>Video-Mission · Change-Rede · KI-Analyse nach Wlad</div>
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
        <div style={{ ...glass, padding: 14 }}>
          <div className="text-[10px]" style={{ ...MONO, color: LIME }}>Gut gemacht</div>
          <ul className="mt-2 flex flex-col text-[13px] text-white" style={{ ...BODY, gap: 8 }}>
            <li>1 · Klarer Einstieg: warum jetzt</li><li>2 · Ruhige Stimme bei Einwänden</li><li>3 · Konkretes Beispiel aus dem Team</li>
          </ul>
        </div>
        <div style={{ ...glass, padding: 14 }}>
          <div className="text-[10px]" style={{ ...MONO, color: '#FFB547' }}>Nächster Hebel</div>
          <ul className="mt-2 flex flex-col text-[13px] text-white" style={{ ...BODY, gap: 8 }}>
            <li>1 · Drei-Satz-Struktur halten</li><li>2 · Empathie in Minute 1</li><li>3 · Blick zur Kamera beim Kernsatz</li>
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-3" style={{ gap: 10 }}>
        {[['Präsenz', 72], ['Wärme', 64], ['Kompetenz', 81]].map(([l, v]) => (
          <div key={l} style={{ ...glass, padding: '10px 12px' }}>
            <div className="text-[10px]" style={{ ...MONO, color: 'rgba(255,255,255,0.5)' }}>{l}</div>
            <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width: `${v}%`, background: LIME }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenChallenge() {
  const days = Array.from({ length: 30 }, (_, i) => i < 11 ? 'done' : i === 11 ? 'today' : 'open');
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <div className="flex items-center justify-between">
        <div className="text-[10px]" style={{ ...MONO, color: 'rgba(255,255,255,0.5)' }}>30-Tage-Challenge · Rolle 3: Team-Leader</div>
        <span className="text-[10px]" style={{ ...MONO, color: LIME }}>Tag 12 / 30</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(10, minmax(0,1fr))', gap: 6 }}>
        {days.map((d, i) => (
          <div key={i} className="aspect-square rounded-md" style={{ background: d === 'done' ? LIME : d === 'today' ? 'transparent' : 'rgba(255,255,255,0.07)', border: d === 'today' ? `2px solid ${LIME}` : 'none' }} />
        ))}
      </div>
      {[['Drill · 5 Min', 'Delegationsgespräch: Ergebnis statt Aufgabe übergeben', true], ['Reflexion · 2 Min', 'Wo hast du heute eine Entscheidung zurückgegeben?', false]].map(([k, v, done]) => (
        <div key={k} className="flex items-center" style={{ ...glass, padding: '12px 14px', gap: 12 }}>
          <span className="shrink-0 flex items-center justify-center rounded-full" style={{ width: 24, height: 24, background: done ? LIME : 'transparent', border: done ? 'none' : '1.5px solid rgba(255,255,255,0.3)' }}>
            {done && <Check size={13} strokeWidth={3} color={INK} />}
          </span>
          <div>
            <div className="text-[10px]" style={{ ...MONO, color: 'rgba(255,255,255,0.45)' }}>{k}</div>
            <div className="text-[14px] text-white" style={BODY}>{v}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const SCREENS = [
  ['Vorbereiten', 'Der KI-Coach strukturiert dein Gespräch nach dem SEXIER-Modell – Vorlage wählen, Kontext geben, Argument steht.', ScreenPrep],
  ['Proben', 'Das Gespräch einmal durchspielen, mit Widerstand. Der Coach sagt dir nach jeder Runde, welcher Satz trägt.', ScreenSim],
  ['Analysieren', 'Rede aufnehmen, hochladen, auswerten lassen: Stärken, Hebel und dein Charisma-Profil.', ScreenVideo],
  ['Dranbleiben', 'Jeden Tag eine Aufgabe, 30 Tage lang. Aus einem Vormittag Impuls wird eine Routine.', ScreenChallenge],
];

function Showcase() {
  const [ref, reveal, inView] = useReveal();
  const [tab, setTab] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!inView || paused) return undefined;
    const t = setInterval(() => setTab((x) => (x + 1) % SCREENS.length), 6000);
    return () => clearInterval(t);
  }, [inView, paused]);
  const Screen = SCREENS[tab][2];

  return (
    <section ref={ref} className="mt-[90px] lg:mt-[140px] overflow-hidden" style={{ background: INK }}>
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center" style={{ maxWidth: 1280, padding: 'clamp(80px, 10vw, 130px) 20px' }}>
        <div className="lg:col-span-5">
          <motion.div {...reveal(0)}><Bib dark>So sieht Training aus</Bib></motion.div>
          <motion.h2 {...reveal(0.05)} className="mt-4 text-white text-[40px] sm:text-[56px] lg:text-[72px]" style={{ ...DISPLAY, lineHeight: 0.92 }}>
            Nicht lesen. Trainieren<Dot />
          </motion.h2>
          <div className="mt-10 flex flex-col" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {SCREENS.map(([label, desc], i) => (
              <button
                key={label} type="button" onClick={() => { setTab(i); setPaused(true); track('ki_showcase_tab', { tab: label }); }}
                className="text-left relative" style={{ padding: '18px 0', borderTop: '1px solid rgba(255,255,255,0.12)' }}
                aria-pressed={tab === i}
              >
                <div className="flex items-baseline" style={{ gap: 14 }}>
                  <span className="text-[11px]" style={{ ...MONO, color: tab === i ? LIME : 'rgba(255,255,255,0.35)' }}>0{i + 1}</span>
                  <span className="text-[22px] md:text-[26px]" style={{ ...HEAD, color: tab === i ? '#fff' : 'rgba(255,255,255,0.4)' }}>{label}</span>
                </div>
                <AnimatePresence initial={false}>
                  {tab === i && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease }}
                      className="overflow-hidden text-[15px] leading-[1.6] pl-[38px]" style={{ ...BODY, color: 'rgba(255,255,255,0.65)' }}
                    >
                      <span className="block pt-2">{desc}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
                {tab === i && !paused && (
                  <motion.span key={`bar-${tab}`} className="absolute left-0 top-[-1px] h-[2px]" style={{ background: LIME }} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 6, ease: 'linear' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        <motion.div {...reveal(0.15)} className="lg:col-span-7">
          <div
            className="relative mx-auto w-full max-w-[640px]"
            style={{ borderRadius: 32, padding: 'clamp(18px, 3vw, 28px)', background: 'linear-gradient(160deg, #1A1C1E, #0E0F10)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 60px 140px rgba(0,0,0,0.6), 0 0 0 10px rgba(255,255,255,0.03)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex" style={{ gap: 6 }}>{[0, 1, 2].map((i) => <span key={i} className="rounded-full" style={{ width: 10, height: 10, background: 'rgba(255,255,255,0.15)' }} />)}</div>
              <span className="text-[10px]" style={{ ...MONO, color: 'rgba(255,255,255,0.4)' }}>leaderos.de · Beispielansicht</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease }} style={{ minHeight: 360 }}>
                <Screen />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Statement ────────────────────────────────────────────────────────

function Statement() {
  const [ref, reveal] = useReveal();
  return (
    <section ref={ref} className="pt-[90px] lg:pt-[140px]">
      <div className="mx-auto text-center" style={{ maxWidth: 1180, padding: '0 20px' }}>
        <motion.p {...reveal(0)} className="text-[38px] sm:text-[58px] lg:text-[88px]" style={{ ...DISPLAY, color: INK, lineHeight: 0.95 }}>
          Die Frage ist nicht, ob KI deinen Job verändert<Dot color={OLIVE} />
        </motion.p>
        <motion.p {...reveal(0.1)} className="mt-6 text-[20px] md:text-[26px]" style={{ ...HEAD, color: MUTED, lineHeight: 1.35 }}>
          Die Frage ist, ob du lernst, sie als Chance zu nutzen – oder von ihr aussortiert wirst.
        </motion.p>
      </div>
    </section>
  );
}

// ─── Für wen ──────────────────────────────────────────────────────────

function Audiences() {
  const [ref, reveal] = useReveal();
  return (
    <section ref={ref} className="pt-[90px] lg:pt-[140px]">
      <div className="mx-auto" style={{ maxWidth: 1280, padding: '0 20px' }}>
        <motion.div {...reveal(0)}><Bib>Für wen</Bib></motion.div>
        <motion.h2 {...reveal(0.05)} className="mt-4 text-[34px] md:text-[48px]" style={{ ...HEAD, color: INK, lineHeight: 1.1, maxWidth: 760 }}>
          Zwei Ausgangspunkte. Ein Ziel: unersetzlich werden.
        </motion.h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
          {AUDIENCES.map((a, i) => (
            <motion.div key={a.title} {...reveal(0.1 + i * 0.08)} style={{ background: i ? INK : '#fff', borderRadius: 28, padding: 'clamp(26px, 4vw, 44px)', border: i ? 'none' : `1px solid ${HAIR}` }}>
              <div className="text-[11px]" style={{ ...MONO, color: i ? LIME : OLIVE, fontWeight: 700 }}>{a.bib}</div>
              <h3 className="mt-4 text-[28px] md:text-[34px]" style={{ ...HEAD, color: i ? '#fff' : INK, lineHeight: 1.1 }}>{a.title}</h3>
              <p className="mt-3 text-[17px]" style={{ ...BODY, color: i ? 'rgba(255,255,255,0.7)' : MUTED }}>{a.lead}</p>
              <ul className="mt-7 flex flex-col" style={{ gap: 12 }}>
                {a.points.map((p) => (
                  <li key={p} className="flex items-start text-[16px]" style={{ ...BODY, color: i ? '#fff' : INK, gap: 12 }}>
                    <ArrowRight size={18} className="shrink-0 mt-0.5" style={{ color: i ? LIME : OLIVE }} /> {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Agenda ───────────────────────────────────────────────────────────

function Agenda() {
  const [ref, reveal] = useReveal();
  return (
    <section id="agenda" ref={ref} className="pt-[90px] lg:pt-[140px] scroll-mt-24">
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14" style={{ maxWidth: 1280, padding: '0 20px' }}>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <motion.div {...reveal(0)}><Bib>Das Live-Webinar</Bib></motion.div>
            <motion.h2 {...reveal(0.05)} className="mt-4 text-[40px] sm:text-[56px] lg:text-[72px]" style={{ ...DISPLAY, color: INK, lineHeight: 0.92 }}>
              90 Minuten. Live<Dot color={OLIVE} />
            </motion.h2>
            <motion.div {...reveal(0.1)} className="mt-8" style={{ background: '#fff', borderRadius: 24, padding: 24, border: `1px solid ${HAIR}` }}>
              <div className="text-[11px]" style={{ ...MONO, color: OLIVE, fontWeight: 700 }}>{OFFER.label}</div>
              <div className="mt-3 text-[26px]" style={{ ...HEAD, color: INK }}>{OFFER.date}</div>
              <div className="text-[18px]" style={{ ...BODY, color: MUTED }}>{OFFER.time} · online</div>
              <div className="mt-5"><Countdown dark={false} compact /></div>
              <motion.button type="button" {...press} onClick={() => goToForm('agenda')} className="mt-6 w-full flex items-center justify-center rounded-full" style={{ ...BODY, fontWeight: 700, fontSize: 15, height: 54, background: INK, color: '#fff', gap: 10 }}>
                {OFFER.cta} <ArrowRight size={17} />
              </motion.button>
              <p className="mt-3 text-center text-[11px]" style={{ ...MONO, color: MUTED }}>{OFFER.facts.join(' · ')}</p>
            </motion.div>
          </div>
        </div>
        <ol className="lg:col-span-7 flex flex-col">
          {AGENDA.map(([time, title, desc], i) => (
            <motion.li key={time} {...reveal(0.08 * i)} className="grid grid-cols-[72px_1fr] md:grid-cols-[110px_1fr]" style={{ padding: '26px 0', borderTop: `1px solid ${i ? HAIR : INK}` }}>
              <span className="text-[13px] md:text-[14px] pt-1" style={{ ...MONO, color: OLIVE, fontWeight: 700 }}>{time}</span>
              <div>
                <h3 className="text-[22px] md:text-[26px]" style={{ ...HEAD, color: INK }}>{title}</h3>
                <p className="mt-1.5 text-[16px] leading-[1.55]" style={{ ...BODY, color: MUTED }}>{desc}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Host + Beweis ────────────────────────────────────────────────────

function Host() {
  const [ref, reveal] = useReveal();
  return (
    <section ref={ref} className="pt-[90px] lg:pt-[140px]">
      <div className="mx-auto" style={{ maxWidth: 1280, padding: '0 20px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <motion.div {...reveal(0)} className="lg:col-span-5 relative">
            <div className="relative overflow-hidden" style={{ borderRadius: 32, aspectRatio: '4 / 5', background: '#DADAD5' }}>
              <img src="/wlad/wlad-portrait.webp" alt="Wlad Jachtchenko" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-top" />
              <span className="absolute left-4 top-4 text-[10px] rounded-full" style={{ ...MONO, fontWeight: 700, padding: '5px 10px', background: INK, color: LIME }}>Host</span>
            </div>
            <div className="absolute -right-2 sm:-right-5 -bottom-6 flex items-center bg-white" style={{ borderRadius: 999, padding: '8px 16px 8px 8px', gap: 10, boxShadow: PILL_SHADOW }}>
              <img src="/wlad/wladbot3.0.webp" alt="WladBot, der KI-Coach" loading="lazy" className="rounded-full object-cover" style={{ width: 44, height: 44 }} />
              <div>
                <div className="text-[10px]" style={{ ...MONO, color: OLIVE, fontWeight: 700 }}>+ WladBot</div>
                <div className="text-[13px]" style={{ ...BODY, fontWeight: 600, color: INK }}>Wlads Methodik als KI-Coach</div>
              </div>
            </div>
          </motion.div>
          <div className="lg:col-span-7">
            <motion.div {...reveal(0.05)}><Bib>Dein Gastgeber</Bib></motion.div>
            <motion.h2 {...reveal(0.1)} className="mt-4 text-[34px] md:text-[48px]" style={{ ...HEAD, color: INK, lineHeight: 1.1 }}>
              {HOST.name}<span className="block text-[18px] md:text-[20px] mt-2" style={{ ...BODY, color: MUTED, letterSpacing: 0 }}>{HOST.role}</span>
            </motion.h2>
            <motion.p {...reveal(0.15)} className="mt-6 text-[17px] leading-[1.65]" style={{ ...BODY, color: '#2A2B2E' }}>{HOST.bio}</motion.p>
            <motion.div {...reveal(0.2)} className="mt-10 grid grid-cols-2 md:grid-cols-4" style={{ gap: 12 }}>
              {STATS.map(([v, l]) => (
                <div key={l} style={{ background: '#fff', borderRadius: 20, padding: '18px 16px', border: `1px solid ${HAIR}` }}>
                  <div className="text-[30px] md:text-[34px]" style={{ ...DISPLAY, color: INK, lineHeight: 1 }}>{v}</div>
                  <div className="mt-2 text-[13px] leading-[1.35]" style={{ ...BODY, color: MUTED }}>{l}</div>
                </div>
              ))}
            </motion.div>
            <motion.p {...reveal(0.25)} className="mt-8 text-[14px] leading-[1.6]" style={{ ...BODY, color: MUTED }}>
              Führungskräfte von <b style={{ color: INK }}>{HOST.clients.join(', ')}</b> und vielen weiteren haben Wlads Trainings durchlaufen.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const [ref, reveal] = useReveal();
  return (
    <section ref={ref} className="pt-[110px] lg:pt-[160px]">
      <div className="mx-auto" style={{ maxWidth: 1280, padding: '0 20px' }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between" style={{ gap: 20 }}>
          <div>
            <motion.div {...reveal(0)}><Bib>Stimmen aus Wlads Trainings</Bib></motion.div>
            <motion.h2 {...reveal(0.05)} className="mt-4 text-[34px] md:text-[48px]" style={{ ...HEAD, color: INK, lineHeight: 1.1 }}>
              4,9 von 5 auf Trustpilot.
            </motion.h2>
          </div>
          <motion.a {...reveal(0.1)} href={TRUSTPILOT_URL} target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-70" style={{ ...BODY, fontSize: 14, fontWeight: 600, color: INK, gap: 6 }}>
            Alle 388 Bewertungen <ArrowUpRight size={16} />
          </motion.a>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 14 }}>
          {REVIEWS.map(([quote, name, context, date], i) => (
            <motion.figure key={name} {...reveal(0.06 * i)} className="flex flex-col" style={{ background: '#fff', borderRadius: 24, padding: 24, border: `1px solid ${HAIR}` }}>
              <div className="flex" style={{ gap: 2 }}>{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={15} fill="#00B67A" stroke="#00B67A" />)}</div>
              <blockquote className="mt-4 flex-1 text-[18px] leading-[1.4]" style={{ ...HEAD, color: INK }}>„{quote}"</blockquote>
              <figcaption className="mt-5 text-[13px]" style={{ ...BODY, color: MUTED }}>
                <b style={{ color: INK }}>{name}</b> · {context}<br />{date} · auf Trustpilot
              </figcaption>
            </motion.figure>
          ))}
        </div>
        <p className="mt-4 text-[12px]" style={{ ...BODY, color: MUTED }}>Bewertungen geben die persönliche Meinung der Verfasser wieder. Quelle: Trustpilot.</p>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────

function Faq() {
  const [ref, reveal] = useReveal();
  return (
    <section id="fragen" ref={ref} className="pt-[90px] lg:pt-[140px] scroll-mt-24">
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10" style={{ maxWidth: 1280, padding: '0 20px' }}>
        <div className="lg:col-span-4">
          <motion.div {...reveal(0)}><Bib>Häufige Fragen</Bib></motion.div>
          <motion.h2 {...reveal(0.05)} className="mt-4 text-[40px] sm:text-[48px]" style={{ ...DISPLAY, color: INK, lineHeight: 0.92 }}>
            Kurz beantwortet<Dot color={OLIVE} />
          </motion.h2>
        </div>
        <div className="lg:col-span-8">
          {FAQ.map(([q, a], i) => (
            <motion.details key={q} {...reveal(0.04 * i)} className="group" style={{ borderTop: `1px solid ${i ? HAIR : INK}` }} onToggle={(e) => e.currentTarget.open && track('ki_faq_open', { q })}>
              <summary className="flex items-center justify-between cursor-pointer list-none" style={{ padding: '22px 0', gap: 20 }}>
                <h3 className="text-[19px] md:text-[22px]" style={{ ...HEAD, color: INK }}>{q}</h3>
                <span className="shrink-0 flex items-center justify-center rounded-full transition-transform group-open:rotate-45" style={{ width: 34, height: 34, background: INK, color: LIME, fontSize: 20, lineHeight: 1 }}>+</span>
              </summary>
              <p className="pb-6 pr-12 text-[16px] leading-[1.65]" style={{ ...BODY, color: '#2A2B2E' }}>{a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Anmeldung ────────────────────────────────────────────────────────

const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'];
const UTM_STORE = 'lo_ki_utm';
const readUtm = () => {
  try {
    const q = new URLSearchParams(window.location.search);
    const fresh = Object.fromEntries(UTM_KEYS.map((key) => [key, (q.get(`utm_${key}`) || '').slice(0, 120)]));
    if (Object.values(fresh).some(Boolean)) { sessionStorage.setItem(UTM_STORE, JSON.stringify(fresh)); return fresh; }
    return JSON.parse(sessionStorage.getItem(UTM_STORE) || 'null');
  } catch { return null; }
};
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim());

function Register({ k }) {
  const [ref, reveal] = useReveal();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');

  const submit = async (e) => {
    e.preventDefault();
    if (state === 'loading') return;
    if (!isEmail(email)) { setState('invalid'); return; }
    setState('loading');
    track('ki_register_submit', { kampagne: k });
    const eventId = metaEventId();
    try {
      const res = await fetch('/api/webinar/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(), name: name.trim(), source: `ki-fuehrung-${k}`,
          utm: readUtm(), meta_event_id: eventId, answers: { kampagne: k },
          referrer: document.referrer || null, landing_path: window.location.pathname,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        trackMeta('Lead', { content_name: WEBINAR_CAMPAIGN, content_category: 'webinar' }, eventId);
        trackLinkedInLead();
        window.location.assign(`/webinar/danke?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      setState('error');
    } catch { setState('error'); }
  };

  const input = { ...BODY, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff' };

  return (
    <section id="anmelden" ref={ref} className="mt-[90px] lg:mt-[140px] scroll-mt-10 relative overflow-hidden" style={{ background: INK }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(191,255,0,0.14), transparent 60%)' }} />
      <div className="relative mx-auto text-center" style={{ maxWidth: 820, padding: 'clamp(80px, 10vw, 130px) 20px' }}>
        <motion.div {...reveal(0)}><Bib dark>{OFFER.label} · {OFFER.date}</Bib></motion.div>
        <motion.h2 {...reveal(0.05)} className="mt-5 text-white text-[34px] sm:text-[64px] lg:text-[84px]" style={{ ...DISPLAY, lineHeight: 0.92 }}>
          Werde die Führungskraft, die keine KI ersetzt<Dot />
        </motion.h2>
        <motion.p {...reveal(0.1)} className="mt-6 text-[17px] md:text-[19px]" style={{ ...BODY, color: 'rgba(255,255,255,0.72)' }}>
          {OFFER.time} · online · kostenlos. Bestätigung und Kalender-Link kommen sofort per E-Mail.
        </motion.p>
        <motion.div {...reveal(0.15)} className="mt-8 flex justify-center"><Countdown /></motion.div>

        <motion.form {...reveal(0.2)} onSubmit={submit} noValidate className="mt-10 mx-auto text-left" style={{ maxWidth: 560 }} data-testid="ki-register">
          <div className="flex flex-col sm:flex-row" style={{ gap: 10 }}>
            <label className="sr-only" htmlFor="ki-name">Vorname</label>
            <input id="ki-name" type="text" placeholder="Vorname" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name"
              className="h-14 w-full sm:w-auto sm:flex-1 rounded-2xl px-5 text-[15px] placeholder-white/40 focus:outline-none focus:border-[#BFFF00]" style={input} />
            <label className="sr-only" htmlFor="ki-email">E-Mail-Adresse</label>
            <input id="ki-email" type="email" inputMode="email" autoComplete="email" placeholder="E-Mail-Adresse" value={email}
              onChange={(e) => { setEmail(e.target.value); if (state === 'invalid') setState('idle'); }}
              className="h-14 w-full sm:w-auto sm:flex-[1.4] rounded-2xl px-5 text-[15px] placeholder-white/40 focus:outline-none focus:border-[#BFFF00]" style={input} />
          </div>
          <motion.button type="submit" {...press} disabled={state === 'loading'}
            className="mt-3 w-full h-[60px] rounded-full flex items-center justify-center disabled:opacity-70"
            style={{ ...BODY, fontWeight: 700, fontSize: 16, background: LIME, color: INK, gap: 10 }}>
            {state === 'loading' ? 'Platz wird gesichert …' : <>Kostenlosen Platz sichern <ArrowRight size={18} strokeWidth={2.5} /></>}
          </motion.button>
          {state === 'invalid' && <p role="alert" className="mt-3 text-center text-[14px]" style={{ color: '#FF8A80' }}>Bitte eine gültige E-Mail-Adresse eingeben.</p>}
          {state === 'error' && <p role="alert" className="mt-3 text-center text-[14px]" style={{ color: '#FF8A80' }}>Das hat leider nicht geklappt – bitte nochmal versuchen.</p>}
          <p className="mt-4 text-center text-[12px]" style={{ ...BODY, color: 'rgba(255,255,255,0.5)' }}>
            Kein Spam. Abmeldung jederzeit mit einem Klick. <a href="/datenschutz" className="underline hover:text-white">Datenschutz</a>
          </p>
        </motion.form>

        <motion.ol {...reveal(0.25)} className="mt-12 grid grid-cols-1 sm:grid-cols-3 text-left" style={{ gap: 10 }}>
          {[['01', 'Anmelden', 'Bestätigung + Kalender-Link sofort.'], ['02', '4 Videos', 'Auf der Bestätigungsseite freischalten.'], ['03', 'Live dabei sein', `${OFFER.date}, 10:00 Uhr.`]].map(([n, t, d]) => (
            <li key={n} style={{ ...glass, padding: '16px 18px' }}>
              <div className="text-[10px]" style={{ ...MONO, color: LIME }}>{n}</div>
              <div className="mt-1 text-[16px] text-white" style={{ ...HEAD }}>{t}</div>
              <div className="text-[13px]" style={{ ...BODY, color: 'rgba(255,255,255,0.55)' }}>{d}</div>
            </li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

// ─── Weiterlesen + Footer ─────────────────────────────────────────────

function Reading() {
  const [ref, reveal] = useReveal();
  return (
    <section ref={ref} className="pt-[80px] lg:pt-[110px]">
      <div className="mx-auto" style={{ maxWidth: 1280, padding: '0 20px' }}>
        <motion.div {...reveal(0)}><Bib>Weiterlesen im Journal</Bib></motion.div>
        <motion.h2 {...reveal(0.05)} className="mt-4 text-[28px] md:text-[36px]" style={{ ...HEAD, color: INK }}>Führen mit KI – die Grundlagen</motion.h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ borderTop: `1px solid ${INK}` }}>
          {READING.map(([href, title], i) => (
            <motion.a key={href} {...reveal(0.04 * i)} href={href} className="group flex items-start justify-between" style={{ padding: '20px 4px', borderBottom: `1px solid ${HAIR}`, gap: 16 }}>
              <span className="text-[16px] leading-[1.45] group-hover:underline" style={{ ...BODY, fontWeight: 500, color: INK }}>{title}</span>
              <ArrowUpRight size={18} className="shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: OLIVE }} />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-[80px]" style={{ borderTop: `1px solid ${HAIR}` }}>
      <div className="mx-auto flex flex-col md:flex-row items-center justify-between" style={{ maxWidth: 1280, padding: '28px 20px 110px', gap: 16 }}>
        <Brand small />
        <nav className="flex flex-wrap justify-center text-[13px]" style={{ ...BODY, color: MUTED, gap: '8px 20px' }}>
          <a href="/webinar" className="hover:text-black">Webinar</a>
          <a href="/fragen" className="hover:text-black">Fragen & Antworten</a>
          <a href="/journal" className="hover:text-black">Journal</a>
          <a href="/impressum" className="hover:text-black">Impressum</a>
          <a href="/datenschutz" className="hover:text-black">Datenschutz</a>
        </nav>
      </div>
    </footer>
  );
}

function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => {
      const form = document.getElementById('anmelden');
      const formTop = form ? form.getBoundingClientRect().top : Infinity;
      setShow(window.scrollY > window.innerHeight * 0.9 && formTop > window.innerHeight * 0.6);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', duration: 0.5, bounce: 0.1 }}
          className="lg:hidden fixed inset-x-0 bottom-0 z-40" style={{ padding: '10px 14px calc(10px + env(safe-area-inset-bottom))' }}
        >
          <button type="button" onClick={() => goToForm('sticky')} className="w-full h-14 rounded-full flex items-center justify-center" style={{ ...BODY, fontWeight: 700, fontSize: 15, background: INK, color: '#fff', gap: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.35)' }}>
            <span className="rounded-full" style={{ width: 8, height: 8, background: LIME }} /> Kostenlos anmelden · 29.10.
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VideoOverlay({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          style={{ background: 'rgba(10,10,10,0.92)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button type="button" onClick={onClose} aria-label="Schließen" className="absolute flex items-center justify-center rounded-full" style={{ top: 24, right: 24, width: 44, height: 44, background: '#fff' }}>
            <X size={18} color={INK} />
          </button>
          <motion.div className="w-full max-w-[860px] aspect-video overflow-hidden bg-black" style={{ borderRadius: 24 }} initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} onClick={(e) => e.stopPropagation()}>
            <iframe title="Wlad Jachtchenko · LeaderOS" src={`https://player.vimeo.com/video/${INTRO_VIMEO_ID}?autoplay=1&muted=1`} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function KiFuehrungskraftPage() {
  const [videoOpen, setVideoOpen] = useState(false);
  const k = useMemo(() => {
    try { return campaignFor(new URLSearchParams(window.location.search).get('k')); } catch { return campaignFor(null); }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    root.style.scrollBehavior = 'smooth';
    readUtm();
    track('ki_lp_view', { kampagne: k });
    trackMeta('ViewContent', { content_name: WEBINAR_CAMPAIGN, content_category: 'webinar' });

    const restoreMeta = applyPageMeta({ title: SEO.title, description: SEO.description, url: PAGE_URL, image: OG_IMAGE });

    return () => {
      if (wasDark) root.classList.add('dark');
      root.style.scrollBehavior = '';
      restoreMeta?.();
    };
  }, [k]);

  return (
    <div className="min-h-screen antialiased overflow-x-hidden" style={{ background: PAPER, color: INK }}>
      <Navbar />
      <main>
        <Hero k={k} onPlay={() => { setVideoOpen(true); track('ki_video_open'); }} />
        <WhyNow />
        <Split />
        <Outcomes k={k} />
        <Showcase />
        <Statement />
        <Audiences />
        <Agenda />
        <Host />
        <div className="mt-[90px] lg:mt-[140px]"><BookShelf onTrack={(e, p) => track(`ki_${e}`, p)} /></div>
        <Reviews />
        <Faq />
        <Register k={k} />
        <Reading />
      </main>
      <Footer />
      <StickyCta />
      <VideoOverlay open={videoOpen} onClose={() => setVideoOpen(false)} />
    </div>
  );
}
