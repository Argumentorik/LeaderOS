/**
 * PostSpecimen · Editorial-Specimen-Sheet für Social-Posts.
 *
 * Rendert eine einzelne Post-Definition aus contentSpecimens.js als
 * screenshotbare Kachel im Athletic-Editorial-Stil der Landing-Page:
 *   - Outfit-Black-Italic-Headline mit Lime-Punkt-Punktuation
 *   - BIB-Code-Header oben, Mono-Metadata-Footer unten
 *   - dichotomie-Subline mit reduziertem Schwarz-Wert
 *
 * Aspect-Ratios sind über `format` gesteuert:
 *   'square'   → 1:1   (Instagram-Feed)
 *   'vertical' → 4:5   (Instagram-Vertical · LinkedIn)
 *
 * Die Tile ist auf 1080px Breite optimiert. Im Studio rendern wir sie
 * verkleinert (CSS-Transform) · beim Screenshot wirkt sie native 1080.
 */

const RATIO = {
  square:   { w: 1080, h: 1080 },
  vertical: { w: 1080, h: 1350 },
};

const HeadlineBlock = ({ headline, accent }) => (
  <div>
    <h2
      className="leading-[0.92] tracking-[-0.04em] text-black"
      style={{
        fontFamily: 'Outfit, Inter, system-ui, sans-serif',
        fontWeight: 900,
        fontStyle: 'italic',
        fontSize: 'clamp(56px, 8.5vw, 116px)',
      }}
    >
      {headline}
      {accent && (
        <>
          <br />
          <span className="text-black/45">
            {accent.replace(/\.$/, '')}
          </span>
          <span className="text-brand not-italic">.</span>
        </>
      )}
    </h2>
  </div>
);

const BibHeader = ({ bib, eyebrow }) => (
  <div className="flex items-center justify-between text-[14px] font-bold uppercase tracking-[0.22em] text-black/55 font-mono">
    <span className="text-black">▸ {bib}</span>
    <span>{eyebrow}</span>
  </div>
);

const FootStrip = ({ foot }) => (
  <div className="flex items-end justify-between gap-6 text-[13px] font-bold uppercase tracking-[0.22em] text-black/45 font-mono">
    <div className="flex items-center gap-3">
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black text-brand font-black"
        style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16 }}
      >
        W
      </span>
      <span className="text-black">LEADER·OS</span>
    </div>
    <span className="text-right">{foot}</span>
  </div>
);

// ── Variant: Headline-only ──────────────────────────────────────────
const HeadlineVariant = ({ post }) => (
  <div className="flex-1 flex flex-col justify-center gap-10 py-10">
    <HeadlineBlock headline={post.headline} accent={post.accent} />
    {post.body && (
      <p className="max-w-[78%] text-[22px] md:text-[26px] leading-[1.3] text-black/75 font-medium">
        {post.body}
      </p>
    )}
  </div>
);

// ── Variant: Quote / Manifesto ──────────────────────────────────────
const QuoteVariant = ({ post }) => (
  <div className="flex-1 flex flex-col justify-center gap-12 py-10">
    <div>
      <div className="h-px w-24 bg-brand mb-10" />
      <h2
        className="leading-[1.02] tracking-[-0.025em] text-black"
        style={{
          fontFamily: 'Outfit, Inter, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(46px, 6.8vw, 88px)',
        }}
      >
        {post.headline}<br />
        <span className="italic">{post.accent.replace(/\.$/, '')}</span>
        <span className="text-brand">.</span>
      </h2>
    </div>
    {post.body && (
      <p className="max-w-[80%] text-[22px] md:text-[26px] leading-[1.35] text-black/65">
        {post.body}
      </p>
    )}
  </div>
);

