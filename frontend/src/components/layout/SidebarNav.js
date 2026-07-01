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

            // ── Locked item: render as a clickable div that routes to /coaching ──
            if (item.locked) {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => setLockedItem(item)}
                  data-testid={`nav-locked-${item.path.replace('/', '')}`}
                  className={`${baseCls} group w-full text-left text-gray-400/70 dark:text-muted-foreground/40 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-500/[0.05] cursor-pointer`}
                  title={`${item.label} — mit Leadership OS freischalten`}
                >
                  <item.icon size={16} className="shrink-0 opacity-70" />
                  {!collapsed && (
                    <>
                      <span className="opacity-80">{item.label}</span>
                      <Lock
                        size={11}
                        className="ml-auto shrink-0 text-amber-500/80 transition-transform duration-200 group-hover:scale-125 group-hover:-rotate-12"
                        data-testid={`lock-${item.path.replace('/', '')}`}
                      />
                    </>
                  )}
                </button>
              );
            }

            return (
              <NavLink key={item.path} to={item.path} data-testid={`nav-${item.path.replace('/', '')}`}
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
