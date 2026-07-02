import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Ticket, Copy, Loader2, Ban, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const PACKAGE_OPTIONS = [
  { id: 'leadership_os', label: 'Leadership OS (Standard · 997€)' },
  { id: 'leadership_os_plus', label: 'Leadership OS PLUS (4.797€)' },
];

const STATUS_STYLE = {
  active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  redeemed: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  revoked: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

export const LicenseKeysManager = ({ de = true }) => {
  const [keys, setKeys] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ package_id: 'leadership_os', count: 1, note: '' });
  const [generated, setGenerated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/license-keys');
      setKeys(res.data.keys || []);
      setCounts(res.data.counts || {});
    } catch (err) { logger.error('License keys load failed', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    setGenerated(null);
    try {
      const res = await api.post('/admin/license-keys/generate', {
        package_id: form.package_id,
        count: Number(form.count) || 1,
        note: form.note,
      });
      setGenerated(res.data);
      toast.success(de ? `${res.data.count} Key(s) generiert` : `${res.data.count} key(s) generated`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || (de ? 'Generierung fehlgeschlagen' : 'Generation failed'));
    } finally { setGenerating(false); }
  };

  const copyAll = () => {
    navigator.clipboard.writeText((generated?.keys || []).join('\n'));
    toast.success(de ? 'Keys kopiert' : 'Keys copied');
  };

  const revoke = async (keyId) => {
    try {
      await api.post(`/admin/license-keys/${keyId}/revoke`);
      toast.success(de ? 'Key deaktiviert' : 'Key revoked');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || (de ? 'Fehler' : 'Error'));
    }
  };

  const inputCls = "h-9 px-3 rounded-lg bg-gray-50 dark:bg-muted/40 border border-black/[0.08] dark:border-white/[0.08] text-[12px] focus:outline-none focus:border-[#BFFF00]/50";

  return (
    <Card className="border-black/[0.06] dark:border-white/[0.06]" data-testid="license-keys-manager">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Ticket size={12} /> {de ? 'Lizenz-Keys (Sales)' : 'License Keys (Sales)'}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {counts.active || 0} {de ? 'aktiv' : 'active'} · {counts.redeemed || 0} {de ? 'eingelöst' : 'redeemed'}
            </span>
            <button onClick={load} className="p-1.5 rounded-lg hover:bg-muted transition-colors" data-testid="license-refresh-btn">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Generate form */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select
            value={form.package_id}
            onChange={(e) => setForm(f => ({ ...f, package_id: e.target.value }))}
            className={inputCls}
            data-testid="license-package-select"
          >
            {PACKAGE_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <input
            type="number" min={1} max={100}
            value={form.count}
            onChange={(e) => setForm(f => ({ ...f, count: e.target.value }))}
            className={`${inputCls} w-16`}
            data-testid="license-count-input"
          />
          <input
            value={form.note}
            onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder={de ? 'Notiz (z.B. Kunde)' : 'Note (e.g. customer)'}
            className={`${inputCls} flex-1 min-w-[120px]`}
            data-testid="license-note-input"
          />
          <button
            onClick={generate}
            disabled={generating}
            className="h-9 px-4 rounded-lg bg-[#BFFF00] text-[#0A0A0A] text-[12px] font-black hover:bg-[#d4ff4d] transition-colors disabled:opacity-50 flex items-center gap-1.5"
            data-testid="license-generate-btn"
          >
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Ticket size={12} />}
            {de ? 'Generieren' : 'Generate'}
          </button>
        </div>

        {/* Freshly generated keys — shown ONCE */}
        {generated && (
          <div className="mb-4 p-3 rounded-xl bg-[#BFFF00]/8 border border-[#BFFF00]/25" data-testid="license-generated-box">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#4A6200] dark:text-[#BFFF00]">
                {de ? '⚠️ Nur jetzt sichtbar — sicher kopieren!' : '⚠️ Visible only now — copy safely!'}
              </p>
              <button onClick={copyAll} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-[#BFFF00]/20 hover:bg-[#BFFF00]/30 transition-colors" data-testid="license-copy-all-btn">
                <Copy size={10} /> {de ? 'Alle kopieren' : 'Copy all'}
              </button>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {generated.keys.map(k => (
                <code key={k} className="block text-[12px] font-mono font-bold tracking-wider">{k}</code>
              ))}
            </div>
          </div>
        )}

        {/* Key list */}
        {loading ? (
          <div className="py-6 text-center"><Loader2 size={16} className="mx-auto animate-spin text-[#BFFF00]" /></div>
        ) : keys.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60">{de ? 'Noch keine Keys generiert.' : 'No keys generated yet.'}</p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto" data-testid="license-keys-list">
            {keys.map(k => (
              <div key={k.key_id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-muted/30 text-[11px]">
                <div className="min-w-0 flex-1">
                  <code className="font-mono font-bold">{k.key_masked}</code>
                  <p className="text-[9.5px] text-muted-foreground truncate">
                    {k.package_name} · {(k.created_at || '').split('T')[0]}
                    {k.note ? ` · ${k.note}` : ''}
                    {k.redeemed_email ? ` · → ${k.redeemed_email}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <Badge className={`text-[8px] font-bold border-0 ${STATUS_STYLE[k.status] || ''}`}>{k.status}</Badge>
                  {k.status === 'active' && (
                    <button onClick={() => revoke(k.key_id)} title={de ? 'Deaktivieren' : 'Revoke'} className="p-1 rounded-md hover:bg-rose-500/10 text-rose-500 transition-colors" data-testid={`license-revoke-${k.key_id}`}>
                      <Ban size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
