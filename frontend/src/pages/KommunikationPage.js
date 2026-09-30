import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Play, Check, Flame, Plus, Bell, Home, CheckCircle2, BarChart3, User, Star, X,
} from 'lucide-react';
import { applyPageMeta } from '../lib/pageMeta';
import { WladMark } from '../components/brand/WladMark';
import { ThreeStepPath } from '../components/brand/ThreeStepPath';
import { trackMeta, metaEventId } from '../lib/metaPixel';
import { trackLinkedInLead } from '../lib/linkedinInsight';

/**
 * KommunikationPage · /kommunikation · ad-only landing, Kommunikation-first.
 *
 * Steadyflow-Mechanik (Drei-Pillen-Nav mit Scroll-Morph, Video-Hero mit
 * gebogenem Blur-Fade, Glas-Phone, Marquee, Count-up-Sektion) — Inhalt
 * komplett LeaderOS: die Marquee-Karten sind Wlads Kommunikations-
 * Frameworks aus docs/gtm/WLAD_CANON.md, die Zahlen aus dem verifizierten
 * Set (400.000+ Klienten, 13 Bücher, 20+ Länder, Trustpilot 4,9 / 388).
 * Keine erfundenen Testimonials, keine Fake-Avatare, keine App-Store-
 * Buttons für eine App, die es nicht gibt.
 *
 * Videos: eigener CloudFront-Bucket (bereits in der CSP media-src).
 * noindex: Ad-Landing.
 */

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260728_015819_1b3ec855-d586-4018-96c8-8bf90cada037.mp4';
const INTRO_VIMEO_ID = '1197728183';
const TRIAL_URL = 'https://leaderos.de/signup?trial=14';
// Reihenfolge im Funnel: erst der kostenlose Leader-Check (leadercheck.de,
// 10 Min), dann der Trial auf leaderos.de. Alle "loslegen"-Wege zeigen
// deshalb zuerst auf den Check.
const CHECK_URL = 'https://leadercheck.de?utm_source=leader-os&utm_medium=landing&utm_campaign=kommunikation';

const INK = 'rgb(19, 21, 21)';
const PAGE_BG = 'rgb(247, 247, 247)';
const MUTED = 'rgb(73, 77, 77)';
const BLUE = '#4382BC';
const PILL_SHADOW = '0px 8px 20px rgba(5, 8, 12, 0.1)';

const HEADLINE = { fontFamily: 'Geist, Inter, system-ui, sans-serif', fontWeight: 500 };
const BODY = { fontFamily: 'Inter, Outfit, system-ui, sans-serif', fontWeight: 500 };

const spring = (delay = 0) => ({ type: 'spring', duration: 0.6, bounce: 0, delay });
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const hoverShrink = { whileHover: { scale: 0.95 }, transition: { type: 'spring', duration: 0.45, bounce: 0.25 } };
const scrollEase = [0.25, 0.46, 0.45, 0.94];

const track = (event, props = {}) => {
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try { window.posthog.capture(event, { surface: 'leader-os', funnel: 'kommunikation-lp', ...props }); } catch {}
  }
};

// ─── Navbar ───────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Ansätze', href: '#ansaetze' },
  { label: 'Die App', href: '#app' },
  { label: 'Journal', href: '/journal' },
];

function Brand({ small = false }) {
  return (
    <a href="/" className="flex items-center" style={{ gap: 10 }}>
      <WladMark size={small ? 24 : 28} variant="solid" />
      <span style={{ ...BODY, fontWeight: 600, fontSize: small ? 16 : 18, color: INK }}>
        Leader<span className="text-brand">·</span>OS
      </span>
    </a>
  );
}

