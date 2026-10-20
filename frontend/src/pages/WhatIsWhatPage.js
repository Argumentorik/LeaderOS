import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useSeo } from '../lib/seo';

/**
 * „Was ist was?" (Iter 185) — ein Satz pro Bereich, in normaler Sprache.
 * Dauerhaft erreichbar, weil für jeden Kunden alles hier zum ersten Mal ist.
 */

const AREAS_DE = [
  { path: '/dashboard', name: 'Startseite', text: 'Deine Aufgabe für heute, der Check-in und dein Stand — alles auf einen Blick.' },
  { path: '/challenge', name: '30-Tage-Programm', text: 'Eine kurze Führungsübung pro Tag, 30 Tage lang. Kein Vorwissen nötig.' },
  { path: '/daily-checkin', name: 'Check-in', text: 'Zwei Minuten am Tag festhalten, was lief — daraus lernt dein Coach, was du brauchst.' },
  { path: '/chat', name: 'WladBot (Coach)', text: 'Stelle jede Führungsfrage. Die Antwort kommt aus Wlads Material und passt zu deiner Lage.' },
  { path: '/kurse', name: 'Kurse', text: 'Kurze Videofolgen von Wlad, jede unter 12 Minuten. Folge 1 jedes Kurses ist frei.' },
  { path: '/simulations', name: 'Gesprächs-Training', text: 'Übe schwierige Gespräche mit einem KI-Gegenüber, das zurückredet — ohne echtes Risiko.' },
  { path: '/challengers', name: 'Challengers', text: 'Bekannte Persönlichkeiten stellen dir unangenehme Fragen. Gutes Training für Druck.' },
  { path: '/playbooks', name: 'Leitfäden', text: 'Schritt-für-Schritt-Anleitungen für konkrete Situationen: Feedback, Konflikt, Verhandlung.' },
  { path: '/missions', name: 'Video-Analyse', text: 'Du nimmst dich auf, die KI wertet Sprache, Körper und Wirkung aus.' },
  { path: '/tools', name: 'Werkzeuge', text: 'Dein Werkzeugkasten für den Arbeitsalltag: fertige Vorlagen für E-Mails, Meeting-Vorbereitung und Entscheidungen.' },
  { path: '/tasks', name: 'Aufgaben', text: 'Deine eigene Liste. Was du dir vornimmst, steht hier — ohne KI-Guthaben.' },
  { path: '/my-path', name: 'Mein Fortschritt', text: 'Was du bisher gemacht hast: Level, Tage dabei, gesehene Folgen. Kein Ranking.' },
  { path: '/events', name: 'Live-Events', text: 'Termine mit Wlad und der Community: Fragen stellen, Sparring bekommen.' },
];

const AREAS_EN = AREAS_DE.map((a) => ({ ...a }));

export default function WhatIsWhatPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const de = lang === 'de';
  useSeo({
    path: '/was-ist-was',
    title: de ? 'Was ist was? · Leader-OS' : 'What is what? · Leader-OS',
    description: de
      ? 'Ein Satz pro Bereich: Startseite, 30-Tage-Programm, WladBot, Kurse, Gesprächs-Training und mehr.'
      : 'One sentence per area of Leader-OS.',
  });
  const areas = de ? AREAS_DE : AREAS_EN;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-3xl mx-auto" data-testid="what-is-what-page">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{de ? 'Was ist was?' : 'What is what?'}</h1>
        <p className="text-[13.5px] text-muted-foreground mt-2 leading-relaxed">
          {de
            ? 'Ein Satz pro Bereich. Du musst nichts davon kennen — such dir aus, was heute passt.'
            : 'One sentence per area. Pick whatever fits today.'}
        </p>

        <div className="mt-6 space-y-2.5">
          {areas.map((a) => (
            <Card key={a.path} className="transition-colors hover:border-[#BFFF00]/50" data-testid={`area-${a.path.replace('/', '')}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-black">{a.name}</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{a.text}</p>
                </div>
                <button type="button" onClick={() => navigate(a.path)}
                        className="shrink-0 mt-0.5 inline-flex items-center gap-1 text-[12px] font-bold text-[#4A6200] dark:text-[#BFFF00]"
                        data-testid={`area-open-${a.path.replace('/', '')}`}>
                  {de ? 'Öffnen' : 'Open'} <ArrowRight size={12} />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
