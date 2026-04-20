export function UsersTable({ users }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h3 className="font-manrope font-bold text-white">Users ({users.length})</h3>
      </div>
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[#141414]">
            <tr className="border-b border-white/[0.04]">
              {["Name", "E-Mail", "Rolle", "Report", "License Key", "Erstellt"].map(h => (
                <th key={h} className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 50).map((u) => (
              <tr key={u.session_id || u.user_id || u.email} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                <td className="px-4 py-3 font-inter text-sm text-white">{u.name}</td>
                <td className="px-4 py-3 font-inter text-sm text-slate-400">{u.email}</td>
                <td className="px-4 py-3 font-inter text-xs text-slate-500">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${u.has_report ? "bg-[#C8FF00]/10 text-[#C8FF00]" : "bg-white/[0.03] text-slate-600"}`}>{u.has_report ? "Ja" : "Nein"}</span>
                </td>
                <td className="px-4 py-3">
                  {u.license_key ? <span className="font-mono text-xs text-[#C8FF00]/70">{u.license_key.key}</span> : <span className="text-slate-700 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 font-inter text-xs text-slate-600">{u.created_at?.slice(0, 16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TransactionsTable({ transactions }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h3 className="font-manrope font-bold text-white">Transaktionen ({transactions.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {["Name", "E-Mail", "Plan", "Betrag", "Status", "Key", "Datum"].map(h => (
                <th key={h} className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.session_id || `tx-${tx.created_at}`} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                <td className="px-4 py-3 font-inter text-sm text-white">{tx.name || "—"}</td>
                <td className="px-4 py-3 font-inter text-sm text-slate-400">{tx.email || "—"}</td>
                <td className="px-4 py-3 font-inter text-sm text-slate-400">{tx.plan}</td>
                <td className="px-4 py-3 font-inter text-sm text-[#C8FF00]">{tx.amount} EUR</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${tx.payment_status === "paid" ? "bg-[#C8FF00]/10 text-[#C8FF00]" : "bg-white/[0.04] text-slate-400"}`}>{tx.payment_status || tx.status}</span></td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{tx.license_key || "—"}</td>
                <td className="px-4 py-3 font-inter text-xs text-slate-600">{tx.created_at?.slice(0, 16)}</td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center font-inter text-sm text-slate-600">Keine Transaktionen</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BookingsTable({ bookings }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h3 className="font-manrope font-bold text-white">Termin-Anfragen ({bookings.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {["Datum", "Uhrzeit", "Name", "E-Mail", "Plan", "Status", "Erstellt"].map(h => (
                <th key={h} className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={`${b.date}-${b.time}-${b.email}`} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                <td className="px-4 py-3 font-inter text-sm text-white font-medium">{b.date}</td>
                <td className="px-4 py-3 font-inter text-sm text-white">{b.time} Uhr</td>
                <td className="px-4 py-3 font-inter text-sm text-slate-300">{b.name || "—"}</td>
                <td className="px-4 py-3 font-inter text-sm text-slate-400">{b.email || "—"}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#C8FF00]/10 text-[#C8FF00]">{b.plan}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${b.status === "confirmed" ? "bg-[#C8FF00]/10 text-[#C8FF00]" : "bg-white/[0.04] text-slate-400"}`}>{b.status}</span></td>
                <td className="px-4 py-3 font-inter text-xs text-slate-600">{b.created_at?.slice(0, 16)}</td>
              </tr>
            ))}
            {bookings.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center font-inter text-sm text-slate-600">Keine Termine</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EmailsTable({ emails }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h3 className="font-manrope font-bold text-white">Gesendete E-Mails ({emails.length})</h3>
      </div>
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[#141414]">
            <tr className="border-b border-white/[0.04]">
              {["Typ", "E-Mail", "Resend ID", "Gesendet"].map(h => (
                <th key={h} className="text-left px-4 py-3 font-inter text-xs text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emails.slice(0, 50).map((em) => (
              <tr key={em.resend_id || `${em.type}-${em.sent_at}`} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#C8FF00]/[0.06] text-[#C8FF00]">{em.type}</span></td>
                <td className="px-4 py-3 font-inter text-sm text-slate-400">{em.email}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{em.resend_id?.slice(0, 12)}...</td>
                <td className="px-4 py-3 font-inter text-xs text-slate-600">{em.sent_at?.slice(0, 16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
