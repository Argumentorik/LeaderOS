import { useNavigate } from 'react-router-dom';
import { Phone, PlayCircle, HelpCircle, Mail } from 'lucide-react';
import { useBookConsultation } from '../brand/BookConsultationButton';

// eslint-disable-next-line no-unused-vars
export const CoachingRightPanel = ({ de, onCheckout }) => {
  const navigate = useNavigate();
  const openBooking = useBookConsultation();
  return (
    <div className="p-5 space-y-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {de ? 'Schnellzugriff' : 'Quick Actions'}
      </h3>

      <div className="space-y-2">
        <button onClick={openBooking} className="card-lift flex items-center gap-3 w-full p-3 rounded-xl bg-[#BFFF00]/[0.06] border border-[#BFFF00]/20 hover:bg-[#BFFF00]/[0.10] transition-colors text-left" data-testid="quick-book-call">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shrink-0">
            <Phone size={14} className="text-[#0A0A0A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold">{de ? 'Strategiegespräch' : 'Strategy Call'}</p>
            <p className="text-[10px] text-muted-foreground">{de ? '15 Min · Unverbindlich · Cal.com' : '15 min · No strings · Cal.com'}</p>
          </div>
        </button>
        <button onClick={() => navigate('/simulations')} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-colors text-left" data-testid="quick-simulation">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
            <PlayCircle size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold">{de ? 'Simulation starten' : 'Start Simulation'}</p>
            <p className="text-[10px] text-muted-foreground">{de ? '12 Szenarien' : '12 scenarios'}</p>
          </div>
        </button>
      </div>

      <div className="pt-3 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {de ? 'Hilfe & Support' : 'Help & Support'}
        </h3>
        <div className="space-y-2">
          <button onClick={() => window.open('mailto:support@leaderos.de')} className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors" data-testid="support-faq">
            <HelpCircle size={13} className="text-muted-foreground" />
            <span className="text-xs">{de ? 'FAQ & Support' : 'FAQ & Support'}</span>
          </button>
          <button onClick={() => window.open('mailto:support@leaderos.de')} className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors" data-testid="support-email">
            <Mail size={13} className="text-muted-foreground" />
            <span className="text-xs">support@leaderos.de</span>
          </button>
        </div>
      </div>
    </div>
  );
};
