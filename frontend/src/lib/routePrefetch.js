// Lädt den Code-Chunk einer Route vor dem Klick (Sidebar-Hover/Fokus) oder im Leerlauf.
const registry = new Map();
const done = new Set();

export const registerRoutePreloads = (map) => {
  Object.entries(map).forEach(([path, component]) => {
    if (component?.preload) registry.set(path, component.preload);
  });
};

const normalize = (path) => {
  if (!path) return '';
  const clean = path.split('?')[0].split('#')[0];
  if (clean.startsWith('/kurse/')) return '/kurse/:slug';
  return clean;
};

export const prefetchRoute = (path) => {
  const key = normalize(path);
  if (!key || done.has(key)) return;
  const preload = registry.get(key);
  if (!preload) return;
  done.add(key);
  preload();
};

const IDLE_ROUTES = ['/chat', '/kurse', '/missions', '/challenge', '/simulations', '/tools', '/playbooks', '/profile'];

// Nach dem ersten Render der App: die häufigsten Ziele im Leerlauf vorladen (nur bei guter Verbindung).
export const prefetchIdleRoutes = () => {
  const conn = typeof navigator !== 'undefined' ? navigator.connection : null;
  if (conn?.saveData || /2g/.test(conn?.effectiveType || '')) return;
  const run = () => IDLE_ROUTES.forEach((p, i) => setTimeout(() => prefetchRoute(p), i * 250));
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2500);
};
