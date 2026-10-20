import { ArrowRight, Zap } from 'lucide-react';

export const ChatInlineUpsell = ({ onNavigate, de }) => (
  <div className="flex mb-4 ml-10 animate-fade-in" data-testid="chat-inline-upsell">
    <div className="bg-[#0A0A0A] text-white rounded-2xl px-4 py-3 max-w-md border border-[#BFFF00]/10">
      <p className="text-[11px] text-white/60 mb-2">
        <Zap size={10} className="inline mr-1 text-[#BFFF00]" />
        {de ? 'Tipp: Schalte unbegrenztes Coaching frei und arbeite mit Wlads Expertenteam.' : 'Tip: Unlock unlimited coaching and work with Wlad’s expert team.'}
      </p>
      <div className="flex gap-2">
        <button onClick={onNavigate} className="text-[10px] font-bold text-[#BFFF00] hover:text-[#D4FF4D] transition-colors">
          Leadership OS €997 <ArrowRight size={8} className="inline ml-0.5" />
        </button>
        <span className="text-white/20">|</span>
        <button onClick={onNavigate} className="text-[10px] font-bold text-[#BFFF00]/60 hover:text-[#BFFF00] transition-colors">
          PLUS €4.797
        </button>
      </div>
    </div>
  </div>
);
