import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PublicPageShell } from '../components/layout/PublicPageShell';
import { useSeo } from '../lib/seo';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { LayerCard } from '../components/coaching/LayerCard';
import { WladBotAvatar } from '../components/brand/WladBotAvatar';
import { FAQItem } from '../components/coaching/FAQItem';
import { TierPricingGrid } from '../components/coaching/TierPricingGrid';
import { CoachingRightPanel } from '../components/coaching/CoachingRightPanel';
import { getLayers, getFaqs } from '../components/coaching/coachingData';
import { useAuth } from '../contexts/AuthContext';
import {
  WhyCoursesFail, EngineLoop, ComparisonTable,
  RiskReversal, PersonalBlock, ScoreTeaser,
} from '../components/coaching/ConversionSections';
import api from '../lib/api';
import logger from '../lib/logger';
import { toast } from 'sonner';
import { openStrategyCall } from '../lib/calendly';
import { MasterclassAccessCard } from '../components/coaching/MasterclassAccessCard';
import { CourseCatalogSection } from '../components/coaching/CourseCatalogSection';
import { CoachingVideoSection } from '../components/coaching/CoachingVideoSection';
import {
  ArrowRight, PlayCircle, HelpCircle
} from 'lucide-react';

/**
 * CoachingPage — high-converting landing-style hub (Iter 92.35, Mert).
 *
 * Funnel architecture:
 *   Hero      → Primary CTA "Coaching starten" (scroll to pricing)
 *               Secondary CTA "Demo ansehen" (→ /chat)
 *   3-Layer   → KI · Rhetorik · EQ (glass-stack feel via LayerCard)
 *   Pricing   → €997 Stripe · €4.797 Cal.com · Enterprise Cal.com
 *   FAQ       → 5 user-supplied questions
 */
