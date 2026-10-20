/**
 * useConsultationGate — 10-day cool-down before we invite fresh users to
 * book a "Berater / Strategiegespräch" 1:1.
 *
 * Wlad's rule (Iter 124.5 · Godmode pre-launch): after signup, users need
 * ~10 days to actually TRY the product before we upsell them to a sales
 * call. Selling too early feels pushy AND hurts booked-call quality —
 * users book without context and cancel.
 *
 * Bypass paths:
 *   - Enterprise / accelerator tier users always see the banner (they own it).
 *   - Users flagged `admin` or with `consultation_unlocked=true` bypass too.
 */
import { useAuth } from '../contexts/AuthContext';

export const CONSULTATION_GATE_DAYS = 10;

/**
 * @returns {{ ready: boolean, daysUntilReady: number, ageDays: number }}
 *   ready           = true when the user MAY see consultation CTAs.
 *   daysUntilReady  = remaining days until the gate opens (0 if ready).
 *   ageDays         = the current account age in whole days.
 */
export function useConsultationGate() {
  const { user } = useAuth();
  if (!user) return { ready: false, daysUntilReady: CONSULTATION_GATE_DAYS, ageDays: 0 };

  // Never gate paid/insider audiences.
  const tier = (user.tier || 'free').toLowerCase();
  if (tier === 'accelerator' || tier === 'enterprise') {
    return { ready: true, daysUntilReady: 0, ageDays: Infinity };
  }
  if (user.is_admin || user.consultation_unlocked) {
    return { ready: true, daysUntilReady: 0, ageDays: Infinity };
  }

  const created = user.created_at ? new Date(user.created_at) : null;
  if (!created || Number.isNaN(created.getTime())) {
    // Missing timestamp — err on the safe side: gate it.
    return { ready: false, daysUntilReady: CONSULTATION_GATE_DAYS, ageDays: 0 };
  }
  const ageMs = Date.now() - created.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  const daysUntilReady = Math.max(0, CONSULTATION_GATE_DAYS - ageDays);
  return { ready: daysUntilReady === 0, daysUntilReady, ageDays };
}

export default useConsultationGate;
