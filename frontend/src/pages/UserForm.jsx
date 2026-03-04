import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, User, Briefcase, TrendingUp, Target } from "lucide-react";
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
    <div className="min-h-screen bg-noir-bg flex items-center justify-center px-4 pt-20 pb-12" data-testid="user-form-page">
      {/* Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10">
          <span className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-blue-400 mb-3 block">
            Schritt 1 von 2
          </span>
          <h1 className="font-manrope font-black text-4xl md:text-5xl text-white mb-3">
            {step === 1 ? "Was beschreibt dich?" : "Dein Profil vervollständigen"}
          </h1>
          <p className="font-inter text-slate-500">
            {step === 1
              ? "Deine Rolle bestimmt den Kontext deiner Diagnose."
              : "Damit wir deinen personalisierten Report erstellen können."}
          </p>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-3 anim-fade" data-testid="role-selection">
            {roles.map((role) => (
              <button
                key={role.id}
                data-testid={`role-option-${role.id}`}
                onClick={() => handleRoleSelect(role.id)}
                className={`w-full flex items-center gap-4 p-5 border text-left transition-all duration-150 ${
                  selectedRole === role.id
                    ? "border-blue-500/50 bg-cold-dim"
                    : "border-white/8 bg-noir-surface hover:border-white/20 hover:bg-noir-highlight"
                }`}
              >
                <div className={`w-10 h-10 border flex items-center justify-center shrink-0 ${
                  selectedRole === role.id ? "border-blue-500/50 text-blue-400" : "border-white/10 text-slate-500"
                }`}>
                  <role.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-manrope font-bold text-sm text-white mb-0.5">{role.label}</div>
                  <div className="font-inter text-xs text-slate-500">{role.desc}</div>
                </div>
                <ArrowRight className={`w-4 h-4 transition-opacity ${selectedRole === role.id ? "text-blue-400 opacity-100" : "text-slate-600 opacity-0 group-hover:opacity-100"}`} />
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Name & Email */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5 anim-fade" data-testid="user-info-form">
            {/* Selected role */}
            <div className="flex items-center gap-3 p-4 border border-blue-500/20 bg-cold-dim">
              <span className="font-manrope text-xs text-blue-400 tracking-wider uppercase">
                {roles.find(r => r.id === selectedRole)?.label}
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="ml-auto font-inter text-xs text-slate-600 hover:text-white transition-colors"
              >
                Ändern
              </button>
            </div>

            <div>
              <label className="font-manrope text-xs font-medium tracking-[0.2em] uppercase text-slate-500 mb-2 block">
                Dein Name
              </label>
              <input
                data-testid="input-name"
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Vorname Nachname"
                className="w-full bg-noir-surface border border-white/10 text-white placeholder:text-slate-700 focus:border-white/30 focus:outline-none h-12 px-4 font-inter text-sm"
              />
            </div>

            <div>
              <label className="font-manrope text-xs font-medium tracking-[0.2em] uppercase text-slate-500 mb-2 block">
                E-Mail-Adresse
              </label>
              <input
                data-testid="input-email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="deine@email.com"
                className="w-full bg-noir-surface border border-white/10 text-white placeholder:text-slate-700 focus:border-white/30 focus:outline-none h-12 px-4 font-inter text-sm"
              />
              <p className="font-inter text-xs text-slate-600 mt-2">
                Dein Report wird an diese Adresse gesendet.
              </p>
            </div>

            {error && (
              <p className="font-inter text-sm text-red-400 border border-red-400/20 bg-red-400/5 px-4 py-3" data-testid="form-error">
                {error}
              </p>
            )}

            <button
              data-testid="submit-user-form"
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 font-manrope text-sm tracking-widest uppercase flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? "Wird gespeichert..." : (
                <>
                  Diagnose starten
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="font-inter text-xs text-slate-600 text-center">
              50 Szenarien · ca. 7 Minuten · Kostenlos & ohne Verpflichtung
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
