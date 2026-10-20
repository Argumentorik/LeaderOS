import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, ShieldOff, ShieldPlus, UserPlus } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

/**
 * Admin-Rechte verwalten (Iter 191, Wunsch Stefan).
 * Das Recht hängt allein am Datenbank-Merkmal `is_admin`. Wer auf der festen
 * Liste im Code steht, bekommt es automatisch bei der ersten Anmeldung — ein
 * Entzug hier überstimmt die Liste dauerhaft.
 */
export const AdminRightsCard = ({ de = true }) => {
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    api.get('/admin/admins')
      .then((r) => setData(r.data))
      .catch((err) => { logger.error('admin list failed', err); setData({ admins: [], allowlist_pending: [], revoked: [] }); });
  }, []);

  useEffect(load, [load]);

  const setFlag = async (addr, isAdmin) => {
    const clean = addr.trim().toLowerCase();
    if (!clean) return;
    if (!isAdmin && !window.confirm(de ? `${clean} das Admin-Recht entziehen?` : `Revoke admin rights for ${clean}?`)) return;
    setBusy(clean);
    try {
      await api.put(`/admin/users/by-email/${encodeURIComponent(clean)}/admin`, { is_admin: isAdmin });
      toast.success(isAdmin
        ? (de ? `${clean} ist jetzt Admin` : `${clean} is now an admin`)
        : (de ? `${clean} ist kein Admin mehr` : `${clean} is no longer an admin`));
      if (isAdmin) setEmail('');
      load();
    } catch (err) {
      const d = err.response?.data?.detail;
      toast.error(
        d === 'user_not_found' ? (de ? 'Zu dieser Adresse gibt es kein Konto.' : 'No account with that email.')
        : d === 'cannot_change_own_admin' ? (de ? 'Das eigene Recht lässt sich hier nicht ändern.' : 'You cannot change your own rights here.')
        : (de ? 'Das hat nicht geklappt.' : 'That did not work.'));
    } finally { setBusy(''); }
  };

  return (
    <Card data-testid="admin-rights-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          <h3 className="text-sm font-black">{de ? 'Admin-Rechte' : 'Admin rights'}</h3>
          {data && <span className="ml-auto text-[11px] text-muted-foreground" data-testid="admin-rights-count">{data.count} {de ? 'Personen' : 'people'}</span>}
        </div>

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                 placeholder={de ? 'E-Mail des Kontos' : 'Account email'}
                 className="h-11 text-[13px]" data-testid="admin-rights-email" />
          <button type="button" onClick={() => setFlag(email, true)} disabled={!email.trim() || busy === email.trim().toLowerCase()}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap min-h-[44px] px-4 rounded-xl bg-[#BFFF00] text-black text-[12.5px] font-black disabled:opacity-50"
                  data-testid="admin-rights-grant">
            {busy === email.trim().toLowerCase() ? <Loader2 size={13} className="animate-spin" /> : <ShieldPlus size={13} />}
            {de ? 'Zum Admin machen' : 'Make admin'}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {de ? 'Das Konto muss schon bestehen. Die Person sieht den Admin-Bereich nach der nächsten Anmeldung.'
              : 'The account must already exist. The person sees the admin area after their next sign-in.'}
        </p>

        {!data ? (
          <p className="mt-4 text-[12px] text-muted-foreground">{de ? 'Lade…' : 'Loading…'}</p>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-black/[0.05] dark:divide-white/[0.06]" data-testid="admin-rights-list">
              {data.admins.map((a) => (
                <li key={a.user_id} className="flex items-center gap-3 py-2.5" data-testid={`admin-row-${a.email}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold truncate">{a.name || a.email}</p>
                    <p className="text-[11.5px] text-muted-foreground truncate">{a.email}</p>
                  </div>
                  {a.is_you ? (
                    <span className="shrink-0 text-[10.5px] font-black uppercase tracking-[0.12em] text-muted-foreground">{de ? 'du' : 'you'}</span>
                  ) : (
                    <button type="button" onClick={() => setFlag(a.email, false)} disabled={busy === a.email}
                            className="shrink-0 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl border border-black/[0.1] dark:border-white/[0.15] text-[12px] font-bold hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                            data-testid={`admin-revoke-${a.email}`}>
                      {busy === a.email ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
                      {de ? 'Entziehen' : 'Revoke'}
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {data.allowlist_pending?.length > 0 && (
              <div className="mt-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] p-3" data-testid="admin-rights-pending">
                <p className="flex items-center gap-1.5 text-[11.5px] font-bold">
                  <UserPlus size={12} /> {de ? 'Vorgemerkt — Recht kommt mit der ersten Anmeldung' : 'Pre-approved — rights apply on first sign-in'}
                </p>
                <p className="mt-1 text-[11.5px] text-muted-foreground break-words">{data.allowlist_pending.join(' · ')}</p>
              </div>
            )}

            {data.revoked?.length > 0 && (
              <div className="mt-3" data-testid="admin-rights-revoked">
                <p className="text-[11.5px] font-bold">{de ? 'Entzogen' : 'Revoked'}</p>
                {data.revoked.map((r) => (
                  <div key={r.email} className="flex items-center gap-2 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-muted-foreground">{r.email}</span>
                    <button type="button" onClick={() => setFlag(r.email, true)} disabled={busy === r.email}
                            className="shrink-0 min-h-[40px] px-3 rounded-xl text-[12px] font-bold text-[#4A6200] dark:text-[#BFFF00] hover:bg-[#BFFF00]/10"
                            data-testid={`admin-restore-${r.email}`}>
                      {de ? 'Wieder geben' : 'Restore'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
