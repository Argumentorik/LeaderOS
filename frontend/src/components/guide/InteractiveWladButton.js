import { useEffect, useState } from 'react';
import { Lock, Mic } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { InteractiveWladOverlay } from './InteractiveWladOverlay';

let statusPromise = null;
const loadStatus = () => {
  if (!statusPromise) {
    statusPromise = api.get('/guide/interactive/status').then((r) => r.data).catch((e) => { statusPromise = null; logger.warn('interactive status', e); return null; });
  }
  return statusPromise;
};
export const resetInteractiveStatus = () => { statusPromise = null; };

/** „Mit Wlad sprechen · Beta“ — gesperrt für alle, bis die Beta im Admin geöffnet ist (Admins sehen den Preview). */
export const InteractiveWladButton = ({ clip, de = true }) => {
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { loadStatus().then(setStatus); }, []);
  if (!status) return null;

  if (status.locked) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/70 cursor-not-allowed select-none"
            title={de ? 'Beta — wird schrittweise freigeschaltet' : 'Beta — rolling out gradually'} data-testid={`interactive-wlad-locked-${clip.slug}`}>
        <Lock size={11} /> {de ? 'Mit Wlad sprechen' : 'Talk to Wlad'}
        <span className="text-[8px] font-black px-1 py-[1px] rounded bg-muted text-muted-foreground tracking-wider">BETA</span>
      </span>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4A6200] dark:text-[#BFFF00] hover:opacity-80 transition-opacity"
              data-testid={`interactive-wlad-open-${clip.slug}`}>
        <Mic size={12} /> {de ? 'Mit Wlad sprechen' : 'Talk to Wlad'}
        <span className="text-[8px] font-black px-1 py-[1px] rounded bg-[#BFFF00] text-black tracking-wider">{status.admin_preview ? (de ? 'BETA · PREVIEW' : 'BETA · PREVIEW') : 'BETA'}</span>
      </button>
      {open && <InteractiveWladOverlay clip={clip} de={de} onClose={() => setOpen(false)} />}
    </>
  );
};
