import { API_BASE, notifyPaymentRequired } from './api';

// Liest Server-Sent-Events von POST /chat/stream und ruft pro Event den Handler auf.
export async function streamChat(body, { onStart, onDelta, onDone, signal } = {}) {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
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
}
