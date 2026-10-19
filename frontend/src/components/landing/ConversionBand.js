import { useEffect, useState } from 'react';

/**
 * ConversionBand · sticky bottom action-strip.
 *
 * Appears after the visitor has scrolled past the hero. Always-on CTA
 * to leadercheck.de (the app). Dismissible per session. Tiny, doesn't fight
 * with the main content but constantly reminds the next step.
 */
export const ConversionBand = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (sessionStorage.getItem('leader_os_band_dismissed') === '1') {
      setDismissed(true);
      return undefined;
    }
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem('leader_os_band_dismissed', '1'); } catch {}
  };

  if (dismissed || !visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 transition-transform"
      data-testid="conversion-band"
      role="complementary"
      aria-label="Nächster Schritt"
    >
      <div className="bg-[#0A0A0A] text-white border-t border-white/10 shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.45)]">
        <div className="max-w-[1280px] mx-auto pl-5 pr-32 md:pl-10 md:pr-44 py-3 md:py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <span className="hidden sm:inline-block text-[9.5px] font-bold uppercase tracking-[0.22em] text-brand font-mono shrink-0">
              ▸ BIB · 0001
            </span>
            <span className="text-[12px] md:text-[13px] font-bold text-white/90 truncate">
              Starte mit der kostenlosen Diagnose · <span className="text-brand">5 Min · kein Abo.</span>
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <a
              href="https://leadercheck.de"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-brand text-[#0A0A0A] text-[11px] md:text-[12px] font-bold uppercase tracking-[0.12em] hover:brightness-105 active:translate-y-px transition-all"
              data-testid="band-cta"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0A0A0A] text-brand font-black leading-none text-xs" aria-hidden>+</span>
              <span className="hidden sm:inline">Diagnose starten</span>
              <span className="sm:hidden">Start</span>
            </a>
            <button
              onClick={dismiss}
              className="text-white/40 hover:text-white text-lg leading-none px-1.5 font-mono"
              aria-label="Hinweis ausblenden"
              data-testid="band-dismiss"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
