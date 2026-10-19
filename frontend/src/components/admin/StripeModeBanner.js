/**
 * StripeModeBanner · Pre-Launch Health-Indicator für Admins/Mert.
 *
 * Iter 92.12: Mert berichtete "sehe immer noch sandbox". Dieser Banner
 * checkt `/api/payments/stripe-mode` und zeigt glasklar an, ob der pod
 * auf Live, Test oder Platform-Default läuft.
 *
 * Sichtbar NUR für admin/owner user (sonst stört's den normalen Funnel).
 * Erscheint nur wenn NICHT live · sobald sk_live_* aktiv ist, ist der
 * Banner unsichtbar (no-noise principle).
 */
import { useEffect, useState } from 'react';
import { AlertTriangle, X, Lock, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const DISMISS_KEY = 'wlad_stripe_banner_dismissed_v1';

export const StripeModeBanner = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const role = (user?.role || '').toLowerCase();
    const isAdmin = user?.is_admin === true || ['admin', 'owner'].includes(role);
    if (!isAdmin) return;
    try {
      const lastDismiss = Number(localStorage.getItem(DISMISS_KEY) || 0);
      // Re-show every 12h even if dismissed
      if (Date.now() - lastDismiss < 12 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    } catch { /* noop */ }
    api.get('/payments/stripe-mode')
      .then((r) => setData(r.data))
      .catch(() => { /* silent */ });
  }, [user]);

  const role = (user?.role || '').toLowerCase();
  const isAdmin = user?.is_admin === true || ['admin', 'owner'].includes(role);
  if (!isAdmin) return null;
  if (!data || data.live) return null;  // live = perfect, no banner needed
  if (dismissed) return null;

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
    setDismissed(true);
  };

  const isPlatformDefault = data.mode === 'platform_default';

  return (
    <div
      className="rounded-2xl border border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/10 dark:border-amber-500/30 p-4 flex items-start gap-3 mb-4"
      data-testid="stripe-mode-banner"
      role="alert"
    >
      <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-wider font-black text-amber-700 dark:text-amber-300">
            {data.mode === 'live' ? 'LIVE' : data.mode === 'test' ? 'STRIPE TEST MODUS' : isPlatformDefault ? 'PLATFORM-SANDBOX KEY' : 'STRIPE NICHT BEREIT'}
          </span>
          <span className="text-[10px] font-mono text-amber-700/70 dark:text-amber-300/70 px-2 py-0.5 rounded bg-amber-500/10">
            {data.key_prefix || 'no-key'}
          </span>
        </div>
        <p className="text-[12.5px] font-bold text-amber-900 dark:text-amber-100 leading-snug">
          Stripe läuft noch im Sandbox-Modus · echte Karten werden nicht belastet.
        </p>
        <p className="text-[11px] text-amber-800/85 dark:text-amber-200/75 mt-1">
          {data.warning}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <a
            href="https://dashboard.stripe.com/apikeys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-100 bg-amber-500/25 hover:bg-amber-500/35 transition-colors rounded-lg px-3 py-1.5"
            data-testid="stripe-mode-dashboard-link"
          >
            <Lock size={11} />
            Live-Key auf dashboard.stripe.com holen
            <ExternalLink size={10} />
          </a>
          <span className="text-[10px] text-amber-700/70 dark:text-amber-300/70 font-medium">
            → in <code className="font-mono">backend/.env</code> als <code className="font-mono">STRIPE_API_KEY=sk_live_…</code>
          </span>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-700/60 hover:bg-amber-500/15 hover:text-amber-900 dark:hover:text-amber-100 transition-colors shrink-0"
        title="Für 12h ausblenden"
        data-testid="stripe-mode-dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
};

export default StripeModeBanner;
