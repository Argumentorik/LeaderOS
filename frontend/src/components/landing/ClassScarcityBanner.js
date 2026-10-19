import { useEffect, useState } from 'react';

/**
 * ClassScarcityBanner · top-of-page editorial invite strip.
 *
 * Benefit-led, inklusiv: führt mit dem kostenlosen Leader-Check und der
 * Einladung, Teil von LeaderOS zu werden · keine Scarcity, keine
 * Seat-Counts. Dismissible per Session.
 *
 * Editorial single-line: lime live-dot, mono BIB-code separators,
 * one inline link, optional dismiss. No progress bar · the message is
 * purely action + benefit, which converts better than chrome.
 */

// The banner leads with the free Leader-Check action and a clear invite
// to join LeaderOS · benefit-first, no counters the visitor can't
// verify. Only the per-session dismiss flag remains.
const STORAGE_DISMISS = 'leaderos_charter_0001_dismissed';

export const ClassScarcityBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_DISMISS) === '1') return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem(STORAGE_DISMISS, '1'); } catch { /* ignore */ }
  };

  return (
    <div
      role="complementary"
      aria-label="Werde Teil von LeaderOS. Starte mit dem kostenlosen Leader-Check."
      data-testid="class-scarcity-banner"
      className="relative z-50 w-full bg-[#0A0A0A] text-white"
    >
      <div className="max-w-[1400px] mx-auto pl-5 md:pl-10 pr-2 md:pr-4 h-10 md:h-11 flex items-center gap-4 md:gap-6">
        {/* Live-dot + plain-language mark */}
        <span className="hidden sm:inline-flex items-center gap-2 font-mono text-[9.5px] font-bold tracking-[0.28em] uppercase shrink-0 text-brand">
          <span className="relative inline-flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-brand animate-ping opacity-75" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-brand" />
          </span>
          JETZT STARTEN
        </span>

        {/* Mono hairline separator */}
        <span aria-hidden className="hidden md:inline-block w-px h-3 bg-white/20" />

        {/* Inline action line · the free Leader-Check is the gateway.
            No seat-count number anymore · the message is purely the
            action + benefit, which converts better than a counter the
            visitor can't verify. */}
        <p className="flex-1 min-w-0 truncate text-[12px] sm:text-[13px] font-medium tracking-tight text-white/85">
          <span className="text-white">10 Minuten Leader-Check</span>
          <span className="text-white/55"> · finde in zehn Minuten heraus wo du stehst und ob LeaderOS zu dir passt.</span>
        </p>

        {/* Inline CTA · the free Leader-Check is the micro-conversion
            that feeds LeaderOS · one click away, top of every page. */}
        <a
          href="https://leadercheck.de"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 h-7 bg-brand hover:bg-white text-black font-mono font-bold tracking-[0.18em] uppercase text-[10.5px] transition-colors shrink-0"
          data-testid="class-scarcity-cta"
        >
          Kostenlos starten <span aria-hidden>→</span>
        </a>

        {/* Dismiss, muted but reachable */}
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-white/35 hover:text-white text-[16px] leading-none w-8 h-8 flex items-center justify-center font-mono transition-colors"
          aria-label="Hinweis ausblenden"
          data-testid="class-scarcity-dismiss"
        >
          ×
        </button>
      </div>

      {/* Hairline accent so the strip reads as a deliberate page-rule,
          not an interrupting banner. */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-brand/30" />
    </div>
  );
};
