import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Bot, Sparkles } from "lucide-react";
import { LEADER_OS_URL } from "../config";

const API = process.env.REACT_APP_BACKEND_URL;
const REDIRECT_SECONDS = 5;

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("loading");
  const [paymentData, setPaymentData] = useState(null);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const [redirectPaused, setRedirectPaused] = useState(false);
  // Staging only: one-time LeaderOS login link (backend returns null elsewhere).
  const [loginUrl, setLoginUrl] = useState(null);

  useEffect(() => {
    if (status !== "success" || !sessionId) return;
    fetch(`${API}/api/payments/leaderos-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.url) setLoginUrl(d.url); })
      .catch(() => { /* plain link stays */ });
  }, [status, sessionId]);

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
    let attempts = 0;
    const maxAttempts = 8;

    const poll = async () => {
      try {
        const res = await fetch(`${API}/api/payments/status/${sessionId}`);
        const data = await res.json();
        setPaymentData(data);

        if (data.payment_status === "paid") {
          setStatus("success");
          return;
        }
        if (data.status === "expired") {
          setStatus("expired");
          return;
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2500);
        } else {
          setStatus(data.payment_status === "paid" ? "success" : "pending");
        }
      } catch {
        attempts++;
        if (attempts < maxAttempts) setTimeout(poll, 2500);
        else setStatus("error");
      }
    };
    poll();
  }, [sessionId]);

  // 5s countdown auto-redirect to leaderos.de after successful payment
  useEffect(() => {
    if (status !== "success" || redirectPaused) return;
    if (countdown <= 0) {
      window.location.href = loginUrl || LEADER_OS_URL;
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, redirectPaused, loginUrl]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4" data-testid="payment-success-page">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-[#C8FF00]/[0.03] rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {status === "loading" && (
          <div data-testid="payment-loading">
            <div className="w-20 h-20 rounded-2xl bg-[#C8FF00]/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-[#C8FF00] animate-spin" />
            </div>
            <h1 className="font-manrope font-extrabold text-2xl text-white mb-3">Zahlung wird verarbeitet...</h1>
            <p className="font-inter text-sm text-slate-500">Bitte warte einen Moment. Schließe dieses Fenster nicht.</p>
          </div>
        )}

        {status === "success" && (
          <div data-testid="payment-success">
            <div className="w-20 h-20 rounded-2xl bg-[#C8FF00]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-[#C8FF00]" />
            </div>
            <div className="badge-lime px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4" />
              Willkommen bei Leader OS
            </div>
            <h1 className="font-manrope font-extrabold text-3xl text-white mb-3">
              Zahlung erfolgreich!
            </h1>
            <p className="font-inter text-base text-slate-400 mb-2">
              Dein {paymentData?.metadata?.plan === "leader_os_plus" ? "Plus-Plus" :
                    paymentData?.metadata?.plan === "leader_os_enterprise" ? "Enterprise" :
                    paymentData?.metadata?.plan === "fasttrack" ? "Fast Track" :
                    "Sprint"}-Zugang ist jetzt aktiv.
            </p>
            <p className="font-inter text-sm text-[#C8FF00]/60 mb-6">
              14 Tage kostenlos testen · Danach automatische Verlängerung
            </p>

            {/* Auto-Redirect Countdown */}
            <div
              data-testid="redirect-countdown"
              className="glass-card-subtle px-5 py-4 mb-6 inline-flex flex-col sm:flex-row items-center gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" stroke="#ffffff10" strokeWidth="3" fill="none" />
                    <circle
                      cx="20" cy="20" r="16" stroke="#C8FF00" strokeWidth="3" fill="none"
                      strokeDasharray={`${(countdown / REDIRECT_SECONDS) * 100.5} 100.5`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-manrope font-bold text-sm text-[#C8FF00]">
                    {countdown}
                  </span>
                </div>
                <p className="font-inter text-sm text-slate-300 text-left">
                  Du wirst in <span className="text-[#C8FF00] font-medium">{countdown}s</span> zu{" "}
                  <span className="text-white">leaderos.de</span> weitergeleitet…
                </p>
              </div>
              {!redirectPaused && (
                <button
                  data-testid="pause-redirect"
                  onClick={() => setRedirectPaused(true)}
                  className="font-inter text-xs text-slate-500 hover:text-white underline underline-offset-4 transition-colors"
                >
                  Abbrechen
                </button>
              )}
            </div>

            <div className="glass-card p-6 mb-8 text-left">
              <h3 className="font-manrope font-bold text-white mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#C8FF00]" />
                Was passiert jetzt?
              </h3>
              <div className="space-y-3">
                {[
                  "Dein License Key wird in Kürze per E-Mail zugesendet",
                  "Du hast sofortigen Zugang zu allen Kursen & Agenten",
                  "Dein 30-Tage-Plan startet heute",
                  "Bei Fragen ist der WLAD AI 24/7 für dich da",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#C8FF00] shrink-0" />
                    <span className="font-inter text-sm text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                data-testid="go-to-leader-os"
                href={loginUrl || LEADER_OS_URL}
                className="btn-primary px-8 py-4 font-semibold inline-flex items-center gap-2"
              >
                Jetzt zu leaderos.de
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                data-testid="go-to-activate"
                onClick={() => navigate("/activate")}
                className="btn-secondary px-8 py-4 font-semibold inline-flex items-center gap-2"
              >
                Key aktivieren
              </button>
            </div>
          </div>
        )}

        {(status === "error" || status === "expired") && (
          <div data-testid="payment-error">
            <div className="w-20 h-20 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="font-manrope font-extrabold text-2xl text-white mb-3">
              {status === "expired" ? "Sitzung abgelaufen" : "Zahlung fehlgeschlagen"}
            </h1>
            <p className="font-inter text-sm text-slate-500 mb-6">
              {status === "expired"
                ? "Die Zahlungssitzung ist abgelaufen. Bitte versuche es erneut."
                : "Es gab ein Problem mit deiner Zahlung. Bitte versuche es erneut."}
            </p>
            <button
              onClick={() => navigate("/close")}
              className="btn-secondary px-8 py-4 font-semibold inline-flex items-center gap-2"
            >
              Zurück zur Übersicht
            </button>
          </div>
        )}

        {status === "pending" && (
          <div data-testid="payment-pending">
            <div className="w-20 h-20 rounded-2xl bg-[#C8FF00]/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-[#C8FF00]" />
            </div>
            <h1 className="font-manrope font-extrabold text-2xl text-white mb-3">Zahlung ausstehend</h1>
            <p className="font-inter text-sm text-slate-500 mb-6">
              Deine Zahlung wird noch verarbeitet. Du erhältst eine Bestätigung per E-Mail.
            </p>
            <button onClick={() => navigate("/roadmap")} className="btn-amber px-8 py-4 font-semibold inline-flex items-center gap-2">
              Weiter zum Fahrplan <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
