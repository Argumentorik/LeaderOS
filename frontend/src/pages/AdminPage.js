import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import logger from '../lib/logger';
import {
  TrendingUp, Users, CreditCard, Building2, Share2,
  Loader2, ShieldAlert, Euro, Activity, MessageCircle,
} from 'lucide-react';
import { AuthHealthWidget } from '../components/admin/AuthHealthWidget';
import { SyncHealthWidget } from '../components/admin/SyncHealthWidget';
import { UserManageCard } from '../components/admin/UserManageCard';
import { RagDebugStudio } from '../components/admin/RagDebugStudio';
import { LearningVideosManager } from '../components/admin/LearningVideosManager';

const TIER_COLORS = {
  free: 'bg-slate-400',
  starter: 'bg-[#6B8A00]',
  standard: 'bg-gradient-to-r from-[#BFFF00] to-[#9ACC00]',
  accelerator: 'bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A]',
  legacy_premium: 'bg-violet-500',
};

const Stat = ({ icon: Icon, label, value, sub, color = 'text-[#6B8A00] dark:text-[#BFFF00]', testid }) => (
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

export default function AdminPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [data, setData] = useState(null);
  const [enterprise, setEnterprise] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [txs, setTxs] = useState([]);
  const [authHealth, setAuthHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // Hard client-side guard: only admins see this page. Non-admins → /dashboard.
  // Note: route itself is at the non-guessable /wlad-control-x7k9q2 path. Backend
  // require_admin() still returns 403 on /api/admin/*.
  const blockNonAdmin = user && !user.is_admin;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, ent, refs, transactions, health] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/enterprise-leads').catch(() => ({ data: [] })),
        api.get('/admin/referrals').catch(() => ({ data: [] })),
        api.get('/admin/transactions', { params: { limit: 20 } }).catch(() => ({ data: [] })),
        api.get('/admin/auth-health').catch(() => ({ data: null })),
      ]);
      setData(overview.data);
      setEnterprise(ent.data || []);
      setReferrals(refs.data || []);
      setTxs(transactions.data || []);
      setAuthHealth(health.data);
    } catch (err) {
      if (err.response?.status === 403) setForbidden(true);
      else logger.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Auto-refresh auth health every 60s (launch monitoring)
  useEffect(() => {
    const iv = setInterval(() => {
      api.get('/admin/auth-health').then(r => setAuthHealth(r.data)).catch(() => {});
    }, 60000);
    return () => clearInterval(iv);
  }, []);

  if (blockNonAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (forbidden) {
    return (
      <DashboardLayout>
        <div className="p-10 max-w-2xl mx-auto text-center space-y-4" data-testid="admin-forbidden">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 mx-auto flex items-center justify-center">
            <ShieldAlert size={28} className="text-rose-500" />
          </div>
          <h1 className="text-2xl font-black">{de ? 'Kein Admin-Zugriff' : 'No admin access'}</h1>
          <p className="text-sm text-muted-foreground">{de ? 'Dieser Bereich ist Admins vorbehalten.' : 'This area is reserved for admins.'}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading || !data) {
    return <DashboardLayout><div className="p-20 text-center"><Loader2 size={24} className="mx-auto animate-spin text-[#BFFF00]" /></div></DashboardLayout>;
  }

  const rev = data.revenue;
  const users = data.users;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto" data-testid="admin-page">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7B3FE4] to-[#4F1FE4] flex items-center justify-center shadow-lg shadow-[#7B3FE4]/20">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">{de ? 'Enterprise, Empfehlungen, Coaching & Analytics' : 'Enterprise, Referrals, Coaching & Analytics'}</p>
            </div>
          </div>
        </div>

        {/* Revenue Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Stat icon={Euro} testid="stat-total-rev" label={de ? 'Gesamt-Umsatz' : 'Total Revenue'} value={`€${rev.total_eur.toLocaleString('de-DE')}`} sub="ALL TIME" />
          <Stat icon={TrendingUp} testid="stat-mrr" label={de ? 'MRR (30 Tage)' : 'MRR (30d)'} value={`€${rev.mrr_estimate_eur.toLocaleString('de-DE')}`} sub="LIVE" color="text-emerald-500" />
          <Stat icon={Activity} testid="stat-arr" label={de ? 'ARR Projektion' : 'ARR Projection'} value={`€${rev.arr_estimate_eur.toLocaleString('de-DE')}`} sub="x12" color="text-[#7B3FE4]" />
          <Stat icon={CreditCard} testid="stat-installments" label={de ? 'Aktive Ratenpläne' : 'Active Installments'} value={data.installments.active_plans} sub={`${data.installments.completed_plans} FERTIG`} />
        </div>

        {/* Users Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Stat icon={Users} testid="stat-total-users" label={de ? 'Gesamt-User' : 'Total Users'} value={users.total} />
          <Stat icon={Users} testid="stat-new-30d" label={de ? 'Neu (30 Tage)' : 'New (30d)'} value={users.new_30d} color="text-emerald-500" />
          <Stat icon={Building2} testid="stat-enterprise" label={de ? 'Enterprise Leads' : 'Enterprise Leads'} value={data.enterprise_leads} color="text-amber-500" />
          <Stat icon={Share2} testid="stat-referrals" label={de ? 'Empfehlungen' : 'Referrals'} value={data.referrals} color="text-sky-500" />
        </div>

        {/* Auth-Health Monitoring (launch priority) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <AuthHealthWidget health={authHealth} de={de} />
          <SyncHealthWidget de={de} />
          <UserManageCard de={de} />
          <Card className="border-black/[0.06] dark:border-white/[0.06]" data-testid="community-stats">
            <CardContent className="p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5"><MessageCircle size={11} /> Community</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-black">{data.community.total_posts}</p>
                  <p className="text-[10px] text-muted-foreground">{de ? 'Posts insgesamt' : 'Posts total'}</p>
                </div>
                <div>
                  <p className="text-lg font-black text-emerald-500">+{data.community.posts_7d}</p>
                  <p className="text-[10px] text-muted-foreground">{de ? 'letzte 7 Tage' : 'last 7 days'}</p>
                </div>
                <div>
                  <p className="text-lg font-black text-sky-500">{data.community.total_comments}</p>
                  <p className="text-[10px] text-muted-foreground">{de ? 'Kommentare' : 'comments'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tier Distribution */}
        <Card className="border-black/[0.06] dark:border-white/[0.06] mb-6" data-testid="tier-dist-card">
          <CardContent className="p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">{de ? 'Tier-Verteilung' : 'Tier Distribution'}</h3>
            <div className="space-y-3">
              {Object.entries(data.tier_distribution).map(([tier, count]) => {
                const pct = users.total > 0 ? (count / users.total) * 100 : 0;
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
                {Object.entries(rev.per_tier).map(([tier, amount]) => (
                  <div key={tier} className="px-3 py-1.5 rounded-full bg-[#BFFF00]/10 border border-[#BFFF00]/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{tier}: </span>
                    <span className="text-[11px] font-black text-[#4A6200] dark:text-[#BFFF00]">€{amount.toLocaleString('de-DE')}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enterprise Leads + Referrals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <Card className="border-black/[0.06] dark:border-white/[0.06]" data-testid="enterprise-leads-card">
            <CardContent className="p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5"><Building2 size={12} /> Enterprise</h3>
              {enterprise.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60">{de ? 'Noch keine Enterprise-Leads.' : 'No enterprise leads yet.'}</p>
              ) : (
                <div className="space-y-2">
                  {enterprise.slice(0, 8).map((e) => (
                    <div key={e.lead_id || e.user_email || `${e.created_at}-${e.user_email}`} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-muted/30">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold truncate">{e.user_email || 'unknown'}</p>
                        <p className="text-[9px] text-muted-foreground">{(e.created_at || '').split('T')[0]}</p>
                      </div>
                      <Badge className={`text-[9px] font-bold ${e.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-0' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-0'}`}>
                        {e.payment_status || 'pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-black/[0.06] dark:border-white/[0.06]" data-testid="referrals-card">
            <CardContent className="p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5"><Share2 size={12} /> {de ? 'Top Empfehlungs-Codes' : 'Top Referral Codes'}</h3>
              {referrals.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60">{de ? 'Noch keine Empfehlungen getracked.' : 'No referrals tracked yet.'}</p>
              ) : (
                <div className="space-y-2">
                  {referrals.slice(0, 8).map((r) => (
                    <div key={r.code} className="flex items-center justify-between">
                      <code className="text-[11px] font-mono font-bold">{r.code}</code>
                      <span className="text-[11px] font-black">{r.count}×</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="border-black/[0.06] dark:border-white/[0.06]" data-testid="recent-txs-card">
          <CardContent className="p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5"><CreditCard size={12} /> {de ? 'Letzte Transaktionen' : 'Recent Transactions'}</h3>
            {txs.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/60">{de ? 'Noch keine Transaktionen.' : 'No transactions yet.'}</p>
            ) : (
              <div className="space-y-1.5">
                {txs.map((t) => (
                  <div key={t.tx_id || t.session_id || `${t.user_email}-${t.created_at}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors text-[11px]">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{t.user_email || 'unknown'}</p>
                      <p className="text-muted-foreground">{t.package_name} · {(t.created_at || '').split('T')[0]}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-black">€{(t.amount || 0).toFixed(0)}</p>
                      <Badge className={`text-[8px] font-bold ${t.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-0' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-0'}`}>
                        {t.payment_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RAG Debug Studio — diagnose WladBot's knowledge retrieval */}
        <div className="mt-2">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {de ? 'WladBot Wissens-Studio' : 'WladBot Knowledge Studio'}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {de
                ? 'Sieh genau welche Wlad-Chunks WladBot für jede Frage findet — Coverage-Lücken vor den Usern entdecken.'
                : 'See exactly which Wlad chunks WladBot retrieves for any question — spot coverage gaps before users do.'}
            </p>
          </div>
          <RagDebugStudio />
        </div>

        {/* Learning Videos Manager — Vimeo metadata for the 10-course catalogue */}
        <div className="mt-6">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {de ? 'Lernvideos · Vimeo-Verwaltung' : 'Learning Videos · Vimeo Manager'}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {de
                ? 'Hinterlege Vimeo-IDs / URLs für die 10 Kurse. Sobald gespeichert spielt der In-App-Player ohne Code-Deploy.'
                : 'Drop Vimeo IDs / URLs into the 10-course catalogue. The in-app player picks them up live, no deploy needed.'}
            </p>
          </div>
          <LearningVideosManager />
        </div>
      </div>
    </DashboardLayout>
  );
}
