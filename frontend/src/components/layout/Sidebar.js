import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';
import { WladMark } from '../brand/WladMark';
import {
  IconCommand, IconPulse, IconClipboard, IconBubble, IconBolt,
  IconCrown, IconLayers, IconLens, IconFlow, IconGraph,
  IconEvent, IconDiamond, IconFlame, IconChev, SBolt, STarget, SBrain,
} from './SidebarIcons';
import { useAuth } from '../../contexts/AuthContext';

// Iter 92.34 (Mert Go-Live §C): items locked for Free tier — render with 🔒
// icon and redirect to /coaching (upgrade page) when clicked.
const FREE_TIER_LOCKED = new Set([
  '/simulations', '/playbooks', '/tasks', '/tools',
  '/lern-videos', '/events',
]);


export const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const { user } = useAuth();
  const userTier = (user?.tier || 'free').toLowerCase();
  const isLockedPath = (path) => userTier === 'free' && FREE_TIER_LOCKED.has(path);
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navSections = [
    {
      id: 'today', label: t('nav.today'), badge: SBolt, badgeGrad: 'from-[#BFFF00] to-[#9ACC00]',
      items: [
        { path: '/dashboard', label: t('nav.commandCenter'), icon: IconCommand },
        { path: '/challenge', label: lang === 'de' ? '30-Tage Challenge' : '30-Day Challenge', icon: IconFlame },
        { path: '/daily-checkin', label: t('nav.dailyCheckin'), icon: IconPulse },
        { path: '/tasks', label: t('nav.tasks'), icon: IconClipboard },
        { path: '/chat', label: t('nav.aiCoach'), icon: IconBubble },
      ]
    },
    {
      id: 'growth', label: t('nav.growth'), badge: STarget, badgeGrad: 'from-emerald-500 to-[#00CC77]',
      items: [
        { path: '/simulations', label: t('nav.simulations'), icon: IconBolt },
        { path: '/challengers', label: t('nav.challengers'), icon: IconCrown },
        { path: '/playbooks', label: t('nav.playbooks'), icon: IconLayers },
        { path: '/missions', label: t('nav.missions'), icon: IconLens },
        { path: '/tools', label: t('nav.workflows'), icon: IconFlow },
      ]
    },
    {
      id: 'insights', label: t('nav.insights'), badge: SBrain, badgeGrad: 'from-[#FFB800] to-[#FF8C00]',
      items: [
        { path: '/my-path', label: lang === 'de' ? 'Mein Fortschritt' : 'My Progress', icon: IconFlame },
        { path: '/lern-videos', label: lang === 'de' ? 'Lern-Videos' : 'Learning Videos', icon: IconLayers },
        { path: '/community', label: lang === 'de' ? 'Community' : 'Community', icon: IconGraph },
        { path: '/events', label: t('nav.events'), icon: IconEvent },
      ]
    },
    {
      id: 'admin', label: lang === 'de' ? 'Admin' : 'Admin', badge: SBolt, badgeGrad: 'from-[#7B3FE4] to-[#4F1FE4]',
      items: [
        // Admin Panel is hidden entirely — owners reach it via the secret /wlad-control-* URL only.
        { path: '/coaching', label: t('nav.coaching'), icon: IconDiamond },
      ]
    }
  ].filter(section => section.items.length > 0)
   .map(section => ({
     ...section,
     items: section.items.map(it => ({ ...it, locked: isLockedPath(it.path) })),
   }));

  const activeSection = navSections.find(s => s.items.some(i => location.pathname === i.path))?.id || 'today';

  return (
    <aside data-testid="sidebar"
      className={`${collapsed ? 'w-[64px]' : 'w-[244px]'} h-screen flex flex-col bg-white/95 dark:bg-card/95 backdrop-blur-xl border-r border-black/[0.04] dark:border-white/[0.04] transition-[width] duration-300 relative`}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-[56px] border-b border-black/[0.03] dark:border-white/[0.03]">
        <button
          onClick={() => navigate('/dashboard')}
          data-testid="logo-btn"
          className="flex items-center gap-2.5 group focus-ring rounded-lg -m-1 p-1"
        >
          <WladMark size={32} animated />
          {!collapsed && (
            <div className="flex flex-col items-start leading-none">
              <span className="font-black text-[14px] tracking-tight"
                    style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.025em' }}>
                Leader<span className="opacity-40">·</span>OS
              </span>
              <span className="text-[7.5px] text-muted-foreground/45 font-bold tracking-[0.22em] uppercase mt-[3px]">
                Powered by WladBot
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Collapse */}
      <button data-testid="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-[10px] top-[42px] w-5 h-5 rounded-full bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-muted z-10 transition-all shadow-sm">
        <IconChev size={8} left={!collapsed} />
      </button>

      <SidebarNav navSections={navSections} activeSection={activeSection} collapsed={collapsed} />

      {/* WladHub CTA */}
      {!collapsed && (
        <div className="px-2 pb-1">
          <button onClick={() => window.open('https://leader-check.de', '_blank', 'noopener,noreferrer')} data-testid="sidebar-wladhub-btn"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-[#BFFF00]/[0.08] border border-[#BFFF00]/20 hover:border-[#BFFF00]/40 transition-all text-left group">
            <div className="w-5 h-5 rounded-md bg-[#BFFF00] flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="black"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#4A6200] dark:text-[#BFFF00] leading-tight">Leader-Diagnose</p>
              <p className="text-[8px] text-muted-foreground/60">Start auf WladHub</p>
            </div>
          </button>
        </div>
      )}

      <SidebarFooter
        theme={theme} toggleTheme={toggleTheme}
        lang={lang} toggleLang={toggleLang} t={t}
        collapsed={collapsed} navigate={navigate}
      />
    </aside>
  );
};
