/**
 * SmartConsultationBanner — Iter 92.28 (Mert)
 *
 * Tier-aware Cal.com booking nudge that adapts its copy + visual weight
 * based on what the user already pays.
 *
 *  - free  → big lime CTA: "30-Min-Strategiegespräch · 0€"
 *            (push toward Standard/Accelerator)
 *  - standard → softer glass card: "Lass uns deinen Pfad zu Accelerator klären"
 *  - accelerator → minimal slim bar: "Brauchst du dein nächstes 1:1?"
 *  - enterprise → hidden (have a dedicated CSM)
 *
 * Dismissible per session via localStorage (`consult_banner_v1_dismissed_at`).
 * Auto-rearms after 7 days so we don't nag.
 *
 * Used in Dashboard, MyPath, Missions; mounts as a single block at the top
 * of each page so the user always knows real human help is one tap away.
 */
import { useMemo, useState, useCallback, useEffect } from 'react';
import { Calendar, Sparkles, X, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BookConsultationButton } from './BookConsultationButton';

const STORAGE_KEY = 'consult_banner_v1_dismissed_at';
const REARM_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const useDismissState = () => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const at = Number(raw);
      if (!Number.isFinite(at)) return false;
      return (Date.now() - at) < REARM_AFTER_MS;
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {
      /* safe-noop: private mode / SSR */
    }
    setDismissed(true);
  }, []);

  return [dismissed, dismiss];
};

/** Compute a Revolut-style "next slot today" hint that updates every minute. */
const useNextSlot = () => {
  const [label, setLabel] = useState(() => computeLabel());
  useEffect(() => {
    const id = setInterval(() => setLabel(computeLabel()), 60_000);
    return () => clearInterval(id);
  }, []);
  return label;
};

function computeLabel() {
  const now = new Date();
  const hour = now.getHours();
  // Working hours 09-18 → "Heute HH:00", else "Morgen 10:00"
  if (hour < 8) return 'Heute 10:00';
  if (hour < 17) {
    const next = new Date(now);
    next.setHours(hour + 1, 0, 0, 0);
    return `Heute ${String(next.getHours()).padStart(2, '0')}:00`;
  }
  return 'Morgen 10:00';
}

/**
 * @param {object}  props
 * @param {string=} props.placement  free-form id for analytics (e.g. 'dashboard-top', 'mypath-cta').
 * @param {boolean=} props.compact   render the slim 1-line variant (default false).
 */
export const SmartConsultationBanner = ({ placement = 'default', compact = false }) => {
  const { user } = useAuth();
  const [dismissed, dismiss] = useDismissState();
  const slot = useNextSlot();

  const variant = useMemo(() => {
    const tier = (user?.tier || 'free').toLowerCase();
    if (tier === 'enterprise') return null; // CSM handles them
    if (tier === 'accelerator') return 'minimal';
    if (tier === 'standard') return 'soft';
    return 'big';
  }, [user]);

  if (!variant || dismissed) return null;

  const copy = {
    big: {
      eyebrow: 'PERSÖNLICHE BERATUNG · 1:1',
      title: '30 Minuten, die deinen Pfad klären.',
      sub: 'Sprich mit einem Argumentorik-Leadership-Berater. Kostenfrei · 100% unverbindlich.',
      cta: 'Slot wählen',
    },
    soft: {
      eyebrow: 'STRATEGY-CALL · STANDARD',
      title: 'Bereit für das volle 1:1-Coaching?',
      sub: 'Lass uns klären, ob Accelerator (4.797€) der richtige nächste Schritt für dich ist.',
      cta: 'Beratung anfragen',
    },
    minimal: {
      eyebrow: 'ACCELERATOR · 1:1',
      title: 'Brauchst du dein nächstes 1:1?',
      sub: null,
      cta: 'Slot wählen',
    },
  }[variant];

  // --- Minimal slim bar (accelerator) ---
  if (variant === 'minimal' || compact) {
    return (
      <div
        data-testid={`consult-banner-${placement}-minimal`}
        className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#BFFF00]/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calendar size={14} className="text-[#BFFF00] flex-shrink-0" />
          <p className="text-[13px] text-white/70 truncate">{copy.title}</p>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-white/40 ml-2">
            <Clock size={11} /> {slot}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <BookConsultationButton variant="ghost" size="sm" label={copy.cta} testId={`consult-cta-${placement}`} />
          <button
            onClick={dismiss}
            aria-label="Banner schließen"
            data-testid={`consult-banner-${placement}-dismiss`}
            className="p-1 text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // --- Big (free) and Soft (standard) ---
  const isBig = variant === 'big';
  return (
    <div
      data-testid={`consult-banner-${placement}-${variant}`}
      className={`relative overflow-hidden rounded-2xl border ${
        isBig
          ? 'border-[#BFFF00]/25 bg-gradient-to-br from-[#BFFF00]/[0.06] via-white/[0.02] to-transparent'
          : 'border-white/[0.08] bg-white/[0.02]'
      } p-5 sm:p-6`}
    >
      {/* dismiss */}
      <button
        onClick={dismiss}
        aria-label="Banner schließen"
        data-testid={`consult-banner-${placement}-dismiss`}
        className="absolute top-3 right-3 p-1.5 text-white/30 hover:text-white/70 transition-colors rounded-md hover:bg-white/[0.05]"
      >
        <X size={16} />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] tracking-[0.2em] font-bold text-[#BFFF00]/80 mb-2 flex items-center gap-1.5">
            <Sparkles size={11} /> {copy.eyebrow}
          </p>
          <h3 className="text-lg sm:text-xl font-semibold text-white leading-snug mb-1.5" style={{ fontFamily: 'Outfit, Inter, system-ui' }}>
            {copy.title}
          </h3>
          {copy.sub && (
            <p className="text-[13px] text-white/55 leading-relaxed pr-2">{copy.sub}</p>
          )}
        </div>

        <div className="flex-shrink-0 flex flex-col items-start sm:items-end gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            VERFÜGBAR · {slot}
          </span>
          <BookConsultationButton
            variant={isBig ? 'primary' : 'ghost'}
            size="default"
            label={copy.cta}
            testId={`consult-cta-${placement}`}
            showAvailability={isBig}
          />
        </div>
      </div>
    </div>
  );
};

export default SmartConsultationBanner;
