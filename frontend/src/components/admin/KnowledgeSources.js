/**
 * KnowledgeSources — editable knowledge corpus (Iter 119 · Enterprise Godmode).
 * List all RAG sources, upload new .txt/.md knowledge, delete sources.
 * Embedding happens locally on the backend — no keys, no rate limits.
 */
import { useState, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { FileText, Upload, Trash2, Loader2, ChevronDown, Sparkles, BookOpen, Radio } from 'lucide-react';
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
            <SourcesList sources={sources} de={de} onRemove={remove} />
          )}
        </div>
      )}
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
      {/* Summary strip */}
      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#BFFF00]/10 border border-[#BFFF00]/20 text-[10.5px] font-black uppercase tracking-wider text-[#4A6200] dark:text-[#BFFF00]" data-testid="knowledge-sources-summary">
        <span>{totalSources} {de ? 'Quellen' : 'sources'}</span>
        <span>{totalChunks.toLocaleString('de-DE')} {de ? 'Chunks' : 'chunks'}</span>
      </div>

      {/* Kurse & Bücher (Wlads Kern-Content) */}
      {(cat.courses?.length ?? 0) > 0 && (
        <SourceSection
          testId="knowledge-section-courses"
          icon={BookOpen}
          label={de ? 'Kurse & Bücher' : 'Courses & books'}
          sub={de ? 'Wlads Kern-Bibliothek' : "Wlad's core library"}
          rows={cat.courses}
          onRemove={onRemove}
          de={de}
        />
      )}

      {/* Live Calls */}
      {(cat.live_calls?.length ?? 0) > 0 && (
        <SourceSection
          testId="knowledge-section-live-calls"
          icon={Radio}
          label={de ? 'Live-Calls' : 'Live calls'}
          sub={de ? 'Neueste zuerst' : 'Newest first'}
          rows={cat.live_calls}
          onRemove={onRemove}
          de={de}
          collapsible
          defaultCollapsed
        />
      )}

      {/* Custom-Uploads via Admin */}
      {(cat.custom?.length ?? 0) > 0 && (
        <SourceSection
          testId="knowledge-section-custom"
          icon={Sparkles}
          label={de ? 'Eigene Uploads' : 'Custom uploads'}
          sub={de ? 'Über die Admin-UI hinzugefügt' : 'Added via admin UI'}
          rows={cat.custom}
          onRemove={onRemove}
          de={de}
        />
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
