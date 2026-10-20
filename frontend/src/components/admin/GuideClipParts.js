import { Loader2, Mic, Image as ImageIcon, Clapperboard, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';

const base = process.env.REACT_APP_BACKEND_URL;

/* Aktionsleiste eines Clips: Speichern · Stimme · Keyframe/Cinematic bzw. Talking-Head · Freigeben */
export const GuideClipActions = ({ clip, costs, busy, running, wordsOk, onSave, onStage, onPublish }) => {
  const i2vCost = clip.shot ? costs.i2v[clip.shot.duration] + costs.lipsync_per_s * Number(clip.shot.duration) : 0;
  const locked = !!busy || running;
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={!!busy || !wordsOk} onClick={onSave} className="h-7 text-[11px]" data-testid={`guide-clip-save-${clip.slug}`}>
        {busy === 'save' && <Loader2 size={12} className="animate-spin mr-1" />}Speichern
      </Button>
      <Button size="sm" variant="outline" disabled={locked} onClick={() => onStage('voice')} className="h-7 text-[11px]" data-testid={`guide-clip-voice-${clip.slug}`}>
        <Mic size={12} className="mr-1" />Stimme
      </Button>
      {clip.shot ? (
        <>
          <Button size="sm" variant="outline" disabled={locked} onClick={() => onStage('keyframe')} className="h-7 text-[11px]" data-testid={`guide-clip-keyframe-${clip.slug}`}>
            <ImageIcon size={12} className="mr-1" />Keyframe ({costs.keyframe.toFixed(2)} $)
          </Button>
          <Button size="sm" disabled={locked || !clip.keyframe_url || !clip.audio_url} onClick={() => onStage('cinematic')}
                  className="h-7 text-[11px] bg-[#BFFF00] text-black hover:bg-[#d4ff4d]" data-testid={`guide-clip-cinematic-${clip.slug}`}>
            <Clapperboard size={12} className="mr-1" />Cinematic rendern ({i2vCost.toFixed(2)} $)
          </Button>
        </>
      ) : (
        <Button size="sm" variant="outline" disabled={locked || !clip.audio_url} onClick={() => onStage('video')} className="h-7 text-[11px]" data-testid={`guide-clip-video-${clip.slug}`}>
          <Sparkles size={12} className="mr-1" />Talking-Head-Video
        </Button>
      )}
      <Button size="sm" variant="outline" disabled={!!busy || !clip.video_url} onClick={onPublish} className="h-7 text-[11px] ml-auto" data-testid={`guide-clip-publish-${clip.slug}`}>
        {clip.published ? <><EyeOff size={12} className="mr-1" />Zurückziehen</> : <><Eye size={12} className="mr-1" />Freigeben</>}
      </Button>
    </div>
  );
};

export const GuideGodmodeBadges = ({ clip }) => {
  if (!clip.godmode) return null;
  const g = clip.godmode;
  return (
    <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.08] p-2" data-testid={`guide-godmode-${clip.slug}`}>
      <p className={`text-[10px] font-black uppercase tracking-wider ${g.godmode ? 'text-emerald-500' : 'text-amber-500'}`}>
        Qualitätsprüfung {g.passed}/{g.total} · Setting: {g.setting}
      </p>
      <div className="flex flex-wrap gap-1 mt-1">
        {g.items.map((it) => (
          <span key={it.id} title={it.label} className={`text-[10px] px-1.5 py-0.5 rounded ${it.ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`} data-testid={`guide-godmode-item-${clip.slug}-${it.id}`}>
            {it.ok ? '✓' : '○'} {it.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export const GuideClipPreview = ({ clip }) => (
  <div className="space-y-2">
    {clip.video_url ? (
      <>
        <video controls playsInline src={`${base}${clip.video_url}`} className="w-full rounded-xl bg-black" data-testid={`guide-clip-video-preview-${clip.slug}`} />
        <a href={`${base}${clip.video_url}`} download={`${clip.slug}.mp4`} target="_blank" rel="noopener noreferrer"
           className="block text-center text-[11px] font-semibold text-[#5a7a00] dark:text-[#BFFF00] underline underline-offset-2"
           data-testid={`guide-clip-download-${clip.slug}`}>
          MP4 herunterladen (Social)
        </a>
      </>
    ) : clip.keyframe_url ? (
      <img src={`${base}${clip.keyframe_url}`} alt="Keyframe" className="w-full rounded-xl bg-black" data-testid={`guide-clip-keyframe-preview-${clip.slug}`} />
    ) : (
      <div className="w-full aspect-[9/16] max-h-64 rounded-xl bg-muted border border-border flex items-center justify-center text-[10px] text-muted-foreground">Noch kein Bild</div>
    )}
    {clip.video_url && clip.keyframe_url && <img src={`${base}${clip.keyframe_url}`} alt="Keyframe" className="w-full rounded-lg opacity-70" />}
  </div>
);
