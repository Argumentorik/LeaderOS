/**
 * GDPR-Rights panel · Auskunft (export) + Löschung (delete) für Profile-Tab.
 *
 * Backend:
 *   GET  /api/gdpr/export   → JSON download (rate-limited 1/h)
 *   POST /api/gdpr/delete   → cascading erasure, requires {"confirm":"DELETE-MY-ACCOUNT"}
 */
import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Download, AlertTriangle, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export const GdprSection = ({ de }) => {
  const { logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const REQUIRED = 'DELETE-MY-ACCOUNT';

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/gdpr/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leader-os-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(de ? 'Export erstellt · Download startet' : 'Export created · download started');
    } catch (e) {
      if (e?.response?.status === 429) {
        toast.error(de ? 'Bitte 1 Stunde warten zwischen Exports' : 'Please wait 1 hour between exports');
      } else {
        toast.error(de ? 'Export fehlgeschlagen' : 'Export failed');
      }
    } finally {
      setExporting(false);
    }
  };

  const onDelete = async () => {
    if (confirm !== REQUIRED) return;
    setDeleting(true);
    try {
      await api.post('/gdpr/delete', { confirm: REQUIRED });
      toast.success(de ? 'Konto gelöscht. Auf Wiedersehen.' : 'Account deleted. Farewell.');
      setTimeout(() => logout(), 1500);
    } catch {
      toast.error(de ? 'Löschung fehlgeschlagen · bitte Support kontaktieren' : 'Deletion failed · contact support');
      setDeleting(false);
    }
  };

  return (
    <Card className="border-black/[0.04] dark:border-white/[0.06]" data-testid="gdpr-section">
      <CardContent className="p-5 space-y-5">
        <div>
          <h3 className="text-sm font-black">{de ? 'Datenschutz & DSGVO' : 'Privacy & GDPR'}</h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            {de ? 'Deine Rechte als betroffene Person.' : 'Your rights as a data subject.'}
          </p>
        </div>

        {/* Export · Art. 20 DSGVO */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-muted/20">
          <div className="min-w-0">
            <p className="text-[13px] font-bold">{de ? 'Meine Daten exportieren' : 'Export my data'}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{de ? 'JSON-Datei mit allem, was wir über dich gespeichert haben (Art. 20 DSGVO).' : 'JSON file with everything we store about you (GDPR Art. 20).'}</p>
          </div>
          <Button size="sm" onClick={onExport} disabled={exporting} className="h-8 text-[11px] shrink-0" variant="outline" data-testid="gdpr-export-btn">
            <Download size={12} className="mr-1.5" /> {exporting ? (de ? 'Lade…' : 'Loading…') : (de ? 'Exportieren' : 'Export')}
          </Button>
        </div>

        {/* Delete · Art. 17 DSGVO */}
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.04]" data-testid="gdpr-delete-zone">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-rose-600 dark:text-rose-300">{de ? 'Konto endgültig löschen' : 'Delete account permanently'}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {de
                  ? 'Unwiderruflich. Alle Chats, Tagesfragen, Video-Antworten und Fortschritte werden sofort gelöscht (Art. 17 DSGVO).'
                  : 'Irreversible. All chats, daily check-ins, video answers and progress are deleted immediately (GDPR Art. 17).'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-muted-foreground">{de ? 'Tippe' : 'Type'} <code className="bg-black/10 dark:bg-white/10 px-1 rounded text-rose-500">{REQUIRED}</code> {de ? 'zum Bestätigen:' : 'to confirm:'}</p>
            <Input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={REQUIRED} className="h-8 text-[12px] font-mono" data-testid="gdpr-delete-confirm-input" />
            <Button size="sm" onClick={onDelete} disabled={confirm !== REQUIRED || deleting} className="w-full h-8 text-[11px] bg-rose-600 hover:bg-rose-700 text-white disabled:bg-rose-600/30 disabled:cursor-not-allowed" data-testid="gdpr-delete-btn">
              <Trash2 size={12} className="mr-1.5" /> {deleting ? (de ? 'Lösche…' : 'Deleting…') : (de ? 'Endgültig löschen' : 'Delete permanently')}
            </Button>
          </div>
        </div>

        {/* Quick legal links */}
        <div className="flex flex-wrap gap-3 text-[11px] pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
          <a href="/datenschutz" className="text-muted-foreground hover:text-[#BFFF00] hover:underline" data-testid="gdpr-link-privacy">{de ? 'Datenschutzerklärung' : 'Privacy policy'}</a>
          <a href="/agb" className="text-muted-foreground hover:text-[#BFFF00] hover:underline" data-testid="gdpr-link-agb">AGB</a>
          <a href="/widerruf" className="text-muted-foreground hover:text-[#BFFF00] hover:underline" data-testid="gdpr-link-widerruf">{de ? 'Widerrufsbelehrung' : 'Withdrawal right'}</a>
          <a href="/impressum" className="text-muted-foreground hover:text-[#BFFF00] hover:underline" data-testid="gdpr-link-impressum">Impressum</a>
        </div>
      </CardContent>
    </Card>
  );
};
