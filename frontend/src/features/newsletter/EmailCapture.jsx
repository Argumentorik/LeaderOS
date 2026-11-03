import { useState } from 'react';
import { subscribe, isValidEmail } from './lib/newsletterClient';

/**
 * EmailCapture · the one reusable newsletter opt-in across every surface.
 *
 * Every signup is attributed via `source` (+ optional `campaign`), so the
 * same component drops into the footer, a journal article, a guide, a
 * lead-magnet page, etc., and the data tells you where it converted:
 *
 *   <EmailCapture source="footer" />
 *   <EmailCapture source="journal" campaign="field-notes" tone="light" />
 *   <EmailCapture source="article" campaign="why-coaches-stall" variant="stacked" />
 *
 * Double-opt-in: a successful submit only triggers a confirmation email.
 * The success copy reflects that ("check your inbox"), never "you're in".
 *
 * Props:
 *   source    (string, required) · capture surface for attribution
 *   campaign  (string)           · optional campaign tag
 *   tone      ('dark'|'light')   · surface contrast. default 'dark'
 *   variant   ('inline'|'stacked') · layout. default 'inline'
 *   title     (string)           · eyebrow/heading override
 *   blurb     (string)           · supporting line override
 *   compact   (bool)             · drop the heading, just the field (footer)
 */
export const EmailCapture = ({
  source,
  campaign = null,
  tone = 'dark',
  variant = 'inline',
  title = 'Klartext',
  blurb = 'Wlads Notizen aus 400 000 Coachings. Alle paar Wochen. Kein Spam.',
  compact = false,
}) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const dark = tone === 'dark';

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    setError('');
    setSubmitting(true);

    // PostHog · same identity key (email_lower) as the rest of the funnel.
    if (typeof window !== 'undefined' && window.posthog?.capture) {
      try {
        window.posthog.identify(trimmed.toLowerCase());
        window.posthog.capture('newsletter_signup', {
          source: source || 'unknown',
          campaign: campaign || null,
          surface: 'leader-os',
        });
      } catch {
        /* never block UX */
      }
    }

    const result = await subscribe({ email: trimmed, source, campaign });
    setSubmitting(false);

    if (result.ok && typeof window !== 'undefined') {
      // Notify the rest of the page that a newsletter signup just landed
      // so cross-surface listeners (LeadCaptureModal cooldown, exit-intent
      // suppressor) can react without polling.
      try {
        window.dispatchEvent(
          new CustomEvent('newsletter:subscribed', { detail: { email: trimmed } }),
        );
      } catch { /* old browsers · fine to swallow */ }
    }

    if (!result.ok) {
      if (result.error === 'invalid_email') {
        setError('Bitte gib eine gültige E-Mail-Adresse ein.');
        return;
      }
      // network_error and request_failed mean the request never reached
      // the backend. Telling the user "check your inbox" in that case
      // would be a lie. Surface a retry instead.
      if (result.error === 'network_error' || result.error === 'request_failed') {
        setError('Verbindung wackelt. Bitte nochmal versuchen.');
        return;
      }
      // Any other server-side error: fall through to the success state.
      // Per the engine design, the endpoint is non-committal about
      // existing addresses (no list-membership leak), so an opaque 5xx
      // could mean "already on the list and a downstream noop failed";
      // we mustn't strand a real subscriber on an error screen.
    }

    // Broadcast so any other lead-capture surface on the page (the
    // exit-intent modal in particular) can back off for the rest of
    // the cooldown window.
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('newsletter:subscribed', {
            detail: { source: source || 'unknown', campaign: campaign || null },
          }),
        );
      } catch {
        /* CustomEvent not supported in this env; ignore */
      }
    }
    setDone(true);
  };

  // ── tokens per tone ──────────────────────────────────────────────────
  const t = dark
    ? {
        eyebrow: 'text-brand',
        heading: 'text-white',
        blurb: 'text-white/55',
        inputBg: 'bg-black border-white/20 text-white placeholder-white/30 focus:border-brand',
        note: 'text-white/40',
        doneHead: 'text-brand',
        doneTitle: 'text-white',
        doneBody: 'text-white/60',
      }
    : {
        eyebrow: 'text-brand-strong',
        heading: 'text-black',
        blurb: 'text-black/60',
        inputBg: 'bg-white border-black/15 text-black placeholder-black/30 focus:border-brand-strong',
        note: 'text-black/45',
        doneHead: 'text-brand-strong',
        doneTitle: 'text-black',
        doneBody: 'text-black/60',
      };

  if (done) {
    return (
      <div data-testid="email-capture-done" data-source={source}>
        <p className={`text-[10.5px] font-bold uppercase tracking-[0.28em] font-mono mb-3 ${t.doneHead}`}>
          ▸ FAST GESCHAFFT
        </p>
        <p className={`text-[18px] font-bold leading-[1.3] ${t.doneTitle}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
          Schau in dein Postfach.
        </p>
        <p className={`mt-2 text-[13.5px] leading-[1.55] ${t.doneBody}`}>
          Wir haben dir einen Bestätigungs-Link geschickt. Ein Klick und
          du bist dabei · ohne Bestätigung passiert nichts.
        </p>
      </div>
    );
  }

  const stacked = variant === 'stacked';

  return (
    <form onSubmit={onSubmit} data-testid="email-capture" data-source={source} className="w-full">
      {!compact && (
        <>
          <p className={`text-[10.5px] font-bold uppercase tracking-[0.28em] font-mono mb-3 ${t.eyebrow}`}>
            ▸ {title}
          </p>
          {blurb && (
            <p className={`text-[14px] leading-[1.5] mb-4 max-w-md ${t.blurb}`}>{blurb}</p>
          )}
        </>
      )}

      <div className={stacked ? 'space-y-3' : 'flex flex-col sm:flex-row gap-3'}>
        <label className="sr-only" htmlFor={`email-capture-${source}`}>
          E-Mail-Adresse
        </label>
        <input
          id={`email-capture-${source}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="dein.name@firma.de"
          autoComplete="email"
          data-testid="email-capture-input"
          className={`h-12 flex-1 border-2 px-3.5 text-[14px] font-mono outline-none rounded-xl transition-all focus:ring-4 focus:ring-brand/15 ${t.inputBg}`}
        />
        <button
          type="submit"
          disabled={submitting}
          data-testid="email-capture-submit"
          className="h-12 shrink-0 bg-brand hover:brightness-105 active:scale-[0.98] text-black text-[12px] font-black uppercase tracking-[0.18em] rounded-xl px-6 transition-all disabled:opacity-60 shadow-[0_10px_28px_-10px_rgba(191,255,0,0.5)]"
        >
          {submitting ? '…' : '+  Abonnieren'}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-[12px] text-red-400 font-medium">
          {error}
        </p>
      )}

      <p className={`mt-3 text-[11px] leading-[1.5] ${t.note}`}>
        Double-Opt-In · jederzeit abbestellbar · DSGVO-konform.
      </p>
    </form>
  );
};

export default EmailCapture;
