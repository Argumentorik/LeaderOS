import { Trash2, Plus, X, Check } from "lucide-react";
import { useState } from "react";

export function KeysTable({ keys, onCreateKey, onRevokeKey }) {
  const [showCreate, setShowCreate] = useState(false);
  const [plan, setPlan] = useState("standard");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState(null);

  const handleCreate = async () => {
    const key = await onCreateKey(plan, email || null, name || null);
    if (key) setCreatedKey(key);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-manrope font-bold text-lg text-white">License Keys ({keys.length})</h3>
        <button onClick={() => { setShowCreate(true); setCreatedKey(null); }} className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Key erstellen
        </button>
      </div>

      {showCreate && (
        <div className="glass-card p-6 border border-[#C8FF00]/15">
          {createdKey ? (
            <div className="text-center py-4">
              <Check className="w-8 h-8 text-[#C8FF00] mx-auto mb-3" />
              <p className="font-inter text-sm text-slate-400 mb-2">Key erstellt:</p>
              <p className="font-manrope font-bold text-xl text-[#C8FF00] tracking-wider">{createdKey}</p>
              <button onClick={() => { setShowCreate(false); setCreatedKey(null); }} className="mt-4 text-sm text-slate-500 hover:text-white">Schließen</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={plan} onChange={e => setPlan(e.target.value)} className="h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm">
                <option value="standard">Standard (€997)</option>
                <option value="fasttrack">Fast Track (€6.970)</option>
                <option value="starter">Starter (€199)</option>
              </select>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (optional)" className="h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder:text-slate-600" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-Mail (optional)" className="h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder:text-slate-600" />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="flex-1 h-10 rounded-lg bg-[#C8FF00] text-[#0a0a0a] font-bold text-sm">Erstellen</button>
                <button onClick={() => setShowCreate(false)} className="h-10 w-10 rounded-lg bg-white/[0.04] flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["Key", "Plan", "Status", "E-Mail", "Erstellt", "Aktion"].map(h => (
                  <th key={h} className={`${h === "Aktion" ? "text-right" : "text-left"} px-4 py-3 font-inter text-xs text-slate-500 uppercase`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.key} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                  <td className="px-4 py-3 font-mono text-sm text-white">{k.key}</td>
                  <td className="px-4 py-3 font-inter text-sm text-slate-400">{k.plan}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${k.status === "active" ? "bg-[#C8FF00]/10 text-[#C8FF00]" : k.status === "used" ? "bg-white/[0.04] text-slate-400" : "bg-red-500/10 text-red-400"}`}>{k.status}</span>
                  </td>
                  <td className="px-4 py-3 font-inter text-sm text-slate-500">{k.email || "—"}</td>
                  <td className="px-4 py-3 font-inter text-xs text-slate-600">{k.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right">
                    {k.status === "active" && (
                      <button onClick={() => onRevokeKey(k.key)} className="text-red-400/60 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
