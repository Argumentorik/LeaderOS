import { motion } from 'framer-motion';
import { LANDING_META } from '../../data/landingAssets';
import { PlusCircleCTA } from './PlusCircleCTA';

/**
 * VimeoIntroSection · schwarzer Block mit Wlads Intro-Video.
 *
 * Sitzt nach dem Manifesto. Liefert das, was Text nicht kann:
 * Wlads Stimme, sein Tempo, seine Augen. Vimeo statt YouTube · kein
 * "Up Next"-Karussell, keine Ablenkung, kein YouTube-Tracker.
 *
 * Vimeo-Embed via iframe in einem 16:9-Container. Player-Settings:
 *   - byline, portrait, title  ausgeschaltet (eigene Identität)
 *   - color = brand-Lime
 *   - dnt = 1 (kein Tracking)
 *
 * Wenn das Video noch nicht freigegeben ist (Privacy "Hide from Vimeo"),
 * muss der Embed-Domain leader-os.de in den Vimeo-Settings whitelisted
 * werden · sonst kommt 403.
 */

const VIMEO_ID = '1197728183';
const VIMEO_SRC =
  `https://player.vimeo.com/video/${VIMEO_ID}` +
  '?byline=0&portrait=0&title=0&color=BFFF00&dnt=1';

export const VimeoIntroSection = () => (
  <section
    id="wlad-intro"
    className="relative w-full bg-[#0A0A0A] text-white overflow-hidden"
    aria-label="Wlad Jachtchenko · Intro"
    data-testid="landing-vimeo-intro"
  >
    {/* Atmospheric lime mesh */}
    <div
      aria-hidden
      className="absolute inset-0 opacity-50"
      style={{
        backgroundImage:
          'radial-gradient(at 85% 15%, rgba(191,255,0,0.10) 0px, transparent 50%), ' +
          'radial-gradient(at 10% 90%, rgba(191,255,0,0.06) 0px, transparent 55%)',
      }}
    />

    <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-10 py-24 md:py-32">
      <div className="grid md:grid-cols-12 gap-10 md:gap-14 items-center">
        {/* Headline column */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-5"
        >
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-6 font-mono">
            ▸ INTRO · 30 SEKUNDEN
          </p>

          <h2
            className="text-[40px] sm:text-[56px] md:text-[72px] lg:text-[88px] leading-[0.92] tracking-[-0.04em] text-white"
            style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Wlad in 30<br />
            <span className="text-white/55">Sekunden</span>
            <span className="text-brand not-italic">.</span>
          </h2>

          <p className="mt-8 max-w-md text-[15px] md:text-[17px] leading-[1.55] text-white/70">
            Bevor du dich entscheidest: schau ihm 30 Sekunden zu. Du
            wirst hören, warum Frameworks für ihn keine Theorie sind,
            und warum LeaderOS kein Kurs ist, sondern ein Training.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <PlusCircleCTA
              href={LANDING_META.cta.primary.href}
              testId="vimeo-cta"
              halo={false}
              className="text-white"
            >
              Diagnose starten · kostenlos
            </PlusCircleCTA>
          </div>
        </motion.div>

        {/* Video column */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-7"
        >
          <div className="relative border border-white/15 bg-black overflow-hidden">
            {/* Tech-strip header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 text-[9px] font-bold uppercase tracking-[0.22em] text-white/55 font-mono">
              <span>▸ WLAD · INTRO 0001</span>
              <span className="text-brand">VIMEO · DNT-ENABLED</span>
            </div>

            {/* 16:9 video */}
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <iframe
                src={VIMEO_SRC}
                title="Wlad Jachtchenko · Intro"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 w-full h-full"
                loading="lazy"
              />
            </div>

            {/* Tech-strip footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 text-[9px] font-bold uppercase tracking-[0.22em] text-white/55 font-mono">
              <span>LEADER·OS</span>
              <span>WLAD JACHTCHENKO</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);
