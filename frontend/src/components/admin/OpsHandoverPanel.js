/**
 * OpsHandoverPanel — "Etwas ist kaputt, was mache ich?" (Iter 135).
 *
 * The operational runbook lives where the operator already is: in the Admin
 * Dashboard. Same content as /app/memory/DEV_HANDOVER.md, short version.
 */
import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { LifeBuoy, ChevronDown } from 'lucide-react';

const SECTIONS = [
  {
    id: 'ai-wrong',
    title: 'Der KI-Coach antwortet falsch oder ohne Wlads Wissen',
    steps: [
      'Admin → RAG Control Center: "Chunks" und "Quellen" prüfen. Erwartet: ~7.400 Chunks, 53 Quellen.',
      '"Ist alles drin? (Bücher-Check)" klicken. Fehlt eine Datei, steht sie rot da.',
      '"Golden-Check" klicken: das sind 21 echte Fragen. Alles unter 20/21 ist ein Signal.',
      'RAG Debug Studio: die konkrete Frage eingeben und schauen, welche Quellen zurückkommen.',
      'Wenn Quellen fehlen: "Neu einlesen" (Re-Ingest). Dauert ein paar Minuten, Caches werden automatisch geleert.',
      'Erst wenn Re-Ingest nicht hilft → DEV-Team (Embedding-Modell / Chunking).',
    ],
  },
  {
    id: 'diagnose-missing',
    title: 'Ein Kunde sieht seine leadercheck.de-Diagnose nicht',
    steps: [
      'Admin → leadercheck.de Sync: "Letzter Import" und "Letzter Fehler" ansehen.',
      'Der Sync läuft automatisch beim Login, höchstens alle 6 Stunden pro Person.',
      'Kunde soll sich einmal ab- und wieder anmelden. Danach Widget neu laden.',
      'Status "Keine Diagnose": die E-Mail auf leadercheck.de weicht ab (andere Adresse benutzt).',
      'Status "Fehler": Fehlermeldung im Widget lesen. Meist Supabase nicht erreichbar oder Key abgelaufen.',
      'Niemals Scores manuell in die Datenbank schreiben. Quelle der Wahrheit ist leadercheck.de.',
    ],
  },
  {
    id: 'payment',
    title: 'Zahlung ist durch, Zugang fehlt',
    steps: [
      'Admin → Transaktionen: Session zur E-Mail suchen. Status muss "paid" sein.',
      'Der Zugang wird beim Aufruf der Erfolgsseite freigeschaltet. Kunde soll /payment-success neu laden.',
      'Rechnung: im 1-€-Livetest-Panel bzw. in Stripe unter dem Kunden. Stripe verschickt sie selbst.',
      'Tier zur Not über Admin → Nutzer setzen, aber immer mit Notiz, warum.',
      'Wenn mehrere Kunden betroffen sind: nichts einzeln reparieren, sofort DEV-Team.',
    ],
  },
  {
    id: 'never',
    title: 'Was NIEMALS manuell verändert wird',
    steps: [
      'rag_chunks: nur über Re-Ingest oder Wissens-Upload im Admin.',
      'Preise und Beträge: stehen serverseitig im Code. Nie in der Datenbank ändern.',
      'wladhub_diagnoses: kommt von leadercheck.de. Manuelle Werte werden beim nächsten Sync überschrieben.',
      'credits / tier direkt in der DB: nur über die Admin-Aktionen, sonst laufen Ablaufdaten auseinander.',
      'Secrets (.env): Änderung heißt Deployment plus Neustart, nicht im Betrieb anfassen.',
    ],
  },
  {
    id: 'scope',
    title: 'Was Admin kann, was ein Deployment braucht',
    steps: [
      'Im Admin ohne Deployment: Wissen hochladen/löschen, Re-Ingest, Tier setzen, Lizenzschlüssel, Livetest freischalten, E-Mail-Sequenzen freigeben, Feature-Rollout (Aus / Nur Premium / Alle).',
      'Deployment nötig: Preise, Prompts, neue Seiten, Bugfixes, neue Felder.',
      'Re-Ingest nötig: neue Bücher/Kurse, geänderte Chunking-Logik, Wechsel des Embedding-Modells.',
      'Datenbank-Migration nötig: neues Pflichtfeld an bestehenden Dokumenten.',
      'DEV-Team: alles, was mehrere Kunden gleichzeitig betrifft, oder wenn ein Fix nur mit DB-Handarbeit funktioniert.',
    ],
  },
];

export const OpsHandoverPanel = () => {
  const [open, setOpen] = useState('ai-wrong');

  return (
    <Card data-testid="ops-handover-panel">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <LifeBuoy size={15} className="text-[#6B8A00] dark:text-[#BFFF00]" />
          <h3 className="text-sm font-black">Betriebs-Handbuch · Etwas ist kaputt, was tun?</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Reihenfolge immer: erkennen → Systemstatus prüfen → betroffenen Datensatz ansehen →
          Admin-Aktion (z. B. Re-Ingest) → Ergebnis prüfen → erst dann DEV-Team.
        </p>

        <div className="space-y-2">
          {SECTIONS.map((s) => (
            <div key={s.id} className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
              <button
                onClick={() => setOpen(open === s.id ? '' : s.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                data-testid={`ops-section-${s.id}`}
              >
                <span className="text-xs font-bold flex-1">{s.title}</span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open === s.id ? 'rotate-180' : ''}`} />
              </button>
              {open === s.id && (
                <ol className="px-4 pb-3 pt-1 space-y-1.5 list-decimal list-inside" data-testid={`ops-steps-${s.id}`}>
                  {s.steps.map((step) => (
                    <li key={step} className="text-[11.5px] text-muted-foreground leading-relaxed">{step}</li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Ausführliche Version für Entwickler: <span className="font-mono">/app/memory/DEV_HANDOVER.md</span>
        </p>
      </CardContent>
    </Card>
  );
};

export default OpsHandoverPanel;
