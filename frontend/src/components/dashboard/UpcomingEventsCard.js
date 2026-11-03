/**
 * UpcomingEventsCard · Dashboard surface for the next 3 upcoming events.
 *
 * Iter 92.10 (Mert): GSAP-choreographed entrance · header drops in, then
 * each row slide-reveals from the right with a staggered back-out easing.
 * Hover micro-interaction lifts each row 2px with a soft shadow halo.
 * Respects `prefers-reduced-motion` (skips animation entirely).
 */
import { useEffect, useRef, useState } from 'react';
import { Calendar, CalendarPlus, ChevronRight, Sparkles, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import api from '../../lib/api';
import { takeSlice } from '../../lib/dashboardBootstrap';
import logger from '../../lib/logger';

const OUTFIT = { fontFamily: 'Outfit, Inter, sans-serif' };

const formatEventDate = (iso, locale = 'de') => {
  if (!iso) return { dayLabel: '·', timeLabel: '', relative: null };
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffH = Math.round((d - now) / 36e5);
    const dayLabel = d.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      weekday: 'short', day: '2-digit', month: 'short',
    });
    const timeLabel = d.toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-US', {
      hour: '2-digit', minute: '2-digit',
    });
    const relative = diffH < 24 && diffH > 0
      ? `in ${diffH}h`
      : diffH < 168 && diffH > 0
        ? (locale === 'de' ? `in ${Math.round(diffH / 24)} Tagen` : `in ${Math.round(diffH / 24)} days`)
        : null;
    return { dayLabel, timeLabel, relative };
  } catch { return { dayLabel: '·', timeLabel: '', relative: null }; }
};

const prefersReduce = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

