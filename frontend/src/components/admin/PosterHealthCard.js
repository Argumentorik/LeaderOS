import { useCallback, useEffect, useState } from 'react';
import { Image, RefreshCw, Check } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

/** Iter 183: Videos ohne dauerhaft gespeichertes Vorschaubild — plus Knopf, der alle nachzieht. */
export const PosterHealthCard = () => {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/media/posters');
      setStatus(res.data);
    } catch (e) { logger.warn('poster status', e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const backfill = async () => {
    setBusy(true); setResult(null);
    try {
      const res = await api.post('/media/posters/backfill');
      setResult(res.data);
      await load();
    } catch (e) {
      logger.error('poster backfill', e);
      setResult({ error: e?.response?.data?.detail || 'Nachziehen fehlgeschlagen' });
    } finally { setBusy(false); }
  };

  const missing = status?.missing || [];

  return (
    <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-card p-5"
         data-testid="poster-health-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#4A6200] dark:text-[#BFFF00]">
            <Image size={11} /> Vorschaubilder
          </p>
          <p className="text-[13.5px] font-bold mt-1" data-testid="poster-health-summary">
            {status
              ? `${status.ready_count} abrufbar · ${status.missing_count} offen${status.broken_count ? ` · ${status.broken_count} defekt` : ''}`
              : 'Wird geprüft…'}
          </p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Geprüft wird nicht nur der Eintrag, sondern ob sich das Bild wirklich abrufen lässt.
            Defekte werden hier gemeldet und beim Nachziehen neu erzeugt. Kostet nichts.
          </p>
        </div>
        <button
          type="button"
          onClick={backfill}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#BFFF00] px-3 py-2 text-[12px] font-black text-black disabled:opacity-50"
          data-testid="poster-backfill-btn"
        >
          <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
          {busy ? 'Zieht nach…' : 'Fehlende nachziehen'}
        </button>
      </div>

      {missing.length > 0 && (
        <ul className="mt-3 space-y-1" data-testid="poster-missing-list">
          {missing.map((c) => (
            <li key={c.slug} className="text-[12px] text-muted-foreground" data-testid={`poster-missing-${c.slug}`}>
              {c.title || c.slug} <span className="opacity-50">· {c.slug}{c.reason ? ` · ${c.reason}` : ''}</span>
            </li>
          ))}
        </ul>
      )}

      {status && missing.length === 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 dark:text-emerald-400"
           data-testid="poster-all-ready">
          <Check size={13} /> Jedes Video hat ein abrufbares Vorschaubild.
        </p>
      )}

      {result && (
        <p className="mt-2 text-[12px] text-muted-foreground" data-testid="poster-backfill-result">
          {result.error
            ? result.error
            : `Neu erzeugt: ${result.built?.length || 0} · unverändert: ${result.skipped?.length || 0}${result.failed?.length ? ` · Fehler: ${result.failed.length}` : ''}`}
        </p>
      )}
    </div>
  );
};

export default PosterHealthCard;
