import jsPDF from "jspdf";

// jsPDF helvetica uses WinAnsi (cp1252). Umlauts work, but em-dashes, smart quotes,
// and other chars the AI might produce don't. Normalize to safe ASCII/latin-1.
function sanitize(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function sText(doc, text, x, y, opts) {
  doc.text(sanitize(text), x, y, opts);
}

function sSplit(doc, text, width) {
  return doc.splitTextToSize(sanitize(text), width);
}

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

  const { cat_scores = {}, layer_scores = {}, avg_total = 0, roi = {}, narrative = {}, leadership_roles = {}, strongest_role = {}, weakest_role = {}, user_challenge = null } = report;
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
  sText(doc, userName, margin, y);

  y += 10;
  if (userRole) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.gray);
    sText(doc, userRole, margin, y);
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
    sText(doc, narrative.profile_title, margin + 8, y + 20);

    if (narrative.executive_summary) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.gray);
      const lines = sSplit(doc, narrative.executive_summary, cw - 16);
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
    const lines = sSplit(doc, narrative[key], cw - 14);
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
    const sLines = sSplit(doc, narrative.top_strength, cw / 2 - 16);
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
    sText(doc, title, margin + 18, y + 9);

    if (desc) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.gray);
      const rLines = sSplit(doc, desc, cw - 26);
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
    const closingLines = sSplit(doc, `"${narrative.closing_statement}"`, cw - 20);
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


