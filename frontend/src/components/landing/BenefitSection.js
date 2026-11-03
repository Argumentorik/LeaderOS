import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { PlusCircleCTA } from './PlusCircleCTA';
import { useGsapScrollIn } from './motion/useGsapScrollIn';
import { WLADBOT_AVATAR, WLADBOT_AVATAR_FALLBACKS, withFallback } from '../../lib/brandAssets';

/**
 * BenefitSection · Type-first poster spread.
 *
 * Per user direction after the photo-band attempt: the GIANT HEADLINE is the
 * visual. No separate photo band stretching above the title. No duplicated
 * small h2 below a hero photo. The text IS the headline.
 *
 * Layout (top → bottom):
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ KAPITEL XX VON 07  /  CODE  /  LEADER · OS    [0001·KOHORTE] │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │                                                                │
 *   │   MASSIVE HEADLINE.                                            │
 *   │   Accent line below in foreground/55                           │
 *   │                                                                │
 *   │   Subline mono caps                                            │
 *   ├──────────────────────────────────┬────────────────────────────┤
 *   │ Body copy (max-w-xl)             │   Photo · 4:5 portrait     │
 *   │                                  │   B&W + halftone overlay   │
 *   │ ⊕ Plus-circle CTA                │   Variant overlay (if any) │
 *   ├──────────────────────────────────┴────────────────────────────┤
 *   │ Specimen table · full-width                                    │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Photo size is contained (max ~480 px wide) and rendered in its natural
 * 4:5 aspect · no full-bleed stretching. Same proportions across all 7
 * chapters so the page reads as a rhythmic specimen-spread, not a
 * variable-height row of competing posters.
 *
 * Variant-specific overlays sit inside the photo card:
 *
 *   variant: 'photo'  → no overlay
 *   variant: 'bib'    → 0001 startnummer plate, centered on photo
 *   variant: 'trust'  → 400/14 stat block, centered on photo
 *   variant: 'cert'   → goldfolie seal, centered on photo
 *   variant: 'voxel'  → WladBot scan-grid pattern, centered on photo
 *
 * Dark variant (chapter 07): inverts bg to ink, text to white.
 */

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

// ─────────────────────────────────────────────────────────────────────────
// Variant overlays · sit centered on the photo card
// ─────────────────────────────────────────────────────────────────────────
const BibOverlay = () => (
  <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
    <div className="relative bg-white border-[2.5px] border-foreground py-5 px-7 shadow-[6px_6px_0_0_rgba(0,0,0,0.55)] max-w-[260px] w-full" style={{ borderRadius: '8px' }}>
      {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
        <span key={pos} aria-hidden className={`absolute ${pos} w-2 h-2 rounded-full border border-foreground/60 bg-white`} />
      ))}
      <div className="text-[9px] font-bold uppercase tracking-[0.26em] text-foreground/70 font-mono text-center">
        LEADEROS · STARTNR
      </div>
      <div
        className="text-foreground leading-none text-center mt-2"
        style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(48px, 5.5vw, 68px)', letterSpacing: '-0.025em' }}
      >
        0001
      </div>
      <div className="text-[8.5px] font-bold uppercase tracking-[0.26em] text-foreground/70 font-mono text-center mt-2">
        FÜR DEINE EVOLUTION
      </div>
    </div>
  </div>
);

