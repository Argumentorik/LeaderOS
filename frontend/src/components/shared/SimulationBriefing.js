import { useEffect, useState } from 'react';
import { X, Play, Swords, ArrowRight } from 'lucide-react';

const COUNTERPARTS = (de) => [
  { id: 'emotional', label: de ? 'Defensiv & emotional' : 'Defensive & emotional', desc: de ? 'Fühlt sich schnell angegriffen' : 'Feels attacked quickly' },
  { id: 'rational', label: de ? 'Rational & distanziert' : 'Rational & distant', desc: de ? 'Sachlich, wenig Emotionen' : 'Factual, few emotions' },
  { id: 'dominant', label: de ? 'Dominant & fordernd' : 'Dominant & demanding', desc: de ? 'Geht in die Offensive' : 'Goes on the offensive' },
];

const GOALS = (de) => [
  { id: 'klarheit', label: de ? 'Klar Position beziehen' : 'Take a clear stance', desc: de ? 'Ohne hart zu wirken' : 'Without seeming harsh' },
  { id: 'empathie', label: de ? 'Empathisch bleiben' : 'Stay empathetic', desc: de ? 'Auch unter Druck' : 'Even under pressure' },
  { id: 'ergebnis', label: de ? 'Zum Ergebnis führen' : 'Drive to a result', desc: de ? 'Gespräch strukturiert abschließen' : 'Close the conversation structured' },
];

const OptionChips = ({ options, value, onPick, testPrefix }) => (
  <div className="grid grid-cols-1 gap-2">
    {options.map((o) => (
      <button
        key={o.id}
        onClick={() => onPick(o)}
        data-testid={`${testPrefix}-${o.id}`}
        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all hover:-translate-y-0.5 ${
          value === o.id
            ? 'border-[#BFFF00] bg-[#BFFF00]/10 shadow-[0_0_16px_rgba(191,255,0,0.12)]'
            : 'border-white/[0.08] bg-white/[0.03] hover:border-[#BFFF00]/40'
        }`}
      >
        <span>
          <span className="block text-[13px] font-bold text-white">{o.label}</span>
          <span className="block text-[11px] text-white/40">{o.desc}</span>
        </span>
        {value === o.id && <span className="w-2 h-2 rounded-full bg-[#BFFF00] shadow-[0_0_8px_rgba(191,255,0,0.8)]" />}
      </button>
    ))}
  </div>
);

/**
 * SimulationBriefing (Iter 92.58 · Mert Godmode): before the roleplay starts,
 * the user CLICKS through 2 quick questions (counterpart style + training
 * goal). The AI persona is prepared with this — targeted practice instead of
 * a generic roleplay. "Ask first, then deliver the best answer."
 */
export const SimulationBriefing = ({ scenario, onStart, onClose, loading, de }) => {
  const [counterpart, setCounterpart] = useState(null);
  const [goal, setGoal] = useState(null);
  const counterparts = COUNTERPARTS(de);
  const goals = GOALS(de);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-5 bg-[#0A0A0A]/75 backdrop-blur-md animate-fade-in" onClick={onClose} data-testid="simulation-briefing">
      <div
        className="relative w-full max-w-md rounded-[26px] border border-white/[0.09] bg-gradient-to-b from-[#141414] to-[#0C0C0C] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-72 rounded-full bg-rose-500/[0.10] blur-[70px]" />
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white z-10" data-testid="briefing-close" aria-label={de ? 'Schließen' : 'Close'}>
          <X size={13} />
        </button>

        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
              <Swords size={19} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-rose-400">{de ? 'Briefing · 10 Sekunden' : 'Briefing · 10 seconds'}</p>
              <h2 className="text-[17px] font-black text-white leading-tight">{scenario?.title}</h2>
            </div>
          </div>

          <p className="text-[9.5px] font-black uppercase tracking-[0.16em] text-white/40 mb-2">
            1 · {de ? 'Wer sitzt dir gegenüber?' : "Who's across the table?"}
          </p>
          <OptionChips options={counterparts} value={counterpart?.id} onPick={setCounterpart} testPrefix="briefing-counterpart" />

          <p className="text-[9.5px] font-black uppercase tracking-[0.16em] text-white/40 mb-2 mt-5">
            2 · {de ? 'Was willst du trainieren?' : 'What do you want to train?'}
          </p>
          <OptionChips options={goals} value={goal?.id} onPick={setGoal} testPrefix="briefing-goal" />

          <button
            onClick={() => onStart({ counterpart_style: counterpart?.label || null, training_goal: goal?.label || null })}
            disabled={loading || !counterpart || !goal}
            className="mt-6 w-full h-11 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-bold text-[13.5px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#BFFF00]/25 hover:scale-[1.015] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
            data-testid="briefing-start-btn"
          >
            <Play size={14} fill="currentColor" /> {loading ? (de ? 'Wird vorbereitet…' : 'Preparing…') : (de ? 'Simulation starten' : 'Start simulation')} <ArrowRight size={14} />
          </button>
          <p className="text-center text-[10px] text-white/30 mt-2.5">
            {de ? 'Die KI bereitet sich auf genau dieses Szenario vor.' : 'The AI prepares for exactly this scenario.'}
          </p>
        </div>
      </div>
    </div>
  );
};
