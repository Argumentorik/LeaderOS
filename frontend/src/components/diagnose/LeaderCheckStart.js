import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, Compass, Flame, Loader2, RefreshCw, UserRound } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { LEADERCHECK_URL } from '../../lib/domains';

const WHAT_IT_UNLOCKS = [
  { icon: Compass, de: 'Deine persönliche Reise', en: 'Your personal journey', de_s: 'Sieben Schritte, die auf deinem Ergebnis aufbauen — nicht auf einem Standardplan.', en_s: 'Seven steps built on your result — not on a generic plan.' },
  { icon: Flame, de: 'Fokus in der 30-Tage-Challenge', en: 'Focus in the 30-day challenge', de_s: 'Jeder Tag zieht auf das Feld, das bei dir am meisten bewegt.', en_s: 'Every day pulls toward the area that moves the needle for you.' },
  { icon: UserRound, de: 'Wlad kennt deinen Stand', en: 'Wlad knows where you stand', de_s: 'Im Gespräch bezieht er sich auf deine Werte, statt allgemein zu antworten.', en_s: 'In conversation he refers to your scores instead of answering generically.' },
];

/**
 * Einstieg für Nutzer ohne Leader-Check: erklären, starten, Ergebnis holen.
 * Ein Weg, überall gleich — kein leerer Ring mit Nullwerten mehr.
 */
export const LeaderCheckStart = ({ de = true, email = '', onFound }) => {
  const [fetching, setFetching] = useState(false);
  const [note, setNote] = useState('');
  const [opened, setOpened] = useState(false);
  const lastCheckRef = useRef(0);

  const check = useCallback(async ({ silent = false } = {}) => {
    if (!silent) { setFetching(true); setNote(''); }
    lastCheckRef.current = Date.now();
    try {
      await api.post('/wladhub/sync', {});
      // Wahrheit ist immer die Diagnose selbst — Sync-Status allein kann „local_data“ melden,
      // ohne dass eine echte Diagnose vorliegt (Iter 179 Testing-Agent-Fund).
      const diag = await api.get('/wladhub/diagnosis');
      if (diag.data?.connected) {
        onFound?.();
        return true;
      }
      if (!silent) {
        setNote(de
          ? `Noch nichts unter ${email || 'deiner E-Mail'} gefunden — schließe den Check ab und tippe hier erneut.`
          : `Nothing found for ${email || 'your email'} yet — finish the check and tap here again.`);
      }
      return false;
    } catch (err) {
      logger.warn('leadercheck fetch failed', err);
      if (!silent) {
        setNote(de
          ? 'Verbindung zu leadercheck.de hat nicht geklappt. Bitte in einem Moment erneut versuchen.'
          : 'Could not reach leadercheck.de. Please try again in a moment.');
      }
      return false;
    } finally {
      if (!silent) setFetching(false);
    }
  }, [de, email, onFound]);

  // Rückkehr aus dem anderen Tab: still nachsehen, ob das Ergebnis inzwischen da ist
  // (höchstens alle 20 s, damit Fokuswechsel keine Anfrageflut auslösen).
  useEffect(() => {
    const onFocus = () => {
      if (!opened) return;
      if (Date.now() - lastCheckRef.current < 20000) return;
      check({ silent: true });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [opened, check]);

  const startCheck = () => {
    const url = email ? `${LEADERCHECK_URL}?email=${encodeURIComponent(email)}` : LEADERCHECK_URL;
    setOpened(true);
    lastCheckRef.current = 0;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-6 sm:p-8"
          data-testid="leadercheck-start">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#BFFF00]/20 bg-[#BFFF00]/[0.08] px-3 py-1.5">
        <Activity size={12} className="text-[#BFFF00]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#BFFF00]">{de ? 'Noch keine Diagnose' : 'No diagnosis yet'}</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {de ? 'Fünf Minuten, dann arbeitet Leader-OS für dich' : 'Five minutes, then Leader-OS works for you'}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
        {de
          ? 'Der Leader-Check ist der kostenlose Test auf leadercheck.de: ein paar ehrliche Fragen zu KI-Kompetenz, Boardroom-Rhetorik und strategischem EQ. Dein Ergebnis fließt automatisch hierher zurück — und stellt danach alles auf dich ein.'
          : 'The Leader Check is the free assessment on leadercheck.de: a few honest questions on AI competence, boardroom rhetoric and strategic EQ. Your result flows back here automatically — and tunes everything to you.'}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {WHAT_IT_UNLOCKS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.de} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <Icon size={15} className="mb-2 text-[#BFFF00]" />
              <p className="text-[12.5px] font-bold text-white">{de ? item.de : item.en}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-white/45">{de ? item.de_s : item.en_s}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={startCheck} className="h-12 bg-[#BFFF00] px-6 text-[14px] font-black text-black hover:bg-[#D4FF4D]"
                data-testid="leadercheck-start-btn">
          {de ? 'Leader-Check auf leadercheck.de starten' : 'Start the Leader Check on leadercheck.de'} <ArrowRight size={16} className="ml-2" />
        </Button>
        <Button onClick={() => check()} disabled={fetching} variant="outline"
                className="h-12 border-white/15 bg-transparent px-5 text-[13px] font-bold text-white/85 hover:text-white"
                data-testid="leadercheck-fetch-btn">
          {fetching ? <Loader2 size={15} className="mr-2 animate-spin" /> : <RefreshCw size={15} className="mr-2" />}
          {de ? 'Ergebnis jetzt holen' : 'Fetch my result now'}
        </Button>
      </div>

      <p className="mt-3 text-[11.5px] text-white/40" data-testid="leadercheck-email-hint">
        {de ? 'Wir suchen dein Ergebnis unter ' : 'We look up your result for '}
        <span className="font-semibold text-white/70">{email || (de ? 'deiner E-Mail' : 'your email')}</span>
        {de
          ? '. Hast du den Check mit einer anderen Adresse gemacht, mach ihn kurz mit dieser noch einmal — oder schreib uns.'
          : '. If you took the check with a different address, redo it with this one — or write to us.'}
      </p>

      {opened && (
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[#BFFF00]/80" data-testid="leadercheck-opened-hint">
          <CheckCircle2 size={12} />
          {de ? 'Der Check läuft im anderen Tab. Komm zurück, sobald du fertig bist — wir sehen automatisch nach.' : 'The check is open in the other tab. Come back when you are done — we look automatically.'}
        </p>
      )}

      {(note || fetching) && (
        <p className="mt-3 text-[12px] leading-relaxed text-amber-300/90" data-testid="leadercheck-note">
          {fetching
            ? (de ? 'Wir sehen gerade bei leadercheck.de nach — das dauert einen Moment.' : 'Checking leadercheck.de — this takes a moment.')
            : note}
        </p>
      )}
    </Card>
  );
};

export default LeaderCheckStart;
