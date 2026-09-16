import jsPDF from 'jspdf';
import { deepUnescape } from './textClean';

/**
 * Premium branded PDF generator — WladBot Leadership OS
 * Supports all result types from workflows, playbooks, simulations
 */
export async function generatePDF(rawReportData, filename = 'WladBot-Report') {
  // Iter 184: keine Rohzeichen (\n, \u201e) im exportierten PDF.
  const reportData = deepUnescape(rawReportData) || {};
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 0;

  const brand = [107, 138, 0];
  const dark = [30, 30, 40];
  const gray = [120, 120, 135];
  const green = [16, 185, 129];
  const amber = [245, 158, 11];
  const blue = [59, 130, 246];
  const rose = [244, 63, 94];
  const violet = [124, 58, 237];

  const checkNewPage = (needed = 20) => {
    if (y > 270 - needed) { doc.addPage(); y = 20; }
  };

  const addSection = (title, items, color = brand) => {
    if (!items?.length) return;
    checkNewPage(30);
    // Section header: colored chip + title + hairline
    doc.setFillColor(...color);
    doc.roundedRect(margin, y - 4, 3, 5.5, 1, 1, 'F');
    doc.setTextColor(...dark);
    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), margin + 6, y);
    doc.setDrawColor(230, 230, 236);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 2.5, margin + contentWidth, y + 2.5);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    items.forEach((item, i) => {
      checkNewPage();
      const text = typeof item === 'string'
        ? item
        : [item.time, item.activity || item.task || item.goal || item.topic || item.action, item.duration ? `(${item.duration})` : '', item.why]
            .filter(Boolean).join(' — ');
      const lines = doc.splitTextToSize(text, contentWidth - 12);
      doc.setTextColor(...color);
      doc.setFont('helvetica', 'bold');
      doc.text(`${String(i + 1).padStart(2, '0')}`, margin + 1, y);
      doc.setTextColor(...dark);
      doc.setFont('helvetica', 'normal');
      doc.text(lines, margin + 10, y);
      y += lines.length * 4.5 + 2.5;
    });
    y += 5;
  };

  // ── Premium cover header: deep-black band + lime accent (100M-App look) ──
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageWidth, 48, 'F');
  doc.setFillColor(191, 255, 0);
  doc.rect(0, 48, pageWidth, 1.4, 'F');

  doc.setTextColor(191, 255, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('L E A D E R · O S   —   P O W E R E D   B Y   W L A D B O T   3 . 0', margin, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(19);
  const titleText = reportData.title || 'Leadership Report';
  const titleLines = doc.splitTextToSize(titleText, contentWidth);
  doc.text(titleLines, margin, 26);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 170);
  doc.text(
    `${new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}  ·  Basierend auf Wlad Jachtchenkos Frameworks  ·  leaderos.de`,
    margin, 26 + titleLines.length * 8 + 2
  );

  y = 60;

  // Overall Assessment
  if (reportData.overall_assessment) {
    doc.setTextColor(...dark);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Gesamtbewertung', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    const lines = doc.splitTextToSize(reportData.overall_assessment, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 8;
  }

  // Score
  if (reportData.score !== undefined) {
    checkNewPage(30);
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F');
    doc.setTextColor(...brand);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(`${reportData.score}/100`, margin + 8, y + 15);
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('Leader Score', margin + 42, y + 15);
    y += 30;
  }

  // Conversation Plan
  if (reportData.conversation_plan) {
    checkNewPage(30);
    doc.setTextColor(...blue);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Gesprächsplan', margin, y);
    y += 7;
    doc.setTextColor(...dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (reportData.conversation_plan.opening) {
      const lines = doc.splitTextToSize(`Eröffnung: ${reportData.conversation_plan.opening}`, contentWidth - 5);
      doc.text(lines, margin + 3, y); y += lines.length * 4.5 + 2;
    }
    reportData.conversation_plan.main_points?.forEach((p, i) => {
      checkNewPage();
      const lines = doc.splitTextToSize(`${i + 1}. ${p}`, contentWidth - 5);
      doc.text(lines, margin + 3, y); y += lines.length * 4.5 + 2;
    });
    if (reportData.conversation_plan.closing) {
      const lines = doc.splitTextToSize(`Abschluss: ${reportData.conversation_plan.closing}`, contentWidth - 5);
      doc.text(lines, margin + 3, y); y += lines.length * 4.5 + 2;
    }
    y += 5;
  }

  // Insights
  addSection('Top Erkenntnisse', reportData.top_10_insights, brand);

  // Feedback Formulations
  addSection('Feedback-Formulierungen', reportData.feedback_formulations, green);

  // Guide Questions
  addSection('Leitfragen', reportData.guide_questions, amber);

  // Optimized Text
  if (reportData.optimized_text) {
    checkNewPage(20);
    doc.setTextColor(...blue);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Optimierte Version', margin, y);
    y += 7;
    doc.setTextColor(...dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(reportData.optimized_text, contentWidth);
    lines.forEach(line => { checkNewPage(); doc.text(line, margin, y); y += 4.5; });
    y += 5;
  }

  // Pros & Cons
  const halfWidth = (contentWidth - 6) / 2;
  if (reportData.pros?.length || reportData.cons?.length) {
    checkNewPage(40);
    if (reportData.pros?.length) {
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(margin, y, halfWidth, 10 + reportData.pros.length * 5, 2, 2, 'F');
      doc.setTextColor(...green);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PRO', margin + 4, y + 7);
      doc.setTextColor(...dark);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      reportData.pros.forEach((s, i) => {
        const lines = doc.splitTextToSize(`+ ${s}`, halfWidth - 10);
        doc.text(lines, margin + 4, y + 13 + i * 5);
      });
    }
    if (reportData.cons?.length) {
      const x2 = margin + halfWidth + 6;
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(x2, y, halfWidth, 10 + reportData.cons.length * 5, 2, 2, 'F');
      doc.setTextColor(...rose);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTRA', x2 + 4, y + 7);
      doc.setTextColor(...dark);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      reportData.cons.forEach((s, i) => {
        const lines = doc.splitTextToSize(`- ${s}`, halfWidth - 10);
        doc.text(lines, x2 + 4, y + 13 + i * 5);
      });
    }
    const maxItems = Math.max(reportData.pros?.length || 0, reportData.cons?.length || 0);
    y += 16 + maxItems * 5;
  }

  // Recommendation
  if (reportData.recommendation) {
    checkNewPage(20);
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
    doc.setTextColor(...brand);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Empfehlung', margin + 6, y + 7);
    doc.setTextColor(...dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(reportData.recommendation, contentWidth - 14);
    doc.text(lines, margin + 6, y + 13);
    y += 22 + (lines.length - 1) * 4;
  }

  // Counter-Check
  if (reportData.counter_check) {
    checkNewPage(20);
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
    doc.setTextColor(...amber);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Gegencheck (Devil's Advocate)", margin + 6, y + 7);
    doc.setTextColor(...dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(reportData.counter_check, contentWidth - 14);
    doc.text(lines, margin + 6, y + 13);
    y += 22 + (lines.length - 1) * 4;
  }

  // Strengths & Improvements
  if (reportData.strengths?.length || reportData.improvements?.length) {
    checkNewPage(40);
    if (reportData.strengths?.length) {
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(margin, y, halfWidth, 10 + reportData.strengths.length * 5, 2, 2, 'F');
      doc.setTextColor(...green);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Stärken', margin + 4, y + 7);
      doc.setTextColor(...dark);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      reportData.strengths.forEach((s, i) => doc.text(`+ ${s}`, margin + 4, y + 13 + i * 5));
    }
    if (reportData.improvements?.length) {
      const x2 = margin + halfWidth + 6;
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(x2, y, halfWidth, 10 + reportData.improvements.length * 5, 2, 2, 'F');
      doc.setTextColor(...amber);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Verbesserungspotenzial', x2 + 4, y + 7);
      doc.setTextColor(...dark);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      reportData.improvements.forEach((s, i) => doc.text(`- ${s}`, x2 + 4, y + 13 + i * 5));
    }
    const maxItems = Math.max(reportData.strengths?.length || 0, reportData.improvements?.length || 0);
    y += 16 + maxItems * 5;
  }

  // High Impact Tasks
  addSection('Hoher Impact — Sofort umsetzen', reportData.high_impact, blue);

  // Development Plan
  addSection('Entwicklungsplan', reportData.development_plan, violet);

  // Agenda
  addSection('Agenda', reportData.agenda, amber);

  // Next Steps
  addSection('Nächste Schritte', reportData.next_steps, violet);

  // Leadership Recommendations
  addSection('Leadership-Empfehlungen', reportData.leadership_recommendations, brand);

  // Generic result text
  if (reportData.result && typeof reportData.result === 'string') {
    checkNewPage(20);
    doc.setTextColor(...dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(reportData.result, contentWidth);
    lines.forEach(line => { checkNewPage(); doc.text(line, margin, y); y += 4.5; });
    y += 5;
  }

  // Footer on all pages — dark band + lime page marker
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 286, pageWidth, 11, 'F');
    doc.setFillColor(191, 255, 0);
    doc.rect(0, 286, pageWidth, 0.8, 'F');
    doc.setTextColor(200, 200, 210);
    doc.setFontSize(7);
    doc.text('Leader·OS — Dein Leadership Operating System · Basierend auf Wlad Jachtchenkos Methodik', margin, 292.5);
    doc.setTextColor(191, 255, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i} / ${pageCount}`, pageWidth - margin, 292.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  }

  doc.save(`${filename}.pdf`);
}
