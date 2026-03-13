import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, User, Briefcase, TrendingUp, Target, ChevronLeft, Edit3, Mail } from "lucide-react";
import axios from "axios";

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

const roles = [
  { id: "selbststaendige", label: "Selbstständige", icon: Target, desc: "Ich führe mein eigenes Unternehmen" },
  { id: "angestellte", label: "Angestellte", icon: Briefcase, desc: "Ich arbeite in einem Unternehmen mit Führungsverantwortung" },
  { id: "senior_manager", label: "Senior Manager", icon: TrendingUp, desc: "Ich führe Teams und verantworte Bereiche" },
  { id: "high_potential", label: "High Potential", icon: User, desc: "Auf dem Weg zur Führungsrolle" },
  { id: "custom", label: "Andere Rolle", icon: Edit3, desc: "Ich beschreibe meine Rolle selbst" },
];

export default function UserForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user came from Google OAuth callback
  useEffect(() => {
    if (location.state?.user) {
      const user = location.state.user;
      setForm({
        name: user.name || "",
        email: user.email || ""
      });
      // Skip to step 1 (role selection) since we have name/email
    }
  }, [location.state]);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    if (roleId !== 'custom') {
      setTimeout(() => setStep(2), 200);
    }
  };

  const handleCustomRoleSubmit = () => {
    if (customRole.trim()) {
      setTimeout(() => setStep(2), 200);
    }
  };

  const handleGoogleLogin = () => {
    // Store current form state
    localStorage.setItem('wladhub_form_state', JSON.stringify({
      role: selectedRole,
      customRole: customRole
    }));
    
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim() || !form.email.trim()) {
      setError("Bitte fülle alle Felder aus.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API}/user/create`, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: selectedRole === 'custom' ? 'custom' : selectedRole,
        custom_role: selectedRole === 'custom' ? customRole : null,
        consent_privacy: true,
        consent_marketing: false
      });

      localStorage.setItem("emergent_user", JSON.stringify({
        session_id: res.data.session_id,
        name: res.data.name,
        email: res.data.email,
        role: selectedRole === 'custom' ? customRole : selectedRole,
      }));

      navigate("/quiz");
    } catch (err) {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
      setLoading(false);
    }
  };

  const displayRole = roles.find(r => r.id === selectedRole)?.label || customRole;

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-4 pt-20 pb-12" data-testid="user-form-page">
      {/* Background Effect */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-br from-amber-500/6 via-orange-500/4 to-transparent rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Back button */}
        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 font-inter text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück zur Rollenauswahl
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <div className="badge-amber px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Schritt {step} von 2
          </div>
          <h1 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-3">
            {step === 1 ? "Was beschreibt dich am besten?" : "Fast geschafft!"}
          </h1>
          <p className="font-inter text-slate-500">
            {step === 1
              ? "Deine Rolle bestimmt den Kontext deiner WLADHUB Diagnose. Alle 30 Fragen werden individuell auf dein Profil zugeschnitten."
              : "Damit wir deinen personalisierten Report erstellen können."}
          </p>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-3" data-testid="role-selection">
            {roles.map((role) => (
              <div key={role.id}>
                <button
                  data-testid={`role-option-${role.id}`}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group ${
                    selectedRole === role.id
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedRole === role.id 
                      ? "bg-amber-500/20 text-amber-400" 
                      : "bg-white/5 text-slate-500 group-hover:text-white"
                  }`}>
                    <role.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-manrope font-bold text-white mb-0.5">{role.label}</div>
                    <div className="font-inter text-sm text-slate-500">{role.desc}</div>
                  </div>
                  <ArrowRight className={`w-5 h-5 shrink-0 transition-all ${
                    selectedRole === role.id 
                      ? "text-amber-400 opacity-100" 
                      : "text-slate-600 opacity-0 group-hover:opacity-100"
                  }`} />
                </button>

                {/* Custom role input */}
                {role.id === 'custom' && selectedRole === 'custom' && (
                  <div className="mt-3 ml-16">
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="Beschreibe deine Rolle..."
                      className="w-full input-modern h-12 px-4 font-inter text-white placeholder:text-slate-600"
                      data-testid="custom-role-input"
                    />
                    {customRole.trim() && (
                      <button
                        onClick={handleCustomRoleSubmit}
                        className="mt-3 btn-amber px-6 py-2 text-sm font-medium"
                      >
                        Weiter
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Name & Email */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="user-info-form">
            {/* Selected role chip */}
            <div className="badge-amber px-4 py-2 inline-flex items-center gap-2">
              <span className="font-inter text-sm">
                {displayRole}
              </span>
            </div>

            {/* Main form: Name & Email */}
            <div className="glass-card p-6 space-y-5">
              <div>
                <label className="font-inter text-sm text-slate-400 mb-2 block">
                  Dein Name
                </label>
                <input
                  data-testid="input-name"
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Vorname Nachname"
                  className="w-full input-modern h-12 px-4 font-inter text-white placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="font-inter text-sm text-slate-400 mb-2 block">
                  E-Mail-Adresse
                </label>
                <input
                  data-testid="input-email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="deine@email.com"
                  className="w-full input-modern h-12 px-4 font-inter text-white placeholder:text-slate-600"
                />
                <p className="font-inter text-xs text-slate-600 mt-2">
                  Dein Report wird an diese Adresse gesendet.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3" data-testid="form-error">
                <p className="font-inter text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Primary CTA: Email submit */}
            <button
              data-testid="submit-user-form"
              type="submit"
              disabled={loading}
              className="w-full btn-amber py-4 font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="font-inter">Wird gespeichert...</span>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Diagnose starten</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="font-inter text-xs text-slate-600">oder</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Secondary: Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              data-testid="google-login-btn"
            >
              <GoogleIcon />
              <span className="font-inter text-sm text-slate-300">Mit Google fortfahren</span>
            </button>

            <p className="font-inter text-sm text-slate-600 text-center">
              30 Fragen · ca. 10 Minuten · Szenario-basiert
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
