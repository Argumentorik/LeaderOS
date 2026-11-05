/**
 * FunnelChart — Live-Funnel-Chart fürs Admin Dashboard.
 * 7-Tage Diagnose vs. Reports vs. Käufer · plus Conversion-Rates.
 */
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, FileCheck, Euro } from "lucide-react";

export default function FunnelChart({ apiBase, token, days = 7 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${apiBase}/api/admin/funnel-chart?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiBase, token, days]);

  if (loading) return <div className="font-inter text-sm text-slate-500">Lade Funnel-Daten…</div>;
  if (!data) return <div className="font-inter text-sm text-red-400">Keine Daten verfügbar.</div>;

  const series = (data.series || []).map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit" }),
  }));

  return (
    <div data-testid="funnel-chart" className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard icon={Users} label="Diagnosen" value={data.totals.leads} color="#94a3b8" testId="kpi-leads" />
        <KpiCard icon={FileCheck} label="Reports" value={data.totals.reports} color="#C8FF00" testId="kpi-reports" sub={`${data.rates.lead_to_report}% von Leads`} />
        <KpiCard icon={Euro} label="Käufer" value={data.totals.payments} color="#22c55e" testId="kpi-payments" sub={`${data.rates.report_to_paid}% von Reports`} />
      </div>

      {/* Chart */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#C8FF00]" />
            <span className="font-mono text-xs tracking-[0.2em] text-slate-400 uppercase">
              ▸ Letzte {days} Tage · Live-Funnel
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] text-slate-600">
            LEAD → REPORT → PAID
          </span>
        </div>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0a0a0a", border: "1px solid #ffffff20", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Line type="monotone" dataKey="leads"    name="Diagnosen" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="reports"  name="Reports"   stroke="#C8FF00" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="payments" name="Käufer"    stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* End-to-end conversion */}
      <div className="flex items-center justify-between bg-[#C8FF00]/[0.04] border border-[#C8FF00]/15 rounded-xl px-5 py-3">
        <span className="font-inter text-sm text-slate-300">
          End-to-End Conversion (Diagnose → Kauf)
        </span>
        <span className="font-manrope font-bold text-2xl text-[#C8FF00]" data-testid="kpi-e2e-rate">
          {data.rates.lead_to_paid}%
        </span>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, sub, testId }) {
  return (
    <div data-testid={testId} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="font-inter text-xs text-slate-500">{label}</span>
      </div>
      <div className="font-manrope font-extrabold text-3xl text-white">{value}</div>
      {sub && <div className="font-inter text-[11px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
