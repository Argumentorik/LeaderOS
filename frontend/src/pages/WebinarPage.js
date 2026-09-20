import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  motion, useInView, AnimatePresence, useScroll, useTransform, useReducedMotion,
} from 'framer-motion';
import {
  ArrowUpRight, ArrowDown, Check, Star, PlayCircle, CalendarCheck,
  MessageCircleQuestion, BellRing, ClipboardCheck, Video, BookOpen, X, Plus,
} from 'lucide-react';
import { applyPageMeta } from '../lib/pageMeta';
import { isValidEmail } from '../features/newsletter/lib/newsletterClient';
import { WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, withFallback } from '../lib/brandAssets';
import { WladMark } from '../components/brand/WladMark';
import { CinematicHero } from '../components/webinar/CinematicHero';
import { trackMeta, metaEventId } from '../lib/metaPixel';
import { trackLinkedInLead } from '../lib/linkedinInsight';

/**
 * WebinarPage · /webinar · Hormozi ascension funnel, motion-first build.
 *
 * 2026-09 hero rebuild: the hero is now CinematicHero — Wlad full-bleed,
 * the headline burned into the image, date/duration/0 € as facts, and the
 * registration panel inside the first viewport on desktop (right column)
 * and one swipe below it on phones. Everything below the hero is the
 * 2026-07 build:
 *
 * 2026-07 interaction overhaul (Apple × Linear × Stripe direction from the
 * team brief): every animation serves the conversion — blur scroll-reveals,
 * flip-clock countdown, pulsing primary CTA, mouse-follow glow, the
 * gray-out-vs-light-up system comparison, scroll-activated agenda, FAQ
 * accordion, subtle portrait parallax, and a sticky CTA bar with inline
 * email capture from ~20 % scroll. All built on framer-motion (already in
 * the bundle — no anime.js dependency added; same capabilities, zero
 * lockfile risk) and all gated by prefers-reduced-motion.
 *
 * Deliberate deviation from the brief's palette: we keep the light
 * white/#fafafa canvas with the LeaderOS ink+lime accent system instead of
 * #050505 + blue/violet — the light funnel was an explicit product decision
 * (bright, friendly, approachable) and lime is the brand signature
 * (frontend/DESIGN.md). The ink StatementBands provide the dark moments.
 *
 * Honesty rules unchanged (docs/gtm/WEBINAR_FUNNEL.md): verified numbers only,
 * no invented testimonials, no fake scarcity, no fake exclusivity.
 */

const WEBINAR_TS = new Date('2026-10-29T10:00:00+01:00').getTime();
const DATE_LINE = 'DO 29. OKTOBER 2026 · 10:00 UHR · LIVE · ONLINE';
// Kurzform fürs 440-px-Formular-Panel im Hero — die Langform bricht dort um.
const DATE_LINE_SHORT = 'DO 29. OKT 2026 · 10:00 UHR · LIVE';

const STATS = [
  ['400.000+', 'trainierte Klienten'],
  ['20+', 'Länder'],
  ['4,9/5', 'Trustpilot · 388 Bewertungen'],
  ['3×', 'SPIEGEL-Bestseller · 13 Bücher'],
  ['2007', 'im Coaching seit'],
  ['Columbia', 'University · Master of Arts'],
];

const MEDIA = [
  'DER SPIEGEL', 'BUSINESS INSIDER', 'SÜDDEUTSCHE ZEITUNG', 'RTL',
  'ARD · DAS ERSTE', 'PROSIEBEN · GALILEO', 'TEDX', 'GREATOR',
];

const CLIENTS = [
  'Allianz', 'BMW', 'Siemens', 'Telekom', 'Lufthansa', 'Bosch',
  'Vodafone', 'Daimler', 'Sky', 'Pro7', '3M', 'Generali',
];

const REVIEW_PLATFORMS = [
  ['Trustpilot', '4,9', '388 Bewertungen', 'https://uk.trustpilot.com/review/argumentorik.com'],
  ['Greator', '4,7', '995 Bewertungen', 'https://greator.com/coach/wlad-jachtchenko'],
];

const WEEK = [
  ['Montag', '„Diese Woche gebe ich endlich gutes Feedback."', false],
  ['Dienstag', 'Stress. Drei Meetings. Ein Konflikt. Feedback verschoben.', false],
  ['Mittwoch', 'Das schwierige Gespräch? „Nächste Woche wirklich."', false],
  ['Donnerstag', 'Der Konflikt eskaliert — jetzt ist es ein Krisengespräch.', false],
  ['Freitag', 'Vom letzten Seminar ist nichts mehr übrig außer den Folien.', true],
];

const SEMINAR_FLOW = ['Seminar', 'Notizen', 'Alltag', 'Vergessen'];
const OS_FLOW = ['Täglich 15 Min', 'KI-Coach', 'Simulation', 'Feedback', 'Fortschritt'];

const LEARN_CARDS = [
  ['Schwierige Gespräche', 'Wie du Kritik äußerst, ohne Vertrauen zu verlieren — mit Skript statt Bauchgefühl.'],
  ['Der KI-Coach', 'Wie du mit WladBot jeden Tag 15 Minuten trainierst — an deinen echten Fällen.'],
  ['Simulationen', 'Realistische Führungssituationen durchspielen, bevor sie im echten Meeting passieren.'],
  ['Die 30-Tage-Challenge', 'Der Trainingsplan, der aus einem Vormittag Impuls eine tägliche Routine macht.'],
  ['Die Frameworks', 'Die Methoden hinter 400.000+ Coachings — von SEXIER bis zur Feedbackformel.'],
];

const VALUE_STACK = [
  [Video, 'Live-Demonstration', 'Das komplette Leadership Operating System, live gezeigt — kein Foliensatz.'],
  [CalendarCheck, 'Der 30-Tage-Trainingsplan', 'Die Struktur der Challenge, mit der Führung zur täglichen Routine wird.'],
  [MessageCircleQuestion, 'Live Q&A mit Wlad', 'Deine Fragen, live beantwortet — ab 11:15 Uhr fester Teil der Agenda.'],
  [ClipboardCheck, 'Der kostenlose Leader-Check', 'Dein Führungsprofil in 10 Minuten — KI-Readiness, Rhetorik, EQ.'],
  [PlayCircle, 'Die 4-teilige Videoserie', '„Führung beginnt hier" — schaltest du direkt nach der Anmeldung frei.'],
  [BellRing, 'Kalender + Erinnerungen', 'Google-Calendar-Einladung sofort, Erinnerung 24h und 1h vor dem Start.'],
];

