import { useEffect, useState } from 'react';
import { Mail, Loader2, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

const RESEND_COOLDOWN = 60;

const requestErrorText = (err, de) => {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;
  if (status === 429) return de ? 'Zu viele Anfragen. Bitte warte 1 Stunde.' : 'Too many requests. Please wait 1 hour.';
  if (status === 422) return de ? 'Bitte gib eine gültige E-Mail-Adresse ein.' : 'Please enter a valid email address.';
  if (typeof detail === 'string' && detail) return detail;
  return de ? 'Konnte den Link gerade nicht senden. Bitte versuche es erneut.' : 'Could not send the link. Please try again.';
};

const MagicLinkSent = ({ email, de, cooldown, resending, onResend, onChangeEmail, error }) => (
  <div data-testid="magic-link-sent" className="rounded-2xl border border-[#BFFF00]/25 bg-[#BFFF00]/[0.04] p-6 text-center" role="status" aria-live="polite">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#BFFF00]/15">
      <CheckCircle2 size={22} className="text-[#BFFF00]" strokeWidth={2.2} />
    </div>
    <h3 className="text-base font-semibold text-white">{de ? 'Link verschickt' : 'Link sent'}</h3>
    <p className="mt-2 text-[13px] leading-relaxed text-white/55">
      {de
        ? <>Falls <span className="font-medium text-white/80">{email}</span> bei uns existiert, ist eine E-Mail mit deinem 1-Klick-Login unterwegs.<br/>Der Link ist 15 Minuten gültig. Nichts angekommen? Schau auch im Spam-Ordner nach.</>
        : <>If <span className="font-medium text-white/80">{email}</span> exists in our system, an email with your 1-click login is on the way.<br/>The link is valid for 15 minutes. Nothing yet? Check your spam folder.</>}
    </p>
    {error && <p className="mt-3 text-[12px] text-red-400/90" role="alert" data-testid="magic-link-error">{error}</p>}
    <div className="mt-5 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onResend}
        disabled={cooldown > 0 || resending}
        aria-disabled={cooldown > 0 || resending}
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-white/[0.1] text-[12px] font-semibold text-white/80 hover:border-[#BFFF00]/40 hover:text-[#BFFF00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        data-testid="magic-link-resend"
      >
        {resending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        {cooldown > 0
          ? (de ? `Erneut senden in ${cooldown} s` : `Resend in ${cooldown}s`)
          : (de ? 'Link erneut senden' : 'Resend link')}
      </button>
      <button
        type="button"
        onClick={onChangeEmail}
        className="text-[11px] font-semibold uppercase tracking-wider text-white/40 hover:text-[#BFFF00] transition-colors"
        data-testid="magic-link-change-email"
      >
        {de ? 'Andere E-Mail verwenden' : 'Use a different email'}
      </button>
    </div>
  </div>
);

export const MagicLinkForm = ({ de = true, initialEmail = '' }) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/magic-link/request', { email: email.trim() });
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(requestErrorText(err, de));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); send(); };

  if (sent) {
    return (
      <MagicLinkSent
        email={email} de={de} cooldown={cooldown} resending={loading} error={error}
        onResend={send}
        onChangeEmail={() => { setSent(false); setEmail(''); setError(''); setCooldown(0); }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="magic-link-form">
      <label htmlFor="magic-email" className="sr-only">{de ? 'E-Mail-Adresse' : 'Email address'}</label>
      <div className="relative">
        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          id="magic-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? 'magic-link-error' : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ''))}
          placeholder={de ? 'name@deinefirma.de' : 'name@yourcompany.com'}
          className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-[#BFFF00]/40 focus:bg-white/[0.05] focus:outline-none text-white placeholder:text-white/25 text-sm transition-all"
          data-testid="magic-link-email-input"
        />
      </div>

      <p id="magic-link-error" role="alert" aria-live="assertive" className={`text-[12px] text-red-400/90 px-1 ${error ? '' : 'sr-only'}`} data-testid="magic-link-error">{error}</p>

      <button
        type="submit"
        disabled={loading || !email}
        aria-busy={loading}
        className="w-full h-12 rounded-xl bg-[#BFFF00] hover:bg-[#BFFF00]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#BFFF00]/20"
        data-testid="magic-link-submit"
      >
        {loading
          ? <Loader2 size={16} className="animate-spin" />
          : <>{de ? '1-Klick-Link senden' : 'Send 1-click link'} <ArrowRight size={15} /></>}
      </button>

      <p className="pt-1 text-center text-[11px] text-white/30 leading-relaxed">
        {de
          ? 'Du bekommst eine E-Mail mit einem sicheren Login-Link. Kein Passwort nötig.'
          : 'You will receive an email with a secure login link. No password required.'}
      </p>
    </form>
  );
};
