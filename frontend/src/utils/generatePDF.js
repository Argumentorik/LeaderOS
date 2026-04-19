import jsPDF from "jspdf";

const COLORS = {
  bg: [10, 10, 10],
  cardBg: [18, 18, 20],
  accent: [200, 255, 0],
  blue: [200, 255, 0],
  white: [255, 255, 255],
  gray: [148, 163, 184],
  darkGray: [51, 65, 85],
  green: [200, 255, 0],
  red: [239, 68, 68],
};

const catLabels = {
  rhetorik: "Rhetorik",
  kritisches_denken: "Krit. Denken",
  entscheidung: "Entscheidung",
  fuehrung: "Fuhrung",
  eq: "Strateg. EQ",
  strategie: "KI-Strategie",
};

const layerLabels = {
  ai_literacy: "KI-Kompetenz",
  rhetoric: "Boardroom-Rhetorik",
  strategic_eq: "Strategisches EQ",
};

const roleLabels = {
  communicator: "Kommunikator",
  manager: "Manager",
  team_leader: "Team Leader",
  psychologist: "Psychologe",
  problem_solver: "Problemloser",
  innovator: "Innovator",
};

const roleColors = {
  communicator: [200, 255, 0],
  manager: [148, 163, 184],
  team_leader: [16, 185, 129],
  psychologist: [103, 232, 249],
  problem_solver: [244, 114, 182],
  innovator: [200, 255, 0],
};

function drawRoundedRect(doc, x, y, w, h, r, fillColor) {
  doc.setFillColor(...fillColor);
  doc.roundedRect(x, y, w, h, r, r, "F");
}

function drawProgressBar(doc, x, y, w, h, pct, barColor) {
  doc.setFillColor(30, 30, 35);
  doc.roundedRect(x, y, w, h, h / 2, h / 2, "F");
  if (pct > 0) {
    doc.setFillColor(...barColor);
    doc.roundedRect(x, y, w * (pct / 100), h, h / 2, h / 2, "F");
  }
}

