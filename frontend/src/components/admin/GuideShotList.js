import { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Loader2, ListVideo, Image as ImageIcon, Clapperboard, Save } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const base = process.env.REACT_APP_BACKEND_URL;
const TYPE_LABEL = { walk: 'Walk-in', talk: 'Talk-Shot', broll: 'App-Tour' };
// Präsenz-Shots (OmniHuman, bis 28 s) dürfen länger sprechen als die alten 10-s-Kling-Shots
const wordCap = (shot) => (/closeup$/.test(shot.preset || '') ? 50 : /^(studio_|loft_seated_)/.test(shot.preset || '') ? 64 : 26);

const ShotRow = ({ shot, slug, screens, draft, onDraft }) => {
  const words = (draft.text || '').trim().split(/\s+/).filter(Boolean).length;
  const cap = wordCap(shot);
  const tooLong = shot.type === 'talk' && words > cap;
  const ready = shot.type === 'broll' ? Boolean(shot.audio_url) : Boolean(shot.synced_url || (shot.type === 'walk' && shot.raw_url));
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3 p-3 rounded-xl border border-border bg-background/60" data-testid={`guide-shot-${slug}-${shot.id}`}>
      <div className="space-y-1">
        {shot.keyframe_url ? (
          <img src={`${base}${shot.keyframe_url}`} alt={shot.id} className="w-[72px] aspect-video object-cover rounded-md bg-black" data-testid={`guide-shot-keyframe-${slug}-${shot.id}`} />
        ) : shot.type === 'broll' ? (
          <div className="w-[72px] aspect-video rounded-md bg-muted grid grid-cols-2 gap-px overflow-hidden">
            {(draft.screens || []).slice(0, 4).map((s) => <img key={s} src={`${base}/api/guide/broll/${s}`} alt={s} className="w-full h-full object-cover" />)}
          </div>
        ) : (
          <div className="w-[72px] aspect-video rounded-md bg-muted flex items-center justify-center text-[9px] text-muted-foreground">kein Bild</div>
        )}
        <p className="text-[9px] font-mono text-muted-foreground text-center">{shot.id} · {shot.duration ? `${shot.duration} s` : `${shot.audio_seconds ? `${shot.audio_seconds} s` : 'auto'}`}</p>
      </div>
      <div className="space-y-2 min-w-0">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="font-bold text-foreground">{TYPE_LABEL[shot.type]}</span>
          <span className="text-muted-foreground truncate">{shot.preset_label}</span>
          <span className={`ml-auto font-semibold ${ready ? 'text-[#5a7a00] dark:text-[#BFFF00]' : shot.fal_pending ? 'text-amber-500' : 'text-muted-foreground'}`} data-testid={`guide-shot-state-${slug}-${shot.id}`}>
            {ready ? 'gerendert' : shot.fal_pending ? 'in Fal-Queue · Rendern holt ab' : shot.keyframe_url ? 'Keyframe ok' : shot.type === 'broll' ? 'bereit' : 'offen'}
          </span>
        </div>
        {shot.type !== 'walk' && (
          <Textarea value={draft.text || ''} rows={shot.type === 'broll' ? 3 : 2}
                    onChange={(e) => onDraft({ text: e.target.value })}
                    className={`text-[11px] bg-background border-border ${tooLong ? 'border-rose-500' : ''}`}
                    data-testid={`guide-shot-text-${slug}-${shot.id}`} />
        )}
        {shot.type === 'talk' && <p className={`text-[9px] ${tooLong ? 'text-rose-500' : 'text-muted-foreground'}`}>{words} Wörter · max {cap} ({cap > 26 ? '≈ 28 s' : '≈ 9 s'})</p>}
        {shot.type === 'broll' && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(screens).map(([id, label]) => {
              const on = (draft.screens || []).includes(id);
              return (
                <button key={id} type="button" onClick={() => onDraft({ screens: on ? draft.screens.filter((s) => s !== id) : [...(draft.screens || []), id] })}
                        className={`text-[9px] px-2 py-0.5 rounded-full border ${on ? 'bg-[#BFFF00] text-black border-[#BFFF00]' : 'border-border text-muted-foreground'}`}
                        data-testid={`guide-shot-screen-${slug}-${shot.id}-${id}`}>{label}</button>
              );
            })}
          </div>
        )}
        {shot.audio_url && <audio controls src={`${base}${shot.audio_url}`} className="w-full h-7" />}
        {shot.error && <p className="text-[10px] text-rose-500">{shot.error}</p>}
      </div>
    </div>
  );
};