export default function CoachingPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const de = lang === 'de';
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [testCode, setTestCode] = useState(null);
  const pricingRef = useRef(null);

  // Iter 185: Diese Seite ist öffentlich — auffindbar für Suche und KI.
  const faqJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        mainEntity: getFaqs(de).map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'Course',
        name: de ? 'Leadership-Programm mit Wlad Jachtchenko' : 'Leadership programme with Wlad Jachtchenko',
        description: de
          ? 'KI-Coach, Videokurse, Gesprächs-Training und Video-Analyse für Führungskräfte — plus persönliches Coaching.'
          : 'AI coach, video courses, conversation training and video analysis for leaders — plus personal coaching.',
        inLanguage: de ? 'de' : 'en',
        provider: { '@type': 'Organization', name: 'Leader-OS', url: 'https://leaderos.de' },
      },
    ],
  }), [de]);

  useSeo({
    path: '/leadership-programm',
    jsonLd: faqJsonLd,
    title: de
      ? 'Leadership-Programm mit Wlad Jachtchenko · Preise, Inhalte, häufige Fragen'
      : 'Leadership programme with Wlad Jachtchenko · pricing, content, FAQ',
    description: de
      ? 'Führung lernen mit KI-Coach, Kursen und Gesprächs-Training — plus persönliches Coaching mit Wlad Jachtchenko. Preise, Leistungen und häufige Fragen auf einer Seite.'
      : 'Learn leadership with an AI coach, courses and conversation training — plus personal coaching with Wlad Jachtchenko. Pricing, content and FAQ on one page.',
  });

  const handleStripeCheckout = useCallback(async (packageId, discountCode = null) => {
    // Iter 185: Ohne Login zuerst Konto anlegen — danach direkt zurück hierher.
    if (!user) {
      navigate(`/signup?next=${encodeURIComponent('/leadership-programm')}`);
      return;
    }
    setCheckoutLoading(packageId);
    try {
      const endpoint = packageId === 'accelerator_installment_followup'
        ? '/payments/installment/next'
        : '/payments/checkout';
      const payload = { package_id: packageId, origin_url: window.location.origin };
      if (discountCode) payload.discount_code = discountCode;
      const res = await api.post(endpoint, payload);
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      logger.error('Checkout error:', err);
      toast.error(err?.response?.data?.detail || (de ? 'Checkout fehlgeschlagen. Bitte versuche es erneut.' : 'Checkout failed. Please try again.'));
    } finally { setCheckoutLoading(false); }
  }, [de, user, navigate]);

  // Auto-start installment checkout if ?installment=next query param present.
  // Iter 92.59: ?code=WLAD-… shows the 1€ live-test activation banner.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('installment') === 'next') {
      handleStripeCheckout('accelerator_installment_followup');
      const url = new URL(window.location.href);
      url.searchParams.delete('installment');
      window.history.replaceState({}, '', url.toString());
    }
    const code = params.get('code');
    if (code && code.toUpperCase().startsWith('WLAD-1EURO')) setTestCode(code.toUpperCase());
  }, [handleStripeCheckout]);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const layers = getLayers(de);
  const faqs = getFaqs(de);

  const body = (
    <div className={`p-6 lg:p-8 space-y-16 ${user ? 'max-w-5xl' : 'max-w-5xl mx-auto'}`} data-testid="coaching-page">

        {/* ── 1€ LIVE-TEST ACTIVATION (Iter 92.59, code-gated) ── */}
        {testCode && (
          <div className="relative rounded-2xl overflow-hidden border border-[#BFFF00]/30 bg-gradient-to-r from-[#0A0A0A] to-[#16210A] shadow-[0_16px_40px_-16px_rgba(191,255,0,0.25)] animate-fade-in" data-testid="test-activation-banner">
            <div aria-hidden className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#BFFF00]/[0.14] blur-[40px] pointer-events-none" />
            <div className="relative flex flex-wrap items-center gap-4 p-5">
              <WladBotAvatar size={44} live />
              <div className="flex-1 min-w-[220px]">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#BFFF00]">{de ? 'Aktivierungscode erkannt' : 'Activation code detected'} · {testCode}</p>
                <p className="text-[14px] font-bold text-white mt-0.5">{de ? 'Live-Test: Leadership OS für 1 € aktivieren' : 'Live test: activate Leadership OS for €1'}</p>
                <p className="text-[11px] text-white/45">{de ? 'Voller Standard-Zugang · echter Stripe-Checkout · nur für freigeschaltete Accounts' : 'Full standard access · real Stripe checkout · allow-listed accounts only'}</p>
              </div>
              <button
                onClick={() => handleStripeCheckout('leadership_os_1eur_test', testCode)}
                disabled={checkoutLoading === 'leadership_os_1eur_test'}
                className="px-5 h-11 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[13px] font-bold transition-all shadow-lg shadow-[#BFFF00]/25 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50"
                data-testid="test-activation-btn"
              >
                {checkoutLoading === 'leadership_os_1eur_test' ? (de ? 'Wird geladen…' : 'Loading…') : (de ? 'Für 1 € aktivieren →' : 'Activate for €1 →')}
              </button>
            </div>
          </div>
        )}

        {/* ── HERO ── Apple/Tesla style: bold typo + 3-Layer Glass Stack ── */}
        <section className="relative pt-4 animate-fade-in" data-testid="coaching-hero">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: Copy */}
            <div className="space-y-6">
              <Badge className="bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] border-[#BFFF00]/25 font-bold text-[10px] tracking-[0.12em]">
                {de ? 'LEADERSHIP OPERATING SYSTEM' : 'LEADERSHIP OPERATING SYSTEM'}
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                {de ? (
                  <>Führung ist <span className="gradient-text">trainierbar</span>.</>
                ) : (
                  <>Leadership is <span className="gradient-text">trainable</span>.</>
                )}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                {de
                  ? <>Leader-OS trainiert die Gespräche, die deinen Alltag entscheiden — Feedback, Konflikte, Verhandlungen, Auftritte. Mit KI-Simulationen, Video-Analyse und einem Coach auf Basis von Wlads dokumentierter Methodik.</>
                  : <>Leader-OS trains the conversations that decide your day — feedback, conflict, negotiation, presence. With AI simulations, video analysis and a coach built on Wlad&rsquo;s documented methodology.</>}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={scrollToPricing}
                  className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold h-12 px-6 shadow-lg shadow-[#BFFF00]/20"
                  data-testid="hero-primary-cta"
                >
                  {de ? 'Coaching starten' : 'Start coaching'}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
                <Button
                  onClick={() => navigate('/chat')}
                  variant="outline"
                  className="border-[#0A0A0A]/15 dark:border-white/15 h-12 px-6 font-bold"
                  data-testid="hero-secondary-cta"
                >
                  <PlayCircle size={16} className="mr-2" />
                  {de ? 'Demo ansehen' : 'Watch Demo'}
                </Button>
              </div>
              {/* Inline trust badges */}
              <div className="flex flex-wrap items-center gap-4 pt-3 text-[11px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {de ? '30-Tage Geld-zurück' : '30-day money-back'}
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {de ? 'Ratenzahlung' : 'Installments'}
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {de ? 'Upgrade jederzeit' : 'Upgrade anytime'}
                </span>
              </div>

              {/* WladBot 3.0 — conversion anchor (Iter 92.56) */}
              <div className="flex items-start gap-3 mt-5 p-4 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] max-w-xl" data-testid="coaching-wladbot-strip">
                <WladBotAvatar size={46} live />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#BFFF00] mb-1">
                    {de ? 'WladBot 3.0 · Dein Coach ab Tag 1' : 'WladBot 3.0 · Your coach from day one'}
                  </p>
                  <p className="text-[12.5px] text-white/70 leading-relaxed">
                    {de
                      ? 'Starte kostenlos — keine Kreditkarte. WladBot antwortet auf Basis von Wlads Kursen und Frameworks.'
                      : 'Start free — no credit card. WladBot answers based on Wlad\'s courses and frameworks.'}
                  </p>
                </div>
              </div>
            </div>
            <ScoreTeaser de={de} onCta={scrollToPricing} />
          </div>
        </section>

        {/* ── WLAD VIDEO: Pakete, Prozess, Ergebnis (value-first) ── */}
        <CoachingVideoSection de={de} />

        {/* ── 3-LAYER SYSTEM ── full breakdown ── */}
        <section className="animate-fade-in stagger-2" data-testid="three-layer-section">
          <div className="text-center space-y-2 max-w-2xl mx-auto mb-8">
            <Badge className="bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] border-[#BFFF00]/25 font-bold text-[10px]">
              {de ? 'DAS 3-LAYER SYSTEM' : 'THE 3-LAYER SYSTEM'}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              {de ? 'Drei Schichten — ' : 'Three layers — '}<span className="gradient-text">ein Leader</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {de
                ? 'Jede Schicht trainiert eine andere Dimension deiner Wirkung. Zusammen ergeben sie den modernen, KI-nativen Leader.'
                : 'Each layer trains a different dimension of your impact. Together they form the modern AI-native leader.'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {layers.map((layer) => <LayerCard key={layer.number} {...layer} />)}
          </div>
        </section>

        {/* ── PRODUCT MECHANISM ── */}
        <WhyCoursesFail de={de} />
        <EngineLoop de={de} />

        {/* ── KURS-BIBLIOTHEK als Paketinhalt (Upsell: jeder sieht die ganze Struktur) ── */}
        <CourseCatalogSection de={de} onCta={scrollToPricing} />

        {/* ── MASTERCLASS: free access explainer (before pricing) ── */}
        {user?.masterclass && (!user?.tier || user?.tier === 'free') && (
          <MasterclassAccessCard de={de} />
        )}

        {/* ── PRICING ── 3-Tier Funnel ── */}
        <section ref={pricingRef} className="animate-fade-in stagger-3 scroll-mt-8" data-testid="pricing-section">
          <TierPricingGrid onCheckout={handleStripeCheckout} checkoutLoading={checkoutLoading} de={de} />
        </section>

        {/* ── COMPARISON + RISK REVERSAL ── */}
        <ComparisonTable de={de} />
        <RiskReversal de={de} onCta={scrollToPricing} />

        {/* ── 1:1 COACHING CTA ── strategy-call bridge ── */}
        <section className="animate-fade-in stagger-4" data-testid="strategy-call-section">
          <Card className="overflow-hidden border-black/[0.06] dark:border-white/[0.06] bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] text-white">
            <CardContent className="p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="flex-1 space-y-3">
                  <Badge className="bg-[#BFFF00]/15 text-[#BFFF00] border-[#BFFF00]/30 font-bold text-[10px]">
                    {de ? '1:1 STRATEGIEGESPRÄCH' : '1:1 STRATEGY CALL'}
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {de
                      ? 'Nicht sicher, welcher Pfad zu dir passt?'
                      : 'Not sure which path fits you?'}
                  </h3>
                  <p className="text-sm text-white/60 max-w-xl">
                    {de
                      ? '15 Min · 1:1 · unverbindlich. Wlads Head-Coach analysiert deine aktuelle Situation und zeigt dir, wie du in 90 Tagen messbare Ergebnisse erzielst.'
                      : '15 min · 1:1 · no obligation. Wlad\'s head coach analyzes your situation and shows how to reach measurable results in 90 days.'}
                  </p>
                </div>
                <Button
                  onClick={() => openStrategyCall('coaching-strategy-cta')}
                  className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold h-12 px-6 shadow-lg shadow-[#BFFF00]/20 shrink-0"
                  data-testid="book-call-btn"
                >
                  {de ? 'Strategiegespräch buchen' : 'Book Strategy Call'}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── FAQ ── */}
        <section className="animate-fade-in stagger-6" data-testid="faq-section">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                  <HelpCircle size={11} className="text-white" />
                </div>
                <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-muted-foreground">
                  {de ? 'Häufige Fragen' : 'FAQ'}
                </h2>
              </div>
              <div>{faqs.map((faq) => <FAQItem key={faq.q} question={faq.q} answer={faq.a} />)}</div>
            </CardContent>
          </Card>
        </section>

        {/* ── Personalization (Free-Tier only) ── */}
        {(user?.tier === 'free' || !user?.tier) && (
          <PersonalBlock de={de} user={user} onCta={scrollToPricing} />
        )}

        {/* ── Support Footer ── */}
        <div className="text-center py-4 animate-fade-in stagger-6">
          <p className="text-sm text-muted-foreground">
            {de ? 'Noch Fragen? ' : 'Questions? '}
            <a
              href="mailto:support@leaderos.de"
              className="text-[#4A6200] dark:text-[#BFFF00] font-bold hover:underline"
              data-testid="support-email"
            >
              support@leaderos.de
            </a>
          </p>
        </div>
    </div>
  );

  if (!user) return <PublicPageShell>{body}</PublicPageShell>;
  return (
    <DashboardLayout rightPanel={<CoachingRightPanel de={de} onCheckout={handleStripeCheckout} />}>
      {body}
    </DashboardLayout>
  );
}

