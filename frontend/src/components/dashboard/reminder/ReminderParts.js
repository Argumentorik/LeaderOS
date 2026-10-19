import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Calendar, Clock, ArrowRight, Bell, X, CalendarPlus } from 'lucide-react';

const URGENCY = {
  now: { label_de: 'Jetzt', label_en: 'Now', bg: 'bg-red-500', pulse: true },
  today: { label_de: 'Heute', label_en: 'Today', bg: 'bg-[#BFFF00]', pulse: false },
  soon: { label_de: 'Bald', label_en: 'Soon', bg: 'bg-sky-500', pulse: false },
};

const formatDate = (date, de) =>
  date.toLocaleDateString(de ? 'de-DE' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' });

const formatTime = (date, de) =>
  date.toLocaleTimeString(de ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' });

export const ReminderUrgencyIcon = ({ urgency, isToday }) => (
  <div className={`w-9 h-9 rounded-xl ${urgency.bg} flex items-center justify-center shrink-0 ${urgency.pulse ? 'animate-pulse' : ''}`}>
    <Bell size={16} className={isToday ? 'text-[#0A0A0A]' : 'text-foreground'} />
  </div>
);

export const ReminderContent = ({ event, de }) => {
  const urgency = URGENCY[event.urgency] || URGENCY.soon;
  const isToday = event.urgency === 'today';
  const eventDate = new Date(event.date);
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <Badge className={`${urgency.bg} ${isToday ? 'text-[#0A0A0A]' : 'text-foreground'} text-[8px] font-bold border-0 px-1.5 py-0`}>
          {de ? urgency.label_de : urgency.label_en}
        </Badge>
        <span className="text-[10px] text-muted-foreground">{event.event_type}</span>
      </div>
      <p className="text-[12px] font-semibold truncate">{event.title}</p>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
        <span className="flex items-center gap-1"><Calendar size={9} />{formatDate(eventDate, de)}</span>
        <span className="flex items-center gap-1"><Clock size={9} />{formatTime(eventDate, de)}</span>
        <span>{event.duration}</span>
      </div>
    </div>
  );
};

export const ReminderActions = ({ event, de, onNavigate, onDismiss }) => (
  <div className="flex items-center gap-1.5 shrink-0">
    {event.google_calendar_url && (
      <button
        onClick={() => window.open(event.google_calendar_url, '_blank')}
        className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        data-testid="reminder-add-cal"
        title={de ? 'Zum Kalender' : 'Add to Calendar'}
      >
        <CalendarPlus size={12} />
      </button>
    )}
    <Button
      size="sm"
      onClick={() => onNavigate('/events')}
      className="bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] text-foreground text-[10px] font-bold h-7 px-3"
      data-testid="reminder-go-events"
    >
      {de ? 'Ansehen' : 'View'} <ArrowRight size={10} className="ml-1" />
    </Button>
    <button
      onClick={() => onDismiss(event.event_id)}
      className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
      data-testid="reminder-dismiss"
    >
      <X size={14} />
    </button>
  </div>
);

export { URGENCY };
