import { useState, useEffect, useMemo } from 'react';
import { WladMark } from '../brand/WladMark';

/**
 * Premium immersive AI loading screen ("our agents are working").
 * - Sequential agent status feed with done/active/pending states
 * - Typewriter micro-status, pulsing core, orbital rings, rotating Wlad quote
 * - Per-flow presets (`flow` prop) OR custom `agents` override
 *
 * Props:
 *   isOpen     — bool
 *   flow       — 'checkin' | 'challenge' | 'challenger' | 'video' | 'diagnosis' | 'report' | 'generic'
 *   title      — override headline (optional)
 *   de         — language (default true)
 *   agents     — optional array of {name, status} to fully override preset
 *   stepDuration — ms per agent (default 2200)
 */

const QUOTES = [
  { q: 'Wer Menschen bewegen will, muss zuerst sich selbst bewegen.', a: 'Wlad Jachtchenko' },
  { q: 'Kommunikation ist die wichtigste Führungsqualität.', a: 'Wlad Jachtchenko' },
  { q: 'Die Zukunft gehört denen, die die Möglichkeiten sehen, bevor sie offensichtlich werden.', a: 'John Sculley' },
  { q: 'Innovation unterscheidet Leader von Followern.', a: 'Steve Jobs' },
  { q: 'Nicht weil es schwer ist, wagen wir es nicht — weil wir es nicht wagen, ist es schwer.', a: 'Seneca' },
  { q: 'Ein guter Führer zeigt den Weg, indem er ihn geht.', a: 'Wlad Jachtchenko' },
  { q: 'Fragen sind die Antwort. Aktives Zuhören ist die Superkraft.', a: 'Wlad Jachtchenko' },
];

const FLOWS_DE = {
  checkin: {
    title: 'Dein Check-in wird analysiert',
    agents: [
      { name: 'Kontext-Agent', status: 'Deine Check-in Historie wird gelesen' },
      { name: 'Wlad-Methodik Engine', status: 'Passende Frameworks werden gewählt (SEXIER, SBI)' },
      { name: 'Emotions-Analyse', status: 'Dein mentaler Zustand wird erfasst' },
      { name: 'Personalisierungs-Agent', status: 'Mikro-Tipp für morgen wird generiert' },
      { name: 'Scoring-Agent', status: 'XP-Impact wird berechnet' },
    ],
  },
  challenge: {
    title: 'Deine Antworten werden bewertet',
    agents: [
      { name: 'Profil-Analyse Agent', status: 'Deine Leadership-Daten werden analysiert' },
      { name: 'Wlad-Methodik Engine', status: 'Frameworks werden angewendet' },
      { name: 'Antwort-Auswertung', status: 'Tiefe und Qualität deiner Reflexion' },
      { name: 'Scoring-Agent', status: 'Bewertung wird kalkuliert' },
      { name: 'Report-Generator', status: 'Dein Tages-Report wird finalisiert' },
    ],
  },
  challenger: {
    title: 'Interview wird vorbereitet',
    agents: [
      { name: 'Character-Engine', status: 'Persönlichkeit des Leaders wird geladen' },
      { name: 'Wlad-Methodik Engine', status: 'Interview-Strategie wird festgelegt' },
      { name: 'Frage-Generator', status: 'Erste Frage wird formuliert' },
      { name: 'Live-Session', status: 'Verbindung wird aufgebaut' },
    ],
    duration: 1500,
  },
  video: {
    title: 'Deine Rede wird analysiert',
    agents: [
      { name: 'Whisper-Agent', status: 'Audio wird in Text transkribiert' },
      { name: 'Kontext-Agent', status: 'Deine bisherigen Versuche werden geladen' },
      { name: 'Rhetorik-Analyse', status: 'SEXIER-Modell: Statement, Explanation, eXample, Impact, Rebuttal' },
      { name: 'Sprach-Analyse', status: 'Füllwörter, Tempo, Schlüsselphrasen' },
      { name: 'Wlad-Assessment', status: 'Persönliches Feedback wird erstellt' },
      { name: 'Report-Generator', status: 'Übungs-Plan wird generiert' },
    ],
    duration: 2500,
  },
  diagnosis: {
    title: 'WladHub-Diagnose wird geladen',
    agents: [
      { name: 'Supabase-Sync', status: 'Deine Diagnose wird abgerufen' },
      { name: '3-Layer Analyse', status: 'KI-Reifegrad, Rhetorik, EQ' },
      { name: 'Composite-Score', status: 'Gesamtbewertung wird berechnet' },
      { name: 'Action-Plan Agent', status: 'Personalisierte Empfehlungen' },
    ],
  },
  report: {
    title: 'PDF-Report wird generiert',
    agents: [
      { name: 'Daten-Sammler', status: 'Deine Session-Daten werden geladen' },
      { name: 'Wlad-Methodik Engine', status: 'Frameworks werden angewendet' },
      { name: 'Pro-Level Writer', status: '5-Seiten Report wird verfasst' },
      { name: 'PDF-Renderer', status: 'Dokument wird gestaltet' },
    ],
  },
  generic: {
    title: 'KI-Agenten arbeiten für dich',
    agents: [
      { name: 'Profil-Analyse Agent', status: 'Deine Daten werden analysiert' },
      { name: 'Wlad-Methodik Engine', status: 'Frameworks werden angewendet' },
      { name: 'Personalisierungs-Agent', status: 'Ergebnisse werden zugeschnitten' },
      { name: 'Scoring-Agent', status: 'Bewertung wird kalkuliert' },
    ],
  },
};

