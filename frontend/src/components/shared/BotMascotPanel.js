import {
  X, ArrowRight, Calendar, MessageSquareText, Zap, Rocket,
  HeadphonesIcon, Loader2
} from 'lucide-react';
import { openStrategyCall } from '../../lib/calendly';

const WLAD_IMG = 'https://leadercheck.de/wladbot-3-nobg.png';

export const BotMascotPanel = ({ de, onClose, onNavigate, onCheckout, checkoutLoading }) => (
  <>
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] wlad-slide-up" data-testid="bot-mascot-panel">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl shadow-black/15 border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">

        {/* Header */}
        <div className="bg-[#0A0A0A] p-4 flex items-center gap-3">
          <div className="relative">
            <img src={WLAD_IMG} alt="Wlad" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#30D158] border-2 border-[#0A0A0A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Wlad Jachtchenko</p>
            <p className="text-[10px] text-white/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] inline-block" />
              {de ? 'Verbunden' : 'Connected'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors" data-testid="bot-mascot-close"><X size={18} /></button>
        </div>

        {/* Chat message */}
        <div className="p-4 pb-2">
          <div className="flex items-start gap-2.5">
            <img src={WLAD_IMG} alt="W" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
            <div className="bg-gray-50 dark:bg-muted/30 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
              <p className="text-[13px] leading-relaxed text-foreground">
                {de ? 'Hey! Wie kann ich dir helfen? Coaching buchen, Fragen stellen, oder direkt dein volles Potenzial freischalten.' : 'Hey! How can I help? Book coaching, ask questions, or unlock your full potential.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-3 space-y-2">
          <ActionButton icon={MessageSquareText} iconBg="bg-sky-50 dark:bg-sky-500/10 dark:bg-sky-50 dark:bg-sky-500/100/10" iconColor="text-sky-600" label={de ? 'KI-Coach starten' : 'Start AI Coach'} sub={de ? 'Frag WladBot direkt' : 'Ask WladBot directly'} testId="wlad-action-chat" onClick={() => onNavigate('/chat')} />
          <ActionButton icon={HeadphonesIcon} iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconColor="text-emerald-600" label="Support" sub={de ? 'Frage stellen & Hilfe' : 'Ask questions & help'} testId="wlad-action-support" onClick={() => onNavigate('/chat?agent=Problemlöser')} />
          <ActionButton icon={Calendar} iconBg="bg-purple-50 dark:bg-[#7B3FE4]/10" iconColor="text-purple-600" label={de ? 'Strategiegespräch buchen' : 'Book Strategy Call'} sub={de ? '15 Min · 1:1 · unverbindlich' : '15 min · 1:1 · no obligation'} testId="wlad-action-book" onClick={() => openStrategyCall('wlad-mascot')} />
        </div>

        {/* Pricing */}
        <div className="px-4 pb-4 space-y-2">
          <div className="border-t border-black/[0.04] dark:border-white/[0.06] pt-3 mb-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">{de ? 'Premium Programme' : 'Premium Programs'}</p>
          </div>
          <PriceButton icon={Zap} label="Leadership OS" sub={de ? 'KI-Coach 24/7, 12 Videokurse, Challenges' : 'AI Coach 24/7, 12 video courses, challenges'} price="€997" suffix={de ? '/ Jahr' : '/ year'} loading={checkoutLoading === 'leadership_os'} testId="wlad-checkout-standard" onClick={() => onCheckout('leadership_os')} disabled={!!checkoutLoading} />
          <PriceButton icon={Rocket} label="Leadership OS PLUS" sub={de ? '+ 12× 1:1 Coaching, Video-Analyse' : '+ 12× 1:1 Coaching, Video Analysis'} price="€4.447" suffix={de ? '/ Jahr' : '/ year'} loading={checkoutLoading === 'leadership_os_plus'} testId="wlad-checkout-fast-track" onClick={() => onCheckout('leadership_os_plus')} disabled={!!checkoutLoading} recommended={de ? 'Empfohlen' : 'Recommended'} />
        </div>

        <div className="px-4 pb-3 flex items-center justify-center gap-3 text-[9px] text-muted-foreground/30">
          <span>30 Tage Geld-zurück</span><span>·</span><span>Stripe</span><span>·</span><span>DSGVO</span>
        </div>
      </div>
    </div>
    <div className="fixed inset-0 z-40" onClick={onClose} />
  </>
);

const ActionButton = ({ icon: Icon, iconBg, iconColor, label, sub, testId, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.06] hover:bg-[#BFFF00]/5 hover:border-[#BFFF00]/20 transition-all text-left group" data-testid={testId}>
    <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}><Icon size={16} className={iconColor} /></div>
    <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold">{label}</p><p className="text-[10px] text-muted-foreground">{sub}</p></div>
    <ArrowRight size={14} className="text-muted-foreground/40 group-hover:text-[#6B8A00] dark:group-hover:text-[#BFFF00]" />
  </button>
);

const PriceButton = ({ icon: Icon, label, sub, price, suffix, loading, testId, onClick, disabled, recommended }) => (
  <button onClick={onClick} disabled={disabled} className={`w-full flex items-center gap-3 p-3 rounded-xl text-white transition-all group relative overflow-hidden ${recommended ? 'bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] border border-[#BFFF00]/20 hover:border-[#BFFF00]/40' : 'bg-[#0A0A0A] hover:bg-[#1A1A1A]'}`} data-testid={testId}>
    {recommended && <div className="absolute top-0 right-0 bg-[#BFFF00] text-[#0A0A0A] text-[7px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">{recommended}</div>}
    <div className={`w-9 h-9 rounded-lg ${recommended ? 'bg-[#BFFF00]/20' : 'bg-[#BFFF00]/15'} flex items-center justify-center shrink-0`}><Icon size={16} className="text-[#BFFF00]" /></div>
    <div className="flex-1 min-w-0 text-left"><p className="text-[13px] font-bold">{label}</p><p className="text-[10px] text-white/40">{sub}</p></div>
    <div className="text-right shrink-0">
      {loading ? <Loader2 size={16} className="animate-spin text-[#BFFF00]" /> : <><p className="text-sm font-black text-[#BFFF00]">{price}</p><p className="text-[8px] text-white/30">{suffix}</p></>}
    </div>
  </button>
);
