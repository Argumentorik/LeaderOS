import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, MessageSquare, Users, Target, Lightbulb, Zap, Shield, Sparkles, Calendar, BookOpen, Video, Headphones, Award, Star, TrendingUp, Bot, Check, Lock, Rocket, X, ChevronRight, Play, CheckCircle2, Download } from "lucide-react";
import { generateRoadmapPDF } from "../utils/generatePDF";

const roleLabels = {
  communicator: "Kommunikation",
  manager: "Management",
  team_leader: "Team Leadership",
  psychologist: "Psychologische Führung",
  problem_solver: "Problemlösung",
  innovator: "Innovation & KI",
};

const courses = [
  { num: "01", icon: Brain, title: "AI Basics – Dein Startpunkt", desc: "Verstehe KI richtig und ordne es fur deine Fuhrung ein. Das Fundament fur alles Weitere.", color: "#C8FF00", tag: "KEY" },
  { num: "02", icon: MessageSquare, title: "Kommunikation & Argumentation", desc: "Uberzeuge in Meetings, Verhandlungen und Konflikten.", color: "#C8FF00" },
  { num: "03", icon: Target, title: "Management-Systeme", desc: "Eisenhower, ALPEN, Pareto, SMART – bewahrte Methoden.", color: "#C8FF00" },
  { num: "04", icon: Users, title: "Team Leadership & Delegation", desc: "Baue High-Performance-Teams auf.", color: "#C8FF00" },
  { num: "05", icon: Shield, title: "Psychologische Fuhrung", desc: "Empathie als Wettbewerbsvorteil.", color: "#C8FF00" },
  { num: "06", icon: Lightbulb, title: "Problemlosung & Entscheidung", desc: "Datengestutzte Entscheidungen unter Druck.", color: "#C8FF00" },
];

const journalPrompts = [
  "Was ist mein wichtigstes Leadership-Ziel für die nächsten 30 Tage?",
  "Welche KI-Tools nutze ich bereits – und welche will ich testen?",
  "In welcher Situation habe ich mich als Leader zuletzt unwohl gefühlt?",
  "Was würde ich tun, wenn ich keine Angst vor Fehlern hätte?",
  "Wer in meinem Umfeld fordert mich am meisten heraus – und warum?",
  "Welche Gewohnheit hält mich davon ab, mein volles Potential zu entfalten?",
];

const weeklyPlan = [
  {
    week: "01",
    title: "Awareness & Foundation",
    subtitle: "Dein Standort. Dein Startpunkt.",
    accent: "#C8FF00",
    gradient: "from-[#C8FF00]/[0.04] to-[#C8FF00]/[0.01]",
    borderGlow: "shadow-[#C8FF00]/5",
    icon: Brain,
    focus: "Selbstanalyse",
    items: [
      { task: "Baseline deiner 6 Fuhrungsdimensionen", agent: "Diagnose-Agent" },
      { task: "AI Basics: KI richtig verstehen & einordnen", agent: "Strategie-Agent" },
      { task: "Kommunikationsmuster identifizieren", agent: "Coach-Agent" },
      { task: "EQ-Selbstreflexion: Starken & Trigger", agent: "Simulations-Agent" },
    ],
    milestone: "Du weisst, wo du stehst – und wo die Hebel liegen."
  },
  {
    week: "02",
    title: "Skill Building & Methoden",
    subtitle: "Neue Werkzeuge. Erste Anwendung.",
    accent: "#C8FF00",
    gradient: "from-[#C8FF00]/[0.03] to-transparent",
    borderGlow: "shadow-[#C8FF00]/3",
    icon: Target,
    focus: "Methodenkompetenz",
    items: [
      { task: "KI-Entscheidungsframework implementieren", agent: "Strategie-Agent" },
      { task: "Boardroom-Rhetorik aufbauen", agent: "Coach-Agent" },
      { task: "Eisenhower + ALPEN + SMART anwenden", agent: "Task-Agent" },
      { task: "Aktives Zuhoren in 3 Gesprachen uben", agent: "Simulations-Agent" },
    ],
    milestone: "Du hast dein erstes Toolkit – und nutzt es bereits."
  },
  {
    week: "03",
    title: "Integration & Praxis",
    subtitle: "Theorie trifft Realitat.",
    accent: "#C8FF00",
    gradient: "from-[#C8FF00]/[0.03] to-transparent",
    borderGlow: "shadow-[#C8FF00]/3",
    icon: Zap,
    focus: "Praxistransfer",
    items: [
      { task: "KI + Rhetorik in einer Prasentation kombinieren", agent: "Coach-Agent" },
      { task: "SMART-Formel fur deine Quartalsziele", agent: "Task-Agent" },
      { task: "Schwierige Gesprache mit EQ-Framework", agent: "Simulations-Agent" },
      { task: "Feedback-Loop mit deinem Team starten", agent: "Community-Agent" },
    ],
    milestone: "Du wendest alles an – und dein Umfeld bemerkt den Unterschied."
  },
  {
    week: "04",
    title: "Strategic Dominance",
    subtitle: "Dein neues Level. Dein System.",
    accent: "#C8FF00",
    gradient: "from-[#C8FF00]/[0.04] to-[#C8FF00]/[0.01]",
    borderGlow: "shadow-[#C8FF00]/5",
    icon: Award,
    focus: "Leadership-Signatur",
    items: [
      { task: "30-Tage-Review: Fortschritt messen", agent: "Diagnose-Agent" },
      { task: "Leadership-Signatur definieren", agent: "Coach-Agent" },
      { task: "90-Tage-Plan mit Meilensteinen erstellen", agent: "Strategie-Agent" },
      { task: "Personal Brand scharfen & positionieren", agent: "Community-Agent" },
    ],
    milestone: "Du bist nicht mehr derselbe Leader wie vor 30 Tagen."
  },
];

