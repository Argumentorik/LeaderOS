import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';
import { WladMark } from '../brand/WladMark';
import {
  IconCommand, IconBubble, IconBolt,
  IconCrown, IconLayers, IconLens, IconFlow, IconGraph,
  IconEvent, IconDiamond, IconFlame, IconCamera, IconCourse, IconChev, SBolt, SBrain,
} from './SidebarIcons';
import { useAuth } from '../../contexts/AuthContext';
import { useChallengeDay, useChallengeToday } from '../../lib/challengeDay';
import { LEADERCHECK_URL } from '../../lib/domains';

// Iter 92.34 (Mert Go-Live §C): items locked for Free tier — render with 🔒
// icon and redirect to /coaching (upgrade page) when clicked.
// Entscheidung Iter 185 (3a): /tasks ist offen — es zeigt nur eigene Aufgaben
// und kostet keine KI-Leistung.
const FREE_TIER_LOCKED = new Set([
  '/simulations', '/playbooks', '/tools',
  '/events',
]);


export const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const { user } = useAuth();
  const userTier = (user?.tier || 'free').toLowerCase();
  const isLockedPath = (path) => userTier === 'free' && FREE_TIER_LOCKED.has(path);
  // Iter 185: Die 30-Tage-Herausforderung zeigt ihren Stand direkt im Menü.
  const challengeDay = useChallengeDay();
  const challengeToday = useChallengeToday();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Plan Iter 187 (Wunsch Stefan · „3 + 1"): oben stehen vier Einträge.
  // Dashboard und WladBot führen direkt zur Seite, die beiden anderen
  // klappen ihre Inhalte auf.
  const withLock = (it) => ({ ...it, locked: isLockedPath(it.path) });

  const mainItems = [
    {
      path: '/dashboard', label: lang === 'de' ? 'Dashboard' : 'Dashboard', icon: IconCommand,
      subLine: challengeToday
        ? `Tag ${challengeToday.day} / 30 · heute: ${challengeToday.title}`
        : (lang === 'de' ? 'Heute, Mission und Check-in an einem Ort' : 'Today, mission and check-in in one place'),
      badgeText: challengeDay ? `${lang === 'de' ? 'Tag' : 'Day'} ${challengeDay} / 30` : null,
    },
    {
      path: '/chat', label: 'WladBot', icon: IconBubble,
      subLine: lang === 'de' ? 'Dein Coach — fragen, wann du willst' : 'Your coach — ask any time',
    },
    {
      id: 'toolbox', label: lang === 'de' ? 'Werkzeuge & Leitfäden' : 'Tools & playbooks', icon: IconFlow,
      hint: lang === 'de' ? 'Fertige Vorlagen für deinen Arbeitsalltag.' : 'Ready-made templates for your working day.',
      defaultOpen: true,
      children: [
        { path: '/tools', label: lang === 'de' ? 'Werkzeuge' : 'Tools', icon: IconFlow },
        { path: '/playbooks', label: lang === 'de' ? 'Leitfäden' : 'Playbooks', icon: IconLayers },
      ].map(withLock),
    },
    {
      id: 'training', label: 'Training', icon: IconBolt, defaultOpen: true,
      children: [
        { path: '/simulations', label: lang === 'de' ? 'Gesprächs-Training' : 'Conversation training', icon: IconBolt },
        { path: '/challengers', label: t('nav.challengers'), icon: IconCrown },
        { path: '/missions', label: lang === 'de' ? 'Video-Analyse' : 'Video analysis', icon: IconLens },
      ].map(withLock),
    },
  ].map((it) => (it.children ? it : withLock(it)));

  const moreGroups = [
    {
      id: 'knowledge', label: lang === 'de' ? 'Wissen & Community' : 'Knowledge & community',
      badge: SBrain, badgeGrad: 'from-[#BFFF00] to-[#9ACC00]',
      items: [
        { path: '/kurse', label: lang === 'de' ? 'Kurse (72 Folgen)' : 'Courses (72 episodes)', icon: IconCourse },
        { path: '/challenge', label: lang === 'de' ? '30-Tage-Programm' : '30-day program', icon: IconFlame },
        { path: '/video-guide', label: lang === 'de' ? 'Onboarding-Videos' : 'Onboarding videos', icon: IconCamera },
        { path: '/events', label: lang === 'de' ? 'Live-Events' : 'Live events', icon: IconEvent },
        { path: '/my-path', label: lang === 'de' ? 'Mein Fortschritt' : 'My progress', icon: IconGraph },
        { path: '/community', label: 'Community', icon: IconDiamond },
      ].map(withLock),
    },
    {
      id: 'settings', label: lang === 'de' ? 'Admin & Einstellungen' : 'Admin & settings',
      badge: SBolt, badgeGrad: 'from-[#BFFF00] to-[#9ACC00]',
      items: [
        { path: '/leadership-programm', label: lang === 'de' ? 'Leadership-Programm' : 'Leadership programme', icon: IconDiamond },
        { path: '/profile', label: lang === 'de' ? 'Einstellungen' : 'Settings', icon: IconLayers },
      ],
    },
  ];

  return (
    <aside data-testid="sidebar"
      className={`${collapsed ? 'w-[64px]' : 'w-[244px]'} h-screen flex flex-col bg-white dark:bg-[#101010] border-r border-black/[0.04] dark:border-white/[0.04] transition-[width] duration-300 relative`}>

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

      <SidebarNav mainItems={mainItems} moreGroups={moreGroups} collapsed={collapsed}
        moreLabel={lang === 'de' ? 'Mehr' : 'More'}
        moreHint={lang === 'de' ? 'Kurse, Live-Events, dein Profil und die Einstellungen.' : 'Courses, live events, your profile and settings.'} />

      {/* WladHub CTA */}
      {!collapsed && (
        <div className="px-2 pb-1">
          <button onClick={() => window.open(LEADERCHECK_URL, '_blank', 'noopener,noreferrer')} data-testid="sidebar-wladhub-btn"
            data-tour-id="nav-diagnose"
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
