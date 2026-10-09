import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Zap, Calendar, ArrowRight, MessageCircle, Video, Target, Wrench, Mic } from 'lucide-react';
import { useCredits } from '../../contexts/CreditContext';
import { usePricing } from '../../contexts/PricingContext';

/**
 * CreditsExhaustedDialog — EINE Meldung, wenn das KI-Guthaben leer ist.
 *
 * Kundenmeldung (Iter 185): „Kauffenster plus keine Credits" — bei leerem
 * Guthaben öffnete die App zusätzlich und ungefragt die Kaufabwicklung.
 * Jetzt: genau eine Meldung in Klartext (was verbraucht wurde, wofür, welche
 * Möglichkeiten es gibt). Der Kauf ist ein Klick DARIN.
 *
 * Gesperrter Bereich und leeres Guthaben sind getrennte Meldungen — nie
 * beide gleichzeitig (siehe DashboardLayout).
 */

const ACTION_LABELS = {
  chat: { label: 'Gespräche mit WladBot', icon: MessageCircle },
  video_mission: { label: 'Video-Auswertungen', icon: Video },
  simulation: { label: 'Gesprächs-Training', icon: Target },
  roleplay: { label: 'Challenger-Rollenspiele', icon: Mic },
  quiz: { label: 'Challenge-Aufgaben', icon: Target },
  workflow: { label: 'Werkzeuge', icon: Wrench },
};

export const CreditsExhaustedDialog = ({ onClose, detail = null }) => {
  const navigate = useNavigate();
  const { open: openPricing } = usePricing();
  const { totalUsed, usedByAction = {}, monthlyRefill, nextRefill } = useCredits();

  const refill = detail?.monthly_refill ?? monthlyRefill ?? 50;
  const refillDate = detail?.next_refill ?? nextRefill;
  const breakdown = Object.entries(usedByAction)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
         data-testid="credits-exhausted-dialog" role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-[460px] bg-white dark:bg-[#111] rounded-t-3xl sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#4A6200] dark:text-[#BFFF00]">
              <Zap size={11} /> KI-Guthaben
            </p>
            <h2 className="text-lg font-black mt-1 leading-tight">Dein Guthaben ist aufgebraucht</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Schließen"
                  className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
                  data-testid="credits-dialog-close">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <p className="text-[13.5px] leading-relaxed text-muted-foreground" data-testid="credits-dialog-message">
            Du hast <strong className="text-foreground">{totalUsed || 0}</strong> KI-Aktionen genutzt.
            Jede Aktion kostet 1 Credit. Deine Inhalte, Aufgaben und Kurse bleiben natürlich erreichbar —
            nur neue KI-Antworten brauchen Guthaben.
          </p>

          {breakdown.length > 0 && (
            <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] p-3.5 space-y-1.5" data-testid="credits-breakdown">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Wofür es draufging</p>
              {breakdown.map(([action, count]) => {
                const meta = ACTION_LABELS[action] || { label: action, icon: Zap };
                const Icon = meta.icon;
                return (
                  <div key={action} className="flex items-center gap-2 text-[13px]" data-testid={`credits-used-${action}`}>
                    <Icon size={13} className="text-muted-foreground shrink-0" />
                    <span className="flex-1">{meta.label}</span>
                    <span className="font-bold tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Deine Möglichkeiten</p>
            <div className="flex items-start gap-2.5 text-[13px]" data-testid="credits-option-wait">
              <Calendar size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
              <span>
                Warten: {refillDate ? `Am ${refillDate}` : 'Zum Monatsanfang'} kommen {refill} neue Credits dazu — kostenlos.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-[13px]" data-testid="credits-option-upgrade">
              <Zap size={14} className="mt-0.5 shrink-0 text-[#4A6200] dark:text-[#BFFF00]" />
              <span>Jetzt freischalten: unbegrenzte KI-Nutzung, alle Kurse, Gesprächs-Training und Video-Auswertung.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={() => { onClose?.(); openPricing(); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#BFFF00] px-4 py-3 text-[13px] font-black text-black transition-transform hover:-translate-y-0.5"
              data-testid="credits-dialog-upgrade-btn"
            >
              Unbegrenzt freischalten <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => { onClose?.(); navigate('/kurse'); }}
              className="inline-flex items-center justify-center rounded-xl border border-black/[0.1] dark:border-white/[0.12] px-4 py-3 text-[13px] font-bold"
              data-testid="credits-dialog-courses-btn"
            >
              Ohne KI weiterlernen
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CreditsExhaustedDialog;