const agentCards = [
  { icon: Brain, name: "Diagnose-Agent", desc: "Analysiert dein Profil & trackt Fortschritt", color: "#C8FF00" },
  { icon: Bot, name: "Coach-Agent", desc: "Persönliches Coaching, 24/7 verfügbar", color: "#C8FF00" },
  { icon: Target, name: "Task-Agent", desc: "Tägliche Aufgaben, angepasst an dein Level", color: "#C8FF00" },
  { icon: Users, name: "Simulations-Agent", desc: "Übe schwierige Gespräche & Szenarien", color: "#C8FF00" },
  { icon: Lightbulb, name: "Strategie-Agent", desc: "Frameworks, Playbooks & Entscheidungshilfen", color: "#C8FF00" },
  { icon: MessageSquare, name: "Community-Agent", desc: "Vernetzung & Austausch mit anderen Leadern", color: "#C8FF00" },
];

export default function Roadmap() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState(Array(6).fill(""));
  const [showWladBot, setShowWladBot] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const filledCount = entries.filter(e => e.trim()).length;

  // Dynamic: Read report results to personalize the plan
  const [weakestRole, setWeakestRole] = useState(null);
  const [strongestRole, setStrongestRole] = useState(null);
  const [userScore, setUserScore] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    try {
      const report = JSON.parse(localStorage.getItem("emergent_report") || "{}");
      const usr = JSON.parse(localStorage.getItem("emergent_user") || "{}");
      if (usr.name) setUserName(usr.name);
      if (report.avg_total) setUserScore(report.avg_total);

      // Use pre-computed strongest/weakest from backend
      if (report.weakest_role?.key) setWeakestRole(report.weakest_role.key);
      if (report.strongest_role?.key) setStrongestRole(report.strongest_role.key);

      // Fallback: compute from leadership_roles
      if (!report.weakest_role?.key && report.leadership_roles) {
        const sorted = Object.entries(report.leadership_roles).sort((a, b) => a[1] - b[1]);
        if (sorted.length > 0) {
          setWeakestRole(sorted[0][0]);
          setStrongestRole(sorted[sorted.length - 1][0]);
        }
      }
    } catch {
      // Non-critical: report data enhances UX but page works without it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEntry = (i, val) => {
    const next = [...entries];
    next[i] = val;
    setEntries(next);
    if (next.filter(e => e.trim()).length >= 6 && !showWladBot) {
      setTimeout(() => setShowWladBot(true), 500);
    }
  };

  // Popup only once per session, with 30s delay
  useEffect(() => {
    if (!showWladBot) return;
    const alreadyShown = sessionStorage.getItem("leaderos_popup_shown");
    if (alreadyShown) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem("leaderos_popup_shown", "true");
      setShowPopup(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [showWladBot]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24" data-testid="roadmap-page">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#C8FF00]/[0.02] rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-[#C8FF00]/[0.015] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        {/* Header — Personalized */}
        <div className="text-center mb-14">
          <div className="badge-lime px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" />
            {userName ? `${userName}, dein Weg zur Führungsstärke` : "Dein Weg zur Führungsstärke"}
          </div>
          <h1 className="font-manrope font-extrabold text-4xl md:text-5xl text-white mb-4" data-testid="roadmap-title">
            30 Tage zur <span className="text-gradient-lime">strategischen Dominanz</span>
          </h1>
          <p className="font-inter text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
            {userScore > 0 ? (
              <>Dein Score: <span className="text-white font-semibold">{userScore}%</span>. {userScore >= 70 ? "Stark — jetzt die letzten Prozente herausholen." : userScore >= 50 ? "Solide Basis — mit dem richtigen Plan wird daraus Exzellenz." : "Großes Wachstumspotenzial — genau dafür ist dieser Plan gemacht."}</>
            ) : (
              <>6 spezialisierte KI-Agenten. 6 Kurse. Persönliches Coaching.</>
            )}
          </p>
          {weakestRole && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C8FF00]/[0.06] border border-[#C8FF00]/15" data-testid="personalized-hint">
              <Sparkles className="w-4 h-4 text-[#C8FF00]" />
              <span className="font-inter text-sm text-[#C8FF00]/80">
                Dein Plan priorisiert <strong>{roleLabels[weakestRole] || weakestRole}</strong> – dein größtes Wachstumspotenzial
              </span>
            </div>
          )}

          {/* Download personalized 30-day plan */}
          <div className="mt-6 flex justify-center">
            <button
              data-testid="roadmap-download-pdf"
              onClick={() => {
                try {
                  const report = JSON.parse(localStorage.getItem("emergent_report") || "{}");
                  const usr = JSON.parse(localStorage.getItem("emergent_user") || "{}");
                  generateRoadmapPDF(report, usr, entries);
                } catch (err) {
                  console.error("Roadmap PDF error:", err);
                  alert("PDF-Fehler: " + err.message);
                }
              }}
              className="btn-secondary px-6 py-3 text-sm font-medium inline-flex items-center gap-2 hover:border-[#C8FF00]/30 transition-all"
            >
              <Download className="w-4 h-4" />
              30-Tage-Plan als PDF herunterladen
            </button>
          </div>
        </div>

        {/* Agent Ecosystem */}
        <div className="mb-14" data-testid="agent-ecosystem">
          <div className="flex items-center gap-3 mb-6">
            <Bot className="w-5 h-5 text-[#C8FF00]" />
            <h2 className="font-manrope font-bold text-xl text-white">Deine KI-Agenten</h2>
            <span className="px-2.5 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/15 text-[#C8FF00] text-[10px] font-bold">6 AGENTEN</span>
          </div>
          <p className="font-inter text-sm text-slate-500 mb-6">
            Jeder Agent ist auf einen Bereich deiner Führungsentwicklung spezialisiert. Zusammen bilden sie dein persönliches Leadership-System.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {agentCards.map((agent, i) => (
              <div key={i} className="glass-card-subtle p-4 hover-card group" data-testid={`agent-card-${i}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${agent.color}12` }}>
                    <agent.icon className="w-4 h-4" style={{ color: agent.color }} />
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: agent.color }} />
                </div>
                <div className="font-manrope font-bold text-sm text-white mb-1">{agent.name}</div>
                <div className="font-inter text-xs text-slate-500">{agent.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 30-TAGE WOCHENPLAN – HIGH LEVEL DESIGN ===== */}
        <div className="mb-14" data-testid="plan-section">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-[#C8FF00]" />
            <h2 className="font-manrope font-bold text-xl text-white">Dein 30-Tage-Fahrplan</h2>
          </div>
          <p className="font-inter text-sm text-slate-500 mb-8">4 Wochen. 4 Phasen. Von Awareness zur strategischen Dominanz.</p>

          {/* Week Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2" data-testid="week-tabs">
            {weeklyPlan.map((week, i) => (
              <button
                key={i}
                data-testid={`week-tab-${i}`}
                onClick={() => setActiveWeek(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${
                  activeWeek === i
                    ? "border-white/20 bg-white/[0.06] text-white"
                    : "border-white/5 bg-transparent text-slate-500 hover:text-slate-300 hover:border-white/10"
                }`}
              >
                <span className="font-manrope font-bold text-xs tracking-wider" style={{ color: activeWeek === i ? week.accent : undefined }}>
                  W{week.week}
                </span>
                <span className="hidden sm:inline">{week.title}</span>
              </button>
            ))}
          </div>

          {/* Active Week Card */}
          {weeklyPlan.map((week, i) => (
            activeWeek === i && (
              <div
                key={i}
                data-testid={`phase-${i}`}
                className={`rounded-2xl border border-white/8 bg-gradient-to-br ${week.gradient} backdrop-blur-sm overflow-hidden shadow-2xl ${week.borderGlow}`}
              >
                {/* Week Header */}
                <div className="p-6 md:p-8 border-b border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${week.accent}15` }}>
                        <week.icon className="w-6 h-6" style={{ color: week.accent }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-manrope text-xs font-bold tracking-widest" style={{ color: week.accent }}>WOCHE {week.week}</span>
                          {i === 3 && <Star className="w-3.5 h-3.5 text-[#C8FF00]" />}
                        </div>
                        <h3 className="font-manrope font-extrabold text-xl text-white">{week.title}</h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full border text-xs font-medium" style={{ borderColor: `${week.accent}30`, color: week.accent, backgroundColor: `${week.accent}08` }}>
                      {week.focus}
                    </span>
                  </div>
                  <p className="font-inter text-sm text-slate-400">{week.subtitle}</p>
                </div>

                {/* Tasks */}
                <div className="p-6 md:p-8 space-y-3">
                  {week.items.map((item, j) => (
                    <div
                      key={j}
                      className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${week.accent}10` }}>
                        <span className="font-manrope font-bold text-xs" style={{ color: week.accent }}>{j + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-inter text-sm text-white mb-1">{item.task}</div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: week.accent }} />
                          <span className="font-inter text-[10px] text-slate-500">{item.agent}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 mt-1" />
                    </div>
                  ))}
                </div>

                {/* Milestone */}
                <div className="px-6 md:px-8 pb-6 md:pb-8">
                  <div className="p-4 rounded-xl border border-dashed" style={{ borderColor: `${week.accent}25`, backgroundColor: `${week.accent}05` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4" style={{ color: week.accent }} />
                      <span className="font-manrope font-bold text-xs tracking-wider" style={{ color: week.accent }}>MEILENSTEIN</span>
                    </div>
                    <p className="font-inter text-sm text-slate-300">{week.milestone}</p>
                  </div>
                </div>
              </div>
            )
          ))}

          {/* Week Progress Indicator */}
          <div className="flex items-center gap-2 mt-6 justify-center">
            {weeklyPlan.map((week, i) => (
              <button
                key={i}
                onClick={() => setActiveWeek(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: activeWeek === i ? 32 : 12,
                  backgroundColor: activeWeek === i ? week.accent : "rgba(255,255,255,0.1)"
                }}
              />
            ))}
          </div>
        </div>

        {/* Special Events */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14" data-testid="special-events">
          <div className="glass-card p-5 border-l-2 border-[#C8FF00] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-[#C8FF00]" />
            </div>
            <div>
              <div className="font-manrope font-bold text-sm text-white">1:1 mit AI Experte</div>
              <div className="font-inter text-xs text-slate-500">Optionales persönliches Strategy-Gespräch</div>
            </div>
          </div>
          <div className="glass-card p-5 border-l-2 border-white/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <div className="font-manrope font-bold text-sm text-white">Live Events</div>
              <div className="font-inter text-xs text-slate-500">Workshops & Q&A Sessions</div>
            </div>
          </div>
          <div className="glass-card p-5 border-l-2 border-white/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <div className="font-manrope font-bold text-sm text-white">AI Guidance</div>
              <div className="font-inter text-xs text-slate-500">How to use AI – Schritt für Schritt</div>
            </div>
          </div>
        </div>

        {/* Interactive Journal – 6 Entries */}
        <div className="glass-card p-8 mb-14" data-testid="journal-section">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-[#C8FF00]" />
            <h2 className="font-manrope font-bold text-xl text-white">Dein Leadership-Journal</h2>
          </div>
          <p className="font-inter text-sm text-slate-500 mb-6">
            Beantworte diese 6 Reflexionsfragen ehrlich. Das ist dein Startpunkt für die Transformation.
          </p>
          <div className="space-y-4">
            {journalPrompts.map((prompt, i) => (
              <div key={i} data-testid={`journal-entry-${i}`}>
                <label className="font-inter text-sm text-slate-300 mb-2 block flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-xs font-bold" style={{ color: entries[i].trim() ? "#10B981" : "#64748B" }}>
                    {entries[i].trim() ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  {prompt}
                </label>
                <textarea
                  value={entries[i]}
                  onChange={e => handleEntry(i, e.target.value)}
                  placeholder="Schreib hier..."
                  rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] font-inter text-sm text-white placeholder:text-slate-600 focus:border-[#C8FF00]/20 focus:outline-none resize-none transition-colors"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-inter text-xs text-slate-500">{filledCount} / 6 beantwortet</span>
              <div className="h-1.5 flex-1 mx-4 rounded-full bg-white/[0.04]">
              <div className="h-full rounded-full bg-[#C8FF00] transition-all duration-500" style={{ width: `${(filledCount / 6) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* WladBot Motivation after 6 entries */}
        {showWladBot && (
          <div className="glass-card p-6 mb-14 border border-[#C8FF00]/10 bg-[#C8FF00]/[0.02]" data-testid="wladbot-motivation">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center shrink-0">
                <Bot className="w-6 h-6 text-[#C8FF00]" />
              </div>
              <div>
                <div className="font-manrope font-bold text-white mb-1">WladBot</div>
                <p className="font-inter text-sm text-slate-300 leading-relaxed mb-3">
                  Stark! Du hast dir die Zeit genommen und ehrlich reflektiert – das machen die wenigsten.
                  Jetzt kommt der spannende Teil: Nimm dir die nächsten 30 Tage und arbeite die Kurse durch.
                  Nicht perfekt, sondern konsequent. Jeden Tag ein kleiner Schritt. Die Transformation passiert nicht über Nacht – aber sie passiert, wenn du dranbleibst.
                </p>
                <p className="font-inter text-sm text-[#C8FF00]/80 font-medium">
                  Bereit, den nächsten Schritt zu machen? Die Kurse und die Community warten auf dich.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 8 Kurse */}
        <div className="mb-14" data-testid="courses-section">
          <h2 className="font-manrope font-bold text-xl text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#C8FF00]" />
            6 Kurse fur das Modern Leadership System
          </h2>
          <p className="font-inter text-sm text-slate-500 mb-8">AI Basics ist dein Startpunkt – dann baust du Schritt für Schritt auf.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course, i) => (
              <div key={i} className="glass-card-subtle p-5 hover-card flex gap-4 group" data-testid={`course-${i}`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${course.color}12` }}>
                  <course.icon className="w-5 h-5" style={{ color: course.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-inter text-[10px] font-bold tracking-wider" style={{ color: course.color }}>{course.num}</span>
                    {course.tag && <span className="px-2 py-0.5 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] text-[9px] font-bold">{course.tag}</span>}
                  </div>
                  <h3 className="font-manrope font-bold text-sm text-white mb-1">{course.title}</h3>
                  <p className="font-inter text-xs text-slate-500">{course.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA - blocked until journal complete */}
        <div className="text-center pt-6 border-t border-white/5">
          <h3 className="font-manrope font-bold text-xl text-white mb-3">
            Bereit für die strategische Dominanz?
          </h3>
          <p className="font-inter text-sm text-slate-500 mb-4 max-w-lg mx-auto">
            6 Kurse · 6 KI-Agenten · 1:1 Gespräch · Live Events · Community
          </p>
          <p className="font-inter text-xs text-[#C8FF00]/60 mb-6">
            Kostenlos testen – keine Zahlung notig
          </p>
          {filledCount < 6 ? (
            <div data-testid="journal-gate">
              <button disabled className="px-10 py-4 rounded-xl bg-white/5 border border-white/10 text-slate-500 font-manrope font-semibold text-base inline-flex items-center gap-3 cursor-not-allowed">
                <Lock className="w-5 h-5" />
                Beantworte zuerst alle 6 Journal-Fragen
              </button>
              <p className="font-inter text-xs text-slate-600 mt-3">Noch {6 - filledCount} Fragen offen</p>
            </div>
          ) : (
            <button
              data-testid="roadmap-cta-btn"
              onClick={() => navigate("/close")}
              className="btn-amber px-10 py-4 font-semibold text-base inline-flex items-center gap-3"
            >
              Jetzt Zugang freischalten
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Upsell Pop-Up – only once per session, 30s delay */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" data-testid="upsell-popup">
          <div className="w-full max-w-md glass-card p-8 relative border border-[#C8FF00]/15">
            <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" data-testid="popup-close">
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-7 h-7 text-[#C8FF00]" />
              </div>
              <h3 className="font-manrope font-extrabold text-xl text-white mb-2">Du bist bereit für mehr!</h3>
              <p className="font-inter text-sm text-slate-400">Schalte alle 12 Premium-Kurse, die Leader OS Plattform und alle 6 KI-Agenten frei.</p>
            </div>
            <div className="text-center mb-4">
              <div className="font-manrope font-extrabold text-3xl text-white">ab €997 / Jahr</div>
              <div className="font-inter text-xs text-slate-500">Leadership OS · 14 Tage Trial · Ratenzahlung möglich</div>
            </div>
            <button onClick={() => { setShowPopup(false); navigate("/close"); }}
              className="w-full py-4 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold flex items-center justify-center gap-2"
              data-testid="popup-cta"
            >
              Pakete ansehen <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => setShowPopup(false)} className="w-full py-3 mt-2 text-center font-inter text-xs text-slate-500 hover:text-slate-300 transition-colors" data-testid="popup-dismiss">
              Nein danke, ich bleibe beim kostenlosen Zugang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
