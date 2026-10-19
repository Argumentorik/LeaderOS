import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useMotionValueEvent, useScroll } from 'framer-motion';
import { WladMark } from '../brand/WladMark';

/**
 * Sticky top nav · wide editorial.
 *
 * Edge-to-edge container (px-6 → px-12) so the nav reads as the page
 * header, not a centered ad-bar floating in the void. Taller default
 * (h-20) collapses to h-16 on scroll. Brand lockup sits big on the
 * left, the CTA is a flat editorial button · no rounded +icon, no
 * pill chrome, no "click here" energy.
 *
 *  Primary CTA   to  leadercheck.de        (app, Emergent)
 *  Secondary CTA to  leaderos.de/login     (app, Emergent)
 *
 * DOMAIN-TOPOLOGY (canonical, see docs/app/DOMAIN_TOPOLOGY.md):
 *   leader-os.de + leader-check.de   = Vercel marketing landings (this app)
 *   leaderos.de  + leadercheck.de    = Emergent apps (where users convert)
 */
export const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <header
      data-testid="landing-nav"
      className={`sticky top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-background/90 backdrop-blur-xl border-b-2 border-foreground/10 h-16'
          : 'bg-background border-b border-foreground/[0.06] h-20'
      }`}
    >
      <div className={`w-full px-4 sm:px-6 md:px-12 lg:px-16 h-full flex items-center justify-between gap-3 sm:gap-6 min-w-0`}>
        <Link
          to="/"
          className="flex items-center gap-3 group shrink-0"
          aria-label="LeaderOS Startseite"
        >
          <WladMark size={scrolled ? 32 : 40} animated />
          <div className="leading-none">
            <span
              className={`font-black tracking-tight text-foreground transition-all ${scrolled ? 'text-[17px]' : 'text-[22px] md:text-[24px]'}`}
              style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}
            >
              Leader<span className="text-brand mx-0.5">·</span>OS
            </span>
          </div>
        </Link>

        {/* Dual entry-point nav: free 10-min diagnose on the left (the
            softest micro-conversion · most visitors click here first),
            14-day trial on the right (the harder commit). Both routes
            converge in the same Mongo identity via email_lower, so
            sending traffic to whichever offer matches the visitor's
            comfort level is strictly better than gating it.
            On mobile the diagnose stays visible (sm:inline-flex) since
            it's the lower-friction option, the trial collapses to
            "14 Tage". */}
        {/* Funnel-ordered (team decision · Leader-Check first): quiet
            leaderos.de login · bordered Beratungsgespräch · and the LIME
            PRIMARY is now the free Leader-Check on leadercheck.de — the
            lowest-friction, highest-converting top-of-funnel action. All
            converge on the same email_lower identity. */}
        <nav className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <a
            href="https://leaderos.de/login"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center h-10 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/60 hover:text-foreground transition-colors"
            data-testid="landing-nav-login"
          >
            Anmelden
          </a>
          <Link
            to="/#beratung"
            className={`group hidden sm:inline-flex items-center gap-1.5 border-2 border-foreground bg-background hover:bg-foreground hover:text-background text-foreground font-bold uppercase tracking-[0.12em] transition-colors ${
              scrolled ? 'h-10 px-2.5 sm:px-3 text-[10px] sm:text-[11px]' : 'h-12 px-2.5 sm:px-4 text-[10.5px] sm:text-[12px]'
            }`}
            data-testid="landing-nav-cta"
          >
            Beratungsgespräch
          </Link>
          <a
            href="https://leadercheck.de"
            target="_blank"
            rel="noopener noreferrer"
            className={`group inline-flex items-center gap-1.5 sm:gap-2.5 bg-brand text-black hover:bg-foreground hover:text-background font-bold uppercase tracking-[0.12em] transition-colors ${
              scrolled ? 'h-10 px-3 sm:px-4 text-[10.5px] sm:text-[11px]' : 'h-12 px-3 sm:px-5 text-[11px] sm:text-[12px]'
            }`}
            data-testid="landing-nav-diagnose"
          >
            <span className="hidden sm:inline">Leader-Check · 10 Min</span>
            <span className="sm:hidden">Leader-Check</span>
            <ArrowRight
              size={scrolled ? 14 : 16}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </a>
        </nav>
      </div>
    </header>
  );
};