function DarkSquare({ href, label, children, size = 52, radius = 14 }) {
  return (
    <motion.a
      href={href}
      aria-label={label}
      {...hoverShrink}
      className="flex items-center justify-center text-white"
      style={{ width: size, height: size, borderRadius: radius, background: INK }}
    >
      {children}
    </motion.a>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-10" style={{ padding: '30px 0' }}>
        <motion.div
          className="mx-auto flex items-center"
          style={{ maxWidth: 1260, padding: '0 30px' }}
          animate={{ gap: scrolled ? 12 : 0, justifyContent: scrolled ? 'center' : 'space-between' }}
          transition={{ duration: 0.45, ease: [0.44, 0, 0.56, 1] }}
        >
          <div className="bg-white flex items-center" style={{ borderRadius: 20, padding: 16, boxShadow: PILL_SHADOW }}>
            <Brand />
          </div>
          <nav className="bg-white flex items-center" style={{ borderRadius: 20, padding: '0 32px', height: 64, gap: 32, boxShadow: PILL_SHADOW }}>
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:opacity-70 transition-opacity" style={{ ...BODY, fontSize: 14, color: INK }}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="bg-white flex items-center" style={{ borderRadius: 20, padding: 6, gap: 6, boxShadow: PILL_SHADOW }}>
            <motion.a
              href="https://leaderos.de/login"
              {...hoverShrink}
              className="flex items-center justify-center"
              style={{ ...BODY, height: 52, padding: '0 18px', borderRadius: 14, fontSize: 14, color: INK }}
            >
              Login
            </motion.a>
            <motion.a
              href={CHECK_URL}
              {...hoverShrink}
              onClick={() => track('kommunikation_cta_click', { where: 'nav' })}
              className="flex items-center justify-center text-white"
              style={{ ...BODY, height: 52, padding: '0 20px', borderRadius: 14, fontSize: 14, background: INK }}
            >
              Leader-Check · 10 Min
            </motion.a>
          </div>
        </motion.div>
      </div>

      {/* Mobile / Tablet */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex justify-center" style={{ padding: '16px 16px 0' }}>
        <div
          className="bg-white flex items-center justify-between w-full max-w-[360px] md:max-w-[760px]"
          style={{ borderRadius: 16, padding: 10, boxShadow: PILL_SHADOW }}
        >
          <Brand small />
          <div className="flex items-center" style={{ gap: 6 }}>
            <DarkSquare href={CHECK_URL} label="Leader-Check starten · 10 Minuten" size={40} radius={12}>
              <Flame size={18} />
            </DarkSquare>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
              className="relative flex items-center justify-center"
              style={{ width: 40, height: 40, borderRadius: 10, background: INK }}
            >
              <motion.span className="absolute bg-white" style={{ width: 16, height: 2 }} animate={{ rotate: open ? 45 : 0, y: open ? 0 : -4 }} transition={{ duration: 0.3 }} />
              <motion.span className="absolute bg-white" style={{ width: 16, height: 2 }} animate={{ rotate: open ? -45 : 0, y: open ? 0 : 4 }} transition={{ duration: 0.3 }} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-[15] backdrop-blur-md bg-black/40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="lg:hidden fixed left-4 right-4 z-[16] bg-white mx-auto max-w-[360px] md:max-w-[760px]"
              style={{ top: 80, borderRadius: 16, padding: 24 }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.44, 0, 0.56, 1] }}
            >
              <div className="flex flex-col" style={{ gap: 18 }}>
                {NAV_LINKS.map((l) => (
                  <a key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ ...BODY, fontSize: 16, color: INK }}>{l.label}</a>
                ))}
                <a href="https://leaderos.de/login" style={{ ...BODY, fontSize: 16, color: MUTED }}>Login</a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────

const FROSTED = {
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
};

const HABITS = [
  { emoji: '🗣', title: 'SEXIER-Drill', sub: 'Ein Argument, sechs Schritte', pct: 85, ratio: '12/14', done: true },
  { emoji: '💬', title: 'Feedback vorbereiten', sub: 'B-W-W für das 1:1 um 14:00', pct: 100, ratio: '9/9', done: true },
  { emoji: '🎙', title: 'Firmenrede-Struktur', sub: 'Sparring mit WladBot', pct: 67, ratio: '6/9', done: false },
];

