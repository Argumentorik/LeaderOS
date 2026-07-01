import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, ArrowRight, Lock } from 'lucide-react';
import { usePricing } from '../../contexts/PricingContext';

const FEATURES = {
  '/simulations': {
    label: 'Simulationen',
    tagline: 'Verhandlung, Gehaltsgespräch, Konflikt: Trainiere die Gespräche, die über Karrieren entscheiden — mit einem KI-Gegenüber, das zurückredet.',
    benefits: [
      'Realistische KI-Rollenspiele mit Wlad-Feedback',
      'Schwierigkeitsgrade von Small Talk bis Eskalation',
      'Sofort-Auswertung: Was saß — und was nicht',
    ],
  },
  '/playbooks': {
    label: 'Playbooks',
    tagline: 'Wlads Frameworks als Schritt-für-Schritt-Anleitungen — für jede Führungssituation das richtige Skript, bevor du den Raum betrittst.',
    benefits: [
      'Erprobte Gesprächs-Skripte & Checklisten',
      'Vom Feedback-Gespräch bis zur Kündigung',
      'Direkt im Führungsalltag anwendbar',
    ],
  },
  '/tasks': {
    label: 'Aufgaben',
    tagline: 'Dein täglicher Leadership-Trainingsplan. Kleine Reps, große Wirkung — Führung wird zur Gewohnheit, nicht zum Zufall.',
    benefits: [
      'Personalisierte Daily Tasks aus deinem Lernpfad',
      'XP & Streaks, die Konsistenz belohnen',
      'Mit Chat, Missionen & Check-ins verzahnt',
    ],
  },
  '/tools': {
    label: 'Workflows',
    tagline: 'KI-Workflows, die dir Denkarbeit abnehmen — von der Meeting-Vorbereitung bis zur schwierigen E-Mail um 23 Uhr.',
    benefits: [
      '1-Klick-Vorlagen für Führungsaufgaben',
      'E-Mails, Feedback & Entscheidungsvorlagen',
      'Auf Wlads Methodik trainiert — nicht generisch',
    ],
  },
  '/lern-videos': {
    label: 'Lern-Videos',
    tagline: 'Wlads komplette Video-Bibliothek — kuratiert, durchsuchbar und auf den Punkt. Lernen, wann es in deinen Kalender passt.',
    benefits: [
      '28 Wochen Live-Kurs-Material',
      'Kapitel-genau durchsuchbar',
      'Mit WladBot-Chat & Missionen verknüpft',
    ],
  },
  '/events': {
    label: 'Events',
    tagline: 'Live-Sessions mit Wlad & der Community — Fragen stellen, Sparring bekommen, Netzwerk aufbauen.',
    benefits: [
      'Monatliche Live Q&As mit Wlad',
      'Community-Challenges & Workshops',
      'Alle Aufzeichnungen inklusive',
    ],
  },
};

/**
 * LockedFeatureModal — premium upgrade popup when a 🔒 nav item is clicked.
 * Replaces the old hard redirect to /coaching (Iter 92.49, Mert Godmode).
 */
export const LockedFeatureModal = ({ item, onClose }) => {
  const navigate = useNavigate();
  const { open: openPricing } = usePricing();
  const cfg = FEATURES[item.path] || { label: item.label, tagline: 'Dieser Bereich ist Teil von Leadership OS.', benefits: [] };
  const Icon = item.icon;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-5 bg-[#0A0A0A]/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      data-testid="locked-feature-modal"
    >
      <div
        className="relative w-full max-w-sm rounded-[26px] border border-white/[0.09] bg-gradient-to-b from-[#141414] to-[#0C0C0C] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'lockedModalIn 0.28s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Ambient glow */}
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-72 rounded-full bg-[#BFFF00]/[0.10] blur-[70px]" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors z-10"
          data-testid="locked-feature-close"
          aria-label="Schließen"
        >
          <X size={13} />
        </button>

        <div className="relative p-7 pt-9 text-center">
          {/* Icon tile with lock badge */}
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-[20px] bg-[#BFFF00] blur-xl opacity-25" />
            <div className="relative w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#1E1E1E] to-[#111] border border-[#BFFF00]/25 flex items-center justify-center text-[#BFFF00]">
              {Icon ? <Icon size={26} /> : <Lock size={24} />}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#BFFF00] flex items-center justify-center shadow-lg shadow-[#BFFF00]/40">
              <Lock size={11} strokeWidth={2.8} className="text-[#0A0A0A]" />
            </div>
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-[9.5px] font-black tracking-[0.14em] bg-[#BFFF00]/12 text-[#BFFF00] border border-[#BFFF00]/25 mb-3">
            LEADERSHIP OS
          </div>
          <h2 className="text-[21px] font-black text-white tracking-tight leading-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
            {cfg.label} freischalten
          </h2>
          <p className="text-[12.5px] text-white/50 leading-relaxed mt-2">{cfg.tagline}</p>

          {cfg.benefits.length > 0 && (
            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-2.5 text-left">
              {cfg.benefits.map((b) => (
                <div key={b} className="flex items-start gap-2.5 text-[12px] text-white/75">
                  <span className="w-[18px] h-[18px] rounded-full bg-[#BFFF00]/15 flex items-center justify-center shrink-0 mt-[1px]">
                    <Check size={10} strokeWidth={3.2} className="text-[#BFFF00]" />
                  </span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-white/40">
            <span className="font-black text-white text-base">€997</span>
            <span>/ Jahr · alle Bereiche · jederzeit kündbar</span>
          </div>

          <button
            onClick={() => { onClose(); openPricing('leadership_os'); }}
            className="mt-4 w-full h-11 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-bold text-[13.5px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#BFFF00]/25 hover:scale-[1.015] active:scale-[0.98]"
            data-testid="locked-feature-unlock-btn"
          >
            Jetzt freischalten <ArrowRight size={15} />
          </button>
          <button
            onClick={() => { onClose(); navigate('/coaching'); }}
            className="mt-2.5 w-full text-[11px] font-semibold uppercase tracking-wider text-white/35 hover:text-[#BFFF00] py-1.5 transition-colors"
            data-testid="locked-feature-compare-btn"
          >
            Alle Pläne vergleichen
          </button>
        </div>
      </div>

      <style>{`
        @keyframes lockedModalIn {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};
