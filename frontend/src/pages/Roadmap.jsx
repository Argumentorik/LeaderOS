import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, MessageSquare, Users, Target, Lightbulb, Zap, Shield, Sparkles, Calendar, BookOpen, Video, Headphones, Award, Star, TrendingUp, Bot, Check, Lock, Rocket, X } from "lucide-react";

const courses = [
  { num: "01", icon: Brain, title: "AI Basics – Dein Startpunkt", desc: "Verstehe KI richtig und ordne es für deine Führung ein. Das Fundament für alles Weitere.", color: "#F59E0B", tag: "KEY" },
  { num: "02", icon: MessageSquare, title: "Kommunikation & Argumentation", desc: "Überzeuge in Meetings, Verhandlungen und Konflikten.", color: "#3B82F6" },
  { num: "03", icon: Target, title: "Management-Systeme", desc: "Eisenhower, ALPEN, Pareto, SMART – bewährte Methoden.", color: "#3B82F6" },
  { num: "04", icon: Users, title: "Team Leadership & Delegation", desc: "Baue High-Performance-Teams auf.", color: "#10B981" },
  { num: "05", icon: Shield, title: "Psychologische Führung", desc: "Empathie als Wettbewerbsvorteil.", color: "#8B5CF6" },
  { num: "06", icon: Lightbulb, title: "Problemlösung & Entscheidung", desc: "Datengestützte Entscheidungen unter Druck.", color: "#EC4899" },
  { num: "07", icon: Zap, title: "Innovation & KI-Strategie", desc: "KI als strategischer Hebel für Sichtbarkeit.", color: "#06B6D4" },
  { num: "08", icon: Award, title: "Leadership Mastery", desc: "Definiere deine Leadership-Signatur.", color: "#F59E0B" },
];

const journalPrompts = [
  "Was ist mein wichtigstes Leadership-Ziel für die nächsten 30 Tage?",
  "Welche KI-Tools nutze ich bereits – und welche will ich testen?",
  "In welcher Situation habe ich mich als Leader zuletzt unwohl gefühlt?",
  "Was würde ich tun, wenn ich keine Angst vor Fehlern hätte?",
  "Wer in meinem Umfeld fordert mich am meisten heraus – und warum?",
  "Welche Gewohnheit hält mich davon ab, mein volles Potential zu entfalten?",
];

const phases = [
  { week: "WOCHE 1", title: "Awareness & Foundation", color: "#3B82F6",
    items: ["Baseline deiner 6 Führungsdimensionen", "AI Basics: KI richtig verstehen", "Kommunikationsmuster identifizieren", "EQ-Selbstreflexion: Stärken & Trigger"] },
  { week: "WOCHE 2", title: "Skill Building & Methoden", color: "#3B82F6",
    items: ["KI-Entscheidungsframework implementieren", "Boardroom-Rhetorik aufbauen", "Eisenhower + ALPEN anwenden", "Aktives Zuhören in 3 Gesprächen"] },
  { week: "WOCHE 3", title: "Integration & Praxis", color: "#F59E0B",
    items: ["KI + Rhetorik in Präsentation kombinieren", "SMART-Formel für Quartalsziele", "Schwierige Gespräche mit EQ-Framework", "Feedback-Loop mit Team starten"] },
  { week: "WOCHE 4", title: "Strategic Dominance", color: "#F59E0B",
    items: ["30-Tage-Review: Fortschritt messen", "Leadership-Signatur definieren", "90-Tage-Plan mit Meilensteinen", "Personal Brand schärfen"] },
];

