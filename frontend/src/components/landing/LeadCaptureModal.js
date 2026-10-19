import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, withFallback } from '../../lib/brandAssets';
import { WebinarFollowPopup } from './WebinarFollowPopup';

const STORAGE_KEY = 'leader_os_lead_capture_seen_at';
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // one popup per visitor per week

/**
 * LeadCaptureModal · Exit-intent conversion popup, godmode skin.
 *
 *   Layout (desktop):
 *     ┌──────────────────────────────────────────────────────┐
 *     │  [scarcity strip]                          [× close] │
 *     ├──────────────────────────────────────────────────────┤
 *     │ ┌─────────────┐ │ ▸ WLAD JACHTCHENKO                 │
 *     │ │ Halftone    │ │ "Lass uns kurz schauen…"          │
 *     │ │ Wlad        │ │                                    │
 *     │ │ portrait    │ │ 30 TAGE. NEUES DU.                 │
 *     │ │ (B&W + lime │ │ +12 Monate Mitgliedschaft.         │
 *     │ │  multiply)  │ │                                    │
 *     │ │             │ │ Body copy…                         │
 *     │ │             │ │                                    │
 *     │ │ ● LIVE      │ │ [3-step BIB strip]                 │
 *     │ │ 12/30 FREI  │ │                                    │
 *     │ │             │ │ [email + ⊕ Diagnose starten]      │
 *     │ │             │ │                                    │
 *     │ └─────────────┘ │ Kein Spam · …                      │
 *     ├──────────────────────────────────────────────────────┤
 *     │ 400K · 3× SPIEGEL · 20 LÄNDER · 14 TAGE GELD-ZURÜCK   │
 *     └──────────────────────────────────────────────────────┘
 *
 *   Mobile collapses to single-column: portrait becomes a 16:9 header band,
 *   content stacks below.
 *
 *   Triggers + suppressors unchanged from prior version (exit-intent on
 *   desktop, suppressed by newsletter-zone visibility or successful
 *   newsletter:subscribed event). 7-day cooldown via localStorage.
 */
