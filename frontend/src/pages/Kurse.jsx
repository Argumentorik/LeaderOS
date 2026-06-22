import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, MessageSquare, Target, Users, Shield, Lightbulb, Play, Lock, ArrowRight, ExternalLink, Clock, CheckCircle } from "lucide-react";

const courses = [
  {
    num: "01",
    icon: Brain,
    title: "AI Basics – Dein Startpunkt",
    desc: "KI richtig verstehen und für deine Führung einsetzen. Das Fundament für alles Weitere.",
    duration: "45 Min",
    lessons: 5,
    topics: ["Was KI wirklich kann (und was nicht)", "KI-Tools für Führungskräfte", "Entscheidungen mit KI beschleunigen", "Prompting für Leadership-Szenarien", "KI-Strategie für dein Team"],
    vimeoId: null,
    free: true,
  },
  {
    num: "02",
    icon: MessageSquare,
    title: "Kommunikation & Argumentation",
    desc: "Überzeuge in Meetings, Verhandlungen und Konflikten. Klare Worte, die wirken.",
    duration: "60 Min",
    lessons: 6,
    topics: ["Die 5 Säulen der Überzeugungskraft", "Argumentationsstruktur aufbauen", "Einwände souverän entkräften", "Körpersprache & Stimme", "Schwierige Gespräche führen", "Boardroom-Präsenz entwickeln"],
    vimeoId: null,
    free: true,
  },
  {
    num: "03",
    icon: Target,
    title: "Management-Systeme",
    desc: "Eisenhower, ALPEN, Pareto, SMART – bewährte Methoden, die deine Produktivität verdoppeln.",
    duration: "50 Min",
    lessons: 5,
    topics: ["Eisenhower-Matrix für Prioritäten", "ALPEN-Methode für Tagesplanung", "Pareto-Prinzip in der Praxis", "SMART-Ziele formulieren", "OKRs für dein Quartal"],
    vimeoId: null,
    free: true,
  },
  {
    num: "04",
    icon: Users,
    title: "Team Leadership & Delegation",
    desc: "Baue High-Performance-Teams auf. Lerne zu delegieren, ohne die Kontrolle zu verlieren.",
    duration: "55 Min",
    lessons: 5,
    topics: ["Die Kunst der Delegation", "Motivation ohne Manipulation", "Feedback geben, das ankommt", "Teamdynamiken verstehen", "Remote-Teams führen"],
    vimeoId: null,
    free: true,
  },
  {
    num: "05",
    icon: Shield,
    title: "Psychologische Führung",
    desc: "Empathie als Wettbewerbsvorteil. Verstehe, was Menschen antreibt – und nutze es ethisch.",
    duration: "50 Min",
    lessons: 5,
    topics: ["Emotionale Intelligenz vertiefen", "Bedürfnisse erkennen & adressieren", "Vertrauen systematisch aufbauen", "Konflikte als Wachstumschance", "Psychologische Sicherheit schaffen"],
    vimeoId: null,
    free: true,
  },
  {
    num: "06",
    icon: Lightbulb,
    title: "Problemlösung & Entscheidung",
    desc: "Datengestützte Entscheidungen unter Druck. Kritisches Denken, das den Unterschied macht.",
    duration: "45 Min",
    lessons: 5,
    topics: ["Entscheidungsframeworks für Leader", "Bias erkennen & eliminieren", "Risikobewertung unter Unsicherheit", "Problem-Decomposition", "Schnelle Entscheidungen vs. tiefe Analyse"],
    vimeoId: null,
    free: true,
  },
];

