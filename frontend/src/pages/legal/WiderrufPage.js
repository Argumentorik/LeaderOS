import { Link } from 'react-router-dom';
import LegalLayout from '../../components/legal/LegalLayout';

export default function WiderrufPage() {
  return (
    <LegalLayout title="Widerrufsbelehrung">
      <section>
        <h2>Widerrufsrecht</h2>
        <p>
          Sie haben das Recht, binnen <strong>vierzehn Tagen</strong> ohne
          Angabe von Gründen diesen Vertrag zu widerrufen.
        </p>
        <p>
          Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des
          Vertragsabschlusses.
        </p>
        <p>
          Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
        </p>
        <p>
          <strong>Argumentorik-Akademie GmbH</strong><br />
          Tölzer Str. 1<br />
          82031 Grünwald<br />
          Deutschland<br />
          E-Mail: <a href="mailto:info@argumentorik.com">info@argumentorik.com</a>
        </p>
        <p>
          mittels einer eindeutigen Erklärung (z. B. ein mit der Post
          versandter Brief oder E-Mail) über Ihren Entschluss, diesen
          Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte
          Muster-Widerrufsformular verwenden, das jedoch nicht
          vorgeschrieben ist.
        </p>
        <p>
          Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die
          Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der
          Widerrufsfrist absenden.
        </p>
      </section>

      <section>
        <h2>Folgen des Widerrufs</h2>
        <p>
          Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle
          Zahlungen, die wir von Ihnen erhalten haben, einschließlich der
          Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus
          ergeben, dass Sie eine andere Art der Lieferung als die von uns
          angebotene, günstigste Standardlieferung gewählt haben),
          unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
          zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses
          Vertrags bei uns eingegangen ist.
        </p>
        <p>
          Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das
          Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei
          denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in
          keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte
          berechnet.
        </p>
      </section>

      <section>
        <h2>Vorzeitiges Erlöschen des Widerrufsrechts</h2>
        <p>
          Bei einem Vertrag zur Lieferung von nicht auf einem körperlichen
          Datenträger befindlichen digitalen Inhalten erlischt das
          Widerrufsrecht auch dann, wenn wir mit der Ausführung des Vertrags
          begonnen haben, nachdem Sie
        </p>
        <ol>
          <li>
            ausdrücklich zugestimmt haben, dass wir mit der Ausführung des
            Vertrags vor Ablauf der Widerrufsfrist beginnen, und
          </li>
          <li>
            Ihre Kenntnis davon bestätigt haben, dass Sie durch Ihre Zustimmung
            mit Beginn der Ausführung des Vertrags Ihr Widerrufsrecht verlieren.
          </li>
        </ol>
      </section>

      <section>
        <h2>Muster-Widerrufsformular</h2>
        <p className="text-white/60 italic">
          (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte
          dieses Formular aus und senden Sie es zurück.)
        </p>
        <div className="border border-white/10 rounded-lg p-6 mt-4 bg-white/[0.02] text-sm">
          <p>An:<br />
            Argumentorik-Akademie GmbH<br />
            Tölzer Str. 1<br />
            82031 Grünwald<br />
            E-Mail: info@argumentorik.com
          </p>
          <p className="mt-4">
            Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen
            Vertrag über den Kauf der folgenden Waren / die Erbringung der
            folgenden Dienstleistung (*):
          </p>
          <p className="mt-2 text-white/40">_____________________________________________</p>
          <p className="mt-4">Bestellt am (*): _____________________________</p>
          <p className="mt-2">Name des/der Verbraucher(s): __________________</p>
          <p className="mt-2">Anschrift des/der Verbraucher(s): _______________</p>
          <p className="mt-2">Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): _________</p>
          <p className="mt-2">Datum: _____________________________________</p>
          <p className="mt-4 text-white/40 text-xs">(*) Unzutreffendes streichen.</p>
        </div>
      </section>

      <p className="text-white/40 text-sm mt-12">
        Siehe auch unser{' '}
        <Link to="/impressum" className="underline hover:text-[#BFFF00]">
          Impressum
        </Link>
        ,{' '}
        <Link to="/datenschutz" className="underline hover:text-[#BFFF00]">
          Datenschutzerklärung
        </Link>{' '}
        und{' '}
        <Link to="/agb" className="underline hover:text-[#BFFF00]">
          AGB
        </Link>
        .
      </p>
    </LegalLayout>
  );
}
