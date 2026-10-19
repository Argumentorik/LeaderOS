/**
 * adConfig · alle Ad-Plattform-IDs an einer Stelle, aus Vercel-Env-Variablen.
 *
 * CRA bettet REACT_APP_* beim Build ein. IDs eintragen → Vercel-Redeploy →
 * Tracking live, ohne Code-Änderung. Ohne gesetzte Variable bleibt der
 * jeweilige Tag komplett inert (kein Skript, kein Event, kein Cookie).
 *
 * Variable                              Woher
 * REACT_APP_META_PIXEL_ID               Meta Events Manager → Datenquellen → Pixel (15–16 Ziffern)
 * REACT_APP_LINKEDIN_PARTNER_ID         Campaign Manager → Analysieren → Insight Tag (6–10 Ziffern)
 * REACT_APP_LINKEDIN_LEAD_CONVERSION_ID Campaign Manager → Conversions → „Webinar-Lead“ (6–10 Ziffern)
 * REACT_APP_GOOGLE_ADS_ID               Google Ads → Tools → Datenmanager → Google-Tag (AW-XXXXXXXXXX)
 * REACT_APP_GOOGLE_ADS_WEBINAR_LABEL    Conversion „webinar_signup“ → Tag einrichten → Label (optional;
 *                                       ohne Label zählt Google über den Pageview /webinar/danke)
 * REACT_APP_BING_UET_ID                 Microsoft Advertising → Tools → UET-Tag (Tag-ID, Ziffern)
 *
 * Siehe docs/ops/ADS_TRACKING_GO_LIVE.md.
 */

// Wörtliche process.env.REACT_APP_*-Zugriffe: nur die ersetzt CRA beim Build.
const clean = (v) => (v ? String(v).trim() : '');

export const META_PIXEL_ID = clean(process.env.REACT_APP_META_PIXEL_ID);
export const LINKEDIN_PARTNER_ID = clean(process.env.REACT_APP_LINKEDIN_PARTNER_ID);
export const LINKEDIN_LEAD_CONVERSION_ID = clean(process.env.REACT_APP_LINKEDIN_LEAD_CONVERSION_ID);
export const GOOGLE_ADS_ID = clean(process.env.REACT_APP_GOOGLE_ADS_ID);
export const GOOGLE_ADS_WEBINAR_LABEL = clean(process.env.REACT_APP_GOOGLE_ADS_WEBINAR_LABEL);
export const BING_UET_ID = clean(process.env.REACT_APP_BING_UET_ID);

export const META_CONFIGURED = /^\d{15,16}$/.test(META_PIXEL_ID);
export const LINKEDIN_CONFIGURED = /^\d{6,10}$/.test(LINKEDIN_PARTNER_ID);
export const GOOGLE_ADS_CONFIGURED = /^AW-\d{9,12}$/.test(GOOGLE_ADS_ID);
export const BING_CONFIGURED = /^\d{6,12}$/.test(BING_UET_ID);

/** Für /api/health-artige Checks und die Konsole: welche Tags sind scharf. */
export const adTrackingStatus = () => ({
  meta: META_CONFIGURED,
  linkedin: LINKEDIN_CONFIGURED,
  linkedinConversion: /^\d{6,10}$/.test(LINKEDIN_LEAD_CONVERSION_ID),
  googleAds: GOOGLE_ADS_CONFIGURED,
  googleAdsWebinarLabel: Boolean(GOOGLE_ADS_WEBINAR_LABEL),
  bing: BING_CONFIGURED,
});
