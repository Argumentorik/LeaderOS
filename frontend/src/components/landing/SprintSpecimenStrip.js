import { motion } from 'framer-motion';

/**
 * TrialSpecimenStrip · specimen plate that surfaces the 14-day-trial entry
 * directly beneath the Hero.
 *
 * The Hero sells the moment ("Vierzehn Tage kostenlos."). This strip sells
 * the no-friction entry in the same scroll position. Sprint pricing lives
 * further down in PricingLadder, not here.
 *
 * Two deliberate renditions (user feedback: the old version looked washed
 * out on desktop and wasted a clumsy 2×2 grid on phones):
 *
 *   Desktop (md+) · editorial spec plate: hard 2px top/bottom rules, lime
 *   00-badge, four spec cells separated by real column rules, display-weight
 *   values, offset-shadow CTA. Reads as a printed table, not a leftover row.
 *   Cells reveal with a left-to-right stagger on scroll-into-view.
 *
 *   Mobile (<md) · smart-collapsed: the whole table becomes ONE mono
 *   ticker line (▸ 14 TAGE · 0 € · OHNE KARTE · JEDERZEIT KÜNDBAR) plus a
 *   full-width CTA. Half the height, zero grid awkwardness.
 */

const CELL_REVEAL = {
  hidden: { opacity: 0, y: 10 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

const SPECS = [
  { tag: 'EINSTIEG', value: '0 €', display: true },
  { tag: 'DAUER', value: '14 Tage', display: true },
  { tag: 'INHALT', value: 'Volle Plattform', sub: 'WLADBOT 24/7 · 11 FRAMEWORKS' },
  { tag: 'KARTE', value: 'Nicht nötig', sub: 'JEDERZEIT KÜNDBAR' },
];

const CTA_HREF = 'https://leaderos.de/signup?trial=14';

export const SprintSpecimenStrip = () => (
  <section
    id="trial-specimen"
    aria-label="14 Tage kostenlos testen. Ohne Karte."
    data-testid="sprint-specimen-strip"
    className="relative w-full bg-background border-y-2 border-foreground"
  >
    {/* ── Desktop · spec plate ─────────────────────────────────────────── */}
    <div className="hidden md:flex max-w-[1280px] mx-auto px-6 lg:px-10 items-stretch">
      {/* Badge cell */}
      <div className="flex items-center gap-3 py-5 pr-8 shrink-0">
        <span
          aria-hidden
          className="inline-flex items-center justify-center w-10 h-10 bg-brand text-[#0A0A0A] font-mono text-[12px] font-black tracking-[0.06em]"
        >
          00
        </span>
        <div className="leading-none">
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-foreground font-mono">TRIAL</div>
          <div className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.2em] text-foreground/45 font-mono">▸ DEIN EINSTIEG</div>
        </div>
      </div>

      {/* Spec cells · real column rules make it read as a printed table.
          Left-to-right stagger reveal on scroll-into-view. */}
      <dl className="flex-1 grid grid-cols-4 divide-x-2 divide-foreground/12 border-l-2 border-foreground/12 min-w-0">
        {SPECS.map(({ tag, value, sub, display }, i) => (
          <motion.div
            key={tag}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
            custom={i}
            variants={CELL_REVEAL}
            className="px-6 py-4 flex flex-col justify-center min-w-0"
          >
            <dt className="text-[9px] font-bold uppercase tracking-[0.24em] text-foreground/45 font-mono">
              ▸ {tag}
            </dt>
            <dd
              className={`mt-1 text-foreground truncate ${display ? 'text-[22px] lg:text-[26px] tabular-nums' : 'text-[15px] lg:text-[16px]'}`}
              style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: display ? 'italic' : 'normal', letterSpacing: '-0.02em' }}
            >
              {value}
              {display && <span className="text-brand-strong not-italic">.</span>}
            </dd>
            {sub && (
              <dd className="mt-0.5 text-[8.5px] font-bold uppercase tracking-[0.18em] text-foreground/50 font-mono truncate">
                {sub}
              </dd>
            )}
          </motion.div>
        ))}
      </dl>

      {/* CTA cell · spring lift on hover, press on tap */}
      <div className="flex items-center pl-8 py-4 shrink-0">
        <motion.a
          href={CTA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="sprint-specimen-cta"
          whileHover={{ y: -2, boxShadow: '2px 2px 0 0 #0A0A0A' }}
          whileTap={{ y: 0, boxShadow: '0px 0px 0 0 #0A0A0A' }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          className="inline-flex items-center gap-2.5 h-12 px-6 bg-brand text-[#0A0A0A] border-2 border-foreground text-[11.5px] font-black uppercase tracking-[0.16em] shadow-[4px_4px_0_0_#0A0A0A]"
        >
          Jetzt starten <span aria-hidden>→</span>
        </motion.a>
      </div>
    </div>

    {/* ── Mobile · one ticker line + full-width CTA ────────────────────── */}
    <div className="md:hidden px-5 py-4">
      <div className="flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/70 whitespace-nowrap overflow-hidden">
        <span className="inline-flex items-center justify-center w-6 h-6 bg-brand text-[#0A0A0A] text-[9px] font-black shrink-0" aria-hidden>00</span>
        <span className="text-brand-strong">▸</span>
        <span className="text-foreground font-black">14 TAGE</span>
        <span className="text-foreground/30">·</span>
        <span className="text-foreground font-black">0 €</span>
        <span className="text-foreground/30">·</span>
        <span>OHNE KARTE</span>
        <span className="text-foreground/30">·</span>
        <span className="truncate">KÜNDBAR</span>
      </div>
      <a
        href={CTA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="sprint-specimen-cta-mobile"
        className="mt-3 flex items-center justify-center gap-2.5 h-12 w-full bg-brand text-[#0A0A0A] border-2 border-foreground text-[11.5px] font-black uppercase tracking-[0.16em] shadow-[3px_3px_0_0_#0A0A0A] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
      >
        14 Tage kostenlos starten <span aria-hidden>→</span>
      </a>
    </div>
  </section>
);