function PhoneMockup() {
  const days = ['M', 'D', 'M', 'D', 'F', 'S', 'S'];
  const active = [22, 16, 28, 14, 24, 0, 0];
  return (
    <motion.div
      {...fadeUp} transition={spring(0.6)}
      className="w-[300px] md:w-[340px] backdrop-blur-xl text-white"
      style={{
        borderRadius: 44,
        background: 'rgba(13, 17, 23, 0.55)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0px 0px 0px 8px rgba(255,255,255,0.05), 0px 60px 120px rgba(0,0,0,0.5)',
        padding: '20px 16px 12px',
        ...BODY,
      }}
    >
      <div className="mx-auto bg-black" style={{ width: 90, height: 26, borderRadius: 999 }} />

      <div className="flex items-start justify-between mt-5">
        <div>
          <div style={{ ...HEADLINE, fontSize: 20 }}>Guten Morgen!</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Dein Training für heute wartet.</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.08)' }}><Bell size={14} /></span>
          <span className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: BLUE }}><Plus size={14} /></span>
        </div>
      </div>

      <div className="mt-4" style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 16, padding: 14 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={16} style={{ color: BLUE }} />
            <div><div style={{ fontSize: 18, fontWeight: 600 }}>12</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Tag der Challenge</div></div>
          </div>
          <div><div style={{ fontSize: 18, fontWeight: 600 }}>21</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Drills diese Woche</div></div>
        </div>
        <div className="flex items-end justify-between mt-3" style={{ height: 34 }}>
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div style={{ width: 8, height: Math.max(4, active[i]), borderRadius: 3, background: active[i] ? BLUE : 'rgba(255,255,255,0.12)' }} />
              <span style={{ fontSize: 9, color: i === 3 ? BLUE : 'rgba(255,255,255,0.35)' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span style={{ fontSize: 13, fontWeight: 600 }}>Heute</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>2 von 3 erledigt</span>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {HABITS.map((h, i) => (
          <motion.div
            key={h.title}
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.12, duration: 0.4 }}
            className="flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '10px 12px' }}
          >
            <span style={{ fontSize: 18 }}>{h.emoji}</span>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 12, fontWeight: 600 }} className="truncate">{h.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }} className="truncate">{h.sub}</div>
              <div className="flex items-center gap-2 mt-1">
                <div style={{ width: 40, height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }}>
                  <div style={{ width: `${h.pct * 0.4}px`, height: 3, background: BLUE, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{h.pct}% · {h.ratio}</span>
              </div>
            </div>
            {h.done
              ? <span className="flex items-center justify-center rounded-full" style={{ width: 22, height: 22, background: BLUE }}><Check size={12} strokeWidth={3} /></span>
              : <span className="rounded-full" style={{ width: 22, height: 22, border: '1.5px solid rgba(255,255,255,0.3)' }} />}
          </motion.div>
        ))}
        <div className="flex items-center gap-3" style={{ border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 14, padding: '10px 12px' }}>
          <span className="flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: BLUE }}><Plus size={14} /></span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Neue Simulation</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Konfliktgespräch durchspielen</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-around mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {[[Home, 'Heute', true], [CheckCircle2, 'Drills'], [BarChart3, 'Fortschritt'], [User, 'Profil']].map(([Icon, label, on]) => (
          <div key={label} className="flex flex-col items-center gap-1" style={{ color: on ? BLUE : 'rgba(255,255,255,0.25)' }}>
            <Icon size={16} /><span style={{ fontSize: 9 }}>{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function VideoOverlay({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: 'rgba(19,21,21,0.9)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <button
            type="button" onClick={onClose} aria-label="Schließen"
            className="absolute flex items-center justify-center"
            style={{ top: 30, right: 30, width: 40, height: 40, background: PAGE_BG, borderRadius: 8 }}
          >
            <X size={18} style={{ color: INK }} />
          </button>
          <motion.div
            className="w-full max-w-[800px] aspect-video overflow-hidden bg-black"
            style={{ borderRadius: 20 }}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              title="Wlad Jachtchenko · LeaderOS Intro"
              src={`https://player.vimeo.com/video/${INTRO_VIMEO_ID}?autoplay=1&muted=1`}
              className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Hero({ onPlay }) {
  return (
    <section id="hero" className="relative w-full overflow-hidden" style={{ background: INK }}>
      <video className="absolute inset-0 w-full h-full object-cover" src={HERO_VIDEO} autoPlay muted loop playsInline />

      <div className="absolute z-[2] -left-[60px] -right-[60px] md:-left-[100px] md:-right-[100px] lg:-left-[180px] lg:-right-[180px] xl:-left-[250px] xl:-right-[250px] pointer-events-none" style={{ bottom: -10 }}>
        <svg viewBox="0 0 5688 1886" className="w-full block" preserveAspectRatio="none" style={{ height: 'clamp(160px, 22vw, 420px)' }}>
          <defs><filter id="km-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="125" /></filter></defs>
          <path d="M2733.25 1264.78C706.858 1264.78 -50.5828 573.265 -177 202.5V2088.5H5865V202.5C5664.75 539.923 4759.65 1264.78 2733.25 1264.78Z" fill={PAGE_BG} filter="url(#km-blur)" />
        </svg>
      </div>

      <div className="relative z-[1] mx-auto flex flex-col items-center text-center" style={{ maxWidth: 980, padding: 'clamp(160px, 15vw, 200px) 30px 120px', gap: 80 }}>
        <div className="flex flex-col items-center" style={{ gap: 40 }}>
          <div className="flex flex-col items-center" style={{ gap: 20 }}>
            <motion.div {...fadeUp} transition={spring(0.1)} className="flex items-center rounded-full" style={{ ...FROSTED, padding: '6px 18px 6px 6px', gap: 10 }}>
              <span className="rounded-full text-white" style={{ ...BODY, fontSize: 14, background: INK, padding: '4px 10px' }}>Neu</span>
              <span className="text-white" style={{ ...BODY, fontSize: 14 }}>Kommunikations-Training mit System</span>
            </motion.div>

            <motion.h1
              {...fadeUp} transition={spring(0.2)}
              className="text-white text-[44px] md:text-[60px] lg:text-[90px]"
              style={{ ...HEADLINE, lineHeight: '1em', textWrap: 'balance', letterSpacing: '-0.02em' }}
            >
              Überzeugen ist keine Begabung.<br className="hidden lg:block" /> Es ist ein System.
            </motion.h1>

            <motion.p {...fadeUp} transition={spring(0.3)} className="text-white text-[18px] md:text-[20px] lg:text-[22px]" style={{ ...BODY, lineHeight: '1.4em', maxWidth: 500 }}>
              Argumentation, Feedback, Verhandlung, Schlagfertigkeit — Wlad Jachtchenkos Methodik, jeden Tag trainierbar, mit KI-Coach.
            </motion.p>
          </div>

          <motion.div {...fadeUp} transition={spring(0.4)} className="flex flex-wrap items-center justify-center" style={{ gap: 20 }}>
            <motion.a
              href="#check" {...hoverShrink}
              onClick={() => track('kommunikation_cta_click', { where: 'hero' })}
              className="rounded-full bg-white" style={{ ...BODY, fontSize: 16, color: INK, padding: '16px 34px' }}
            >
              Kommunikations-Check starten
            </motion.a>
            <motion.button
              type="button" {...hoverShrink} onClick={onPlay}
              className="rounded-full flex items-center text-white" style={{ ...FROSTED, ...BODY, fontSize: 16, height: 54, padding: '0 28px', gap: 10 }}
            >
              <Play size={16} fill="#fff" /> Wlad live sehen
            </motion.button>
          </motion.div>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}

// ─── Ansätze (Marquee) ────────────────────────────────────────────────

const ANSAETZE = [
  { code: 'SEXIER', job: 'Argumentation', stat: '6', desc: 'Sechs Schritte, ein Argument, das jeder Gegenrede standhält.', bg: '#0A0A0A', hi: '#BFFF00', img: '/wlad/books/weisse-rhetorik.jpg' },
  { code: 'B-W-W', job: 'Feedback', stat: '3 Sätze', desc: 'Beobachtung, Wirkung, Wunsch — kein Drama, kein „Du bist …".', bg: '#16632B', hi: '#BFFF00', img: '/wlad/books/die-5-rollen-einer-fuehrungskraft.jpg' },
  { code: 'Zuhören', job: '10 Stufen', stat: '80 %', desc: 'der Führungskräfte bleiben auf Stufe 2: warten, bis sie dran sind.', bg: '#1E40FF', hi: '#BFFF00', img: '/wlad/wlad-portrait.jpg' },
  { code: 'Dunkle Rhetorik', job: 'Defense', desc: 'Strohmann, Ad Hominem, Whataboutism erkennen — und ruhig kontern.', bg: '#0A0A0A', hi: '#FFFFFF', img: '/wlad/books/dunkle-rhetorik.jpg' },
  { code: '4 Farben', job: 'Typen lesen', stat: '4', desc: 'Rot, Gelb, Grün, Blau — den Typ erkennen, den Ton treffen.', bg: '#E11D74', hi: '#FFE600', img: '/wlad/books/das-geheimnis-der-erfolgreichen-alltagskommunikation.jpg' },
  { code: 'Schlagfertigkeit', job: '30 Techniken', stat: '30', desc: 'Rückfrage, Notbremse, überraschende Zustimmung.', bg: '#FF6A2D', hi: '#0A0A0A', img: '/wlad/books/redest-du-noch-oder-ueberzeugst-du-schon.jpg' },
  { code: 'Quadrant', job: 'Schulz von Thun', stat: '4', desc: 'Sache, Selbstoffenbarung, Beziehung, Appell — in jeder Nachricht.', bg: '#0A0A0A', hi: '#BFFF00', img: '/wlad/wlad-portrait.jpg' },
  { code: 'Gesprächstypen', job: 'Vorbereitung', stat: '4', desc: 'Informieren, Überzeugen, Verhandeln, Konfrontieren — erst der Typ, dann das Framework.', bg: '#16632B', hi: '#FFFFFF', img: '/wlad/books/die-rhetorik-der-top-performer.jpg' },
  { code: 'Charisma-Code', job: 'Wirkung', stat: '3', desc: 'Präsenz, Wärme, Kompetenz — in Sekunden entschieden.', bg: '#1E40FF', hi: '#FFFFFF', img: '/wlad/books/die-charismatische-fuehrungskraft.jpg' },
  { code: 'Verhandlung', job: 'Harvard + Wlad', desc: 'Hart in der Sache, weich zur Person.', bg: '#0A0A0A', hi: '#BFFF00', img: '/wlad/books/satanische-verhandlungskunst.jpg' },
];

function AnsatzCard({ a }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden text-white w-[320px] h-[450px] md:w-[380px] md:h-[480px]"
      style={{ borderRadius: 20, background: a.bg }}
    >
      <img src={a.img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.55, mixBlendMode: 'luminosity' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgb(19,21,21) 0%, rgba(255,255,255,0) 50%, rgb(19,21,21) 100%)' }} />
      <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: 'clamp(20px, 5vw, 40px)' }}>
        <div style={{ ...BODY, fontSize: 14 }}>
          <span>{a.code}</span>
          <span style={{ color: 'rgb(184,184,184)' }}> · {a.job}</span>
        </div>
        <div>
          {a.stat && <div style={{ ...HEADLINE, fontSize: 56, lineHeight: 1, color: a.hi, marginBottom: 10 }}>{a.stat}</div>}
          <p style={{ ...BODY, fontSize: 16, lineHeight: 1.4, maxWidth: 300 }}>{a.desc}</p>
        </div>
      </div>
    </div>
  );
}

function Ansaetze() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const reveal = (delay) => ({
    initial: { opacity: 0, y: 20 },
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.6, ease: scrollEase, delay },
  });
  const cards = [...ANSAETZE, ...ANSAETZE, ...ANSAETZE];

  return (
    <section id="ansaetze" ref={ref} className="overflow-hidden pt-[130px] lg:pt-[200px]">
      <div className="mx-auto flex flex-col md:flex-row md:items-end justify-between" style={{ maxWidth: 1260, padding: '0 30px', gap: 32 }}>
        <motion.h2 {...reveal(0)} className="text-[38px] md:text-[42px] lg:text-[48px]" style={{ ...HEADLINE, color: INK, lineHeight: 1.2, flex: 0.7 }}>
          Zehn Ansätze. Eine Methodik. Jeden Tag ein Drill.
        </motion.h2>
        <motion.div {...reveal(0.1)} className="flex flex-col" style={{ width: 320, gap: 10 }}>
          <div className="flex items-center" style={{ gap: 2 }}>
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={16} fill="#F5B301" stroke="#F5B301" />)}
          </div>
          <div style={{ ...BODY, fontSize: 18, color: MUTED }}>4,9 von 5 auf Trustpilot · 388 Bewertungen</div>
        </motion.div>
      </div>

      <motion.div {...reveal(0.2)} className="km-marquee mt-[50px] cursor-ew-resize">
        <div className="km-marquee-track flex" style={{ gap: 30 }}>
          {cards.map((a, i) => <AnsatzCard key={`${a.code}-${i}`} a={a} />)}
        </div>
      </motion.div>
    </section>
  );
}

