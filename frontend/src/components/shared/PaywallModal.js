import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { X, CheckCircle2, Flame, Brain, Video, Target, Calendar, Sparkles } from 'lucide-react';
import { PricingModal } from './PricingModal';
import { useBookConsultation } from '../brand/BookConsultationButton';

const WLAD = 'https://customer-assets.emergentagent.com/job_dd3457c0-3be5-4c4c-bc34-5b0e823b9278/artifacts/4knvn6cs_WladProfilbild.jpg';

// Accessible lime color for text/icons on light surfaces
const LIME_ACCENT = 'text-[#6B8A00] dark:text-[#BFFF00]';

export const PaywallModal = ({ onClose, creditsUsed = 10, isSoftPause = false }) => {
  const [showPricing, setShowPricing] = useState(false);
  const [defaultTier, setDefaultTier] = useState('leadership_os');
  const openCal = useBookConsultation();

  const handlePick = (tier) => {
    setDefaultTier(tier);
    setShowPricing(true);
  };

  const features = [
    { icon: Flame, label: '30-Tage KI-Leadership Programm' },
    { icon: Brain, label: 'Unbegrenzter KI-Coach (24/7)' },
    { icon: Video, label: '16 Video-Missionen mit KI-Feedback' },
    { icon: Target, label: '10 Workflows + PDF-Reports' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-sm animate-fade-in p-4" data-testid="paywall-modal" onClick={onClose}>
      <Card className="w-[380px] max-w-[92vw] border-0 shadow-2xl overflow-hidden bg-white dark:bg-card" onClick={e => e.stopPropagation()}>
        <CardContent className="p-0">
          {/* Compact Header */}
          <div className="bg-[#0A0A0A] p-4 text-white relative">
            <button onClick={onClose} className="absolute top-2.5 right-2.5 text-white/40 hover:text-white transition-colors" data-testid="paywall-close">
              <X size={16} />
            </button>
            <div className="flex items-center gap-2.5 mb-3">
              <img src={WLAD} alt="Wlad" className="w-9 h-9 rounded-full object-cover ring-2 ring-[#BFFF00]/20 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-[#BFFF00]/80 uppercase tracking-wider">Wlad Jachtchenko</p>
                <p className="text-[12px] font-bold text-white/95 leading-tight">
                  {isSoftPause
                    ? 'Du nutzt WladBot aktiv. Bereit fürs volle Erlebnis?'
                    : 'Echten Fortschritt gemacht. Jetzt alles freischalten.'}
                </p>
              </div>
            </div>
            {/* Compact stats */}
            <div className="flex items-center gap-2 bg-white/[0.06] rounded-lg p-2">
              <div className="text-center flex-1">
                <p className="text-sm font-black text-[#BFFF00] leading-none">{creditsUsed}</p>
                <p className="text-[8px] text-white/45 mt-0.5">Sessions</p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center flex-1">
                <p className="text-sm font-black text-white leading-none">1.000+</p>
                <p className="text-[8px] text-white/45 mt-0.5">Leader</p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center flex-1">
                <p className="text-sm font-black text-white leading-none">300</p>
                <p className="text-[8px] text-white/45 mt-0.5">Fragen</p>
              </div>
            </div>
          </div>

          {/* Body — tighter spacing */}
          <div className="p-5 space-y-3.5">
            <div className="text-center">
              <h3 className="text-[15px] font-black leading-tight">Dein komplettes Leader OS</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Alles, um KI-nativer Leader zu werden.</p>
            </div>

            {/* Dense feature list */}
            <div className="space-y-1.5">
              {features.map(item => (
                <div key={item.label} className="flex items-center gap-2 py-1">
                  <div className="w-6 h-6 rounded-md bg-[#BFFF00]/15 flex items-center justify-center shrink-0">
                    <item.icon size={11} className={LIME_ACCENT} />
                  </div>
                  <span className="text-[11px] font-semibold flex-1">{item.label}</span>
                  <CheckCircle2 size={12} className={`${LIME_ACCENT} shrink-0`} />
                </div>
              ))}
            </div>

            {/* Pricing — compact */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handlePick('leadership_os')}
                className="p-2.5 rounded-xl bg-[#0A0A0A] text-white text-center hover:bg-[#1A1A1A] transition-colors btn-revolut"
                data-testid="paywall-cta-standard"
              >
                <p className="text-lg font-black leading-none">€997</p>
                <p className="text-[8px] text-white/50 mt-1">Leadership OS</p>
                <p className="text-[7px] text-white/30 mt-0.5">1 Jahr · 12 Videokurse</p>
              </button>
              <button
                onClick={() => handlePick('leadership_os_plus')}
                className="p-2.5 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] text-white text-center border border-[#BFFF00]/25 hover:border-[#BFFF00]/50 transition-colors relative overflow-hidden btn-revolut"
                data-testid="paywall-cta-fast-track"
              >
                <div className="absolute top-0 right-0 bg-[#BFFF00] text-[#0A0A0A] text-[6px] font-black px-1.5 py-0.5 rounded-bl-md">VIP</div>
                <p className="text-lg font-black text-[#BFFF00] leading-none">€4.797</p>
                <p className="text-[8px] text-white/50 mt-1">Leadership OS PLUS</p>
                <p className="text-[7px] text-white/30 mt-0.5">+ 12× Coaching</p>
              </button>
            </div>

            {/* Secondary CTAs — pricing details + cal.com */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowPricing(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-foreground/70 hover:text-foreground py-1.5 transition-colors"
                data-testid="paywall-see-all-pricing"
              >
                <Sparkles size={10} className={LIME_ACCENT} /> Alle Optionen
              </button>
              <button
                onClick={() => { onClose(); openCal(); }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-foreground/70 hover:text-foreground py-1.5 transition-colors"
                data-testid="paywall-book-cal"
              >
                <Calendar size={10} className={LIME_ACCENT} /> Beratung buchen
              </button>
            </div>

            {/* Soft-pause dismiss */}
            {isSoftPause && (
              <button
                onClick={onClose}
                className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground transition-colors py-1.5"
                data-testid="paywall-continue-free"
              >
                Kostenlos weiter nutzen ({50 - creditsUsed} Credits verbleibend)
              </button>
            )}

            {/* Trust row — minimal */}
            <div className="flex items-center justify-center gap-2 text-[9px] text-muted-foreground/40 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
              <span>1.000+ Leader</span>
              <span>·</span>
              <span>14 Tage Geld-zurück</span>
              <span>·</span>
              <span>Stripe</span>
            </div>
          </div>
        </CardContent>
      </Card>
      {showPricing && (
        <PricingModal
          defaultTier={defaultTier}
          onClose={() => setShowPricing(false)}
        />
      )}
    </div>
  );
};
