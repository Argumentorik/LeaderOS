import { useNavigate } from "react-router-dom";
import { ArrowRight, Play, CheckCircle, Sparkles } from "lucide-react";

const phases = [
  {
    number: "01",
    days: "Tage 1–7",
    title: "Master Yourself",
    subtitle: "Dein Fundament klären",
    color: "#3B82F6",
    modules: [
      {
        number: "Modul 1",
        title: "Critical Thinking & Decisions",
        subtitle: "Kritisches Denken & Entscheidungsfindung",
        desc: "Denken schärfen. Entscheidungen beschleunigen ohne menschliches Urteilsvermögen zu verlieren.",
        outcomes: ["Klarheit unter Druck", "Entscheidungsrahmen für KI-Ära", "Kognitive Biases eliminieren"],
      },
      {
        number: "Modul 4",
        title: "Productivity & Life Management",
        subtitle: "Produktivität & Lebensmanagement",
        desc: "Dein Fundament stabilisieren. High Performance ohne Burnout.",
        outcomes: ["Energiemanagement-System", "Deep-Work-Protokoll", "KI-gestützte Tagesstruktur"],
      },
    ],
  },
  {
    number: "02",
    days: "Tage 8–14",
    title: "Master Communication",
    subtitle: "Rhetorik & Einfluss",
    color: "#60A5FA",
    modules: [
      {
        number: "Modul 2",
        title: "Communication Mastery",
        subtitle: "Kommunikations-Meisterschaft",
        desc: "Boardroom-Präsenz entwickeln. Rhetorik und Überzeugung auf Elite-Niveau.",
        outcomes: ["60-Sekunden-Executive-Format", "Boardroom Rhetorik-Framework", "Krisenkommunikation meistern"],
      },
      {
        number: "Modul 3",
        title: "Emotional Intelligence",
        subtitle: "Emotionale Intelligenz als Geschäftsvorteil",
        desc: "EQ als strategisches Businesswerkzeug. Vertrauen aufbauen, Autorität sichern.",
        outcomes: ["Emotionale Kalibrierung", "Konflikt-Mastery", "Autorität unter Druck"],
      },
    ],
  },
  {
    number: "03",
    days: "Tage 15–21",
    title: "Master Leadership & Integrate AI",
    subtitle: "Führungspsychologie + KI-Hebel",
    color: "#8B5CF6",
    modules: [
      {
        number: "Modul 5",
        title: "Leadership Fundamentals",
        subtitle: "Führungsgrundlagen",
        desc: "Die Psychologie der Macht, des Einflusses und der Followership verstehen.",
        outcomes: ["Führungspsychologie-Framework", "Team-Dynamiken optimieren", "Macht ohne Manipulation"],
      },
      {
        number: "Modul 6",
        title: "AI Literacy",
        subtitle: "KI-Literacy",
        desc: "KI als Force Multiplier nutzen, ohne Führungspräsenz zu verlieren.",
        outcomes: ["Persönliches KI-Toolkit", "KI-Entscheidungsrahmen", "Human-AI-Collaboration"],
      },
    ],
  },
  {
    number: "04",
    days: "Tage 22–30",
    title: "Strategic Dominance",
    subtitle: "Strategisch anwenden",
    color: "#F59E0B",
    modules: [
      {
        number: "Modul 7",
        title: "Business Strategy in AI Era",
        subtitle: "Business-Strategie im KI-Zeitalter",
        desc: "KI-Transformation navigieren. Ethisches Urteilsvermögen als Force Multiplier.",
        outcomes: ["KI-Strategie-Canvas", "Entscheidungs-Journal", "Irreplaceability-Roadmap"],
      },
    ],
  },
];

const courseCategories = [
  { title: "Communication Mastery", desc: "Rhetorik & Überzeugungskraft", color: "#3B82F6" },
  { title: "Leadership Fundamentals", desc: "Psychologie der Führung", color: "#60A5FA" },
  { title: "Emotional Intelligence", desc: "EQ als Geschäftsvorteil", color: "#F59E0B" },
  { title: "Critical Thinking", desc: "Klarere Entscheidungen", color: "#ffffff" },
  { title: "Business Strategy AI", desc: "KI-Transformation navigieren", color: "#3B82F6" },
  { title: "Productivity & Life Mgmt", desc: "Effizienz für Führungskräfte", color: "#94A3B8" },
  { title: "AI Literacy", desc: "KI sinnvoll integrieren", color: "#8B5CF6" },
];

