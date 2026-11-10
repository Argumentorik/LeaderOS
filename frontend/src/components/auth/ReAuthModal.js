/**
 * ReAuthModal · soft re-authentication overlay.
 *
 * Triggered when an API call fails with 401 AFTER our refresh-token interceptor
 * has already tried to refresh once (i.e., the refresh token itself is expired).
 *
 * Previously we did `window.location.href = '/login'` which destroyed the user's
 * scroll position, form state, and broke the SPA feel. Now we show this modal
 * over the current page. On successful re-auth, the parent page state is intact.
 *
 * Listens for global event:  window.dispatchEvent(new CustomEvent('wladbot:reauth-required'))
 * Dispatches on close:        window.dispatchEvent(new CustomEvent('wladbot:reauth-success'))
 *
 * Drop ONCE in App.js (sibling of <Toaster />).
 */
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { GoogleSignInButton } from './OAuthButtons';
import { Loader2, X, ShieldCheck } from 'lucide-react';

export const ReAuthModal = () => {
  const { user, login } = useAuth();
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');

  // Listen for the global reauth-required event
  useEffect(() => {
    const handler = () => {
      // Only open if we have a user context (otherwise the regular /login flow handles it)
      if (user?.email) setOpen(true);
    };
    window.addEventListener('wladbot:reauth-required', handler);
    return () => window.removeEventListener('wladbot:reauth-required', handler);
  }, [user]);

  // Lazy-load Google client ID when modal opens
  useEffect(() => {
    if (!open || googleClientId) return;
    api.get('/auth/providers')
      .then(res => { if (res.data?.google_client_id) setGoogleClientId(res.data.google_client_id); })
      .catch(() => { /* non-blocking */ });
  }, [open, googleClientId]);

  const close = useCallback(() => {
    setOpen(false);
    setPassword('');
    setError('');
    // Notify api.js interceptor that user dismissed reauth · it should reject
    // the pending request and clear the cached user.
    window.dispatchEvent(new CustomEvent('wladbot:reauth-cancelled'));
  }, []);

  const finishReAuth = useCallback((userData, method) => {
    login(userData, method);
    window.dispatchEvent(new CustomEvent('wladbot:reauth-success'));
    close();
  }, [login, close]);

  const submitPassword = async (e) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email: user.email, password });
      finishReAuth(res.data.user, 'email');
    } catch (err) {
      logger.warn('ReAuth password failed', err);
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : (de ? 'Falsches Passwort.' : 'Wrong password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (userData) => finishReAuth(userData, 'google');
  const handleGoogleError = (msg) => setError(msg);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      data-testid="reauth-modal"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0A0A] p-7 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center">
              <ShieldCheck size={20} className="text-[#BFFF00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {de ? 'Bitte erneut anmelden' : 'Please re-authenticate'}
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                {de ? 'Deine Sitzung ist abgelaufen' : 'Your session has expired'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-white/40 hover:text-white/80 transition-colors"
            aria-label="close"
            data-testid="reauth-modal-close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-white/60 mb-5">
          {de
            ? <>Angemeldet als <span className="text-white font-semibold">{user?.email}</span></>
            : <>Signed in as <span className="text-white font-semibold">{user?.email}</span></>}
        </p>

        {googleClientId && (
          <div className="mb-4">
            <GoogleSignInButton
              clientId={googleClientId}
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              de={de}
              label={de ? 'Mit Google bestätigen' : 'Confirm with Google'}
            />
          </div>
        )}

        {googleClientId && (
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/30 uppercase tracking-wider">
              {de ? 'oder' : 'or'}
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        )}

        <form onSubmit={submitPassword} className="space-y-3">
          <input
            type="password"
            autoComplete="current-password"
            placeholder={de ? 'Passwort' : 'Password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#BFFF00]/40 outline-none text-sm text-white placeholder-white/30"
            autoFocus
            data-testid="reauth-password-input"
          />
          {error && (
            <p className="text-xs text-red-400" data-testid="reauth-error">{error}</p>
          )}
          <button
            type="submit"
            disabled={!password || loading}
            className="w-full h-12 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            data-testid="reauth-submit-btn"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>{de ? 'Anmelden' : 'Sign in'}</span>
          </button>
        </form>

        <p className="text-[11px] text-white/30 mt-5 text-center">
          {de
            ? 'Deine Eingaben gehen nach erfolgreicher Anmeldung nicht verloren.'
            : 'Your work will be preserved after sign-in.'}
        </p>
      </div>
    </div>
  );
};
