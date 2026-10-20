import { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, Film, Link2, Loader2, RotateCcw, Sparkles, Upload, X, Image as ImageIcon } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { uploadVideoInChunks } from '../../lib/chunkedUpload';

const BASE = process.env.REACT_APP_BACKEND_URL;
const PHASE_LABEL = { uploading: 'Lädt', processing: 'Wird geprüft', done: 'Fertig' };

const SourceTab = ({ active, live, disabled, onClick, icon: Icon, label, hint, testid }) => (
  <button
    type="button" onClick={onClick} disabled={disabled} data-testid={testid}
    className={`flex-1 min-w-[150px] rounded-xl border px-3 py-2 text-left transition-colors disabled:opacity-40 ${
      active ? 'border-[#BFFF00] bg-[#BFFF00]/[0.08]' : 'border-border bg-background hover:border-foreground/30'}`}
  >
    <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-foreground">
      <Icon size={12} /> {label}
      {live && <span className="ml-auto text-[9px] font-black text-[#5a7a00] dark:text-[#BFFF00]">LIVE</span>}
    </span>
    <span className="mt-0.5 block text-[10px] text-muted-foreground">{hint}</span>
  </button>
);

/**
 * Ein Video-Feld für Guide-Clips und Kurs-Folgen: generiert · Vimeo-Link · eigenes Video.
 * Sofort live, das generierte Video bleibt erhalten. Download für Detailarbeit außerhalb.
 */
