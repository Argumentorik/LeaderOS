/**
 * ActionInbox — "Deine nächsten Schritte" (Iter 118 · Godmode De-Clutter).
 *
 * Consolidates the three full-width dashboard promos (Live-Event, Leader-
 * Diagnose-Sync, Strategy-Call/Beratung) into ONE compact, collapsible
 * command-center widget. Fixes tester feedback "Seite zu busy nach Login":
 * daily work is the hero, promos are demoted but stay fully reachable.
 * Each inner banner keeps its own visibility/dismiss logic untouched.
 */
import { useState } from 'react';
import { ChevronDown, Inbox } from 'lucide-react';
import { EventReminderBanner } from './EventReminder';
import { SyncDiagnoseBanner } from './SyncDiagnoseBanner';
import { SmartConsultationBanner } from '../brand/SmartConsultationBanner';

const OPEN_KEY = 'leaderos_action_inbox_open';

export const ActionInbox = ({ de = true }) => {
  // Iter 163 „weniger ist mehr“: Inbox startet zugeklappt; Nutzerwahl gilt für die Sitzung.
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem(OPEN_KEY) === '1'; } catch { return false; }
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try { sessionStorage.setItem(OPEN_KEY, next ? '1' : '0'); } catch { /* private mode */ }
  };

  return (
    <div
      className="mb-6 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden"
      data-testid="action-inbox"
      data-anim="dash-widget"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left group hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
        data-testid="action-inbox-toggle"
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#BFFF00]/15 shrink-0">
          <Inbox size={14} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#BFFF00] animate-pulse" aria-hidden />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[12.5px] font-bold tracking-tight">
            {de ? 'Deine nächsten Schritte' : 'Your next steps'}
          </span>
          <span className="block text-[10.5px] text-muted-foreground truncate">
            {de ? 'Live-Events · Leader-Diagnose · 1:1-Coaching' : 'Live events · Leader diagnosis · 1:1 coaching'}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-3 sm:px-4 pb-4 pt-1 animate-fade-in" data-testid="action-inbox-content">
          <EventReminderBanner de={de} />
          <SyncDiagnoseBanner de={de} />
          <SmartConsultationBanner placement="dashboard-top" />
        </div>
      )}
    </div>
  );
};