const TrustOverlay = ({ trustNumbers = [] }) => {
  const [a, b] = trustNumbers;
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
      <div className="bg-white border-2 border-foreground px-6 py-5 shadow-[6px_6px_0_0_rgba(0,0,0,0.55)] w-full max-w-[320px]">
        <div className="grid grid-cols-1 gap-5">
          {[a, b].filter(Boolean).map((n) => (
            <div key={n.suffix} className="leading-none">
              <div
                className="text-foreground"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(38px, 4.5vw, 56px)', letterSpacing: '-0.025em' }}
              >
                {n.big}
              </div>
              <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/65 font-mono">
                {n.suffix}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CertOverlay = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div className="relative w-[180px] h-[180px] md:w-[200px] md:h-[200px] bg-gradient-to-br from-[#F2D86A] via-[#E5C754] to-[#C8A839] border-2 border-foreground shadow-[6px_6px_0_0_rgba(0,0,0,0.55)] flex items-center justify-center" style={{ borderRadius: '50%' }}>
      <div className="text-center">
        <div className="text-[9px] font-bold uppercase tracking-[0.26em] text-foreground/80 font-mono">
          ZERTIFIKAT
        </div>
        <div
          className="text-foreground leading-none mt-1.5"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(36px, 4.5vw, 50px)', letterSpacing: '-0.02em' }}
        >
          0001
        </div>
        <div className="text-[8.5px] font-bold uppercase tracking-[0.26em] text-foreground/65 font-mono mt-1.5">
          WLAD JACHTCHENKO
        </div>
      </div>
    </div>
  </div>
);

const VoxelOverlay = () => (
  <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
    <div className="bg-[#0A0A0A] border-2 border-brand px-5 py-4 shadow-[6px_6px_0_0_rgba(191,255,0,0.55)] w-full max-w-[240px]">
      <div className="text-[9px] font-bold uppercase tracking-[0.26em] text-brand font-mono mb-3">
        ▸ WLADBOT · 24/7
      </div>
      <div className="grid grid-cols-8 gap-[3px]" aria-hidden>
        {Array.from({ length: 32 }).map((_, i) => (
          <span key={i} className={`w-2 h-2 rounded-full ${i % 3 === 0 ? 'bg-brand' : 'bg-white/30'}`} />
        ))}
      </div>
      <div className="mt-3 text-[8.5px] font-bold uppercase tracking-[0.24em] text-white/65 font-mono">
        SCAN AKTIV · LIVE
      </div>
    </div>
  </div>
);

const VariantOverlay = ({ variant, trustNumbers }) => {
  switch (variant) {
    case 'bib':   return <BibOverlay />;
    case 'trust': return <TrustOverlay trustNumbers={trustNumbers} />;
    case 'cert':  return <CertOverlay />;
    case 'voxel': return <VoxelOverlay />;
    default:      return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────
// Photo card · two image-treatment modes, identical CARD LAYOUT.
//
//   Default (real photographs): GREEN halftone · grayscale + #2EBC75
//   multiply + 3.5px dot screen. Matches the modal/popup, gives photos
//   their newsroom editorial tint.
//
//   posterDesign: true (pre-designed brand posters with burned-in
//   typography): SKIP halftone on the <img> so the source artwork
//   renders in its true colors (designs already use the lime accent).
//   Border, top/bottom metadata strips, and VariantOverlay all stay ·
//   the CARD itself looks identical to a photo chapter.
// ─────────────────────────────────────────────────────────────────────────
// Alt-text catalog per chapter · keyword-rich for AI Overview / Perplexity /
// image-search ranking around "Wlad Jachtchenko", "KI-Coach", "Leadership-
// Operating-System". Each entry maps the chapter code to an SEO-shaped
// sentence that describes the visible asset AND the chapter's claim.
const ALT_BY_CODE = {
  INHALT:        'LeaderOS Inhalt · elf Frameworks von Wlad Jachtchenko in einer Plattform',
  WLADBOT:       'WladBot · KI-Coach 24/7 in Wlads Stimme · trainiert auf 2 212 Wlad-Lektionen',
  SPRINT:        '30-Tage-Challenge · LeaderOS Startnummer Plate · deine Führungs-Evolution',
  WLAD:          'Wlad Jachtchenko · Argumentations-Coach, 3× SPIEGEL-Bestseller-Autor, Gründer LeaderOS',
  TRUST:         '400 000 Klienten, 14 Millionen Views · Wlad Jachtchenko Autorität-Beweis · LeaderOS',
  ZERTIFIKAT:    'LeaderOS Zertifikat 0001 · personalisierte Startnummer von Wlad Jachtchenko',
  KOMPLETT:      'Wlad Jachtchenko Voxel-Avatar mit OS-Würfel · WladBot Komplettbegleitung',
};

// WladBot 3.0 card body · §05 TRUST. Replaces the old numbers-poster (it
// duplicated the section headline and cropped badly in the 4:5 frame).
// Instead: the WladBot 3.0 render on a pixel scan-grid with live status —
// the trust NUMBERS stay in the headline + specimen table where they belong.
const WladBot30Body = () => (
  <div className="absolute inset-0 bg-[#0A0A0A]">
    {/* Pixel scan-grid · the "pixel look" nod, subtle so the avatar leads */}
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.14]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(191,255,0,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(191,255,0,0.55) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
      }}
    />
    {/* Lime aura behind the avatar */}
    <div
      aria-hidden
      className="absolute inset-0"
      style={{ background: 'radial-gradient(58% 42% at 50% 40%, rgba(191,255,0,0.18), transparent 70%)' }}
    />

    {/* Avatar · WladBot 3.0 render with the shared fallback chain */}
    <div className="absolute inset-x-0 top-[44%] -translate-y-1/2 flex justify-center">
      <div className="relative w-[58%] max-w-[220px] aspect-square">
        <img
          src={WLADBOT_AVATAR}
          onError={withFallback(WLADBOT_AVATAR_FALLBACKS)}
          alt="WladBot 3.0 · dein KI-Coach in Wlads Stimme · LeaderOS"
          loading="lazy"
          decoding="async"
          className="w-full h-full rounded-full object-cover object-[50%_16%] bg-black ring-4 ring-brand shadow-[0_20px_60px_-15px_rgba(191,255,0,0.5)]"
        />
        {/* Live status dot */}
        <span className="absolute bottom-2.5 right-2.5 w-5 h-5 rounded-full bg-brand ring-4 ring-[#0A0A0A] animate-pulse" aria-hidden />
      </div>
    </div>

    {/* Nameplate + mini proof row */}
    <div className="absolute inset-x-0 bottom-12 text-center px-4">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-brand mb-1.5">▸ ONLINE · 24/7</div>
      <div
        className="text-white leading-none"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(26px, 4vw, 36px)', letterSpacing: '-0.02em' }}
      >
        WladBot <span className="text-brand not-italic">3.0</span>
      </div>
      <div className="mt-2.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.2em] text-white/55">
        400K+ KUNDEN · 14M VIEWS · 3× SPIEGEL
      </div>
    </div>
  </div>
);

const PhotoCard = ({ photo, photoFallback, photoFit, variant, trustNumbers, nr, code, isDark, posterDesign, headline }) => (
  <div
    className={`relative aspect-[4/5] w-full max-w-[480px] mx-auto md:mx-0 ${isDark ? 'border-2 border-white/15' : 'border-2 border-foreground'} ${posterDesign ? 'bg-background' : 'bg-foreground'} overflow-hidden`}
    data-testid={`benefit-photo-${nr}`}
  >
    {variant === 'wladbot30' ? (
      <WladBot30Body />
    ) : photo ? (
      <img
        src={photo}
        alt={ALT_BY_CODE[code] || (headline ? `${headline.replace(/\.$/, '')} · LeaderOS Kapitel ${nr}` : `LeaderOS Kapitel ${nr}`)}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={`absolute inset-0 w-full h-full ${photoFit === 'portrait' ? 'object-cover object-[50%_25%]' : photoFit === 'bottom' ? 'object-cover object-bottom' : 'object-cover object-center'}`}
        style={posterDesign ? undefined : { filter: 'grayscale(1) contrast(1.1) brightness(0.92)' }}
        onError={(e) => {
          if (photoFallback && e.currentTarget.src !== photoFallback) e.currentTarget.src = photoFallback;
        }}
      />
    ) : (
      <div aria-hidden className="absolute inset-0 bg-foreground/[0.04]" />
    )}

    {/* GREEN halftone · only for default (photo) mode. Skipped for
        posterDesign and the self-rendering wladbot30 card. */}
    {!posterDesign && variant !== 'wladbot30' && (
      <>
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: '#2EBC75',
            mixBlendMode: 'multiply',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(0,0,0,0.55) 1px, transparent 1.4px)',
            backgroundSize: '3.5px 3.5px',
            mixBlendMode: 'screen',
            opacity: 0.32,
          }}
        />
      </>
    )}

    {/* Top strip */}
    <div className={`absolute top-0 inset-x-0 flex items-center justify-between px-3.5 py-2 z-10 ${isDark ? 'bg-[#0A0A0A]/90 text-white/70' : 'bg-white/90 text-foreground/70'} backdrop-blur-sm text-[9px] font-bold uppercase tracking-[0.22em] font-mono border-b ${isDark ? 'border-white/10' : 'border-foreground/10'}`}>
      <span>§ {nr} / 07</span>
      <span className="text-brand-strong">{code}</span>
    </div>

    {/* Variant overlay */}
    {/* Variant overlay · skipped when posterDesign is true. The burned-in
        typography of the poster already conveys the variant's message
        (bib plate, startnummer, woman speaker), so re-rendering the
        code-generated graphic on top would duplicate the visual. */}
    {!posterDesign && variant !== 'wladbot30' && <VariantOverlay variant={variant} trustNumbers={trustNumbers} />}

    {/* Bottom strip */}
    <div className={`absolute bottom-0 inset-x-0 flex items-center justify-between px-3.5 py-2 z-10 ${isDark ? 'bg-[#0A0A0A]/90 text-white/55' : 'bg-white/90 text-foreground/55'} backdrop-blur-sm text-[9px] font-bold uppercase tracking-[0.22em] font-mono border-t ${isDark ? 'border-white/10' : 'border-foreground/10'}`}>
      <span>LEADEROS</span>
      <span>0001 · KOHORTE</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// Section · type-first poster
// ─────────────────────────────────────────────────────────────────────────
export const BenefitSection = ({ asset, index, anchor, total = 7 }) => {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const yShift = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['-2%', '2%']);
  const numberRef = useGsapScrollIn('big-number');

  const isDark = asset.dark;
  const reversed = index % 2 === 1;

  return (
    <section
      ref={ref}
      id={anchor}
      className={`relative w-full overflow-hidden ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-background text-foreground'}`}
      data-testid={`landing-${anchor}`}
      aria-label={`Benefit ${asset.nr} · ${asset.headline} ${asset.headlineAccent}`}
    >
      {/* Ghost giant chapter numeral behind the headline */}
      <div
        ref={numberRef}
        aria-hidden
        className={`absolute top-1/2 -translate-y-1/2 ${reversed ? 'left-[-4%]' : 'right-[-4%]'} pointer-events-none select-none leading-none tracking-[-0.06em] ${
          isDark ? 'text-white/[0.04]' : 'text-foreground/[0.035]'
        }`}
        style={{
          fontFamily: 'Outfit, Inter, sans-serif',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 'clamp(220px, 32vw, 520px)',
        }}
      >
        {asset.nr}
      </div>

      <div className="relative max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28">
        {/* Top metadata strip */}
        <div className={`flex items-center justify-between flex-wrap gap-3 pb-5 mb-12 md:mb-16 border-b ${isDark ? 'border-white/15' : 'border-foreground/15'} font-mono text-[10px] md:text-[10.5px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-white/65' : 'text-foreground/65'}`}>
          <div className="flex items-center gap-x-3 md:gap-x-4 flex-wrap gap-y-1">
            <span>KAPITEL {asset.nr} VON {String(total).padStart(2, '0')}</span>
            <span className={isDark ? 'text-white/20' : 'text-foreground/20'}>/</span>
            <span className="text-brand">{asset.code}</span>
            {asset.eyebrow && (
              <>
                <span className={`hidden md:inline ${isDark ? 'text-white/20' : 'text-foreground/20'}`}>/</span>
                <span className="hidden md:inline">{asset.eyebrow}</span>
              </>
            )}
          </div>
          <span className="hidden sm:inline">LEADER · OS</span>
        </div>

        {/* GIANT HEADLINE · the ONE visual. No photo above, no duplicate h2. */}
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={FADE_UP}
          className="relative z-10 leading-[0.88] tracking-[-0.045em] max-w-[1100px]"
          style={{
            fontFamily: 'Outfit, Inter, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: 'clamp(56px, 10vw, 168px)',
          }}
        >
          {asset.headline.replace(/\.$/, '')}<span className="text-brand not-italic">.</span><br />
          <span className={isDark ? 'text-white/55' : 'text-foreground/55'}>
            {asset.headlineAccent.replace(/\.$/, '')}
          </span>
          <span className="text-brand not-italic">.</span>
        </motion.h2>

        {/* Subline mono caps · kept small so the headline carries the moment */}
        {asset.subline && (
          <p
            className={`mt-6 md:mt-8 max-w-2xl text-[14px] sm:text-[16px] md:text-[18px] leading-[1.35] tracking-[-0.005em] ${
              isDark ? 'text-white/85' : 'text-foreground/85'
            }`}
            style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 700, fontStyle: 'italic' }}
          >
            {asset.subline}
          </p>
        )}

        {/* Body + Photo split */}
        <div className={`relative z-10 mt-12 md:mt-16 grid md:grid-cols-12 gap-10 md:gap-14 items-start ${reversed ? 'md:[&>*:first-child]:order-2' : ''}`}>
          {/* Body + CTA */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={FADE_UP}
            className="md:col-span-7"
          >
            <p className={`text-[15px] md:text-[17px] leading-[1.6] max-w-xl ${isDark ? 'text-white/75' : 'text-foreground/75'}`}>
              {asset.body}
            </p>
            <div className="mt-9 md:mt-12">
              <PlusCircleCTA
                href={asset.href}
                testId={`benefit-${asset.nr}-cta`}
                halo={false}
                className={isDark ? 'text-white' : 'text-foreground'}
              >
                {asset.cta}
              </PlusCircleCTA>
            </div>
          </motion.div>

          {/* Photo column */}
          <motion.div
            style={{ y: yShift }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className={`md:col-span-5 ${asset.visualOffset ? 'md:mt-14 lg:mt-24' : ''}`}
          >
            <PhotoCard
              photo={asset.photo}
              photoFallback={asset.photoFallback}
              photoFit={asset.photoFit}
              variant={asset.variant}
              trustNumbers={asset.trustNumbers}
              nr={asset.nr}
              code={asset.code}
              isDark={isDark}
              posterDesign={asset.posterDesign}
              headline={asset.headline}
            />
          </motion.div>
        </div>

        {/* Specimen table · full-width below */}
        <div
          className={`relative z-10 mt-12 md:mt-16 border ${isDark ? 'border-white/15 bg-white/[0.02]' : 'border-foreground/15 bg-foreground/[0.015]'} p-6 md:p-8`}
          data-testid={`specimen-${asset.nr}`}
        >
          <div className={`flex items-center justify-between pb-4 mb-5 border-b ${isDark ? 'border-white/10' : 'border-foreground/10'}`}>
            <span className={`text-[9.5px] font-bold uppercase tracking-[0.22em] font-mono ${isDark ? 'text-white/55' : 'text-foreground/55'}`}>
              WAS DU BEKOMMST · {asset.nr}
            </span>
            <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] font-mono text-brand">
              {asset.code}
            </span>
          </div>

          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
            {asset.detail.map(([tag, label, value]) => (
              <li key={`${asset.nr}-${tag}`} className="grid grid-cols-12 gap-2 items-start">
                <span className={`col-span-2 text-[10px] font-bold uppercase tracking-[0.15em] font-mono ${isDark ? 'text-white/35' : 'text-foreground/35'}`}>
                  {tag}
                </span>
                <span className={`col-span-4 text-[11px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-white' : 'text-foreground'}`}>
                  {label}
                </span>
                <span className={`col-span-6 text-[12px] leading-[1.4] ${isDark ? 'text-white/70' : 'text-foreground/70'}`}>
                  {value}
                </span>
              </li>
            ))}
          </ul>

          <div className={`mt-6 pt-4 border-t ${isDark ? 'border-white/10' : 'border-foreground/10'} flex items-center justify-between text-[9.5px] font-bold uppercase tracking-[0.22em] font-mono ${isDark ? 'text-white/40' : 'text-foreground/40'}`}>
            <span>LEADEROS</span>
            <span>{`Kapitel ${asset.nr} von ${String(total).padStart(2, '0')}`}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