// =====================================================================================
// PERSONALIZED 30-DAY ROADMAP PDF (based on report + user's weakest role + journal entries)
// =====================================================================================
export function generateRoadmapPDF(report, user, journalEntries = []) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = 210;
  const ph = 297;
  const m = 18;
  const cw = pw - m * 2;
  let y = 0;

  const userName = user?.name || report?.user?.name || "Leader";
  const userRole = user?.role || report?.user?.role || "";
  const weakest = report?.weakest_role || {};
  const strongest = report?.strongest_role || {};
  const score = report?.avg_total || 0;
  const narrative = report?.narrative || {};
  const challenge = report?.user_challenge || "";

  const roleFocus = {
    communicator: {
      title: "Kommunikator-Fokus",
      why: "Deine Uberzeugungskraft und Boardroom-Prasenz sind dein starkster Hebel fur die nachsten 30 Tage.",
      weekly: [
        ["Baseline: 3 kritische Gesprachssituationen aus der letzten Woche dokumentieren", "Kernaussagen-Framework uben (1 Satz, 3 Belege, 1 Call-to-Action)", "Storytelling-Bibliothek anlegen: 5 eigene Leadership-Geschichten", "Stimm- und Korperarbeit: 10 Min. taglich vor der Kamera sprechen"],
        ["Boardroom-Rhetorik: Argumentationspyramide in 2 Meetings anwenden", "Einwandbehandlung uben: 'Ja und...' statt 'Ja aber...'", "Aktives Zuhoren: 1 Gesprach komplett ohne Unterbrechung fuhren", "Feedback von 3 Kollegen zu deiner Kommunikation einholen"],
        ["Schwieriges Gesprach fuhren: klar, direkt, wertschatzend", "Prasentation halten mit maximal 3 Kern-Botschaften", "KI-Prompt-Bibliothek fur E-Mails & Briefings bauen", "Non-verbale Signale bewusst setzen (Pause, Blickkontakt)"],
        ["30-Tage-Review: Welche Gesprache liefen jetzt anders?", "Kommunikations-Signature definieren (dein Stil in 3 Satzen)", "Next-90-Days: 3 Keynote-Momente vorbereiten", "Eine Leader-Story offentlich teilen (LinkedIn/Team)"],
      ],
    },
    manager: {
      title: "Manager-Fokus",
      why: "Struktur und Entscheidungsgeschwindigkeit sind dein Wachstumshebel Nr. 1.",
      weekly: [
        ["Eisenhower-Matrix auf deine nachsten 20 Tasks anwenden", "Not-to-Do-Liste erstellen (5 Dinge, die du sofort stoppst)", "Zeitaudit: Wo gehen wirklich deine 40h hin?", "ALPEN-Methode 7 Tage testen"],
        ["Entscheidungs-Framework: 2-Wege-vs-1-Wege-Turen unterscheiden", "Delegations-Matrix: Was kann weg, was muss rotieren?", "Wochenreview mit 3 Fragen (Win, Learn, Next)", "Pareto: Welche 20% deiner Arbeit bringen 80% Wirkung?"],
        ["SMART-Ziele fur dein Quartal scharfen", "KI-gestutzte Priorisierung einfuhren (Prompt-Template)", "1:1-Struktur fur dein Team standardisieren", "Decision-Log starten (jede grose Entscheidung + Grund)"],
        ["Review: Entscheidungsgeschwindigkeit vs. Baseline", "Meeting-Hygiene: 30% der Meetings streichen oder kurzen", "OKR-Draft fur nachstes Quartal", "Energiemanagement: tagliche Peak-Zeit identifizieren"],
      ],
    },
    team_leader: {
      title: "Team-Leader-Fokus",
      why: "Die Motivation und Kultur deines Teams ist dein starkster Hebel - hier liegt deine Wachstumszone.",
      weekly: [
        ["1:1 mit jedem Direct Report (fokus: 'Was brauchst du?')", "Teamrollen klar mappen (Wer ist fur was verantwortlich?)", "Anerkennung: 3 spezifische Danke-Nachrichten pro Tag", "Vertrauensmetrik: anonyme 3-Fragen-Umfrage"],
        ["Delegation ohne Micromanagement: 2 Projekte komplett abgeben", "Konflikte fruh adressieren (innerhalb 48h)", "Coaching-Fragen statt Antworten geben (GROW-Modell)", "Team-Ritual etablieren (Weekly-Win, Retros)"],
        ["Kultur-Manifest mit dem Team co-creieren", "Feedback-Schleife: 360-Grad-Input in einem Bereich", "Schwache Performance anpacken: klare Erwartung + Support", "Team-Lernbudget aktivieren (jeder 1 Kurs/Buch)"],
        ["Teamklima-Messung vs. Monat 0", "High-Performer identifizieren + Wachstumspfad definieren", "Nachfolge-Planung starten (wer kann welche Rolle?)", "Leader-Signature im Team verankern"],
      ],
    },
    psychologist: {
      title: "Empathie-Fokus",
      why: "Strategisches EQ und Menschenverstandnis sind dein grosster Hebel - Empathie als Wettbewerbsvorteil.",
      weekly: [
        ["Emotionales Tagebuch: 5 Min taglich Trigger + Reaktion", "Aktives Zuhoren in allen 1:1s ueben", "Pause vor Antwort - 3 Sekunden Atmen in kritischen Gesprachen", "Perspektiven-Ubung: In 3 Konflikten die andere Seite schreiben"],
        ["Psychologische Sicherheit: Fehler offen zugeben im Team", "Stress-Trigger bei dir + 3 wichtigen Personen identifizieren", "Nonverbale Signale trainieren (Spiegelneuronen nutzen)", "Empathie-Map fur 1 kritischen Stakeholder erstellen"],
        ["Schwierige Emotionen im Team adressieren (nicht wegmoderieren)", "Radikale Offenheit x Empathie in einem Feedback-Gesprach", "Selbstmitgefuhl-Ubung: Wie wurdest du einen Freund beraten?", "Vertrauenskonto bei Key-People aktiv auffullen"],
        ["EQ-Progress vs. Baseline messen", "Leader-Prasenz: ruhig, klar, menschlich in Druck-Situationen", "Emotionales Repertoire erweitern (mindestens 10 Gefuhle benennen)", "Mentoring oder Coaching bieten (1 Person)"],
      ],
    },
    problem_solver: {
      title: "Problemloser-Fokus",
      why: "Kritisches Denken und Entscheidungsklarheit sind dein Hebel - hier wirst du am schnellsten wachsen.",
      weekly: [
        ["First-Principles: 1 komplexes Problem komplett runterbrechen", "Bias-Check: eigene Entscheidungen der letzten Woche hinterfragen", "Problem-Framing ueben (Was ist das echte Problem?)", "Premortem: Was konnte scheitern? fur 1 Projekt"],
        ["MECE-Prinzip: Optionen sauber strukturieren", "Entscheidungs-Matrix mit Gewichtung anwenden", "5-Why-Analyse auf 1 wiederkehrendes Problem", "Second-Order-Thinking: Welche Folgen hat die Folge?"],
        ["Unter Druck entscheiden: 3 Entscheidungen in unter 24h", "Externe Perspektive einholen (3 Experten zu einem Problem)", "Gegenthesen-Ubung: eigene These 3x bewusst widerlegen", "Hypothesen-Baum fuer grose Initiative bauen"],
        ["Review: Entscheidungsqualitat vs. Baseline", "Playbook fur wiederkehrende Probleme dokumentieren", "Strategische Hebel identifizieren (1 Zahl andern = 10x Effekt)", "Next-Quarter Top-3 Probleme priorisieren"],
      ],
    },
    innovator: {
      title: "Innovator-Fokus",
      why: "KI-Vorsprung und strategische Weitsicht sind dein Hebel - hier baust du deinen Wettbewerbsvorteil.",
      weekly: [
        ["KI-Stack-Audit: welche Tools nutzt du vs. sollte nutzen?", "Prompt-Bibliothek fur deine 10 haufigsten Aufgaben", "1 Prozess vollstandig mit KI neu denken", "Trend-Radar: 5 Signale in deiner Branche wochentlich tracken"],
        ["Copilot-Setup fur dein Team standardisieren", "KI-Entscheidungsframework: wann Mensch, wann Maschine?", "Experiment starten: 1 mutige Hypothese in 7 Tagen testen", "Cross-Industry-Inspiration: 2 Branchen-fremde Innovationen"],
        ["Strategische Roadmap mit KI-Werkzeugen bauen", "Prototype shippen (auch wenn unfertig)", "Innovation-Budget definieren (Zeit + Geld)", "Netzwerk aktivieren: 3 Gesprache mit Innovatoren"],
        ["Review: Was wurde durch KI messbar schneller/besser?", "Innovation-Narrative: deine Vision in 1 Absatz", "90-Tage-Wette: 1 mutige Entscheidung mit Asymmetrie", "Leadership-Positionierung als KI-First-Leader sichtbar machen"],
      ],
    },
  };

  const focus = roleFocus[weakest?.key] || roleFocus.communicator;

  // ============ PAGE 1: COVER ============
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, pw, ph, "F");
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, pw, 2, "F");

  // Logo
  y = 28;
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(m, y, 12, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.bg);
  doc.text("W", m + 4, y + 8.5);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.white);
  doc.text("WLADHUB", m + 17, y + 5);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text("30-DAY LEADERSHIP UPGRADE", m + 17, y + 10);

  y = 74;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.accent);
  doc.text("PERSONALISIERTER 30-TAGE-PLAN", m, y);

  y += 12;
  doc.setFontSize(32);
  doc.setTextColor(...COLORS.white);
  sText(doc, userName, m, y);

  y += 10;
  if (userRole) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.gray);
    sText(doc, userRole, m, y);
  }

  // Score + Focus card
  y = 128;
  drawRoundedRect(doc, m, y, cw, 42, 4, COLORS.cardBg);
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(m, y, 2, 42, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.accent);
  doc.text("DEIN FOKUS FUR 30 TAGE", m + 8, y + 9);

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  sText(doc, focus.title, m + 8, y + 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  const focusLines = sSplit(doc, focus.why, cw - 16);
  doc.text(focusLines.slice(0, 3), m + 8, y + 28);

  // Stats bar
  y = 180;
  const stats = [
    { label: "Gesamtscore", val: `${score}%` },
    { label: "Starkste Rolle", val: strongest?.label || "-" },
    { label: "Wachstum", val: weakest?.label || "-" },
  ];
  const sw = cw / 3;
  stats.forEach((s, i) => {
    const sx = m + i * sw;
    drawRoundedRect(doc, sx + 2, y, sw - 4, 26, 3, COLORS.cardBg);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.gray);
    doc.text(s.label.toUpperCase(), sx + sw / 2, y + 9, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.accent);
    sText(doc, s.val, sx + sw / 2, y + 20, { align: "center" });
  });

  // Challenge box (THE PROOF THAT WE LISTENED)
  if (challenge) {
    y = 218;
    drawRoundedRect(doc, m, y, cw, 42, 4, COLORS.cardBg);
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(m, y, 2, 42, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.accent);
    doc.text("DEINE HERAUSFORDERUNG (DEINE WORTE)", m + 8, y + 9);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    const chLines = sSplit(doc, `"${challenge}"`, cw - 16);
    doc.text(chLines.slice(0, 4), m + 8, y + 18);
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 70);
  doc.text("WLADHUB Confidential | 30-Day Roadmap", m, 290);
  sText(doc, `${userName} | ${new Date().toLocaleDateString("de-DE")}`, pw - m, 290, { align: "right" });

  // ============ PAGE 2: 4-Week Plan ============
  doc.addPage();
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, pw, ph, "F");
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, pw, 1, "F");

  y = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.accent);
  doc.text("DEIN 4-WOCHEN-FAHRPLAN", m, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.gray);
  sText(doc, `Personalisiert fur ${userName} - Priorisiert auf ${focus.title}`, m, y);
  y += 8;

  const weeks = ["WOCHE 1 - Foundation", "WOCHE 2 - Skill Building", "WOCHE 3 - Integration", "WOCHE 4 - Mastery"];
  focus.weekly.forEach((items, wi) => {
    const boxH = 58;
    drawRoundedRect(doc, m, y, cw, boxH, 3, COLORS.cardBg);
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(m, y, 2, boxH, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.accent);
    doc.text(weeks[wi], m + 7, y + 9);

    items.forEach((item, ii) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.white);
      doc.text(`${ii + 1}.`, m + 8, y + 18 + ii * 10);
      doc.setTextColor(...COLORS.gray);
      const lines = sSplit(doc, item, cw - 22);
      doc.text(lines.slice(0, 2), m + 14, y + 18 + ii * 10);
    });

    y += boxH + 4;
  });

  doc.setFontSize(6);
  doc.setTextColor(60, 60, 70);
  doc.text("WLADHUB Confidential | 30-Day Roadmap", m, 290);
  sText(doc, `${userName} | ${new Date().toLocaleDateString("de-DE")}`, pw - m, 290, { align: "right" });

  // ============ PAGE 3: Journal + Recommendations ============
  if ((journalEntries && journalEntries.filter(Boolean).length > 0) || narrative.recommendation_1) {
    doc.addPage();
    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 0, pw, ph, "F");
    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 0, pw, 1, "F");

    y = 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.accent);
    doc.text("DEINE COMMITMENTS & EMPFEHLUNGEN", m, y);
    y += 10;

    const journalFilled = (journalEntries || []).filter(Boolean);
    if (journalFilled.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.white);
      doc.text("Deine Commitments", m, y);
      y += 6;
      journalFilled.slice(0, 6).forEach((entry, i) => {
        drawRoundedRect(doc, m, y, cw, 14, 2, COLORS.cardBg);
        doc.setFillColor(...COLORS.accent);
        doc.roundedRect(m, y, 1.5, 14, 0.5, 0.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.accent);
        doc.text(`${i + 1}`, m + 5, y + 9);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.white);
        const lines = sSplit(doc, entry, cw - 14);
        doc.text(lines.slice(0, 1), m + 10, y + 9);
        y += 17;
      });
      y += 4;
    }

    // Top 3 recommendations from report
    const recs = [narrative.recommendation_1, narrative.recommendation_2, narrative.recommendation_3].filter(Boolean);
    if (recs.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.white);
      doc.text("Strategische Empfehlungen aus deinem Report", m, y);
      y += 6;
      recs.forEach((rec, i) => {
        if (y > 260) return;
        drawRoundedRect(doc, m, y, cw, 22, 3, COLORS.cardBg);
        doc.setFillColor(...COLORS.accent);
        doc.circle(m + 8, y + 11, 5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.bg);
        doc.text(`${i + 1}`, m + 6.5, y + 13.5);

        const title = typeof rec === "string" ? rec : rec.title || "Empfehlung";
        const desc = typeof rec === "string" ? "" : rec.description || "";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.white);
        sText(doc, title, m + 18, y + 9);
        if (desc) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...COLORS.gray);
          const rLines = sSplit(doc, desc, cw - 26);
          doc.text(rLines.slice(0, 2), m + 18, y + 15);
        }
        y += 26;
      });
    }

    // Closing
    y = Math.max(y, 250);
    if (narrative.closing_statement) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.white);
      const closing = sSplit(doc, `"${narrative.closing_statement}"`, cw - 20);
      doc.text(closing.slice(0, 3), pw / 2, y, { align: "center" });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(60, 60, 70);
    doc.text("WLADHUB Confidential | 30-Day Roadmap", m, 290);
    sText(doc, `${userName} | ${new Date().toLocaleDateString("de-DE")}`, pw - m, 290, { align: "right" });
  }

  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 295, pw, 2, "F");

  const safe = userName.replace(/[^a-zA-Z0-9\s\-]/g, "").trim() || "Leader";
  doc.save(`WladHub - ${safe} 30-Tage-Plan.pdf`);
}
