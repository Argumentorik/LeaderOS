/**
 * Inline Markdown for chat text: **bold** and *italic*, also nested
 * (`**Die Stufe passt *und* zur Aufgabe**`). Shared by SmartText and
 * WladRichText.
 *
 * Claude emphasises single words with *italic*, often inside a bold span;
 * the old `\*\*([^*]+)\*\*` pattern rejected any `*` inside bold, so the
 * whole sentence showed up with raw asterisks.
 *
 * Italic needs a non-space right after the opening and before the closing
 * star, so arithmetic like "5 * 3 * 2" stays plain text.
 */

// Bold: `**…**`; single stars inside are allowed (nested italic).
const BOLD_SPLIT = /(\*\*(?:[^*]|\*(?!\*))+?\*\*)/g;
// Italic: `*x*` / `*mehrere Wörter*`, no leading/trailing space inside.
const ITALIC_SPLIT = /(\*[^*\s](?:[^*\n]*[^*\s])?\*)/g;

const renderItalic = (text, key) =>
  text.split(ITALIC_SPLIT).map((part, i) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${key}-i-${i}`} className="italic">{part.slice(1, -1)}</em>;
    }
    return part ? <span key={`${key}-t-${i}`}>{part}</span> : null;
  });

/**
 * Render a line's inline Markdown as React nodes.
 * @param {string} text
 * @param {string} keyPrefix  unique per call site, for React keys
 * @param {string} strongClassName
 */
export const renderInlineMarkdown = (
  text,
  keyPrefix = 'md',
  strongClassName = 'font-bold text-foreground',
) => {
  if (!text) return text;
  if (!text.includes('*')) return text;
  return text.split(BOLD_SPLIT).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${key}-b`} className={strongClassName}>
          {renderItalic(part.slice(2, -2), key)}
        </strong>
      );
    }
    return part ? <span key={key}>{renderItalic(part, key)}</span> : null;
  });
};

export default renderInlineMarkdown;
