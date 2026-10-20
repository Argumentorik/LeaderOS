import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Play, Clock, Sparkles } from 'lucide-react';
import { CATEGORY_META, LEVEL_LABEL, t } from './courseMeta';
import { VideoThumb } from '../shared/VideoThumb';

const Badge = ({ children, tone = 'lime', testid }) => (
  <span data-testid={testid} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-[0.12em] backdrop-blur ${
    tone === 'lime' ? 'bg-[#BFFF00] text-black' : tone === 'dark' ? 'bg-black/70 text-white' : 'bg-amber-400 text-black'}`}>{children}</span>
);

const Chip = ({ children }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-[10.5px] font-semibold text-muted-foreground">{children}</span>
);

export const CourseCard = ({ course: c, de }) => {
  const navigate = useNavigate();
  const vidRef = useRef(null);
  const pct = Math.round((c.seen_count / c.episode_count) * 100);
  const started = c.seen_count > 0;
  const startLabel = started && c.next_episode
    ? (de ? `Weiter mit Folge ${c.next_episode}` : `Continue with episode ${c.next_episode}`)
    : (de ? 'Kostenlos starten' : 'Start for free');
  const startEp = started && c.next_episode ? c.next_episode : 1;
  const play = () => { vidRef.current?.play().catch(() => {}); };
  const stop = () => { if (vidRef.current) { vidRef.current.pause(); vidRef.current.currentTime = 0; } };

  return (
    <article
      className="group rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-card overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10 dark:hover:border-[#BFFF00]/30"
      data-testid={`course-card-${c.slug}`}
      onMouseEnter={play} onMouseLeave={stop}
    >
      <Link to={`/kurse/${c.slug}`} className="group relative block aspect-video overflow-hidden bg-[#0A0A0A]" data-testid={`course-thumb-${c.slug}`}>
        <VideoThumb src={c.thumbnail_url} title={c.title} kicker={de ? 'Kurs' : 'Course'} showPlay={false} />
        {c.preview_url && (
          <video ref={vidRef} src={c.preview_url} muted playsInline preload="none" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300" data-testid={`course-preview-${c.slug}`} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge testid={`course-free-badge-${c.slug}`}>{de ? 'Kostenlos · Folge 1' : 'Free · Episode 1'}</Badge>
          {!c.unlocked && <Badge tone="dark" testid={`course-locked-${c.slug}`}><Lock size={9} /> {de ? 'Gesperrt' : 'Locked'}</Badge>}
          {c.is_new && <Badge tone="amber" testid={`course-new-${c.slug}`}><Sparkles size={9} /> {de ? 'Neu' : 'New'}</Badge>}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <p className="text-white font-black text-[15px] leading-tight drop-shadow" style={{ fontFamily: 'Outfit, sans-serif' }}>{c.title}</p>
          <span className="w-9 h-9 rounded-full bg-[#BFFF00] text-black flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><Play size={14} className="ml-0.5" /></span>
        </div>
        {started && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/15" data-testid={`course-progress-${c.slug}`}>
            <div className="h-full bg-[#BFFF00]" style={{ width: `${pct}%` }} />
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <p className="text-[12.5px] text-muted-foreground leading-relaxed line-clamp-2">{c.tagline}</p>
        <div className="flex flex-wrap gap-1.5">
          <Chip>{t(CATEGORY_META[c.category], de)}</Chip>
          <Chip>{t(LEVEL_LABEL[c.level], de)}</Chip>
          <Chip><Play size={9} /> {c.episode_count} {de ? 'Folgen' : 'episodes'}</Chip>
          <Chip><Clock size={9} /> {c.minutes_total} Min</Chip>
        </div>
        {started && <p className="text-[11px] font-bold text-[#4A6200] dark:text-[#BFFF00]" data-testid={`course-seen-${c.slug}`}>{c.seen_count}/{c.episode_count} {de ? 'gesehen' : 'seen'}</p>}
        {/* Iter 185: Freischaltung steht auf der Kachel — keine Kachel, die erst beim Klick sperrt. */}
        <p className={`text-[11.5px] font-semibold ${c.unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
           data-testid={`course-access-${c.slug}`}>
          {c.unlocked
            ? (de ? 'Alle Folgen für dich freigeschaltet' : 'All episodes unlocked for you')
            : (de
                ? `Folge 1 ist frei · Folgen 2–${c.episode_count} kommen mit ${c.tier_label} dazu`
                : `Episode 1 is free · episodes 2–${c.episode_count} come with ${c.tier_label}`)}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-1">
          {c.unlocked || !started ? (
            <button type="button" onClick={() => navigate(`/kurse/${c.slug}?folge=${startEp}`)} className="flex-1 h-10 rounded-xl bg-[#0A0A0A] dark:bg-[#BFFF00] text-white dark:text-black text-[12.5px] font-black hover:bg-[#1f1f1f] dark:hover:bg-[#D4FF4D] transition-colors" data-testid={`course-start-${c.slug}`}>
              {startLabel}
            </button>
          ) : (
            <span className="flex-1 h-10 rounded-xl border border-dashed border-black/15 dark:border-white/20 text-[11px] font-bold text-muted-foreground flex items-center justify-center gap-1.5" data-testid={`course-tier-hint-${c.slug}`}>
              <Lock size={11} /> {de ? `Teil von ${c.tier_label}` : `Part of ${c.tier_label}`}
            </span>
          )}
          <Link to={`/kurse/${c.slug}`} className="h-10 px-4 rounded-xl border border-black/[0.1] dark:border-white/[0.15] text-[12.5px] font-bold hover:bg-black/[0.03] dark:hover:bg-white/[0.05] flex items-center transition-colors" data-testid={`course-details-${c.slug}`}>
            {de ? 'Details' : 'Details'}
          </Link>
        </div>
      </div>
    </article>
  );
};
