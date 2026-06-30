import { ArrowRight, Crown, Check, Gift, Sparkles, Calculator, Building2 } from "lucide-react";
import { FeatureRow } from "./FeatureRow";

// Three pricing cards rendered as one strip. Each card calls onSelect with its plan id.
export function PriceCards({
  selectedPlan,
  showInquiry,
  onSelectOS,
  onSelectPlus,
  onSelectEnterprise,
  osFeatures,
  osPlusFeatures,
  enterpriseFeatures,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-14" data-testid="price-stack">
      {/* TIER 1 — Leadership OS */}
      <div
        data-testid="plan-leader-os"
        onClick={onSelectOS}
        className={`glass-card p-7 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] ${selectedPlan === "leader_os" ? "border-[#C8FF00]/25 ring-1 ring-[#C8FF00]/10" : "border-white/[0.06]"}`}
      >
        <CardHeader badge="SPRINT" subBadge="30 TAGE + 12 MONATE" title="Sprint mit Wlad." desc="11 Frameworks · WladBot 24/7 · Zertifikat 0001" />
        <PriceBlock
          price="997"
          accent="white"
          subtitle="Einmalig · Ratenzahlung möglich · 14 Tage Geld-zurück"
          valueBadge="Wert inkl. 12 Monate Plattform"
          testidPrice="price-leader-os"
        />
        <div className="space-y-3 mb-7">
          {osFeatures.map((f, i) => <FeatureRow key={i} feature={f} accent="lime" />)}
        </div>
        <button
          data-testid="cta-leader-os"
          onClick={(e) => { e.stopPropagation(); onSelectOS(); }}
          className={`w-full py-4 rounded-xl font-manrope font-bold text-base flex items-center justify-center gap-2 transition-all ${selectedPlan === "leader_os" ? "bg-[#C8FF00] text-[#0a0a0a] shadow-lg shadow-[#C8FF00]/15" : "bg-white/[0.04] border border-white/[0.08] text-white hover:border-[#C8FF00]/30"}`}
        >
          Sprint sichern · 997 EUR
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* TIER 2 — Plus-Plus (recommended) */}
      <div
        data-testid="plan-leader-os-plus"
        onClick={onSelectPlus}
        className={`relative glass-card p-7 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] overflow-hidden ${selectedPlan === "leader_os_plus" ? "border-[#C8FF00]/30 ring-1 ring-[#C8FF00]/15" : "border-[#C8FF00]/10"}`}
      >
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#C8FF00]/[0.08] via-[#C8FF00]/[0.02] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#C8FF00]/[0.04] rounded-full blur-[60px] pointer-events-none" />
        <div className="relative">
          <CardHeader badge="PLUS-PLUS" subBadge="+ 6× LIVE-Q&A KI-EXPERTEN" title="Sprint + OS-Jahr." desc="Sprint + 6× Live-Q&A mit KI-Experten · 12 Monate" extraClass="mt-3" />
          <PriceBlock
            price="4.797"
            accent="lime"
            subtitle="Einmalig oder 3 x 1.599 EUR · 14 Tage Geld-zurück"
            valueBadge="Live-Q&A mit KI-Experten · 6×/Jahr · 90 Min"
            testidPrice="price-leader-os-plus"
          />
          <div className="space-y-3 mb-7">
            {osPlusFeatures.map((f, i) => <FeatureRow key={i} feature={f} accent="lime" />)}
          </div>
          <button
            data-testid="cta-leader-os-plus"
            onClick={(e) => { e.stopPropagation(); onSelectPlus(); }}
            className={`w-full py-4 rounded-xl font-manrope font-bold text-base flex items-center justify-center gap-2 transition-all ${selectedPlan === "leader_os_plus" ? "bg-[#C8FF00] text-[#0a0a0a] shadow-lg shadow-[#C8FF00]/20" : "bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] hover:bg-[#C8FF00]/15"}`}
          >
            {selectedPlan === "leader_os_plus" && <Check className="w-4 h-4" />}
            Plus-Plus sichern · 4.797 EUR
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TIER 3 — Enterprise */}
      <div
        data-testid="plan-leader-os-enterprise"
        onClick={onSelectEnterprise}
        className={`glass-card p-7 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] ${showInquiry ? "border-white/15 ring-1 ring-white/10" : "border-white/[0.06]"}`}
      >
        <CardHeader badge="ENTERPRISE" subBadge="B2B" title="Sprint für dein Team." desc="Volumen-Lizenzen für dein Unternehmen" />
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="font-manrope font-extrabold text-3xl text-white">Preis</span>
            <span className="font-inter text-base text-slate-500 ml-2">auf Anfrage</span>
          </div>
          <div className="font-inter text-xs text-slate-600 mt-1">10 % bis 50 % Volumen-Rabatt · ab 5 Mitarbeitern</div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span className="font-inter text-[10px] text-slate-400 font-semibold">Zentrale Lizenzverwaltung</span>
          </div>
        </div>
        <div className="space-y-3 mb-7">
          {enterpriseFeatures.map((f, i) => <FeatureRow key={i} feature={f} accent="white" />)}
        </div>
        <button
          data-testid="cta-leader-os-enterprise"
          onClick={(e) => { e.stopPropagation(); onSelectEnterprise(); }}
          className="w-full py-4 rounded-xl font-manrope font-bold text-base flex items-center justify-center gap-2 transition-all bg-white/[0.04] border border-white/[0.08] text-white hover:border-white/20"
        >
          <Calculator className="w-4 h-4" />
          Rabatt berechnen & anfragen
        </button>
      </div>
    </div>
  );
}

function CardHeader({ badge, subBadge, title, desc, extraClass = "" }) {
  return (
    <div className={`mb-5 ${extraClass}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="px-3 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/15 text-[#C8FF00] text-[10px] font-bold tracking-wider">{badge}</div>
        {subBadge && <div className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 text-[10px] font-bold">{subBadge}</div>}
      </div>
      <h2 className="font-manrope font-extrabold text-xl text-white mb-1">{title}</h2>
      <p className="font-inter text-xs text-slate-500">{desc}</p>
    </div>
  );
}

function PriceBlock({ price, accent, subtitle, valueBadge, testidPrice }) {
  const priceColor = accent === "lime" ? "text-[#C8FF00]" : "text-white";
  const eurColor = accent === "lime" ? "text-[#C8FF00]/60" : "text-slate-500";
  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-1">
        <span className={`font-manrope font-extrabold text-4xl ${priceColor}`} data-testid={testidPrice}>{price}</span>
        <span className={`font-inter text-base ${eurColor}`}>EUR</span>
        <span className="font-inter text-xs text-slate-600 ml-2">einmalig</span>
      </div>
      <div className="font-inter text-xs text-slate-600 mt-1">{subtitle}</div>
      {valueBadge && (
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#C8FF00]/[0.08] border border-[#C8FF00]/15">
          <Gift className="w-3 h-3 text-[#C8FF00]" />
          <span className="font-inter text-[10px] text-[#C8FF00] font-semibold">{valueBadge}</span>
        </div>
      )}
    </div>
  );
}
