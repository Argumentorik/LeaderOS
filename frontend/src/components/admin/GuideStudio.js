/**
 * GuideStudio — Admin-Produktion der Wlad-Guide-Videos (Iter 143).
 * Assets (Avatar-Gesicht, Körperfoto, Stimmprobe) + Clip-Liste mit der
 * Cinematic-Pipeline: Skript → Stimme → Keyframe → Kling/Lipsync → Freigabe.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Upload, Mic, Check, AlertCircle, Clapperboard } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { GuideClipCard } from './GuideClipCard';
import { InteractiveBetaCard } from './InteractiveBetaCard';

const AssetTile = ({ label, hint, url, kind, accept, endpoint, onDone, isAudio }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const upload = async (file) => {
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onDone();
    } catch (e) {
      logger.error('guide asset upload failed', e);
      setErr(e?.response?.data?.detail || 'Upload fehlgeschlagen');
    } finally { setBusy(false); }
  };

  return (
    <Card className="p-3 bg-card border-border flex flex-col gap-2" data-testid={`guide-asset-${kind}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">{label}</span>
        {url ? <Check size={14} className="text-[#BFFF00]" /> : <AlertCircle size={14} className="text-amber-400" />}
      </div>
      {url && !isAudio && (
        <img src={`${process.env.REACT_APP_BACKEND_URL}${url}`} alt={label}
             className="w-full h-36 object-contain rounded-lg bg-muted" />
      )}
      {url && isAudio && <audio controls src={`${process.env.REACT_APP_BACKEND_URL}${url}`} className="w-full h-8" />}
      <p className="text-[10px] text-muted-foreground leading-snug">{hint}</p>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
             onChange={(e) => upload(e.target.files?.[0])} data-testid={`guide-asset-${kind}-input`} />
      <Button size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}
              className="h-7 text-[11px]" data-testid={`guide-asset-${kind}-upload`}>
        {busy ? <Loader2 size={12} className="animate-spin mr-1" /> : <Upload size={12} className="mr-1" />}
        {url ? 'Ersetzen' : 'Hochladen'}
      </Button>
      {err && <p className="text-[10px] text-rose-400">{err}</p>}
    </Card>
  );
};

export const GuideStudio = () => {
  const [data, setData] = useState(null);
  const [cloning, setCloning] = useState(false);
  const [cloneErr, setCloneErr] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkErr, setBulkErr] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/guide/admin/overview');
      setData(res.data);
    } catch (e) { logger.error('guide overview failed', e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const anyRunning = data?.clips?.some((c) => (c.status || '').endsWith('_running')) || data?.settings?.voice_clone_status === 'running';
  useEffect(() => {
    if (!anyRunning) return undefined;
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, [anyRunning, load]);

  const cloneVoice = async () => {
    setCloning(true); setCloneErr('');
    try { await api.post('/guide/admin/voice-clone', {}); await load(); }
    catch (e) { setCloneErr(e?.response?.data?.detail || 'Stimm-Klon fehlgeschlagen'); }
    finally { setCloning(false); }
  };

  if (!data) return <div className="text-xs text-muted-foreground py-6" data-testid="guide-studio-loading"><Loader2 size={14} className="animate-spin inline mr-2" />Guide Studio lädt…</div>;

  const s = data.settings;
  const cloneRunning = s.voice_clone_status === 'running';
  const pending = data.clips.filter((c) => c.multi_shot && !(c.status || '').endsWith('_running') && !(c.video_url && c.pipeline === 'multishot'));
  const bulkProduce = async () => {
    setBulkBusy(true); setBulkErr('');
    try { await api.post('/guide/admin/clips/bulk-produce', { slugs: pending.map((c) => c.slug) }); await load(); }
    catch (e) { setBulkErr(e?.response?.data?.detail || 'Serienproduktion fehlgeschlagen'); }
    finally { setBulkBusy(false); }
  };
  return (
    <div className="space-y-4" data-testid="guide-studio">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <AssetTile kind="portrait" label="Avatar-Gesicht (3D)" url={s.portrait_url} endpoint="/guide/admin/portrait"
                   accept="image/*" onDone={load} hint="Referenz 1 für den Keyframe — das WladBot-Gesicht, das der Clip übernimmt." />
        <AssetTile kind="body" label="Körper & Haltung" url={s.body_url} endpoint="/guide/admin/body"
                   accept="image/*" onDone={load} hint="Referenz 2 — Ganzkörperfoto für Proportionen und Bühnenhaltung." />
        <AssetTile kind="sample" label="Stimmprobe" url={s.voice_sample_url} endpoint="/guide/admin/voice-sample"
                   accept="audio/*,video/mp4" onDone={load} isAudio
                   hint="10-60 s sauberer Sprachton von Wlad. Daraus entsteht der Stimm-Klon (einmalig 1,50 $)." />
      </div>

      <Card className="p-3 bg-card border-border flex flex-wrap items-center gap-3" data-testid="guide-voice-row">
        <Mic size={14} className="text-[#BFFF00]" />
        <div className="text-[11px] text-muted-foreground">
          Stimme in Nutzung: <span className="font-mono text-foreground" data-testid="guide-voice-id">{s.voice_id_in_use}</span>
          {s.custom_voice_id ? <span className="ml-2 text-[#5a7a00] dark:text-[#BFFF00]">Wlad-Klon aktiv</span> : <span className="ml-2 text-amber-500">Standardstimme — noch kein Klon</span>}
          {cloneRunning && <span className="ml-2 text-amber-500"><Loader2 size={11} className="animate-spin inline mr-1" />Klon läuft (2-5 Min)…</span>}
        </div>
        <Button size="sm" disabled={cloning || cloneRunning || !s.voice_sample_url} onClick={cloneVoice}
                className="h-7 text-[11px] bg-[#BFFF00] text-black hover:bg-[#d4ff4d]" data-testid="guide-voice-clone-btn">
          {cloning ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
          {s.custom_voice_id ? 'Klon erneuern' : 'Stimme klonen (1,50 $)'}
        </Button>
        <span className="ml-auto text-[10px] text-muted-foreground" data-testid="guide-spent">Bisher ausgegeben: {s.spent_usd.toFixed(2)} $</span>
        {(cloneErr || s.voice_clone_error) && <p className="w-full text-[10px] text-rose-500">{cloneErr || s.voice_clone_error}</p>}
      </Card>

      <InteractiveBetaCard voiceCloned={!!s.custom_voice_id} />

      <div className="space-y-3">
        <div className="flex items-center gap-2" data-testid="guide-bulk-row">
          <Button size="sm" variant="outline" disabled={bulkBusy || !pending.length} onClick={bulkProduce} className="h-7 text-[11px]" data-testid="guide-bulk-produce-btn">
            {bulkBusy ? <Loader2 size={12} className="animate-spin mr-1" /> : <Clapperboard size={12} className="mr-1" />}
            Alle offenen Clips produzieren ({pending.length} · ≈ {(pending.length * 1.7).toFixed(2)} $)
          </Button>
          <span className="text-[10px] text-muted-foreground">Max. 3 parallel · Planen → Keyframes → Film je Clip</span>
          {bulkErr && <span className="text-[10px] text-rose-500">{bulkErr}</span>}
        </div>
        {data.clips.map((clip) => <GuideClipCard key={clip.slug} clip={clip} costs={data.costs} screens={data.broll_screens} onChange={load} />)}
      </div>
    </div>
  );
};
