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

const GoogleBrand = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

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
// Google — Emergent-managed OAuth. No Google Cloud Console config needed:
// the user is redirected to auth.emergentagent.com, signs in with Google and
// returns to {origin}/dashboard#session_id=… which AuthCallback exchanges via
// POST /api/auth/google-session. This permanently fixes the origin_mismatch
// problem of the old GIS popup flow.
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
// ────────────────────────────────────────────────────────────────────────────

export const GoogleSignInButton = ({ de = true, label }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={buttonClass}
      data-testid="google-signin-btn"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <GoogleBrand />}
      <span>{label || (de ? 'Mit Google fortfahren' : 'Continue with Google')}</span>
    </button>
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
        <GoogleSignInButton de={de} />
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
