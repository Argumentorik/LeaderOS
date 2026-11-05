import { Bot, Brain, Headphones, Video } from "lucide-react";
import { agentCards } from "./roadmapData";

export const RoadmapAgents = () => (
  <>
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
          <div key={agent.name} className="glass-card-subtle p-4 hover-card group" data-testid={`agent-card-${i}`}>
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
  </>
);

export const RoadmapSpecialEvents = () => (
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
        <div className="font-inter text-xs text-slate-500">How to use AI · Schritt für Schritt</div>
      </div>
    </div>
  </div>
);
