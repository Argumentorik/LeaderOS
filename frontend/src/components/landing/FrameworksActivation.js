import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WEBINAR_DATE_LABEL, WEBINAR_TIME_LABEL } from '../../data/webinarEvent';

const FADE_UP = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

/**
 * FrameworksActivation · die Conversion-Sektion unter dem Frameworks-Hero.
 *
 * /frameworks war bisher eine reine Ads-Landing ohne eigenen Abschluss —
 * der einzige Ausgang war ein Textlink zum Webinar. Das hier gibt der
 * Seite ihr eigenes Ziel: einen persönlichen Zugangscode reservieren
 * (LOS-XXXX-XXXX, gleiche Chrome-Plate-Sprache wie components/landing/
 * LicenseKeySection.js, aber für den individuellen 14-Tage-Trial statt
 * Team-Lizenz). Wer zusätzlich beim Live-Webinar mitmacht, bekommt eine
 * echte Anmeldung (backend/routes/license_activation.py registriert das
 * in derselben db.webinar_leads-Collection wie /webinar selbst — keine
 * erfundene Zusatzleistung).
 *
 * Sobald ein echter Account existiert, endet die 5-Mail-Serie automatisch
 * (backend „converted"-Gate) — genau der Punkt, an dem diese Seite ihren
 * Job erledigt hat.
 */
