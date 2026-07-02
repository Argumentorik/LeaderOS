import { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { RefreshCw, Link2, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';

const Stat = ({ label, value, tone = 'default' }) => (
  <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] px-3 py-2.5">
    <p className={`text-xl font-black ${tone === 'good' ? 'text-emerald-500' : tone === 'warn' ? 'text-amber-500' : ''}`}>{value}</p>
    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
  </div>
);

export const SyncHealthWidget = ({ de = true }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/admin/sync-health')
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); const iv = setInterval(load, 60000); return () => clearInterval(iv); }, []);

  return (
    <Card data-testid="sync-health-widget">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 size={15} className="text-[#6B8A00] dark:text-[#BFFF00]" />
            <h3 className="text-sm font-black">{de ? 'leadercheck.de Sync — letzte 24h' : 'leadercheck.de sync — last 24h'}</h3>
          </div>
          <button onClick={load} data-testid="sync-health-refresh" className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {!data ? (
          <p className="text-xs text-muted-foreground">{loading ? '…' : (de ? 'Keine Daten verfügbar.' : 'No data available.')}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Stat label={de ? 'Syncs' : 'Syncs'} value={data.syncs_24h} />
              <Stat label={de ? 'Erfolgreich' : 'Completed'} value={data.completed_24h} tone="good" />
              <Stat label={de ? 'Ohne Import' : 'Incomplete'} value={data.incomplete_24h} tone={data.incomplete_24h > 0 ? 'warn' : 'default'} />
              <Stat label={de ? 'Datensätze' : 'Records'} value={data.records_imported_24h} />
              <Stat label={de ? 'Verbundene User' : 'Connected users'} value={data.connected_users} />
            </div>
            {data.recent?.length > 0 && (
              <div className="space-y-1" data-testid="sync-health-recent">
                {data.recent.slice(0, 6).map((s) => (
                  <div key={s.sync_id} className="flex items-center gap-2 text-[11.5px] px-2 py-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03]">
                    {s.status === 'completed'
                      ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                      : <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                    <span className="font-semibold truncate flex-1 min-w-0">{s.wladhub_email}</span>
                    <span className="text-muted-foreground shrink-0">{s.status === 'completed' ? `${s.records_imported ?? 0} ${de ? 'Einträge' : 'records'}` : s.status}</span>
                    <span className="text-muted-foreground/60 shrink-0">{(s.created_at || '').slice(11, 16)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncHealthWidget;
