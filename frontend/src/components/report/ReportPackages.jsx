import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Check, Clock, ChevronDown, Radio, ArrowRight, Gift } from "lucide-react";

const STATS = [
  { value: "10", label: "Kurse" },
  { value: "72", label: "Folgen" },
  { value: "12 h", label: "geballte Praxis" },
  { value: "10", label: "Folgen gratis" },
];

const PACKAGES = [
  {
    id: "os",
    name: "Leader-OS",
    meta: "6 Kurse · 31 Folgen",
    subtitle: "Kurse 1–6 · das Fundament",
    minutes: "288 Min gesamt",
    live: null,
    description:
      "Die Gespräche, die dein Alltag jeden Tag von dir verlangt — Feedback, Konflikte, Delegation, Auftritt.",
    courses: [
      { title: "Rhetorik-Grundlagen", folgen: "6 Folgen", min: "52 Min", teaser: "Rhetorik ist kein Talent, sondern ein System mit Regeln, das jeder lernen kann." },
      { title: "Schwierige Gespräche meistern", folgen: "5 Folgen", min: "50 Min", teaser: "Vermeidung kostet mehr als jeder Fehler — die Feedback- und Konfliktgespräche, die du nicht mehr aufschiebst." },
      { title: "Delegation wie ein Profi", folgen: "4 Folgen", min: "38 Min", teaser: "Raus aus der 60-Stunden-Woche — mit dem KEVL-Prinzip Aufgaben sauber abgeben." },
      { title: "Feedback-Formate — SBI & WWW", folgen: "5 Folgen", min: "47 Min", teaser: "Verhalten statt Identität — Feedback, das Veränderung auslöst statt Abwehr." },
      { title: "Storytelling im Boardroom", folgen: "7 Folgen", min: "62 Min", teaser: "Vorstände entscheiden nicht auf Basis von Zahlen, sondern von Geschichten." },
      { title: "Meeting-Rhetorik", folgen: "4 Folgen", min: "39 Min", teaser: "Eröffnung — Steuerung — Abschluss: jedes Meeting mit klarer Wirkung führen." },
    ],
  },
  {
    id: "plus",
    name: "Leader-OS Plus",
    meta: "4 Kurse · 41 Folgen",
    subtitle: "Kurse 7–10 · Top-Ebene + 12 Live-Coachings",
    minutes: "456 Min gesamt",
    live: "12 Live-Coachings",
    description:
      "Alles aus Leader-OS — plus die Ebene, auf der Vorstand, Verhandlung und Change entschieden werden.",
    courses: [
      { title: "KI-First Leadership", folgen: "12 Folgen", min: "134 Min", teaser: "Die Führungskraft der Zukunft beherrscht KI als Führungsinstrument — nicht als Bedrohung." },
      { title: "Change Management Master", folgen: "10 Folgen", min: "112 Min", teaser: "70 % aller Change-Initiativen scheitern — das Resistance-Playbook, das wirklich greift." },
      { title: "Executive Presence & Charisma", folgen: "8 Folgen", min: "87 Min", teaser: "Gravitas, Kommunikation, Erscheinung — trainierbar, nicht angeboren." },
      { title: "Boardroom-Strategie", folgen: "11 Folgen", min: "123 Min", teaser: "Im Boardroom wird die Entscheidung vor dem Meeting getroffen — so bereitest du sie vor." },
    ],
  },
];

