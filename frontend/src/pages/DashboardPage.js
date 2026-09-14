import { useEffect, useState, useCallback } from 'react';
import logger from '../lib/logger';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { OnboardingTour } from '../components/shared/OnboardingTour';
import { OnboardingVideoModal } from '../components/onboarding/OnboardingVideoModal';
import { StripeModeBanner } from '../components/admin/StripeModeBanner';
import { AnimatedNumber } from '../components/dashboard/AnimatedNumber';
import { StatCardsRow, QuickActionsGrid } from '../components/dashboard/StatCards';
import { WladHubDiagnosisCard } from '../components/dashboard/WladHubCard';
import { WladMotivationCard } from '../components/dashboard/WladMotivationCard';
import { FolderWorkspaceCards } from '../components/dashboard/FolderWorkspaceCards';
import { ActionInbox } from '../components/dashboard/ActionInbox';
import { JourneyCard } from '../components/dashboard/JourneyCard';
import { ArgumentationPrepCard } from '../components/dashboard/ArgumentationPrepCard';
import { DashboardFirstTour } from '../components/onboarding/DashboardFirstTour';
import { GuideClipsRow } from '../components/guide/GuideClipsRow';
import api from '../lib/api';
import { loadDashboardBootstrap } from '../lib/dashboardBootstrap';
import { CreditBadge } from '../components/dashboard/CreditBadge';
import { UpcomingEventsCard } from '../components/dashboard/UpcomingEventsCard';
import { DashboardMore } from '../components/dashboard/DashboardMore';
import { TierBadge } from '../components/shared/TierBadge';
import { useTier } from '../contexts/TierContext';
import {
  ArrowRight, Flame, ChevronRight,
  MessageSquareText, Sparkles, CheckCircle2, Star, Gift,
  Share2, Copy, Play, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePricing } from '../contexts/PricingContext';
import { toast } from 'sonner';
import { LEADERCHECK_URL } from '../lib/domains';