export default function Roadmap() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030303] pb-24" data-testid="roadmap-page">
      {/* Background Effects */}
      <div className="fixed top-1/4 right-0 w-[500px] h-[500px] bg-amber-500/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="badge-amber px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" />
            Dein persönlicher Aktionsplan
          </div>
          <h1 className="font-manrope font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4">
            30-Tage zur
            <br />
            <span className="text-gradient-amber">strategischen Dominanz</span>
          </h1>
          <p className="font-inter text-slate-500 text-lg max-w-2xl mx-auto">
            Die Intentional Sequence: Von Selbst-Meisterschaft zur strategischen Führungsdominanz im KI-Zeitalter.
          </p>
        </div>

        {/* Phases */}
        <div className="space-y-6 mb-16" data-testid="roadmap-phases">
          {phases.map((phase, phaseIdx) => (
            <div key={phaseIdx} className="glass-card overflow-hidden" data-testid={`phase-${phaseIdx + 1}`}>
              {/* Phase header with accent line */}
              <div className="h-1" style={{ background: phase.color }} />
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-6 mb-6">
                  <span className="font-manrope font-extrabold text-5xl opacity-10 text-white shrink-0">
                    {phase.number}
                  </span>
                  <div>
                    <div className="font-inter text-xs tracking-widest mb-1" style={{ color: phase.color }}>
                      {phase.days}
                    </div>
                    <h2 className="font-manrope font-extrabold text-2xl text-white">
                      {phase.title}
                    </h2>
                    <p className="font-inter text-sm text-slate-500">{phase.subtitle}</p>
                  </div>
                </div>

                {/* Modules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {phase.modules.map((mod, modIdx) => (
                    <div key={modIdx} className="glass-card-subtle p-5 hover-card" data-testid={`module-${mod.number.replace(" ", "-")}`}>
                      <div className="font-inter text-xs text-slate-600 mb-2">
                        {mod.number}
                      </div>
                      <h3 className="font-manrope font-bold text-white mb-1">{mod.title}</h3>
                      <p className="font-inter text-xs text-slate-500 mb-4 leading-relaxed">{mod.desc}</p>
                      <div className="space-y-2">
                        {mod.outcomes.map((outcome, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="font-inter text-xs text-slate-400">{outcome}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-slate-600">
                        <Play className="w-3 h-3" />
                        <span className="font-inter text-xs">Video-Kurs verfügbar</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Course Categories */}
        <div className="glass-card p-8 mb-14" data-testid="course-categories">
          <div className="badge-blue px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" />
            Kurs-Kategorien im AI Learn Space
          </div>
          <h3 className="font-manrope font-extrabold text-2xl text-white mb-6">
            7 Kurse. Ein modernes Leadership-System.
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courseCategories.map((cat, i) => (
              <div key={i} className="glass-card-subtle p-4 hover-card">
                <div className="font-manrope font-bold mb-1" style={{ color: cat.color }}>{cat.title}</div>
                <div className="font-inter text-xs text-slate-500">{cat.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 glass-card-subtle p-4">
            <p className="font-inter text-sm text-slate-400">
              <span className="text-white font-medium">Ziel:</span> Menschen nicht nur KI beibringen —
              sondern sie zu klareren Entscheidern machen. Die Reihenfolge entscheidet.
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-3">
            Bereit für strategische Dominanz?
          </h2>
          <p className="font-inter text-slate-500 mb-8">
            Erhalte Vollzugang zu allen 7 Kursen, dem KI-Coach und dem Intelligence Hub.
          </p>
          <button
            data-testid="roadmap-cta"
            onClick={() => navigate("/close")}
            className="btn-amber px-10 py-4 font-semibold inline-flex items-center gap-3"
          >
            Jetzt Vollzugang freischalten
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
