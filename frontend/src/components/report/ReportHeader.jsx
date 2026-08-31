import { Sparkles, Star, Bot, MessageCircle, Download, Mail } from "lucide-react";
import { generateReportPDF } from "../../utils/generatePDF";

export const ReportHeader = ({ report, displayUser, emailSent, avg_total, scoreColor, narrative }) => (
  <>
    {emailSent && displayUser?.email && (
      <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#C8FF00]/[0.04] border border-[#C8FF00]/10 animate-fade-in" data-testid="email-notification">
        <Mail className="w-4 h-4 text-[#C8FF00] shrink-0" />
        <span className="font-inter text-sm text-slate-400">
          Report wurde an <span className="text-white font-medium">{displayUser.email}</span> gesendet
        </span>
      </div>
    )}
    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
      <div>
        <div className="badge-blue px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4" />
          Dein Leader OS Leadership-Report
        </div>
        <h1 className="font-manrope font-extrabold text-4xl md:text-5xl text-white mb-2" data-testid="report-name">
          {displayUser?.name || "Leadership Report"}
        </h1>
        <p className="font-inter text-slate-500">{displayUser?.role}</p>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div>
          <div className="font-inter text-sm text-slate-600 mb-2 text-right">Gesamtscore</div>
          <div
            className="font-manrope font-extrabold text-5xl md:text-6xl"
            style={{ color: scoreColor }}
            data-testid="report-total-score"
          >
            {avg_total}%
          </div>
        </div>
        <button
          data-testid="report-download-pdf"
          onClick={() => {
            try {
              generateReportPDF(report, displayUser);
            } catch (err) {
              console.error("PDF generation error:", err);
              alert("PDF-Fehler: " + err.message);
            }
          }}
          className="btn-secondary px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 hover:border-[#C8FF00]/30 transition-all"
        >
          <Download className="w-4 h-4" />
          Report herunterladen
        </button>
      </div>
    </div>

    {/* Profile Title Card */}
    {narrative.profile_title && (
      <div className="glass-card p-8 mb-10 card-glow-lime" data-testid="report-profile-title">
        <div className="badge-lime px-3 py-1.5 text-xs inline-flex items-center gap-2 mb-4">
          <Star className="w-3 h-3" />
          Dein Führungsprofil
        </div>
        <h2
          className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-4"
          data-testid="report-profile-title-headline"
        >
          {narrative.profile_title}
        </h2>
        {narrative.executive_summary && (
          <p className="font-inter text-slate-300 leading-relaxed">{narrative.executive_summary}</p>
        )}
      </div>
    )}

    {/* Personal Response: PROOF that WladBot listened */}
    {report.user_challenge && (
      <div className="glass-card p-6 md:p-8 mb-10 border border-[#C8FF00]/15 bg-[#C8FF00]/[0.03]" data-testid="report-personal-response">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/[0.08] border border-[#C8FF00]/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#C8FF00]" />
          </div>
          <div className="flex-1">
            <div className="badge-lime px-3 py-1 text-xs inline-flex items-center gap-2 mb-3">
              <MessageCircle className="w-3 h-3" />
              Wlad hat dir zugehört
            </div>
            <div className="mb-4 pl-4 border-l-2 border-[#C8FF00]/30">
              <p className="font-inter text-sm text-slate-400 italic leading-relaxed">
                „{report.user_challenge}&ldquo;
              </p>
            </div>
            {narrative.personal_response && (
              <p className="font-inter text-slate-200 leading-relaxed">
                {narrative.personal_response}
              </p>
            )}
            {!narrative.personal_response && narrative.urgency_message && (
              <p className="font-inter text-slate-200 leading-relaxed">
                {narrative.urgency_message}
              </p>
            )}
          </div>
        </div>
      </div>
    )}
  </>
);
