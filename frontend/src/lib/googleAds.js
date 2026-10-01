/**
 * Google Ads Tag (gtag.js) für die React-Routen · Consent Mode v2.
 *
 * Die statischen Seiten (/wladbot, /app, /os) haben ihren eigenen Tag in
 * public/js/consent-gtag.js. Hier dasselbe Verhalten für /webinar,
 * /webinar/danke, /kommunikation usw.:
 *
 *   1. Sobald REACT_APP_GOOGLE_ADS_ID gesetzt ist, wird gtag.js geladen,
 *      mit consent default = denied (Advanced Consent Mode: cookieless
 *      Pings, Google modelliert fehlende Conversions).
 *   2. Bei Marketing-Consent (lo_consent_v1.marketing) → consent update =
 *      granted. Rücknahme → wieder denied.
 *   3. SPA-Pageviews werden pro Route gemeldet (trackAdPageView), damit die
 *      Pageview-Conversion „webinar_signup“ auf /webinar/danke zählt.
 *   4. Optional ein explizites Conversion-Event mit Label (Env).
 *
 * Ohne ID: nichts wird geladen.
 */
import { readConsent } from './consent';
import { GOOGLE_ADS_ID, GOOGLE_ADS_CONFIGURED, GOOGLE_ADS_WEBINAR_LABEL } from './adConfig';

let loaded = false;
let lastPath = null;

const gtag = (...args) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
};

const consentUpdate = (granted) => {
  const v = granted ? 'granted' : 'denied';
  gtag('consent', 'update', { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v });
};

export const isGoogleAdsActive = () => GOOGLE_ADS_CONFIGURED && loaded;

/** Idempotent. Lädt den Tag einmal, setzt Consent nach aktuellem Stand. */
export const maybeInitGoogleAds = () => {
  if (!GOOGLE_ADS_CONFIGURED || typeof window === 'undefined') return;
  const granted = Boolean(readConsent()?.marketing);
  if (loaded) { consentUpdate(granted); return; }
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
    wait_for_update: 500,
  });
  if (granted) consentUpdate(true);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ADS_ID)}`;
  document.head.appendChild(s);
  gtag('js', new Date());
  gtag('config', GOOGLE_ADS_ID, { send_page_view: false });
  // Der erste Pageview kommt aus App.js (trackGoogleAdsPageView), nicht doppelt.
};

/** SPA-Routenwechsel als Pageview melden (App.js). */
export const trackGoogleAdsPageView = (path) => {
  if (!isGoogleAdsActive() || path === lastPath) return false;
  lastPath = path;
  gtag('event', 'page_view', { send_to: GOOGLE_ADS_ID, page_path: path });
  return true;
};

/** Explizite Conversion (nur wenn ein Label konfiguriert ist). */
export const trackGoogleAdsWebinarConversion = (transactionId) => {
  if (!isGoogleAdsActive() || !GOOGLE_ADS_WEBINAR_LABEL) return false;
  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_WEBINAR_LABEL}`,
    value: 8.0,
    currency: 'EUR',
    transaction_id: transactionId || undefined,
  });
  return true;
};
