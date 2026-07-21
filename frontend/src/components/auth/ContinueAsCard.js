/**
 * "Continue as [user]" — the signature premium-feel touch.
 *
 * Shown above the standard auth form when a previous login is cached. Picks
 * up the avatar/name/provider from localStorage and offers a one-tap return.
 *
 * For OAuth providers: Google → direct OAuth redirect (instant, no clicks);
 * Apple/Microsoft → trigger the provider's native button. For email/password
 * we send a 1-click magic link AND prefill the form as fallback; for
 * magic_link we ping /api/auth/magic-link/request directly.
 */
import { useState } from 'react';
import { ArrowRight, X, KeyRound, Sparkles, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { forgetLogin } from '../../lib/recentLogins';

const providerLabel = {
  google: 'Google',
  apple: 'Apple',
  microsoft: 'Microsoft',
  magic_link: 'Magic Link',
  email: 'Passwort',
};

const ProviderIcon = ({ provider, className = "" }) => {
  const cls = `${className} shrink-0`;
  if (provider === 'google') {
    return (
      <svg className={cls} width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    );
  }
  if (provider === 'magic_link') return <Sparkles className={cls} size={11} />;
  return <KeyRound className={cls} size={11} />;
};

const Initials = ({ name, email }) => {
  const source = (name || email || '?').trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const ini = (parts[0]?.[0] || '?') + (parts[1]?.[0] || '');
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BFFF00]/30 to-emerald-500/20 flex items-center justify-center text-[#BFFF00] font-bold text-sm uppercase">
      {ini}
    </div>
  );
};

export const ContinueAsCard = ({
  account,
  onClick,
  onForget,
  loading = false,
  de = true,
}) => {
  if (!account) return null;
  const { name, email, picture, provider } = account;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      data-testid="continue-as-card"
      data-account-email={email}
      className="group relative w-full text-left rounded-2xl border border-[#BFFF00]/25 bg-gradient-to-br from-[#BFFF00]/[0.06] via-white/[0.02] to-transparent hover:border-[#BFFF00]/45 hover:from-[#BFFF00]/[0.10] transition-all p-4 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-4">
        {picture ? (
          <img
            src={picture}
            alt=""
            className="w-12 h-12 rounded-full object-cover ring-2 ring-[#BFFF00]/40"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Initials name={name} email={email} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#BFFF00]/70">
              {de ? 'Weiter als' : 'Continue as'}
            </p>
            <span className="opacity-40 text-[10px]">·</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-white/40 font-semibold">
              <ProviderIcon provider={provider} /> {providerLabel[provider] || provider}
            </span>
          </div>
          <p className="text-sm font-bold text-white mt-0.5 truncate">{name || email}</p>
          {name && <p className="text-[11px] text-white/40 truncate">{email}</p>}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {loading
            ? <Loader2 size={18} className="animate-spin text-[#BFFF00]" />
            : <ArrowRight size={18} className="text-[#BFFF00] group-hover:translate-x-0.5 transition-transform" />}
        </div>
      </div>

      {/* "Not you?" — clears this account from the recent list */}
      {!loading && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onForget?.(email); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onForget?.(email); }
          }}
          className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-white/40 hover:text-white/80 opacity-0 group-hover:opacity-100 transition-all"
          aria-label={de ? 'Konto entfernen' : 'Forget this account'}
          data-testid="continue-as-forget"
        >
          <X size={11} />
        </span>
      )}
    </button>
  );
};

/**
 * Hook to handle "Continue as" click. Returns { trigger, loading, error }.
 * - For magic_link → sends a new link and shows success
 * - For email → sends a 1-click magic link directly (no password re-entry, Iter 117)
 *   and prefills the login form as fallback
 * - For google → redirects straight into the Google OAuth flow (active Google
 *   session = instant login, no clicks, no password)
 * - For apple/microsoft → returns 'oauth' so the parent triggers that provider's button
 */
export const useContinueAs = (account, { de = true, onPrefill, onMagicSent, onError } = {}) => {
  const [loading, setLoading] = useState(false);

  const trigger = async () => {
    if (!account) return;
    const { provider, email } = account;
    setLoading(true);
    try {
      if (provider === 'magic_link') {
        await api.post('/auth/magic-link/request', { email });
        onMagicSent?.(email);
      } else if (provider === 'email') {
        // Godmode (Iter 117): one tap = instant 1-click link, no password typing.
        // Form is still prefilled underneath as a fallback.
        onPrefill?.(email);
        await api.post('/auth/magic-link/request', { email });
        onMagicSent?.(email);
      } else if (provider === 'google') {
        // Direct OAuth redirect — an active Google session logs in instantly.
        const redirectUrl = window.location.origin + '/dashboard';
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
        return; // keep spinner until navigation
      } else if (provider === 'apple' || provider === 'microsoft') {
        // The actual sign-in is triggered by the provider button itself —
        // we just signal the parent to focus/click it.
        onPrefill?.(email, provider);
      }
    } catch (err) {
      logger.error('continueAs trigger failed', err);
      onError?.(de ? 'Aktion fehlgeschlagen.' : 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const forget = (email) => {
    forgetLogin(email);
    // The parent should re-read recentLogins() to refresh the UI.
  };

  return { trigger, forget, loading };
};
