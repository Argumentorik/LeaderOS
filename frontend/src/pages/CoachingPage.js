import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
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
import { getLayers, getFaqs, getTestimonials } from '../components/coaching/coachingData';
import { useAuth } from '../contexts/AuthContext';
import {
  CostSection, IdentityShift, WhyCoursesFail, EngineLoop, MondayMorning,
  ProofNumbers, ValueIntro, CoffeeLine, ComparisonTable, RoiCalculator,
  RiskReversal, PersonalBlock, FinalClose, ScoreTeaser,
} from '../components/coaching/ConversionSections';
import api from '../lib/api';
import logger from '../lib/logger';
import { openStrategyCall } from '../lib/calendly';
import {
  ArrowRight, Sparkles, PlayCircle, HelpCircle, Quote, TrendingUp, Users, Star
} from 'lucide-react';

// Iter 92.46 · module-scope constant so React doesn't recreate on every render.
const TESTIMONIAL_AVATARS = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces&q=80',
];

/**
 * CoachingPage — high-converting landing-style hub (Iter 92.35, Mert).
 *
 * Funnel architecture:
 *   Hero      → Primary CTA "Coaching starten" (scroll to pricing)
 *               Secondary CTA "Demo ansehen" (→ /chat)
 *   3-Layer   → KI · Rhetorik · EQ (glass-stack feel via LayerCard)
 *   Pricing   → €997 Stripe · €4.797 Cal.com · Enterprise Cal.com
 *   Social    → 3 testimonials + stats (2.500+ / 87% / +42%)
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

  const handleStripeCheckout = async (packageId, discountCode = null) => {
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
      alert(de ? 'Checkout fehlgeschlagen. Bitte versuche es erneut.' : 'Checkout failed. Please try again.');
    } finally { setCheckoutLoading(false); }
  };

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
  }, []);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const layers = getLayers(de);
  const faqs = getFaqs(de);
  const testimonials = getTestimonials(de);
  const stats = [
    { icon: Users, value: '2.500+', label: de ? 'Leader gecoacht' : 'Leaders coached' },
    { icon: TrendingUp, value: '87%', label: de ? 'verbessern Kommunikation in 14 Tagen' : 'improve communication in 14 days' },
    { icon: Sparkles, value: '+42%', label: de ? 'bessere Präsentationsscores' : 'better presentation scores' },
    { icon: Star, value: '4.9/5', label: de ? 'Bewertung' : 'Rating' },
  ];

  return (
    <DashboardLayout rightPanel={<CoachingRightPanel de={de} onCheckout={handleStripeCheckout} />}>
      <div className="p-6 lg:p-8 max-w-5xl space-y-16" data-testid="coaching-page">

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
                {de ? 'DEIN LEADERSHIP COACHING SYSTEM' : 'YOUR LEADERSHIP COACHING SYSTEM'}
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                {de ? (
                  <>Du bist <span className="gradient-text">näher dran</span>, als du denkst.</>
                ) : (
                  <>You&rsquo;re <span className="gradient-text">closer</span> than you think.</>
                )}
              </h1>
              <div className="space-y-1.5 text-[15px] sm:text-[16px] font-semibold text-foreground/80 max-w-xl">
                <p>{de ? 'Jedes Gespräch, das du vermeidest …' : 'Every conversation you avoid …'}</p>
                <p>{de ? 'Jede Entscheidung, die du aufschiebst …' : 'Every decision you delay …'}</p>
                <p>{de ? 'Jedes Meeting, nach dem du denkst: „Das hätte ich anders sagen sollen" …' : 'Every meeting you leave wishing you\'d said it differently …'}</p>
              </div>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                {de
                  ? <>… kostet dich Einfluss. Leader-OS — auf Basis von Wlads Methodik — trainiert dich zu dem Leader, dem Menschen <em className="not-italic font-semibold text-foreground">von selbst folgen</em>.</>
                  : <>… is costing you influence. Leader-OS — built on Wlad&rsquo;s methodology — trains you into the leader people <em className="not-italic font-semibold text-foreground">naturally follow</em>.</>}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={scrollToPricing}
                  className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold h-12 px-6 shadow-lg shadow-[#BFFF00]/20"
                  data-testid="hero-primary-cta"
                >
                  {de ? 'Starte deine Leadership-Journey' : 'Start My Leadership Journey'}
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
                      ? '„Starte kostenlos — ich kalibriere mich in 60 Sekunden auf dich. Keine Kreditkarte, kein Risiko."'
                      : '"Start free — I calibrate to you in 60 seconds. No credit card, no risk."'}
                  </p>
                </div>
              </div>
            </div>
            <ScoreTeaser de={de} onCta={scrollToPricing} />
          </div>
        </section>

        {/* ── 2+3. AGITATE + IDENTITY (Iter 92.60 Conversion-Engine) ── */}
        <CostSection de={de} />
        <IdentityShift de={de} />

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

        {/* ── 4-6. MECHANISM + VISION + PROOF ── */}
        <WhyCoursesFail de={de} />
        <EngineLoop de={de} />
        <MondayMorning de={de} />
        <ProofNumbers de={de} />

        {/* ── PRICING ── 3-Tier Funnel ── */}
        <section ref={pricingRef} className="animate-fade-in stagger-3 scroll-mt-8" data-testid="pricing-section">
          <ValueIntro de={de} />
          <TierPricingGrid onCheckout={handleStripeCheckout} checkoutLoading={checkoutLoading} de={de} />
          <CoffeeLine de={de} />
        </section>

        {/* ── 11-13. COMPARISON + ROI + RISK REVERSAL ── */}
        <ComparisonTable de={de} />
        <RoiCalculator de={de} />
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

        {/* ── SOCIAL PROOF ── stats + testimonials ── */}
        <section className="space-y-8 animate-fade-in stagger-5" data-testid="social-proof-section">
          {/* Stats — Iter 92.46 GODMODE polish: bigger gradient tiles, better shadows */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="group bg-white dark:bg-card/60 border-black/[0.04] dark:border-white/[0.06] hover:border-[#BFFF00]/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
                <CardContent className="p-6 text-center">
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-2xl bg-[#BFFF00] blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#BFFF00] via-[#B0E600] to-[#9ACC00] flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(191,255,0,0.5)]">
                      <stat.icon size={22} className="text-[#0A0A0A]" strokeWidth={2.6} />
                    </div>
                  </div>
                  <p className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-bold mt-1.5 leading-tight">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Testimonials — Iter 92.46 GODMODE: real Unsplash professional face images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, idx) => (
                <Card
                  key={t.author + idx}
                  className="group border-black/[0.04] dark:border-white/[0.06] hover:shadow-2xl hover:-translate-y-1 transition-all"
                  data-testid={`testimonial-${idx}`}
                >
                  <CardContent className="p-6 space-y-4">
                    {/* 5-star rating */}
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={13} className="fill-[#BFFF00] text-[#BFFF00]" />
                      ))}
                    </div>
                    <Quote size={22} className="text-[#BFFF00]/70" />
                    <p className="text-[14px] font-medium leading-relaxed text-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                      <img
                        src={TESTIMONIAL_AVATARS[idx]}
                        alt={t.author}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-[#BFFF00]/30 group-hover:ring-[#BFFF00]/60 transition-all"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div>
                        <p className="text-[13px] font-black">{t.author}</p>
                        <p className="text-[11px] text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
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

        {/* ── SECRET: Behavioral Personalization (nur Free-Tier) + Identity Close ── */}
        {(user?.tier === 'free' || !user?.tier) && (
          <PersonalBlock de={de} user={user} onCta={scrollToPricing} />
        )}
        <FinalClose de={de} onCta={scrollToPricing} />

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
    </DashboardLayout>
  );
}
