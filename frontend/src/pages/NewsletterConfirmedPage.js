import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingFooter } from '../components/landing/LandingFooter';
import { PlusCircleCTA } from '../components/landing/PlusCircleCTA';

/**
 * NewsletterConfirmedPage · double-opt-in landing.
 *
 * The newsletter-confirm Edge Function 302-redirects here after flipping
 * a subscriber to `active`. It passes ?status= so we can message the
 * three outcomes precisely:
 *   confirmed · first successful confirmation
 *   already   · link clicked again / already active
 *   invalid   · bad or expired token
 *
 * Lives publicly at /newsletter/confirmed. Marked noindex so the
 * confirmation surface never enters search results.
 */

const COPY = {
  confirmed: {
    eyebrow: '▸ KLARTEXT · BESTÄTIGT',
    headline: 'Du bist dabei',
    body:
      'Deine Anmeldung ist bestätigt. Du bekommst Wlads Klartext ab ' +
      'sofort · Notizen aus 400 000 Coachings, alle paar Wochen, kein Spam.',
  },
  already: {
    eyebrow: '▸ KLARTEXT · BEREITS AKTIV',
    headline: 'Alles startklar',
    body:
      'Diese Adresse war schon bestätigt · du bist also längst dabei. ' +
      'Nichts weiter zu tun.',
  },
  invalid: {
    eyebrow: '▸ KLARTEXT · LINK UNGÜLTIG',
    headline: 'Link abgelaufen',
    body:
      'Dieser Bestätigungs-Link ist ungültig oder abgelaufen. Trag dich ' +
      'einfach erneut ein · wir schicken dir einen frischen Link.',
  },
};

export default function NewsletterConfirmedPage() {
  const [params] = useSearchParams();
  const status = ['confirmed', 'already', 'invalid'].includes(params.get('status'))
    ? params.get('status')
    : 'confirmed';
  const copy = COPY[status];

  useEffect(() => {
    document.title = 'Klartext · Bestätigung · LeaderOS';
    // Defensive noindex even though robots.txt + meta cover it.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen antialiased" data-testid="newsletter-confirmed-page">
      <LandingNav />

      <main className="max-w-[1280px] mx-auto px-5 md:px-10 pt-32 md:pt-40 pb-24 md:pb-32">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 mb-6 font-mono">
          {copy.eyebrow}
        </p>

        <h1
          className="text-[48px] sm:text-[72px] md:text-[104px] leading-[0.92] tracking-[-0.04em] text-foreground max-w-4xl"
          style={{
            fontFamily: 'Outfit, Inter, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
          }}
        >
          {copy.headline}<span className="text-brand not-italic">.</span>
        </h1>

        <p className="mt-8 md:mt-10 max-w-2xl text-[16px] md:text-[19px] leading-[1.55] text-foreground/75">
          {copy.body}
        </p>

        <div className="mt-10 md:mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
          <PlusCircleCTA href="https://leadercheck.de" testId="newsletter-cta-primary">
            Diagnose starten · kostenlos
          </PlusCircleCTA>
          <Link
            to="/"
            className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground/55 hover:text-foreground transition-colors"
            data-testid="newsletter-cta-back"
          >
            ← Zurück zur Übersicht
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
