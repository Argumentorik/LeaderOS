import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Crown, Rocket, Building2 } from 'lucide-react';
import { useTier } from '../../contexts/TierContext';
import { TierCardBadge, TierCardHeader, TierPrice, TierFeatureList, TierCTA } from './tier/TierCardParts';
import { LeadershipOSInstallmentModal } from './LeadershipOSInstallmentModal';
import { EnterpriseQuoteModal } from './EnterpriseQuoteModal';

/**
 * TierPricingGrid — 3-Tier-Pricing: Leadership OS | Leadership OS PLUS | Enterprise
 *
 * • Leadership OS €997/Jahr · 12 Videokurse Drip · 30-Tage Money-Back · Raten möglich (2× oder 12×)
 * • Leadership OS PLUS €4.797/Jahr · OS + 12 Einzelcoachings (je 299€)
 * • Enterprise · B2B · Volume-Discount auf 997€ Basis (10-50%)
 */

const TIERS = [
  {
    id: 'leadership_os',
    pkgId: 'leadership_os',
    tierKey: 'standard',
    name: 'Leadership OS',
    subtitle: '1 Jahr · Solo-Leader',
    price: 997,
    priceUnit: 'Jahr',
    icon: Rocket,
    accent: 'border-[#BFFF00]/30 shadow-lg shadow-[#BFFF00]/5',
    cta: 'Leadership OS holen',
    ctaVariant: 'primary',
    badge: 'BELIEBT',
    hasInstallments: true,
    valueHint: '12 Videokurse à 199€ = 2.388€ Wert · KI quasi geschenkt',
    features: [
      { label: '12 Premium-Videokurse (1/Monat freigeschaltet)', has: true, bold: true },
      { label: 'WladBot KI-Coach 24/7 (GPT-5.2)', has: true, highlight: true },
      { label: 'Audio-Mode Voice-Chat (ElevenLabs)', has: true, highlight: true },
      { label: '30-Tage Leadership Sprint komplett', has: true },
      { label: 'Alle Frameworks & Playbooks', has: true },
      { label: 'AI Leadership Community', has: true },
      { label: 'Personalized Learning Journey', has: true },
      { label: 'Leadership Reports als PDF', has: true },
      { label: 'License Key per E-Mail', has: true },
      { label: '30-Tage Geld-zurück-Garantie', has: true, highlight: true },
      { label: 'Video-Analyse mit KI-Feedback', has: false },
      { label: '12× Einzelcoaching mit Coaches', has: false },
    ],
  },
  {
    id: 'leadership_os_plus',
    pkgId: 'leadership_os_plus',
    tierKey: 'accelerator',
    name: 'Leadership OS PLUS',
    subtitle: '1 Jahr · mit Coaches',
    price: 4797,
    priceUnit: 'Jahr',
    icon: Crown,
    accent: 'border-[#BFFF00]/40 bg-gradient-to-b from-[#0A0A0A] to-[#1A1A2E] text-white',
    cta: 'PLUS jetzt holen',
    ctaVariant: 'accelerator',
    badge: 'VIP',
    isDark: true,
    valueHint: '12 Coachings à 299€ = 3.588€ Wert + 997€ OS · Spar-Wert: 138€',
    features: [
      { label: 'Alles aus Leadership OS', has: true, bold: true },
      { label: '12× Einzelcoachings mit Argumentorik-Coaches', has: true, highlight: true },
      { label: 'Coaching-Wert: 12 × 299€ = 3.588€', has: true, highlight: true },
      { label: 'Video-Analyse & Missionen EXKLUSIV', has: true, highlight: true },
      { label: 'Unbegrenzte AI-Credits', has: true },
      { label: 'AI Learning Path personalisiert', has: true },
      { label: 'Mastermind-Gruppe Zugang', has: true },
      { label: 'Priority Support · Fast-Track', has: true },
      { label: 'Quartals-Reviews (4×/Jahr)', has: true },
      { label: 'Persönliches Onboarding-Gespräch', has: true },
      { label: '30-Tage Geld-zurück-Garantie', has: true, highlight: true },
    ],
  },
  {
    id: 'enterprise',
    pkgId: 'enterprise',
    tierKey: 'enterprise',
    name: 'Leadership OS Enterprise',
    subtitle: 'B2B · Team-Lizenz',
    price: null,            // quote-based
    priceLabel: 'Auf Anfrage',
    priceUnit: 'pro Seat/Jahr',
    icon: Building2,
    accent: 'border-[#BFFF00]/30',
    cta: 'Angebot anfordern',
    ctaVariant: 'outline',
    isQuote: true,
    valueHint: 'Volume-Discount: 10% ab 5 MA · 50% ab 200 MA',
    features: [
      { label: 'Alles aus Leadership OS für jeden Mitarbeiter', has: true, bold: true },
      { label: 'Team-Dashboard für Admins', has: true, highlight: true },
      { label: 'Volume-Rabatte: 10–50% auf 997€', has: true, highlight: true },
      { label: 'ab 5 MA: 10% Rabatt', has: true },
      { label: 'ab 10 MA: 15% Rabatt', has: true },
      { label: 'ab 20 MA: 20% Rabatt', has: true },
      { label: 'ab 50 MA: 30% Rabatt', has: true },
      { label: 'ab 100 MA: 40% Rabatt', has: true },
      { label: 'ab 200 MA: 50% Rabatt', has: true, highlight: true },
      { label: 'Coaches-Pakete optional buchbar', has: true },
      { label: 'SSO Optional · Dedizierter Support', has: true },
    ],
  },
];

