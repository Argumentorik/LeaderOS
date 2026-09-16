/**
 * textClean — Schutznetz für die Anzeige.
 *
 * Kundenmeldung (Iter 184): Rohzeichen wie \n, \u201e, \u201c standen mitten
 * im Antworttext. Entpackt wird primär im Backend (services_text_clean.py).
 * Falls trotzdem etwas durchkommt (alte gespeicherte Nachrichten, Streaming-
 * Deltas), wird es hier beim Darstellen bereinigt statt dem Kunden gezeigt.
 */

const ESCAPE_RE = /\\(u[0-9a-fA-F]{4}|n|r|t|"|\\)/g;

export function unescapeText(value) {
  if (typeof value !== 'string' || value.indexOf('\\') === -1) return value;
  return value.replace(ESCAPE_RE, (match, group) => {
    if (group[0] === 'u') {
      const code = parseInt(group.slice(1), 16);
      return Number.isNaN(code) ? match : String.fromCharCode(code);
    }
    if (group === 'n') return '\n';
    if (group === 'r') return '\r';
    if (group === 't') return '\t';
    if (group === '"') return '"';
    if (group === '\\') return '\\';
    return match;
  });
}

export function deepUnescape(obj) {
  if (typeof obj === 'string') return unescapeText(obj);
  if (Array.isArray(obj)) return obj.map(deepUnescape);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = deepUnescape(obj[k]);
    return out;
  }
  return obj;
}

export default unescapeText;