const CourseRow = ({ course, isOpen, onToggle, testid }) => (
  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
    <button
      data-testid={testid}
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.03] transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-[#C8FF00]/[0.06] border border-[#C8FF00]/15 flex items-center justify-center shrink-0">
        <Lock className="w-4 h-4 text-[#C8FF00]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-manrope font-bold text-sm text-white truncate">{course.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-inter text-xs text-slate-500">{course.folgen} · {course.min}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] text-[10px] font-bold">1 gratis</span>
        </div>
      </div>
      <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">
        <p className="font-inter text-xs text-slate-400 leading-relaxed px-4 pb-4 pl-16">
          {course.teaser}
        </p>
      </div>
    </div>
  </div>
);

const PackageCard = ({ pkg }) => {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="glass-card p-6 md:p-7" data-testid={`report-package-${pkg.id}`}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h4 className="font-manrope font-extrabold text-xl text-white">{pkg.name}</h4>
        {pkg.live && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8FF00]/10 border border-[#C8FF00]/25 shrink-0">
            <Radio className="w-3 h-3 text-[#C8FF00]" />
            <span className="font-inter text-[11px] font-bold text-[#C8FF00]">Live dabei</span>
          </span>
        )}
      </div>
      <div className="font-manrope font-bold text-sm text-slate-300">{pkg.meta}</div>
      <div className="font-inter text-xs text-slate-500 mb-4">{pkg.subtitle}</div>
      <p className="font-inter text-sm text-slate-400 leading-relaxed mb-4">{pkg.description}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 pb-5 border-b border-white/[0.06]">
        <span className="inline-flex items-center gap-1.5 font-inter text-xs text-[#C8FF00] font-semibold">
          <Check className="w-4 h-4" /> Vollzugriff freigeschaltet
        </span>
        <span className="inline-flex items-center gap-1.5 font-inter text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" /> {pkg.minutes}
        </span>
        {pkg.live && (
          <span className="inline-flex items-center gap-1.5 font-inter text-xs text-slate-500">
            <Radio className="w-3.5 h-3.5" /> {pkg.live}
          </span>
        )}
      </div>
      <div className="space-y-2.5">
        {pkg.courses.map((course, i) => (
          <CourseRow
            key={course.title}
            course={course}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            testid={`report-course-${pkg.id}-${i}`}
          />
        ))}
      </div>
    </div>
  );
};

export const ReportPackages = () => {
  const navigate = useNavigate();
  return (
    <div className="mb-10" data-testid="report-packages">
      {/* Free vs paid clarity */}
      <div className="glass-card-subtle p-5 mb-8 flex items-center gap-4 border border-[#C8FF00]/10">
        <div className="w-11 h-11 rounded-xl bg-[#C8FF00]/[0.08] border border-[#C8FF00]/20 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-[#C8FF00]" />
        </div>
        <p className="font-inter text-sm text-slate-300 leading-relaxed">
          <span className="font-bold text-white">Dein Report & 30-Tage-Plan sind kostenlos.</span>{" "}
          Das hier ist das Upgrade · die komplette Kurs-Bibliothek, mit der du die Gespräche wirklich meisterst.
        </p>
      </div>

      <div className="text-center mb-8">
        <h3 className="font-manrope font-extrabold text-2xl md:text-3xl text-[#C8FF00] mb-3 tracking-tight">
          DAS STECKT IN DEN PAKETEN
        </h3>
        <p className="font-inter text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Kein Kurs, den du abarbeitest — eine Bibliothek für den Mittwochnachmittag, an dem das Gespräch ansteht.
          Folge 1 jedes Kurses ist für alle offen. Die komplette Struktur siehst du hier · damit du genau weisst, was du mit welchem Paket freischaltest.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
            <div className="font-manrope font-extrabold text-2xl md:text-3xl text-white">{s.value}</div>
            <div className="font-inter text-[11px] text-slate-500 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Package cards */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {PACKAGES.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>

      {/* Sales CTA */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto">
        <button
          data-testid="report-packages-cta-sprint"
          onClick={() => navigate("/close")}
          className="flex-1 px-6 py-4 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold hover:shadow-xl hover:shadow-[#C8FF00]/20 transition-all inline-flex items-center justify-center gap-2"
        >
          <span>Sprint sichern</span>
          <span>997 EUR</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          data-testid="report-packages-cta-library"
          onClick={() => navigate("/close")}
          className="flex-1 px-6 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-manrope font-bold hover:border-[#C8FF00]/30 hover:bg-white/[0.06] transition-all inline-flex items-center justify-center gap-2"
        >
          Zur Bibliothek
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
