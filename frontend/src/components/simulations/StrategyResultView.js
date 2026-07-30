/**
 * StrategyResultView — the premium "godmode" reveal of the SEXIER strategy
 * that Wlad has generated. Replaces the plain markdown dump with a
 * structured, section-by-section experience.
 *
 * Design principles:
 *   - Hero success moment on reveal (celebration + summary badge)
 *   - Sticky Table-of-Contents on desktop for fast section-jumps
 *   - Each of the 6 SEXIER sections gets its own distinct color accent,
 *     numbered badge, and a "Copy this section" affordance
 *   - Inline "Print / Copy all / Share" primary actions
 *   - Framer-motion staggered entrance for that Apple-launch feel
 *
 * Input: `strategy.strategy_markdown` — a markdown string in the exact
 * 6-section layout defined by ARGUMENTATION_PREP_PROMPT (backend).
 */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Printer, Share2, Target, Swords, Shield, Wand2, AlertTriangle, Rocket, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

// Design metadata per section. Keys match a `## N.` prefix pattern in the
// markdown; the parser is forgiving so we fall back to "Weitere Analyse"
// with the sparkles icon if the LLM ever drifts from the template.
const SECTION_META = [
  { key: '1', icon: Target,         title: 'Situationsanalyse',        subtitle: 'Kontext · Dynamik · Hebel',      accent: '#3B82F6', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.28)' },
  { key: '2', icon: Swords,         title: 'Deine 3 stärksten Argumente', subtitle: 'SEXIER-Blöcke, priorisiert',    accent: '#BFFF00', bg: 'rgba(191,255,0,0.12)',  border: 'rgba(191,255,0,0.35)' },
  { key: '3', icon: Shield,         title: 'Erwartete Einwände',       subtitle: 'Gegenseite entwaffnen',           accent: '#FF9500', bg: 'rgba(255,149,0,0.10)',  border: 'rgba(255,149,0,0.28)' },
  { key: '4', icon: Wand2,          title: 'Framing & Wording',        subtitle: 'Was du sagst · wie du es sagst',   accent: '#A78BFA', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.32)' },
  { key: '5', icon: AlertTriangle,  title: 'Schwachstellen',           subtitle: 'Ehrliche Selbstprüfung',           accent: '#F43F5E', bg: 'rgba(244,63,94,0.10)',   border: 'rgba(244,63,94,0.28)' },
  { key: '6', icon: Rocket,         title: 'Ready-to-Use-Strategie',   subtitle: 'Der Endzustand · sofort einsetzbar', accent: '#00CC77', bg: 'rgba(0,204,119,0.10)',   border: 'rgba(0,204,119,0.28)' },
];

