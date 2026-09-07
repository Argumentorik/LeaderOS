import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const KEY = 'wladbot_dashboard_more_open';

const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };

export const DashboardMore = ({ de, count, children }) => {
  const [open, setOpen] = useState(read);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* noop */ }
  };
  return (
    <section className="mt-8" data-testid="dashboard-more">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 py-3 group"
        data-testid="dashboard-more-toggle"
      >
        <span className="h-px flex-1 bg-black/[0.06] dark:bg-white/[0.08]" />
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground group-hover:text-foreground transition-colors">
          {open ? (de ? 'Weniger' : 'Less') : (de ? 'Mehr' : 'More')}
          {!open && count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] text-[10px] tabular-nums">{count}</span>}
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </span>
        <span className="h-px flex-1 bg-black/[0.06] dark:bg-white/[0.08]" />
      </button>
      {open && <div className="pt-2 cascade" data-testid="dashboard-more-content">{children}</div>}
    </section>
  );
};