export default function Roadmap() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState(Array(6).fill(""));
  const [showWladBot, setShowWladBot] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const filledCount = entries.filter(e => e.trim()).length;

  const handleEntry = (i, val) => {
    const next = [...entries];
    next[i] = val;
    setEntries(next);
    if (next.filter(e => e.trim()).length >= 6 && !showWladBot) {
      setTimeout(() => setShowWladBot(true), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] pb-24" data-testid="roadmap-page">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-amber-500/3 rounded-full blur-[200px] pointer-events-none" />

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
            8 Kurse. Events. Persönliches Gespräch. KI-gestütztes Coaching. Alles, was du brauchst, um die 5+1 Rollen zu meistern.
          </p>
        </div>

        {/* Special Events */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14" data-testid="special-events">
          <div className="glass-card p-5 border-l-2 border-amber-500 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-manrope font-bold text-sm text-white">1:1 mit AI Experte</div>
              <div className="font-inter text-xs text-slate-500">Optionales persönliches Strategy-Gespräch</div>
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

        {/* Interactive Journal – 6 Entries */}
        <div className="glass-card p-8 mb-14" data-testid="journal-section">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="font-manrope font-bold text-xl text-white">Dein Leadership-Journal</h2>
          </div>
          <p className="font-inter text-sm text-slate-500 mb-6">
            Beantworte diese 6 Reflexionsfragen ehrlich. Das ist dein Startpunkt für die Transformation.
          </p>
          <div className="space-y-4">
            {journalPrompts.map((prompt, i) => (
              <div key={i} data-testid={`journal-entry-${i}`}>
                <label className="font-inter text-sm text-slate-300 mb-2 block flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-xs font-bold" style={{ color: entries[i].trim() ? "#10B981" : "#64748B" }}>
                    {entries[i].trim() ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  {prompt}
                </label>
                <textarea
                  value={entries[i]}
                  onChange={e => handleEntry(i, e.target.value)}
                  placeholder="Schreib hier..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8 font-inter text-sm text-white placeholder:text-slate-600 focus:border-amber-500/30 focus:outline-none resize-none transition-colors"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-inter text-xs text-slate-500">{filledCount} / 6 beantwortet</span>
            <div className="h-1.5 flex-1 mx-4 rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500" style={{ width: `${(filledCount / 6) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* WladBot Motivation after 6 entries */}
        {showWladBot && (
          <div className="glass-card p-6 mb-14 border border-amber-500/15 bg-gradient-to-r from-amber-500/5 to-transparent" data-testid="wladbot-motivation">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Bot className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="font-manrope font-bold text-white mb-1">WladBot</div>
                <p className="font-inter text-sm text-slate-300 leading-relaxed mb-3">
                  Stark! Du hast dir die Zeit genommen und ehrlich reflektiert – das machen die wenigsten.
                  Jetzt kommt der spannende Teil: Nimm dir die nächsten 30 Tage und arbeite die Kurse durch.
                  Nicht perfekt, sondern konsequent. Jeden Tag ein kleiner Schritt. Die Transformation passiert nicht über Nacht – aber sie passiert, wenn du dranbleibst.
                </p>
                <p className="font-inter text-sm text-amber-300 font-medium">
                  Bereit, den nächsten Schritt zu machen? Die Kurse und die Community warten auf dich.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 8 Kurse */}
        <div className="mb-14" data-testid="courses-section">
          <h2 className="font-manrope font-bold text-xl text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            8 Kurse für das Modern Leadership System
          </h2>
          <p className="font-inter text-sm text-slate-500 mb-8">AI Basics ist dein Startpunkt – dann baust du Schritt für Schritt auf.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course, i) => (
              <div key={i} className="glass-card-subtle p-5 hover-card flex gap-4 group" data-testid={`course-${i}`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${course.color}12` }}>
                  <course.icon className="w-5 h-5" style={{ color: course.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-inter text-[10px] font-bold tracking-wider" style={{ color: course.color }}>{course.num}</span>
                    {course.tag && <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[9px] font-bold">{course.tag}</span>}
                  </div>
                  <h3 className="font-manrope font-bold text-sm text-white mb-1">{course.title}</h3>
                  <p className="font-inter text-xs text-slate-500">{course.desc}</p>
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

          {/* Special Event */}
          <div className="mt-4 glass-card p-6 border-l-2 border-amber-500 bg-gradient-to-r from-amber-500/5 to-transparent" data-testid="special-event">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-bold">SPECIAL EVENT</span>
            </div>
            <p className="font-inter text-sm text-slate-400 mb-3">
              1:1 mit einem AI Experten – 30 Min. persönliches Coaching. Plus: Live-Events und Community-Zugang.
            </p>
            <div className="flex flex-wrap gap-3">
              {["1:1 Gespräch", "Live Events", "Community", "AI Guidance"].map(t => (
                <span key={t} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-300 text-xs font-medium">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* CTA - blocked until journal complete */}
        <div className="text-center pt-6 border-t border-white/5">
          <h3 className="font-manrope font-bold text-xl text-white mb-3">
            Bereit für die strategische Dominanz?
          </h3>
          <p className="font-inter text-sm text-slate-500 mb-8 max-w-lg mx-auto">
            8 Kurse · 1:1 Gespräch · Live Events · AI Guidance · Community
          </p>
          {filledCount < 6 ? (
            <div data-testid="journal-gate">
              <button disabled className="px-10 py-4 rounded-xl bg-white/5 border border-white/10 text-slate-500 font-manrope font-semibold text-base inline-flex items-center gap-3 cursor-not-allowed">
                <Lock className="w-5 h-5" />
                Beantworte zuerst alle 6 Journal-Fragen
              </button>
              <p className="font-inter text-xs text-slate-600 mt-3">Noch {6 - filledCount} Fragen offen</p>
            </div>
          ) : (
            <button
              data-testid="roadmap-cta-btn"
              onClick={() => navigate("/close")}
              className="btn-amber px-10 py-4 font-semibold text-base inline-flex items-center gap-3"
            >
              Jetzt Zugang freischalten
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Upsell Pop-Up (after 6 entries + 10sec delay) */}
      {showWladBot && !showPopup && (
        <PopupTrigger onShow={() => setShowPopup(true)} />
      )}

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" data-testid="upsell-popup">
          <div className="w-full max-w-md glass-card p-8 relative border border-amber-500/20">
            <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="font-manrope font-extrabold text-xl text-white mb-2">Du bist bereit für mehr!</h3>
              <p className="font-inter text-sm text-slate-400">Schalte jetzt alle 23 Kurse, die WLADHUB Plattform und die AI Leadership Community frei.</p>
            </div>
            <div className="text-center mb-4">
              <div className="font-manrope font-extrabold text-3xl text-white">€997</div>
              <div className="font-inter text-xs text-slate-500">einmalig · License Key per E-Mail</div>
            </div>
            <button onClick={() => { setShowPopup(false); navigate("/close"); }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-manrope font-bold flex items-center justify-center gap-2">
              Alles freischalten – €997 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PopupTrigger({ onShow }) {
  useState(() => {
    const timer = setTimeout(onShow, 15000);
    return () => clearTimeout(timer);
  });
  return null;
}
