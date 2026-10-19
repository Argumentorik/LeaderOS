/**
 * RecordingCountdown · premium 3-2-1 overlay shown before recording starts.
 *
 * Counts down from `from` (default 3) to "GO" then calls onComplete().
 * Sci-Fi look: huge digit pulse, animated ring, neon-lime accents.
 */
import { useEffect, useState } from 'react';

export const RecordingCountdown = ({ from = 3, onComplete, onCancel, de = true }) => {
  const [n, setN] = useState(from);

  useEffect(() => {
    if (n < 0) return;
    if (n === 0) {
      const t = setTimeout(() => onComplete?.(), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v - 1), 900);
    return () => clearTimeout(t);
  }, [n, onComplete]);

  // ESC to cancel countdown
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const label = n === 0
    ? (de ? 'LOS!' : 'GO!')
    : String(n);

  // Ring stroke draws down as countdown progresses
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const progress = n === 0 ? 0 : (n / from);
  const dash = circumference * progress;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center rounded-xl overflow-hidden"
      data-testid="recording-countdown"
      style={{
        background: 'radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.96) 70%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Animated noise / scanline texture for cockpit feel */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(191,255,0,0.6) 0px, rgba(191,255,0,0) 2px, rgba(191,255,0,0) 4px)',
        }}
      />

      <div className="relative">
        <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
          {/* Track */}
          <circle cx="110" cy="110" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
          {/* Progress ring (lime) */}
          <circle
            cx="110" cy="110" r={radius}
            stroke="#BFFF00" strokeWidth="3" fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.9s linear', filter: 'drop-shadow(0 0 12px rgba(191,255,0,0.45))' }}
          />
        </svg>

        <div
          key={n}
          className="absolute inset-0 flex items-center justify-center"
          style={{ animation: 'countdownPulse 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <span
            className={`tabular-nums font-black tracking-tighter ${
              n === 0 ? 'text-[64px] text-[#BFFF00]' : 'text-[120px] text-white'
            }`}
            style={{
              fontFamily: 'Outfit, sans-serif',
              textShadow: n === 0
                ? '0 0 32px rgba(191,255,0,0.6)'
                : '0 0 24px rgba(255,255,255,0.25)',
            }}
            data-testid="countdown-digit"
          >
            {label}
          </span>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#BFFF00]/80">
          {de ? 'gleich beginnt deine aufnahme' : 'recording starts in'}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white transition-colors"
          data-testid="countdown-cancel"
        >
          {de ? 'ESC · Abbrechen' : 'ESC · Cancel'}
        </button>
      </div>

      <style>{`
        @keyframes countdownPulse {
          0%   { transform: scale(0.5); opacity: 0; }
          40%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
