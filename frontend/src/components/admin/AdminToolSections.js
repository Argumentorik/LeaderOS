import { RagDebugStudio } from './RagDebugStudio';
import { RagControlCenter } from './RagControlCenter';
import { LearningVideosManager } from './LearningVideosManager';
import { LicenseKeysManager } from './LicenseKeysManager';
import { MasterclassClientsManager } from './MasterclassClientsManager';
import { ConversionCenter } from './ConversionCenter';
import { LiveTestPanel } from './LiveTestPanel';
import { GuideStudio } from './GuideStudio';
import { CourseEpisodesManager } from './CourseEpisodesManager';
import { PageLoadOverview } from './PageLoadOverview';

/* Titled admin tool sections, rendered in this order below the overview cards. */
const SECTIONS = [
  {
    key: 'rag', mt: 'mt-2', title: 'RAG Control Center',
    de: 'Wlads Wissensbasis verwalten: neu einlesen (ZIP), Chunk-Status live, Golden-Question-Selbsttest nach jedem Deploy.',
    en: "Manage Wlad's knowledge base: re-ingest (ZIP), live chunk status, golden-question self-test after every deploy.",
    render: (de) => <RagControlCenter de={de} />,
  },
  {
    key: 'page-loads', mt: 'mt-2', title: (de) => (de ? 'Ladezeiten · Seiten im Blick' : 'Load Times · Pages at a Glance'),
    de: 'Wie schnell steht jede Seite wirklich beim Nutzer? Gemessen im Browser, Ausreißer werden rot markiert.',
    en: 'How fast does each page really appear for users? Measured in the browser, outliers are flagged red.',
    render: (de) => <PageLoadOverview de={de} />,
  },
  {
    key: 'rag-debug', mt: 'mt-2', title: (de) => (de ? 'WladBot Wissens-Studio' : 'WladBot Knowledge Studio'),
    de: 'Sieh genau welche Wlad-Chunks WladBot für jede Frage findet — Coverage-Lücken vor den Usern entdecken.',
    en: 'See exactly which Wlad chunks WladBot retrieves for any question — spot coverage gaps before users do.',
    render: () => <RagDebugStudio />,
  },
  {
    key: 'guide', title: (de) => (de ? 'Guide Studio · Wlad-Avatar-Videos' : 'Guide Studio · Wlad Avatar Videos'),
    de: 'Onboarding-, Mission- und Social-Clips mit dem 3D-Wlad. Reihenfolge: Skript speichern → Stimme → Keyframe prüfen → Cinematic rendern → Freigeben. Nichts wird Nutzern gezeigt, bevor du freigibst.',
    en: 'Onboarding, mission and social clips with the 3D Wlad. Order: save script → voice → check keyframe → render cinematic → publish. Nothing is shown to users before you approve.',
    render: () => <GuideStudio />,
  },
  {
    key: 'course-videos', title: (de) => (de ? 'Kurs-Folgen · Video (Vimeo oder Upload)' : 'Course Episodes · Video (Vimeo or Upload)'),
    de: 'Pro Folge Vimeo-Link einfügen oder eigenes Video hochladen (MP4/MOV bis 2 GB, Fortschritt sichtbar). Sofort live. Vorschaubild per Sekunde wählbar, Download für Detailarbeit außerhalb.',
    en: 'Per episode: paste a Vimeo link or upload your own video (MP4/MOV up to 2 GB with progress). Live instantly. Pick the thumbnail second, download for external editing.',
    render: () => <CourseEpisodesManager />,
  },
  {
    key: 'videos', title: (de) => (de ? 'Lernvideos · Vimeo-Verwaltung' : 'Learning Videos · Vimeo Manager'),
    de: 'Hinterlege Vimeo-IDs / URLs für die 10 Kurse. Sobald gespeichert spielt der In-App-Player ohne Code-Deploy.',
    en: 'Drop Vimeo IDs / URLs into the 10-course catalogue. The in-app player picks them up live, no deploy needed.',
    render: () => <LearningVideosManager />,
  },
  {
    key: 'masterclass', title: (de) => (de ? 'Masterclass-Kunden · Direktzugang' : 'Masterclass Clients · Direct Access'),
    de: 'Lege Masterclass-Kunden mit individueller Laufzeit (6/12/18 Monate) und Startdatum an — der Zugang ist sofort aktiv, der Kunde loggt sich per Magic Link ein. 7 Tage vor Ablauf geht automatisch eine Erinnerung raus, danach folgt der Auto-Downgrade.',
    en: 'Add masterclass clients with individual terms (6/12/18 months) and start dates — access is active instantly, clients log in via Magic Link. Expiry reminder 7 days before, then auto-downgrade.',
    render: (de) => <MasterclassClientsManager de={de} />,
  },
  {
    key: 'conversion', title: 'Conversion Center · Masterclass → Leader-OS',
    de: 'Die 8-teilige E-Mail-Serie für die ~400 Masterclass-Kunden. NICHTS geht raus, bevor du es hier freigibst — Vorschau, Test-Mail an dich, dann einzeln freigeben.',
    en: 'The 8-part email series for the ~400 masterclass clients. NOTHING is sent before you approve it here — preview, test-send, then approve one by one.',
    render: (de) => <ConversionCenter de={de} />,
  },
  {
    key: 'license', title: (de) => (de ? 'Lizenz-Keys · Sales-Aktivierung' : 'License Keys · Sales Activation'),
    de: 'Generiere 16-stellige Aktivierungscodes für telefonisch verkaufte Pakete. Kunde löst den Key auf der Login-Seite ein — Paket wird sofort freigeschaltet.',
    en: 'Generate 16-character activation codes for phone-sold packages. The customer redeems the key on the login page — package unlocks instantly.',
    render: (de) => <LicenseKeysManager de={de} />,
  },
  {
    key: 'livetest', title: (de) => (de ? '1-€-Livetest · Release-Gate' : '€1 Live Test · Release Gate'),
    de: 'Schalte Kolleg:innen für den 1-€-Kauf frei und schick ihnen den fertigen Ablauf. Sie starten bei null, zahlen 1 € über den echten Stripe-Checkout, bekommen die Stripe-Rechnung per Mail und den vollen Zugang — ohne dass wir irgendwas in der Datenbank anfassen.',
    en: 'Unlock colleagues for the €1 purchase and send them the ready-made steps. They start from zero, pay €1 through the real Stripe checkout, receive the Stripe invoice by email and full access — without us touching the database.',
    render: (de) => <LiveTestPanel de={de} />,
  },
];

export const AdminToolSections = ({ de }) => SECTIONS.map((s) => (
  <div key={s.key} className={s.mt || 'mt-6'}>
    <div className="mb-3">
      <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{typeof s.title === 'function' ? s.title(de) : s.title}</h2>
      <p className="text-[11px] text-muted-foreground">{de ? s.de : s.en}</p>
    </div>
    {s.render(de)}
  </div>
));
