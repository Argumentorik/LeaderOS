/**
 * heroData — All static content for the landing page sections.
 * Lives separately so each section component stays readable.
 * Note: section components import icons themselves; data uses string keys
 * so this file can stay icon-import free where possible.
 */
import {
  Brain,
  MessageSquare,
  TrendingUp,
  Users,
  Bot,
  BookOpen,
  Calendar,
  MessageCircle,
  CheckSquare,
} from "lucide-react";

export const headlines = [
  {
    pre: "Werde der Leader, den KI nicht ersetzen kann.",
    lines: ["KI skaliert Intelligenz.", "{Leadership bestimmt}", "die Richtung."],
  },
  {
    pre: "Die KI-Ära braucht eine neue Art von Führung.",
    lines: ["Beherrschst du die", "{6 Rollen des modernen}", "Leaders?"],
  },
  {
    pre: "Dein Leadership-Profil in 7 Minuten.",
    lines: ["Entdecke, welche", "{Führungsrolle}", "dich definiert."],
  },
  {
    pre: "97% der Führungskräfte überschätzen sich in mindestens einer Rolle.",
    lines: ["{7 Minuten.}", "6 Rollen. 1 Score.", "Keine Ausreden."],
  },
  {
    pre: "Es gibt ein Geheimnis, das die Top 1% der Leader kennen · und du noch nicht.",
    lines: ["Die {verborgene Rolle},", "die über deinen", "Aufstieg entscheidet."],
  },
];

export const layers = [
  {
    num: "01",
    icon: Brain,
    title: "KI",
    subtitle: "Ebene 01",
    desc: "Du nutzt KI im Alltag · nicht für Memes.",
    points: ["Schneller entscheiden", "Routine automatisch", "Vorsprung sichtbar"],
    color: "#C8FF00",
  },
  {
    num: "02",
    icon: MessageSquare,
    title: "Rhetorik",
    subtitle: "Ebene 02",
    desc: "Du sprichst klar · andere folgen.",
    points: ["Klarer Aufbau", "Echte Worte", "Ruhige Präsenz"],
    color: "#C8FF00",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "EQ",
    subtitle: "Ebene 03",
    desc: "Du verstehst dein Team · sie vertrauen dir.",
    points: ["Stimmung lesen", "Vertrauen aufbauen", "Konflikte ruhig lösen"],
    color: "#C8FF00",
  },
];

export const problems = [
  "Gute Strategen · aber niemand hört zu",
  "Stark im Reden · aber KI noch nicht im Alltag",
  "Verstehen Menschen · entscheiden zu langsam",
];

export const diagnoseSteps = [
  { num: "1", title: "20 Fragen · 6 Führungsdimensionen", desc: "" },
  { num: "2", title: "Dein Score in drei Ebenen", desc: "KI · Rhetorik · EQ" },
  {
    num: "3",
    title: "Dein persönlicher 30-Tage-Plan",
    desc: "Konkret · Schritt für Schritt · jeden Tag eine Aufgabe.",
  },
  {
    num: "4",
    title: "ROI-Prognose",
    desc: "Wieviel Zeit du sparst · wie viel Wirkung du gewinnst",
  },
];

