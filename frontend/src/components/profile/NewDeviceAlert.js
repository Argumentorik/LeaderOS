import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Loader2, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { toast } from 'sonner';

const fmt = (iso) => {
  try { return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};

const where = (d, de) => [d.city, d.country_code].filter(Boolean).join(', ') || (de ? 'Standort unbekannt' : 'Unknown location');

export const NewDeviceAlert = ({ devices = [], de = true, onDone }) => {
  const [busy, setBusy] = useState('');
  const navigate = useNavigate();
  if (!devices.length) return null;

  const run = async (kind) => {
    setBusy(kind);
    try {
      if (kind === 'ack') {
        await api.post('/auth/security/acknowledge');
        toast.success(de ? 'Alles klar — Warnung ausgeblendet.' : 'Got it — alert dismissed.');
      } else {
        const res = await api.post('/auth/security/not-me');
        toast.success(de
          ? `${res.data.revoked} andere Sitzung${res.data.revoked === 1 ? '' : 'en'} beendet, alle Zugriffs-Tokens widerrufen. Bestätigung geht an ${res.data.email_sent_to}.`
          : `${res.data.revoked} other session(s) ended, all access tokens revoked. Confirmation sent to ${res.data.email_sent_to}.`);
        if (res.data.has_password) {
          toast(de ? 'Bitte jetzt dein Passwort ändern.' : 'Please change your password now.', { duration: 8000 });
          navigate('/profile?tab=account&focus=password');
        }
      }
      onDone?.();
    } catch (err) {
      logger.error('new-device action failed', err);
      toast.error(de ? 'Aktion fehlgeschlagen.' : 'Action failed.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-4 sm:p-5" data-testid="new-device-alert">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <ShieldAlert size={17} className="text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black" data-testid="new-device-alert-title">
            {de ? 'Neues Gerät hat sich angemeldet' : 'A new device signed in'}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {devices.map((d) => (
              <li key={d.fingerprint + d.at} className="text-[12px] text-muted-foreground flex flex-wrap items-center gap-x-2" data-testid="new-device-entry">
                <span className="font-semibold text-foreground">{[d.browser, d.os].filter(Boolean).join(' · ') || (de ? 'Unbekanntes Gerät' : 'Unknown device')}</span>
                <span className="inline-flex items-center gap-1"><MapPin size={10} /> {where(d, de)}</span>
                <span>· {fmt(d.at)}</span>
                {d.ip && <span className="font-mono text-[10px] opacity-70">{d.ip}</span>}
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-muted-foreground mt-3">
            {de ? 'Warst du das? Falls nicht, melden wir sofort alle anderen Geräte ab und widerrufen alle Zugriffs-Tokens.'
                : "Was that you? If not, we'll sign out all other devices and revoke every access token right away."}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" variant="outline" className="h-8 text-[11px]" disabled={!!busy} onClick={() => run('ack')} data-testid="new-device-ack-btn">
              {busy === 'ack' ? <Loader2 size={11} className="animate-spin mr-1.5" /> : null}{de ? 'Das war ich' : 'That was me'}
            </Button>
            <Button size="sm" className="h-8 text-[11px] bg-amber-500 hover:bg-amber-600 text-black font-bold" disabled={!!busy} onClick={() => run('not-me')} data-testid="new-device-not-me-btn">
              {busy === 'not-me' ? <Loader2 size={11} className="animate-spin mr-1.5" /> : null}{de ? 'Das war ich nicht' : "That wasn't me"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
