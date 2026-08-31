import { Sparkles, Bot, CheckSquare, Users, BookOpen, Calendar, MessageCircle, Shield } from "lucide-react";
import { roleConfig } from "./reportConfig";

export const ReportRecommendations = ({ narrative }) => {
  if (!(narrative.recommendation_1 || narrative.recommendation_2 || narrative.recommendation_3)) return null;
  return (
    <div className="glass-card p-8 mb-10" data-testid="report-recommendations">
      <h3 className="font-manrope font-bold text-xl text-white mb-6">Deine Top 3 Empfehlungen</h3>
      <div className="space-y-6">
        {[narrative.recommendation_1, narrative.recommendation_2, narrative.recommendation_3].map((rec, i) => (
          rec && (
            <div key={`rec-${i}`} className="flex gap-5">
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
  );
};

const AGENTS = [
  { icon: Bot, title: "Coach-Agent", desc: "24/7 persönliches Coaching", color: "#C8FF00" },
  { icon: CheckSquare, title: "Task-Agent", desc: "Tägliche Leadership-Aufgaben", color: "#C8FF00" },
  { icon: Users, title: "Simulations-Agent", desc: "Schwierige Gespräche üben", color: "#C8FF00" },
  { icon: BookOpen, title: "Strategie-Agent", desc: "Playbooks & Frameworks", color: "#C8FF00" },
  { icon: Calendar, title: "Event-Agent", desc: "Live-Sessions & Workshops", color: "#C8FF00" },
  { icon: MessageCircle, title: "Community-Agent", desc: "Vernetzung mit Leadern", color: "#C8FF00" },
];

export const ReportAgentEcosystem = () => (
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
      {AGENTS.map((item) => (
        <div key={item.title} className="hub-card glass-card-subtle p-4 hover-card">
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
        Wlad ist dein persönlicher KI-Leadership-Coach · kennt dein Profil und deine Ziele
      </span>
    </div>
  </div>
);

export const ReportCredo = ({ narrative }) => (
  <>
    {narrative.urgency_message && (
      <div className="glass-card-subtle p-5 mb-10 border-l-2 border-red-500" data-testid="report-urgency">
        <p className="font-inter text-sm text-slate-300 leading-relaxed">{narrative.urgency_message}</p>
      </div>
    )}

    {/* CREDO · einfache Wlad-Sprache, kein Boilerplate-Englisch */}
    <div className="glass-card p-8 md:p-10 mb-10 text-center" data-testid="report-credo">
      <div className="badge-lime px-4 py-2 text-xs font-semibold inline-flex items-center gap-2 mb-6">
        <Shield className="w-3 h-3" />
        DIE 6 ROLLEN · WLAD-METHODIK
      </div>
      <h2 className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-6">
        Top-Führungskräfte können alle 6 Rollen.
        <br />
        <span className="text-slate-500">Nicht eine. Nicht zwei. Alle.</span>
      </h2>
      <p className="font-inter text-slate-400 leading-relaxed mb-8 max-w-2xl mx-auto">
        Kommunikator · Manager · Team Leader · Psychologe · Problemlöser · Innovator. Die 6. Rolle · der Innovator · ist die, die dich heute vom Mittelfeld trennt. Wer KI als Hebel nutzt, statt sie zu fürchten, führt in 12 Monaten den ganzen Bereich.
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
        <p className="font-inter text-slate-500 mb-3">Wissen macht dich zum Experten.</p>
        <p className="font-manrope font-bold text-xl text-white">
          Anwendung macht dich zum <span className="text-gradient-lime">Leader.</span>
        </p>
      </div>
    </div>

    {narrative.closing_statement && (
      <div className="text-center mb-12">
        <p className="font-manrope font-bold text-xl md:text-2xl text-white leading-relaxed max-w-2xl mx-auto">
          &ldquo;{narrative.closing_statement}&rdquo;
        </p>
      </div>
    )}
  </>
);
