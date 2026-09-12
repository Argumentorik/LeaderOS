import { Eye, EyeOff, ArrowRight, Loader2, Phone, AtSign, ShieldCheck, CheckCircle2 } from 'lucide-react';

const inputClass = "h-12 w-full rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-white/20 px-4 text-sm transition-all outline-none focus:border-[#BFFF00]/50 focus:ring-1 focus:ring-[#BFFF00]/20 focus:bg-white/[0.05] autofill:bg-white/[0.05]";

/**
 * Password-strength micro-indicator — only rendered in register mode.
 * Iter 92.43 (Mert · 100M-App): friction-reduction UX from the brief.
 * 4-step indicator (length, mixed-case, digit, symbol).
 */
// Pflicht-Regeln = Backend `validate_password_strength` (8 Zeichen, Buchstaben + Zahlen); Rest ist Bonus.
export const PASSWORD_RULES = [
  { id: 'length', required: true, test: (v) => v.length >= 8, de: 'Mindestens 8 Zeichen', en: 'At least 8 characters' },
  { id: 'letter', required: true, test: (v) => /[a-zA-ZäöüÄÖÜß]/.test(v), de: 'Mindestens ein Buchstabe', en: 'At least one letter' },
  { id: 'digit', required: true, test: (v) => /\d/.test(v), de: 'Mindestens eine Zahl', en: 'At least one number' },
  { id: 'case', required: false, test: (v) => /[A-Z]/.test(v) && /[a-z]/.test(v), de: 'Groß- und Kleinbuchstaben', en: 'Upper and lower case' },
  { id: 'symbol', required: false, test: (v) => /[^A-Za-z0-9äöüÄÖÜß]/.test(v), de: 'Ein Sonderzeichen', en: 'A special character' },
];
export const passwordMeetsRules = (v) => PASSWORD_RULES.filter((r) => r.required).every((r) => r.test(v || ''));