export function generateReportPDF(report, user) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = 210;
  const margin = 18;
  const cw = pw - margin * 2;
  let y = 0;

  const { cat_scores = {}, layer_scores = {}, avg_total = 0, roi = {}, narrative = {}, leadership_roles = {}, strongest_role = {}, weakest_role = {} } = report;
  const userName = user?.name || "Leadership Report";
  const userRole = user?.role || "";

  // ===== PAGE 1: Cover =====
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, pw, 297, "F");

  // Top accent line
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, pw, 1.5, "F");

  // Logo area
  y = 28;
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(margin, y, 12, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.bg);
  doc.text("W", margin + 4, y + 8.5);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.white);
  doc.text("WLADHUB", margin + 17, y + 5);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text("LEADERSHIP DIAGNOSTIC PLATFORM", margin + 17, y + 10);

  // Main title section
  y = 70;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.accent);
  doc.text("AI LEADERSHIP REPORT", margin, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(...COLORS.white);
  doc.text(userName, margin, y);

  y += 10;
  if (userRole) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.gray);
    doc.text(userRole, margin, y);
  }

  // Score circle
  y = 120;
  drawRoundedRect(doc, margin, y, cw, 50, 4, COLORS.cardBg);

  const scoreColor = avg_total >= 70 ? COLORS.green : avg_total >= 50 ? COLORS.accent : COLORS.red;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.setTextColor(...scoreColor);
  doc.text(`${avg_total}%`, margin + 15, y + 33);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray);
  doc.text("GESAMTSCORE", margin + 15, y + 14);

  // Layer scores on the right
  const lx = margin + 80;
  let ly = y + 12;
  Object.entries(layerLabels).forEach(([key, label]) => {
    const score = layer_scores[key] || 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(label, lx, ly);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text(`${score}%`, lx + 70, ly, { align: "right" });
    drawProgressBar(doc, lx + 73, ly - 2.5, 40, 3, score, COLORS.blue);
    ly += 12;
  });

  // Profile title
  if (narrative.profile_title) {
    y = 185;
    drawRoundedRect(doc, margin, y, cw, 38, 4, COLORS.cardBg);
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(margin, y, 2, 38, 1, 1, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.accent);
    doc.text("DEIN FUHRUNGSPROFIL", margin + 8, y + 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.white);
    doc.text(narrative.profile_title, margin + 8, y + 20);

    if (narrative.executive_summary) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.gray);
      const lines = doc.splitTextToSize(narrative.executive_summary, cw - 16);
      doc.text(lines.slice(0, 2), margin + 8, y + 28);
    }
  }

  // 6 Leadership Roles
  if (Object.keys(leadership_roles).length > 0) {
    y = 228;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.accent);
    doc.text("6 LEADERSHIP-ROLLEN", margin, y);
    y += 7;
    
    const rw = (cw - 4) / 3;
    const entries = Object.entries(roleLabels);
    entries.forEach(([key, label], i) => {
      const score = leadership_roles[key] || 0;
      const row = Math.floor(i / 3);
      const col = i % 3;
      const rx = margin + col * (rw + 2);
      const ry = y + row * 22;
      const color = roleColors[key] || COLORS.blue;
      const isStrong = strongest_role?.key === key;
      const isWeak = weakest_role?.key === key;
      
      drawRoundedRect(doc, rx, ry, rw, 18, 2, COLORS.cardBg);
      if (isStrong) {
        doc.setFillColor(...COLORS.green);
        doc.roundedRect(rx, ry, rw, 1, 0.5, 0.5, "F");
      }
      if (isWeak) {
        doc.setFillColor(...COLORS.red);
        doc.roundedRect(rx, ry, rw, 1, 0.5, 0.5, "F");
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.white);
      doc.text(label, rx + rw/2, ry + 6, { align: "center" });
      
      drawProgressBar(doc, rx + 3, ry + 9, rw - 6, 2, score, color);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...color);
      doc.text(`${score}%`, rx + rw/2, ry + 16, { align: "center" });
    });
  }

  // 6 Dimensions
  y = 276;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.white);
  doc.text("6-Dimensionen-Analyse", margin, y);
  y += 8;

  Object.entries(catLabels).forEach(([key, label]) => {
    const score = cat_scores[key] || 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(label, margin, y + 3);
    drawProgressBar(doc, margin + 30, y, cw - 45, 3.5, score, COLORS.blue);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.white);
    doc.text(`${score}%`, margin + cw - 10, y + 3, { align: "right" });
    y += 8;
  });

  // Footer
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 70);
  doc.text("WLADHUB Confidential | Generated by AI", margin, 290);
  doc.text(new Date().toLocaleDateString("de-DE"), pw - margin, 290, { align: "right" });

  // ===== PAGE 2: Analysis & Recommendations =====
  doc.addPage();
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, pw, 297, "F");
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, pw, 1, "F");

  y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.accent);
  doc.text("PRESSURE PATTERNS & AI OPPORTUNITIES", margin, y);

  // Layer analysis boxes
  const analyses = [
    { key: "ai_literacy_analysis", title: "KI-Kompetenz", color: COLORS.blue },
    { key: "rhetoric_analysis", title: "Boardroom-Rhetorik", color: COLORS.blue },
    { key: "eq_analysis", title: "Strategisches EQ", color: COLORS.accent },
  ];

  y += 10;
  analyses.forEach(({ key, title, color }) => {
    if (!narrative[key]) return;
    drawRoundedRect(doc, margin, y, cw, 30, 3, COLORS.cardBg);
    doc.setFillColor(...color);
    doc.roundedRect(margin, y, 2, 30, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    doc.text(title, margin + 7, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray);
    const lines = doc.splitTextToSize(narrative[key], cw - 14);
    doc.text(lines.slice(0, 3), margin + 7, y + 15);
    y += 35;
  });

  // Strength + Growth
  if (narrative.top_strength) {
    y += 5;
    drawRoundedRect(doc, margin, y, cw / 2 - 3, 28, 3, COLORS.cardBg);
    doc.setFillColor(...COLORS.green);
    doc.roundedRect(margin, y, 2, 28, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.green);
    doc.text("STARKSTE KOMPETENZ", margin + 7, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    const sLines = doc.splitTextToSize(narrative.top_strength, cw / 2 - 16);
    doc.text(sLines.slice(0, 3), margin + 7, y + 14);
  }

  if (narrative.growth_priority) {
    const gx = margin + cw / 2 + 3;
    drawRoundedRect(doc, gx, y, cw / 2 - 3, 28, 3, COLORS.cardBg);
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(gx, y, 2, 28, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.accent);
    doc.text("WACHSTUMSPRIORITAT", gx + 7, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    const gLines = doc.splitTextToSize(narrative.growth_priority, cw / 2 - 16);
    doc.text(gLines.slice(0, 3), gx + 7, y + 14);
  }

  // Recommendations
  y += 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.accent);
  doc.text("STRATEGIC RECOMMENDATIONS", margin, y);
  y += 8;

  [narrative.recommendation_1, narrative.recommendation_2, narrative.recommendation_3].forEach((rec, i) => {
    if (!rec) return;
    if (y > 260) return; // prevent page overflow
    drawRoundedRect(doc, margin, y, cw, 22, 3, COLORS.cardBg);

    // Number circle
    doc.setFillColor(...(i === 2 ? COLORS.accent : COLORS.blue));
    doc.circle(margin + 8, y + 11, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.bg);
    doc.text(`${i + 1}`, margin + 6.5, y + 13.5);

    const title = typeof rec === "string" ? rec : (rec.title || "Empfehlung");
    const desc = typeof rec === "string" ? "" : (rec.description || "");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    doc.text(title, margin + 18, y + 9);

    if (desc) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.gray);
      const rLines = doc.splitTextToSize(desc, cw - 26);
      doc.text(rLines.slice(0, 1), margin + 18, y + 16);
    }

    y += 26;
  });

  // ROI Section
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.accent);
  doc.text("ROI-POTENTIAL NACH 30 TAGEN", margin, y);
  y += 8;

  drawRoundedRect(doc, margin, y, cw, 20, 3, COLORS.cardBg);
  const roiItems = [
    { val: `${roi.hours_saved || 0}h`, label: "gesparte Std./Woche" },
    { val: `${roi.decision_speed || 0}x`, label: "schnellere Entscheidungen" },
    { val: `+${roi.performance_boost || 0}%`, label: "Team-Performance" },
  ];
  const rw = cw / 3;
  roiItems.forEach((item, i) => {
    const rx = margin + i * rw;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.white);
    doc.text(item.val, rx + rw / 2, y + 9, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.gray);
    doc.text(item.label, rx + rw / 2, y + 15, { align: "center" });
  });

  // Footer page 2
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 70);
  doc.text("WLADHUB Confidential | Generated by AI", margin, 290);
  doc.text(`${userName} | ${new Date().toLocaleDateString("de-DE")}`, pw - margin, 290, { align: "right" });

  // ===== PAGE 3: 30-Day Plan =====
  doc.addPage();
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, pw, 297, "F");
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, pw, 1, "F");

  y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.accent);
  doc.text("30-DAY LEADERSHIP UPGRADE PLAN", margin, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Personalisiert fur ${userName}`, margin, y);

  const phases = [
    {
      week: "WOCHE 1",
      title: "Foundation",
      color: COLORS.blue,
      items: [
        "Baseline-Analyse deiner 6 Fuhrungsdimensionen",
        "KI-Tools Audit: Welche Tools nutzt du bereits?",
        "Kommunikationsmuster identifizieren",
        "EQ-Selbstreflexion: Starken & Trigger erkennen",
      ],
    },
    {
      week: "WOCHE 2",
      title: "Skill Building",
      color: COLORS.blue,
      items: [
        "KI-Entscheidungsframework implementieren",
        "Boardroom-Rhetorik: Argumentationsstruktur aufbauen",
        "Aktives Zuhoren in 3 kritischen Gesprachen uben",
        "Erste KI-gestutzte Prozessoptimierung starten",
      ],
    },
    {
      week: "WOCHE 3",
      title: "Integration",
      color: COLORS.accent,
      items: [
        "KI + Rhetorik kombinieren in einer Prasentation",
        "Schwierige Teamgesprache mit EQ-Framework fuhren",
        "Feedback-Loop mit 2-3 Vertrauenspersonen starten",
        "Strategische Positionierung im Unternehmen scharfen",
      ],
    },
    {
      week: "WOCHE 4",
      title: "Mastery",
      color: COLORS.accent,
      items: [
        "30-Tage-Review: Fortschritt messen vs. Baseline",
        "Leadership-Signature definieren",
        "Langfristige Wachstumsstrategie erstellen",
        "Nachste 90 Tage planen mit konkreten Meilensteinen",
      ],
    },
  ];

  y += 10;
  phases.forEach((phase) => {
    drawRoundedRect(doc, margin, y, cw, 42, 3, COLORS.cardBg);
    doc.setFillColor(...phase.color);
    doc.roundedRect(margin, y, 2, 42, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...phase.color);
    doc.text(phase.week, margin + 7, y + 8);
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.text(phase.title, margin + 30, y + 8);

    phase.items.forEach((item, i) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.gray);
      doc.text(`  ${item}`, margin + 11, y + 17 + i * 6);
    });

    y += 48;
  });

  // Closing
  y += 5;
  if (narrative.closing_statement) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    const closingLines = doc.splitTextToSize(`"${narrative.closing_statement}"`, cw - 20);
    doc.text(closingLines, pw / 2, y, { align: "center" });
  }

  // Footer page 3
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 70);
  doc.text("WLADHUB Confidential | Generated by AI", margin, 290);
  doc.text(`${userName} | ${new Date().toLocaleDateString("de-DE")}`, pw - margin, 290, { align: "right" });

  // Bottom branding
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 295, pw, 2, "F");

  // Save
  const safeName = userName.replace(/[^a-zA-Z0-9\s\-]/g, "").trim();
  doc.save(`WladHub - ${safeName} AI Report.pdf`);
}
