import { useState } from 'react';
import { Loader2, ChevronDown, Sparkles, BookOpen, Radio, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';

export const STRINGS = {
  de: {
    toggle: 'Wissens-Quellen bearbeiten', toggleSub: 'Hochladen · Ansehen · Entfernen',
    choose: 'Dateien wählen (mehrere möglich)', embedding: 'Wird eingebettet…',
    dropHint: 'Oder mehrere PDFs/DOCX/TXT/MD hierher ziehen · max. 2 MB je Datei · sofort im WladBot-Wissen.',
    allowed: 'Erlaubt: .txt, .md, .pdf, .docx', tooLarge: (mb) => `Zu groß (${mb} MB, max. 2 MB)`, uploadFailed: 'Upload fehlgeschlagen',
    success: (n) => `${n} ${n === 1 ? 'Datei' : 'Dateien'} eingebettet — WladBot kennt sie sofort.`,
    confirmRemove: (name, chunks) => `„${name}" (${chunks} Chunks) wirklich aus dem Wissen entfernen?`, removed: 'Quelle entfernt', removeTitle: 'Quelle entfernen',
    done: 'fertig', failed: 'Fehler', pending: 'offen', clear: 'Liste leeren',
    status: { queued: 'Wartet', uploading: 'Lädt hoch', embedding: 'Extrahiert & bettet ein', done: 'Fertig', error: 'Fehler' },
    sources: 'Quellen', chunks: 'Chunks', empty: 'Keine Quellen im Store.',
    courses: 'Kurse & Bücher', coursesSub: 'Wlads Kern-Bibliothek', live: 'Live-Calls', liveSub: 'Neueste zuerst', custom: 'Eigene Uploads', customSub: 'Über die Admin-UI hinzugefügt',
  },
  en: {
    toggle: 'Edit knowledge sources', toggleSub: 'Upload · View · Remove',
    choose: 'Choose files (multiple)', embedding: 'Embedding…',
    dropHint: 'Or drop several PDF/DOCX/TXT/MD files here · max 2 MB each · live immediately.',
    allowed: 'Allowed: .txt, .md, .pdf, .docx', tooLarge: () => 'Too large (max 2 MB)', uploadFailed: 'Upload failed',
    success: (n) => `${n} file(s) embedded — live immediately.`,
    confirmRemove: (name, chunks) => `Really remove "${name}" (${chunks} chunks)?`, removed: 'Source removed', removeTitle: 'Remove source',
    done: 'done', failed: 'failed', pending: 'pending', clear: 'Clear',
    status: { queued: 'Queued', uploading: 'Uploading', embedding: 'Extracting & embedding', done: 'Done', error: 'Error' },
    sources: 'sources', chunks: 'chunks', empty: 'No sources in store.',
    courses: 'Courses & books', coursesSub: "Wlad's core library", live: 'Live calls', liveSub: 'Newest first', custom: 'Custom uploads', customSub: 'Added via admin UI',
  },
};

const STATUS_ICON = {
  done: <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />,
  error: <XCircle size={12} className="text-rose-500 shrink-0" />,
  queued: <Clock size={12} className="text-muted-foreground shrink-0" />,
  uploading: <Loader2 size={12} className="animate-spin text-[#6B8A00] dark:text-[#BFFF00] shrink-0" />,
  embedding: <Loader2 size={12} className="animate-spin text-[#6B8A00] dark:text-[#BFFF00] shrink-0" />,
};

const statusText = (it, t) => (it.status === 'done' ? `${it.chunks} Chunks` : it.status === 'error' ? it.error : t.status[it.status]);

export const UploadQueue = ({ queue, t, onClear }) => {
  const done = queue.filter((q) => q.status === 'done').length;
  const failed = queue.filter((q) => q.status === 'error').length;
  const active = queue.length - done - failed;
  return (
    <div className="mt-3 space-y-1" data-testid="knowledge-upload-queue">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
        <span data-testid="knowledge-upload-queue-summary">{done}/{queue.length} {t.done}{failed ? ` · ${failed} ${t.failed}` : ''}{active ? ` · ${active} ${t.pending}` : ''}</span>
        {!active && <button type="button" onClick={onClear} className="hover:text-foreground" data-testid="knowledge-upload-queue-clear">{t.clear}</button>}
      </div>
      {queue.map((it) => {
        const busy = it.status === 'uploading' || it.status === 'embedding';
        return (
          <div key={it.id} className="rounded-lg bg-black/[0.03] dark:bg-white/[0.04] px-2.5 py-1.5 text-[11px]" data-testid={`knowledge-upload-item-${it.file.name}`}>
            <div className="flex items-center gap-2">
              {STATUS_ICON[it.status]}
              <span className="flex-1 min-w-0 truncate font-semibold" title={it.file.name}>{it.file.name}</span>
              <span className="text-muted-foreground shrink-0" data-testid={`knowledge-upload-status-${it.file.name}`}>{statusText(it, t)}</span>
            </div>
            {busy && (
              <div className="mt-1 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className={`h-full bg-[#BFFF00] transition-[width] duration-300 ${it.status === 'embedding' ? 'animate-pulse' : ''}`} style={{ width: `${it.pct || 5}%` }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* Iter 121.5 (Stefan-Feedback): books + main courses FIRST, live calls collapsed. */
export const SourcesList = ({ sources, t, onRemove }) => {
  const cat = sources.categorised || { courses: sources.sources || [], live_calls: [], custom: [] };
  const totalChunks = sources.total_chunks || 0;
  const totalSources = (cat.courses?.length || 0) + (cat.live_calls?.length || 0) + (cat.custom?.length || 0);
  const sections = [
    { testId: 'knowledge-section-courses', icon: BookOpen, label: t.courses, sub: t.coursesSub, rows: cat.courses || [] },
    { testId: 'knowledge-section-live-calls', icon: Radio, label: t.live, sub: t.liveSub, rows: cat.live_calls || [], collapsible: true },
    { testId: 'knowledge-section-custom', icon: Sparkles, label: t.custom, sub: t.customSub, rows: cat.custom || [] },
  ];
  return (
    <div className="max-h-[420px] overflow-y-auto space-y-4 pr-1" data-testid="knowledge-sources-list">
      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#BFFF00]/10 border border-[#BFFF00]/20 text-[10.5px] font-black uppercase tracking-wider text-[#4A6200] dark:text-[#BFFF00]" data-testid="knowledge-sources-summary">
        <span>{totalSources} {t.sources}</span>
        <span>{totalChunks.toLocaleString('de-DE')} {t.chunks}</span>
      </div>
      {sections.filter((s) => s.rows.length > 0).map((s) => (
        <SourceSection key={s.testId} {...s} onRemove={onRemove} removeTitle={t.removeTitle} defaultCollapsed={s.collapsible} />
      ))}
      {totalSources === 0 && <p className="text-[10px] text-muted-foreground px-2 py-1">{t.empty}</p>}
    </div>
  );
};

const SourceSection = ({ testId, icon: Icon, label, sub, rows, onRemove, removeTitle, collapsible = false, defaultCollapsed = false }) => {
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
      {!collapsed && rows.map((s) => <SourceRow key={s.source_file} s={s} onRemove={onRemove} removeTitle={removeTitle} />)}
    </div>
  );
};

const SourceRow = ({ s, onRemove, removeTitle }) => (
  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors text-[11px]" data-testid={`knowledge-source-${s.source_file}`} title={s.source_file}>
    <span className="flex-1 min-w-0 truncate font-semibold">{s.display_title || s.course || s.source_file}</span>
    {s.type === 'custom' && (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] text-[9px] font-bold shrink-0"><Sparkles size={8} /> CUSTOM</span>
    )}
    <span className="text-muted-foreground shrink-0 tabular-nums">{s.chunks.toLocaleString('de-DE')} Chunks</span>
    <button onClick={() => onRemove(s)} className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0" title={removeTitle} data-testid={`knowledge-delete-${s.source_file}`}>
      <Trash2 size={12} />
    </button>
  </div>
);