// ─── Die App (Apple-Style Feature-Cards) ──────────────────────────────
//
// Drei Karten, je eine Stärke der App, mit Produkt-Beispielansicht. Der
// „+"-Knopf klappt Details auf (wie apple.com). Darunter Test + Preise.
// Ersetzt den früheren Zahlen-Block; belegte Proof-Zahlen stehen in Hero
// und Ansätzen (Trustpilot), keine Verknappung.

const APP_CARDS = [
  {
    key: 'coach',
    eyebrow: 'KI-Coach WladBot',
    title: 'Dein Coach kennt die Methode.',
    dark: true,
    points: [
      'Antwortet mit Wlads Frameworks: SEXIER, Feedbackformel, 10 Stufen des Zuhörens.',
      'An deinen echten Fällen, rund um die Uhr, auch um 23 Uhr vor dem schwierigen Termin.',
      'Kein Urteil, beliebig oft: dieselbe Frage so lange, bis sie sitzt.',
    ],
  },
  {
    key: 'sim',
    eyebrow: 'Simulationen',
    title: 'Proben, bevor es ernst wird.',
    points: [
      'Die KI spielt dein Gegenüber: den Mitarbeiter, der abwehrt, den Kunden, der blockt.',
      'Du führst das Gespräch, am Ende kommt Feedback nach Wlads Methodik.',
      'Kritikgespräch, Verhandlung, Konflikt: so oft, bis du sicher bist.',
    ],
  },
  {
    key: 'video',
    eyebrow: 'Video-Analyse',
    title: 'Wirkung, schwarz auf weiß.',
    points: [
      'Rede im Browser aufnehmen, 30 Sekunden bis 3 Minuten, keine App nötig.',
      'Score, 3 Stärken mit Zitat aus deiner Rede, 3 Hebel mit Übung.',
      'Im Testzeitraum sind 3 Video-Analysen inklusive.',
    ],
  },
];

