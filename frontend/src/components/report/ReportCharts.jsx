import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from "recharts";
import { Clock, Zap, TrendingUp } from "lucide-react";
import { catLabels, layerConfig, ScoreRing } from "./reportConfig";

export const ReportLayers = ({ layer_scores, narrative }) => (
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
);

export const ReportRadarROI = ({ radarData, cat_scores, roi, narrative }) => (
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
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4">
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
          <div className="font-inter text-xs text-[#C8FF00] mb-2 uppercase tracking-wider">Deine stärkste Kompetenz</div>
          <p className="font-inter text-sm text-slate-300 leading-relaxed">{narrative.top_strength}</p>
        </div>
      )}
      {narrative.growth_priority && (
        <div className="glass-card-subtle p-5 border-l-2 border-white/20">
          <div className="font-inter text-xs text-slate-400 mb-2 uppercase tracking-wider">Wachstumspriorität</div>
          <p className="font-inter text-sm text-slate-300 leading-relaxed">{narrative.growth_priority}</p>
        </div>
      )}
    </div>
  </div>
);
