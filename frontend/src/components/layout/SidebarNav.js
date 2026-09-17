import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Lock } from 'lucide-react';
import { LockedFeatureModal } from '../shared/LockedFeatureModal';
import { prefetchRoute } from '../../lib/routePrefetch';

const NAV_OPEN_KEY = 'leaderos_nav_open';

// Iter 131.3: stabile Anker für die Erst-Tour — neue Routen tragen sich hier ein.
const TOUR_ID_BY_PATH = {
  '/dashboard': 'nav-dashboard',
  '/challenge': 'nav-challenge',
  '/daily-checkin': 'nav-checkin',
  '/chat': 'nav-wladbot',
  '/simulations': 'nav-simulations',
  '/playbooks': 'nav-playbooks',
  '/missions': 'nav-video',
  '/my-path': 'nav-progress',
  '/kurse': 'nav-videos',
};

const testId = (path) => `nav-${path.replace(/^\//, '').replace(/\//g, '-')}`;

/** Eine Menüzeile — gesperrt öffnet den Hinweis statt der Seite. */
const NavRow = ({ item, collapsed, indent, onLocked }) => {
  const baseCls = `flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] font-medium transition-all duration-150 ${collapsed ? 'justify-center px-2' : ''} ${indent && !collapsed ? 'ml-4' : ''}`;

  if (item.locked) {
    return (
      <button type="button" onClick={() => onLocked(item)}
        data-testid={`nav-locked-${item.path.replace('/', '')}`}
        data-tour-id={TOUR_ID_BY_PATH[item.path]}
        className={`${baseCls} group relative w-full text-left nav-row-locked hover:bg-gray-50/60 dark:hover:bg-white/[0.03] cursor-pointer`}
        title={`${item.label} — mit dem Leadership-Programm freischalten`}>
        <item.icon size={16} className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
        {!collapsed && (
          <>
            <span className="opacity-80 group-hover:opacity-100 transition-opacity truncate">{item.label}</span>
            <span className="ml-auto shrink-0 flex items-center justify-center w-[18px] h-[18px] rounded-md bg-black/[0.04] dark:bg-white/[0.05] text-gray-500/70 dark:text-white/40 group-hover:bg-[#BFFF00]/15 group-hover:text-[#6B8A00] dark:group-hover:text-[#BFFF00] transition-colors duration-200"
                  data-testid={`lock-${item.path.replace('/', '')}`} aria-hidden="true">
              <Lock size={9} strokeWidth={2.6} />
            </span>
          </>
        )}
      </button>
    );
  }

  return (
    <div>
      <NavLink to={item.path} data-testid={testId(item.path)}
        data-tour-id={TOUR_ID_BY_PATH[item.path]}
        onMouseEnter={() => prefetchRoute(item.path)} onFocus={() => prefetchRoute(item.path)} onTouchStart={() => prefetchRoute(item.path)}
        className={({ isActive }) =>
          `${baseCls} ${isActive
            ? 'bg-[#BFFF00]/[0.07] dark:bg-[#BFFF00]/[0.06] text-[#4A6200] dark:text-[#BFFF00] font-semibold border-l-2 border-[#6B8A00] dark:border-[#BFFF00]'
            : 'nav-row hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'}`}>
        <item.icon size={16} className="shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badgeText && (
          <span className="ml-auto shrink-0 text-[9px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00]"
                data-testid={`nav-badge-${item.path.replace('/', '')}`}>
            {item.badgeText}
          </span>
        )}
      </NavLink>
      {!collapsed && item.subLine && (
        <p className="px-3 pb-1.5 -mt-0.5 text-[10.5px] leading-tight text-muted-foreground/80 line-clamp-2"
           data-testid={`nav-subline-${item.path.replace('/', '')}`}>
          {item.subLine}
        </p>
      )}
    </div>
  );
};

/**
 * Plan Iter 187 (Wunsch Stefan · „3 + 1"): oben stehen nur vier Einträge.
 * Was dazugehört, klappt beim Klick auf. Alles Seltene liegt hinter „Mehr".
 */
