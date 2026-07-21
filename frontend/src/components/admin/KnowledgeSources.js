/**
 * KnowledgeSources — editable knowledge corpus (Iter 119 · Enterprise Godmode).
 * List all RAG sources, upload new .txt/.md knowledge, delete sources.
 * Embedding happens locally on the backend — no keys, no rate limits.
 */
import { useState, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { FileText, Upload, Trash2, Loader2, ChevronDown, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export const KnowledgeSources = ({ de = true, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      toast.error(de ? 'Nur .txt oder .md Dateien' : 'Only .txt or .md files');
      return;
    }
    const content = await file.text();
    setUploading(true);
    try {
      const res = await api.post('/admin/rag/upload-knowledge', {
        filename: file.name,
        content,
        course_title: file.name.replace(/\.(txt|md)$/i, '').replace(/_/g, ' '),
      });
      toast.success(de
        ? `„${res.data.course}" hinzugefügt — ${res.data.chunks_added} Chunks, WladBot kennt es sofort.`
        : `"${res.data.course}" added — ${res.data.chunks_added} chunks, live immediately.`);
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Upload fehlgeschlagen');
    } finally { setUploading(false); }
  };

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
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={onFile} data-testid="knowledge-file-input" />
            <Button
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="h-8 text-[11px] gap-1.5 bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold"
              data-testid="knowledge-upload-btn"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {uploading ? (de ? 'Wird eingebettet…' : 'Embedding…') : (de ? 'Wissen hochladen (.txt/.md)' : 'Upload knowledge (.txt/.md)')}
            </Button>
            <p className="text-[10px] text-muted-foreground">
              {de ? 'Neue Transkripte/Dokumente sind sofort im WladBot-Wissen.' : 'New transcripts/documents are instantly live in WladBot.'}
            </p>
          </div>

          {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          {sources && (
            <div className="max-h-64 overflow-y-auto space-y-1 pr-1" data-testid="knowledge-sources-list">
              {(sources.sources || []).map((s) => (
                <div key={s.source_file} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors text-[11px]" data-testid={`knowledge-source-${s.source_file}`}>
                  <span className="flex-1 min-w-0 truncate font-semibold">{s.course || s.source_file}</span>
                  {s.type === 'custom' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] text-[9px] font-bold shrink-0">
                      <Sparkles size={8} /> CUSTOM
                    </span>
                  )}
                  <span className="text-muted-foreground shrink-0">{s.chunks} Chunks</span>
                  <button
                    onClick={() => remove(s)}
                    className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                    title={de ? 'Quelle entfernen' : 'Remove source'}
                    data-testid={`knowledge-delete-${s.source_file}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {(sources.sources || []).length === 0 && (
                <p className="text-[10px] text-muted-foreground px-2 py-1">{de ? 'Keine Quellen im Store.' : 'No sources in store.'}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
