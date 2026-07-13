import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function MagicLinkVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [state, setState] = useState('verifying'); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const firedRef = useRef(false); // single-shot: token is single-use, StrictMode double-invoke must not consume it twice

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState('error');
      setErrorMsg('Kein Token im Link gefunden.');
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.post('/auth/magic-link/verify', { token });
        if (cancelled) return;
        login(res.data.user);
        setState('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 700);
      } catch (err) {
        if (cancelled) return;
        setState('error');
        setErrorMsg(err?.response?.data?.detail
          || 'Der Link ist ungültig oder bereits abgelaufen.');
      }
    })();
    return () => { cancelled = true; };
  }, [params, login, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 relative overflow-hidden"
      data-testid="magic-link-verify-page"
    >
      {/* Aurora background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#BFFF00]/[0.06] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-emerald-500/[0.04] blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-8 sm:p-10">
        <div className="mb-7 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#BFFF00] flex items-center justify-center">
            <Zap size={15} className="text-[#0A0A0A]" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              WLADBOT
            </div>
            <div className="text-[9px] text-[#BFFF00]/70 font-semibold tracking-[0.2em] uppercase">
              Magic Link
            </div>
          </div>
        </div>

        {state === 'verifying' && (
          <div className="text-center py-8" data-testid="magic-verify-loading">
            <Loader2 size={40} className="mx-auto mb-5 animate-spin text-[#BFFF00]" />
            <h1 className="text-xl font-semibold text-white">Login wird verifiziert…</h1>
            <p className="mt-2 text-sm text-white/40">Einen Moment, wir prüfen deinen Link.</p>
          </div>
        )}

        {state === 'success' && (
          <div className="text-center py-8" data-testid="magic-verify-success">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#BFFF00]/15">
              <CheckCircle2 size={28} className="text-[#BFFF00]" strokeWidth={2.2} />
            </div>
            <h1 className="text-xl font-semibold text-white">Eingeloggt</h1>
            <p className="mt-2 text-sm text-white/40">Wir leiten dich gleich weiter…</p>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center py-6" data-testid="magic-verify-error">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
              <AlertCircle size={28} className="text-red-400" strokeWidth={2.2} />
            </div>
            <h1 className="text-xl font-semibold text-white">Link ungültig</h1>
            <p className="mt-2 text-sm text-white/50 leading-relaxed">{errorMsg}</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center mt-6 h-11 px-6 rounded-xl bg-[#BFFF00] hover:bg-[#BFFF00]/90 text-[#0A0A0A] font-bold text-sm transition-all shadow-lg shadow-[#BFFF00]/20"
              data-testid="magic-verify-back-to-login"
            >
              Zurück zum Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
