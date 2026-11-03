import { useMemo } from 'react';

/**
 * PressMarquee · "Bekannt aus" chrome wordmark ticker.
 *
 * Typographic wordmarks by design: real press logos are trademarked assets we
 * neither ship nor license, and the design DNA prefers type over logo-soup.
 * The premium feel comes from treatment instead — each outlet set in Outfit
 * Black with an animated chrome gradient (a light band slowly travels through
 * the metal), in a seamless infinite marquee.
 *
 * Motion contract:
 *   - marquee pauses on hover (so names stay readable on intent)
 *   - prefers-reduced-motion → static wrapped row, duplicates hidden
 *   - edge fade via mask-image, so it works on any surface color
 *
 * Built for dark surfaces (chrome silver needs a dark canvas).
 */

// Canonical outlet set · real brand casing (ntv lowercase, WirtschaftsWoche
// camel-case, TEDx small x) — accuracy reads as authenticity.
export const PRESS_MEDIA = [
  'ARD', 'ZDF', 'ntv', 'WELT', 'WirtschaftsWoche',
  'Handelsblatt', 'FAZ', 'Galileo', 'TEDx',
];

export const PressMarquee = ({ items = PRESS_MEDIA, className = '' }) => {
  // Track is the list twice · the keyframe slides exactly -50%, so the loop
  // point is invisible. The second copy is aria-hidden (screen readers get
  // each outlet once).
  const row = useMemo(() => [...items, ...items], [items]);

  return (
    <div
      className={`pm-wrap relative overflow-hidden ${className}`}
      role="list"
      aria-label="Bekannt aus: Presse und TV"
      style={{
        maskImage: 'linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)',
      }}
    >
      <style>{`
        .pm-track{display:flex;align-items:center;width:max-content;animation:pmScroll 32s linear infinite;}
        .pm-wrap:hover .pm-track{animation-play-state:paused;}
        @keyframes pmScroll{to{transform:translateX(-50%)}}
        .pm-chrome{background:linear-gradient(100deg,#f4f4f4 0%,#8d8d8d 20%,#ffffff 36%,#6e6e6e 54%,#e8e8e8 72%,#989898 86%,#f4f4f4 100%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:pmShine 7s linear infinite;transition:filter .25s ease;}
        .pm-item:hover .pm-chrome{filter:brightness(1.25) drop-shadow(0 0 14px rgba(255,255,255,.22));}
        @keyframes pmShine{to{background-position:-220% 0}}
        @media (prefers-reduced-motion:reduce){
          .pm-track{animation:none;width:auto;flex-wrap:wrap;row-gap:10px;}
          .pm-track [data-pm-dup="true"]{display:none;}
          .pm-chrome{animation:none;}
        }
      `}</style>

      <div className="pm-track">
        {row.map((m, i) => {
          const dup = i >= items.length;
          return (
            <span
              key={`${m}-${i}`}
              role={dup ? undefined : 'listitem'}
              aria-hidden={dup || undefined}
              data-pm-dup={dup || undefined}
              className="pm-item flex items-center shrink-0"
            >
              <span
                className="pm-chrome text-[17px] md:text-[21px] leading-none tracking-[0.08em] whitespace-nowrap px-6 md:px-9"
                style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900 }}
              >
                {m}
              </span>
              <span aria-hidden className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default PressMarquee;
