import { Users, FileText, CreditCard, Key } from "lucide-react";

export function KpiCards({ stats }) {
  if (!stats) return null;
  const kpis = [
    { label: "Total Users", value: stats.overview.total_users, sub: `+${stats.today.users} heute`, icon: Users },
    { label: "Reports", value: stats.overview.total_reports, sub: `+${stats.today.reports} heute`, icon: FileText },
    { label: "Revenue", value: `€${stats.overview.total_revenue.toLocaleString()}`, sub: `${stats.transactions.paid} paid`, icon: CreditCard },
    { label: "License Keys", value: stats.overview.total_keys, sub: `${stats.keys.active} aktiv`, icon: Key },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-inter text-xs text-slate-500 uppercase tracking-wider">{kpi.label}</span>
            <kpi.icon className="w-4 h-4 text-slate-600" />
          </div>
          <div className="font-manrope font-extrabold text-2xl text-white mb-1">{kpi.value}</div>
          <div className="font-inter text-xs text-[#C8FF00]/60">{kpi.sub}</div>
        </div>
      ))}
    </div>
  );
}

export function ConversionFunnel({ stats }) {
  if (!stats) return null;
  return (
    <div className="glass-card p-6">
      <h3 className="font-manrope font-bold text-lg text-white mb-4">Conversion Funnel</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="font-inter text-xs text-slate-500 mb-1">Diagnose → Report</div>
          <div className="font-manrope font-bold text-xl text-[#C8FF00]">{stats.conversions.diagnosis_to_report}%</div>
          <div className="mt-2 h-1.5 rounded-full bg-white/[0.04]">
            <div className="h-full rounded-full bg-[#C8FF00]" style={{ width: `${Math.min(100, stats.conversions.diagnosis_to_report)}%` }} />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="font-inter text-xs text-slate-500 mb-1">Report → Payment</div>
          <div className="font-manrope font-bold text-xl text-white">{stats.conversions.report_to_payment}%</div>
          <div className="mt-2 h-1.5 rounded-full bg-white/[0.04]">
            <div className="h-full rounded-full bg-white/30" style={{ width: `${Math.min(100, stats.conversions.report_to_payment)}%` }} />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="font-inter text-xs text-slate-500 mb-1">E-Mails gesendet</div>
          <div className="font-manrope font-bold text-xl text-white">{stats.emails.total}</div>
          <div className="font-inter text-xs text-slate-500 mt-1">+{stats.emails.today} heute</div>
        </div>
      </div>
    </div>
  );
}
