/**
 * MobileHeroNav — Bottom navigation for phones (Product Focus Sprint).
 *
 * Iter 121.9. Hides on ≥md screens (desktop keeps the full Sidebar). On
 * phones we surface only the two hero products + a Progress link +
 * a „Mehr"-sheet for everything else. Follows iOS/Android bottom-nav
 * conventions: 56px tall, safe-area-inset-bottom respected, 44+px taps.
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessagesSquare, Video, TrendingUp, Menu, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const HERO_ITEMS = [
  { path: '/chat',      icon: MessagesSquare, label_de: 'WladBot',       label_en: 'WladBot',       testId: 'mobile-nav-chat' },
  { path: '/coaching',  icon: Video,          label_de: 'Video',         label_en: 'Video',         testId: 'mobile-nav-video' },
  { path: '/my-path',   icon: TrendingUp,     label_de: 'Fortschritt',   label_en: 'Progress',      testId: 'mobile-nav-progress' },
];

const MORE_ITEMS = [
  { path: '/dashboard',    label_de: 'Dashboard',       label_en: 'Dashboard' },
  { path: '/challenge',    label_de: '30-Tage Challenge', label_en: '30-Day Challenge' },
  { path: '/challengers',  label_de: 'Challengers',     label_en: 'Challengers' },
  { path: '/simulations',  label_de: 'Simulationen',    label_en: 'Simulations' },
  { path: '/tasks',        label_de: 'Aufgaben',        label_en: 'Tasks' },
  { path: '/lern-videos',  label_de: 'Lern-Videos',     label_en: 'Learning Videos' },
  { path: '/community',    label_de: 'Community',       label_en: 'Community' },
  { path: '/profile',      label_de: 'Profil',          label_en: 'Profile' },
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-black/[0.05] dark:border-white/[0.05]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-4 h-14">
          {HERO_ITEMS.map(item => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                data-testid={item.testId}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${active ? 'text-[#6B8A00] dark:text-[#BFFF00]' : 'text-muted-foreground/70 active:text-foreground'}`}
              >
                <Icon size={19} strokeWidth={active ? 2.6 : 2.1} />
                <span className={`text-[10px] font-black tracking-tight ${active ? '' : 'font-semibold'}`}>{de ? item.label_de : item.label_en}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            data-testid="mobile-nav-more"
            aria-label={de ? 'Mehr' : 'More'}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-muted-foreground/70 active:text-foreground transition-colors"
          >
            <Menu size={19} strokeWidth={2.1} />
            <span className="text-[10px] font-semibold tracking-tight">{de ? 'Mehr' : 'More'}</span>
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
            className="w-full bg-white dark:bg-card rounded-t-3xl p-5 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{de ? 'Alle Bereiche' : 'All sections'}</h3>
              <button onClick={() => setMoreOpen(false)} aria-label={de ? 'Schließen' : 'Close'} className="w-9 h-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE_ITEMS.map(item => {
                const active = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    data-testid={`mobile-nav-more-${item.path.replace(/\W+/g, '')}`}
                    className={`min-h-[52px] px-4 py-3 rounded-xl text-left text-[13px] font-black transition-colors ${active
                      ? 'bg-[#BFFF00] text-[#0A0A0A]'
                      : 'bg-black/[0.03] dark:bg-white/[0.05] text-foreground/85 active:bg-black/[0.06] dark:active:bg-white/[0.08]'}`}
                  >
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
