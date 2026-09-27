/**
 * PostHog identity helpers · canonical `user_id` from MongoDB is the
 * distinct_id; email is attached as a person property. This decouples
 * analytics identity from email changes and OAuth provider drift.
 *
 * Architecture: MongoDB `user.user_id` is the system-wide source of truth.
 * Backend mirrors it to Supabase as `mongo_user_id`. Frontend telemetry
 * (PostHog + Sentry) MUST use the same id to keep funnels stable across
 * email changes, account merges, and OAuth provider linking.
 *
 * PostHog is loaded as an inline snippet in public/index.html, so `window.posthog`
 * is available globally. These helpers are defensive: they no-op if PostHog
 * isn't loaded (e.g. local dev, ad-blocked).
 */

function getPosthog() {
  if (typeof window === 'undefined') return null;
  const ph = window.posthog;
  // Das Snippet setzt __SV sofort, die Methoden (capture, identify, alias …)
  // entstehen aber erst mit posthog.init(). Ohne Consent („Nur notwendige")
  // läuft init nie: dann war ph.capture undefined und warf — die Seite fiel
  // in die Error-Boundary. Nur ein initialisiertes PostHog zählt.
  return ph && ph.__SV && typeof ph.capture === 'function' && typeof ph.identify === 'function' ? ph : null;
}

/**
 * Identify the current user in PostHog using the canonical MongoDB user_id.
 * Email + name are sent as person properties (searchable but not the primary key).
 */
export function identifyByUser(user) {
  const ph = getPosthog();
  if (!ph || !user) return;
  const userId = user.user_id || user.id;
  if (!userId) {
    // Defensive: if a caller forgot user_id, skip rather than fall back to email
    // as distinct_id (which would re-introduce identity drift).
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[analytics] identifyByUser called without user_id · skipping');
    }
    return;
  }
  const email = String(user.email || '').trim().toLowerCase();
  // `alias` merges the prior anonymous distinct_id into this person, so funnel
  // events captured before login still belong to the same PostHog person.
  ph.alias(userId);
  ph.identify(userId, {
    email: email || undefined,
    name: user.name || undefined,
    tier: user.premium_package || (user.premium ? 'paid' : 'free'),
  });
}

/** @deprecated · use identifyByUser(user). Kept for transitional safety. */
export function identifyByEmail(email) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[analytics] identifyByEmail is deprecated · use identifyByUser(user)');
  }
  const ph = getPosthog();
  if (!ph || !email) return;
  const emailLower = String(email).trim().toLowerCase();
  if (!emailLower) return;
  ph.alias(emailLower);
  ph.identify(emailLower, { email: emailLower });
}

export function resetIdentity() {
  const ph = getPosthog();
  if (ph) ph.reset();
}

export function capture(event, props) {
  const ph = getPosthog();
  if (ph) ph.capture(event, props);
}
