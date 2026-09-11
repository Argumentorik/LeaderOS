import { useState } from 'react';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../lib/api';
import { ScriptDraftPanel } from './ScriptDraftPanel';
import logger from '../../lib/logger';
import { GuideShotList } from './GuideShotList';
import { GuideClipActions, GuideGodmodeBadges, GuideClipPreview } from './GuideClipParts';

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
            <ScriptDraftPanel clip={clip} onChanged={onChange} />
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
            <GuideClipActions clip={clip} costs={costs} busy={busy} running={running} wordsOk={wordsOk} onSave={save} onStage={stage} onPublish={publish} />
            {clip.multi_shot && <GuideShotList clip={clip} costs={costs} screens={screens} onChange={onChange} />}
            {(err || clip.error) && <p className="text-[11px] text-rose-500" data-testid={`guide-clip-error-${clip.slug}`}>{err || clip.error}</p>}
            {clip.audio_url && <audio controls src={`${base}${clip.audio_url}`} className="w-full h-8" data-testid={`guide-clip-audio-${clip.slug}`} />}
            <p className="text-[10px] text-muted-foreground">Ausgegeben für diesen Clip: {(clip.spent_usd || 0).toFixed(2)} $ {clip.duration_seconds ? `· Sprechdauer ${clip.duration_seconds} s` : ''}</p>
            <GuideGodmodeBadges clip={clip} />
          </div>

          <GuideClipPreview clip={clip} />
        </div>
      )}
    </Card>
  );
};
