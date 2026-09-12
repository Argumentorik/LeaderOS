import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api';
import { parseAuthError } from '../lib/authErrors';
import { getAttribution } from '../lib/attribution';
import { useSeo } from '../lib/seo';
import { Globe, WifiOff } from 'lucide-react';
import { LoginTeaserVideo } from '../components/auth/LoginTeaserVideo';
import { LoginBrandPanel } from '../components/auth/LoginBrandPanel';
import { WladMark } from '../components/brand/WladMark';
import { WladBotAvatar } from '../components/brand/WladBotAvatar';
import { AuthForm } from '../components/auth/AuthForm';
import { TrustBadges, ModeSwitch } from '../components/auth/LoginExtras';
import { MagicLinkForm } from '../components/auth/MagicLinkForm';
import { AuthModeTabs, LegalFooter } from '../components/auth/AuthModeTabs';
import { LicenseKeyForm } from '../components/auth/LicenseKeyForm';
import { OAuthProviderStack } from '../components/auth/OAuthButtons';
import { ContinueAsCard, useContinueAs } from '../components/auth/ContinueAsCard';
import { useAuthProviders } from '../lib/authProviders';
import { getLastLogin, forgetLogin } from '../lib/recentLogins';
import { postLoginRoute } from '../lib/postLoginRoute';

const getFeatures = (de) => (de ? [
  { t: 'Vor dem Gespräch vorbereitet, nicht danach schlauer', s: 'Du beschreibst Wlad deine Situation – er baut mit dir Einstieg, Argumente und Ziel, bevor es ernst wird' },
  { t: 'Üben, bis es sitzt', s: 'In der Simulation antwortet dein Gegenüber so unbequem wie im echten Leben. In der Video-Analyse siehst du, wie du wirklich wirkst' },
  { t: 'Zehn Minuten am Tag reichen', s: 'Eine Challenge, eine echte Frage, ein nächster Schritt – und nach einer Woche merkst du es im Meeting' },
  { t: 'Wlad kennt dich', s: 'Deine Rolle, dein Team, deine Baustellen: Jede Antwort passt zu deinem Alltag, nicht zum Lehrbuch' },
] : [
  { t: 'Prepared before the conversation, not wiser after it', s: 'Describe your situation – Wlad builds the opening, arguments and goal with you before it gets serious' },
  { t: 'Practice until it sticks', s: 'In the simulation your counterpart pushes back like in real life. The video analysis shows how you really come across' },
  { t: 'Ten minutes a day is enough', s: 'One challenge, one real question, one next step – and after a week you notice it in the meeting' },
  { t: 'Wlad knows you', s: 'Your role, your team, your open issues: every answer fits your day, not the textbook' },
]);

