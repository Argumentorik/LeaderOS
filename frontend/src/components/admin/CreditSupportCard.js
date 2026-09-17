import { useCallback, useEffect, useState } from 'react';
import { Search, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { toast } from 'sonner';

/**
 * CreditSupportCard (Iter 185) — Support-Werkzeug für Guthaben-Fragen.
 *
 * Pro Kunde: Zugangsstufe, Restguthaben, Verbrauch und letzte Aktionen.
 * Guthaben einzeln auffüllbar ohne Vollzugang. Plus Liste „steckt fest".
 */
export const CreditSupportCard = () => {
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState(null);
  const [amount, setAmount] = useState(20);
  const [busy, setBusy] = useState(false);
  const [stuck, setStuck] = useState(null);

  const loadStuck = useCallback(async () => {
    try {
      const res = await api.get('/credits/admin/stuck');
      setStuck(res.data);
    } catch (e) { logger.warn('stuck list', e); }
  }, []);

  useEffect(() => { loadStuck(); }, [loadStuck]);

  const lookup = async (value) => {
    const q = (value ?? query).trim();
    if (!q) return;
    setBusy(true);
    try {
      const res = await api.get('/credits/admin/lookup', { params: { q } });
      setCustomer(res.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Kunde nicht gefunden');
      setCustomer(null);
    } finally { setBusy(false); }
  };

  const topup = async () => {
    if (!customer) return;
    setBusy(true);
    try {
      const res = await api.post(`/credits/admin/topup/${customer.user_id}`, { amount: Number(amount) || 20 });
      setCustomer(res.data);
      toast.success(`${amount} Credits gutgeschrieben`);
      loadStuck();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Auffüllen fehlgeschlagen');
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-card p-5 space-y-4"
         data-testid="credit-support-card">
      <div>
        <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#4A6200] dark:text-[#BFFF00]">
          <Zap size={11} /> Guthaben & Support
        </p>
        <p className="text-[12px] text-muted-foreground mt-1">
          Zugangsstufe, Restguthaben, Verbrauch und letzte Aktionen pro Kunde. Auffüllen gibt keinen Vollzugang.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') lookup(); }}
          placeholder="E-Mail oder User-ID"
          className="flex-1 h-10 rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-transparent px-3 text-[13px]"
          data-testid="credit-support-query"
        />
        <button type="button" onClick={() => lookup()} disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A0A0A] dark:bg-white dark:text-black text-white px-3.5 text-[12.5px] font-black disabled:opacity-50"
                data-testid="credit-support-search-btn">
          <Search size={13} /> Suchen
        </button>
      </div>

      {customer && (
        <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-3.5 space-y-2" data-testid="credit-support-result">
          <p className="text-[13px] font-bold">{customer.name || '—'} · {customer.email}</p>
          <p className="text-[12.5px] text-muted-foreground">
            Zugang: <strong className="text-foreground">{customer.unlimited ? 'unbegrenzt' : customer.tier}</strong>
            {' · '}Restguthaben: <strong className="text-foreground" data-testid="credit-support-balance">{customer.balance === -1 ? '∞' : customer.balance}</strong>
            {' · '}verbraucht: <strong className="text-foreground">{customer.total_used}</strong>
            {' · '}nächstes Nachfüllen: {customer.next_refill}
          </p>
          {(customer.recent || []).length > 0 && (
            <ul className="space-y-0.5">
              {customer.recent.slice(0, 6).map((h, i) => (
                <li key={`${h.at}-${i}`} className="text-[11.5px] text-muted-foreground">
                  {new Date(h.at).toLocaleString('de-DE')} · {h.action} ({h.cost})
                </li>
              ))}
            </ul>
          )}
          {!customer.unlimited && (
            <div className="flex items-center gap-2 pt-1">
              <input type="number" min="1" max="500" value={amount} onChange={(e) => setAmount(e.target.value)}
                     className="w-20 h-9 rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-transparent px-2 text-[13px]"
                     data-testid="credit-support-amount" />
              <button type="button" onClick={topup} disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#BFFF00] px-3.5 py-2 text-[12.5px] font-black text-black disabled:opacity-50"
                      data-testid="credit-support-topup-btn">
                <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> Guthaben auffüllen
              </button>
            </div>
          )}
        </div>
      )}

      <div>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
          <AlertTriangle size={11} /> Steckt fest ({stuck?.count ?? 0})
        </p>
        {stuck?.customers?.length ? (
          <ul className="mt-1.5 space-y-1" data-testid="credit-stuck-list">
            {stuck.customers.slice(0, 8).map((c) => (
              <li key={c.user_id} className="text-[12px] flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => { setQuery(c.email || c.user_id); lookup(c.email || c.user_id); }}
                        className="font-semibold underline decoration-dotted" data-testid={`credit-stuck-${c.user_id}`}>
                  {c.email || c.user_id}
                </button>
                <span className="text-muted-foreground">{c.tier} · {c.total_used} verbraucht · Guthaben {c.balance}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] text-muted-foreground mt-1" data-testid="credit-stuck-empty">
            Niemand hängt gerade an leerem Guthaben.
          </p>
        )}
      </div>
    </div>
  );
};

export default CreditSupportCard;