export const UpcomingEventsCard = ({ locale = 'de' }) => {
  const [events, setEvents] = useState(null);
  const [err, setErr] = useState(null);
  const de = locale === 'de';
  const rootRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const pre = takeSlice('events_live');
    (pre ? Promise.resolve({ data: pre }) : api.get('/events?tab=live'))
      .then((r) => {
        if (cancelled) return;
        const list = Array.isArray(r.data) ? r.data : (r.data?.events || []);
        const now = Date.now();
        const filtered = list
          .filter((e) => {
            if (!e.date) return false;
            try { return new Date(e.date).getTime() > now; } catch { return false; }
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        setEvents(filtered);
      })
      .catch((e) => {
        logger.error('UpcomingEventsCard fetch failed', e);
        setErr(true);
      });
    return () => { cancelled = true; };
  }, []);

  // GSAP entrance · fire once data resolved
  useEffect(() => {
    if (!rootRef.current || events === null || prefersReduce()) return undefined;
    let ctx;
    try {
      ctx = gsap.context(() => {
        if (!rootRef.current) return;
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        const header = rootRef.current.querySelector('[data-anim="events-header"]');
        const rows = rootRef.current.querySelectorAll('[data-anim="events-row"]');
        const see = rootRef.current.querySelector('[data-anim="events-see-all"]');
        if (header) tl.fromTo(header, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45 });
        if (rows.length) tl.fromTo(rows,
          { x: 16, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.55, stagger: 0.08, ease: 'back.out(1.4)' },
          '-=0.2');
        if (see) tl.fromTo(see, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, '-=0.15');
      }, rootRef);
    } catch { /* gsap target missing · degrade gracefully to instant render */ }
    return () => { try { ctx?.revert(); } catch { /* noop */ } };
  }, [events]);

  if (err || (events && events.length === 0)) {
    return (
      <div ref={rootRef} className="rounded-2xl bg-card border border-border overflow-hidden" data-testid="upcoming-events-card">
        <Header de={de} />
        <div className="px-5 pb-5 pt-1 text-center" data-testid="upcoming-events-empty">
          <Calendar size={20} className="mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-[12px] text-muted-foreground">
            {de ? 'Keine bevorstehenden Events.' : 'No upcoming events.'}
          </p>
          <Link to="/events" className="text-[11px] font-bold text-brand hover:underline mt-2 inline-block">
            {de ? 'Alle Events ansehen' : 'Browse all events'} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="rounded-2xl bg-card border border-border overflow-hidden relative"
      data-testid="upcoming-events-card"
    >
      {/* Subtle aurora glow behind the header · premium polish */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-48 h-48 rounded-full bg-brand/[0.06] blur-3xl" aria-hidden />
      <Header de={de} />
      <div className="px-3 pb-3 space-y-1.5 relative" data-testid="upcoming-events-list">
        {(events || [null, null, null]).map((event, idx) => (
          event
            ? <EventRow key={event.event_id} event={event} de={de} />
            : <RowSkeleton key={`sk-${idx}`} />
        ))}
      </div>
      <div className="px-5 pb-4 pt-1 relative" data-anim="events-see-all" style={{ opacity: events ? undefined : 0 }}>
        <Link
          to="/events"
          className="inline-flex items-center gap-1 text-[11.5px] font-bold text-foreground/80 hover:text-foreground hover:gap-1.5 transition-all"
          data-testid="upcoming-events-see-all"
        >
          {de ? 'Alle Events ansehen' : 'Browse all events'} <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
};

const Header = ({ de }) => (
  <div className="px-5 pt-4 pb-3 flex items-center justify-between relative" data-anim="events-header">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-brand/15 text-brand flex items-center justify-center">
        <Calendar size={13} />
      </div>
      <div>
        <h3 className="text-[13px] font-black tracking-tight" style={OUTFIT}>
          {de ? 'Deine Events' : 'Your Events'}
        </h3>
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-bold">
          {de ? 'Donnerstags · Wlad Cohort' : 'Thursdays · Wlad Cohort'}
        </p>
      </div>
    </div>
  </div>
);

const EventRow = ({ event, de }) => {
  const dt = formatEventDate(event.date, de ? 'de' : 'en');

  // Iter 92.11: Pure-CSS hover-lift via Tailwind transform classes ·
  // GSAP-based addEventListener pattern was prone to null-ref races
  // when the parent re-renders while the cursor is mid-hover.
  return (
    <div
      data-anim="events-row"
      className="group flex items-center gap-3 p-3 rounded-xl bg-background/40 dark:bg-background/30 hover:bg-foreground/[0.03] border border-border/40 hover:border-brand/30 hover:-translate-y-0.5 transition-all duration-200 will-change-transform"
      data-testid={`event-row-${event.event_id}`}
      style={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-brand/15 text-brand shrink-0 group-hover:bg-brand/25 transition-colors">
        <span className="text-[15px] font-black leading-none" style={OUTFIT}>
          {(dt.dayLabel || '').match(/\d+/)?.[0] || '·'}
        </span>
        <span className="text-[8px] uppercase tracking-wider font-bold opacity-70">
          {(dt.dayLabel || '').split(' ').pop()?.slice(0, 3)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-foreground leading-tight truncate" title={event.title}>
          {event.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock size={10} /> {dt.timeLabel}
          </span>
          {dt.relative && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand">
              <Sparkles size={9} /> {dt.relative}
            </span>
          )}
        </div>
      </div>
      <a
        href={event.google_calendar_url || `/events#${event.event_id}`}
        target="_blank"
        rel="noopener noreferrer"
        title={de ? 'Zu Kalender hinzufügen' : 'Add to calendar'}
        className="w-9 h-9 rounded-lg flex items-center justify-center bg-foreground/[0.04] hover:bg-foreground/[0.10] text-foreground/70 hover:text-foreground active:scale-90 transition-all shrink-0"
        data-testid={`event-add-calendar-${event.event_id}`}
        onClick={(e) => e.stopPropagation()}
      >
        <CalendarPlus size={14} />
      </a>
    </div>
  );
};

const RowSkeleton = () => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-foreground/[0.02] animate-pulse">
    <div className="w-12 h-12 rounded-xl bg-foreground/[0.06]" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-2/3 bg-foreground/[0.06] rounded" />
      <div className="h-2 w-1/3 bg-foreground/[0.04] rounded" />
    </div>
  </div>
);

export default UpcomingEventsCard;
