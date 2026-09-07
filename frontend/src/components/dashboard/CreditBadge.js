import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Zap, Info } from 'lucide-react';
import { useCredits } from '../../contexts/CreditContext';

const LABELS = {
  chat: ['KI-Coach Nachricht', 'AI coach message'], quiz: ['Quiz-Runde', 'Quiz round'], roleplay: ['Rollenspiel', 'Roleplay'],
  video_mission: ['Video-Mission', 'Video mission'], simulation: ['Simulation', 'Simulation'], workflow: ['Workflow', 'Workflow'],
};
const label = (k, de) => (LABELS[k] || [k, k])[de ? 0 : 1];
const when = (iso, de) => { try { return new Date(iso).toLocaleString(de ? 'de-DE' : 'en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };

/** Credit-Badge mit Transparenz-Popover: Was kostet was · wofür ging es drauf · letzte Aktionen. */
export const CreditBadge = ({ de = true }) => {
  const { balance, isPremium, limit, costs, usedByAction, recent, totalUsed } = useCredits();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const rect = open ? btnRef.current?.getBoundingClientRect() : null;
  if (isPremium || balance < 0) return null;
  const used = Object.entries(usedByAction || {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className="relative">
      <button ref={btnRef} type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A0A0A] text-white hover:bg-[#1a1a1a] transition-colors" data-testid="credit-badge" aria-expanded={open}>
        <Zap size={12} className="text-[#BFFF00]" />
        <span className="text-[11px] font-bold">{balance}</span>
        <span className="text-[10px] text-white/40">Credits</span>
        <Info size={11} className="text-white/40" />
      </button>
      {open && rect && createPortal(
        <div className="fixed inset-0 z-[120]" onClick={() => setOpen(false)}>
        <div onClick={(e) => e.stopPropagation()} style={{ top: rect.bottom + 8, left: Math.max(8, Math.min(rect.right - 288, window.innerWidth - 296)) }}
             className="fixed w-72 rounded-xl border border-border bg-card shadow-2xl p-3 text-[12px] space-y-3 animate-fade-in" data-testid="credit-popover">
          <div>
            <p className="font-bold">{de ? `${balance} von ${limit ?? '–'} Credits übrig` : `${balance} of ${limit ?? '–'} credits left`}</p>
            <p className="text-muted-foreground text-[11px]">{de ? 'Jede KI-Aktion kostet 1 Credit. Mit Leader-OS unbegrenzt.' : 'Every AI action costs 1 credit. Unlimited with Leader-OS.'}</p>
          </div>
          {used.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">{de ? 'Wofür bisher' : 'Used for'} · {totalUsed}</p>
              <ul className="space-y-0.5" data-testid="credit-usage-list">
                {used.map(([k, v]) => <li key={k} className="flex justify-between"><span>{label(k, de)}</span><span className="font-bold">{v}</span></li>)}
              </ul>
            </div>
          )}
          {recent?.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">{de ? 'Zuletzt' : 'Recent'}</p>
              <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                {recent.slice(0, 5).map((r, i) => <li key={`${r.at}-${i}`} className="flex justify-between"><span>{label(r.action, de)}</span><span>{when(r.at, de)}</span></li>)}
              </ul>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">{de ? 'Kosten: ' : 'Costs: '}{Object.keys(costs || {}).map((k) => `${label(k, de)} 1`).join(' · ')}</p>
        </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
