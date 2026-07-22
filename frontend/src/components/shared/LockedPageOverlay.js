/**
 * LockedPageOverlay — Consistent premium-gated view for pre-launch features.
 *
 * Used on Community, Learning-Videos (fallback) and any other surface we
 * temporarily gate until the Wlad-cohort go-live. Renders a blurred backdrop
 * over the page content with a single, unmistakable CTA:
 *   „🔓 Upgrade auf Premium – Vollzugriff freischalten"
 *
 * Clicking the CTA opens the shared PricingModal — same conversion funnel
 * as everywhere else in the app.
 */
import { useState } from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { PricingModal } from './PricingModal';

export function LockedPageOverlay({
  title = 'Community — bald verfügbar',
  subtitle = 'Diese Sektion schalten wir für alle Premium-Leader kurz nach dem offiziellen Launch frei.',
  features = [],
  ctaText = '🔓 Upgrade auf Premium – Vollzugriff freischalten',
  testId = 'locked-page-overlay',
}) {
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <>
      <div
        className="absolute inset-0 z-40 flex items-center justify-center p-6"
        data-testid={testId}
        style={{
          background: 'radial-gradient(120% 90% at 50% 20%, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.96) 60%, rgba(10,10,10,1) 100%)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#BFFF00] shadow-2xl shadow-[#BFFF00]/40">
            <Lock size={26} className="text-[#0A0A0A]" />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#BFFF00] mb-2 inline-flex items-center gap-1.5">
              <Sparkles size={11} /> Premium-Feature
            </p>
            <h2
              className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {title}
            </h2>
            <p className="text-sm text-white/60 mt-3 leading-relaxed">{subtitle}</p>
          </div>

          {features.length > 0 && (
            <ul className="space-y-2 text-left bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                  <span className="w-4 h-4 rounded-full bg-[#BFFF00]/20 border border-[#BFFF00]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setShowPaywall(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black text-sm shadow-2xl shadow-[#BFFF00]/30 transition-all hover:scale-[1.02] active:scale-[0.99]"
            data-testid={`${testId}-cta`}
          >
            {ctaText}
            <ArrowRight size={16} strokeWidth={3} />
          </button>

          <p className="text-[10px] text-white/30 leading-relaxed">
            Frühzugang für Wlads Cohort · 400+ Leader auf der Warteliste
          </p>
        </div>
      </div>
      {showPaywall && <PricingModal onClose={() => setShowPaywall(false)} />}
    </>
  );
}

export default LockedPageOverlay;
