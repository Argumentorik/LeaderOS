import { GraduationCap, Check, Zap } from 'lucide-react';
import { useCredits } from '../../contexts/CreditContext';

/**
 * MasterclassAccessCard — shown on /coaching for Wlad's masterclass clients.
 * Makes crystal clear: their access is already FREE (250 credits), the
 * packages below are optional upgrades only.
 */
export const MasterclassAccessCard = ({ de }) => {
  const { balance, totalUsed } = useCredits();
  const limit = 250;
  const used = Math.min(totalUsed || 0, limit);
  const pct = Math.min(100, Math.round((used / limit) * 100));

  const included = de
    ? ['WladBot KI-Coach (Wlads komplettes Kurswissen)', '30-Tage KI-Leadership Programm', 'Argumentations-Vorbereitung inkl. PDF-Export', 'Täglicher Check-in + Leader-Diagnose Sync', 'Live-Events & Community (Prelaunch)']
    : ['WladBot AI coach (Wlad\'s full course knowledge)', '30-day AI leadership program', 'Argumentation prep incl. PDF export', 'Daily check-in + leader diagnosis sync', 'Live events & community (prelaunch)'];

  return (
    <section className="max-w-3xl mx-auto" data-testid="masterclass-access-card">
      <div className="relative rounded-3xl border border-[#BFFF00]/30 bg-[#0A0A0A] p-7 sm:p-8 overflow-hidden">
        <div aria-hidden className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-[#BFFF00]/[0.13] blur-[60px] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BFFF00]/15 border border-[#BFFF00]/30 text-[9.5px] font-black tracking-[0.14em] text-[#BFFF00]">
              <GraduationCap size={11} /> MASTERCLASS-TEILNEHMER
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {de ? <>Dein Zugang ist bereits aktiv — <span className="text-[#BFFF00]">0 €</span>.</> : <>Your access is already active — <span className="text-[#BFFF00]">€0</span>.</>}
          </h2>
          <p className="text-[13.5px] text-white/55 mt-2 max-w-xl leading-relaxed">
            {de
              ? <>Als Argumentorik-Masterclass-Teilnehmer nutzt du Leader-OS kostenlos — mit <b className="text-white">250 Credits</b> statt der üblichen 50. Das ist alles enthalten:</>
              : <>As an Argumentorik masterclass client you use Leader-OS for free — with <b className="text-white">250 credits</b> instead of the usual 50. Everything included:</>}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4">
            {included.map((t) => (
              <div key={t} className="flex items-start gap-2 text-[12.5px] text-white/80">
                <Check size={13} className="text-[#BFFF00] shrink-0 mt-0.5" strokeWidth={3} /> {t}
              </div>
            ))}
          </div>

          {/* Credit meter */}
          <div className="mt-5 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07]" data-testid="masterclass-credit-meter">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                <Zap size={11} className="text-[#BFFF00]" /> {de ? 'Deine Credits' : 'Your credits'}
              </span>
              <span className="text-[12px] font-black text-white tabular-nums">{Math.max(0, balance)} / {limit}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-[#BFFF00] transition-all duration-700" style={{ width: `${100 - pct}%` }} />
            </div>
          </div>

          <p className="text-[11px] text-white/35 mt-4">
            {de
              ? 'Die Pakete unten sind optionale Upgrades (unbegrenzte Credits, 1:1 Coaching, Video-Kurse) — dein Masterclass-Zugang bleibt dauerhaft kostenlos.'
              : 'The packages below are optional upgrades (unlimited credits, 1:1 coaching, video courses) — your masterclass access stays free forever.'}
          </p>
        </div>
      </div>
    </section>
  );
};