export const GuideShotList = ({ clip, costs, screens, onChange }) => {
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const running = (clip.status || '').endsWith('_running');
  const shots = clip.shots || [];

  const call = async (label, fn) => {
    setBusy(label); setErr('');
    try { await fn(); setDrafts({}); await onChange(); }
    catch (e) { logger.error(`guide shots ${label} failed`, e); setErr(e?.response?.data?.detail || `${label} fehlgeschlagen`); }
    finally { setBusy(''); }
  };

  const draftOf = (s) => ({ text: s.text, screens: s.screens, ...(drafts[s.id] || {}) });
  const dirty = Object.keys(drafts).length > 0;
  const save = () => call('save', () => api.put(`/guide/admin/clips/${clip.slug}/shots`, {
    shots: Object.entries(drafts).map(([id, d]) => ({ id, ...d })),
  }));

  const avatarShots = shots.filter((s) => s.type !== 'broll');
  const missingKf = avatarShots.filter((s) => !s.keyframe_url).length;
  const renderCost = avatarShots.reduce((sum, s) => sum + (s.raw_url ? 0 : costs.i2v[s.duration]) + (s.type === 'talk' && !s.synced_url ? costs.lipsync_per_s * Number(s.duration) : 0), 0);

  return (
    <div className="space-y-2" data-testid={`guide-shots-${clip.slug}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={!!busy || running} onClick={() => call('plan', () => api.post(`/guide/admin/clips/${clip.slug}/plan`))}
                className="h-7 text-[11px]" data-testid={`guide-shots-plan-${clip.slug}`}>
          <ListVideo size={12} className="mr-1" />{shots.length ? 'Shots neu planen' : 'Shots planen'}
        </Button>
        {shots.length > 0 && (
          <>
            <Button size="sm" variant="outline" disabled={!!busy || running || !dirty} onClick={save} className="h-7 text-[11px]" data-testid={`guide-shots-save-${clip.slug}`}>
              <Save size={12} className="mr-1" />Shots speichern
            </Button>
            <Button size="sm" variant="outline" disabled={!!busy || running || missingKf === 0} onClick={() => call('kf', () => api.post(`/guide/admin/clips/${clip.slug}/shot-keyframes`))}
                    className="h-7 text-[11px]" data-testid={`guide-shots-keyframes-${clip.slug}`}>
              <ImageIcon size={12} className="mr-1" />Keyframes ({missingKf} × {costs.keyframe.toFixed(2)} $)
            </Button>
            <Button size="sm" disabled={!!busy || running || missingKf > 0 || dirty} onClick={() => call('render', () => api.post(`/guide/admin/clips/${clip.slug}/render`))}
                    className="h-7 text-[11px] bg-[#BFFF00] text-black hover:bg-[#d4ff4d]" data-testid={`guide-shots-render-${clip.slug}`}>
              {busy === 'render' ? <Loader2 size={12} className="animate-spin mr-1" /> : <Clapperboard size={12} className="mr-1" />}
              Film rendern (~{renderCost.toFixed(2)} $)
            </Button>
          </>
        )}
      </div>
      {err && <p className="text-[11px] text-rose-500" data-testid={`guide-shots-error-${clip.slug}`}>{err}</p>}
      {shots.map((s) => (
        <ShotRow key={s.id} shot={s} slug={clip.slug} screens={screens} draft={draftOf(s)}
                 onDraft={(patch) => setDrafts((d) => ({ ...d, [s.id]: { ...draftOf(s), ...(d[s.id] || {}), ...patch } }))} />
      ))}
    </div>
  );
};
