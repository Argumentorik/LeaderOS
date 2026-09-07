import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Lock, MessageCircle, Play } from 'lucide-react';
import api from '../lib/api';
import logger from '../lib/logger';
import { useLanguage } from '../contexts/LanguageContext';
import { InteractiveWladButton } from '../components/guide/InteractiveWladButton';
import { CATEGORY_META, LEVEL_LABEL, askWladPrefill, t } from '../components/courses/courseMeta';

const Chip = ({ children }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-semibold">{children}</span>
);

const EpisodeRow = ({ ep, active, onPick, de }) => (
  <button type="button" onClick={() => onPick(ep.number)}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${active ? 'bg-[#BFFF00]/15 ring-1 ring-[#BFFF00]/50' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'} ${ep.unlocked ? '' : 'opacity-70'}`}
    data-testid={`course-episode-${ep.id}`} aria-current={active ? 'true' : undefined}>
    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${ep.seen ? 'bg-emerald-500/15 text-emerald-600' : ep.unlocked ? 'bg-[#BFFF00] text-black' : 'bg-black/[0.06] dark:bg-white/[0.08] text-muted-foreground'}`}>
      {ep.seen ? <Check size={12} /> : ep.unlocked ? <Play size={11} className="ml-0.5" /> : <Lock size={11} />}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] font-semibold truncate">{ep.number}. {ep.title}</span>
      <span className="block text-[11px] text-muted-foreground">
        {ep.minutes} Min{ep.free_preview && <> · <b className="text-[#4A6200] dark:text-[#BFFF00]">{de ? 'Kostenlos' : 'Free'}</b></>}
        {!ep.unlocked && <> · {de ? 'Gesperrt' : 'Locked'}</>}
        {ep.unlocked && !ep.video_ready && <> · {de ? 'Aufnahme folgt' : 'Recording soon'}</>}
      </span>
    </span>
  </button>
);

const Player = ({ ep, course, de, navigate }) => {
  if (!ep.unlocked) {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0A0A0A]" data-testid="course-episode-locked">
        <img src={course.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
          <span className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><Lock size={20} className="text-[#BFFF00]" /></span>
          <p className="font-black mt-3">{de ? `Teil von ${course.tier_label}` : `Part of ${course.tier_label}`}</p>
          <p className="text-[12px] text-white/60 mt-1 max-w-sm">{de ? 'Folge 1 ist kostenlos. Alle weiteren Folgen schalten sich mit deinem Paket frei.' : 'Episode 1 is free. All further episodes unlock with your plan.'}</p>
          <button type="button" onClick={() => navigate('/coaching')} className="mt-4 inline-flex items-center gap-2 px-5 h-10 rounded-full bg-[#BFFF00] text-black text-[12.5px] font-black hover:bg-[#D4FF4D]" data-testid="course-upgrade-btn">
            {de ? 'Pakete ansehen' : 'See plans'}
          </button>
        </div>
      </div>
    );
  }
  if (ep.video_url) {
    return <video key={ep.id} src={ep.video_url} controls autoPlay playsInline poster={course.thumbnail_url} className="w-full rounded-2xl bg-black aspect-video" data-testid="course-episode-video" />;
  }
  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0A0A0A]" data-testid="course-episode-pending">
      <img src={course.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <p className="absolute bottom-5 left-5 right-5 text-white text-[13px] font-semibold">
        {de ? 'Wlad nimmt diese Folge gerade auf. Du bekommst sie automatisch, sobald sie da ist.' : 'Wlad is recording this episode. It unlocks here automatically.'}
      </p>
    </div>
  );
};

export default function CourseDetailPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const de = lang !== 'en';
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/courses/${slug}`).then((r) => setCourse(r.data)).catch((e) => { logger.error('course load failed', e); setError(true); });
  }, [slug]);

  const requested = Number(params.get('folge')) || null;
  const current = useMemo(() => {
    if (!course) return null;
    const n = requested || course.next_episode || 1;
    return course.episodes.find((e) => e.number === n) || course.episodes[0];
  }, [course, requested]);

  useEffect(() => {
    if (current?.unlocked && current?.video_ready && !current.seen) {
      api.post(`/courses/episodes/${current.id}/seen`).then(() => {
        setCourse((c) => c && { ...c, seen_count: c.seen_count + 1, episodes: c.episodes.map((e) => (e.id === current.id ? { ...e, seen: true } : e)) });
      }).catch(() => {});
    }
  }, [current]);

  const pick = (n) => setParams({ folge: String(n) });

  if (error) return <div className="p-8 text-sm text-muted-foreground" data-testid="course-not-found">{de ? 'Kurs nicht gefunden.' : 'Course not found.'} <Link to="/kurse" className="font-bold underline">{de ? 'Zur Bibliothek' : 'Back to library'}</Link></div>;
  if (!course || !current) return <div className="p-8 text-sm text-muted-foreground" data-testid="course-loading">{de ? 'Lade Kurs…' : 'Loading…'}</div>;

  const pct = Math.round((course.seen_count / course.episode_count) * 100);
  const ctaEp = course.next_episode || 1;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto" data-testid="course-detail-page">
      <Link to="/kurse" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground hover:text-foreground" data-testid="course-back"><ArrowLeft size={13} /> {de ? 'Kurs-Bibliothek' : 'Course library'}</Link>

      <header className="mt-4 rounded-3xl bg-[#0A0A0A] text-white overflow-hidden grid lg:grid-cols-[1.1fr_1fr]" data-testid="course-header">
        <div className="relative aspect-video lg:aspect-auto lg:min-h-[280px]">
          <img src={course.thumbnail_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0A0A0A]/40 hidden lg:block" />
        </div>
        <div className="p-6 sm:p-8 flex flex-col min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#BFFF00]">{course.tier_label} · {t(CATEGORY_META[course.category], de)}</p>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 leading-tight break-words" style={{ fontFamily: 'Outfit, sans-serif' }}>{course.title}</h1>
          <p className="text-[13.5px] text-white/60 mt-2">{course.tagline}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Chip>{t(LEVEL_LABEL[course.level], de)}</Chip>
            <Chip><Play size={10} /> {course.episode_count} {de ? 'Folgen' : 'episodes'}</Chip>
            <Chip><Clock size={10} /> {course.minutes_total} Min</Chip>
            {!course.unlocked && <Chip><Lock size={10} /> {de ? 'Folge 1 frei' : 'Episode 1 free'}</Chip>}
          </div>
          <div className="mt-5" data-testid="course-detail-progress">
            <div className="flex justify-between text-[11px] text-white/60"><span>{course.seen_count} {de ? 'von' : 'of'} {course.episode_count} {de ? 'gesehen' : 'watched'}</span><span>{pct}%</span></div>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#BFFF00]" style={{ width: `${pct}%` }} /></div>
          </div>
          <button type="button" onClick={() => pick(ctaEp)} className="mt-auto pt-5 self-start inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#BFFF00] text-black text-[13px] font-black hover:bg-[#D4FF4D] transition-colors" data-testid="course-detail-cta">
            <Play size={14} /> {course.seen_count > 0 && course.next_episode ? (de ? `Weiter mit Folge ${ctaEp}` : `Continue with episode ${ctaEp}`) : (de ? 'Folge 1 kostenlos ansehen' : 'Watch episode 1 for free')}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 mt-6">
        <div className="min-w-0">
          <Player ep={current} course={course} de={de} navigate={navigate} />
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{de ? 'Folge' : 'Episode'} {current.number} · {current.minutes} Min</p>
            <h2 className="text-lg md:text-xl font-black mt-1 break-words" data-testid="course-episode-title">{current.title}</h2>
            {current.purpose && <p className="text-[13px] text-muted-foreground mt-2">{current.purpose}</p>}
            {current.bullets?.length > 0 && (
              <ul className="mt-4 space-y-1.5" data-testid="course-episode-bullets">
                {current.bullets.map((b) => <li key={b} className="text-[13px] flex gap-2"><span className="text-[#4A6200] dark:text-[#BFFF00] font-black">›</span>{b}</li>)}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <button type="button" onClick={() => navigate(askWladPrefill(course, current, de))} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-black/[0.1] dark:border-white/[0.15] text-[12.5px] font-bold hover:bg-black/[0.03] dark:hover:bg-white/[0.05]" data-testid="course-ask-wlad-btn">
                <MessageCircle size={13} /> {de ? 'Frag Wlad dazu' : 'Ask Wlad'}
              </button>
              {current.unlocked && <InteractiveWladButton clip={{ slug: current.id, title: `${course.title} · ${current.title}`, script: [current.purpose, ...(current.bullets || [])].filter(Boolean).join(' ') }} de={de} />}
            </div>
          </div>
        </div>
        <aside className="min-w-0 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-card p-2 self-start" data-testid="course-episode-list">
          <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{de ? 'Alle Folgen' : 'All episodes'}</p>
          {course.episodes.map((ep) => <EpisodeRow key={ep.id} ep={ep} active={ep.id === current.id} onPick={pick} de={de} />)}
        </aside>
      </div>
    </div>
  );
}
