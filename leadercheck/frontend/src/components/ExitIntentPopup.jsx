/**
 * ExitIntentPopup — fires once per session when user's mouse leaves viewport top
 * (typical "user about to close tab" signal). Pushes Sprint-CTA with 24h reserve.
 *
 * Trigger logic:
 *   1. Listens for `mouseout` with `clientY < 0` (mouse exits top of viewport)
 *   2. Min 8s on page before firing (avoids immediate-bounce false positives)
 *   3. Once-per-session via sessionStorage key
 *   4. ESC or backdrop click closes; localStorage tracks "dismissed" for 24h
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, Clock, Shield } from "lucide-react";

const SESSION_KEY = "leaderos_exit_popup_shown";
const DISMISS_KEY = "leaderos_exit_popup_dismissed_until";

export default function ExitIntentPopup() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const dismissUntil = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
    if (dismissUntil && Date.now() < dismissUntil) return;

    const mountTime = Date.now();
    const onMouseOut = (e) => {
      if (Date.now() - mountTime < 8000) return;
      if (e.clientY <= 0 && !e.relatedTarget && !e.toElement) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setShow(true);
      }
    };
    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
  }, []);

  useEffect(() => {
    if (!show) return;
    const onEsc = (e) => { if (e.key === "Escape") dismiss(); };
    document.addEventListener("keydown", onEsc);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 1 ? s - 1 : 60));
    }, 1000);
    return () => { document.removeEventListener("keydown", onEsc); clearInterval(interval); };
  }, [show]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setShow(false);
  };

  if (!show) return null;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div
      data-testid="exit-intent-popup"
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 backdrop-blur-md bg-black/60 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="relative max-w-md w-full bg-[#0a0a0a] border border-[#C8FF00]/30 rounded-2xl p-7 shadow-2xl shadow-[#C8FF00]/10">
        <button
          data-testid="exit-popup-close"
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 border border-[#C8FF00]/20 bg-[#C8FF00]/[0.04]">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#C8FF00] opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8FF00]" />
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#C8FF00] font-semibold uppercase">
            ▸ Bevor du gehst · 1 Angebot
          </span>
        </div>

        <h3 className="font-manrope font-extrabold text-2xl text-white leading-tight mb-3">
          Bevor du gehst —<br />
          <span className="text-[#C8FF00]">starte dein Leadership.</span>
        </h3>

        <p className="font-inter text-sm text-slate-400 leading-relaxed mb-5">
          Du hast deinen Score. Jetzt der nächste Schritt: Teil der Leader-OS Bewegung werden. Volle Plattform · 11 Wlad-Frameworks · WLAD AI 24/7 · KI-Tools. <span className="text-white font-medium">14 Tage Geld-zurück</span> · ohne Diskussion.
        </p>

        <div className="flex items-center justify-center gap-3 mb-5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <Clock className="w-4 h-4 text-[#C8FF00]" />
          <span className="font-mono text-sm text-white">
            <span className="text-[#C8FF00] font-bold">{mm}:{ss}</span> · Angebot aktiv
          </span>
        </div>

        <div className="space-y-2 mb-6">
          {[
            "Sprint 997 EUR · 30 Tage + 12 Monate Plattform",
            "11 Wlad-Frameworks · WLAD AI · 91 Lektionen",
            "14 Tage Geld-zurück · ohne Diskussion",
          ].map((line) => (
            <div key={line} className="flex items-start gap-2">
              <span className="text-[#C8FF00] text-sm font-bold">▸</span>
              <span className="font-inter text-sm text-slate-300">{line}</span>
            </div>
          ))}
        </div>

        <button
          data-testid="exit-popup-cta"
          onClick={() => {
            sessionStorage.setItem(SESSION_KEY, "1");
            navigate("/close");
          }}
          className="w-full px-6 py-4 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold hover:shadow-xl hover:shadow-[#C8FF00]/20 transition-all inline-flex items-center justify-center gap-2 mb-3"
        >
          Sprint sichern · 997 EUR
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          data-testid="exit-popup-later"
          onClick={dismiss}
          className="w-full text-center font-inter text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Nein, später entscheiden
        </button>

        <p className="font-inter text-[10px] text-slate-600 text-center mt-4 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" />
          SSL · Stripe · 14 Tage Geld-zurück
        </p>
      </div>
    </div>
  );
}
