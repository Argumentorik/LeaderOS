import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Loader2, Sparkles, Mic, Image as ImageIcon, Clapperboard, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { GuideShotList } from './GuideShotList';

const STATUS_LABEL = {
  full_running: 'Produktion läuft…', full_failed: 'Produktion fehlgeschlagen',
  shots_planned: 'Shots geplant', shot_keyframes_running: 'Keyframes laufen…', shot_keyframes_ready: 'Keyframes fertig',
  shots_keyframed: 'Keyframes fertig', shot_keyframes_failed: 'Keyframes fehlgeschlagen',
  render_running: 'Film wird gerendert…', render_failed: 'Rendern fehlgeschlagen',
  interrupted: 'Unterbrochen (Neustart)',
  script_ready: 'Skript bereit', audio_running: 'Stimme läuft…', audio_ready: 'Stimme fertig', audio_failed: 'Stimme fehlgeschlagen',
  keyframe_running: 'Keyframe läuft…', keyframe_ready: 'Keyframe fertig', keyframe_failed: 'Keyframe fehlgeschlagen',
  cinematic_running: 'Cinematic läuft…', cinematic_failed: 'Cinematic fehlgeschlagen',
  video_running: 'Video läuft…', video_ready: 'Video fertig', video_failed: 'Video fehlgeschlagen',
};

const base = process.env.REACT_APP_BACKEND_URL;

export const GuideClipCard = ({ clip, costs, screens = {}, onChange }) => {
  const [script, setScript] = useState(clip.script);
  const [scene, setScene] = useState(clip.shot?.scene_prompt || '');
  const [motion, setMotion] = useState(clip.shot?.motion_prompt || '');
  const [open, setOpen] = useState(clip.kind === 'teaser');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const running = (clip.status || '').endsWith('_running');
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  const [lo, hi] = clip.word_limits || [55, 115];
  const wordsOk = words >= lo && words <= hi;

  const call = async (label, fn) => {
    setBusy(label); setErr('');
    try { await fn(); await onChange(); }
    catch (e) { logger.error(`guide ${label} failed`, e); setErr(e?.response?.data?.detail || `${label} fehlgeschlagen`); }
    finally { setBusy(''); }
  };

  const save = () => call('save', () => api.put(`/guide/admin/clips/${clip.slug}`, {
    script, scene_prompt: clip.shot ? scene : undefined, motion_prompt: clip.shot ? motion : undefined,
  }));
  const stage = (name) => call(name, () => api.post(`/guide/admin/clips/${clip.slug}/${name}`));
  const publish = () => call('publish', () => api.post(`/guide/admin/clips/${clip.slug}/publish`, { published: !clip.published }));

  const i2vCost = clip.shot ? costs.i2v[clip.shot.duration] + costs.lipsync_per_s * Number(clip.shot.duration) : 0;

  return (
    <Card className="p-4 bg-card border-border" data-testid={`guide-clip-card-${clip.slug}`}>
      <button type="button" className="w-full flex items-center gap-3 text-left" onClick={() => setOpen(!open)} data-testid={`guide-clip-toggle-${clip.slug}`}>
        <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{clip.kind}</span>
        <span className="text-sm font-bold text-foreground flex-1 truncate">{clip.title}</span>
        <span className={`text-[10px] font-semibold ${clip.status?.endsWith('_failed') ? 'text-rose-500' : running ? 'text-amber-500' : 'text-muted-foreground'}`} data-testid={`guide-clip-status-${clip.slug}`}>
          {running && <Loader2 size={11} className="animate-spin inline mr-1" />}
          {STATUS_LABEL[clip.status] || clip.status}{clip.progress ? ` · ${clip.progress}` : ''}
        </span>
        {clip.published && <span className="text-[10px] text-[#5a7a00] dark:text-[#BFFF00] font-bold">LIVE</span>}
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Sprechtext</span>
                <span className={wordsOk ? 'text-muted-foreground' : 'text-rose-500'} data-testid={`guide-clip-words-${clip.slug}`}>{words} Wörter · erlaubt {lo}-{hi}</span>
              </div>
              <Textarea value={script} onChange={(e) => setScript(e.target.value)} rows={clip.kind === 'teaser' ? 2 : 5}
                        className="text-sm bg-background border-border" data-testid={`guide-clip-script-${clip.slug}`} />
            </div>
            {clip.shot && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Szene (Keyframe) · {clip.shot.label}</p>
                  <Textarea value={scene} onChange={(e) => setScene(e.target.value)} rows={5} className="text-[11px] bg-background border-border" data-testid={`guide-clip-scene-${clip.slug}`} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Bewegung (Kling · {clip.shot.duration} s · Sprechen ab {clip.shot.speech_start} s)</p>
                  <Textarea value={motion} onChange={(e) => setMotion(e.target.value)} rows={5} className="text-[11px] bg-background border-border" data-testid={`guide-clip-motion-${clip.slug}`} />
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={!!busy || !wordsOk} onClick={save} className="h-7 text-[11px]" data-testid={`guide-clip-save-${clip.slug}`}>
                {busy === 'save' && <Loader2 size={12} className="animate-spin mr-1" />}Speichern
              </Button>
              <Button size="sm" variant="outline" disabled={!!busy || running} onClick={() => stage('voice')} className="h-7 text-[11px]" data-testid={`guide-clip-voice-${clip.slug}`}>
                <Mic size={12} className="mr-1" />Stimme
              </Button>
              {clip.shot ? (
                <>
                  <Button size="sm" variant="outline" disabled={!!busy || running} onClick={() => stage('keyframe')} className="h-7 text-[11px]" data-testid={`guide-clip-keyframe-${clip.slug}`}>
                    <ImageIcon size={12} className="mr-1" />Keyframe ({costs.keyframe.toFixed(2)} $)
                  </Button>
                  <Button size="sm" disabled={!!busy || running || !clip.keyframe_url || !clip.audio_url} onClick={() => stage('cinematic')}
                          className="h-7 text-[11px] bg-[#BFFF00] text-black hover:bg-[#d4ff4d]" data-testid={`guide-clip-cinematic-${clip.slug}`}>
                    <Clapperboard size={12} className="mr-1" />Cinematic rendern ({i2vCost.toFixed(2)} $)
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" disabled={!!busy || running || !clip.audio_url} onClick={() => stage('video')} className="h-7 text-[11px]" data-testid={`guide-clip-video-${clip.slug}`}>
                  <Sparkles size={12} className="mr-1" />Talking-Head-Video
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={!!busy || !clip.video_url} onClick={publish} className="h-7 text-[11px] ml-auto" data-testid={`guide-clip-publish-${clip.slug}`}>
                {clip.published ? <><EyeOff size={12} className="mr-1" />Zurückziehen</> : <><Eye size={12} className="mr-1" />Freigeben</>}
              </Button>
            </div>
            {clip.multi_shot && <GuideShotList clip={clip} costs={costs} screens={screens} onChange={onChange} />}
            {(err || clip.error) && <p className="text-[11px] text-rose-500" data-testid={`guide-clip-error-${clip.slug}`}>{err || clip.error}</p>}
            {clip.audio_url && <audio controls src={`${base}${clip.audio_url}`} className="w-full h-8" data-testid={`guide-clip-audio-${clip.slug}`} />}
            <p className="text-[10px] text-muted-foreground">Ausgegeben für diesen Clip: {(clip.spent_usd || 0).toFixed(2)} $ {clip.duration_seconds ? `· Sprechdauer ${clip.duration_seconds} s` : ''}</p>
          </div>

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
        </div>
      )}
    </Card>
  );
};
