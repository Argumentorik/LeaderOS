import { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  Shield, ShieldAlert, ShieldCheck, Loader2, MapPin, Monitor,
  Smartphone, Globe, KeyRound, LogOut, Clock, Lock, RefreshCw,
} from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { toast } from 'sonner';
import { NewDeviceAlert } from './NewDeviceAlert';

const fmtDate = (iso) => {
  if (!iso) return '–';
  try {
    const d = new Date(iso);
    return d.toLocaleString('de-DE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
};

const methodLabel = (method, de) => {
  const m = {
    email:      de ? 'Passwort' : 'Password',
    google:     'Google',
    magic_link: 'Magic Link',
    refresh:    'Refresh',
    register:   de ? 'Registrierung' : 'Sign-up',
  };
  return m[method] || method || '·';
};

const locationLabel = (city, cc, de) => {
  if (city && cc) return `${city}, ${cc}`;
  if (city) return city;
  if (cc) return cc;
  return de ? 'Standort unbekannt' : 'Unknown location';
};

const DeviceIcon = ({ type, size = 14 }) => {
  if (type === 'mobile') return <Smartphone size={size} />;
  return <Monitor size={size} />;
};

export const ProfileSecurityTab = ({ de = true }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/security/overview');
      setData(res.data);
    } catch (err) {
      logger.error('security/overview failed', err);
      toast.error(de ? 'Konnte Sicherheits-Daten nicht laden.' : 'Could not load security data.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleRevokeOthers = async () => {
    if (!window.confirm(de
      ? 'Wirklich alle anderen Geräte abmelden? Du bleibst auf diesem Gerät eingeloggt.'
      : 'Sign out all other devices? You stay logged in here.'
    )) return;
    setRevoking(true);
    try {
      const res = await api.post('/auth/security/revoke-other-sessions');
      toast.success(de
        ? `${res.data.revoked} Sitzung${res.data.revoked === 1 ? '' : 'en'} beendet.`
        : `${res.data.revoked} session(s) signed out.`);
      await load();
    } catch (err) {
      logger.error('revoke sessions failed', err);
      toast.error(de ? 'Aktion fehlgeschlagen.' : 'Action failed.');
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return (
      <Card data-testid="security-tab-loading">
        <CardContent className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">{de ? 'Lade Sicherheits-Übersicht…' : 'Loading security overview…'}</span>
        </CardContent>
      </Card>
    );
  }

  const history = data?.login_history || [];
  const sessions = data?.sessions || [];
  const signup = data?.signup || {};
  const lastLogin = history[0];
  const currentSession = sessions.find(s => s.is_current);
  const otherSessionCount = sessions.filter(s => !s.is_current).length;

  return (
    <div className="space-y-4" data-testid="security-tab">
      <NewDeviceAlert devices={data?.new_devices || []} de={de} onDone={load} />
      {/* ─── Status Summary Card ─── */}
      <Card className="border-black/[0.04] dark:border-white/[0.06] bg-gradient-to-br from-[#BFFF00]/[0.04] to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center">
                <ShieldCheck size={18} className="text-[#BFFF00]" />
              </div>
              <div>
                <h3 className="text-sm font-black flex items-center gap-2">
                  {de ? 'Konto-Sicherheit' : 'Account security'}
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    {de ? 'Aktiv' : 'Active'}
                  </span>
                </h3>
                <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                  {de
                    ? 'Wir tracken jeden Login mit Browser, Standort und IP. Bei einem Login von einem neuen Gerät bekommst du eine E-Mail-Warnung.'
                    : 'Every login is tracked with browser, location, and IP. You get an email alert when signing in from a new device.'}
                </p>
              </div>
            </div>
            <Button
              size="sm" variant="outline"
              onClick={load}
              className="text-[11px] h-8"
              data-testid="security-refresh"
            >
              <RefreshCw size={11} className="mr-1.5" /> {de ? 'Aktualisieren' : 'Refresh'}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <Stat
              icon={<Clock size={12} />}
              label={de ? 'Letzter Login' : 'Last login'}
              value={lastLogin ? fmtDate(lastLogin.at) : '–'}
              testid="stat-last-login"
            />
            <Stat
              icon={<MapPin size={12} />}
              label={de ? 'Letzter Standort' : 'Last location'}
              value={lastLogin ? locationLabel(lastLogin.city, lastLogin.country_code, de) : '–'}
              testid="stat-last-location"
            />
            <Stat
              icon={<Globe size={12} />}
              label={de ? 'Aktive Sitzungen' : 'Active sessions'}
              value={String(sessions.length)}
              testid="stat-active-sessions"
            />
            <Stat
              icon={<KeyRound size={12} />}
              label={de ? 'Passwort geändert' : 'Password changed'}
              value={data?.password_changed_at ? fmtDate(data.password_changed_at) : (de ? 'Nie' : 'Never')}
              testid="stat-password-changed"
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Active Sessions ─── */}
      <Card className="border-black/[0.04] dark:border-white/[0.06]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black flex items-center gap-2">
                <Lock size={13} /> {de ? 'Aktive Sitzungen' : 'Active sessions'}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {de
                  ? `${sessions.length} Gerät${sessions.length === 1 ? '' : 'e'} eingeloggt`
                  : `${sessions.length} device${sessions.length === 1 ? '' : 's'} signed in`}
              </p>
            </div>
            {otherSessionCount > 0 && (
              <Button
                size="sm" variant="destructive"
                onClick={handleRevokeOthers}
                disabled={revoking}
                className="text-[11px] h-8"
                data-testid="security-revoke-others"
              >
                {revoking
                  ? <Loader2 size={11} className="mr-1.5 animate-spin" />
                  : <LogOut size={11} className="mr-1.5" />}
                {de ? `${otherSessionCount} andere abmelden` : `Sign out ${otherSessionCount} other`}
              </Button>
            )}
          </div>

          {sessions.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-4 text-center">
              {de ? 'Keine aktiven Sitzungen.' : 'No active sessions.'}
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id || `${s.created_at}-${s.ip}`}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                    s.is_current
                      ? 'border-[#BFFF00]/30 bg-[#BFFF00]/[0.04]'
                      : 'border-black/[0.06] dark:border-white/[0.06] bg-muted/30'
                  }`}
                  data-testid="security-session-row"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Globe size={14} className="text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold truncate">
                        {methodLabel(s.method, de)} · {s.ip}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {de ? 'Erstellt' : 'Created'}: {fmtDate(s.created_at)}
                      </p>
                    </div>
                  </div>
                  {s.is_current && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#BFFF00]/20 text-[#BFFF00] shrink-0">
                      {de ? 'Diese Sitzung' : 'This session'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Login History ─── */}
      <Card className="border-black/[0.04] dark:border-white/[0.06]">
        <CardContent className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-black flex items-center gap-2">
              <Shield size={13} /> {de ? 'Login-Verlauf' : 'Login history'}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {de
                ? `Letzte ${history.length} Logins · Wenn dir hier etwas verdächtig vorkommt, ändere sofort dein Passwort.`
                : `Last ${history.length} sign-ins · If anything looks suspicious, change your password immediately.`}
            </p>
          </div>

          {history.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-4 text-center">
              {de ? 'Noch keine Logins protokolliert.' : 'No logins recorded yet.'}
            </p>
          ) : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06] -mx-5">
              {history.map((h, i) => (
                <div
                  key={`${h.at || ''}-${h.fingerprint || ''}-${i}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                  data-testid="security-history-row"
                >
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    i === 0 ? 'bg-[#BFFF00]/15 text-[#BFFF00]' : 'bg-muted text-muted-foreground'
                  }`}>
                    <DeviceIcon type={h.device_type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold truncate">
                      {h.browser || 'Unknown'} · {h.os || '–'}
                      <span className="ml-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {methodLabel(h.method, de)}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={9} />{locationLabel(h.city, h.country_code, de)}
                      </span>
                      <span className="opacity-30">·</span>
                      <span className="font-mono">{h.ip || '–'}</span>
                    </p>
                  </div>
                  <p className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                    {fmtDate(h.at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Sign-up info ─── */}
      {signup?.at && (
        <Card className="border-black/[0.04] dark:border-white/[0.06]">
          <CardContent className="p-5">
            <h3 className="text-sm font-black flex items-center gap-2 mb-3">
              <ShieldAlert size={13} /> {de ? 'Account-Erstellung' : 'Account creation'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{de ? 'Erstellt' : 'Created'}</p>
                <p className="font-medium">{fmtDate(signup.at)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{de ? 'Standort' : 'Location'}</p>
                <p className="font-medium">{locationLabel(signup.geo?.city, signup.geo?.country_code, de)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">IP</p>
                <p className="font-mono text-[11px]">{signup.ip || '–'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Stat = ({ icon, label, value, testid }) => (
  <div className="rounded-xl bg-white/40 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] p-3" data-testid={testid}>
    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1 mb-1.5">
      {icon} {label}
    </p>
    <p className="text-[12px] font-black truncate">{value}</p>
  </div>
);
