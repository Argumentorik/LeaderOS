/**
 * EmailUnsubscribePage · One-click unsubscribe landing page.
 *
 * Hit when a user clicks the "Abbestellen" link in any lifecycle drip email.
 * The token is HMAC-signed by the backend so we can show the user's email
 * and category WITHOUT them logging in · frictionless GDPR-compliant opt-out.
 *
 * Flow:
 *   1. Component mounts → GET /api/unsubscribe/info?token=...
 *   2. Render: "Wir nehmen <email> von der <category>-Liste"
 *   3. User clicks "Bestätigen" → POST /api/unsubscribe/confirm
 *   4. Success state + secondary "Doch dabei bleiben"-Resubscribe button
 *
 * No /login redirect, no friction. The whole page is intentionally calm,
 * brand-aligned, and lets the user toggle back ON if they unsubscribed
 * by accident.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, MailX, ArrowLeft, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import logger from '../lib/logger';
import { WladMark } from '../components/brand/WladMark';

const OUTFIT = { fontFamily: 'Outfit, Inter, sans-serif' };

export default function EmailUnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState({ phase: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ phase: 'error', message: 'Link ungültig · kein Token gefunden.' });
      return;
    }
    api.get(`/unsubscribe/info?token=${encodeURIComponent(token)}`)
      .then((r) => setState({ phase: 'confirm', info: r.data }))
      .catch((e) => setState({
        phase: 'error',
        message: e?.response?.data?.detail || 'Dieser Abbestell-Link ist abgelaufen oder ungültig.',
      }));
  }, [token]);

  const confirm = async () => {
    setState((s) => ({ ...s, phase: 'submitting' }));
    try {
      const r = await api.post('/unsubscribe/confirm', { token });
      setState({ phase: 'success', info: r.data });
    } catch (e) {
      logger.error('Unsubscribe confirm failed', e);
      setState({ phase: 'error', message: 'Abmeldung fehlgeschlagen. Bitte erneut versuchen.' });
    }
  };

  const resubscribe = async () => {
    setState((s) => ({ ...s, phase: 'submitting' }));
    try {
      const r = await api.post('/unsubscribe/resubscribe', { token });
      setState({ phase: 'resubscribed', info: r.data });
    } catch (e) {
      logger.error('Resubscribe failed', e);
      setState({ phase: 'error', message: 'Re-Anmeldung fehlgeschlagen.' });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16 bg-[#0A0A0A] text-white relative overflow-hidden"
      data-testid="email-unsubscribe-page"
    >
      {/* Aurora glow */}
      <div aria-hidden className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] rounded-full bg-[#BFFF00]/[0.05] blur-[160px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-sky-500/[0.04] blur-[140px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-7">
          <WladMark size={56} animated />
        </div>

        {state.phase === 'loading' && (
          <Centered>
            <Loader2 className="w-8 h-8 animate-spin text-[#BFFF00] mb-4" />
            <p className="text-white/60 text-[13px]">Link wird überprüft…</p>
          </Centered>
        )}

        {state.phase === 'error' && (
          <Centered>
            <BadgePill icon={AlertTriangle} text="Link ungültig" color="rose" />
            <h1 className="text-[28px] font-black tracking-tight mb-2.5 mt-4" style={OUTFIT}>
              Hmm, das hat nicht geklappt.
            </h1>
            <p className="text-white/60 text-[14px] leading-relaxed mb-6">
              {state.message}
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-[#BFFF00] hover:text-[#D4FF4D] text-[13px] font-bold"
              data-testid="unsubscribe-back-home"
            >
              <ArrowLeft size={13} /> Zurück zum Dashboard
            </Link>
          </Centered>
        )}

        {state.phase === 'confirm' && (
          <Centered>
            <BadgePill icon={MailX} text="Email abbestellen" color="amber" />

            <h1 className="text-[28px] font-black tracking-tight mb-2.5 mt-4 leading-[1.1]" style={OUTFIT}>
              Schade, dass du gehst.
            </h1>
            <p className="text-white/65 text-[14px] leading-relaxed mb-7 max-w-sm mx-auto">
              Wir nehmen <span className="text-white font-bold">{state.info.email}</span> von der{' '}
              <span className="text-[#BFFF00] font-bold">{state.info.category_label}</span> ab.
            </p>

            {state.info.already_unsubscribed ? (
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5 mb-5">
                <p className="text-white/70 text-[13px]">
                  Du bist bereits aus dieser Liste raus.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={confirm}
                disabled={state.phase === 'submitting'}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] disabled:opacity-60 text-[#0A0A0A] font-bold text-[13px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_24px_-8px_rgba(191,255,0,0.55)]"
                data-testid="unsubscribe-confirm-btn"
              >
                <MailX size={14} /> Ja, abbestellen
              </button>
            )}

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 mt-5 text-white/55 hover:text-white text-[12px]"
              data-testid="unsubscribe-stay"
            >
              <ArrowLeft size={11} /> Doch dabei bleiben
            </Link>
          </Centered>
        )}

        {state.phase === 'submitting' && (
          <Centered>
            <Loader2 className="w-8 h-8 animate-spin text-[#BFFF00] mb-4" />
            <p className="text-white/60 text-[13px]">Wird gespeichert…</p>
          </Centered>
        )}

        {state.phase === 'success' && (
          <Centered>
            <BadgePill icon={CheckCircle2} text="Erledigt" color="emerald" />
            <h1 className="text-[28px] font-black tracking-tight mb-2.5 mt-4" style={OUTFIT}>
              Du bist raus.
            </h1>
            <p className="text-white/65 text-[14px] leading-relaxed mb-6 max-w-sm mx-auto">
              Wir senden dir keine{' '}
              <span className="text-white font-bold">{state.info.category_label}</span>-Emails mehr.
              Alles andere bleibt wie gewohnt.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={resubscribe}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 font-semibold text-[12.5px]"
                data-testid="unsubscribe-undo-btn"
              >
                <RotateCcw size={12} /> War ein Versehen · wieder anmelden
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 text-white/55 hover:text-white text-[12px] py-2"
                data-testid="unsubscribe-go-home"
              >
                <ArrowLeft size={11} /> Zurück zum Dashboard
              </Link>
            </div>
          </Centered>
        )}

        {state.phase === 'resubscribed' && (
          <Centered>
            <BadgePill icon={CheckCircle2} text="Wieder dabei" color="emerald" />
            <h1 className="text-[28px] font-black tracking-tight mb-2.5 mt-4" style={OUTFIT}>
              Schön, dass du bleibst.
            </h1>
            <p className="text-white/65 text-[14px] leading-relaxed mb-6">
              Du bekommst die <span className="text-[#BFFF00] font-bold">{state.info.category_label}</span>{' '}
              ab sofort wieder.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-bold text-[12.5px]"
            >
              Zurück zum Dashboard <ArrowLeft size={12} className="rotate-180" />
            </Link>
          </Centered>
        )}

        <p className="mt-10 text-center text-[10px] text-white/25 font-semibold tracking-wider">
          Leader · OS · DSGVO-konformer One-Click-Opt-out
        </p>
      </div>
    </div>
  );
}

const Centered = ({ children }) => (
  <div className="text-center flex flex-col items-center">{children}</div>
);

const BadgePill = ({ icon: Icon, text, color }) => {
  const colors = {
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  };
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${colors[color]}`}>
      <Icon size={11} />
      <span className="text-[10px] tracking-[0.2em] uppercase font-black">{text}</span>
    </div>
  );
};
