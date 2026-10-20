import { Shield, UserPlus, LogIn, ArrowRight } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export const GoogleButton = ({ onClick, de }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.06] transition-all font-medium text-sm text-white"
    data-testid="google-login-btn"
  >
    <GoogleIcon />
    {de ? 'Mit Google fortfahren' : 'Continue with Google'}
  </button>
);

export const TrustBadges = () => (
  <div className="flex items-center justify-center gap-5 mt-10 text-white/15">
    <div className="flex items-center gap-1.5"><Shield size={11} /><span className="text-[10px] font-medium tracking-wide">DSGVO</span></div>
    <div className="w-px h-3 bg-white/[0.06]" />
    <div className="flex items-center gap-1.5"><Shield size={11} /><span className="text-[10px] font-medium tracking-wide">Stripe</span></div>
    <div className="w-px h-3 bg-white/[0.06]" />
    <div className="flex items-center gap-1.5"><Shield size={11} /><span className="text-[10px] font-medium tracking-wide">SSL</span></div>
  </div>
);

/**
 * ModeSwitch — Iter 92.44 (Mert · GODMODE): turned the weak "click to switch"
 * text-link into a proper outlined CTA-style toggle with icon + arrow. This
 * is the #2 most-clicked element on the auth page (after the primary CTA)
 * and deserves visual weight equivalent to a secondary button — Stripe /
 * Linear / Vercel pattern.
 */
export const ModeSwitch = ({ mode, onSwitchMode, de }) => {
  if (mode === 'register') {
    return (
      <>
        <p className="text-[11px] text-white/25 mb-5 leading-relaxed">
          {de ? 'Mit der Erstellung akzeptierst du unsere ' : 'By creating an account, you agree to our '}
          <a href="/agb" className="text-white/50 font-semibold hover:text-[#BFFF00] underline-offset-2 hover:underline transition-colors">{de ? 'Nutzungsbedingungen' : 'Terms'}</a>
          {de ? ' und ' : ' and '}
          <a href="/datenschutz" className="text-white/50 font-semibold hover:text-[#BFFF00] underline-offset-2 hover:underline transition-colors">{de ? 'Datenschutz' : 'Privacy'}</a>
          {' · '}
          <a href="/sicherheit" className="text-white/50 font-semibold hover:text-[#BFFF00] underline-offset-2 hover:underline transition-colors" data-testid="trust-page-link">{de ? 'Sicherheit' : 'Security'}</a>
        </p>
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          data-testid="login-tab"
          className="group w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#BFFF00]/40 hover:bg-white/[0.05] transition-all font-bold text-[13px] text-white/70 hover:text-white"
        >
          <LogIn size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
          <span>
            {de ? 'Bereits registriert? ' : 'Already have an account? '}
            <span className="text-[#BFFF00]">{de ? 'Anmelden' : 'Sign in'}</span>
          </span>
          <ArrowRight size={13} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </button>
      </>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onSwitchMode('register')}
      data-testid="register-tab"
      className="group w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-white/[0.03] via-[#BFFF00]/[0.04] to-white/[0.03] border border-[#BFFF00]/25 hover:border-[#BFFF00]/55 hover:from-[#BFFF00]/[0.06] hover:via-[#BFFF00]/[0.10] hover:to-[#BFFF00]/[0.06] transition-all font-bold text-[13px] text-white/80 hover:text-white shadow-sm hover:shadow-[#BFFF00]/10"
    >
      <UserPlus size={14} className="text-[#BFFF00]" />
      <span>
        {de ? 'Noch kein Account? ' : "Don't have an account? "}
        <span className="text-[#BFFF00]">{de ? 'Kostenlos starten' : 'Start free'}</span>
      </span>
      <ArrowRight size={13} className="text-[#BFFF00] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
};
