import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, User, Briefcase, TrendingUp, Target, ChevronLeft, Edit3, Mail, Shield, Lock, FileCheck } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const roles = [
  { id: "selbststaendige", label: "Selbstständige", icon: Target, desc: "Ich führe mein eigenes Unternehmen" },
  { id: "angestellte", label: "Angestellte", icon: Briefcase, desc: "Ich arbeite in einem Unternehmen mit Führungsverantwortung" },
  { id: "senior_manager", label: "Senior Manager", icon: TrendingUp, desc: "Ich führe Teams und verantworte Bereiche" },
  { id: "high_potential", label: "High Potential", icon: User, desc: "Auf dem Weg zur Führungsrolle" },
  { id: "custom", label: "Andere Rolle", icon: Edit3, desc: "Ich beschreibe meine Rolle selbst" },
];

export default function UserForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 pt-20 pb-12" data-testid="user-form-page">
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#C8FF00]/[0.03] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
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
          <div className="badge-lime px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]" />
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
                      ? "border-[#C8FF00]/30 bg-[#C8FF00]/[0.06]"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.03]"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedRole === role.id
                      ? "bg-[#C8FF00]/10 text-[#C8FF00]"
                      : "bg-white/[0.04] text-slate-500 group-hover:text-white"
                  }`}>
                    <role.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-manrope font-bold text-white mb-0.5">{role.label}</div>
                    <div className="font-inter text-sm text-slate-500">{role.desc}</div>
                  </div>
                  <ArrowRight className={`w-5 h-5 shrink-0 transition-all ${
                    selectedRole === role.id
                      ? "text-[#C8FF00] opacity-100"
                      : "text-slate-600 opacity-0 group-hover:opacity-100"
                  }`} />
                </button>

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
            <div className="badge-lime px-4 py-2 inline-flex items-center gap-2">
              <span className="font-inter text-sm">{displayRole}</span>
            </div>

            <div className="glass-card p-6 space-y-5">
              <div>
                <label className="font-inter text-sm text-slate-400 mb-2 block">Dein Name</label>
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
                <label className="font-inter text-sm text-slate-400 mb-2 block">E-Mail-Adresse</label>
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

            <p className="font-inter text-sm text-slate-600 text-center">
              30 Fragen · ca. 10 Minuten · Szenario-basiert
            </p>

            {/* DSGVO Trust Section */}
            <div className="glass-card-subtle p-5 space-y-4" data-testid="trust-section">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-manrope font-bold text-sm text-white">DSGVO-konform</p>
                  <p className="font-inter text-xs text-slate-500">Deine Daten werden nach EU-Datenschutzgrundverordnung verarbeitet</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-manrope font-bold text-sm text-white">SSL-verschlüsselt</p>
                  <p className="font-inter text-xs text-slate-500">256-Bit-Verschlüsselung für maximale Sicherheit</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-manrope font-bold text-sm text-white">Serverstandort Deutschland</p>
                  <p className="font-inter text-xs text-slate-500">Daten verlassen nicht die EU · Löschung jederzeit möglich</p>
                </div>
              </div>
              <div className="border-t border-white/5 pt-3 text-center">
                <p className="font-inter text-[10px] text-slate-600 leading-relaxed">
                  Mit dem Start der Diagnose erklärst du dich mit unserer Datenschutzerklärung einverstanden.
                  Deine Daten werden ausschließlich zur Erstellung deines Leadership-Reports verwendet
                  und niemals an Dritte weitergegeben. Du kannst die Löschung jederzeit anfordern.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