export const VideoSourcePanel = ({ kind, id, data, onChanged }) => {
  const isGuide = kind === 'guide';
  const active = data.active_source || data.video_source || (isGuide ? 'generated' : null);
  const [vimeo, setVimeo] = useState(data.vimeo_url || '');
  const [posterAt, setPosterAt] = useState(data.poster_at ?? '');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [progress, setProgress] = useState(null);
  const cancelRef = useRef(false);
  const fileRef = useRef(null);

  const run = async (label, fn) => {
    setBusy(label); setErr('');
    try { await fn(); await onChanged?.(); }
    catch (e) {
      logger.error(`video-source ${label} failed`, e);
      setErr(e?.message === 'cancelled' ? 'Upload abgebrochen.' : (e?.response?.data?.detail || 'Aktion fehlgeschlagen.'));
    } finally { setBusy(''); setProgress(null); }
  };

  const setSource = (source, vimeoUrl) =>
    run(`source-${source}`, () => api.put(`/media/source/${kind}/${id}`, { source, vimeo_url: vimeoUrl || null }));

  const savePosterAt = () =>
    run('poster', () => api.post(`/media/poster-at/${kind}/${id}`, { at: Number(posterAt) || 0 }));

  const pickFile = () => fileRef.current?.click();

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.(mp4|mov)$/i.test(file.name)) { setErr('Nur MP4 oder MOV — bitte Datei vorher umwandeln.'); return; }
    if (file.size > 2 * 1024 * 1024 * 1024) { setErr('Datei zu groß (max. 2 GB je Video).'); return; }
    cancelRef.current = false;
    run('upload', () => uploadVideoInChunks({
      file, target: isGuide ? 'guide_clip' : 'course_episode', targetId: id,
      onProgress: setProgress, shouldAbort: () => cancelRef.current,
    }));
  };

  const downloads = isGuide
    ? [
        data.has_generated && { label: 'Live-Fassung', variant: 'live' },
        data.preview_url && { label: 'Letzte Vorschau', variant: 'preview' },
        data.has_upload && { label: 'Eigenes Video', variant: 'custom' },
      ].filter(Boolean)
    : (data.has_upload ? [{ label: 'Eigenes Video', variant: 'custom' }] : []);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3" data-testid={`video-source-panel-${id}`}>
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Video · Quelle</p>
        <span className="text-[10px] text-muted-foreground">
          {active === 'vimeo' ? 'Vimeo-Link ist live' : active === 'upload' ? 'Eigenes Video ist live' : isGuide ? 'Generiertes Video ist live' : 'Noch kein Video'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {isGuide && (
          <SourceTab
            active={active === 'generated'} live={active === 'generated'} disabled={!data.has_generated || !!busy}
            onClick={() => setSource('generated')} icon={Sparkles} label="Generiert"
            hint={data.has_generated ? 'Von Wlad gerendert' : 'Noch nicht gerendert'}
            testid={`video-source-generated-${id}`}
          />
        )}
        <SourceTab
          active={active === 'vimeo'} live={active === 'vimeo'} disabled={!!busy}
          onClick={() => (data.vimeo_id ? setSource('vimeo') : setVimeo(vimeo))} icon={Link2} label="Vimeo-Link"
          hint={data.vimeo_id ? `ID ${data.vimeo_id}` : 'Link unten einfügen'}
          testid={`video-source-vimeo-${id}`}
        />
        <SourceTab
          active={active === 'upload'} live={active === 'upload'} disabled={!!busy}
          onClick={() => (data.has_upload ? setSource('upload') : pickFile())} icon={Upload} label="Eigenes Video"
          hint={data.has_upload ? (data.uploaded_filename || 'hochgeladen') : 'MP4/MOV bis 2 GB'}
          testid={`video-source-upload-${id}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
        <Input
          value={vimeo} onChange={(e) => setVimeo(e.target.value)} disabled={!!busy}
          placeholder="https://vimeo.com/123456789 oder nur die ID"
          className="h-8 bg-background border-border text-[11px]" data-testid={`vimeo-input-${id}`}
        />
        <Button size="sm" variant="outline" disabled={!!busy || !vimeo.trim()} onClick={() => setSource('vimeo', vimeo.trim())}
                className="h-8 text-[11px]" data-testid={`vimeo-save-${id}`}>
          {busy === 'source-vimeo' ? <Loader2 size={12} className="animate-spin mr-1" /> : <Link2 size={12} className="mr-1" />}
          Prüfen &amp; übernehmen
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,.mp4,.mov" className="hidden"
               onChange={onFile} data-testid={`video-file-input-${id}`} />
        <Button size="sm" variant="outline" disabled={!!busy} onClick={pickFile} className="h-8 text-[11px]" data-testid={`video-upload-btn-${id}`}>
          <Upload size={12} className="mr-1" /> Eigenes Video hochladen
        </Button>
        {isGuide && data.has_generated && active !== 'generated' && (
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => setSource('generated')} className="h-8 text-[11px]" data-testid={`video-back-generated-${id}`}>
            <RotateCcw size={12} className="mr-1" /> Zurück zum generierten Video
          </Button>
        )}
        {busy === 'upload' && (
          <Button size="sm" variant="ghost" onClick={() => { cancelRef.current = true; }} className="h-8 text-[11px] text-rose-500" data-testid={`video-upload-cancel-${id}`}>
            <X size={12} className="mr-1" /> Abbrechen
          </Button>
        )}
      </div>

      {progress && (
        <div data-testid={`video-upload-progress-${id}`}>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-[#BFFF00] transition-all" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {PHASE_LABEL[progress.phase]}{progress.phase === 'uploading' ? ` ${progress.percent} %` : ''}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-2">
        <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><ImageIcon size={11} /> Vorschaubild ab Sekunde</p>
        <Input
          type="number" step="0.5" min="0" value={posterAt} onChange={(e) => setPosterAt(e.target.value)} disabled={!!busy}
          placeholder="z. B. 4.5" className="h-8 bg-background border-border text-[11px] max-w-[120px]" data-testid={`poster-at-input-${id}`}
        />
        <Button size="sm" variant="outline" disabled={!!busy || posterAt === ''} onClick={savePosterAt} className="h-8 text-[11px]" data-testid={`poster-at-save-${id}`}>
          {busy === 'poster' ? <Loader2 size={12} className="animate-spin mr-1" /> : null} Als Vorschaubild übernehmen
        </Button>
      </div>

      {data.poster_url && (
        <img src={/^https?:/.test(data.poster_url) ? data.poster_url : `${BASE}${data.poster_url}`} alt="Vorschaubild"
             className="w-full max-w-[260px] rounded-lg border border-border" data-testid={`poster-preview-${id}`} />
      )}

      {downloads.length > 0 && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-2">
            {downloads.map((d) => (
              <a key={d.variant} href={`${BASE}/api/media/download/${kind}/${id}${isGuide ? `?variant=${d.variant}` : ''}`}
                 className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10.5px] font-semibold hover:bg-muted"
                 data-testid={`video-download-${d.variant}-${id}`}>
                <Download size={11} /> {d.label} herunterladen
              </a>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground flex items-start gap-1">
            <Film size={11} className="mt-0.5 shrink-0" />
            Arbeitsweg: herunterladen → außerhalb schneiden → als eigenes Video wieder hochladen. Das generierte Video bleibt als Rückfall erhalten.
          </p>
        </div>
      )}

      {err && <p className="text-[11px] text-rose-500" data-testid={`video-source-error-${id}`}>{err}</p>}
    </div>
  );
};

export default VideoSourcePanel;
