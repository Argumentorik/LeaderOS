import { Crown, Lock, Check, Mail, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PricingModal } from './PricingModal';

const FEATURE_LABELS = {
  video_analysis: {
    title: 'Video-Analyse ist exklusiv in Leadership OS PLUS',
    subtitle: 'Nimm deine Rede auf · KI analysiert Rhetorik, Struktur, Pathos · Pro-Level Report',
    benefits: [
      'KI-basierte Redner-Analyse (Logos/Ethos/Pathos)',
      'Füllwort-, Tempo- & Struktur-Check',
      'Persönliches Feedback von Wlad-Methodik',
      'Pro-Level Report als PDF-Download',
    ],
  },
  video_missions: {
    title: 'Video-Missionen sind exklusiv in Leadership OS PLUS',
    subtitle: '16 spezifische Leadership-Szenarien mit KI-Feedback',
    benefits: [
      '16 Video-Missionen zu Führungs-Situationen',
      'Immersives Feedback nach jeder Aufnahme',
      'XP + Badges für gemeisterte Missionen',
      'Direkt-Einbindung in dein Leadership-Profil',
    ],
  },
  ai_coach: {
    title: 'WladBot AI Coach ist in Leadership OS inklusive',
    subtitle: 'Unbegrenzter 24/7 Zugriff ab Leadership OS Tier',
    benefits: [
      '24/7 KI-Coach trainiert auf Wlads Methoden',
      'Unbegrenzte Gespräche',
      'Personalisierter Lernpfad',
      'Ab €997 / Jahr',
    ],
  },
  one_on_one_calls: {
    title: '1:1 Coachings nur in Leadership OS PLUS',
    subtitle: 'Persönliches Coaching mit Argumentorik-Leadership-Coaches',
    benefits: [
      '12× 1:1 Coachings pro Jahr (je 299€ Wert)',
      'Persönliches Onboarding-Gespräch',
      'Quartals-Reviews (4× jährlich)',
      'Priority Support + Fast-Track',
    ],
  },
};

/**
 * TierLockOverlay — blurred overlay on locked features with clear upgrade CTA.
 * Props:
 *   feature — key from FEATURE_LABELS (video_analysis | video_missions | ai_coach | one_on_one_calls)
 *   requiredTier — 'standard' | 'accelerator'
 *   de — language
 */
export const TierLockOverlay = ({
  feature = 'video_analysis',
  requiredTier = 'accelerator',
  de = true,
}) => {
  const navigate = useNavigate();
  const [showPaywall, setShowPaywall] = useState(false);
  const cfg = FEATURE_LABELS[feature] || FEATURE_LABELS.video_analysis;
  const isAccelerator = requiredTier === 'accelerator';
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0A]/75 backdrop-blur-md animate-fade-in p-6"
      data-testid="tier-lock-overlay"
    >
      <div className="max-w-md w-full space-y-5 text-center">
        <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-2xl ${
          isAccelerator
            ? 'bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] shadow-[#BFFF00]/30'
            : 'bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] border border-[#BFFF00]/30'
        }`}>
          {isAccelerator ? (
            <Crown size={32} className="text-[#0A0A0A]" />
          ) : (
            <Lock size={28} className="text-[#BFFF00]" />
          )}
        </div>

        <div className="space-y-2">
          <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${
            isAccelerator
              ? 'bg-[#BFFF00] text-[#0A0A0A]'
              : 'bg-[#BFFF00]/15 text-[#BFFF00] border border-[#BFFF00]/30'
          }`}>
            {isAccelerator ? '👑 OS PLUS EXCLUSIVE' : 'LEADERSHIP OS'}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{cfg.title}</h2>
          <p className="text-[13px] text-white/60">{cfg.subtitle}</p>
        </div>

        {/* Benefits list */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2.5 text-left backdrop-blur-sm">
          {cfg.benefits.map((b) => (
            <div key={b} className="flex items-start gap-2.5 text-[12.5px] text-white/80">
              <div className="w-5 h-5 rounded-full bg-[#BFFF00]/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={11} strokeWidth={3} className="text-[#BFFF00]" />
              </div>
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* Pricing strip */}
        {isAccelerator && (
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Leadership OS</p>
              <p className="text-xl font-black text-white mt-0.5">€997</p>
              <p className="text-[9px] text-white/40">/ Jahr</p>
            </div>
            <div className="flex-1 p-3 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/30 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#BFFF00]">OS PLUS</p>
              <p className="text-xl font-black text-[#BFFF00] mt-0.5">€4.797</p>
              <p className="text-[9px] text-white/40">+ 12× Coaching</p>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-2">
          <Button
            onClick={() => setShowPaywall(true)}
            className={`w-full font-bold h-11 btn-revolut ${
              isAccelerator
                ? 'bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#9ACC00]'
                : 'bg-white text-[#0A0A0A] hover:bg-white/90'
            }`}
            data-testid="tier-upgrade-btn"
          >
            {isAccelerator
              ? (de ? 'Leadership OS PLUS freischalten →' : 'Unlock Leadership OS PLUS →')
              : (de ? 'Leadership OS aktivieren →' : 'Activate Leadership OS →')}
          </Button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.Cal?.ns?.beratung) {
                  window.Cal.ns.beratung('modal', { calLink: 'leaderos/beratung' });
                } else {
                  window.open('https://cal.com/leaderos/beratung', '_blank', 'noopener,noreferrer');
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/50 hover:text-white/80 py-2 transition-colors"
              data-testid="book-call-btn"
            >
              <Calendar size={12} /> {de ? 'Strategiegespräch' : 'Strategy call'}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/50 hover:text-white/80 py-2 transition-colors"
              data-testid="tier-lock-back"
            >
              ← {de ? 'Zurück' : 'Back'}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-white/30">
          {de ? 'Bereits OS PLUS?' : 'Already OS PLUS?'}{' '}
          <a href="mailto:support@leader-os.de" className="text-[#BFFF00]/70 hover:text-[#BFFF00] underline">
            <Mail size={10} className="inline -mt-0.5" /> {de ? 'Support kontaktieren' : 'contact support'}
          </a>
        </p>
      </div>

      {showPaywall && (
        <PricingModal
          defaultTier={isAccelerator ? 'leadership_os_plus' : 'leadership_os'}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
};

export default TierLockOverlay;
