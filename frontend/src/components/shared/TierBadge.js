import { Crown, Rocket, Sparkles, PlayCircle, GraduationCap } from 'lucide-react';
import { useTier } from '../../contexts/TierContext';
import { useAuth } from '../../contexts/AuthContext';

const CONFIG = {
  free: {
    label: 'Free',
    icon: Sparkles,
    bg: 'bg-slate-100 dark:bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-500/20',
  },
  masterclass: {
    label: 'Masterclass',
    icon: GraduationCap,
    bg: 'bg-[#0A0A0A] dark:bg-[#BFFF00]/10',
    text: 'text-[#BFFF00]',
    border: 'border-[#BFFF00]/40',
  },
  starter: {
    label: 'Starter',
    icon: PlayCircle,
    bg: 'bg-[#6B8A00]/10 dark:bg-[#BFFF00]/10',
    text: 'text-[#6B8A00] dark:text-[#BFFF00]',
    border: 'border-[#6B8A00]/20 dark:border-[#BFFF00]/20',
  },
  standard: {
    label: 'Leadership OS',
    icon: Rocket,
    bg: 'bg-gradient-to-r from-[#BFFF00] to-[#9ACC00]',
    text: 'text-[#0A0A0A]',
    border: 'border-transparent',
  },
  accelerator: {
    label: 'Leadership OS PLUS',
    icon: Crown,
    bg: 'bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E]',
    text: 'text-[#BFFF00]',
    border: 'border-[#BFFF00]/30',
  },
};

/**
 * TierBadge · shows user's current tier.
 * Variants: 'full' (icon+label), 'compact' (icon only), 'pill' (default)
 */
export const TierBadge = ({ variant = 'pill', size = 'sm', showLabel = true, showFree = false }) => {
  const { tier, isFree, inGracePeriod } = useTier();
  const { user } = useAuth();
  // Iter 186: Niemand trägt ein Etikett vor sich her. „Kostenloser Zugang"
  // steht im Konto (Einstellungen), nicht am Namen.
  if (isFree && !user?.masterclass && !showFree) return null;
  const isMasterclass = Boolean(user?.masterclass) && (tier === 'free' || !tier);
  const cfg = isMasterclass ? CONFIG.masterclass : (CONFIG[tier] || CONFIG.free);
  const Icon = cfg.icon;

  const sizeCls = size === 'xs'
    ? 'text-[9px] h-5 px-2 gap-1'
    : size === 'lg'
    ? 'text-[12px] h-8 px-3.5 gap-1.5'
    : 'text-[10px] h-6 px-2.5 gap-1';

  const iconSize = size === 'xs' ? 9 : size === 'lg' ? 14 : 11;

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center justify-center rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeCls}`}
        data-testid={`tier-badge-${tier}`} title={cfg.label}>
        <Icon size={iconSize} strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeCls}`}
      data-testid={`tier-badge-${tier}`}>
      <Icon size={iconSize} strokeWidth={2.5} />
      {showLabel && <span>{isFree && !isMasterclass ? 'Free' : cfg.label}</span>}
      {inGracePeriod && <span className="text-rose-500 ml-0.5">•</span>}
    </div>
  );
};

export default TierBadge;