export default function LoginPage({ initialMode = 'login' }) {
  // /login is the canonical app entry — /signup and /register point here so
  // Google does not see three duplicates of the same shell (Iter 135).
  useSeo({
    path: '/login',
    title: 'Leader-OS — KI Leadership System für Führungskräfte von Wlad Jachtchenko',
    description: 'Anmelden bei Leader-OS: KI-Coach für Führungssituationen, 30-Tage-Programm, Rhetorik- und EQ-Training nach der Methodik von Wlad Jachtchenko.',
  });
  const { login, user: authedUser } = useAuth();
  const { lang, toggleLang } = useLanguage();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  // Where the user was bounced from (e.g. /payment-success after checkout).
  const returnTo = routerLocation.state?.from?.pathname
    ? `${routerLocation.state.from.pathname}${routerLocation.state.from.search || ''}`
    : null;
  // Iter 92.25: when the route is /signup or /register, mount directly in
  // register mode. Default '/login' route keeps the existing behaviour.
  const [mode, setMode] = useState(routerLocation.state?.mode || initialMode);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [lastAccount, setLastAccount] = useState(getLastLogin());
  const { data: providers } = useAuthProviders();
  const de = lang === 'de';

  // Iter 124.4 (Godmode pre-launch): already-authed users must NOT see the
  // login screen. Redirect them to the post-login route immediately.
  useEffect(() => {
    if (authedUser) navigate(postLoginRoute(authedUser, returnTo), { replace: true });
  }, [authedUser, navigate, returnTo]);

  // Iter 130 BUGFIX: an earlier effect force-reset mode 'register' → 'login'
  // whenever a lastAccount existed — clicking "Registrieren" then did NOTHING.
  // Removed: explicit register intent (route or click) must always win.

  const handleOAuthSuccess = (user, method) => {
    login(user, method);
    toast.success(de ? `Willkommen zurück, ${user.name || user.email}!` : `Welcome back, ${user.name || user.email}!`);
    navigate(postLoginRoute(user, returnTo));
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
        ? { ...form, email: trimmedId, attribution: getAttribution() }
        : { identifier: trimmedId, password: form.password };
      const res = await api.post(endpoint, payload);
      login(res.data.user, 'email');
      navigate(postLoginRoute(res.data.user, returnTo));
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
      if (provider === 'license') {
        setMode('license');
        setForm(f => ({ ...f, email }));
        return;
      }
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
      toast.success(de ? 'Login-Link wurde gesendet. Prüfe dein Postfach.' : 'Login link sent. Check your inbox.');
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
    if (isRegister) return de ? 'Fang heute an.' : 'Start today.';
    return de ? 'Schön, dass du wieder da bist.' : 'Good to have you back.';
  }, [isMagic, isLicense, isRegister, de]);

  const subheading = useMemo(() => {
    if (isMagic) return de ? 'Gib deine E-Mail ein, wir schicken dir einen sicheren Link. Ein Klick, und du bist drin – ganz ohne Passwort.' : 'Enter your email and we\'ll send you a secure link. One click and you\'re in – no password needed.';
    if (isLicense) return de ? 'Du hast einen 16-stelligen Aktivierungscode gekauft? Löse ihn hier ein, dein Paket wird sofort freigeschaltet.' : 'Bought a 16-character activation code? Redeem it here, your package unlocks instantly.';
    if (isRegister) return de ? 'Kostenlos, ohne Kreditkarte. In zehn Minuten steht dein System – und morgen gehst du anders ins nächste Gespräch.' : 'Free, no credit card. Your system is set up in ten minutes – and tomorrow you walk into the next conversation differently.';
    return de ? 'Dein nächster Schritt wartet genau dort, wo du aufgehört hast.' : 'Your next step is waiting right where you left off.';
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

      <LoginBrandPanel features={getFeatures(de)} de={de} onStartRegister={() => switchMode('register')} />

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

        <div className="w-full max-w-md lg:max-w-[400px]" id="login-form-card">
          {/* Mobil: kompakte Kino-Vorschau über dem Formular (öffnet den Vollbild-Player) */}
          <div className="lg:hidden mb-5" data-testid="login-teaser-mobile">
            <LoginTeaserVideo de={de} compact onStartRegister={() => switchMode('register')} />
          </div>
          {/* WladBot 3.0 trust anchor — he's here, live (Iter 92.50) */}
          <div className="flex items-center gap-3 mb-5" data-testid="login-wladbot-trust">
            <WladBotAvatar size={42} live />
            <div className="leading-tight">
              <p className="text-[12.5px] font-bold text-white flex items-center gap-1.5">
                WladBot <span className="px-1.5 py-px rounded-md bg-[#BFFF00]/15 text-[#BFFF00] text-[9px] font-black tracking-wider">3.0</span>
              </p>
              <p className="text-[10.5px] text-white/40 mt-0.5">
                {de ? 'Online · bereitet dich auf dein nächstes Gespräch vor' : 'Online · prepares you for your next conversation'}
              </p>
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

          {!isRegister && <AuthModeTabs mode={mode} onSwitch={switchMode} de={de} />}

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

          <div role="alert" aria-live="assertive" aria-atomic="true">
            {error && (
              <div data-testid="auth-error" className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium flex items-start gap-2">
                <WifiOff size={14} className="mt-0.5 shrink-0 opacity-60" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {isMagic ? (
            <MagicLinkForm de={de} initialEmail={/@/.test(form.email || '') ? form.email.trim() : ''} />

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
          <LegalFooter de={de} />
        </div>
      </div>
    </div>
  );
}
