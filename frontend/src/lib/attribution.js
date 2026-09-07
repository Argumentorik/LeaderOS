/**
 * Security note: localStorage holds NO auth material (sessions are httpOnly cookies) — only non-sensitive
 * campaign parameters (utm_*, click IDs, referrer, landing path); an XSS reader gains nothing exploitable beyond what the page already shows.
 * Ad/campaign attribution capture (Iter 120 · Ads-Launch readiness).
 *
 * On every page load we capture utm_* params, click IDs (gclid/fbclid/…),
 * referrer and landing page. FIRST touch is never overwritten (true source),
 * LAST touch updates whenever new campaign params arrive. Sent to the backend
 * at signup / license activation and stored on the user record.
 */
import { capture } from './analytics';

const KEY = 'wladbot_attribution_v1';
const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'ttclid', 'msclkid', 'li_fat_id', 'via', 'ref'];

export const captureAttribution = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    FIELDS.forEach((f) => {
      const v = params.get(f);
      if (v) found[f] = String(v).slice(0, 200);
    });
    const stamp = {
      ...found,
      at: new Date().toISOString(),
      landing: (window.location.pathname + window.location.search).slice(0, 300),
      referrer: (document.referrer || '').slice(0, 300),
    };
    if (found.utm_source === 'seo') capture('seo_cta_click', { ...found, landing: stamp.landing, referrer: stamp.referrer });
    let record = null;
    try { record = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { record = null; }
    if (record?.first_touch) {
      if (Object.keys(found).length) {
        record.last_touch = stamp;
        localStorage.setItem(KEY, JSON.stringify(record));
      }
      return;
    }
    localStorage.setItem(KEY, JSON.stringify({ first_touch: stamp }));
  } catch { /* private mode / storage blocked — attribution is best-effort */ }
};

export const getAttribution = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
};
