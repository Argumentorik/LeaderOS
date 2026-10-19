import { WLADBOT_AVATAR, WLADBOT_AVATAR_FALLBACKS, withFallback } from '../../../lib/brandAssets';

/**
 * WladBotThumbnail · branded editorial cover for journal articles that have
 * no explicit photographic `cover`.
 *
 * Every card gets one of ten on-brand abstract textures (black canvas +
 * lime accents · /journal/covers/cover-NN.webp), picked deterministically
 * from the title so the blog reads as a varied, image-rich set — plus,
 * layered on top, the actual WladBot mascot "saying something": his avatar
 * in a lime-ringed badge next to a speech-bubble carrying a real excerpt
 * from the article (its description, truncated). That's the strong,
 * consistent visual identity every card needs instead of a bare texture +
 * headline, and it never requires a bespoke image per article.
 *
 * Props:
 *   - title:       article title (headline text on the cover)
 *   - description: article excerpt · becomes WladBot's speech-bubble line
 *   - eyebrow:      small mono label (default 'LEADER·OS')
 *   - showText:     false → texture-only tile (no headline overlay)
 */

const COVER_COUNT = 10;

// Stable hash → cover index 1..COVER_COUNT. Same title always maps to the
// same texture (no layout shift, deterministic across renders/SSR).
const coverFor = (title = '') => {
  let h = 0;
  for (let i = 0; i < title.length; i += 1) {
    h = (h * 31 + title.charCodeAt(i)) & 0xffffffff;
  }
  return (Math.abs(h) % COVER_COUNT) + 1;
};

const truncate = (text = '', max = 92) => {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
};

export const WladBotThumbnail = ({
  title = '',
  description = '',
  eyebrow = 'LEADER·OS',
  showText = true,
}) => {
  const idx = String(coverFor(title)).padStart(2, '0');
  // Sprechblase nur mit echtem Text, nie mit Platzhalter.
  const line = truncate(description);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-[#0A0A0A]">
      {/* Deterministic on-brand texture · varies per article. */}
      <img
        src={`/journal/covers/cover-${idx}.webp`}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      {/* Legibility wash · keeps everything readable on any texture. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(165deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.72) 55%, rgba(10,10,10,0.92) 100%)',
        }}
      />

      {/* WladBot "saying something" · avatar + speech bubble, the strong
          visual anchor every card needs regardless of texture. Anchored
          to the top independently of the headline block below so the
          layout never depends on card height/aspect ratio. */}
      {line && (
      <div className="absolute top-0 inset-x-0 z-10 flex items-start gap-2.5 p-4 md:p-5">
        <img
          src={WLADBOT_AVATAR}
          onError={withFallback(WLADBOT_AVATAR_FALLBACKS)}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full ring-2 ring-brand object-cover bg-black"
        />
        <div className="relative min-w-0 max-w-[78%] rounded-xl rounded-tl-sm bg-white/[0.94] px-3 py-2 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.5)]">
          <p
            className="text-[11px] md:text-[11.5px] leading-[1.35] text-[#0A0A0A] line-clamp-3"
            style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 700 }}
          >
            {line}
          </p>
        </div>
      </div>
      )}

      {showText && (
        <div className="absolute bottom-0 inset-x-0 z-10 p-5 md:p-6">
          <div className="min-w-0">
            <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-brand">
              ▸ {eyebrow}
            </div>
            <div
              className="text-white leading-[1.04] tracking-[-0.02em]"
              style={{
                fontFamily: 'Outfit, Inter, sans-serif',
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: 'clamp(18px, 2.2vw, 26px)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                overflowWrap: 'anywhere',
              }}
            >
              {title.replace(/\.$/, '')}
              <span className="text-brand not-italic">.</span>
            </div>
          </div>
        </div>
      )}

      {/* Lime baseline rule · brand signature. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-brand/80" />
    </div>
  );
};
