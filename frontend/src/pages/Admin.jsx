import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileText, CreditCard, Key, Mail, TrendingUp, ArrowRight, Plus, X, Check, Loader2, RefreshCw, Trash2 } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function Admin() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState(null);
  const [keys, setKeys] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [emails, setEmails] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyPlan, setNewKeyPlan] = useState("standard");
  const [newKeyEmail, setNewKeyEmail] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState(null);

  const ADMIN_PASS = "wladhub2026";

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASS) setAuthenticated(true);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, k, u, t, em] = await Promise.all([
        fetch(`${API}/api/admin/stats`).then(r => r.json()),
        fetch(`${API}/api/license/list`).then(r => r.json()),
        fetch(`${API}/api/admin/users`).then(r => r.json()),
        fetch(`${API}/api/admin/transactions`).then(r => r.json()),
        fetch(`${API}/api/admin/emails`).then(r => r.json()),
      ]);
      setStats(s);
      setKeys(k.keys || []);
      setUsers(u.users || []);
      setTransactions(t.transactions || []);
      setEmails(em.emails || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (authenticated) fetchAll(); }, [authenticated]);

  const createKey = async () => {
    const res = await fetch(`${API}/api/license/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newKeyPlan, email: newKeyEmail || null, name: newKeyName || null }),
    });
    const data = await res.json();
    setCreatedKey(data.key);
    fetchAll();
  };

  const revokeKey = async (key) => {
    await fetch(`${API}/api/license/revoke/${key}`, { method: "POST" });
    fetchAll();
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4" data-testid="admin-login">
        <form onSubmit={handleLogin} className="glass-card p-8 w-full max-w-sm">
          <h1 className="font-manrope font-bold text-xl text-white mb-6 text-center">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] font-inter text-sm text-white placeholder:text-slate-600 focus:border-[#C8FF00]/30 focus:outline-none mb-4"
            data-testid="admin-password"
          />
          <button type="submit" className="w-full py-3 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-bold" data-testid="admin-login-btn">
            Login
          </button>
        </form>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "keys", label: "License Keys", icon: Key },
    { id: "users", label: "Users", icon: Users },
    { id: "transactions", label: "Transactions", icon: CreditCard },
    { id: "emails", label: "E-Mails", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 px-4 md:px-8 pb-12" data-testid="admin-dashboard">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-manrope font-extrabold text-2xl text-white">WLADHUB Admin</h1>
            <p className="font-inter text-sm text-slate-500">Funnel Analytics & Management</p>
          </div>
          <button onClick={fetchAll} disabled={loading} className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-inter text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id
                  ? "bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00]"
                  : "bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:text-white hover:border-white/10"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && stats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: stats.overview.total_users, sub: `+${stats.today.users} heute`, icon: Users },
                { label: "Reports", value: stats.overview.total_reports, sub: `+${stats.today.reports} heute`, icon: FileText },
                { label: "Revenue", value: `€${stats.overview.total_revenue.toLocaleString()}`, sub: `${stats.transactions.paid} paid`, icon: CreditCard },
                { label: "License Keys", value: stats.overview.total_keys, sub: `${stats.keys.active} aktiv`, icon: Key },
              ].map((kpi, i) => (
                <div key={i} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-inter text-xs text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                    <kpi.icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="font-manrope font-extrabold text-2xl text-white mb-1">{kpi.value}</div>
                  <div className="font-inter text-xs text-[#C8FF00]/60">{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Conversion Funnel */}
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
          </div>
        )}

        {/* Keys Tab */}
        {tab === "keys" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-manrope font-bold text-lg text-white">License Keys ({keys.length})</h3>
              <button onClick={() => { setShowCreateKey(true); setCreatedKey(null); }} className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Key erstellen
              </button>
            </div>

            {/* Create Key Modal */}
            {showCreateKey && (
              <div className="glass-card p-6 border border-[#C8FF00]/15">
                {createdKey ? (
                  <div className="text-center py-4">
                    <Check className="w-8 h-8 text-[#C8FF00] mx-auto mb-3" />
                    <p className="font-inter text-sm text-slate-400 mb-2">Key erstellt:</p>
                    <p className="font-manrope font-bold text-xl text-[#C8FF00] tracking-wider">{createdKey}</p>
                    <button onClick={() => { setShowCreateKey(false); setCreatedKey(null); }} className="mt-4 text-sm text-slate-500 hover:text-white">Schließen</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select value={newKeyPlan} onChange={e => setNewKeyPlan(e.target.value)} className="h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm">
                      <option value="standard">Standard (€997)</option>
                      <option value="fasttrack">Fast Track (€4.997)</option>
                    </select>
                    <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Name (optional)" className="h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder:text-slate-600" />
                    <input value={newKeyEmail} onChange={e => setNewKeyEmail(e.target.value)} placeholder="E-Mail (optional)" className="h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder:text-slate-600" />
                    <div className="flex gap-2">
                      <button onClick={createKey} className="flex-1 h-10 rounded-lg bg-[#C8FF00] text-[#0a0a0a] font-bold text-sm">Erstellen</button>
                      <button onClick={() => setShowCreateKey(false)} className="h-10 w-10 rounded-lg bg-white/[0.04] flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Keys Table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Key</th>
                      <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Plan</th>
                      <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">E-Mail</th>
                      <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Erstellt</th>
                      <th className="text-right px-4 py-3 font-inter text-xs text-slate-500 uppercase">Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k, i) => (
                      <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                        <td className="px-4 py-3 font-mono text-sm text-white">{k.key}</td>
                        <td className="px-4 py-3 font-inter text-sm text-slate-400">{k.plan}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                            k.status === "active" ? "bg-[#C8FF00]/10 text-[#C8FF00]" :
                            k.status === "used" ? "bg-white/[0.04] text-slate-400" :
                            "bg-red-500/10 text-red-400"
                          }`}>{k.status}</span>
                        </td>
                        <td className="px-4 py-3 font-inter text-sm text-slate-500">{k.email || "—"}</td>
                        <td className="px-4 py-3 font-inter text-xs text-slate-600">{k.created_at?.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-right">
                          {k.status === "active" && (
                            <button onClick={() => revokeKey(k.key)} className="text-red-400/60 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.04]">
              <h3 className="font-manrope font-bold text-white">Users ({users.length})</h3>
            </div>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#141414]">
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Name</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">E-Mail</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Rolle</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Report</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">License Key</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Erstellt</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 50).map((u, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                      <td className="px-4 py-3 font-inter text-sm text-white">{u.name}</td>
                      <td className="px-4 py-3 font-inter text-sm text-slate-400">{u.email}</td>
                      <td className="px-4 py-3 font-inter text-xs text-slate-500">{u.role}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          u.has_report ? "bg-[#C8FF00]/10 text-[#C8FF00]" : "bg-white/[0.03] text-slate-600"
                        }`}>{u.has_report ? "Ja" : "Nein"}</span>
                      </td>
                      <td className="px-4 py-3">
                        {u.license_key ? (
                          <span className="font-mono text-xs text-[#C8FF00]/70">{u.license_key.key}</span>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-inter text-xs text-slate-600">{u.created_at?.slice(0, 16)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {tab === "transactions" && (
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.04]">
              <h3 className="font-manrope font-bold text-white">Transaktionen ({transactions.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Name</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">E-Mail</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Plan</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Betrag</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Key</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                      <td className="px-4 py-3 font-inter text-sm text-white">{tx.name || "—"}</td>
                      <td className="px-4 py-3 font-inter text-sm text-slate-400">{tx.email || "—"}</td>
                      <td className="px-4 py-3 font-inter text-sm text-slate-400">{tx.plan}</td>
                      <td className="px-4 py-3 font-inter text-sm text-[#C8FF00]">{tx.amount} EUR</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          tx.payment_status === "paid" ? "bg-[#C8FF00]/10 text-[#C8FF00]" : "bg-white/[0.04] text-slate-400"
                        }`}>{tx.payment_status || tx.status}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{tx.license_key || "—"}</td>
                      <td className="px-4 py-3 font-inter text-xs text-slate-600">{tx.created_at?.slice(0, 16)}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center font-inter text-sm text-slate-600">Keine Transaktionen</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Emails Tab */}
        {tab === "emails" && (
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.04]">
              <h3 className="font-manrope font-bold text-white">Gesendete E-Mails ({emails.length})</h3>
            </div>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#141414]">
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Typ</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">E-Mail</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Resend ID</th>
                    <th className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">Gesendet</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.slice(0, 50).map((em, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#C8FF00]/[0.06] text-[#C8FF00]">{em.type}</span>
                      </td>
                      <td className="px-4 py-3 font-inter text-sm text-slate-400">{em.email}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{em.resend_id?.slice(0, 12)}...</td>
                      <td className="px-4 py-3 font-inter text-xs text-slate-600">{em.sent_at?.slice(0, 16)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
