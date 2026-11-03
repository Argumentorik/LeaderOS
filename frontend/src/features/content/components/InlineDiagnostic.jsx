import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { captureLeadershipIntent, wladbotUrlForIntent } from '../../../lib/leadershipIntent';

/**
 * InlineDiagnostic · the in-article problem-capture block (Growth-Loop
 * Layer 2). Renders inside long-form articles via a `diagnostic` body
 * block. The reader picks the situation they're actually in (or types
 * it), which flows through the SAME Intent Schema Layer as the WladBot
 * card — one normalized event stream — and routes them into WladBot with
 * a category-tuned prompt.
 *
 * Why inside the article and not just the rail: a reader 60% through a
 * piece on "laterale Führung" is at peak problem-awareness. Capturing the
 * specific situation right there produces the cleanest intent data AND
 * the highest click-through, because the offer matches the exact moment.
 *
 * Block usage in an article body:
 *   { type: 'diagnostic',
 *     prompt: 'In welcher Situation steckst du gerade?',
 *     options: ['Mein Senior zieht nicht mit', 'Ich kann nicht delegieren', …] }
 * If `options` is omitted, a sensible default set is used.
 */

const DEFAULT_OPTIONS = [
  { label: 'Ein Mitarbeiter zieht nicht mit', category: 'performance' },
  { label: 'Ich kann nicht delegieren', category: 'delegation' },
  { label: 'Konflikt im Team', category: 'conflict' },
  { label: 'Schwieriges Gespräch steht an', category: 'communication' },
  { label: 'Change/Umbruch im Team', category: 'change' },
  { label: 'Neu in der Führungsrolle', category: 'identity' },
];

export const InlineDiagnostic = ({ block, articleSlug, articleTitle }) => {
  const [custom, setCustom] = useState('');
  const options = Array.isArray(block?.options) && block.options.length
    ? block.options.map((o) => (typeof o === 'string' ? { label: o, category: null } : o))
    : DEFAULT_OPTIONS;

  const go = (text, category) => {
    const intent = captureLeadershipIntent(text, {
      source: 'article-diagnostic',
      article: articleSlug,
      category: category || undefined,
    });
    const href = wladbotUrlForIntent(intent, articleTitle);
    if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener');
  };

  return (
    <aside
      className="my-10 border-2 border-foreground bg-foreground/[0.03] p-6 md:p-7"
      data-testid="inline-diagnostic"
      aria-label="Diagnose · deine Situation"
    >
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-brand-strong mb-3">
        ▸ DEINE SITUATION · 30 SEK
      </div>
      <h3
        className="text-[22px] md:text-[26px] leading-[1.1] tracking-[-0.02em] text-foreground mb-4"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
      >
        {(block?.prompt || 'In welcher Situation steckst du gerade?').replace(/\?$/, '')}<span className="text-brand not-italic">?</span>
      </h3>

      {/* Quick-select · each routes into WladBot with a category-tuned prompt */}
      <div className="flex flex-wrap gap-2 mb-4">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => go(o.label, o.category)}
            className="group inline-flex items-center gap-1.5 px-3 py-2 border-2 border-foreground/20 hover:border-foreground hover:bg-foreground hover:text-background text-[13px] leading-[1.3] text-foreground/85 transition-colors text-left"
            data-testid="diagnostic-option"
          >
            {o.label}
            <ArrowRight size={13} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Free-text · the richest intent signal */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && custom.trim()) go(custom, null); }}
          placeholder="…oder beschreibe sie in eigenen Worten"
          className="flex-1 h-11 px-3 bg-background border-2 border-foreground/15 focus:border-foreground focus:outline-none text-[14px] text-foreground placeholder:text-foreground/40"
          data-testid="diagnostic-input"
        />
        <button
          type="button"
          onClick={() => go(custom, null)}
          className="h-11 px-5 inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-foreground hover:text-background text-[#0A0A0A] font-bold text-[12px] uppercase tracking-[0.12em] transition-colors"
          data-testid="diagnostic-cta"
        >
          {custom.trim() ? 'Lösung holen' : 'WladBot fragen'} <ArrowRight size={14} />
        </button>
      </div>
      <p className="mt-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-foreground/45">
        ▸ Diagnose · Framework · 3 Schritte · kostenlos
      </p>
    </aside>
  );
};
