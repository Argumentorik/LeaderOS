import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Brain, Shield, Target, Users, MessageSquare, Zap, TrendingUp, Lightbulb, Sparkles, Award } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const phases = [
  { icon: Brain, label: "KI im Alltag scannen", color: "#C8FF00" },
  { icon: MessageSquare, label: "Kommunikationsstarke messen", color: "#C8FF00" },
  { icon: Target, label: "Management-Effizienz analysieren", color: "#C8FF00" },
  { icon: Users, label: "Team-Leadership bewerten", color: "#C8FF00" },
  { icon: Shield, label: "Psychologische Führung prüfen", color: "#C8FF00" },
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
  const [retryCount, setRetryCount] = useState(0);
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
    // Answers come from navigation state — or, after a reload/crash of this
    // page, from the auto-saved quiz progress in localStorage.
    let { answers, session_id, chat_context } = location.state || {};
    if (!answers) {
      try {
        const saved = Object.values(JSON.parse(localStorage.getItem("quiz_answers") || "{}"));
        const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");
        if (saved.length > 0 && (user.session_id || user.user_id)) {
          answers = saved;
          session_id = user.session_id || user.user_id;
        }
      } catch { /* fall through */ }
    }
    if (!answers) {
      // Nothing to generate from — if a report already exists, go there.
      navigate(localStorage.getItem("emergent_report") ? "/report" : "/quiz");
      return;
    }

    const generateReport = async () => {
      try {
        const res = await axios.post(
          `${API}/quiz/generate-report`,
          { session_id, answers, chat_context: chat_context || null },
          { timeout: 90000 }
        );
        // Persist report + tokens FIRST, only then clear the quiz auto-save.
        localStorage.setItem("emergent_report", JSON.stringify(res.data));
        if (res.data?.report_token) {
          localStorage.setItem("leaderos_report_token", res.data.report_token);
        }
        if (res.data?.sync_token) {
          localStorage.setItem("leaderos_sync_token", res.data.sync_token);
        }
        localStorage.removeItem("quiz_answers");
        localStorage.removeItem("quiz_current");
        navigate("/report");
      } catch (err) {
        console.error("Report generation failed:", err);
        setError("Report-Generierung fehlgeschlagen. Deine Antworten sind gespeichert — du kannst es direkt erneut versuchen.");
      }
    };

    // Start API call after 3s animation delay (report generation runs while phases animate)
    const timer = setTimeout(generateReport, retryCount > 0 ? 300 : 3000);
    return () => clearTimeout(timer);
  }, [location.state, navigate, retryCount]);

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
        <p className="font-inter text-sm text-slate-500 mb-2">
          10 Analyse-Dimensionen · 6 KI-Agenten arbeiten für dich
        </p>
        <p className="font-inter text-xs text-slate-600 mb-8">
          Das kann bis zu ~60 Sekunden dauern · bitte bleib auf dieser Seite. Es geht automatisch weiter, sobald dein Report fertig ist.
        </p>

        {/* Leadership Quote */}
        <div className="glass-card-subtle p-5 mb-8 text-center" data-testid="leadership-quote">
          <p className="font-inter text-sm text-slate-300 italic leading-relaxed mb-2">
            &ldquo;{quote.text}&rdquo;
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

        {activePhase >= phases.length - 1 && !error && (
          <div className="flex items-center justify-center gap-2 mb-6" data-testid="analyzing-finalizing">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-[#C8FF00] analyzing-dot" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
            <span className="font-inter text-sm text-slate-400 ml-1">Fast geschafft · dein Report wird finalisiert</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6" data-testid="analyzing-error">
            <p className="font-inter text-sm text-red-400 mb-3">{error}</p>
            <div className="flex items-center justify-center gap-4">
              <button
                data-testid="analyzing-retry"
                onClick={() => { setError(null); setRetryCount(c => c + 1); }}
                className="px-5 py-2.5 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold text-sm hover:shadow-lg hover:shadow-[#C8FF00]/20 transition-all"
              >
                Erneut versuchen
              </button>
              <button
                data-testid="analyzing-back-to-quiz"
                onClick={() => navigate("/quiz")}
                className="font-inter text-sm text-slate-400 hover:text-white underline transition-colors"
              >
                Zurück zum Quiz
              </button>
            </div>
          </div>
        )}

        <p className="font-inter text-xs text-slate-600">
          KI-gestützte Analyse · Powered by Leader OS
        </p>
      </div>
    </div>
  );
}
