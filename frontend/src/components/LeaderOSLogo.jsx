/**
 * LeaderOSLogo — official Leader·OS brand mark.
 *
 * Composed from:
 *   - /leaderos-mark.png  (the lime pill with SOLID BLACK W · single source of truth)
 *   - text wordmark "Leader OS" rendered as HTML text (color = variant-dependent)
 *
 * The W is always black on lime — non-negotiable brand rule. Only the wordmark
 * text-color changes between variants:
 *   - "default": white wordmark (for dark UIs)
 *   - "light":   near-black wordmark (for light UIs / PDFs)
 *   - "mark":    only the pill · no wordmark
 *   - "stacked": mark + wordmark + optional tagline underneath
 */
const SIZES = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

const WORDMARK_SIZE = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-3xl",
};

export default function LeaderOSLogo({
  variant = "default",
  size = "md",
  showTagline = false,
  className = "",
  testId = "leader-os-logo",
}) {
  const h = SIZES[size] || SIZES.md;
  const wordmarkClass = WORDMARK_SIZE[size] || WORDMARK_SIZE.md;
  const wordmarkColor = variant === "light" ? "text-[#0a0a0a]" : "text-white";

  // Mark-only variant (no wordmark)
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

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
    >
      <img
        src="/leaderos-mark.png"
        alt=""
        aria-hidden
        style={{ height: h, width: "auto" }}
        className="inline-block shrink-0"
        draggable={false}
      />
      <span
        className={`font-manrope font-extrabold tracking-tight ${wordmarkClass} ${wordmarkColor}`}
        style={{ letterSpacing: "-0.02em" }}
      >
        Leader<span className="opacity-70">·</span>OS
      </span>
      {showTagline && (
        <>
          <span className={`hidden sm:block h-4 w-px ${variant === "light" ? "bg-black/[0.12]" : "bg-white/[0.12]"}`} />
          <span className={`hidden sm:block font-inter text-sm ${variant === "light" ? "text-slate-500" : "text-slate-400"}`}>
            Leadership Diagnose
          </span>
        </>
      )}
    </span>
  );
}
