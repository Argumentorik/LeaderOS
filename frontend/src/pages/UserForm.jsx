import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, User, Briefcase, TrendingUp, Target, ChevronLeft } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const roles = [
  { id: "gründer", label: "Gründer / CEO", icon: Target, desc: "Ich führe mein eigenes Unternehmen" },
  { id: "c-level", label: "C-Level Executive", icon: Briefcase, desc: "CFO, COO, CMO, CTO oder ähnlich" },
  { id: "senior-manager", label: "Senior Manager", icon: TrendingUp, desc: "Ich führe Teams und Projekte" },
  { id: "investor", label: "Investor", icon: TrendingUp, desc: "Ich investiere in Unternehmen und Leader" },
  { id: "high-potential", label: "High-Potential", icon: User, desc: "Auf dem Weg zur Führungsrolle (28-40)" },
];

export default function UserForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setTimeout(() => setStep(2), 200);
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
        role: selectedRole,
      });

      localStorage.setItem("emergent_user", JSON.stringify({
        session_id: res.data.session_id,
        name: res.data.name,
        email: res.data.email,
        role: selectedRole,
      }));

      navigate("/quiz");
    } catch (err) {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-4 pt-20 pb-12" data-testid="user-form-page">
      {/* Background Effect */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

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
          <div className="badge-blue px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Schritt {step} von 2
          </div>
          <h1 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-3">
            {step === 1 ? "Was beschreibt dich?" : "Fast geschafft!"}
          </h1>
          <p className="font-inter text-slate-500">
            {step === 1
              ? "Deine Rolle bestimmt den Kontext deiner WLADHUB Diagnose."
              : "Damit wir deinen personalisierten Report erstellen können."}
          </p>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-3" data-testid="role-selection">
            {roles.map((role) => (
              <button
                key={role.id}
                data-testid={`role-option-${role.id}`}
                onClick={() => handleRoleSelect(role.id)}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group ${
                  selectedRole === role.id
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  selectedRole === role.id 
                    ? "bg-blue-500/20 text-blue-400" 
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
                    ? "text-blue-400 opacity-100" 
                    : "text-slate-600 opacity-0 group-hover:opacity-100"
                }`} />
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Name & Email */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="user-info-form">
            {/* Selected role chip */}
            <div className="badge-blue px-4 py-2 inline-flex items-center gap-2">
              <span className="font-inter text-sm">
                {roles.find(r => r.id === selectedRole)?.label}
              </span>
            </div>

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

            <button
              data-testid="submit-user-form"
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="font-inter">Wird gespeichert...</span>
              ) : (
                <>
                  <span>Diagnose starten</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="font-inter text-sm text-slate-600 text-center">
              50 Szenarien · ca. 7 Minuten · Kostenlos
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
