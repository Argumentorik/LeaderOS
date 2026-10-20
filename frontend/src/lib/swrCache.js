import api from './api';

// Stale-while-revalidate für GET-Listen: gecachte Antwort sofort, frische im Hintergrund.
const PREFIX = 'leaderos:swr:';
const DEFAULT_TTL = 10 * 60 * 1000;

const read = (key) => {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { t, d } = JSON.parse(raw);
    if (Date.now() - t > DEFAULT_TTL) return null;
    return d;
  } catch { return null; }
};

const write = (key, data) => {
  try { sessionStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), d: data })); } catch { /* voll oder gesperrt */ }
};

export const swrClear = (key) => { try { sessionStorage.removeItem(PREFIX + key); } catch { /* noop */ } };

// Ruft `apply` sofort mit dem Cache (falls da) und noch einmal mit der frischen Antwort auf.
export const swrGet = async (path, apply, { onError } = {}) => {
  const cached = read(path);
  if (cached != null) apply(cached, { cached: true });
  try {
    const res = await api.get(path);
    write(path, res.data);
    apply(res.data, { cached: false });
    return res.data;
  } catch (err) {
    if (cached == null) onError?.(err);
    return cached;
  }
};
