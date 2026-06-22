/**
 * LeaderOSLogo — official Leader·OS brand mark.
 *
 * Assets live in /public:
 *   - leaderos-logo-dark.png (white wordmark on lime W-pill) → for dark UI
 *   - leaderos-logo.png      (black wordmark on lime W-pill) → for light UI / PDFs
 *   - leaderos-mark.png      (just the W-pill mark)           → favicon-like contexts
 *
 * Variants:
 *   - "default":  full horizontal wordmark, white text (used on dark navbars)
 *   - "light":    full horizontal wordmark, black text (light backgrounds)
 *   - "stacked":  wordmark + tagline underneath
 *   - "mark":     compact pill mark only
 */
const SIZES = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export default function LeaderOSLogo({
  variant = "default",
  size = "md",
  showTagline = false,
  className = "",
  testId = "leader-os-logo",
}) {
  const h = SIZES[size] || SIZES.md;

  if (variant === "mark") {
    return (
      <img
        data-testid={testId}
        src="/leaderos-mark.png"
        alt="Leader OS"
        style={{ height: h, width: "auto" }}
        className={`inline-block select-none ${className}`}
        draggable={false}
      />
    );
  }

  const src = variant === "light" ? "/leaderos-logo.png" : "/leaderos-logo-dark.png";

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-3 select-none ${className}`}
    >
      <img
        src={src}
        alt="Leader OS"
        style={{ height: h, width: "auto" }}
        className="inline-block"
        draggable={false}
      />
      {showTagline && (
        <>
          <span className="hidden sm:block h-4 w-px bg-white/[0.08]" />
          <span className="hidden sm:block font-inter text-sm text-slate-500">
            Leadership Diagnose
          </span>
        </>
      )}
    </span>
  );
}
