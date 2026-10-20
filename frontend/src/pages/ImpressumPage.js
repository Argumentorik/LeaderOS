/**
 * Impressum · Anbieterkennzeichnung nach § 5 TMG und § 18 Abs. 2 MStV.
 *
 * ⚠️ TODO Mert: Fülle die Felder mit deinen offiziellen Geschäftsdaten aus
 * (Adresse, USt-IdNr., Telefon). Aktuelle Werte sind Platzhalter.
 */
import { useLanguage } from '../contexts/LanguageContext';

import { useSeo } from '../lib/seo';
export default function ImpressumPage() {
  useSeo({
    path: '/impressum',
    title: 'Impressum — Leader-OS',
    description: 'Impressum und Anbieterkennzeichnung von Leader-OS.',
  });

  const { lang } = useLanguage();
  const de = lang === 'de';
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white py-12 px-6" data-testid="impressum-page">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="inline-flex items-center gap-2 text-[#BFFF00] text-[12px] mb-6 hover:underline">← {de ? 'Zurück' : 'Back'}</a>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">Impressum</h1>
        <p className="text-white/60 text-[12px] mb-10">{de ? 'Angaben gemäß § 5 TMG' : 'Information pursuant to § 5 TMG'}</p>

        <section className="space-y-6 text-[13px] leading-relaxed">
          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Anbieter' : 'Provider'}</h2>
            <p className="text-white/80">
              Argumentorik-Akademie GmbH<br />
              Tölzer Str. 1<br />
              82031 Grünwald<br />
              {de ? 'Deutschland' : 'Germany'}
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Kontakt' : 'Contact'}</h2>
            <p className="text-white/80">
              {de ? 'E-Mail' : 'Email'}: <a href="mailto:info@argumentorik.com" className="text-[#BFFF00] hover:underline">info@argumentorik.com</a>
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Geschäftsführer' : 'Managing Director'}</h2>
            <p className="text-white/80">Wladislaw Jachtchenko</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Handelsregister' : 'Commercial Register'}</h2>
            <p className="text-white/80">Amtsgericht München, HRB 279998</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Umsatzsteuer-Identifikationsnummer' : 'VAT ID'}</h2>
            <p className="text-white/80">{de ? 'Gemäß § 27 a Umsatzsteuergesetz' : 'Pursuant to § 27a German VAT Act'}: DE 357468654</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Verantwortlich für den Inhalt' : 'Responsible for content'}</h2>
            <p className="text-white/80">{de ? 'nach § 18 Abs. 2 MStV' : 'pursuant to § 18 (2) MStV'}: Wladislaw Jachtchenko, Argumentorik-Akademie GmbH, Tölzer Str. 1, 82031 Grünwald</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">EU-{de ? 'Streitschlichtung' : 'Dispute resolution'}</h2>
            <p className="text-white/80">
              {de
                ? 'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: '
                : 'The European Commission provides a platform for online dispute resolution (ODR): '}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-[#BFFF00] hover:underline">https://ec.europa.eu/consumers/odr/</a>.<br />
              {de ? 'Unsere E-Mail-Adresse finden Sie oben im Impressum.' : 'Our email address is listed above.'}
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Verbraucherstreitbeilegung / Universalschlichtungsstelle' : 'Consumer dispute resolution'}</h2>
            <p className="text-white/80">
              {de
                ? 'Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.'
                : 'We are not willing or obligated to participate in dispute resolution proceedings before a consumer arbitration board.'}
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Haftung für Inhalte' : 'Content liability'}</h2>
            <p className="text-white/70 text-[12px]">
              {de
                ? 'Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.'
                : 'As a service provider, we are responsible for our own content on these pages in accordance with general laws. According to §§ 8 to 10 TMG, we are not obligated to monitor transmitted or stored third-party information.'}
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Haftung für Links' : 'Link liability'}</h2>
            <p className="text-white/70 text-[12px]">
              {de
                ? 'Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.'
                : 'Our offer contains links to external websites of third parties whose content we have no influence over. Therefore, we cannot assume any liability for these external contents.'}
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">{de ? 'Urheberrecht' : 'Copyright'}</h2>
            <p className="text-white/70 text-[12px]">
              {de
                ? 'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.'
                : 'The content and works on these pages created by the site operators are subject to German copyright law. Duplication, processing, distribution, or any form of commercialization beyond the scope of copyright law requires the written consent of the respective author or creator.'}
            </p>
          </div>
        </section>

        <p className="text-white/40 text-[10px] mt-12">{de ? 'Stand' : 'Last updated'}: Mai 2026</p>
      </div>
    </div>
  );
}
