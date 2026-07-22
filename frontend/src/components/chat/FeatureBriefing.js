/**
 * FeatureBriefing — Premium, dismissible „Was ist das & wie nutze ich das?"-Card.
 *
 * Zweck (Iter 121.2, Wlad-Feedback): Wenn Cohort-Leader zum ersten Mal auf
 * Coach-Mode oder Context-Folders stoßen, brauchen sie eine 2-Sekunden-
 * Antwort: „Was macht das?" + „Wie nutze ich es?" — statt Trial-and-Error.
 *
 * UX-Regeln:
 *   • Inline-Card (kein Modal) → nicht blockierend
 *   • Ein-Klick dismissible, per `storageKey` in localStorage gemerkt
 *   • Premium-Look: lime-gradient Border, sanfte Icon-Animation, Bullet-Liste
 *   • Auch als IconPopover verfügbar für spätere „?"-Hilfe-Buttons
 */
import { useState, useEffect } from 'react';
import { Sparkles, X, ChevronRight } from 'lucide-react';

const DISMISS_PREFIX = 'leaderos:briefing-dismissed:';

function _isDismissed(key) {
  if (typeof window === 'undefined' || !key) return false;
  try { return localStorage.getItem(DISMISS_PREFIX + key) === '1'; }
  catch { return false; }
}

function _dismiss(key) {
  if (typeof window === 'undefined' || !key) return;
  try { localStorage.setItem(DISMISS_PREFIX + key, '1'); } catch { /* private mode */ }
}

/**
 * Reset-Helper für Debug/Testing.
 *   window.leaderos_reset_briefings()
 */
if (typeof window !== 'undefined') {
  window.leaderos_reset_briefings = () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(DISMISS_PREFIX))
        .forEach(k => localStorage.removeItem(k));
      console.log('[leaderos] all feature briefings reset');
    } catch (e) { console.warn(e); }
  };
}

export function FeatureBriefing({
  storageKey,        // localStorage-Key — leer = kein Dismiss-Memory (dev)
  icon: Icon = Sparkles,
  eyebrow,           // z.B. "COACH-MODUS"
  title,             // z.B. "Wlad denkt in Strategie & Schritten"
  bullets = [],      // ["…", "…"]
  cta,               // { label: 'Ordner anlegen', onClick }
  tone = 'lime',     // 'lime' (default) | 'gold' (premium accent)
  className = '',
  testId = 'feature-briefing',
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!storageKey || !_isDismissed(storageKey)) setVisible(true);
  }, [storageKey]);

  if (!visible) return null;

  const toneStyles = tone === 'gold'
    ? { border: 'rgba(255,215,0,0.35)', glow: 'rgba(255,215,0,0.10)', dot: '#FFD700', text: '#8A6D00' }
    : { border: 'rgba(191,255,0,0.35)', glow: 'rgba(191,255,0,0.10)', dot: '#BFFF00', text: '#6B8A00' };

  const handleClose = () => {
    if (storageKey) _dismiss(storageKey);
    setVisible(false);
  };

  return (
    <div
      data-testid={testId}
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 animate-fade-in ${className}`}
      style={{
        background: `linear-gradient(135deg, ${toneStyles.glow} 0%, rgba(255,255,255,0) 55%)`,
        border: `1px solid ${toneStyles.border}`,
        boxShadow: `0 8px 32px -12px ${toneStyles.glow}`,
      }}
    >
      {/* Grain-Overlay für Premium-Feel */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
      }} />

      <button
        type="button"
        onClick={handleClose}
        aria-label="Briefing schließen"
        data-testid={`${testId}-close`}
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"
      >
        <X size={13} strokeWidth={2.4} />
      </button>

      <div className="relative flex items-start gap-3 pr-6">
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: toneStyles.dot, color: '#0A0A0A' }}
        >
          <Icon size={16} strokeWidth={2.4} />
        </div>

        <div className="flex-1 min-w-0">
          {eyebrow && (
            <p className="text-[9.5px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: toneStyles.text }}>
              {eyebrow}
            </p>
          )}
          <h4 className="text-[14px] sm:text-[15px] font-black leading-snug tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {title}
          </h4>

          {bullets.length > 0 && (
            <ul className="mt-2.5 space-y-1.5" data-testid={`${testId}-bullets`}>
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-foreground/72">
                  <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: toneStyles.dot }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {cta && (
            <button
              type="button"
              onClick={cta.onClick}
              data-testid={`${testId}-cta`}
              className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-black transition-all hover:gap-1.5"
              style={{ color: toneStyles.text }}
            >
              {cta.label} <ChevronRight size={13} strokeWidth={2.6} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FeatureBriefing;