const AGENDA = [
  ['10:00', 'Check-in & Warm-up', 'Kurz ankommen — worum es in den nächsten 90 Minuten geht.'],
  ['10:05', 'Der Charisma-Code live', 'Präsenz · Wärme · Kompetenz — die drei Signale, in Echtzeit demonstriert.'],
  ['10:25', 'Das Leadership Operating System', 'Wie WladBot, tägliche Drills und die 11 Frameworks zusammenspielen.'],
  ['10:55', 'Live-Case aus der Community', 'Eine echte Führungssituation, gemeinsam durchgearbeitet.'],
  ['11:15', 'Q&A mit Wlad', 'Deine Fragen, direkt beantwortet.'],
];

const FREE_VIDEOS = [
  ['Warum die meisten Führungskräfte unsichtbar bleiben', '8 Min'],
  ['Natürliche Autorität — ohne lauter zu werden', '11 Min'],
  ['Weniger arbeiten, mehr bewirken', '9 Min'],
  ['Dein 30-Tage-Plan zur KI-nativen Führungskraft', '12 Min'],
];

const FRAMEWORK_PEEK = [
  ['SEXIER-Modell', 'Statement · Explanation · eXample · Impact · Explanation of Impact · Rebuttal — die sechsstufige Argumentations-Architektur für strittige Thesen.', '/journal/die-5-argumentations-levels-von-behauptung-bis-sexier'],
  ['Feedbackformel B·W·W', 'Beobachtung + Wirkung + Wunsch. Nie „Du bist…", immer „Ich habe beobachtet, dass…" — das Skript für jedes schwierige Gespräch.', '/journal/die-feedback-formel-bww'],
  ['10 Stufen des Zuhörens', 'Von Stufe 1 (nicht zuhören) bis Stufe 10 (Stille als Zuhören). 80 % aller Führungskräfte hängen auf Stufe 2 fest: auf die eigene Antwort warten.', '/journal/die-10-stufen-des-zuhoerens-wlads-modell-erklaert'],
  ['Die 5 Rollen einer Führungskraft', 'Kommunikator · Manager · Team-Leader · Psychologe · Problemlöser — und warum die meisten eine der fünf systematisch weglassen.', '/journal/5-rollen-der-fuehrung-nach-wlad-jachtchenko'],
];

const LIVE_REASONS = [
  'Keine Aufzeichnung — das Webinar ist bewusst live-only.',
  'Deine Fragen kommen dran, nicht die aus dem Skript.',
  'Ein echter Live-Case wird gemeinsam durchgearbeitet.',
  'Die Videoserie schaltest du als Teilnehmer direkt frei.',
];

const FAQ = [
  ['Kostet das etwas?', 'Nein. Das Webinar ist komplett kostenlos — keine Karte, kein Haken. Du brauchst nur deine E-Mail.'],
  ['Wie lange dauert es?', '90 Minuten — von 10:00 bis etwa 11:30 Uhr, inklusive Live-Q&A.'],
  ['Gibt es eine Aufzeichnung?', 'Nein, das Webinar ist live. Genau deshalb lohnt es sich: du kannst deine Fragen direkt im Q&A stellen.'],
  ['Brauche ich Vorkenntnisse?', 'Nein. Für Führungskräfte und alle, die es werden wollen — Teamleads, Projektmanager, Senior-Experten. Keine KI-Vorkenntnisse nötig.'],
  ['Kann ich Fragen stellen?', 'Ja — das Q&A ist fester Teil der Agenda (ab 11:15 Uhr). Wlad beantwortet live.'],
];

const track = (event, props = {}) => {
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try { window.posthog.capture(event, { surface: 'leader-os', funnel: 'webinar', ...props }); } catch {}
  }
};

/** UTM-Parameter der Anzeige: beim ersten Aufruf aus der URL gemerkt, damit
 * sie auch nach Scrollen/Navigieren im SPA noch am Lead hängen. Landet in
 * `webinar_leads.utm` (routes/webinar.py) — die Grundlage für CPL pro Ad. */
const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'];
const UTM_STORE = 'lo_webinar_utm';
const captureUtm = () => {
  try {
    const q = new URLSearchParams(window.location.search);
    const fresh = Object.fromEntries(UTM_KEYS.map((k) => [k, (q.get(`utm_${k}`) || '').slice(0, 120)]));
    if (Object.values(fresh).some(Boolean)) sessionStorage.setItem(UTM_STORE, JSON.stringify(fresh));
  } catch {}
};
const readUtm = () => {
  try { return JSON.parse(sessionStorage.getItem(UTM_STORE) || 'null'); } catch { return null; }
};

const useCountdown = (target) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
};

// Section-level reveal: opacity + translateY + blur, per the brief.
const REVEAL = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  show: (i = 0) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

// Item-level reveal (no blur — cheaper for long staggered lists).
const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: 0.07 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

/** Mouse-follow glow · a soft lime light that tracks the cursor. Desktop
 * pointer devices only, disabled for prefers-reduced-motion. */
const MouseGlow = () => {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return undefined;
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.background =
          `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, rgba(191,255,0,0.10), transparent 260px)`;
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, [reduced]);

  if (reduced) return null;
  return <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-30" />;
};

/** Primary CTA · pulsing lime glow (the button is never static), spring
 * hover lift. Used for the hero + sticky bar; secondary CTAs stay calm. */