export const FrameworksActivation = () => {
  const [form, setForm] = useState({ name: '', email: '', joinWebinar: true });
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null); // { reserved_code, webinar_registered }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim());

  const track = (event, props = {}) => {
    if (typeof window !== 'undefined' && window.posthog?.capture) {
      try { window.posthog.capture(event, { surface: 'leader-os', funnel: 'frameworks-license', ...props }); } catch {}
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || state === 'loading') return;
    setState('loading');
    track('license_activate_submit', { join_webinar: form.joinWebinar });
    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          name: form.name.trim(),
          source: 'frameworks',
          join_webinar: form.joinWebinar,
          referrer: typeof document !== 'undefined' ? document.referrer : '',
          landing_path: '/frameworks',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'activation_failed');
      setResult(data);
      setState('done');
      track('license_activate_result', { ok: true, webinar_registered: data.webinar_registered });
    } catch {
      setState('error');
      track('license_activate_result', { ok: false });
    }
  };

  return (
    <section
      id="lizenz-aktivieren"
      aria-label="Persönlichen Zugangscode aktivieren"
      data-testid="frameworks-activation-section"
      className="relative w-full bg-[#0A0A0A] text-white overflow-hidden border-t-2 border-black"
    >
      <style>{`
        .fa-chrome-frame{position:relative;overflow:hidden;padding:2px;background:linear-gradient(135deg,#f0f0f0 0%,#7d7d7d 20%,#fafafa 38%,#5f5f5f 55%,#d9d9d9 72%,#8a8a8a 88%,#f0f0f0 100%);box-shadow:0 0 0 1px rgba(0,0,0,.65),0 22px 60px -20px rgba(191,255,0,.25);}
        .fa-sheen{position:absolute;top:-40%;bottom:-40%;width:36%;transform:skewX(-18deg) translateX(-230%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);animation:faSheen 5s ease-in-out infinite;pointer-events:none;z-index:1;}
        @keyframes faSheen{0%,55%{transform:skewX(-18deg) translateX(-230%)}88%,100%{transform:skewX(-18deg) translateX(430%)}}
        .fa-chrome-text{background:linear-gradient(180deg,#ffffff 0%,#d9d9d9 26%,#8f8f8f 47%,#f2f4f4 52%,#7f7f7f 68%,#e9e9e9 100%);-webkit-background-clip:text;background-clip:text;color:transparent;}
        @media (prefers-reduced-motion:reduce){.fa-sheen{animation:none}}
      `}</style>

      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{ backgroundImage: 'radial-gradient(at 14% 10%, rgba(191,255,0,0.10) 0px, transparent 50%), radial-gradient(at 90% 92%, rgba(191,255,0,0.05) 0px, transparent 55%)' }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28 grid md:grid-cols-12 gap-10 md:gap-14 items-center">
        {/* Copy */}
        <div className="md:col-span-6 order-2 md:order-1">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-5">
            ▸ ZUGANGSCODE · 14 TAGE TRIAL
          </p>
          <h2
            className="text-[36px] sm:text-[50px] md:text-[58px] leading-[0.96] tracking-[-0.04em] text-white"
            style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Reserviere<br />
            <span className="text-white/55">deinen Code</span><span className="text-brand not-italic">.</span>
          </h2>
          <p className="mt-6 max-w-xl text-[15px] md:text-[16.5px] leading-[1.6] text-white/72">
            Ein persönlicher Zugangscode für LeaderOS — 14 Tage, alle acht Frameworks,
            WladBot inklusive. Melde dich zusätzlich fürs Live-Webinar an und dein Code
            wird direkt mit dem Webinar-Zugang verknüpft.
          </p>

          <ul className="mt-8 space-y-3 max-w-xl">
            {[
              ['CODE', 'Persönlicher LOS-Code · reserviert auf deine E-Mail, läuft nicht ab'],
              ['TRIAL', '14 Tage voller Zugriff · alle acht Frameworks + WladBot'],
              ['LIVE', `Webinar am ${WEBINAR_DATE_LABEL} · ${WEBINAR_TIME_LABEL} · optional dazu buchen`],
            ].map(([tag, line], i) => (
              <motion.li
                key={tag}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.6 }}
                custom={i}
                variants={FADE_UP}
                className="flex items-start gap-3.5"
              >
                <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-brand border border-brand/40 px-2 py-1 mt-0.5 w-[52px] text-center">
                  {tag}
                </span>
                <span className="text-[14px] leading-[1.5] text-white/78">{line}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Chrome plate + form */}
        <motion.div
          className="md:col-span-6 order-1 md:order-2"
          initial={{ opacity: 0, y: 30, rotateX: -6, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformPerspective: 1000 }}
        >
          <div className="fa-chrome-frame" data-testid="activation-plate">
            <span className="fa-sheen" aria-hidden />
            <div className="relative bg-[#0C0C0C] p-6 sm:p-8">
              {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos) => (
                <span key={pos} aria-hidden className={`absolute ${pos} w-2.5 h-2.5 rounded-full border border-white/25 bg-[#0A0A0A]`} />
              ))}

              {state === 'done' ? (
                <div className="text-center py-2" data-testid="activation-success">
                  <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.26em] text-brand mb-4">
                    ▸ CODE RESERVIERT
                  </p>
                  <div className="fa-chrome-text text-[30px] sm:text-[38px] leading-none tracking-[0.04em] font-mono font-black">
                    {result?.reserved_code}
                  </div>
                  <p className="mt-3 inline-flex items-center gap-2 text-[12.5px] font-bold text-brand">
                    <Check size={15} /> Check deine Mails — der Aktivierungslink ist unterwegs.
                  </p>
                  {result?.webinar_registered ? (
                    <p className="mt-4 text-[13.5px] leading-[1.5] text-white/72">
                      Du bist außerdem für das Live-Webinar am{' '}
                      <span className="text-white font-bold">{WEBINAR_DATE_LABEL}</span> angemeldet.
                    </p>
                  ) : (
                    <p className="mt-4 text-[13.5px] leading-[1.5] text-white/72">
                      Willst du dazu auch live dabei sein?{' '}
                      <Link to="/webinar" className="text-brand font-bold underline underline-offset-4">
                        Zum Webinar anmelden
                      </Link>
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-white/45 mb-3">
                      ▸ LEADEROS · PERSÖNLICHER ZUGANGSCODE
                    </p>
                    <div className="fa-chrome-text text-[26px] sm:text-[34px] leading-none tracking-[0.08em] font-mono font-black select-none" aria-hidden>
                      LOS-••••-••••
                    </div>
                  </div>

                  <form onSubmit={submit} noValidate data-testid="activation-form" className="grid grid-cols-1 gap-3">
                    <input
                      type="text" value={form.name} onChange={set('name')}
                      placeholder="Dein Name (optional)" aria-label="Name" autoComplete="name"
                      className="h-12 px-4 bg-white/[0.05] border-2 border-white/20 focus:border-brand outline-none text-white text-[14px] placeholder:text-white/35 transition-colors"
                    />
                    <input
                      type="email" value={form.email} onChange={set('email')} required
                      placeholder="deine.email@firma.de" aria-label="E-Mail" autoComplete="email" inputMode="email"
                      className="h-12 px-4 bg-white/[0.05] border-2 border-white/20 focus:border-brand outline-none text-white text-[14px] placeholder:text-white/35 transition-colors"
                    />
                    <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                      <input
                        type="checkbox"
                        checked={form.joinWebinar}
                        onChange={(e) => setForm((f) => ({ ...f, joinWebinar: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand cursor-pointer"
                      />
                      <span className="text-[12.5px] leading-[1.5] text-white/75">
                        Ich will zusätzlich beim Live-Webinar am {WEBINAR_DATE_LABEL} dabei sein.
                      </span>
                    </label>
                    <button
                      type="submit"
                      disabled={!valid || state === 'loading'}
                      data-testid="activation-submit"
                      className="mt-1 h-13 py-3.5 bg-brand hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-[#0A0A0A] font-black text-[12.5px] uppercase tracking-[0.12em] transition-colors inline-flex items-center justify-center gap-2"
                    >
                      {state === 'loading' ? 'Wird reserviert…' : 'Code aktivieren'}
                      {state !== 'loading' && <ArrowUpRight size={16} />}
                    </button>
                  </form>
                  {state === 'error' && (
                    <p className="mt-3 text-[12.5px] font-semibold text-red-400 text-center">
                      Das hat nicht geklappt — versuch es gleich nochmal oder schreib an start@aiporate.com.
                    </p>
                  )}
                  <p className="mt-4 text-center font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                    KOSTENLOS · KEINE ZAHLUNGSDATEN · 14 TAGE
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FrameworksActivation;
