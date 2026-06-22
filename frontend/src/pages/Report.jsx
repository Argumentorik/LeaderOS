import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from "recharts";
import { ArrowRight, Clock, Zap, TrendingUp, Brain, MessageSquare, Sparkles, Star, Bot, CheckSquare, Users, BookOpen, Calendar, MessageCircle, Download, Award, Target, Shield, Lightbulb, UserCheck, Mail } from "lucide-react";
import { generateReportPDF } from "../utils/generatePDF";

const catLabels = {
  rhetorik: "Rhetorik",
  kritisches_denken: "Krit. Denken",
  entscheidung: "Entscheidung",
  fuehrung: "Führung",
  eq: "Strateg. EQ",
  strategie: "KI-Strategie",
};

const layerConfig = [
  { key: "ai_literacy", label: "KI-Kompetenz", subtitle: "Layer 1: AI Literacy", desc: "Nutzung von KI als strategischer Fuhrungshebel", color: "#C8FF00", narrativeKey: "ai_literacy_analysis" },
  { key: "rhetoric", label: "Boardroom-Rhetorik", subtitle: "Layer 2: Real-World Rhetoric", desc: "Autoritat, Uberzeugung und Boardroom-Prasenz", color: "#C8FF00", narrativeKey: "rhetoric_analysis" },
  { key: "strategic_eq", label: "Strategisches EQ", subtitle: "Layer 3: Strategic EQ", desc: "Empathie als Wettbewerbsvorteil und Autoritatssicherung", color: "#C8FF00", narrativeKey: "eq_analysis" },
];

const roleConfig = [
  { key: "communicator", label: "Kommunikator", icon: MessageSquare, color: "#C8FF00", desc: "Uberzeugungskraft & Klarheit" },
  { key: "manager", label: "Manager", icon: Target, color: "#94A3B8", desc: "Struktur & Produktivitat" },
  { key: "team_leader", label: "Team Leader", icon: Users, color: "#10B981", desc: "Motivation & Teamkultur" },
  { key: "psychologist", label: "Psychologe", icon: UserCheck, color: "#67E8F9", desc: "Empathie & Menschenverstandnis" },
  { key: "problem_solver", label: "Problemloser", icon: Lightbulb, color: "#F472B6", desc: "Entscheidung & Konfliktlosung" },
  { key: "innovator", label: "Innovator", icon: Sparkles, color: "#C8FF00", desc: "KI-Vorsprung & Sichtbarkeit" },
];

function ScoreRing({ score, color, size = 96 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s ease" }} />
      </svg>
      <span className="font-manrope font-bold text-xl text-white relative z-10">{score}%</span>
    </div>
  );
}

