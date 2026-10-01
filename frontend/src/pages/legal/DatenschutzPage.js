import { Link } from 'react-router-dom';
import LegalLayout from '../../components/legal/LegalLayout';

export default function DatenschutzPage() {
  return (
    <LegalLayout title="Datenschutzerklärung">
      <p className="text-white/60 text-sm">
        Stand: {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:
        </p>
        <p>
          <strong>Argumentorik-Akademie GmbH</strong><br />
          Tölzer Str. 1<br />
          82031 Grünwald<br />
          Deutschland<br />
          E-Mail: <a href="mailto:info@argumentorik.com">info@argumentorik.com</a><br />
          Geschäftsführer: Wladislaw Jachtchenko
        </p>
      </section>

      <section>
        <h2>2. Ihre Rechte</h2>
        <p>Sie haben das Recht:</p>
        <ul>
          <li>Auskunft über Ihre personenbezogenen Daten zu verlangen (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten zu verlangen (Art. 16 DSGVO)</li>
          <li>Löschung Ihrer Daten zu verlangen (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung zu verlangen (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit zu verlangen (Art. 20 DSGVO)</li>
          <li>Der Verarbeitung zu widersprechen (Art. 21 DSGVO)</li>
          <li>Erteilte Einwilligungen jederzeit zu widerrufen (Art. 7 Abs. 3 DSGVO)</li>
          <li>Sich bei einer Aufsichtsbehörde zu beschweren · für uns zuständig: Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</li>
        </ul>
        <p>
          Anträge zu Auskunft, Berichtigung, Löschung und Export Ihrer Daten
          können Sie jederzeit über{' '}
          <a href="mailto:info@argumentorik.com">info@argumentorik.com</a> oder
          direkt in Ihrem Profilbereich nach dem Login stellen.
        </p>
      </section>

      <section>
        <h2>3. Welche Daten wir verarbeiten</h2>
        <h3>3.1 Beim Besuch der Website</h3>
        <p>
          Beim Aufruf unserer Website werden automatisch Informationen vom
          Browser an unseren Server übermittelt (Server-Logfiles): IP-Adresse,
          Datum und Uhrzeit, Referrer-URL, Browsertyp, Betriebssystem. Diese
          Daten dienen ausschließlich der Sicherstellung des Betriebs und der
          Sicherheit (Art. 6 Abs. 1 lit. f DSGVO · berechtigtes Interesse).
        </p>

        <h3>3.2 Bei Registrierung und Nutzung</h3>
        <p>
          Bei der Registrierung erheben wir: E-Mail-Adresse, gewähltes
          Passwort (gehashed), optional Name und Profildaten, die Sie
          freiwillig angeben. Bei Nutzung des Coaching-Bots erheben wir:
          Ihre Eingaben im Chat, Antworten in Übungen, Fortschrittsdaten,
          KI-generierte Empfehlungen, die wir Ihnen anzeigen.
        </p>
        <p>
          Rechtsgrundlage: Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO).
        </p>

        <h3>3.3 Bei Zahlung</h3>
        <p>
          Wir nutzen Stripe zur Zahlungsabwicklung. Hierbei werden
          Zahlungsinformationen direkt zwischen Ihnen und Stripe übermittelt;
          wir erhalten lediglich die Bestätigung der erfolgreichen Zahlung und
          Stripe-Kunden-ID. Rechtsgrundlage: Erfüllung des Nutzungsvertrags
          (Art. 6 Abs. 1 lit. b DSGVO).
        </p>
      </section>

      <section>
        <h2>4. Eingesetzte Dienstleister (Auftragsverarbeiter)</h2>
        <p>
          Wir setzen folgende Dienstleister zur Bereitstellung unseres
          Angebots ein. Mit allen wurde ein Auftragsverarbeitungsvertrag
          gemäß Art. 28 DSGVO geschlossen.
        </p>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 pr-4">Dienst</th>
              <th className="text-left py-2 pr-4">Zweck</th>
              <th className="text-left py-2">Region</th>
            </tr>
          </thead>
          <tbody className="text-white/70">
            <tr className="border-b border-white/5"><td className="py-2 pr-4">Vercel Inc.</td><td className="py-2 pr-4">Hosting Frontend (CDN)</td><td className="py-2">EU/USA mit SCCs</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 pr-4">Supabase Inc.</td><td className="py-2 pr-4">Datenbank, Authentifizierung</td><td className="py-2">EU (Stockholm)</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 pr-4">Stripe Payments Europe</td><td className="py-2 pr-4">Zahlungsabwicklung</td><td className="py-2">EU (Irland)</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 pr-4">PostHog Inc.</td><td className="py-2 pr-4">Nutzungsanalyse (nach Einwilligung)</td><td className="py-2">EU</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 pr-4">Functional Software, Inc. (Sentry)</td><td className="py-2 pr-4">Fehler-Monitoring</td><td className="py-2">EU (Frankfurt)</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 pr-4">Resend (Drei Eichen Capital LLC)</td><td className="py-2 pr-4">Transaktions-E-Mails</td><td className="py-2">EU/USA mit SCCs</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 pr-4">Anthropic, OpenAI, Google</td><td className="py-2 pr-4">KI-gestützte Coaching-Antworten</td><td className="py-2">EU/USA mit SCCs</td></tr>
            <tr><td className="py-2 pr-4">ElevenLabs Inc.</td><td className="py-2 pr-4">Sprachsynthese (Voice)</td><td className="py-2">EU/USA mit SCCs</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>5. Cookies und Tracking</h2>
        <h3>5.1 Essentielle Cookies</h3>
        <p>
          Diese sind für den Betrieb der Website notwendig (z. B. Login-Session,
          Sicherheits-Tokens). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO
          (berechtigtes Interesse).
        </p>

        <h3>5.2 Analyse und Komfort (PostHog)</h3>
        <p>
          Wir verwenden PostHog (EU-Region) zur Analyse der Nutzung unserer
          Plattform. PostHog erstellt Nutzungsstatistiken und – nach
          ausdrücklicher Einwilligung – Session Recordings, bei denen Ihre
          Interaktionen pseudonymisiert aufgezeichnet werden, um die
          Plattform zu verbessern. Eingaben in Formulare werden dabei maskiert.
        </p>
        <p>
          Rechtsgrundlage: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO,
          § 25 Abs. 1 TTDSG). Sie können die Einwilligung jederzeit über die
          Cookie-Einstellungen widerrufen.
        </p>

        <h3>5.3 Marketing-Messung (Meta, Google Ads, LinkedIn, Microsoft)</h3>
        <p>
          Nur wenn Sie im Cookie-Hinweis der Kategorie „Marketing" zustimmen,
          setzen wir Werkzeuge ein, die messen, ob eine Anzeige zu einer
          Anmeldung geführt hat, und die Besucher unserer Seite auf der jeweiligen
          Plattform erneut ansprechen können: das Meta-Pixel (Meta Platforms
          Ireland Ltd.), das Google-Ads-Conversion-Tracking (Google Ireland
          Ltd., Consent Mode v2, Standard: Ablehnung), das LinkedIn Insight Tag
          (LinkedIn Ireland Unlimited Company) und das Microsoft Advertising
          UET-Tag (Microsoft Ireland Operations Ltd.). Ohne Ihre Zustimmung
          werden diese Skripte nicht geladen bzw. es werden keine Cookies gesetzt
          und keine personenbezogenen Kennungen übertragen. Beim Meta-Pixel
          übermitteln wir Anmeldungen zusätzlich serverseitig an Meta; die
          E-Mail-Adresse wird dabei ausschließlich gehasht übertragen.
        </p>
        <p>
          Rechtsgrundlage: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO,
          § 25 Abs. 1 TDDDG), jederzeit widerrufbar über die Cookie-Einstellungen.
          Die Anbieter verarbeiten Daten auch in den USA; Grundlage ist das EU-US
          Data Privacy Framework.
        </p>

        <h3>5.4 Fehler-Monitoring (Sentry)</h3>
        <p>
          Wir verwenden Sentry zur Erkennung und Behebung technischer Fehler.
          Erfasst werden: Stack-Traces, Browser-Daten, fehlerhafte URLs.
          Personenbezogene Daten werden nicht gezielt erfasst (`sendDefaultPii: false`),
          Session Replays nur bei Fehlern und mit allen Texten maskiert.
        </p>
        <p>
          Rechtsgrundlage: Berechtigtes Interesse an Stabilität und Sicherheit
          (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </section>

      <section>
        <h2>6. Speicherdauer</h2>
        <ul>
          <li>Konto-Daten: bis zur Löschung des Kontos oder 3 Jahre nach letztem Login</li>
          <li>Zahlungsdaten: 10 Jahre gemäß § 147 AO (Aufbewahrungsfrist)</li>
          <li>Chat-Verläufe: bis zur Kontolöschung</li>
          <li>Server-Logfiles: 14 Tage</li>
          <li>Sentry-Fehler-Events: 90 Tage</li>
          <li>PostHog-Events: 12 Monate</li>
        </ul>
      </section>

      <section>
        <h2>7. Datenübermittlung in Drittländer</h2>
        <p>
          Einige Dienstleister verarbeiten Daten in den USA. Wir haben dafür
          Standardvertragsklauseln (Art. 46 DSGVO) abgeschlossen und prüfen
          regelmäßig zusätzliche Schutzmaßnahmen. Wo immer möglich, wählen wir
          EU-Hosting (Supabase, Stripe EU, PostHog EU, Sentry EU).
        </p>
      </section>

      <section>
        <h2>8. Automatisierte Entscheidungsfindung</h2>
        <p>
          Unser Coaching-Bot nutzt KI (Large Language Models), um Ihnen
          individuelle Empfehlungen zu geben. Diese Antworten sind beratend
          und nicht rechtsverbindlich. Es findet keine automatisierte
          Entscheidung im Sinne von Art. 22 DSGVO mit rechtlicher Wirkung statt.
        </p>
      </section>

      <section>
        <h2>9. Sicherheit</h2>
        <p>
          Wir verwenden TLS-Verschlüsselung für die gesamte Datenübertragung,
          Row-Level Security in der Datenbank, getrennte Server-Zugriffe
          (Service-Role-Keys) und protokollieren administrative Zugriffe.
          Mitarbeiter mit Datenzugriff sind auf Vertraulichkeit verpflichtet.
        </p>
      </section>

      <section>
        <h2>10. Kontakt für Datenschutzfragen</h2>
        <p>
          Bei Fragen oder Anliegen zum Datenschutz wenden Sie sich an:{' '}
          <a href="mailto:info@argumentorik.com">info@argumentorik.com</a>
        </p>
      </section>

      <p className="text-white/40 text-sm mt-12">
        Siehe auch unser{' '}
        <Link to="/impressum" className="underline hover:text-[#BFFF00]">
          Impressum
        </Link>
        ,{' '}
        <Link to="/agb" className="underline hover:text-[#BFFF00]">
          AGB
        </Link>{' '}
        und{' '}
        <Link to="/widerruf" className="underline hover:text-[#BFFF00]">
          Widerrufsbelehrung
        </Link>
        .
      </p>
    </LegalLayout>
  );
}
