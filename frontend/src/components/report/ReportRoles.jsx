import { Award } from "lucide-react";
import { roleConfig } from "./reportConfig";

export const ReportRoles = ({ leadership_roles, strongest_role, weakest_role }) => {
  if (Object.keys(leadership_roles).length === 0) return null;
  return (
    <div className="mb-10" data-testid="leadership-roles">
      <h3 className="font-manrope font-bold text-xl text-white mb-6 flex items-center gap-3">
        <Award className="w-5 h-5 text-[#C8FF00]" />
        Deine 6 Leadership-Rollen
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {roleConfig.map((role) => {
          const score = leadership_roles[role.key] || 0;
          const isStrongest = strongest_role?.key === role.key;
          const isWeakest = weakest_role?.key === role.key;
          return (
            <div
              key={role.key}
              data-testid={`role-${role.key}`}
              className={`relative p-4 rounded-xl border transition-all ${
                isStrongest
                  ? "border-green-500/30 bg-green-500/5"
                  : isWeakest
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-white/8 bg-white/[0.02]"
              }`}
            >
              {isStrongest && (
                <span className="absolute -top-2 right-3 px-2 py-0.5 text-[10px] font-bold bg-green-500 text-black rounded-full">TOP</span>
              )}
              {isWeakest && (
                <span className="absolute -top-2 right-3 px-2 py-0.5 text-[10px] font-bold bg-red-500/80 text-white rounded-full">FOCUS</span>
              )}
              <role.icon className="w-5 h-5 mb-3" style={{ color: role.color }} />
              <div className="font-manrope font-bold text-sm text-white mb-1">{role.label}</div>
              <div className="font-inter text-[10px] text-slate-500 mb-3">{role.desc}</div>
              <div className="h-1.5 rounded-full bg-white/5 mb-2">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, backgroundColor: role.color }} />
              </div>
              <div className="font-manrope font-bold text-lg" style={{ color: role.color }}>{score}%</div>
            </div>
          );
        })}
      </div>

      {/* Strength & Gap Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {strongest_role?.label && (
          <div className="glass-card-subtle p-5 border-l-2 border-green-500">
            <div className="font-inter text-xs text-green-400 mb-2 uppercase tracking-wider">Stärkste Rolle</div>
            <p className="font-manrope font-bold text-white mb-1">{strongest_role.label} ({strongest_role.score}%)</p>
            <p className="font-inter text-xs text-slate-400">Diese Rolle definiert deinen natürlichen Führungsstil und ist dein größter Hebel.</p>
          </div>
        )}
        {weakest_role?.label && (
          <div className="glass-card-subtle p-5 border-l-2 border-red-500/60">
            <div className="font-inter text-xs text-red-400 mb-2 uppercase tracking-wider">Wachstumsbereich</div>
            <p className="font-manrope font-bold text-white mb-1">{weakest_role.label} ({weakest_role.score}%)</p>
            <p className="font-inter text-xs text-slate-400">Hier liegt dein größtes Upgrade-Potential. Dein 30-Tage-Plan fokussiert sich darauf.</p>
          </div>
        )}
      </div>
    </div>
  );
};
