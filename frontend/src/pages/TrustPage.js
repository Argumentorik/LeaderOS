import { Shield, Lock, FileCheck, Globe, Brain, Server, KeyRound, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const FRAMEWORKS = [
  {
    icon: FileCheck, code: 'SOC 2', status: 'Audit-ready',
    title: 'SOC 2 — Kontrollen implementiert',
    desc: 'Zugriffskontrollen, vollständiger Audit-Trail aller sicherheitsrelevanten Aktionen, Session-Management mit automatischem Ablauf, Least-Privilege-Adminrechte und kontinuierliches Monitoring. Die Kontrollen sind auditfähig dokumentiert — eine formale SOC-2-Attestierung erfolgt durch einen externen Prüfer.',
  },
  {
    icon: Shield, code: 'ISO 27001', status: 'Aligned',
    title: 'ISO 27001 — ISMS-orientierte Sicherheit',
    desc: 'Informationssicherheits-Praktiken nach ISO-27001-Prinzipien: Verschlüsselung im Transit (TLS 1.2+), gehashte Zugangsdaten (bcrypt) und Lizenz-Keys (SHA-256), rollenbasierte Zugriffe, dokumentierte Incident-Response und regelmäßige Sicherheits-Audits (zuletzt 4 bestandene Audits in Folge).',
  },
  {
    icon: Globe, code: 'DSGVO', status: 'Konform',
    title: 'DSGVO — EU-Datenschutz umgesetzt',
    desc: 'Volle Betroffenenrechte direkt in der App: Datenauskunft als Ein-Klick-Export (Art. 15), vollständige Konto-Löschung mit Kaskade über alle Datenbestände inkl. hochgeladener Dateien (Art. 17), Datenminimierung, Zweckbindung und transparente Datenschutzerklärung. Auftragsverarbeiter sind vertraglich gebunden.',
  },
  {
    icon: Brain, code: 'NIST AI RMF', status: 'Aligned',
    title: 'NIST AI RMF — KI-Risiken gemanagt',
    desc: 'Unsere KI-Systeme folgen dem NIST AI Risk Management Framework: Eingaben werden klassifiziert und geroutet (Klassifikations-Bot), Antworten sind quellengebunden (RAG auf Wlads geprüfte Inhalte statt freiem Modellwissen), Ausgaben sind als KI-generiert erkennbar und der Mensch behält jederzeit die Kontrolle.',
  },
  {
    icon: Eye, code: 'ISO 42001', status: 'Aligned',
    title: 'ISO 42001 — Verantwortungsvolle KI-Governance',
    desc: 'KI-Governance nach ISO-42001-Prinzipien: dokumentierte Modell- und Prompt-Versionierung, keine Nutzung deiner Daten zum Training von Fremdmodellen, klar definierte KI-Zwecke (Coaching, Analyse, Simulation) und Feedback-Kanäle zur kontinuierlichen Verbesserung.',
  },
  {
    icon: Server, code: 'HIPAA', status: 'Nicht im Scope',
    title: 'HIPAA — Keine Gesundheitsdaten',
    desc: 'Leader-OS verarbeitet keine geschützten Gesundheitsinformationen (PHI). HIPAA ist daher nicht anwendbar — sollten künftig Gesundheitsdaten verarbeitet werden, erweitern wir unsere Kontrollen entsprechend.',
  },
];

const PRACTICES = [
  { icon: Lock, text: 'TLS-Verschlüsselung für alle Verbindungen · Passwörter mit bcrypt gehasht · Lizenz-Keys nur als SHA-256-Hash gespeichert' },
  { icon: KeyRound, text: 'Magic-Link & Google-Login (verwalteter OAuth-Flow) · Brute-Force-Schutz mit Rate-Limiting · Geräte-Erkennung mit Sicherheits-E-Mail bei neuem Login' },
  { icon: Trash2, text: 'Datei-Uploads: nur authentifizierter Zugriff, Eigentümer-gebunden, MIME- & Größen-Validierung, Soft-Delete mit Audit-Eintrag' },
  { icon: Eye, text: 'Vollständiger Audit-Trail: Logins, Uploads, Löschungen, Admin-Aktionen und Lizenz-Einlösungen werden protokolliert' },
];

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" data-testid="trust-page">
      <div className="max-w-4xl mx-auto px-6 py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/40 hover:text-[#BFFF00] transition-colors mb-10">
          <ArrowLeft size={13} /> Zurück zu Leader·OS
        </Link>

        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#BFFF00] mb-3">Trust Center</p>
        <h1 className="text-4xl sm:text-5xl font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Sicherheit & Compliance.
        </h1>
        <p className="text-base text-white/55 max-w-2xl mb-12 leading-relaxed">
          Leader·OS verarbeitet die Führungs- und Kommunikationsdaten von über 2.500 Leadern.
          Deshalb behandeln wir Sicherheit nicht als Feature, sondern als Fundament — hier ist der aktuelle Stand, transparent und ohne Marketing-Nebel.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {FRAMEWORKS.map((f) => (
            <div key={f.code} className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.07] hover:border-[#BFFF00]/25 transition-colors" data-testid={`trust-card-${f.code.toLowerCase().replace(/\s/g, '-')}`}>
              <div className="flex items-center justify-between mb-3">
                <f.icon size={20} className="text-[#BFFF00]" />
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  f.status === 'Konform' ? 'bg-emerald-400/15 text-emerald-300'
                  : f.status === 'Nicht im Scope' ? 'bg-white/8 text-white/40'
                  : 'bg-[#BFFF00]/12 text-[#BFFF00]'
                }`}>{f.status}</span>
              </div>
              <h2 className="text-base font-bold mb-2">{f.title}</h2>
              <p className="text-[12.5px] text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-black mb-5" style={{ fontFamily: 'Outfit, sans-serif' }}>Gelebte Praxis — jeden Tag.</h2>
        <div className="space-y-3 mb-14">
          {PRACTICES.map((p, i) => (
            <div key={`p-${i}`} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <p.icon size={15} className="text-[#BFFF00] mt-0.5 shrink-0" />
              <p className="text-[12.5px] text-white/60 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6 bg-[#BFFF00]/[0.05] border border-[#BFFF00]/20">
          <h3 className="text-sm font-black mb-2">Deine Daten, deine Kontrolle.</h3>
          <p className="text-[12.5px] text-white/55 leading-relaxed">
            Im Profil kannst du jederzeit alle deine Daten als JSON exportieren (Art. 15 DSGVO) oder dein Konto
            vollständig und unwiderruflich löschen (Art. 17 DSGVO) — inklusive aller Chats, Analysen und hochgeladener Dateien.
            Fragen zu Sicherheit oder Datenschutz? <a href="mailto:datenschutz@leaderos.de" className="text-[#BFFF00] underline underline-offset-2">datenschutz@leaderos.de</a>
          </p>
        </div>

        <div className="mt-10 flex gap-5 text-[11px] text-white/35">
          <Link to="/datenschutz" className="hover:text-[#BFFF00] transition-colors">Datenschutzerklärung</Link>
          <Link to="/impressum" className="hover:text-[#BFFF00] transition-colors">Impressum</Link>
          <Link to="/agb" className="hover:text-[#BFFF00] transition-colors">AGB</Link>
        </div>
      </div>
    </div>
  );
}
