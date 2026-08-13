/**
 * Widerrufsbelehrung — Verbraucher-Widerrufsrecht (§ 312g, § 355 BGB).
 *
 * Standardtext nach Anlage 1 zu Art. 246a § 1 Abs. 2 Satz 2 EGBGB
 * mit eingesetzten Anbieter-Daten.
 */
import { useLanguage } from '../contexts/LanguageContext';

import { useSeo } from '../lib/seo';
export default function WiderrufPage() {
  useSeo({
    path: '/widerruf',
    title: 'Widerrufsrecht — Leader-OS',
    description: 'Widerrufsbelehrung und Muster-Widerrufsformular für Leader-OS.',
  });

  const { lang } = useLanguage();
  const de = lang === 'de';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white py-12 px-6" data-testid="widerruf-page">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="inline-flex items-center gap-2 text-[#BFFF00] text-[12px] mb-6 hover:underline">← {de ? 'Zurück' : 'Back'}</a>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">{de ? 'Widerrufsbelehrung' : 'Right of Withdrawal'}</h1>
        <p className="text-white/60 text-[12px] mb-10">{de ? 'Für Verbraucher im Sinne des § 13 BGB' : 'For consumers as defined in § 13 BGB'}</p>

        <section className="space-y-6 text-[13px] leading-relaxed text-white/80">
          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Widerrufsrecht' : 'Right of withdrawal'}</h2>
            <p>
              {de
                ? 'Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt 14 Tage ab dem Tag des Vertragsabschlusses.'
                : 'You have the right to withdraw from this contract within 14 days without giving any reason. The withdrawal period is 14 days from the day of contract conclusion.'}
            </p>
            <p className="mt-3">
              {de
                ? 'Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ('
                : 'To exercise the right of withdrawal, you must inform us ('}
              <strong>Argumentorik-Akademie GmbH, Tölzer Str. 1, 82031 Grünwald, E-Mail: <a href="mailto:info@argumentorik.com" className="text-[#BFFF00] hover:underline">info@argumentorik.com</a></strong>
              {de
                ? ') mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.'
                : ') of your decision to withdraw from this contract by an unequivocal statement (e.g. a letter sent by post or email).'}
            </p>
            <p className="mt-3">
              {de
                ? 'Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.'
                : 'To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired.'}
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Folgen des Widerrufs' : 'Consequences of withdrawal'}</h2>
            <p>
              {de
                ? 'Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben.'
                : 'If you withdraw from this contract, we shall reimburse to you all payments received from you without undue delay and not later than 14 days from the day on which we are informed about your decision to withdraw. We will use the same means of payment as you used for the initial transaction.'}
            </p>
          </div>

          <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl p-4">
            <h2 className="text-amber-200 font-bold text-base mb-2">{de ? 'Wichtiger Hinweis bei digitalen Inhalten' : 'Important notice for digital content'}</h2>
            <p className="text-amber-100/80">
              {de
                ? 'Das Widerrufsrecht erlischt bei einem Vertrag zur Lieferung von digitalen Inhalten (z.B. KI-Coach-Zugang, Video-Trainings), wenn Sie ausdrücklich zugestimmt haben, dass mit der Ausführung des Vertrags vor Ende der Widerrufsfrist begonnen wird, UND Sie Ihre Kenntnis bestätigt haben, dass durch diese Zustimmung das Widerrufsrecht erlischt.'
                : 'The right of withdrawal expires for contracts for the delivery of digital content (e.g. AI coach access, video training) if you have explicitly agreed that performance of the contract begins before the end of the withdrawal period AND confirmed your knowledge that this consent causes the right of withdrawal to expire.'}
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Muster-Widerrufsformular' : 'Sample withdrawal form'}</h2>
            <div className="bg-white/[0.04] border border-white/10 rounded-lg p-4 font-mono text-[11px] whitespace-pre-line">
              {de ? `An: Argumentorik-Akademie GmbH
Tölzer Str. 1
82031 Grünwald
info@argumentorik.com

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*)
abgeschlossenen Vertrag über den Kauf der folgenden
Dienstleistung: Leader-OS [Tier-Name]

Bestellt am (*) / erhalten am (*):
Name des/der Verbraucher(s):
Anschrift des/der Verbraucher(s):
Datum:
Unterschrift (nur bei Papier-Form):

(*) Unzutreffendes streichen.` : `To: Argumentorik-Akademie GmbH
Tölzer Str. 1
82031 Grünwald
info@argumentorik.com

I/we (*) hereby give notice that I/we (*) withdraw from
my/our (*) contract for the purchase of the following
service: Leader-OS [Tier name]

Ordered on (*) / received on (*):
Name of consumer(s):
Address of consumer(s):
Date:
Signature (only for paper form):

(*) Delete as applicable.`}
            </div>
          </div>
        </section>

        <p className="text-white/40 text-[10px] mt-12">{de ? 'Stand' : 'Last updated'}: Mai 2026</p>
      </div>
    </div>
  );
}
