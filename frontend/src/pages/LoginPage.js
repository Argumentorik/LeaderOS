import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api';
import { parseAuthError } from '../lib/authErrors';
import { Globe, WifiOff, KeyRound, Sparkles, Ticket } from 'lucide-react';
import { LoginBrandPanel } from '../components/auth/LoginBrandPanel';
import { WladMark } from '../components/brand/WladMark';
import { WladBotAvatar } from '../components/brand/WladBotAvatar';
import { AuthForm } from '../components/auth/AuthForm';
import { TrustBadges, ModeSwitch } from '../components/auth/LoginExtras';
import { MagicLinkForm } from '../components/auth/MagicLinkForm';
import { LicenseKeyForm } from '../components/auth/LicenseKeyForm';
import { OAuthProviderStack } from '../components/auth/OAuthButtons';
import { ContinueAsCard, useContinueAs } from '../components/auth/ContinueAsCard';
import { useAuthProviders } from '../lib/authProviders';
import { getLastLogin, forgetLogin } from '../lib/recentLogins';

const getFeatures = (de) => (de ? [
  { t: '30-Tage KI-Leadership Sprint', s: 'Jeden Tag eine Challenge, die dich als Leader schärft — 300 Fragen, AI-Roleplays, echtes Momentum' },
  { t: '16 Video-Missionen mit KI-Analyse', s: 'Kamera an, 60 Sekunden Rede — Wlads Framework bewertet dich in 18 Sekunden' },
  { t: 'Persönlicher KI-Coach — 24/7', s: 'WladBot kennt Wlads Methodik in- und auswendig — und ab Tag 1 auch dich' },
  { t: 'Täglich KI-Business Briefing', s: 'Trends, Leader-Zitate und strategische Insights — bevor dein erstes Meeting startet' },
] : [
  { t: '30-Day AI Leadership Sprint', s: '300 questions, daily challenges, AI roleplays' },
  { t: '16 Video Missions with AI Analysis', s: 'Camera on, give speech, instant AI scoring' },
  { t: 'Personal AI Coach — 24/7', s: 'Your WladBot knows Wlad\'s methodology inside out' },
  { t: 'Daily AI Business Briefing', s: 'Trends, leader quotes, strategic insights' },
]);

