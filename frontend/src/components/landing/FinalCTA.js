import { motion } from 'framer-motion';
import { LANDING_META } from '../../data/landingAssets';
import { PlusCircleCTA } from './PlusCircleCTA';
import { useGsapScrollIn } from './motion/useGsapScrollIn';
import { DottedGlowBackground } from '../shared/DottedGlowBackground';

// The closing headline as data so the word-reveal motion can target
// individual word spans without breaking the existing typographic tone.
const CLOSING_LINES = [
  { text: 'Wer heute zögert,', tone: 'fg' },
  { text: 'führt morgen unter jemandem,', tone: 'muted' },
  // Fable-5 chrome moment · the payoff line is set in animated metal —
  // the one display-level chrome treatment on the landing (same family
  // as the funnel page's vault), reserved for the closing punch.
  { text: 'der nicht gezögert hat.', tone: 'chrome' },
];

/**
 * FinalCTA · closing black wall, "BIB 0001 STARTEN" hero.
 *
 * Inspired by the Nike "TIME FOR WORK" poster + Electric Hydrogen's
 * final mission section. Massive Outfit Black headline, lime hairline
 * accent, single lime plus-CTA. Two scroll-snap anchors so this is the
 * cleanest exit ramp on the page.
 */
export const FinalCTA = () => {
  // Word-by-word opacity scrub on the closing headline. The line is
  // long and rhetorical; scrubbing forces the eye to read it as a
  // sentence rather than as a typographic block.
  const headlineRef = useGsapScrollIn('word-reveal', { selector: '[data-word]' });

  return (
  <section
    id="final-cta"
    className="relative w-full bg-[#0A0A0A] text-white overflow-hidden"
    aria-label="Starte deine LeaderOS Reise"
    data-testid="landing-final-cta"
  >
    {/* Chrome text treatment · scoped to this section, animated light band
        travels through the metal. Respects prefers-reduced-motion. */}
    <style>{`
      .fcta-chrome{background:linear-gradient(100deg,#f4f4f4 0%,#8d8d8d 20%,#ffffff 36%,#6e6e6e 54%,#e8e8e8 72%,#989898 86%,#f4f4f4 100%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:fctaShine 7s linear infinite;}
      @keyframes fctaShine{to{background-position:-220% 0}}
      @media (prefers-reduced-motion:reduce){.fcta-chrome{animation:none}}
    `}</style>
    {/* Atmospheric lime mesh · subtle, no distraction */}
    <div
      aria-hidden
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage:
          'radial-gradient(at 80% 0%, rgba(191,255,0,0.10) 0px, transparent 50%), radial-gradient(at 15% 90%, rgba(191,255,0,0.06) 0px, transparent 55%)',
      }}
    />

    {/* Animated dotted glow · adds depth on the dark closing surface.
        Radial-masked + low opacity so the headline stays crisp. */}
    <DottedGlowBackground
      className="[mask-image:radial-gradient(120%_120%_at_50%_30%,#000_50%,transparent_100%)]"
      gap={26}
      radius={1.3}
      color="rgba(191,255,0,0.22)"
      glowColor="rgba(191,255,0,0.9)"
      opacity={0.45}
      speedMin={0.15}
      speedMax={0.9}
    />

    <div className="relative z-10 max-w-[1440px] mx-auto px-5 md:px-10 py-28 md:py-40">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl"
      >
        <h2
          ref={headlineRef}
          className="text-[44px] sm:text-[64px] md:text-[88px] lg:text-[112px] leading-[0.92] tracking-[-0.04em] text-white"
          style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          {CLOSING_LINES.map((line, lineIdx) => (
            <span key={lineIdx} className={lineIdx > 0 ? 'block' : 'inline-block'}>
              {line.text.split(/(\s+)/).map((token, tokenIdx) => {
                if (/^\s+$/.test(token)) return <span key={tokenIdx}>{token}</span>;
                const isLast = lineIdx === CLOSING_LINES.length - 1 && token.endsWith('.');
                const display = isLast ? token.replace(/\.$/, '') : token;
                const toneClass =
                  line.tone === 'muted' ? 'text-white/55'
                  : line.tone === 'chrome' ? 'fcta-chrome'
                  : 'text-white';
                return (
                  <span
                    key={tokenIdx}
                    data-word
                    className={`inline-block ${toneClass}`}
                  >
                    {display}
                    {isLast && <span className="text-brand not-italic">.</span>}
                  </span>
                );
              })}
            </span>
          ))}
        </h2>

        <p className="mt-10 max-w-2xl text-center md:text-left mx-auto md:mx-0 text-[15px] md:text-[17px] leading-[1.55] text-white/75">
          Buch dir ein unverbindliches Beratungsgespräch · 30 Minuten, wir
          finden gemeinsam heraus, ob LeaderOS zu dir passt. Oder mach den
          kostenlosen Leader-Check, oder starte direkt 14 Tage kostenlos auf
          leaderos.de · ohne Karte, ohne Risiko.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row flex-wrap items-center sm:items-center justify-center md:justify-start gap-y-4 sm:gap-x-8">
          {/* Primary · das Beratungsgespräch · der einzige mit Halo-Pulse
              damit die Hierarchie klar ist (unsere bevorzugte Conversion). */}
          <PlusCircleCTA
            to={LANDING_META.cta.beratung.href}
            testId="final-cta-beratung"
            className="text-white"
          >
            {LANDING_META.cta.beratung.label}
          </PlusCircleCTA>
          {/* Secondary · der kostenlose Leader-Check auf leadercheck.de */}
          <PlusCircleCTA
            href={LANDING_META.cta.diagnose.href}
            testId="final-cta-diagnose"
            halo={false}
            className="text-white/85 hover:text-white"
          >
            Kostenloser Leader-Check
          </PlusCircleCTA>
          {/* Tertiary · die App selbst · 14 Tage kostenlos auf leaderos.de */}
          <PlusCircleCTA
            href={LANDING_META.cta.primary.href}
            testId="final-cta-trial"
            halo={false}
            className="text-white/55 hover:text-white"
          >
            14 Tage kostenlos auf leaderos.de
          </PlusCircleCTA>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-[10px] uppercase tracking-[0.2em] font-bold text-white/45 max-w-3xl text-center md:text-left mx-auto md:mx-0">
          <span>▸ 14 Tage Trial</span>
          <span>▸ 11 Frameworks</span>
          <span>▸ 24/7 Coach</span>
          <span>▸ Zertifikat 0001</span>
        </div>

        {/* Specimen-tape unter den Pills · ohne Preis. Wer Preise sehen
            will, scrollt hoch zu PricingLadder. Hier zählt der Einstieg. */}
        <div className="mt-10 pt-5 border-t border-white/10 max-w-3xl mx-auto md:mx-0 flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-[0.22em] font-mono text-white/40">
          <span className="text-brand">▸ EINSTIEG</span>
          <span>14 TAGE · KOSTENLOS</span>
          <span className="text-white/20">/</span>
          <span>OHNE KARTE</span>
          <span className="text-white/20">/</span>
          <span>JEDERZEIT KÜNDBAR</span>
        </div>
      </motion.div>
    </div>
  </section>
  );
};
