import { useState } from 'react';

/**
 * CoachingWaitlist · limitierte Warteliste für 1:1-Coaching mit Wlads Team.
 *
 * Scarcity-Anker. Kein direktes Kauf-Produkt · bewusst gating. Wer
 * 1:1-Mentoring will, geht durch eine kuratierte Liste. Position:
 * zwischen ManifestoSection und Benefits, als ruhiger schwarzer
 * Block der den Übergang von Story zu Produkt-Sektionen markiert.
 *
 * Lead-Capture: PostHog identify + capture, Best-effort backend
 * POST zu /api/leader-check/intent mit source 'coaching-waitlist'.
 */
export const CoachingWaitlist = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = (email || '').trim();
    if (!trimmed || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    setError('');
    setSubmitting(true);

    if (typeof window !== 'undefined' && window.posthog?.capture) {
      try {
        window.posthog.identify(trimmed.toLowerCase());
        window.posthog.capture('lead_captured', {
          email: trimmed,
          source: 'coaching-waitlist',
          campaign: 'leader-os-launch',
          surface: 'leader-os',
        });
      } catch { /* never block UX */ }
    }

    try {
      await fetch('/api/leader-check/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          source: 'coaching-waitlist',
          campaign: 'leader-os-launch',
        }),
        keepalive: true,
      });
    } catch { /* funnel continues */ }

    setSubmitting(false);
    setDone(true);
  };

  return (
    <section
      id="coaching-waitlist"
      className="relative w-full bg-[#0A0A0A] text-white border-y-2 border-black"
      aria-label="1:1 Coaching Warteliste"
      data-testid="coaching-waitlist"
    >
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          {/* Linke Spalte · Editorial */}
          <div className="lg:col-span-7">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-5 font-mono">
              ▸ 1:1 MIT WLAD · BEGRENZT
            </p>
            <h2
              className="leading-[0.92] tracking-[-0.04em] text-white"
              style={{
                fontFamily: 'Outfit, Inter, system-ui, sans-serif',
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: 'clamp(40px, 6.5vw, 96px)',
              }}
            >
              Sechs Plätze<br />
              <span className="text-white/55">im Quartal</span>
              <span className="text-brand not-italic">.</span>
            </h2>
            <p className="mt-7 max-w-xl text-[15px] md:text-[17px] leading-[1.55] text-white/70">
              Wlad coacht persönlich nur eine Handvoll Führungskräfte pro
              Quartal. Sechs Wochen, sechs Sessions, eine Transformation.
              Kein Standard-Produkt. Bewerbung über die Warteliste.
              Leadership Plus Pro ist der direkte Weg dorthin: wer das OS-Jahr
              durchzieht, bekommt Vorrang.
            </p>

            <ul className="mt-8 space-y-3 border-t border-white/15 pt-6 max-w-md">
              <li className="grid grid-cols-12 gap-3 text-[12.5px] items-baseline">
                <span className="col-span-3 font-mono text-brand font-bold tracking-[0.18em] uppercase text-[10px]">FORMAT</span>
                <span className="col-span-9 text-white/80">6 × 90 Min · Live · ungeschnitten</span>
              </li>
              <li className="grid grid-cols-12 gap-3 text-[12.5px] items-baseline">
                <span className="col-span-3 font-mono text-brand font-bold tracking-[0.18em] uppercase text-[10px]">RHYTHMUS</span>
                <span className="col-span-9 text-white/80">14-tägig · 3 Monate Block</span>
              </li>
              <li className="grid grid-cols-12 gap-3 text-[12.5px] items-baseline">
                <span className="col-span-3 font-mono text-brand font-bold tracking-[0.18em] uppercase text-[10px]">VORRANG</span>
                <span className="col-span-9 text-white/80">Leadership-Plus-Pro-User der letzten 12 Monate</span>
              </li>
              <li className="grid grid-cols-12 gap-3 text-[12.5px] items-baseline">
                <span className="col-span-3 font-mono text-brand font-bold tracking-[0.18em] uppercase text-[10px]">INVEST</span>
                <span className="col-span-9 text-white/80">Auf Anfrage · nach Erstgespräch</span>
              </li>
            </ul>
          </div>

          {/* Rechte Spalte · Warteliste-Form */}
          <div className="lg:col-span-5">
            <div className="border-2 border-white/15 p-7 md:p-9 bg-white/[0.02]">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand font-mono mb-4">
                ▸ WARTELISTE · Q1 2027
              </p>

              {!done ? (
                <form onSubmit={onSubmit} className="space-y-4">
                  <p className="text-[14px] leading-[1.5] text-white/80">
                    Du hörst <strong className="text-white">vor allen anderen</strong> wenn
                    Wlad den nächsten Quartals-Block öffnet. Maximal
                    sechs Plätze. Erstgespräch kostenlos.
                  </p>

                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55 font-mono block mb-2">
                      E-MAIL
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dein.name@firma.de"
                      autoComplete="email"
                      data-testid="waitlist-email"
                      className="w-full h-12 bg-black border-2 border-white/20 focus:border-brand focus:ring-0 outline-none px-3 text-[14px] text-white placeholder-white/30 font-mono"
                    />
                  </label>

                  {error && (
                    <p role="alert" className="text-[12px] text-red-400 font-medium">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    data-testid="waitlist-submit"
                    className="w-full h-12 bg-brand hover:brightness-105 active:translate-y-px text-black text-[12px] font-black uppercase tracking-[0.18em] transition-all disabled:opacity-60"
                  >
                    {submitting ? 'Wird übermittelt …' : '+  Auf Warteliste'}
                  </button>

                  <p className="text-[11px] text-white/45 leading-[1.5]">
                    Wir kontaktieren dich nur wenn Plätze frei werden.
                    Keine Newsletter. DSGVO-konform.
                  </p>
                </form>
              ) : (
                <div data-testid="waitlist-done">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand font-mono mb-3">
                    ▸ AUFGENOMMEN
                  </p>
                  <p className="text-[18px] font-bold text-white leading-[1.3]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Du bist auf der Liste.
                  </p>
                  <p className="mt-3 text-[13.5px] text-white/65 leading-[1.55]">
                    Sobald Wlad den nächsten Quartals-Block öffnet, hörst
                    du als erste:r davon. Bis dahin: Start mit der Challenge
                    bringt dich in die Vorrang-Liste.
                  </p>
                </div>
              )}
            </div>

            <p className="mt-4 text-[10.5px] font-mono uppercase tracking-[0.22em] text-white/45">
              ▸ {done ? 'STATUS · LIVE' : 'AKTUELL · 4 OFFENE PLÄTZE'}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
