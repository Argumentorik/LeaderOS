/**
 * BenefitVisual · per-section specimen visual.
 *
 * Three variants drive distinct treatments inside the same Heron-Preston
 * frame so the page reads as a magazine, not a row of identical cards:
 *
 *   variant: 'photo' (default)
 *     Editorial photo inside the frame, with optional portrait crop via
 *     `photoFit: 'portrait'` for tighter face framing.
 *
 *   variant: 'bib'
 *     Typographic BIB 0001 startnummer plate. No photo. Pure marathon
 *     race-bib energy · used on §03 SPRINT.
 *
 *   variant: 'trust'
 *     Giant 400 / 14 numerals with TAUSEND / MILLIONEN suffix labels,
 *     plus a small book-stack inset. Used on §05 TRUST.
 *
 * Photos are bundled local assets (/landing/*) or picsum fallback. If a
 * photo fails to load the frame + metadata still render · the section
 * is never broken.
 */

const SpecimenFrame = ({ children, code, nr, isDark, total = 5 }) => (
  <div
    className={`relative aspect-[4/5] w-full border ${
      isDark ? 'border-white/20 bg-[#0A0A0A]' : 'border-foreground/20 bg-foreground/[0.03]'
    } overflow-hidden`}
    data-testid={`benefit-visual-${nr}`}
  >
    <div
      className={`absolute top-0 inset-x-0 flex items-center justify-between px-4 py-2.5 z-10 ${
        isDark
          ? 'bg-[#0A0A0A]/85 backdrop-blur-sm border-b border-white/10 text-white/70'
          : 'bg-background/85 backdrop-blur-sm border-b border-foreground/10 text-foreground/70'
      } text-[9px] font-bold uppercase tracking-[0.22em] font-mono`}
    >
      <span>§ {nr} / 0{total}</span>
      <span className="text-brand">{code}</span>
    </div>

    {children}

    <div
      className={`absolute bottom-0 inset-x-0 flex items-center justify-between px-4 py-2.5 z-10 ${
        isDark
          ? 'bg-[#0A0A0A]/85 backdrop-blur-sm border-t border-white/10 text-white/55'
          : 'bg-background/85 backdrop-blur-sm border-t border-foreground/10 text-foreground/55'
      } text-[9px] font-bold uppercase tracking-[0.22em] font-mono`}
    >
      <span>LEADEROS</span>
      <span>{`No. ${nr}/0${total}`}</span>
    </div>
  </div>
);

const PhotoBody = ({ photo, photoFallback, isDark, photoFit, alt }) => (
  <>
    {photo ? (
      <img
        src={photo}
        alt={alt || 'Wlad Jachtchenko · LeaderOS · KI-Coach für Führungskräfte'}
        className={`absolute inset-0 w-full h-full ${
          photoFit === 'portrait' ? 'object-cover object-[50%_25%]' : 'object-cover'
        } ${isDark ? 'opacity-80' : 'opacity-95'}`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={(e) => {
          if (photoFallback && e.currentTarget.src !== photoFallback) {
            e.currentTarget.src = photoFallback;
          }
        }}
      />
    ) : (
      <div
        aria-hidden
        className={`absolute inset-0 ${
          isDark ? 'bg-white/[0.03]' : 'bg-foreground/[0.05]'
        }`}
      />
    )}
    <div
      aria-hidden
      className="absolute inset-x-0 bottom-10 h-24 pointer-events-none"
      style={{
        background: isDark
          ? 'linear-gradient(to top, rgba(10,10,10,0.6), transparent)'
          : 'linear-gradient(to top, rgba(0,0,0,0.25), transparent)',
      }}
    />
  </>
);

// Marathon race-bib plate. SVG cutouts in the corners sell the
// "actually a numbered start-plate" read.
const BibBody = ({ isDark }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-12 pb-12">
    <div
      className={`relative w-[88%] max-w-[280px] aspect-[5/4] border-[2.5px] ${
        isDark ? 'border-white/85 bg-[#0A0A0A]' : 'border-foreground/85 bg-background'
      } flex flex-col items-center justify-between py-4`}
      style={{ borderRadius: '8px' }}
    >
      {/* corner punch-holes */}
      {[
        'top-2 left-2', 'top-2 right-2',
        'bottom-2 left-2', 'bottom-2 right-2',
      ].map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`absolute ${pos} w-2.5 h-2.5 rounded-full border ${
            isDark ? 'border-white/60 bg-[#0A0A0A]' : 'border-foreground/60 bg-background'
          }`}
        />
      ))}

      <span
        className={`text-[8.5px] font-bold uppercase tracking-[0.28em] font-mono ${
          isDark ? 'text-white/75' : 'text-foreground/75'
        }`}
      >
        LEADEROS &nbsp;·&nbsp; INDIVIDUELL
      </span>

      <span
        className={`leading-none ${isDark ? 'text-white' : 'text-foreground'}`}
        style={{
          fontFamily: 'Outfit, Inter, system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(72px, 12vw, 132px)',
          letterSpacing: '-0.02em',
        }}
      >
        0001
      </span>

      <span
        className={`text-[8.5px] font-bold uppercase tracking-[0.28em] font-mono text-center px-3 ${
          isDark ? 'text-white/70' : 'text-foreground/70'
        }`}
      >
        Startnummer<br />Für deine Führungs-Evolution
      </span>
    </div>
  </div>
);

