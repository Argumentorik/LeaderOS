import { Check, X } from "lucide-react";
import { COMPARISON_ROWS } from "./pricingConstants";

export function ComparisonTable() {
  return (
    <div className="glass-card p-8 mb-10 overflow-hidden" data-testid="comparison">
      <h3 className="font-manrope font-bold text-xl text-white mb-8 text-center">Was steckt in jedem Paket</h3>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-4 gap-4 text-center mb-4 min-w-[600px]">
          <div />
          <Header title="SPRINT" sub="997 EUR" color="text-white" />
          <Header title="PLUS-PLUS" sub="4.797 EUR" color="text-[#C8FF00]" />
          <Header title="ENTERPRISE" sub="auf Anfrage" color="text-white" />
        </div>
        {COMPARISON_ROWS.map(([label, os, plus, ent], i) => (
          <div key={i} className="grid grid-cols-4 gap-4 py-2.5 border-b border-white/[0.03] items-center min-w-[600px]">
            <span className="font-inter text-sm text-slate-300 text-left">{label}</span>
            <Cell value={os} accent="white" />
            <Cell value={plus} accent="lime" />
            <Cell value={ent} accent="white" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ title, sub, color }) {
  return (
    <div className={`font-inter text-xs uppercase tracking-wider font-bold ${color}`}>
      {title}
      <br />
      <span className="text-slate-500 normal-case font-normal">{sub}</span>
    </div>
  );
}

function Cell({ value, accent }) {
  if (value === true) {
    const c = accent === "lime" ? "text-[#C8FF00]" : "text-white/80";
    return <div className="flex justify-center"><Check className={`w-4 h-4 ${c}`} /></div>;
  }
  if (value === "optional") {
    const c = accent === "lime" ? "text-[#C8FF00]/70" : "text-slate-400";
    return <div className="flex justify-center"><span className={`text-[10px] font-semibold uppercase ${c}`}>Opt.</span></div>;
  }
  return <div className="flex justify-center"><X className="w-4 h-4 text-slate-700" /></div>;
}
