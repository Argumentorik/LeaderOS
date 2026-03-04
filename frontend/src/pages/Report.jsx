import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from "recharts";
import { ArrowRight, Clock, Zap, TrendingUp, Brain, MessageSquare, Star, ChevronDown } from "lucide-react";

const catLabels = {
  rhetorik: "Rhetorik",
  kritisches_denken: "Krit. Denken",
  entscheidung: "Entscheidung",
  fuehrung: "Führung",
  eq: "Strateg. EQ",
  strategie: "KI-Strategie",
};

const layerConfig = [
  {
    key: "ai_literacy",
    label: "KI-Kompetenz",
    subtitle: "Layer 1: AI Literacy",
    desc: "Nutzung von KI als strategischer Führungshebel",
    color: "#3B82F6",
    bg: "border-blue-500/20 bg-cold-dim",
    narrativeKey: "ai_literacy_analysis",
  },
  {
    key: "rhetoric",
    label: "Boardroom-Rhetorik",
    subtitle: "Layer 2: Real-World Rhetoric",
    desc: "Autorität, Überzeugung und Boardroom-Präsenz",
    color: "#60A5FA",
    bg: "border-blue-400/20 bg-cold-dim",
    narrativeKey: "rhetoric_analysis",
  },
  {
    key: "strategic_eq",
    label: "Strategisches EQ",
    subtitle: "Layer 3: Strategic EQ",
    desc: "Empathie als Wettbewerbsvorteil und Autoritätssicherung",
    color: "#D97706",
    bg: "border-warm-DEFAULT/20 bg-warm-dim",
    narrativeKey: "eq_analysis",
  },
];

function ScoreRing({ score, color }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r="40" fill="none" stroke="#27272A" strokeWidth="3" />
        <circle
          cx="48" cy="48" r="40" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="square"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className="font-manrope font-black text-xl text-white relative z-10">{score}%</span>
    </div>
  );
}

