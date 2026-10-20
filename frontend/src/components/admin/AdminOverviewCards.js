import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, Users, CreditCard, Building2, Share2, Euro, Activity, MessageCircle } from 'lucide-react';

const TIER_COLORS = {
  free: 'bg-slate-400',
  starter: 'bg-[#6B8A00]',
  standard: 'bg-gradient-to-r from-[#BFFF00] to-[#9ACC00]',
  accelerator: 'bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A]',
  legacy_premium: 'bg-violet-500',
};

const eur = (n) => `€${(n || 0).toLocaleString('de-DE')}`;
const day = (iso) => (iso || '').split('T')[0];
const statusBadge = (s) => `text-[9px] font-bold border-0 ${s === 'paid' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'}`;

export const Stat = ({ icon: Icon, label, value, sub, color = 'text-[#6B8A00] dark:text-[#BFFF00]', testid }) => (
  <Card className="border-black/[0.06] dark:border-white/[0.06]" data-testid={testid}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <Icon size={18} className={color} />
        {sub && <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{sub}</span>}
      </div>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </CardContent>
  </Card>
);

const SectionCard = ({ testid, icon: Icon, title, children }) => (
  <Card className="border-black/[0.06] dark:border-white/[0.06]" data-testid={testid}>
    <CardContent className="p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">{Icon && <Icon size={12} />} {title}</h3>
      {children}
    </CardContent>
  </Card>
);

export const AdminStatRows = ({ data, de }) => {
  const rev = data.revenue;
  const users = data.users;
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={Euro} testid="stat-total-rev" label={de ? 'Gesamt-Umsatz' : 'Total Revenue'} value={eur(rev.total_eur)} sub="ALL TIME" />
        <Stat icon={TrendingUp} testid="stat-mrr" label={de ? 'MRR (30 Tage)' : 'MRR (30d)'} value={eur(rev.mrr_estimate_eur)} sub="LIVE" color="text-emerald-500" />
        <Stat icon={Activity} testid="stat-arr" label={de ? 'ARR Projektion' : 'ARR Projection'} value={eur(rev.arr_estimate_eur)} sub="x12" color="text-[#7B3FE4]" />
        <Stat icon={CreditCard} testid="stat-installments" label={de ? 'Aktive Ratenpläne' : 'Active Installments'} value={data.installments.active_plans} sub={`${data.installments.completed_plans} FERTIG`} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={Users} testid="stat-total-users" label={de ? 'Gesamt-User' : 'Total Users'} value={users.total} />
        <Stat icon={Users} testid="stat-new-30d" label={de ? 'Neu (30 Tage)' : 'New (30d)'} value={users.new_30d} color="text-emerald-500" />
        <Stat icon={Building2} testid="stat-enterprise" label="Enterprise Leads" value={data.enterprise_leads} color="text-amber-500" />
        <Stat icon={Share2} testid="stat-referrals" label={de ? 'Empfehlungen' : 'Referrals'} value={data.referrals} color="text-sky-500" />
      </div>
    </>
  );
};

export const CommunityStatsCard = ({ community, de }) => (
  <SectionCard testid="community-stats" icon={MessageCircle} title="Community">
    <div className="space-y-3">
      <div><p className="text-2xl font-black">{community.total_posts}</p><p className="text-[10px] text-muted-foreground">{de ? 'Posts insgesamt' : 'Posts total'}</p></div>
      <div><p className="text-lg font-black text-emerald-500">+{community.posts_7d}</p><p className="text-[10px] text-muted-foreground">{de ? 'letzte 7 Tage' : 'last 7 days'}</p></div>
      <div><p className="text-lg font-black text-sky-500">{community.total_comments}</p><p className="text-[10px] text-muted-foreground">{de ? 'Kommentare' : 'comments'}</p></div>
    </div>
  </SectionCard>
);