function CoachVisual() {
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <div className="self-end rounded-2xl rounded-br-md" style={{ ...BODY, fontSize: 14, lineHeight: 1.4, background: '#BFFF00', color: INK, padding: '10px 14px', maxWidth: '82%' }}>
        Morgen Kritikgespräch mit Alex. Wie fange ich an?
      </div>
      <div className="self-start rounded-2xl rounded-bl-md" style={{ ...BODY, fontSize: 14, lineHeight: 1.45, background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '10px 14px', maxWidth: '88%' }}>
        Mit einer Beobachtung, nicht mit einer Bewertung: „Mir ist aufgefallen, dass …“. Dann die Wirkung, dann dein Wunsch.
        <span className="block mt-2 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: '#BFFF00' }}>Feedbackformel B·W·W</span>
      </div>
    </div>
  );
}

function SimVisual() {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: 210 }}>
      <img src="/journal/topics/feedback.webp" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover grayscale" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.75), rgba(10,10,10,0) 60%)' }} />
      <div className="absolute left-3 right-3 bottom-3 flex flex-col" style={{ gap: 8 }}>
        <div className="self-start rounded-2xl rounded-bl-md bg-white/95" style={{ ...BODY, fontSize: 13, color: INK, padding: '8px 12px' }}>
          <b>Alex:</b> Ich arbeite doch genug.
        </div>
        <div className="self-end rounded-2xl rounded-br-md" style={{ ...BODY, fontSize: 13, background: '#BFFF00', color: INK, padding: '8px 12px' }}>
          Coach: Stark, jetzt die Wirkung benennen.
        </div>
      </div>
    </div>
  );
}

