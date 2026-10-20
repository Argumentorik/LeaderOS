import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { UserCog, Sparkles, Trash2, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const TIERS = ['standard', 'accelerator', 'enterprise'];

export const UserManageCard = ({ de = true }) => {
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState('accelerator');
  const [busy, setBusy] = useState(null);

  const clean = email.trim().toLowerCase();

  const grant = async () => {
    if (!clean) return;
    setBusy('grant');
    try {
      await api.post(`/admin/users/set-tier/${encodeURIComponent(clean)}?tier=${tier}`);
      toast.success(de ? `${clean} freigeschaltet (${tier}) ✓` : `${clean} upgraded to ${tier} ✓`);
    } catch (err) {
      toast.error(err.response?.data?.detail || (de ? 'Fehler beim Freischalten' : 'Upgrade failed'));
    } finally { setBusy(null); }
  };

  const remove = async () => {
    if (!clean) return;
    const ok = window.confirm(de
      ? `${clean} UNWIDERRUFLICH löschen (inkl. aller Daten)?`
      : `Permanently delete ${clean} (incl. all data)?`);
    if (!ok) return;
    setBusy('delete');
    try {
      const r = await api.delete(`/admin/users/by-email/${encodeURIComponent(clean)}`);
      toast.success(de ? `${clean} gelöscht ✓` : `${clean} deleted ✓`, {
        description: JSON.stringify(r.data.related || {}),
      });
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.detail || (de ? 'Löschen fehlgeschlagen' : 'Delete failed'));
    } finally { setBusy(null); }
  };

  return (
    <Card data-testid="user-manage-card">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <UserCog size={15} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          <h3 className="text-sm font-black">{de ? 'User verwalten' : 'Manage user'}</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            data-testid="user-manage-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={de ? 'E-Mail des Users…' : 'User email…'}
            className="flex-1"
          />
          <select
            data-testid="user-manage-tier"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
          >
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={grant}
            disabled={!clean || !!busy}
            data-testid="user-manage-grant-btn"
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[12px] font-bold transition-all disabled:opacity-40"
          >
            {busy === 'grant' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {de ? 'Vollzugriff freischalten' : 'Grant full access'}
          </button>
          <button
            onClick={remove}
            disabled={!clean || !!busy}
            data-testid="user-manage-delete-btn"
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-[12px] font-bold transition-colors disabled:opacity-40"
          >
            {busy === 'delete' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {de ? 'Löschen' : 'Delete'}
          </button>
        </div>
        <p className="text-[10.5px] text-muted-foreground">
          {de
            ? 'Freischalten setzt den Tier inkl. unbegrenzter Credits. Löschen entfernt User + alle Daten (Admins geschützt).'
            : 'Grant sets the tier incl. unlimited credits. Delete removes user + all data (admins protected).'}
        </p>
      </CardContent>
    </Card>
  );
};

export default UserManageCard;