const PasswordStrength = ({ value, de }) => {
  const v = value || '';
  const passed = PASSWORD_RULES.filter((c) => c.test(v)).length;
  const requiredOk = passwordMeetsRules(v);
  const color = passed >= 4 ? '#BFFF00' : requiredOk ? '#A3E635' : passed >= 2 ? '#FBBF24' : '#9CA3AF';
  return (
    <div className="mt-2 flex flex-col gap-1.5" data-testid="password-strength" role="status" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {PASSWORD_RULES.map((r, i) => (
          <span key={r.id} className="h-1 flex-1 rounded-full transition-colors" style={{ background: i < passed ? color : 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
      <ul id="password-checklist" className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5" data-testid="password-checklist">
        {PASSWORD_RULES.map((c) => {
          const ok = c.test(v);
          return (
            <li key={c.id} data-testid={`password-rule-${c.id}`} data-ok={ok ? '1' : '0'}
                className={`flex items-center gap-1.5 text-[10.5px] font-semibold ${ok ? 'text-[#BFFF00]' : c.required ? 'text-white/45' : 'text-white/25'}`}>
              {ok ? <CheckCircle2 size={10} /> : <span className="w-2 h-2 rounded-full border border-white/25" />}
              {de ? c.de : c.en}{!c.required && <span className="font-normal opacity-60">{de ? ' · Bonus' : ' · bonus'}</span>}
            </li>
          );
        })}
      </ul>
      <p className="sr-only">{requiredOk ? (de ? 'Passwort erfüllt alle Regeln.' : 'Password meets all rules.') : (de ? 'Passwort erfüllt die Regeln noch nicht.' : 'Password does not meet the rules yet.')}</p>
    </div>
  );
};

export const AuthForm = ({ mode, form, setForm, showPw, setShowPw, loading, onSubmit, de }) => {
  const isRegister = mode === 'register';
  // Iter 92.43 (Mert · 100M-App): conversion-optimized CTA copy.
  // "Start kostenlos" / "Start free" trumps "Account erstellen" / "Sign up"
  // by 15–25% in SaaS A/B tests (Linear, Vercel, Notion pattern).
  const submitLabel = isRegister
    ? (de ? 'Kostenlos starten' : 'Start free')
    : (de ? 'Anmelden' : 'Sign In');
  const loadingLabel = isRegister ? (de ? 'Erstelle Account…' : 'Creating account…') : (de ? 'Melde an…' : 'Signing in…');

  // Iter 92.24 (Mert): on LOGIN, single field accepts EITHER email OR phone.
  // Hint label flips based on what the user is typing (Apple/Revolut-style).
  const loginVal = form.email || '';
  const looksLikePhone = /^[+\d]/.test(loginVal.trim()) && !loginVal.includes('@');
  const loginLabel = isRegister
    ? 'E-Mail'
    : looksLikePhone
      ? (de ? 'Telefonnummer' : 'Phone number')
      : (de ? 'E-Mail oder Telefon' : 'Email or phone');

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {isRegister && (
        <div>
          <label htmlFor="auth-name" className="block mb-2 text-sm font-medium text-white/70">
            {de ? 'Vollständiger Name' : 'Full Name'}
          </label>
          <input
            id="auth-name"
            data-testid="register-name-input"
            type="text"
            name="name"
            autoComplete="name"
            autoCapitalize="words"
            spellCheck={false}
            placeholder="Max Mustermann"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="auth-email" className="block mb-2 text-sm font-medium text-white/70 flex items-center gap-1.5">
          {!isRegister && (looksLikePhone
            ? <Phone size={13} className="text-[#BFFF00]" />
            : <AtSign size={13} className="text-[#BFFF00]" />)}
          {loginLabel}
        </label>
        <input
          id="auth-email"
          data-testid={isRegister ? 'register-email-input' : 'login-email-input'}
          type={isRegister ? 'email' : 'text'}
          name="email"
          inputMode={isRegister ? 'email' : (looksLikePhone ? 'tel' : 'email')}
          autoComplete={isRegister ? 'email' : 'username webauthn'}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={isRegister
            ? 'name@firma.de'
            : (de ? 'name@firma.de oder +49 170 1234567' : 'name@firma.de or +49 170 1234567')}
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
          className={inputClass}
        />
        {!isRegister && (
          <p className="text-[10.5px] text-white/30 mt-1.5 leading-snug">
            {de
              ? 'Tipp: Du kannst dich mit deiner E-Mail oder deiner registrierten Telefonnummer anmelden.'
              : 'Tip: You can sign in with your email or your registered phone number.'}
          </p>
        )}
      </div>

      {isRegister && (
        <div>
          <label htmlFor="auth-phone" className="block mb-2 text-sm font-medium text-white/70 flex items-center gap-1.5">
            <Phone size={13} className="text-[#BFFF00]" /> {de ? 'Telefonnummer' : 'Phone number'}
            <span className="text-[10px] font-normal text-[#BFFF00]/70 ml-1">{de ? '(erforderlich)' : '(required)'}</span>
          </label>
          <input
            id="auth-phone"
            data-testid="register-phone-input"
            type="tel"
            name="phone"
            inputMode="tel"
            autoComplete="tel"
            spellCheck={false}
            placeholder="+49 170 1234567"
            value={form.phone || ''}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            required
            className={inputClass}
          />
          <p className="text-[10.5px] text-white/35 mt-1.5 leading-snug">
            {de
              ? 'Pflichtfeld. Login per Telefonnummer möglich + Bestätigung deiner 1:1 Coaching-Termine (Cal.com).'
              : 'Required. Used for phone-login and Cal.com coaching confirmations.'}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="auth-password" className="block mb-2 text-sm font-medium text-white/70">
          {de ? 'Passwort' : 'Password'}
        </label>
        <div className="relative">
          <input
            id="auth-password"
            data-testid={isRegister ? 'register-password-input' : 'login-password-input'}
            type={showPw ? 'text' : 'password'}
            name="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            minLength={isRegister ? 8 : undefined}
            aria-describedby={isRegister ? 'password-checklist' : undefined}
            placeholder={isRegister ? (de ? 'Min. 8 Zeichen, Buchstaben + Zahl' : 'Min. 8 chars, letters + number') : (de ? 'Dein Passwort' : 'Your password')}
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            aria-label={showPw ? (de ? 'Passwort verbergen' : 'Hide password') : (de ? 'Passwort anzeigen' : 'Show password')}
            tabIndex={-1}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors p-1"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {/* Iter 92.43: password-strength indicator only on register */}
        {isRegister && <PasswordStrength value={form.password} de={de} />}
      </div>

      {/* Iter 92.43 (Mert · 100M-App): premium primary CTA — taller (h-14),
          stronger glow, subtle hover-scale, animated arrow on hover. */}
      <button
        data-testid={isRegister ? 'register-submit-btn' : 'login-submit-btn'}
        type="submit"
        disabled={loading || (isRegister && !passwordMeetsRules(form.password))}
        aria-busy={loading}
        className="group h-14 w-full rounded-2xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-black text-[15px] tracking-tight shadow-[0_8px_30px_-8px_rgba(191,255,0,0.5)] hover:shadow-[0_12px_40px_-8px_rgba(191,255,0,0.7)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading
          ? <><Loader2 size={17} className="animate-spin" /> {loadingLabel}</>
          : <>
              <span>{submitLabel}</span>
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </>}
      </button>

      {/* Iter 92.43: trust microcopy directly under CTA — 100M-App pattern.
          One line, three power-trust points. */}
      <p
        className="text-[10.5px] text-white/40 text-center font-semibold tracking-wide flex items-center justify-center gap-1.5"
        data-testid="trust-microcopy"
      >
        <ShieldCheck size={11} className="text-[#BFFF00]/60" />
        {isRegister
          ? (de
              ? 'Keine Kreditkarte · 3 Sessions kostenlos · Jederzeit kündbar'
              : 'No credit card · 3 sessions free · Cancel anytime')
          : (de
              ? 'SOC-2-ready · DSGVO-konform · 256-bit verschlüsselt'
              : 'SOC-2-ready · GDPR-compliant · 256-bit encrypted')}
      </p>
    </form>
  );
};
