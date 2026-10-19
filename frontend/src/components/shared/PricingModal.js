/**
 * PricingModal · Apple/Revolut-grade in-app pricing & Stripe checkout.
 *
 * Replaces the older PaywallModal upgrade UX. Shows all 4 packages
 * (Leadership OS one-time / 2× / 12× and OS PLUS) in a single elegant
 * panel, lets the user start Stripe Checkout WITHOUT leaving the app:
 *   1. Click „Direkt kaufen" → backend creates a Stripe session.
 *   2. We open Stripe-hosted checkout in a brand-new tab (least
 *      surprising for the user, supports all wallets / SEPA / Apple Pay).
 *   3. After payment, Stripe redirects to /payment-success which is
 *      already wired to activate the tier and fire the welcome + receipt
 *      emails.
 *
 * Secondary CTA: cal.com Beratungsgespräch · same lime accent, no exit.
 */
import { useState, useCallback } from 'react';
import { X, CheckCircle2, Sparkles, Shield, ArrowRight, Loader2, Zap, Crown, Calendar, Lock } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { useBookConsultation } from '../brand/BookConsultationButton';
import { useTier } from '../../contexts/TierContext';

const OUTFIT = { fontFamily: 'Outfit, Inter, system-ui, sans-serif' };

const PACKAGES = [
  {
    id: 'leadership_os',
    name: 'Leadership OS',
    badge: null,
    headline: '1 Jahr Vollzugang',
    price: '997',
    suffix: '€',
    sub: 'einmalig · Mehrwertsteuer inkl.',
    bullets: [
      '12 Videokurse · 1/Monat freigeschaltet (Wert 2.388€)',
      'WladBot AI Coach · 24/7 unlimited',
      '30-Tage Leadership Programm · KI-personalisiert',
      'Alle 13 Wlad-Frameworks · Verhandeln · Rhetorik · Konflikt',
      'Video-Analyse · 5 frische Slots bei Kauf',
    ],
    accent: 'foreground',
    cta: 'Direkt kaufen',
  },
  {
    id: 'leadership_os_12x',
    name: 'In 12 Raten',
    badge: 'Flexibel',
    headline: '99 € / Monat · 12 Monate',
    price: '99',
    suffix: '€/Mo',
    sub: 'Gesamt 1.188 € · sofort Vollzugang',
    bullets: [
      'Sofortiger Vollzugang ab Rate 1',
      'Stripe Smart-Retry · automatische Erinnerungen',
      'Gleiche Inhalte wie Einmalkauf',
      'Keine SCHUFA · keine Bonitätsprüfung',
    ],
    accent: 'foreground',
    cta: 'Mit Rate starten',
  },
  {
    id: 'leadership_os_plus',
    name: 'Leadership OS PLUS',
    badge: 'VIP · meist gebucht',
    headline: '1 Jahr · inkl. 1:1 Coaching',
    price: '4.797',
    price: '4.797',
    suffix: '€',
    sub: 'einmalig · 30 Tage Geld-zurück',
    bullets: [
      'ALLES aus Leadership OS',
      '12× Einzelcoaching (je 299€ · Wert 3.588€)',
      'Mastermind-Calls mit Wlad & Team',
      'Priority Support · Video-Analyse unlimited',
      'Exklusive Live-Events vor Ort',
    ],
    accent: 'brand',
    cta: 'OS PLUS freischalten',
  },
];

