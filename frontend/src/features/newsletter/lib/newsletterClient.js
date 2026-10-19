/**
 * newsletterClient · thin wrapper over the double-opt-in subscribe endpoint.
 *
 * Posts same-origin to `/api/newsletter/subscribe`, which Vercel rewrites
 * to the Supabase Edge Function `newsletter-subscribe` (see vercel.json).
 * No Supabase anon key ships in the bundle · the rewrite + verify_jwt=false
 * keep the client dumb and keyless.
 *
 * The endpoint is intentionally non-committal: it returns `{ ok: true }`
 * whether the address is new, already pending, or already confirmed, so
 * we never leak list membership. The UI therefore always shows the same
 * "check your inbox" success state.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const isValidEmail = (value) =>
  typeof value === 'string' && EMAIL_RE.test(value.trim());

/**
 * @param {Object} args
 * @param {string} args.email     · raw email input
 * @param {string} args.source    · capture surface, e.g. 'footer' | 'journal' | 'article'
 * @param {string} [args.campaign]· optional campaign tag, e.g. 'field-notes'
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function subscribe({ email, source, campaign }) {
  const trimmed = (email || '').trim();
  if (!isValidEmail(trimmed)) {
    return { ok: false, error: 'invalid_email' };
  }

  try {
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: trimmed,
        source: source || 'unknown',
        campaign: campaign || null,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      }),
    });

    if (!res.ok) {
      // 400 invalid_email is the only client-actionable case; everything
      // else is a soft failure we don't want to surface loudly.
      let code = 'request_failed';
      try {
        const body = await res.json();
        code = body?.error || code;
      } catch {
        /* ignore parse errors */
      }
      return { ok: false, error: code };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'network_error' };
  }
}
