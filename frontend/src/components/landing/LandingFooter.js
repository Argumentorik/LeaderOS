import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { EmailCapture } from '../../features/newsletter';
import { WladMark } from '../brand/WladMark';

/**
 * LandingFooter · comprehensive black sitemap with lime focal accents
 * and 3 brand image tiles. Built for "godmode" launch: every public
 * route reachable in one click, every Journal category deep-linked,
 * Wlad authority visible.
 *
 *  STRUCTURE
 *    1. Brand block (logo + invitation pill)
 *    2. Four sitemap columns (SYSTEM · PLATTFORM · EXPLORE · COMPANY)
 *    3. Image-tile strip (Wlad portrait · Intro-Video poster · Brand-W
 *       sticker) · each linking out
 *    4. Newsletter capture (Klartext)
 *    5. Investment + contact split
 *    6. BIB closing strip
 *
 *  COLOR DISCIPLINE
 *    bg #0A0A0A pure ink, lime accents EVERYWHERE the user should focus:
 *    section labels, invitation pill, image hover-rings, investment numbers,
 *    "Beratungsgespräch" link emphasis. White hover-state for the link
 *    columns; slate-300 idle so the wall is calm but readable.
 */

// ─────────────────────────────────────────────────────────────────────────
// Sitemap data
//
// Cross-tier convention (see lib/tierRedirect.js for the canonical map):
//   - `to:`    react-router SPA navigate · only for routes that exist on
//              the marketing host (Vercel: leader-os.de · leader-check.de).
//              That's /, /journal/*, /datenschutz, /impressum, /agb,
//              /widerruf, /thank-you, /m/*, /f/*, /newsletter/*, plus
//              any /#anchor on the landing.
//   - `href:`  hard cross-host link · used for ALL app-tier routes
//              (/dashboard, /chat, /tools, /onboarding, /profile, …) so
//              the click lands on leaderos.de in one HTTP request instead
//              of routing through the SPA tier-redirect with a flicker.
// ─────────────────────────────────────────────────────────────────────────
const COL_SYSTEM = [
  { label: '14 Tage kostenlos testen',     href: 'https://leaderos.de/signup?trial=14', external: true, focal: true },
  { label: 'Führung beginnt hier · 4 Videos', to: '/fuehrung-beginnt-hier', focal: true },
  { label: 'KI-Führungskraft werden',     to: '/ki-fuehrungskraft', focal: true },
  { label: 'Diagnose · 10 Min',            href: 'https://leadercheck.de', external: true },
  { label: 'WladBot · 24/7 Sparring',      to: '/#platform' },
  { label: '11 Frameworks',                to: '/#platform' },
  { label: '6-Monats-Curriculum',          to: '/journal/in-6-monaten-zur-ki-nativen-fuehrungskraft' },
  { label: 'Die 5 Rollen',                 to: '/journal/die-5-rollen-einer-ki-nativen-fuehrungskraft' },
  { label: 'Leadership-Diagnose',          href: 'https://leadercheck.de', external: true },
  { label: 'Werde Teil von LeaderOS',      to: '/#klassen' },
  { label: 'Beratungsgespräch buchen',     to: '/#beratung', focal: true },
];

