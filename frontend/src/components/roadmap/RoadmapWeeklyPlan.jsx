import { Calendar, Star, ChevronRight, CheckCircle2 } from "lucide-react";
import { weeklyPlan } from "./roadmapData";

export const RoadmapWeeklyPlan = ({ activeWeek, setActiveWeek }) => (
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
          key={`tab-${week.week}`}
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
          key={`phase-${week.week}`}
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
                key={`${week.week}-item-${j}`}
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
          key={`dot-${week.week}`}
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
);
