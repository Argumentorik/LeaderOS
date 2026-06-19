import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { LayerCard } from '../components/coaching/LayerCard';
import { FAQItem } from '../components/coaching/FAQItem';
import { PremiumProgram } from '../components/coaching/PremiumProgram';
import { TierPricingGrid } from '../components/coaching/TierPricingGrid';
import { CoachingRightPanel } from '../components/coaching/CoachingRightPanel';
import { CoachingPathCard } from '../components/coaching/CoachingPathCard';
import { getLayers, getCoachingPaths, getFaqs, WLAD_AVATAR } from '../components/coaching/coachingData';
import api from '../lib/api';
import logger from '../lib/logger';
import { openStrategyCall } from '../lib/calendly';
import {
  ArrowRight, Users, TrendingUp, Calendar, Sparkles, ExternalLink,
  Zap, Target, Lightbulb, Award, Phone, Star, HelpCircle, Loader2
} from 'lucide-react';

export default function CoachingPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const de = lang === 'de';
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  // Auto-start installment checkout if ?installment=next query param present (from email link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('installment') === 'next') {
      handleStripeCheckout('accelerator_installment_followup');
      const url = new URL(window.location.href);
      url.searchParams.delete('installment');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const layers = getLayers(de);
  const coachingPaths = getCoachingPaths(de, navigate, handleStripeCheckout);
  const faqs = getFaqs(de);
  const stats = [
    { icon: Users, value: '2.500+', label: de ? 'Leader gecoacht' : 'Leaders coached' },
    { icon: Star, value: '4.9/5', label: de ? 'Bewertung' : 'Rating' },
    { icon: TrendingUp, value: '87%', label: de ? 'Befoerderungsrate' : 'Promotion rate' },
    { icon: Award, value: '12+', label: de ? 'Jahre Erfahrung' : 'Years experience' },
  ];

  return (
    <DashboardLayout rightPanel={<CoachingRightPanel de={de} onCheckout={handleStripeCheckout} />}>
      <div className="p-6 lg:p-8 max-w-4xl space-y-8" data-testid="coaching-page">

        {/* Hero */}
        <div className="flex flex-col lg:flex-row items-center gap-8 animate-fade-in">
          <div className="relative shrink-0">
            <img src={WLAD_AVATAR} alt="Wlad Jachtchenko"
              className="w-28 h-28 rounded-2xl object-cover shadow-2xl ring-4 ring-[#BFFF00]/20 dark:ring-[#BFFF00]/20" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] flex items-center justify-center border-3 border-white dark:border-card shadow-lg">
              <Sparkles size={18} className="text-white" />
            </div>
          </div>
          <div>
            <Badge className="bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] border-0 text-[10px] font-bold px-3 py-1 mb-3">DEIN COACHING HUB</Badge>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {de ? 'Dein Coaching ' : 'Your Coaching '}<span className="gradient-text">Hub</span>
            </h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              {de
                ? 'Drei Wege zum KI-nativen Leader: Leadership OS für Solo-Leader (€997/Jahr), OS PLUS mit 12× 1:1 Coaching durch Argumentorik-Coaches (€4.797/Jahr), oder Enterprise mit bis zu 50% Volume-Discount für Teams.'
                : 'Three paths to AI-native leadership: Leadership OS for solo leaders (€997/year), OS PLUS with 12× 1:1 coaching by Argumentorik coaches (€4,447/year), or Enterprise with up to 50% volume discount for teams.'}
            </p>
          </div>
        </div>

        {/* 3-Layer Model */}
        <div className="animate-fade-in stagger-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center"><Lightbulb size={11} className="text-[#0A0A0A]" /></div>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-muted-foreground">{de ? 'Das 3-Layer-Modell' : 'The 3-Layer Model'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {layers.map((layer) => <LayerCard key={layer.number} {...layer} />)}
          </div>
        </div>

        {/* Coaching Paths */}
        <div className="animate-fade-in stagger-3">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"><Target size={11} className="text-white" /></div>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-muted-foreground">{de ? 'Dein Weg' : 'Your Path'}</h2>
          </div>
          <div className="space-y-4">
            {coachingPaths.map((path) => <CoachingPathCard key={path.id} path={path} />)}
          </div>
        </div>

        {/* NEW: 3-Tier Pricing (replaces old PremiumProgram — keeps old for back-compat below) */}
        <TierPricingGrid onCheckout={handleStripeCheckout} checkoutLoading={checkoutLoading} de={de} />

        {/* Booking */}
        <Card className="overflow-hidden animate-fade-in stagger-5 border-black/[0.06] dark:border-white/[0.06]" data-testid="booking-section">
          <CardContent className="p-0">
            <div className="p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
              <h3 className="text-lg font-bold flex items-center gap-2"><Calendar size={18} className="text-[#6B8A00] dark:text-[#BFFF00]" />{de ? 'Strategiegespräch buchen' : 'Book Strategy Call'}</h3>
              <p className="text-sm text-muted-foreground">{de ? '15 Min · 1:1 · unverbindlich' : '15 min · 1:1 · no obligation'}</p>
            </div>
            <div className="p-8 flex items-center justify-center bg-gradient-to-br from-[#BFFF00]/[0.06] to-[#BFFF00]/[0.04] dark:from-[#BFFF00]/[0.04] dark:to-[#BFFF00]/[0.03]">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center mx-auto shadow-lg shadow-[#BFFF00]/15"><Phone size={28} className="text-[#0A0A0A]" /></div>
                <p className="text-sm text-muted-foreground max-w-sm">{de ? 'Wlads Head Coach analysiert deine aktuelle Situation und zeigt dir, wie du in 90 Tagen messbare Ergebnisse erzielst.' : 'Wlad\'s Head Coach analyzes your situation and shows how to achieve measurable results in 90 days.'}</p>
                <Button className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white font-bold shadow-lg shadow-[#BFFF00]/15 px-6"
                  onClick={() => openStrategyCall('coaching-page')} data-testid="book-call-btn">
                  <Calendar size={14} className="mr-2" />{de ? 'Strategiegespräch buchen' : 'Book Strategy Call'} <ExternalLink size={12} className="ml-1.5 opacity-70" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in stagger-5">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-white/60 dark:bg-card/50 backdrop-blur-sm border-black/[0.04] dark:border-white/[0.06]">
              <CardContent className="p-5 text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center mx-auto mb-3 shadow-sm"><stat.icon size={18} className="text-[#0A0A0A]" /></div>
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <Card className="animate-fade-in stagger-6" data-testid="faq-section">
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center"><HelpCircle size={11} className="text-white" /></div>
              <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-muted-foreground">{de ? 'Häufige Fragen' : 'FAQ'}</h2>
            </div>
            <div>{faqs.map((faq) => <FAQItem key={faq.q} question={faq.q} answer={faq.a} />)}</div>
          </CardContent>
        </Card>

        {/* Support Footer */}
        <div className="text-center py-4 animate-fade-in stagger-6">
          <p className="text-sm text-muted-foreground">
            {de ? 'Noch Fragen? ' : 'Questions? '}
            <button onClick={() => window.open('mailto:support@leader-os.de')} className="text-[#4A6200] dark:text-[#BFFF00] font-bold hover:underline" data-testid="support-link">{de ? 'Support kontaktieren' : 'Contact Support'}</button>
            {de ? ' oder schreib uns an ' : ' or email us at '}
            <a href="mailto:support@leader-os.de" className="text-[#4A6200] dark:text-[#BFFF00] font-bold hover:underline">support@leader-os.de</a>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
