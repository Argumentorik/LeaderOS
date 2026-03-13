import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, MessageSquare, Users, Target, Lightbulb, Zap, Shield, Sparkles, Calendar, BookOpen, Video, Headphones, Award, Star, TrendingUp } from "lucide-react";

const courses = [
  { num: "01", icon: Brain, title: "AI Basics – Dein Startpunkt", desc: "Verstehe KI richtig und ordne es für deine Führung ein. Das Fundament für alles Weitere.", color: "#F59E0B", tag: "KEY" },
  { num: "02", icon: MessageSquare, title: "Kommunikation & Argumentation", desc: "Überzeuge in Meetings, Verhandlungen und Konflikten. Deine Worte werden zum Führungsinstrument.", color: "#3B82F6" },
  { num: "03", icon: Target, title: "Management-Systeme", desc: "Eisenhower, ALPEN, Pareto, SMART – die bewährten Methoden für Struktur und Produktivität.", color: "#3B82F6" },
  { num: "04", icon: Users, title: "Team Leadership & Delegation", desc: "Baue High-Performance-Teams. Lerne Motivation, Delegation und Kultur zu gestalten.", color: "#10B981" },
  { num: "05", icon: Shield, title: "Psychologische Führung", desc: "Empathie als Wettbewerbsvorteil. Verstehe Menschen und ihre Motivationen.", color: "#8B5CF6" },
  { num: "06", icon: Lightbulb, title: "Problemlösung & Entscheidung", desc: "Datengestützte Entscheidungen unter Druck. Konflikte lösen, Wandel navigieren.", color: "#EC4899" },
  { num: "07", icon: Zap, title: "Innovation & KI-Strategie", desc: "KI als strategischer Hebel. Werde der Innovator, der schneller löst und gesehen wird.", color: "#06B6D4" },
  { num: "08", icon: Award, title: "Leadership Mastery & Personal Brand", desc: "Definiere deine Leadership-Signatur. Positioniere dich als Thought Leader.", color: "#F59E0B" },
];

const phases = [
  {
    week: "WOCHE 1", title: "Awareness & Foundation", color: "#3B82F6",
    items: ["Baseline-Analyse deiner 6 Führungsdimensionen", "AI Basics: KI richtig verstehen und einordnen", "Kommunikationsmuster identifizieren", "EQ-Selbstreflexion: Stärken & Trigger"],
  },
  {
    week: "WOCHE 2", title: "Skill Building & Methoden", color: "#3B82F6",
    items: ["KI-Entscheidungsframework implementieren", "Boardroom-Rhetorik: Argumentationsstruktur", "Eisenhower + ALPEN-Methode anwenden", "Aktives Zuhören in 3 kritischen Gesprächen"],
  },
  {
    week: "WOCHE 3", title: "Integration & Praxis", color: "#F59E0B",
    items: ["KI + Rhetorik in Präsentation kombinieren", "SMART-Formel für Quartalsziele", "Schwierige Teamgespräche mit EQ-Framework", "Feedback-Loop mit Team starten"],
  },
  {
    week: "WOCHE 4", title: "Strategic Dominance", color: "#F59E0B",
    items: ["30-Tage-Review: Fortschritt vs. Baseline", "Leadership-Signatur definieren", "90-Tage-Plan mit konkreten Meilensteinen", "Personal Brand & Positionierung schärfen"],
  },
];

