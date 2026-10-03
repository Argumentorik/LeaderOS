import { KeyRound, Sparkles, Ticket } from 'lucide-react';

const TABS = [
  { mode: 'login', icon: KeyRound, label: (de) => (de ? 'Passwort' : 'Password'), testId: 'tab-password', activeCls: 'bg-white/10 text-white shadow-sm' },
  { mode: 'magic', icon: Sparkles, label: () => 'Magic Link', testId: 'tab-magic-link', activeCls: 'bg-[#BFFF00]/12 text-[#BFFF00] shadow-sm' },
  { mode: 'license', icon: Ticket, label: (de) => (de ? 'Lizenz-Key' : 'License Key'), testId: 'tab-license-key', activeCls: 'bg-[#BFFF00]/12 text-[#BFFF00] shadow-sm' },
];

/** Passwort · Magic Link · Lizenz-Key */
export const AuthModeTabs = ({ mode, onSwitch, de }) => (
  <div className="mb-4 inline-flex p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]" role="tablist" data-testid="auth-mode-tabs">
    {TABS.map((t) => (
      <button
        key={t.mode}
        type="button"
        role="tab"
        aria-selected={mode === t.mode}
        onClick={() => onSwitch(t.mode)}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${mode === t.mode ? t.activeCls : 'text-white/45 hover:text-white/70'}`}
        data-testid={t.testId}
      >
        <t.icon size={12} /> {t.label(de)}
      </button>
    ))}
  </div>
);

const LEGAL = [
  { href: '/impressum', label: () => 'Impressum', testId: 'footer-impressum' },
  { href: '/datenschutz', label: (de) => (de ? 'Datenschutz' : 'Privacy'), testId: 'footer-datenschutz' },
  { href: '/agb', label: () => 'AGB', testId: 'footer-agb' },
  { href: '/widerruf', label: (de) => (de ? 'Widerruf' : 'Withdrawal'), testId: 'footer-widerruf' },
  { href: '/changelog', label: () => 'Changelog', testId: 'footer-changelog' },
];

export const LegalFooter = ({ de }) => (
  <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground" data-testid="legal-footer">
    {LEGAL.map((l, i) => (
      <span key={l.href} className="contents">
        {i > 0 && <span className="opacity-30">·</span>}
        <a href={l.href} className="tap-target py-1.5 px-0.5 hover:text-[#BFFF00] hover:underline" data-testid={l.testId}>{l.label(de)}</a>
      </span>
    ))}
  </div>
);