export default function LoginPage({ initialMode = 'login' }) {
  const { login } = useAuth();
  const { lang, toggleLang } = useLanguage();
  const navigate = useNavigate();
  // Iter 92.25: when the route is /signup or /register, mount directly in
  // register mode. Default '/login' route keeps the existing behaviour.
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [lastAccount, setLastAccount] = useState(getLastLogin());
  const { data: providers } = useAuthProviders();
  const de = lang === 'de';

  // If a previous login exists, default to "login" mode so the Continue-as card shows
  useEffect(() => {
    if (lastAccount && mode === 'register') setMode('login');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOAuthSuccess = (user, method) => {
    login(user, method);
    toast.success(de ? `Willkommen zurück, ${user.name || user.email}!` : `Welcome back, ${user.name || user.email}!`);
    navigate(postLoginRoute(user));
  };

  const handleOAuthError = (msg) => {
    setError(msg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const trimmedId = (form.email || '').trim();
      // Iter 92.24 (Mert): login accepts EITHER email OR phone in the same field.
      // Send as `identifier`; backend coalesces `identifier|phone|email` to one value.
      const payload = mode === 'register'
        ? { ...form, email: trimmedId }
        : { identifier: trimmedId, password: form.password };
      const res = await api.post(endpoint, payload);
      login(res.data.user, 'email');
      navigate(postLoginRoute(res.data.user));
    } catch (err) {
      if (!err.response) {
        setError(de
          ? 'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.'
          : 'Cannot reach server. Please check your connection.');
      } else {
        setError(parseAuthError(err, de ? 'Fehler aufgetreten' : 'An error occurred'));
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
  };

  const { trigger: triggerContinue, loading: continueLoading } = useContinueAs(lastAccount, {
    de,
    onPrefill: (email, provider) => {
      // For OAuth providers, switch mode to 'login' so the buttons are visible
      // then ask user to click the provider button (one-tap auto-prompts if available)
      if (provider) {
        setMode('login');
        setForm(f => ({ ...f, email }));
        toast.info(de
          ? `Klicke unten auf "Mit ${provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Microsoft'} fortfahren"`
          : `Click "Continue with ${provider}" below`);
      } else {
        setMode('login');
        setForm(f => ({ ...f, email }));
      }
    },
    onMagicSent: () => {
      toast.success(de ? 'Login-Link wurde gesendet — prüfe dein Postfach.' : 'Login link sent — check your inbox.');
    },
    onError: setError,
  });

  const handleForget = (email) => {
    forgetLogin(email);
    setLastAccount(getLastLogin());
    toast.success(de ? 'Konto entfernt.' : 'Account removed.');
  };

  const isMagic = mode === 'magic';
  const isLicense = mode === 'license';
  const isRegister = mode === 'register';
  const showContinueAs = !!lastAccount && !isRegister && !isMagic && !isLicense;

  const heading = useMemo(() => {
    if (isMagic) return de ? 'Login ohne Passwort' : 'Sign in without a password';
    if (isLicense) return de ? 'Lizenz-Key einlösen' : 'Redeem license key';
    if (isRegister) return de ? 'Account erstellen' : 'Create account';
    return de ? 'Willkommen zurück' : 'Welcome back';
  }, [isMagic, isLicense, isRegister, de]);

  const subheading = useMemo(() => {
    if (isMagic) return de ? 'Gib deine E-Mail ein — wir senden dir einen sicheren 1-Klick-Link. Kein Passwort, kein Aufwand.' : 'Enter your email — we\'ll send a secure 1-click link. No password, no friction.';
    if (isLicense) return de ? 'Du hast einen 16-stelligen Aktivierungscode gekauft? Löse ihn hier ein — dein Paket wird sofort freigeschaltet.' : 'Bought a 16-character activation code? Redeem it here — your package unlocks instantly.';
    if (isRegister) return de ? 'Starte deinen KI-Leadership Sprint — 3 Sessions kostenlos, keine Kreditkarte, voller Zugriff auf WladBot.' : 'Start your AI leadership sprint — 3 sessions free, no credit card, full WladBot access.';
    return de ? 'Schön, dich wiederzusehen. Dein Fortschritt wartet genau dort, wo du aufgehört hast.' : 'Good to see you again. Your progress is waiting right where you left off.';
  }, [isMagic, isLicense, isRegister, de]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0A0A] relative overflow-hidden" data-testid="login-page">
      {/* Aurora background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 lg:left-1/2">
        <div className="absolute top-1/4 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-[#BFFF00]/[0.045] blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[10%] h-[28rem] w-[28rem] rounded-full bg-emerald-500/[0.035] blur-[130px]" />
      </div>

      <button
        onClick={toggleLang}
        className="fixed top-4 right-4 lg:top-8 lg:right-10 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white transition-colors text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md"
        data-testid="login-lang-toggle"
      >
        <Globe size={11} /> {de ? 'DE' : 'EN'}
      </button>

      <LoginBrandPanel features={getFeatures(de)} de={de} />

      <div className="flex-1 flex items-start lg:items-center justify-center px-5 pt-16 pb-8 sm:px-8 lg:p-12 relative z-10">
        <div data-testid="login-mobile-header" className="absolute top-4 left-4 flex items-center gap-2 lg:hidden">
          <WladMark size={32} animated />
          <div className="flex flex-col leading-none">
            <span className="font-black text-[13px] text-white" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.025em' }}>
              Leader<span className="opacity-40">·</span>OS
            </span>
            <span className="text-[8px] text-[#BFFF00]/70 font-bold tracking-[0.2em] uppercase mt-[2px]">Powered by WladBot</span>
          </div>
        </div>

        <div className="w-full max-w-md lg:max-w-[400px]">
          {/* WladBot 3.0 trust anchor — he's here, live (Iter 92.50) */}
          <div className="flex items-center gap-3 mb-5" data-testid="login-wladbot-trust">
            <WladBotAvatar size={42} live />
            <div className="leading-tight">
              <p className="text-[12.5px] font-bold text-white flex items-center gap-1.5">
                WladBot <span className="px-1.5 py-px rounded-md bg-[#BFFF00]/15 text-[#BFFF00] text-[9px] font-black tracking-wider">3.0</span>
              </p>
              <p className="text-[10.5px] text-white/40 mt-0.5">
                {de ? 'Online · zeigt dir jeden Tag die Richtung' : 'Online · shows you the direction every day'}
              </p>
            </div>
            <div className="ml-auto text-right leading-tight" data-testid="login-social-proof">
              <p className="text-[11px] font-black text-[#BFFF00]">4,9 ★</p>
              <p className="text-[9.5px] text-white/35">2.500+ Leader</p>
            </div>
          </div>

          <div className="mb-6 lg:mb-7">
            <h2 className="text-[28px] sm:text-[32px] leading-[1.1] tracking-tight text-white" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
              {heading}
            </h2>
            <p className="text-sm text-white/45 mt-2.5 leading-relaxed">{subheading}</p>
          </div>

          {/* "Continue as" — only when a previous login is cached */}
          {showContinueAs && (
            <div className="mb-5">
              <ContinueAsCard
                account={lastAccount}
                onClick={triggerContinue}
                onForget={handleForget}
                loading={continueLoading}
                de={de}
              />
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                  {de ? 'oder anderer Account' : 'or another account'}
                </span>
                <span className="h-px flex-1 bg-white/[0.06]" />
              </div>
            </div>
          )}

          {/* Auth method tabs (only in non-register mode) */}
          {!isRegister && (
            <div
              className="mb-4 inline-flex p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              role="tablist"
              data-testid="auth-mode-tabs"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => switchMode('login')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  mode === 'login' ? 'bg-white/10 text-white shadow-sm' : 'text-white/45 hover:text-white/70'
                }`}
                data-testid="tab-password"
              >
                <KeyRound size={12} /> {de ? 'Passwort' : 'Password'}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isMagic}
                onClick={() => switchMode('magic')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  isMagic ? 'bg-[#BFFF00]/12 text-[#BFFF00] shadow-sm' : 'text-white/45 hover:text-white/70'
                }`}
                data-testid="tab-magic-link"
              >
                <Sparkles size={12} /> Magic Link
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isLicense}
                onClick={() => switchMode('license')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  isLicense ? 'bg-[#BFFF00]/12 text-[#BFFF00] shadow-sm' : 'text-white/45 hover:text-white/70'
                }`}
                data-testid="tab-license-key"
              >
                <Ticket size={12} /> {de ? 'Lizenz-Key' : 'License Key'}
              </button>
            </div>
          )}

          {/* OAuth providers (only show if any configured AND we're not in magic/license mode) */}
          {!isMagic && !isLicense && providers && (
            <OAuthProviderStack
              providers={providers}
              onSuccess={handleOAuthSuccess}
              onError={handleOAuthError}
              de={de}
            />
          )}

          {!isMagic && !isLicense && providers?.providers && (providers.providers.google || providers.providers.apple || providers.providers.microsoft) && (
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.08]" /></div>
              <div className="relative flex justify-center">
                <span className="bg-[#0A0A0A] px-3 text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                  {de ? 'oder per E-Mail' : 'or with email'}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div data-testid="auth-error" className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium flex items-start gap-2">
              <WifiOff size={14} className="mt-0.5 shrink-0 opacity-60" />
              <span>{error}</span>
            </div>
          )}

          {isMagic ? (
            <MagicLinkForm de={de} />
          ) : isLicense ? (
            <LicenseKeyForm de={de} />
          ) : (
            <>
              <AuthForm
                mode={mode} form={form} setForm={setForm}
                showPw={showPw} setShowPw={setShowPw}
                loading={loading} onSubmit={handleSubmit} de={de}
              />
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => switchMode('magic')}
                  className="mt-3 w-full text-center text-[11px] font-semibold uppercase tracking-wider text-white/35 hover:text-[#BFFF00] transition-colors"
                  data-testid="switch-to-magic-link"
                >
                  {de ? 'Passwort vergessen? · Magic Link nutzen' : 'Forgot password? · Use a Magic Link'}
                </button>
              )}
            </>
          )}

          <div className="mt-6 lg:mt-7 text-center">
            <ModeSwitch
              mode={isMagic || isLicense ? 'login' : mode}
              onSwitchMode={switchMode}
              de={de}
            />
          </div>

          <TrustBadges />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground" data-testid="legal-footer">
            <a href="/impressum" className="hover:text-[#BFFF00] hover:underline" data-testid="footer-impressum">Impressum</a>
            <span className="opacity-30">·</span>
            <a href="/datenschutz" className="hover:text-[#BFFF00] hover:underline" data-testid="footer-datenschutz">{de ? 'Datenschutz' : 'Privacy'}</a>
            <span className="opacity-30">·</span>
            <a href="/agb" className="hover:text-[#BFFF00] hover:underline" data-testid="footer-agb">AGB</a>
            <span className="opacity-30">·</span>
            <a href="/widerruf" className="hover:text-[#BFFF00] hover:underline" data-testid="footer-widerruf">{de ? 'Widerruf' : 'Withdrawal'}</a>
            <span className="opacity-30">·</span>
            <a href="/changelog" className="hover:text-[#BFFF00] hover:underline" data-testid="footer-changelog">Changelog</a>
          </div>
        </div>
      </div>
    </div>
  );
}
