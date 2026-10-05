import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { Loader2, ShieldCheck, ShieldOff, Upload, UserPlus } from 'lucide-react';

/**
 * AdminAccessPanel · two jobs for the support team around the webinar.
 *
 * 1. Grant / revoke admin access for an existing leaderos.de account
 *    (POST /api/admin/admins). The person signs up normally first; after the
 *    grant, /wlad-control-x7k9q2 opens from their own login — no shared
 *    founder account, no redeploy.
 * 2. Import webinar leads from a CSV the team prepared
 *    (POST /api/admin/webinar-leads/import). Dry run first, then import.
 *    Sends no emails; the reminder/follow-up crons handle that.
 */
export default function AdminAccessPanel({ de = true, currentEmail = '' }) {
  const [admins, setAdmins] = useState(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [file, setFile] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/admins');
      setAdmins(res.data);
    } catch (err) {
      logger.error(err);
      setAdmins({ allowlist: [], flagged: [] });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const errorText = (err) => {
    const d = err?.response?.data?.detail;
    const map = {
      no_account_for_email: de ? 'Für diese E-Mail gibt es noch keinen Account. Die Person muss sich zuerst auf leaderos.de registrieren.' : 'No account for this email yet. The person has to sign up on leaderos.de first.',
      cannot_revoke_self: de ? 'Du kannst dir selbst den Zugriff nicht entziehen.' : 'You cannot revoke your own access.',
      allowlisted_email_cannot_be_revoked: de ? 'Diese E-Mail steht in der festen Allowlist und kann hier nicht entfernt werden.' : 'This email is on the fixed allowlist and cannot be revoked here.',
      no_valid_rows: de ? 'Keine gültige E-Mail-Spalte gefunden.' : 'No valid email column found.',
      csv_too_large: de ? 'Datei größer als 2 MB.' : 'File larger than 2 MB.',
    };
    return map[d] || (typeof d === 'string' ? d : (de ? 'Fehler. Bitte erneut versuchen.' : 'Error. Please retry.'));
  };

  const setAccess = async (target, grant) => {
    const clean = (target || '').trim().toLowerCase();
    if (!clean) return;
    setBusy(true); setMsg(null);
    try {
      const res = await api.post('/admin/admins', { email: clean, grant });
      setMsg({ ok: true, text: grant
        ? (de ? `${res.data.email} kann das Admin-Panel jetzt öffnen.` : `${res.data.email} can open the admin panel now.`)
        : (de ? `${res.data.email} hat keinen Admin-Zugriff mehr.` : `${res.data.email} no longer has admin access.`) });
      setEmail('');
      load();
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    } finally { setBusy(false); }
  };

  const runImport = async (dryRun) => {
    if (!file) return;
    setImportBusy(true); setImportResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/admin/webinar-leads/import', form, { params: { dry_run: dryRun }, headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult({ ok: true, ...res.data });
    } catch (err) {
      setImportResult({ ok: false, text: errorText(err) });
    } finally { setImportBusy(false); }
  };

  return (
    <Card className="border-black/[0.06] dark:border-white/[0.06]" data-testid="admin-access-panel">
      <CardContent className="p-5 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {de ? 'Admin-Zugriff & Webinar-Import' : 'Admin access & webinar import'}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {de
              ? 'Support-Team freischalten (eigener Login, kein Deploy) und Teilnehmer-Listen als CSV einspielen.'
              : 'Give the support team access from their own login (no deploy) and import attendee lists as CSV.'}
          </p>
        </div>

        {/* Grant / revoke */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Admin vergeben' : 'Grant admin'}</p>
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(e) => { e.preventDefault(); setAccess(email, true); }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@argumentorik.com"
              className="flex-1 h-10 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 text-sm"
              data-testid="admin-grant-email"
            />
            <button type="submit" disabled={busy} className="h-10 px-4 rounded-xl bg-[#0A0A0A] text-white dark:bg-[#BFFF00] dark:text-[#0A0A0A] text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50" data-testid="admin-grant-submit">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              {de ? 'Freischalten' : 'Grant'}
            </button>
          </form>
          <p className="text-[11px] text-muted-foreground mt-2">
            {de
              ? 'Voraussetzung: Die Person hat sich bereits auf leaderos.de registriert. Danach öffnet sie leaderos.de/wlad-control-x7k9q2 mit ihrem eigenen Login.'
              : 'Requirement: the person already signed up on leaderos.de. Afterwards leaderos.de/wlad-control-x7k9q2 opens from their own login.'}
          </p>
          {msg && (
            <p className={`text-xs mt-2 ${msg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} data-testid="admin-grant-msg">{msg.text}</p>
          )}
        </div>

        {/* Current admins */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Aktuelle Admins' : 'Current admins'}</p>
          {!admins ? (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          ) : (
            <div className="space-y-1.5">
              {admins.allowlist.map((a) => (
                <div key={a} className="flex items-center justify-between text-xs py-1.5 border-b border-black/[0.05] dark:border-white/[0.05]">
                  <span className="font-mono">{a}</span>
                  <Badge className="text-[8px] bg-slate-500/15 text-slate-700 dark:text-slate-300 border-0">{de ? 'ALLOWLIST' : 'ALLOWLIST'}</Badge>
                </div>
              ))}
              {admins.flagged.filter((u) => !admins.allowlist.includes((u.email || '').toLowerCase())).map((u) => (
                <div key={u.email} className="flex items-center justify-between text-xs py-1.5 border-b border-black/[0.05] dark:border-white/[0.05]">
                  <span className="font-mono">{u.email}{u.name ? <span className="text-muted-foreground"> · {u.name}</span> : null}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[8px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0"><ShieldCheck size={9} className="mr-1" />ADMIN</Badge>
                    {u.email !== currentEmail && (
                      <button type="button" onClick={() => setAccess(u.email, false)} disabled={busy} className="text-[10px] text-red-600 dark:text-red-400 inline-flex items-center gap-1 hover:underline" data-testid={`admin-revoke-${u.email}`}>
                        <ShieldOff size={10} /> {de ? 'entziehen' : 'revoke'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!admins.flagged.length && (
                <p className="text-[11px] text-muted-foreground">{de ? 'Noch keine per Panel freigeschalteten Admins.' : 'No panel-granted admins yet.'}</p>
              )}
            </div>
          )}
        </div>

        {/* CSV import */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Webinar-Teilnehmer als CSV' : 'Webinar attendees as CSV'}</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              type="file"
              accept=".csv,.tsv,text/csv,text/tab-separated-values"
              onChange={(e) => { setFile(e.target.files?.[0] || null); setImportResult(null); }}
              className="text-xs"
              data-testid="admin-import-file"
            />
            <button type="button" disabled={!file || importBusy} onClick={() => runImport(true)} className="h-9 px-3 rounded-xl border border-black/15 dark:border-white/15 text-xs font-bold disabled:opacity-50" data-testid="admin-import-dry">
              {de ? 'Prüfen (Dry Run)' : 'Check (dry run)'}
            </button>
            <button type="button" disabled={!file || importBusy || !importResult?.ok || importResult?.dry_run === false} onClick={() => runImport(false)} className="h-9 px-3 rounded-xl bg-[#0A0A0A] text-white dark:bg-[#BFFF00] dark:text-[#0A0A0A] text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50" data-testid="admin-import-run">
              {importBusy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {de ? 'Importieren' : 'Import'}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {de
              ? 'Spalten: email (Pflicht), name, company. Komma, Semikolon oder Tab. Erst prüfen, dann importieren. Es werden keine E-Mails verschickt; Erinnerungen laufen über die normalen Cron-Jobs.'
              : 'Columns: email (required), name, company. Comma, semicolon or tab. Check first, then import. No emails are sent; reminders run through the regular cron jobs.'}
          </p>
          {importResult && (
            <div className={`text-xs mt-2 ${importResult.ok ? 'text-foreground' : 'text-red-600 dark:text-red-400'}`} data-testid="admin-import-result">
              {importResult.ok ? (
                <>
                  <span className="font-bold">{importResult.dry_run ? (de ? 'Prüfung: ' : 'Check: ') : (de ? 'Importiert: ' : 'Imported: ')}</span>
                  {importResult.rows} {de ? 'gültige Zeilen' : 'valid rows'}
                  {!importResult.dry_run && ` · ${importResult.inserted} ${de ? 'neu' : 'new'} · ${importResult.updated} ${de ? 'aktualisiert' : 'updated'}`}
                  {importResult.invalid ? ` · ${importResult.invalid} ${de ? 'ungültig' : 'invalid'}` : ''}
                  {importResult.invalid_samples?.length ? (
                    <ul className="mt-1 font-mono text-[10px] text-muted-foreground">{importResult.invalid_samples.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  ) : null}
                </>
              ) : importResult.text}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
