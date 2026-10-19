import { Check, X, Star, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';

// ── TierCardBadge · top-right "VIP" / "BELIEBT" badge ─────────────────────
export const TierCardBadge = ({ badge }) => {
  if (!badge) return null;
  const classes = badge === 'VIP'
    ? 'bg-[#BFFF00] text-[#0A0A0A]'
    : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
  return (
    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider ${classes}`}>
      <Star size={9} className="inline mr-0.5 -mt-0.5" />{badge}
    </div>
  );
};

// ── TierCardHeader · icon + subtitle + name ───────────────────────────────
export const TierCardHeader = ({ tier }) => {
  const Icon = tier.icon;
  const iconBg = tier.isDark
    ? 'bg-[#BFFF00]/15'
    : tier.id === 'standard' ? 'bg-gradient-to-br from-[#BFFF00] to-[#9ACC00]' : 'bg-[#BFFF00]/10';
  const iconColor = tier.isDark
    ? 'text-[#BFFF00]'
    : tier.id === 'standard' ? 'text-[#0A0A0A]' : 'text-[#6B8A00] dark:text-[#BFFF00]';
  const subtitleColor = tier.isDark ? 'text-[#BFFF00]' : 'text-muted-foreground';

  return (
    <div className="space-y-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${subtitleColor}`}>{tier.subtitle}</p>
        <h3 className="text-xl font-black tracking-tight">{tier.name}</h3>
      </div>
    </div>
  );
};

// ── TierPrice · big price + optional "or in X installments" link ──────────
export const TierPrice = ({ tier, de, onOpenInstallments }) => {
  const unitColor = tier.isDark ? 'text-white/50' : 'text-muted-foreground';
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black">€{tier.price.toLocaleString('de-DE')}</span>
        <span className={`text-sm font-semibold ${unitColor}`}>/ {tier.priceUnit}</span>
      </div>
      {tier.installmentPrice && (
        <button
          onClick={onOpenInstallments}
          className="text-[11px] font-semibold text-[#BFFF00]/80 hover:text-[#BFFF00] hover:underline mt-2 transition-colors"
          data-testid="installment-link"
        >
          {de
            ? `oder in ${tier.installmentCount} Raten à €${tier.installmentPrice.toFixed(2)} →`
            : `or in ${tier.installmentCount} installments of €${tier.installmentPrice.toFixed(2)} →`}
        </button>
      )}
    </div>
  );
};

// ── TierFeatureList · bullet list with check/x icons ──────────────────────
const featureLabelClass = (feature, isDark) => {
  if (!feature.has) {
    return isDark ? 'text-white/30 line-through' : 'text-muted-foreground/50 line-through';
  }
  if (feature.bold) return 'font-bold';
  if (feature.highlight) {
    return `${isDark ? 'text-[#BFFF00]' : 'text-[#4A6200] dark:text-[#BFFF00]'} font-semibold`;
  }
  return '';
};

const featureIconClass = (feature, isDark) => {
  if (feature.highlight) return 'text-[#BFFF00]';
  return isDark ? 'text-[#BFFF00]/70' : 'text-[#6B8A00] dark:text-[#BFFF00]';
};

export const TierFeatureList = ({ features, isDark }) => (
  <ul className="space-y-2">
    {features.map((f) => (
      <li key={f.label} className="flex items-start gap-2 text-[12px]">
        {f.has
          ? <Check size={14} className={`mt-0.5 shrink-0 ${featureIconClass(f, isDark)}`} strokeWidth={3} />
          : <X size={14} className={`mt-0.5 shrink-0 ${isDark ? 'text-white/20' : 'text-muted-foreground/30'}`} />
        }
        <span className={featureLabelClass(f, isDark)}>{f.label}</span>
      </li>
    ))}
  </ul>
);

// ── TierCTA · checkout button with loading + "current tier" states ────────
const ctaButtonClass = (variant) => {
  if (variant === 'accelerator') return 'bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#9ACC00]';
  if (variant === 'primary')     return 'bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white hover:opacity-90';
  return 'bg-transparent border-2 border-[#0A0A0A] dark:border-white/20 text-[#0A0A0A] dark:text-white hover:bg-[#0A0A0A] hover:text-white dark:hover:bg-white dark:hover:text-[#0A0A0A]';
};

export const TierCTA = ({ tier, isCurrent, ctaLoading, anyLoading, onCheckout, de }) => {
  let content;
  if (isCurrent) {
    content = <><Sparkles size={14} className="mr-1.5" /> {de ? 'Dein aktueller Tier' : 'Your current tier'}</>;
  } else if (ctaLoading) {
    content = <><Loader2 size={14} className="mr-1.5 animate-spin" /> {de ? 'Weiterleitung...' : 'Redirecting...'}</>;
  } else {
    content = tier.cta;
  }
  return (
    <Button
      onClick={() => onCheckout(tier.pkgId)}
      disabled={isCurrent || anyLoading}
      className={`w-full font-bold ${ctaButtonClass(tier.ctaVariant)}`}
      data-testid={`tier-cta-${tier.id}`}
    >
      {content}
    </Button>
  );
};
