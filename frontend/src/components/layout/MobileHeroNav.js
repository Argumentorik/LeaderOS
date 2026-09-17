/**
 * MobileHeroNav — premium floating dock for phones.
 *
 * Hides on ≥md screens (desktop keeps the full Sidebar). Floating
 * glass dock (iOS style): rounded pill bar, active tab gets a brand
 * pill, everything ≥44px touch targets, safe-area respected.
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessagesSquare, Video, TrendingUp, Menu, X, Wrench, BookOpen, GraduationCap, CalendarDays, Clapperboard,
  LayoutDashboard, Flame, Swords, Target, Users, UserRound,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Plan Iter 187: dieselben vier Anker wie am Rechner — Rest liegt unter „Mehr".
const HERO_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label_de: 'Dashboard', label_en: 'Dashboard', testId: 'mobile-nav-dashboard' },
  { path: '/chat',      icon: MessagesSquare,  label_de: 'WladBot',   label_en: 'WladBot',   testId: 'mobile-nav-chat' },
  { path: '/tools',     icon: Wrench,          label_de: 'Werkzeuge', label_en: 'Tools',         testId: 'mobile-nav-tools' },
];

const MORE_ITEMS = [
  { path: '/simulations',  icon: Target,          label_de: 'Gesprächs-Training', label_en: 'Conversation training' },
  { path: '/challengers',  icon: Swords,          label_de: 'Challengers',        label_en: 'Challengers' },
  { path: '/missions',     icon: Video,           label_de: 'Video-Analyse',      label_en: 'Video analysis' },
  { path: '/playbooks',    icon: BookOpen,        label_de: 'Leitfäden',          label_en: 'Playbooks' },
  { path: '/kurse',        icon: GraduationCap,   label_de: 'Kurse (72 Folgen)',  label_en: 'Courses (72 episodes)' },
  { path: '/video-guide',  icon: Clapperboard,    label_de: 'Onboarding-Videos',  label_en: 'Onboarding videos' },
  { path: '/challenge',    icon: Flame,           label_de: '30-Tage-Programm',   label_en: '30-day program' },
  { path: '/events',       icon: CalendarDays,    label_de: 'Live-Events',        label_en: 'Live events' },
  { path: '/my-path',      icon: TrendingUp,      label_de: 'Mein Fortschritt',   label_en: 'My progress' },
  { path: '/community',    icon: Users,           label_de: 'Community',          label_en: 'Community' },
  { path: '/profile',      icon: UserRound,       label_de: 'Einstellungen',      label_en: 'Settings' },
];

export function MobileHeroNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [moreOpen, setMoreOpen] = useState(false);

  const go = (path) => { setMoreOpen(false); navigate(path); };

  return (
    <>
      <nav
        aria-label={de ? 'Hauptnavigation' : 'Main navigation'}
        data-testid="mobile-hero-nav"
        className="md:hidden fixed left-3 right-3 z-40 rounded-[22px] border border-black/[0.06] dark:border-white/[0.09] bg-white/85 dark:bg-[#0D0D0D]/90 backdrop-blur-2xl shadow-[0_18px_50px_-12px_rgba(0,0,0,0.35)] dark:shadow-[0_18px_50px_-10px_rgba(0,0,0,0.7)]"
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="grid grid-cols-4 h-[60px] px-1.5">
          {HERO_ITEMS.map(item => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                data-testid={item.testId}
                className="relative flex flex-col items-center justify-center gap-[3px] min-h-[44px] group"
              >
                <span className={`flex items-center justify-center h-[26px] px-4 rounded-full transition-all duration-200 ${active
                  ? 'bg-[#BFFF00] text-[#0A0A0A] shadow-[0_4px_14px_-2px_rgba(191,255,0,0.55)]'
                  : 'nav-row group-active:scale-90'}`}>
                  <Icon size={17} strokeWidth={active ? 2.6 : 2.1} />
                </span>
                <span className={`text-[9.5px] tracking-tight transition-colors ${active
                  ? 'font-black text-foreground'
                  : 'font-semibold nav-row'}`}>
                  {de ? item.label_de : item.label_en}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            data-testid="mobile-nav-more"
            aria-label={de ? 'Mehr' : 'More'}
            className="relative flex flex-col items-center justify-center gap-[3px] min-h-[44px] group"
          >
            <span className="flex items-center justify-center h-[26px] px-4 rounded-full nav-row group-active:scale-90 transition-transform">
              <Menu size={17} strokeWidth={2.1} />
            </span>
            <span className="text-[9.5px] font-semibold tracking-tight nav-row">{de ? 'Mehr' : 'More'}</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end"
          onClick={() => setMoreOpen(false)}
          data-testid="mobile-nav-more-sheet"
        >
          <div
            className="w-full bg-white dark:bg-[#101010] rounded-t-[28px] px-5 pt-3 pb-8 animate-slide-up border-t border-black/[0.05] dark:border-white/[0.08]"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}
          >
            {/* Grabber */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/[0.12] dark:bg-white/[0.14]" aria-hidden />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{de ? 'Alle Bereiche' : 'All sections'}</h3>
              <button onClick={() => setMoreOpen(false)} aria-label={de ? 'Schließen' : 'Close'} className="w-9 h-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center active:scale-90 transition-transform">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {MORE_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    data-testid={`mobile-nav-more-${item.path.replace(/\W+/g, '')}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className={`animate-fade-in min-h-[54px] px-3.5 py-3 rounded-2xl text-left text-[13px] font-black flex items-center gap-3 transition-colors ${active
                      ? 'bg-[#BFFF00] text-[#0A0A0A]'
                      : 'bg-black/[0.03] dark:bg-white/[0.05] text-foreground/85 active:bg-black/[0.07] dark:active:bg-white/[0.09]'}`}
                  >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${active
                      ? 'bg-[#0A0A0A]/10'
                      : 'bg-black/[0.04] dark:bg-white/[0.06]'}`}>
                      <Icon size={15} strokeWidth={2.3} />
                    </span>
                    {de ? item.label_de : item.label_en}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MobileHeroNav;
