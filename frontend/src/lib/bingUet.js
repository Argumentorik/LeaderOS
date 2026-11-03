/**
 * Microsoft Advertising UET-Tag (Bing Ads) · consent-gated, inert ohne ID.
 *
 * Lädt bat.bing.com nur bei Marketing-Consent (lo_consent_v1.marketing),
 * meldet SPA-Pageviews pro Route und ein Custom-Event „webinar_lead“ auf
 * /webinar/danke. Im Microsoft-Konto dazu ein Conversion-Ziel anlegen:
 * entweder „Ziel-URL enthält /webinar/danke“ oder Custom-Event
 * (Kategorie webinar, Aktion lead). Siehe docs/ops/ADS_TRACKING_GO_LIVE.md.
 */
import { readConsent } from './consent';
import { BING_UET_ID, BING_CONFIGURED } from './adConfig';

let loaded = false;
let lastPath = null;

export const isBingActive = () => BING_CONFIGURED && loaded;

/** Idempotent. Läuft beim Boot und bei jeder Consent-Änderung. */
export const maybeInitBingUet = () => {
  if (!BING_CONFIGURED || loaded || typeof window === 'undefined') return;
  if (!readConsent()?.marketing) return;
  loaded = true;
  window.uetq = window.uetq || [];
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://bat.bing.com/bat.js';
  s.onload = () => {
    try {
      const o = { ti: BING_UET_ID, enableAutoSpaTracking: false };
      o.q = window.uetq;
      window.uetq = new window.UET(o);
      // Pageviews, die vor dem Laden gepusht wurden (App.js), spielt UET aus
      // der Queue nach; nur ohne solche den initialen pageLoad senden.
      if (!lastPath) window.uetq.push('pageLoad');
    } catch { /* Tag-Fehler dürfen die Seite nie stören */ }
  };
  document.head.appendChild(s);
};

export const trackBingPageView = (path) => {
  if (!isBingActive() || !window.uetq || path === lastPath) return false;
  lastPath = path;
  try {
    window.uetq.push('event', 'page_view', { page_path: path });
    return true;
  } catch { return false; }
};

export const trackBingWebinarLead = () => {
  if (!isBingActive() || !window.uetq) return false;
  try {
    window.uetq.push('event', 'webinar_lead', { event_category: 'webinar', event_label: 'webinar-2026-11-26', revenue_value: 8, currency: 'EUR' });
    return true;
  } catch { return false; }
};
