import { useEffect, useState } from 'react';
import api from '../lib/api';

let cache = null;
let inflight = null;

const load = () => {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = api.get('/features').then((r) => { cache = r.data?.features || {}; return cache; }).catch(() => ({})).finally(() => { inflight = null; });
  }
  return inflight;
};

/* Feature-Flags des eingeloggten Nutzers (Admin → Feature-Rollout). Einmal geladen, dann aus dem Speicher. */
export const useFeature = (key) => {
  const [flags, setFlags] = useState(cache);
  useEffect(() => { if (!cache) load().then(setFlags); }, []);
  return { enabled: Boolean(flags?.[key]), ready: flags !== null };
};