export const TierDistributionCard = ({ data, de }) => {
  const total = data.users.total;
  return (
    <Card className="border-black/[0.06] dark:border-white/[0.06] mb-6" data-testid="tier-dist-card">
      <CardContent className="p-5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">{de ? 'Tier-Verteilung' : 'Tier Distribution'}</h3>
        <div className="space-y-3">
          {Object.entries(data.tier_distribution).map(([tier, count]) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={tier} className="flex items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider w-24 shrink-0">{tier}</span>
                <div className="flex-1 h-5 rounded-full bg-gray-100 dark:bg-muted overflow-hidden">
                  <div className={`h-full ${TIER_COLORS[tier] || 'bg-slate-400'} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] font-bold w-16 text-right shrink-0">{count} <span className="text-muted-foreground font-normal">({pct.toFixed(0)}%)</span></span>
              </div>
            );
          })}
        </div>
        <div className="mt-5 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Umsatz pro Tier' : 'Revenue per Tier'}</h4>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(data.revenue.per_tier).map(([tier, amount]) => (
              <div key={tier} className="px-3 py-1.5 rounded-full bg-[#BFFF00]/10 border border-[#BFFF00]/20">
                <span className="text-[10px] font-bold uppercase tracking-wider">{tier}: </span>
                <span className="text-[11px] font-black text-[#4A6200] dark:text-[#BFFF00]">{eur(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const LeadsAndReferrals = ({ enterprise, referrals, de }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
    <SectionCard testid="enterprise-leads-card" icon={Building2} title="Enterprise">
      {enterprise.length === 0 ? <p className="text-[11px] text-muted-foreground/60">{de ? 'Noch keine Enterprise-Leads.' : 'No enterprise leads yet.'}</p> : (
        <div className="space-y-2">
          {enterprise.slice(0, 8).map((e) => (
            <div key={e.lead_id || e.user_email || `${e.created_at}-${e.user_email}`} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-muted/30">
              <div className="min-w-0"><p className="text-[11px] font-bold truncate">{e.user_email || 'unknown'}</p><p className="text-[9px] text-muted-foreground">{day(e.created_at)}</p></div>
              <Badge className={statusBadge(e.payment_status)}>{e.payment_status || 'pending'}</Badge>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
    <SectionCard testid="referrals-card" icon={Share2} title={de ? 'Top Empfehlungs-Codes' : 'Top Referral Codes'}>
      {referrals.length === 0 ? <p className="text-[11px] text-muted-foreground/60">{de ? 'Noch keine Empfehlungen getracked.' : 'No referrals tracked yet.'}</p> : (
        <div className="space-y-2">
          {referrals.slice(0, 8).map((r) => (
            <div key={r.code} className="flex items-center justify-between"><code className="text-[11px] font-mono font-bold">{r.code}</code><span className="text-[11px] font-black">{r.count}×</span></div>
          ))}
        </div>
      )}
    </SectionCard>
  </div>
);

export const RecentTransactions = ({ txs, de }) => (
  <SectionCard testid="recent-txs-card" icon={CreditCard} title={de ? 'Letzte Transaktionen' : 'Recent Transactions'}>
    {txs.length === 0 ? <p className="text-[11px] text-muted-foreground/60">{de ? 'Noch keine Transaktionen.' : 'No transactions yet.'}</p> : (
      <div className="space-y-1.5">
        {txs.map((t) => (
          <div key={t.tx_id || t.session_id || `${t.user_email}-${t.created_at}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-[11px]">
            <div className="min-w-0 flex-1"><p className="font-bold truncate">{t.user_email || 'unknown'}</p><p className="text-muted-foreground">{t.package_name} · {day(t.created_at)}</p></div>
            <div className="text-right shrink-0 ml-3"><p className="font-black">€{(t.amount || 0).toFixed(0)}</p><Badge className={statusBadge(t.payment_status).replace('text-[9px]', 'text-[8px]')}>{t.payment_status}</Badge></div>
          </div>
        ))}
      </div>
    )}
  </SectionCard>
);
