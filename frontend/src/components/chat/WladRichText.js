/**
 * WladRichText · Lite-Markdown renderer for WladBot's `insight` / `strategy`
 * / `reflection` text fields. Matches the OUTPUT-STIL contract in
 * `backend/services.py` WLAD_HARD_RULES (Rule 7):
 *
 *   **bold**          →  <strong> (lime in dark, ink in light)
 *   ▸ at line start   →  premium lime-marker bullet
 *   → at line start   →  consequence arrow bullet
 *   » at line start   →  example-script callout (indented, brand-tinted)
 *   blank line        →  paragraph break
 *
 * Intentionally NOT a full Markdown engine · no headings, tables, links, or
 * code fences. The narrow grammar is what makes the output feel curated and
 * consistent across surfaces. If the LLM ignores the contract and returns
 * plain prose, we still render it cleanly as paragraphs.
 *
 * Zero external deps · keeps yarn.lock frozen.
 */

const RE_BOLD = /\*\*([^*]+)\*\*/g;

// Render a single line's inline content (currently: **bold** only).
const renderInline = (text, baseKey) => {
  const out = [];
  let last = 0;
  let idx = 0;
  text.replace(RE_BOLD, (match, inner, offset) => {
    if (offset > last) out.push(text.slice(last, offset));
    out.push(
      <strong
        key={`${baseKey}-b-${idx++}`}
        className="font-bold text-foreground"
      >
        {inner}
      </strong>
    );
    last = offset + match.length;
    return match;
  });
  if (last < text.length) out.push(text.slice(last));
  return out.length === 1 && typeof out[0] === 'string' ? out[0] : out;
};

const Bullet = ({ marker, children }) => {
  // ▸ → premium lime bullet ; → → lime arrow ; everything else → soft dot
  const symbol =
    marker === '▸' ? '▸' :
    marker === '→' ? '→' :
    '•';
  return (
    <li className="flex gap-2.5 leading-snug">
      <span className="text-brand font-bold shrink-0 select-none" aria-hidden>
        {symbol}
      </span>
      <span>{children}</span>
    </li>
  );
};

const ExampleCallout = ({ children }) => (
  <blockquote
    className="my-1.5 pl-3 border-l-2 border-brand/60 bg-brand/[0.04] text-foreground/90 italic rounded-r-md py-1.5 pr-2"
    data-testid="wlad-example-callout"
  >
    <span className="text-[10px] uppercase tracking-wider font-bold text-brand/80 not-italic block mb-0.5">
      Beispiel-Skript
    </span>
    {children}
  </blockquote>
);

/**
 * Parse a block of text into rendered React. Lines starting with ▸/→ get
 * grouped into a single <ul>; consecutive » lines collapse into a single
 * ExampleCallout; everything else becomes <p>.
 */
const parseBlock = (text, keyPrefix) => {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split('\n');
  const nodes = [];

  let bulletGroup = null;          // { marker, items: [{ text }] }
  let exampleGroup = null;         // { lines: [] }
  let paragraphBuf = [];           // string[]

  const flushParagraph = (k) => {
    if (paragraphBuf.length === 0) return;
    const joined = paragraphBuf.join(' ').trim();
    if (joined) {
      nodes.push(
        <p key={`${keyPrefix}-p-${k}`} className="text-sm leading-relaxed">
          {renderInline(joined, `${keyPrefix}-p-${k}`)}
        </p>
      );
    }
    paragraphBuf = [];
  };

  const flushBullets = (k) => {
    if (!bulletGroup || bulletGroup.items.length === 0) {
      bulletGroup = null;
      return;
    }
    nodes.push(
      <ul key={`${keyPrefix}-ul-${k}`} className="text-sm space-y-1.5 my-1">
        {bulletGroup.items.map((item, i) => (
          <Bullet
            key={`${keyPrefix}-ul-${k}-${i}`}
            marker={bulletGroup.marker === '→' ? '→' : '▸'}
          >
            {renderInline(item.text, `${keyPrefix}-ul-${k}-${i}`)}
          </Bullet>
        ))}
      </ul>
    );
    bulletGroup = null;
  };

  const flushExample = (k) => {
    if (!exampleGroup || exampleGroup.lines.length === 0) {
      exampleGroup = null;
      return;
    }
    const joined = exampleGroup.lines.join(' ').trim();
    nodes.push(
      <ExampleCallout key={`${keyPrefix}-ex-${k}`}>
        <span className="text-sm">{renderInline(joined, `${keyPrefix}-ex-${k}`)}</span>
      </ExampleCallout>
    );
    exampleGroup = null;
  };

  const flushAll = (k) => {
    flushParagraph(k);
    flushBullets(k);
    flushExample(k);
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    // Blank → flush everything (paragraph break)
    if (line === '') {
      flushAll(idx);
      return;
    }

    // Wlad-markdown bullets
    if (line.startsWith('▸ ') || line.startsWith('▸ ') || line.startsWith('- ') || line.startsWith('• ')) {
      flushParagraph(idx);
      flushExample(idx);
      const content = line.replace(/^(▸|-|•)\s+/, '');
      if (!bulletGroup || bulletGroup.marker !== '▸') {
        flushBullets(idx);
        bulletGroup = { marker: '▸', items: [] };
      }
      bulletGroup.items.push({ text: content });
      return;
    }

    if (line.startsWith('→ ')) {
      flushParagraph(idx);
      flushExample(idx);
      const content = line.slice(2);
      if (!bulletGroup || bulletGroup.marker !== '→') {
        flushBullets(idx);
        bulletGroup = { marker: '→', items: [] };
      }
      bulletGroup.items.push({ text: content });
      return;
    }

    // Example-script callout
    if (line.startsWith('» ') || line.startsWith('» ')) {
      flushParagraph(idx);
      flushBullets(idx);
      if (!exampleGroup) exampleGroup = { lines: [] };
      exampleGroup.lines.push(line.replace(/^»\s+/, ''));
      return;
    }

    // Otherwise: paragraph content
    flushBullets(idx);
    flushExample(idx);
    paragraphBuf.push(line);
  });

  flushAll('end');
  return nodes;
};

export const WladRichText = ({ text, className = '', testId }) => {
  const nodes = parseBlock(text, testId || 'wrt');
  if (!nodes || nodes.length === 0) return null;
  return (
    <div
      className={`space-y-1.5 ${className}`}
      data-testid={testId || 'wlad-rich-text'}
    >
      {nodes}
    </div>
  );
};

export default WladRichText;
