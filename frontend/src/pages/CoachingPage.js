import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { LayerCard } from '../components/coaching/LayerCard';
import { FAQItem } from '../components/coaching/FAQItem';
import { TierPricingGrid } from '../components/coaching/TierPricingGrid';
import { CoachingRightPanel } from '../components/coaching/CoachingRightPanel';
import { getLayers, getFaqs, getTestimonials } from '../components/coaching/coachingData';
import api from '../lib/api';
import logger from '../lib/logger';
import { openStrategyCall } from '../lib/calendly';
import {
  ArrowRight, Sparkles, PlayCircle, HelpCircle, Quote, TrendingUp, Users, Star
} from 'lucide-react';

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
  const navigate = useNavigate();
  const de = lang === 'de';
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const pricingRef = useRef(null);

  const handleStripeCheckout = async (packageId) => {
    setCheckoutLoading(packageId);
    try {
      const endpoint = packageId === 'accelerator_installment_followup'
        ? '/payments/installment/next'
        : '/payments/checkout';
      const res = await api.post(endpoint, { package_id: packageId, origin_url: window.location.origin });
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      logger.error('Checkout error:', err);
      alert(de ? 'Checkout fehlgeschlagen. Bitte versuche es erneut.' : 'Checkout failed. Please try again.');
    } finally { setCheckoutLoading(false); }
  };

  // Auto-start installment checkout if ?installment=next query param present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('installment') === 'next') {
      handleStripeCheckout('accelerator_installment_followup');
      const url = new URL(window.location.href);
      url.searchParams.delete('installment');
      window.history.replaceState({}, '', url.toString());
    }
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
                  <>Werde der Leader, der <span className="gradient-text">klar denkt</span>, klar spricht und klar führt.</>
                ) : (
                  <>Become the leader who <span className="gradient-text">thinks clearly</span>, speaks clearly, and leads clearly.</>
                )}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                {de
                  ? 'Ein KI-gestütztes Coaching-System auf Basis von Wlad, das deine Kommunikation, Wirkung und Entscheidungsfähigkeit in Echtzeit trainiert.'
                  : 'An AI-powered coaching system based on Wlad — training your communication, impact and decision-making in real time.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={scrollToPricing}
                  className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold h-12 px-6 shadow-lg shadow-[#BFFF00]/20"
                  data-testid="hero-primary-cta"
                >
                  {de ? 'Coaching starten' : 'Start Coaching'}
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
            </div>

            {/* Right: 3-Layer Glass Stack visual — Iter 92.46 rebuilt for
                real 3-card staggered peek (not overlap). */}
            <div className="relative h-[500px] hidden lg:block" data-testid="hero-glass-stack">
              {/* Ambient gradient */}
              <div className="absolute inset-8 bg-gradient-to-br from-[#BFFF00]/[0.14] via-transparent to-purple-500/[0.10] rounded-[3rem] blur-3xl pointer-events-none" />
              {/* Stack cards — staggered on both axes for real depth */}
              {layers.map((layer, idx) => {
                // idx 0 top-left, idx 1 center, idx 2 bottom-right
                const positions = [
                  { x: -110, y: -155, rotate: -8, z: 10 },
                  { x:    0, y:  -20, rotate:  0, z: 20 },
                  { x: 110,  y:  130, rotate:  8, z: 30 },
                ];
                const pos = positions[idx];
                const gradientCss = `linear-gradient(135deg, ${layer.gradient})`;
                return (
                  <div
                    key={layer.number}
                    className="absolute left-1/2 top-1/2 w-[300px] rounded-[28px] backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] animate-fade-in transition-transform duration-500 hover:scale-[1.03] hover:z-40"
                    style={{
                      transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) rotate(${pos.rotate}deg)`,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.75))',
                      animationDelay: `${idx * 140}ms`,
                      zIndex: pos.z,
                    }}
                  >
                    <div className="p-6 dark:bg-[#0A0A0A]/60 rounded-[28px]">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xl"
                          style={{ background: gradientCss, boxShadow: `0 12px 30px -8px ${layer.gradient.split(',')[0]}80` }}
                        >
                          <layer.icon size={26} className="text-white" strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/40 dark:text-white/50">
                            Layer {layer.number}
                          </p>
                          <p className="text-[15px] font-black leading-tight mt-1 text-[#0A0A0A] dark:text-white">{layer.title}</p>
                          <p className="text-[11.5px] leading-relaxed text-black/55 dark:text-white/55 mt-1.5 line-clamp-2">{layer.description}</p>
                        </div>
                      </div>
                      {/* Mini feature-dots */}
                      <div className="mt-4 pt-4 border-t border-black/[0.05] dark:border-white/[0.06] flex gap-1">
                        {[0,1,2,3,4].map((i) => (
                          <span
                            key={i}
                            className="h-1 flex-1 rounded-full"
                            style={{ background: i < 4 ? layer.gradient.split(',')[0] : 'rgba(0,0,0,0.06)' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

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

        {/* ── PRICING ── 3-Tier Funnel ── */}
        <section ref={pricingRef} className="animate-fade-in stagger-3 scroll-mt-8" data-testid="pricing-section">
          <TierPricingGrid onCheckout={handleStripeCheckout} checkoutLoading={checkoutLoading} de={de} />
        </section>

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
            {testimonials.map((t, idx) => {
              // Curated professional Unsplash headshots (Founder / Team Lead / Consultant)
              const AVATARS = [
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=faces&q=80',
                'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=faces&q=80',
                'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces&q=80',
              ];
              return (
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
                        src={AVATARS[idx]}
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
              );
            })}
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
