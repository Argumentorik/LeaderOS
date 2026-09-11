import api from './api';

/**
 * Ladezeit-Telemetrie (Iter 168): misst je Seite die Zeit vom Routenstart bis "Inhalt steht"
 * (= alle API-Requests dieser Seite beantwortet, 350 ms Ruhe) und meldet sie gebündelt.
 * Erster Aufruf (Reload) zählt ab Navigationsstart inkl. TTFB. Läuft still im Hintergrund.
 */
const QUIET_MS = 350;
const NO_REQUEST_FALLBACK_MS = 1500;
const FLUSH_MS = 10000;

let current = null;       // { path, start, nav, inflight, requests, timer, done }
let queue = [];
let flushTimer = null;
let installed = false;

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const finish = () => {
  if (!current || current.done) return;
  current.done = true;
  clearTimeout(current.timer);
  const ms = Math.max(0, Math.round(now() - current.start));
  const sample = { path: current.path, ms, nav: current.nav, requests: current.requests };
  if (current.nav === 'initial') {
    const navEntry = performance.getEntriesByType?.('navigation')?.[0];
    if (navEntry) sample.ttfb = Math.round(navEntry.responseStart);
  }
  queue.push(sample);
  if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_MS);
};

const scheduleQuiet = (ms) => {
  if (!current || current.done) return;
  clearTimeout(current.timer);
  current.timer = setTimeout(() => { if (current && current.inflight === 0) finish(); }, ms);
};

export const flush = () => {
  clearTimeout(flushTimer);
  flushTimer = null;
  if (!queue.length) return;
  const samples = queue.splice(0, 50);
  api.post('/telemetry/page-load', { samples }).catch(() => {});
};

const isTelemetryUrl = (url = '') => /telemetry\//.test(url);

const install = () => {
  if (installed) return;
  installed = true;
  api.interceptors.request.use((config) => {
    if (current && !current.done && !isTelemetryUrl(config.url)) {
      current.inflight += 1;
      current.requests += 1;
      config.__pl = current;
    }
    return config;
  });
  const settle = (config) => {
    const c = config?.__pl;
    if (c && c === current && !c.done) {
      c.inflight = Math.max(0, c.inflight - 1);
      if (c.inflight === 0) scheduleQuiet(QUIET_MS);
    }
  };
  api.interceptors.response.use(
    (res) => { settle(res.config); return res; },
    (err) => { settle(err?.config); return Promise.reject(err); },
  );
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
};

export const startPageLoad = (path) => {
  install();
  if (current && !current.done && current.path === path && now() - current.start < 50) return;  // StrictMode-Doppelaufruf
  if (current && !current.done) finish();
  const initial = !current;
  let start = now();
  if (initial) {
    const navEntry = performance.getEntriesByType?.('navigation')?.[0];
    start = navEntry ? 0 : start;  // performance.now() zählt ab Navigationsstart
  }
  current = { path, start, nav: initial ? 'initial' : 'spa', inflight: 0, requests: 0, timer: null, done: false };
  scheduleQuiet(NO_REQUEST_FALLBACK_MS);
};
