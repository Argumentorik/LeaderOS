import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Calendar } from "lucide-react";

export const Report30DayPlan = ({ weakestRoles }) => (
  <div className="glass-card p-8 md:p-10 mb-10" data-testid="report-30day-plan">
    <div className="flex items-center gap-3 mb-2">
      <Calendar className="w-5 h-5 text-[#C8FF00]" />
      <h3 className="font-manrope font-bold text-xl text-white">Dein persönlicher 30-Tage-Lernplan</h3>
    </div>
    <p className="font-inter text-sm text-slate-500 mb-6">
      Basierend auf deinem Profil · fokussiert auf dein größtes Wachstumspotenzial.
    </p>
    <div className="space-y-4">
      {weakestRoles.map((role, i) => (
          <div key={role.key} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${role.color}15` }}>
              <span className="font-manrope font-bold text-sm" style={{ color: role.color }}>W{i + 1}</span>
            </div>
            <div>
              <div className="font-manrope font-bold text-sm text-white mb-1">
                {i === 0 ? "Priorität" : i === 1 ? "Aufbau" : "Vertiefung"}: {role.label}
              </div>
              <p className="font-inter text-xs text-slate-500">{role.desc} · Fokus-Woche mit täglichen Mikro-Aufgaben</p>
            </div>
          </div>
        ))}
      <div className="flex items-start gap-4 p-4 rounded-xl bg-[#C8FF00]/[0.03] border border-[#C8FF00]/10">
        <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center shrink-0">
          <span className="font-manrope font-bold text-sm text-[#C8FF00]">W4</span>
        </div>
        <div>
          <div className="font-manrope font-bold text-sm text-white mb-1">Strategic Dominance: Alles zusammenführen</div>
          <p className="font-inter text-xs text-slate-500">Leadership-Signatur definieren · 90-Tage-Plan erstellen · Review</p>
        </div>
      </div>
    </div>
  </div>
);

export const ReportBookUpsell = () => (
  <div className="glass-card-subtle p-6 mb-10 flex flex-col sm:flex-row items-center gap-6 border border-[#C8FF00]/10" data-testid="report-book-upsell">
    <div className="w-20 h-28 rounded-lg bg-[#C8FF00]/[0.06] border border-[#C8FF00]/20 flex items-center justify-center shrink-0">
      <BookOpen className="w-8 h-8 text-[#C8FF00]" />
    </div>
    <div className="flex-1 text-center sm:text-left">
      <div className="px-2.5 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] text-[10px] font-bold inline-block mb-2">GRATIS BELOHNUNG</div>
      <div className="font-manrope font-bold text-white mb-1">&ldquo;Die 5 Rollen einer Führungskraft&rdquo;</div>
      <div className="font-inter text-xs text-slate-500">von Wladislaw Jachtchenko · SPIEGEL-Bestseller</div>
    </div>
    <a
      href="https://www.remote-verlag.de/pages/5-rollen-fuehrungskraft"
      target="_blank"
      rel="noopener noreferrer"
      className="btn-secondary px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 shrink-0"
    >
      <BookOpen className="w-4 h-4" /> Buch sichern
    </a>
  </div>
);

export const ReportCTAs = () => {
  const navigate = useNavigate();
  return (
    <div className="border-t border-white/5 pt-10" data-testid="report-ctas">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 px-4 py-2 border border-[#C8FF00]/15 bg-[#C8FF00]/[0.03] mb-4">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#C8FF00] opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8FF00]" />
          </span>
          <span className="font-mono text-[11px] tracking-[0.2em] text-slate-400 font-medium uppercase">
            Erkenne dein Potenzial · <span className="text-[#C8FF00]">3 Ebenen</span> in 7 Minuten
          </span>
        </div>
        <h3 className="font-manrope font-extrabold text-2xl text-white mb-2">
          Du weisst jetzt wo du stehst.
        </h3>
        <p className="font-inter text-sm text-slate-500 max-w-lg mx-auto">
          Sprint zuerst, immer. Plus-Plus wenn du Live-Q&As mit unseren KI-Experten willst.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto">
        <button
          data-testid="report-cta-roadmap"
          onClick={() => navigate("/roadmap")}
          className="flex-1 px-6 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-manrope font-bold hover:border-[#C8FF00]/30 hover:bg-white/[0.06] transition-all inline-flex items-center justify-center gap-2"
        >
          30-Tage-Plan ansehen
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          data-testid="report-cta-close"
          onClick={() => navigate("/close")}
          className="flex-1 px-6 py-4 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold hover:shadow-xl hover:shadow-[#C8FF00]/20 transition-all inline-flex items-center justify-center gap-2"
        >
          <span>Sprint sichern</span>
          <span>997 EUR</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <p className="font-inter text-xs text-slate-600 text-center mt-4">
        14 Tage Geld-zurück · 12 Monate Plattform · WladBot 24/7 · Zertifikat 0001
      </p>
    </div>
  );
};
