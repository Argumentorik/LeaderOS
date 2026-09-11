import api from './api';

/**
 * Dashboard in einem Zug (Iter 168): EIN Request liefert alle Startdaten.
 * DashboardPage lädt das Bündel; die Widgets holen sich ihre Scheibe per takeSlice()
 * statt eigene Requests zu feuern. Fehlt eine Scheibe (z. B. Direktaufruf eines Widgets
 * außerhalb des Dashboards), lädt das Widget wie bisher selbst.
 */
const MAX_AGE_MS = 15000;
let bundle = null;
let loadedAt = 0;

export const loadDashboardBootstrap = async ({ fresh = false } = {}) => {
  const res = await api.get('/dashboard/bootstrap', fresh ? { params: { fresh: 1 } } : undefined);
  bundle = res.data || null;
  loadedAt = Date.now();
  return bundle;
};

export const takeSlice = (key) => {
  if (!bundle || Date.now() - loadedAt > MAX_AGE_MS) return undefined;
  return bundle[key];
};

export const clearDashboardBootstrap = () => { bundle = null; loadedAt = 0; };
