import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { FileText, Download, Loader2, BookOpen, Trophy, BarChart3, Sparkles, Lock } from 'lucide-react';
import { useTier } from '../contexts/TierContext';
import { downloadHTMLReport } from '../lib/reportGenerator';
import api from '../lib/api';
import logger from '../lib/logger';
import { toast } from 'sonner';

/**
 * DownloadsPage — Central PDF library: Leadership Reports, 30-Tage-Plan,
 * Wlad's Book, Coaching-Reports. Free users see locked items with upgrade hint.
 */

const buildLeadershipReport = (user) => ({
  title: 'Leadership Report',
  subtitle: 'Persönliche Performance-Analyse',
  userName: user?.name,
  scores: [
    { label: 'KI-Kompetenz', value: user?.leadership_score || 0, color: '#BFFF00' },
    { label: 'Rhetorik', value: user?.communication_score || 0, color: '#6B8A00' },
    { label: 'EQ', value: user?.eq_score || 0, color: '#9ACC00' },
  ],
  sections: [
    { title: 'Aktueller Status', content: `Du befindest dich auf Level "${user?.level || 'Emerging Leader'}" mit ${user?.xp || 0} XP. Deine Top-Stärke ist deutlich erkennbar — nutze sie aktiv.`, type: 'info' },
    { title: 'Empfehlungen für die nächsten 30 Tage', content: ['Tägliche 5-Minuten Check-ins für EQ-Aufbau', 'Mindestens 2 Video-Missionen pro Woche', '1 Simulation pro Tag mit unterschiedlichen Agenten'], type: 'success' },
  ],
  footer: 'WladBot Leader OS · Powered by Wlad Jachtchenko Methodik',
});

const build30TagePlan = (user) => ({
  title: '30-Tage Leadership Programm',
  subtitle: 'Dein Aktionsplan',
  userName: user?.name,
  sections: [
    { title: 'Woche 1 — Foundation', content: 'Etabliere deine 5-Minuten-Check-in-Routine. Starte täglich mit einer klaren Intention. Beende den Tag mit einer Reflexion über die wichtigste Entscheidung.', type: 'info' },
    { title: 'Woche 2 — Communication', content: 'Übe 3 Konversationen mit dem Kommunikator-Agenten. Halte 1 echtes Gespräch pro Tag mit aktivem Zuhören (5 Ebenen).', type: 'info' },
    { title: 'Woche 3 — Decisions', content: 'Nutze die Entscheidungsmatrix für 2 reale Entscheidungen. Delegiere 3 Aufgaben mit klarem Befähigungs-Briefing.', type: 'success' },
    { title: 'Woche 4 — Mastery', content: 'Mache 2 Video-Missionen mit voller Selbstaufnahme. Reviewe deine Scores. Setze 1 großes Q1-Ziel.', type: 'success' },
  ],
});

const buildWladBook = (user) => ({
  title: 'Wlads Methodik · Kern-Frameworks',
  subtitle: 'Auszüge aus Weiße Rhetorik · Dunkle Rhetorik · Die 5 Rollen einer Führungskraft',
  userName: user?.name,
  sections: [
    { title: 'Die 3 Säulen der Überzeugung (Argumentorik)', content: 'Logos (Logik): Klare Argumente und Daten. Ethos (Glaubwürdigkeit): Kompetenz und Authentizität. Pathos (Emotion): Storytelling und emotionale Verbindung. Wahre Überzeugungskraft entsteht im Zusammenspiel aller drei.' },
    { title: 'Der Kommunikationsquadrant', content: '1. Sachebene: Was ist die Information? 2. Selbstoffenbarung: Was sage ich über mich? 3. Beziehungsebene: Wie steht es um uns? 4. Appell: Was will ich erreichen?' },
    { title: 'Die Feedbackformel', content: 'Beobachtung (was genau habe ich gesehen) + Wirkung (wie hat es auf mich gewirkt) + Wunsch (was wünsche ich mir konkret) = klares, nicht verletzendes Feedback.' },
    { title: 'Aktives Zuhören (5 Ebenen)', content: '1. Ignorieren · 2. So tun als ob · 3. Selektiv · 4. Aufmerksam · 5. Empathisch (gefühlte Bedeutung). Ziel ist immer Stufe 5.' },
    { title: 'Die 4 Gesprächstypen', content: 'Informieren · Überzeugen · Verhandeln · Konfrontieren. Wer den richtigen Typ identifiziert, gewinnt das Gespräch.' },
    { title: 'Die 5 Rollen einer Führungskraft', content: '1. Überzeugender Kommunikator · 2. Effektiver Manager · 3. Motivierender Team-Leader · 4. Empathischer Psychologe · 5. Strukturierter Problemlöser. Jede Rolle hat ihre eigenen Drills.' },
  ],
  footer: '© Wlad Jachtchenko · Originalbücher: „Weiße Rhetorik" (Goldmann) · „Dunkle Rhetorik" · „Die 5 Rollen einer Führungskraft" (remote-verlag)',
});

