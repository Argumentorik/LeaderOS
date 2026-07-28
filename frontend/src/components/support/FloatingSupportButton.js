/**
 * FloatingSupportButton — always-available „Feedback" widget.
 *
 * Iter 121.7 (Godmode UX). Sits bottom-left (bottom-right is reserved for
 * the WladBot Drawer). Users can attach a screenshot (auto-captured via
 * html2canvas fallback that ships with the browser), a message, and we
 * attach the last 80 console lines + current URL + user context. Report
 * lands in Mongo AND is forwarded to start@aiporate.com.
 */
import { useState, useCallback, useEffect } from 'react';
import { MessageCircle, X, Loader2, Send, Camera, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { reportFeedback } from '../../lib/telemetry';
import logger from '../../lib/logger';

const CATEGORIES = [
  { id: 'bug',       label: 'Fehler / Bug' },
  { id: 'idea',      label: 'Idee / Wunsch' },
  { id: 'question',  label: 'Frage' },
  { id: 'other',     label: 'Sonstiges' },
];

export function FloatingSupportButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('bug');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Reset the „sent" state a moment after closing so re-opening is fresh.
  useEffect(() => {
    if (!open && sent) {
      const t = setTimeout(() => { setSent(false); setMessage(''); setScreenshot(null); }, 400);
      return () => clearTimeout(t);
    }
  }, [open, sent]);

  const captureScreenshot = useCallback(async () => {
    try {
      // Use getDisplayMedia when available for a REAL page screenshot; fall
      // back to canvas-based dom capture is heavy — we ship a lightweight
      // path that just asks the browser to grab a screen frame.
      if (!navigator.mediaDevices?.getDisplayMedia) {
        toast.info('Screenshot wird von diesem Browser nicht unterstützt — sende Feedback ohne Bild.');
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'never' } });
      const track = stream.getVideoTracks()[0];
      // ImageCapture is not on all browsers — fall back to canvas via video element.
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      await new Promise(r => setTimeout(r, 250));
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 1600);
      canvas.height = Math.min(video.videoHeight, 900);
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      track.stop();
      // 0.55 JPEG quality keeps the base64 payload under ~1.5MB.
      setScreenshot(canvas.toDataURL('image/jpeg', 0.55));
    } catch (e) {
      logger.warn('screenshot capture failed', e);
      toast.info('Screenshot abgebrochen — Feedback kann ohne Bild gesendet werden.');
    }
  }, []);

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const res = await reportFeedback({
        message,
        category,
        screenshotDataUrl: screenshot || undefined,
      });
      if (res.throttled) {
        toast.warning('Bitte kurz warten — es wurden zu viele Reports gesendet.');
      } else if (res.ok) {
        setSent(true);
      } else {
        toast.error('Feedback konnte nicht gesendet werden. Bitte nochmal.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Feedback senden"
        data-testid="support-fab"
        className="fixed bottom-[76px] md:bottom-5 left-5 z-[9990] w-11 h-11 rounded-full bg-[#0A0A0A] text-[#BFFF00] shadow-xl shadow-black/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        style={{ display: open ? 'none' : 'flex' }}
      >
        <MessageCircle size={18} strokeWidth={2.4} />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed inset-0 z-[9995] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-6"
          onClick={() => !sending && setOpen(false)}
          data-testid="support-modal"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div className="p-8 text-center space-y-3" data-testid="support-sent-view">
                <div className="w-14 h-14 rounded-2xl bg-[#BFFF00] inline-flex items-center justify-center">
                  <CheckCircle2 size={26} className="text-[#0A0A0A]" />
                </div>
                <h3 className="text-lg font-black tracking-tight">Danke — wir sind dran.</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dein Feedback wurde direkt an das Team weitergeleitet. Wir melden uns per E-Mail, sobald es Neuigkeiten gibt.
                </p>
                <button onClick={() => setOpen(false)} className="mt-2 inline-flex items-center gap-1 px-5 py-2.5 rounded-xl bg-[#0A0A0A] text-[#BFFF00] font-black text-xs" data-testid="support-close-after-sent">
                  Schließen
                </button>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Support · Direktkontakt</p>
                    <h3 className="text-base font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Was können wir besser machen?</h3>
                  </div>
                  <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" data-testid="support-close" aria-label="Schließen">
                    <X size={16} />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-4 gap-1.5" data-testid="support-categories">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`px-2 py-2 rounded-lg text-[11px] font-black transition-all ${
                          category === c.id
                            ? 'bg-[#BFFF00] text-[#0A0A0A] shadow-md shadow-[#BFFF00]/30'
                            : 'bg-black/[0.04] dark:bg-white/[0.06] text-foreground/70 hover:bg-black/[0.07] dark:hover:bg-white/[0.08]'
                        }`}
                        data-testid={`support-cat-${c.id}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Was ist passiert? Was hättest du erwartet?"
                    className="w-full text-[13px] rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-gray-50 dark:bg-muted/30 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#BFFF00]/40"
                    data-testid="support-message"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={captureScreenshot}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11.5px] font-black border transition-colors ${
                        screenshot
                          ? 'bg-[#BFFF00]/15 border-[#BFFF00]/30 text-[#6B8A00] dark:text-[#BFFF00]'
                          : 'bg-white dark:bg-card border-black/[0.08] dark:border-white/[0.08] hover:border-[#BFFF00]/40'
                      }`}
                      data-testid="support-screenshot-btn"
                    >
                      <Camera size={13} />
                      {screenshot ? 'Screenshot aufgenommen' : 'Screenshot hinzufügen (optional)'}
                    </button>
                  </div>

                  <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                    Wir hängen automatisch deine Seiten-URL, Browser und die letzten 80 Konsolen-Zeilen an — damit wir den Fehler sofort nachvollziehen können.
                    Alternativ direkt an{' '}
                    <a href="mailto:start@aiporate.com" className="underline text-[#6B8A00] dark:text-[#BFFF00] font-bold">start@aiporate.com</a>.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setOpen(false)}
                      disabled={sending}
                      className="px-4 py-2 rounded-xl text-xs font-black text-muted-foreground hover:text-foreground"
                      data-testid="support-cancel"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={send}
                      disabled={!message.trim() || sending}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#1A1A2E] text-[#BFFF00] text-xs font-black disabled:opacity-40 disabled:cursor-not-allowed"
                      data-testid="support-send"
                    >
                      {sending ? <><Loader2 size={13} className="animate-spin" /> Wird gesendet …</> : <><Send size={13} /> Senden</>}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingSupportButton;
