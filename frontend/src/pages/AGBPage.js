/**
 * AGB — Allgemeine Geschäftsbedingungen.
 *
 * ⚠️ ANWALTS-REVIEW PFLICHT INNERHALB VON 7 TAGEN.
 * Diese Version ist eine Basis-Vorlage und deckt nicht alle
 * branchen-spezifischen Sonderfälle ab.
 */
import { useLanguage } from '../contexts/LanguageContext';

const Section = ({ num, title, children }) => (
  <section className="mb-8">
    <h2 className="text-white font-bold text-base mb-2">{num}. {title}</h2>
    <div className="text-white/75 text-[13px] leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function AGBPage() {
  const { lang } = useLanguage();
  const de = lang === 'de';

  if (!de) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <a href="/" className="text-[#BFFF00] text-[12px]">← Back</a>
          <h1 className="text-3xl sm:text-4xl font-black mt-6 mb-4">Terms of Service</h1>
          <p className="text-white/70">English version coming soon. Please refer to the German version (Allgemeine Geschäftsbedingungen) which is the legally binding version.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white py-12 px-6" data-testid="agb-page">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="inline-flex items-center gap-2 text-[#BFFF00] text-[12px] mb-6 hover:underline">← Zurück</a>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">Allgemeine Geschäftsbedingungen</h1>
        <p className="text-amber-300 text-[12px] mb-10">⚠️ Vorläufige Fassung — Anwalts-Review ausstehend</p>

        <Section num="1" title="Geltungsbereich">
          <p>
            Diese AGB gelten für sämtliche Verträge zwischen der <strong>Argumentorik-Akademie GmbH</strong>, Tölzer Str. 1, 82031 Grünwald, vertreten durch den Geschäftsführer Wladislaw Jachtchenko (HRB München 279998, USt-IdNr. DE 357468654), nachfolgend „Anbieter" und seinen Kunden („Kunde") über die Nutzung der Plattform Leader-OS (leader-os.de). Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
          </p>
        </Section>

        <Section num="2" title="Vertragsgegenstand">
          <p>
            Leader-OS ist eine SaaS-Plattform für Leadership-Coaching, basierend auf KI-Technologien und Wlad Jachtchenkos Methodik. Der Funktionsumfang ergibt sich aus der jeweiligen Tier-Beschreibung auf leader-os.de/pricing.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Leadership OS</strong> (997,00 €): 12-monatiger Zugriff auf Coaching-Bot, Workflows, Daily Check-ins.</li>
            <li><strong className="text-white">Leadership OS PLUS</strong> (4.797,00 €): Zusätzlich Video-Analyse, Simulationen, persönliches Onboarding.</li>
            <li><strong className="text-white">Enterprise</strong>: Individuelles Angebot nach Anfrage.</li>
          </ul>
        </Section>

        <Section num="3" title="Vertragsschluss">
          <p>
            Die Darstellung der Tiers auf der Website stellt kein verbindliches Angebot dar. Durch Klick auf „Jetzt buchen" und Bezahlung über Stripe gibt der Kunde ein Angebot ab. Der Vertrag kommt mit Bestätigungs-E-Mail durch den Anbieter zustande.
          </p>
        </Section>

        <Section num="4" title="Preise & Zahlung">
          <p>
            Alle Preise verstehen sich in Euro inklusive gesetzlicher Umsatzsteuer (sofern anwendbar). Zahlung erfolgt per Stripe (Kreditkarte, SEPA-Lastschrift oder vergleichbar). Bei Ratenzahlung gilt: Verzug einer Rate berechtigt den Anbieter zur sofortigen Sperrung des Accounts bis zur Zahlung.
          </p>
        </Section>

        <Section num="5" title="Widerrufsrecht">
          <p>
            Verbraucher haben ein 14-tägiges Widerrufsrecht nach § 355 BGB. Details siehe <a href="/widerruf" className="text-[#BFFF00] hover:underline">Widerrufsbelehrung</a>.
          </p>
          <p className="text-amber-200/80">
            <strong>Wichtig:</strong> Bei digitalen Inhalten (KI-Coaching, Video-Trainings) erlischt das Widerrufsrecht, sobald der Kunde nach Vertragsschluss ausdrücklich der vorzeitigen Ausführung zustimmt und gleichzeitig den Verlust des Widerrufsrechts bestätigt.
          </p>
        </Section>

        <Section num="6" title="Pflichten des Kunden">
          <ul className="list-disc pl-5 space-y-1">
            <li>Wahrheitsgemäße Angaben bei der Registrierung.</li>
            <li>Geheimhaltung der Zugangsdaten.</li>
            <li>Keine Weitergabe von Inhalten an Dritte ohne schriftliche Zustimmung.</li>
            <li>Keine missbräuchliche Nutzung der KI (z.B. Generierung rechtswidriger Inhalte).</li>
          </ul>
        </Section>

        <Section num="7" title="Haftung">
          <p>
            Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie nach dem Produkthaftungsgesetz. Bei einfacher Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) und begrenzt auf den vertragstypisch vorhersehbaren Schaden.
          </p>
          <p>
            <strong className="text-white">Wichtig zu KI-Antworten:</strong> Die KI-generierten Coaching-Antworten sind beratend, ersetzen aber keine persönliche Beratung. Der Anbieter übernimmt keine Haftung für Entscheidungen, die der Kunde auf Basis der KI-Empfehlungen trifft.
          </p>
        </Section>

        <Section num="8" title="Verfügbarkeit">
          <p>
            Der Anbieter strebt eine Verfügbarkeit von 99% im Jahresmittel an. Wartungsfenster werden nach Möglichkeit angekündigt. Kein Anspruch auf 100% Uptime.
          </p>
        </Section>

        <Section num="9" title="Datenschutz">
          <p>
            Die Verarbeitung personenbezogener Daten erfolgt gemäß <a href="/datenschutz" className="text-[#BFFF00] hover:underline">Datenschutzerklärung</a>.
          </p>
        </Section>

        <Section num="10" title="Vertragsdauer & Kündigung">
          <p>
            Der Vertrag läuft über den im Tier definierten Zeitraum (12 Monate Leadership OS) und endet automatisch. Eine vorzeitige Kündigung aus wichtigem Grund (§ 314 BGB) bleibt unberührt.
          </p>
        </Section>

        <Section num="11" title="Änderungen der AGB">
          <p>
            Der Anbieter behält sich vor, diese AGB mit angemessener Vorankündigung (mind. 30 Tage per E-Mail) zu ändern. Widerspricht der Kunde nicht innerhalb von 30 Tagen, gelten die Änderungen als angenommen.
          </p>
        </Section>

        <Section num="12" title="Schlussbestimmungen">
          <p>
            Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand für Kaufleute ist München. Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
          </p>
        </Section>

        <p className="text-white/40 text-[10px] mt-12">Stand: Mai 2026 · v1.0 (Vorläufige Fassung — Anwalts-Review ausstehend)</p>
      </div>
    </div>
  );
}
