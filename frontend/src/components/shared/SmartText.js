/**
 * SmartText — premium markdown-lite renderer.
 *
 * Why this exists:
 *   AI outputs (wlad_assessment, framework_feedback, rewrite_suggestion, etc.)
 *   frequently embed inline numbered lists ("1. … 2. … 3. …") or bullet lists
 *   in plain text. Rendering them with a raw <p>{text}</p> produces a chunky
 *   wall-of-text that breaks the premium "Apple/Tesla" aesthetic.
 *
 *   This component parses any plain string and renders detected lists as
 *   premium icon-cards (Tesla/Linear style), while remaining text becomes
 *   clean paragraphs with **bold** + `code` micro-support.
 *
 * Detection rules:
 *   - Lines like "N. xxx" (N=1-99) → ordered list item.
 *   - Lines starting with "-", "•", "*" → unordered list item.
 *   - Inline "1. x 2. y 3. z" on a single line → also split into list items.
 *   - Consecutive list items collapse into a single card-stack.
 *
 * Props:
 *   - text       (string)  plain text to render
 *   - variant    'card' | 'inline'  visual density (default 'card')
 *   - accent     hex color for the number/bullet badge (default lime)
 *   - icon       Lucide icon component for ordered items (default Sparkles)
 *   - className  passthrough
 */

const ORDERED_LINE_RE = /^\s*(\d{1,2})[.)]\s+(.+)$/;
const BULLET_LINE_RE = /^\s*[-•*]\s+(.+)$/;

// Inline "1. … 2. … 3. …" — split a single line that hides a list.
// We look for at least 2 occurrences before treating it as a list.
function splitInlineNumbered(line) {
  // Match each "N. text-until-next-N.-or-end". Non-greedy so it doesn't gobble.
  const re = /(\d{1,2})[.)]\s+([^]*?)(?=\s*\d{1,2}[.)]\s|$)/g;
  const items = [];
  let match;
  while ((match = re.exec(line)) !== null) {
    const content = match[2].trim();
    if (content) items.push({ num: parseInt(match[1], 10), text: content });
  }
  return items.length >= 2 ? items : null;
}

// Render **bold** spans inside a plain string.
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={`b-${i}`} className="font-bold text-foreground">{p.slice(2, -2)}</strong>;
    }
    return <span key={`t-${i}`}>{p}</span>;
  });
}

function parseBlocks(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let buffer = null; // { type: 'list-ordered' | 'list-unordered' | 'paragraph', items: [] }

  const flushBuffer = () => {
    if (buffer && buffer.items.length) blocks.push(buffer);
    buffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushBuffer();
      continue;
    }

    // Multi-line ordered list?
    const orderedMatch = ORDERED_LINE_RE.exec(line);
    if (orderedMatch) {
      if (!buffer || buffer.type !== 'list-ordered') {
        flushBuffer();
        buffer = { type: 'list-ordered', items: [] };
      }
      buffer.items.push({ num: parseInt(orderedMatch[1], 10), text: orderedMatch[2] });
      continue;
    }

    // Multi-line bullet list?
    const bulletMatch = BULLET_LINE_RE.exec(line);
    if (bulletMatch) {
      if (!buffer || buffer.type !== 'list-unordered') {
        flushBuffer();
        buffer = { type: 'list-unordered', items: [] };
      }
      buffer.items.push({ text: bulletMatch[1] });
      continue;
    }

    // Inline numbered list hidden in a single sentence?
    const inline = splitInlineNumbered(line);
    if (inline) {
      flushBuffer();
      blocks.push({ type: 'list-ordered', items: inline });
      continue;
    }

    // Regular paragraph line — append to running paragraph block.
    if (!buffer || buffer.type !== 'paragraph') {
      flushBuffer();
      buffer = { type: 'paragraph', items: [] };
    }
    buffer.items.push({ text: line });
  }
  flushBuffer();
  return blocks;
}

const OrderedCard = ({ item, accent }) => (
  <div className="group relative flex items-start gap-3 p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.02] hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-tint)] transition-all"
       style={{ '--accent': accent, '--accent-tint': `${accent}14` }}>
    <span
      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-[12px] shadow-sm"
      style={{ background: accent, color: '#0A0A0A' }}
    >
      {item.num}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] leading-relaxed text-foreground">{renderInline(item.text)}</p>
    </div>
  </div>
);

const BulletCard = ({ item, accent }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.02]">
    <span
      className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
      style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
    />
    <p className="text-[13px] leading-relaxed flex-1 text-foreground">{renderInline(item.text)}</p>
  </div>
);

export const SmartText = ({
  text,
  variant = 'card',
  accent = '#BFFF00',
  className = '',
}) => {
  if (!text) return null;
  const blocks = parseBlocks(text);
  if (blocks.length === 0) return null;

  // Inline (compact) mode: keep typography small + tight — used in chat bubbles.
  const isInline = variant === 'inline';
  const listGap = isInline ? 'space-y-1.5' : 'space-y-2';

  return (
    <div className={`space-y-3 ${className}`} data-testid="smart-text">
      {blocks.map((b, bIdx) => {
        if (b.type === 'paragraph') {
          return (
            <p key={`bl-${bIdx}`} className="text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {b.items.map((it, i) => (
                <span key={`l-${i}`}>
                  {renderInline(it.text)}
                  {i < b.items.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
          );
        }
        if (b.type === 'list-ordered') {
          return (
            <div key={`bl-${bIdx}`} className={listGap}>
              {b.items.map((it, i) => (
                <OrderedCard key={`oi-${i}`} item={{ num: it.num ?? i + 1, text: it.text }} accent={accent} />
              ))}
            </div>
          );
        }
        if (b.type === 'list-unordered') {
          return (
            <div key={`bl-${bIdx}`} className={listGap}>
              {b.items.map((it, i) => <BulletCard key={`ui-${i}`} item={it} accent={accent} />)}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default SmartText;