const CtaButton = ({ children, onClick, pulse = false, className = '' }) => {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={pulse && !reduced ? {
        scale: [1, 1.03],
        boxShadow: ['0 0 0 rgba(191,255,0,0)', '0 0 42px rgba(191,255,0,0.45)'],
      } : {}}
      transition={pulse && !reduced ? { duration: 2.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } : {}}
      whileHover={{ y: -3, scale: 1.02, boxShadow: '0 14px 50px rgba(191,255,0,0.5)' }}
      whileTap={{ scale: 0.97 }}
      className={`h-14 px-8 rounded-full bg-[#111111] text-white hover:bg-[#BFFF00] hover:text-[#111111] font-bold text-[13px] uppercase tracking-[0.14em] transition-colors inline-flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </motion.button>
  );
};

/** Inline CTA after a section — objections handled, offer repeated. */
const InlineCta = ({ label = 'Kostenlosen Platz sichern', onClick, caption }) => (
  <motion.div
    initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }} variants={FADE_UP}
    className="mt-10 flex flex-col items-center gap-3"
  >
    <CtaButton onClick={onClick}>{label} <ArrowUpRight size={16} /></CtaButton>
    {caption && (
      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#9e9ea0]">{caption}</p>
    )}
  </motion.div>
);

/** Flip-clock digit pair · each unit flips on change (rotateX + blur). */
const FlipUnit = ({ value, label }) => {
  const reduced = useReducedMotion();
  const display = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center justify-center w-[64px] h-[64px] sm:w-[76px] sm:h-[76px] rounded-2xl bg-white border border-[#111111]/10 shadow-[0_10px_30px_-18px_rgba(17,17,17,0.25)] overflow-hidden" style={{ perspective: 300 }}>
      {reduced ? (
        <span className="tabular-nums leading-none text-[#111111] text-[24px] sm:text-[30px]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>{display}</span>
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            initial={{ rotateX: 90, opacity: 0, filter: 'blur(3px)' }}
            animate={{ rotateX: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ rotateX: -90, opacity: 0, filter: 'blur(3px)' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="tabular-nums leading-none text-[#111111] text-[24px] sm:text-[30px]"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', transformStyle: 'preserve-3d' }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      )}
      <span className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#707072]">{label}</span>
    </div>
  );
};

const Countdown = () => {
  const { d, h, m, s } = useCountdown(WEBINAR_TS);
  return (
    <div className="flex gap-2.5 sm:gap-3" aria-label="Countdown bis zum Webinar">
      <FlipUnit value={d} label="Tage" />
      <FlipUnit value={h} label="Std" />
      <FlipUnit value={m} label="Min" />
      <FlipUnit value={s} label="Sek" />
    </div>
  );
};

/** Real registrant scarcity bar · fetched, never fabricated. */
const ScarcityBar = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/webinar/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data) setStats(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!stats || !stats.max_capacity) return null;
  const pct = Math.min(100, Math.round((stats.registered / stats.max_capacity) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-6 w-full max-w-md"
      data-testid="webinar-scarcity-bar"
    >
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-[#707072] mb-1.5">
        <span>{stats.registered} bereits angemeldet</span>
        <span>{stats.spots_left} Plätze frei</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#111111]/8 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#BFFF00]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </div>
    </motion.div>
  );
};

/** `stacked`: Eingabe und Button untereinander auf jeder Breite — für das
 * 440-px-Formular-Panel im Desktop-Hero, wo nebeneinander nicht passt. */
const RegisterForm = ({ idSuffix = '', compact = false, stacked = false }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [focused, setFocused] = useState(false);
  const valid = isValidEmail(email);

  const submit = async (e) => {
    e.preventDefault();
    if (state === 'loading') return;
    // Der Button ist nie ausgegraut: ein grauer CTA im Hero liest sich wie
    // "geht nicht". Ungültige Eingabe wird beim Absenden erklärt.
    if (!valid) { setState('invalid'); return; }
    setState('loading');
    track('webinar_register_submit', { form: idSuffix || 'default' });
    // Eine ID für Browser-Pixel UND Conversions API → Meta zählt den Lead einmal.
    const eventId = metaEventId();
    try {
      const res = await fetch('/api/webinar/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'webinar-lp',
          utm: readUtm(),
          meta_event_id: eventId,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
          landing_path: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      });
      const data = await res.json().catch(() => null);
      const ok = res.ok && data?.ok;
      track('webinar_register_result', { ok });
      if (ok) {
        trackMeta('Lead', { content_name: 'webinar-2026-10-29', content_category: 'webinar' }, eventId);
        trackLinkedInLead();
        navigate(`/webinar/danke?email=${encodeURIComponent(email)}`);
        return;
      }
      setState('error');
    } catch {
      setState('error');
      track('webinar_register_result', { ok: false });
    }
  };

  const inputH = compact ? 'h-12' : 'h-14';
  const btnH = compact ? 'h-12 px-6' : 'h-14 px-7';

  return (
    <form onSubmit={submit} noValidate data-testid={`webinar-form${idSuffix}`} className="w-full">
      <div className={`flex flex-col gap-3 ${stacked ? '' : 'sm:flex-row'}`}>
        <div className="relative flex-1">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (state === 'invalid') setState('idle'); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Deine beste E-Mail-Adresse"
            aria-label="E-Mail-Adresse"
            className={`w-full ${inputH} px-5 rounded-full bg-white border border-[#111111]/15 focus:border-[#111111] outline-none text-[#111111] text-[15px] placeholder:text-[#9e9ea0] transition-colors shadow-[0_10px_30px_-20px_rgba(17,17,17,0.2)]`}
          />
          {/* Focus underline · scaleX sweep, per the brief's input animation */}
          <motion.span
            aria-hidden
            initial={false}
            animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -bottom-1 left-6 right-6 h-[2px] rounded-full bg-[#BFFF00] origin-left"
          />
        </div>
        <motion.button
          type="submit"
          disabled={state === 'loading'}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className={`${btnH} ${stacked ? 'w-full' : ''} rounded-full bg-[#111111] hover:bg-[#BFFF00] hover:text-[#111111] disabled:opacity-60 disabled:cursor-wait text-white font-bold text-[13px] uppercase tracking-[0.14em] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap`}
        >
          {state === 'loading' ? 'Wird reserviert…' : 'Jetzt kostenlos anmelden'}
          {state !== 'loading' && <ArrowUpRight size={16} />}
        </motion.button>
      </div>
      {!compact && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#707072]">
          Keine Kreditkarte · 100 % kostenlos · live · keine Aufzeichnung
          {state === 'invalid' && (
            <span className="block mt-1.5 tracking-normal normal-case text-[12px] text-red-600" role="alert">
              Bitte eine gültige E-Mail-Adresse eingeben.
            </span>
          )}
          {state === 'error' && (
            <span className="block mt-1.5 tracking-normal normal-case text-[12px] text-red-600" role="alert">
              Das hat nicht geklappt — bitte E-Mail prüfen und erneut senden.
            </span>
          )}
        </p>
      )}
      {compact && state === 'invalid' && (
        <p className="mt-2 text-[11.5px] text-red-600" role="alert">Bitte eine gültige E-Mail-Adresse eingeben.</p>
      )}
      {compact && state === 'error' && (
        <p className="mt-2 text-[11.5px] text-red-600" role="alert">Bitte E-Mail prüfen und erneut senden.</p>
      )}
    </form>
  );
};

/** Sticky CTA bar · slides in from ~20 % scroll depth on every breakpoint.
 * Compact email capture on sm+, button-only on phones. */
const TransparentHeader = ({ onCta }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const ink = scrolled;
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      data-testid="webinar-header"
      className={`hidden min-[900px]:block fixed inset-x-0 top-0 z-30 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        ink ? 'bg-white/85 backdrop-blur-md border-b border-[#111111]/8' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" aria-label="LeaderOS Startseite">
          <WladMark size={30} variant={ink ? 'solid' : 'outline'} />
          <span
            className={`font-black tracking-tight text-[19px] transition-colors ${ink ? 'text-[#111111]' : 'text-white'}`}
            style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}
          >
            Leader<span className={ink ? 'text-[#5A7700]' : 'text-[#BFFF00]'}>·</span>OS
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <motion.span
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] ${
              ink ? 'bg-[#BFFF00]/25 text-[#111111]' : 'bg-white/10 text-white border border-white/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${ink ? 'bg-[#111111]' : 'bg-[#BFFF00]'}`} />
            {DATE_LINE_SHORT}
          </motion.span>
          <button
            type="button"
            onClick={onCta}
            className={`inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-[11.5px] font-bold uppercase tracking-[0.14em] transition-colors ${
              ink ? 'bg-[#111111] text-white hover:bg-[#333]' : 'bg-white text-[#111111] hover:bg-[#BFFF00]'
            }`}
          >
            Platz sichern <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </motion.header>
  );
};

