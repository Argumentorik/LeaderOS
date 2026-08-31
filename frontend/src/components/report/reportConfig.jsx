import { MessageSquare, Sparkles, Users, Lightbulb, UserCheck, Target } from "lucide-react";

export const catLabels = {
  rhetorik: "Rhetorik",
  kritisches_denken: "Krit. Denken",
  entscheidung: "Entscheidung",
  fuehrung: "Führung",
  eq: "Strateg. EQ",
  strategie: "KI-Strategie",
};

export const layerConfig = [
  { key: "ai_literacy", label: "KI", subtitle: "Ebene 01", desc: "Du nutzt KI im Alltag · nicht für Memes.", color: "#C8FF00", narrativeKey: "ai_literacy_analysis" },
  { key: "rhetoric", label: "Rhetorik", subtitle: "Ebene 02", desc: "Du sprichst klar · andere folgen.", color: "#C8FF00", narrativeKey: "rhetoric_analysis" },
  { key: "strategic_eq", label: "EQ", subtitle: "Ebene 03", desc: "Du verstehst dein Team · sie vertrauen dir.", color: "#C8FF00", narrativeKey: "eq_analysis" },
];

export const roleConfig = [
  { key: "communicator", label: "Kommunikator", icon: MessageSquare, color: "#C8FF00", desc: "Überzeugungskraft & Klarheit" },
  { key: "manager", label: "Manager", icon: Target, color: "#94A3B8", desc: "Struktur & Produktivität" },
  { key: "team_leader", label: "Team Leader", icon: Users, color: "#10B981", desc: "Motivation & Teamkultur" },
  { key: "psychologist", label: "Psychologe", icon: UserCheck, color: "#67E8F9", desc: "Empathie & Menschenverständnis" },
  { key: "problem_solver", label: "Problemlöser", icon: Lightbulb, color: "#F472B6", desc: "Entscheidung & Konfliktlösung" },
  { key: "innovator", label: "Innovator", icon: Sparkles, color: "#C8FF00", desc: "KI-Vorsprung & Sichtbarkeit" },
];

export function ScoreRing({ score, color, size = 96 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s ease" }} />
      </svg>
      <span className="font-manrope font-bold text-xl text-white relative z-10">{score}%</span>
    </div>
  );
}
