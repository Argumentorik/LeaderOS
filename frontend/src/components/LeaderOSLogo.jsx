/**
 * LeaderOSLogo — typographic mark in the Leader OS design system.
 * Pure CSS/SVG (no asset dependency) so it scales crisply at any size.
 *
 * Variants:
 *   - "default": full wordmark "LEADER/OS" inline
 *   - "stacked": LEADER over OS with bracket prefix (used on hero panels)
 *   - "mark": compact "/OS" mark only (favicon-like)
 */
export default function LeaderOSLogo({
  variant = "default",
  size = "md",
  showTagline = false,
  className = "",
  testId = "leader-os-logo",
}) {
  const sizes = {
    sm: { text: "text-base", slash: "text-base", tag: "text-[10px]" },
    md: { text: "text-lg", slash: "text-lg", tag: "text-xs" },
    lg: { text: "text-2xl", slash: "text-2xl", tag: "text-xs" },
    xl: { text: "text-3xl md:text-4xl", slash: "text-3xl md:text-4xl", tag: "text-sm" },
  };
  const s = sizes[size] || sizes.md;

  if (variant === "mark") {
    return (
      <span
        data-testid={testId}
        className={`inline-flex items-center font-manrope font-extrabold tracking-tight ${s.text} ${className}`}
      >
        <span className="text-[#C8FF00]">/</span>
        <span className="text-white">OS</span>
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <div data-testid={testId} className={`inline-flex flex-col ${className}`}>
        <span className={`font-mono ${s.tag} tracking-[0.25em] text-[#C8FF00]/70 font-bold uppercase`}>
          ▸ LEADER · OS
        </span>
        <span className={`font-manrope font-extrabold tracking-tight ${s.text}`}>
          <span className="text-white">LEADER</span>
          <span className="text-[#C8FF00]">/</span>
          <span className="text-white">OS</span>
        </span>
        {showTagline && (
          <span className="font-inter text-xs text-slate-500 mt-0.5">
            Leadership Operating System
          </span>
        )}
      </div>
    );
  }

  // default — inline wordmark
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span className={`font-manrope font-extrabold tracking-tight ${s.text}`}>
        <span className="text-white">LEADER</span>
        <span className="text-[#C8FF00]">/</span>
        <span className="text-white">OS</span>
      </span>
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
