import { Phone, PhoneOff } from 'lucide-react';
import { WladBotAvatar } from '../brand/WladBotAvatar';

export const BotMascotRinging = ({ de, onAccept, onDecline }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center wlad-fade-in" data-testid="bot-mascot-call-screen">
    <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl" onClick={onDecline} />
    <div className="relative z-10 flex flex-col items-center gap-6 px-8 py-10 wlad-slide-up">
      <div className="relative">
        <div className="absolute inset-0 -m-4 rounded-full border-2 border-[#30D158]/30 wlad-ring-1" />
        <div className="absolute inset-0 -m-8 rounded-full border border-[#30D158]/15 wlad-ring-2" />
        <div className="w-28 h-28 rounded-full flex items-center justify-center shadow-2xl shadow-[#BFFF00]/30 border-[3px] border-[#30D158] overflow-hidden">
          <WladBotAvatar size={106} />
        </div>
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-white text-xl font-semibold tracking-tight">WladBot</h3>
        <p className="text-white/50 text-sm font-medium">{de ? 'Dein KI Leadership Coach' : 'Your AI Leadership Coach'}</p>
      </div>
      <div className="bg-white/[0.07] backdrop-blur-md rounded-2xl px-5 py-3 border border-white/[0.08]">
        <p className="text-white/70 text-sm text-center">
          {de ? 'Bereit für dein nächstes Leadership-Level?' : 'Ready for your next leadership level?'}
        </p>
      </div>
      <div className="flex items-center gap-14 mt-4">
        <div className="flex flex-col items-center gap-2">
          <button onClick={onDecline} className="w-16 h-16 rounded-full bg-[#FF3B30] flex items-center justify-center shadow-lg shadow-[#FF3B30]/30 hover:bg-[#FF453A] active:scale-95 transition-all" data-testid="bot-mascot-decline">
            <PhoneOff size={24} className="text-white" />
          </button>
          <span className="text-white/40 text-xs font-medium">{de ? 'Ablehnen' : 'Decline'}</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button onClick={onAccept} className="w-16 h-16 rounded-full bg-[#30D158] flex items-center justify-center shadow-lg shadow-[#30D158]/30 hover:bg-[#34D65C] active:scale-95 transition-all wlad-pulse-green" data-testid="bot-mascot-accept">
            <Phone size={24} className="text-white" />
          </button>
          <span className="text-white/40 text-xs font-medium">{de ? 'Annehmen' : 'Accept'}</span>
        </div>
      </div>
      <p className="text-white/15 text-[10px] tracking-widest uppercase mt-2">WladBot Leader OS</p>
    </div>
  </div>
);
