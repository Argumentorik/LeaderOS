import { motion } from 'framer-motion';
import { LANDING_MANIFESTO } from '../../data/landingAssets';
import { PlusCircleCTA } from './PlusCircleCTA';

/**
 * ManifestoSection · Dichotomie-Slogans im "X. Y."-Pattern.
 *
 * Sitzt zwischen HowItWorks und den Benefits. Liefert den emotionalen
 * Kern des Pitches in fünf gegenüberstellenden Zeilen · links die KI-
 * /Tool-Welt, rechts der Mensch / Leadership. Dunkler Block damit der
 * Bruch zur weißen Seite den Lesefluss neu rhythmisiert.
 */
export const ManifestoSection = () => (
  <section
    id="manifesto"
    className="relative w-full bg-[#0A0A0A] text-white overflow-hidden"
    aria-label="Manifest · KI bestimmt das Tempo. Du bestimmst den Kurs."
    data-testid="landing-manifesto"
  >
    {/* Lime mesh, dezent */}
    <div
      aria-hidden
      className="absolute inset-0 opacity-50"
      style={{
        backgroundImage:
          'radial-gradient(at 90% 10%, rgba(191,255,0,0.08) 0px, transparent 50%), ' +
          'radial-gradient(at 10% 95%, rgba(191,255,0,0.05) 0px, transparent 55%)',
      }}
    />

    <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-10 py-24 md:py-36">
      <div className="flex items-center gap-4 mb-10 md:mb-14 text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand font-mono">
        <span>▸ {LANDING_MANIFESTO.eyebrow}</span>
        <span className="h-px flex-1 bg-white/15" />
        <span className="text-white/45">EST. 2026</span>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-[44px] sm:text-[64px] md:text-[84px] lg:text-[104px] leading-[0.92] tracking-[-0.04em] text-white max-w-5xl"
        style={{ fontFamily: 'Outfit, Inter, system-ui, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
      >
        {LANDING_MANIFESTO.headline}<br />
        <span className="text-white/55">
          {LANDING_MANIFESTO.headlineAccent.replace(/\.$/, '')}
        </span>
        <span className="text-brand not-italic">.</span>
      </motion.h2>

      <ul className="mt-16 md:mt-24 divide-y divide-white/[0.08] border-y border-white/[0.08]">
        {LANDING_MANIFESTO.lines.map(([nr, left, right], i) => (
          <motion.li
            key={nr}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-12 gap-6 md:gap-10 py-6 md:py-8 items-baseline"
          >
            <span className="col-span-2 md:col-span-1 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.22em] text-brand font-mono pt-2">
              §{nr}
            </span>
            <span
              className="col-span-10 md:col-span-5 text-[22px] sm:text-[28px] md:text-[36px] lg:text-[42px] leading-[1.05] tracking-[-0.02em] text-white/45"
              style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 800 }}
            >
              {left}
            </span>
            <span
              className="col-span-12 md:col-span-6 text-[22px] sm:text-[28px] md:text-[36px] lg:text-[42px] leading-[1.05] tracking-[-0.02em] text-white"
              style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 800, fontStyle: 'italic' }}
            >
              {right}
            </span>
          </motion.li>
        ))}
      </ul>

      <div className="mt-16 md:mt-20 flex flex-wrap items-center gap-x-10 gap-y-6">
        <PlusCircleCTA
          href={LANDING_MANIFESTO.href}
          testId="manifesto-cta"
          halo={false}
          className="text-white"
        >
          {LANDING_MANIFESTO.cta}
        </PlusCircleCTA>
        <a
          href="#benefit-01"
          className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors inline-block py-3 -my-3"
        >
          Wie das geht ↓
        </a>
      </div>
    </div>
  </section>
);