const FLOWS_EN = {
  checkin: {
    title: 'Analyzing your check-in',
    agents: [
      { name: 'Context Agent', status: 'Reading your check-in history' },
      { name: 'Wlad Methodology Engine', status: 'Selecting relevant frameworks' },
      { name: 'Emotion Analyzer', status: 'Capturing your mental state' },
      { name: 'Personalization Agent', status: 'Generating a micro-tip for tomorrow' },
      { name: 'Scoring Agent', status: 'Calculating XP impact' },
    ],
  },
  challenge: {
    title: 'Evaluating your answers',
    agents: [
      { name: 'Profile Analysis Agent', status: 'Analyzing your leadership data' },
      { name: 'Wlad Methodology Engine', status: 'Applying frameworks' },
      { name: 'Answer Evaluator', status: 'Assessing depth and quality' },
      { name: 'Scoring Agent', status: 'Calculating score' },
      { name: 'Report Generator', status: 'Finalizing your report' },
    ],
  },
  challenger: {
    title: 'Preparing your interview',
    agents: [
      { name: 'Character Engine', status: 'Loading leader persona' },
      { name: 'Wlad Methodology Engine', status: 'Setting interview strategy' },
      { name: 'Question Generator', status: 'Crafting opening question' },
      { name: 'Live Session', status: 'Establishing connection' },
    ],
    duration: 1500,
  },
  video: {
    title: 'Analyzing your speech',
    agents: [
      { name: 'Whisper Agent', status: 'Transcribing audio to text' },
      { name: 'Context Agent', status: 'Loading previous attempts' },
      { name: 'Rhetoric Analysis', status: 'SEXIER model: statement, explanation, example, impact, rebuttal' },
      { name: 'Speech Analysis', status: 'Filler words, pace, key phrases' },
      { name: 'Wlad Assessment', status: 'Crafting personal feedback' },
      { name: 'Report Generator', status: 'Generating practice plan' },
    ],
    duration: 2500,
  },
  diagnosis: {
    title: 'Loading WladHub diagnosis',
    agents: [
      { name: 'Supabase Sync', status: 'Fetching your diagnosis' },
      { name: '3-Layer Analysis', status: 'AI maturity, Rhetoric, EQ' },
      { name: 'Composite Score', status: 'Computing overall score' },
      { name: 'Action Plan Agent', status: 'Personalized recommendations' },
    ],
  },
  report: {
    title: 'Generating PDF report',
    agents: [
      { name: 'Data Collector', status: 'Loading your session data' },
      { name: 'Wlad Methodology Engine', status: 'Applying frameworks' },
      { name: 'Pro-Level Writer', status: 'Drafting 5-page report' },
      { name: 'PDF Renderer', status: 'Designing document' },
    ],
  },
  generic: {
    title: 'AI agents working for you',
    agents: [
      { name: 'Profile Analysis Agent', status: 'Analyzing your data' },
      { name: 'Wlad Methodology Engine', status: 'Applying frameworks' },
      { name: 'Personalization Agent', status: 'Tailoring results' },
      { name: 'Scoring Agent', status: 'Calculating' },
    ],
  },
};