// Big-numbers trust wall. 400 + 14 with TAUSEND / MILLIONEN beneath,
// optional book-stack image bottom-right for editorial texture.
const TrustBody = ({ photo, isDark, trustNumbers = [] }) => {
  const [a, b] = trustNumbers;
  return (
    <div className="absolute inset-0">
      {photo && (
        <img
          src={photo}
          alt="Wlad Jachtchenko · 400 000 Klienten, 14 Millionen Views · Autorität-Beweis für LeaderOS"
          className="absolute right-0 bottom-10 h-[55%] w-[55%] object-cover object-right opacity-70"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute inset-0 px-6 pt-14 pb-14 flex flex-col justify-center gap-4">
        {[a, b].filter(Boolean).map((n, i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span
              className={isDark ? 'text-white' : 'text-foreground'}
              style={{
                fontFamily: 'Outfit, Inter, system-ui, sans-serif',
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: 'clamp(56px, 10vw, 104px)',
                lineHeight: 0.85,
                letterSpacing: '-0.04em',
              }}
            >
              {n.big}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.22em] font-mono ${
                isDark ? 'text-white/65' : 'text-foreground/65'
              }`}
            >
              {n.suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Zertifikat-Plate · Goldsiegel-Anmutung + Schreibschrift-Signature.
const CertBody = ({ isDark }) => (
  <div className="absolute inset-0 flex items-center justify-center px-6 pt-12 pb-12">
    <div
      className={`relative w-[88%] max-w-[300px] aspect-[4/5] ${
        isDark ? 'bg-white/[0.97] text-black' : 'bg-background border border-foreground/85'
      } shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] flex flex-col items-center justify-between py-7 px-5`}
    >
      {/* Eckornamente · typografisch dezent */}
      {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`absolute ${pos} text-brand text-[14px] font-bold leading-none`}
        >
          ✦
        </span>
      ))}

      <div className="text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-black/60 font-mono">
          ZERTIFIKAT
        </p>
        <p className="mt-1 text-[7.5px] font-bold uppercase tracking-[0.24em] text-black/40 font-mono">
          Certificate of Completion
        </p>
      </div>

      <div className="text-center">
        <p
          className="text-[20px] text-black"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
        >
          Anna Schmidt
        </p>
        <p className="mt-3 text-[8.5px] leading-[1.45] text-black/65 px-2">
          hat die 30-Tage-Führungs-Challenge abgeschlossen und alle elf
          Wlad-Frameworks gemeistert.
        </p>
      </div>

      {/* Goldsiegel-Andeutung */}
      <div className="flex items-end justify-between w-full mt-1">
        <div className="text-[7.5px] font-bold uppercase tracking-[0.22em] text-black/55 font-mono leading-tight">
          LEADER<br />OS
        </div>
        <div
          className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-black font-black text-[13px]"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          W
        </div>
        <div
          className="text-[13px] text-black"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Wlad J.
        </div>
      </div>
    </div>
  </div>
);

// Voxel-Kopf-Hint · typografische W-Skulptur in Lime, dunkler Hintergrund.
const VoxelBody = ({ isDark }) => (
  <div className="absolute inset-0 bg-[#0A0A0A] overflow-hidden">
    {/* Voxel-Grid als Hintergrund */}
    <div
      aria-hidden
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          'linear-gradient(rgba(191,255,0,0.18) 1px, transparent 1px), ' +
          'linear-gradient(90deg, rgba(191,255,0,0.18) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        maskImage: 'radial-gradient(circle at 50% 55%, black 0%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 55%, black 0%, transparent 70%)',
      }}
    />
    <div className="absolute inset-0 flex items-center justify-center">
      <span
        className="text-brand leading-none select-none"
        style={{
          fontFamily: 'Outfit, Inter, system-ui, sans-serif',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 'clamp(140px, 30vw, 280px)',
          letterSpacing: '-0.06em',
          textShadow: '0 0 60px rgba(191,255,0,0.4)',
        }}
      >
        W
      </span>
    </div>
    {/* Floating-Framework-Labels · Voxel-Hint aus dem Mockup */}
    <div className="absolute top-[18%] right-[14%] text-[9px] font-bold uppercase tracking-[0.22em] text-brand font-mono">
      SEXIER
    </div>
    <div className="absolute top-[44%] right-[8%] text-[9px] font-bold uppercase tracking-[0.22em] text-brand font-mono">
      FEEDBACK
    </div>
    <div className="absolute bottom-[22%] left-[12%] text-[9px] font-bold uppercase tracking-[0.22em] text-brand font-mono">
      5 ROLLEN
    </div>
  </div>
);

// ListBody · typographic-only specimen for benefits where no image
// fits. Uses the asset's detail array as the visible body so there's
// no AI-generated mockup competing for attention.
const ListBody = ({ isDark, listItems = [], headline }) => (
  <div className={`absolute inset-0 ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'} px-6 sm:px-10 md:px-14 flex flex-col justify-center`}>
    {headline && (
      <div
        className={`mb-6 md:mb-8 leading-[0.92] tracking-[-0.04em] ${isDark ? 'text-white' : 'text-black'}`}
        style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(28px, 4.5vw, 56px)' }}
      >
        {headline}<span className="text-brand">.</span>
      </div>
    )}
    <ul className={`space-y-2.5 md:space-y-3 ${isDark ? 'border-t border-white/15' : 'border-t border-black/15'} pt-4`}>
      {listItems.slice(0, 8).map((row) => (
        <li key={row[0]} className="grid grid-cols-12 gap-3 items-baseline">
          <span className={`col-span-2 sm:col-span-1 text-[9.5px] font-bold uppercase tracking-[0.18em] font-mono pt-0.5 ${isDark ? 'text-brand' : 'text-brand-strong'}`}>
            {row[0]}
          </span>
          <span className={`col-span-4 sm:col-span-4 text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.12em] font-mono ${isDark ? 'text-white' : 'text-black'}`}>
            {row[1]}
          </span>
          <span className={`col-span-6 sm:col-span-7 text-[12px] sm:text-[13.5px] leading-[1.35] ${isDark ? 'text-white/65' : 'text-black/65'}`}>
            {row[2]}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export const BenefitVisual = ({
  nr,
  code,
  photo,
  photoFallback,
  photoFit,
  variant = 'photo',
  trustNumbers,
  listItems,
  listHeadline,
  isDark = false,
  total = 7,
}) => (
  <SpecimenFrame nr={nr} code={code} isDark={isDark} total={total}>
    {variant === 'bib' && <BibBody isDark={isDark} />}
    {variant === 'cert' && <CertBody isDark={isDark} />}
    {variant === 'voxel' && <VoxelBody isDark={isDark} />}
    {variant === 'list' && (
      <ListBody isDark={isDark} listItems={listItems} headline={listHeadline} />
    )}
    {variant === 'trust' && (
      <TrustBody photo={photo} isDark={isDark} trustNumbers={trustNumbers} />
    )}
    {(variant === 'photo' || !variant) && (
      <PhotoBody
        photo={photo}
        photoFallback={photoFallback}
        isDark={isDark}
        photoFit={photoFit}
      />
    )}
  </SpecimenFrame>
);
