import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeroNav } from './MobileHeroNav';
import { SmartPopups } from '../shared/SmartPopups';
import { PaywallModal } from '../shared/PaywallModal';
import { useAuth } from '../../contexts/AuthContext';
import { useCredits } from '../../contexts/CreditContext';

export const DashboardLayout = ({ children, hideSidebar, rightPanel }) => {
  const { user } = useAuth();
  const { totalUsed, softPause, dismissPause } = useCredits();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallType, setPaywallType] = useState('hard'); // 'hard' | 'soft'

  // Hard paywall: 0 credits
  useEffect(() => {
    const handler = () => { setPaywallType('hard'); setShowPaywall(true); };
    window.addEventListener('wladbot:paywall', handler);
    return () => window.removeEventListener('wladbot:paywall', handler);
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
      {showPaywall && <PaywallModal onClose={handleClose} creditsUsed={totalUsed} isSoftPause={paywallType === 'soft'} />}
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
