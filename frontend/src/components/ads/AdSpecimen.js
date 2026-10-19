import { AD_PALETTES } from '../../data/contentAds';

/**
 * AdSpecimen · Netflix-Bites-DNA für LeaderOS-Werbeflächen.
 *
 * Komposition pro Tile:
 *   - voller Hintergrund in `palette.bg` (gesättigte Brand-Farbe)
 *   - 1 Portrait-Foto, gecroppt auf full-bleed mit `object-cover`
 *   - oben links: 2-zeilige TRACKED UPPERCASE Headline in `palette.hi`
 *   - unten: zweite Headline + Datum/CTA-Strip + URL
 *   - Tracking 0.02em, Weight 900, Font Outfit (kein Italic · Ads
 *     sollen lauter sein als die editorial-Specimen).
 *
 * Drei Aspect-Ratios:
 *   '1x1'  → 1080×1080  Meta-Feed
 *   '4x5'  → 1080×1350  Meta-Feed-Vertical
 *   '9x16' → 1080×1920  Stories · Reels · TikTok
 *
 * Das ganze rendert auf einer 1080-Breite-Bühne; im Studio wird der
 * Stage via CSS-Transform runter-skaliert. Beim Screenshot greift
 * das Modal die native Auflösung.
 */

const RATIO = {
  '1x1':  { w: 1080, h: 1080 },
  '4x5':  { w: 1080, h: 1350 },
  '9x16': { w: 1080, h: 1920 },
  // LinkedIn Single Image Ad (Querformat 1,91:1). 1x1 gilt dort ebenfalls.
  '1.91x1': { w: 1200, h: 627 },
};

// Headline-Größen je Format: die Story darf lauter sein als der Feed, das
// LinkedIn-Querformat hat nur 627 px Höhe für zwei Blöcke plus Strip.
const SIZES = {
  '9x16':   { hero: 132, sub: 116, pad: 72 },
  '1.91x1': { hero: 84,  sub: 72,  pad: 56 },
  default:  { hero: 116, sub: 102, pad: 72 },
};

const LINES = (raw) => raw.split('\n');

const HeadlineBlock = ({ text, color, size, align = 'left' }) => (
  <div
    className={`leading-[0.86] ${align === 'center' ? 'text-center' : ''}`}
    style={{
      color,
      fontFamily: 'Outfit, Inter, system-ui, sans-serif',
      fontWeight: 900,
      letterSpacing: '0.005em',
      fontSize: size,
      textTransform: 'uppercase',
    }}
  >
    {LINES(text).map((l, i) => (
      <div key={i}>{l}</div>
    ))}
  </div>
);

export const AdSpecimen = ({ ad, scale = 0.4 }) => {
  const dim = RATIO[ad.format] || RATIO['1x1'];
  const palette = AD_PALETTES[ad.palette] || AD_PALETTES.midnight;

  const { hero: heroSize, sub: subSize, pad } = SIZES[ad.format] || SIZES.default;

  return (
    <div
      data-ad-id={ad.id}
      className="relative shrink-0 overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)]"
      style={{
        width: dim.w * scale,
        height: dim.h * scale,
        backgroundColor: palette.bg,
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: dim.w,
          height: dim.h,
          transform: `scale(${scale})`,
          backgroundColor: palette.bg,
        }}
      >
        {/* ── Foto-Layer (full-bleed, hinter dem Text) ── */}
        {ad.photo && (
          <img
            src={ad.photo}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: ad.photoFit || 'cover' }}
            crossOrigin="anonymous"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}

        {/* ── Farb-Wash damit Text immer lesbar ── */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg,
              ${palette.bg}EE 0%,
              ${palette.bg}55 20%,
              ${palette.bg}11 50%,
              ${palette.bg}55 80%,
              ${palette.bg}EE 100%)`,
          }}
        />

        {/* ── Inhalt ── */}
        <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: pad }}>
          {/* TOP: kleinere Eyebrow-Headline */}
          <HeadlineBlock
            text={ad.topText}
            color={palette.hi}
            size={subSize}
          />

          {/* MITTE: ggf. Logo / Watermark · bewusst leer für Foto-Atmung */}
          <div />

          {/* BOTTOM: Haupt-Title + Strip */}
          <div className="space-y-10">
            <HeadlineBlock
              text={ad.titleText}
              color={palette.hi}
              size={heroSize}
            />

            <div className="flex items-end justify-between gap-6 pt-8 border-t-4" style={{ borderColor: palette.hi }}>
              <div className="space-y-2" style={{ color: palette.lo }}>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  {ad.bottomText}
                </div>
              </div>
              <div
                className="shrink-0 inline-flex items-center justify-center px-6 py-3"
                style={{
                  backgroundColor: palette.hi,
                  color: palette.bg,
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                ▸ {ad.cta}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AD_RATIO = RATIO;
