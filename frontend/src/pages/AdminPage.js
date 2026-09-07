import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import logger from '../lib/logger';
import { Loader2, ShieldAlert, Activity } from 'lucide-react';
import { AuthHealthWidget } from '../components/admin/AuthHealthWidget';
import { SyncHealthWidget } from '../components/admin/SyncHealthWidget';
import { UserManageCard } from '../components/admin/UserManageCard';
import { FeatureRolloutPanel } from '../components/admin/FeatureRolloutPanel';
import { OpsHandoverPanel } from '../components/admin/OpsHandoverPanel';
import { AdminStatRows, CommunityStatsCard, TierDistributionCard, LeadsAndReferrals, RecentTransactions } from '../components/admin/AdminOverviewCards';
import { AdminToolSections } from '../components/admin/AdminToolSections';

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
          {/* Quick links (Iter 119, Mert: "another link so we can always see it") */}
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <button
              onClick={() => document.querySelector('[data-testid="rag-control-center"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#BFFF00]/12 border border-[#BFFF00]/30 text-[11px] font-bold hover:bg-[#BFFF00]/25 transition-colors"
              data-testid="admin-rag-quicklink"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#BFFF00] animate-pulse" />
              RAG Control Center
            </button>
            <button
              onClick={() => document.querySelector('[data-testid="license-keys-manager"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-[11px] font-bold hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-colors"
              data-testid="admin-license-quicklink"
            >
              {de ? 'Lizenz-Keys (400 Partner)' : 'License keys (400 partners)'}
            </button>
          </div>
        </div>

        <AdminStatRows data={data} de={de} />

        {/* Auth-Health Monitoring (launch priority) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <AuthHealthWidget health={authHealth} de={de} />
          <SyncHealthWidget de={de} />
          <FeatureRolloutPanel de={de} />
          <OpsHandoverPanel />
          <UserManageCard de={de} />
          <CommunityStatsCard community={data.community} de={de} />
        </div>

        <TierDistributionCard data={data} de={de} />
        <LeadsAndReferrals enterprise={enterprise} referrals={referrals} de={de} />
        <RecentTransactions txs={txs} de={de} />

        <AdminToolSections de={de} />
      </div>
    </DashboardLayout>
  );
}
