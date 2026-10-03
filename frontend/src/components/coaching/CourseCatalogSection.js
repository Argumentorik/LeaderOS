import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, ChevronUp, Clock, Lock, Play, Users } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { VideoThumb } from '../shared/VideoThumb';

const CourseRow = ({ course, dark, de }) => {
  const [open, setOpen] = useState(false);
  const freeCount = course.episodes.filter((e) => e.free_preview).length;
  return (
    <li className={`group overflow-hidden rounded-xl border transition-colors ${
      dark ? 'border-white/[0.08] bg-white/[0.04] hover:border-[#BFFF00]/40'
           : 'border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] hover:border-[#BFFF00]/50'}`}
        data-testid={`catalog-course-${course.slug}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-2.5 min-h-[56px] text-left"
              data-testid={`catalog-toggle-${course.slug}`}>
        <span className="relative w-[92px] shrink-0 overflow-hidden rounded-lg">
          <VideoThumb src={course.thumbnail_url} title={course.title} showPlay={false} />
          {!course.unlocked && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/55">
              <Lock size={13} className="text-[#BFFF00]" />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block line-clamp-2 sm:truncate text-[13.5px] font-bold">{course.title}</span>
          <span className={`mt-0.5 block text-[11px] ${dark ? 'text-white/50' : 'text-muted-foreground'}`}>
            <span className="whitespace-nowrap">{course.episode_count} {de ? 'Folgen' : 'episodes'} · {course.minutes_total} Min</span>
            {freeCount > 0 && <span className="ml-1.5 whitespace-nowrap font-bold text-[#4A6200] dark:text-[#BFFF00]">· {freeCount} {de ? 'gratis' : 'free'}</span>}
          </span>
          <span className={`mt-1 block line-clamp-1 text-[11px] italic ${dark ? 'text-white/35' : 'text-muted-foreground/70'}`}>{course.tagline}</span>
        </span>
        <span className="shrink-0 opacity-60 transition-transform group-hover:opacity-100">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>
      {open && (
        <ol className="animate-fade-in space-y-1 px-3 pb-3" data-testid={`catalog-episodes-${course.slug}`}>
          {course.episodes.map((ep) => (
            <li key={ep.id} className={`flex items-start gap-2 text-[12px] ${dark ? 'text-white/70' : 'text-foreground/80'}`}>
              <span className="mt-0.5 shrink-0">
                {ep.unlocked ? <Play size={10} className="text-[#4A6200] dark:text-[#BFFF00]" /> : <Lock size={10} className="opacity-50" />}
              </span>
              <span className="flex-1">
                {ep.number}. {ep.title}
                {ep.free_preview && <span className="ml-1 font-bold text-[#4A6200] dark:text-[#BFFF00]">· {de ? 'gratis' : 'free'}</span>}
              </span>
              <span className="shrink-0 opacity-60">{ep.minutes} Min</span>
            </li>
          ))}
        </ol>
      )}
    </li>
  );
};

const StatBand = ({ items }) => (
  <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="catalog-stat-band">
    {items.map((s, i) => (
      <div key={s.label} className="rounded-xl border border-black/[0.06] bg-white/60 p-3 dark:border-white/[0.08] dark:bg-white/[0.03]"
           style={{ animation: 'fadeIn 0.5s ease-out both', animationDelay: `${i * 70}ms` }}>
        <p className="text-2xl font-black tabular-nums leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>{s.value}</p>
        <p className="mt-1 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
      </div>
    ))}
  </div>
);

/** „Das steckt im Programm" — ein Kauf, alle 10 Kurse, 72 Folgen (Iter 189). */
export const CourseCatalogSection = ({ de = true, onCta }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/courses').then((r) => setData(r.data)).catch((e) => logger.warn('catalog load failed', e));
  }, []);

  const stats = useMemo(() => {
    if (!data) return [];
    const minutes = data.courses.reduce((n, c) => n + c.minutes_total, 0);
    return [
      { value: data.total_courses || data.courses.length, label: de ? 'Kurse' : 'Courses' },
      { value: data.total_episodes, label: de ? 'Folgen' : 'Episodes' },
      { value: `${Math.round(minutes / 60)} h`, label: de ? 'geballte Praxis' : 'of practice' },
      { value: data.launch?.label || '—', label: de ? 'Start' : 'Start' },
    ];
  }, [data, de]);

  if (!data) return null;
  const freeCount = data.courses.reduce((n, c) => n + c.episodes.filter((e) => e.free_preview).length, 0);
  const minutes = data.courses.reduce((n, c) => n + c.minutes_total, 0);
  const hasAccess = Boolean(data.has_access);

  return (
    <section className="animate-fade-in" data-testid="course-catalog-section">
      <div className="mb-7 max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A6200] dark:text-[#BFFF00]">
          {de ? 'Das steckt im Programm' : 'What the programme contains'}
        </p>
        <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
          {de
            ? <>10 Kurse. {data.total_episodes} Folgen. <span className="gradient-text">Jede unter 12 Minuten.</span></>
            : <>10 courses. {data.total_episodes} episodes. <span className="gradient-text">Each under 12 minutes.</span></>}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {de
            ? `Ein Kauf, alles drin: alle 10 Kurse, ${data.total_episodes} Folgen und die Live-Calls schalten am ${data.launch?.label} frei. Folge 1 jedes Kurses ist schon heute für alle offen — ${freeCount} Folgen zum Reinschauen.`
            : `One purchase, everything included: all 10 courses, ${data.total_episodes} episodes and the live calls unlock on ${data.launch?.label}. Episode 1 of every course is already open — ${freeCount} episodes to try.`}
        </p>
      </div>

      <StatBand items={stats} />

      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/[0.08] dark:bg-card"
           data-testid="catalog-package-all">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold ${
            hasAccess ? 'bg-[#BFFF00] text-black' : 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]'}`}
                data-testid="catalog-status-all">
            {hasAccess
              ? <><Check size={11} /> {de ? `Zugang gesichert · ab ${data.launch?.label}` : `Access secured · from ${data.launch?.label}`}</>
              : <><Lock size={11} /> {de ? `Schaltet am ${data.launch?.label} frei` : `Unlocks on ${data.launch?.label}`}</>}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock size={11} /> {minutes} Min {de ? 'gesamt' : 'total'}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Users size={11} /> {de ? 'Live-Calls inbegriffen' : 'live calls included'}
          </span>
        </div>
        <ul className="grid gap-2 lg:grid-cols-2">
          {data.courses.map((c) => <CourseRow key={c.slug} course={c} dark={false} de={de} />)}
        </ul>
        <button type="button" onClick={() => (hasAccess ? navigate('/kurse') : onCta?.())}
                className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-foreground text-[13px] font-black text-background transition-colors hover:opacity-90"
                data-testid="catalog-cta-all">
          {hasAccess
            ? (de ? 'Zum Studienplan' : 'Open curriculum')
            : (de ? 'Platz sichern' : 'Secure your seat')}
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
};
