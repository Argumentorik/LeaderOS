/**
 * leadCapture · one call to capture a free-video lead with full attribution.
 *
 * Used by the /gratis-videos squeeze page and the on-landing funnel section.
 * Gathers UTM + referrer + landing path automatically, persists the lead
 * server-side (durable Mongo store, best-effort Supabase mirror), identifies
 * the person in PostHog with rich properties, and flips the local opt-in flag
 * so the videos reveal instantly.
 *
 * Never throws — the funnel must continue even if the network is down.
 */
import { setFreeVideoOptIn } from '../data/freeVideos';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

export function readUtm() {
  if (typeof window === 'undefined') return {};
  try {
    const p = new URLSearchParams(window.location.search);
    const utm = {};
    for (const k of UTM_KEYS) {
      const v = p.get(k);
      if (v) utm[k.replace('utm_', '')] = v;
    }
    for (const clid of ['gclid', 'fbclid']) {
      const v = p.get(clid);
      if (v) utm[clid] = v;
    }
    return utm;
  } catch {
    return {};
  }
}

/**
 * @returns {Promise<{ok: boolean}>}
 */
export async function captureFreeVideoLead({ email, name = '', source = 'free-video-lp' }) {
  const trimmed = (email || '').trim();
  const cleanName = (name || '').trim();
  const utm = readUtm();
  const referrer = typeof document !== 'undefined' ? document.referrer || '' : '';
  const landingPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const campaign = utm.campaign || 'leader-os-4-free-videos';

  // PostHog — identify + rich person/event props (this is the "data from them").
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try {
      window.posthog.identify(trimmed.toLowerCase(), {
        email: trimmed,
        ...(cleanName ? { name: cleanName } : {}),
        ...(utm.source ? { initial_utm_source: utm.source } : {}),
      });
      window.posthog.capture('lead_captured', {
        email: trimmed,
        name: cleanName || undefined,
        source,
        campaign,
        surface: 'leader-os',
        funnel: 'free-video-series',
        referrer,
        ...utm,
      });
    } catch { /* posthog never blocks UX */ }
  }

  // Durable server-side capture (owns the lead + emails Video 1 immediately).
  let ok = false;
  try {
    const res = await fetch('/api/free-videos/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: trimmed,
        name: cleanName,
        source,
        campaign,
        utm: {
          source: utm.source || '',
          medium: utm.medium || '',
          campaign: utm.campaign || '',
          term: utm.term || '',
          content: utm.content || '',
        },
        referrer,
        landing_path: landingPath,
      }),
      keepalive: true,
    });
    ok = res.ok;
  } catch { /* swallow · funnel continues */ }

  setFreeVideoOptIn(trimmed);
  return { ok };
}
