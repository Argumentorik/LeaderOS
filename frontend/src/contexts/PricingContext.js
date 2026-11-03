/**
 * PricingContext · globaler Trigger fürs PricingModal.
 *
 * Jede Komponente kann `const { open } = usePricing();` aufrufen, um den
 * In-App-Stripe-Checkout-Pop-Up zu öffnen. Dadurch müssen keine
 * navigate('/coaching') Aufrufe mehr über die App verteilt sein ·
 * Conversion-Rate ↑.
 */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { PricingModal } from '../components/shared/PricingModal';

const PricingContext = createContext({ open: () => {}, close: () => {}, isOpen: false });

export const usePricing = () => useContext(PricingContext);

export const PricingProvider = ({ children }) => {
  const [opts, setOpts] = useState(null);   // null = closed; object = open with config

  const open = useCallback((defaultTier = 'leadership_os') => {
    setOpts({ defaultTier });
  }, []);
  const close = useCallback(() => setOpts(null), []);

  const value = useMemo(() => ({ open, close, isOpen: !!opts }), [open, close, opts]);

  return (
    <PricingContext.Provider value={value}>
      {children}
      {opts && (
        <PricingModal defaultTier={opts.defaultTier} onClose={close} />
      )}
    </PricingContext.Provider>
  );
};

export default PricingContext;