// ── Variant: Big-Numbers ────────────────────────────────────────────
const NumbersVariant = ({ post }) => (
  <div className="flex-1 flex flex-col justify-center gap-12 py-6">
    <div className="space-y-4">
      {post.numbers.map((n, i) => (
        <div key={i} className="flex items-baseline gap-6 border-b border-black/10 pb-3">
          <span
            className="text-black leading-[0.82] tracking-[-0.04em]"
            style={{
              fontFamily: 'Outfit, Inter, sans-serif',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 'clamp(120px, 16vw, 220px)',
            }}
          >
            {n.big}
          </span>
          <div className="pb-6">
            <div className="text-[20px] font-bold uppercase tracking-[0.18em] text-black">
              {n.suffix}
            </div>
            <div className="text-[14px] font-mono uppercase tracking-[0.18em] text-black/45 mt-1">
              {n.caption}
            </div>
          </div>
        </div>
      ))}
    </div>
    {post.body && (
      <p className="max-w-[78%] text-[20px] md:text-[24px] leading-[1.35] text-black/65">
        {post.body}
      </p>
    )}
  </div>
);

// ── Variant: Framework-Specimen-Table ───────────────────────────────
const FrameworkVariant = ({ post }) => (
  <div className="flex-1 flex flex-col justify-between gap-8 py-4">
    <div className="space-y-4">
      <HeadlineBlock headline={post.headline} accent={post.accent} />
      {post.body && (
        <p className="max-w-[80%] text-[20px] md:text-[24px] leading-[1.35] text-black/65 mt-4">
          {post.body}
        </p>
      )}
    </div>
    <ul className="space-y-0 border-y border-black/15">
      {post.rows.map(([tag, label, value], i) => (
        <li
          key={i}
          className="grid grid-cols-12 gap-4 items-baseline py-4 border-b border-black/8 last:border-b-0"
        >
          <span className="col-span-1 text-[18px] font-bold font-mono text-black">
            {tag}
          </span>
          <span className="col-span-4 text-[18px] font-bold uppercase tracking-[0.12em] text-black">
            {label}
          </span>
          <span className="col-span-7 text-[18px] leading-[1.3] text-black/70">
            {value}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

// ── Variant: Marathon-BIB-Plate ─────────────────────────────────────
const BibVariant = ({ post }) => (
  <div className="flex-1 flex flex-col justify-center items-center gap-12 py-8 text-center">
    <HeadlineBlock headline={post.headline} accent={post.accent} />
    <div
      className="relative w-[64%] max-w-[520px] aspect-[5/4] border-[3px] border-black/85 bg-white flex flex-col items-center justify-between py-7"
      style={{ borderRadius: 12 }}
    >
      {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((p) => (
        <span
          key={p}
          aria-hidden
          className={`absolute ${p} w-4 h-4 rounded-full border-2 border-black/70 bg-white`}
        />
      ))}
      <span className="text-[14px] font-bold uppercase tracking-[0.28em] text-black/75 font-mono">
        LEADER·OS &nbsp;·&nbsp; CLASS 01
      </span>
      <span
        className="text-black leading-none"
        style={{
          fontFamily: 'Outfit, Inter, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(140px, 18vw, 220px)',
          letterSpacing: '-0.02em',
        }}
      >
        0001
      </span>
      <span className="text-[14px] font-bold uppercase tracking-[0.28em] text-black/70 font-mono text-center px-4">
        Startnummer<br />Für deine Führungs-Evolution
      </span>
    </div>
    {post.body && (
      <p className="max-w-[78%] text-[20px] md:text-[24px] leading-[1.35] text-black/65">
        {post.body}
      </p>
    )}
  </div>
);

const VARIANT_BODY = {
  headline:  HeadlineVariant,
  quote:     QuoteVariant,
  numbers:   NumbersVariant,
  framework: FrameworkVariant,
  bib:       BibVariant,
};

export const PostSpecimen = ({ post, scale = 0.5 }) => {
  const dim = RATIO[post.format] || RATIO.square;
  const Body = VARIANT_BODY[post.variant] || HeadlineVariant;

  return (
    <div
      data-specimen-id={post.id}
      className="relative shrink-0 bg-white text-black shadow-[0_30px_60px_-30px_rgba(0,0,0,0.18)] border border-black/[0.06]"
      style={{
        width: dim.w * scale,
        height: dim.h * scale,
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left flex flex-col gap-10 p-[72px]"
        style={{
          width: dim.w,
          height: dim.h,
          transform: `scale(${scale})`,
        }}
      >
        <BibHeader bib={post.bib} eyebrow={post.eyebrow} />
        <Body post={post} />
        <FootStrip foot={post.foot} />
      </div>
    </div>
  );
};

export const SPECIMEN_RATIO = RATIO;
