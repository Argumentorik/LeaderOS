import { useState, useEffect } from "react";
import { Sparkles, Download } from "lucide-react";
import { generateRoadmapPDF } from "../utils/generatePDF";
import { recoverReportFromServer } from "../utils/reportRecovery";
import { roleLabels } from "../components/roadmap/roadmapData";
import { RoadmapAgents, RoadmapSpecialEvents } from "../components/roadmap/RoadmapAgents";
import { RoadmapWeeklyPlan } from "../components/roadmap/RoadmapWeeklyPlan";
import { RoadmapJournal, WladBotMotivation } from "../components/roadmap/RoadmapJournal";
import { RoadmapCourses, RoadmapCTA, RoadmapUpsellPopup } from "../components/roadmap/RoadmapCourses";

export default function Roadmap() {
  const [entries, setEntries] = useState(Array(6).fill(""));
  const [showWladBot, setShowWladBot] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const filledCount = entries.filter(e => e.trim()).length;

  // Dynamic: Read report results to personalize the plan
  const [weakestRole, setWeakestRole] = useState(null);
  const [userScore, setUserScore] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const applyReport = (report) => {
      if (report.avg_total) setUserScore(report.avg_total);
      if (report.weakest_role?.key) setWeakestRole(report.weakest_role.key);
      if (!report.weakest_role?.key && report.leadership_roles) {
        const sorted = Object.entries(report.leadership_roles).sort((a, b) => a[1] - b[1]);
        if (sorted.length > 0) setWeakestRole(sorted[0][0]);
      }
    };
    try {
      const report = JSON.parse(localStorage.getItem("emergent_report") || "{}");
      const usr = JSON.parse(localStorage.getItem("emergent_user") || "{}");
      if (usr.name) setUserName(usr.name);
      if (report.session_id) {
        applyReport(report);
      } else {
        // Storage wiped (crash/reload) — recover from server for personalization
        recoverReportFromServer().then((recovered) => {
          if (recovered) applyReport(recovered);
        });
      }
    } catch (err) {
      // Non-critical: report data enhances UX but page works without it
      if (process.env.NODE_ENV !== "production") console.warn("Roadmap report parse:", err);
    }
  }, []);

  const handleEntry = (i, val) => {
    const next = [...entries];
    next[i] = val;
    setEntries(next);
    if (next.filter(e => e.trim()).length >= 6 && !showWladBot) {
      setTimeout(() => setShowWladBot(true), 500);
    }
  };

  // Popup only once per session, with 30s delay
  useEffect(() => {
    if (!showWladBot) return;
    const alreadyShown = sessionStorage.getItem("leaderos_popup_shown");
    if (alreadyShown) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem("leaderos_popup_shown", "true");
      setShowPopup(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [showWladBot]);

  const handleDownloadPDF = () => {
    try {
      const report = JSON.parse(localStorage.getItem("emergent_report") || "{}");
      const usr = JSON.parse(localStorage.getItem("emergent_user") || "{}");
      generateRoadmapPDF(report, usr, entries);
    } catch (err) {
      console.error("Roadmap PDF error:", err);
      alert("PDF-Fehler: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24" data-testid="roadmap-page">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#C8FF00]/[0.02] rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-[#C8FF00]/[0.015] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        {/* Header · Personalized */}
        <div className="text-center mb-14">
          <div className="badge-lime px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" />
            {userName ? `${userName}, dein Weg zur Führungsstärke` : "Dein Weg zur Führungsstärke"}
          </div>
          <h1 className="font-manrope font-extrabold text-4xl md:text-5xl text-white mb-4" data-testid="roadmap-title">
            30 Tage zur <span className="text-gradient-lime">strategischen Dominanz</span>
          </h1>
          <p className="font-inter text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
            {userScore > 0 ? (
              <>Dein Score: <span className="text-white font-semibold">{userScore}%</span>. {userScore >= 70 ? "Stark · jetzt die letzten Prozente herausholen." : userScore >= 50 ? "Solide Basis · mit dem richtigen Plan wird daraus Exzellenz." : "Großes Wachstumspotenzial · genau dafür ist dieser Plan gemacht."}</>
            ) : (
              <>6 spezialisierte KI-Agenten. 6 Kurse. Persönliches Coaching.</>
            )}
          </p>
          {weakestRole && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C8FF00]/[0.06] border border-[#C8FF00]/15" data-testid="personalized-hint">
              <Sparkles className="w-4 h-4 text-[#C8FF00]" />
              <span className="font-inter text-sm text-[#C8FF00]/80">
                Dein Plan priorisiert <strong>{roleLabels[weakestRole] || weakestRole}</strong> · dein größtes Wachstumspotenzial
              </span>
            </div>
          )}

          {/* Download personalized 30-day plan */}
          <div className="mt-6 flex justify-center">
            <button
              data-testid="roadmap-download-pdf"
              onClick={handleDownloadPDF}
              className="btn-secondary px-6 py-3 text-sm font-medium inline-flex items-center gap-2 hover:border-[#C8FF00]/30 transition-all"
            >
              <Download className="w-4 h-4" />
              30-Tage-Plan als PDF herunterladen
            </button>
          </div>
        </div>

        <RoadmapAgents />
        <RoadmapWeeklyPlan activeWeek={activeWeek} setActiveWeek={setActiveWeek} />
        <RoadmapSpecialEvents />
        <RoadmapJournal entries={entries} handleEntry={handleEntry} filledCount={filledCount} />
        {showWladBot && <WladBotMotivation />}
        <RoadmapCourses />
        <RoadmapCTA filledCount={filledCount} />
      </div>

      {showPopup && <RoadmapUpsellPopup onClose={() => setShowPopup(false)} />}
    </div>
  );
}