export const PricingModal = ({ onClose, defaultTier = 'leadership_os' }) => {
  const [selected, setSelected] = useState(defaultTier);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const openCal = useBookConsultation();
  const { tier, isAccelerator } = useTier();

  // Iter 92.9 (Mert): Tier-aware Pricing.
  //   - free / starter  → alle 3 Pakete sichtbar (volle Conversion-Funnel)
  //   - standard        → user hat Leadership OS schon → zeige NUR OS PLUS Upsell
  //   - accelerator/plus→ user hat alles → zeige "All-set" State statt Pakete
  const ownedTier = (tier || 'free').toLowerCase();
  const hasLeadershipOs = ownedTier === 'standard';
  const visiblePackages = isAccelerator
    ? []
    : hasLeadershipOs
      ? PACKAGES.filter((p) => p.id === 'leadership_os_plus')
      : PACKAGES;

  const startCheckout = useCallback(async (packageId) => {
    setBusy(packageId);
    setErr(null);

    // Auto-apply bribe discount code if user earned WLAD10 via Fake-Wlad-Call
    let discountCode;
    try {
      const raw = localStorage.getItem('wlad_discount_code');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.code && parsed?.expires_at > Date.now()) {
          discountCode = parsed.code;
        } else {
          localStorage.removeItem('wlad_discount_code');
        }
      }
    } catch { /* localStorage unavailable */ }

    try {
      const res = await api.post('/payments/checkout', {
        package_id: packageId,
        origin_url: window.location.origin,
        discount_code: discountCode,
      });
      const url = res?.data?.url;
      if (!url) throw new Error('Kein Checkout-Link erhalten');
      // Open Stripe in same tab · safer than popup blocker issues; the
      // success page restores state. No-op on transactional pages.
      window.location.assign(url);
    } catch (e) {
      logger.error('Stripe checkout failed', e);
      setErr(e?.response?.data?.detail || 'Checkout konnte nicht gestartet werden. Bitte erneut versuchen.');
      setBusy(null);
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/72 backdrop-blur-md p-4 animate-fade-in"
      data-testid="pricing-modal"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-card text-foreground shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl px-6 md:px-8 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand/15 flex items-center justify-center">
              <Crown size={15} className="text-brand" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-black">LeaderOS · Pricing</div>
              <h2 className="text-base md:text-lg font-black text-foreground" style={{ ...OUTFIT, letterSpacing: '-0.02em' }}>
                Wähle deinen Pfad
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors"
            data-testid="pricing-close"
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sub-header trust strip */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 md:px-8 py-3 text-[11px] text-muted-foreground border-b border-border/60 bg-foreground/[0.015]">
          <span className="flex items-center gap-1.5 font-semibold"><Shield size={11} className="text-brand" /> SSL · Stripe</span>
          <span className="flex items-center gap-1.5 font-semibold"><CheckCircle2 size={11} className="text-brand" /> 30 Tage Geld-zurück</span>
          <span className="flex items-center gap-1.5 font-semibold"><Sparkles size={11} className="text-brand" /> Sofortiger Vollzugang</span>
          <span className="flex items-center gap-1.5 font-semibold"><Lock size={11} className="text-brand" /> SCA · 3DS-2 secured</span>
        </div>

        {/* Pricing grid */}
        <div className={`grid grid-cols-1 ${visiblePackages.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-3'} gap-4 p-6 md:p-8`}>
          {isAccelerator && (
            <div className="text-center py-8 px-4" data-testid="pricing-already-plus">
              <div className="w-14 h-14 rounded-2xl bg-brand/15 flex items-center justify-center mx-auto mb-4">
                <Crown size={26} className="text-brand" />
              </div>
              <h3 className="text-xl font-black" style={OUTFIT}>Du hast Leadership OS PLUS.</h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                Alle Pakete sind bereits aktiv. Nutze deine 1:1 Coaching-Slots oder buch direkt einen Termin.
              </p>
            </div>
          )}
          {hasLeadershipOs && !isAccelerator && (
            <div className="md:col-span-1 mb-2">
              <div className="text-center bg-brand/[0.06] border border-brand/20 rounded-2xl px-4 py-3" data-testid="pricing-upsell-banner">
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-brand">Du hast Leadership OS</p>
                <p className="text-[13px] font-bold mt-1" style={OUTFIT}>Bereit für 1:1 Coaching mit Wlads Expertenteam?</p>
                <p className="text-[11px] text-muted-foreground mt-1">Upgrade auf OS PLUS · 12 Einzelcoachings inklusive</p>
              </div>
            </div>
          )}
          {visiblePackages.map((pkg) => {
            const isVIP = pkg.id === 'leadership_os_plus';
            const isSelected = selected === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelected(pkg.id)}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all btn-revolut group ${
                  isVIP ? 'gradient-border-anim' : ''
                } ${
                  isSelected
                    ? (isVIP
                        ? 'border-brand bg-brand/[0.04] shadow-[0_8px_28px_-12px_rgba(191,255,0,0.5)]'
                        : 'border-foreground/40 bg-foreground/[0.03]')
                    : 'border-border hover:border-foreground/15 bg-card'
                }`}
                data-testid={`pricing-card-${pkg.id}`}
              >
                {pkg.badge && (
                  <span className={`absolute -top-2.5 left-5 text-[9px] uppercase tracking-wider font-black px-2.5 py-0.5 rounded-full ${
                    isVIP ? 'bg-brand text-[#0A0A0A]' : 'bg-foreground/8 text-foreground/70 border border-border'
                  }`}>
                    {pkg.badge}
                  </span>
                )}

                <h3 className="text-base font-black text-foreground" style={OUTFIT}>{pkg.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{pkg.headline}</p>

                <div className="mt-3.5 mb-3.5 flex items-baseline gap-1">
                  <span
                    className="text-[40px] font-black num-ticker leading-none"
                    style={{ ...OUTFIT, color: isVIP ? 'var(--brand-hex)' : 'inherit' }}
                  >
                    {pkg.price}
                  </span>
                  <span className="text-sm text-muted-foreground font-bold">{pkg.suffix}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/80 mb-4 leading-tight">{pkg.sub}</p>

                <ul className="space-y-2 mb-5">
                  {pkg.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-[12px] text-foreground/85 leading-snug">
                      <CheckCircle2 size={11} className="text-brand mt-1 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <span
                  onClick={(e) => { e.stopPropagation(); startCheckout(pkg.id); }}
                  className={`btn-shine block w-full py-2.5 px-4 rounded-xl text-[12px] font-bold text-center cursor-pointer transition-all ${
                    isVIP
                      ? 'bg-brand text-[#0A0A0A] hover:brightness-105 glow-lime'
                      : 'bg-[#0A0A0A] dark:bg-foreground text-white dark:text-background hover:opacity-90'
                  }`}
                  data-testid={`pricing-buy-${pkg.id}`}
                  role="button"
                >
                  {busy === pkg.id ? (
                    <span className="inline-flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> Lade…</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Zap size={11} /> {pkg.cta} <ArrowRight size={11} />
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {err && (
          <div className="mx-6 md:mx-8 mb-4 -mt-2 text-[12px] text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
            {err}
          </div>
        )}

        {/* Bottom alternate CTA · cal.com booking */}
        <div className="px-6 md:px-8 py-5 border-t border-border bg-foreground/[0.02] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-center md:text-left">
            <p className="text-[13px] font-bold text-foreground" style={OUTFIT}>
              Unsicher, welcher Pfad zu dir passt?
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              15 Min · 1:1 mit einem Argumentorik-Berater · unverbindlich.
            </p>
          </div>
          <button
            onClick={() => { onClose(); openCal(); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground/[0.05] hover:bg-foreground/[0.1] text-foreground text-[12px] font-bold transition-colors btn-revolut"
            data-testid="pricing-book-cal"
          >
            <Calendar size={13} /> Beratungsgespräch buchen <ArrowRight size={11} />
          </button>
        </div>

        {/* Tiny legal footer */}
        <p className="text-center text-[10px] text-muted-foreground/60 py-3">
          Sichere Zahlung via Stripe · Karte · SEPA · Apple Pay · Google Pay · Klarna
        </p>
      </div>
    </div>
  );
};

export default PricingModal;