export default function Kurse() {
  const navigate = useNavigate();
  const [activeCourse, setActiveCourse] = useState(0);
  const [playing, setPlaying] = useState(false);

  const course = courses[activeCourse];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24" data-testid="kurse-page">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#C8FF00]/[0.02] rounded-full blur-[200px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-28">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-lg border border-[#C8FF00]/15 bg-[#C8FF00]/[0.04] text-[10px] font-semibold tracking-[0.25em] text-[#C8FF00] uppercase mb-5">
            6 Free Lessons · Kostenlos
          </span>
          <h1 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-4">
            Leadership Upgrade Programm
          </h1>
          <p className="font-inter text-base text-slate-500 max-w-2xl mx-auto">
            Sechs kompakte Module, die dich in den wichtigsten Führungsdimensionen weiterbringen. Kostenlos. Ohne Anmeldung.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course List - Left */}
          <div className="space-y-2" data-testid="course-list">
            {courses.map((c, i) => (
              <button
                key={i}
                onClick={() => { setActiveCourse(i); setPlaying(false); }}
                data-testid={`course-${i}`}
                className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all group ${
                  activeCourse === i
                    ? "bg-[#C8FF00]/[0.06] border border-[#C8FF00]/20"
                    : "bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.08]"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeCourse === i ? "bg-[#C8FF00]/10" : "bg-white/[0.03]"
                }`}>
                  <c.icon className={`w-5 h-5 ${activeCourse === i ? "text-[#C8FF00]" : "text-slate-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-manrope font-bold text-xs ${activeCourse === i ? "text-[#C8FF00]" : "text-slate-600"}`}>
                      {c.num}
                    </span>
                    <span className={`font-inter text-sm font-medium truncate ${activeCourse === i ? "text-white" : "text-slate-300"}`}>
                      {c.title.split("–")[0].trim()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-inter text-xs text-slate-600">{c.duration}</span>
                    <span className="font-inter text-xs text-slate-600">{c.lessons} Lektionen</span>
                  </div>
                </div>
                {activeCourse === i && <div className="w-1.5 h-8 rounded-full bg-[#C8FF00] shrink-0" />}
              </button>
            ))}
          </div>

          {/* Video Player + Details - Right */}
          <div className="lg:col-span-2 space-y-5">
            {/* Video Player */}
            <div className="relative rounded-2xl overflow-hidden bg-[#111] border border-white/[0.06] aspect-video" data-testid="video-player">
              {course.vimeoId && playing ? (
                <iframe
                  src={`https://player.vimeo.com/video/${course.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  <div className="relative z-10 text-center">
                    <button
                      onClick={() => setPlaying(true)}
                      className="w-20 h-20 rounded-full bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center mb-4 mx-auto hover:bg-[#C8FF00]/20 transition-all group"
                      data-testid="play-btn"
                    >
                      <Play className="w-8 h-8 text-[#C8FF00] ml-1 group-hover:scale-110 transition-transform" />
                    </button>
                    <p className="font-manrope font-bold text-lg text-white mb-1">Modul {course.num}</p>
                    <p className="font-inter text-sm text-slate-500">
                      {course.vimeoId ? "Klicke zum Starten" : "Video wird bald hinzugefügt"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/15 text-[#C8FF00] text-xs font-bold">MODUL {course.num}</span>
                    <span className="flex items-center gap-1.5 font-inter text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" /> {course.duration}
                    </span>
                  </div>
                  <h2 className="font-manrope font-bold text-xl text-white">{course.title}</h2>
                </div>
              </div>
              <p className="font-inter text-sm text-slate-400 mb-5 leading-relaxed">{course.desc}</p>

              {/* Topics */}
              <div className="space-y-2">
                <p className="font-inter text-xs text-slate-500 uppercase tracking-wider mb-3">Inhalte</p>
                {course.topics.map((topic, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0">
                    <div className="w-6 h-6 rounded-md bg-white/[0.03] flex items-center justify-center shrink-0">
                      <span className="font-inter text-[10px] text-slate-500 font-medium">{i + 1}</span>
                    </div>
                    <span className="font-inter text-sm text-slate-300">{topic}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-slate-700 ml-auto shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* CTA to leaderos.de */}
            <div className="glass-card p-6 border border-[#C8FF00]/10 bg-[#C8FF00]/[0.02]">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1">
                  <p className="font-manrope font-bold text-white mb-1">Bereit für das volle System?</p>
                  <p className="font-inter text-sm text-slate-500">
                    Diese 6 Module sind nur der Anfang. Das komplette Leadership-OS mit KI-Agenten, persönlichem Coaching und Community findest du auf leaderos.de.
                  </p>
                </div>
                <a
                  href="https://leaderos.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-6 py-3.5 text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  data-testid="leader-os-cta"
                >
                  Zu leaderos.de
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="font-manrope font-bold text-xl text-white mb-3">
              Du willst wissen, wo du als Leader stehst?
            </h3>
            <p className="font-inter text-sm text-slate-500 mb-6">
              Mach die kostenlose Diagnose und bekomme deinen persönlichen Leadership-Score.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/diagnose")}
                className="btn-primary px-8 py-4 text-base font-semibold inline-flex items-center gap-2"
                data-testid="diagnose-cta"
              >
                Kostenlose Diagnose starten
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="https://leaderos.de"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary px-6 py-4 text-sm font-medium inline-flex items-center gap-2"
              >
                leaderos.de entdecken
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
