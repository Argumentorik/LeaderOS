import { useEffect, useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const inline = (text) => {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('`')) return <code key={`c${i}`} className="px-1 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08] font-mono text-[11px]">{p.slice(1, -1)}</code>;
    if (p.startsWith('**')) return <strong key={`b${i}`}>{p.slice(2, -2)}</strong>;
    return p;
  });
};

/* Minimaler Markdown-Renderer für das Handbuch: Überschriften, Listen, Tabellen, Codeblöcke, Fett, Inline-Code. */
const renderMarkdown = (md) => {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const buf = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) { buf.push(lines[i]); i += 1; }
      out.push(<pre key={`pre${i}`} className="my-2 p-3 rounded-lg bg-[#0A0A0A] text-[#E6FFB0] text-[11px] font-mono overflow-x-auto whitespace-pre">{buf.join('\n')}</pre>);
      i += 1; continue;
    }
    if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i += 1; }
      const cells = (r) => r.split('|').slice(1, -1).map((c) => c.trim());
      const [head, , ...body] = rows;
      out.push(
        <table key={`t${i}`} className="my-2 w-full text-[12px] border-collapse">
          <thead><tr>{cells(head).map((c, k) => <th key={`${k}-${c}`} className="text-left py-1 pr-3 border-b border-black/10 dark:border-white/10 text-[10px] uppercase tracking-wide text-muted-foreground">{c}</th>)}</tr></thead>
          <tbody>{body.map((r, ri) => <tr key={`${ri}-${r.slice(0, 40)}`}>{cells(r).map((c, k) => <td key={`${k}-${c.slice(0, 40)}`} className="py-1 pr-3 align-top border-b border-black/[0.04] dark:border-white/[0.05]">{inline(c)}</td>)}</tr>)}</tbody>
        </table>,
      );
      continue;
    }
    if (/^\s*(-|\d+\.)\s/.test(line)) {
      const items = [];
      const ordered = /^\s*\d+\./.test(line);
      while (i < lines.length && /^\s*(-|\d+\.)\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*(-|\d+\.)\s/, '')); i += 1; }
      const Tag = ordered ? 'ol' : 'ul';
      out.push(<Tag key={`l${i}`} className={`my-1.5 pl-5 space-y-1 text-[12.5px] ${ordered ? 'list-decimal' : 'list-disc'}`}>{items.map((it, k) => <li key={`${k}-${it.slice(0, 40)}`}>{inline(it)}</li>)}</Tag>);
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) {
      const lvl = h[1].length;
      const cls = lvl === 1 ? 'text-base font-black mt-1' : lvl === 2 ? 'text-[13.5px] font-bold mt-4 mb-1' : 'text-[12.5px] font-semibold mt-3 mb-0.5';
      out.push(<p key={`h${i}`} className={cls} style={{ fontFamily: 'Outfit, sans-serif' }}>{inline(h[2])}</p>);
      i += 1; continue;
    }
    if (line.trim()) out.push(<p key={`p${i}`} className="text-[12.5px] leading-relaxed my-1 text-foreground/85">{inline(line)}</p>);
    i += 1;
  }
  return out;
};

export const RagHandbook = ({ de = true }) => {
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    if (!open || doc) return;
    api.get('/admin/rag/handbuch').then((r) => setDoc(r.data)).catch((err) => logger.warn('handbook failed', err));
  }, [open, doc]);

  return (
    <div className="mt-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-background/60" data-testid="rag-handbook">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 py-2.5 text-left" data-testid="rag-handbook-toggle" aria-expanded={open}>
        <BookOpen size={14} className="text-[#4A6200] dark:text-[#BFFF00]" />
        <span className="text-[12.5px] font-semibold">{de ? 'Dev-Handbuch: RAG & Wissenspflege in 5 Minuten' : 'Dev handbook: RAG & knowledge care in 5 minutes'}</span>
        <span className="text-[10.5px] text-muted-foreground ml-1">{de ? 'Ablauf · Statuszeile lesen · Hochladen · Re-Ingest · Deploy-Check' : 'Flow · status line · upload · re-ingest · deploy check'}</span>
        <ChevronDown size={14} className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 max-h-[560px] overflow-y-auto" data-testid="rag-handbook-body">
          {doc ? renderMarkdown(doc.markdown) : <p className="text-[12px] text-muted-foreground py-2">{de ? 'Lade Handbuch …' : 'Loading handbook …'}</p>}
          {doc && <p className="text-[10px] text-muted-foreground mt-3">{de ? 'Quelle' : 'Source'}: docs/DEV_HANDBUCH_RAG.md · {new Date(doc.updated_at).toLocaleString(de ? 'de-DE' : 'en-GB')}</p>}
        </div>
      )}
    </div>
  );
};