export const SidebarNav = ({ mainItems, moreGroups, collapsed, moreLabel, moreHint }) => {
  const location = useLocation();
  const [lockedItem, setLockedItem] = useState(null);
  const [openMap, setOpenMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(NAV_OPEN_KEY)) || {};
    } catch {
      return {};
    }
  });

  const holds = (items) => (items || []).some((i) => i.path === location.pathname);
  // Iter 188: Die Hauptgruppen stehen beim ersten Besuch offen, „Mehr" bleibt
  // zu. JEDE Gruppe lässt sich zuklappen — auch die, in der man gerade steht.
  const isOpen = (id, defaultOpen = false) => (
    Object.prototype.hasOwnProperty.call(openMap, id) ? Boolean(openMap[id]) : defaultOpen
  );
  const toggle = (id, defaultOpen = false) => {
    setOpenMap((prev) => {
      const current = Object.prototype.hasOwnProperty.call(prev, id) ? Boolean(prev[id]) : defaultOpen;
      const next = { ...prev, [id]: !current };
      try { localStorage.setItem(NAV_OPEN_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };

  const moreItems = (moreGroups || []).flatMap((g) => g.items);
  const moreOpen = isOpen('more');

  const GroupHead = ({ id, label, icon: Icon, items, tid, defaultOpen }) => (
    <button type="button" onClick={() => toggle(id, defaultOpen)} aria-expanded={isOpen(id, defaultOpen)}
      className={`flex items-center gap-2.5 w-full px-3 py-[8px] rounded-[10px] text-[13px] font-medium transition-colors ${holds(items) ? 'text-[#4A6200] dark:text-[#BFFF00] font-semibold' : 'nav-row'} hover:bg-gray-50/50 dark:hover:bg-white/[0.02]`}
      data-testid={tid}>
      <Icon size={16} className="shrink-0" />
      <span className="truncate">{label}</span>
      <ChevronDown size={12} className={`ml-auto shrink-0 opacity-45 transition-transform ${isOpen(id, defaultOpen) ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-hide" data-testid="sidebar-nav">
      {mainItems.map((item) => {
        if (!item.children) return <NavRow key={item.path} item={item} collapsed={collapsed} onLocked={setLockedItem} />;
        if (collapsed) {
          return item.children.map((c) => <NavRow key={c.path} item={c} collapsed onLocked={setLockedItem} />);
        }
        return (
          <div key={item.id} className="mb-0.5">
            <GroupHead id={item.id} label={item.label} icon={item.icon} items={item.children}
                       tid={`nav-group-${item.id}`} defaultOpen={item.defaultOpen} />
            {item.hint && !collapsed && (
              <p className="px-3 pb-1 -mt-0.5 text-[10.5px] leading-tight text-muted-foreground/75"
                 data-testid={`nav-hint-${item.id}`}>{item.hint}</p>
            )}
            {isOpen(item.id, item.defaultOpen) && (
              <div className="mt-0.5 space-y-0.5" data-testid={`nav-group-items-${item.id}`}>
                {item.children.map((c) => <NavRow key={c.path} item={c} collapsed={false} indent onLocked={setLockedItem} />)}
              </div>
            )}
          </div>
        );
      })}

      {/* „Mehr" — alles Seltene, sauber gruppiert */}
      {collapsed ? (
        moreItems.map((i) => <NavRow key={i.path} item={i} collapsed onLocked={setLockedItem} />)
      ) : (
        <div className="pt-2 mt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
          <button type="button" onClick={() => toggle('more')} aria-expanded={moreOpen}
            className="flex items-center gap-2.5 w-full px-3 py-[8px] rounded-[10px] nav-row hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
            data-testid="nav-more-toggle">
            <span className="flex items-center gap-[3px] shrink-0 w-4 justify-center">
              {[0, 1, 2].map((d) => <span key={d} className="w-[3px] h-[3px] rounded-full bg-current opacity-60" />)}
            </span>
            <span className="text-[13px] font-medium truncate">{moreLabel}</span>
            <ChevronDown size={12} className={`ml-auto shrink-0 opacity-45 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
          </button>
          {moreOpen && (
            <div className="mt-2 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] p-2" data-testid="nav-more-panel">
              {moreHint && <p className="px-2 pt-1 pb-2 text-[10.5px] leading-snug text-muted-foreground/75">{moreHint}</p>}
              {moreGroups.map((g) => (
                <div key={g.id} className="mb-1.5 last:mb-0">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <div className={`w-[16px] h-[16px] rounded-[4px] flex items-center justify-center bg-gradient-to-br ${g.badgeGrad}`}>
                      <g.badge />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] nav-label">{g.label}</span>
                  </div>
                  <div className="space-y-0.5">
                    {g.items.map((i) => <NavRow key={i.path} item={i} collapsed={false} onLocked={setLockedItem} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {lockedItem && <LockedFeatureModal item={lockedItem} onClose={() => setLockedItem(null)} />}
    </nav>
  );
};
