import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ShieldCheck, UserPlus, ShieldAlert, Activity } from 'lucide-react';

const StatMini = ({ value, label, color = 'text-[#6B8A00] dark:text-[#BFFF00]' }) => (
  <div>
    <p className={`text-lg font-black leading-none ${color}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
  </div>
);

export const AuthHealthWidget = ({ health, de }) => {
  if (!health) {
    return (
      <Card className="border-black/[0.06] dark:border-white/[0.06]" data-testid="auth-health-loading">
        <CardContent className="p-5">
          <p className="text-[11px] text-muted-foreground/60">{de ? 'Lade Auth-Health...' : 'Loading auth health...'}</p>
        </CardContent>
      </Card>
    );
  }

  const logins = health.logins_24h || {};
  const successRate = logins.success_rate_pct ?? 100;
  let rateColor = 'text-emerald-500';
  let rateLabel = 'HEALTHY';
  if (successRate < 70) { rateColor = 'text-rose-500'; rateLabel = 'CRITICAL'; }
  else if (successRate < 90) { rateColor = 'text-amber-500'; rateLabel = 'WARNING'; }

  const hasOffenders = (health.top_offenders || []).length > 0;

  return (
    <Card className="border-black/[0.06] dark:border-white/[0.06] lg:col-span-2" data-testid="auth-health-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck size={11} /> {de ? 'Auth-Health (letzte 24h)' : 'Auth Health (last 24h)'}
          </h3>
          <Badge className={`text-[9px] font-black border-0 ${
            rateLabel === 'HEALTHY' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
            : rateLabel === 'WARNING' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
            : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
          }`}>
            {rateLabel}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatMini
            value={health.registrations_24h ?? 0}
            label={de ? 'Neue Registrierungen' : 'New Sign-Ups'}
            color="text-[#6B8A00] dark:text-[#BFFF00]"
          />
          <StatMini
            value={logins.success ?? 0}
            label={de ? 'Erfolgreiche Logins' : 'Successful Logins'}
            color="text-emerald-500"
          />
          <StatMini
            value={logins.failed ?? 0}
            label={de ? 'Fehlgeschlagene Logins' : 'Failed Logins'}
            color="text-amber-500"
          />
          <StatMini
            value={`${successRate}%`}
            label={de ? 'Erfolgsquote' : 'Success Rate'}
            color={rateColor}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-500/5">
            <ShieldAlert size={14} className="text-rose-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold">{health.rate_limit_triggers_24h ?? 0}</p>
              <p className="text-[9px] text-muted-foreground">{de ? '429 Rate-Limit Triggers' : '429 Rate-Limit Hits'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-sky-50/50 dark:bg-sky-500/5">
            <UserPlus size={14} className="text-sky-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold">{health.registrations_7d ?? 0}</p>
              <p className="text-[9px] text-muted-foreground">{de ? 'Neue User (7 Tage)' : 'New Users (7d)'}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Activity size={9} /> {de ? 'Auffällige IPs / Emails (≥5 Fehler/24h)' : 'Suspicious IPs / Emails (≥5 fails/24h)'}
          </p>
          {!hasOffenders ? (
            <p className="text-[10px] text-muted-foreground/60">
              {de ? 'Keine Auffälligkeiten · alles ruhig 🟢' : 'No offenders · all quiet 🟢'}
            </p>
          ) : (
            <div className="space-y-1">
              {health.top_offenders.slice(0, 5).map((o, i) => (
                <div key={`offender-${o.ip}-${o.email}-${i}`} className="flex items-center justify-between text-[10px] p-1.5 rounded bg-rose-50/30 dark:bg-rose-500/5">
                  <span className="font-mono truncate max-w-[50%]">{o.email || 'unknown'}</span>
                  <span className="font-mono text-muted-foreground truncate max-w-[30%]">{o.ip || 'unknown'}</span>
                  <Badge className="text-[8px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-400 border-0">
                    {o.failed_count}× fail
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
