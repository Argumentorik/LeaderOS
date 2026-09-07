import { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import api from '../lib/api';
import logger from '../lib/logger';
import { useAuth } from './AuthContext';

const CreditContext = createContext({ balance: 50, isPremium: false, totalUsed: 0, softPause: false, reload: () => {}, dismissPause: () => {} });

export const useCredits = () => useContext(CreditContext);

export const CreditProvider = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState({ balance: 50, isPremium: false, totalUsed: 0, softPause: false });

  const reload = useCallback(async () => {
    if (!user) return; // Don't ping protected endpoint before login (keeps console clean)
    try {
      const res = await api.get('/credits');
      setData({
        balance: res.data.balance,
        isPremium: res.data.is_premium,
        totalUsed: res.data.total_used,
        softPause: res.data.soft_pause || false,
        limit: res.data.limit,
        costs: res.data.costs || {},
        usedByAction: res.data.used_by_action || {},
        recent: res.data.recent || [],
      });
    } catch (err) {
      // 401 here just means session expired — UI will redirect via ReAuthModal anyway
      if (err?.response?.status !== 401) logger.error('Credit fetch failed:', err);
    }
  }, [user]);

  const dismissPause = useCallback(async () => {
    if (!user) return;
    try {
      await api.post('/credits/dismiss-pause');
      setData(prev => ({ ...prev, softPause: false }));
    } catch (err) { logger.error('Dismiss pause failed:', err); }
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const value = useMemo(() => ({ ...data, reload, dismissPause }), [data, reload, dismissPause]);

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};
