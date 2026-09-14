/**
 * OnboardingVideoModal — Welcome-Video von Wlad nach erstem Login.
 *
 * Iter 92.10 (Mert): Vimeo-Embed statt Drive, GSAP-Choreography statt
 * pure CSS, "FREE/Free"-Wording komplett ausgemerzt — wir verkaufen
 * keine Free-Calls, wir verkaufen Wlads Zeit (unverbindlich, 15 Min).
 *
 * Logik:
 *   - Triggert EINMAL pro Browser (`localStorage.wlad_onboarding_video_seen_v1`).
 *   - GSAP entrance: backdrop fade → card scale-up + slide → headline word-stagger
 *     → video fade → CTA-Row spring-in.
 *   - Dismiss via X-Button, click-outside, oder "Später ansehen".
 *   - CTA "Strategiegespräch buchen" öffnet Cal.com Modal.
 *
 * Video-Source: Vimeo 1197728183 (Mert lieferte den Link am 26.02.26).
 */
import { useEffect, useRef, useState } from 'react';
import { X, PlayCircle, Calendar, ArrowRight, Bot, Target, UserRound } from 'lucide-react';
import gsap from 'gsap';
import { useBookConsultation } from '../brand/BookConsultationButton';
// Iter 92.32 (Mert): Vimeo embed entfernt — Privacy-Settings konnten den
// Player blockieren ("Sorry, this video cannot be played here"). Stattdessen
// beautiful benefit-cards die immer funktionieren.

const STORAGE_KEY = 'wlad_onboarding_video_seen_v1';

const HEADLINE_WORDS = ['Schau', 'dir', 'kurz', 'an,', 'wie', 'du', 'startest.'];

