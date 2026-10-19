import { useEffect, useState } from 'react';

/**
 * GreatorBanner · top-of-page event hook für Greator Festival 2026.
 *
 * Schwarz auf Lime. SF Mono. Sehr dünn, dismissible per Session.
 * Position: ALLERobersten Edge der Landing, vor LandingNav.
 *
 * CTA: scrollt zu /greator-onsite oder öffnet Cal.com · je nach Stand
 * der Event-Anmelde-Page.
 *
 * Auto-hide nach Event-Datum, falls vergessen abzuschalten:
 *   EVENT_END = 2026-06-27 → 28.06 zeigt die Komponente garantiert nicht mehr.
 */

const EVENT_END = new Date('2026-06-28T00:00:00+02:00');

export const GreatorBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new Date() >= EVENT_END) return;
    if (sessionStorage.getItem('greator_banner_dismissed') === '1') return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem('greator_banner_dismissed', '1'); } catch {}
  };

  return (
    <div
      role="complementary"
      aria-label="Greator Festival 2026"
      data-testid="greator-banner"
      className="relative z-50 w-full bg-brand text-black border-b-2 border-black"
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <span className="hidden sm:inline-block font-mono text-[9.5px] font-bold tracking-[0.22em] uppercase shrink-0">
            ▸ LIVE · GREATOR 2026
          </span>
          <a
            href="https://greator.com/coach/wlad-jachtchenko"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] sm:text-[13px] font-bold tracking-[-0.005em] truncate hover:underline"
          >
            Triff Wlad live · LANXESS Arena Köln · 26.–27. Juni
            <span className="ml-2 inline-block font-mono font-bold tracking-[0.18em] uppercase text-[10.5px] underline underline-offset-2">
              Stand finden →
            </span>
          </a>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-black/55 hover:text-black text-[18px] leading-none px-1.5 font-mono"
          aria-label="Hinweis ausblenden"
          data-testid="greator-dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
};
