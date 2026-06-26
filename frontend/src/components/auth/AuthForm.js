import { Eye, EyeOff, ArrowRight, Loader2, Phone, AtSign } from 'lucide-react';

const inputClass = "h-12 w-full rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-white/20 px-4 text-sm transition-all outline-none focus:border-[#BFFF00]/50 focus:ring-1 focus:ring-[#BFFF00]/20 focus:bg-white/[0.05] autofill:bg-white/[0.05]";

export const AuthForm = ({ mode, form, setForm, showPw, setShowPw, loading, onSubmit, de }) => {
  const isRegister = mode === 'register';
  const submitLabel = isRegister ? (de ? 'Account erstellen' : 'Create Account') : (de ? 'Anmelden' : 'Sign In');
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
            minLength={6}
            placeholder={de ? 'Min. 6 Zeichen' : 'Min. 6 characters'}
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
      </div>

      <button
        data-testid={isRegister ? 'register-submit-btn' : 'login-submit-btn'}
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="h-12 w-full rounded-xl bg-[#BFFF00] text-[#0A0A0A] font-bold text-sm hover:bg-[#D4FF4D] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed glow-lime btn-shine"
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> {loadingLabel}</>
          : <>{submitLabel} <ArrowRight size={16} /></>}
      </button>
    </form>
  );
};