// Mirrors the real leaderos.de dashboard nav (components/layout/Sidebar.js)
// 1:1 — same routes, same labels, same order. Previously advertised tabs
// the dashboard doesn't have (Lern-Videos, Downloads, /community) and was
// missing real ones (Challenge, Aufgaben, Challengers, Events). Keep in
// sync when the app sidebar changes.
const COL_PLATTFORM = [
  { label: 'Dashboard',          href: 'https://leaderos.de/dashboard',     external: true },
  { label: '30-Tage Challenge',  href: 'https://leaderos.de/challenge',     external: true },
  { label: 'Täglicher Check-in', href: 'https://leaderos.de/daily-checkin', external: true },
  { label: 'Aufgaben',           href: 'https://leaderos.de/tasks',         external: true },
  { label: 'WladBot · Chat',     href: 'https://leaderos.de/chat',          external: true },
  { label: 'Simulationen',       href: 'https://leaderos.de/simulations',   external: true },
  { label: 'Challengers',        href: 'https://leaderos.de/challengers',   external: true },
  { label: 'Playbooks',          href: 'https://leaderos.de/playbooks',     external: true },
  { label: 'Video Analyse',      href: 'https://leaderos.de/missions',      external: true },
  { label: 'Workflows',          href: 'https://leaderos.de/tools',         external: true },
  { label: 'My Path',            href: 'https://leaderos.de/my-path',       external: true },
  { label: 'Wlad-Universum',     href: 'https://leaderos.de/wlad-universe', external: true },
  { label: 'Community',          href: 'https://leaderos.de/progress',      external: true },
  { label: 'Events',             href: 'https://leaderos.de/events',        external: true },
  { label: 'Coaching',           href: 'https://leaderos.de/coaching',      external: true },
];

const COL_EXPLORE = [
  { label: 'Wlad Jachtchenko · Person',     to: '/wlad-jachtchenko', focal: true },
  { label: 'Feldnotizen · Journal',         to: '/journal' },
  { label: 'KI-Praxis',                     to: '/journal#cat-ki-praxis' },
  { label: 'Methoden & Frameworks',         to: '/journal#cat-methoden' },
  { label: 'Rhetorik & Kommunikation',      to: '/journal#cat-rhetorik' },
  { label: 'Rollen & Karriere',             to: '/journal#cat-rollen-karriere' },
  { label: 'Plattform & LeaderOS',          to: '/journal#cat-plattform' },
  { label: 'Free Tools',                    to: '/#free-tools' },
  { label: 'Podcast · Wlad spricht',        href: 'https://podcast.wladjachtchenko.de', external: true },
  { label: 'Bücher · 3 SPIEGEL-Bestseller', href: 'https://wladjachtchenko.de/buecher', external: true },
  { label: 'FAQ',                           to: '/#faq' },
  // Statische Antwort-Seite (public/fragen/index.html) · bewusst `href`
  // statt `to`: sie liegt außerhalb des React-Routers und wird von
  // Vercel direkt ausgeliefert. Ein <Link> würde clientseitig routen
  // und im SPA-404 landen.
  { label: 'Fragen & Frameworks',           href: '/fragen' },
];

const COL_COMPANY = [
  { label: 'Login',                  href: 'https://leaderos.de/login',      external: true },
  { label: '14 Tage testen',         href: 'https://leaderos.de/signup?trial=14', external: true, focal: true },
  { label: 'Onboarding',             href: 'https://leaderos.de/onboarding', external: true },
  { label: 'Profile',                href: 'https://leaderos.de/profile',    external: true },
  { label: 'Referral · Empfehlung',  href: 'https://leaderos.de/referral',   external: true },
  { label: 'Enterprise',             href: 'https://leaderos.de/enterprise', external: true },
  { label: 'Wlad auf LinkedIn',      href: 'https://www.linkedin.com/in/wladislawjachtchenko', external: true },
  { label: 'start@aiporate.com',     href: 'mailto:start@aiporate.com' },
  { label: 'Impressum',              to: '/impressum' },
  { label: 'Datenschutz',            to: '/datenschutz' },
  { label: 'AGB',                    to: '/agb' },
  { label: 'Widerruf',               to: '/widerruf' },
];

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────
const SitemapLink = ({ link }) => {
  const className = link.focal
    ? 'inline-flex items-center gap-1.5 text-brand hover:text-white transition-colors font-extrabold'
    : 'text-slate-300 hover:text-white transition-colors font-bold';
  if (link.to) {
    return (
      <Link to={link.to} className={className}>
        {link.label}
        {link.focal && <span aria-hidden className="text-brand">→</span>}
      </Link>
    );
  }
  return (
    <a
      href={link.href}
      target={link.external ? '_blank' : undefined}
      rel={link.external ? 'noopener noreferrer' : undefined}
      className={className}
    >
      {link.label}
      {link.external && <ArrowUpRight size={12} className="inline-block ml-0.5 text-slate-500" />}
    </a>
  );
};

