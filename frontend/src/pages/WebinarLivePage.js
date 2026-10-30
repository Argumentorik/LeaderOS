import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Calendar, Check, MailCheck } from 'lucide-react';
import { LandingFooter } from '../components/landing/LandingFooter';
import { applyPageMeta } from '../lib/pageMeta';
import { isValidEmail } from '../features/newsletter/lib/newsletterClient';
import { WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, withFallback } from '../lib/brandAssets';
import { WladMark } from '../components/brand/WladMark';
import { AGENDA, WEBINAR_DATE_LABEL, WEBINAR_END, WEBINAR_START, WEBINAR_TIME_LABEL, WEBINAR_TS } from '../data/webinarEvent';

/**
 * WebinarLivePage · /webinar/live · the waiting room.
 *
 * The reminder emails (routes/webinar.py) link to WEBINAR_JOIN_URL — point
 * that env var here so every "join" click lands on a page that:
 *   · before the webinar: shows the countdown, the agenda and an
 *     add-to-calendar button, plus a late-registration form for people
 *     who got the link forwarded but never opted in (source: webinar-live)
 *   · on the day: tells registrants exactly where the Zoom link lives
 *     (their 1h-reminder email) — honest, no dead "join" button
 *
 * Light theme, same center axis as /webinar.
 */

// Termin und Agenda kommen aus data/webinarEvent.js, damit der Warteraum
// nie ein anderes Datum nennt als /webinar.
const DATE_LINE = `${WEBINAR_DATE_LABEL.replace(',', '')} · ${WEBINAR_TIME_LABEL} · LIVE · ONLINE`.toUpperCase();

const googleCalendarUrl = () => {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const details = encodeURIComponent(
    'Live-Webinar: das Leadership Operating System für Führungskräfte.\n\nWarteraum: https://leader-os.de/webinar/live'
  );
  return (
    'https://www.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent('Führe besser. Jeden Tag. · Live-Webinar') +
    `&dates=${fmt(new Date(WEBINAR_START))}/${fmt(new Date(WEBINAR_END))}` +
    `&details=${details}` +
    '&location=' + encodeURIComponent('Online — LeaderOS')
  );
};

const track = (event, props = {}) => {
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try { window.posthog.capture(event, { surface: 'leader-os', funnel: 'webinar', ...props }); } catch {}
  }
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
    live: diff === 0,
  };
};

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

const LateRegisterForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const valid = isValidEmail(email);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || state === 'loading') return;
    setState('loading');
    track('webinar_register_submit', { source: 'webinar-live' });
    try {
      const res = await fetch('/api/webinar/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'webinar-live',
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
          landing_path: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      });
      const data = await res.json().catch(() => null);
      const ok = res.ok && data?.ok;
      track('webinar_register_result', { ok, source: 'webinar-live' });
      if (ok) {
        navigate(`/webinar/danke?email=${encodeURIComponent(email)}`);
        return;
      }
      setState('error');
    } catch {
      setState('error');
      track('webinar_register_result', { ok: false, source: 'webinar-live' });
    }
  };

  return (
    <form onSubmit={submit} noValidate data-testid="webinar-live-form" className="w-full max-w-xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Deine beste E-Mail-Adresse"
          aria-label="E-Mail-Adresse"
          className="flex-1 h-14 px-5 rounded-full bg-white border border-[#111111]/15 focus:border-[#111111] outline-none text-[#111111] text-[15px] placeholder:text-[#9e9ea0] transition-colors shadow-[0_10px_30px_-20px_rgba(17,17,17,0.2)]"
        />
        <motion.button
          type="submit"
          disabled={!valid || state === 'loading'}
          whileHover={valid ? { y: -2 } : {}}
          whileTap={valid ? { scale: 0.97 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className="h-14 px-7 rounded-full bg-[#111111] hover:bg-[#BFFF00] hover:text-[#111111] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[13px] uppercase tracking-[0.14em] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {state === 'loading' ? 'Wird reserviert…' : 'Jetzt noch anmelden'}
          {state !== 'loading' && <ArrowUpRight size={16} />}
        </motion.button>
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#707072] text-center">
        Keine Kreditkarte · 100 % kostenlos · live
        {state === 'error' && (
          <span className="block mt-1.5 tracking-normal normal-case text-[12px] text-red-600">
            Das hat nicht geklappt — bitte E-Mail prüfen und erneut senden.
          </span>
        )}
      </p>
    </form>
  );
};

export default function WebinarLivePage() {
  const { d, h, m, s, live } = useCountdown(WEBINAR_TS);

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    track('webinar_live_view');

    const restoreMeta = applyPageMeta({
      title: 'Warteraum · Live-Webinar · LeaderOS',
      description: 'Der Warteraum zum kostenlosen LeaderOS Live-Webinar am 26.11.2026 — Countdown, Ablauf und dein Teilnahme-Link.',
      url: 'https://leader-os.de/webinar/live',
      image: 'https://leader-os.de/og-wlad.jpg',
    });

    return () => { restoreMeta(); if (wasDark) root.classList.add('dark'); };
  }, []);

  return (
    <div className="bg-white text-[#111111] min-h-[100dvh] antialiased" data-testid="webinar-live-page">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-[1100px] mx-auto px-5 md:px-10 pt-6 flex items-center justify-between"
      >
        <Link to="/" className="flex items-center gap-3" aria-label="LeaderOS Startseite">
          <WladMark size={34} />
          <span className="font-black tracking-tight text-[#111111] text-[19px]" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>
            Leader<span className="text-[#5A7700] mx-0.5">·</span>OS
          </span>
        </Link>
        <motion.span
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-flex items-center gap-2 rounded-full bg-[#BFFF00]/25 px-3.5 py-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#111111]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#111111] inline-block" />
          {live ? 'Webinar läuft' : 'Warteraum'}
        </motion.span>
      </motion.header>

      <main id="main-content" className="max-w-[820px] mx-auto px-5 md:px-10 pt-14 md:pt-20 pb-24 flex flex-col items-center text-center">
        <motion.img
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          src={WLAD_AVATAR}
          onError={withFallback(WLAD_AVATAR_FALLBACKS)}
          alt="Wlad Jachtchenko"
          width="72"
          height="72"
          className="w-18 h-18 rounded-full object-cover object-top ring-2 ring-[#BFFF00] mb-6"
          style={{ width: 72, height: 72 }}
        />

        <motion.p
          initial="hidden" animate="show" variants={FADE_UP}
          className="font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-[#707072] mb-5"
        >
          {DATE_LINE}
        </motion.p>

        <motion.h1
          initial="hidden" animate="show" custom={1} variants={FADE_UP}
          className="text-balance text-[34px] sm:text-[50px] md:text-[60px] leading-[1.0] tracking-[-0.04em] text-[#111111] max-w-2xl"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          {live ? <>Es geht los<span className="text-[#5A7700] not-italic">.</span></> : <>Gleich geht's los<span className="text-[#5A7700] not-italic">.</span></>}
        </motion.h1>

        {/* Countdown */}
        {!live && (
          <div className="mt-9 flex gap-2.5 sm:gap-3" aria-label="Countdown bis zum Webinar">
            {[['Tage', d], ['Std', h], ['Min', m], ['Sek', s]].map(([label, val], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center w-[64px] h-[64px] sm:w-[76px] sm:h-[76px] rounded-2xl bg-white border border-[#111111]/10 shadow-[0_10px_30px_-18px_rgba(17,17,17,0.25)]"
              >
                <span className="tabular-nums leading-none text-[#111111] text-[24px] sm:text-[30px]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
                  {String(val).padStart(2, '0')}
                </span>
                <span className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#707072]">{label}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Where the join link lives · honest, no dead button */}
        <motion.div
          initial="hidden" animate="show" custom={2} variants={FADE_UP}
          className="mt-10 w-full max-w-xl rounded-3xl bg-[#fafafa] border border-[#111111]/8 p-7 text-left flex items-start gap-4"
        >
          <span className="inline-flex w-11 h-11 shrink-0 items-center justify-center rounded-2xl bg-[#BFFF00]/25 text-[#111111]">
            <MailCheck size={20} />
          </span>
          <div>
            <h2 className="text-[16px] text-[#111111] mb-1" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
              Dein Teilnahme-Link kommt per Mail
            </h2>
            <p className="text-[13.5px] leading-[1.6] text-[#707072]">
              Angemeldete Teilnehmer bekommen den Link 24 Stunden und noch einmal 1 Stunde
              vor dem Start zugeschickt — schau am Webinar-Tag in dein Postfach
              (und zur Sicherheit in den Spam-Ordner).
            </p>
          </div>
        </motion.div>

        {/* Add to calendar */}
        <motion.div initial="hidden" animate="show" custom={3} variants={FADE_UP} className="mt-6">
          <a
            href={googleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="webinar-live-calendar"
            className="inline-flex items-center gap-2.5 h-12 px-6 rounded-full border border-[#111111]/20 hover:border-[#111111] bg-white text-[#111111] text-[12px] font-bold uppercase tracking-[0.14em] transition-colors"
          >
            <Calendar size={15} /> Zum Kalender hinzufügen
          </a>
        </motion.div>

        {/* Compact agenda */}
        <motion.div
          initial="hidden" animate="show" custom={4} variants={FADE_UP}
          className="mt-12 w-full max-w-xl"
        >
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#5A7700] mb-4">▸ Der Ablauf</p>
          <ol className="space-y-2 text-left">
            {AGENDA.map(([time, title]) => (
              <li key={time} className="flex items-center gap-4 rounded-2xl bg-white border border-[#111111]/8 px-5 py-3.5">
                <span className="font-mono text-[12px] font-bold text-[#5A7700] tabular-nums w-12 shrink-0">{time}</span>
                <span className="text-[14px] font-bold text-[#111111]" style={{ fontFamily: 'Outfit, sans-serif' }}>{title}</span>
                <Check size={14} className="ml-auto text-[#BFFF00]" strokeWidth={3} />
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Late registration · forwarded-link traffic capture */}
        <motion.div
          initial="hidden" animate="show" custom={5} variants={FADE_UP}
          className="mt-14 pt-10 border-t border-[#111111]/10 w-full"
        >
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#5A7700] mb-3">▸ Noch nicht angemeldet?</p>
          <p className="text-balance max-w-lg mx-auto text-[14.5px] leading-[1.6] text-[#4b4b4d] mb-6">
            Link von einer Kollegin bekommen? Trag dich ein — sonst bekommst du weder
            den Teilnahme-Link noch die 4-teilige Videoserie.
          </p>
          <LateRegisterForm />
        </motion.div>
      </main>

      <LandingFooter />
    </div>
  );
}
