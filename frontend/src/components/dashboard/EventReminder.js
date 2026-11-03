import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { takeSlice } from '../../lib/dashboardBootstrap';
import { useFeature } from '../../hooks/useFeature';
import logger from '../../lib/logger';
import { ChevronRight } from 'lucide-react';
import { WladBotAvatar } from '../brand/WladBotAvatar';
import { ReminderUrgencyIcon, ReminderContent, ReminderActions, URGENCY } from './reminder/ReminderParts';

const useDismissedReminders = () => {
  const [dismissed, setDismissed] = useState(() => {
    const stored = sessionStorage.getItem('wladbot_reminder_dismissed');
    return stored ? JSON.parse(stored) : {};
  });

  const dismiss = (eventId) => {
    const updated = { ...dismissed, [eventId]: true };
    setDismissed(updated);
    sessionStorage.setItem('wladbot_reminder_dismissed', JSON.stringify(updated));
  };

  return { dismissed, dismiss };
};

export const EventReminderBanner = ({ de }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const { dismissed, dismiss } = useDismissedReminders();
  const eventHints = useFeature('event_hints');

  const loadReminders = useCallback(async () => {
    const pre = takeSlice('events_reminders');
    if (pre) { setData(pre); return; }
    try {
      const res = await api.get('/events-reminders');
      setData(res.data);
    } catch (err) { logger.error(err); }
  }, []);

  useEffect(() => { if (eventHints.enabled) loadReminders(); }, [loadReminders, eventHints.enabled]);

  if (!eventHints.enabled || !data) return null;

  const activeReminders = (data.reminders || []).filter(r => !dismissed[r.event_id]);
  const nextEvent = data.next_event && !dismissed[data.next_event?.event_id] ? data.next_event : null;
  const topReminder = activeReminders[0];
  if (!topReminder && !nextEvent) return null;

  const event = topReminder || nextEvent;
  const urgency = URGENCY[event.urgency] || URGENCY.soon;
  const isToday = event.urgency === 'today';

  // Iter 92.57 (Branding/FOMO): when there is no urgent reminder, show the
  // next live event as a branded dark hero strip with WladBot + countdown.
  if (!topReminder && nextEvent) {
    let daysLeft = null;
    try {
      daysLeft = Math.max(0, Math.ceil((new Date(nextEvent.date) - Date.now()) / 86400000));
    } catch { /* noop */ }
    let dateLabel = '';
    try {
      dateLabel = new Date(nextEvent.date).toLocaleDateString(de ? 'de-DE' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { /* noop */ }
    return (
      <div className="animate-fade-in mb-5" data-testid="event-reminder-banner">
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-gradient-to-r from-[#0A0A0A] via-[#111] to-[#16210A] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]">
          <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#BFFF00]/[0.10] blur-[50px] pointer-events-none" />
          <div className="relative flex items-center gap-3.5 p-4">
            <WladBotAvatar size={42} live />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#BFFF00] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {de ? 'Nicht verpassen · Nächstes Live-Event' : "Don't miss it · Next live event"}
              </p>
              <p className="text-[13.5px] font-bold text-white truncate mt-0.5">{nextEvent.title}</p>
              <p className="text-[11px] text-white/45 truncate">{dateLabel}{nextEvent.duration ? ` · ${nextEvent.duration}` : ''}{daysLeft !== null ? ` · ${de ? `in ${daysLeft} Tagen` : `in ${daysLeft} days`}` : ''}</p>
            </div>
            <button
              onClick={() => navigate('/events')}
              className="shrink-0 px-4 h-9 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[11.5px] font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-[#BFFF00]/20 hover:scale-[1.03] active:scale-[0.97]"
              data-testid="next-event-cta"
            >
              {de ? 'Platz sichern' : 'Save my seat'} <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mb-5" data-testid="event-reminder-banner">
      <Card className="border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-3">
            <ReminderUrgencyIcon urgency={urgency} isToday={isToday} />
            <ReminderContent event={event} de={de} />
            <ReminderActions event={event} de={de} onNavigate={navigate} onDismiss={dismiss} />
          </div>

          {activeReminders.length > 1 && (
            <div className="px-3 pb-2">
              <button onClick={() => navigate('/events')} className="text-[9px] text-muted-foreground hover:text-foreground transition-colors">
                +{activeReminders.length - 1} {de ? 'weitere Events' : 'more events'} <ChevronRight size={8} className="inline" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Small badge for sidebar · shows count of upcoming reminders
export const EventReminderCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/events-reminders');
        setCount((res.data?.reminders || []).length);
      } catch { /* silent */ }
    })();
  }, []);

  if (count === 0) return null;
  return (
    <span className="ml-auto w-4 h-4 rounded-full bg-red-500 text-foreground text-[8px] font-bold flex items-center justify-center" data-testid="event-reminder-badge">
      {count}
    </span>
  );
};
