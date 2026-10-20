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

  const update = async (patch) => {
    setBusy(true);
    try {
      await api.put('/guide/interactive/admin', patch);
      resetInteractiveStatus();
      await load();
    } catch (e) { logger.error('beta toggle', e); }
    finally { setBusy(false); }
  };
  const toggle = () => update({ enabled: !status.enabled });

  if (!status) return null;
  return (
    <Card className="p-3 bg-card border-border flex flex-wrap items-center gap-3" data-testid="guide-interactive-beta-card">
      <Sparkles size={14} className="text-[#BFFF00]" />
      <div className="text-[11px] text-muted-foreground flex-1 min-w-[220px]">
        <span className="font-bold text-foreground">Interaktiver Wlad (Beta)</span> — Sprechen mit Wlad am Video, Antwort in {voiceCloned ? 'Wlads Klonstimme' : 'Standardstimme (Klon fehlt)'}.
        <span className={`ml-2 font-bold ${status.enabled ? 'text-[#5a7a00] dark:text-[#BFFF00]' : 'text-amber-500'}`} data-testid="guide-interactive-beta-state">
          {status.enabled ? 'für alle Nutzer unbegrenzt offen' : `Leader-OS/PLUS ${status.paid_open ? 'offen' : 'gesperrt'} · Free: ${status.trial_total} Test-Gespräche`}
        </span>
        <label className="ml-3 inline-flex items-center gap-1 text-[10px]">
          Free-Tests
          <input type="number" min={0} max={10} value={status.trial_total} disabled={busy}
                 onChange={(e) => update({ free_trial_turns: Number(e.target.value) })}
                 className="w-12 h-6 rounded border border-border bg-background px-1 text-[11px]" data-testid="guide-interactive-trial-input" />
        </label>
        <button type="button" disabled={busy} onClick={() => update({ paid_open: !status.paid_open })}
                className="ml-2 text-[10px] underline text-muted-foreground hover:text-foreground" data-testid="guide-interactive-paid-toggle">
          {status.paid_open ? 'für Kunden sperren' : 'für Kunden öffnen'}
        </button>
      </div>
      <Button size="sm" variant={status.enabled ? 'outline' : 'default'} disabled={busy} onClick={toggle}
              className={`h-7 text-[11px] ${status.enabled ? '' : 'bg-[#BFFF00] text-black hover:bg-[#d4ff4d]'}`} data-testid="guide-interactive-beta-toggle">
        {busy ? <Loader2 size={12} className="animate-spin mr-1" /> : status.enabled ? <Lock size={12} className="mr-1" /> : <Unlock size={12} className="mr-1" />}
        {status.enabled ? 'Unbegrenzt-Modus aus' : 'Für alle unbegrenzt öffnen'}
      </Button>
    </Card>
  );
};
