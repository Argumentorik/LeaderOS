/**
 * KnowledgeSources — editable knowledge corpus (Iter 119 · Enterprise Godmode).
 * Bulk-upload .txt/.md/.pdf/.docx knowledge (drag & drop, per-file progress),
 * list and delete sources. Embedding runs locally on the backend.
 */
import { useState, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { FileText, Upload, Loader2, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { STRINGS, UploadQueue, SourcesList } from './KnowledgeSourcesList';

const MAX_KNOWLEDGE_BYTES = 2 * 1024 * 1024;
const ALLOWED = /\.(txt|md|pdf|docx)$/i;

const validate = (file, t) => {
  if (!ALLOWED.test(file.name)) return t.allowed;
  if (file.size > MAX_KNOWLEDGE_BYTES) return t.tooLarge((file.size / 1024 / 1024).toFixed(1));
  return null;
};

const titleFromName = (name) => name.replace(ALLOWED, '').replace(/_/g, ' ');

export const KnowledgeSources = ({ de = true, onChanged }) => {
  const t = STRINGS[de ? 'de' : 'en'];
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
      fd.append('course_title', titleFromName(item.file.name));
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
      patch(item.id, { status: 'error', error: err?.response?.data?.detail || t.uploadFailed });
      return false;
    }
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const items = files.map((file, i) => {
      const err = validate(file, t);
      return { id: `${Date.now()}-${i}-${file.name}`, file, status: err ? 'error' : 'queued', error: err, pct: 0 };
    });
    setQueue((q) => [...q, ...items]);
    setUploading(true);
    let ok = 0;
    for (const item of items.filter((it) => it.status !== 'error')) {
      if (await uploadOne(item)) ok += 1;
    }
    setUploading(false);
    if (!ok) return;
    toast.success(t.success(ok));
    await load();
    onChanged?.();
  };

  const onFile = (e) => { const files = Array.from(e.target.files || []); addFiles(files); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };

  const remove = async (src) => {
    if (!window.confirm(t.confirmRemove(src.course || src.source_file, src.chunks))) return;
    try {
      await api.delete(`/admin/rag/source/${encodeURIComponent(src.source_file)}`);
      toast.success(t.removed);
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
          {t.toggle}
          <span className="ml-2 text-[10px] font-medium text-muted-foreground">{t.toggleSub}</span>
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
                {uploading ? t.embedding : t.choose}
              </Button>
              <p className="text-[10px] text-muted-foreground">{t.dropHint}</p>
            </div>
            {queue.length > 0 && <UploadQueue queue={queue} t={t} onClear={() => setQueue((q) => q.filter((it) => it.status !== 'done' && it.status !== 'error'))} />}
          </div>

          {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          {sources && <SourcesList sources={sources} t={t} onRemove={remove} />}
        </div>
      )}
    </div>
  );
};
