import { API_BASE, notifyPaymentRequired } from './api';

// Client-seitiger Idle-Timeout: bricht den Stream ab, wenn länger als
// IDLE_TIMEOUT_MS kein Chunk mehr ankommt. Liegt bewusst über dem
// server-seitigen 30s-Chunk-Timeout, damit der Server zuerst sauber
// abbricht und seine eigene Fehlermeldung liefern kann.
const IDLE_TIMEOUT_MS = 45000;

// 1.2: Ein Netz-/Gateway-Fehler (502-504) VOR dem ersten Delta darf einmal
// automatisch wiederholt werden. Ist bereits Text angekommen, wird NICHT neu
// versucht (sonst würde sich die Antwort doppeln).
export async function streamChat(body, { onStart, onDelta, onDone, signal } = {}) {
  let sawDelta = false;
  const wrappedDelta = (t) => { sawDelta = true; onDelta?.(t); };
  const attempt = () => attemptStream(body, { onStart, onDelta: wrappedDelta, onDone, signal });

  try {
    await attempt();
  } catch (err) {
    const status = err.status;
    const retriable =
      !status || status === 502 || status === 503 || status === 504 ||
      err.name === 'AbortError' || err.name === 'TypeError';
    // Nur wiederholen, wenn noch KEIN Text gestreamt wurde und der Aufrufer
    // den Stream nicht selbst abgebrochen hat.
    if (retriable && !sawDelta && !signal?.aborted) {
      await attempt();
      return;
    }
    throw err;
  }
}

async function attemptStream(body, { onStart, onDelta, onDone, signal } = {}) {
  const ac = new AbortController();
  let idleTimer;
  const resetIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => ac.abort(), IDLE_TIMEOUT_MS);
  };
  const onExternalAbort = () => ac.abort();
  if (signal) {
    if (signal.aborted) ac.abort();
    else signal.addEventListener('abort', onExternalAbort);
  }

  resetIdle();
  try {
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
    if (!res.ok || !res.body) {
      const err = new Error(`chat stream failed (${res.status})`);
      err.status = res.status;
      try { err.data = await res.json(); } catch { err.data = null; }
      // Iter 185: Der Streaming-Weg läuft nicht über axios — die Meldung zu
      // leerem Guthaben bzw. gesperrtem Bereich muss trotzdem erscheinen.
      if (res.status === 402) notifyPaymentRequired(err.data?.detail);
      throw err;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finished = false;
    const handle = (evt) => {
      if (evt.type === 'start') onStart?.(evt);
      else if (evt.type === 'delta') onDelta?.(evt.text);
      else if (evt.type === 'done') { finished = true; onDone?.(evt); }
      else if (evt.type === 'error') {
        const err = new Error(evt.detail || 'chat stream error');
        err.status = evt.status || 500;
        err.data = { detail: evt.detail };
        throw err;
      }
    };
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      resetIdle();
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const line = frame.split('\n').find((l) => l.startsWith('data:'));
        if (line) handle(JSON.parse(line.slice(5).trim()));
      }
    }
    if (!finished) {
      const err = new Error('chat stream ended early');
      err.status = 504;
      throw err;
    }
  } finally {
    clearTimeout(idleTimer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }
}
