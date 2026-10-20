import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
  ArrowRight, Calendar, CheckCircle2, Clock, Flame, MessageSquareText,
  Play, Plus, BookOpen, User, Sparkles, Video, Lock, GraduationCap,
} from 'lucide-react';
import api from '../../../lib/api';
import logger from '../../../lib/logger';
import { toast } from 'sonner';
import { CreditCostHint, useCreditCost } from '../../shared/CreditCostHint';
import { WLAD_PORTRAIT } from '../../../lib/brand';

/**
 * Startseite (Iter 185): eine Sache pro Abschnitt, ein Satz Erklärung dazu.
 * Für jeden Kunden ist das hier das erste Mal.
 */

export const Section = ({ id, title, hint, action, children }) => (
  <section className="mb-10" data-testid={`home-section-${id}`}>
    <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
      <div className="min-w-0">
        <h2 className="text-base md:text-lg font-black tracking-tight">{title}</h2>
        <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-relaxed">{hint}</p>
      </div>
      {action}
    </div>
    {children}
  </section>
);

/** Standbild von Wlad. Fällt es aus, bleibt kein Loch im Layout zurück. */
export const WladPortrait = ({ sizeClass = 'w-16 h-16 sm:w-[86px] sm:h-[86px]', rounded = 'rounded-2xl', className = '', testid = 'home-wlad-portrait' }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img src={WLAD_PORTRAIT} alt="Wlad" loading="lazy"
         onError={() => setFailed(true)}
         className={`${sizeClass} ${rounded} object-cover shrink-0 ring-1 ring-black/[0.06] dark:ring-white/[0.08] ${className}`}
         data-testid={testid} />
  );
};

