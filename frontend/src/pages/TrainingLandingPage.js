import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu, X, Check, MessageCircle, Mic, Video, Clock, Timer,
} from 'lucide-react';
import { LandingFooter } from '../components/landing/LandingFooter';
import { applyPageMeta } from '../lib/pageMeta';
import { isValidEmail } from '../features/newsletter/lib/newsletterClient';
import { WladMark } from '../components/brand/WladMark';
import { trackMeta, metaEventId } from '../lib/metaPixel';
import { trackLinkedInLead } from '../lib/linkedinInsight';

/**
 * TrainingLandingPage · /training · dedicated, ad-only landing page.
 *
 * Distinct from /webinar (long-form Hormozi funnel) and /event (dark
 * dotted-glow alt framing) — this is the short-scroll, motion-rich,
 * single-viewport variant: everything the ad promises sits in one card,
 * nothing to scroll past before the offer. Same underlying event (29.10.,
 * see routes/webinar.py WEBINAR_DATE_ISO) and the same real registration
 * endpoint — a third creative angle on one honest offer, not a new product.
 *
 * noindex: ad-landing pages don't compete with /webinar or /event for
 * organic search (see docs/gtm/SEO_AEO_PLAYBOOK.md).
 */

const WEBINAR_DATE_ISO = '2026-10-29T09:00:00Z'; // 10:00 CET (nach der Zeitumstellung)

const track = (event, props = {}) => {
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try { window.posthog.capture(event, { surface: 'leader-os', funnel: 'training-lp', ...props }); } catch {}
  }
};

const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'];
const UTM_STORE = 'lo_training_utm';
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

