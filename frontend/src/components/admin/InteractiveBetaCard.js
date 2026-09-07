import { useEffect, useState } from 'react';
import { Lock, Unlock, Loader2, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { resetInteractiveStatus } from '../guide/InteractiveWladButton';

/** Admin-Schalter: Interaktiver Wlad (Beta) für alle öffnen oder sperren. Gesperrt = nur Admin-Preview. */
export const InteractiveBetaCard = ({ voiceCloned }) => {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/guide/interactive/status').then((r) => setStatus(r.data)).catch((e) => logger.warn('beta status', e));
  useEffect(() => { load(); }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      await api.put('/guide/interactive/admin', { enabled: !status.enabled });
      resetInteractiveStatus();
      await load();
    } catch (e) { logger.error('beta toggle', e); }
    finally { setBusy(false); }
  };

  if (!status) return null;
  return (
    <Card className="p-3 bg-card border-border flex flex-wrap items-center gap-3" data-testid="guide-interactive-beta-card">
      <Sparkles size={14} className="text-[#BFFF00]" />
      <div className="text-[11px] text-muted-foreground flex-1 min-w-[220px]">
        <span className="font-bold text-foreground">Interaktiver Wlad (Beta)</span> — Sprechen mit Wlad am Video, Antwort in {voiceCloned ? 'Wlads Klonstimme' : 'Standardstimme (Klon fehlt)'}.
        <span className={`ml-2 font-bold ${status.enabled ? 'text-[#5a7a00] dark:text-[#BFFF00]' : 'text-amber-500'}`} data-testid="guide-interactive-beta-state">
          {status.enabled ? 'für alle Nutzer offen' : 'gesperrt · nur Admin-Preview'}
        </span>
      </div>
      <Button size="sm" variant={status.enabled ? 'outline' : 'default'} disabled={busy} onClick={toggle}
              className={`h-7 text-[11px] ${status.enabled ? '' : 'bg-[#BFFF00] text-black hover:bg-[#d4ff4d]'}`} data-testid="guide-interactive-beta-toggle">
        {busy ? <Loader2 size={12} className="animate-spin mr-1" /> : status.enabled ? <Lock size={12} className="mr-1" /> : <Unlock size={12} className="mr-1" />}
        {status.enabled ? 'Beta sperren' : 'Beta für alle öffnen'}
      </Button>
    </Card>
  );
};
