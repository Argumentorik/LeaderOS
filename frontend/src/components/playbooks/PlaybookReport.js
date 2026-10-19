import { Button } from '../ui/button';
import { Check, ArrowRight, Download, Star, Calendar } from 'lucide-react';
import SmartText from '../shared/SmartText';
import { openHeadCoachCall } from '../../lib/calendly';

export const PlaybookReport = ({ adviceReport, onDownloadPDF, generatingPDF, de }) => (
  <div className="space-y-3 mt-2">
    {adviceReport.overall_assessment && (
      <div className="bg-white dark:bg-card rounded-xl p-4 border border-black/[0.04] dark:border-white/[0.06] shadow-sm">
        <SmartText text={adviceReport.overall_assessment} accent="#BFFF00" icon={Star} />
      </div>
    )}
    {adviceReport.strengths?.length > 0 && (
      <div className="bg-emerald-50/50 dark:bg-emerald-500/5 rounded-xl px-4 py-3 border border-emerald-200/30 dark:border-emerald-500/10">
        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">{de ? 'Stärken' : 'Strengths'}</p>
        {adviceReport.strengths.map((s, j) => (
          <div key={`str-${j}-${s.slice(0,15)}`} className="flex items-start gap-2 text-[12px] mb-1"><Check size={11} className="text-emerald-500 shrink-0 mt-0.5" /><span>{s}</span></div>
        ))}
      </div>
    )}
    {adviceReport.improvements?.length > 0 && (
      <div className="bg-amber-50/50 dark:bg-amber-500/5 rounded-xl px-4 py-3 border border-amber-200/30 dark:border-amber-500/10">
        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">{de ? 'Verbesserungspotenzial' : 'Areas to Improve'}</p>
        {adviceReport.improvements.map((s, j) => (
          <div key={`imp-${j}-${s.slice(0,15)}`} className="flex items-start gap-2 text-[12px] mb-1"><ArrowRight size={11} className="text-amber-500 shrink-0 mt-0.5" /><span>{s}</span></div>
        ))}
      </div>
    )}
    <div className="flex gap-2">
      <Button onClick={onDownloadPDF} disabled={generatingPDF}
        className="bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-semibold flex-1 shadow-lg" data-testid="download-pdf-btn">
        <Download size={13} className="mr-1.5" /> PDF Report
      </Button>
    </div>
    <div className="upsell-border">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shrink-0 shadow-sm">
          <Calendar size={16} className="text-[#0A0A0A]" />
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-bold">{de ? 'Termin mit Wlads Head Coach buchen' : 'Book a session with Wlad\'s Head Coach'}</p>
          <p className="text-[10px] text-muted-foreground">{de ? 'Setze die Erkenntnisse mit Expertenbegleitung um · Erstgespräch 1:1' : 'Implement insights with expert guidance · 1:1 onboarding call'}</p>
        </div>
        <Button size="sm" onClick={() => openHeadCoachCall('playbook-report')}
          className="bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-semibold shrink-0" data-testid="playbook-coach-btn">
          {de ? 'Termin buchen' : 'Book Call'} <ArrowRight size={12} className="ml-1" />
        </Button>
      </div>
    </div>
  </div>
);
