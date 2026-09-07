import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Check, Play, Clock, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const PACKAGES = [
  { tier: 'standard', name: 'Leader-OS', price: '997 € / Jahr', sub: 'Kurse 1–6 · das Fundament', dark: false },
  { tier: 'accelerator', name: 'Leader-OS PLUS', price: '4.797 € / Jahr', sub: 'Kurse 7–10 · Top-Ebene + 12 Live-Coachings', dark: true },
];

const CourseRow = ({ course, dark, de }) => {
  const [open, setOpen] = useState(false);
  return (
    <li className={`rounded-xl border ${dark ? 'border-white/[0.08] bg-white/[0.04]' : 'border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03]'}`} data-testid={`catalog-course-${course.slug}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-3 text-left" data-testid={`catalog-toggle-${course.slug}`}>
        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${course.unlocked ? 'bg-[#BFFF00] text-black' : dark ? 'bg-white/10 text-white/60' : 'bg-black/[0.06] dark:bg-white/[0.08] text-muted-foreground'}`}>
          {course.unlocked ? <Check size={13} /> : <Lock size={12} />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold truncate">{course.title}</span>
          <span className={`block text-[11px] ${dark ? 'text-white/50' : 'text-muted-foreground'}`}>
            {course.episode_count} {de ? 'Folgen' : 'episodes'} · {course.minutes_total} Min
          </span>
        </span>
        {open ? <ChevronUp size={14} className="opacity-60" /> : <ChevronDown size={14} className="opacity-60" />}
      </button>
      {open && (
        <ol className="px-3 pb-3 space-y-1" data-testid={`catalog-episodes-${course.slug}`}>
          {course.episodes.map((ep) => (
            <li key={ep.id} className={`flex items-start gap-2 text-[12px] ${dark ? 'text-white/70' : 'text-foreground/80'}`}>
              <span className="shrink-0 mt-0.5">{ep.unlocked ? <Play size={10} className="text-[#4A6200] dark:text-[#BFFF00]" /> : <Lock size={10} className="opacity-50" />}</span>
              <span className="flex-1">{ep.number}. {ep.title}{ep.free_preview && <span className="ml-1 font-bold text-[#4A6200] dark:text-[#BFFF00]">· {de ? 'gratis' : 'free'}</span>}</span>
              <span className="shrink-0 opacity-60">{ep.minutes} Min</span>
            </li>
          ))}
        </ol>
      )}
    </li>
  );
};

export const CourseCatalogSection = ({ de = true, onCta }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/courses').then((r) => setData(r.data)).catch((e) => logger.warn('catalog load failed', e));
  }, []);

  if (!data) return null;
  const byTier = (t) => data.courses.filter((c) => c.tier === t);
  const count = (list) => list.reduce((n, c) => n + c.episode_count, 0);

  return (
    <section className="animate-fade-in" data-testid="course-catalog-section">
      <div className="max-w-2xl mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A6200] dark:text-[#BFFF00]">{de ? 'Das steckt in den Paketen' : 'What the plans contain'}</p>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
          {de ? <>10 Kurse. {data.total_episodes} Folgen. <span className="gradient-text">Jede unter 12 Minuten.</span></> : <>10 courses. {data.total_episodes} episodes. <span className="gradient-text">Each under 12 minutes.</span></>}
        </h2>
        <p className="text-sm text-muted-foreground mt-3">
          {de
            ? 'Folge 1 jedes Kurses ist für alle offen. Die komplette Struktur siehst du hier — damit du genau weißt, was du mit welchem Paket bekommst.'
            : 'Episode 1 of every course is open to everyone. The full structure is shown here so you know exactly what each plan unlocks.'}
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {PACKAGES.map((p) => {
          const list = byTier(p.tier);
          const allUnlocked = list.every((c) => c.unlocked);
          return (
            <div key={p.tier} className={`rounded-2xl border p-5 ${p.dark ? 'bg-gradient-to-b from-[#0A0A0A] to-[#1A1A2E] text-white border-[#BFFF00]/30' : 'bg-white dark:bg-card border-black/[0.06] dark:border-white/[0.08]'}`} data-testid={`catalog-package-${p.tier}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-wider ${p.dark ? 'text-[#BFFF00]' : 'text-[#4A6200] dark:text-[#BFFF00]'}`}>{p.name}</p>
                  <p className="text-lg font-black mt-0.5">{list.length} {de ? 'Kurse' : 'courses'} · {count(list)} {de ? 'Folgen' : 'episodes'}</p>
                  <p className={`text-[11px] ${p.dark ? 'text-white/50' : 'text-muted-foreground'}`}>{de ? p.sub : p.sub}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${allUnlocked ? 'bg-[#BFFF00] text-black' : p.dark ? 'bg-white/10 text-white/70' : 'bg-black/[0.05] dark:bg-white/[0.08] text-muted-foreground'}`} data-testid={`catalog-status-${p.tier}`}>
                  {allUnlocked ? <><Check size={11} /> {de ? 'freigeschaltet' : 'unlocked'}</> : <><Lock size={11} /> {p.price}</>}
                </span>
              </div>
              <ul className="space-y-2">
                {list.map((c) => <CourseRow key={c.slug} course={c} dark={p.dark} de={de} />)}
              </ul>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-current/10 text-[11px]">
                <span className={`inline-flex items-center gap-1 ${p.dark ? 'text-white/50' : 'text-muted-foreground'}`}><Clock size={11} /> {list.reduce((n, c) => n + c.minutes_total, 0)} Min {de ? 'gesamt' : 'total'}</span>
                <button type="button" onClick={() => (allUnlocked ? navigate('/kurse') : onCta?.())} className={`ml-auto inline-flex items-center gap-1 font-bold ${p.dark ? 'text-[#BFFF00]' : 'text-[#4A6200] dark:text-[#BFFF00]'}`} data-testid={`catalog-cta-${p.tier}`}>
                  {allUnlocked ? (de ? 'Zur Bibliothek' : 'Open library') : (de ? 'Paket wählen' : 'Choose plan')} <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
