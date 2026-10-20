import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Clock, Lock, Mail, Play, Users, Video } from 'lucide-react';
import { LEVEL_LABEL, t } from './courseMeta';
import { VideoThumb } from '../shared/VideoThumb';

const LEVEL_ORDER = ['grundlagen', 'aufbau', 'executive'];
const LEVEL_HINT = {
  grundlagen: { de: 'Das Fundament — hier fängt jeder an.', en: 'The foundation — everyone starts here.' },
  aufbau: { de: 'Aufbau — wenn die Grundlagen sitzen.', en: 'Advanced — once the basics are in place.' },
  executive: { de: 'Executive — Boardroom, Change, Präsenz.', en: 'Executive — boardroom, change, presence.' },
};

const Stat = ({ value, label, testid }) => (
  <div data-testid={testid}>
    <p className="text-2xl sm:text-3xl font-black text-[#BFFF00] leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
    <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-white/45 mt-1.5">{label}</p>
  </div>
);

export const UniversityHero = ({ data, de, onSecure }) => {
  const launch = data?.launch || {};
  const hours = Math.round((data?.total_minutes || 0) / 60);
  return (
    <section className="relative rounded-3xl bg-[#0A0A0A] text-white overflow-hidden" data-testid="university-hero">
      <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
      <div aria-hidden className="absolute -right-32 -top-32 w-[28rem] h-[28rem] rounded-full bg-[#BFFF00]/20 blur-3xl" />
      <div className="relative p-7 sm:p-10 xl:p-14">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#BFFF00]">
          {de ? 'Leadership LAB · die Universität' : 'Leadership LAB · the university'}
        </p>
        <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black mt-3 leading-[1.05] max-w-3xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {de ? 'Ein Semester Führung. 10 Kurse, 72 Folgen, Live-Calls.' : 'One semester of leadership. 10 courses, 72 episodes, live calls.'}
        </h1>
        <p className="text-sm sm:text-base text-white/60 mt-4 max-w-2xl leading-relaxed">
          {de
            ? `Der Studienplan steht komplett offen — jede Folge mit Titel und Dauer. Los geht es am ${launch.label}.`
            : `The full curriculum is open — every episode with title and length. It all starts on ${launch.label}.`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-9 max-w-3xl">
          <Stat value={data?.total_courses || 10} label={de ? 'Kurse' : 'Courses'} testid="hero-stat-courses" />
          <Stat value={data?.total_episodes || 72} label={de ? 'Folgen' : 'Episodes'} testid="hero-stat-episodes" />
          <Stat value={`${hours} h`} label={de ? 'Videomaterial' : 'Video material'} testid="hero-stat-hours" />
          <Stat value={launch.label || '—'} label={de ? 'Start' : 'Start'} testid="hero-stat-launch" />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-9">
          {data?.has_access ? (
            <span className="inline-flex items-center gap-2 h-12 px-5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[13px] font-black" data-testid="university-secured">
              <Check size={15} /> {de ? `Zugang gesichert · schaltet am ${launch.label} frei` : `Access secured · unlocks on ${launch.label}`}
            </span>
          ) : (
            <button type="button" onClick={onSecure}
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#BFFF00] text-black text-[13.5px] font-black transition-transform hover:-translate-y-0.5"
                    data-testid="university-secure-btn">
              {de ? 'Platz sichern' : 'Secure your seat'} <ArrowRight size={15} />
            </button>
          )}
          {!launch.launched && (
            <span className="text-[12.5px] text-white/50" data-testid="university-countdown">
              {de ? `Noch ${launch.days_until} Tage bis zum Start` : `${launch.days_until} days until the start`}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export const LabBlock = ({ de, launch }) => (
  <section className="mt-8 rounded-3xl border border-[#BFFF00]/25 bg-white dark:bg-card p-6 sm:p-8 xl:p-10" data-testid="courses-lab-block">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A6200] dark:text-[#BFFF00]">Leadership LAB</p>
    <h2 className="text-xl sm:text-2xl font-black mt-2 leading-tight max-w-2xl">
      {de ? 'So wird aus den Kursen ein Semester' : 'This is how the courses become a semester'}
    </h2>
    <p className="text-[13.5px] text-muted-foreground mt-2 max-w-2xl leading-relaxed">
      {de
        ? 'Die 72 Folgen sind das Material. Das LAB ist der Rahmen: eine Startgruppe, die mit dir loslegt, und Live-Calls, in denen deine Fälle besprochen werden.'
        : 'The 72 episodes are the material. The LAB is the frame: a start group beginning with you and live calls where your cases get discussed.'}
    </p>
    <div className="grid sm:grid-cols-3 gap-4 mt-6">
      {[
        { icon: Video, de: ['72 Folgen', 'Alle 10 Kurse, komplett freigeschaltet.'], en: ['72 episodes', 'All 10 courses, fully unlocked.'] },
        { icon: Users, de: ['Startgruppe', `Du startest gemeinsam am ${launch?.label || ''}.`], en: ['Start group', `You begin together on ${launch?.label || ''}.`] },
        { icon: Mail, de: ['Live-Calls', 'Deine Fälle, live besprochen — Termine im Konto.'], en: ['Live calls', 'Your cases, discussed live — dates in your account.'] },
      ].map((b) => {
        const [title, sub] = de ? b.de : b.en;
        const Icon = b.icon;
        return (
          <div key={title} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4">
            <span className="w-8 h-8 rounded-lg bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] flex items-center justify-center"><Icon size={15} /></span>
            <p className="text-[13px] font-black mt-3">{title}</p>
            <p className="text-[11.5px] text-muted-foreground mt-1">{sub}</p>
          </div>
        );
      })}
    </div>
    <Link to="/leadership-lab" className="tap-target mt-5 inline-flex items-center gap-1.5 py-2 text-[12.5px] font-black text-[#4A6200] dark:text-[#BFFF00] hover:gap-2.5 transition-all" data-testid="courses-lab-link">
      {de ? 'Alles zum Leadership LAB' : 'Everything about the Leadership LAB'} <ArrowRight size={13} />
    </Link>
  </section>
);

const EpisodeState = ({ ep, de, launch }) => {
  if (ep.seen) return <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1"><Check size={11} /> {de ? 'gesehen' : 'watched'}</span>;
  if (ep.gate === 'none' && ep.video_ready) return <span className="inline-flex items-center gap-1 text-[#4A6200] dark:text-[#BFFF00]"><Play size={10} /> {de ? 'ansehen' : 'watch'}</span>;
  if (ep.gate === 'starts') return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock size={11} /> {de ? `ab ${launch?.label}` : `from ${launch?.label}`}</span>;
  if (ep.gate === 'email') return <span className="inline-flex items-center gap-1 text-muted-foreground"><Mail size={11} /> {de ? 'mit E-Mail ansehen' : 'watch with email'}</span>;
  return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock size={11} /> {de ? `Aufnahme folgt · ab ${launch?.label}` : `Recording soon · from ${launch?.label}`}</span>;
};

const CourseRow = ({ course: c, de, launch, open, onToggle }) => (
  <article className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-card overflow-hidden" data-testid={`curriculum-course-${c.slug}`}>
    <div className="flex items-stretch gap-0">
      <Link to={`/kurse/${c.slug}`} className="relative block w-28 sm:w-52 xl:w-64 shrink-0 bg-[#0A0A0A]" data-testid={`curriculum-thumb-${c.slug}`}>
        <div className="absolute inset-0"><VideoThumb src={c.thumbnail_url} title={c.title} showPlay={false} className="!h-full !aspect-auto" /></div>
      </Link>
      <div className="flex-1 min-w-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#4A6200] dark:text-[#BFFF00]">{t(LEVEL_LABEL[c.level], de)}</span>
          <span className="text-[11px] text-muted-foreground">· {c.episode_count} {de ? 'Folgen' : 'episodes'} · {c.minutes_total} Min</span>
          {c.unlocked && <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">{de ? 'freigeschaltet' : 'unlocked'}</span>}
        </div>
        <h3 className="text-[17px] sm:text-lg font-black mt-1.5 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{c.title}</h3>
        <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed">{c.tagline}</p>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button type="button" onClick={onToggle} aria-expanded={open}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-black/[0.1] dark:border-white/[0.15] text-[12px] font-bold hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  data-testid={`curriculum-toggle-${c.slug}`}>
            {open ? (de ? 'Folgen ausblenden' : 'Hide episodes') : (de ? `Alle ${c.episode_count} Folgen ansehen` : `Show all ${c.episode_count} episodes`)}
            <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          <Link to={`/kurse/${c.slug}?folge=1`} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#BFFF00] text-black text-[12px] font-black hover:bg-[#D4FF4D]" data-testid={`curriculum-start-${c.slug}`}>
            <Play size={12} /> {de ? 'Folge 1 kostenlos' : 'Episode 1 free'}
          </Link>
        </div>
      </div>
    </div>
    {open && (
      <ol className="border-t border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.04] dark:divide-white/[0.05]" data-testid={`curriculum-episodes-${c.slug}`}>
        {c.episodes.map((ep) => (
          <li key={ep.id}>
            <Link to={`/kurse/${c.slug}?folge=${ep.number}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-4 sm:px-5 py-3 min-h-[44px] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  data-testid={`curriculum-episode-${ep.id}`}>
              <span className="hidden sm:block w-7 shrink-0 text-[11px] font-black text-muted-foreground tabular-nums">{ep.number}</span>
              <span className="flex-1 min-w-0 text-[13px] font-semibold sm:truncate">
                <span className="sm:hidden text-muted-foreground tabular-nums">{ep.number}. </span>{ep.title}
              </span>
              <span className="flex items-center gap-3 sm:shrink-0">
                <span className="text-[11px] text-muted-foreground tabular-nums">{ep.minutes} Min</span>
                <span className="text-[11px] font-semibold sm:w-[132px] sm:text-right">
                  <EpisodeState ep={ep} de={de} launch={launch} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    )}
  </article>
);

export const Curriculum = ({ courses, de, launch }) => {
  const [open, setOpen] = useState({});
  return (
    <section className="mt-12" data-testid="courses-curriculum">
      <h2 className="text-xl sm:text-2xl font-black">{de ? 'Der Studienplan' : 'The curriculum'}</h2>
      <p className="text-[13px] text-muted-foreground mt-1.5 max-w-2xl">
        {de ? 'Drei Stufen, zehn Kurse, 72 Folgen. Klapp jeden Kurs auf und sieh jede einzelne Folge — vor dem Kauf.'
            : 'Three levels, ten courses, 72 episodes. Open any course and see every single episode — before you buy.'}
      </p>
      {LEVEL_ORDER.map((level) => {
        const rows = courses.filter((c) => c.level === level);
        if (!rows.length) return null;
        return (
          <div key={level} className="mt-10" data-testid={`curriculum-level-${level}`}>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h3 className="text-lg font-black">{t(LEVEL_LABEL[level], de)}</h3>
              <p className="text-[12px] text-muted-foreground">{t(LEVEL_HINT[level], de)}</p>
            </div>
            <div className="grid gap-4 mt-4 2xl:grid-cols-2 items-start">
              {rows.map((c) => (
                <CourseRow key={c.slug} course={c} de={de} launch={launch}
                           open={!!open[c.slug]} onToggle={() => setOpen((o) => ({ ...o, [c.slug]: !o[c.slug] }))} />
              ))}
            </div>
          </div>
        );
      })}
      <p className="mt-10 text-[12px] text-muted-foreground inline-flex items-center gap-1.5" data-testid="curriculum-note">
        <Lock size={12} /> {de ? `Folge 1 jedes Kurses ist frei. Alle weiteren Folgen schalten am ${launch?.label} frei.`
                               : `Episode 1 of each course is free. All other episodes unlock on ${launch?.label}.`}
      </p>
    </section>
  );
};
