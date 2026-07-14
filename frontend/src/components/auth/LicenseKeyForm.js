import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Ticket, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { parseAuthError } from '../../lib/authErrors';
import { postLoginRoute } from '../../lib/postLoginRoute';

// Format raw input as XXXX-XXXX-XXXX-XXXX while typing
const formatKey = (raw) => {
  const clean = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  return clean.match(/.{1,4}/g)?.join('-') || '';
};

const inputClass = "w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-[#BFFF00]/50 focus:outline-none text-white text-sm placeholder:text-white/25 transition-colors";

export const LicenseKeyForm = ({ de = true }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ key: '', name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const keyComplete = form.key.replace(/-/g, '').length === 16;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!keyComplete) {
      setError(de ? 'Der Lizenz-Key hat 16 Zeichen (XXXX-XXXX-XXXX-XXXX).' : 'The license key has 16 characters (XXXX-XXXX-XXXX-XXXX).');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/license/activate', {
        license_key: form.key,
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
      });
      login(res.data.user, 'license');
      const pkg = res.data.activated?.package_name || 'Leader-OS';
      toast.success(de
        ? `${pkg} aktiviert! Willkommen an Bord 🚀`
        : `${pkg} activated! Welcome aboard 🚀`);
      navigate(postLoginRoute(res.data.user));
    } catch (err) {
      setError(parseAuthError(err, de ? 'Aktivierung fehlgeschlagen' : 'Activation failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="license-key-form">
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
          {de ? 'Dein Lizenz-Key' : 'Your license key'}
        </label>
        <div className="relative">
          <Ticket size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFFF00]/60" />
          <input
            value={form.key}
            onChange={(e) => setForm(f => ({ ...f, key: formatKey(e.target.value) }))}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            autoComplete="off"
            spellCheck={false}
            className={`${inputClass} pl-11 font-mono tracking-[0.15em] uppercase ${keyComplete ? 'border-[#BFFF00]/40' : ''}`}
            data-testid="license-key-input"
            required
          />
          {keyComplete && (
            <Sparkles size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BFFF00]" />
          )}
        </div>
        <p className="text-[10px] text-white/30 mt-1.5">
          {de ? 'Du hast den Key von unserem Sales-Team oder per E-Mail erhalten.' : 'You received the key from our sales team or via email.'}
        </p>
      </div>

      <input
        value={form.name}
        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder={de ? 'Dein Name (bei neuem Konto)' : 'Your name (for new accounts)'}
        className={inputClass}
        data-testid="license-name-input"
        autoComplete="name"
      />
      <input
        type="email"
        value={form.email}
        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
        placeholder="E-Mail"
        className={inputClass}
        data-testid="license-email-input"
        autoComplete="email"
        required
      />
      <input
        type="password"
        value={form.password}
        onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
        placeholder={de ? 'Passwort (min. 8 Zeichen, Buchstaben + Zahlen)' : 'Password (min. 8 chars, letters + numbers)'}
        className={inputClass}
        data-testid="license-password-input"
        autoComplete="new-password"
        required
      />

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12.5px] font-medium" data-testid="license-error">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl bg-[#BFFF00] hover:bg-[#d4ff4d] text-[#0A0A0A] font-black text-sm tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        data-testid="license-activate-btn"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={15} />}
        {de ? 'Key einlösen & starten' : 'Redeem key & start'}
      </button>
      <p className="text-[10px] text-white/30 text-center">
        {de
          ? 'Bestehendes Konto? Nutze deine E-Mail + dein bisheriges Passwort — dein Paket wird direkt freigeschaltet.'
          : 'Existing account? Use your email + current password — your package unlocks instantly.'}
      </p>
    </form>
  );
};