export const OnboardingVideoModal = () => {
  const [open, setOpen] = useState(false);
  const openBooking = useBookConsultation();
  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  const headlineRef = useRef(null);
  const videoRef = useRef(null);
  const ctaRef = useRef(null);
  const eyebrowRef = useRef(null);
  const subRef = useRef(null);

  useEffect(() => {
    // Iter 92.34 (Mert Go-Live): "alle PopUps bitte erstmal weglassen" →
    // Onboarding-Modal komplett disabled für Launch-Phase. Re-enable via flag.
    return undefined;
  }, []);

  // GSAP entrance choreography — runs when `open` flips true
  useEffect(() => {
    if (!open) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return undefined;
    }
    let ctx;
    try {
      ctx = gsap.context(() => {
        if (!overlayRef.current || !cardRef.current) return;
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo(overlayRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.35 })
          .fromTo(cardRef.current,
            { y: 40, scale: 0.96, autoAlpha: 0 },
            { y: 0, scale: 1, autoAlpha: 1, duration: 0.7, ease: 'back.out(1.4)' }, '-=0.18');
        if (eyebrowRef.current) tl.fromTo(eyebrowRef.current,
          { y: 10, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35 }, '-=0.35');
        const words = headlineRef.current?.querySelectorAll('span.word');
        if (words && words.length) tl.fromTo(words,
          { y: 24, autoAlpha: 0, rotateX: -45 },
          { y: 0, autoAlpha: 1, rotateX: 0, duration: 0.55, stagger: 0.06 }, '-=0.2');
        if (subRef.current) tl.fromTo(subRef.current,
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.4 }, '-=0.3');
        if (videoRef.current) tl.fromTo(videoRef.current,
          { autoAlpha: 0, scale: 0.97 },
          { autoAlpha: 1, scale: 1, duration: 0.55 }, '-=0.2');
        const ctaChildren = ctaRef.current?.children;
        if (ctaChildren && ctaChildren.length) tl.fromTo(ctaChildren,
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.08, ease: 'back.out(1.6)' }, '-=0.25');
      });
    } catch { /* GSAP target missing — modal still visible via fallback opacity:0→default styles */ }
    return () => { try { ctx?.revert(); } catch { /* noop */ } };
  }, [open]);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* noop */ }
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduceMotion || !cardRef.current || !overlayRef.current) {
      setOpen(false);
      return;
    }
    try {
      gsap.to(cardRef.current, { y: 30, scale: 0.97, autoAlpha: 0, duration: 0.25, ease: 'power2.in' });
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.3, delay: 0.05, onComplete: () => setOpen(false) });
    } catch {
      // GSAP threw (refs went null mid-animation) — just close the modal
      setOpen(false);
    }
  };

  const handleBookCall = () => {
    dismiss();
    setTimeout(openBooking, 320);
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
      data-testid="onboarding-video-modal"
      style={{ opacity: 0 }}
    >
      <div
        ref={cardRef}
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden bg-[#0A0A0A] border border-white/[0.08] shadow-[0_50px_140px_-30px_rgba(191,255,0,0.28)]"
        onClick={(e) => e.stopPropagation()}
        style={{ opacity: 0 }}
      >
        {/* Aurora glow layers — purely decorative */}
        <div className="pointer-events-none absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-[#BFFF00]/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-[#7B3FE4]/18 blur-3xl" aria-hidden />
        {/* Grain texture for premium feel */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'><filter id=\'n\'><feTurbulence baseFrequency=\'0.9\' numOctaves=\'3\'/></filter><rect width=\'120\' height=\'120\' filter=\'url(%23n)\'/></svg>")' }}
          aria-hidden
        />

        {/* Close */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.18] active:scale-90 flex items-center justify-center text-white/70 hover:text-white transition-all"
          data-testid="onboarding-video-close"
          aria-label="Schließen"
        >
          <X size={16} />
        </button>

        <div className="relative p-6 sm:p-8 pb-4">
          <div ref={eyebrowRef} className="flex items-center gap-2 mb-2" style={{ opacity: 0 }}>
            <div className="w-7 h-7 rounded-lg bg-[#BFFF00]/20 flex items-center justify-center">
              <PlayCircle size={14} className="text-[#BFFF00]" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#BFFF00] font-black">
              Willkommen bei Leader·OS
            </span>
          </div>
          <h2
            ref={headlineRef}
            className="text-2xl sm:text-[34px] font-black text-white tracking-tight leading-[1.05]"
            style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em', perspective: '600px' }}
          >
            {HEADLINE_WORDS.map((w, i) => (
              <span key={`${w}-${i}`} className="word inline-block mr-[0.28em]" style={{ opacity: 0 }}>
                {w}
              </span>
            ))}
          </h2>
          <p ref={subRef} className="text-sm text-white/55 mt-2.5 max-w-md" style={{ opacity: 0 }}>
            90 Sekunden von Wlad: was du als Erstes anpackst, wie du in 30 Tagen messbar weiter
            kommst — und warum ein 15-Min-Termin mit unserem Team der schnellste Hebel ist.
          </p>
        </div>

        {/* ── Hero Benefits (Iter 92.32 launch-safe — replaces fragile Vimeo embed) ──
            Vimeo "Privacy settings" konnten Embed blockieren → catastrophic UX.
            Stattdessen: 3 Benefit-Cards die in 5 Sekunden zeigen WAS Leader-OS kann.
            Wlad-Video bleibt zugänglich über die "WladBot hören" Card auf dem Dashboard. */}
        <div ref={videoRef} className="relative px-6 sm:px-8 pb-2" style={{ opacity: 0 }}>
          <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#BFFF00]/[0.08] via-white/[0.02] to-transparent border border-[#BFFF00]/20 p-6 sm:p-7">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#BFFF00]/15 blur-[60px] pointer-events-none" aria-hidden />

            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Bot, title: '24/7 KI-Coach', desc: 'Stell deine Frage, erhalte Antworten aus Wlads Wissensbasis.' },
                { icon: Target, title: '16 Video-Missionen', desc: '60 Sek Pitch aufnehmen → KI bewertet nach Wlads Framework.' },
                { icon: UserRound, title: '1:1 Coaching', desc: 'Mit Wlads Expertenteam — direkt einen Slot wählen.' },
              ].map((b, i) => (
                <div
                  key={b.title}
                  className="flex flex-col items-start gap-1.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#BFFF00]/30 transition-colors"
                  data-testid={`onboarding-benefit-${i}`}
                >
                  <b.icon size={22} className="text-[#BFFF00]" aria-hidden />
                  <p className="text-[13px] font-bold text-white leading-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                    {b.title}
                  </p>
                  <p className="text-[11.5px] text-white/55 leading-snug">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Row — Iter 92.18 mobile fix: h-12 forces touch-target, flex-1 entfernt für column-stack */}
        <div ref={ctaRef} className="relative flex flex-col sm:flex-row gap-3 p-6 sm:p-8 pt-5">
          <button
            type="button"
            onClick={handleBookCall}
            className="btn-shine glow-lime sm:flex-1 inline-flex items-center justify-center gap-2 h-12 min-h-12 px-6 rounded-xl bg-[#BFFF00] text-[#0A0A0A] font-black text-sm hover:bg-[#D4FF4D] transition-all"
            data-testid="onboarding-video-book-call"
            style={{ opacity: 0 }}
          >
            <Calendar size={15} />
            Strategiegespräch buchen
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex items-center justify-center h-12 min-h-12 px-6 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/85 font-semibold text-sm transition-colors"
            data-testid="onboarding-video-skip"
            style={{ opacity: 0 }}
          >
            Später ansehen
          </button>
        </div>

        {/* Trust strip */}
        <div className="relative px-6 sm:px-8 pb-5 flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/35 font-semibold">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            15 Min · 1:1 mit Wlads Expertenteam · Unverbindlich
          </span>
          <span className="text-white/15">·</span>
          <span>Wird nur einmal angezeigt</span>
        </div>
      </div>
    </div>
  );
};

export default OnboardingVideoModal;