const StickyCtaBar = ({ onCtaClick }) => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => setVisible(v > 0.2 && v < 0.96));
    return () => unsub();
  }, [scrollYProgress]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#111111]/10 shadow-[0_-12px_40px_-20px_rgba(17,17,17,0.3)]"
          data-testid="webinar-sticky-cta"
        >
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
            <div className="hidden md:block shrink-0">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#5A7700]">▸ Kostenloses Live-Webinar</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#707072] mt-0.5">29. Oktober · 10 Uhr · Live</p>
            </div>
            <div className="hidden sm:block flex-1">
              <RegisterForm idSuffix="-sticky" compact />
            </div>
            <div className="sm:hidden flex-1">
              <button
                onClick={onCtaClick}
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#111111] text-white font-bold text-[12.5px] uppercase tracking-[0.14em]"
              >
                Jetzt Platz sichern <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** Centered section header · balanced type, blur reveal. */
const SectionHeader = ({ eyebrow, headline, intro }) => (
  <div className="text-center mb-10 md:mb-12">
    <motion.p
      initial="hidden" whileInView="show" viewport={{ once: true }} variants={FADE_UP}
      className="font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] mb-3 text-[#5A7700]"
    >
      {eyebrow}
    </motion.p>
    <motion.h2
      initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} variants={REVEAL}
      className="text-balance mx-auto max-w-3xl text-[32px] sm:text-[44px] md:text-[52px] leading-[1.04] tracking-[-0.035em] text-[#111111]"
      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
    >
      {headline}
    </motion.h2>
    {intro && (
      <motion.p
        initial="hidden" whileInView="show" viewport={{ once: true }} custom={2} variants={FADE_UP}
        className="text-balance mx-auto mt-5 max-w-2xl text-[17px] md:text-[19px] leading-[1.6] text-[#4b4b4d]"
      >
        {intro}
      </motion.p>
    )}
  </div>
);

