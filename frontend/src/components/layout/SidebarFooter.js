import { useCallback, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useTier } from '../../contexts/TierContext';
import { usePricing } from '../../contexts/PricingContext';
import { TierBadge } from '../shared/TierBadge';
import { Crown, Settings, Sparkles, Compass } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { hasUnseenChangelog } from '../../lib/changelogMeta';
import {
  IconGlobe, IconSun, IconMoon, IconLogout, IconCamera,
} from './SidebarIcons';

export const SidebarFooter = ({ theme, toggleTheme, lang, toggleLang, t, collapsed, navigate }) => {
  const { user, logout, setUser } = useAuth();
  const { isAccelerator, tier } = useTier();
  const { open: openPricing } = usePricing();
  const [uploadingPic, setUploadingPic] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);

  const handleProfilePicUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/upload/profile-picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfilePicUrl(URL.createObjectURL(file));
      const meRes = await api.get('/auth/me');
      setUser(meRes.data);
    } catch (err) {
      logger.error('Profile pic upload failed:', err);
    } finally {
      setUploadingPic(false);
    }
  }, [setUser]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="border-t border-black/[0.03] dark:border-white/[0.03] p-2 space-y-0.5">
      {/* Iter 92.49: "Was ist neu?" → /changelog. Lime pulse-dot until the
          latest version was seen (localStorage, see lib/changelogMeta). */}
      <button data-testid="sidebar-changelog-btn" onClick={() => navigate('/changelog')}
        className={`flex items-center gap-2.5 w-full px-3 py-[7px] rounded-[10px] text-[12px] text-gray-400 hover:text-gray-600 dark:text-muted-foreground/50 dark:hover:text-[#BFFF00] hover:bg-gray-50/50 dark:hover:bg-[#BFFF00]/[0.04] transition-colors ${collapsed ? 'justify-center px-2' : ''}`}>
        <span className="relative flex shrink-0">
          <Sparkles size={14} />
          {hasUnseenChangelog() && (
            <span className="absolute -top-0.5 -right-1 w-[7px] h-[7px] rounded-full bg-[#BFFF00] shadow-[0_0_6px_rgba(191,255,0,0.8)] animate-pulse" data-testid="changelog-new-dot" />
          )}
        </span>
        {!collapsed && (
          <span className="flex items-center gap-1.5 flex-1">
            <span className="font-medium">{lang === 'de' ? 'Was ist neu?' : "What's new?"}</span>
          </span>
        )}
      </button>
      <button data-testid="lang-toggle-btn" onClick={toggleLang}
        className={`flex items-center gap-2.5 w-full px-3 py-[7px] rounded-[10px] text-[12px] text-gray-400 hover:text-gray-600 dark:text-muted-foreground/50 dark:hover:text-foreground/70 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${collapsed ? 'justify-center px-2' : ''}`}>
        <IconGlobe size={14} />
        {!collapsed && (
          <span className="flex items-center gap-1">
            <span className={`font-bold ${lang === 'de' ? 'text-[#4A6200] dark:text-[#BFFF00]' : 'text-muted-foreground/30'}`}>DE</span>
            <span className="text-[8px] text-muted-foreground/15">|</span>
            <span className={`font-bold ${lang === 'en' ? 'text-[#4A6200] dark:text-[#BFFF00]' : 'text-muted-foreground/30'}`}>EN</span>
          </span>
        )}
      </button>
      <button data-testid="theme-toggle-btn" onClick={toggleTheme}
        className={`flex items-center gap-2.5 w-full px-3 py-[7px] rounded-[10px] text-[12px] text-gray-400 hover:text-gray-600 dark:text-muted-foreground/50 dark:hover:text-foreground/70 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${collapsed ? 'justify-center px-2' : ''}`}>
        {theme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
        {!collapsed && <span className="font-medium">{theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}</span>}
      </button>

      {/* Upgrade CTA — Iter 92.47 (Mert · GODMODE): premium mobile-safe layout.
          Icon-only in collapsed sidebar, full label+chevron everywhere else.
          Fixes: previously the mobile-drawer rendered a full-width lime bar
          with no label because `collapsed` was inherited incorrectly. */}
      {user && !isAccelerator && (
        <button
          onClick={() => openPricing(tier === 'standard' ? 'leadership_os_plus' : 'leadership_os')}
          data-testid="sidebar-upgrade-btn"
          className={`group flex items-center gap-2.5 w-full rounded-xl text-[12px] font-black transition-all mt-1 ${
            collapsed
              ? 'justify-center h-9 w-9 mx-auto bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] hover:scale-105 shadow-lg shadow-[#BFFF00]/25'
              : 'px-3 py-2.5 bg-gradient-to-r from-[#BFFF00] via-[#B0E600] to-[#9ACC00] text-[#0A0A0A] hover:shadow-xl hover:shadow-[#BFFF00]/30 hover:scale-[1.02] shadow-md shadow-[#BFFF00]/20'
          }`}
          title={tier === 'free' ? 'Leadership OS holen' : 'Auf OS PLUS upgraden'}
        >
          <span className={collapsed ? '' : 'flex items-center justify-center w-6 h-6 rounded-md bg-[#0A0A0A]/12'}>
            <Crown size={collapsed ? 15 : 13} strokeWidth={2.5} fill={collapsed ? 'none' : 'currentColor'} />
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left tracking-tight">
                {tier === 'free' ? 'Leadership OS holen' : 'Auf OS PLUS upgraden'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </>
          )}
        </button>
      )}

      {user && !collapsed && (
        <div className="relative group">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-3 py-[7px] mt-0.5 cursor-pointer hover:bg-[#BFFF00]/[0.05] dark:hover:bg-[#BFFF00]/[0.03] rounded-lg transition-colors w-full text-left"
            data-testid="sidebar-profile-btn"
          >
            <div className="relative">
              <Avatar className="w-6 h-6 ring-1 ring-[#BFFF00]/20 dark:ring-[#BFFF00]/10">
                <AvatarImage src={profilePicUrl || (user.picture?.startsWith('http') ? user.picture : (user.picture ? `/api/files/${user.picture}` : undefined))} />
                <AvatarFallback className="text-[9px] font-bold bg-gradient-to-br from-[#BFFF00]/15 to-[#D4FF4D]/15 dark:from-[#BFFF00]/15 dark:to-[#BFFF00]/10 text-[#4A6200] dark:text-[#BFFF00]">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate leading-none">{user.name}</p>
              <div className="mt-1"><TierBadge size="xs" /></div>
            </div>
            {/* Iter 92.9: Subtiles Zahnrad signalisiert "hier kannst du Einstellungen ändern" */}
            <Settings
              size={13}
              className="text-muted-foreground/40 group-hover:text-[#4A6200] dark:group-hover:text-[#BFFF00] group-hover:rotate-90 transition-all duration-300 shrink-0"
              aria-hidden
              data-testid="sidebar-profile-gear"
            />
          </button>
          {uploadingPic && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
              <div className="w-4 h-4 border-2 border-[#BFFF00] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
      {/* Iter 131.4 (Wlad-Direktive): "Tour erneut ansehen" — user can
          replay the guided dashboard walk-through any time. */}
      <button
        data-testid="restart-tour-btn"
        onClick={() => restartDashboardTour(navigate)}
        className={`flex items-center gap-2.5 w-full px-3 py-[7px] rounded-[10px] text-[12px] text-gray-400 hover:text-[#4A6200] dark:text-muted-foreground/50 dark:hover:text-[#BFFF00] hover:bg-[#BFFF00]/[0.06] dark:hover:bg-[#BFFF00]/[0.04] transition-colors ${collapsed ? 'justify-center px-2' : ''}`}
        title={lang === 'de' ? 'Dashboard-Tour erneut ansehen' : 'Replay the dashboard tour'}
      >
        <Compass size={14} />
        {!collapsed && <span className="font-medium">{lang === 'de' ? 'Tour erneut ansehen' : 'Replay tour'}</span>}
      </button>
      <button data-testid="logout-btn" onClick={handleLogout}
        className={`flex items-center gap-2.5 w-full px-3 py-[7px] rounded-[10px] text-[12px] text-gray-400 hover:text-rose-500 dark:text-muted-foreground/50 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-400/5 transition-colors ${collapsed ? 'justify-center px-2' : ''}`}>
        <IconLogout size={14} />
        {!collapsed && <span className="font-medium">{t('nav.logout')}</span>}
      </button>
    </div>
  );
};

/**
 * Restart the Dashboard First-Tour. Iter 131.4 (Wlad-Direktive):
 * exposed in the sidebar so users who dismissed the tour can re-play it.
 * Wraps the localStorage-flag clear + navigation to /dashboard + reload.
 */
export const restartDashboardTour = (navigate) => {
  try { localStorage.removeItem('leaderos_tour_v1_done'); } catch { /* ignore */ }
  if (navigate) navigate('/dashboard');
  // A short delay before reload lets the router settle first.
  setTimeout(() => { try { window.location.reload(); } catch { /* ignore */ } }, 60);
};