export const TodayHeader = ({ name, greeting, day, total, de }) => {
  const today = new Date().toLocaleDateString(de ? 'de-DE' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  return (
    <div className="mb-8 flex items-start gap-4 sm:gap-5" data-testid="home-today-header">
      {/* Iter 188: festes Standbild aus dem Videomaterial — immer da. */}
      <WladPortrait />
      <div className="min-w-0">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{today}</p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
          {greeting}, {name || 'Leader'}
        </h1>
        {day ? (
          <p className="text-[13px] text-muted-foreground mt-1.5 inline-flex items-center gap-1.5" data-testid="home-day-counter">
            <Flame size={13} className="text-[#6B8A00] dark:text-[#BFFF00]" />
            {de ? `Tag ${day} von ${total}` : `Day ${day} of ${total}`} · {de ? '30-Tage-Programm' : '30-day program'}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export const TodayTaskCard = ({ task, de, navigate, onStart, openCount = 0 }) => {
  if (!task) {
    return (
      <Card data-testid="home-task-empty"><CardContent className="p-5">
        <p className="text-sm font-bold">{de ? 'Tag 1 starten' : 'Start day 1'}</p>
        <p className="text-[13px] text-muted-foreground mt-1">
          {de ? 'Dein 30-Tage-Programm ist noch nicht gestartet.' : 'Your 30-day program has not started yet.'}
        </p>
        <Button onClick={() => navigate('/challenge')} className="mt-3 bg-[#BFFF00] text-black font-black hover:bg-[#D4FF4D]" data-testid="home-task-start-btn">
          <Play size={14} className="mr-1.5" /> {de ? 'Tag 1 starten' : 'Start day 1'}
        </Button>
      </CardContent></Card>
    );
  }
  const title = de ? task.title_de : (task.title_en || task.title_de);
  const desc = de ? task.desc_de : (task.desc_en || task.desc_de);
  const doneText = de ? task.done_de : (task.done_en || task.done_de);
  const started = Boolean(task.started) && !task.done;
  const go = () => {
    onStart?.(task.day);
    navigate(task.path || '/challenge');
  };
  return (
    <Card className="bg-[#0A0A0A] text-white border-0 overflow-hidden" data-testid="home-task-card">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#BFFF00]/80">
              {de ? `Tag ${task.day}` : `Day ${task.day}`}{task.done ? (de ? ' · erledigt' : ' · done') : ''}
            </p>
            <h3 className="text-lg font-black mt-1 leading-snug">{title}</h3>
            <p className="text-[13.5px] text-white/60 mt-1.5 leading-relaxed">{desc}</p>
            <p className="text-[11.5px] text-white/40 mt-2 inline-flex items-center gap-1.5">
              <Clock size={11} /> {task.duration || '10 Min'}{started ? (de ? ' · begonnen' : ' · started') : ''}
            </p>
            {doneText && (
              <div className="mt-3 rounded-xl bg-white/[0.06] border border-white/[0.08] px-3.5 py-2.5" data-testid="home-today-done-criteria">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#BFFF00]/70">
                  {de ? 'Erledigt ist, wenn' : 'Done when'}
                </p>
                <p className="text-[13px] text-white/80 mt-1 leading-relaxed">{doneText}</p>
              </div>
            )}
            {openCount > 1 && (
              <p className="text-[12px] text-white/45 mt-2.5" data-testid="home-task-open-hint">
                {de
                  ? `${openCount} Aufgaben liegen noch offen — nichts ist verloren, du holst sie in Ruhe nach.`
                  : `${openCount} tasks are still open — nothing is lost, catch up at your pace.`}
              </p>
            )}
          </div>
          <div className="shrink-0">
            {task.done ? (
              <Button onClick={() => navigate('/challenge')} className="bg-white/10 hover:bg-white/15 text-white font-bold h-11 px-5" data-testid="home-task-next-btn">
                <CheckCircle2 size={14} className="mr-1.5 text-[#BFFF00]" /> {de ? 'Nächste Aufgabe ansehen' : 'See next task'}
              </Button>
            ) : (
              <Button onClick={go} className="bg-[#BFFF00] text-black hover:bg-[#D4FF4D] font-black h-11 px-5 w-full sm:w-auto" data-testid="home-task-open-btn">
                <Play size={14} className="mr-1.5" />
                {started ? (de ? 'Weitermachen' : 'Continue') : (de ? 'Jetzt machen' : 'Do it now')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CheckinRow = ({ done, de, navigate }) => (
  <Card data-testid="home-checkin-row"><CardContent className="p-4 flex flex-wrap items-center gap-3">
    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500/15' : 'bg-[#BFFF00]/15'}`}>
      {done ? <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" /> : <Sparkles size={16} className="text-[#4A6200] dark:text-[#BFFF00]" />}
    </span>
    <p className="flex-1 min-w-0 text-[13.5px] font-semibold">
      {done
        ? (de ? 'Check-in für heute ist gemacht.' : "Today's check-in is done.")
        : (de ? 'Zwei Minuten: Wie ist dein Tag gelaufen?' : 'Two minutes: how did your day go?')}
    </p>
    <Button variant={done ? 'outline' : 'default'} size="sm" onClick={() => navigate('/daily-checkin')}
            className={done ? 'h-9 text-[12px]' : 'h-9 text-[12px] bg-[#0A0A0A] dark:bg-white dark:text-black text-white font-bold'}
            data-testid="home-checkin-btn">
      {done ? (de ? 'Ansehen' : 'View') : (de ? 'Check-in starten' : 'Start check-in')}
    </Button>
  </CardContent></Card>
);

const EXAMPLE_QUESTIONS_DE = [
  'Wie spreche ich einen Mitarbeiter auf schlechte Leistung an?',
  'Wie bereite ich ein Gehaltsgespräch vor?',
  'Mein Team zieht nicht mit — wo fange ich an?',
];
const EXAMPLE_QUESTIONS_EN = [
  'How do I address poor performance with an employee?',
  'How do I prepare for a salary negotiation?',
  'My team is not pulling together — where do I start?',
];

export const AskCoachCard = ({ de, navigate }) => {
  const [text, setText] = useState('');
  const { blocked, hint } = useCreditCost('chat');
  const go = (question) => {
    const q = (question || text).trim();
    if (!q) return;
    navigate(`/chat?prefill=${encodeURIComponent(q)}`);
  };
  const examples = de ? EXAMPLE_QUESTIONS_DE : EXAMPLE_QUESTIONS_EN;
  return (
    <Card data-testid="home-ask-coach"><CardContent className="p-5 space-y-3">
      <div className="flex items-center gap-3">
        <WladPortrait sizeClass="w-12 h-12" rounded="rounded-full" testid="home-coach-portrait" />
        <p className="text-[12.5px] text-muted-foreground leading-snug">
          {de ? 'Wlad antwortet dir — in seinen Worten, mit seinen Methoden.' : 'Wlad answers you — in his words, with his methods.'}
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
          placeholder={de ? 'Deine Frage an WladBot…' : 'Your question for WladBot…'}
          className="h-11"
          data-testid="home-coach-input"
        />
        <Button onClick={() => go()} disabled={blocked || !text.trim()} title={hint}
                className="h-11 bg-[#BFFF00] text-black hover:bg-[#D4FF4D] font-black shrink-0" data-testid="home-coach-send-btn">
          <MessageSquareText size={14} className="mr-1.5" /> {de ? 'Fragen' : 'Ask'}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {examples.map((q) => (
          <button key={q} type="button" onClick={() => go(q)} disabled={blocked}
                  className="text-left text-[12px] font-semibold rounded-full border border-black/[0.08] dark:border-white/[0.12] px-3 py-1.5 hover:border-[#BFFF00] disabled:opacity-50 transition-colors"
                  data-testid="home-coach-example">
            {q}
          </button>
        ))}
      </div>
      <CreditCostHint action="chat" />
    </CardContent></Card>
  );
};

export const CoursesCard = ({ status, de, navigate, onUnlock }) => {
  const next = status?.next_episode;
  const unlocked = status?.unlocked_episodes ?? 0;
  const total = status?.total_episodes ?? 0;
  return (
    <Card data-testid="home-courses-card"><CardContent className="p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold">
        <BookOpen size={15} className="text-[#4A6200] dark:text-[#BFFF00]" />
        <span data-testid="home-courses-count">
          {de ? `${unlocked} von ${total} Folgen für dich freigeschaltet` : `${unlocked} of ${total} episodes unlocked for you`}
        </span>
      </div>
      {next ? (
        <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-3.5" data-testid="home-courses-next">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
            {de ? 'Als Nächstes' : 'Up next'}
          </p>
          <p className="text-[13.5px] font-bold mt-0.5">{next.course} · {de ? 'Folge' : 'Episode'} {next.number}: {next.title}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">{next.minutes} {de ? 'Minuten' : 'minutes'}</p>
          <Button size="sm" onClick={() => navigate(`/kurse/${next.slug}`)} className="mt-2.5 h-9 text-[12px] bg-[#0A0A0A] dark:bg-white dark:text-black text-white font-bold" data-testid="home-courses-start-btn">
            <Play size={13} className="mr-1.5" /> {de ? 'Folge starten' : 'Start episode'}
          </Button>
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">
          {de ? 'Du hast alle freigeschalteten Folgen gesehen.' : 'You have seen all unlocked episodes.'}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={() => navigate('/kurse')} className="h-9 text-[12px]" data-testid="home-courses-all-btn">
          {de ? 'Alle Kurse ansehen' : 'See all courses'} <ArrowRight size={12} className="ml-1" />
        </Button>
        {unlocked < total && (
          <Button size="sm" onClick={onUnlock} className="h-9 text-[12px] bg-[#BFFF00] text-black hover:bg-[#D4FF4D] font-black" data-testid="home-courses-unlock-btn">
            <Lock size={12} className="mr-1.5" /> {de ? 'Restliche Folgen freischalten' : 'Unlock remaining episodes'}
          </Button>
        )}
      </div>
    </CardContent></Card>
  );
};

/**
 * Iter 188: „Meine Aufgaben" steht wieder sichtbar auf dem Dashboard — der
 * Menüpunkt bleibt draußen. Drei offene Aufgaben, jede direkt abhakbar.
 */
export const MyTasksCard = ({ de, navigate }) => {
  const [tasks, setTasks] = useState(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api.get('/tasks')
      .then((r) => setTasks((r.data || []).filter((t) => t.status !== 'completed')))
      .catch((err) => { logger.error('tasks load failed', err); setTasks([]); });
  }, []);

  const complete = async (task) => {
    setBusy(task.task_id);
    try {
      await api.put(`/tasks/${task.task_id}`, { status: 'completed' });
      setTasks((prev) => (prev || []).filter((t) => t.task_id !== task.task_id));
      toast.success(de ? 'Erledigt.' : 'Done.');
    } catch (err) {
      logger.error('task complete failed', err);
      toast.error(de ? 'Das hat nicht geklappt.' : 'That did not work.');
    } finally { setBusy(''); }
  };

  if (tasks === null) {
    return (
      <Card data-testid="home-my-tasks-loading"><CardContent className="p-5">
        <p className="text-[13px] text-muted-foreground">{de ? 'Lade deine Aufgaben…' : 'Loading your tasks…'}</p>
      </CardContent></Card>
    );
  }

  if (!tasks.length) {
    return (
      <Card data-testid="home-my-tasks-empty"><CardContent className="p-5">
        <p className="text-sm font-bold">{de ? 'Nichts offen' : 'Nothing open'}</p>
        <p className="text-[13px] text-muted-foreground mt-1">
          {de ? 'Du hast gerade keine offene Aufgabe. Lege unten eine an, wenn dir etwas einfällt.'
              : 'You have no open task right now. Create one below whenever something comes up.'}
        </p>
        <Button variant="ghost" onClick={() => navigate('/tasks')} className="mt-2 h-9 px-2 font-bold text-[12.5px]" data-testid="home-my-tasks-all-empty-btn">
          {de ? 'Alle Aufgaben ansehen' : 'See all tasks'} <ArrowRight size={13} className="ml-1.5" />
        </Button>
      </CardContent></Card>
    );
  }

  return (
    <Card data-testid="home-my-tasks"><CardContent className="p-2.5">
      <ul className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
        {tasks.slice(0, 3).map((task) => (
          <li key={task.task_id} className="flex items-start gap-3 px-2.5 py-3" data-testid={`home-task-row-${task.task_id}`}>
            <button type="button" onClick={() => complete(task)} disabled={busy === task.task_id}
              aria-label={de ? 'Als erledigt markieren' : 'Mark as done'}
              className="-m-2.5 p-2.5 shrink-0 flex items-start disabled:opacity-40"
              data-testid={`home-task-done-${task.task_id}`}>
              <span className="w-[20px] h-[20px] rounded-[6px] border-2 border-black/20 dark:border-white/25 hover:border-[#6B8A00] dark:hover:border-[#BFFF00] hover:bg-[#BFFF00]/15 transition-colors" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold leading-snug">{task.title}</p>
              {task.description && <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>}
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-2 px-2.5 pt-1 pb-1.5">
        <p className="text-[11.5px] text-muted-foreground">
          {de ? `${tasks.length} offen` : `${tasks.length} open`}
        </p>
        <Button variant="ghost" onClick={() => navigate('/tasks')} className="h-9 px-2 font-bold text-[12.5px]" data-testid="home-my-tasks-all-btn">
          {de ? 'Alle Aufgaben ansehen' : 'See all tasks'} <ArrowRight size={13} className="ml-1.5" />
        </Button>
      </div>
    </CardContent></Card>
  );
};

export const QuickTaskCard = ({ de }) => {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const create = async () => {
    const value = title.trim();
    if (!value) return;
    setSaving(true);
    try {
      await api.post('/tasks', { title: value, priority: 'medium' });
      setTitle('');
      toast.success(de ? 'Aufgabe angelegt.' : 'Task created.');
    } catch (err) {
      logger.error('quick task failed', err);
      toast.error(err?.response?.data?.detail || (de ? 'Aufgabe konnte nicht angelegt werden.' : 'Could not create task.'));
    } finally { setSaving(false); }
  };
  return (
    <Card data-testid="home-quick-task"><CardContent className="p-4 flex gap-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)}
             onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
             placeholder={de ? 'Was willst du dir vornehmen?' : 'What do you want to take on?'}
             className="h-11" data-testid="home-task-input" />
      <Button onClick={create} disabled={saving || !title.trim()} className="h-11 shrink-0 font-bold" data-testid="home-task-create-btn">
        <Plus size={14} className="mr-1.5" /> {de ? 'Anlegen' : 'Create'}
      </Button>
    </CardContent></Card>
  );
};

export const AboutYouCard = ({ user, de, onSaved, onSkip }) => {
  const [form, setForm] = useState({
    position: user?.position || '', team_size: user?.team_size || '', current_goal: user?.current_goal || '',
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/profile/me', form);
      toast.success(de ? 'Danke — das hilft bei jeder Antwort.' : 'Thanks — this helps every answer.');
      onSaved?.(form);
    } catch (err) {
      logger.error('about you failed', err);
      toast.error(de ? 'Speichern fehlgeschlagen.' : 'Saving failed.');
    } finally { setSaving(false); }
  };
  return (
    <Card data-testid="home-about-you"><CardContent className="p-5 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
               placeholder={de ? 'Deine Rolle' : 'Your role'} data-testid="home-about-position" />
        <Input value={form.team_size} onChange={(e) => setForm({ ...form, team_size: e.target.value })}
               placeholder={de ? 'Teamgröße' : 'Team size'} data-testid="home-about-team" />
        <Input value={form.current_goal} onChange={(e) => setForm({ ...form, current_goal: e.target.value })}
               placeholder={de ? 'Aktuelles Ziel' : 'Current goal'} data-testid="home-about-goal" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={saving} className="h-9 text-[12px] font-bold" data-testid="home-about-save-btn">
          <User size={13} className="mr-1.5" /> {de ? 'Speichern' : 'Save'}
        </Button>
        <button type="button" onClick={onSkip} className="min-h-[44px] px-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground" data-testid="home-about-skip-btn">
          {de ? 'Später' : 'Later'}
        </button>
      </div>
    </CardContent></Card>
  );
};

export const NextEventRow = ({ event, de, navigate }) => {
  if (!event) return null;
  const when = event.starts_at || event.date || event.start_time;
  const label = when
    ? new Date(when).toLocaleString(de ? 'de-DE' : 'en-US', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';
  return (
    <Card data-testid="home-next-event"><CardContent className="p-4 flex flex-wrap items-center gap-3">
      <span className="w-9 h-9 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center shrink-0">
        <Calendar size={16} className="text-[#4A6200] dark:text-[#BFFF00]" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold line-clamp-2 sm:truncate">{event.title}</p>
        {label && <p className="text-[12px] text-muted-foreground">{label}{de ? ' Uhr' : ''}</p>}
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate('/events')} className="h-9 text-[12px]" data-testid="home-event-btn">
        {de ? 'Zum Event' : 'To event'}
      </Button>
    </CardContent></Card>
  );
};

export const ProgressLine = ({ levelName, daysIn, videosSeen, eventsAttended, de }) => (
  <Card data-testid="home-progress-line"><CardContent className="p-4">
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
      <span className="inline-flex items-center gap-1.5 font-bold">
        <Sparkles size={13} className="text-[#4A6200] dark:text-[#BFFF00]" /> {levelName}
      </span>
      <span className="text-muted-foreground">{de ? `${daysIn} Tage dabei` : `${daysIn} days in`}</span>
      <span className="text-muted-foreground inline-flex items-center gap-1.5">
        <Video size={13} /> {de ? `${videosSeen} Folgen gesehen` : `${videosSeen} episodes watched`}
      </span>
      {eventsAttended > 0 && (
        <span className="text-muted-foreground inline-flex items-center gap-1.5">
          <Calendar size={13} /> {de ? `${eventsAttended} Live-Events besucht` : `${eventsAttended} live events attended`}
        </span>
      )}
    </div>
  </CardContent></Card>
);

export const LabCard = ({ enrolled, de, navigate }) => (
  <Card data-testid="home-lab-card"><CardContent className="p-5 space-y-2.5">
    <p className="text-[13.5px] font-bold inline-flex items-center gap-2">
      <GraduationCap size={15} className="text-[#4A6200] dark:text-[#BFFF00]" /> Leadership LAB
    </p>
    <p className="text-[13px] text-muted-foreground leading-relaxed">
      {enrolled
        ? (de ? 'Du bist angemeldet. Deine Gruppe und die Live-Termine stehen im LAB.' : 'You are enrolled. Your group and live calls are in the LAB.')
        : (de ? '72 Folgen, Live-Calls mit Begleitung und ein Coach, der deine Lage kennt — der Schritt nach den 30 Tagen.' : '72 episodes, guided live calls and a coach who knows your situation — the step after the 30 days.')}
    </p>
    <Button size="sm" onClick={() => navigate('/leadership-lab')} className="h-9 text-[12px] bg-[#0A0A0A] dark:bg-white dark:text-black text-white font-bold" data-testid="home-lab-btn">
      {enrolled ? (de ? 'Zum LAB' : 'To the LAB') : (de ? 'LAB ansehen' : 'See the LAB')} <ArrowRight size={12} className="ml-1" />
    </Button>
  </CardContent></Card>
);
