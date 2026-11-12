import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Lock, Rocket, X } from "lucide-react";
import { courses } from "./roadmapData";

export const RoadmapCourses = () => (
  <div className="mb-14" data-testid="courses-section">
    <h2 className="font-manrope font-bold text-xl text-white mb-2 flex items-center gap-3">
      <BookOpen className="w-5 h-5 text-[#C8FF00]" />
      6 Kurse für das Modern Leadership System
    </h2>
    <p className="font-inter text-sm text-slate-500 mb-8">AI Basics ist dein Startpunkt · dann baust du Schritt für Schritt auf.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {courses.map((course, i) => (
        <div key={course.title} className="glass-card-subtle p-5 hover-card flex gap-4 group" data-testid={`course-${i}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${course.color}12` }}>
            <course.icon className="w-5 h-5" style={{ color: course.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-inter text-[10px] font-bold tracking-wider" style={{ color: course.color }}>{course.num}</span>
              {course.tag && <span className="px-2 py-0.5 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] text-[9px] font-bold">{course.tag}</span>}
            </div>
            <h3 className="font-manrope font-bold text-sm text-white mb-1">{course.title}</h3>
            <p className="font-inter text-xs text-slate-500">{course.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const RoadmapCTA = ({ filledCount }) => {
  const navigate = useNavigate();
  return (
    <div className="text-center pt-6 border-t border-white/5">
      <h3 className="font-manrope font-bold text-2xl text-white mb-2">
        Plan steht. Zeit für den Sprint.
      </h3>
      <p className="font-inter text-sm text-slate-500 mb-2 max-w-lg mx-auto">
        30 Tage Sprint · 11 Frameworks · WLAD AI 24/7 · 12 Monate Plattform
      </p>
      <p className="font-inter text-xs text-[#C8FF00]/60 mb-6">
        ▸ Volle Plattform · 11 Frameworks · WLAD AI 24/7 · 14 Tage Geld-zurück
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto">
          <button
            data-testid="roadmap-cta-sprint"
            onClick={() => navigate("/close")}
            className="flex-1 px-6 py-4 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold hover:shadow-xl hover:shadow-[#C8FF00]/20 transition-all inline-flex items-center justify-center gap-2"
          >
            <span>Sprint sichern</span>
            <span>997 EUR</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            data-testid="roadmap-cta-plusplus"
            onClick={() => navigate("/close")}
            className="flex-1 px-6 py-4 rounded-xl bg-white/[0.04] border border-[#C8FF00]/20 text-white font-manrope font-bold hover:border-[#C8FF00]/40 hover:bg-[#C8FF00]/[0.04] transition-all inline-flex items-center justify-center gap-2"
          >
            <span>Plus-Plus mit KI-Experten Live-Q&As</span>
            <span className="text-[#C8FF00]">4.797 EUR</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const RoadmapUpsellPopup = ({ onClose }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" data-testid="upsell-popup">
      <div className="w-full max-w-md glass-card p-8 relative border border-[#C8FF00]/15">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white" data-testid="popup-close">
          <X className="w-4 h-4" />
        </button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-7 h-7 text-[#C8FF00]" />
          </div>
          <h3 className="font-manrope font-extrabold text-xl text-white mb-2">Werde Teil der Leader-OS Bewegung.</h3>
          <p className="font-inter text-sm text-slate-400">30-Tage-Sprint mit Wlad. 11 Frameworks. WLAD AI 24/7. 12 Monate Plattform inkludiert.</p>
        </div>
        <div className="text-center mb-4">
          <div className="font-manrope font-extrabold text-3xl text-white">997 EUR <span className="text-slate-500 text-base font-normal">einmalig</span></div>
          <div className="font-inter text-xs text-slate-500">oder Ratenzahlung · 14 Tage Geld-zurück</div>
        </div>
        <button onClick={() => { onClose(); navigate("/close"); }}
          className="w-full py-4 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold flex items-center justify-center gap-2"
          data-testid="popup-cta"
        >
          Sprint sichern <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={onClose} className="w-full py-3 mt-2 text-center font-inter text-xs text-slate-500 hover:text-slate-300 transition-colors" data-testid="popup-dismiss">
          Spaeter
        </button>
      </div>
    </div>
  );
};
