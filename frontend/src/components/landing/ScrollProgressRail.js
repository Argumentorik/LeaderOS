import { useEffect, useState } from 'react';

const ITEMS = [
  { id: 'hero',         n: '00', label: 'Hero' },
  { id: 'how-it-works', n: '01', label: 'Pfad' },
  { id: 'benefit-01',   n: '02', label: 'Frameworks' },
  { id: 'benefit-02',   n: '03', label: 'Coach' },
  { id: 'benefit-03',   n: '04', label: 'Wlad' },
  { id: 'benefit-04',   n: '05', label: 'Zertifikat' },
  { id: 'benefit-05',   n: '06', label: 'WladBot' },
  { id: 'final-cta',    n: '07', label: 'Start' },
];

/**
 * ScrollProgressRail · floating right-side rail. Lit by
 * IntersectionObserver, click-to-anchor. Desktop only.
 */
export const ScrollProgressRail = () => {
  const [activeId, setActiveId] = useState('hero');

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0.1, 0.3, 0.5] }
    );
    ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <aside
      aria-label="Inhaltsverzeichnis"
      data-testid="landing-progress-rail"
      className="fixed top-1/2 -translate-y-1/2 right-5 lg:right-7 z-40 hidden lg:flex flex-col gap-2.5"
    >
      {ITEMS.map((item) => {
        const active = activeId === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="group flex items-center gap-3 justify-end"
            data-testid={`rail-${item.n}`}
          >
            <span
              className={`text-[9px] font-bold uppercase tracking-[0.2em] font-mono transition-all ${
                active
                  ? 'text-foreground translate-x-0 opacity-100'
                  : 'text-foreground/30 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
              }`}
            >
              {item.n} · {item.label}
            </span>
            <span
              className={`block rounded-full transition-all ${
                active
                  ? 'w-2.5 h-2.5 bg-brand shadow-[0_0_12px_2px_rgba(191,255,0,0.45)]'
                  : 'w-2 h-2 bg-foreground/25 group-hover:bg-foreground/60'
              }`}
              aria-hidden
            />
          </a>
        );
      })}
    </aside>
  );
};