export const LeadCaptureModal = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Timestamp of a non-converting dismissal (X / backdrop / Escape). Arms
  // the WebinarFollowPopup 35s countdown — never set on successful submit.
  const [dismissedAt, setDismissedAt] = useState(0);
  const triggered = useRef(false);
  // Hard minimum dwell · the capture never opens before the visitor has
  // spent 1 minute on the page, no matter which trigger fires.
  const canShow = useRef(false);
  const navigate = useNavigate();

  const eligible = () => {
    if (typeof window === 'undefined') return false;
    try {
      const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
      return Date.now() - last > COOLDOWN_MS;
    } catch {
      return true;
    }
  };

  const armCooldown = () => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
    triggered.current = true;
  };

  useEffect(() => {
    if (!eligible()) return undefined;

    const trigger = () => {
      if (triggered.current) return;
      if (!canShow.current) return; // never before the 1-minute minimum
      armCooldown();
      setOpen(true);
    };

    const onMouseLeave = (e) => {
      if (e.clientY <= 0) trigger();
    };

    let observer = null;
    const zones = document.querySelectorAll('[data-newsletter-zone]');
    if (zones.length > 0 && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              armCooldown();
              observer.disconnect();
              observer = null;
              break;
            }
          }
        },
        { threshold: 0.25 },
      );
      zones.forEach((z) => observer.observe(z));
    }

    // The capture is gated behind a 1-minute minimum dwell (canShow). After
    // that gate opens it fires on its own; exit-intent and deep scroll can
    // also open it, but never earlier. Mobile has no exit-intent, so the
    // timed open + deep-scroll path is what phone visitors get.
    const onScroll = () => {
      if (triggered.current || !canShow.current) return;
      const reached = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && reached / total > 0.58) trigger();
    };
    const dwellTimer = setTimeout(() => {
      canShow.current = true;
      trigger();
    }, 60000);

    const onSubscribed = () => armCooldown();
    window.addEventListener('newsletter:subscribed', onSubscribed);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      clearTimeout(dwellTimer);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('newsletter:subscribed', onSubscribed);
      if (observer) observer.disconnect();
    };
  }, []);

  // Any dismissal path (X, backdrop, Escape) counts as "closed without
  // converting" and arms the webinar follow-up popup.
  const close = () => {
    setOpen(false);
    setDismissedAt(Date.now());
  };

  // Esc key closes
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setDismissedAt(Date.now());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = (email || '').trim();
    if (!trimmed || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    setSubmitting(true);
    setError('');

    if (typeof window !== 'undefined' && window.posthog?.capture) {
      try {
        window.posthog.identify(trimmed.toLowerCase());
        window.posthog.capture('lead_captured', {
          email: trimmed,
          source: 'landing-popup',
          campaign: 'leader-os-launch',
          surface: 'leader-os',
        });
      } catch { /* posthog errors never block UX */ }
    }

    try {
      await fetch('/api/leader-check/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          source: 'landing-popup',
          campaign: 'leader-os-launch',
        }),
        keepalive: true,
      });
    } catch { /* swallow · funnel continues */ }

    navigate(`/thank-you?email=${encodeURIComponent(trimmed)}`);
  };

  return (
    <>
      {/* Popup 2 · webinar follow-up, armed only by a non-converting close */}
      <WebinarFollowPopup armedAt={dismissedAt} />

      {open && (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#0A0A0A]/85 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        onClick={close}
        data-testid="lead-capture-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="relative w-full max-w-3xl bg-background text-foreground border-2 border-foreground shadow-[0_40px_140px_-25px_rgba(0,0,0,0.7),12px_12px_0_0_rgba(191,255,0,0.85)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.6 }}
        >
          {/* Top lime hairline */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand z-10" aria-hidden />

          {/* Specimen header */}
          <div className="flex items-center justify-between px-5 sm:px-7 md:px-9 pt-5 pb-3 border-b border-foreground/15">
            <span className="inline-flex items-center gap-2 font-mono text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.22em] text-foreground">
              <span className="relative inline-flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-brand-strong animate-ping opacity-75" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-brand-strong" />
              </span>
              LEADER · OS · WERDE TEIL
            </span>
            <button
              onClick={close}
              aria-label="Schließen"
              className="text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-colors w-9 h-9 -mr-2 flex items-center justify-center text-xl leading-none font-mono"
              data-testid="lead-modal-close"
            >
              ×
            </button>
          </div>

          {/* Body · 2-column on desktop, stacked on mobile */}
          <div className="grid md:grid-cols-12">
            {/* LEFT · clean Wlad portrait + live scarcity */}
            <div className="md:col-span-5 relative bg-foreground/5 overflow-hidden order-1 md:order-1">
              <div className="relative w-full aspect-[4/3] md:aspect-auto md:h-full md:min-h-[460px] overflow-hidden">
                <img
                  src={WLAD_AVATAR}
                  onError={withFallback(WLAD_AVATAR_FALLBACKS)}
                  alt="Wlad Jachtchenko · Argumentations-Coach und Autor · LeaderOS für jede Führungskraft offen"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover object-[50%_18%]"
                />
                {/* Bottom-only dark gradient for scarcity-card legibility · no
                    color tint over Wlad himself. The natural portrait carries
                    the editorial weight. */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0) 100%)',
                  }}
                />

                {/* Top-left credit pill */}
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 bg-white/95 backdrop-blur-sm font-mono text-[8.5px] font-bold uppercase tracking-[0.22em] text-foreground">
                  ▸ WLAD JACHTCHENKO
                </div>

                {/* Bottom: live scarcity card on photo */}
                <div className="absolute left-3 right-3 bottom-3">
                  <div className="bg-white border-2 border-foreground px-3.5 py-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]">
                    <div className="flex items-center gap-2">
                      <span className="relative inline-flex w-1.5 h-1.5 shrink-0">
                        <span className="absolute inset-0 rounded-full bg-brand-strong animate-ping opacity-75" />
                        <span className="relative w-1.5 h-1.5 rounded-full bg-brand-strong" />
                      </span>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-foreground/55">
                        KOSTENLOS · LIVE
                      </span>
                    </div>
                    <div
                      className="mt-1 text-foreground leading-none"
                      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: '-0.025em' }}
                    >
                      10 Min<span className="text-brand-strong not-italic">.</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.2em] text-foreground/55">
                      Leader-Check · dein Score sofort
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT · content + form */}
            <div className="md:col-span-7 px-5 sm:px-7 md:px-8 py-6 md:py-7 order-2 md:order-2">
              <h2
                id="lead-modal-title"
                className="text-[32px] sm:text-[40px] md:text-[44px] leading-[0.92] tracking-[-0.04em] text-foreground text-center md:text-left"
                style={{
                  fontFamily: 'Outfit, Inter, sans-serif',
                  fontWeight: 900,
                  fontStyle: 'italic',
                }}
              >
                14 Tage<span className="text-brand-strong not-italic">.</span><br />
                <span className="text-foreground/55">Kostenlos</span>
                <span className="text-brand-strong not-italic">.</span>
              </h2>

              <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.18em] text-brand-strong font-mono text-center md:text-left">
                ▸ KEINE KARTE · JEDERZEIT KÜNDBAR
              </p>

              <p className="mt-4 text-[14px] md:text-[14.5px] leading-[1.55] text-foreground/75 text-center md:text-left">
                Du loggst dich ein, du arbeitest mit dem System, du entscheidest.{' '}
                <span className="text-foreground font-bold">11 Frameworks, WladBot 24/7, voller Plattform-Zugang</span> · vierzehn Tage lang.
                Erst wenn es für dich passt, machst du weiter.
              </p>

              {/* 3-Schritt BIB-Strip · klare Reihenfolge ohne Preis-Push */}
              <div className="mt-5 grid grid-cols-3 gap-2 border-y-2 border-foreground py-3.5">
                {[
                  { nr: '01', label: 'TRIAL',      value: '14 TAGE',  sub: 'KOSTENLOS', highlight: true },
                  { nr: '02', label: 'COACH',      value: '24/7',     sub: 'WLADBOT' },
                  { nr: '03', label: 'ZERTIFIKAT', value: '0001',     sub: 'LINKEDIN' },
                ].map(({ nr, label, value, sub, highlight }) => (
                  <div key={nr} className={`text-center px-1 py-1 ${highlight ? 'bg-brand/10 border border-brand' : ''}`}>
                    <div className={`text-[8.5px] font-bold uppercase tracking-[0.22em] font-mono ${highlight ? 'text-brand-strong' : 'text-brand-strong'}`}>
                      ▸ {nr}
                    </div>
                    <div className="text-[8.5px] font-bold uppercase tracking-[0.16em] font-mono text-foreground/55 mt-0.5">
                      {label}
                    </div>
                    <div
                      className="mt-1.5 text-foreground leading-none"
                      style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(15px, 2.2vw, 19px)', letterSpacing: '-0.02em' }}
                    >
                      {value}
                    </div>
                    <div className={`text-[8.5px] font-bold uppercase tracking-[0.16em] font-mono mt-1.5 ${highlight ? 'text-foreground' : 'text-foreground/45'}`}>
                      {sub}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={onSubmit} className="mt-5 space-y-3">
                <label className="block">
                  <span className="block text-[9.5px] font-bold uppercase tracking-[0.24em] text-foreground/55 mb-2 font-mono">
                    DEINE E-MAIL · KEIN LOGIN
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dein.name@firma.de"
                    required
                    autoFocus
                    className="w-full px-4 h-12 bg-foreground/[0.03] border-2 border-foreground/20 focus:border-foreground focus:bg-background focus:outline-none focus:ring-4 focus:ring-brand/30 text-foreground text-[15px] transition-all font-medium"
                    data-testid="lead-modal-email"
                  />
                </label>

                {error && (
                  <p className="text-[12px] text-red-600 dark:text-red-400 font-semibold">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="group w-full inline-flex items-center justify-center gap-3 px-5 h-13 py-3.5 bg-foreground hover:bg-brand text-background hover:text-[#0A0A0A] border-2 border-foreground text-[12.5px] font-bold uppercase tracking-[0.14em] active:scale-[0.985] transition-all disabled:opacity-60 shadow-[4px_4px_0_0_#BFFF00]"
                  data-testid="lead-modal-submit"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand text-[#0A0A0A] group-hover:bg-foreground group-hover:text-brand text-base font-black leading-none transition-colors" aria-hidden>+</span>
                  {submitting ? 'Wird gestartet…' : '14 Tage kostenlos starten'}
                </button>
              </form>
            </div>
          </div>

          {/* Authority footer strip */}
          <div className="bg-[#0A0A0A] text-white px-5 sm:px-7 md:px-9 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center sm:text-left">
            {[
              ['400K+', 'KLIENTEN'],
              ['3×',    'SPIEGEL-BESTSELLER'],
              ['20',    'LÄNDER'],
              ['14',    'TAGE KOSTENLOS'],
            ].map(([big, small]) => (
              <div key={small} className="leading-tight">
                <div className="font-mono text-[12px] font-bold text-brand tabular-nums">
                  {big}
                </div>
                <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-white/55 mt-0.5">
                  {small}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
      )}
    </>
  );
};
