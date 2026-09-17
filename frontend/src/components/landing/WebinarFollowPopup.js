import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const STORAGE_KEY = 'leader_os_webinar_follow_seen_at';
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // max once per visitor per week
const DELAY_MS = 35000; // 35s after the lead-capture popup was dismissed

// Module-level session guard · survives remounts within the same page
// session, resets on full reload — "never twice in the same session".
let shownThisSession = false;

/**
 * WebinarFollowPopup · step 2 of the landing popup funnel.
 *
 * Shows a value-first, non-aggressive webinar invitation 35 seconds after
 * the visitor dismissed the LeadCaptureModal WITHOUT converting. Mounted
 * from LeadCaptureModal itself (not from LandingPage) — the parent passes
 * `armedAt` (timestamp of the dismissal) to start the countdown.
 *
 * Frequency rules:
 *   - max once per visitor per 7 days (own localStorage key)
 *   - never twice in the same session
 *   - never on /webinar itself
 *
 * All claims verified against docs/gtm/WLAD_CANON.md + WebinarPage.js:
 * 400.000+ Klienten · 3× SPIEGEL-Bestseller · 4,9/5 Trustpilot (388) ·
 * webinar date DO 15. OKTOBER 2026 · 10:00 UHR.
 */
export const WebinarFollowPopup = ({ armedAt = 0 }) => {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const eligible = () => {
    if (typeof window === 'undefined') return false;
    if (shownThisSession) return false;
    if (location.pathname.startsWith('/webinar')) return false;
    try {
      const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
      return Date.now() - last > COOLDOWN_MS;
    } catch {
      return true;
    }
  };

  // Arm the 35s countdown when the parent signals "popup 1 dismissed
  // without converting".
  useEffect(() => {
    if (!armedAt || !eligible()) return undefined;

    timerRef.current = setTimeout(() => {
      if (shownThisSession) return;
      shownThisSession = true;
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
      setOpen(true);
      if (typeof window !== 'undefined' && window.posthog?.capture) {
        try {
          window.posthog.capture('webinar_follow_popup_shown', { surface: 'leader-os' });
        } catch { /* analytics never block UX */ }
      }
    }, DELAY_MS);

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armedAt]);

  // Escape closes
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Body scroll lock while open
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const close = () => setOpen(false);

  const onCta = () => {
    if (typeof window !== 'undefined' && window.posthog?.capture) {
      try {
        window.posthog.capture('webinar_follow_popup_cta_click', { surface: 'leader-os' });
      } catch { /* analytics never block UX */ }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-[#0A0A0A]/85 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="webinar-follow-title"
          onClick={close}
          data-testid="webinar-follow-popup"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto bg-background text-foreground border-2 border-foreground sm:shadow-[0_40px_140px_-25px_rgba(0,0,0,0.7),12px_12px_0_0_rgba(191,255,0,0.85)]"
            onClick={(e) => e.stopPropagation()}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 320, damping: 28, mass: 0.6 }
            }
          >
            {/* Top lime hairline */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand z-10" aria-hidden />

            {/* Specimen header */}
            <div className="flex items-center justify-between px-5 sm:px-7 pt-5 pb-3 border-b border-foreground/15">
              <span className="inline-flex items-center gap-2 font-mono text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.22em] text-foreground">
                <span className="relative inline-flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full bg-brand-strong animate-ping opacity-75" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-brand-strong" />
                </span>
                LEADER · OS · WEBINAR
              </span>
              <button
                onClick={close}
                aria-label="Schließen"
                className="text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-colors w-9 h-9 -mr-2 flex items-center justify-center text-xl leading-none font-mono"
                data-testid="webinar-follow-close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-5 sm:px-7 py-6">
              <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.24em] text-brand-strong">
                ▸ DO 15. OKTOBER 2026 · 10:00 UHR · LIVE
              </p>

              <h2
                id="webinar-follow-title"
                className="mt-3 text-[30px] sm:text-[38px] leading-[0.92] tracking-[-0.04em] text-foreground"
                style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
              >
                Kostenloses<br />
                Executive Webinar<span className="text-brand-strong not-italic">.</span>
              </h2>

              <p className="mt-4 text-[14px] leading-[1.55] text-foreground/75">
                Wlad zeigt live, wie Führungskräfte mit einem{' '}
                <span className="text-foreground font-bold">KI-Operating-System täglich trainieren</span>{' '}
                — 15 Minuten am Tag statt Seminar-Marathon. 90 Minuten, mit Live Q&amp;A.
              </p>

              {/* 3 value bullets · from the real webinar agenda */}
              <ul className="mt-5 space-y-3 border-y-2 border-foreground py-4">
                {[
                  ['01', 'Schwierige Gespräche', 'Kritik äußern, ohne Vertrauen zu verlieren — mit Skript statt Bauchgefühl.'],
                  ['02', 'KI-Coach & Simulationen', 'Live-Demo: täglich mit WladBot trainieren und Führungssituationen durchspielen, bevor sie passieren.'],
                  ['03', '30-Tage-Challenge', 'Der Trainingsplan + die Frameworks hinter 400.000+ Coachings — von SEXIER bis zur Feedbackformel.'],
                ].map(([nr, title, desc]) => (
                  <li key={nr} className="flex items-start gap-3">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-strong pt-[3px] shrink-0">
                      ▸ {nr}
                    </span>
                    <span className="text-[13px] leading-[1.5] text-foreground/75">
                      <span className="text-foreground font-bold">{title}</span> — {desc}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/webinar"
                onClick={onCta}
                className="group mt-5 w-full inline-flex items-center justify-center gap-3 px-5 py-3.5 bg-foreground hover:bg-brand text-background hover:text-[#0A0A0A] border-2 border-foreground text-[12.5px] font-bold uppercase tracking-[0.14em] active:scale-[0.985] transition-all shadow-[4px_4px_0_0_#BFFF00]"
                data-testid="webinar-follow-cta"
              >
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-brand text-[#0A0A0A] group-hover:bg-foreground group-hover:text-brand text-base font-black leading-none transition-colors"
                  aria-hidden
                >
                  +
                </span>
                Kostenlosen Platz sichern
              </Link>

              <p className="mt-4 font-mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-foreground/45 text-center">
                4,9/5 TRUSTPILOT · 400.000+ FÜHRUNGSKRÄFTE · 3× SPIEGEL-BESTSELLER
              </p>

              <button
                type="button"
                onClick={close}
                className="mt-3 w-full text-center text-[11px] text-foreground/40 hover:text-foreground/70 transition-colors underline underline-offset-2"
                data-testid="webinar-follow-dismiss"
              >
                Vielleicht später
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WebinarFollowPopup;
