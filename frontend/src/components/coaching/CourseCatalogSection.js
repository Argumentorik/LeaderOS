import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, ChevronUp, Clock, Lock, Play, Sparkles, Users } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { VideoThumb } from '../shared/VideoThumb';

const PACKAGES = [
  {
    tier: 'standard', name: 'Leader-OS', price: '997 € / Jahr', dark: false,
    sub_de: 'Kurse 1–6 · das Fundament', sub_en: 'Courses 1–6 · the foundation',
    promise_de: 'Die Gespräche, die dein Alltag jeden Tag von dir verlangt — Feedback, Konflikte, Delegation, Auftritt.',
    promise_en: 'The conversations your week demands — feedback, conflict, delegation, presence.',
  },
  {
    tier: 'accelerator', name: 'Leader-OS PLUS', price: '4.797 € / Jahr', dark: true,
    sub_de: 'Kurse 7–10 · Top-Ebene + 12 Live-Coachings', sub_en: 'Courses 7–10 · top level + 12 live coachings',
    promise_de: 'Alles aus Leader-OS — plus die Ebene, auf der Vorstand, Verhandlung und Change entschieden werden.',
    promise_en: 'Everything in Leader-OS — plus the level where board, negotiation and change are decided.',
  },
];

const CourseRow = ({ course, dark, de }) => {
  const [open, setOpen] = useState(false);
  const freeCount = course.episodes.filter((e) => e.free_preview).length;
  return (
    <li className={`group overflow-hidden rounded-xl border transition-colors ${
      dark ? 'border-white/[0.08] bg-white/[0.04] hover:border-[#BFFF00]/40'
           : 'border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] hover:border-[#BFFF00]/50'}`}
        data-testid={`catalog-course-${course.slug}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-2.5 text-left"
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
          <span className="block truncate text-[13.5px] font-bold">{course.title}</span>
          <span className={`mt-0.5 block text-[11px] ${dark ? 'text-white/50' : 'text-muted-foreground'}`}>
            {course.episode_count} {de ? 'Folgen' : 'episodes'} · {course.minutes_total} Min
            {freeCount > 0 && <span className="ml-1.5 font-bold text-[#4A6200] dark:text-[#BFFF00]">· {freeCount} {de ? 'gratis' : 'free'}</span>}
          </span>
          <span className={`mt-1 block truncate text-[11px] italic ${dark ? 'text-white/35' : 'text-muted-foreground/70'}`}>{course.tagline}</span>
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

/** „Das steckt in den Paketen" — Verkaufsstück: 10 Kurse, 72 Folgen, jede unter 12 Minuten. */
export const CourseCatalogSection = ({ de = true, onCta }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/courses').then((r) => setData(r.data)).catch((e) => logger.warn('catalog load failed', e));
  }, []);

  const stats = useMemo(() => {
    if (!data) return [];
    const minutes = data.courses.reduce((n, c) => n + c.minutes_total, 0);
    const free = data.courses.reduce((n, c) => n + c.episodes.filter((e) => e.free_preview).length, 0);
    return [
      { value: data.courses.length, label: de ? 'Kurse' : 'Courses' },
      { value: data.total_episodes, label: de ? 'Folgen' : 'Episodes' },
      { value: `${Math.round(minutes / 60)} h`, label: de ? 'geballte Praxis' : 'of practice' },
      { value: free, label: de ? 'Folgen gratis' : 'episodes free' },
    ];
  }, [data, de]);

  if (!data) return null;
  const byTier = (t) => data.courses.filter((c) => c.tier === t);
  const count = (list) => list.reduce((n, c) => n + c.episode_count, 0);

  return (
    <section className="animate-fade-in" data-testid="course-catalog-section">
      <div className="mb-7 max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A6200] dark:text-[#BFFF00]">
          {de ? 'Das steckt in den Paketen' : 'What the plans contain'}
        </p>
        <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
          {de
            ? <>10 Kurse. {data.total_episodes} Folgen. <span className="gradient-text">Jede unter 12 Minuten.</span></>
            : <>10 courses. {data.total_episodes} episodes. <span className="gradient-text">Each under 12 minutes.</span></>}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {de
            ? 'Kein Kurs, den du abarbeitest — eine Bibliothek für den Mittwochnachmittag, an dem das Gespräch ansteht. Folge 1 jedes Kurses ist für alle offen. Die komplette Struktur siehst du hier, damit du genau weißt, was du mit welchem Paket freischaltest.'
            : 'Not a course you work through — a library for the Wednesday afternoon when the conversation is due. Episode 1 of every course is open to everyone. The full structure is here so you know exactly what each plan unlocks.'}
        </p>
      </div>

      <StatBand items={stats} />

      <div className="grid gap-5 lg:grid-cols-2">
        {PACKAGES.map((p) => {
          const list = byTier(p.tier);
          const allUnlocked = list.every((c) => c.unlocked);
          const minutes = list.reduce((n, c) => n + c.minutes_total, 0);
          return (
            <div key={p.tier}
                 className={`relative overflow-hidden rounded-2xl border p-5 transition-transform duration-500 hover:-translate-y-0.5 ${
                   p.dark ? 'border-[#BFFF00]/30 bg-gradient-to-b from-[#0A0A0A] to-[#1A1A2E] text-white'
                          : 'border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-card'}`}
                 data-testid={`catalog-package-${p.tier}`}>
              {p.dark && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#BFFF00] px-2.5 py-1 text-[10px] font-black text-black">
                  <Sparkles size={10} /> {de ? 'Live dabei' : 'Live included'}
                </span>
              )}
              <div className="mb-3">
                <p className={`text-[10px] font-black uppercase tracking-wider ${p.dark ? 'text-[#BFFF00]' : 'text-[#4A6200] dark:text-[#BFFF00]'}`}>{p.name}</p>
                <p className="mt-0.5 text-lg font-black">{list.length} {de ? 'Kurse' : 'courses'} · {count(list)} {de ? 'Folgen' : 'episodes'}</p>
                <p className={`text-[11px] ${p.dark ? 'text-white/50' : 'text-muted-foreground'}`}>{de ? p.sub_de : p.sub_en}</p>
              </div>
              <p className={`mb-4 text-[12.5px] leading-relaxed ${p.dark ? 'text-white/70' : 'text-foreground/75'}`}>
                {de ? p.promise_de : p.promise_en}
              </p>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold ${
                  allUnlocked ? 'bg-[#BFFF00] text-black' : p.dark ? 'bg-white/10 text-white/75' : 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]'}`}
                      data-testid={`catalog-status-${p.tier}`}>
                  {allUnlocked ? <><Check size={11} /> {de ? 'freigeschaltet' : 'unlocked'}</> : <><Lock size={11} /> {p.price}</>}
                </span>
                <span className={`inline-flex items-center gap-1 ${p.dark ? 'text-white/50' : 'text-muted-foreground'}`}>
                  <Clock size={11} /> {minutes} Min {de ? 'gesamt' : 'total'}
                </span>
                {p.dark && (
                  <span className={`inline-flex items-center gap-1 ${p.dark ? 'text-white/50' : 'text-muted-foreground'}`}>
                    <Users size={11} /> 12 {de ? 'Live-Coachings' : 'live coachings'}
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {list.map((c) => <CourseRow key={c.slug} course={c} dark={p.dark} de={de} />)}
              </ul>
              <button type="button" onClick={() => (allUnlocked ? navigate('/kurse') : onCta?.())}
                      className={`mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[13px] font-black transition-colors ${
                        p.dark ? 'bg-[#BFFF00] text-black hover:bg-[#D4FF4D]' : 'bg-foreground text-background hover:opacity-90'}`}
                      data-testid={`catalog-cta-${p.tier}`}>
                {allUnlocked ? (de ? 'Zur Bibliothek' : 'Open library') : (de ? `${count(list)} Folgen freischalten` : `Unlock ${count(list)} episodes`)}
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
