import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useCredits } from '../contexts/CreditContext';
import api from '../lib/api';
import logger from '../lib/logger';
import { toast } from 'sonner';
import {
  Calendar, Users, Clock, CheckCircle2, Video, Play, ArrowRight,
  Lock, Star, Zap, Target, Brain, Repeat, ChevronRight,
  CalendarPlus, Download, X, Plus, Trash2, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EventDetailModal } from '../components/events/EventDetailModal';
import { FocusTimeSetup } from '../components/events/FocusTimeSetup';

const TABS = [
  { id: 'live', label: { de: 'Live Events', en: 'Live Events' }, icon: Zap },
  { id: 'replay', label: { de: 'Bibliothek', en: 'Library' }, icon: Video },
  { id: 'private', label: { de: 'Exklusiv', en: 'Exclusive' }, icon: Lock },
  { id: 'focus', label: { de: 'Training Time', en: 'Training Time' }, icon: Target },
];

const TIER_STYLES = {
  free: { label: 'Free', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
  standard: { label: 'Standard', bg: 'bg-sky-50 dark:bg-sky-500/10 dark:bg-sky-50 dark:bg-sky-500/100/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-blue-500/20' },
  accelerator: { label: 'Accelerator', bg: 'bg-purple-50 dark:bg-[#7B3FE4]/10', text: 'text-purple-600 dark:text-[#A78BFA]', border: 'border-[#7B3FE4]/20 dark:border-[#7B3FE4]/20' },
};

const TYPE_STYLES = {
  live: { label: 'Live', dot: 'bg-red-500', badge: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
  workshop: { label: 'Workshop', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  replay: { label: 'Replay', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  focus_session: { label: 'Focus', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  mastermind: { label: 'Mastermind', dot: 'bg-[#7B3FE4]', badge: 'bg-purple-50 text-purple-600 dark:bg-[#7B3FE4]/10 dark:text-[#A78BFA]' },
  coaching: { label: '1:1 Coaching', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
};

export default function EventsPage() {
  const { lang } = useLanguage();
  const de = lang === 'de';
  const navigate = useNavigate();
  const { isPremium } = useCredits();
  const [activeTab, setActiveTab] = useState('live');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      const res = await api.get(`/events?tab=${activeTab}`);
      setEvents(res.data);
    } catch (err) { logger.error('Events load failed', err); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { setLoading(true); loadEvents(); }, [loadEvents]);

  const [calendarPrompt, setCalendarPrompt] = useState(null);

  const handleRegister = async (eventId) => {
    try {
      const res = await api.post(`/events/${eventId}/register`);
      toast.success(de ? 'Angemeldet!' : 'Registered!');
      loadEvents();
      if (selectedEvent?.event_id === eventId) {
        setSelectedEvent(prev => prev ? { ...prev, is_registered: true } : null);
      }
      // Show calendar prompt after successful registration
      if (res.data?.calendar?.google_calendar_url) {
        setCalendarPrompt(res.data.calendar);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const handleUnregister = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/unregister`);
      toast.success(de ? 'Abgemeldet' : 'Unregistered');
      loadEvents();
      if (selectedEvent?.event_id === eventId) {
        setSelectedEvent(prev => prev ? { ...prev, is_registered: false } : null);
      }
    } catch (err) { logger.error(err); }
  };

  // Split into featured + rest
  const featured = events.filter(e => e.featured);
  const regular = events.filter(e => !e.featured);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 xl:px-14 w-full min-h-screen" data-testid="events-page">
        {/* Event Detail Modal */}
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onRegister={handleRegister}
            onUnregister={handleUnregister}
            de={de}
            isPremium={isPremium}
          />
        )}

        {/* Calendar Prompt after Registration */}
        {calendarPrompt && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setCalendarPrompt(null)}>
            <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 text-center border border-black/[0.06] dark:border-white/[0.06] animate-slide-up" onClick={e => e.stopPropagation()} data-testid="calendar-prompt">
              <div className="w-14 h-14 rounded-2xl bg-[#BFFF00]/15 flex items-center justify-center mx-auto mb-4">
                <CalendarPlus size={24} className="text-[#BFFF00]" />
              </div>
              <h3 className="text-lg font-bold mb-1">{de ? 'Zum Kalender hinzufügen?' : 'Add to Calendar?'}</h3>
              <p className="text-sm text-muted-foreground mb-5">{calendarPrompt.title}</p>
              <div className="flex gap-2">
                <Button onClick={() => { window.open(calendarPrompt.google_calendar_url, '_blank'); setCalendarPrompt(null); }}
                  className="flex-1 bg-[#0A0A0A] dark:bg-white dark:text-black text-white font-bold h-11" data-testid="cal-google">
                  <CalendarPlus size={14} className="mr-1.5" /> Google
                </Button>
                <Button variant="outline" onClick={() => {
                  if (calendarPrompt.ics_content) {
                    const blob = new Blob([calendarPrompt.ics_content], { type: 'text/calendar' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                    a.download = 'event.ics'; a.click();
                  }
                  setCalendarPrompt(null);
                }} className="flex-1 font-bold h-11" data-testid="cal-outlook">
                  <Download size={14} className="mr-1.5" /> Outlook
                </Button>
              </div>
              <button onClick={() => setCalendarPrompt(null)} className="text-xs text-muted-foreground mt-3 hover:text-foreground">
                {de ? 'Jetzt nicht' : 'Not now'}
              </button>
            </div>
          </div>
        )}

        {/* Hero Header */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              {de ? 'Execution Hub' : 'Execution Hub'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            {de ? 'Events & Execution' : 'Events & Execution'}
          </h1>
          <p className="text-base text-muted-foreground max-w-xl">
            {de
              ? 'Live Workshops, Replays, Leadership Training Time — alles, um deine Leadership-Skills aktiv umzusetzen.'
              : 'Live workshops, replays, leadership training time — everything to actively execute your leadership skills.'}
          </p>
        </div>

        {/* Pill Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-gray-100 dark:bg-muted w-fit mb-8 animate-fade-in" data-testid="event-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon size={14} />
              {tab.label[lang] || tab.label.en}
              {activeTab === tab.id && events.length > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-black dark:bg-white text-white dark:text-black w-5 h-5 rounded-full flex items-center justify-center">
                  {events.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={`sk-${i}`} className="h-52 rounded-2xl skeleton-pulse" />
            ))}
          </div>
        )}

        {/* Featured Events Banner */}
        {!loading && featured.length > 0 && activeTab === 'live' && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                {de ? 'Empfohlen' : 'Recommended'}
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {featured.map(event => (
                <FeaturedEventCard
                  key={event.event_id}
                  event={event}
                  de={de}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Events Grid */}
        {!loading && (
          <div className="animate-fade-in">
            {regular.length > 0 || (featured.length === 0 && events.length > 0) ? (
              <>
                {activeTab !== 'live' && featured.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
                    {featured.map(event => (
                      <EventCard key={event.event_id} event={event} de={de} onClick={() => setSelectedEvent(event)} />
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                  {(activeTab === 'live' ? regular : events.filter(e => !e.featured)).map(event => (
                    <EventCard key={event.event_id} event={event} de={de} onClick={() => setSelectedEvent(event)} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState tab={activeTab} de={de} />
            )}
          </div>
        )}

        {/* Focus Time Setup (only on Focus tab) */}
        {activeTab === 'focus' && !loading && (
          <div className="mt-10 animate-fade-in">
            <FocusTimeSetup de={de} />
          </div>
        )}

        {/* Upgrade CTA */}
        {!isPremium && activeTab === 'private' && (
          <div className="mt-10 animate-fade-in">
            <Card className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white border-0 overflow-hidden">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#BFFF00]/12 border border-[#BFFF00]/25 flex items-center justify-center shrink-0">
                  <Lock size={22} strokeWidth={2.4} className="text-[#BFFF00]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{de ? 'Accelerator Zugang freischalten' : 'Unlock Accelerator Access'}</h3>
                  <p className="text-sm text-white/50">
                    {de
                      ? 'Mastermind Calls, 1:1 Coaching mit Wlads Expertenteam, exklusive Workshops — nur für Accelerator-Mitglieder.'
                      : 'Mastermind calls, 1:1 coaching with Wlad, exclusive workshops — Accelerator members only.'}
                  </p>
                </div>
                <Button onClick={() => navigate('/coaching')} className="bg-[#BFFF00] text-black hover:bg-[#D4FF4D] font-bold px-6 h-11 shrink-0" data-testid="upgrade-accelerator-btn">
                  {de ? 'Upgrade' : 'Upgrade'} <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


// ========== SUB-COMPONENTS ==========

function FeaturedEventCard({ event, de, onClick }) {
  const type = TYPE_STYLES[event.event_type] || TYPE_STYLES.live;
  const tier = TIER_STYLES[event.access_level] || TIER_STYLES.free;
  const eventDate = new Date(event.date);

  return (
    <button onClick={onClick} className="text-left w-full group" data-testid={`featured-event-${event.event_id}`}>
      <Card className="overflow-hidden border-black/[0.06] dark:border-white/[0.06] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#BFFF00]/10 to-transparent rounded-bl-full" />
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`${type.badge} text-[9px] font-bold border-0`}>{type.label}</Badge>
              <Badge className={`${tier.bg} ${tier.text} text-[9px] font-bold border-0`}>{tier.label}</Badge>
              {event.recurring && <Repeat size={12} className="text-white/40" />}
            </div>
            <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-[#BFFF00] transition-colors">{event.title}</h3>
            <p className="text-sm text-white/60 line-clamp-2">{event.description}</p>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {eventDate.toLocaleDateString(de ? 'de-DE' : 'en-US', { day: 'numeric', month: 'short' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {event.duration}
              </span>
              {event.max_participants && (
                <span className="flex items-center gap-1.5">
                  <Users size={13} />
                  {event.registered}/{event.max_participants}
                </span>
              )}
            </div>
            <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function EventCard({ event, de, onClick }) {
  const type = TYPE_STYLES[event.event_type] || TYPE_STYLES.live;
  const tier = TIER_STYLES[event.access_level] || TIER_STYLES.free;
  const eventDate = new Date(event.date);
  const isReplay = event.event_type === 'replay';

  return (
    <button onClick={onClick} className="text-left w-full group" data-testid={`event-card-${event.event_id}`}>
      <Card className="border-black/[0.04] dark:border-white/[0.06] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full">
        <CardContent className="p-5 flex flex-col h-full">
          {/* Top: Badges */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`${type.badge} text-[9px] font-bold border-0`}>
              {isReplay && <Play size={8} className="mr-1" />}
              {type.label}
            </Badge>
            <Badge className={`${tier.bg} ${tier.text} text-[9px] font-bold border-0`}>{tier.label}</Badge>
            {event.is_registered && <CheckCircle2 size={14} className="text-emerald-500 ml-auto" />}
          </div>

          {/* Title + Description */}
          <h3 className="text-[15px] font-bold leading-snug mb-1.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{event.title}</h3>
          <p className="text-[12px] text-muted-foreground line-clamp-2 mb-4 flex-1">{event.description}</p>

          {/* Outcomes preview */}
          {event.outcomes?.length > 0 && (
            <div className="mb-3 space-y-1">
              {event.outcomes.slice(0, 2).map((o, i) => (
                <div key={`out-${i}`} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                  <span className="line-clamp-2 sm:truncate">{o}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.04] text-[11px] text-muted-foreground mt-auto">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {eventDate.toLocaleDateString(de ? 'de-DE' : 'en-US', { day: 'numeric', month: 'short' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {event.duration}
            </span>
            {event.max_participants && (
              <span className="flex items-center gap-1 ml-auto">
                <Users size={11} />
                {event.registered}
              </span>
            )}
            {isReplay && (
              <span className="flex items-center gap-1 ml-auto text-sky-500 font-semibold">
                <Play size={10} /> {de ? 'Ansehen' : 'Watch'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function EmptyState({ tab, de }) {
  const messages = {
    live: de ? 'Neue Live Events werden bald angekündigt.' : 'New live events coming soon.',
    replay: de ? 'Die Replay-Bibliothek wird aufgebaut.' : 'The replay library is being built.',
    private: de ? 'Exklusive Events für Accelerator-Mitglieder.' : 'Exclusive events for Accelerator members.',
    focus: de ? 'Leadership Training Time wird eingerichtet.' : 'Leadership training time is being set up.',
  };
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-muted flex items-center justify-center mx-auto mb-4">
        <Calendar size={24} className="text-muted-foreground/30" />
      </div>
      <p className="text-sm text-muted-foreground">{messages[tab] || messages.live}</p>
    </div>
  );
}