function useCountdown(targetIso) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(targetIso).getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      setLeft(Math.max(0, new Date(targetIso).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return { h, m, s, isLive: left <= 0 };
}

const NAV_LINKS = [
  { label: 'Frameworks', href: '/frameworks' },
  { label: 'WladBot', href: '/wladbot' },
  { label: 'Journal', href: '/journal' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative z-50">
      <div className="flex items-center justify-between px-6 md:px-12 py-6">
        <a href="/" className="flex items-center gap-2.5">
          <WladMark size={32} variant="solid" />
          <span className="text-lg font-black tracking-tight text-[#0A0A0A]">
            Leader<span className="text-brand">·</span>OS
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-gray-500 hover:text-black transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href="https://leaderos.de/login" className="text-sm text-gray-500 hover:text-black transition-colors">
            Login
          </a>
          <a
            href="#anmelden"
            className="inline-flex items-center rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-[#0A0A0A] hover:brightness-95 transition"
          >
            Kostenlos anmelden
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-[#0A0A0A]"
          aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-black/10 px-6 py-6">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-base text-gray-600" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
          </div>
          <hr className="my-5 border-black/10" />
          <div className="flex flex-col gap-3">
            <a href="https://leaderos.de/login" className="text-base text-gray-600">Login</a>
            <a
              href="#anmelden"
              onClick={() => setOpen(false)}
              className="inline-flex justify-center items-center rounded-xl bg-brand px-5 py-3 text-sm font-bold text-[#0A0A0A] shadow-lg shadow-brand/20"
            >
              Kostenlos anmelden
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

const monoLabel = 'font-mono text-[10px] tracking-[0.22em] uppercase text-gray-400';

function StickyNote() {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: 2 }}
      animate={{ opacity: 1, rotate: 3 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="hidden md:block absolute top-16 md:-left-4 w-52 p-6 bg-[#FFF188] shadow-lg md:scale-90 origin-top-left"
    >
      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#D32F2F]" />
      <p className="font-mono text-[13px] leading-relaxed text-[#3a3a2a]">
        Kein Theorie-Kurs. Live durchgespielt — Frage für Frage.
      </p>
    </motion.div>
  );
}

function FrameworkChip() {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: 6 }}
      animate={{ opacity: 1, rotate: 12 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="hidden md:block absolute top-44 md:left-14 md:scale-90 origin-top-left"
    >
      <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <span className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
          <Check size={16} className="text-[#0A0A0A]" strokeWidth={3} />
        </span>
        <span className="text-xs font-bold text-[#0A0A0A] whitespace-nowrap">11 Frameworks</span>
      </div>
    </motion.div>
  );
}

const ROADMAP_ITEMS = [
  { n: '01', color: '#FF5722', name: 'SEXIER', sub: 'Argumentation', pct: 72 },
  { n: '02', color: '#00C853', name: 'B-W-W', sub: 'Feedback', pct: 45 },
];

function RoadmapFolder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotate: -5 }}
      animate={{ opacity: 1, y: 0, rotate: -4 }}
      transition={{ delay: 0.8, duration: 0.7 }}
      className="hidden md:block absolute -bottom-10 md:-left-2 md:scale-90 origin-bottom-left"
    >
      <div className="relative w-64 bg-[#F2F3F5] rounded-2xl p-5 pt-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className={`${monoLabel} mb-3`}>▸ Deine Roadmap</div>
        <div className="flex flex-col gap-2.5">
          {ROADMAP_ITEMS.map((it) => (
            <div key={it.n} className="bg-white/95 rounded-xl p-3">
              <div className="flex items-center gap-2.5 mb-2">
                <span
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black text-white shrink-0"
                  style={{ background: it.color }}
                >
                  {it.n}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[#0A0A0A] truncate">{it.name}</div>
                  <div className="text-[10px] text-gray-400 truncate">{it.sub}</div>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-[#EDEDED] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${it.pct}%`, background: '#00BFFF' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const SYNC_ICONS = [
  { Icon: MessageCircle, color: '#2563EB', label: 'Chat' },
  { Icon: Mic, color: '#16632B', label: 'Sprache' },
  { Icon: Video, color: '#D32F2F', label: 'Video' },
];

function SyncFolder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotate: 5 }}
      animate={{ opacity: 1, y: 0, rotate: 4 }}
      transition={{ delay: 1.0, duration: 0.7 }}
      className="hidden md:block absolute -bottom-12 md:-right-2 md:scale-90 origin-bottom-right"
    >
      <div className="w-60 bg-[#F2F3F5] rounded-2xl p-5 pt-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className={`${monoLabel} mb-3`}>▸ Überall verfügbar</div>
        <div className="flex gap-2.5">
          {SYNC_ICONS.map(({ Icon, color, label }) => (
            <div
              key={label}
              className="flex-1 flex flex-col items-center gap-1.5 bg-white rounded-xl py-3 hover:scale-105 transition-transform"
            >
              <Icon size={18} style={{ color }} />
              <span className="text-[9px] font-semibold text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function LiveTerminFolder() {
  const { h, m, s, isLive } = useCountdown(WEBINAR_DATE_ISO);
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: 50, rotate: 4 }}
      animate={{ opacity: 1, y: 0, x: 0, rotate: 6 }}
      transition={{ delay: 1.2, duration: 0.7 }}
      className="hidden md:block absolute top-8 md:right-2 md:scale-90 origin-top-right"
    >
      <div className="relative w-64 bg-[#F2F3F5] rounded-2xl p-5 pt-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className={`${monoLabel} mb-3`}>▸ Live-Termin</div>
        <div className="bg-white/90 rounded-2xl p-4">
          <div className="text-[13px] font-bold text-[#0A0A0A] mb-1">Live-Training</div>
          <div className="text-[11px] text-gray-400 mb-3">Mit Wlad Jachtchenko, live &amp; interaktiv</div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#E1F5FE] px-2.5 py-1.5">
            <Clock size={12} className="text-[#03A9F4]" />
            <span className="text-[11px] font-semibold text-[#03A9F4]">29.10. · 10:00 Uhr</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="absolute -top-3 -left-4 -rotate-[8deg] bg-white rounded-xl px-3 py-2.5 shadow-[0_6px_20px_rgba(0,0,0,0.12)] flex items-center gap-2"
        >
          <Timer size={16} className="text-brand" />
          <span className="text-[11px] font-mono font-bold text-[#0A0A0A] whitespace-nowrap">
            {isLive ? 'LIVE' : `${h}h ${m}m ${s}s`}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

function RegisterBlock() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState('idle');
  const valid = isValidEmail(email);

  const submit = async (e) => {
    e.preventDefault();
    if (state === 'loading') return;
    if (!valid) { setState('invalid'); return; }
    setState('loading');
    track('training_lp_register_submit');
    const eventId = metaEventId();
    try {
      const res = await fetch('/api/webinar/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          source: 'training-lp',
          utm: readUtm(),
          meta_event_id: eventId,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
          landing_path: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      });
      const data = await res.json().catch(() => null);
      const ok = res.ok && data?.ok;
      track('training_lp_register_result', { ok });
      if (ok) {
        trackMeta('Lead', { content_name: 'webinar-2026-10-29', content_category: 'webinar' }, eventId);
        trackLinkedInLead();
        navigate(`/webinar/danke?email=${encodeURIComponent(email)}`);
        return;
      }
      setState('error');
    } catch {
      setState('error');
    }
  };

  return (
    <form id="anmelden" onSubmit={submit} noValidate className="w-full max-w-md mx-auto scroll-mt-24">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Vorname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-14 w-full sm:w-auto sm:flex-1 rounded-xl border border-black/10 px-4 text-[15px] focus:outline-none focus:border-brand"
        />
        <input
          type="email"
          inputMode="email"
          placeholder="E-Mail-Adresse"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === 'invalid') setState('idle'); }}
          className="h-14 w-full sm:w-auto sm:flex-[1.4] rounded-xl border border-black/10 px-4 text-[15px] focus:outline-none focus:border-brand"
        />
      </div>
      <motion.button
        type="submit"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        disabled={state === 'loading'}
        className="mt-3 w-full h-14 rounded-xl bg-brand text-[#0A0A0A] font-bold text-[15px] shadow-lg shadow-brand/20 disabled:opacity-70"
      >
        {state === 'loading' ? 'Wird gesichert …' : 'Jetzt kostenlos sichern'}
      </motion.button>
      {state === 'invalid' && (
        <p role="alert" className="mt-2 text-sm text-red-600">Bitte eine gültige E-Mail-Adresse eingeben.</p>
      )}
      {state === 'error' && (
        <p role="alert" className="mt-2 text-sm text-red-600">Das hat leider nicht geklappt — bitte nochmal versuchen.</p>
      )}
    </form>
  );
}

