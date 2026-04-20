import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Brain, Shield, Target, Users, MessageSquare, Zap, TrendingUp, Lightbulb, Sparkles, Award } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const phases = [
  { icon: Brain, label: "KI-Kompetenz scannen", color: "#C8FF00" },
  { icon: MessageSquare, label: "Kommunikationsstarke messen", color: "#C8FF00" },
  { icon: Target, label: "Management-Effizienz analysieren", color: "#C8FF00" },
  { icon: Users, label: "Team-Leadership bewerten", color: "#C8FF00" },
  { icon: Shield, label: "Psychologische Fuhrung prufen", color: "#C8FF00" },
  { icon: Lightbulb, label: "Problemlosungs-DNA erkennen", color: "#C8FF00" },
  { icon: Zap, label: "Innovationspotential berechnen", color: "#C8FF00" },
  { icon: TrendingUp, label: "Strategische Dominanz bewerten", color: "#C8FF00" },
  { icon: Award, label: "Leadership-Profil erstellen", color: "#C8FF00" },
  { icon: Sparkles, label: "30-Tage-Plan generieren", color: "#C8FF00" },
];

const leaderQuotes = [
  { text: "Die Aufgabe der Führung ist es, mehr Leader zu schaffen, nicht mehr Follower.", author: "Ralph Nader" },
  { text: "Ein Leader ist am besten, wenn die Menschen kaum wissen, dass er existiert.", author: "Laozi" },
  { text: "Innovation unterscheidet einen Leader von einem Follower.", author: "Steve Jobs" },
  { text: "Bevor du andere führst, lerne dich selbst zu führen.", author: "Peter Drucker" },
  { text: "Die Kunst der Führung besteht darin, Nein zu sagen. Nicht Ja.", author: "Tony Blair" },
  { text: "Wer andere kennt, ist klug. Wer sich selbst kennt, ist weise.", author: "Laozi" },
  { text: "Führung ist nicht Titel, Position oder Organigramm. Es ist Einfluss.", author: "John C. Maxwell" },
  { text: "Die besten Leader sind die, die bereit sind, die härtesten Entscheidungen zu treffen.", author: "Colin Powell" },
];

export default function Analyzing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePhase, setActivePhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [quote] = useState(() => leaderQuotes[Math.floor(Math.random() * leaderQuotes.length)]);

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

    const generateReport = async () => {
      try {
        const res = await axios.post(`${API}/quiz/generate-report`, { session_id, answers }, { timeout: 60000 });
        localStorage.setItem("emergent_report", JSON.stringify(res.data));
        navigate("/report");
      } catch (err) {
        console.error("Report generation failed:", err);
        setError("Report-Generierung fehlgeschlagen. Bitte versuche es erneut.");
      }
    };

    // Start API call after 3s animation delay (report generation runs while phases animate)
    const timer = setTimeout(generateReport, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4" data-testid="analyzing-page">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#C8FF00]/[0.02] rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#C8FF00]/[0.015] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Logo Pulse */}
        <div className="relative mx-auto mb-8 w-20 h-20">
          <div className="absolute inset-0 rounded-2xl bg-[#C8FF00]/15 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="relative w-20 h-20 rounded-2xl bg-[#C8FF00]/[0.08] border border-[#C8FF00]/20 flex items-center justify-center">
            <span className="font-manrope font-extrabold text-3xl text-[#C8FF00]">W</span>
          </div>
        </div>

        <h1 className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-3" data-testid="analyzing-title">
          Dein Leadership-Profil wird erstellt
        </h1>
        <p className="font-inter text-sm text-slate-500 mb-8">
          10 Analyse-Dimensionen · 6 KI-Agenten arbeiten für dich
        </p>

        {/* Leadership Quote */}
        <div className="glass-card-subtle p-5 mb-8 text-center" data-testid="leadership-quote">
          <p className="font-inter text-sm text-slate-300 italic leading-relaxed mb-2">
            "{quote.text}"
          </p>
          <p className="font-inter text-xs text-slate-500">— {quote.author}</p>
        </div>

        {/* Progress Bar */}
        <div className="h-2 rounded-full bg-white/[0.04] mb-8 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#C8FF00] transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 10 Phases Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8" data-testid="analyzing-phases">
          {phases.map((phase, i) => {
            const isActive = i === activePhase;
            const isDone = i < activePhase;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                  isDone
                    ? "border-[#C8FF00]/20 bg-[#C8FF00]/[0.04]"
                    : isActive
                    ? "border-[#C8FF00]/25 bg-[#C8FF00]/[0.06] scale-[1.02]"
                    : "border-white/[0.04] bg-white/[0.01] opacity-40"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  isDone ? "bg-[#C8FF00]/10" : isActive ? "bg-[#C8FF00]/10" : "bg-white/[0.04]"
                }`}>
                  <phase.icon className="w-4 h-4 transition-colors" style={{ color: isDone ? "#C8FF00" : isActive ? phase.color : "#334155" }} />
                </div>
                <span className={`font-inter text-xs leading-tight transition-colors ${
                  isDone ? "text-[#C8FF00]" : isActive ? "text-white" : "text-slate-600"
                }`}>
                  {phase.label}
                </span>
                {isDone && <span className="ml-auto text-[#C8FF00] text-[10px]">&#10003;</span>}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6">
            <p className="font-inter text-sm text-red-400">{error}</p>
            <button onClick={() => navigate("/quiz")} className="mt-3 font-inter text-sm text-[#C8FF00] underline">
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
