/**
 * KnowledgeSources — editable knowledge corpus (Iter 119 · Enterprise Godmode).
 * List all RAG sources, bulk-upload .txt/.md/.pdf/.docx knowledge (drag & drop,
 * per-file progress), delete sources. Embedding runs locally on the backend.
 */
import { useState, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { FileText, Upload, Trash2, Loader2, ChevronDown, Sparkles, BookOpen, Radio, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const MAX_KNOWLEDGE_BYTES = 2 * 1024 * 1024;
const ALLOWED = /\.(txt|md|pdf|docx)$/i;

const validate = (file, de) => {
  if (!ALLOWED.test(file.name)) return de ? 'Erlaubt: .txt, .md, .pdf, .docx' : 'Allowed: .txt, .md, .pdf, .docx';
  if (file.size > MAX_KNOWLEDGE_BYTES) return de ? `Zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB, max. 2 MB)` : 'Too large (max 2 MB)';
  return null;
};

export const KnowledgeSources = ({ de = true, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/rag/sources');
      setSources(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Quellen laden fehlgeschlagen');
    } finally { setLoading(false); }
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !sources) load();
  };

  const patch = (id, data) => setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...data } : it)));

  const uploadOne = async (item) => {
    patch(item.id, { status: 'uploading' });
    try {
      const fd = new FormData();
      fd.append('file', item.file);
      fd.append('course_title', item.file.name.replace(ALLOWED, '').replace(/_/g, ' '));
      const res = await api.post('/admin/rag/upload-knowledge-file', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000,
        onUploadProgress: (e) => {
          if (e.total) patch(item.id, { pct: Math.round((e.loaded / e.total) * 100), status: e.loaded >= e.total ? 'embedding' : 'uploading' });
        },
      });
      patch(item.id, { status: 'done', pct: 100, chunks: res.data.chunks_added, course: res.data.course });
      return true;
    } catch (err) {
      patch(item.id, { status: 'error', error: err?.response?.data?.detail || (de ? 'Upload fehlgeschlagen' : 'Upload failed') });
      return false;
    }
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const items = files.map((file, i) => {
      const err = validate(file, de);
      return { id: `${Date.now()}-${i}-${file.name}`, file, status: err ? 'error' : 'queued', error: err, pct: 0 };
    });
    setQueue((q) => [...q, ...items]);
    setUploading(true);
    let ok = 0;
    for (const item of items) {
      if (item.status === 'error') continue;
      if (await uploadOne(item)) ok += 1;
    }
    setUploading(false);
    if (ok) {
      toast.success(de ? `${ok} ${ok === 1 ? 'Datei' : 'Dateien'} eingebettet — WladBot kennt sie sofort.` : `${ok} file(s) embedded — live immediately.`);
      await load();
      onChanged?.();
    }
  };

  const onFile = (e) => { const files = Array.from(e.target.files || []); addFiles(files); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };

  const remove = async (src) => {
    if (!window.confirm(de
      ? `„${src.course || src.source_file}" (${src.chunks} Chunks) wirklich aus dem Wissen entfernen?`
      : `Really remove "${src.course || src.source_file}" (${src.chunks} chunks)?`)) return;
    try {
      await api.delete(`/admin/rag/source/${encodeURIComponent(src.source_file)}`);
      toast.success(de ? 'Quelle entfernt' : 'Source removed');
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Löschen fehlgeschlagen');
    }
  };

  return (
    <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08]" data-testid="knowledge-sources">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
        data-testid="knowledge-sources-toggle"
      >
        <FileText size={14} className="text-[#6B8A00] dark:text-[#BFFF00] shrink-0" />
        <span className="flex-1 text-xs font-bold">
          {de ? 'Wissens-Quellen bearbeiten' : 'Edit knowledge sources'}
          <span className="ml-2 text-[10px] font-medium text-muted-foreground">
            {de ? 'Hochladen · Ansehen · Entfernen' : 'Upload · View · Remove'}
          </span>
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 space-y-2.5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-xl border-2 border-dashed p-3.5 transition-colors ${dragOver ? 'border-[#BFFF00] bg-[#BFFF00]/10' : 'border-black/10 dark:border-white/15'}`}
            data-testid="knowledge-dropzone"
          >
            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileRef} type="file" multiple accept=".txt,.md,.pdf,.docx" className="hidden" onChange={onFile} data-testid="knowledge-file-input" />
              <Button
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="h-8 text-[11px] gap-1.5 bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold"
                data-testid="knowledge-upload-btn"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {uploading ? (de ? 'Wird eingebettet…' : 'Embedding…') : (de ? 'Dateien wählen (mehrere möglich)' : 'Choose files (multiple)')}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                {de ? 'Oder mehrere PDFs/DOCX/TXT/MD hierher ziehen · max. 2 MB je Datei · sofort im WladBot-Wissen.' : 'Or drop several PDF/DOCX/TXT/MD files here · max 2 MB each · live immediately.'}
              </p>
            </div>
            {queue.length > 0 && <UploadQueue queue={queue} de={de} onClear={() => setQueue((q) => q.filter((it) => it.status !== 'done' && it.status !== 'error'))} />}
          </div>

          {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          {sources && (
            <SourcesList sources={sources} de={de} onRemove={remove} />
          )}
        </div>
      )}
    </div>
  );
};

const STATUS_LABEL = {
  queued: ['Wartet', 'Queued'], uploading: ['Lädt hoch', 'Uploading'], embedding: ['Extrahiert & bettet ein', 'Extracting & embedding'],
  done: ['Fertig', 'Done'], error: ['Fehler', 'Error'],
};

const UploadQueue = ({ queue, de, onClear }) => {
  const done = queue.filter((q) => q.status === 'done').length;
  const failed = queue.filter((q) => q.status === 'error').length;
  const active = queue.length - done - failed;
  return (
    <div className="mt-3 space-y-1" data-testid="knowledge-upload-queue">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
        <span data-testid="knowledge-upload-queue-summary">{done}/{queue.length} {de ? 'fertig' : 'done'}{failed ? ` · ${failed} ${de ? 'Fehler' : 'failed'}` : ''}{active ? ` · ${active} ${de ? 'offen' : 'pending'}` : ''}</span>
        {!active && <button type="button" onClick={onClear} className="hover:text-foreground" data-testid="knowledge-upload-queue-clear">{de ? 'Liste leeren' : 'Clear'}</button>}
      </div>
      {queue.map((it) => (
        <div key={it.id} className="rounded-lg bg-black/[0.03] dark:bg-white/[0.04] px-2.5 py-1.5 text-[11px]" data-testid={`knowledge-upload-item-${it.file.name}`}>
          <div className="flex items-center gap-2">
            {it.status === 'done' && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
            {it.status === 'error' && <XCircle size={12} className="text-rose-500 shrink-0" />}
            {it.status === 'queued' && <Clock size={12} className="text-muted-foreground shrink-0" />}
            {(it.status === 'uploading' || it.status === 'embedding') && <Loader2 size={12} className="animate-spin text-[#6B8A00] dark:text-[#BFFF00] shrink-0" />}
            <span className="flex-1 min-w-0 truncate font-semibold" title={it.file.name}>{it.file.name}</span>
            <span className="text-muted-foreground shrink-0" data-testid={`knowledge-upload-status-${it.file.name}`}>
              {it.status === 'done' ? `${it.chunks} Chunks` : it.status === 'error' ? it.error : STATUS_LABEL[it.status][de ? 0 : 1]}
            </span>
          </div>
          {(it.status === 'uploading' || it.status === 'embedding') && (
            <div className="mt-1 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div className={`h-full bg-[#BFFF00] transition-[width] duration-300 ${it.status === 'embedding' ? 'animate-pulse' : ''}`} style={{ width: `${it.pct || 5}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Iter 121.5 (Stefan-Feedback): categorised rendering so books + main courses
 * appear FIRST and cannot be missed behind a wall of 30 Live-Call files.
 */
const SourcesList = ({ sources, de, onRemove }) => {
  const cat = sources.categorised || { courses: sources.sources || [], live_calls: [], custom: [] };
  const totalChunks = sources.total_chunks || 0;
  const totalSources = (cat.courses?.length || 0) + (cat.live_calls?.length || 0) + (cat.custom?.length || 0);

  return (
    <div className="max-h-[420px] overflow-y-auto space-y-4 pr-1" data-testid="knowledge-sources-list">
      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#BFFF00]/10 border border-[#BFFF00]/20 text-[10.5px] font-black uppercase tracking-wider text-[#4A6200] dark:text-[#BFFF00]" data-testid="knowledge-sources-summary">
        <span>{totalSources} {de ? 'Quellen' : 'sources'}</span>
        <span>{totalChunks.toLocaleString('de-DE')} {de ? 'Chunks' : 'chunks'}</span>
      </div>

      {(cat.courses?.length ?? 0) > 0 && (
        <SourceSection testId="knowledge-section-courses" icon={BookOpen} label={de ? 'Kurse & Bücher' : 'Courses & books'} sub={de ? 'Wlads Kern-Bibliothek' : "Wlad's core library"} rows={cat.courses} onRemove={onRemove} de={de} />
      )}
      {(cat.live_calls?.length ?? 0) > 0 && (
        <SourceSection testId="knowledge-section-live-calls" icon={Radio} label={de ? 'Live-Calls' : 'Live calls'} sub={de ? 'Neueste zuerst' : 'Newest first'} rows={cat.live_calls} onRemove={onRemove} de={de} collapsible defaultCollapsed />
      )}
      {(cat.custom?.length ?? 0) > 0 && (
        <SourceSection testId="knowledge-section-custom" icon={Sparkles} label={de ? 'Eigene Uploads' : 'Custom uploads'} sub={de ? 'Über die Admin-UI hinzugefügt' : 'Added via admin UI'} rows={cat.custom} onRemove={onRemove} de={de} />
      )}

      {totalSources === 0 && (
        <p className="text-[10px] text-muted-foreground px-2 py-1">{de ? 'Keine Quellen im Store.' : 'No sources in store.'}</p>
      )}
    </div>
  );
};

const SourceSection = ({ testId, icon: Icon, label, sub, rows, onRemove, de, collapsible = false, defaultCollapsed = false }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className="space-y-1" data-testid={testId}>
      <button
        type="button"
        onClick={() => collapsible && setCollapsed(!collapsed)}
        className={`flex items-center gap-2 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/80 w-full text-left ${collapsible ? 'hover:text-foreground cursor-pointer' : 'cursor-default'}`}
        data-testid={`${testId}-header`}
      >
        <Icon size={11} className="text-[#6B8A00] dark:text-[#BFFF00]" />
        <span className="flex-1">{label} <span className="text-muted-foreground/50 font-semibold normal-case tracking-normal">· {rows.length} · {sub}</span></span>
        {collapsible && <ChevronDown size={11} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />}
      </button>
      {!collapsed && rows.map((s) => (
        <div
          key={s.source_file}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors text-[11px]"
          data-testid={`knowledge-source-${s.source_file}`}
          title={s.source_file}
        >
          <span className="flex-1 min-w-0 truncate font-semibold">{s.display_title || s.course || s.source_file}</span>
          {s.type === 'custom' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] text-[9px] font-bold shrink-0">
              <Sparkles size={8} /> CUSTOM
            </span>
          )}
          <span className="text-muted-foreground shrink-0 tabular-nums">{s.chunks.toLocaleString('de-DE')} Chunks</span>
          <button
            onClick={() => onRemove(s)}
            className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
            title={de ? 'Quelle entfernen' : 'Remove source'}
            data-testid={`knowledge-delete-${s.source_file}`}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};
