import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingFooter } from '../components/landing/LandingFooter';
import { PlusCircleCTA } from '../components/landing/PlusCircleCTA';
import { HOW_IT_WORKS } from '../data/landingAssets';

/**
 * ThankYouPage · confirmation surface for the lead-capture popup.
 *
 * Shows the user three things in this order:
 *   1. Thanks · and your email (if present in ?email=…)
 *   2. The exact next step: button-jump to leader-check.de
 *   3. The 3-step path so they understand where they are
 *
 * Auth-protected pages are unaffected; this lives at /thank-you
 * publicly so the popup's email-collect can land cleanly.
 */
export default function ThankYouPage() {
  const [params] = useSearchParams();
  const email = params.get('email');

  useEffect(() => {
    document.title = 'Danke · deine Diagnose startet · LeaderOS';
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen antialiased" data-testid="thank-you-page">
      <LandingNav />

      <main className="max-w-[1280px] mx-auto px-5 md:px-10 pt-32 md:pt-40 pb-24 md:pb-32">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 mb-6 font-mono">
          ▸ DEIN START · ERSTE GRUPPE
        </p>

        <h1
          className="text-[48px] sm:text-[72px] md:text-[104px] leading-[0.92] tracking-[-0.04em] text-foreground max-w-4xl"
          style={{
            fontFamily: 'Outfit, Inter, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
          }}
        >
          Wir sehen uns drüben<span className="text-brand not-italic">.</span>
        </h1>

        <p className="mt-8 md:mt-10 max-w-2xl text-[16px] md:text-[19px] leading-[1.55] text-foreground/75">
          {email ? (
            <>
              Danke · wir haben <strong className="text-foreground">{email}</strong> vorgemerkt.
              Klicke jetzt unten weiter zu leader-check.de und schließ deine
              KI-Diagnose ab. Zehn Minuten, kostenlos, sofort dein Ergebnis.
            </>
          ) : (
            <>
              Danke. Klicke unten weiter zu leader-check.de und schließ deine
              KI-Diagnose ab. Zehn Minuten, kostenlos, sofort dein Ergebnis.
            </>
          )}
        </p>

        <div className="mt-10 md:mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
          <PlusCircleCTA
            href="https://leadercheck.de"
            testId="thank-you-cta-primary"
          >
            Weiter zu leader-check.de
          </PlusCircleCTA>
          <Link
            to="/"
            className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground/55 hover:text-foreground transition-colors"
            data-testid="thank-you-cta-back"
          >
            ← Zurück zur Übersicht
          </Link>
        </div>

        {/* The 3-step path so they know exactly where they are */}
        <section className="mt-20 md:mt-28 pt-12 border-t border-foreground/15">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-foreground/55 mb-5 font-mono">
            ▸ DEIN PFAD · DREI SCHRITTE
          </p>
          <h2
            className="text-[32px] sm:text-[44px] md:text-[56px] leading-[0.95] tracking-[-0.035em] text-foreground"
            style={{
              fontFamily: 'Outfit, Inter, sans-serif',
              fontWeight: 900,
              fontStyle: 'italic',
            }}
          >
            So geht's weiter<span className="text-brand not-italic">.</span>
          </h2>

          <ol className="mt-10 grid md:grid-cols-3 gap-6 md:gap-8">
            {HOW_IT_WORKS.map((step, i) => {
              const current = i === 0; // Step 1 = where they are right now
              return (
                <li
                  key={step.nr}
                  className={`border p-6 md:p-7 flex flex-col ${current ? 'border-brand bg-brand/[0.05]' : 'border-foreground/15'}`}
                >
                  <div className="flex items-center justify-between pb-3 mb-5 border-b border-foreground/10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/50 font-mono">
                      STEP {step.nr} / 03
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.22em] font-mono ${current ? 'text-foreground' : 'text-brand'}`}>
                      {current ? 'DU BIST HIER' : step.code}
                    </span>
                  </div>
                  <h3
                    className="text-[24px] leading-[1.05] tracking-[-0.02em] text-foreground"
                    style={{
                      fontFamily: 'Outfit, Inter, sans-serif',
                      fontWeight: 800,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[13.5px] leading-[1.5] text-foreground/65 flex-1">
                    {step.body}
                  </p>
                  <div className="mt-5 pt-4 border-t border-foreground/10 text-[9.5px] font-bold uppercase tracking-[0.22em] text-foreground/45 font-mono">
                    {step.duration}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
