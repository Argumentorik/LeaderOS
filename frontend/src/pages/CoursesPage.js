import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Play, Check, Clock, Sparkles, ChevronRight, MessageCircle } from 'lucide-react';
import api from '../lib/api';
import logger from '../lib/logger';
import { useLanguage } from '../contexts/LanguageContext';
import { InteractiveWladButton } from '../components/guide/InteractiveWladButton';

const TIER_STYLE = {
  standard: 'bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] border-[#BFFF00]/40',
  accelerator: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
};

const EpisodeRow = ({ ep, courseSlug, onOpen, de }) => (
  <button
    type="button"
    onClick={() => onOpen(ep)}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${ep.unlocked ? 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]' : 'opacity-60'}`}
    data-testid={`course-episode-${courseSlug}-${ep.number}`}
  >
    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${ep.seen ? 'bg-emerald-500/15 text-emerald-600' : ep.unlocked ? 'bg-[#BFFF00] text-black' : 'bg-black/[0.06] dark:bg-white/[0.08] text-muted-foreground'}`}>
      {ep.seen ? <Check size={12} /> : ep.unlocked ? <Play size={11} className="ml-0.5" /> : <Lock size={11} />}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] font-semibold truncate">{ep.number}. {ep.title}</span>
      <span className="block text-[11px] text-muted-foreground">
        {ep.minutes} Min {ep.free_preview && <span className="ml-1 font-bold text-[#4A6200] dark:text-[#BFFF00]">· {de ? 'Kostenlose Vorschau' : 'Free preview'}</span>}
        {!ep.video_ready && ep.unlocked && <span className="ml-1">· {de ? 'Aufnahme folgt' : 'Recording soon'}</span>}
      </span>
    </span>
    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
  </button>
);

const CourseCard = ({ course, onOpen, de }) => {
  const [open, setOpen] = useState(false);
  const shown = open ? course.episodes : course.episodes.slice(0, 3);
  return (
    <article className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-card overflow-hidden" data-testid={`course-card-${course.slug}`}>
      <div className="p-5 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${TIER_STYLE[course.tier]}`} data-testid={`course-tier-${course.slug}`}>
              {course.tier_label}
            </span>
            <h2 className="text-lg font-black mt-2 leading-tight">{course.title}</h2>
            <p className="text-[12px] text-muted-foreground mt-1">{course.tagline}</p>
          </div>
          {!course.unlocked && <Lock size={16} className="text-muted-foreground shrink-0 mt-1" data-testid={`course-locked-${course.slug}`} />}
        </div>
        <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Play size={11} /> {course.episode_count} {de ? 'Folgen' : 'episodes'}</span>
          <span className="inline-flex items-center gap-1"><Clock size={11} /> {course.minutes_total} Min</span>
          <span>{course.seen_count}/{course.episode_count} {de ? 'gesehen' : 'seen'}</span>
        </div>
      </div>
      <div className="p-2">
        {shown.map((ep) => <EpisodeRow key={ep.id} ep={ep} courseSlug={course.slug} onOpen={onOpen} de={de} />)}
        {course.episodes.length > 3 && (
          <button type="button" onClick={() => setOpen(v => !v)} className="w-full text-[11px] font-bold text-muted-foreground hover:text-foreground py-2" data-testid={`course-toggle-${course.slug}`}>
            {open ? (de ? 'Weniger anzeigen' : 'Show less') : (de ? `Alle ${course.episodes.length} Folgen` : `All ${course.episodes.length} episodes`)}
          </button>
        )}
      </div>
    </article>
  );
};

const EpisodePanel = ({ ep, course, onClose, de }) => {
  const navigate = useNavigate();
  if (!ep) return null;
  const locked = !ep.unlocked;
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3" onClick={onClose} data-testid="course-episode-panel">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-card border border-black/[0.08] dark:border-white/[0.1] p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{course.title} · {de ? 'Folge' : 'Episode'} {ep.number} · {ep.minutes} Min</p>
        <h3 className="text-xl font-black leading-tight">{ep.title}</h3>
        <p className="text-[13px] text-muted-foreground">{ep.purpose}</p>
        {locked ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4 space-y-3" data-testid="course-episode-locked">
            <p className="text-[13px] font-semibold flex items-center gap-2"><Lock size={14} /> {de ? `Diese Folge ist Teil von ${course.tier_label}.` : `This episode is part of ${course.tier_label}.`}</p>
            <button type="button" onClick={() => navigate('/coaching')} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#BFFF00] text-black text-[12px] font-black" data-testid="course-upgrade-btn">
              <Sparkles size={13} /> {de ? 'Pakete ansehen' : 'See plans'}
            </button>
          </div>
        ) : ep.video_url ? (
          <video src={ep.video_url} controls playsInline className="w-full rounded-xl bg-black aspect-video" data-testid="course-episode-video" />
        ) : (
          <div className="rounded-xl bg-black/[0.04] dark:bg-white/[0.05] p-4 text-[13px]" data-testid="course-episode-pending">
            {de ? 'Wlad nimmt diese Folge gerade auf. Du bekommst sie automatisch, sobald sie da ist.' : 'Wlad is recording this episode. It unlocks here automatically.'}
          </div>
        )}
        {ep.bullets?.length > 0 && (
          <ul className="space-y-1.5" data-testid="course-episode-bullets">
            {ep.bullets.map((b) => <li key={b} className="text-[13px] flex gap-2"><span className="text-[#4A6200] dark:text-[#BFFF00] font-black">›</span>{b}</li>)}
          </ul>
        )}
        <div className="flex flex-wrap gap-3 pt-1">
          <button type="button" onClick={() => navigate(`/chat?prefill=${encodeURIComponent(de ? `Ich arbeite gerade an „${ep.title}“ aus deinem Kurs „${course.title}“. Wie setze ich das konkret in meiner Situation um?` : `I'm working on "${ep.title}" from your course "${course.title}". How do I apply it in my situation?`)}`)} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-foreground/70 hover:text-foreground" data-testid="course-ask-wlad-btn">
            <MessageCircle size={13} /> {de ? 'Frag Wlad dazu' : 'Ask Wlad'}
          </button>
          {!locked && <InteractiveWladButton clip={{ slug: ep.id, title: `${course.title} · ${ep.title}`, script: [ep.purpose, ...(ep.bullets || [])].filter(Boolean).join(' ') }} de={de} />}
          <button type="button" onClick={onClose} className="ml-auto text-[12px] font-bold text-muted-foreground" data-testid="course-episode-close">{de ? 'Schließen' : 'Close'}</button>
        </div>
      </div>
    </div>
  );
};