export const TierPricingGrid = ({ onCheckout, checkoutLoading, de = true }) => {
  const { tier: currentTier } = useTier();
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  const handleTierClick = (tier) => {
    if (tier.isQuote) { setShowEnterpriseModal(true); return; }
    onCheckout(tier.pkgId);
  };

  return (
    <div className="space-y-6" data-testid="tier-pricing-grid">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <Badge className="bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] border-[#BFFF00]/25 font-bold text-[10px]">
          {de ? 'WÄHLE DEIN PAKET' : 'CHOOSE YOUR PACKAGE'}
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
          {de ? 'Drei Wege zum ' : 'Three paths to '}<span className="gradient-text">KI-nativen Leader</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          {de
            ? '30-Tage Geld-zurück-Garantie · Ratenzahlung möglich · Upgrade jederzeit'
            : '30-day money-back · installments available · upgrade anytime'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {TIERS.map((tier) => {
          const isCurrent = currentTier === tier.tierKey;
          const ctaLoading = checkoutLoading === tier.pkgId;
          return (
            <Card
              key={tier.id}
              className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${tier.accent}`}
              data-testid={`tier-card-${tier.id}`}
            >
              <TierCardBadge badge={tier.badge} />
              <CardContent className="p-6 space-y-5">
                <TierCardHeader tier={tier} />
                {tier.isQuote ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black">{tier.priceLabel}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{tier.priceUnit}</p>
                  </div>
                ) : (
                  <TierPrice
                    tier={{ ...tier, installmentPrice: tier.hasInstallments ? 99 : null, installmentCount: 12 }}
                    de={de}
                    onOpenInstallments={() => setShowInstallmentModal(true)}
                  />
                )}
                {tier.valueHint && (
                  <p
                    className={`text-[10px] font-semibold ${tier.isDark ? 'text-[#BFFF00]/80' : 'text-[#4A6200] dark:text-[#BFFF00]/80'}`}
                    data-testid={`tier-value-hint-${tier.id}`}
                  >
                    {tier.valueHint}
                  </p>
                )}
                <TierFeatureList features={tier.features} isDark={tier.isDark} />
                <TierCTA
                  tier={tier}
                  isCurrent={isCurrent && !tier.isQuote}
                  ctaLoading={ctaLoading}
                  anyLoading={Boolean(checkoutLoading)}
                  onCheckout={() => handleTierClick(tier)}
                  de={de}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <LeadershipOSInstallmentModal
        open={showInstallmentModal}
        onClose={() => setShowInstallmentModal(false)}
        onConfirm={(planPkgId) => { setShowInstallmentModal(false); onCheckout(planPkgId); }}
        checkoutLoading={checkoutLoading}
        de={de}
      />

      <EnterpriseQuoteModal
        open={showEnterpriseModal}
        onClose={() => setShowEnterpriseModal(false)}
        de={de}
      />
    </div>
  );
};

export default TierPricingGrid;