function Hero() {
  return (
    <section className="px-4 md:px-6 pb-6">
      <div className="relative w-full min-h-[85vh] py-32 bg-white rounded-2xl md:rounded-[2.5rem] border border-black/10 flex flex-col items-center justify-center text-center">
        {/* Noise respects the card's rounded corners; decorative floats (below) deliberately don't — they bleed past the edge. */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl md:rounded-[2.5rem] overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />

        <StickyNote />
        <FrameworkChip />
        <RoadmapFolder />
        <SyncFolder />
        <LiveTerminFolder />

        <div className="relative z-10 max-w-2xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex mb-8"
          >
            <span className="p-3 rounded-2xl bg-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
              <WladMark size={40} variant="solid" />
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-geist text-4xl md:text-6xl lg:text-7xl tracking-tight text-[#0A0A0A] leading-[1.02]"
          >
            Führung wird nicht gelernt.<br />
            <span className="text-gray-400">Sie wird trainiert.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-gray-400 text-lg md:text-xl"
          >
            Kostenloses Live-Training mit Wlad Jachtchenko — 90 Minuten,
            ein echtes System, keine Aufzeichnung.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`mt-5 ${monoLabel}`}
          >
            29.10.2026 · 10:00 UHR · LIVE, 90 MIN · 0 €
          </motion.div>

          <div className="mt-8">
            <RegisterBlock />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <div className="px-6 py-10 text-center">
      <p className={monoLabel}>
        400.000+ Klienten seit 2007 · 13 Bücher · 3× SPIEGEL-Bestseller
      </p>
    </div>
  );
}

export default function TrainingLandingPage() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    captureUtm();
    track('training_lp_view');

    const restoreMeta = applyPageMeta({
      title: 'Kostenloses Live-Training · Führung wird trainiert, nicht gelernt · LeaderOS',
      description:
        'Live-Training am 29.10.2026 mit Wlad Jachtchenko (3× SPIEGEL-Bestseller): 90 Minuten, ' +
        'ein echtes System statt Theorie. Kostenlos, live, keine Aufzeichnung.',
      url: 'https://leader-os.de/training',
      image: 'https://leader-os.de/og-wlad.jpg',
    });

    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);

    return () => {
      if (wasDark) root.classList.add('dark');
      restoreMeta?.();
      document.head.removeChild(robots);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8] overflow-x-hidden">
      <Navbar />
      <Hero />
      <TrustBar />
      <LandingFooter />
    </div>
  );
}
