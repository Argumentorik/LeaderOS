import { useNavigate } from "react-router-dom";
import { ArrowRight, Play, CheckCircle } from "lucide-react";

const phases = [
  {
    number: "01",
    days: "Tage 1–7",
    title: "Master Yourself",
    subtitle: "Dein Fundament klären",
    color: "border-blue-500/30 text-blue-400",
    bg: "bg-cold-dim",
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
    color: "border-blue-400/30 text-blue-300",
    bg: "bg-cold-dim",
    modules: [
      {
        number: "Modul 2",
        title: "Communication Mastery",
        subtitle: "Kommunikations-Meisterschaft",
        desc: "Boardroom-Präsenz entwickeln. Rhetorik und Überzeugung auf Elite-Niveau.",
        outcomes: ["60-Sekunden-Executive-Format", "Boardroom Rhetorik-Framework", "Krisenkommmunikation meistern"],
      },
      {
        number: "Modul 3",
        title: "Emotional Intelligence",
        subtitle: "Emotionale Intelligenz als Geschäftsvorteil",
        desc: "EQ als strategisches Businesswerkzeug. Vertrauen aufbauen, Autorität sichern.",
        outcomes: ["Emotionale Kalibrierung", "Konflikt-Mastery", "Authorität unter Druck"],
      },
    ],
  },
  {
    number: "03",
    days: "Tage 15–21",
    title: "Master Leadership & Integrate AI",
    subtitle: "Führungspsychologie + KI-Hebel",
    color: "border-white/20 text-white",
    bg: "bg-noir-surface",
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
    color: "border-warm-DEFAULT/30 text-amber-400",
    bg: "bg-warm-dim",
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
  { title: "Communication Mastery", desc: "Rhetorik & Überzeugungskraft", color: "text-blue-400", borderColor: "border-blue-500/20" },
  { title: "Leadership Fundamentals", desc: "Psychologie der Führung", color: "text-blue-300", borderColor: "border-blue-400/20" },
  { title: "Emotional Intelligence", desc: "EQ als Geschäftsvorteil", color: "text-amber-400", borderColor: "border-amber-500/20" },
  { title: "Critical Thinking", desc: "Klarere Entscheidungen", color: "text-white", borderColor: "border-white/10" },
  { title: "Business Strategy AI", desc: "KI-Transformation navigieren", color: "text-blue-400", borderColor: "border-blue-500/20" },
  { title: "Productivity & Life Mgmt", desc: "Effizienz für Führungskräfte", color: "text-slate-300", borderColor: "border-white/10" },
  { title: "AI Literacy", desc: "KI sinnvoll integrieren", color: "text-blue-300", borderColor: "border-blue-400/20" },
];

export default function Roadmap() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-noir-bg pb-24" data-testid="roadmap-page">
      {/* Glow */}
      <div className="fixed top-1/4 right-0 w-[400px] h-[400px] bg-amber-600/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-px bg-amber-500" />
            <span className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-amber-500">
              Dein persönlicher Aktionsplan
            </span>
          </div>
          <h1 className="font-manrope font-black text-4xl md:text-6xl text-white leading-none mb-4">
            30-Tage zur
            <br />
            <span className="text-gradient-amber">strategischen Dominanz</span>
          </h1>
          <p className="font-inter text-slate-500 text-lg max-w-2xl">
            Die Intentional Sequence: Von Selbst-Meisterschaft zur strategischen Führungsdominanz im KI-Zeitalter.
          </p>
        </div>

        {/* Phases */}
        <div className="space-y-6 mb-16" data-testid="roadmap-phases">
          {phases.map((phase, phaseIdx) => (
            <div key={phaseIdx} className={`border ${phase.color} ${phase.bg} p-6 md:p-8`} data-testid={`phase-${phaseIdx + 1}`}>
              {/* Phase header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="font-manrope font-black text-4xl opacity-20 text-white">
                    {phase.number}
                  </span>
                  <div>
                    <div className={`font-manrope text-xs font-medium tracking-[0.3em] uppercase mb-1 ${phase.color.split(" ")[1]}`}>
                      {phase.days}
                    </div>
                    <h2 className="font-manrope font-black text-xl md:text-2xl text-white">
                      {phase.title}
                    </h2>
                    <p className="font-inter text-sm text-slate-500">{phase.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phase.modules.map((mod, modIdx) => (
                  <div key={modIdx} className="border border-white/5 bg-noir-bg p-5" data-testid={`module-${mod.number.replace(" ", "-")}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-manrope text-xs font-medium tracking-[0.2em] uppercase text-slate-600">
                        {mod.number}
                      </span>
                    </div>
                    <h3 className="font-manrope font-bold text-sm text-white mb-1">{mod.title}</h3>
                    <p className="font-inter text-xs text-slate-500 mb-4 leading-relaxed">{mod.desc}</p>
                    <div className="space-y-2">
                      {mod.outcomes.map((outcome, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="font-inter text-xs text-slate-400">{outcome}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Play className="w-3 h-3" />
                        <span className="font-inter text-xs">Video-Kurs verfügbar im AI Learn Space</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Course Categories */}
        <div className="border border-white/5 bg-noir-surface p-8 mb-12" data-testid="course-categories">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-6 h-px bg-blue-500" />
            <span className="font-manrope text-xs font-medium tracking-[0.3em] uppercase text-slate-500">
              Kurs-Kategorien im AI Learn Space
            </span>
          </div>
          <h3 className="font-manrope font-bold text-xl text-white mb-6">
            7 Kurse. Ein modernes Leadership-System.
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courseCategories.map((cat, i) => (
              <div key={i} className={`border ${cat.borderColor} bg-noir-bg p-4 hover:bg-noir-highlight transition-all`}>
                <div className={`font-manrope font-bold text-sm mb-1 ${cat.color}`}>{cat.title}</div>
                <div className="font-inter text-xs text-slate-500">{cat.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 border border-white/5 bg-noir-bg p-4">
            <p className="font-inter text-sm text-slate-400">
              <span className="text-white font-medium">Ziel:</span> Menschen nicht nur KI beibringen —
              sondern sie zu klareren Entscheidern machen. Die Reihenfolge entscheidet.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="text-center">
          <h2 className="font-manrope font-black text-2xl md:text-3xl text-white mb-3">
            Bereit für strategische Dominanz?
          </h2>
          <p className="font-inter text-slate-500 mb-8">
            Erhalte Vollzugang zu allen 7 Kursen, dem KI-Coach und dem Intelligence Hub.
          </p>
          <button
            data-testid="roadmap-cta"
            onClick={() => navigate("/close")}
            className="btn-amber px-10 py-4 font-manrope text-sm tracking-widest uppercase inline-flex items-center gap-3"
          >
            Jetzt Vollzugang freischalten
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
