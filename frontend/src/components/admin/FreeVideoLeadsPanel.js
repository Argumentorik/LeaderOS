import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { Loader2, Clapperboard, Mail, UserCheck, BellOff, Download, TrendingUp } from 'lucide-react';

/**
 * FreeVideoLeadsPanel · admin view of the /gratis-videos funnel leads.
 *
 * Surfaces GET /api/free-videos/leads so the team can actually SEE the data
 * coming in — totals + a recent-leads table with full attribution (name,
 * email, source, UTM, referrer, status). Includes a one-click CSV export.
 */
const StatPill = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-muted/30">
    <Icon size={15} className={color} />
    <div>
      <p className="text-lg font-black leading-none">{value ?? 0}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  </div>
);

const fmtUtm = (utm) => {
  if (!utm) return '';
  const parts = [utm.source, utm.medium, utm.campaign].filter(Boolean);
  return parts.join(' · ');
};

const toCsv = (rows) => {
  const cols = ['created_at', 'name', 'email', 'sources', 'utm_source', 'utm_medium', 'utm_campaign', 'referrer', 'registered', 'welcome_sent', 'unsubscribed'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = cols.join(',');
  const body = rows.map((r) => [
    r.created_at, r.name, r.email, (r.sources || []).join('|'),
    r.utm?.source, r.utm?.medium, r.utm?.campaign, r.referrer,
    r.registered, r.welcome_sent, r.unsubscribed,
  ].map(esc).join(',')).join('\n');
  return `${head}\n${body}`;
};

export default function FreeVideoLeadsPanel({ de = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/free-videos/leads', { params: { limit: 200 } });
      setData(res.data);
    } catch (err) {
      logger.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const rows = data?.recent || [];
    if (!rows.length) return;
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'free-video-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const recent = data?.recent || [];

  return (
    <Card className="border-black/[0.06] dark:border-white/[0.06]" data-testid="free-video-leads-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clapperboard size={12} /> {de ? '4 Gratis-Videos · Leads' : '4 Free Videos · Leads'}
          </h3>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!recent.length}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            data-testid="free-video-leads-export"
          >
            <Download size={12} /> CSV
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-[#BFFF00]" /></div>
        ) : !data ? (
          <p className="text-[11px] text-muted-foreground/60">{de ? 'Leads konnten nicht geladen werden.' : 'Could not load leads.'}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-5">
              <StatPill icon={Clapperboard} label={de ? 'Leads gesamt' : 'Total leads'} value={data.total} color="text-[#6B8A00] dark:text-[#BFFF00]" />
              <StatPill icon={Mail} label={de ? 'Video 1 zugestellt' : 'Video 1 delivered'} value={data.delivered} color="text-sky-500" />
              <StatPill icon={UserCheck} label={de ? 'Registriert' : 'Registered'} value={data.registered} color="text-emerald-500" />
              <StatPill icon={TrendingUp} label={de ? 'Conversion' : 'Conversion'} value={`${data.conversion_rate ?? 0}%`} color="text-[#7B3FE4]" />
              <StatPill icon={BellOff} label={de ? 'Abgemeldet' : 'Unsubscribed'} value={data.unsubscribed} color="text-rose-500" />
            </div>

            {recent.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/60">{de ? 'Noch keine Leads. Sobald jemand /gratis-videos startet, erscheint er hier.' : 'No leads yet. They show up here as soon as someone opts in on /gratis-videos.'}</p>
            ) : (
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                {recent.map((lead) => (
                  <div
                    key={lead.email_lower || lead.email}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-muted/30 text-[11px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">
                        {lead.name ? <span>{lead.name} · </span> : null}
                        <span className="text-muted-foreground">{lead.email}</span>
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate">
                        {(lead.created_at || '').split('T')[0]}
                        {lead.sources?.length ? ` · ${lead.sources.join(', ')}` : ''}
                        {fmtUtm(lead.utm) ? ` · ${fmtUtm(lead.utm)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {lead.registered && <Badge className="text-[8px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-0">{de ? 'REG' : 'REG'}</Badge>}
                      {lead.welcome_sent && <Badge className="text-[8px] font-bold bg-sky-500/20 text-sky-700 dark:text-sky-400 border-0">V1</Badge>}
                      {lead.unsubscribed && <Badge className="text-[8px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-400 border-0">{de ? 'AB' : 'UNSUB'}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
