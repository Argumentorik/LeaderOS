/**
 * Provider sign-in buttons — Google (real Google Identity Services),
 * Apple (Sign In with Apple JS), Microsoft (MSAL via popup).
 *
 * Each button:
 *  • only renders if the backend reports its provider as available
 *  • shows the official brand mark + uses the official copy
 *  • posts the resulting ID token to our backend, which verifies it
 *  • on success, calls `onSuccess(user, method)` so the parent can `login()` + redirect
 *
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const AppleBrand = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const MicrosoftBrand = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#7FBA00" d="M13 1h10v10H13z" />
    <path fill="#00A4EF" d="M1 13h10v10H1z" />
    <path fill="#FFB900" d="M13 13h10v10H13z" />
  </svg>
);

const buttonClass = "group relative flex items-center justify-center gap-3 h-12 w-full rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] transition-all font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed";

// ────────────────────────────────────────────────────────────────────────────
// Google — Google Identity Services (our own OAuth client, GOOGLE_CLIENT_ID).
// Renders Google's official button; the ID token goes to
// POST /api/auth/google/callback, which verifies it and matches the user by
// email. Every origin we serve from must be an "Authorized JavaScript origin"
// on the client in Google Cloud, otherwise GIS fails with origin_mismatch.
// ────────────────────────────────────────────────────────────────────────────

let _gisScriptPromise = null;
const loadGisScript = () => {
  if (_gisScriptPromise) return _gisScriptPromise;
  _gisScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { _gisScriptPromise = null; reject(new Error('Failed to load Google Identity Services')); };
    document.head.appendChild(s);
  });
  return _gisScriptPromise;
};

export const GoogleSignInButton = ({ clientId, onSuccess, onError, de = true, label }) => {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const slot = useRef(null);
  // GIS keeps the first callback it was given; route through refs so a
  // re-render with new handlers still reaches the current ones.
  const handlers = useRef({ onSuccess, onError });
  handlers.current = { onSuccess, onError };

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;
    loadGisScript().then(() => {
      if (cancelled || !slot.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        callback: async ({ credential }) => {
          if (!credential) return;
          setLoading(true);
          try {
            const res = await api.post('/auth/google/callback', { credential });
            handlers.current.onSuccess?.(res.data.user, 'google');
          } catch (err) {
            logger.error('Google sign-in failed', err);
            handlers.current.onError?.(err?.response?.data?.detail || (de ? 'Google-Login fehlgeschlagen.' : 'Google sign-in failed.'));
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(slot.current, {
        type: 'standard',
        theme: 'filled_black',
        shape: 'pill',
        size: 'large',
        text: label ? 'signin_with' : 'continue_with',
        logo_alignment: 'center',
        locale: de ? 'de' : 'en',
        width: Math.min(400, Math.max(200, slot.current.offsetWidth || 320)),
      });
      setReady(true);
    }).catch((e) => {
      logger.warn('Google Identity Services failed to load', e);
      handlers.current.onError?.(de ? 'Google-Login konnte nicht geladen werden.' : 'Google sign-in could not load.');
    });
    return () => { cancelled = true; };
  }, [clientId, de, label]);

  if (!clientId) return null;

  return (
    <div className="relative flex justify-center min-h-[44px] w-full" data-testid="google-signin-btn">
      <div ref={slot} className="w-full flex justify-center" aria-label={label || (de ? 'Mit Google fortfahren' : 'Continue with Google')} />
      {(!ready || loading) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={16} className="animate-spin text-white/60" />
        </div>
      )}
    </div>
  );
};


// ────────────────────────────────────────────────────────────────────────────
// Apple — Sign In with Apple JS
// ────────────────────────────────────────────────────────────────────────────

let _appleScriptPromise = null;
const loadAppleScript = () => {
  if (_appleScriptPromise) return _appleScriptPromise;
  _appleScriptPromise = new Promise((resolve, reject) => {
    if (window.AppleID?.auth) return resolve();
    const s = document.createElement('script');
    s.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Apple ID JS'));
    document.head.appendChild(s);
  });
  return _appleScriptPromise;
};

export const AppleSignInButton = ({ serviceId, onSuccess, onError, de = true }) => {
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!serviceId || initialized.current) return;
    initialized.current = true;
    loadAppleScript().then(() => {
      window.AppleID?.auth?.init({
        clientId: serviceId,
        scope: 'name email',
        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        redirectURI: window.location.origin + '/auth/apple/return',
        usePopup: true,
      });
    }).catch((e) => logger.warn('Apple ID script failed', e));
  }, [serviceId]);

  const handleClick = async () => {
    if (!window.AppleID?.auth) {
      onError?.(de ? 'Apple-Login lädt noch.' : 'Apple sign-in still loading.');
      return;
    }
    setLoading(true);
    try {
      const result = await window.AppleID.auth.signIn();
      const identityToken = result?.authorization?.id_token;
      if (!identityToken) throw new Error('No id_token from Apple');
      const res = await api.post('/auth/apple/callback', {
        identity_token: identityToken,
        user: result?.user || null,
      });
      onSuccess?.(res.data.user, 'apple');
    } catch (err) {
      // The user closing the popup throws — don't surface it as an error
      if (err?.error === 'popup_closed_by_user') return;
      logger.error('Apple sign-in failed', err);
      onError?.(err?.response?.data?.detail || 'Apple-Login fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  if (!serviceId) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={buttonClass}
      data-testid="apple-signin-btn"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <AppleBrand />}
      <span>{de ? 'Mit Apple fortfahren' : 'Continue with Apple'}</span>
    </button>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Microsoft — MSAL.js via popup
// ────────────────────────────────────────────────────────────────────────────

let _msalScriptPromise = null;
const loadMsalScript = () => {
  if (_msalScriptPromise) return _msalScriptPromise;
  _msalScriptPromise = new Promise((resolve, reject) => {
    if (window.msal?.PublicClientApplication) return resolve();
    const s = document.createElement('script');
    s.src = 'https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.min.js';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load MSAL.js'));
    document.head.appendChild(s);
  });
  return _msalScriptPromise;
};

export const MicrosoftSignInButton = ({ clientId, tenant = 'common', onSuccess, onError, de = true }) => {
  const [loading, setLoading] = useState(false);
  const msalRef = useRef(null);

  useEffect(() => {
    if (!clientId) return;
    loadMsalScript().then(() => {
      if (!window.msal?.PublicClientApplication) return;
      msalRef.current = new window.msal.PublicClientApplication({
        auth: {
          clientId,
          authority: `https://login.microsoftonline.com/${tenant}`,
          // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
          redirectUri: window.location.origin + '/auth/microsoft/return',
        },
        cache: { cacheLocation: 'sessionStorage' },
      });
    }).catch((e) => logger.warn('MSAL load failed', e));
  }, [clientId, tenant]);

  const handleClick = async () => {
    if (!msalRef.current) {
      onError?.(de ? 'Microsoft-Login lädt noch.' : 'Microsoft sign-in still loading.');
      return;
    }
    setLoading(true);
    try {
      const result = await msalRef.current.loginPopup({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account',
      });
      const idToken = result?.idToken;
      if (!idToken) throw new Error('No id_token from Microsoft');
      const res = await api.post('/auth/microsoft/callback', { id_token: idToken });
      onSuccess?.(res.data.user, 'microsoft');
    } catch (err) {
      if (err?.errorCode === 'user_cancelled') return;
      logger.error('Microsoft sign-in failed', err);
      onError?.(err?.response?.data?.detail || 'Microsoft-Login fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  if (!clientId) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={buttonClass}
      data-testid="microsoft-signin-btn"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <MicrosoftBrand />}
      <span>{de ? 'Mit Microsoft fortfahren' : 'Continue with Microsoft'}</span>
    </button>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Combined provider stack — renders only the configured providers
// ────────────────────────────────────────────────────────────────────────────

export const OAuthProviderStack = ({ providers, onSuccess, onError, de = true }) => {
  if (!providers) return null;
  const { providers: avail = {}, google_client_id, apple_service_id, microsoft_client_id, microsoft_tenant } = providers;
  const anyConfigured = avail.google || avail.apple || avail.microsoft;
  if (!anyConfigured) return null;

  return (
    <div className="space-y-2.5" data-testid="oauth-provider-stack">
      {avail.google && (
        <GoogleSignInButton clientId={google_client_id} onSuccess={onSuccess} onError={onError} de={de} />
      )}
      {avail.apple && (
        <AppleSignInButton serviceId={apple_service_id} onSuccess={onSuccess} onError={onError} de={de} />
      )}
      {avail.microsoft && (
        <MicrosoftSignInButton
          clientId={microsoft_client_id}
          tenant={microsoft_tenant || 'common'}
          onSuccess={onSuccess}
          onError={onError}
          de={de}
        />
      )}
    </div>
  );
};
