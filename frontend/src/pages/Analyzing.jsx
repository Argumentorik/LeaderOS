import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Brain, Shield, Target, Users, MessageSquare, Zap, TrendingUp, Lightbulb, Sparkles, Award } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const phases = [
  { icon: Brain, label: "KI-Kompetenz scannen", color: "#3B82F6" },
  { icon: MessageSquare, label: "Kommunikationsstärke messen", color: "#F59E0B" },
  { icon: Target, label: "Management-Effizienz analysieren", color: "#3B82F6" },
  { icon: Users, label: "Team-Leadership bewerten", color: "#10B981" },
  { icon: Shield, label: "Psychologische Führung prüfen", color: "#8B5CF6" },
  { icon: Lightbulb, label: "Problemlösungs-DNA erkennen", color: "#EC4899" },
  { icon: Zap, label: "Innovationspotential berechnen", color: "#F59E0B" },
  { icon: TrendingUp, label: "Strategische Dominanz bewerten", color: "#3B82F6" },
  { icon: Award, label: "Leadership-Profil erstellen", color: "#F59E0B" },
  { icon: Sparkles, label: "30-Tage-Plan generieren", color: "#10B981" },
];

export default function Analyzing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePhase, setActivePhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhase(prev => {
        if (prev < phases.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setProgress(((activePhase + 1) / phases.length) * 100);
  }, [activePhase]);

  useEffect(() => {
    const { answers, session_id } = location.state || {};
    if (!answers) { navigate("/quiz"); return; }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.post(`${API}/quiz/generate-report`, { session_id, answers });
        localStorage.setItem("emergent_report", JSON.stringify(res.data));
        navigate("/report");
      } catch (err) {
        setError("Report-Generierung fehlgeschlagen. Bitte versuche es erneut.");
      }
    }, 9000);
    return () => clearTimeout(timer);
  }, [location.state, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] via-[#050510] to-[#030303] flex items-center justify-center px-4" data-testid="analyzing-page">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/3 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/3 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Logo Pulse */}
        <div className="relative mx-auto mb-10 w-24 h-24">
          <div className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/10 border border-amber-500/30 flex items-center justify-center">
            <span className="font-manrope font-extrabold text-3xl text-white">W</span>
          </div>
        </div>

        <h1 className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-3" data-testid="analyzing-title">
          Dein Leadership-Profil wird erstellt
        </h1>
        <p className="font-inter text-sm text-slate-500 mb-10">
          10 Analyse-Dimensionen werden ausgewertet
        </p>

        {/* Progress Bar */}
        <div className="h-2 rounded-full bg-white/5 mb-10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 10 Phases Grid */}
        <div className="grid grid-cols-2 gap-3 mb-10" data-testid="analyzing-phases">
          {phases.map((phase, i) => {
            const isActive = i === activePhase;
            const isDone = i < activePhase;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                  isDone
                    ? "border-green-500/20 bg-green-500/5"
                    : isActive
                    ? "border-amber-500/30 bg-amber-500/5 scale-[1.02]"
                    : "border-white/5 bg-white/[0.01] opacity-40"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  isDone ? "bg-green-500/15" : isActive ? "bg-amber-500/15" : "bg-white/5"
                }`}>
                  <phase.icon className="w-4 h-4 transition-colors" style={{ color: isDone ? "#10B981" : isActive ? phase.color : "#334155" }} />
                </div>
                <span className={`font-inter text-xs leading-tight transition-colors ${
                  isDone ? "text-green-400" : isActive ? "text-white" : "text-slate-600"
                }`}>
                  {phase.label}
                </span>
                {isDone && <span className="ml-auto text-green-400 text-[10px]">✓</span>}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6">
            <p className="font-inter text-sm text-red-400">{error}</p>
            <button onClick={() => navigate("/quiz")} className="mt-3 font-inter text-sm text-amber-400 underline">
              Zurück zum Quiz
            </button>
          </div>
        )}

        <p className="font-inter text-xs text-slate-600">
          KI-gestützte Analyse · Powered by WLADHUB
        </p>
      </div>
    </div>
  );
}
