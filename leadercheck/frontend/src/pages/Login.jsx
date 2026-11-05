import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Check, Phone, Mail, ArrowRight, Loader2 } from "lucide-react";
import LeaderOSLogo from "../components/LeaderOSLogo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Google SVG Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quick login state (phone or email)
  const [quickIdentifier, setQuickIdentifier] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState("");

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    if (!consentPrivacy) {
      setQuickError("Bitte akzeptiere die Datenschutzerklärung.");
      return;
    }
    const id = quickIdentifier.trim();
    if (!id) {
      setQuickError("Bitte gib deine E-Mail oder Telefonnummer ein.");
      return;
    }
    setQuickLoading(true);
    setQuickError("");
    try {
      const res = await fetch(`${API}/auth/quick-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id }),
      });
      if (res.status === 404) {
        // No account yet — route into the diagnosis funnel with prefill
        localStorage.setItem("leaderos_prefill", JSON.stringify({ identifier: id }));
        navigate("/diagnose");
        return;
      }
      if (!res.ok) throw new Error("login_failed");
      const data = await res.json();
      localStorage.setItem("emergent_user", JSON.stringify({
        session_id: data.session_id || data.user_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
      }));
      navigate(data.has_report ? "/report" : "/diagnose");
    } catch {
      setQuickError("Login fehlgeschlagen. Versuche es erneut oder starte eine neue Diagnose.");
    } finally {
      setQuickLoading(false);
    }
  };

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (response.ok) {
          navigate('/diagnose');
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    
    // Skip auth check if returning from OAuth callback
    if (!window.location.hash?.includes('session_id=')) {
      checkAuth();
    }
  }, [navigate]);

  const handleGoogleLogin = () => {
    if (!consentPrivacy) {
      alert("Bitte akzeptiere die Datenschutzerklärung, um fortzufahren.");
      return;
    }
    
    setLoading(true);
    
    // Store consent in localStorage for after OAuth redirect
    localStorage.setItem('leaderos_consent', JSON.stringify({
      privacy: consentPrivacy,
      marketing: consentMarketing
    }));
    
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-4 py-12" data-testid="login-page">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-br from-[#C8FF00]/6 via-[#C8FF00]/4 to-transparent rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#C8FF00]/[0.02] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-2">
            <LeaderOSLogo variant="default" size="xl" />
          </div>
          <p className="font-inter text-slate-500">Leadership Diagnose</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="badge-amber px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4" />
              Sicher anmelden
            </div>
            <h2 className="font-manrope font-bold text-xl text-white mb-2">
              Starte deine Leadership-Diagnose
            </h2>
            <p className="font-inter text-sm text-slate-500">
              Melde dich an, um deinen persönlichen Report zu erhalten
            </p>
          </div>

          {/* Google Login Button */}
          <button
            data-testid="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading || !consentPrivacy}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full border transition-all duration-300 mb-4 ${
              consentPrivacy 
                ? "bg-white text-black hover:bg-slate-100 border-white cursor-pointer" 
                : "bg-white/10 text-slate-500 border-white/10 cursor-not-allowed"
            }`}
          >
            <GoogleIcon />
            <span className="font-medium">
              {loading ? "Wird verbunden..." : "Mit Google anmelden"}
            </span>
          </button>

          {/* Divider OR */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="font-inter text-xs text-slate-600 uppercase tracking-wider">oder</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Quick Login with Phone or Email */}
          <form onSubmit={handleQuickLogin} className="space-y-3 mb-6" data-testid="quick-login-form">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 text-slate-600">
                <Phone className="w-4 h-4" />
                <span className="text-slate-700">/</span>
                <Mail className="w-4 h-4" />
              </div>
              <input
                data-testid="quick-login-input"
                type="text"
                value={quickIdentifier}
                onChange={(e) => setQuickIdentifier(e.target.value)}
                placeholder="E-Mail oder +49 151 ..."
                className="w-full input-modern h-12 pl-20 pr-4 font-inter text-white placeholder:text-slate-600"
                autoComplete="username"
              />
            </div>
            {quickError && (
              <p data-testid="quick-login-error" className="font-inter text-xs text-red-400">
                {quickError}
              </p>
            )}
            <button
              data-testid="quick-login-btn"
              type="submit"
              disabled={quickLoading || !consentPrivacy}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full transition-all font-medium ${
                consentPrivacy
                  ? "bg-[#C8FF00] text-black hover:bg-[#d4ff33] cursor-pointer"
                  : "bg-[#C8FF00]/20 text-[#C8FF00]/50 cursor-not-allowed"
              }`}
            >
              {quickLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Weiter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="font-inter text-[11px] text-slate-600 text-center">
              Du hast schon eine Diagnose gestartet? Mit derselben Telefonnummer oder E-Mail einloggen.
            </p>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="font-inter text-xs text-slate-600">Datenschutz</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-4">
            {/* Privacy Policy Consent - Required */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={consentPrivacy}
                  onChange={(e) => setConsentPrivacy(e.target.checked)}
                  className="sr-only"
                  data-testid="consent-privacy"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  consentPrivacy 
                    ? "bg-[#C8FF00] border-[#C8FF00]" 
                    : "border-white/20 group-hover:border-white/40"
                }`}>
                  {consentPrivacy && <Check className="w-3 h-3 text-black" />}
                </div>
              </div>
              <span className="font-inter text-sm text-slate-400">
                Ich akzeptiere die{" "}
                <button 
                  onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}
                  className="text-[#C8FF00] hover:text-[#d4ff33] underline"
                >
                  Datenschutzerklärung
                </button>
                {" "}und stimme der Verarbeitung meiner Daten zu. *
              </span>
            </label>

            {/* Marketing Consent - Optional */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={consentMarketing}
                  onChange={(e) => setConsentMarketing(e.target.checked)}
                  className="sr-only"
                  data-testid="consent-marketing"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  consentMarketing 
                    ? "bg-white border-white" 
                    : "border-white/20 group-hover:border-white/40"
                }`}>
                  {consentMarketing && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <span className="font-inter text-sm text-slate-500">
                Ich möchte Leadership-Tipps und Updates per E-Mail erhalten (optional)
              </span>
            </label>
          </div>

          {/* Required notice */}
          <p className="font-inter text-xs text-slate-600 mt-4">
            * Pflichtfeld
          </p>

          {/* Security Info */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 text-slate-500">
              <Lock className="w-4 h-4" />
              <span className="font-inter text-xs">
                Sichere Anmeldung via Google OAuth 2.0. Wir speichern kein Passwort.
              </span>
            </div>
          </div>
        </div>

        {/* Skip for now */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/diagnose-guest')}
            className="font-inter text-sm text-slate-600 hover:text-slate-400 transition-colors"
          >
            Ohne Anmeldung fortfahren →
          </button>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card p-8 max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="font-manrope font-bold text-2xl text-white mb-6">
              Datenschutzerklärung
            </h2>
            
            <div className="space-y-4 font-inter text-sm text-slate-400">
              <div>
                <h3 className="font-semibold text-white mb-2">1. Datenerhebung</h3>
                <p>Wir erheben folgende Daten: Name, E-Mail-Adresse (via Google OAuth), deine Diagnose-Antworten und optional Sprachaufnahmen.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">2. Verwendungszweck</h3>
                <p>Deine Daten werden ausschließlich zur Erstellung deines persönlichen Leadership-Reports und zur Verbesserung unseres Services verwendet.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">3. Datenspeicherung</h3>
                <p>Alle Daten werden auf sicheren EU-Servern gespeichert und nach DSGVO-Standards geschützt.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">4. Sprachaufnahmen</h3>
                <p>Deine Sprachaufnahmen werden temporär verarbeitet, um sie zu transkribieren. Nach der Transkription werden die Audio-Dateien gelöscht.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">5. Deine Rechte</h3>
                <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit. Du kannst jederzeit die vollständige Löschung deiner Daten anfordern.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">6. Cookies</h3>
                <p>Wir verwenden nur technisch notwendige Session-Cookies für die Authentifizierung. Keine Tracking-Cookies.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">7. Drittanbieter</h3>
                <p>Wir nutzen Google OAuth für die Anmeldung und OpenAI für die Sprachtranskription. Diese Dienste unterliegen eigenen Datenschutzrichtlinien.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">8. Kontakt</h3>
                <p>Bei Fragen zum Datenschutz: datenschutz@leaderos.de</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="btn-primary px-6 py-3 font-medium"
              >
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
