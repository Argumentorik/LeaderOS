import { useState } from "react";
import { Key, ArrowRight, Check, AlertCircle, Loader2, ExternalLink } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ActivateKey() {
  const [key, setKey] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const formatKey = (val) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const parts = [];
    if (clean.length > 0) parts.push(clean.slice(0, 4));
    if (clean.length > 4) parts.push(clean.slice(4, 8));
    if (clean.length > 8) parts.push(clean.slice(8, 12));
    if (clean.length > 12) parts.push(clean.slice(12, 16));
    return parts.join("-");
  };

  const handleKeyInput = (e) => {
    const raw = e.target.value.replace(/-/g, "");
    if (raw.length <= 16) {
      setKey(formatKey(raw));
    }
  };

  const handleActivate = async () => {
    if (key.replace(/-/g, "").length < 16) {
      setError("Bitte gib einen vollständigen Key ein (WLAD-XXXX-XXXX-XXXX).");
      return;
    }
    setStatus("loading");
    setError("");

    try {
      const res = await fetch(`${API}/api/license/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: key, email: email || null }),
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { detail: text || "Unerwarteter Serverfehler." };
      }

      if (!res.ok) {
        setStatus("error");
        setError(data.detail || "Aktivierung fehlgeschlagen.");
        return;
      }

      setStatus("success");
      setResult(data);

      // Redirect to leaderos.de after 4 seconds
      setTimeout(() => {
        window.location.href = data.redirect_url || "https://leaderos.de";
      }, 4000);
    } catch (err) {
      setStatus("error");
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4" data-testid="activate-page">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#C8FF00]/[0.03] rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {status === "success" && result ? (
          <div className="text-center" data-testid="activation-success">
            <div className="w-20 h-20 rounded-2xl bg-[#C8FF00]/10 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-[#C8FF00]" />
            </div>
            <h1 className="font-manrope font-extrabold text-3xl text-white mb-3">
              Key aktiviert!
            </h1>
            <p className="font-inter text-base text-slate-400 mb-2">
              {result.plan_name}
            </p>
            <p className="font-inter text-sm text-[#C8FF00]/60 mb-8">
              Gültig bis {new Date(result.expires_at).toLocaleDateString("de-DE")}
              {result.includes_calls && " · inkl. 1:1 Calls"}
            </p>

            <div className="glass-card p-6 mb-8 text-left">
              <p className="font-inter text-sm text-slate-400 leading-relaxed mb-4">
                Dein Vollzugang ist jetzt aktiv. Du wirst in wenigen Sekunden automatisch zu <strong className="text-[#C8FF00]">leaderos.de</strong> weitergeleitet.
              </p>
              <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full bg-[#C8FF00] rounded-full animate-[expandWidth_4s_ease-out_forwards]" />
              </div>
            </div>

            <a
              href="https://leaderos.de"
              data-testid="redirect-link"
              className="btn-primary px-8 py-4 text-base font-semibold inline-flex items-center gap-3"
            >
              Jetzt zu leaderos.de
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-[#C8FF00]/[0.08] border border-[#C8FF00]/15 flex items-center justify-center mx-auto mb-6">
                <Key className="w-8 h-8 text-[#C8FF00]" />
              </div>
              <h1 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-3" data-testid="activate-title">
                License Key aktivieren
              </h1>
              <p className="font-inter text-sm text-slate-500">
                Gib deinen Key ein, um Vollzugang zu Leader OS + leaderos.de freizuschalten.
              </p>
            </div>

            {/* Key Input */}
            <div className="glass-card p-6 mb-6">
              <div className="mb-5">
                <label className="font-inter text-sm text-slate-400 mb-2 block">License Key</label>
                <input
                  data-testid="key-input"
                  type="text"
                  value={key}
                  onChange={handleKeyInput}
                  placeholder="WLAD-XXXX-XXXX-XXXX"
                  className="w-full h-14 px-5 rounded-xl bg-white/[0.03] border border-white/[0.08] font-manrope font-bold text-xl text-white text-center tracking-[0.15em] placeholder:text-slate-600 placeholder:font-normal placeholder:text-base placeholder:tracking-normal focus:border-[#C8FF00]/30 focus:outline-none transition-colors"
                />
              </div>

              <div className="mb-5">
                <label className="font-inter text-sm text-slate-400 mb-2 block">E-Mail (optional)</label>
                <input
                  data-testid="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.com"
                  className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] font-inter text-sm text-white placeholder:text-slate-600 focus:border-[#C8FF00]/30 focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/[0.06] border border-red-500/15 mb-5" data-testid="activation-error">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="font-inter text-sm text-red-400">{error}</span>
                </div>
              )}

              <button
                data-testid="activate-btn"
                onClick={handleActivate}
                disabled={status === "loading" || key.replace(/-/g, "").length < 16}
                className="w-full py-4 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold text-base flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-[#C8FF00]/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === "loading" ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Wird aktiviert...</>
                ) : (
                  <>Key aktivieren <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>

            {/* Info */}
            <div className="text-center">
              <p className="font-inter text-xs text-slate-600 leading-relaxed">
                Du hast deinen Key per E-Mail erhalten nach dem Kauf.<br />
                Bei Problemen: <a href="mailto:support@wladhub.com" className="text-[#C8FF00]/60 hover:text-[#C8FF00]">support@wladhub.com</a>
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes expandWidth {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
