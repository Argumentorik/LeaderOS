/**
 * CommunityFeedTabs · personalized feed-filter pills (orthogonal to category).
 *
 * - "Alle" → all posts from everyone (default)
 * - "Top"  → most-liked first
 * - "Meine" → only my own posts
 * - "Gelikt" → only posts I have liked
 *
 * Lives ABOVE the category filter row. Pure visual; parent owns the state.
 */
import { Users, Flame, User as UserIcon, Heart } from 'lucide-react';

export const FEED_TABS = [
  { id: 'all',   label_de: 'Alle',   label_en: 'All',   icon: Users },
  { id: 'top',   label_de: 'Top',    label_en: 'Top',   icon: Flame },
  { id: 'mine',  label_de: 'Meine',  label_en: 'Mine',  icon: UserIcon },
  { id: 'liked', label_de: 'Gelikt', label_en: 'Liked', icon: Heart },
];

export const CommunityFeedTabs = ({ feed, setFeed, de }) => (
  <div className="flex gap-2 mb-3 overflow-x-auto pb-1" data-testid="community-feed-tabs">
    {FEED_TABS.map(t => {
      const Icon = t.icon;
      const active = feed === t.id;
      return (
        <button
          key={t.id}
          onClick={() => setFeed(t.id)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11.5px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${active
            ? 'bg-[#BFFF00] text-[#0A0A0A] shadow-md shadow-[#BFFF00]/20'
            : 'bg-white/[0.04] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-[#BFFF00]/30'}`}
          data-testid={`feed-tab-${t.id}`}
        >
          <Icon size={11} /> {de ? t.label_de : t.label_en}
        </button>
      );
    })}
  </div>
);

export default CommunityFeedTabs;
