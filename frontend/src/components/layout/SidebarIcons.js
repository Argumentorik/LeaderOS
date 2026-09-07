/* ───── DUAL-TONE PREMIUM SIDEBAR ICONS ───── */
const I = ({ children, size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>{children}</svg>
);

export const IconCommand = (p) => <I {...p}>
  <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" opacity="0.15"/>
  <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" opacity="0.15"/>
  <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" opacity="0.15"/>
  <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/>
  <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/>
  <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/>
  <circle cx="17.5" cy="17.5" r="3" stroke="currentColor" strokeWidth="1.6"/>
  <path d="M17.5 16v3M16 17.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
</I>;

export const IconPulse = (p) => <I {...p}>
  <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.08"/>
  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
  <path d="M6 12h3l2-4 3 8 2-4h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
</I>;

export const IconClipboard = (p) => <I {...p}>
  <rect x="5" y="3" width="14" height="18" rx="2.5" fill="currentColor" opacity="0.08"/>
  <rect x="5" y="3" width="14" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
  <path d="M9 1.5h6v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.2"/>
  <path d="M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
</I>;

export const IconBubble = (p) => <I {...p}>
  <path d="M4 6a3 3 0 013-3h10a3 3 0 013 3v7a3 3 0 01-3 3H9l-4 3.5V16a3 3 0 01-1-2.2V6z" fill="currentColor" opacity="0.1"/>
  <path d="M4 6a3 3 0 013-3h10a3 3 0 013 3v7a3 3 0 01-3 3H9l-4 3.5V16a3 3 0 01-1-2.2V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
  <circle cx="9" cy="10" r="1" fill="currentColor"/>
  <circle cx="12" cy="10" r="1" fill="currentColor"/>
  <circle cx="15" cy="10" r="1" fill="currentColor"/>
</I>;

export const IconBolt = (p) => <I {...p}>
  <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor" opacity="0.12"/>
  <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
</I>;

export const IconShield = (p) => <I {...p}>
  <path d="M12 2l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" fill="currentColor" opacity="0.1"/>
  <path d="M12 2l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
</I>;

export const IconCrown = (p) => <I {...p}>
  <path d="M3 17h18l-2-10-4.5 5L12 4l-2.5 8L5 7l-2 10z" fill="currentColor" opacity="0.12"/>
  <path d="M3 17h18l-2-10-4.5 5L12 4l-2.5 8L5 7l-2 10z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
  <path d="M4 20h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
</I>;

export const IconLayers = (p) => <I {...p}>
  <path d="M12 2l10 5-10 5L2 7l10-5z" fill="currentColor" opacity="0.12"/>
  <path d="M12 2l10 5-10 5L2 7l10-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
  <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
</I>;

export const IconLens = (p) => <I {...p}>
  <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.06"/>
  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6"/>
  <path d="M12 4a8 8 0 000 16" stroke="currentColor" strokeWidth="1.4" opacity="0.2"/>
  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
  <circle cx="12" cy="12" r="0.8" fill="currentColor"/>
</I>;

export const IconFlow = (p) => <I {...p}>
  <circle cx="5" cy="5" r="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.4"/>
  <circle cx="19" cy="5" r="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.4"/>
  <circle cx="12" cy="19" r="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.4"/>
  <path d="M7.5 7l4.5 9M16.5 7l-4.5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4"/>
</I>;

export const IconGraph = (p) => <I {...p}>
  <path d="M3 20h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  <rect x="5" y="12" width="3" height="8" rx="1" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.2"/>
  <rect x="10.5" y="6" width="3" height="14" rx="1" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.2"/>
  <rect x="16" y="3" width="3" height="17" rx="1" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="1.2"/>
</I>;

export const IconEvent = (p) => <I {...p}>
  <rect x="3" y="5" width="18" height="16" rx="3" fill="currentColor" opacity="0.08"/>
  <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.6"/>
  <path d="M3 10h18" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/>
  <path d="M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  <circle cx="8" cy="15" r="1.2" fill="currentColor"/>
  <circle cx="12" cy="15" r="1.2" fill="currentColor" opacity="0.4"/>
  <circle cx="16" cy="15" r="1.2" fill="currentColor" opacity="0.2"/>
</I>;

export const IconDiamond = (p) => <I {...p}>
  <path d="M12 2l9 7-9 13L3 9l9-7z" fill="currentColor" opacity="0.1"/>
  <path d="M12 2l9 7-9 13L3 9l9-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
  <path d="M3 9h18M12 2l-3 7h6l-3-7" stroke="currentColor" strokeWidth="1.2" opacity="0.35" strokeLinejoin="round"/>
</I>;

export const IconFlame = (p) => <I {...p}>
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" opacity="0.15"/>
</I>;

export const IconGlobe = (p) => <I {...p}>
  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
  <path d="M3.5 9h17M3.5 15h17" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
  <ellipse cx="12" cy="12" rx="3.5" ry="9" stroke="currentColor" strokeWidth="1.4"/>
</I>;

export const IconSun = (p) => <I {...p}>
  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6"/>
  <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
</I>;

export const IconMoon = (p) => <I {...p}>
  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.6"/>
</I>;

export const IconLogout = (p) => <I {...p}>
  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
</I>;

export const IconChev = ({ size = 10, left }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d={left ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCamera = (p) => <I {...p}>
  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" opacity="0.1"/>
  <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.6"/>
</I>;

/* Section Badge Mini-Icons */
export const SBolt = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>;
export const STarget = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>;
export const SBrain = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2C8 2 5 5 5 9c0 3 2 5 4 6v3h6v-3c2-1 4-3 4-6 0-4-3-7-7-7z"/><path d="M9 22h6"/></svg>;

export const IconCourse = (p) => <I {...p}>
  <path d="M4 5.5A1.5 1.5 0 015.5 4H11v16H5.5A1.5 1.5 0 014 18.5z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" opacity="0.1"/>
  <path d="M20 5.5A1.5 1.5 0 0018.5 4H13v16h5.5a1.5 1.5 0 001.5-1.5z" stroke="currentColor" strokeWidth="1.6"/>
  <path d="M15.5 9.5l3 1.75-3 1.75z" fill="currentColor"/>
</I>;
