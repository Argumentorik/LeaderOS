/**
 * AppErrorBoundary — Catches uncaught React render errors and reports them
 * to Sentry while showing a premium, branded recovery screen.
 *
 * Design rationale (Iter 92.5):
 *   - Uses Sentry.ErrorBoundary directly (auto-reports + provides eventId
 *     for the user to reference in support tickets).
 *   - The fallback UI is intentionally calm — no panic alert. Dark Revolut-
 *     style card with: lime W mark, "Es tut uns leid"-headline, the Sentry
 *     event id (small, for support), one primary CTA ("Seite neu laden"),
 *     one secondary ("Zurück zum Dashboard").
 *   - Shows a Sentry user-feedback button on production so frustrated users
 *     can tell us what happened in one click.
 */
import * as Sentry from '@sentry/react';
import { useEffect, useState } from 'react';
import { RefreshCw, Home, AlertTriangle, Send, Mail } from 'lucide-react';
import { WladMark } from './brand/WladMark';
import { reportError, reportFeedback } from '../lib/telemetry';

const ErrorFallback = ({ error, eventId, resetError }) => {
  // Iter 121.7 (Godmode): mirror the exception to our own telemetry
  // endpoint. Sentry is our SaaS backup — the local `error_log` collection
  // is what the admin dashboard reads.
  const [diagId, setDiagId] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const diag = await reportError(error, {
        source: 'react-boundary',
        severity: 'fatal',
        context: { sentry_event_id: eventId },
      });
      if (!cancelled && diag) setDiagId(diag);
    })();
    return () => { cancelled = true; };
  }, [error, eventId]);

  const shownId = diagId || eventId;
  const supportSubject = `Leader-OS Fehler ${shownId || ''}`.trim();
  const supportBody = `Diagnostic-ID: ${shownId || 'n/a'}%0AURL: ${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}%0A%0AWas wolltest du tun?%0A`;

  const handleReload = () => { resetError(); window.location.reload(); };
  const handleHome = () => { resetError(); window.location.assign('/dashboard'); };
  const showFeedback = async () => {
    // Prefer our lightweight in-app feedback (works even without Sentry SDK).
    const message = window.prompt(
      'Was ist genau passiert? Deine Antwort geht an unser Team — Diagnostic-ID + Konsole hängen automatisch dran.',
      '',
    );
    if (!message) return;
    const res = await reportFeedback({ message, category: 'bug' });
    if (res.ok) {
      window.alert('Danke — wir melden uns. Kontakt: start@aiporate.com');
    } else if (eventId && Sentry.showReportDialog) {
      // Sentry-fallback if our own telemetry endpoint refused.
      try { Sentry.showReportDialog({ eventId, lang: 'de' }); } catch { /* no-op */ }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0A0A0A] text-white"
      data-testid="app-error-boundary"
      role="alert"
    >
      {/* Aurora background glow — even error screens stay premium */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#BFFF00]/[0.04] blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] rounded-full bg-rose-500/[0.04] blur-[160px]" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="flex justify-center mb-7">
          <WladMark size={56} animated />
        </div>

        <div className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
          <AlertTriangle size={11} className="text-rose-400" />
          <span className="text-[10px] tracking-[0.2em] uppercase font-black text-rose-400">Unerwartet</span>
        </div>

        <h1
          className="text-[32px] font-black tracking-tight leading-[1.05] mb-3"
          style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '-0.03em' }}
        >
          Etwas ist schiefgelaufen.
        </h1>

        <p className="text-white/65 text-[14px] leading-relaxed mb-7 max-w-sm mx-auto">
          Keine Sorge — wir wurden automatisch benachrichtigt und schauen es uns an.
          Versuch's einfach nochmal.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-5">
          <button
            type="button"
            onClick={handleReload}
            data-testid="error-boundary-reload"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-bold text-[13px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_24px_-8px_rgba(191,255,0,0.55)]"
          >
            <RefreshCw size={14} /> Seite neu laden
          </button>
          <button
            type="button"
            onClick={handleHome}
            data-testid="error-boundary-home"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-[13px] transition-colors"
          >
            <Home size={14} /> Zurück zum Dashboard
          </button>
        </div>

        {shownId && (
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={showFeedback}
              data-testid="error-boundary-feedback"
              className="inline-flex items-center gap-1.5 text-[11.5px] text-white/60 hover:text-white transition-colors mb-2"
            >
              <Send size={11} /> Sag uns, was passiert ist
            </button>
            <p className="text-[10px] text-white/30 font-mono tracking-wider" data-testid="error-diagnostic-id">
              ID · {shownId}
            </p>
            <a
              href={`mailto:start@aiporate.com?subject=${encodeURIComponent(supportSubject)}&body=${supportBody}`}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#BFFF00]/80 hover:text-[#BFFF00] transition-colors"
              data-testid="error-boundary-mail"
            >
              <Mail size={10} /> start@aiporate.com
            </a>
          </div>
        )}

        {process.env.NODE_ENV !== 'production' && error && (
          <details className="mt-6 text-left bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <summary className="text-[11px] text-white/50 cursor-pointer font-bold uppercase tracking-wider">
              Stack trace (dev only)
            </summary>
            <pre className="mt-2 text-[10px] text-rose-300/80 overflow-x-auto whitespace-pre-wrap">
              {String(error?.stack || error?.message || error)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export const AppErrorBoundary = ({ children }) => (
  <Sentry.ErrorBoundary
    fallback={({ error, eventId, resetError }) => (
      <ErrorFallback error={error} eventId={eventId} resetError={resetError} />
    )}
    showDialog={false}
  >
    {children}
  </Sentry.ErrorBoundary>
);

export default AppErrorBoundary;
