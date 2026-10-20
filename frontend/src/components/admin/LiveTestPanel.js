/**
 * LiveTestPanel — the 1€ release gate (Iter 134).
 *
 * A colleague starts from zero, pays 1 €, gets the Stripe invoice by email and
 * the correct access — without anyone touching the database. This panel does
 * three things: unlock a colleague, hand out the ready-to-send instructions,
 * and show every 1€ transaction incl. its Stripe invoice number.
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { FlaskConical, Plus, Trash2, Copy, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { toast } from 'sonner';

export const LiveTestPanel = ({ de = true }) => {
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/livetest/buyers');
      setData(res.data);
    } catch (err) {
      logger.warn('livetest load failed', err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    const value = email.trim().toLowerCase();
    if (!value) return;
    setBusy(true);
    try {
      await api.post('/admin/livetest/buyers', { email: value });
      toast.success(de ? `${value} ist freigeschaltet` : `${value} unlocked`);
      setEmail('');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || (de ? 'Freischalten fehlgeschlagen' : 'Failed'));
    } finally { setBusy(false); }
  };

  const remove = async (mail) => {
    try {
      await api.delete(`/admin/livetest/buyers/${encodeURIComponent(mail)}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Fehler');
    }
  };

  const code = data?.activation_code || 'WLAD-1EURO-2026';
  const link = `${window.location.origin}/coaching?code=${code}`;

  const instructions = de
    ? `Bitte teste unseren Kauf-Prozess einmal komplett von vorne — so wie ein echter Kunde:

1. Registriere dich auf ${window.location.origin} mit deiner Mailadresse (neuer Account, nicht dein bestehender).
2. Gehe das Onboarding durch.
3. Öffne diesen Link: ${link}
4. Klicke oben auf "Für 1 € aktivieren".
5. Bezahle im Stripe-Checkout mit deiner echten Karte (1 €). Rechnungsadresse bitte vollständig ausfüllen.
6. Warte, bis die Seite "Willkommen, Leader" zeigt — lade sie einmal neu.
7. Prüfe dein Mail-Postfach: du bekommst (a) die Rechnung von Stripe, (b) unsere Zahlungsbestätigung.
8. Prüfe, ob alle Funktionen freigeschaltet sind (Chat, Challenge, Video-Analyse-Kurse).
9. Melde dich ab, melde dich wieder an — der Zugang muss bestehen bleiben.

Melde mir zurück: Was hat nicht funktioniert, wo hast du gestockt, was war unklar? Screenshots gerne.`
    : `Please run our purchase flow end to end, exactly like a real customer:

1. Sign up at ${window.location.origin} with your email (a new account).
2. Complete the onboarding.
3. Open this link: ${link}
4. Click "Activate for €1".
5. Pay in the Stripe checkout with your real card (€1). Fill in the full billing address.
6. Wait for the "Welcome, Leader" page — then reload it once.
7. Check your inbox: (a) the Stripe invoice, (b) our payment confirmation.
8. Verify every feature is unlocked (chat, challenge, video courses).
9. Log out, log back in — access must persist.

Report back: what broke, where did you hesitate, what was unclear? Screenshots welcome.`;

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(de ? `${label} kopiert` : `${label} copied`);
  };

  return (
    <Card className="border-[#BFFF00]/20" data-testid="livetest-panel">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/25 flex items-center justify-center">
            <FlaskConical size={17} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black">{de ? '1-€-Livetest · Release-Gate' : '€1 live test · release gate'}</p>
            <p className="text-[10px] text-muted-foreground">
              {de ? 'Echter Stripe-Checkout, echte Rechnung, echter Zugang — ohne DB-Eingriff.' : 'Real Stripe checkout, real invoice, real access — no DB edits.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="h-9 text-xs gap-1.5" data-testid="livetest-refresh">
            <RefreshCw size={13} /> {de ? 'Aktualisieren' : 'Refresh'}
          </Button>
        </div>

        {/* Code + link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => copy(code, de ? 'Code' : 'Code')}
            className="flex items-center justify-between gap-2 px-3 h-10 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white/60 dark:bg-card/50 hover:border-[#BFFF00]/40 transition-colors"
            data-testid="livetest-copy-code"
          >
            <span className="text-[11px] font-mono font-bold">{code}</span>
            <Copy size={13} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => copy(link, de ? 'Link' : 'Link')}
            className="flex items-center justify-between gap-2 px-3 h-10 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white/60 dark:bg-card/50 hover:border-[#BFFF00]/40 transition-colors"
            data-testid="livetest-copy-link"
          >
            <span className="text-[11px] font-mono truncate">/coaching?code={code}</span>
            <Copy size={13} className="text-muted-foreground shrink-0" />
          </button>
        </div>

        {/* Unlock a colleague */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={de ? 'mitarbeiter@firma.de — Account muss existieren' : 'colleague@company.com — account must exist'}
            className="flex-1 min-w-[220px] h-9 text-xs"
            data-testid="livetest-email-input"
          />
          <Button size="sm" onClick={add} disabled={busy} className="h-9 text-xs gap-1.5 bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold" data-testid="livetest-add-btn">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            {de ? 'Freischalten' : 'Unlock'}
          </Button>
        </div>

        {(data?.buyers || []).length > 0 && (
          <div className="space-y-1.5" data-testid="livetest-buyers">
            {data.buyers.map((b) => (
              <div key={b.email} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-[11px] font-semibold flex-1 truncate">{b.email}</span>
                <Badge variant="outline" className="text-[9px] uppercase">{b.tier || 'free'}</Badge>
                <button onClick={() => remove(b.email)} className="text-muted-foreground hover:text-rose-500 transition-colors" data-testid={`livetest-remove-${b.email}`}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Ready-to-send instructions */}
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {de ? 'Text zum Rausschicken' : 'Text to send out'}
            </p>
            <Button variant="outline" size="sm" onClick={() => copy(instructions, de ? 'Anleitung' : 'Instructions')} className="h-8 text-[11px] gap-1.5" data-testid="livetest-copy-instructions">
              <Copy size={12} /> {de ? 'Kopieren' : 'Copy'}
            </Button>
          </div>
          <pre className="text-[10.5px] leading-relaxed whitespace-pre-wrap text-muted-foreground max-h-40 overflow-y-auto font-sans">{instructions}</pre>
        </div>

        {/* Transactions */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            {de ? '1-€-Transaktionen' : '€1 transactions'}
          </p>
          {(data?.transactions || []).length === 0 && (
            <p className="text-[11px] text-muted-foreground" data-testid="livetest-no-tx">
              {de ? 'Noch kein Livetest-Kauf erfasst.' : 'No live-test purchase recorded yet.'}
            </p>
          )}
          {(data?.transactions || []).map((tx) => (
            <div key={tx.session_id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08]" data-testid="livetest-tx-row">
              <span className="text-[11px] font-semibold flex-1 truncate">{tx.user_email || tx.user_id}</span>
              <Badge className={`text-[9px] uppercase border-0 ${tx.payment_status === 'paid' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600'}`}>
                {tx.payment_status}
              </Badge>
              {tx.invoice_number && <span className="text-[10px] font-mono text-muted-foreground">{tx.invoice_number}</span>}
              {tx.invoice_url && (
                <a href={tx.invoice_url} target="_blank" rel="noopener noreferrer" className="text-[#6B8A00] dark:text-[#BFFF00] hover:opacity-70" data-testid="livetest-invoice-link">
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
