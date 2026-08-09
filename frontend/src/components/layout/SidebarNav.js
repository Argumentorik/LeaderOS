import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { LockedFeatureModal } from '../shared/LockedFeatureModal';

/**
 * Iter 92.49 (Mert Godmode): locked items (Free tier on premium sections) open
 * a premium LockedFeatureModal (feature teaser + upgrade CTA) instead of a
 * hard redirect. Applies to Simulations, Playbooks, Tasks, Workflows,
 * Lern-Videos, Events.
 */
export const SidebarNav = ({ navSections, activeSection, collapsed }) => {
  const [lockedItem, setLockedItem] = useState(null);

  // Iter 131.3 (Wlad-Direktive · Dashboard First-Tour): map paths to
  // stable tour IDs so <DashboardFirstTour> can spotlight the correct
  // sidebar row. New routes just add themselves here — no hard-coded
  // querySelector strings scattered around.
  const TOUR_ID_BY_PATH = {
    '/dashboard': 'nav-dashboard',
    '/challenge': 'nav-challenge',
    '/daily-checkin': 'nav-checkin',
    '/chat': 'nav-wladbot',
    '/simulations': 'nav-simulations',
    '/playbooks': 'nav-playbooks',
    '/missions': 'nav-video',
    '/my-path': 'nav-progress',
    '/lern-videos': 'nav-videos',
  };

  return (
    <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-hide" data-testid="sidebar-nav">
      {navSections.map((section) => (
        <div key={section.id} className="mb-1">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-[7px] mb-[2px]">
              <div className={`w-[16px] h-[16px] rounded-[4px] flex items-center justify-center bg-gradient-to-br ${section.badgeGrad}`}>
                <section.badge />
              </div>
              <span className={`text-[9px] font-extrabold uppercase tracking-[0.16em] transition-colors ${activeSection === section.id ? 'text-foreground/70' : 'text-muted-foreground/35'}`}>{section.label}</span>
            </div>
          )}
          {section.items.map((item) => {
            const baseCls = `flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium transition-all duration-150 ${collapsed ? 'justify-center px-2' : ''}`;

            // ── Locked item: premium subtle lock badge (brand aligned) ──
            if (item.locked) {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => setLockedItem(item)}
                  data-testid={`nav-locked-${item.path.replace('/', '')}`}
                  data-tour-id={TOUR_ID_BY_PATH[item.path]}
                  className={`${baseCls} group relative w-full text-left text-gray-400/70 dark:text-muted-foreground/45 hover:text-gray-700 dark:hover:text-white/85 hover:bg-gray-50/60 dark:hover:bg-white/[0.03] cursor-pointer`}
                  title={`${item.label} — mit Leadership OS freischalten`}
                >
                  <item.icon size={16} className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                  {!collapsed && (
                    <>
                      <span className="opacity-80 group-hover:opacity-100 transition-opacity">{item.label}</span>
                      <span
                        className="ml-auto shrink-0 flex items-center justify-center w-[18px] h-[18px] rounded-md bg-black/[0.04] dark:bg-white/[0.05] text-gray-500/70 dark:text-white/40 group-hover:bg-[#BFFF00]/15 group-hover:text-[#6B8A00] dark:group-hover:text-[#BFFF00] transition-colors duration-200"
                        data-testid={`lock-${item.path.replace('/', '')}`}
                        aria-hidden="true"
                      >
                        <Lock size={9} strokeWidth={2.6} />
                      </span>
                    </>
                  )}
                </button>
              );
            }

            return (
              <NavLink key={item.path} to={item.path} data-testid={`nav-${item.path.replace('/', '')}`}
                data-tour-id={TOUR_ID_BY_PATH[item.path]}
                className={({ isActive }) =>
                  `${baseCls} ${
                    isActive
                      ? 'bg-[#BFFF00]/[0.07] dark:bg-[#BFFF00]/[0.06] text-[#4A6200] dark:text-[#BFFF00] font-semibold border-l-2 border-[#6B8A00] dark:border-[#BFFF00]'
                      : 'text-gray-400 dark:text-muted-foreground/60 hover:text-gray-600 dark:hover:text-foreground/80 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'
                  }`
                }>
                <item.icon size={16} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      ))}
      {lockedItem && (
        <LockedFeatureModal item={lockedItem} onClose={() => setLockedItem(null)} />
      )}
    </nav>
  );
};