import { WLAD_AVATAR } from '../lib/brand';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { open: openPricing } = usePricing();
  const de = lang === 'de';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      // Iter 168: ein Request für alles (Dashboard, Referral, Events, Videos, Clips, Ordner) — Widgets lesen ihre Scheibe aus dem Bündel
      const b = await loadDashboardBootstrap();
      setData(b.dashboard);
      setReferralCode(b.referral?.code || '');
    } catch (err) {
      logger.warn('Dashboard bootstrap failed, falling back to single requests:', err?.message);
      try {
        const [dashRes, refRes] = await Promise.all([
          api.get('/dashboard-v4').catch(() => api.get('/dashboard')),
          api.get('/referral/code').catch(() => ({ data: {} })),
        ]);
        setData(dashRes.data);
        setReferralCode(refRes.data?.code || '');
      } catch (err2) { logger.error('Dashboard load error:', err2); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // Iter 92.34 (Mert Go-Live): "alle PopUps bitte erstmal weglassen" →
    // 9-step Tour disabled. Auto-mark done so it never re-fires post-launch.
    try { localStorage.setItem('wladbot_onboarding_done', '1'); } catch { /* noop */ }
    setShowOnboarding(false);
    loadDashboard();
  }, [loadDashboard]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return de ? 'Guten Morgen' : 'Good Morning';
    if (h < 17) return de ? 'Guten Tag' : 'Good Afternoon';
    return de ? 'Guten Abend' : 'Good Evening';
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(`${LEADERCHECK_URL}?ref=${referralCode}`);
    toast.success(de ? 'Referral-Link kopiert!' : 'Referral link copied!');
  };

  const ud = data?.user || user || {};
  const tierInfo = useTier();
  const xpInfo = data?.xp_info || {};
  const ls = data?.leader_score || {};
  const streak = data?.streak || { days: 0 };
  const c30 = data?.challenge30 || {};
  const xpCurrent = xpInfo.xp ?? ud.xp ?? 0;
  const levelName = xpInfo.level || ud.level || 'Teamplayer';
  const levelLabel = de ? (xpInfo.level_label_de || 'Grundlagen entdecken') : (xpInfo.level_label_en || 'Discovering fundamentals');
  const levelIndex = xpInfo.level_index ?? 0;
  const levelProgress = xpInfo.progress_pct ?? 0;
  const nextLevel = xpInfo.next_level;
  const xpToNext = xpInfo.xp_to_next || 0;
  const aiReadiness = ls.composite || 0;
  const learningPct = c30.progress_pct || 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-10 max-w-6xl mx-auto" data-testid="dashboard-loading">
          <div className="space-y-4">{[1,2,3,4].map(i => <div key={`sk-${i}`} className="h-28 rounded-2xl skeleton-pulse" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-6xl mx-auto min-h-screen cascade" data-testid="dashboard-page">
        {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
        <OnboardingVideoModal />

        {/* ── Greeting ── */}
        <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 mb-8" data-anim="dash-header">
          <div>
            <p className="text-sm text-muted-foreground">{de ? 'Willkommen zurück,' : 'Welcome back,'}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{ud.name || 'Leader'}</h1>
              <TierBadge size="sm" />
              {tierInfo?.inGracePeriod && (
                <button onClick={() => openPricing('leadership_os_plus')} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 hover:bg-rose-500/25 transition-colors" data-testid="grace-badge">
                  {de ? 'Jetzt verlängern' : 'Renew now'}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate('/chat')} className="font-semibold text-xs h-9 gap-1.5" data-testid="talk-coach-btn">
              <MessageSquareText size={14} /> {de ? 'KI-Coach' : 'AI Coach'}
            </Button>
            <CreditBadge de={de} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#BFFF00]/10 border border-[#BFFF00]/20" data-testid="streak-bar">
              <Flame size={13} className="text-[#6B8A00] dark:text-[#BFFF00]" />
              <span className="text-[12px] font-bold"><AnimatedNumber value={streak?.days || 0} duration={500} /></span>
              <span className="text-[10px] text-muted-foreground font-medium">{de ? 'Tage' : 'days'}</span>
            </div>
          </div>
        </div>

        {/* Iter 163 „weniger ist mehr“: Fokus = Inbox → EINE Aktion → Fortschritt. Alles andere hinter „Mehr“. */}
        <StripeModeBanner />
        <ActionInbox de={de} />

        {/* ── HEUTE: die eine Aktion — personalisiert (erste 7 Schritte), danach 30-Tage-Programm ── */}
        <JourneyCard de={de} fallback={(
          <Card className="bg-[#0A0A0A] text-white border-0 mb-6 overflow-hidden" data-testid="next-step-cta" data-anim="dash-cta">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <img src={WLAD_AVATAR} alt="Wlad" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-white/10 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#BFFF00]/80">{de ? 'Heute' : 'Today'}</p>
                    <h3 className="text-lg font-black">{de ? 'Dein nächster Schritt' : 'Your Next Step'}</h3>
                    <p className="text-sm text-white/50 mt-0.5">
                      {!c30.started
                        ? (de ? 'Starte dein 30-Tage KI-Leadership Programm und lerne die Grundlagen.' : 'Start your 30-day AI Leadership program and learn the fundamentals.')
                        : (de ? `Mache weiter mit Tag ${c30.current_day} deiner Challenge — 10 interaktive Fragen warten.` : `Continue with Day ${c30.current_day} of your challenge — 10 interactive questions await.`)
                      }
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/challenge')} className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold h-11 px-5 w-full sm:w-auto shrink-0 shadow-lg shadow-[#BFFF00]/20" data-testid="next-step-btn">
                  <Play size={14} className="mr-1.5" /> {!c30.started ? (de ? 'Challenge starten' : 'Start Challenge') : (de ? 'Weitermachen' : 'Continue')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )} />

        {/* ── FORTSCHRITT ── */}
        <StatCardsRow aiReadiness={aiReadiness} learningPct={learningPct} c30={c30} de={de} />
        <Card className="border-black/[0.04] dark:border-white/[0.06] overflow-hidden relative" data-testid="level-progress" data-anim="dash-widget">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#BFFF00]/[0.06] rounded-full blur-3xl pointer-events-none" />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{de ? 'Dein Leadership-Level' : 'Your Leadership Level'}</h3>
                  </div>
                  <Badge className="text-[10px] font-bold bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] border-0">
                    LVL {levelIndex + 1} / 5
                  </Badge>
                </div>

                {/* Level name + descriptive label */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shadow-lg shadow-[#BFFF00]/20 shrink-0">
                    <span className="text-2xl font-black text-[#0A0A0A]">{levelIndex + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-black tracking-tight truncate">{levelName}</p>
                    <p className="text-[12px] text-muted-foreground font-medium truncate">{levelLabel}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black leading-none"><AnimatedNumber value={xpCurrent} /></p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">XP</p>
                  </div>
                </div>

                {/* Progress to next */}
                <div className="space-y-1.5">
                  <div className="h-2.5 rounded-full bg-gray-100 dark:bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] transition-all duration-1000 shadow-[0_0_8px_rgba(191,255,0,0.4)]"
                      style={{ width: `${Math.min(100, levelProgress)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold">
                    <span className="text-muted-foreground">{levelProgress}% {de ? 'zum nächsten Level' : 'to next level'}</span>
                    {nextLevel ? (
                      <span className="text-[#4A6200] dark:text-[#BFFF00]">
                        {xpToNext > 0 ? `${xpToNext} XP → ${nextLevel}` : nextLevel}
                      </span>
                    ) : (
                      <span className="text-[#4A6200] dark:text-[#BFFF00]">{de ? 'MAX LEVEL' : 'MAX LEVEL'}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* ── MEHR: alles Weitere, zugeklappt (Zustand gemerkt) ── */}
        <DashboardMore de={de} count={tierInfo?.isAccelerator ? 7 : 8}>
        <GuideClipsRow de={de} />
        <div className="mb-6"><ArgumentationPrepCard de={de} /></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <QuickActionsGrid de={de} navigate={navigate} />
            <FolderWorkspaceCards de={de} />

            {/* Upsell Banner — tier-aware: hidden for OS PLUS, shows PLUS upgrade for Standard, shows OS for Free */}
            {!tierInfo?.isAccelerator && (
              <Card className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white border-0 overflow-hidden" data-testid="upsell-banner" data-anim="dash-widget">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#BFFF00]/15 flex items-center justify-center shrink-0">
                      <Sparkles size={22} className="text-[#BFFF00]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">
                        {tierInfo?.tier === 'standard'
                          ? (de ? 'Bereit für 1:1 Coaching mit Wlads Expertenteam?' : 'Ready for 1:1 Coaching with Wlad’s Expert Team?')
                          : (de ? 'Schalte dein volles KI-Potenzial frei' : 'Unlock your full AI potential')}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {tierInfo?.tier === 'standard'
                          ? (de ? '12× Einzelcoaching · Mastermind · Video-Analyse unlimited.' : '12× 1:1 coaching · Mastermind · Unlimited video analysis.')
                          : (de ? 'Alle 16 Missionen, 10 Workflows und persönliches Coaching.' : 'All 16 missions, 10 workflows and personal coaching.')}
                      </p>
                      <p className="text-[10px] text-white/25 mt-1"><Sparkles size={9} className="inline mr-0.5" /> {de ? '500+ Leader haben ihre Arbeitsweise transformiert' : '500+ leaders have transformed how they work'}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={() => openPricing(tierInfo?.tier === 'standard' ? 'leadership_os_plus' : 'leadership_os')}
                        className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold text-xs h-9 px-4 btn-revolut"
                        data-testid="dashboard-upgrade-btn"
                      >
                        {tierInfo?.tier === 'standard'
                          ? (de ? 'OS PLUS holen' : 'Get OS PLUS')
                          : (de ? 'Direkt kaufen' : 'Buy Now')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-5">

            {/* Wlad's Daily Motivation — demoted to sidebar (Iter 118 Godmode) */}
            <WladMotivationCard de={de} />

            {/* Next 3 Events — Donnerstag-Cohort (Iter 92.9) */}
            <UpcomingEventsCard locale={de ? 'de' : 'en'} />

            {/* Referral Card */}
            <Card className="bg-[#0A0A0A] text-white border-0" data-testid="referral-upsell-card" data-anim="dash-widget">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#BFFF00]/15 flex items-center justify-center"><Gift size={13} className="text-[#BFFF00]" /></div>
                  <div>
                    <p className="text-xs font-bold">{de ? 'Freunde einladen' : 'Invite friends'}</p>
                    <p className="text-[9px] text-white/40">{de ? 'Verdiene Rewards' : 'Earn rewards'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/referral')} size="sm" className="flex-1 bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] text-[10px] font-bold h-8" data-testid="referral-share-btn">
                    <Share2 size={10} className="mr-1" /> TEILEN
                  </Button>
                  {referralCode && (
                    <Button onClick={copyReferral} size="sm" variant="outline" className="border-white/15 text-white hover:bg-white/10 text-[10px] h-8" data-testid="referral-copy-btn">
                      <Copy size={10} className="mr-1" /> {referralCode}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* WladHub Diagnosis */}
            <WladHubDiagnosisCard wladhubScores={ud.wladhub_scores} de={de} onNavigate={navigate} />
          </div>
        </div>
        </DashboardMore>
      </div>

      {/* Iter 131.3: Guided first-run tour with speaking Wlad. Runs once
          per user (localStorage flag) — user-triggerable via the profile
          menu for a second walkthrough. */}
      <DashboardFirstTour userTier={tierInfo?.tier || ud.tier || 'free'} />
    </DashboardLayout>
  );
}