/** Full-bleed ink statement band. */
const StatementBand = ({ eyebrow, children }) => (
  <section className="bg-[#111111]">
    <div className="max-w-[900px] mx-auto px-5 md:px-10 py-14 md:py-20 text-center">
      {eyebrow && (
        <motion.p
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={FADE_UP}
          className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-[#BFFF00] mb-5"
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.p
        initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} variants={REVEAL}
        className="text-balance text-[26px] sm:text-[38px] md:text-[46px] leading-[1.08] tracking-[-0.03em] text-white"
        style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
      >
        {children}
      </motion.p>
    </div>
  </section>
);

/** FAQ accordion · height + opacity + blur, one open at a time. */
const FaqAccordion = () => {
  const [open, setOpen] = useState(0);
  return (
    <dl className="space-y-3 max-w-2xl mx-auto">
      {FAQ.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={q}
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }} custom={i} variants={FADE_UP}
            className={`rounded-2xl bg-[#fafafa] border transition-colors ${isOpen ? 'border-[#BFFF00]' : 'border-[#111111]/8'}`}
          >
            <dt>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-[16px] leading-[1.3] text-[#111111]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>{q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="shrink-0 inline-flex w-7 h-7 items-center justify-center rounded-full bg-[#BFFF00] text-[#111111]"
                >
                  <Plus size={15} strokeWidth={3} />
                </motion.span>
              </button>
            </dt>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.dd
                  initial={{ height: 0, opacity: 0, filter: 'blur(4px)' }}
                  animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
                  exit={{ height: 0, opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-[14.5px] leading-[1.6] text-[#707072]">{a}</p>
                </motion.dd>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </dl>
  );
};

/** Wlad portrait with subtle scroll parallax (translateY + scale + rotate). */
const ParallaxPortrait = () => {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [36, -36]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-1.2, 1.2]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.02, 1, 1.02]);

  return (
    <div ref={ref} className="rounded-3xl overflow-hidden border border-[#111111]/10 shadow-[0_30px_60px_-35px_rgba(17,17,17,0.35)]">
      <motion.img
        style={reduced ? {} : { y, rotate, scale }}
        src={WLAD_AVATAR}
        onError={withFallback(WLAD_AVATAR_FALLBACKS)}
        alt="Wlad Jachtchenko · Host des Webinars"
        loading="lazy"
        className="w-full aspect-[4/5] object-cover object-top"
      />
    </div>
  );
};

export default function WebinarPage() {
  const formRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    captureUtm();
    track('webinar_view');
    trackMeta('ViewContent', { content_name: 'webinar-2026-10-29', content_category: 'webinar' });

    const restoreMeta = applyPageMeta({
      title: 'Kostenloses Live-Webinar · Trainiere Führung. Nicht nur Wissen. · LeaderOS',
      description:
        'Du weißt, wie gute Führung geht — du kommst nur nicht dazu. Live-Webinar am 29.10.2026 mit ' +
        'Wlad Jachtchenko (3× SPIEGEL-Bestseller): das erste Leadership Operating System, das Führung ' +
        'täglich in 15 Minuten trainierbar macht statt einmal im Jahr im Seminar. Kostenlos, live, mit Q&A.',
      url: 'https://leader-os.de/webinar',
      image: 'https://leader-os.de/og-wlad.jpg',
    });

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'Führe besser. Jeden Tag. · Das kostenlose LeaderOS Live-Webinar',
      startDate: '2026-10-29T10:00:00+01:00',
      endDate: '2026-10-29T11:30:00+01:00',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'VirtualLocation', url: 'https://leader-os.de/webinar' },
      image: ['https://leader-os.de/og-wlad.jpg'],
      description: 'Kostenloses Live-Webinar: das Leadership Operating System für Führungskräfte.',
      organizer: { '@type': 'Organization', name: 'LeaderOS', url: 'https://leader-os.de' },
      performer: { '@type': 'Person', name: 'Wlad Jachtchenko' },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: 'https://leader-os.de/webinar', validFrom: '2026-07-04T00:00:00+02:00' },
    });
    document.head.appendChild(ld);

    const ldFaq = document.createElement('script');
    ldFaq.type = 'application/ld+json';
    ldFaq.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
    document.head.appendChild(ldFaq);

    return () => { restoreMeta(); ld.remove(); ldFaq.remove(); if (wasDark) root.classList.add('dark'); };
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div className="bg-white text-[#111111] min-h-[100dvh] antialiased" data-testid="webinar-page">
      <MouseGlow />

      {/* Squeeze chrome · transparent over the hero video, frosted white once
          the hero is scrolled away. No nav exits. Mobile has its own header
          row inside CinematicHero, so this one only renders from 900 px up. */}
      <TransparentHeader onCta={scrollToForm} />

      <main id="main-content">
        {/* ── HOOK · headline → sub → CTA → trust → product ────────────── */}
        {/* ── HERO · Wlad als Vollbild, Headline ins Bild gebrannt ──────
            Desktop: Kopie links, Formular-Panel rechts — beides im ersten
            Viewport. Mobil: ein Vollbild-Screen mit Termin, Dauer, 0 € und
            CTA, Formular direkt darunter. Siehe components/webinar/CinematicHero.js. */}
        <CinematicHero
          onCta={scrollToForm}
          formSlot={(
            <div ref={formRef} className="scroll-mt-24 text-left" data-testid="webinar-form-block">
              <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#5A7700] text-center whitespace-nowrap">
                {DATE_LINE_SHORT}
              </p>
              <div className="mt-4 flex justify-center"><Countdown /></div>
              <div className="w-full flex flex-col items-center"><ScarcityBar /></div>
              <div className="mt-6 w-full"><RegisterForm idSuffix="-hero" stacked /></div>
            </div>
          )}
        />

        {/* ── BEWEIS · stats, press, clients — staggered in ────────────── */}
        <section className="border-t border-[#111111]/8 bg-white">
          <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-10 md:py-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 mb-10">
              {STATS.map(([value, label], i) => (
                <motion.div
                  key={label}
                  initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }} custom={i} variants={FADE_UP}
                  className="text-center"
                >
                  <div className="text-[24px] sm:text-[28px] text-[#111111]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
                    <CountUpValue value={value} /><span className="text-[#5A7700] not-italic">.</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#707072]">{label}</div>
                </motion.div>
              ))}
            </div>
            <div className="border-t border-[#111111]/8 pt-7 text-center">
              <motion.p
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={FADE_UP}
                className="font-mono text-[9.5px] font-bold uppercase tracking-[0.24em] text-[#9e9ea0] mb-4"
              >
                ▸ Bekannt aus
              </motion.p>
              <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5">
                {MEDIA.map((m, i) => (
                  <motion.li
                    key={m}
                    initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }} custom={i} variants={FADE_UP}
                    className="font-mono text-[12px] md:text-[13px] font-bold uppercase tracking-[0.14em] text-[#4b4b4d]"
                  >
                    {m}
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="border-t border-[#111111]/8 mt-7 pt-7 text-center">
              <motion.p
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={FADE_UP}
                className="font-mono text-[9.5px] font-bold uppercase tracking-[0.24em] text-[#9e9ea0] mb-4"
              >
                ▸ Führungskräfte dieser Unternehmen haben Wlads Trainings durchlaufen
              </motion.p>
              <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5">
                {CLIENTS.map((c, i) => (
                  <motion.li
                    key={c}
                    initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }} custom={i * 0.6} variants={FADE_UP}
                    className="font-mono text-[12px] md:text-[13px] font-bold uppercase tracking-[0.14em] text-[#707072]"
                  >
                    {c}
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2">
                {REVIEW_PLATFORMS.map(([name, rating, count, href]) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[12.5px] text-[#4b4b4d] hover:text-[#111111] transition-colors"
                  >
                    <Star size={13} className="text-[#111111] fill-[#BFFF00]" />
                    <span className="font-bold text-[#111111]">{rating}/5</span> {name} · {count} <ArrowUpRight size={11} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PROBLEM · the week as a scroll story ─────────────────────── */}
        <section className="bg-[#fafafa] border-t border-[#111111]/8">
          <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <SectionHeader
              eyebrow="▸ Das Problem"
              headline={<>Du weißt längst, wie gute Führung geht. Du kommst nur nicht dazu, sie zu leben<span className="text-[#5A7700] not-italic">.</span></>}
              intro="Du weißt, wie man Feedback gibt und Konflikte früh anspricht. Trotzdem passiert es im Alltag selten, denn Wissen wird erst durch Training zu Verhalten. Die Woche unten kennst du vermutlich auswendig."
            />
            <div className="max-w-2xl mx-auto relative">
              {/* Timeline spine */}
              <span aria-hidden className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-[#111111]/10 hidden sm:block" />
              <ol className="space-y-4">
                {WEEK.map(([day, text, isPunchline], i) => (
                  <motion.li
                    key={day}
                    initial={{ opacity: 0, x: -24, filter: 'blur(6px)' }}
                    whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.55, delay: 0.18 * i, ease: [0.16, 1, 0.3, 1] }}
                    className={`sm:ml-9 relative flex items-start gap-4 rounded-2xl px-5 py-4 border ${isPunchline ? 'bg-[#111111] border-[#111111]' : 'bg-white border-[#111111]/8'}`}
                  >
                    <span aria-hidden className={`hidden sm:block absolute -left-[32px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full ring-4 ring-[#fafafa] ${isPunchline ? 'bg-[#111111]' : 'bg-[#BFFF00]'}`} />
                    <span className={`shrink-0 w-24 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] pt-0.5 ${isPunchline ? 'text-[#BFFF00]' : 'text-[#5A7700]'}`}>{day}</span>
                    <span className={`text-[14.5px] leading-[1.5] ${isPunchline ? 'text-white font-semibold' : 'text-[#39393b]'}`}>{text}</span>
                  </motion.li>
                ))}
              </ol>
            </div>
            <InlineCta onClick={scrollToForm} label="Live dabei sein" caption="▸ 29. Oktober · 10 Uhr · kostenlos" />
          </div>
        </section>

        <StatementBand>
          Seminare verändern Wissen,<br />noch kein Verhalten<span className="text-[#BFFF00] not-italic">.</span>
        </StatementBand>

        {/* ── NEUE OPPORTUNITY · gray-out vs light-up ──────────────────── */}
        <section className="bg-white">
          <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <SectionHeader
              eyebrow="▸ Die neue Möglichkeit"
              headline={<>Führung ist trainierbar wie Fitness<span className="text-[#5A7700] not-italic">.</span></>}
            />
            
            {/* THE graphic: old way grays out, LeaderOS lights up */}
            <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
              <motion.div
                initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} variants={REVEAL}
                className="rounded-3xl border border-[#111111]/10 bg-[#fafafa] p-7"
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#9e9ea0] mb-5 flex items-center gap-2">
                  <X size={13} className="text-red-500" /> Der alte Weg
                </p>
                <ol className="space-y-2">
                  {SEMINAR_FLOW.map((step, i) => (
                    <motion.li
                      key={step}
                      initial={{ opacity: 1, filter: 'grayscale(0)' }}
                      whileInView={{ opacity: 0.42, filter: 'grayscale(1)' }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ duration: 0.6, delay: 0.35 + 0.28 * i }}
                      className="flex flex-col items-start"
                    >
                      <span className={`text-[15.5px] font-bold ${i === SEMINAR_FLOW.length - 1 ? 'text-red-600' : 'text-[#4b4b4d]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>{step}</span>
                      {i < SEMINAR_FLOW.length - 1 && <ArrowDown size={13} className="text-[#9e9ea0] my-1 ml-1" />}
                    </motion.li>
                  ))}
                </ol>
              </motion.div>
              <motion.div
                initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} custom={1} variants={REVEAL}
                className="rounded-3xl border-2 border-[#BFFF00] bg-white p-7 shadow-[0_24px_50px_-30px_rgba(17,17,17,0.3)]"
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#5A7700] mb-5 flex items-center gap-2">
                  <Check size={13} strokeWidth={3} /> Mit LeaderOS
                </p>
                <ol className="space-y-2">
                  {OS_FLOW.map((step, i) => (
                    <motion.li
                      key={step}
                      initial={{ opacity: 0.3 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ duration: 0.5, delay: 0.35 + 0.24 * i }}
                      className="flex flex-col items-start"
                    >
                      <motion.span
                        initial={{ textShadow: '0 0 0px rgba(191,255,0,0)' }}
                        whileInView={{ textShadow: ['0 0 0px rgba(191,255,0,0)', '0 0 18px rgba(191,255,0,0.9)', '0 0 0px rgba(191,255,0,0)'] }}
                        viewport={{ once: true, amount: 0.8 }}
                        transition={{ duration: 1.1, delay: 0.35 + 0.24 * i }}
                        className={`text-[15.5px] font-bold ${i === OS_FLOW.length - 1 ? 'text-[#5A7700]' : 'text-[#111111]'}`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {step}
                      </motion.span>
                      {i < OS_FLOW.length - 1 && <ArrowDown size={13} className="text-[#5A7700] my-1 ml-1" />}
                    </motion.li>
                  ))}
                </ol>
              </motion.div>
            </div>
            <InlineCta onClick={scrollToForm} caption="▸ Keine Kreditkarte · jederzeit abmeldbar" />
          </div>
        </section>

        {/* ── MECHANISMUS · learn cards ────────────────────────────────── */}
        <section className="bg-[#fafafa] border-t border-[#111111]/8">
          <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <SectionHeader
              eyebrow="▸ Inhalte"
              headline={<>Das lernst du in 90 Minuten<span className="text-[#5A7700] not-italic">.</span></>}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {LEARN_CARDS.map(([title, desc], i) => (
                <motion.div
                  key={title}
                  initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} custom={i} variants={FADE_UP}
                  whileHover={{ y: -5, scale: 1.015 }}
                  className="rounded-3xl bg-white border border-[#111111]/8 hover:border-[#BFFF00] p-6 transition-colors shadow-none hover:shadow-[0_24px_50px_-28px_rgba(191,255,0,0.55)]"
                >
                  <motion.span whileHover={{ rotate: 10, scale: 1.12 }} className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[#BFFF00] text-[#111111] mb-4">
                    <Check size={15} strokeWidth={3} />
                  </motion.span>
                  <h3 className="text-[17px] text-[#111111] mb-1.5" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>{title}</h3>
                  <p className="text-[13.5px] leading-[1.55] text-[#707072]">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <StatementBand eyebrow="▸ Warum jetzt">
          Wer täglich trainiert, überholt jeden, der einmal im Jahr ins Seminar geht<span className="text-[#BFFF00] not-italic">.</span>
        </StatementBand>

        {/* ── DETAILS · agenda, scroll-activated ───────────────────────── */}
        <section className="bg-white">
          <div className="max-w-[820px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <SectionHeader
              eyebrow="▸ Der genaue Ablauf · 90 Minuten"
              headline={<>Die Agenda, Minute für Minute<span className="text-[#5A7700] not-italic">.</span></>}
            />
            <ol className="relative border-l-2 border-[#111111]/10 ml-3 space-y-0 max-w-xl mx-auto">
              {AGENDA.map(([time, title, desc], i) => (
                <motion.li
                  key={time}
                  initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }} custom={i} variants={FADE_UP}
                  className="relative pl-8 pb-8 last:pb-0"
                >
                  {/* Dot activates (scale + glow) as the row scrolls in */}
                  <motion.span
                    aria-hidden
                    initial={{ scale: 0.5, backgroundColor: '#e5e5e5', boxShadow: '0 0 0 rgba(191,255,0,0)' }}
                    whileInView={{ scale: 1, backgroundColor: '#BFFF00', boxShadow: '0 0 16px rgba(191,255,0,0.8)' }}
                    viewport={{ once: true, amount: 0.9 }}
                    transition={{ duration: 0.45, delay: 0.15 }}
                    className="absolute -left-[9px] top-1 w-4 h-4 rounded-full ring-4 ring-white"
                  />
                  <span className="font-mono text-[12px] font-bold text-[#5A7700] tabular-nums">{time}</span>
                  <p className="mt-0.5 text-[16.5px] font-bold text-[#111111]" style={{ fontFamily: 'Outfit, sans-serif' }}>{title}</p>
                  <p className="mt-0.5 text-[14px] leading-[1.55] text-[#707072]">{desc}</p>
                </motion.li>
              ))}
            </ol>
            <InlineCta onClick={scrollToForm} label="Live dabei sein" caption="▸ 90 Minuten · Live-Q&A inklusive" />
          </div>
        </section>

        {/* ── VALUE STACK ──────────────────────────────────────────────── */}
        <section className="bg-[#fafafa] border-t border-[#111111]/8">
          <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <SectionHeader
              eyebrow="▸ Value Stack"
              headline={<>Im Webinar bekommst du Zugriff auf<span className="text-[#5A7700] not-italic">:</span></>}
              intro="Andere verlangen für weniger ein Ticket. Du bekommst alles hier für nichts außer deiner E-Mail-Adresse."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {VALUE_STACK.map(([Icon, title, desc], i) => (
                <motion.div
                  key={title}
                  initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} custom={i} variants={FADE_UP}
                  whileHover={{ y: -4, scale: 1.015 }}
                  className="group flex items-start gap-4 rounded-3xl bg-white border border-[#111111]/8 hover:border-[#BFFF00] p-6 transition-colors hover:shadow-[0_24px_50px_-28px_rgba(191,255,0,0.55)]"
                >
                  <motion.span
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="inline-flex w-11 h-11 shrink-0 items-center justify-center rounded-2xl bg-[#BFFF00]/25 text-[#111111] transition-transform group-hover:scale-105"
                  >
                    <Icon size={20} />
                  </motion.span>
                  <div>
                    <h3 className="text-[15.5px] text-[#111111] mb-1" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>{title}</h3>
                    <p className="text-[13px] leading-[1.55] text-[#707072]">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <InlineCta onClick={scrollToForm} />
          </div>
        </section>

        {/* ── REVEAL · die 4 kostenlosen Videos ────────────────────────── */}
        <section className="bg-white border-t border-[#111111]/8">
          <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <SectionHeader
              eyebrow="▸ Teilnehmer-Bonus"
              headline={<>Dazu: die 4-teilige Videoserie<span className="text-[#5A7700] not-italic">.</span></>}
              intro={'„Führung beginnt hier" — vier Videos von Wlad, ein Video pro Tag in dein Postfach. Als Webinar-Teilnehmer schaltest du die Serie direkt auf der Bestätigungsseite frei, damit du vorbereitet in den Termin gehst.'}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {FREE_VIDEOS.map(([title, duration], i) => (
                <motion.div
                  key={title}
                  initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} custom={i} variants={FADE_UP}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="rounded-3xl bg-[#fafafa] border border-[#111111]/8 hover:border-[#BFFF00] p-6 transition-colors hover:shadow-[0_24px_50px_-28px_rgba(191,255,0,0.55)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-[#111111] text-[#BFFF00] text-[14px] font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>{i + 1}</span>
                    <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#9e9ea0]">{duration}</span>
                  </div>
                  <h3 className="text-[15px] leading-[1.3] text-[#111111]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>{title}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ÜBER WLAD · Story mit Parallax-Portrait ──────────────────── */}
        <section className="bg-[#fafafa] border-t border-[#111111]/8">
          <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-16 md:py-20 grid md:grid-cols-12 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-4"
            >
              <ParallaxPortrait />
            </motion.div>
            <div className="md:col-span-8">
              <motion.p
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={FADE_UP}
                className="font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-[#5A7700] mb-3"
              >
                ▸ Dein Host · die Geschichte
              </motion.p>
              <motion.h2
                initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} variants={REVEAL}
                className="text-balance text-[32px] sm:text-[44px] leading-[1.05] tracking-[-0.035em] text-[#111111] mb-5"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
              >
                Warum es LeaderOS gibt<span className="text-[#5A7700] not-italic">.</span>
              </motion.h2>
              <motion.div
                initial="hidden" whileInView="show" viewport={{ once: true }} custom={2} variants={FADE_UP}
                className="space-y-4 text-[16px] md:text-[17px] leading-[1.65] text-[#4b4b4d] max-w-2xl"
              >
                <p>
                  Wlad Jachtchenko hat als UNO-Assistent gearbeitet, in München und an der
                  Columbia University studiert und sich durch die K.-o.-Runden der europäischen
                  Debating-Meisterschaften argumentiert. Seit 2007 trainiert er Führungskräfte —
                  über 400.000 Klienten, 13 Bücher, drei davon SPIEGEL-Bestseller.
                </p>
                <p>
                  Und irgendwann fiel ihm auf: Das Problem seiner Klienten war fast nie fehlendes
                  Wissen. Nach jedem Seminar wussten alle, was zu tun ist. Sechs Wochen später
                  war das Verhalten das alte. Wissen wird gelehrt — Verhalten wird trainiert.
                </p>
                <p>
                  Genau dafür hat er mit seinem Team LeaderOS gebaut: seine komplette Methodik
                  als tägliches Trainingssystem, mit einem KI-Coach, der seine 13 Bücher, Kurse
                  und Vorträge kennt. Im Webinar zeigt er das System zum ersten Mal live — und
                  beantwortet deine Fragen persönlich.
                </p>
              </motion.div>
              <motion.ul
                initial="hidden" whileInView="show" viewport={{ once: true }} custom={3} variants={FADE_UP}
                className="mt-6 flex flex-wrap gap-2.5"
              >
                {['Seit 2007 im Coaching', '3× SPIEGEL-Bestseller', '3× TEDx', 'Gründer Argumentorik-Akademie'].map((chip) => (
                  <li key={chip} className="rounded-full bg-white border border-[#111111]/10 px-4 py-2 text-[12.5px] font-semibold text-[#39393b]">
                    {chip}
                  </li>
                ))}
              </motion.ul>
              <InlineCta onClick={scrollToForm} label="Live dabei sein" />
            </div>
          </div>
        </section>

        <StatementBand eyebrow="▸ Wlads Kernsatz">
          „Führung ist Fähigkeit. Fähigkeit ist trainierbar<span className="text-[#BFFF00] not-italic">.</span>"
          <span className="block mt-5 font-mono not-italic text-[10px] font-bold uppercase tracking-[0.26em] text-white/50">— Wlad Jachtchenko</span>
        </StatementBand>

        {/* ── BEWEIS II · framework cards ──────────────────────────────── */}
        <section className="bg-white">
          <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <SectionHeader
              eyebrow="▸ Die Methodik dahinter"
              headline={<>Ein Vorgeschmack auf Wlads Frameworks<span className="text-[#5A7700] not-italic">.</span></>}
              intro="Vier der Frameworks aus Wlads Büchern stehen hier offen, exakt so, wie sie im Webinar und in LeaderOS trainiert werden. Zum Nachlesen verlinkt; das Können kommt aus dem Drill."
            />
            <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
              {FRAMEWORK_PEEK.map(([name, def, href], i) => (
                <motion.div
                  key={name}
                  initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} custom={i} variants={FADE_UP}
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="group rounded-3xl bg-[#fafafa] border border-[#111111]/8 hover:border-[#BFFF00] p-7 transition-colors hover:shadow-[0_24px_50px_-28px_rgba(191,255,0,0.55)]"
                >
                  <motion.span whileHover={{ rotate: 8, scale: 1.1 }} className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-[#BFFF00] text-[#111111] mb-4">
                    <BookOpen size={16} />
                  </motion.span>
                  <h3 className="text-[17.5px] text-[#111111] mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>{name}</h3>
                  <p className="text-[14px] leading-[1.6] text-[#4b4b4d] mb-4">{def}</p>
                  <Link
                    to={href}
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#5A7700] hover:text-[#111111] transition-colors"
                  >
                    Zum Deep-Dive im Journal
                    <span className="transition-transform group-hover:translate-x-1"><ArrowUpRight size={11} /></span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ECHTE SCARCITY ───────────────────────────────────────────── */}
        <section className="bg-[#fafafa] border-t border-[#111111]/8">
          <div className="max-w-[820px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <SectionHeader
              eyebrow="▸ Warum live dabei sein"
              headline={<>Vier ehrliche Gründe<span className="text-[#5A7700] not-italic">.</span></>}
            />
            <ol className="space-y-3 mb-8 max-w-2xl mx-auto">
              {LIVE_REASONS.map((reason, i) => (
                <motion.li
                  key={reason}
                  initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }} custom={i} variants={FADE_UP}
                  className="flex items-start gap-4 rounded-2xl bg-white border border-[#111111]/8 px-5 py-4"
                >
                  <span className="shrink-0 inline-flex w-7 h-7 items-center justify-center rounded-full bg-[#BFFF00] text-[#111111] text-[13px] font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>{i + 1}</span>
                  <span className="text-[15px] leading-[1.5] text-[#39393b] pt-0.5">{reason}</span>
                </motion.li>
              ))}
            </ol>
            <motion.p
              initial="hidden" whileInView="show" viewport={{ once: true }} custom={4} variants={FADE_UP}
              className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#9e9ea0] leading-[1.7]"
            >
              ▸ Du findest hier keinen „Nur noch 18 Plätze!"-Zähler. Die Kapazität oben ist echt —
              sie kommt live aus der Anmelde-Datenbank.
            </motion.p>
          </div>
        </section>

        {/* ── FAQ · animated accordion ─────────────────────────────────── */}
        <section className="bg-white border-t border-[#111111]/8">
          <div className="max-w-[820px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <SectionHeader
              eyebrow="▸ Häufige Fragen"
              headline={<>Kurz beantwortet<span className="text-[#5A7700] not-italic">.</span></>}
            />
            <FaqAccordion />
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden border-t border-[#111111]/8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundImage:
                'radial-gradient(at 50% 100%, rgba(191,255,0,0.18) 0px, transparent 55%), ' +
                'linear-gradient(#ffffff, #fafafa)',
            }}
          />
          <div className="max-w-[860px] mx-auto px-5 md:px-10 py-16 md:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-balance text-[30px] sm:text-[44px] md:text-[52px] leading-[1.05] tracking-[-0.035em] text-[#111111]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
                In einem Jahr wirst du sowieso geführt haben.
                Die einzige Frage: mit System — oder mit Bauchgefühl<span className="text-[#5A7700] not-italic">?</span>
              </h2>
              <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#707072] flex items-center justify-center gap-1.5">
                <Star size={11} className="text-[#5A7700] fill-[#BFFF00]" /> {DATE_LINE}
              </p>
            </motion.div>
            <div className="mt-8 flex justify-center"><Countdown /></div>
            <div className="mt-8 max-w-xl mx-auto text-left">
              <RegisterForm idSuffix="-final" />
            </div>
            <p className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#9e9ea0]">
              ▸ Kalender-Einladung kommt sofort per Mail · Erinnerung vor dem Start
            </p>
          </div>
        </section>
      </main>

      <StickyCtaBar onCtaClick={scrollToForm} />

      {/* Squeeze footer · legal only. The full site footer (40 links, pricing,
          newsletter) is a nav exit on a page whose single job is the form. */}
      <footer className="bg-[#111111] text-white" data-testid="webinar-footer">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5" aria-label="LeaderOS Startseite">
            <WladMark size={26} variant="outline" />
            <span className="font-black tracking-tight text-[15px]" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>
              Leader<span className="text-[#BFFF00]">·</span>OS
            </span>
          </Link>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/45 text-center">
            © 2026 LeaderOS · Wlad Jachtchenko · 400.000+ Klienten · 20 Länder
          </p>
          <nav className="flex items-center gap-4 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/60">
            <Link to="/impressum" className="hover:text-white">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-white">Datenschutz</Link>
            <Link to="/agb" className="hover:text-white">AGB</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Animated stat counter · counts up once when scrolled into view. */
function CountUpValue({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const numeric = /^[\d.]+\+?$/.test(value.replace(/\./g, ''))
    ? parseInt(value.replace(/[^\d]/g, ''), 10)
    : null;
  const [display, setDisplay] = useState(numeric === null ? value : '0');

  useEffect(() => {
    if (!inView || numeric === null) return undefined;
    const started = performance.now();
    const dur = 1200;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - started) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const n = Math.round(numeric * eased);
      setDisplay(n.toLocaleString('de-DE') + (value.includes('+') ? '+' : ''));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, numeric, value]);

  return <span ref={ref} className="tabular-nums">{numeric === null ? value : display}</span>;
}
