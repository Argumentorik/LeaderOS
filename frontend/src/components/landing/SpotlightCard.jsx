import { useRef } from 'react';

/**
 * SpotlightCard · Aceternity-style "Card Spotlight" hand-built for the
 * LeaderOS lime/black editorial brand (CRA — no shadcn registry).
 *
 * A lime radial glow tracks the cursor inside the card on hover, layered
 * UNDER the content (z-0) so the black editorial frame + typography stay
 * intact. The glow lives in an `inset-0` overlay that self-clips the
 * gradient, so we do NOT force `overflow-hidden` (which would clip cards
 * with badges that intentionally bleed past the top edge). Pass
 * `clip` to opt back into overflow-hidden for rounded cards.
 *
 * Polymorphic via `as` so it can wrap a link-card (`as="a"`) or an
 * `<article>`. Frame classes (border, bg, hover-shadow, `group`) go on
 * `className`; inner layout (padding, flex) goes on `innerClassName`.
 *
 *   <SpotlightCard as="a" href="…"
 *     className="group border-2 border-black bg-background hover:shadow-[8px_8px_0_0_#000]"
 *     innerClassName="p-7 md:p-9">…</SpotlightCard>
 */
export const SpotlightCard = ({
  as: Tag = 'div',
  children,
  className = '',
  innerClassName = '',
  spotlightColor = 'rgba(191,255,0,0.22)',
  spotlightSize = 240,
  clip = false,
  ...rest
}) => {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
  };

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMove}
      className={`relative ${clip ? 'overflow-hidden' : ''} ${className}`}
      {...rest}
    >
      {/* Cursor-following lime spotlight · sits under the content (z-0). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
        style={{
          background: `radial-gradient(${spotlightSize}px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${spotlightColor}, transparent 70%)`,
        }}
      />
      <div className={`relative z-10 ${innerClassName}`}>{children}</div>
    </Tag>
  );
};