export default function Report() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [user, setUser] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("emergent_report");
    const rawUser = localStorage.getItem("emergent_user");
    if (!raw) { navigate("/"); return; }
    const data = JSON.parse(raw);
    setReport(data);
    if (rawUser) setUser(JSON.parse(rawUser));
    if (data.user) setUser(prev => ({ ...prev, ...data.user }));
    setTimeout(() => setEmailSent(true), 3000);
  }, [navigate, setReport, setUser, setEmailSent]);

  const leadership_roles = useMemo(() => report?.leadership_roles || {}, [report]);

  const weakestRoles = useMemo(() =>
    [...roleConfig]
      .sort((a, b) => (leadership_roles[a.key] ?? 50) - (leadership_roles[b.key] ?? 50))
      .slice(0, 3),
    [leadership_roles]
  );

  if (!report) return null;

  const { cat_scores = {}, layer_scores = {}, avg_total = 0, roi = {}, narrative = {}, strongest_role = {}, weakest_role = {} } = report;
  const displayUser = user || report.user || {};

  const radarData = Object.entries(catLabels).map(([key, label]) => ({
    subject: label, score: cat_scores[key] || 0, fullMark: 100,
  }));

  const scoreColor = avg_total >= 70 ? "#C8FF00" : avg_total >= 50 ? "#C8FF00" : "#EF4444";

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24" data-testid="report-page">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#C8FF00]/[0.02] rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-[#C8FF00]/[0.015] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        {/* Email notification */}
        {emailSent && displayUser?.email && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#C8FF00]/[0.04] border border-[#C8FF00]/10 animate-fade-in" data-testid="email-notification">
            <Mail className="w-4 h-4 text-[#C8FF00] shrink-0" />
            <span className="font-inter text-sm text-slate-400">
              Report wurde an <span className="text-white font-medium">{displayUser.email}</span> gesendet
            </span>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="badge-blue px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" />
              Dein Leader OS Leadership-Report
            </div>
            <h1 className="font-manrope font-extrabold text-4xl md:text-5xl text-white mb-2" data-testid="report-name">
              {displayUser?.name || "Leadership Report"}
            </h1>
            <p className="font-inter text-slate-500">{displayUser?.role}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div>
              <div className="font-inter text-sm text-slate-600 mb-2 text-right">Gesamtscore</div>
              <div className="font-manrope font-extrabold text-5xl md:text-6xl" style={{ color: scoreColor }} data-testid="report-total-score">
                {avg_total}%
              </div>
            </div>
            <button
              data-testid="report-download-pdf"
              onClick={() => {
                try {
                  generateReportPDF(report, displayUser);
                } catch (err) {
                  console.error("PDF generation error:", err);
                  alert("PDF-Fehler: " + err.message);
                }
              }}
              className="btn-secondary px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 hover:border-[#C8FF00]/30 transition-all"
            >
              <Download className="w-4 h-4" />
              Report herunterladen
            </button>
          </div>
        </div>

        {/* Profile Title Card */}
        {narrative.profile_title && (
          <div className="glass-card p-8 mb-10 card-glow-lime" data-testid="report-profile-title">
            <div className="badge-lime px-3 py-1.5 text-xs inline-flex items-center gap-2 mb-4">
              <Star className="w-3 h-3" />
              Dein Führungsprofil
            </div>
            <h2 className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-4">
              {narrative.profile_title}
            </h2>
            {narrative.executive_summary && (
              <p className="font-inter text-slate-300 leading-relaxed">{narrative.executive_summary}</p>
            )}
          </div>
        )}

        {/* Personal Response: PROOF that WladBot listened */}
        {report.user_challenge && (
          <div className="glass-card p-6 md:p-8 mb-10 border border-[#C8FF00]/15 bg-[#C8FF00]/[0.03]" data-testid="report-personal-response">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/[0.08] border border-[#C8FF00]/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-[#C8FF00]" />
              </div>
              <div className="flex-1">
                <div className="badge-lime px-3 py-1 text-xs inline-flex items-center gap-2 mb-3">
                  <MessageCircle className="w-3 h-3" />
                  Wlad hat dir zugehört
                </div>
                <div className="mb-4 pl-4 border-l-2 border-[#C8FF00]/30">
                  <p className="font-inter text-sm text-slate-400 italic leading-relaxed">
                    „{report.user_challenge}"
                  </p>
                </div>
                {narrative.personal_response && (
                  <p className="font-inter text-slate-200 leading-relaxed">
                    {narrative.personal_response}
                  </p>
                )}
                {!narrative.personal_response && narrative.urgency_message && (
                  <p className="font-inter text-slate-200 leading-relaxed">
                    {narrative.urgency_message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5 Leadership Roles */}
        {Object.keys(leadership_roles).length > 0 && (
          <div className="mb-10" data-testid="leadership-roles">
            <h3 className="font-manrope font-bold text-xl text-white mb-6 flex items-center gap-3">
              <Award className="w-5 h-5 text-[#C8FF00]" />
              Deine 6 Leadership-Rollen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roleConfig.map((role) => {
                const score = leadership_roles[role.key] || 0;
                const isStrongest = strongest_role?.key === role.key;
                const isWeakest = weakest_role?.key === role.key;
                return (
                  <div
                    key={role.key}
                    data-testid={`role-${role.key}`}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isStrongest
                        ? "border-green-500/30 bg-green-500/5"
                        : isWeakest
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-white/8 bg-white/[0.02]"
                    }`}
                  >
                    {isStrongest && (
                      <span className="absolute -top-2 right-3 px-2 py-0.5 text-[10px] font-bold bg-green-500 text-black rounded-full">TOP</span>
                    )}
                    {isWeakest && (
                      <span className="absolute -top-2 right-3 px-2 py-0.5 text-[10px] font-bold bg-red-500/80 text-white rounded-full">FOCUS</span>
                    )}
                    <role.icon className="w-5 h-5 mb-3" style={{ color: role.color }} />
                    <div className="font-manrope font-bold text-sm text-white mb-1">{role.label}</div>
                    <div className="font-inter text-[10px] text-slate-500 mb-3">{role.desc}</div>
                    <div className="h-1.5 rounded-full bg-white/5 mb-2">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, backgroundColor: role.color }} />
                    </div>
                    <div className="font-manrope font-bold text-lg" style={{ color: role.color }}>{score}%</div>
                  </div>
                );
              })}
            </div>

            {/* Strength & Gap Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {strongest_role?.label && (
                <div className="glass-card-subtle p-5 border-l-2 border-green-500">
                  <div className="font-inter text-xs text-green-400 mb-2 uppercase tracking-wider">Stärkste Rolle</div>
                  <p className="font-manrope font-bold text-white mb-1">{strongest_role.label} ({strongest_role.score}%)</p>
                  <p className="font-inter text-xs text-slate-400">Diese Rolle definiert deinen natürlichen Führungsstil und ist dein größter Hebel.</p>
                </div>
              )}
              {weakest_role?.label && (
                <div className="glass-card-subtle p-5 border-l-2 border-red-500/60">
                  <div className="font-inter text-xs text-red-400 mb-2 uppercase tracking-wider">Wachstumsbereich</div>
                  <p className="font-manrope font-bold text-white mb-1">{weakest_role.label} ({weakest_role.score}%)</p>
                  <p className="font-inter text-xs text-slate-400">Hier liegt dein größtes Upgrade-Potential. Dein 30-Tage-Plan fokussiert sich darauf.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3 Layer Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10" data-testid="report-layers">
          {layerConfig.map((layer) => {
            const score = layer_scores[layer.key] || 0;
            return (
              <div key={layer.key} className="feature-card p-6" data-testid={`layer-${layer.key}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-inter text-xs tracking-wider mb-1" style={{ color: layer.color }}>{layer.subtitle}</div>
                    <h3 className="font-manrope font-bold text-lg text-white">{layer.label}</h3>
                  </div>
                  <ScoreRing score={score} color={layer.color} size={64} />
                </div>
                <div className="h-1 rounded-full bg-white/5 mb-3">
                  <div className="h-full rounded-full layer-bar" style={{ width: `${score}%`, backgroundColor: layer.color }} />
                </div>
                <p className="font-inter text-xs text-slate-500 mb-3">{layer.desc}</p>
                {narrative[layer.narrativeKey] && (
                  <p className="font-inter text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">{narrative[layer.narrativeKey]}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Grid: Radar + ROI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="glass-card p-6" data-testid="report-radar-chart">
            <h3 className="font-manrope font-bold text-lg text-white mb-1">6-Dimensionen-Analyse</h3>
            <p className="font-inter text-sm text-slate-500 mb-6">Dein Führungsprofil im Überblick</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 11, fontFamily: "Inter" }} />
                  <Radar name="Score" dataKey="score" stroke="#C8FF00" fill="#C8FF00" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} itemStyle={{ color: "#ffffff", fontFamily: "Inter", fontSize: 12 }} formatter={(val) => [`${val}%`, "Score"]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {Object.entries(catLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="font-inter text-xs text-slate-500 w-24 shrink-0">{label}</span>
                    <div className="flex-1 h-1 rounded-full bg-white/[0.04]">
                    <div className="h-full rounded-full bg-[#C8FF00]" style={{ width: `${cat_scores[key] || 0}%` }} />
                  </div>
                  <span className="font-manrope text-xs font-bold text-white w-10 text-right">{cat_scores[key] || 0}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4" data-testid="report-roi">
            <div className="glass-card p-6">
              <h3 className="font-manrope font-bold text-lg text-white mb-1">Dein ROI-Potential</h3>
              <p className="font-inter text-sm text-slate-500 mb-6">Nach 30 Tagen im Programm</p>
              <div className="space-y-5">
                {[
                  { icon: Clock, value: `${roi.hours_saved}h`, label: "gesparte Stunden pro Woche", color: "#C8FF00" },
                  { icon: Zap, value: `${roi.decision_speed}x`, label: "schnellere Entscheidungen", color: "#C8FF00" },
                  { icon: TrendingUp, value: `+${roi.performance_boost}%`, label: "Team-Performance-Steigerung", color: "#C8FF00" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <div className="font-manrope font-extrabold text-2xl text-white">{item.value}</div>
                      <div className="font-inter text-xs text-slate-500">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {narrative.top_strength && (
              <div className="glass-card-subtle p-5 border-l-2 border-[#C8FF00]">
                <div className="font-inter text-xs text-[#C8FF00] mb-2 uppercase tracking-wider">Deine starkste Kompetenz</div>
                <p className="font-inter text-sm text-slate-300 leading-relaxed">{narrative.top_strength}</p>
              </div>
            )}
            {narrative.growth_priority && (
              <div className="glass-card-subtle p-5 border-l-2 border-white/20">
                <div className="font-inter text-xs text-slate-400 mb-2 uppercase tracking-wider">Wachstumsprioritat</div>
                <p className="font-inter text-sm text-slate-300 leading-relaxed">{narrative.growth_priority}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {(narrative.recommendation_1 || narrative.recommendation_2 || narrative.recommendation_3) && (
          <div className="glass-card p-8 mb-10" data-testid="report-recommendations">
            <h3 className="font-manrope font-bold text-xl text-white mb-6">Deine Top 3 Empfehlungen</h3>
            <div className="space-y-6">
              {[narrative.recommendation_1, narrative.recommendation_2, narrative.recommendation_3].map((rec, i) => (
                rec && (
                  <div key={i} className="flex gap-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-manrope font-bold ${
                      i === 2 ? "bg-[#C8FF00]/10 text-[#C8FF00]" : "bg-white/[0.04] text-white"
                    }`}>{i + 1}</div>
                    <div>
                      <h4 className="font-manrope font-bold text-white mb-1">{rec.title}</h4>
                      <p className="font-inter text-sm text-slate-400 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* AI Agent Ecosystem */}
        <div className="glass-card p-8 mb-10 card-glow-lime" data-testid="wladbot-platform">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="badge-lime px-3 py-1.5 text-xs inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-3 h-3" />
                6 KI-Agenten für deinen Aufstieg
              </div>
              <h3 className="font-manrope font-bold text-xl text-white mb-1">Dein Leadership-Ökosystem</h3>
              <p className="font-inter text-sm text-slate-500">Mehrere spezialisierte Agenten, die das Leben eines Leaders erleichtern</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Bot, title: "Coach-Agent", desc: "24/7 personliches Coaching", color: "#C8FF00" },
              { icon: CheckSquare, title: "Task-Agent", desc: "Tagliche Leadership-Aufgaben", color: "#C8FF00" },
              { icon: Users, title: "Simulations-Agent", desc: "Schwierige Gesprache uben", color: "#C8FF00" },
              { icon: BookOpen, title: "Strategie-Agent", desc: "Playbooks & Frameworks", color: "#C8FF00" },
              { icon: Calendar, title: "Event-Agent", desc: "Live-Sessions & Workshops", color: "#C8FF00" },
              { icon: MessageCircle, title: "Community-Agent", desc: "Vernetzung mit Leadern", color: "#C8FF00" },
            ].map((item, i) => (
              <div key={i} className="hub-card glass-card-subtle p-4 hover-card">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${item.color}15` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <h4 className="font-manrope font-semibold text-sm text-white mb-1">{item.title}</h4>
                <p className="font-inter text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 glass-card-subtle p-4">
            <span className="dot-pulse" />
            <span className="font-inter text-sm text-slate-400">
              Wlad ist dein persönlicher KI-Leadership-Coach — kennt dein Profil und deine Ziele
            </span>
          </div>
        </div>

        {/* Urgency */}
        {narrative.urgency_message && (
          <div className="glass-card-subtle p-5 mb-10 border-l-2 border-red-500" data-testid="report-urgency">
            <p className="font-inter text-sm text-slate-300 leading-relaxed">{narrative.urgency_message}</p>
          </div>
        )}

        {/* CREDO: Mastering the 5 Roles */}
        <div className="glass-card p-8 md:p-10 mb-10 text-center" data-testid="report-credo">
          <div className="badge-lime px-4 py-2 text-xs font-semibold inline-flex items-center gap-2 mb-6">
            <Shield className="w-3 h-3" />
            THE IDEAL LEADER
          </div>
          <h2 className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-6">
            Mastering the 6 Roles of the Ideal Leader
          </h2>
          <p className="font-inter text-slate-400 leading-relaxed mb-8 max-w-2xl mx-auto">
            Moderne Führung erfordert die Beherrschung aller sechs Rollen. Die 6. Rolle – der Innovator – befähigt dich, schneller zu lösen, gesehen zu werden und dir einen entscheidenden Vorteil auf dem Arbeitsmarkt zu schaffen.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {roleConfig.map((role) => (
              <div key={role.key} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02]">
                <role.icon className="w-4 h-4" style={{ color: role.color }} />
                <span className="font-inter text-sm text-white">{role.label}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8 max-w-lg mx-auto">
            <p className="font-inter text-slate-500 mb-3">Technisches Wissen schafft Experten.</p>
            <p className="font-manrope font-bold text-xl text-white">
              Leadership Mastery schafft <span className="text-gradient-lime">Impact.</span>
            </p>
          </div>
        </div>

        {/* Closing Statement */}
        {narrative.closing_statement && (
          <div className="text-center mb-12">
            <p className="font-manrope font-bold text-xl md:text-2xl text-white leading-relaxed max-w-2xl mx-auto">
              "{narrative.closing_statement}"
            </p>
          </div>
        )}

        {/* Personalized 30-Day Learning Plan */}
        <div className="glass-card p-8 md:p-10 mb-10" data-testid="report-30day-plan">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-[#C8FF00]" />
            <h3 className="font-manrope font-bold text-xl text-white">Dein persönlicher 30-Tage-Lernplan</h3>
          </div>
          <p className="font-inter text-sm text-slate-500 mb-6">
            Basierend auf deinem Profil – fokussiert auf dein größtes Wachstumspotenzial.
          </p>
          <div className="space-y-4">
            {weakestRoles.map((role, i) => (
                <div key={role.key} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${role.color}15` }}>
                    <span className="font-manrope font-bold text-sm" style={{ color: role.color }}>W{i + 1}</span>
                  </div>
                  <div>
                    <div className="font-manrope font-bold text-sm text-white mb-1">
                      {i === 0 ? "Priorität" : i === 1 ? "Aufbau" : "Vertiefung"}: {role.label}
                    </div>
                    <p className="font-inter text-xs text-slate-500">{role.desc} – Fokus-Woche mit täglichen Mikro-Aufgaben</p>
                  </div>
                </div>
              ))}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-[#C8FF00]/[0.03] border border-[#C8FF00]/10">
              <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center shrink-0">
                <span className="font-manrope font-bold text-sm text-[#C8FF00]">W4</span>
              </div>
              <div>
                <div className="font-manrope font-bold text-sm text-white mb-1">Strategic Dominance: Alles zusammenführen</div>
                <p className="font-inter text-xs text-slate-500">Leadership-Signatur definieren · 90-Tage-Plan erstellen · Review</p>
              </div>
            </div>
          </div>
        </div>

        {/* Book Upsell */}
        <div className="glass-card-subtle p-6 mb-10 flex flex-col sm:flex-row items-center gap-6 border border-[#C8FF00]/10" data-testid="report-book-upsell">
          <div className="w-20 h-28 rounded-lg bg-[#C8FF00]/[0.06] border border-[#C8FF00]/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-8 h-8 text-[#C8FF00]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="px-2.5 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] text-[10px] font-bold inline-block mb-2">GRATIS BELOHNUNG</div>
            <div className="font-manrope font-bold text-white mb-1">"Die 5 Rollen einer Führungskraft"</div>
            <div className="font-inter text-xs text-slate-500">von Wladislaw Jachtchenko · SPIEGEL-Bestseller</div>
          </div>
          <a
            href="https://www.remote-verlag.de/pages/5-rollen-fuehrungskraft"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 shrink-0"
          >
            <BookOpen className="w-4 h-4" /> Buch sichern
          </a>
        </div>

        {/* CTAs */}
        <div className="border-t border-white/5 pt-10" data-testid="report-ctas">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 border border-[#C8FF00]/15 bg-[#C8FF00]/[0.03] mb-4">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#C8FF00] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8FF00]" />
              </span>
              <span className="font-mono text-[11px] tracking-[0.2em] text-slate-400 font-medium uppercase">
                Klasse 0001 · noch <span className="text-[#C8FF00]">18 von 30</span> Plätzen frei
              </span>
            </div>
            <h3 className="font-manrope font-extrabold text-2xl text-white mb-2">
              Du weisst jetzt wo du stehst.
            </h3>
            <p className="font-inter text-sm text-slate-500 max-w-lg mx-auto">
              Sprint zuerst, immer. Plus-Plus wenn du Live mit Wlad willst.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto">
            <button
              data-testid="report-cta-roadmap"
              onClick={() => navigate("/roadmap")}
              className="flex-1 px-6 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-manrope font-bold hover:border-[#C8FF00]/30 hover:bg-white/[0.06] transition-all inline-flex items-center justify-center gap-2"
            >
              30-Tage-Plan ansehen
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              data-testid="report-cta-close"
              onClick={() => navigate("/close")}
              className="flex-1 px-6 py-4 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold hover:shadow-xl hover:shadow-[#C8FF00]/20 transition-all inline-flex items-center justify-center gap-2"
            >
              <span>Sprint sichern</span>
              <span>997 EUR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="font-inter text-xs text-slate-600 text-center mt-4">
            14 Tage Geld-zurück · 12 Monate Plattform · WladBot 24/7 · Zertifikat 0001
          </p>
        </div>
      </div>
    </div>
  );
}
