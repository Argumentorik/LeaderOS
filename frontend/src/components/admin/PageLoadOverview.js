import { useCallback, useEffect, useState } from 'react';
import { Gauge, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import api from '../../lib/api';
import logger from '../../lib/logger';

const GRADE = {
  ok: { cls: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', label: (de) => (de ? 'schnell' : 'fast') },
  warn: { cls: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', label: (de) => (de ? 'zäh' : 'sluggish') },
  slow: { cls: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', label: (de) => (de ? 'Ausreißer' : 'outlier') },
};

const fmt = (ms) => (ms == null ? '–' : ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`);

const Row = ({ r, de }) => {
  const g = GRADE[r.grade] || GRADE.ok;
  return (
    <tr className="border-t border-black/[0.05] dark:border-white/[0.06]" data-testid={`page-load-row-${r.route.replace(/[^a-z0-9]+/gi, '-')}`}>
      <td className="py-2 pr-3 font-mono text-[12px]">{r.route}</td>
      <td className="py-2 pr-3 text-right tabular-nums">{r.count}</td>
      <td className="py-2 pr-3 text-right tabular-nums">{fmt(r.p50)}</td>
      <td className={`py-2 pr-3 text-right tabular-nums font-semibold ${g.cls}`}>{fmt(r.p95)}</td>
      <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{fmt(r.max)}</td>
      <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{fmt(r.p50_initial)}</td>
      <td className="py-2 text-right"><span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${g.bg} ${g.cls}`}>{g.label(de)}</span></td>
    </tr>
  );
};

export const PageLoadOverview = ({ de = true }) => {
  const [data, setData] = useState(null);
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await api.get('/admin/telemetry/page-loads', { params: { since_hours: hours } });
      setData(res.data);
    } catch (err) { logger.warn('page-loads failed', err); } finally { setBusy(false); }
  }, [hours]);

  useEffect(() => { load(); }, [load]);

  const outliers = data?.outliers || [];
  return (
    <Card className="border-black/[0.04] dark:border-white/[0.06]" data-testid="page-load-overview">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center"><Gauge size={18} className="text-[#4A6200] dark:text-[#BFFF00]" /></div>
          <div className="flex-1 min-w-[200px]">
            <p className="font-bold text-sm" data-testid="page-load-summary">
              {data ? `${data.samples} ${de ? 'Seitenaufbauten' : 'page loads'} · p50 ${fmt(data.overall?.p50)} · p95 ${fmt(data.overall?.p95)}` : (de ? 'Lade …' : 'Loading …')}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {de ? 'Gemessen im Browser: vom Seitenwechsel bis alle Daten der Seite da sind. p95 > 1,2 s = zäh, > 2,5 s = Ausreißer.' : 'Measured in the browser: from route change until all page data has arrived. p95 > 1.2 s = sluggish, > 2.5 s = outlier.'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            {[24, 72, 168].map((h) => (
              <button key={h} type="button" onClick={() => setHours(h)} data-testid={`page-load-range-${h}`}
                className={`px-2.5 py-1 rounded-full border ${hours === h ? 'bg-foreground text-background border-foreground' : 'border-black/10 dark:border-white/10 text-muted-foreground'}`}>
                {h === 24 ? '24h' : h === 72 ? '3d' : '7d'}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={busy} data-testid="page-load-refresh"><RefreshCw size={13} className={busy ? 'animate-spin' : ''} /></Button>
        </div>

        {data && (
          <div className={`flex items-center gap-2 text-[12px] rounded-xl px-3 py-2 mb-3 ${outliers.length ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`} data-testid="page-load-outliers">
            {outliers.length ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {outliers.length
              ? (de ? `${outliers.length} Seite(n) über dem Limit: ${outliers.map((o) => o.route).join(', ')}` : `${outliers.length} page(s) over the limit: ${outliers.map((o) => o.route).join(', ')}`)
              : (de ? 'Keine Ausreißer — alle Seiten unter 1,2 s (p95).' : 'No outliers — all pages under 1.2 s (p95).')}
          </div>
        )}

        {data && !data.routes?.length && (
          <p className="text-[12px] text-muted-foreground" data-testid="page-load-empty">{de ? 'Noch keine Messwerte im Zeitraum — einfach ein paar Seiten aufrufen, die Messung läuft automatisch.' : 'No samples in this range yet — open a few pages, measurement runs automatically.'}</p>
        )}

        {data?.routes?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]" data-testid="page-load-table">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="text-left pb-1 pr-3">{de ? 'Seite' : 'Page'}</th>
                  <th className="text-right pb-1 pr-3">{de ? 'Aufrufe' : 'Loads'}</th>
                  <th className="text-right pb-1 pr-3">p50</th>
                  <th className="text-right pb-1 pr-3">p95</th>
                  <th className="text-right pb-1 pr-3">Max</th>
                  <th className="text-right pb-1 pr-3">{de ? 'Reload p50' : 'Reload p50'}</th>
                  <th className="text-right pb-1">Status</th>
                </tr>
              </thead>
              <tbody>{data.routes.map((r) => <Row key={r.route} r={r} de={de} />)}</tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
