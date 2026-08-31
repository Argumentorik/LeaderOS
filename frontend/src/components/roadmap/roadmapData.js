import { Brain, MessageSquare, Users, Target, Lightbulb, Zap, Shield, Award, Bot } from "lucide-react";

export const roleLabels = {
  communicator: "Kommunikation",
  manager: "Management",
  team_leader: "Team Leadership",
  psychologist: "Psychologische Führung",
  problem_solver: "Problemlösung",
  innovator: "Innovation & KI",
};

export const courses = [
  { num: "01", icon: Brain, title: "AI Basics · Dein Startpunkt", desc: "Verstehe KI richtig und ordne es für deine Führung ein. Das Fundament für alles Weitere.", color: "#C8FF00", tag: "KEY" },
  { num: "02", icon: MessageSquare, title: "Kommunikation & Argumentation", desc: "Überzeuge in Meetings, Verhandlungen und Konflikten.", color: "#C8FF00" },
  { num: "03", icon: Target, title: "Management-Systeme", desc: "Eisenhower, ALPEN, Pareto, SMART · bewährte Methoden.", color: "#C8FF00" },
  { num: "04", icon: Users, title: "Team Leadership & Delegation", desc: "Baue High-Performance-Teams auf.", color: "#C8FF00" },
  { num: "05", icon: Shield, title: "Psychologische Führung", desc: "Empathie als Wettbewerbsvorteil.", color: "#C8FF00" },
  { num: "06", icon: Lightbulb, title: "Problemlösung & Entscheidung", desc: "Datengestützte Entscheidungen unter Druck.", color: "#C8FF00" },
];

export const journalPrompts = [
  "Was ist mein wichtigstes Leadership-Ziel für die nächsten 30 Tage?",
  "Welche KI-Tools nutze ich bereits · und welche will ich testen?",
  "In welcher Situation habe ich mich als Leader zuletzt unwohl gefühlt?",
  "Was würde ich tun, wenn ich keine Angst vor Fehlern hätte?",
  "Wer in meinem Umfeld fordert mich am meisten heraus · und warum?",
  "Welche Gewohnheit hält mich davon ab, mein volles Potential zu entfalten?",
];

export const weeklyPlan = [
  {
    week: "01",
    title: "Awareness & Foundation",
    subtitle: "Dein Standort. Dein Startpunkt.",
    accent: "#C8FF00",
    gradient: "from-[#C8FF00]/[0.04] to-[#C8FF00]/[0.01]",
    borderGlow: "shadow-[#C8FF00]/5",
    icon: Brain,
    focus: "Selbstanalyse",
    items: [
      { task: "Baseline deiner 6 Führungsdimensionen", agent: "Diagnose-Agent" },
      { task: "AI Basics: KI richtig verstehen & einordnen", agent: "Strategie-Agent" },
      { task: "Kommunikationsmuster identifizieren", agent: "Coach-Agent" },
      { task: "EQ-Selbstreflexion: Stärken & Trigger", agent: "Simulations-Agent" },
    ],
    milestone: "Du weißt, wo du stehst · und wo die Hebel liegen."
  },
  {
    week: "02",
    title: "Skill Building & Methoden",
    subtitle: "Neue Werkzeuge. Erste Anwendung.",
    accent: "#C8FF00",
    gradient: "from-[#C8FF00]/[0.03] to-transparent",
    borderGlow: "shadow-[#C8FF00]/3",
    icon: Target,
    focus: "Methodenkompetenz",
    items: [
      { task: "KI-Entscheidungsframework implementieren", agent: "Strategie-Agent" },
      { task: "Rhetorik aufbauen", agent: "Coach-Agent" },
      { task: "Eisenhower + ALPEN + SMART anwenden", agent: "Task-Agent" },
      { task: "Aktives Zuhören in 3 Gesprächen üben", agent: "Simulations-Agent" },
    ],
    milestone: "Du hast dein erstes Toolkit · und nutzt es bereits."
  },
  {
    week: "03",
    title: "Integration & Praxis",
    subtitle: "Theorie trifft Realität.",
    accent: "#C8FF00",
    gradient: "from-[#C8FF00]/[0.03] to-transparent",
    borderGlow: "shadow-[#C8FF00]/3",
    icon: Zap,
    focus: "Praxistransfer",
    items: [
      { task: "KI + Rhetorik in einer Präsentation kombinieren", agent: "Coach-Agent" },
      { task: "SMART-Formel für deine Quartalsziele", agent: "Task-Agent" },
      { task: "Schwierige Gespräche mit EQ-Framework", agent: "Simulations-Agent" },
      { task: "Feedback-Loop mit deinem Team starten", agent: "Community-Agent" },
    ],
    milestone: "Du wendest alles an · und dein Umfeld bemerkt den Unterschied."
  },
  {
    week: "04",
    title: "Strategic Dominance",
    subtitle: "Dein neues Level. Dein System.",
    accent: "#C8FF00",
    gradient: "from-[#C8FF00]/[0.04] to-[#C8FF00]/[0.01]",
    borderGlow: "shadow-[#C8FF00]/5",
    icon: Award,
    focus: "Leadership-Signatur",
    items: [
      { task: "30-Tage-Review: Fortschritt messen", agent: "Diagnose-Agent" },
      { task: "Leadership-Signatur definieren", agent: "Coach-Agent" },
      { task: "90-Tage-Plan mit Meilensteinen erstellen", agent: "Strategie-Agent" },
      { task: "Personal Brand schärfen & positionieren", agent: "Community-Agent" },
    ],
    milestone: "Du bist nicht mehr derselbe Leader wie vor 30 Tagen."
  },
];

export const agentCards = [
  { icon: Brain, name: "Diagnose-Agent", desc: "Analysiert dein Profil & trackt Fortschritt", color: "#C8FF00" },
  { icon: Bot, name: "Coach-Agent", desc: "Persönliches Coaching, 24/7 verfügbar", color: "#C8FF00" },
  { icon: Target, name: "Task-Agent", desc: "Tägliche Aufgaben, angepasst an dein Level", color: "#C8FF00" },
  { icon: Users, name: "Simulations-Agent", desc: "Übe schwierige Gespräche & Szenarien", color: "#C8FF00" },
  { icon: Lightbulb, name: "Strategie-Agent", desc: "Frameworks, Playbooks & Entscheidungshilfen", color: "#C8FF00" },
  { icon: MessageSquare, name: "Community-Agent", desc: "Vernetzung & Austausch mit anderen Leadern", color: "#C8FF00" },
];
