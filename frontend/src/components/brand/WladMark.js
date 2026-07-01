/**
 * WladMark — Cool curvy "W" mark for Leader-OS (Iter 92.5).
 *
 * Design v3: The previous iteration was too geometric / chart-bar-y.
 * Mert wanted "cooler & geschwungen" — a flowing W that reads like a
 * confident signature, not a logo template.
 *
 * Geometry rationale:
 *   - Single continuous Bézier path drawn with smooth cubic curves
 *   - Asymmetric: the right leg rises higher AND has a softer terminal
 *   - Inner shadow ghost gives 3D float
 *   - One single pixel-dot (top right) is the signature accent
 *   - Hover: stroke-trace draws the W in 800ms
 *   - Idle: very subtle 4° sway every 6s — the mark feels alive but not busy
 *
 * Modes:
 *   size           — pixel size (28 default)
 *   variant        — 'solid' (lime tile, dark glyph) | 'outline' (no bg, lime glyph)
 *   monogram       — render WITHOUT background tile, just the W on transparent
 *   animated       — adds idle-sway + hover-trace + accent-twinkle
 */
import { forwardRef } from 'react';

export const WladMark = forwardRef(({
  size = 28,
  variant = 'solid',
  monogram = false,
  className = '',
  animated = false,
  ...props
}, ref) => {
  const isSolid = variant === 'solid' && !monogram;
  const glyphFill = isSolid ? '#0A0A0A' : '#BFFF00';
  const accentFill = isSolid ? '#0A0A0A' : '#D4FF4D';

  return (
    <span
      ref={ref}
      className={`relative inline-flex items-center justify-center shrink-0 group ${animated ? 'wlad-mark-animated' : ''} ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      {/* Background tile — only for solid variant (not monogram) */}
      {isSolid && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-[30%] transition-transform duration-300 group-hover:scale-[1.05]"
          style={{
            background: 'linear-gradient(135deg, #D4FF4D 0%, #BFFF00 55%, #A8E600 100%)',
            boxShadow: '0 4px 18px -5px rgba(191,255,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.08)',
          }}
        />
      )}

      {/* Scan-line shimmer (only animated + solid) */}
      {animated && isSolid && (
        <span aria-hidden className="absolute inset-0 rounded-[30%] overflow-hidden pointer-events-none">
          <span className="wlad-mark-scanline" />
        </span>
      )}

      {/*  COOL CURVY "W" GLYPH
            32×32 grid. The path is a single continuous flow:
            top-left → swoosh down to first dip → curve up
            → swoosh down to second dip (deeper, asymmetric)
            → swoosh up & right with a flick (the signature)
            The right leg overshoots the baseline slightly for visual flair.
       */}
      <svg
        viewBox="0 0 32 32"
        width={size * (isSolid ? 0.74 : 0.92)}
        height={size * (isSolid ? 0.74 : 0.92)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 wlad-mark-glyph"
        shapeRendering="geometricPrecision"
      >
        <defs />

        {/* Ghost shadow (offset for floating depth) */}
        <path
          d="M3.2 5.2 L9 24.8 Q10.4 26 11.8 24.6 L15.6 10.4 Q16.6 9.4 17.6 10.4 L21 24.6 Q22.4 26 23.8 24.8 L29.4 4.6"
          stroke={glyphFill}
          strokeWidth="3.0"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.16"
          transform="translate(0.7 0.7)"
          fill="none"
        />

        {/* MAIN CURVY W — clean W outline with smooth curves at valleys/peak */}
        <path
          className="wlad-mark-w"
          d="M2.8 4.8 L8.6 24.4 Q10 25.8 11.4 24.2 L15.4 9.8 Q16.4 8.8 17.4 9.8 L20.8 24.2 Q22.2 25.8 23.6 24.4 L28.8 4"
          stroke={glyphFill}
          strokeWidth="3.0"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Signature flick — extra curl off the right tip for asymmetry */}
        <path
          className="wlad-mark-flick"
          d="M28.8 4 Q30.2 4.6 29.6 6.4"
          stroke={glyphFill}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Tiny accent dot — top-right tip, the "crown" */}
        <circle
          className="wlad-mark-pixel-b"
          cx="29.6"
          cy="6.4"
          r="1.2"
          fill={accentFill}
        />

        {/* Faint second dot — bottom-left tip, off-axis */}
        <circle
          className="wlad-mark-pixel-c"
          cx="2.8"
          cy="4.8"
          r="0.9"
          fill={accentFill}
          opacity="0.55"
        />
      </svg>
    </span>
  );
});

WladMark.displayName = 'WladMark';

/**
 * Wordmark wrapper — Mark + brand text combo for nav headers.
 */
export const WladWordmark = ({ size = 30, tagline, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2.5 group"
    data-testid="brand-wordmark"
  >
    <WladMark size={size} animated />
    <span className="flex flex-col items-start leading-none">
      <span
        className="text-[14px] font-black tracking-tight text-foreground"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.025em' }}
      >
        Leader<span className="opacity-55">·</span>OS
      </span>
      {tagline && (
        <span className="text-[7.5px] tracking-[0.22em] uppercase font-bold mt-[2.5px] opacity-40">
          {tagline}
        </span>
      )}
    </span>
  </button>
);

export default WladMark;
