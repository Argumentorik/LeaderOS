/**
 * UsageFeedbackPrompt — replaces the permanent floating support button.
 *
 * Shows ONE dismissible, non-blocking prompt after meaningful product usage
 * (~30 AI interactions). Never reappears after dismissal or send.
 * Support stays reachable via the FAQ & Support section.
 */
import { useState, useEffect } from 'react';
import { X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useCredits } from '../../contexts/CreditContext';
import { useAuth } from '../../contexts/AuthContext';
import { reportFeedback } from '../../lib/telemetry';

const DONE_KEY = 'leaderos:usage-feedback-done';
const USAGE_THRESHOLD = 30;

export function UsageFeedbackPrompt() {
  const { totalUsed, isPremium } = useCredits();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      if (localStorage.getItem(DONE_KEY)) return;
    } catch { return; }
    // Premium users have unlimited credits (totalUsed stays 0) — use XP as usage proxy.
    const meaningfulUsage = totalUsed >= USAGE_THRESHOLD || (isPremium && (user.xp || 0) >= 300);
    if (meaningfulUsage) setVisible(true);
  }, [user, totalUsed, isPremium]);

  const dismiss = () => {
    try { localStorage.setItem(DONE_KEY, '1'); } catch { /* private mode */ }
    setVisible(false);
  };

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const res = await reportFeedback({ message, category: 'idea' });
      if (res.ok) {
        setSent(true);
        setTimeout(dismiss, 2200);
      }
    } finally {
      setSending(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="hidden md:block fixed bottom-5 left-4 right-4 mx-auto z-[45] max-w-sm animate-fade-in"
      data-testid="usage-feedback-prompt"
    >
      <div className="rounded-2xl bg-[#0A0A0A] border border-white/[0.1] shadow-2xl shadow-black/40 overflow-hidden">
        {sent ? (
          <div className="p-4 flex items-center gap-3" data-testid="usage-feedback-sent">
            <CheckCircle2 size={18} className="text-[#BFFF00] shrink-0" />
            <p className="text-[12.5px] font-bold text-white">Danke — dein Feedback ist beim Team.</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#BFFF00]">Support · Direktkontakt</p>
                <p className="text-[13px] font-bold text-white mt-0.5">Du nutzt Leader-OS aktiv — was sollen wir besser machen?</p>
              </div>
              <button onClick={dismiss} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 shrink-0" data-testid="usage-feedback-dismiss" aria-label="Schließen">
                <X size={14} />
              </button>
            </div>

            {expanded ? (
              <div className="mt-3 space-y-2.5">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="Kurz und ehrlich — wir lesen alles."
                  className="w-full text-[12.5px] rounded-xl border border-white/[0.1] bg-white/[0.05] text-white placeholder:text-white/30 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#BFFF00]/40"
                  data-testid="usage-feedback-message"
                />
                <div className="flex items-center justify-end gap-2">
                  <button onClick={dismiss} disabled={sending} className="px-3 py-2 rounded-lg text-[11px] font-black text-white/50 hover:text-white" data-testid="usage-feedback-cancel">
                    Später
                  </button>
                  <button
                    onClick={send}
                    disabled={!message.trim() || sending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[11px] font-black disabled:opacity-40"
                    data-testid="usage-feedback-send"
                  >
                    {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Senden
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setExpanded(true)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[11px] font-black"
                  data-testid="usage-feedback-open"
                >
                  Feedback geben
                </button>
                <button onClick={dismiss} className="px-3 py-2 rounded-lg text-[11px] font-black text-white/50 hover:text-white" data-testid="usage-feedback-no-thanks">
                  Nein danke
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UsageFeedbackPrompt;
