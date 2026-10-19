import { motion } from 'framer-motion';
import { LANDING_META } from '../../data/landingAssets';
import { PlusCircleCTA } from './PlusCircleCTA';
import { WLAD_AVATAR, WLAD_AVATAR_FALLBACKS, withFallback } from '../../lib/brandAssets';
import { useABVariant, trackABConversion } from '../../lib/abTest';

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

// Headline entrance gets its own spring (a touch of bounce on the biggest
// element on the page reads as confidence, not decoration — "more nice
// motions" per design direction, kept to ONE spring moment so it doesn't
// turn into a bouncy-castle page).
const HEADLINE_SPRING = {
  hidden: { opacity: 0, y: 36, scale: 0.97 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 210, damping: 22, mass: 0.9, delay: 0.06 },
  },
};

/**
 * A/B test: hero_copy_2026_07 · the just-shipped product-first repositioning
 * ("Führe besser. Jeden Tag.") against the earlier, longer-running ATF copy
 * ("Führung ist Fähigkeit.") that the team wants re-validated head-to-head.
 * Assignment is sticky per visitor (see lib/abTest.js); exposure + CTA
 * clicks are tagged with the variant in PostHog for downstream analysis.
 */
const HERO_VARIANTS = {
  a: {
    ariaLabel: 'Führung ist Fähigkeit. 30 Tage zum Führungs-OS.',
    headline: <>Führung ist<br />Fähigkeit<span className="text-brand not-italic">.</span></>,
    subline: (
      <>
        Fähigkeit ist <span className="text-brand">trainierbar</span>.{' '}
        <span className="text-foreground/55">Mit Wlads Methodik. 24/7 KI-Coach<span className="text-brand">.</span></span>
      </>
    ),
  },
  b: {
    ariaLabel: 'Führe besser. Jeden Tag. 30 Tage zum Führungs-OS.',
    headline: <>Führe besser.<br />Jeden Tag<span className="text-brand not-italic">.</span></>,
    subline: (
      <>
        Mit einem <span className="text-brand">System</span> statt Motivation.{' '}
        <span className="text-foreground/55">LeaderOS ist das erste Leadership Operating System — KI-Coach, tägliche Übungen und Wlads Methodik<span className="text-brand">.</span></span>
      </>
    ),
  },
};
const HERO_AB_TEST = 'hero_copy_2026_07';

/**
 * Hero · pure typography, zero image dependency.
 *
 * Heron-Preston specimen-sheet DNA: huge headline, lime period as
 * the punctuation, BIB-coded eyebrow and footer-strip, technical
 * metadata callouts at the corners. Nothing here depends on a CDN.
 *
 * Stack discipline: four text elements only.
 *   1. Wlad-anker strip   (eyebrow / trust)
 *   2. Headline           (A/B: "Führung ist Fähigkeit." vs "Führe besser. Jeden Tag.")
 *   3. Subline            (paired with the headline variant)
 *   4. CTA cluster        (primary + one secondary anchor)
 *
 * Anything else (scarcity pill, trust-strip, scroll-cue) moves into a
 * dedicated band directly below so it doesn't crowd the moment.
 */