export const platformFeatures = [
  {
    id: "agent-coach",
    icon: Bot,
    category: "Agent 01",
    title: "Leadership Coach",
    desc: "Dein persönlicher KI-Coach, der dein Profil kennt",
    src: "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=1200&q=85&auto=format&fit=crop",
    bullets: [
      "Kennt deinen Score in KI · Rhetorik · EQ",
      "Antwortet in Wlads Sprache · kein Bullshit",
      "Verfügbar 24/7 · in jeder Führungs-Situation",
    ],
  },
  {
    id: "agent-task",
    icon: CheckSquare,
    category: "Agent 02",
    title: "Task Agent",
    desc: "Tägliche Aufgaben, angepasst an deine Schwächen",
    src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=85&auto=format&fit=crop",
    bullets: [
      "Jeden Morgen 1 konkrete Mikro-Aufgabe",
      "Adaptiv · trainiert genau deine schwächste Ebene",
      "Streak-System · macht Wachstum sichtbar",
    ],
  },
  {
    id: "agent-sim",
    icon: Users,
    category: "Agent 03",
    title: "Simulations-Agent",
    desc: "Übe schwierige Gespräche mit KI-Gegenüber",
    src: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=1200&q=85&auto=format&fit=crop",
    bullets: [
      "Realistische Gegenüber · CFO · Team · Investor",
      "Live-Feedback zu Argumentation und Wirkung",
      "Schwierige Meetings durchspielen · bevor sie passieren",
    ],
  },
  {
    id: "agent-strategy",
    icon: BookOpen,
    category: "Agent 04",
    title: "Strategie-Agent",
    desc: "Playbooks & Frameworks auf Abruf",
    src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=85&auto=format&fit=crop",
    bullets: [
      "Wlads 11 Frameworks · in einer Konsole",
      "Situations-Diagnose in unter 60 Sekunden",
      "Direkt umsetzbar · keine Theorie-Wolken",
    ],
  },
  {
    id: "agent-event",
    icon: Calendar,
    category: "Agent 05",
    title: "Event-Agent",
    desc: "Live-Sessions, passend zu deinem Level",
    src: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=85&auto=format&fit=crop",
    bullets: [
      "6× Live-Q&A pro Jahr mit KI-Experten",
      "Empfehlung passend zu deinem aktuellen Score",
      "Aufzeichnungen · jederzeit nachholbar",
    ],
  },
  {
    id: "agent-community",
    icon: MessageCircle,
    category: "Agent 06",
    title: "Community-Agent",
    desc: "Vernetzung mit Führungskräften deiner Stufe",
    src: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1200&q=85&auto=format&fit=crop",
    bullets: [
      "Matching mit Peers auf gleichem Level",
      "Closed-Loop · keine Selbstdarsteller",
      "Direkt-Sparring · keine LinkedIn-Phrasen",
    ],
  },
];

export const wladbotFeatures = [
  "Schwierige Gespräche vorher durchspielen",
  "Argumente strukturieren · in Wlads Sprache",
  "Führungssituation in 30 Sekunden einordnen",
  "Schwierige Meetings durchspielen · bevor sie passieren",
];

export const audiences = [
  {
    title: "Selbstständige",
    eyebrow: "Solo-CEO ohne Burnout.",
    desc: "KI nutzen · ohne dich selbst zu verlieren.",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&q=85&auto=format&fit=crop",
  },
  {
    title: "Angestellte",
    eyebrow: "Vom Mitarbeiter zur Schlüsselperson.",
    desc: "Schneller entscheiden · mit klarem Kopf und Bauchgefühl.",
    src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&q=85&auto=format&fit=crop",
  },
  {
    title: "Senior Manager",
    eyebrow: "Vom Manager zum Macher.",
    desc: "Den Schritt machen von der Führungskraft zur unverzichtbaren Schlüsselperson.",
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=1200&q=85&auto=format&fit=crop",
  },
  {
    title: "High Potentials",
    eyebrow: "Vom Talent zum Top 1 %.",
    desc: "Den Aufstieg in die Elite-Leadership gezielt beschleunigen.",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=85&auto=format&fit=crop",
  },
];

export const kursTopics = [
  { icon: Brain, text: "KI strategisch im Führungsalltag einsetzen" },
  { icon: MessageSquare, text: "Überzeugend argumentieren" },
  { icon: Users, text: "Teams mit strategischem EQ führen" },
];

export const freeCreditsBullets = [
  "WladBot · dein KI-Coach für schwierige Gespräche",
  "Schwierige Meetings durchspielen · bevor sie passieren",
  "Persönlicher Report als PDF herunterladen",
  "30-Tage-Aktionsplan sofort starten",
];

export const wladStats = [
  ["400k+", "Klienten ausgebildet"],
  ["3×", "SPIEGEL-Bestseller"],
  ["500+", "Bühnen weltweit"],
  ["91", "Premium-Lektionen"],
  ["10+", "Jahre Praxis"],
  ["4.9", "Speaker-Rating / 5"],
];
