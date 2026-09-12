import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mic, Sparkles } from 'lucide-react';
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

const Badge = ({ children, lime }) => (
  <span className={`text-[8px] font-black px-1 py-[1px] rounded tracking-wider ${lime ? 'bg-[#BFFF00] text-black' : 'bg-muted text-muted-foreground'}`}>{children}</span>
);

/** „Mit Wlad sprechen · Beta“: offen für Leader-OS/PLUS, Free darf 3 Gespräche testen, danach Upsell. */
export const InteractiveWladButton = ({ clip, de = true }) => {
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { loadStatus().then(setStatus); }, []);
  if (!status) return null;

  const close = () => { setOpen(false); resetInteractiveStatus(); loadStatus().then(setStatus); };

  if (status.locked) {
    const exhausted = status.trial && status.trial_total > 0;
    return (
      <Link to="/coaching" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/80 hover:text-foreground transition-colors"
            title={exhausted ? (de ? 'Deine Test-Gespräche sind aufgebraucht — mit Leader-OS unbegrenzt' : 'Trial used up — unlimited with Leader-OS') : (de ? 'Wird schrittweise freigeschaltet' : 'Rolling out gradually')}
            data-testid={`interactive-wlad-locked-${clip.slug}`}>
        <Lock size={11} /> {de ? 'Mit Wlad sprechen' : 'Talk to Wlad'}
        <Badge>{exhausted ? (de ? 'TEST AUFGEBRAUCHT · UPGRADE' : 'TRIAL USED · UPGRADE') : (de ? 'BALD' : 'SOON')}</Badge>
      </Link>
    );
  }
  const label = status.admin_preview ? 'PREVIEW'
    : status.trial ? (de ? `${status.trial_left} TEST${status.trial_left === 1 ? '' : 'S'}` : `${status.trial_left} TRIAL${status.trial_left === 1 ? '' : 'S'}`)
      : (de ? 'NEU' : 'NEW');
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4A6200] dark:text-[#BFFF00] hover:opacity-80 transition-opacity"
              data-testid={`interactive-wlad-open-${clip.slug}`}>
        {status.trial ? <Sparkles size={12} /> : <Mic size={12} />} {de ? 'Mit Wlad sprechen' : 'Talk to Wlad'}
        <Badge lime>{label}</Badge>
      </button>
      {open && <InteractiveWladOverlay clip={clip} de={de} access={status} onClose={close} />}
    </>
  );
};