function VideoVisual() {
  const bars = [['Klarheit', 82], ['Struktur', 74], ['Empathie', 69]];
  const r = 34; const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center" style={{ gap: 20 }}>
      <svg width="96" height="96" viewBox="0 0 84 84" className="shrink-0" aria-hidden>
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(19,21,21,0.08)" strokeWidth="8" />
        <circle cx="42" cy="42" r={r} fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${c * 0.78} ${c}`} transform="rotate(-90 42 42)" />
        <text x="42" y="49" textAnchor="middle" style={{ ...HEADLINE, fontSize: 22, fill: INK }}>78</text>
      </svg>
      <div className="flex-1 flex flex-col" style={{ gap: 10 }}>
        {bars.map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between" style={{ ...BODY, fontSize: 12.5, color: MUTED }}><span>{k}</span><span>{v}</span></div>
            <div className="mt-1 h-2 rounded-full" style={{ background: 'rgba(19,21,21,0.08)' }}>
              <div className="h-2 rounded-full" style={{ width: `${v}%`, background: 'linear-gradient(90deg, #4382BC, #BFFF00)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const VISUALS = { coach: CoachVisual, sim: SimVisual, video: VideoVisual };

function AppCard({ card, index }) {
  const [open, setOpen] = useState(false);
  const Visual = VISUALS[card.key];
  const fg = card.dark ? '#fff' : INK;
  const sub = card.dark ? 'rgba(255,255,255,0.62)' : MUTED;
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: scrollEase, delay: index * 0.12 }}
      whileHover={{ y: -6 }}
      className="relative flex flex-col overflow-hidden"
      style={{ borderRadius: 30, background: card.dark ? '#0A0A0A' : '#FFFFFF', minHeight: 520, padding: 30, boxShadow: '0 30px 60px -40px rgba(19,21,21,0.35)' }}
      data-testid={`app-card-${card.key}`}
    >
      <p style={{ ...BODY, fontSize: 14, color: card.dark ? '#BFFF00' : BLUE }}>{card.eyebrow}</p>
      <h3 className="mt-2 text-[28px] md:text-[32px]" style={{ ...HEADLINE, fontWeight: 600, color: fg, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{card.title}</h3>
      <div className="mt-8 flex-1 flex flex-col justify-end"><Visual /></div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: sub }}>Beispielansicht</p>

      <button
        type="button"
        onClick={() => { setOpen((o) => !o); track('kommunikation_app_card_toggle', { card: card.key, open: !open }); }}
        aria-expanded={open}
        aria-label={open ? `${card.eyebrow}: Details schließen` : `${card.eyebrow}: Details anzeigen`}
        className="absolute z-20 flex items-center justify-center rounded-full transition-transform hover:scale-105"
        style={{ right: 22, bottom: 22, width: 40, height: 40, background: card.dark ? '#fff' : INK, color: card.dark ? INK : '#fff' }}
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }} style={{ fontSize: 24, lineHeight: 1, marginTop: -2 }}>+</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35, ease: scrollEase }}
            className="absolute inset-0 z-10 flex flex-col"
            style={{ background: card.dark ? 'rgba(10,10,10,0.96)' : 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', padding: 30 }}
          >
            <p style={{ ...BODY, fontSize: 14, color: card.dark ? '#BFFF00' : BLUE }}>{card.eyebrow}</p>
            <h3 className="mt-2 text-[24px]" style={{ ...HEADLINE, fontWeight: 600, color: fg, lineHeight: 1.15 }}>{card.title}</h3>
            <ul className="mt-6 flex flex-col" style={{ gap: 14 }}>
              {card.points.map((pt) => (
                <li key={pt} className="flex items-start" style={{ ...BODY, fontSize: 16, lineHeight: 1.45, color: fg, gap: 10 }}>
                  <Check size={18} className="shrink-0 mt-0.5" style={{ color: card.dark ? '#BFFF00' : BLUE }} /> {pt}
                </li>
              ))}
            </ul>
            <a href={TRIAL_URL} onClick={() => track('kommunikation_cta_click', { where: `app-card-${card.key}` })}
              className="mt-auto self-start rounded-full" style={{ ...BODY, fontSize: 15, padding: '12px 22px', background: card.dark ? '#BFFF00' : INK, color: card.dark ? INK : '#fff' }}>
              14 Tage kostenlos testen
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function AppShowcase() {
  return (
    <section id="app" className="pt-[130px] lg:pt-[180px]">
      <div className="mx-auto flex flex-col" style={{ maxWidth: 1260, padding: '0 30px' }}>
        <div className="flex flex-col items-center text-center mx-auto" style={{ maxWidth: 760, gap: 18 }}>
          <div className="rounded-full bg-white" style={{ ...BODY, fontSize: 14, color: INK, padding: '8px 16px', border: '1px solid rgba(19,21,21,0.1)' }}>
            Die LeaderOS-App
          </div>
          <h2 className="text-[38px] md:text-[48px] lg:text-[60px]" style={{ ...HEADLINE, color: INK, lineHeight: 1.05, letterSpacing: '-0.025em', textWrap: 'balance' }}>
            Wlads Methodik. In deiner Tasche.
          </h2>
          <p className="text-[18px] md:text-[20px]" style={{ ...BODY, color: MUTED, lineHeight: 1.45 }}>
            15 Minuten am Tag statt drei Tage im Jahr. Drei Werkzeuge, mit denen aus Wissen Wirkung wird.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>
          {APP_CARDS.map((c, i) => <AppCard key={c.key} card={c} index={i} />)}
        </div>

        <p className="mt-8 text-center" style={{ ...BODY, fontSize: 15, color: MUTED }}>
          Außerdem in der App: Videokurse mit Wlad · Leadership Challengers · 30-Tage-Challenge
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center" style={{ gap: 14 }}>
          <motion.a href={TRIAL_URL} {...hoverShrink} onClick={() => track('kommunikation_cta_click', { where: 'app-showcase' })}
            className="rounded-full text-white" style={{ ...BODY, fontSize: 16, padding: '16px 32px', background: INK }}>
            14 Tage kostenlos testen
          </motion.a>
          <motion.a href="/#pricing" {...hoverShrink} onClick={() => track('kommunikation_pricing_click', { where: 'app-showcase' })}
            className="rounded-full" style={{ ...BODY, fontSize: 16, padding: '15px 30px', color: INK, border: '1px solid rgba(19,21,21,0.2)' }}>
            Preise ansehen
          </motion.a>
        </div>
      </div>
    </section>
  );
}

// ─── Kommunikations-Check (Typeform-Stepper) ──────────────────────────
//
// Eine Frage pro Screen, große Antwort-Karten, Tastatur 1–4 + Enter,
// Fortschrittsbalken. Letzter Schritt: Vorname + E-Mail → echte Webinar-
// Registrierung (POST /api/webinar/register, source kommunikation-check),
// Antworten landen als `quiz` am Lead. Das Ergebnis-Framework wandert als
// ?focus= auf /webinar/danke.

const QUESTIONS = [
  {
    key: 'pain', q: 'Wo verlierst du in Gesprächen am meisten?',
    options: [
      ['Meine Argumente kommen nicht an', 'SEXIER'],
      ['Feedback eskaliert oder verpufft', 'B-W-W'],
      ['Ich werde überhört oder unterbrochen', 'Charisma-Code'],
      ['Verhandlungen kippen gegen mich', 'Verhandlung'],
    ],
  },
  {
    key: 'prep', q: 'Wie bereitest du ein schwieriges Gespräch vor?',
    options: [['Gar nicht — ich improvisiere'], ['Ein paar Stichpunkte'], ['Ein Skript, Satz für Satz'], ['Ich spiele es vorher durch']],
  },
  {
    key: 'frequency', q: 'Wie oft führst du solche Gespräche?',
    options: [['Täglich'], ['Mehrmals pro Woche'], ['Ein paar Mal im Monat'], ['Selten — aber dann zählt es']],
  },
  {
    key: 'role', q: 'Deine Rolle heute?',
    options: [['Teamlead'], ['Abteilungs- oder Bereichsleitung'], ['Geschäftsführung / C-Level'], ['Selbstständig / Beratung']],
  },
  {
    key: 'lever', q: 'Was wäre dein größter Hebel?',
    options: [['Struktur — wissen, was ich sage'], ['Souveränität — ruhig bleiben'], ['Klarheit — verstanden werden'], ['Durchsetzung — Ergebnisse holen']],
  },
];

const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'];
const readUtm = () => {
  try {
    const q = new URLSearchParams(window.location.search);
    const fresh = Object.fromEntries(UTM_KEYS.map((k) => [k, (q.get(`utm_${k}`) || '').slice(0, 120)]));
    if (Object.values(fresh).some(Boolean)) { sessionStorage.setItem('lo_km_utm', JSON.stringify(fresh)); return fresh; }
    return JSON.parse(sessionStorage.getItem('lo_km_utm') || 'null');
  } catch { return null; }
};

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim());

function KommunikationsCheck() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const total = QUESTIONS.length + 1;
  const done = step >= QUESTIONS.length;
  const focus = answers.pain_focus || 'SEXIER';

  const choose = (qKey, label, tag) => {
    setAnswers((a) => ({ ...a, [qKey]: label, ...(tag ? { [`${qKey}_focus`]: tag } : {}) }));
    track('kommunikation_check_answer', { step: step + 1, key: qKey, value: label });
    setStep((s) => s + 1);
  };

  useEffect(() => {
    if (done) return undefined;
    const onKey = (e) => {
      const n = Number(e.key);
      const q = QUESTIONS[step];
      if (n >= 1 && n <= q.options.length && document.activeElement?.tagName !== 'INPUT') {
        const [label, tag] = q.options[n - 1];
        choose(q.key, label, tag);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, done]);

  const submit = async (e) => {
    e.preventDefault();
    if (state === 'loading') return;
    if (!isEmail(email)) { setState('invalid'); return; }
    setState('loading');
    track('kommunikation_check_submit', { focus });
    const eventId = metaEventId();
    try {
      const res = await fetch('/api/webinar/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(), name: name.trim(), source: 'kommunikation-check',
          utm: readUtm(), meta_event_id: eventId,
          answers: { ...answers, focus },
          referrer: document.referrer || null, landing_path: window.location.pathname,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        trackMeta('Lead', { content_name: 'webinar-2026-10-29', content_category: 'webinar' }, eventId);
        trackLinkedInLead();
        window.location.assign(`/webinar/danke?email=${encodeURIComponent(email.trim())}&focus=${encodeURIComponent(focus)}`);
        return;
      }
      setState('error');
    } catch { setState('error'); }
  };

  const card = { background: '#fff', borderRadius: 24, boxShadow: PILL_SHADOW, padding: 'clamp(24px, 4vw, 48px)' };
  const q = QUESTIONS[Math.min(step, QUESTIONS.length - 1)];

  return (
    <section id="check" ref={ref} className="pt-[130px] lg:pt-[200px] scroll-mt-24">
      <div className="mx-auto" style={{ maxWidth: 760, padding: '0 30px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: scrollEase }} className="text-center">
          <div className="inline-block rounded-full bg-white" style={{ ...BODY, fontSize: 14, color: INK, padding: '8px 16px', border: '1px solid rgba(19,21,21,0.1)' }}>
            Kommunikations-Check · 60 Sekunden
          </div>
          <h2 className="mt-5 text-[34px] md:text-[42px] lg:text-[48px]" style={{ ...HEADLINE, color: INK, lineHeight: 1.15 }}>
            Welcher Ansatz ist für dich der erste?
          </h2>
          <p className="mt-3" style={{ ...BODY, fontSize: 17, color: MUTED }}>
            Fünf Fragen, kein Login. Am Ende: dein Fokus-Framework — und dein Platz im Live-Webinar am 29. Oktober.
          </p>
        </motion.div>

        <div className="mt-10" style={card} data-testid="kommunikation-check">
          <div className="flex items-center justify-between" style={{ ...BODY, fontSize: 12, color: MUTED }}>
            <span>{done ? 'Fast fertig' : `Frage ${step + 1} von ${QUESTIONS.length}`}</span>
            <span>{Math.round((Math.min(step, total - 1) / (total - 1)) * 100)} %</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(19,21,21,0.08)' }}>
            <motion.div className="h-full rounded-full" style={{ background: BLUE }} animate={{ width: `${(Math.min(step, total - 1) / (total - 1)) * 100}%` }} transition={{ duration: 0.4, ease: scrollEase }} />
          </div>

          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div key={q.key} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                <h3 className="mt-7 text-[24px] md:text-[30px]" style={{ ...HEADLINE, color: INK, lineHeight: 1.2 }}>{q.q}</h3>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map(([label, tag], i) => (
                    <motion.button
                      key={label} type="button" whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.96 }}
                      onClick={() => choose(q.key, label, tag)}
                      className="text-left flex items-center gap-3 min-h-[64px] rounded-2xl border-2 transition-colors hover:border-[#4382BC]"
                      style={{ ...BODY, fontSize: 15, color: INK, padding: '14px 16px', borderColor: 'rgba(19,21,21,0.1)', background: PAGE_BG }}
                    >
                      <span className="shrink-0 flex items-center justify-center rounded-md font-mono" style={{ width: 26, height: 26, fontSize: 12, background: '#fff', border: '1px solid rgba(19,21,21,0.15)' }}>{i + 1}</span>
                      {label}
                    </motion.button>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between" style={{ ...BODY, fontSize: 12, color: MUTED }}>
                  <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="disabled:opacity-30 hover:text-black">← Zurück</button>
                  <span className="hidden sm:inline">Tipp: Taste 1–4 drücken</span>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <div className="mt-7 inline-flex items-center gap-2 rounded-full" style={{ ...BODY, fontSize: 13, color: INK, background: 'rgba(67,130,188,0.1)', padding: '6px 14px' }}>
                  <Check size={14} style={{ color: BLUE }} /> Dein Fokus-Framework: <b>{focus}</b>
                </div>
                <h3 className="mt-4 text-[24px] md:text-[30px]" style={{ ...HEADLINE, color: INK, lineHeight: 1.2 }}>
                  Wohin soll dein Ergebnis — und dein Platz im Webinar?
                </h3>
                <p className="mt-2" style={{ ...BODY, fontSize: 14, color: MUTED }}>
                  Live am Do, 29. Oktober, 10:00 Uhr · 90 Minuten · kostenlos · Bestätigung + Kalender-Link kommen sofort.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <input type="text" placeholder="Vorname" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name"
                    className="h-14 w-full sm:w-auto sm:flex-1 rounded-xl px-4 text-[15px] focus:outline-none focus:border-[#4382BC]" style={{ border: '2px solid rgba(19,21,21,0.1)', background: PAGE_BG }} />
                  <input type="email" inputMode="email" autoComplete="email" placeholder="E-Mail-Adresse" value={email}
                    onChange={(e) => { setEmail(e.target.value); if (state === 'invalid') setState('idle'); }}
                    className="h-14 w-full sm:w-auto sm:flex-[1.4] rounded-xl px-4 text-[15px] focus:outline-none focus:border-[#4382BC]" style={{ border: '2px solid rgba(19,21,21,0.1)', background: PAGE_BG }} />
                </div>
                <motion.button type="submit" whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.96 }} disabled={state === 'loading'}
                  className="mt-3 w-full h-14 rounded-xl text-white disabled:opacity-70" style={{ ...BODY, fontSize: 15, background: INK }}>
                  {state === 'loading' ? 'Wird gesichert …' : 'Ergebnis + Webinar-Platz sichern'}
                </motion.button>
                {state === 'invalid' && <p role="alert" className="mt-2 text-sm text-red-600">Bitte eine gültige E-Mail-Adresse eingeben.</p>}
                {state === 'error' && <p role="alert" className="mt-2 text-sm text-red-600">Das hat leider nicht geklappt — bitte nochmal versuchen.</p>}
                <p className="mt-3" style={{ ...BODY, fontSize: 11, color: MUTED }}>
                  Kein Spam. Abmeldung jederzeit mit einem Klick. <a href="/datenschutz" className="underline">Datenschutz</a>
                </p>
                <button type="button" onClick={() => setStep(QUESTIONS.length - 1)} className="mt-4 hover:text-black" style={{ ...BODY, fontSize: 12, color: MUTED }}>← Zurück</button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function KommunikationPage() {
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    root.style.scrollBehavior = 'smooth';
    track('kommunikation_lp_view');

    const restoreMeta = applyPageMeta({
      title: 'Überzeugen ist ein System · Kommunikations-Training mit Wlad Jachtchenko · LeaderOS',
      description:
        'Argumentation, Feedback, Verhandlung, Schlagfertigkeit — zehn Ansätze aus 19 Jahren Praxis, ' +
        'jeden Tag trainierbar mit KI-Coach. 14 Tage kostenlos, ohne Karte.',
      url: 'https://leader-os.de/kommunikation',
      image: 'https://leader-os.de/og-wlad.jpg',
    });
    const robots = document.createElement('meta');
    robots.name = 'robots'; robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes km-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.3333%); } }
      .km-marquee-track { animation: km-marquee 60s linear infinite; width: max-content; }
      .km-marquee:hover .km-marquee-track { animation-play-state: paused; }
      @media (prefers-reduced-motion: reduce) { .km-marquee-track { animation: none; } }
    `;
    document.head.appendChild(style);

    return () => {
      if (wasDark) root.classList.add('dark');
      root.style.scrollBehavior = '';
      restoreMeta?.();
      document.head.removeChild(robots);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen antialiased overflow-x-hidden" style={{ background: PAGE_BG, color: INK }}>
      <Navbar />
      <Hero onPlay={() => { setVideoOpen(true); track('kommunikation_video_open'); }} />
      <Ansaetze />
      <KommunikationsCheck />
      <AppShowcase />
      <ThreeStepPath tone="light" checkUrl={CHECK_URL} trialUrl={TRIAL_URL} onTrack={(e, p) => track(`kommunikation_${e}`, p)} />
      <div className="text-center pb-8" style={{ ...BODY, fontSize: 12, color: MUTED }}>
        <a href="/impressum" className="hover:underline inline-block py-3 -my-3">Impressum</a> · <a href="/datenschutz" className="hover:underline inline-block py-3 -my-3">Datenschutz</a>
      </div>
      <VideoOverlay open={videoOpen} onClose={() => setVideoOpen(false)} />
    </div>
  );
}
