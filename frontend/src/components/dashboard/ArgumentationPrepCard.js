import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight, Target } from 'lucide-react';

/**
 * ArgumentationPrepCard — dashboard entry point for the SEXIER prep wizard.
 * Mobile-first: built for people preparing on the way to a meeting.
 */
export const ArgumentationPrepCard = ({ de }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/simulations?prep=1')}
      className="w-full text-left rounded-2xl bg-[#0A0A0A] border border-[#BFFF00]/25 hover:border-[#BFFF00]/50 p-5 transition-all hover:-translate-y-0.5 group relative overflow-hidden"
      data-testid="dashboard-argprep-card"
    >
      <div aria-hidden className="absolute -top-10 -right-6 h-28 w-28 rounded-full bg-[#BFFF00]/[0.1] blur-[40px] pointer-events-none" />
      <div className="relative flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#BFFF00] flex items-center justify-center shrink-0 shadow-lg shadow-[#BFFF00]/25">
          <Target size={19} className="text-[#0A0A0A]" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#BFFF00]">
            {de ? 'SEXIER Argumentation' : 'SEXIER Argumentation'}
          </p>
          <p className="text-[14px] font-black text-white leading-tight mt-0.5">
            {de ? 'Nächstes Meeting vorbereiten' : 'Prepare your next meeting'}
          </p>
          <p className="text-[11px] text-white/45 mt-0.5 flex items-center gap-1.5">
            <Mic size={10} /> {de ? '3 Minuten · per Stimme oder Text · mit PDF' : '3 minutes · voice or text · with PDF'}
          </p>
        </div>
        <ArrowRight size={16} className="text-[#BFFF00] shrink-0 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};