const buildLeadershipManifest = () => ({
  title: 'Leadership-Manifest',
  subtitle: '12 Prinzipien KI-nativer Führung',
  sections: [
    { title: 'Die 12 Prinzipien', content: [
      '1. Konsistenz schlägt Intensität — täglich besser ist mehr als monatlich brillant.',
      '2. Klarheit ist der ultimative Multiplikator — unklare Briefings produzieren unklares Output.',
      '3. Aktives Zuhören ist die seltenste Führungsfähigkeit.',
      '4. Delegation ist Befähigung, nicht Abschiebung.',
      '5. Feedback ohne Wunsch ist Kritik. Feedback mit Wunsch ist Führung.',
      '6. Emotion erzeugt Bewegung — Logik erzeugt Verstehen. Du brauchst beides.',
      '7. Du bist die Summe deiner 5 engsten Berater. Wähle bewusst.',
      '8. KI ist der Hebel. Disziplin ist der Drehpunkt.',
      '9. Transparenz schafft Vertrauen schneller als jede PR-Maßnahme.',
      '10. Konflikte gelöst zu vermeiden ist teurer als sie früh anzusprechen.',
      '11. Energie-Management schlägt Zeit-Management.',
      '12. Dein Output ist nur so gut wie deine 1. Stunde des Tages.',
    ], type: 'success' },
  ],
});

const RESOURCES = [
  {
    id: 'leadership_report',
    icon: BarChart3,
    title: 'Persönlicher Leadership-Report',
    description: 'Deine 3-Layer-Scores (KI · Rhetorik · EQ) mit Empfehlungen.',
    badge: 'Personalisiert',
    free: true,
    builder: buildLeadershipReport,
  },
  {
    id: '30_tage_plan',
    icon: Trophy,
    title: '30-Tage Leadership Programm',
    description: 'Wochenweise Aktionsplan zum Ausdrucken & Abhaken.',
    badge: 'Aktionsplan',
    free: true,
    builder: build30TagePlan,
  },
  {
    id: 'wlad_book',
    icon: BookOpen,
    title: 'Wlads Methodik · Kern-Frameworks',
    description: '3 Säulen · Kommunikationsquadrant · Feedbackformel · 5 Ebenen · 5 Rollen.',
    badge: 'Wlad-Kompendium',
    requiresTier: false,
    free: true,
    builder: buildWladBook,
  },
  {
    id: 'leadership_manifest',
    icon: Sparkles,
    title: 'Leadership-Manifest · 12 Prinzipien',
    description: 'Die wichtigsten Prinzipien KI-nativer Führung kompakt auf 1 Seite.',
    badge: 'Manifest',
    free: true,
    builder: buildLeadershipManifest,
  },
];

export default function DownloadsPage() {
  const { tier } = useTier();
  const [generating, setGenerating] = useState(null);
  const [user, setUser] = useState(null);

  // Lazy-load user info for personalization
  useEffect(() => {
    let mounted = true;
    api.get('/auth/me').then((r) => { if (mounted) setUser(r.data); }).catch((e) => logger.error('me err', e));
    return () => { mounted = false; };
  }, []);

  const handleDownload = async (resource) => {
    if (resource.requiresTier && tier === 'free') {
      toast.error('Upgrade auf Leadership OS erforderlich.');
      return;
    }
    setGenerating(resource.id);
    try {
      const data = resource.builder(user);
      await downloadHTMLReport(data);
      toast.success('PDF wird heruntergeladen…');
    } catch (e) {
      logger.error('download err', e);
      toast.error('Fehler beim PDF-Erstellen — bitte erneut versuchen.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6" data-testid="downloads-page">
        <div>
          <Badge className="bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] border-[#BFFF00]/25 font-bold text-[10px]">
            DOWNLOADS · ALLES ALS PDF
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-3">
            Deine <span className="gradient-text">Leadership-Bibliothek</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Alle Reports und Frameworks als hochwertige PDFs. Personalisiert mit deinen Scores wo möglich.
            Für Coaching-Sessions, Team-Briefings oder einfach zum Druckaufhängen über dem Schreibtisch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {RESOURCES.map((r) => {
            const Icon = r.icon;
            const isGenerating = generating === r.id;
            const locked = r.requiresTier && tier === 'free';
            return (
              <Card
                key={r.id}
                className={`overflow-hidden border-2 transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                  locked ? 'border-black/[0.06] dark:border-white/[0.06] opacity-70' : 'border-[#BFFF00]/25 hover:border-[#BFFF00]/60'
                }`}
                data-testid={`download-card-${r.id}`}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shrink-0 shadow-md shadow-[#BFFF00]/30">
                      <Icon size={22} className="text-[#0A0A0A]" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold tracking-wider">{r.badge}</Badge>
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{r.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5">{r.description}</p>
                  </div>
                  <Button
                    onClick={() => handleDownload(r)}
                    disabled={isGenerating || locked}
                    className="w-full bg-[#0A0A0A] hover:bg-[#1A1A2E] text-white font-bold"
                    data-testid={`download-btn-${r.id}`}
                  >
                    {isGenerating
                      ? <><Loader2 size={16} className="mr-2 animate-spin" /> PDF wird erstellt…</>
                      : locked
                        ? <><Lock size={16} className="mr-2" /> Leadership OS erforderlich</>
                        : <><Download size={16} className="mr-2" /> Als PDF herunterladen</>
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] text-white border-[#BFFF00]/30">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div>
              <p className="text-[10px] font-black tracking-widest text-[#BFFF00] mb-2">PRO TIPP</p>
              <h3 className="text-xl font-black mb-1">Video-Analyse-Reports</h3>
              <p className="text-sm text-white/70 max-w-xl">
                Mache eine Video-Mission und erhalte automatisch einen 5-seitigen Premium-Report mit
                Wlads Framework-Bewertung, Speech-Analyse und konkreten Action-Items.
              </p>
            </div>
            <a
              href="/missions"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#BFFF00] text-[#0A0A0A] font-black hover:bg-[#9ACC00] transition-colors"
              data-testid="downloads-cta-missions"
            >
              <FileText size={16} /> Video-Mission starten
            </a>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
