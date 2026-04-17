import jsPDF from "jspdf";

export function generateCurriculumPDF() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = 210;
  const m = 18;
  const cw = pw - m * 2;
  let y = 0;

  const BG = [10, 10, 10];
  const CARD = [18, 18, 20];
  const LIME = [200, 255, 0];
  const WHITE = [255, 255, 255];
  const GRAY = [148, 163, 184];

  // === PAGE 1: Cover ===
  doc.setFillColor(...BG);
  doc.rect(0, 0, pw, 297, "F");
  doc.setFillColor(...LIME);
  doc.rect(0, 0, pw, 2, "F");

  // Logo
  y = 30;
  doc.setFillColor(...LIME);
  doc.roundedRect(m, y, 14, 14, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BG);
  doc.text("W", m + 4.5, y + 10);
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.text("WLADHUB", m + 19, y + 6);
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("LEADERSHIP DIAGNOSTIC PLATFORM", m + 19, y + 12);

  y = 70;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...LIME);
  doc.text("CURRICULUM", m, y);
  y += 12;
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text("Leadership Upgrade", m, y);
  y += 12;
  doc.text("Programm", m, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text("Das komplette 30-Tage Leadership-System", m, y);

  // Modules
  const modules = [
    { num: "01", title: "KI-Kompetenz", desc: "KI als strategischen Fuhrungshebel einsetzen. Entscheidungsprozesse automatisieren und optimieren." },
    { num: "02", title: "Boardroom-Rhetorik", desc: "Uberzeugungskraft in kritischen Situationen. Argumentationsstruktur und souverane Prasenz." },
    { num: "03", title: "Strategisches EQ", desc: "Empathie als Wettbewerbsvorteil nutzen. Teamdynamiken verstehen und Vertrauen aufbauen." },
    { num: "04", title: "Entscheidungsfindung", desc: "Datengestutzte Entscheidungen unter Druck. Risikobewertung und strategische Priorisierung." },
    { num: "05", title: "Team-Leadership", desc: "High-Performance-Teams aufbauen. Delegation, Motivation und Kultur gestalten." },
    { num: "06", title: "Kritisches Denken", desc: "Komplexe Probleme strukturiert losen. Bias erkennen und objektiv analysieren." },
    { num: "07", title: "Strategische Planung", desc: "Langfristige Vision entwickeln. OKRs, Roadmaps und Meilensteine setzen." },
  ];

  y = 130;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text("7 Kurs-Module", m, y);
  y += 10;

  modules.forEach((mod) => {
    doc.setFillColor(...CARD);
    doc.roundedRect(m, y, cw, 18, 3, 3, "F");
    doc.setFillColor(...LIME);
    doc.roundedRect(m, y, 2, 18, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...LIME);
    doc.text(mod.num, m + 7, y + 7);
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text(mod.title, m + 18, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    const lines = doc.splitTextToSize(mod.desc, cw - 25);
    doc.text(lines[0], m + 7, y + 13);
    y += 21;
  });

  // Footer
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 70);
  doc.text("WLADHUB Curriculum | Confidential", m, 290);
  doc.setFillColor(...LIME);
  doc.rect(0, 295, pw, 2, "F");

  // === PAGE 2: 30-Day Plan ===
  doc.addPage();
  doc.setFillColor(...BG);
  doc.rect(0, 0, pw, 297, "F");
  doc.setFillColor(...LIME);
  doc.rect(0, 0, pw, 1, "F");

  y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...LIME);
  doc.text("30-TAGE LEADERSHIP FAHRPLAN", m, y);

  const phases = [
    { week: "WOCHE 1", title: "Foundation & Awareness", items: [
      "Baseline-Analyse deiner 6 Fuhrungsdimensionen",
      "KI-Tools Audit: Bestandsaufnahme deiner Tools",
      "Kommunikationsmuster identifizieren",
      "EQ-Selbstreflexion: Starken & Trigger erkennen",
      "Erste Feedback-Runde mit Vertrauenspersonen"
    ]},
    { week: "WOCHE 2", title: "Skill Building & Methoden", items: [
      "KI-Entscheidungsframework implementieren",
      "Boardroom-Rhetorik: Argumentationsstruktur aufbauen",
      "Eisenhower-Matrix fur Priorisierung einsetzen",
      "ALPEN-Methode fur Tagesplanung testen",
      "Aktives Zuhoren in 3 kritischen Gesprachen"
    ]},
    { week: "WOCHE 3", title: "Integration & Praxis", items: [
      "KI + Rhetorik in einer Prasentation kombinieren",
      "Schwierige Teamgesprache mit EQ-Framework",
      "SMART-Formel fur Quartalsziele anwenden",
      "Pareto-Prinzip auf Projektpriorisierung",
      "Feedback-Loop mit Team starten"
    ]},
    { week: "WOCHE 4", title: "Mastery & Leadership Signature", items: [
      "30-Tage-Review: Fortschritt messen vs. Baseline",
      "Leadership-Signature definieren",
      "Langfristige Wachstumsstrategie erstellen",
      "90-Tage-Plan mit konkreten Meilensteinen",
      "Not-to-Do-Liste fur nachstes Quartal"
    ]},
  ];

  y += 10;
  phases.forEach((phase) => {
    doc.setFillColor(...CARD);
    doc.roundedRect(m, y, cw, 44, 3, 3, "F");
    doc.setFillColor(...LIME);
    doc.roundedRect(m, y, 2, 44, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...LIME);
    doc.text(phase.week, m + 7, y + 8);
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text(phase.title, m + 30, y + 8);

    phase.items.forEach((item, ii) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(`  ${item}`, m + 11, y + 17 + ii * 5.5);
    });
    y += 50;
  });

  // Closing
  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text('"Technisches Wissen schafft Experten. Leadership Mastery schafft Impact."', pw / 2, y, { align: "center" });

  doc.setFontSize(6);
  doc.setTextColor(60, 60, 70);
  doc.text("WLADHUB Curriculum | Confidential", m, 290);
  doc.setFillColor(...LIME);
  doc.rect(0, 295, pw, 2, "F");

  doc.save("WladHub - Leadership Curriculum.pdf");
}
