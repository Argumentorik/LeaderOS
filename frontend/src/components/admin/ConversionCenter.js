import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Mail, Eye, Check, X, Loader2, Send, ShieldCheck, Users } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const STATUS_META = {
  approved: { label: 'Freigegeben', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  rejected: { label: 'Abgelehnt', cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
  draft: { label: 'Entwurf — wird NICHT versendet', cls: 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400' },
};

export const ConversionCenter = ({ de = true }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/conversion/sequence');
      setData(res.data);
    } catch (e) {
      logger.warn('conversion sequence load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openPreview = async (id) => {
    setBusy(`preview-${id}`);
    try {
      const res = await api.get(`/admin/conversion/preview/${id}`);
      setPreview(res.data);
    } catch {
      toast.error('Vorschau fehlgeschlagen.');
    } finally {
      setBusy('');
    }
  };

  const setApproval = async (id, status) => {
    setBusy(`appr-${id}`);
    try {
      await api.post(`/admin/conversion/${id}/approval`, { status });
      toast.success(status === 'approved' ? 'Freigegeben — geht beim nächsten Cron-Lauf raus.' : status === 'rejected' ? 'Abgelehnt — wird nicht versendet.' : 'Auf Entwurf zurückgesetzt.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler.');
    } finally {
      setBusy('');
    }
  };

  const testSend = async (id) => {
    const to = window.prompt('Test-E-Mail senden an:', '');
    if (!to) return;
    setBusy(`test-${id}`);
    try {
      const res = await api.post('/admin/conversion/test-send', { email_id: id, to });
      res.data.sent ? toast.success(`Test-Mail an ${to} gesendet.`) : toast.error(res.data.error || 'Versand fehlgeschlagen.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Versand fehlgeschlagen.');
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-8 justify-center"><Loader2 size={14} className="animate-spin" /> Lade Sequenz…</div>;
  }
  if (!data) return null;

  return (
    <div className="space-y-4" data-testid="conversion-center">
      {/* Safety banner */}
      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${data.sending_live
        ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
        : 'border-amber-500/30 bg-amber-500/[0.06]'}`}
        data-testid="conversion-safety-banner"
      >
        <ShieldCheck size={18} className={data.sending_live ? 'text-emerald-500 mt-0.5' : 'text-amber-500 mt-0.5'} />
        <div className="text-[12px] leading-relaxed text-foreground">
          <b>{data.approved_count} von {data.total} E-Mails freigegeben.</b>{' '}
          {data.sending_live
            ? 'Freigegebene E-Mails werden beim täglichen Cron-Lauf an die passenden Segmente versendet (max. 1 Mail pro Person pro Tag, jede Mail nur einmal).'
            : 'Es wird NICHTS versendet, solange keine E-Mail freigegeben ist. Prüfe jede Mail per Vorschau, sende dir einen Test und gib dann einzeln frei.'}
        </div>
      </div>

      {/* Segments */}
      <Card className="border-black/10 dark:border-white/10">
        <CardContent className="p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground mb-3 flex items-center gap-1.5"><Users size={11} /> Segmente · Wer ist wo?</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2" data-testid="conversion-segments">
            {Object.entries(data.segment_labels).map(([key, label]) => (
              <div key={key} className="px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06]">
                <p className="text-lg font-black text-foreground leading-none">{data.segment_counts[key] ?? 0}</p>
                <p className="text-[9.5px] text-muted-foreground mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email sequence */}
      <div className="space-y-2" data-testid="conversion-email-list">
        {data.emails.map(e => {
          const meta = STATUS_META[e.status] || STATUS_META.draft;
          return (
            <Card key={e.id} className="border-black/10 dark:border-white/10">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#BFFF00]/12 flex items-center justify-center shrink-0">
                    <Mail size={15} className="text-[#6B8A00] dark:text-[#BFFF00]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-black text-foreground">E-Mail {e.n}/8 · {e.subject.replace('{name}', 'Vorname')}</p>
                      <Badge className={`border-0 text-[9px] font-bold ${meta.cls}`} data-testid={`conv-status-${e.id}`}>{meta.label}</Badge>
                      {e.sent_count > 0 && <Badge className="border-0 text-[9px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400">{e.sent_count}× versendet</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1"><b>Zweck:</b> {e.purpose}</p>
                    <p className="text-[11px] text-muted-foreground"><b>Wann:</b> {e.trigger} · <b>An:</b> {e.segment_label}</p>
                    <p className="text-[11px] text-muted-foreground"><b>Danach:</b> {e.expected_next}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <button onClick={() => openPreview(e.id)} disabled={busy === `preview-${e.id}`}
                      className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/15 text-[11px] font-bold text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                      data-testid={`conv-preview-${e.id}`}>
                      {busy === `preview-${e.id}` ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />} Vorschau
                    </button>
                    <button onClick={() => testSend(e.id)} disabled={busy === `test-${e.id}`}
                      className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/15 text-[11px] font-bold text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                      data-testid={`conv-test-${e.id}`}>
                      <Send size={11} /> Test
                    </button>
                    {e.status !== 'approved' && (
                      <button onClick={() => setApproval(e.id, 'approved')} disabled={busy === `appr-${e.id}`}
                        className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-[#BFFF00] text-black text-[11px] font-black hover:bg-[#d4ff4d] transition-colors"
                        data-testid={`conv-approve-${e.id}`}>
                        <Check size={11} /> Freigeben
                      </button>
                    )}
                    {e.status !== 'rejected' && (
                      <button onClick={() => setApproval(e.id, e.status === 'approved' ? 'draft' : 'rejected')} disabled={busy === `appr-${e.id}`}
                        className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
                        data-testid={`conv-reject-${e.id}`}>
                        <X size={11} /> {e.status === 'approved' ? 'Stoppen' : 'Ablehnen'}
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" data-testid="conv-preview-modal">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative w-full max-w-2xl h-[82vh] bg-background rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <p className="text-[12.5px] font-black text-foreground truncate pr-3">Betreff: {preview.subject}</p>
              <button onClick={() => setPreview(null)} className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground" data-testid="conv-preview-close">
                <X size={14} />
              </button>
            </div>
            <iframe title="E-Mail-Vorschau" srcDoc={preview.html} className="flex-1 w-full bg-[#0A0A0A]" sandbox="" />
          </div>
        </div>
      )}
    </div>
  );
};
