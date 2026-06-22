import { useState, useEffect, useCallback } from "react";
import { Users, FileText, CreditCard, Key, Mail, TrendingUp, Calendar, RefreshCw } from "lucide-react";
import { KpiCards, ConversionFunnel } from "../components/admin/StatsCards";
import { KeysTable } from "../components/admin/KeysTable";
import { UsersTable, TransactionsTable, BookingsTable, EmailsTable } from "../components/admin/DataTables";

const API = process.env.REACT_APP_BACKEND_URL;

const TABS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "keys", label: "License Keys", icon: Key },
  { id: "users", label: "Users", icon: Users },
  { id: "transactions", label: "Transactions", icon: CreditCard },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "emails", label: "E-Mails", icon: Mail },
];

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [keys, setKeys] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [emails, setEmails] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, k, u, t, em, bk] = await Promise.all([
        fetch(`${API}/api/admin/stats`).then(r => r.json()),
        fetch(`${API}/api/license/list`).then(r => r.json()),
        fetch(`${API}/api/admin/users`).then(r => r.json()),
        fetch(`${API}/api/admin/transactions`).then(r => r.json()),
        fetch(`${API}/api/admin/emails`).then(r => r.json()),
        fetch(`${API}/api/booking/list`).then(r => r.json()),
      ]);
      setStats(s); setKeys(k.keys || []); setUsers(u.users || []);
      setTransactions(t.transactions || []); setEmails(em.emails || []);
      setBookings(bk.bookings || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { if (authenticated) fetchAll(); }, [authenticated, fetchAll]);

  const createKey = async (plan, email, name) => {
    const res = await fetch(`${API}/api/license/create`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, email, name }),
    });
    const data = await res.json();
    fetchAll();
    return data.key;
  };

  const revokeKey = async (key) => {
    await fetch(`${API}/api/license/revoke/${key}`, { method: "POST" });
    fetchAll();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
      } else {
        setAuthError("Falsches Passwort");
      }
    } catch {
      setAuthError("Login fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4" data-testid="admin-login">
        <form onSubmit={handleLogin} className="glass-card p-8 w-full max-w-sm">
          <h1 className="font-manrope font-bold text-xl text-white mb-6 text-center">Admin Login</h1>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" data-testid="admin-password" autoFocus
            className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] font-inter text-sm text-white placeholder:text-slate-600 focus:border-[#C8FF00]/30 focus:outline-none mb-4" />
          {authError && <div className="mb-4 text-sm text-red-400 font-inter" data-testid="admin-login-error">{authError}</div>}
          <button type="submit" disabled={authLoading || !password} data-testid="admin-login-btn" className="w-full py-3 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            {authLoading ? "Pruefe..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 px-4 md:px-8 pb-12" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-manrope font-extrabold text-2xl text-white">Leader OS Admin</h1>
            <p className="font-inter text-sm text-slate-500">Funnel Analytics & Management</p>
          </div>
          <button onClick={fetchAll} disabled={loading} className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-inter text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id ? "bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00]" : "bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:text-white hover:border-white/10"
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && stats && (
          <div className="space-y-6">
            <KpiCards stats={stats} />
            <ConversionFunnel stats={stats} />
          </div>
        )}
        {tab === "keys" && <KeysTable keys={keys} onCreateKey={createKey} onRevokeKey={revokeKey} />}
        {tab === "users" && <UsersTable users={users} />}
        {tab === "transactions" && <TransactionsTable transactions={transactions} />}
        {tab === "bookings" && <BookingsTable bookings={bookings} />}
        {tab === "emails" && <EmailsTable emails={emails} />}
      </div>
    </div>
  );
}
