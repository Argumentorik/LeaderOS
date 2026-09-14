import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ExitIntentPopup from "../components/ExitIntentPopup";
import { recoverReportFromServer } from "../utils/reportRecovery";
import { catLabels, roleConfig } from "../components/report/reportConfig";
import { ReportHeader } from "../components/report/ReportHeader";
import { ReportRoles } from "../components/report/ReportRoles";
import { ReportLayers, ReportRadarROI } from "../components/report/ReportCharts";
import { ReportRecommendations, ReportAgentEcosystem, ReportCredo } from "../components/report/ReportInsights";
import { Report30DayPlan, ReportBookUpsell, ReportCTAs } from "../components/report/ReportPlan";

export default function Report() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [user, setUser] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const rawUser = localStorage.getItem("emergent_user");
      let data = null;
      try { data = JSON.parse(localStorage.getItem("emergent_report")); } catch { /* corrupted */ }
      if (!data) {
        // Browser storage wiped (crash/reload/new tab) — the report still
        // lives on the server, recover it instead of bouncing to the start.
        data = await recoverReportFromServer();
      }
      if (cancelled) return;
      if (!data) { navigate("/"); return; }
      setReport(data);
      if (rawUser) setUser(JSON.parse(rawUser));
      if (data.user) setUser(prev => ({ ...prev, ...data.user }));
      setTimeout(() => { if (!cancelled) setEmailSent(true); }, 3000);
    };
    load();
    return () => { cancelled = true; };
  }, [navigate]);

  const leadership_roles = useMemo(() => report?.leadership_roles || {}, [report]);

  const weakestRoles = useMemo(() =>
    [...roleConfig]
      .sort((a, b) => (leadership_roles[a.key] ?? 50) - (leadership_roles[b.key] ?? 50))
      .slice(0, 3),
    [leadership_roles]
  );

  if (!report) return null;

  const { cat_scores = {}, layer_scores = {}, avg_total = 0, roi = {}, narrative = {}, strongest_role = {}, weakest_role = {} } = report;
  const displayUser = user || report.user || {};

  const radarData = Object.entries(catLabels).map(([key, label]) => ({
    subject: label, score: cat_scores[key] || 0, fullMark: 100,
  }));

  const scoreColor = avg_total >= 70 ? "#C8FF00" : avg_total >= 50 ? "#C8FF00" : "#EF4444";

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24" data-testid="report-page">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#C8FF00]/[0.02] rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-[#C8FF00]/[0.015] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        <ReportHeader
          report={report}
          displayUser={displayUser}
          emailSent={emailSent}
          avg_total={avg_total}
          scoreColor={scoreColor}
          narrative={narrative}
        />
        <ReportRoles
          leadership_roles={leadership_roles}
          strongest_role={strongest_role}
          weakest_role={weakest_role}
        />
        <ReportLayers layer_scores={layer_scores} narrative={narrative} />
        <ReportRadarROI radarData={radarData} cat_scores={cat_scores} roi={roi} narrative={narrative} />
        <ReportRecommendations narrative={narrative} />
        <ReportAgentEcosystem />
        <ReportCredo narrative={narrative} />
        <Report30DayPlan weakestRoles={weakestRoles} />
        <ReportBookUpsell />
        <ReportCTAs />
      </div>
      <ExitIntentPopup />
    </div>
  );
}
