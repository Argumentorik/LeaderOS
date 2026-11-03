import { Link } from 'react-router-dom';
import LegalLayout from '../../components/legal/LegalLayout';

export default function AGBPage() {
  return (
    <LegalLayout title="Allgemeine Geschäftsbedingungen (AGB)">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-8 text-sm text-amber-100">
        <strong>Hinweis:</strong> Diese AGB sind ein Grundgerüst und decken
        die wichtigsten Punkte ab. Für eine vollständig rechtssichere Fassung
        empfehlen wir die Prüfung durch einen Fachanwalt für IT-Recht.
      </div>

      <p className="text-white/60 text-sm">
        Stand: {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>

      <section>
        <h2>§ 1 Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (im Folgenden „AGB") gelten
          für alle Verträge zwischen der
        </p>
        <p>
          <strong>Argumentorik-Akademie GmbH</strong><br />
          Tölzer Str. 1, 82031 Grünwald, Deutschland<br />
          (im Folgenden „Anbieter")
        </p>
        <p>
          und ihren Kunden (im Folgenden „Nutzer") über die Nutzung der
          Online-Plattform LeaderOS sowie damit verbundener Dienste.
        </p>
      </section>

      <section>
        <h2>§ 2 Leistungsbeschreibung</h2>
        <p>
          Der Anbieter stellt eine webbasierte Coaching- und Lernplattform
          („LeaderOS") zur Verfügung. Die Plattform umfasst je nach
          gebuchtem Tarif unter anderem:
        </p>
        <ul>
          <li>Zugang zu interaktiven Coaching-Modulen und Videokursen</li>
          <li>KI-gestützten Coaching-Bot („WladBot")</li>
          <li>Selbst-Diagnose-Tools auf leader-check.de</li>
          <li>Übungsaufgaben und Fortschritts-Tracking</li>
          <li>Community-Funktionen</li>
          <li>Optionale Live-Coaching-Sessions (je nach Tarif)</li>
        </ul>
        <p>
          Der Funktionsumfang und ggf. enthaltene Coaching-Stunden ergeben
          sich aus der jeweiligen Tarifbeschreibung im Bestellprozess.
        </p>
      </section>

      <section>
        <h2>§ 3 Vertragsschluss</h2>
        <p>
          Die Darstellung der Tarife auf der Plattform stellt kein bindendes
          Angebot dar. Erst mit der Bestellung gibt der Nutzer ein Angebot zum
          Abschluss eines Nutzungsvertrags ab. Der Vertrag kommt mit Annahme
          durch den Anbieter zustande, spätestens jedoch mit Bestätigung der
          erfolgreichen Zahlung.
        </p>
      </section>

      <section>
        <h2>§ 4 Preise und Zahlung</h2>
        <p>
          Es gelten die zum Zeitpunkt der Bestellung auf der Plattform
          ausgewiesenen Preise. Alle Preise verstehen sich in Euro (EUR)
          inklusive der jeweils geltenden gesetzlichen Umsatzsteuer.
        </p>
        <p>
          Die Zahlung erfolgt über den Zahlungsdienstleister Stripe Payments
          Europe Ltd. Bei Ratenzahlungen werden die einzelnen Raten zu den im
          Tarif angegebenen Terminen automatisch eingezogen.
        </p>
      </section>

      <section>
        <h2>§ 5 Widerrufsrecht</h2>
        <p>
          Verbraucher haben grundsätzlich ein vierzehntägiges Widerrufsrecht.
          Einzelheiten regelt unsere{' '}
          <Link to="/widerruf" className="underline hover:text-[#BFFF00]">
            Widerrufsbelehrung
          </Link>
          .
        </p>
        <p>
          Bei einem ausdrücklichen Wunsch des Nutzers, mit der Ausführung des
          Vertrags vor Ablauf der Widerrufsfrist zu beginnen, und mit der
          Kenntnisnahme dieses Hinweises, erlischt das Widerrufsrecht für
          digitale Inhalte vorzeitig (§ 356 Abs. 5 BGB).
        </p>
      </section>

      <section>
        <h2>§ 6 Nutzungsrechte</h2>
        <p>
          Der Nutzer erhält ein einfaches, nicht übertragbares Recht zur
          Nutzung der Plattform für die Vertragslaufzeit. Die Inhalte
          (Texte, Videos, Frameworks, KI-Antworten) sind urheberrechtlich
          geschützt und dürfen nicht ohne Zustimmung des Anbieters
          vervielfältigt, weitergegeben oder kommerziell verwertet werden.
        </p>
        <p>
          Eine Weitergabe von Login-Daten an Dritte ist untersagt. Der
          Anbieter behält sich vor, bei Verstößen den Zugang zu sperren.
        </p>
      </section>

      <section>
        <h2>§ 7 Pflichten des Nutzers</h2>
        <p>Der Nutzer verpflichtet sich,</p>
        <ul>
          <li>bei Registrierung wahrheitsgemäße Angaben zu machen,</li>
          <li>seine Login-Daten geheim zu halten,</li>
          <li>die Plattform nicht missbräuchlich zu verwenden (insb. keine Massen-Automatisierung, kein Reverse-Engineering der KI),</li>
          <li>keine rechtswidrigen, beleidigenden oder diskriminierenden Inhalte zu posten.</li>
        </ul>
      </section>

      <section>
        <h2>§ 8 KI-gestützte Inhalte</h2>
        <p>
          Antworten des Coaching-Bots werden mit Hilfe von KI-Modellen (Large
          Language Models) erzeugt. Sie dienen der Inspiration und Reflexion,
          stellen jedoch keine professionelle Beratung im Sinne einer
          Rechts-, Steuer-, Medizin- oder Psychotherapieberatung dar. In
          ernsten persönlichen Krisen wenden Sie sich bitte an entsprechende
          Fachleute.
        </p>
        <p>
          Der Anbieter haftet nicht für die Richtigkeit oder Angemessenheit
          KI-generierter Antworten im Einzelfall, sondern für die
          ordnungsgemäße Bereitstellung der Plattform.
        </p>
      </section>

      <section>
        <h2>§ 9 Verfügbarkeit</h2>
        <p>
          Der Anbieter bemüht sich um eine möglichst hohe Verfügbarkeit der
          Plattform (Ziel: 99 % im Jahresmittel). Wartungsarbeiten und
          Ausfälle, die nicht im Verantwortungsbereich des Anbieters liegen
          (z. B. höhere Gewalt, Ausfall von Vorlieferanten), führen nicht zu
          Erstattungsansprüchen.
        </p>
      </section>

      <section>
        <h2>§ 10 Haftung</h2>
        <p>
          Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung
          des Lebens, des Körpers oder der Gesundheit, bei Vorsatz und grober
          Fahrlässigkeit sowie nach dem Produkthaftungsgesetz. Bei einfacher
          Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher
          Vertragspflichten (Kardinalpflichten); die Haftung ist auf den
          vertragstypischen, vorhersehbaren Schaden begrenzt.
        </p>
        <p>
          Eine weitergehende Haftung ist ausgeschlossen.
        </p>
      </section>

      <section>
        <h2>§ 11 Datenschutz</h2>
        <p>
          Die Verarbeitung personenbezogener Daten erfolgt nach den
          Bestimmungen unserer{' '}
          <Link to="/datenschutz" className="underline hover:text-[#BFFF00]">
            Datenschutzerklärung
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>§ 12 Vertragslaufzeit und Kündigung</h2>
        <p>
          Der Vertrag wird für die im Tarif ausgewiesene Laufzeit
          geschlossen. Bei Jahresverträgen verlängert sich die Laufzeit nicht
          automatisch, sofern nicht ausdrücklich anders vereinbart. Eine
          außerordentliche Kündigung aus wichtigem Grund bleibt beiden
          Parteien vorbehalten.
        </p>
      </section>

      <section>
        <h2>§ 13 Änderungen der AGB</h2>
        <p>
          Der Anbieter behält sich vor, diese AGB mit Wirkung für die Zukunft
          zu ändern. Änderungen werden den Nutzern per E-Mail mitgeteilt.
          Widerspricht der Nutzer nicht innerhalb von sechs Wochen nach
          Mitteilung, gilt die Änderung als angenommen.
        </p>
      </section>

      <section>
        <h2>§ 14 Schlussbestimmungen</h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss
          des UN-Kaufrechts. Gegenüber Verbrauchern bleiben zwingende
          Verbraucherschutzvorschriften des Heimatlandes unberührt.
        </p>
        <p>
          Gerichtsstand für Kaufleute, juristische Personen des öffentlichen
          Rechts und öffentlich-rechtliche Sondervermögen ist München.
        </p>
        <p>
          Sollten einzelne Bestimmungen unwirksam sein, bleibt der Vertrag
          im Übrigen wirksam. An die Stelle der unwirksamen Bestimmung tritt
          die gesetzliche Regelung.
        </p>
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
        <Link to="/widerruf" className="underline hover:text-[#BFFF00]">
          Widerrufsbelehrung
        </Link>
        .
      </p>
    </LegalLayout>
  );
}
