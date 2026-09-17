import { useCredits } from '../../contexts/CreditContext';

/**
 * CreditCostHint — „kostet 1 von noch 3" VOR der Aktion.
 *
 * Iter 185: Kein Kunde soll arbeiten und danach eine Absage bekommen. Bei 0
 * Credits ist der Knopf von Anfang an ruhiggestellt — mit Begründung.
 *
 * Nutzung:
 *   const { blocked, hint } = useCreditCost('chat');
 *   <button disabled={blocked} title={hint}>…</button>
 *   <CreditCostHint action="chat" />
 */
export function useCreditCost(action = 'chat') {
  const { balance, isPremium, costs = {} } = useCredits();
  const cost = costs[action] ?? 1;
  if (isPremium || balance === -1) {
    return { cost, balance: -1, blocked: false, unlimited: true, hint: '' };
  }
  const left = Number.isFinite(balance) ? balance : 0;
  const blocked = left < cost;
  return {
    cost,
    balance: left,
    blocked,
    unlimited: false,
    hint: blocked
      ? 'Dein KI-Guthaben ist aufgebraucht. Zum Monatsanfang kommen neue Credits dazu — oder jetzt freischalten.'
      : `Kostet ${cost} von noch ${left}`,
  };
}

export const CreditCostHint = ({ action = 'chat', className = '' }) => {
  const { unlimited, hint, blocked } = useCreditCost(action);
  if (unlimited) return null;
  return (
    <span
      className={`text-[11px] font-semibold ${blocked ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'} ${className}`}
      data-testid={`credit-cost-hint-${action}`}
    >
      {hint}
    </span>
  );
};

export default CreditCostHint;
