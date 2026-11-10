import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Check, Phone, Mail, ArrowRight, Loader2 } from "lucide-react";
import LeaderOSLogo from "../components/LeaderOSLogo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Login() {
  const navigate = useNavigate();
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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

    checkAuth();
  }, [navigate]);

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
                Anmeldung mit E-Mail oder Telefonnummer. Wir speichern kein Passwort.
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
                <p>Wir erheben folgende Daten: Name, E-Mail-Adresse, Telefonnummer, deine Diagnose-Antworten und optional Sprachaufnahmen.</p>
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
                <p>Wir nutzen OpenAI für die Sprachtranskription. Diese Dienste unterliegen eigenen Datenschutzrichtlinien.</p>
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
