import { Sparkles, Check, Star } from "lucide-react";

// Renders a single feature row in a pricing card.
// Supports highlight (intro), star (key feature), and subline (value indicator).
export function FeatureRow({ feature, accent = "lime" }) {
  const accentClass = accent === "lime" ? "text-[#C8FF00]" : "text-white";
  const highlightClass = accent === "lime" ? "text-[#C8FF00] font-semibold" : "text-white font-semibold";
  const sublineClass = accent === "lime" ? "text-[#C8FF00]/70" : "text-white/70";

  if (feature.subline) {
    return (
      <div className="flex items-start gap-3 ml-7 -mt-1">
        <span className={`font-inter text-xs italic ${sublineClass}`}>{feature.text}</span>
      </div>
    );
  }

  let Icon = Check;
  if (feature.highlight) Icon = Sparkles;
  else if (feature.star) Icon = Star;

  return (
    <div className="flex items-start gap-3">
      <Icon className={`w-4 h-4 ${accent === "lime" ? "text-[#C8FF00]" : "text-white/80"} shrink-0 mt-0.5`} />
      <span className={`font-inter text-sm ${feature.highlight ? highlightClass : "text-slate-300"}`}>
        {feature.text}
      </span>
    </div>
  );
}
