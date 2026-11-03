import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';

const FADE_UP = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

/**
 * LicenseKeySection · "Lizenz-Key beantragen" — the Enterprise/Team CTA.
 *
 * The visual IS the product: a machined-chrome license-key plate (serial in
 * mono, punch holes, traveling light sheen — same metal family as the funnel
 * vault). The form posts to the existing public endpoint
 * POST /api/payments/enterprise/lead (persists to db.enterprise_leads,
 * computes a seat-discount quote, notifies the team by email — the admin
 * panel already lists these leads).
 *
 * On success the plate "mints": the serial flips to the reserved application
 * code (lead_id) and the live quote (Richtwert + Team-Rabatt) appears — the
 * visitor walks away holding something, not just having sent a form.
 *
 * Dark canvas · one chrome moment · prefers-reduced-motion respected.
 */

const BENEFITS = [
  ['SEATS', 'Team-Staffel ab 10 Lizenzen · Rabatt wächst mit der Größe'],
  ['BOT', 'Custom-WladBot · auf eurer Infrastruktur, euer Kontext'],
  ['SSO', 'SSO + Audit-Logs · IT-freundlich ab Tag 1'],
  ['ROLL', 'Rollout mit Reporting · Leader-Check als Team-Diagnose'],
];

export const LicenseKeySection = () => {
  const [form, setForm] = useState({ company: '', contact_name: '', contact_email: '', seats: '' });
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null); // { lead_id, quote }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid =
    form.company.trim().length > 1 &&
    form.contact_name.trim().length > 1 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contact_email.trim()) &&
    parseInt(form.seats, 10) >= 1;

  const track = (event, props = {}) => {
    if (typeof window !== 'undefined' && window.posthog?.capture) {
      try { window.posthog.capture(event, { surface: 'leader-os', funnel: 'license-key', ...props }); } catch {}
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || state === 'loading') return;
    setState('loading');
    track('license_apply_submit', { seats: parseInt(form.seats, 10) });
    try {
      const res = await fetch('/api/payments/enterprise/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: form.company.trim(),
          contact_name: form.contact_name.trim(),
          contact_email: form.contact_email.trim(),
          seats: parseInt(form.seats, 10),
          message: 'Quelle: Lizenz-Key-Sektion · leader-os.de',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      setState('done');
      track('license_apply_result', { ok: true, seats: parseInt(form.seats, 10) });
    } catch {
      setState('error');
      track('license_apply_result', { ok: false });
    }
  };

  // Reserved application code · derived from the lead id so the plate shows
  // something real, formatted like a serial (LOS-XXXX-XXXX).
  const reservedCode = result?.lead_id
    ? `LOS-${result.lead_id.replace('lead_', '').toUpperCase().slice(0, 4)}-${result.lead_id.replace('lead_', '').toUpperCase().slice(4, 8)}`
    : null;
  const quote = result?.quote;

  return (
    <section
      id="lizenz"
      aria-label="Team-Lizenz beantragen"
      data-testid="license-key-section"
      className="relative w-full bg-[#0A0A0A] text-white overflow-hidden border-y-2 border-black"
    >
      <style>{`
        .lk-chrome-frame{position:relative;overflow:hidden;padding:2px;background:linear-gradient(135deg,#f0f0f0 0%,#7d7d7d 20%,#fafafa 38%,#5f5f5f 55%,#d9d9d9 72%,#8a8a8a 88%,#f0f0f0 100%);box-shadow:0 0 0 1px rgba(0,0,0,.65),0 22px 60px -20px rgba(191,255,0,.25);}
        .lk-sheen{position:absolute;top:-40%;bottom:-40%;width:36%;transform:skewX(-18deg) translateX(-230%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);animation:lkSheen 5s ease-in-out infinite;pointer-events:none;z-index:1;}
        @keyframes lkSheen{0%,55%{transform:skewX(-18deg) translateX(-230%)}88%,100%{transform:skewX(-18deg) translateX(430%)}}
        .lk-chrome-text{background:linear-gradient(180deg,#ffffff 0%,#d9d9d9 26%,#8f8f8f 47%,#f2f4f4 52%,#7f7f7f 68%,#e9e9e9 100%);-webkit-background-clip:text;background-clip:text;color:transparent;}
        @media (prefers-reduced-motion:reduce){.lk-sheen{animation:none}}
      `}</style>

      {/* Lime aura */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{ backgroundImage: 'radial-gradient(at 82% 15%, rgba(191,255,0,0.10) 0px, transparent 50%), radial-gradient(at 8% 95%, rgba(191,255,0,0.05) 0px, transparent 55%)' }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-10 py-20 md:py-28 grid md:grid-cols-12 gap-10 md:gap-14 items-center">
        {/* Copy + benefits */}
        <div className="md:col-span-6">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand mb-5">
            ▸ TEAM-LIZENZ · ENTERPRISE
          </p>
          <h2
            className="text-[38px] sm:text-[54px] md:text-[64px] leading-[0.94] tracking-[-0.04em] text-white"
            style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Ein Key<span className="text-brand not-italic">.</span>
            <br />
            <span className="text-white/55">Dein ganzes Team</span><span className="text-brand not-italic">.</span>
          </h2>
          <p className="mt-6 max-w-xl text-[15px] md:text-[16.5px] leading-[1.6] text-white/72">
            Ab zehn Führungskräften wird LeaderOS zur Team-Lizenz: ein Rollout, eine Diagnose-Baseline,
            ein Reporting — und WladBot mit dem Kontext eures Unternehmens. Beantrage den Key,
            wir melden uns <span className="text-white font-bold">innerhalb von 24 Stunden</span> mit eurem Angebot.
          </p>

          <ul className="mt-8 space-y-3 max-w-xl">
            {BENEFITS.map(([tag, line], i) => (
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

        {/* Chrome license-key plate + application form · scales in from a
            slight tilt on scroll-into-view, like a plate settling into place. */}
        <motion.div
          className="md:col-span-6"
          initial={{ opacity: 0, y: 30, rotateX: -6, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformPerspective: 1000 }}
        >
          <div className="lk-chrome-frame" data-testid="license-plate">
            <span className="lk-sheen" aria-hidden />
            <div className="relative bg-[#0C0C0C] p-6 sm:p-8">
              {/* Punch holes · physical plate read */}
              {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos) => (
                <span key={pos} aria-hidden className={`absolute ${pos} w-2.5 h-2.5 rounded-full border border-white/25 bg-[#0A0A0A]`} />
              ))}

              {state === 'done' ? (
                <div className="text-center py-2" data-testid="license-success">
                  <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.26em] text-brand mb-4">
                    ▸ ANTRAG EINGEGANGEN · KEY RESERVIERT
                  </p>
                  <div
                    className="lk-chrome-text text-[30px] sm:text-[38px] leading-none tracking-[0.04em] font-mono font-black"
                  >
                    {reservedCode}
                  </div>
                  {quote?.total_price ? (
                    <p className="mt-5 text-[14px] text-white/80">
                      Richtwert für euer Team:{' '}
                      <span className="text-brand font-black tabular-nums">
                        {Math.round(quote.total_price).toLocaleString('de-DE')} €
                      </span>
                      {quote.discount_pct ? (
                        <span className="text-white/55"> · {quote.discount_pct}% Team-Rabatt</span>
                      ) : null}
                    </p>
                  ) : null}
                  <p className="mt-3 inline-flex items-center gap-2 text-[12.5px] font-bold text-brand">
                    <Check size={15} /> Wir melden uns innerhalb von 24 Stunden.
                  </p>
                </div>
              ) : (
                <>
                  {/* Idle serial · the thing they are applying for */}
                  <div className="text-center mb-6">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-white/45 mb-3">
                      ▸ LEADEROS · TEAM-LIZENZ-KEY
                    </p>
                    <div className="lk-chrome-text text-[26px] sm:text-[34px] leading-none tracking-[0.08em] font-mono font-black select-none" aria-hidden>
                      LOS-••••-••••
                    </div>
                  </div>

                  <form onSubmit={submit} noValidate data-testid="license-form" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text" value={form.company} onChange={set('company')} required
                      placeholder="Firma" aria-label="Firma" autoComplete="organization"
                      className="h-12 px-4 bg-white/[0.05] border-2 border-white/20 focus:border-brand outline-none text-white text-[14px] placeholder:text-white/35 transition-colors sm:col-span-2"
                    />
                    <input
                      type="text" value={form.contact_name} onChange={set('contact_name')} required
                      placeholder="Dein Name" aria-label="Name" autoComplete="name"
                      className="h-12 px-4 bg-white/[0.05] border-2 border-white/20 focus:border-brand outline-none text-white text-[14px] placeholder:text-white/35 transition-colors"
                    />
                    <input
                      type="number" min="1" value={form.seats} onChange={set('seats')} required
                      placeholder="Teamgröße" aria-label="Teamgröße (Anzahl Führungskräfte)" inputMode="numeric"
                      className="h-12 px-4 bg-white/[0.05] border-2 border-white/20 focus:border-brand outline-none text-white text-[14px] placeholder:text-white/35 transition-colors"
                    />
                    <input
                      type="email" value={form.contact_email} onChange={set('contact_email')} required
                      placeholder="firmen.email@firma.de" aria-label="E-Mail" autoComplete="email" inputMode="email"
                      className="h-12 px-4 bg-white/[0.05] border-2 border-white/20 focus:border-brand outline-none text-white text-[14px] placeholder:text-white/35 transition-colors sm:col-span-2"
                    />
                    <button
                      type="submit"
                      disabled={!valid || state === 'loading'}
                      data-testid="license-submit"
                      className="sm:col-span-2 h-13 py-3.5 bg-brand hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-[#0A0A0A] font-black text-[12.5px] uppercase tracking-[0.12em] transition-colors inline-flex items-center justify-center gap-2"
                    >
                      {state === 'loading' ? 'Wird beantragt…' : 'Lizenz-Key beantragen'}
                      {state !== 'loading' && <ArrowUpRight size={16} />}
                    </button>
                  </form>
                  {state === 'error' && (
                    <p className="mt-3 text-[12.5px] font-semibold text-red-400 text-center">
                      Das hat nicht geklappt — versuch es gleich nochmal oder schreib an start@aiporate.com.
                    </p>
                  )}
                  <p className="mt-4 text-center font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                    ANTWORT IN 24H · UNVERBINDLICH · AB 10 SEATS
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

export default LicenseKeySection;
