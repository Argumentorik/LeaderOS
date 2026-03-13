import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const phases = [
  "Analysiere Entscheidungsmuster...",
  "Evaluiere Kommunikationskompetenz...",
  "Berechne EQ-Profil...",
  "Analysiere KI-Literacy-Score...",
  "Bewerte Führungsdimensionen...",
  "Generiere Leadership-Diagnose...",
  "Erstelle personalisierten Report...",
  "Finalisiere 30-Tage-Fahrplan...",
];

export default function Analyzing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const { answers, session_id } = location.state || {};

    if (!answers || !session_id) {
      navigate("/quiz");
      return;
    }

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 92));
    }, 200);

    // Phase cycling
    const phaseInterval = setInterval(() => {
      setPhaseIdx(prev => (prev + 1) % phases.length);
    }, 1800);

    // API call
    const run = async () => {
      try {
        const res = await axios.post(`${API}/quiz/generate-report`, {
          session_id,
          answers,
        });

        const reportData = res.data;
        localStorage.setItem("emergent_report", JSON.stringify(reportData));

        // Send email in background
        try {
          await axios.post(`${API}/email/send-report`, { session_id });
        } catch (emailErr) {
          console.log("Email send skipped:", emailErr.message);
        }

        clearInterval(progressInterval);
        clearInterval(phaseInterval);
        setProgress(100);

        setTimeout(() => navigate("/report"), 600);
      } catch (err) {
        clearInterval(progressInterval);
        clearInterval(phaseInterval);
        setError("Fehler bei der Analyse. Bitte versuche es erneut.");
        console.error(err);
      }
    };

    run();

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
    };
  }, [navigate, location.state]);

  return (
    <div
      className="min-h-screen bg-[#030303] flex flex-col items-center justify-center px-4"
      data-testid="analyzing-page"
    >
      {/* Glow effects */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/4 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Logo mark */}
        <div className="mb-12 flex justify-center">
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl border border-blue-500/5 animate-ping" style={{ animationDuration: "2s" }} />
            <span className="font-manrope font-extrabold text-2xl text-white tracking-[0.2em]">W</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-3" data-testid="analyzing-title">
          Analyse läuft
        </h1>
        <p className="font-inter text-slate-500 mb-10">
          Wir erstellen deinen personalisierten Leadership-Report
        </p>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between font-inter text-sm text-slate-600 mb-3">
            <span>Fortschritt</span>
            <span data-testid="analyzing-progress">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 w-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current phase */}
        <div
          className="h-8 flex items-center justify-center"
          data-testid="analyzing-phase"
        >
          {!error ? (
            <p className="font-inter text-sm text-blue-400 transition-all duration-500">
              {phases[phaseIdx]}
            </p>
          ) : (
            <div className="text-center">
              <p className="font-inter text-sm text-red-400 mb-4">{error}</p>
              <button
                onClick={() => navigate("/quiz")}
                className="btn-secondary px-6 py-2.5 font-medium"
              >
                Zurück zum Quiz
              </button>
            </div>
          )}
        </div>

        {/* Dots */}
        {!error && (
          <div className="flex items-center justify-center gap-3 mt-10">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="analyzing-dot w-2 h-2 rounded-full bg-blue-500"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