export default function Report() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("emergent_report");
    const rawUser = localStorage.getItem("emergent_user");
    if (!raw) { navigate("/"); return; }
    const data = JSON.parse(raw);
    setReport(data);
    if (rawUser) setUser(JSON.parse(rawUser));
    if (data.user) setUser(prev => ({ ...prev, ...data.user }));
  }, [navigate]);

  if (!report) return null;

  const { cat_scores = {}, layer_scores = {}, avg_total = 0, roi = {}, narrative = {} } = report;
  const displayUser = user || report.user || {};

  const radarData = Object.entries(catLabels).map(([key, label]) => ({
    subject: label,
    score: cat_scores[key] || 0,
    fullMark: 100,
  }));

  const scoreColor = avg_total >= 70 ? "#10B981" : avg_total >= 50 ? "#D97706" : "#EF4444";

  return (
    <div className="min-h-screen bg-noir-bg pb-24" data-testid="report-page">
      {/* Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-amber-600/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <span className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-blue-400 mb-2 block">
              Dein persönlicher Report
            </span>
            <h1 className="font-manrope font-black text-4xl md:text-5xl text-white mb-2" data-testid="report-name">
              {displayUser?.name || "Leadership Report"}
            </h1>
            <p className="font-inter text-slate-500">{displayUser?.role}</p>
          </div>
          <div className="text-right">
            <div className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-slate-600 mb-1">
              Gesamtscore
            </div>
            <div className="font-manrope font-black text-5xl" style={{ color: scoreColor }} data-testid="report-total-score">
              {avg_total}%
            </div>
          </div>
        </div>

        {/* Profile title card */}
        {narrative.profile_title && (
          <div className="border border-warm-DEFAULT/30 bg-warm-dim p-6 mb-10 card-glow-amber" data-testid="report-profile-title">
            <div className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-warm-DEFAULT mb-2">
              Dein Führungsprofil
            </div>
            <h2 className="font-manrope font-black text-2xl md:text-3xl text-white mb-3">
              {narrative.profile_title}
            </h2>
            {narrative.executive_summary && (
              <p className="font-inter text-sm text-slate-300 leading-relaxed">
                {narrative.executive_summary}
              </p>
            )}
          </div>
        )}

        {/* 3 Layer Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10" data-testid="report-layers">
          {layerConfig.map((layer) => {
            const score = layer_scores[layer.key] || 0;
            return (
              <div key={layer.key} className={`border p-6 ${layer.bg}`} data-testid={`layer-${layer.key}`}>
                <div className="font-manrope text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ color: layer.color }}>
                  {layer.subtitle}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-manrope font-bold text-lg text-white">{layer.label}</h3>
                  <span className="font-manrope font-black text-2xl text-white">{score}%</span>
                </div>
                {/* Bar */}
                <div className="h-[2px] bg-white/5 mb-3">
                  <div
                    className="h-full layer-bar"
                    style={{ width: `${score}%`, backgroundColor: layer.color }}
                  />
                </div>
                <p className="font-inter text-xs text-slate-500 mb-3">{layer.desc}</p>
                {narrative[layer.narrativeKey] && (
                  <p className="font-inter text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                    {narrative[layer.narrativeKey]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Grid: Radar + ROI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Radar Chart */}
          <div className="border border-white/8 bg-noir-surface p-6" data-testid="report-radar-chart">
            <h3 className="font-manrope font-semibold text-sm text-white mb-1 tracking-wider uppercase">
              6-Dimensionen-Analyse
            </h3>
            <p className="font-inter text-xs text-slate-600 mb-6">Dein Führungsprofil im Überblick</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#27272A" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#64748B", fontSize: 10, fontFamily: "Inter" }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                  <Tooltip
                    contentStyle={{ background: "#0A0A0B", border: "1px solid #27272A", borderRadius: 0 }}
                    itemStyle={{ color: "#ffffff", fontFamily: "Inter", fontSize: 12 }}
                    formatter={(val) => [`${val}%`, "Score"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Category bars below chart */}
            <div className="mt-4 space-y-2">
              {Object.entries(catLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="font-inter text-xs text-slate-500 w-28 shrink-0">{label}</span>
                  <div className="flex-1 h-[2px] bg-white/5">
                    <div className="h-full bg-blue-500" style={{ width: `${cat_scores[key] || 0}%` }} />
                  </div>
                  <span className="font-manrope text-xs font-bold text-white w-10 text-right">
                    {cat_scores[key] || 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ROI Metrics */}
          <div className="space-y-4" data-testid="report-roi">
            <div className="border border-white/8 bg-noir-surface p-6">
              <h3 className="font-manrope font-semibold text-sm text-white mb-1 tracking-wider uppercase">
                Dein ROI-Potential
              </h3>
              <p className="font-inter text-xs text-slate-600 mb-6">Nach 30 Tagen im Programm</p>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border border-blue-500/20 bg-cold-dim flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-manrope font-black text-2xl text-white">{roi.hours_saved}h</div>
                    <div className="font-inter text-xs text-slate-500">gesparte Stunden pro Woche</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border border-blue-500/20 bg-cold-dim flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-manrope font-black text-2xl text-white">{roi.decision_speed}x</div>
                    <div className="font-inter text-xs text-slate-500">schnellere Entscheidungsgeschwindigkeit</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border border-warm-DEFAULT/20 bg-warm-dim flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="font-manrope font-black text-2xl text-white">+{roi.performance_boost}%</div>
                    <div className="font-inter text-xs text-slate-500">Team-Performance-Steigerung</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strength & Priority */}
            {narrative.top_strength && (
              <div className="border border-green-500/20 bg-green-500/3 p-5">
                <div className="font-manrope text-xs font-medium tracking-[0.2em] uppercase text-green-400 mb-2">
                  Deine stärkste Kompetenz
                </div>
                <p className="font-inter text-sm text-slate-300 leading-relaxed">{narrative.top_strength}</p>
              </div>
            )}
            {narrative.growth_priority && (
              <div className="border border-amber-500/20 bg-warm-dim p-5">
                <div className="font-manrope text-xs font-medium tracking-[0.2em] uppercase text-amber-500 mb-2">
                  Wachstumspriorität
                </div>
                <p className="font-inter text-sm text-slate-300 leading-relaxed">{narrative.growth_priority}</p>
              </div>
            )}
          </div>
        </div>

        {/* 3 Recommendations */}
        {(narrative.recommendation_1 || narrative.recommendation_2 || narrative.recommendation_3) && (
          <div className="border border-white/8 bg-noir-surface p-8 mb-10" data-testid="report-recommendations">
            <h3 className="font-manrope font-bold text-xl text-white mb-6">Deine Top 3 Empfehlungen</h3>
            <div className="space-y-6">
              {[narrative.recommendation_1, narrative.recommendation_2, narrative.recommendation_3].map((rec, i) => (
                rec && (
                  <div key={i} className="flex gap-5">
                    <div className={`w-8 h-8 border flex items-center justify-center shrink-0 font-manrope font-black text-sm ${i === 2 ? "border-warm-DEFAULT/40 text-amber-500 bg-warm-dim" : "border-blue-500/40 text-blue-400 bg-cold-dim"}`}>
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-manrope font-bold text-sm text-white mb-1">{rec.title}</h4>
                      <p className="font-inter text-sm text-slate-400 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Daily Intelligence Hub Mockup */}
        <div className="border border-blue-500/15 bg-cold-dim p-8 mb-10 card-glow-blue" data-testid="intelligence-hub">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-blue-400 mb-2">
                Preview: Daily Intelligence Hub
              </div>
              <h3 className="font-manrope font-bold text-xl text-white mb-1">
                3 Stunden Recherche. In 15 Minuten.
              </h3>
              <p className="font-inter text-sm text-slate-500">So sieht dein KI-gestützter Leadership-Arbeitsalltag aus</p>
            </div>
            <div className="border border-blue-500/20 px-3 py-1.5">
              <span className="font-manrope text-xs text-blue-400 tracking-wider">LIVE DEMO</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { time: "07:15", title: "Board-Briefing generiert", desc: "Automatisches Tages-Briefing aus 12 Quellen", badge: "Rhetorik", icon: MessageSquare },
              { time: "08:30", title: "Entscheidungs-Journal", desc: "KI analysiert gestrige Entscheidungsmuster", badge: "EQ-Score", icon: Brain },
              { time: "09:00", title: "Marktlage zusammengefasst", desc: "Wettbewerber-Updates in 3 Sätzen", badge: "Strategie", icon: TrendingUp },
            ].map((item, i) => (
              <div key={i} className="hub-card border border-white/5 bg-noir-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-manrope text-xs text-slate-600">{item.time}</span>
                  <div className="border border-blue-500/20 px-2 py-0.5">
                    <span className="font-manrope text-xs text-blue-400">{item.badge}</span>
                  </div>
                </div>
                <item.icon className="w-4 h-4 text-blue-400 mb-2" />
                <h4 className="font-manrope font-semibold text-sm text-white mb-1">{item.title}</h4>
                <p className="font-inter text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 border border-white/5 bg-noir-bg p-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-inter text-xs text-slate-400">
              Mit dem KI-Coach täglich gecoacht — 24/7 verfügbar, kennt dein Profil und deine Ziele
            </span>
          </div>
        </div>

        {/* Urgency */}
        {narrative.urgency_message && (
          <div className="border border-red-400/15 bg-red-500/3 p-5 mb-10" data-testid="report-urgency">
            <div className="flex items-start gap-3">
              <Star className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="font-inter text-sm text-slate-300 leading-relaxed">{narrative.urgency_message}</p>
            </div>
          </div>
        )}

        {/* Closing */}
        {narrative.closing_statement && (
          <div className="text-center mb-12">
            <p className="font-manrope font-bold text-xl md:text-2xl text-white leading-relaxed max-w-2xl mx-auto">
              "{narrative.closing_statement}"
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="border-t border-white/5 pt-10 flex flex-col sm:flex-row gap-4 justify-center" data-testid="report-ctas">
          <button
            data-testid="report-cta-roadmap"
            onClick={() => navigate("/roadmap")}
            className="btn-primary px-8 py-4 font-manrope text-sm tracking-widest uppercase flex items-center justify-center gap-3"
          >
            30-Tage-Aktionsplan ansehen
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            data-testid="report-cta-close"
            onClick={() => navigate("/close")}
            className="btn-secondary px-8 py-4 font-manrope text-sm tracking-widest uppercase"
          >
            Vollzugang freischalten
          </button>
        </div>
      </div>
    </div>
  );
}
