/**
 * Cookie & Tracking Consent · GDPR-compliant banner.
 *
 * Persisted in localStorage under key `lo_consent_v1`. Bump the suffix when
 * the catalog of trackers changes so old consent is re-prompted.
 *
 * Three options:
 *   - Accept all   → essential + analytics + session-replay + marketing
 *   - Essential only → only Sentry error tracking (legitimate interest,
 *     Art. 6(1)(f) · no PII, no replay, no PostHog, no ad pixels)
 *   - Customize    → granular toggles
 *
 * `marketing` (added 2026-09) gates the ad tags: Meta Pixel, LinkedIn Insight,
 * Google Ads (Consent Mode v2) and Microsoft UET (lib/adConfig.js). It
 * is listed even while the pixel ID is still a placeholder, so consent
 * collected today already covers the pixel once it goes live.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { readConsent, writeConsent, CONSENT_DEFAULTS } from '../../lib/consent';
import { Cookie } from 'lucide-react';

export const CookieConsent = () => {
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [show, setShow] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [opts, setOpts] = useState({
    essential: true,
    analytics: CONSENT_DEFAULTS.analytics,
    replays: CONSENT_DEFAULTS.replays,
    marketing: CONSENT_DEFAULTS.marketing,
  });

  useEffect(() => {
    if (!readConsent()) setShow(true);
  }, []);

  if (!show) return null;

  const acceptAll = () => {
    writeConsent({ analytics: true, replays: true, marketing: true });
    setShow(false);
  };
  const essentialOnly = () => {
    writeConsent({ analytics: false, replays: false, marketing: false });
    setShow(false);
  };
  const saveCustom = () => {
    writeConsent({ analytics: opts.analytics, replays: opts.replays, marketing: opts.marketing });
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-2.5 sm:p-6 pointer-events-none" data-testid="cookie-consent-banner">
      <div className="mx-auto max-w-3xl pointer-events-auto rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#BFFF00] flex items-center justify-center shrink-0"><Cookie size={19} className="text-[#0A0A0A]" /></div>
            <div>
              <h3 className="text-white font-black text-[15px] sm:text-base mb-0.5 sm:mb-1">
                {de ? 'Datenschutz & Cookies' : 'Privacy & Cookies'}
              </h3>
              <p className="text-white/70 text-[12px] leading-snug sm:leading-relaxed">
                {de
                  ? 'Wir nutzen technisch notwendige Cookies für deinen Login. Optional helfen uns Analyse-Tools, die App besser zu machen, und Marketing-Pixel zeigen uns, welche Anzeige dich hergebracht hat. Du entscheidest.'
                  : 'We use strictly necessary cookies for your login. Optional analytics tools help us improve, and marketing pixels tell us which ad brought you here. Your choice.'}
                {' '}
                <a href="/datenschutz" className="text-[#BFFF00] underline hover:no-underline">{de ? 'Datenschutzerklärung' : 'Privacy policy'}</a>
              </p>
            </div>
          </div>

          {customizing && (
            <div className="space-y-2 mb-4 bg-white/[0.03] rounded-xl p-3" data-testid="consent-customize-panel">
              {[
                { k: 'essential', t_de: 'Technisch notwendig', t_en: 'Strictly necessary', desc_de: 'Login, Session · kann nicht deaktiviert werden', desc_en: 'Login, session · cannot be disabled', locked: true },
                { k: 'analytics', t_de: 'Analyse (PostHog)', t_en: 'Analytics (PostHog)', desc_de: 'Anonyme Nutzungs-Statistiken', desc_en: 'Anonymous usage stats' },
                { k: 'replays', t_de: 'Session-Replay (Sentry)', t_en: 'Session replay (Sentry)', desc_de: 'Für gezielte Fehler-Reproduktion', desc_en: 'For targeted bug repro' },
                { k: 'marketing', t_de: 'Marketing (Meta, Google Ads, LinkedIn, Microsoft)', t_en: 'Marketing (Meta, Google Ads, LinkedIn, Microsoft)', desc_de: 'Misst, welche Anzeige dich hergebracht hat', desc_en: 'Measures which ad brought you here' },
              ].map(({ k, t_de, t_en, desc_de, desc_en, locked }) => (
                <label key={k} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opts[k]}
                    disabled={locked}
                    onChange={(e) => setOpts(prev => ({ ...prev, [k]: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-[#BFFF00]"
                    data-testid={`consent-toggle-${k}`}
                  />
                  <div className="flex-1">
                    <p className="text-white text-[12px] font-bold leading-tight">{de ? t_de : t_en}</p>
                    <p className="text-white/50 text-[10px] leading-tight">{de ? desc_de : desc_en}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {!customizing ? (
              <>
                <button onClick={acceptAll} className="sm:flex-1 sm:min-w-[120px] px-1 sm:px-0 py-3 sm:py-2.5 whitespace-nowrap rounded-xl bg-[#BFFF00] text-[#0A0A0A] text-[11.5px] sm:text-[12px] font-black hover:brightness-110 transition" data-testid="consent-accept-all">
                  {de ? 'Alle akzeptieren' : 'Accept all'}
                </button>
                <button onClick={essentialOnly} className="sm:flex-1 sm:min-w-[120px] px-1 sm:px-0 py-3 sm:py-2.5 whitespace-nowrap rounded-xl bg-white/10 text-white text-[11.5px] sm:text-[12px] font-bold hover:bg-white/20 transition" data-testid="consent-essential-only">
                  {de ? 'Nur notwendige' : 'Essential only'}
                </button>
                <button onClick={() => setCustomizing(true)} className="sm:flex-1 sm:min-w-[100px] px-1 sm:px-0 py-3 sm:py-2.5 whitespace-nowrap rounded-xl border border-white/20 text-white text-[11.5px] sm:text-[12px] font-bold hover:bg-white/5 transition" data-testid="consent-customize">
                  {de ? 'Anpassen' : 'Customize'}
                </button>
              </>
            ) : (
              <>
                <button onClick={saveCustom} className="flex-1 py-2.5 rounded-xl bg-[#BFFF00] text-[#0A0A0A] text-[12px] font-black hover:brightness-110 transition" data-testid="consent-save-custom">
                  {de ? 'Auswahl speichern' : 'Save selection'}
                </button>
                <button onClick={() => setCustomizing(false)} className="py-2.5 px-4 rounded-xl text-white/60 text-[12px] hover:text-white transition" data-testid="consent-back">
                  {de ? 'Zurück' : 'Back'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
