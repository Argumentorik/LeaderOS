import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// ── Reusable atoms ───────────────────────────────────────────────────────
export const ScoreChip = ({ value, label, color, gradient }) => (
  <div className="bg-white/[0.04] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-3 text-center">
    <p className="text-2xl font-black" style={{ color, fontFamily: 'Outfit, sans-serif' }}>{value || 0}</p>
    <div className="h-1 rounded-full bg-black/5 dark:bg-white/[0.05] mt-1.5 overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`} style={{ width: `${value || 0}%` }} />
    </div>
    <p className="text-[9px] text-muted-foreground mt-1.5 uppercase tracking-wider font-bold">{label}</p>
  </div>
);

// "Magic Box" — animated collapsible section with deep-dive content
export const MagicBox = ({ icon: Icon, title, accent = '#BFFF00', defaultOpen = false, children, testId }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${open
        ? 'border-[color:var(--mb-accent)] bg-white/60 dark:bg-white/[0.02] shadow-lg'
        : 'border-black/[0.06] dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.01] hover:border-[color:var(--mb-accent)] hover:bg-white/60 dark:hover:bg-white/[0.02]'}`}
      style={{ '--mb-accent': `${accent}50` }}
      data-testid={testId}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform"
          style={{ background: `${accent}1A`, color: accent, transform: open ? 'rotate(0deg)' : 'rotate(-4deg)' }}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-black tracking-tight leading-tight">{title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{open ? 'Klicke zum Schließen' : 'Klicke für tiefere Einblicke'}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground/60 shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground/60 shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 animate-fade-in">{children}</div>}
    </div>
  );
};