const UpsellBanner = ({ data, de }) => {
  const navigate = useNavigate();
  const locked = data.courses.filter((c) => !c.unlocked);
  if (!locked.length) return null;
  const lockedEps = locked.reduce((n, c) => n + c.episode_count, 0);
  const plusOnly = locked.every((c) => c.tier === 'accelerator');
  return (
    <div className="mt-6 rounded-2xl border border-[#BFFF00]/30 bg-gradient-to-r from-[#0A0A0A] to-[#16210A] text-white p-5 flex flex-wrap items-center gap-4" data-testid="courses-upsell-banner">
      <div className="flex-1 min-w-[240px]">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#BFFF00]">{de ? 'Du siehst die komplette Bibliothek' : 'You see the whole library'}</p>
        <p className="text-[15px] font-bold mt-1">
          {de
            ? `${locked.length} Kurse mit ${lockedEps} Folgen warten noch auf dich.`
            : `${locked.length} courses with ${lockedEps} episodes are still waiting for you.`}
        </p>
        <p className="text-[12px] text-white/55 mt-0.5">
          {de
            ? (plusOnly ? 'Leader-OS PLUS schaltet Kurse 7–10 frei: KI-First Leadership, Change, Executive Presence, Boardroom-Strategie — plus 12 Live-Coachings.' : 'Leader-OS schaltet Kurse 1–6 frei (Rhetorik, schwierige Gespräche, Delegation, Feedback, Storytelling, Meetings). PLUS ergänzt Kurse 7–10 und 12 Live-Coachings.')
            : (plusOnly ? 'Leader-OS PLUS unlocks courses 7–10 plus 12 live coachings.' : 'Leader-OS unlocks courses 1–6. PLUS adds courses 7–10 and 12 live coachings.')}
        </p>
      </div>
      <button type="button" onClick={() => navigate('/coaching')} className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[#BFFF00] text-black text-[13px] font-black hover:bg-[#D4FF4D] transition-colors" data-testid="courses-upsell-cta">
        <Sparkles size={14} /> {de ? 'Pakete vergleichen' : 'Compare plans'}
      </button>
    </div>
  );
};

export default function CoursesPage() {
  const { lang } = useLanguage();
  const de = lang !== 'en';
  const [data, setData] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get('/courses').then((r) => setData(r.data)).catch((e) => logger.error('courses load failed', e));
  }, []);

  const openEpisode = async (course, ep) => {
    try {
      const r = await api.get(`/courses/${course.slug}`);
      const full = r.data.episodes.find((e) => e.id === ep.id);
      setActive({ ep: full, course: r.data });
      if (full?.unlocked && full?.video_ready) {
        api.post(`/courses/episodes/${ep.id}/seen`).catch(() => {});
      }
    } catch (e) { logger.error('episode load failed', e); }
  };

  const total = data?.total_episodes || 0;
  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto" data-testid="courses-page">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A6200] dark:text-[#BFFF00]">{de ? 'Kurs-Bibliothek' : 'Course library'}</p>
      <h1 className="text-3xl sm:text-4xl font-black mt-1">{de ? 'Wlads Kurse' : "Wlad's courses"}</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
        {de ? `10 Kurse, ${total} Folgen, je max. 12 Minuten. Folge 1 jedes Kurses ist kostenlos — der Rest schaltet sich mit deinem Paket automatisch frei.` : `10 courses, ${total} episodes, max. 12 minutes each. Episode 1 of every course is free — the rest unlocks with your plan.`}
      </p>
      {!data ? (
        <div className="mt-10 text-sm text-muted-foreground" data-testid="courses-loading">{de ? 'Lade Kurse…' : 'Loading…'}</div>
      ) : (
        <>
          <UpsellBanner data={data} de={de} />
          <div className="grid gap-5 md:grid-cols-2 mt-8">
            {data.courses.map((c) => <CourseCard key={c.slug} course={c} de={de} onOpen={(ep) => openEpisode(c, ep)} />)}
          </div>
        </>
      )}
      <EpisodePanel ep={active?.ep} course={active?.course} onClose={() => setActive(null)} de={de} />
    </div>
  );
}
