import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { HOW_IT_WORKS } from '../../data/landingAssets';
import { PlusCircleCTA } from './PlusCircleCTA';

// HowTo JSON-LD · injected once at mount, removed on unmount. AI-search
// engines (ChatGPT, Google AI Overview, Perplexity) prefer structured
// HowTo data when answering "how do I" questions; this lets us rank
// for "wie werde ich KI-native Führungskraft" and similar long-tails.
const useHowToJsonLd = () => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Wie werde ich eine KI-native Führungskraft mit LeaderOS',
      description:
        'Drei-Schritt-Pfad von der kostenlosen Diagnose über die 30-Tage-Challenge ' +
        'zur langfristigen Plattform-Mitgliedschaft. Methodik von Wlad Jachtchenko, ' +
        '3× SPIEGEL-Bestseller-Autor.',
      totalTime: 'P30D',
      supply: [
        { '@type': 'HowToSupply', name: '10 Minuten für die Diagnose' },
        { '@type': 'HowToSupply', name: '30 Tage Aufmerksamkeit für die Challenge' },
        { '@type': 'HowToSupply', name: 'Eine reale Führungssituation pro Woche' },
      ],
      step: HOW_IT_WORKS.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.title,
        text: s.body,
        url: s.href,
      })),
    };
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(data);
    el.dataset.howtoLd = 'leader-os';
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
};

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

/**
 * HowItWorksSection · the explicit 3-step conversion path.
 *
 * Why this exists: visitors land confused. We answer "wo fange ich
 * an?" with three crisp cards: DIAGNOSE (leadercheck.de app) → SPRINT →
 * OS. Each card is a Heron-Preston-style specimen tag: code, BIB
 * number, headline, body, CTA. The user told us to make this clear,
 * here it is.
 */
export const HowItWorksSection = () => {
  useHowToJsonLd();
  return (
  <section
    id="how-it-works"
    className="relative w-full bg-background overflow-hidden"
    aria-label="So funktioniert LeaderOS"
    data-testid="how-it-works"
  >
    <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-24 md:py-32">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={FADE_UP}
        custom={0}
        className="max-w-2xl mb-16 md:mb-20"
      >
        <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 mb-5 font-mono">
          ▸ SO FUNKTIONIERT'S · DREI SCHRITTE
        </p>
        <h2
          className="text-[40px] sm:text-[56px] md:text-[72px] leading-[0.92] tracking-[-0.04em] text-foreground"
          style={{
            fontFamily: 'Outfit, Inter, system-ui, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
          }}
        >
          Diagnose. Challenge. OS<span className="text-brand not-italic">.</span>
        </h2>
        <p className="mt-6 max-w-xl text-[15px] md:text-[16px] leading-[1.55] text-foreground/70">
          Du startest immer mit der <strong className="text-foreground">kostenlosen Diagnose</strong>{' '}
          auf leadercheck.de. Sie zeigt wo du stehst und schaltet danach die
          passende Challenge frei. Erst dann lohnt sich das OS.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {HOW_IT_WORKS.map((step, i) => (
          <motion.article
            key={step.nr}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={FADE_UP}
            custom={i + 1}
            className={`relative bg-background border border-foreground/10 p-7 md:p-8 flex flex-col group hover:border-foreground/30 transition-colors ${
              i === 0 ? 'md:-mt-2' : i === 2 ? 'md:mt-2' : ''
            }`}
            data-testid={`how-step-${step.nr}`}
          >
            {/* Specimen-sheet header */}
            <div className="flex items-center justify-between mb-8 pb-3 border-b border-foreground/10">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/50 font-mono">
                STEP {step.nr} / 03
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand font-mono">
                {step.code}
              </span>
            </div>

            {/* Big step number */}
            <div
              className="text-[120px] md:text-[140px] leading-[0.78] tracking-[-0.06em] text-foreground/8 mb-2 font-italic select-none"
              style={{
                fontFamily: 'Outfit, Inter, sans-serif',
                fontWeight: 900,
                fontStyle: 'italic',
              }}
              aria-hidden
            >
              {step.nr}
            </div>

            <h3
              className="text-[28px] md:text-[32px] leading-[1.05] tracking-[-0.025em] text-foreground"
              style={{
                fontFamily: 'Outfit, Inter, sans-serif',
                fontWeight: 800,
              }}
            >
              {step.title}
            </h3>

            <p className="mt-4 text-[14px] leading-[1.55] text-foreground/65 flex-1">
              {step.body}
            </p>

            <div className="mt-6 pt-5 border-t border-foreground/10 flex items-center justify-between">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-foreground/40 font-mono">
                {step.duration}
              </span>
              <a
                href={step.href}
                target={step.external ? '_blank' : undefined}
                rel={step.external ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-foreground hover:text-brand transition-colors"
                data-testid={`how-step-${step.nr}-cta`}
              >
                {step.cta} <span aria-hidden>→</span>
              </a>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Central CTA after the 3 cards */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={FADE_UP}
        custom={4}
        className="mt-16 md:mt-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-10 border-t border-foreground/15"
      >
        <p className="max-w-xl text-[16px] md:text-[18px] leading-[1.45] text-foreground/75">
          <strong className="text-foreground">Starte immer mit der Diagnose.</strong>{' '}
          Sie ist kostenlos, dauert fünf Minuten und sagt dir ehrlich wo du stehst.
        </p>
        <PlusCircleCTA
          href="https://leadercheck.de"
          testId="how-cta-primary"
        >
          Diagnose starten · leadercheck.de
        </PlusCircleCTA>
      </motion.div>
    </div>
  </section>
  );
};
