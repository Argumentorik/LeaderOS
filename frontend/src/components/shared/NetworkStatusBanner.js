import { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';

/**
 * Shows a top banner when backend is unreachable (CORS block, offline, 502/503).
 * Auto-hides once the next successful API call lands.
 */
export const NetworkStatusBanner = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onError = () => setVisible(true);
    const onOk = () => setVisible(false);
    window.addEventListener('wladbot:network-error', onError);
    window.addEventListener('online', onOk);
    return () => {
      window.removeEventListener('wladbot:network-error', onError);
      window.removeEventListener('online', onOk);
    };
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-rose-500 text-white text-sm py-2.5 px-4 flex items-center justify-center gap-3 shadow-lg"
      data-testid="network-error-banner"
    >
      <WifiOff size={16} className="shrink-0" />
      <span className="font-semibold">Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung oder lade die Seite neu.</span>
      <button
        onClick={() => window.location.reload()}
        className="ml-2 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold"
        data-testid="reload-btn"
      >
        Neu laden
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/60 hover:text-white"
        data-testid="dismiss-network-banner"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};