const Column = ({ title, links, testId }) => (
  <div data-testid={testId}>
    <p className="text-[10.5px] font-extrabold uppercase tracking-[0.24em] text-brand mb-6">
      {title}
    </p>
    <ul className="space-y-3.5 text-[13.5px] leading-[1.3]">
      {links.map((l) => (
        <li key={l.label}>
          <SitemapLink link={l} />
        </li>
      ))}
    </ul>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// Page-bg + dotted-grid layer
// ─────────────────────────────────────────────────────────────────────────
const dotGridStyle = {
  backgroundColor: '#0A0A0A',
  backgroundImage:
    'radial-gradient(rgba(191, 255, 0, 0.06) 1px, transparent 1.2px)',
  backgroundSize: '24px 24px',
  backgroundPosition: '0 0',
};

// ─────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────
export const LandingFooter = () => (
  <footer
    className="text-white/60 border-t border-white/[0.06]"
    style={dotGridStyle}
    data-testid="landing-footer"
  >
    <div className="max-w-[1480px] mx-auto px-5 md:px-10 lg:px-14 py-16 md:py-24">
      {/* ── Top: brand + 4 deep sitemap columns ────────────────────────── */}
      <div className="grid md:grid-cols-12 gap-12 md:gap-14">
        {/* Brand block */}
        <div className="md:col-span-3">
          <Link
            to="/"
            className="flex items-center gap-4 mb-6 group"
            aria-label="LeaderOS Startseite"
          >
            <WladMark size={56} animated />
            <div>
              <div
                className="text-[26px] font-black tracking-tight text-white leading-none"
                style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.025em' }}
              >
                Leader<span className="text-brand mx-0.5">·</span>OS
              </div>
              <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.22em] text-white/45 font-mono">
                POWERED BY WLADBOT
              </div>
            </div>
          </Link>
          <p className="max-w-xs text-[13.5px] leading-[1.55] text-slate-400">
            Das Operating System für Führungskräfte, gebaut auf
            Wlad Jachtchenkos Methodik. Staatlich anerkannt.
            400 000+ Klienten in 20 Ländern.
          </p>

          {/* Invitation Pill · werde Teil von LeaderOS */}
          <div className="mt-7 inline-flex items-center gap-2.5 px-3.5 py-2 border-2 border-brand bg-brand/[0.10] text-[10px] font-bold uppercase tracking-[0.22em] text-brand font-mono">
            <span className="relative inline-flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-brand animate-ping opacity-75" />
              <span className="relative w-2 h-2 rounded-full bg-brand" />
            </span>
            WERDE TEIL · MACH DEN LEADER-CHECK
          </div>
        </div>

        {/* 4 sitemap columns */}
        <div className="md:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          <Column title="SYSTEM"    links={COL_SYSTEM}    testId="footer-col-system" />
          <Column title="PLATTFORM" links={COL_PLATTFORM} testId="footer-col-plattform" />
          <Column title="EXPLORE"   links={COL_EXPLORE}   testId="footer-col-explore" />
          <Column title="COMPANY"   links={COL_COMPANY}   testId="footer-col-company" />
        </div>
      </div>

      {/* The MEDIA · MEET WLAD image-tile strip lived here · removed because
          the middle tile rendered the legacy hf-04.png poster (the
          AI-mockup of someone who is not Wlad) and the lime CTA disk on
          the third tile collided with its own label · neither was on-brand.
          The /wlad-jachtchenko canonical page now carries the Meet-Wlad
          surface in full editorial layout. */}

      {/* ── Newsletter · Klartext opt-in ─────────────────────────────── */}
      <div
        id="newsletter-footer"
        data-newsletter-zone
        className="mt-16 pt-10 border-t border-white/10 grid md:grid-cols-12 gap-8 md:gap-14 items-start"
      >
        <div className="md:col-span-5">
          <h3
            className="text-[28px] md:text-[34px] leading-[0.95] tracking-[-0.03em] text-white"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Klartext<span className="text-brand not-italic">.</span>
          </h3>
          <p className="mt-3 max-w-sm text-[13.5px] leading-[1.55] text-slate-400">
            Wlads Notizen aus 400 000 Coachings. Eine kurze E-Mail alle
            paar Wochen: Frameworks, Skripte, Beobachtungen. Kein Spam,
            keine Pitches.
          </p>
        </div>
        <div className="md:col-span-7">
          <EmailCapture source="footer" campaign="field-notes" tone="dark" compact />
        </div>
      </div>

      {/* ── Investment + contact ─────────────────────────────────────────── */}
      <div className="mt-14 pt-6 border-t border-white/10 grid md:grid-cols-2 gap-6 md:gap-10 items-start">
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.28em] mb-3 font-mono text-brand">
            ▸ INVESTITION
          </p>
          <p className="text-[14px] leading-[1.55] text-slate-300 max-w-md mb-4">
            Drei Wege rein · alle direkt auf{' '}
            <a
              href="https://leaderos.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-brand transition-colors font-bold underline decoration-brand/40 underline-offset-2"
            >
              leaderos.de
            </a>
            , der Plattform. Kein Abo, keine automatische Verlängerung,
            14 Tage Geld-zurück-Garantie auf die Challenge.
          </p>
          {/* Direct-link price ladder · jede Zeile zeigt einen Tier mit Preis und
              klickt cross-host auf den App-Tier-Checkout. So sehen Visitor in der
              Footer-Zeile alle drei Optionen und können direkt einsteigen, ohne
              zur PricingLadder hochscrollen zu müssen. */}
          <div className="space-y-1.5 max-w-md font-mono text-[11.5px] uppercase tracking-[0.14em]">
            <a
              href="https://leaderos.de/signup?trial=14"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-baseline justify-between gap-3 py-1.5 border-b border-white/10 text-slate-300 hover:text-white transition-colors"
              data-testid="footer-tier-trial"
            >
              <span><span className="text-brand font-black">0 €</span> · Trial · 14 Tage</span>
              <span className="text-white/40 group-hover:text-brand">→</span>
            </a>
            <a
              href="https://leaderos.de/checkout?tier=sprint"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-baseline justify-between gap-3 py-1.5 border-b border-white/10 text-slate-300 hover:text-white transition-colors"
              data-testid="footer-tier-sprint"
            >
              <span><span className="text-brand font-black">997 €</span> · Challenge · 30 T + 12 Mo</span>
              <span className="text-white/40 group-hover:text-brand">→</span>
            </a>
            <a
              href="https://leaderos.de/checkout?tier=plusplus"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-baseline justify-between gap-3 py-1.5 text-slate-300 hover:text-white transition-colors"
              data-testid="footer-tier-plusplus"
            >
              <span><span className="text-brand font-black">4 797 €</span> · Leadership Plus Pro · OS-Jahr</span>
              <span className="text-white/40 group-hover:text-brand">→</span>
            </a>
          </div>
        </div>
        <div className="md:text-right">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.28em] mb-3 font-mono text-brand">
            ▸ KONTAKT
          </p>
          <a
            href="mailto:start@aiporate.com"
            className="text-[14px] text-white hover:text-brand transition-colors font-bold"
          >
            start@aiporate.com
          </a>
          <p className="mt-1.5 text-[13px] text-slate-400">
            Antwort innerhalb von 24 h · Mo bis Fr
          </p>
        </div>
      </div>

      {/* ── BIB strip ────────────────────────────────────────────────────── */}
      <div className="mt-10 pt-5 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[9.5px] uppercase tracking-[0.22em] font-bold text-white/35 font-mono">
        <span>© {new Date().getFullYear()} <span className="text-brand">LEADEROS</span> · AIPORATE</span>
        <span>STAATLICH ANERKANNT · <span className="text-brand">400 000+ KLIENTEN</span> · 20 LÄNDER</span>
      </div>
    </div>
  </footer>
);
