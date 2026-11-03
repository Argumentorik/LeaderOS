/**
 * Meta-Pixel (Facebook / Instagram Ads) · consent-gated, inert bis Pixel-ID.
 *
 * ───────────────────────────────────────────────────────────────────
 * SCHARFSCHALTEN: Vercel-Env REACT_APP_META_PIXEL_ID setzen (15–16 Ziffern,
 * Events Manager → Datenquellen → Pixel) und neu deployen. Ohne Variable
 * wird KEIN Skript geladen und kein Event gesendet.
 * Siehe docs/ops/ADS_TRACKING_GO_LIVE.md.
 * ───────────────────────────────────────────────────────────────────
 *
 * Regeln:
 *   - Lädt fbevents.js NUR, wenn `lo_consent_v1.marketing === true`
 *     (Kategorie „Marketing" im CookieConsent-Banner). Kein <noscript>-
 *     Bild, kein Laden vor der Entscheidung.
 *   - Jedes Lead-Event bekommt eine event_id, die der Browser an
 *     /api/webinar/register mitschickt. Der Server sendet dasselbe Event
 *     über die Conversions API mit derselben ID → Meta dedupliziert.
 *     Ohne die Server-Seite fehlen auf iOS rund 30–40 % der Leads.
 *   - Kein PII in den Parametern. Die E-Mail geht nur gehasht über
 *     die Conversions API, nie über den Browser-Pixel.
 */
import { readConsent } from './consent';
import { META_PIXEL_ID, META_CONFIGURED as CONFIGURED } from './adConfig';

export { META_PIXEL_ID };

let loaded = false;

export const isMetaPixelActive = () => CONFIGURED && loaded;

/** Idempotent. Läuft beim Boot und bei jeder Consent-Änderung. */
export const maybeInitMetaPixel = () => {
  if (!CONFIGURED || loaded || typeof window === 'undefined') return;
  if (!readConsent()?.marketing) return;
  loaded = true;

  // Offizielles Basis-Snippet, ohne das <noscript>-Tracking-Bild.
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = true; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
};

/** Eindeutige ID für Browser-/Server-Deduplizierung (Meta: event_id). */
export const metaEventId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* fall through */ }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Standard-Event senden. Gibt true zurück, wenn der Pixel aktiv war.
 * Beispiele: trackMeta('ViewContent', { content_name: 'webinar' })
 *            trackMeta('Lead', { content_name: 'webinar' }, eventId)
 */
export const trackMeta = (event, params = {}, eventID) => {
  if (!isMetaPixelActive() || typeof window.fbq !== 'function') return false;
  try {
    if (eventID) window.fbq('track', event, params, { eventID });
    else window.fbq('track', event, params);
    return true;
  } catch {
    return false;
  }
};