/** Parse the strategy markdown into an ordered list of {meta, body} sections. */
function parseStrategy(md) {
  if (!md) return [];
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const sections = [];
  let current = null;
  for (const raw of lines) {
    const heading = raw.match(/^\s*##\s+(?:(\d+)\.\s*)?(.+?)\s*$/);
    if (heading) {
      if (current) sections.push(current);
      const num = heading[1];
      const meta = SECTION_META.find((m) => m.key === num) || {
        key: heading[2],
        icon: Sparkles,
        title: heading[2],
        subtitle: '',
        accent: '#BFFF00',
        bg: 'rgba(191,255,0,0.10)',
        border: 'rgba(191,255,0,0.28)',
      };
      current = { meta, body: [] };
    } else if (current) {
      current.body.push(raw);
    } else if (raw.trim()) {
      // preamble before first heading — synthesize a summary card
      current = { meta: { key: '0', icon: Sparkles, title: 'Zusammenfassung', subtitle: 'Wlads Framing', accent: '#BFFF00', bg: 'rgba(191,255,0,0.10)', border: 'rgba(191,255,0,0.28)' }, body: [raw] };
    }
  }
  if (current) sections.push(current);
  return sections.map((s) => ({ ...s, markdown: s.body.join('\n').trim() }));
}

/** Minimal inline-markdown renderer for the section body. Handles bold,
 * bullets, and nested lettered SEXIER-sub-bullets (S: ..., E: ..., etc). */
function renderSectionBody(md) {
  if (!md) return '';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = esc(md);
  // H3 sub-headings
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // SEXIER letter bullets: "- S: ..." → prefix badge
  html = html.replace(
    /^\s*-\s+(S|E|X|I|E²|R):\s+(.+)$/gm,
    (_, letter, rest) => `<li class="sexier-line"><span class="sexier-letter">${letter}</span><span>${rest}</span></li>`,
  );
  // Regular bullets
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
  // Group consecutive <li> into <ul>
  html = html.replace(/(?:^|\n)((?:<li[\s\S]*?<\/li>\n?)+)/g, (m) => `<ul>${m}</ul>`);
  // Argument-block titles like "**Argument 1: XYZ**"
  html = html.replace(/^(<strong>Argument\s+\d+:[^<]+<\/strong>)/gm, '<div class="argument-title">$1</div>');
  // Paragraph breaks
  html = html.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, ' ');
  html = `<p>${html}</p>`;
  return html;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export function StrategyResultView({ strategy, onCopy, copied, onShare, onPrint }) {
  const [copiedSectionKey, setCopiedSectionKey] = useState(null);

  const sections = useMemo(() => parseStrategy(strategy?.strategy_markdown || ''), [strategy?.strategy_markdown]);

  const copySection = async (sec) => {
    const text = `## ${sec.meta.title}\n\n${sec.markdown}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSectionKey(sec.meta.key);
      toast.success(`${sec.meta.title} kopiert`, { duration: 1600 });
      setTimeout(() => setCopiedSectionKey(null), 1400);
    } catch { toast.error('Kopieren fehlgeschlagen.'); }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
      data-testid="argumentation-strategy-view"
    >
      {/* Hero success banner */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl border border-[#BFFF00]/30 bg-gradient-to-br from-[#BFFF00]/12 via-[#BFFF00]/5 to-transparent p-5"
      >
        <motion.div
          aria-hidden
          className="absolute -right-16 -top-16 w-52 h-52 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(191,255,0,0.35) 0%, transparent 65%)' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#BFFF00] flex items-center justify-center shrink-0 shadow-lg shadow-[#BFFF00]/30">
              <Sparkles size={17} className="text-[#0A0A0A]" />
            </div>
            <div className="min-w-0">
              <p className="text-[9.5px] font-black uppercase tracking-[0.22em] text-[#6B8A00] dark:text-[#BFFF00]">
                Deine SEXIER-Strategie · Fertig
              </p>
              <h3 className="text-[16px] sm:text-[18px] font-black tracking-tight mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {sections.length} Sektionen · Sofort einsetzbar
              </h3>
              <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed">
                Wlad hat deine Vorbereitung strukturiert und geschärft. Springe direkt in eine Sektion oder kopiere alles für dein Gespräch.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[11px] font-black bg-white/70 dark:bg-white/[0.05] hover:bg-white dark:hover:bg-white/[0.1] text-foreground/80 hover:text-foreground border border-black/[0.06] dark:border-white/10 transition-colors"
                data-testid="argumentation-strategy-print"
                title="Als PDF drucken"
              >
                <Printer size={12} strokeWidth={2.4} /> PDF
              </button>
            )}
            {onShare && (
              <button
                type="button"
                onClick={onShare}
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[11px] font-black bg-white/70 dark:bg-white/[0.05] hover:bg-white dark:hover:bg-white/[0.1] text-foreground/80 hover:text-foreground border border-black/[0.06] dark:border-white/10 transition-colors"
                data-testid="argumentation-strategy-share"
                title="Teilen"
              >
                <Share2 size={12} strokeWidth={2.4} /> Teilen
              </button>
            )}
            <Button
              size="sm"
              onClick={onCopy}
              className="h-8 text-[11px] font-black bg-[#0A0A0A] hover:bg-[#1A1A2E] text-white px-3 shadow-md transition-all active:scale-[0.97]"
              data-testid="argumentation-strategy-copy"
            >
              {copied
                ? <><Check size={12} className="mr-1 text-[#BFFF00]" /> Kopiert</>
                : <><Copy size={12} className="mr-1" /> Alles kopieren</>}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Table of contents (desktop only) */}
      <motion.nav
        variants={item}
        className="hidden md:flex flex-wrap gap-1.5"
        data-testid="argumentation-strategy-toc"
      >
        {sections.map((sec) => {
          const Icon = sec.meta.icon;
          return (
            <a
              key={sec.meta.key}
              href={`#argprep-sec-${sec.meta.key}`}
              className="group inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[10.5px] font-black tracking-tight border transition-all hover:scale-105"
              style={{ background: sec.meta.bg, borderColor: sec.meta.border, color: sec.meta.accent }}
            >
              <Icon size={10} strokeWidth={2.6} />
              <span className="text-foreground/85">{sec.meta.title}</span>
            </a>
          );
        })}
      </motion.nav>

      {/* Section cards */}
      {sections.map((sec, i) => {
        const Icon = sec.meta.icon;
        const isCopied = copiedSectionKey === sec.meta.key;
        return (
          <motion.section
            key={`${sec.meta.key}-${i}`}
            id={`argprep-sec-${sec.meta.key}`}
            variants={item}
            className="group relative rounded-2xl border p-5 sm:p-6 overflow-hidden scroll-mt-4"
            style={{ background: sec.meta.bg, borderColor: sec.meta.border }}
            data-testid={`argumentation-strategy-section-${sec.meta.key}`}
          >
            {/* Section header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: sec.meta.accent, color: sec.meta.accent === '#BFFF00' ? '#0A0A0A' : '#fff' }}
                >
                  <Icon size={16} strokeWidth={2.4} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[9.5px] font-black uppercase tracking-[0.18em]" style={{ color: sec.meta.accent }}>
                    Sektion {sec.meta.key}
                  </p>
                  <h4 className="text-[15px] sm:text-[16px] font-black tracking-tight leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {sec.meta.title}
                  </h4>
                  {sec.meta.subtitle && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{sec.meta.subtitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copySection(sec)}
                className="shrink-0 inline-flex items-center gap-1 h-7 px-2 rounded-md text-[10px] font-black tracking-wide uppercase bg-white/60 dark:bg-white/[0.05] hover:bg-white dark:hover:bg-white/[0.12] text-foreground/70 hover:text-foreground border border-black/[0.06] dark:border-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                data-testid={`argprep-section-copy-${sec.meta.key}`}
                title="Diese Sektion kopieren"
              >
                {isCopied ? <><Check size={10} /> ok</> : <><Copy size={10} /> Copy</>}
              </button>
            </div>

            {/* Section body — rendered markdown, prose-tuned */}
            <div
              className="strategy-prose text-[13.5px] leading-relaxed text-foreground/90"
              dangerouslySetInnerHTML={{ __html: renderSectionBody(sec.markdown) }}
            />
          </motion.section>
        );
      })}

      {/* Sticky footer nudge (mobile only) */}
      <motion.div variants={item} className="md:hidden pt-2">
        <a
          href="#argprep-sec-6"
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-[12.5px] font-black bg-[#0A0A0A] text-white hover:bg-[#1A1A2E] transition-colors"
        >
          <ChevronDown size={14} /> Zur Ready-to-Use-Strategie
        </a>
      </motion.div>

      {/* Local styles — scoped to this view via strategy-prose class */}
      <style>{`
        .strategy-prose p { margin: 0.55rem 0; }
        .strategy-prose p:first-child { margin-top: 0; }
        .strategy-prose ul { margin: 0.4rem 0; padding-left: 0.25rem; list-style: none; display: flex; flex-direction: column; gap: 0.35rem; }
        .strategy-prose li {
          position: relative;
          padding-left: 1.1rem;
        }
        .strategy-prose li:not(.sexier-line)::before {
          content: '';
          position: absolute;
          left: 0.25rem;
          top: 0.55rem;
          width: 4px; height: 4px;
          border-radius: 999px;
          background: currentColor;
          opacity: 0.35;
        }
        .strategy-prose li.sexier-line {
          padding-left: 2.35rem;
        }
        .strategy-prose .sexier-letter {
          position: absolute;
          left: 0;
          top: 0.05rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.65rem;
          height: 1.35rem;
          border-radius: 6px;
          background: rgba(191,255,0,0.16);
          color: #6B8A00;
          font-weight: 900;
          font-size: 0.68rem;
          letter-spacing: 0.02em;
          font-family: 'Outfit', sans-serif;
        }
        .dark .strategy-prose .sexier-letter { color: #BFFF00; background: rgba(191,255,0,0.16); }
        .strategy-prose h3 {
          font-size: 0.86rem;
          font-weight: 900;
          letter-spacing: -0.01em;
          margin: 0.85rem 0 0.35rem;
          color: inherit;
        }
        .strategy-prose strong { color: inherit; font-weight: 800; }
        .strategy-prose .argument-title {
          margin: 0.75rem 0 0.35rem;
          font-size: 0.82rem;
          font-weight: 900;
          letter-spacing: -0.01em;
          padding: 0.3rem 0.55rem;
          border-radius: 8px;
          background: rgba(0,0,0,0.04);
          display: inline-block;
        }
        .dark .strategy-prose .argument-title { background: rgba(255,255,255,0.06); }
      `}</style>
    </motion.div>
  );
}

export default StrategyResultView;
