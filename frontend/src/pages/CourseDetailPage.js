import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Lock, MessageCircle, Play } from 'lucide-react';
import api from '../lib/api';
import { swrGet } from '../lib/swrCache';
import logger from '../lib/logger';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PublicPageShell } from '../components/layout/PublicPageShell';
import { InteractiveWladButton } from '../components/guide/InteractiveWladButton';
import { CATEGORY_META, LEVEL_LABEL, askWladPrefill, t } from '../components/courses/courseMeta';
import { VideoThumb } from '../components/shared/VideoThumb';
import { VideoPlayer } from '../components/shared/VideoPlayer';

const Chip = ({ children }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-semibold">{children}</span>
);

const EpisodeRow = ({ ep, active, onPick, de, launch }) => (
  <button type="button" onClick={() => onPick(ep.number)}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${active ? 'bg-[#BFFF00]/15 ring-1 ring-[#BFFF00]/50' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'} ${ep.unlocked ? '' : 'opacity-70'}`}
    data-testid={`course-episode-${ep.id}`} aria-current={active ? 'true' : undefined}>
    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${ep.seen ? 'bg-emerald-500/15 text-emerald-600' : ep.unlocked ? 'bg-[#BFFF00] text-black' : 'bg-black/[0.06] dark:bg-white/[0.08] text-muted-foreground'}`}>
      {ep.seen ? <Check size={12} /> : ep.unlocked ? <Play size={11} className="ml-0.5" /> : <Lock size={11} />}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] font-semibold line-clamp-2 lg:truncate">{ep.number}. {ep.title}</span>
      <span className="block text-[11px] text-muted-foreground">
        {ep.minutes} Min{ep.free_preview && <> · <b className="text-[#4A6200] dark:text-[#BFFF00]">{de ? 'Kostenlos' : 'Free'}</b></>}
        {ep.gate === 'email' && <> · {de ? 'mit E-Mail ansehen' : 'watch with email'}</>}
        {ep.gate === 'starts' && <> · {de ? `ab ${launch?.label}` : `from ${launch?.label}`}</>}
        {ep.unlocked && !ep.video_ready && <> · {de ? 'Aufnahme folgt' : 'Recording soon'}</>}
      </span>
    </span>
  </button>
);

/** Plan Iter 187: Vorname + E-Mail → Video läuft. Gilt einmal, nicht pro Folge. */
const EmailGate = ({ ep, course, de, onDone, title, note }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await api.post('/courses/lead', { name: name.trim(), email: email.trim(), episode_id: ep.id });
      onDone();
    } catch (e2) {
      setErr(de ? 'Das hat nicht geklappt. Bitte Namen und E-Mail prüfen.' : 'That did not work. Please check name and email.');
      logger.error('course lead failed', e2);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0A0A0A]" data-testid="course-episode-gate">
      <div className="absolute inset-0 opacity-30"><VideoThumb src={ep.poster_url || course.thumbnail_url} title={course.title} showPlay={false} /></div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
        <p className="font-black text-[15px] sm:text-base max-w-md leading-snug" data-testid="course-gate-title">{title}</p>
        <p className="text-[12px] text-white/60 mt-1.5 max-w-sm">{note}</p>
        <form onSubmit={submit} className="mt-4 w-full max-w-md flex flex-col sm:flex-row gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2}
                 placeholder={de ? 'Vorname' : 'First name'} data-testid="course-gate-name"
                 className="flex-1 h-11 px-3.5 rounded-xl bg-white/10 border border-white/15 text-[13px] placeholder:text-white/40 focus:outline-none focus:border-[#BFFF00]" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email"
                 placeholder={de ? 'E-Mail' : 'Email'} data-testid="course-gate-email"
                 className="flex-1 h-11 px-3.5 rounded-xl bg-white/10 border border-white/15 text-[13px] placeholder:text-white/40 focus:outline-none focus:border-[#BFFF00]" />
          <button type="submit" disabled={busy} data-testid="course-gate-submit"
                  className="h-11 px-5 rounded-xl bg-[#BFFF00] text-black text-[12.5px] font-black hover:bg-[#D4FF4D] disabled:opacity-60">
            {busy ? (de ? 'Moment…' : 'One moment…') : (de ? 'Video ansehen' : 'Watch video')}
          </button>
        </form>
        {err && <p className="text-[12px] text-rose-300 mt-2" role="alert" data-testid="course-gate-error">{err}</p>}
        <p className="text-[10.5px] text-white/40 mt-3 max-w-sm">
          {de ? 'Einmal eintragen — danach sind alle vorhandenen Folgen für dich offen.' : 'Enter once — all available episodes are then open for you.'}
        </p>
      </div>
    </div>
  );
};

const Player = ({ ep, course, de, navigate, onGateDone }) => {
  const launchLabel = course.launch?.label || '';
  // Gekauft, aber der Start ist noch nicht da.
  if (ep.gate === 'starts') {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0A0A0A]" data-testid="course-episode-starts">
        <div className="absolute inset-0 opacity-40"><VideoThumb src={ep.poster_url || course.thumbnail_url} title={course.title} showPlay={false} /></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
          <span className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center"><Check size={20} className="text-emerald-400" /></span>
          <p className="font-black mt-3">{de ? 'Zugang gesichert' : 'Access secured'}</p>
          <p className="text-[12.5px] text-white/60 mt-1 max-w-sm">
            {de ? `Diese Folge schaltet am ${launchLabel} frei — zusammen mit allen 72 Folgen.` : `This episode unlocks on ${launchLabel} — together with all 72 episodes.`}
          </p>
        </div>
      </div>
    );
  }
  // Ohne Kauf: E-Mail-Tor.
  if (!ep.unlocked) {
    return (
      <EmailGate ep={ep} course={course} de={de} onDone={onGateDone}
                 title={de ? 'Diese Folge ansehen' : 'Watch this episode'}
                 note={de ? 'Trag Vorname und E-Mail ein — dann läuft das Video.' : 'Enter your first name and email — then the video plays.'} />
    );
  }
  if (ep.video_url) {
    const poster = ep.poster_url
      ? (/^https?:/.test(ep.poster_url) ? ep.poster_url : `${process.env.REACT_APP_BACKEND_URL}${ep.poster_url}`)
      : course.thumbnail_url;
    return (
      <div data-testid="course-episode-video">
        <VideoPlayer key={ep.id} src={ep.video_url} vimeoId={ep.vimeo_id || undefined} poster={poster} title={ep.title} autoplay />
      </div>
    );
  }
  // Aufnahme fehlt noch: ehrlich sagen — und als Vormerkung dasselbe Formular.
  if (!course.has_access && !course.lead_registered) {
    return (
      <EmailGate ep={ep} course={course} de={de} onDone={onGateDone}
                 title={de ? `Aufnahme folgt · ab ${launchLabel}` : `Recording soon · from ${launchLabel}`}
                 note={de ? 'Trag dich vor — du bekommst Bescheid, sobald diese Folge da ist.' : 'Sign up — we let you know as soon as this episode is ready.'} />
    );
  }
  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0A0A0A]" data-testid="course-episode-pending">
      <div className="absolute inset-0 opacity-60"><VideoThumb src={ep.poster_url || course.thumbnail_url} title={course.title} showPlay={false} /></div>
      <p className="absolute bottom-5 left-5 right-5 text-white text-[13px] font-semibold">
        {de ? `Aufnahme folgt · ab ${launchLabel}. Du bekommst sie automatisch, sobald sie da ist.` : `Recording soon · from ${launchLabel}. It unlocks here automatically.`}
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
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    swrGet(`/courses/${slug}`, setCourse, { onError: (e) => { logger.error('course load failed', e); setError(true); } });
  }, [slug]);

  const requested = Number(params.get('folge')) || null;
  const current = useMemo(() => {
    if (!course) return null;
    const n = requested || course.next_episode || 1;
    return course.episodes.find((e) => e.number === n) || course.episodes[0];
  }, [course, requested]);

  useEffect(() => {
    if (course?.authenticated && current?.unlocked && current?.video_ready && !current.seen) {
      api.post(`/courses/episodes/${current.id}/seen`).then(() => {
        setCourse((c) => c && { ...c, seen_count: c.seen_count + 1, episodes: c.episodes.map((e) => (e.id === current.id ? { ...e, seen: true } : e)) });
      }).catch(() => {});
    }
  }, [current, course?.authenticated]);

  const reload = () => { api.get(`/courses/${slug}`).then((r) => setCourse(r.data)).catch((e) => logger.error('course reload failed', e)); };

  const pick = (n) => setParams({ folge: String(n) });

  const Shell = ({ children }) => (user ? <DashboardLayout>{children}</DashboardLayout> : <PublicPageShell>{children}</PublicPageShell>);

  if (error) return <Shell><div className="p-8 text-sm text-muted-foreground" data-testid="course-not-found">{de ? 'Kurs nicht gefunden.' : 'Course not found.'} <Link to="/kurse" className="font-bold underline">{de ? 'Zum Studienplan' : 'Back to curriculum'}</Link></div></Shell>;
  if (!course || !current) return <Shell><div className="p-8 text-sm text-muted-foreground" data-testid="course-loading">{de ? 'Lade Kurs…' : 'Loading…'}</div></Shell>;

  const pct = Math.round((course.seen_count / course.episode_count) * 100);
  const ctaEp = course.next_episode || 1;

  return (
    <Shell>
    <div className="p-4 sm:p-8 xl:px-12 w-full" data-testid="course-detail-page">
      <Link to="/kurse" className="tap-target inline-flex items-center gap-1.5 py-2 text-[12px] font-bold text-muted-foreground hover:text-foreground" data-testid="course-back"><ArrowLeft size={13} /> {de ? 'Studienplan' : 'Curriculum'}</Link>

      <header className="mt-4 rounded-3xl bg-[#0A0A0A] text-white overflow-hidden grid lg:grid-cols-[1.1fr_1fr]" data-testid="course-header">
        <div className="relative aspect-video lg:aspect-auto lg:min-h-[280px]">
          <div className="absolute inset-0"><VideoThumb src={course.thumbnail_url} title={course.title} kicker={de ? 'Kurs' : 'Course'} showPlay={false} className="!h-full !aspect-auto" /></div>
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
          <Player ep={current} course={course} de={de} navigate={navigate} onGateDone={reload} />
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
                <MessageCircle size={13} /> {de ? 'Frag WladBot dazu' : 'Ask WladBot'}
              </button>
              {current.unlocked && course.authenticated && <InteractiveWladButton clip={{ slug: current.id, title: `${course.title} · ${current.title}`, script: [current.purpose, ...(current.bullets || [])].filter(Boolean).join(' ') }} de={de} />}
            </div>
          </div>
        </div>
        <aside className="min-w-0 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-card p-2 self-start" data-testid="course-episode-list">
          <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{de ? 'Alle Folgen' : 'All episodes'}</p>
          {course.episodes.map((ep) => <EpisodeRow key={ep.id} ep={ep} active={ep.id === current.id} onPick={pick} de={de} launch={course.launch} />)}
        </aside>
      </div>
    </div>
    </Shell>
  );
}
