/**
 * consoleBuffer — Rolling in-memory capture of the last N console.* calls.
 *
 * Iter 121.7 (Godmode Observability). We attach at the very top of the boot
 * sequence (index.js → import './lib/consoleBuffer') so ALL user actions,
 * network warnings and warnings are captured; the feedback widget then
 * attaches this buffer to every user report so we can debug production
 * issues without asking the user to open DevTools.
 *
 * Zero-dep, memory-capped, never modifies the console interface visible to
 * developers (we still forward every call to the original console function).
 */
const MAX_ENTRIES = 80;
const MAX_LINE_LEN = 800;
const _buf = [];

function _clip(v) {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'string') return v.length > MAX_LINE_LEN ? v.slice(0, MAX_LINE_LEN) + '…' : v;
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  try {
    const s = JSON.stringify(v);
    return s.length > MAX_LINE_LEN ? s.slice(0, MAX_LINE_LEN) + '…' : s;
  } catch {
    return String(v).slice(0, MAX_LINE_LEN);
  }
}

function _push(level, args) {
  const line = `${new Date().toISOString().slice(11, 23)} [${level}] ${Array.from(args).map(_clip).join(' ')}`;
  _buf.push(line);
  if (_buf.length > MAX_ENTRIES) _buf.shift();
}

if (typeof window !== 'undefined' && !window.__leaderos_console_wrapped) {
  window.__leaderos_console_wrapped = true;
  ['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
    const orig = console[level];
    if (typeof orig !== 'function') return;
    console[level] = (...args) => {
      try { _push(level, args); } catch { /* never break console */ }
      return orig.apply(console, args);
    };
  });
}

export function getConsoleTail() {
  return [..._buf];
}

export function clearConsoleTail() {
  _buf.length = 0;
}
