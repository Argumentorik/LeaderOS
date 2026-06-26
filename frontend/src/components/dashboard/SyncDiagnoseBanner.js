import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { RefreshCw, Loader2, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { toast } from 'sonner';

/**
 * SyncDiagnoseBanner — prominent CTA for leader-check.de funnel users to
 * pull their existing Leader-Diagnose into the WladBot dashboard.
 *
 * Auto-hides if:
 *   - user already has a synced WladHub diagnosis (`last_sync` set)
 *   - user dismissed the banner this session (sessionStorage)
 *
 * Iter 92.35 (Mert P1): bridge between leader-check.de and leaderos.de.
 */
const SS_DISMISS_KEY = 'sync_diagnose_banner_dismissed';

export const SyncDiagnoseBanner = ({ de = true }) => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (sessionStorage.getItem(SS_DISMISS_KEY) === '1') { setLoading(false); return; }
        const res = await api.get('/wladhub/3layer');
        if (cancelled) return;
        // Show banner only when not yet synced (no last_sync stamp).
        const connected = res.data?.connected;
        const hasSync = Boolean(res.data?.last_sync);
        setShow(!connected || !hasSync);
      } catch (err) {
        logger.warn?.('[SyncBanner] preflight failed', err);
        setShow(true); // err on the side of showing — sync endpoint will handle missing data gracefully.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/wladhub/sync', { sync_scores: true, sync_action_plan: true });
      const status = res.data.status;
      if (status === 'synced') {
        toast.success(de ? 'Leader-Diagnose erfolgreich synchronisiert!' : 'Leader diagnosis synced successfully!');
        setShow(false);
        // Soft reload of dashboard data — most cards listen to their own queries.
        setTimeout(() => window.location.reload(), 800);
      } else if (status === 'no_data') {
        toast.info(de
          ? 'Noch keine Diagnose auf leader-check.de gefunden. Starte sie dort kostenlos.'
          : 'No diagnosis on leader-check.de yet. Start the free assessment there.');
        window.open('https://leader-check.de', '_blank', 'noopener,noreferrer');
      } else {
        toast.success(de ? 'Diagnose ist bereits aktuell.' : 'Diagnosis already up to date.');
        setShow(false);
      }
    } catch (err) {
      logger.error?.('[SyncBanner] sync failed', err);
      toast.error(de ? 'Synchronisation fehlgeschlagen.' : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const dismiss = () => {
    try { sessionStorage.setItem(SS_DISMISS_KEY, '1'); } catch { /* noop */ }
    setShow(false);
  };

  if (loading || !show) return null;

  return (
    <Card
      className="mb-5 overflow-hidden border-[#BFFF00]/30 bg-gradient-to-r from-[#BFFF00]/[0.08] to-[#BFFF00]/[0.04]"
      data-testid="sync-diagnose-banner"
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={18} className="text-[#0A0A0A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black">
              {de ? 'Hast du deine Leader-Diagnose auf leader-check.de gemacht?' : 'Did you complete your Leader Diagnosis on leader-check.de?'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {de
                ? 'Synchronisiere deine Ergebnisse — WladBot personalisiert dein Coaching darauf.'
                : 'Sync your results — WladBot personalizes your coaching from them.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleSync}
              disabled={syncing}
              className="bg-[#0A0A0A] text-white hover:bg-[#1A1A2E] font-bold h-9 px-4 text-xs"
              data-testid="sync-diagnose-btn"
            >
              {syncing
                ? <><Loader2 size={13} className="mr-1.5 animate-spin" /> {de ? 'Synchronisiere…' : 'Syncing…'}</>
                : <><RefreshCw size={13} className="mr-1.5" /> {de ? 'Diagnose synchronisieren' : 'Sync Diagnosis'}</>}
            </Button>
            <button
              onClick={dismiss}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors px-2"
              data-testid="sync-diagnose-dismiss"
            >
              {de ? 'Später' : 'Later'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncDiagnoseBanner;
