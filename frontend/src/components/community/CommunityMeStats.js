/**
 * CommunityMeStats · personalized header card for the Community Page.
 *
 * Shows the requesting user:
 *  - Avatar + name + tier
 *  - Their current rank in the community leaderboard (or "Noch nicht im Ranking")
 *  - Their post count, total likes received, comments written
 *  - A subtle progression hint ("Du bist auf Platz X von Y · …")
 *
 * Stays visible above the feed regardless of which feed-filter is active so the
 * user always sees their own standing · that's the personalization Mert asked for.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Trophy, Heart, MessageCircle, FileText, Crown, Loader2, TrendingUp } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';

const Stat = ({ Icon, value, label, accent }) => (
  <div className="flex flex-col items-center text-center px-2 py-1.5 rounded-xl bg-white/[0.04] dark:bg-white/[0.03]">
    <Icon size={12} className={accent} />
    <p className="text-base font-black mt-1 leading-none text-white">{value}</p>
    <p className="text-[9px] uppercase tracking-wider text-white/45 mt-1">{label}</p>
  </div>
);

export const CommunityMeStats = ({ de }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await api.get('/community/me-stats');
        if (alive) setStats(res.data);
      } catch (err) {
        logger.error('Failed to load community me-stats:', err);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-[#0A0A0A] via-[#0F1015] to-[#0A0A0A] border-[#BFFF00]/15 overflow-hidden">
        <CardContent className="p-5 flex items-center justify-center min-h-[110px]">
          <Loader2 size={16} className="animate-spin text-[#BFFF00]/60" />
        </CardContent>
      </Card>
    );
  }
  if (!stats) return null;

  const rankLabel = stats.rank
    ? (de ? `Platz ${stats.rank}` : `Rank ${stats.rank}`)
    : (de ? 'Noch nicht im Ranking' : 'Not ranked yet');
  const totalLeaders = stats.total_leaders || 0;
  const nudge = stats.rank
    ? (de
        ? `Du bist auf Platz ${stats.rank} von ${totalLeaders}. ${stats.rank > 3 ? 'Top 3 sind in Reichweite · poste deinen nächsten Win.' : 'Du bist in den Top 3. Wahnsinn · halte das Tempo.'}`
        : `You're rank ${stats.rank} of ${totalLeaders}. ${stats.rank > 3 ? 'Top 3 is within reach · post your next win.' : "You're in the Top 3. Hold the pace."}`)
    : (de
        ? 'Poste deinen ersten Win und steige direkt ins Ranking ein.'
        : 'Post your first win and instantly enter the ranking.');

  return (
    <Card
      className="bg-gradient-to-br from-[#0A0A0A] via-[#0F1015] to-[#0A0A0A] border-[#BFFF00]/15 overflow-hidden relative"
      data-testid="community-me-stats"
    >
      {/* lime aurora glow top-right */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#BFFF00]/10 blur-3xl pointer-events-none" />
      <CardContent className="p-5 relative">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="w-14 h-14 ring-2 ring-[#BFFF00]/30">
              {stats.picture && <AvatarImage src={stats.picture} />}
              <AvatarFallback className="bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-black text-base">
                {(stats.name || 'L')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {stats.tier === 'accelerator' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0A0A0A] flex items-center justify-center ring-2 ring-[#BFFF00]">
                <Crown size={10} className="text-[#BFFF00]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-black text-white truncate">{stats.name}</p>
              <span className="text-[8px] font-black uppercase tracking-wider text-[#BFFF00]">{stats.tier}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Trophy size={11} className="text-amber-400" />
              <p className="text-[11px] font-bold text-white/80" data-testid="me-stats-rank">{rankLabel} <span className="text-white/30 font-normal">· {stats.xp} XP</span></p>
            </div>
            <p className="text-[10.5px] text-white/50 leading-snug mt-1.5">
              <TrendingUp size={9} className="inline mr-1 -mt-0.5 text-[#BFFF00]" />
              {nudge}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat Icon={FileText}      value={stats.post_count}    label={de ? 'Posts'    : 'Posts'}    accent="text-[#BFFF00]" />
          <Stat Icon={Heart}         value={stats.total_likes}   label={de ? 'Likes'    : 'Likes'}    accent="text-rose-400" />
          <Stat Icon={MessageCircle} value={stats.comment_count} label={de ? 'Kommentare' : 'Comments'} accent="text-sky-400" />
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityMeStats;
