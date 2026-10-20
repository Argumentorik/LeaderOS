/**
 * WladHelpButton — Floating support widget (bottom-right).
 *
 * Iter 92.15 (Mert: "Support automatisieren mit dem WladHelp Button"):
 * Klein, premium, immer da. Klick öffnet einen Chat-style Modal:
 *  • User stellt Frage → POST /api/support/ask
 *  • Backend matcht FAQ-Shortcuts (instant, no-LLM) ODER GPT-5.2 fallback
 *  • Antwort + Suggested-Actions (Cal.com / Email / internal route)
 *
 * Hidden auf /login, /onboarding, payment-success (kein clutter dort).
 * Stateful conversation via `session_id` (returned vom Backend).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LifeBuoy, X, Send, Loader2, ExternalLink, Mail, ArrowUpRight, Sparkles
} from 'lucide-react';
import gsap from 'gsap';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { useAuth } from '../../contexts/AuthContext';

// Iter 92.17 (Mert: "SupportBot eher nur bei den Seiten aufploppen lassen wo man Hilfe braucht"):
//   FAB ist NUR auf Pages sichtbar wo User typischerweise stecken bleiben oder
//   Aktivierungshilfe brauchen. Dashboard (klare CTAs), Profile (Settings),
//   Auth-Flows (Login/Onboarding/Checkout) zeigen ihn NICHT — kein Funnel-Clutter.
//
//   Allowed: /chat (komplexe AI-Interaktion), /coaching (Pricing+Booking-Hilfe),
//   /my-path (Curriculum-Fragen), /missions/* (Mission-Help),
//   /playbooks (Tool-Bedienung), /simulations, /tools, /video-challenge,
//   /community (Posting-Help), /events (Calendar-Confusion),
//   /leader-diagnose, /enterprise.
const ALLOWED_PATHS = [
  '/chat', '/coaching', '/my-path', '/playbooks', '/simulations', '/tools',
  '/missions', '/community', '/events', '/video-challenge',
  '/leader-diagnose', '/enterprise', '/daily-checkin',
];

const HIDDEN_PATHS = new Set([
  '/login', '/auth/callback', '/payment-success', '/email/unsubscribe',
  '/onboarding', '/dashboard', '/profile', '/referral', '/challengers',
  '/impressum', '/datenschutz', '/widerruf', '/agb', '/downloads',
]);

const isAllowedPath = (pathname) => {
  if (HIDDEN_PATHS.has(pathname)) return false;
  // Prefix match for nested routes like /missions/123/play
  return ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
};

const QUICK_PROMPTS = [
  { de: 'Wie nutze ich AI als Leadership-Multiplier?', en: 'How do I use AI as a leadership multiplier?' },
  { de: 'Wie buche ich ein Strategiegespräch?', en: 'How do I book a strategy call?' },
  { de: 'Was bringt mir OS PLUS?', en: 'What do I get with OS PLUS?' },
  { de: 'Login klappt nicht', en: 'Login is not working' },
];

const SuggestedActionPill = ({ action, navigate }) => {
  const handle = () => {
    if (action.type === 'mailto') { window.location.href = `mailto:${action.value}`; return; }
    if (action.type === 'external') { window.open(action.value, '_blank', 'noopener,noreferrer'); return; }
    if (action.type === 'internal') { navigate(action.value); return; }
  };
  const Icon = action.type === 'mailto' ? Mail : action.type === 'external' ? ExternalLink : ArrowUpRight;
  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#BFFF00]/12 hover:bg-[#BFFF00]/20 border border-[#BFFF00]/30 text-[11px] font-bold text-foreground transition-colors"
      data-testid={`support-action-${action.type}`}
    >
      <Icon size={11} />
      {action.label}
    </button>
  );
};

export const WladHelpButton = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);  // {role: 'user'|'assistant', text, actions?}
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const panelRef = useRef(null);
  const fabRef = useRef(null);
  const scrollRef = useRef(null);

  // Hide on auth/checkout flows + clear-CTA pages — only show where users get stuck
  const hidden = !user || !isAllowedPath(pathname);

  // GSAP entrance/exit
  useEffect(() => {
    if (!panelRef.current) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return undefined;
    if (open) {
      try {
        gsap.fromTo(panelRef.current,
          { y: 24, scale: 0.96, autoAlpha: 0 },
          { y: 0, scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(1.4)' });
      } catch { /* noop */ }
    }
    return undefined;
  }, [open]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const send = useCallback(async (text) => {
    const message = (text ?? draft).trim();
    if (!message || sending) return;
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setDraft('');
    setSending(true);
    try {
      const res = await api.post('/support/ask', {
        message,
        session_id: sessionId,
      });
      const { answer, session_id: newSession, suggested_actions } = res.data;
      if (newSession && !sessionId) setSessionId(newSession);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: answer,
        actions: suggested_actions || [],
      }]);
    } catch (err) {
      logger.error('WladHelp send failed', err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: 'Sorry — gerade gabs einen Fehler. Schreib uns auf support@leaderos.de und wir melden uns innerhalb 24h.',
        actions: [{ label: 'Email an Support', type: 'mailto', value: 'support@leaderos.de' }],
      }]);
    } finally {
      setSending(false);
    }
  }, [draft, sending, sessionId]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (hidden) return null;

  // /chat pins the input bar to the bottom — on mobile the FAB would cover
  // the send button, so lift it above the input bar there (Iter 112).
  const liftOnMobile = pathname.startsWith('/chat');

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <button
          ref={fabRef}
          onClick={() => setOpen(true)}
          className={`group fixed ${liftOnMobile ? 'bottom-28 sm:bottom-6' : 'bottom-6'} right-6 z-[140] w-14 h-14 rounded-full bg-[#BFFF00] hover:bg-[#D4FF4D] active:scale-95 shadow-[0_12px_36px_-8px_rgba(191,255,0,0.55)] hidden md:flex items-center justify-center transition-all`}
          aria-label="WladHelp öffnen"
          title="WladHelp · Brauchst du Hilfe?"
          data-testid="wladhelp-fab"
        >
          <LifeBuoy size={22} className="text-[#0A0A0A] group-hover:rotate-12 transition-transform" />
          {/* tiny live-dot to signal "AI ready" */}
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0A0A0A]">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-6 right-6 z-[140] w-[92vw] max-w-[380px] h-[560px] max-h-[80vh] rounded-3xl bg-[#0A0A0A] border border-white/[0.08] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.55)] flex flex-col overflow-hidden"
          role="dialog"
          aria-label="WladHelp"
          data-testid="wladhelp-panel"
          style={{ opacity: 0 }}
        >
          {/* Aurora glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[#BFFF00]/15 blur-3xl" aria-hidden />

          {/* Header */}
          <div className="relative flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#BFFF00]/15 text-[#BFFF00] flex items-center justify-center">
                <LifeBuoy size={16} />
              </div>
              <div>
                <p className="text-[13px] font-black text-white tracking-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                  WladHelp
                </p>
                <p className="text-[10px] text-white/40 leading-none">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 align-middle" />
                  AI Support · meist &lt; 30 Sek Antwort
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-white/70 hover:text-white flex items-center justify-center transition-colors"
              data-testid="wladhelp-close"
              aria-label="WladHelp schließen"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages area */}
          <div
            ref={scrollRef}
            className="relative flex-1 overflow-y-auto px-4 py-4 space-y-3"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-3.5">
                  <p className="text-[12.5px] text-white/85 leading-relaxed">
                    Hi! Ich bin <strong className="text-[#BFFF00]">WladHelp</strong> — beantworte Support-Fragen zu deinem Account, Tarifen, Coaching, Bezahlung.
                  </p>
                  <p className="text-[11px] text-white/45 mt-2">
                    Bei kniffligen Sachen melden wir uns persönlich innerhalb 24h.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider font-black text-white/35 px-1">
                    Häufige Fragen
                  </p>
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.de}
                      onClick={() => send(p.de)}
                      disabled={sending}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/[0.05] hover:border-[#BFFF00]/25 text-[12px] text-white/75 hover:text-white transition-all disabled:opacity-50"
                      data-testid={`wladhelp-quick-${p.de.slice(0, 8)}`}
                    >
                      <Sparkles size={10} className="inline mr-1.5 text-[#BFFF00]/70" />
                      {p.de}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={`msg-${i}-${m.role}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  m.role === 'user'
                    ? 'bg-[#BFFF00] text-[#0A0A0A] font-semibold'
                    : 'bg-white/[0.06] text-white/90 border border-white/[0.06]'
                }`}>
                  <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  {m.actions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-white/10">
                      {m.actions.map((a) => (
                        <SuggestedActionPill key={a.label} action={a} navigate={navigate} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-white/[0.06] rounded-2xl px-3.5 py-2.5 border border-white/[0.06]">
                  <Loader2 size={14} className="text-[#BFFF00] animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="relative border-t border-white/[0.06] p-3">
            <div className="flex items-end gap-2 bg-white/[0.04] rounded-2xl px-3 py-2 border border-white/[0.06] focus-within:border-[#BFFF00]/40 transition-colors">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Frag mich was…"
                rows={1}
                className="flex-1 bg-transparent text-[12.5px] text-white placeholder:text-white/30 resize-none outline-none py-1 max-h-28"
                disabled={sending}
                data-testid="wladhelp-input"
              />
              <button
                onClick={() => send()}
                disabled={!draft.trim() || sending}
                className="w-8 h-8 rounded-lg bg-[#BFFF00] text-[#0A0A0A] flex items-center justify-center disabled:opacity-30 disabled:bg-white/10 disabled:text-white/30 hover:bg-[#D4FF4D] transition-colors"
                aria-label="Senden"
                data-testid="wladhelp-send"
              >
                <Send size={13} />
              </button>
            </div>
            <p className="text-[9px] text-white/25 mt-1.5 text-center">
              Bei dringenden Anliegen: <a href="mailto:support@leaderos.de" className="text-white/40 hover:text-white/70 underline">support@leaderos.de</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default WladHelpButton;
