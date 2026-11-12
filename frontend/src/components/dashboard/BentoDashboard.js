import { Flame, Play, ArrowRight, MessageSquareText, Sparkles, CheckCircle2, CalendarDays, Clock, GraduationCap } from 'lucide-react';
import { WLAD_AVATAR } from '../../lib/brand';

// Apple-Fitness-Style Fortschrittsring (SVG). pct 0..1
const StreakRing = ({ pct, day, total }) => {
  const r = 40, c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <div className="relative shrink-0 w-[108px] h-[108px]" data-testid="streak-ring">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(191,255,0,0.15)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#BFFF00" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black leading-none">{day}</span>
        <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">/ {total}</span>
      </div>
    </div>
  );
};

const CardShell = ({ className = '', children, ...rest }) => (
  <div className={`bg-card text-card-foreground border border-black/[0.05] dark:border-white/[0.07] ${className}`} {...rest}>{children}</div>
);

export const BentoDashboard = ({ de, name, navigate, todayTask, c30, checkinDone, nextEvent, streak, onStartTask }) => {
  const day = todayTask?.day || c30?.current_day || 1;
  const total = todayTask?.total || 30;
  const pct = (c30?.progress_pct != null ? c30.progress_pct / 100 : day / total);
  const progressText = c30?.progress_pct != null ? c30.progress_pct : Math.round((day / total) * 100);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return de ? 'Guten Morgen' : 'Good morning';
    if (h < 17) return de ? 'Guten Tag' : 'Good afternoon';
    return de ? 'Guten Abend' : 'Good evening';
  })();

  const title = todayTask?.title_de || (de ? 'Die 3 Säulen der Überzeugung' : 'The 3 pillars of persuasion');
  const duration = todayTask?.duration || (de ? '10 Min. Audio & Praxis-Impuls' : '10 min audio & practice');
  const taskDone = todayTask?.done;

  const startTask = () => {
    if (day) onStartTask?.(day);
    navigate(todayTask?.path || '/challenge');
  };

  const pills = de
    ? ['Wie spreche ich schlechte Leistung an?', 'Feedback nach dem Review formulieren', 'Konflikt im Team deeskalieren']
    : ['How do I address poor performance?', 'Phrase feedback after a review', 'De-escalate a team conflict'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-stretch" data-testid="bento-dashboard">

      {/* 1 · Header & Streak */}
      <CardShell className="col-span-12 rounded-3xl shadow-sm p-6 sm:p-8 relative overflow-hidden" data-testid="bento-header-card">
        <div className="absolute -top-16 -right-10 w-56 h-56 bg-[#BFFF00]/[0.07] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-5 sm:gap-7 relative">
          <StreakRing pct={pct} day={day} total={total} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight break-words">{greeting}{name ? `, ${name}` : ''}</h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {de ? `Du bist auf Tag ${day} von ${total}. Bleib dran für dein Tagesziel.` : `You're on day ${day} of ${total}. Keep going for today's goal.`}
            </p>
            <div className="flex items-center gap-2.5 mt-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BFFF00]/12 border border-[#BFFF00]/25 text-[12px] font-bold">
                <Flame size={13} className="text-[#6B8A00] dark:text-[#BFFF00]" /> {de ? `Tag ${day} von ${total}` : `Day ${day} of ${total}`}
              </span>
              <span className="text-[12px] text-muted-foreground font-semibold">{de ? `${progressText}% des Programms absolviert` : `${progressText}% of the program done`}</span>
              {(streak?.days || 0) > 0 && (
                <span className="text-[12px] text-muted-foreground font-semibold">· {de ? `${streak.days}-Tage-Streak` : `${streak.days}-day streak`}</span>
              )}
            </div>
          </div>
        </div>
      </CardShell>

      {/* 2 · Hero Mission */}
      <div className="col-span-12 lg:col-span-7 h-full rounded-3xl shadow-xl relative overflow-hidden group bg-[#0A0A0A] text-white border border-[#BFFF00]/20 hover:border-[#BFFF00]/40 transition-all duration-300 p-6 sm:p-8" data-testid="bento-hero-card">
        <div className="absolute -bottom-20 -right-16 w-72 h-72 bg-[#BFFF00]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#BFFF00]/[0.16] transition-colors" />
        <div className="relative flex flex-col h-full">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#BFFF00]">{de ? 'Die Aufgabe für heute' : "Today's task"}</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-2 leading-snug">{title}</h2>
          <p className="text-sm text-white/55 font-medium mt-2 flex items-center gap-1.5"><Clock size={14} /> {duration}</p>
          <div className="mt-6 sm:mt-8">
            <button onClick={startTask} data-testid="bento-start-task-btn"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-extrabold text-[#0A0A0A] bg-[#BFFF00] hover:bg-[#D4FF4D] shadow-lg shadow-[#BFFF00]/25 transition-all hover:-translate-y-0.5 active:translate-y-0">
              {taskDone ? <CheckCircle2 size={17} /> : <Play size={16} />}
              {taskDone ? (de ? 'Erledigt — nochmal ansehen' : 'Done — review again') : (de ? 'Aufgabe starten' : 'Start task')}
            </button>
          </div>
        </div>
      </div>

      {/* 3 · WLAD AI AI Coach */}
      <CardShell className="col-span-12 lg:col-span-5 h-full rounded-3xl shadow-md p-6 flex flex-col" data-testid="bento-coach-card">
        <div className="flex items-center gap-3">
          <img src={WLAD_AVATAR} alt="Wlad" className="w-11 h-11 rounded-full object-cover ring-2 ring-[#BFFF00]/25 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-tight">{de ? 'WLAD AI KI-Coach' : 'WLAD AI AI coach'}</h3>
            <p className="text-[12px] text-muted-foreground">{de ? 'Dein Mentor für schwierige Führungsfragen' : 'Your mentor for tough leadership questions'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {pills.map((p, i) => (
            <button key={i} onClick={() => navigate('/chat')} data-testid={`bento-coach-pill-${i}`}
              className="text-left text-[12px] font-semibold px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#BFFF00]/15 hover:text-[#4A6200] dark:hover:text-[#BFFF00] border border-black/[0.04] dark:border-white/[0.06] transition-colors">
              {p}
            </button>
          ))}
        </div>
        <button onClick={() => navigate('/chat')} data-testid="bento-coach-open-btn"
          className="mt-4 w-full flex items-center justify-between gap-2 px-4 h-11 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] text-sm text-muted-foreground hover:border-[#BFFF00]/40 transition-colors">
          <span className="truncate">{de ? 'Stelle Wlad eine Frage…' : 'Ask Wlad a question…'}</span>
          <MessageSquareText size={16} className="text-[#6B8A00] dark:text-[#BFFF00] shrink-0" />
        </button>
      </CardShell>

      {/* 4 · Check-in */}
      <CardShell className="col-span-12 sm:col-span-6 lg:col-span-5 h-full rounded-2xl shadow-sm p-6 flex flex-col justify-between" data-testid="bento-checkin-card">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold">{de ? '2-Minuten Check-in' : '2-minute check-in'}</h3>
            {checkinDone && <CheckCircle2 size={16} className="text-[#6B8A00] dark:text-[#BFFF00]" />}
          </div>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            {checkinDone ? (de ? 'Heute erledigt. Stark — morgen wieder.' : 'Done today. Great — see you tomorrow.') : (de ? 'Zwei Minuten: Wie ist dein Tag gelaufen?' : 'Two minutes: how did your day go?')}
          </p>
        </div>
        <button onClick={() => navigate('/daily-checkin')} data-testid="bento-checkin-btn"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#4A6200] dark:text-[#BFFF00] hover:gap-2.5 transition-all w-fit">
          {checkinDone ? (de ? 'Ansehen' : 'View') : (de ? 'Jetzt reflektieren' : 'Reflect now')} <ArrowRight size={15} />
        </button>
      </CardShell>

      {/* 5 · Micro-Learning (Apple TV / Netflix Stil) */}
      <button onClick={() => navigate('/kurse')} data-testid="bento-microlearning-card"
        className="col-span-12 sm:col-span-6 lg:col-span-7 h-full rounded-3xl shadow-md overflow-hidden group text-left relative min-h-[150px] bg-[#0A0A0A] text-white border border-white/[0.07]">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0A0A] via-[#0A0A0A]/80 to-[#1b2a00]" />
        <div className="absolute -top-10 right-6 w-40 h-40 bg-[#BFFF00]/15 rounded-full blur-3xl" />
        <div className="relative p-6 flex items-center gap-5 h-full">
          <div className="w-14 h-14 rounded-2xl bg-[#BFFF00] flex items-center justify-center shrink-0 shadow-lg shadow-[#BFFF00]/30 group-hover:scale-110 transition-transform">
            <Play size={24} className="text-[#0A0A0A] ml-0.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#BFFF00]">{de ? 'Micro-Learning' : 'Micro-learning'}</span>
            <h3 className="text-base sm:text-lg font-black mt-1 leading-snug">Rhetorik-Grundlagen · {de ? 'Folge 1' : 'Episode 1'}</h3>
            <p className="text-[12px] text-white/50 mt-1 flex items-center gap-1.5"><GraduationCap size={13} /> {de ? 'Kurze Videofolge · unter 12 Min' : 'Short video · under 12 min'}</p>
          </div>
          <ArrowRight size={18} className="text-white/40 group-hover:text-[#BFFF00] group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </button>

      {/* 6 · Nächstes Live-Event — nur wenn ein echtes Event vorliegt */}
      {nextEvent && (
      <CardShell className="col-span-12 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-testid="bento-event-card">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#BFFF00]/12 border border-[#BFFF00]/20 flex items-center justify-center shrink-0">
            <CalendarDays size={20} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{de ? 'Nächstes Live-Event' : 'Next live event'}</span>
            <h3 className="text-[15px] font-bold mt-0.5 truncate">{nextEvent.title}</h3>
            {(nextEvent.when_label || nextEvent.date_label) && <p className="text-[12px] text-muted-foreground">{nextEvent.when_label || nextEvent.date_label}</p>}
          </div>
        </div>
        <button onClick={() => navigate('/events')} data-testid="bento-event-btn"
          className="inline-flex items-center justify-center gap-1.5 px-5 h-11 rounded-full font-bold text-sm bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#BFFF00]/15 hover:text-[#4A6200] dark:hover:text-[#BFFF00] border border-black/[0.05] dark:border-white/[0.08] transition-colors shrink-0">
          {de ? 'Teilnahme bestätigen' : 'Confirm attendance'}
        </button>
      </CardShell>
      )}
    </div>
  );
};
