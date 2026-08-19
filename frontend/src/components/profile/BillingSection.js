/**
 * BillingSection — Iter 92.33 (Mert pre-first-customer).
 *
 * One-click "Manage Subscription" → opens Stripe-hosted Customer Portal.
 * Handles: cancel/reactivate, update card, download invoices, change billing email.
 *
 * For Free users → shows "Upgrade jetzt" CTA instead.
 * For Enterprise → hidden (CSM handles it).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { CreditCard, ExternalLink, Sparkles, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const TIER_LABEL = {
  free: 'Free',
  standard: 'Standard · 997€/Jahr',
  accelerator: 'Accelerator · 4.797€/Jahr',
  enterprise: 'Enterprise',
};

export const BillingSection = ({ de }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);

  const tier = (user?.tier || 'free').toLowerCase();
  const isFree = tier === 'free';
  const isEnterprise = tier === 'enterprise';

  // Enterprise is handled by Customer Success — hide self-service.
  if (isEnterprise) return null;

  const onOpenPortal = async () => {
    setOpening(true);
    try {
      const { data } = await api.post('/billing/portal');
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(de ? 'Portal-Link konnte nicht erstellt werden' : 'Portal link could not be created');
        setOpening(false);
      }
    } catch (e) {
      const detail = e?.response?.data?.detail || '';
      if (e?.response?.status === 400 && /no.*subscription/i.test(detail)) {
        toast.info(de
          ? 'Noch kein Abonnement aktiv. Schließe zuerst einen Plan ab.'
          : 'No active subscription yet. Pick a plan first.');
      } else {
        toast.error(de ? 'Stripe-Portal nicht erreichbar — bitte erneut versuchen' : 'Stripe portal unavailable — try again');
      }
      setOpening(false);
    }
  };

  // ── Free user: upgrade CTA instead of portal ──
  if (isFree) {
    return (
      <Card className="border-black/[0.04] dark:border-white/[0.06]" data-testid="billing-section-free">
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-black">{de ? 'Abrechnung' : 'Billing'}</h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              {de ? `Aktueller Plan: ${TIER_LABEL.free}` : `Current plan: ${TIER_LABEL.free}`}
            </p>
          </div>

          <div className="rounded-xl p-4 bg-gradient-to-br from-[#BFFF00]/[0.08] via-transparent to-transparent border border-[#BFFF00]/30">
            <div className="flex items-start gap-3">
              <Sparkles size={16} className="text-[#BFFF00] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold mb-1">
                  {de ? 'Schalte das volle Potenzial frei' : 'Unlock the full potential'}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {de
                    ? '24/7 KI-Coach · 30-Tage-Challenge · 12 Videokurse · Playbooks & Simulationen'
                    : '24/7 AI coach · 30-day challenge · 12 video courses · playbooks & simulations'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/coaching')}
              data-testid="billing-upgrade-btn"
              className="mt-3 h-8 text-[11px] bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D]"
            >
              {de ? 'Jetzt upgraden' : 'Upgrade now'} <ArrowRight size={11} className="ml-1.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Paid user: open Stripe Customer Portal ──
  return (
    <Card className="border-black/[0.04] dark:border-white/[0.06]" data-testid="billing-section-paid">
      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="text-sm font-black">{de ? 'Abrechnung' : 'Billing'}</h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            {de
              ? `Aktueller Plan: ${TIER_LABEL[tier] || tier}`
              : `Current plan: ${TIER_LABEL[tier] || tier}`}
          </p>
        </div>

        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-muted/20">
          <div className="min-w-0">
            <p className="text-[13px] font-bold">
              {de ? 'Abonnement verwalten' : 'Manage subscription'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              {de
                ? 'Karte aktualisieren · Rechnungen herunterladen · Kündigen · Re-Aktivieren — sicher über Stripe.'
                : 'Update card · Download invoices · Cancel · Reactivate — securely via Stripe.'}
            </p>
          </div>
          <Button
            size="sm"
            onClick={onOpenPortal}
            disabled={opening}
            variant="outline"
            data-testid="billing-portal-btn"
            className="h-8 text-[11px] shrink-0"
          >
            <CreditCard size={12} className="mr-1.5" />
            {opening
              ? (de ? 'Öffne…' : 'Opening…')
              : (de ? 'Verwalten' : 'Manage')}
            <ExternalLink size={10} className="ml-1.5 opacity-60" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingSection;
