/**
 * telemetry — Frontend Godmode Observability Client.
 *
 * Iter 121.7. Ships three capabilities:
 *   · reportError(err, meta)  — persist any exception + return diagnostic_id
 *   · reportFeedback(payload) — user-initiated feedback + screenshot upload
 *   · installGlobalHandlers() — wire window.onerror + unhandledrejection
 *
 * Design choices:
 *   · NEVER throws — silent failure on network is fine, we already dumped
 *     the error to console.
 *   · Deduplicates identical errors within a 5s window to avoid Mongo spam
 *     during a render-loop crash.
 *   · Uses fetch (not our axios instance) so a broken interceptor cannot
 *     recursively re-report itself into a loop.
 */
import { getConsoleTail } from './consoleBuffer';

const _dedupe = new Map();  // key -> ts
const DEDUPE_MS = 5000;

function _apiBase() {
  const raw = process.env.REACT_APP_BACKEND_URL || '';
  return raw.replace(/\/$/, '') + '/api';
}

function _shouldSuppress(key) {
  const now = Date.now();
  const last = _dedupe.get(key);
  if (last && now - last < DEDUPE_MS) return true;
  _dedupe.set(key, now);
  // best-effort GC — only keep hot keys
  if (_dedupe.size > 200) {
    for (const [k, ts] of _dedupe) if (now - ts > DEDUPE_MS * 4) _dedupe.delete(k);
  }
  return false;
}

/**
 * Persist a frontend error. Returns a diagnostic_id (or null) that the UI
 * can quote to the user. Never rejects.
 */
export async function reportError(err, meta = {}) {
  const message = String(err?.message || err || 'unknown').slice(0, 2000);
  const stack = String(err?.stack || '').slice(0, 15000);
  const key = `${meta.source || 'unknown'}:${message.slice(0, 120)}`;
  if (_shouldSuppress(key)) return null;

  const payload = {
    message,
    stack,
    source: meta.source || 'window',
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    component: meta.component,
    context: meta.context,
    severity: meta.severity || 'error',
  };

  try {
    const res = await fetch(`${_apiBase()}/telemetry/error`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.diagnostic_id || null;
  } catch {
    // Network dead — nothing we can do. Console already has the trace.
    return null;
  }
}

/**
 * Send a user feedback report. Screenshot is a data-URL (jpeg 0.5 quality
 * to stay under Resend's payload limit).
 */
export async function reportFeedback({ message, category = 'general', screenshotDataUrl, emailOverride } = {}) {
  const payload = {
    message: String(message || '').slice(0, 4000),
    category: String(category || 'general').slice(0, 40),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    screenshot_data_url: screenshotDataUrl,
    console_tail: getConsoleTail(),
    email_override: emailOverride || undefined,
  };
  try {
    const res = await fetch(`${_apiBase()}/telemetry/feedback`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 429) return { ok: false, throttled: true };
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, feedback_id: data.feedback_id };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Wire browser-level error capture. Idempotent.
 */
export function installGlobalHandlers() {
  if (typeof window === 'undefined' || window.__leaderos_telemetry_installed) return;
  window.__leaderos_telemetry_installed = true;

  window.addEventListener('error', (event) => {
    // Ignore ResizeObserver noise + benign network 404 asset errors.
    const msg = String(event?.message || '');
    if (msg.includes('ResizeObserver') || msg.startsWith('Script error')) return;
    reportError(event.error || msg, {
      source: 'window.onerror',
      context: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason || 'unhandledrejection', { source: 'unhandledrejection' });
  });
}