export function LoadingOverlay({
  isOpen,
  flow = 'generic',
  title,
  de = true,
  agents: customAgents,
  stepDuration,
  progressLabel,
  minAgent = 0,
}) {
  const preset = (de ? FLOWS_DE : FLOWS_EN)[flow] || (de ? FLOWS_DE : FLOWS_EN).generic;
  const agents = customAgents || preset.agents;
  const resolvedTitle = title || preset.title;
  const duration = stepDuration || preset.duration || 2200;

  const [activeAgent, setActiveAgent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  useEffect(() => {
    if (!isOpen) { setActiveAgent(0); setElapsed(0); return; }
    const t0 = Date.now();
    const stepInt = setInterval(
      () => setActiveAgent(s => Math.min(agents.length - 1, s + 1)),
      duration,
    );
    const tickInt = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => { clearInterval(stepInt); clearInterval(tickInt); };
  }, [isOpen, agents.length, duration]);

  if (!isOpen) return null;

  const shownAgent = Math.max(activeAgent, Math.min(minAgent, agents.length - 1));
  const completedCount = shownAgent;
  const progressPct = Math.min(100, Math.round(((completedCount + 0.5) / agents.length) * 100));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0A]/95 backdrop-blur-xl animate-fade-in"
      data-testid="loading-overlay"
    >
      {/* Orbital rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[520px] h-[520px] rounded-full border border-white/[0.04] animate-orbit" />
        <div
          className="absolute w-[360px] h-[360px] rounded-full border border-[#BFFF00]/[0.08] animate-orbit"
          style={{ animationDuration: '15s', animationDirection: 'reverse' }}
        />
        <div className="absolute w-[220px] h-[220px] rounded-full bg-[#BFFF00]/5 blur-3xl animate-breathe" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4 text-center space-y-7">
        {/* Pulsing WladMark core */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#BFFF00]/40 to-[#9ACC00]/30 opacity-60 blur-2xl animate-breathe" />
          <div className="relative animate-breathe">
            <WladMark size={84} animated />
          </div>
        </div>

        {/* Title + live elapsed */}
        <div className="space-y-1">
          <h3 className="text-[15px] font-bold text-white/90 tracking-tight">{resolvedTitle}</h3>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
            {de ? 'Läuft seit' : 'Running for'} · {elapsed}s
          </p>
          {progressLabel && (
            <p className="text-[12px] font-semibold text-[#BFFF00]" data-testid="loading-overlay-progress">{progressLabel}</p>
          )}
        </div>

        {/* Thin progress line */}
        <div className="px-2">
          <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Agent status feed */}
        <div className="space-y-1.5">
          {agents.map((agent, i) => {
            const done = i < shownAgent;
            const active = i === shownAgent;
            return (
              <div
                key={agent.name}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                  done
                    ? 'bg-emerald-500/[0.06] border border-emerald-500/15'
                    : active
                    ? 'bg-[#BFFF00]/[0.08] border border-[#BFFF00]/25 shadow-lg shadow-[#BFFF00]/10'
                    : 'bg-white/[0.02] border border-white/[0.03] opacity-35'
                }`}
                data-testid={`loading-agent-${i}`}
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                    done
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : active
                      ? 'bg-[#BFFF00]/20 text-[#BFFF00]'
                      : 'bg-white/5 text-white/25'
                  }`}
                >
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : active ? (
                    <div className="w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p
                    className={`text-[11.5px] font-semibold truncate ${
                      done ? 'text-emerald-400/85' : active ? 'text-white/90' : 'text-white/25'
                    }`}
                  >
                    {agent.name}
                  </p>
                  <p
                    className={`text-[10px] truncate ${
                      done ? 'text-emerald-400/50' : active ? 'text-[#BFFF00]/65' : 'text-white/15'
                    }`}
                  >
                    {agent.status}
                  </p>
                </div>
                {active && (
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map(d => (
                      <div
                        key={d}
                        className="w-1 h-1 rounded-full bg-[#BFFF00] typing-dot"
                        style={{ animationDelay: `${d * 120}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rotating quote */}
        <div className="px-4 pt-1">
          <p className="text-[12px] text-white/35 italic leading-relaxed">"{quote.q}"</p>
          <p className="text-[10px] text-white/20 mt-1">— {quote.a}</p>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;