export default function Roadmap() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030303] pb-24" data-testid="roadmap-page">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-amber-500/3 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="badge-amber px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" />
            Dein Weg zur Führungsstärke
          </div>
          <h1 className="font-manrope font-extrabold text-4xl md:text-5xl text-white mb-4" data-testid="roadmap-title">
            30 Tage zur <span className="text-gradient-amber">strategischen Dominanz</span>
          </h1>
          <p className="font-inter text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
            8 Kurse. Events. Persönliches Gespräch. KI-gestütztes Coaching. Alles, was du brauchst, um in 30 Tagen die 5+1 Rollen zu meistern.
          </p>
        </div>

        {/* Special Events Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14" data-testid="special-events">
          <div className="glass-card p-5 border-l-2 border-amber-500 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-manrope font-bold text-sm text-white">1:1 Gespräch</div>
              <div className="font-inter text-xs text-slate-500">Persönliches Strategy-Gespräch mit Wlad</div>
            </div>
          </div>
          <div className="glass-card p-5 border-l-2 border-blue-500 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="font-manrope font-bold text-sm text-white">Live Events</div>
              <div className="font-inter text-xs text-slate-500">Workshops & Q&A Sessions</div>
            </div>
          </div>
          <div className="glass-card p-5 border-l-2 border-green-500 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="font-manrope font-bold text-sm text-white">AI Guidance</div>
              <div className="font-inter text-xs text-slate-500">How to use AI – Schritt für Schritt</div>
            </div>
          </div>
        </div>

        {/* 8 Kurse */}
        <div className="mb-14" data-testid="courses-section">
          <h2 className="font-manrope font-bold text-xl text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            8 Kurse für das Modern Leadership System
          </h2>
          <p className="font-inter text-sm text-slate-500 mb-8">Jeder Kurs baut auf dem vorherigen auf – AI Basics ist dein Startpunkt.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course, i) => (
              <div key={i} className="glass-card-subtle p-5 hover-card flex gap-4 group" data-testid={`course-${i}`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors" style={{ backgroundColor: `${course.color}12` }}>
                  <course.icon className="w-5 h-5" style={{ color: course.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-inter text-[10px] font-bold tracking-wider" style={{ color: course.color }}>{course.num}</span>
                    {course.tag && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[9px] font-bold">{course.tag}</span>
                    )}
                  </div>
                  <h3 className="font-manrope font-bold text-sm text-white mb-1">{course.title}</h3>
                  <p className="font-inter text-xs text-slate-500 leading-relaxed">{course.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 30-Tage-Plan */}
        <div className="mb-14" data-testid="plan-section">
          <h2 className="font-manrope font-bold text-xl text-white mb-2 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-amber-400" />
            Dein 30-Tage-Fahrplan
          </h2>
          <p className="font-inter text-sm text-slate-500 mb-8">Von Awareness zur strategischen Dominanz in 4 Wochen.</p>

          <div className="space-y-4">
            {phases.map((phase, i) => (
              <div key={i} className="glass-card p-6 border-l-2" style={{ borderLeftColor: phase.color }} data-testid={`phase-${i}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-inter text-xs font-bold tracking-wider" style={{ color: phase.color }}>{phase.week}</span>
                  <span className="font-manrope font-bold text-white">{phase.title}</span>
                  {i === 3 && <Star className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {phase.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: phase.color }} />
                      <span className="font-inter text-sm text-slate-400">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Special Event Tab */}
          <div className="mt-4 glass-card p-6 border-l-2 border-amber-500 bg-gradient-to-r from-amber-500/5 to-transparent" data-testid="special-event">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-bold">SPECIAL EVENT</span>
              <span className="font-manrope font-bold text-white">Persönliches Strategy-Gespräch</span>
            </div>
            <p className="font-inter text-sm text-slate-400 mb-3">
              1:1 mit Wlad – 30 Minuten persönliches Coaching zu deinen Leadership-Herausforderungen. Plus: Zugang zu exklusiven Live-Events und der Leadership-Community.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-300 text-xs font-medium">1:1 Gespräch</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-300 text-xs font-medium">Live Events</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-300 text-xs font-medium">Community</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-300 text-xs font-medium">AI Guidance</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-6 border-t border-white/5" data-testid="roadmap-cta">
          <h3 className="font-manrope font-bold text-xl text-white mb-3">
            Bereit für die strategische Dominanz?
          </h3>
          <p className="font-inter text-sm text-slate-500 mb-8 max-w-lg mx-auto">
            8 Kurse · 1:1 Gespräch · Live Events · AI Guidance · Community-Zugang
          </p>
          <button
            data-testid="roadmap-cta-btn"
            onClick={() => navigate("/close")}
            className="btn-amber px-10 py-4 font-semibold text-base inline-flex items-center gap-3"
          >
            Jetzt Zugang freischalten
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
