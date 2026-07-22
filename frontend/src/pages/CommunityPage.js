import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { Users } from 'lucide-react';
import { LockedPageOverlay } from '../components/shared/LockedPageOverlay';

/**
 * CommunityPage — Prelaunch-locked (Iter 121, User: „Close Community as well").
 *
 * The full feed / composer / leaderboard code is temporarily disabled and
 * replaced by the shared `LockedPageOverlay` which drives everyone to the
 * PricingModal (same CTA as the video lock). Original page state is
 * preserved in git history — flip the `PRELAUNCH_COMMUNITY_LOCK` guard back
 * off + restore the imports below to re-enable after go-live.
 */
export default function CommunityPage() {
  const { lang } = useLanguage();
  const de = lang === 'de';

  return (
    <DashboardLayout>
      <div className="relative min-h-[80vh]" data-testid="community-page-wrapper">
        {/* Blurred backdrop so the overlay feels grounded on real UI */}
        <div className="p-6 lg:p-10 max-w-6xl mx-auto pointer-events-none select-none" data-testid="community-page" aria-hidden>
          <div className="mb-8 opacity-40">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shadow-lg shadow-[#BFFF00]/20">
                <Users size={20} className="text-[#0A0A0A]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{de ? 'Community' : 'Community'}</h1>
                <p className="text-sm text-muted-foreground">
                  {de ? 'Teile Wins, frage nach Feedback, hilf anderen Leadern.' : 'Share wins, ask for feedback, help other leaders.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 opacity-30">
            <div className="space-y-4">
              {[0, 1, 2].map(i => (
                <Card key={i} className="border-black/[0.04] dark:border-white/[0.06]"><CardContent className="p-6 h-24" /></Card>
              ))}
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map(i => (
                <Card key={`lb-${i}`} className="border-black/[0.04] dark:border-white/[0.06]"><CardContent className="p-4 h-14" /></Card>
              ))}
            </div>
          </div>
        </div>

        <LockedPageOverlay
          testId="community-locked-overlay"
          title={de ? 'Community — kommt zum Launch' : 'Community — coming at launch'}
          subtitle={de
            ? 'Die Community-Feeds, Leaderboards und Peer-Feedback-Threads schalten wir mit dem offiziellen Go-Live für alle Premium-Leader frei.'
            : 'Community feeds, leaderboards and peer feedback threads unlock the moment we go live to Premium leaders.'}
          features={de ? [
            'Peer-Feedback zu deinen Video-Missionen',
            'Live-Leaderboard aller Cohort-Leader',
            'Monatliche AMAs mit Wlad + Community-Calls',
          ] : [
            'Peer feedback on your video missions',
            'Live leaderboard across the cohort',
            'Monthly AMAs with Wlad + community calls',
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
