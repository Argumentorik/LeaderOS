import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeroNav } from './MobileHeroNav';
import { SmartPopups } from '../shared/SmartPopups';
import { PaywallModal } from '../shared/PaywallModal';
import { CreditsExhaustedDialog } from '../shared/CreditsExhaustedDialog';
import { LockedFeatureModal } from '../shared/LockedFeatureModal';
import { useAuth } from '../../contexts/AuthContext';
import { useCredits } from '../../contexts/CreditContext';

export const DashboardLayout = ({ children, hideSidebar, rightPanel }) => {
  const { user } = useAuth();
  const { totalUsed, softPause, dismissPause } = useCredits();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallType, setPaywallType] = useState('soft');
  // Iter 185: getrennte Meldungen — leeres Guthaben ODER gesperrter Bereich.
  const [notice, setNotice] = useState(null); // {kind:'credits'|'locked', info}

  useEffect(() => {
    const onCredits = (e) => setNotice((prev) => prev || { kind: 'credits', info: e.detail?.info || null });
    const onLocked = (e) => setNotice((prev) => prev || { kind: 'locked', info: e.detail || null });
    window.addEventListener('wladbot:credits-empty', onCredits);
    window.addEventListener('wladbot:feature-locked', onLocked);
    return () => {
      window.removeEventListener('wladbot:credits-empty', onCredits);
      window.removeEventListener('wladbot:feature-locked', onLocked);
    };
  }, []);

  // Soft pause: after 10 uses
  useEffect(() => {
    if (softPause) {
      const shown = sessionStorage.getItem('wladbot_soft_pause_shown');
      if (!shown) {
        setPaywallType('soft');
        setShowPaywall(true);
        sessionStorage.setItem('wladbot_soft_pause_shown', '1');
      }
    }
  }, [softPause]);

  const handleClose = () => {
    setShowPaywall(false);
    if (paywallType === 'soft') dismissPause();
  };

  return (
    <div className="flex min-h-screen bg-background">
      {notice?.kind === 'credits' && (
        <CreditsExhaustedDialog detail={notice.info} onClose={() => setNotice(null)} />
      )}
      {notice?.kind === 'locked' && (
        <LockedFeatureModal
          item={{ path: notice.info?.path || '/coaching', label: 'Dieser Bereich' }}
          onClose={() => setNotice(null)}
        />
      )}
      {!notice && showPaywall && <PaywallModal onClose={handleClose} creditsUsed={totalUsed} isSoftPause={paywallType === 'soft'} />}
      {!hideSidebar && (
        <aside className="hidden md:block sticky top-0 h-screen">
          <Sidebar />
        </aside>
      )}
      <main className={`flex-1 overflow-auto pb-[92px] md:pb-0 ${rightPanel ? 'min-w-0' : ''}`}>
        {children}
      </main>
      {rightPanel && (
        <aside className="hidden lg:block w-72 xl:w-80 border-l border-border/50 bg-white/50 dark:bg-card/30 sticky top-0 h-screen overflow-y-auto shrink-0">
          {rightPanel}
        </aside>
      )}
      <SmartPopups userData={user} />
      {!hideSidebar && <MobileHeroNav />}
    </div>
  );
};
