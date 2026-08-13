/**
 * Datenschutzerklärung — DSGVO-konforme Privacy Policy.
 *
 * ⚠️ Anwalts-Review innerhalb von 7 Tagen empfohlen. Diese Version deckt
 * das gesetzliche Minimum ab und nennt alle Auftragsverarbeiter.
 */
import { useLanguage } from '../contexts/LanguageContext';

import { useSeo } from '../lib/seo';
const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-white font-bold text-base mb-2">{title}</h2>
    <div className="text-white/75 text-[13px] leading-relaxed space-y-2">{children}</div>
  </section>
);

const ProcessorRow = ({ name, country, purpose, basis, data }) => (
  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] my-2">
    <p className="text-white font-bold text-[12px]">{name}</p>
    <p className="text-white/50 text-[10px] mt-0.5">{country}</p>
    <div className="mt-2 grid sm:grid-cols-3 gap-2 text-[11px]">
      <div><span className="text-white/40 block">Zweck</span><span className="text-white/80">{purpose}</span></div>
      <div><span className="text-white/40 block">Rechtsgrundlage</span><span className="text-white/80">{basis}</span></div>
      <div><span className="text-white/40 block">Daten</span><span className="text-white/80">{data}</span></div>
    </div>
  </div>
);

export default function DatenschutzPage() {
  useSeo({
    path: '/datenschutz',
    title: 'Datenschutzerklärung — Leader-OS',
    description: 'Datenschutzerklärung von Leader-OS: welche Daten wir verarbeiten, wozu, wie lange und welche Rechte du hast.',
  });

  const { lang } = useLanguage();
  const de = lang === 'de';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white py-12 px-6" data-testid="datenschutz-page">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="inline-flex items-center gap-2 text-[#BFFF00] text-[12px] mb-6 hover:underline">← {de ? 'Zurück' : 'Back'}</a>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">{de ? 'Datenschutzerklärung' : 'Privacy Policy'}</h1>
        <p className="text-white/60 text-[12px] mb-10">{de ? 'Information nach DSGVO Art. 13/14' : 'Information pursuant to GDPR Art. 13/14'}</p>

        <Section title={de ? '1. Verantwortlicher' : '1. Controller'}>
          <p>
            Argumentorik-Akademie GmbH<br />
            Geschäftsführer: Wladislaw Jachtchenko<br />
            Tölzer Str. 1, 82031 Grünwald<br />
            HRB München 279998 · USt-IdNr. DE 357468654<br />
            E-Mail: <a href="mailto:info@argumentorik.com" className="text-[#BFFF00] hover:underline">info@argumentorik.com</a> ({de ? 'Datenschutz-Anfragen ebenfalls hier' : 'Privacy requests also here'})
          </p>
        </Section>

        <Section title={de ? '2. Welche Daten verarbeiten wir?' : '2. What data do we process?'}>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">{de ? 'Account-Daten' : 'Account data'}:</strong> E-Mail, Name, Passwort (gehasht).</li>
            <li><strong className="text-white">{de ? 'Nutzungs-Daten' : 'Usage data'}:</strong> Chat-Verläufe, Tagesfragen, Video-Antworten, Quiz-Ergebnisse, XP/Level.</li>
            <li><strong className="text-white">{de ? 'Zahlungs-Daten' : 'Payment data'}:</strong> Wir speichern KEINE Kreditkarten — Stripe verarbeitet das direkt.</li>
            <li><strong className="text-white">{de ? 'Technische Daten' : 'Technical data'}:</strong> IP-Adresse (anonymisiert), Browser, Gerätetyp — für Sicherheit und Performance.</li>
          </ul>
        </Section>

        <Section title={de ? '3. Auftragsverarbeiter & Drittanbieter' : '3. Processors & third parties'}>
          <p className="mb-3">
            {de
              ? 'Wir nutzen folgende externe Dienstleister zur Bereitstellung unseres Services. Mit allen sind Auftragsverarbeitungsverträge (AVV) geschlossen, soweit erforderlich.'
              : 'We use the following processors. Data Processing Agreements (DPAs) are in place where required.'}
          </p>
          <ProcessorRow name="Vercel Inc." country="USA (DPF-zertifiziert)" purpose="Hosting Frontend" basis="Art. 6(1)(b) DSGVO" data="HTTP-Logs, IP (kurzfristig)" />
          <ProcessorRow name="MongoDB Atlas" country="EU (Frankfurt)" purpose="Primäre Datenbank" basis="Art. 6(1)(b) DSGVO" data="Account, Nutzungsdaten" />
          <ProcessorRow name="Supabase" country="EU (Frankfurt)" purpose="Analytics-Mirror + RAG" basis="Art. 6(1)(b), (f) DSGVO" data="User-Mirror, Lernfortschritt" />
          <ProcessorRow name="Stripe Payments Europe Ltd." country="Irland" purpose="Zahlungsabwicklung" basis="Art. 6(1)(b) DSGVO" data="Name, E-Mail, Karte (durch Stripe)" />
          <ProcessorRow name="Sentry (functional)" country="EU (Frankfurt)" purpose="Fehler-Tracking" basis="Art. 6(1)(f) DSGVO" data="Stacktraces, anonymisierte IP" />
          <ProcessorRow name="PostHog (analytics)" country="EU (Frankfurt)" purpose="Produkt-Analytics" basis="Art. 6(1)(a) DSGVO (Einwilligung)" data="Event-Logs, anonymisiert" />
          <ProcessorRow name="Resend" country="USA (DPF-zertifiziert)" purpose="Transaktions-E-Mails" basis="Art. 6(1)(b) DSGVO" data="E-Mail, Name, Inhalt" />
          <ProcessorRow name="ElevenLabs Inc." country="USA" purpose="Voice-Mode (Sprachausgabe)" basis="Art. 6(1)(a) DSGVO (Einwilligung)" data="Text-Inhalte, kein Stimm-Material" />
          <ProcessorRow name="OpenAI / Anthropic / Google (via Emergent LLM)" country="USA (DPF-zertifiziert)" purpose="KI-Coaching-Antworten" basis="Art. 6(1)(b) DSGVO" data="Chat-Anfragen, Daily-Check-Ins" />
        </Section>

        <Section title={de ? '4. Cookies & Tracking' : '4. Cookies & tracking'}>
          <p>
            {de
              ? 'Wir setzen technisch notwendige Cookies (Login-Session) automatisch. Analyse-Cookies (PostHog) und Session-Replay (Sentry) nur mit deiner aktiven Einwilligung über unseren Cookie-Banner. Du kannst deine Einwilligung jederzeit unter "Profil → Datenschutz" widerrufen.'
              : 'We set strictly necessary cookies (login session) automatically. Analytics (PostHog) and session replay (Sentry) only with your active consent via our cookie banner. You can withdraw consent anytime under "Profile → Privacy".'}
          </p>
        </Section>

        <Section title={de ? '5. Automatisierte Entscheidungsfindung' : '5. Automated decision-making'}>
          <p>
            {de
              ? 'Unser KI-Coach (WladBot) generiert personalisierte Antworten basierend auf deinen Eingaben. Diese sind beratend, treffen aber KEINE rechtsverbindlichen Entscheidungen über dich (z.B. Krediteinstufung). Du kannst die KI-Antworten jederzeit ignorieren und menschliches Coaching (per E-Mail) anfordern.'
              : 'Our AI Coach (WladBot) generates personalized responses based on your inputs. These are advisory and do NOT make legally binding decisions about you. You can ignore AI responses anytime and request human coaching via email.'}
          </p>
        </Section>

        <Section title={de ? '6. Deine Rechte' : '6. Your rights'}>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">{de ? 'Auskunft' : 'Access'}</strong> (Art. 15 DSGVO): {de ? 'Welche Daten wir über dich gespeichert haben.' : 'What data we store about you.'}</li>
            <li><strong className="text-white">{de ? 'Berichtigung' : 'Rectification'}</strong> (Art. 16 DSGVO): {de ? 'Korrektur falscher Daten.' : 'Correction of inaccurate data.'}</li>
            <li><strong className="text-white">{de ? 'Löschung' : 'Erasure'}</strong> (Art. 17 DSGVO): {de ? '"Recht auf Vergessenwerden". Direkt unter Profil → Konto löschen.' : '"Right to be forgotten". Available under Profile → Delete account.'}</li>
            <li><strong className="text-white">{de ? 'Datenübertragbarkeit' : 'Portability'}</strong> (Art. 20 DSGVO): {de ? 'Export deiner Daten als JSON.' : 'Export of your data as JSON.'}</li>
            <li><strong className="text-white">{de ? 'Widerspruch' : 'Objection'}</strong> (Art. 21 DSGVO): {de ? 'Gegen Verarbeitung auf Basis berechtigten Interesses.' : 'Against processing based on legitimate interest.'}</li>
            <li><strong className="text-white">{de ? 'Beschwerderecht' : 'Complaint'}</strong> (Art. 77 DSGVO): {de ? 'Bei deiner Aufsichtsbehörde, z.B. Berliner Beauftragte für Datenschutz.' : 'With your supervisory authority.'}</li>
          </ul>
          <p className="mt-3">{de ? 'Anfragen bitte an' : 'Requests to'}: <a href="mailto:info@argumentorik.com" className="text-[#BFFF00] hover:underline">info@argumentorik.com</a></p>
        </Section>

        <Section title={de ? '7. Speicherdauer' : '7. Retention period'}>
          <p>
            {de
              ? 'Account-Daten: bis Account-Löschung. Rechnungen: 10 Jahre (steuerlich). Logs: 90 Tage. Analytics: 12 Monate.'
              : 'Account data: until account deletion. Invoices: 10 years (tax requirement). Logs: 90 days. Analytics: 12 months.'}
          </p>
        </Section>

        <p className="text-white/40 text-[10px] mt-12">{de ? 'Stand' : 'Last updated'}: Mai 2026 · v1.0</p>
      </div>
    </div>
  );
}