export const HeroSection = () => {
  const variant = useABVariant(HERO_AB_TEST, Object.keys(HERO_VARIANTS));
  const copy = HERO_VARIANTS[variant];
  const onCtaClick = (cta) => trackABConversion(HERO_AB_TEST, variant, 'hero_cta_click', { cta });

  return (
  <section
    id="hero"
    className="relative w-full overflow-hidden bg-background"
    data-testid="landing-hero"
    data-ab-variant={variant}
    aria-label={copy.ariaLabel}
  >
    {/* Subtle radial mesh, never the focus */}
    <div
      aria-hidden
      className="absolute inset-0 opacity-70"
      style={{
        backgroundImage:
          'radial-gradient(at 85% 20%, rgba(191,255,0,0.08) 0px, transparent 50%), ' +
          'radial-gradient(at 5% 90%, rgba(191,255,0,0.04) 0px, transparent 55%)',
      }}
    />

    {/* Brand-metadata callouts pinned just under the nav so they read
        as page-chrome, not as a competing content element. */}
    <div
      aria-hidden
      className="hidden md:block absolute top-3 left-6 lg:left-10 text-[9px] font-bold uppercase tracking-[0.22em] text-foreground/35 font-mono"
    >
      [ EST. 2026 · BERLIN ]
    </div>
    <div
      aria-hidden
      className="hidden md:block absolute top-3 right-6 lg:right-10 text-[9px] font-bold uppercase tracking-[0.22em] text-foreground/35 font-mono text-right"
    >
      [ 14 TAGE KOSTENLOS · OHNE KARTE · DIAGNOSE FREE ]
    </div>

    {/* Background-W · Heron-Preston editorial ghost letterform. Chrome-metal
        gradient (Fable-5 signature) + a very slow continuous drift so the
        letterform reads as quietly alive, not a static watermark.
        Hidden on small phones so it never competes with the headline
        on a 375px screen; reintroduced softer on tablet, full on desktop. */}
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1, x: [0, 10, 0] }}
      transition={{
        opacity: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
        x: { duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1.4 },
      }}
      className="hidden sm:flex absolute inset-y-0 right-[-8%] md:right-[-4%] w-[60%] md:w-[58%] items-center justify-end pointer-events-none select-none"
    >
      <span
        className="text-[32vw] md:text-[34vw] lg:text-[28vw] leading-none tracking-[-0.06em]"
        style={{
          fontFamily: 'Outfit, Inter, sans-serif',
          fontWeight: 900,
          fontStyle: 'italic',
          background:
            'linear-gradient(178deg, rgba(10,10,10,0.085) 0%, rgba(10,10,10,0.025) 38%, rgba(10,10,10,0.10) 52%, rgba(10,10,10,0.035) 66%, rgba(10,10,10,0.075) 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        W
      </span>
    </motion.div>

    <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-10 pt-6 md:pt-10 pb-10 md:pb-12">
      {/* 1 / 4 · Wlad-anker (eyebrow slot).
          Centered, vertically-stacked, symmetric. Avatar floats on a
          soft lime halo; name + subline read as one calm trust-line. */}
      <div className="flex flex-col items-center text-center mb-6 md:mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Soft lime halo behind the portrait · animates a slow pulse
              so the anker reads as alive, not static. */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-brand/25 blur-xl"
            animate={{ opacity: [0.45, 0.7, 0.45], scale: [1, 1.08, 1] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <img
            src={WLAD_AVATAR}
            onError={withFallback(WLAD_AVATAR_FALLBACKS)}
            alt="Wlad Jachtchenko · 3× SPIEGEL-Bestseller-Autor und Gründer der Argumentorik-Akademie · LeaderOS"
            width="72"
            height="72"
            fetchpriority="high"
            decoding="async"
            className="relative w-16 h-16 md:w-[72px] md:h-[72px] rounded-full object-cover object-top ring-2 ring-brand/55 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]"
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 text-[14px] md:text-[15px] font-bold text-foreground tracking-[-0.005em]"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Wlad Jachtchenko
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mt-1 text-[11px] md:text-[11.5px] uppercase tracking-[0.18em] text-foreground/55 font-mono"
        >
          3× SPIEGEL-Bestseller · 400 000+ Kunden
        </motion.p>
      </div>

      {/* 2 / 4 · Headline · A/B variant, spring entrance */}
      <motion.h1
        key={`headline-${variant}`}
        initial="hidden"
        animate="show"
        variants={HEADLINE_SPRING}
        className="text-center md:text-left text-[48px] sm:text-[88px] md:text-[136px] lg:text-[176px] leading-[0.86] sm:leading-[0.84] tracking-[-0.038em] sm:tracking-[-0.044em] md:tracking-[-0.048em] text-foreground"
        style={{
          fontFamily: 'Outfit, Inter, system-ui, sans-serif',
          fontWeight: 900,
          fontStyle: 'italic',
        }}
      >
        {copy.headline}
      </motion.h1>

      {/* 3 / 4 · Subline · paired 1:1 with the headline variant above. */}
      <motion.p
        key={`subline-${variant}`}
        initial="hidden"
        animate="show"
        custom={2}
        variants={FADE_UP}
        className="mx-auto md:mx-0 mt-5 sm:mt-6 md:mt-8 max-w-3xl text-center md:text-left text-[18px] sm:text-[26px] md:text-[36px] leading-[1.25] sm:leading-[1.18] tracking-[-0.012em] sm:tracking-[-0.018em] text-foreground"
        style={{
          fontFamily: 'Outfit, Inter, system-ui, sans-serif',
          fontWeight: 800,
        }}
      >
        {copy.subline}
      </motion.p>

      {/* 4 / 4 · CTAs · centered on mobile so the call-to-action moment
          reads as a complete editorial poster on a 375px screen.
          Funnel priority (team decision): the FREE Leader-Check is the
          primary action — lowest friction (10 min, no signup, instant
          result), highest top-of-funnel conversion. The 14-day trial is
          secondary, the Beratungsgespräch tertiary. The 30-Tage-Challenge
          sales push lives INSIDE the app (post-signup sequence + upsell). */}
      <motion.div
        initial="hidden"
        animate="show"
        custom={3}
        variants={FADE_UP}
        className="mt-8 md:mt-10 flex flex-col sm:flex-row flex-wrap items-center sm:items-center justify-center md:justify-start gap-y-4 sm:gap-x-6"
      >
        {/* Primary · the free Leader-Check on leadercheck.de · the
            low-friction lead-magnet and the clear main action. Lime
            plus-halo pulse draws the eye; opens in a new tab. */}
        <PlusCircleCTA
          href={LANDING_META.cta.diagnose.href}
          testId="hero-cta-diagnose"
          onClick={() => onCtaClick('diagnose')}
        >
          Kostenlosen Leader-Check machen · 10 Min
        </PlusCircleCTA>
        {/* Secondary · the 14-day free trial on leaderos.de · for visitors
            who already want the full platform. Bordered, calmer than the
            lime primary so the Check stays the clear first step. */}
        <motion.a
          href={LANDING_META.cta.primary.href}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="hero-cta-trial-primary"
          onClick={() => onCtaClick('trial_primary')}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className="group inline-flex items-center gap-3 border-2 border-foreground bg-background hover:bg-foreground hover:text-background rounded-full px-5 py-3"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background group-hover:bg-background group-hover:text-foreground font-black text-[13px] leading-none transition-colors" aria-hidden>
            +
          </span>
          <span className="text-[12px] font-black uppercase tracking-[0.18em] text-foreground group-hover:text-background transition-colors">
            14 Tage kostenlos testen
          </span>
        </motion.a>
      </motion.div>

      {/* Reassurance line under the CTAs · lowers the perceived cost of
          the Check (the primary action) even further. */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="mt-5 text-center md:text-left text-[13px] md:text-[14px] text-foreground/60"
      >
        10 Minuten · kein Login · sofort dein persönliches Führungs-Ergebnis.{' '}
        <a
          href="/#beratung"
          data-testid="hero-cta-beratung-tertiary"
          onClick={() => onCtaClick('beratung_tertiary')}
          className="font-bold text-foreground underline decoration-1 underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-all"
        >
          Lieber persönlich? Beratungsgespräch →
        </a>
      </motion.p>

      {/* Mobile-only trust line under the CTAs · cements the no-risk
          feel without crowding the desktop layout. */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.55 }}
        className="md:hidden mt-5 text-center text-[11px] font-mono uppercase tracking-[0.22em] text-foreground/45"
      >
        ▸ Kein Abo · Jederzeit kündbar
      </motion.p>
    </div>
  </section>
  );
};
