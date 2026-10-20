import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { GraduationCap, Loader2, Upload, UserPlus, RefreshCw, CalendarPlus, Ban } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const DURATIONS = [6, 12, 18, 24];

const STATUS_META = {
  active: { label: 'Aktiv', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  expiring: { label: 'Läuft bald ab', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  expired: { label: 'Abgelaufen', cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
  revoked: { label: 'Entzogen', cls: 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400' },
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('de-DE'); } catch { return '—'; }
};

const inputCls = 'h-9 px-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-[12.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-[#BFFF00]/40 w-full';

export const MasterclassClientsManager = ({ de = true }) => {
  const [clients, setClients] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({
    email: '', name: '', duration_months: 12,
    start_date: new Date().toISOString().slice(0, 10), send_email: true,
  });
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/masterclass/clients');
      setClients(res.data.clients || []);
      setCounts(res.data.counts || {});
    } catch (e) {
      logger.warn('masterclass clients load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/admin/masterclass/clients', form);
      toast.success(res.data.created
        ? `Account für ${form.email} erstellt — Zugang sofort aktiv bis ${fmtDate(res.data.expires_at)}.`
        : `Masterclass-Zugang für ${form.email} aktualisiert (bis ${fmtDate(res.data.expires_at)}).`);
      setForm(f => ({ ...f, email: '', name: '' }));
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler beim Anlegen.');
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('send_emails', form.send_email ? 'true' : 'false');
      const res = await api.post('/admin/masterclass/clients/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { imported, errors } = res.data;
      toast.success(`${imported} Kunden importiert${errors?.length ? ` · ${errors.length} Fehler` : ''}.`);
      if (errors?.length) logger.warn('CSV import errors', errors);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'CSV-Import fehlgeschlagen.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleExtend = async (email) => {
    try {
      const res = await api.patch(`/admin/masterclass/clients/${encodeURIComponent(email)}`, { extend_months: 6 });
      toast.success(`${email} verlängert bis ${fmtDate(res.data.expires_at)}.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Verlängerung fehlgeschlagen.');
    }
  };

  const handleRevoke = async (email) => {
    if (!window.confirm(`Masterclass-Zugang für ${email} wirklich entziehen?`)) return;
    try {
      await api.delete(`/admin/masterclass/clients/${encodeURIComponent(email)}`);
      toast.success(`Zugang für ${email} entzogen.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Entzug fehlgeschlagen.');
    }
  };

  return (
    <Card data-testid="masterclass-clients-manager" className="border-black/10 dark:border-white/10">
      <CardContent className="p-5 space-y-5">
        {/* Add form */}
        <form onSubmit={handleAdd} className="space-y-3" data-testid="mc-add-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <input
              type="email" required placeholder="E-Mail des Kunden"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={inputCls} data-testid="mc-email-input"
            />
            <input
              type="text" placeholder="Name (optional)"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls} data-testid="mc-name-input"
            />
            <select
              value={form.duration_months}
              onChange={e => setForm(f => ({ ...f, duration_months: Number(e.target.value) }))}
              className={inputCls} data-testid="mc-duration-select"
            >
              {DURATIONS.map(m => <option key={m} value={m}>{m} Monate</option>)}
            </select>
            <input
              type="date" required
              value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              className={inputCls} data-testid="mc-start-input"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit" disabled={saving}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#BFFF00] text-black text-[12.5px] font-bold hover:bg-[#d4ff4d] transition-colors disabled:opacity-50"
              data-testid="mc-add-btn"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
              Kunde anlegen
            </button>
            <label className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox" checked={form.send_email}
                onChange={e => setForm(f => ({ ...f, send_email: e.target.checked }))}
                className="accent-[#BFFF00]" data-testid="mc-send-email-checkbox"
              />
              Welcome-Mail mit Login-Anleitung senden
            </label>
            <div className="flex-1" />
            <input
              ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
              onChange={e => handleImport(e.target.files?.[0])} data-testid="mc-csv-input"
            />
            <button
              type="button" disabled={importing}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-black/10 dark:border-white/15 text-[12.5px] font-semibold text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
              data-testid="mc-csv-btn"
            >
              {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              CSV-Import
            </button>
            <button
              type="button" onClick={load}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-black/10 dark:border-white/15 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="mc-refresh-btn" aria-label="Neu laden"
            >
              <RefreshCw size={13} />
            </button>
          </div>
          <p className="text-[10.5px] text-muted-foreground">
            CSV-Spalten: <code className="font-mono">email; name; laufzeit; startdatum</code> — Laufzeit in Monaten (6/12/18), Datum als TT.MM.JJJJ oder JJJJ-MM-TT. Trennzeichen , oder ; funktionieren beide.
          </p>
        </form>

        {/* Status counts */}
        <div className="flex flex-wrap gap-2" data-testid="mc-counts">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <Badge key={key} className={`border-0 text-[10px] font-bold ${meta.cls}`}>
              {meta.label}: {counts[key] || 0}
            </Badge>
          ))}
        </div>

        {/* Client list */}
        {loading ? (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-6 justify-center">
            <Loader2 size={14} className="animate-spin" /> Lade Kunden…
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="mc-empty-state">
            <GraduationCap size={26} className="mx-auto mb-2 opacity-40" />
            <p className="text-[12.5px]">Noch keine Masterclass-Kunden angelegt.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1" data-testid="mc-client-list">
            {clients.map(c => {
              const meta = STATUS_META[c.status] || STATUS_META.active;
              return (
                <div
                  key={c.email}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06]"
                  data-testid={`mc-client-row-${c.email}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-foreground truncate">{c.name || c.email}</p>
                    <p className="text-[10.5px] text-muted-foreground truncate">{c.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-semibold text-foreground">{c.duration_months} Mon. · bis {fmtDate(c.expires_at)}</p>
                    <p className="text-[10px] text-muted-foreground">Start {fmtDate(c.started_at)}{c.days_left != null && c.days_left > 0 ? ` · noch ${Math.ceil(c.days_left)} Tage` : ''}</p>
                  </div>
                  <Badge className={`border-0 text-[9.5px] font-bold shrink-0 ${meta.cls}`}>{meta.label}</Badge>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleExtend(c.email)}
                      className="h-7 px-2 inline-flex items-center gap-1 rounded-md text-[10px] font-bold text-[#6B8A00] dark:text-[#BFFF00] hover:bg-[#BFFF00]/10 transition-colors"
                      title="+6 Monate verlängern" data-testid={`mc-extend-${c.email}`}
                    >
                      <CalendarPlus size={11} /> +6M
                    </button>
                    {c.status !== 'revoked' && (
                      <button
                        onClick={() => handleRevoke(c.email)}
                        className="h-7 px-2 inline-flex items-center gap-1 rounded-md text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Zugang entziehen" data-testid={`mc-revoke-${c.email}`}
                      >
                        <Ban size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
